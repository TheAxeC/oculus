// Layer 4, server test. A git host's Sign in by the device flow (connect/git/signins.ts), driven
// by hand: the waits are a fake `sleep` the case releases one at a time, the code's lifetime runs
// on a fake clock, and every address answers from a fake fetcher whose answers are read in the
// same turn, so one turn of the event loop lets a released wait run to its next wait or its end.
//
// What it holds: the code's address is opened only when it is an `https://` address; the token
// address is polled at the answer's interval, 5 seconds more after each `slow_down`; a refusal,
// an expired code (by its answer or its lifetime) and a failed login read each end the Sign in and
// save nothing; a granted token is saved in the host's file at mode 0600 and nowhere else, is sent
// only to the row's `user` address, and is never in what the page is told or in a log; a cancel,
// a close or a second Sign in of the same host ends the first, and a Sign in ended while its call
// is in flight saves nothing of what the call answers.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import {
    gitSignIns,
    type SignInHost
} from '../../../../../src/lib/server/accounts/connect/git/signins.ts';
import type { Fetcher } from '../../../../../src/lib/server/accounts/connect/oauth.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const HOST: SignInHost = {
    key: 'github',
    credentialAddress: 'https://github.com',
    deviceCode: 'https://github.com/login/device/code',
    token: 'https://github.com/login/oauth/access_token',
    user: 'https://api.github.com/user',
    gitScope: 'repo'
};
const TOKEN = 'gho_the_token_of_this_case';
const DEVICE = 'the-device-code-of-this-case';
const LIFETIME_S = 900;

/** An answer of a fake address, its JSON read in the same turn. */
function answer(status: number, body: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body)
    } as Response;
}

const pending = (): Response => answer(400, { error: 'authorization_pending' });
const granted = (): Response => answer(200, { access_token: TOKEN, token_type: 'bearer' });

/** One turn of the event loop: every promise the fakes resolved has run. */
const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

/** The wait the Sign ins are given. */
type Sleep = Parameters<typeof gitSignIns>[0]['sleep'];

/** A wait the flow asked for, released by the case. */
type Wait = { ms: number; release: () => void };

/** The fake `sleep`, and the next wait the flow asks for, as a promise. */
function waitsOf(): { sleep: Sleep; next: () => Promise<Wait> } {
    const asked: Wait[] = [];
    const takers: ((wait: Wait) => void)[] = [];
    const sleep: Sleep = (ms, signal) =>
        new Promise<void>((release) => {
            signal.addEventListener('abort', () => release(), { once: true });
            const wait = { ms, release: () => release() };
            const taker = takers.shift();
            if (taker === undefined) asked.push(wait);
            else taker(wait);
        });
    const next = (): Promise<Wait> => {
        const wait = asked.shift();
        return wait === undefined
            ? new Promise((take) => takers.push(take))
            : Promise.resolve(wait);
    };
    return { sleep, next };
}

/** A Sign in world: the fake addresses, the opener, the clock and the host's folder. */
function world(
    polls: (Response | Promise<Response>)[],
    given: { verification?: string; user?: Response } = {}
) {
    const dir = join(scratchDir('oculus-git-signin-'), 'connect');
    const calls: { address: string; init?: RequestInit }[] = [];
    const opened: string[] = [];
    const clock = { now: 1_000_000 };
    const waits = waitsOf();
    const fetcher = vi.fn<Fetcher>((input, init) => {
        const address = input instanceof Request ? input.url : input.toString();
        calls.push({ address, init });
        if (address === HOST.deviceCode) {
            return Promise.resolve(
                answer(200, {
                    device_code: DEVICE,
                    user_code: 'ABCD-1234',
                    verification_uri: given.verification ?? 'https://github.com/login/device',
                    interval: 5,
                    expires_in: LIFETIME_S
                })
            );
        }
        if (address === HOST.token) return Promise.resolve(polls.shift() ?? answer(500, null));
        if (address === HOST.user)
            return Promise.resolve(given.user ?? answer(200, { login: 'reader' }));
        return Promise.reject(new Error(`no address ${address}`));
    });
    const signIns = gitSignIns({
        fetcher,
        sleep: waits.sleep,
        open: () => (target) => {
            opened.push(target);
        },
        providerDir: dir,
        writes: fsWrites(),
        now: () => clock.now
    });
    const file = join(dir, 'git-github.json');
    const tokenCalls = (): number => calls.filter((one) => one.address === HOST.token).length;
    return { dir, file, calls, opened, clock, waits, signIns, tokenCalls };
}

/** Everything written to the console while a case runs. */
let logged: string[] = [];

