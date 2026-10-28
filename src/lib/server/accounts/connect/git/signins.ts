// Layer 2, server. The Sign ins of the git hosts that run in this process, one per host at most:
// the device flow of device.ts carried from the code to the token. A Sign in asks for a code,
// opens the address to type it at through the machine's opener when it is an `https://` address
// (as one argument), and then polls the token address at the interval the answer gave, the
// interval grown by 5 seconds at each `slow_down`, until the token is granted, the reader refuses
// (`access_denied`), the code expires (`expired_token`, or its lifetime passing), a call fails, or
// the Sign in is cancelled. A granted token's login is read from the row's `user` address, and the
// token, the login and the credential address are saved in the host's file (store.ts) behind the
// write chain.
//
// A second Sign in of the same host cancels the first, and the server's close cancels every one; a
// Sign in cancelled while a call is in flight saves nothing of what that call answers. The waits
// run on the injected `sleep`, which a test drives by hand. What a Sign in stands at is answered by
// `flow`, which carries the code and the address and never the device code or the token.

import type { GitFlow } from '../../../../data/model/index.ts';
import type { SignInRow } from '../../../../data/sources/config.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import type { Fetcher, Opener } from '../oauth.ts';
import { pollToken, readLogin, startDevice } from './device.ts';
import { saveGitToken } from './store.ts';

/** How much a `slow_down` adds to the interval, in milliseconds (RFC 8628 3.5). */
const SLOW_DOWN_MS = 5000;

/** A wait that ends early, without throwing, when the signal is aborted. */
type Sleep = (ms: number, signal: AbortSignal) => Promise<void>;

/** The real wait. */
export const sleep: Sleep = (ms, signal) =>
    new Promise((answer) => {
        if (signal.aborted) {
            answer();
            return;
        }
        const timer = setTimeout(done, ms);
        function done(): void {
            clearTimeout(timer);
            signal.removeEventListener('abort', done);
            answer();
        }
        signal.addEventListener('abort', done, { once: true });
    });

/** What the git sign-ins are given: the network, the wait, the opener, the files and the clock. */
type GitSignInDeps = {
    fetcher: Fetcher;
    sleep: Sleep;
    /** The machine's opener of an `https` address, read at the call. */
    open: () => Opener;
    /** The providers' folder the host's file is in. */
    providerDir: string;
    writes: FsWrites;
    /** Milliseconds since the epoch, for the code's lifetime. */
    now: () => number;
};

/** A git host row that has every field a Sign in needs. */
export type SignInHost = Required<Pick<SignInRow, 'deviceCode' | 'token' | 'user' | 'gitScope'>> & {
    key: string;
    credentialAddress: string;
};

/** The Sign ins of the git hosts of one server. */
export type GitSignIns = {
    /** Start a Sign in of a host with the client id, cancelling one that runs; its first state. */
    start: (host: SignInHost, clientId: string) => Promise<GitFlow>;
    /** Where the Sign in of a host stands, or null when none has run since the server started. */
    flow: (key: string) => GitFlow | null;
    cancel: (key: string) => void;
    close: () => void;
};

/** One Sign in: what the page is told, and its cancel. */
type Running = { view: GitFlow; stop: AbortController };

/** The Sign ins of one server, run on the network, the wait, the opener and the clock given. */
export function gitSignIns(deps: GitSignInDeps): GitSignIns {
    const flows = new Map<string, Running>();

    /** Set where a Sign in stands, unless it was cancelled, which keeps it cancelled. */
    function settle(running: Running, state: GitFlow['state'], said = ''): void {
        if (running.stop.signal.aborted) return;
        running.view = { ...running.view, state, said };
    }

    async function poll(
        host: SignInHost,
        clientId: string,
        start: { deviceCode: string; interval: number; expiresIn: number },
        running: Running
    ): Promise<void> {
        const { signal } = running.stop;
        /** Whether the Sign in was cancelled, read afresh after each wait. */
        const cancelled = (): boolean => signal.aborted;
        let interval = start.interval * 1000;
        const deadline = deps.now() + start.expiresIn * 1000;
        for (;;) {
            await deps.sleep(interval, signal);
            if (cancelled()) return;
            if (deps.now() >= deadline) {
                settle(running, 'expired');
                return;
            }
            const polled = await pollToken(host.token, clientId, start.deviceCode, deps.fetcher);
            if (cancelled()) return;
            if ('pending' in polled) continue;
            if ('slowDown' in polled) {
                interval += SLOW_DOWN_MS;
                continue;
            }
            if (!('token' in polled)) {
                if ('denied' in polled) settle(running, 'denied');
                else if ('expired' in polled) settle(running, 'expired');
                else settle(running, 'failed', polled.failed);
                return;
            }
            const login = await readLogin(host.user, polled.token, deps.fetcher);
            if (cancelled()) return;
            if ('failed' in login) {
                settle(running, 'failed', login.failed);
                return;
            }
            const granted = {
                token: polled.token,
                login: login.login,
                address: host.credentialAddress
            };
            await chained(deps.writes, () => {
                if (!cancelled()) saveGitToken(deps.providerDir, host.key, granted);
            });
            settle(running, 'granted');
            return;
        }
    }

    function cancel(key: string): void {
        const running = flows.get(key);
        if (running === undefined || running.stop.signal.aborted) return;
        if (running.view.state === 'waiting') {
            running.view = { ...running.view, state: 'cancelled' };
        }
        running.stop.abort();
    }

    async function start(host: SignInHost, clientId: string): Promise<GitFlow> {
        cancel(host.key);
        const running: Running = {
            view: { code: '', address: '', state: 'waiting', said: '' },
            stop: new AbortController()
        };
        flows.set(host.key, running);
        let started: Awaited<ReturnType<typeof startDevice>>;
        try {
            started = await startDevice(host.deviceCode, clientId, host.gitScope, deps.fetcher);
        } catch (error) {
            started = { failed: error instanceof Error ? error.message : String(error) };
        }
        if ('failed' in started) {
            settle(running, 'failed', started.failed);
            return running.view;
        }
        if (running.stop.signal.aborted) return running.view;
        running.view = {
            ...running.view,
            code: started.userCode,
            address: started.verificationUri
        };
        if (started.verificationUri.startsWith('https://')) {
            try {
                await deps.open()(started.verificationUri);
            } catch {
                // The page shows the address to open by hand; a failed open changes nothing else.
            }
        }
        void poll(host, clientId, started, running).catch((error: unknown) => {
            settle(running, 'failed', error instanceof Error ? error.message : String(error));
        });
        return running.view;
    }

    return {
        start,
        flow: (key) => flows.get(key)?.view ?? null,
        cancel,
        close: () => {
            for (const key of flows.keys()) cancel(key);
        }
    };
}