beforeEach(() => {
    logged = [];
    for (const name of ['log', 'info', 'warn', 'error', 'debug'] as const) {
        vi.spyOn(console, name).mockImplementation((...args: unknown[]) => {
            logged.push(args.map(String).join(' '));
        });
    }
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('a git Sign in by the device flow', () => {
    it('polls at the interval, 5 seconds more after a slow_down, and saves the token only in its file at 0600 (G135)', async () => {
        const run = world([pending(), answer(400, { error: 'slow_down' }), pending(), granted()]);
        const first = await run.signIns.start(HOST, 'Iv1.abc');
        expect(first).toEqual({
            code: 'ABCD-1234',
            address: 'https://github.com/login/device',
            state: 'waiting',
            said: ''
        });
        expect(run.opened).toEqual(['https://github.com/login/device']);
        const waited: number[] = [];
        for (let one = 0; one < 4; one += 1) {
            const wait = await run.waits.next();
            waited.push(wait.ms);
            wait.release();
        }
        await turn();
        expect(waited).toEqual([5000, 5000, 10000, 10000]);
        expect(run.signIns.flow('github')?.state).toBe('granted');
        expect(statSync(run.file).mode & 0o777).toBe(0o600);
        expect(JSON.parse(readFileSync(run.file, 'utf8'))).toEqual({
            token: TOKEN,
            login: 'reader',
            credential_address: 'https://github.com'
        });
        for (const call of run.calls) {
            const sent = JSON.stringify({ body: call.init?.body, headers: call.init?.headers });
            expect(call.address).not.toContain(TOKEN);
            if (call.address === HOST.user) expect(sent).toContain(`Bearer ${TOKEN}`);
            else expect(sent).not.toContain(TOKEN);
            if (call.address !== HOST.token) expect(sent).not.toContain(DEVICE);
        }
        const told = JSON.stringify([first, run.signIns.flow('github')]);
        expect(told).not.toContain(TOKEN);
        expect(told).not.toContain(DEVICE);
        expect(logged.join('\n')).not.toContain(TOKEN);
    });

    it.each([
        ['a refusal', answer(400, { error: 'access_denied' }), 'denied', ''],
        ['an expired code', answer(400, { error: 'expired_token' }), 'expired', ''],
        [
            'an error word it does not know',
            answer(400, { error: 'unsupported_grant_type' }),
            'failed',
            'unsupported_grant_type'
        ]
    ])('ends on %s and saves nothing (G135)', async (_name, polled, state, said) => {
        const run = world([polled]);
        await run.signIns.start(HOST, 'Iv1.abc');
        (await run.waits.next()).release();
        await turn();
        expect(run.signIns.flow('github')).toMatchObject({ state, said });
        expect(existsSync(run.file)).toBe(false);
    });

    it('ends as expired once the lifetime has passed, without polling again (G135)', async () => {
        const run = world([pending()]);
        await run.signIns.start(HOST, 'Iv1.abc');
        (await run.waits.next()).release();
        const second = await run.waits.next();
        run.clock.now += LIFETIME_S * 1000;
        second.release();
        await turn();
        expect(run.signIns.flow('github')?.state).toBe('expired');
        expect(run.tokenCalls()).toBe(1);
        expect(existsSync(run.file)).toBe(false);
    });

    it('saves nothing when the login read fails, and its sentence names the status only (G135)', async () => {
        const run = world([granted()], { user: answer(401, { message: TOKEN }) });
        await run.signIns.start(HOST, 'Iv1.abc');
        (await run.waits.next()).release();
        await turn();
        expect(run.signIns.flow('github')).toMatchObject({ state: 'failed', said: 'HTTP 401' });
        expect(existsSync(run.file)).toBe(false);
    });

    it.each(['file:///etc/passwd', 'http://github.com/login/device', 'javascript:alert(1)'])(
        'shows %s and does not open it (G135)',
        async (verification) => {
            const run = world([], { verification });
            const view = await run.signIns.start(HOST, 'Iv1.abc');
            expect(view.address).toBe(verification);
            expect(run.opened).toEqual([]);
            run.signIns.close();
        }
    );
});

describe('a git Sign in ended before its token', () => {
    it('stops at a cancel during a wait, polls no more and saves nothing (G135)', async () => {
        const run = world([granted()]);
        await run.signIns.start(HOST, 'Iv1.abc');
        await run.waits.next();
        run.signIns.cancel('github');
        await turn();
        expect(run.signIns.flow('github')?.state).toBe('cancelled');
        expect(run.tokenCalls()).toBe(0);
        expect(existsSync(run.file)).toBe(false);
    });

    it('saves nothing of a token answered after the close, while its poll was in flight (G135)', async () => {
        let answerPoll: (response: Response) => void = () => undefined;
        const inFlight = new Promise<Response>((take) => {
            answerPoll = take;
        });
        const run = world([inFlight]);
        await run.signIns.start(HOST, 'Iv1.abc');
        (await run.waits.next()).release();
        await turn();
        expect(run.tokenCalls()).toBe(1);
        run.signIns.close();
        answerPoll(granted());
        await turn();
        expect(run.signIns.flow('github')?.state).toBe('cancelled');
        expect(run.calls.some((one) => one.address === HOST.user)).toBe(false);
        expect(existsSync(run.file)).toBe(false);
    });

    it('ends the first Sign in of a host when a second starts, and saves the token once (G135)', async () => {
        const run = world([granted()]);
        await run.signIns.start(HOST, 'Iv1.abc');
        await run.waits.next();
        await run.signIns.start(HOST, 'Iv1.abc');
        const second = await run.waits.next();
        await turn();
        expect(run.tokenCalls()).toBe(0);
        second.release();
        await turn();
        expect(run.tokenCalls()).toBe(1);
        expect(run.signIns.flow('github')?.state).toBe('granted');
        expect(JSON.parse(readFileSync(run.file, 'utf8'))).toMatchObject({ token: TOKEN });
    });
});
