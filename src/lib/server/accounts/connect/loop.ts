// Layer 2, server. The cadence both connector pollers run on, and the account list they run over,
// which can change while they run.
//
// The cadence is each account's own. An account that failed is due again after the retry minutes
// and one that answered after poll_min, the one timer fires at the earliest of those times, and a
// round reads only the accounts that are due; so one provider refusing does not make another be
// called every two minutes. A refresh reads every account whatever its due time, since what a press
// asks for is the state now.
//
// The list is the machine's own config/local.yml, which the reader edits from the Calendar and the
// Inbox and by hand, so `set` takes a new list and a new folder at any time. An account that left
// is forgotten at once and its row leaves the next publish; an account that joined is due at once;
// a new folder makes every account due at once, since every file it reads is another file. A round
// already in flight carries on, and what it reads for an account that has left, or from the folder
// that was replaced, is dropped rather than published: `live` is how the reader of one account asks
// whether it still counts.
//
// What each round does first for an account is the same in both pollers, so it is here too: the
// account's credentials read from its file and its provider's, and the access token asked for,
// with a refresh token the provider hands back in its place kept in the account's file.

import { connectKey } from '../../../data/accounts/connect.ts';
import type { ConnectAccountConfig, ConnectKind } from '../../../data/model/index.ts';
import { accessToken, type Fetcher } from './oauth.ts';
import { keepRotatedToken, readCredentials } from './store.ts';

/** Where a poller's accounts come from: its own options, as the machine's file first named them. */
export type LoopSource = {
    accounts: ConnectAccountConfig[];
    /** The folder the account files are read from, already resolved. */
    dir: string;
    pollMin: number;
};

export type LoopOptions = {
    /** Minutes before the next attempt while a provider is not answering. */
    retryMin: number;
    now: () => Date;
    /**
     * Read one account from one folder: true when it answered or has nothing to call, false when
     * it failed. `live` answers whether the account and the folder are still the loop's.
     */
    read: (account: ConnectAccountConfig, dir: string, live: () => boolean) => Promise<boolean>;
    /** Publish one complete state over the accounts the loop holds now. */
    publish: () => void;
    /** What the poller holds by account key, dropped for an account that has left or moved. */
    held: Map<string, unknown>[];
    /** The folder has moved, before the round that reads the new one. */
    moved?: (dir: string) => void;
};

export type AccountLoop = {
    /** The accounts the loop holds now, in the order the machine's file lists them. */
    accounts: () => ConnectAccountConfig[];
    /** The folder the loop reads now. */
    dir: () => string;
    /** The first publish, or the first round when there is an account to read. */
    start: () => void;
    run: (all: boolean) => Promise<void>;
    /** Take a new list and folder; the same list in the same order and folder changes nothing. */
    set: (accounts: ConnectAccountConfig[], dir: string) => void;
    close: () => void;
};

/** One account's access token, or the fields of its row while it waits for setup or Connect. */
export type SignIn =
    { token: string } | { waiting: { status: 'not-connected'; needsSetup?: true } };

/**
 * Sign one account in for one round. An account whose provider has no client half on this machine
 * waits for the provider's setup, and one with a half and no refresh token waits for Connect;
 * neither is a failure. A file that cannot be read, or a token call the provider refuses, throws.
 */
export async function signIn(
    kind: ConnectKind,
    account: ConnectAccountConfig,
    dirs: { dir: string; providerDir: string },
    fetcher: Fetcher
): Promise<SignIn> {
    const credentials = readCredentials(dirs.dir, account, dirs.providerDir);
    if (credentials === null) return { waiting: { status: 'not-connected', needsSetup: true } };
    const refreshToken = credentials.refreshToken;
    if (refreshToken === undefined) return { waiting: { status: 'not-connected' } };
    const keep = (next: string): void => keepRotatedToken(dirs.dir, account, next);
    return { token: await accessToken(kind, credentials, refreshToken, fetcher, keep) };
}

export function accountLoop(source: LoopSource, options: LoopOptions): AccountLoop {
    let accounts = [...source.accounts];
    let dir = source.dir;
    let closed = false;
    /** When each account is next due, as an epoch time; an account with no entry is due now. */
    const due = new Map<string, number>();
    const dueAt = (account: ConnectAccountConfig): number => due.get(connectKey(account)) ?? 0;
    const clock = (): number => options.now().getTime();

    /** Whether an account read from one folder still counts: open, still listed, same folder. */
    const holds = (account: ConnectAccountConfig, from: string): boolean =>
        !closed && from === dir && accounts.some((one) => connectKey(one) === connectKey(account));

    /**
     * One pending attempt at a time, fired at the earliest account's due time. One handle, which
     * close() clears.
     */
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (): void => {
        if (timer !== null) clearTimeout(timer);
        timer = null;
        if (closed || accounts.length === 0) return;
        const wait = Math.min(...accounts.map(dueAt)) - clock();
        timer = setTimeout(() => void run(false), Math.max(0, wait));
    };

    /**
     * One round: every account when a press asked for it, and the ones that are due otherwise. An
     * account's next due time is set from its own outcome, so a refusing provider shortens its own
     * cadence and nobody else's.
     */
    const poll = async (all: boolean): Promise<void> => {
        const from = dir;
        const wanted = accounts.filter((account) => all || dueAt(account) <= clock());
        try {
            for (const account of wanted) {
                const live = (): boolean => holds(account, from);
                if (!live()) continue;
                const good = await options.read(account, from, live);
                if (!live()) continue;
                const minutes = good ? source.pollMin : options.retryMin;
                due.set(connectKey(account), clock() + minutes * 60000);
            }
            if (closed || wanted.length === 0) return;
            options.publish();
        } finally {
            schedule();
        }
    };

    /**
     * The round in flight, if there is one, and the one follow-up round every caller asked for
     * meanwhile shares. A refresh never opens a second round of provider calls beside the round
     * running, so the rows and the state words are always the newest round's; it does get a round
     * that starts after the one in flight, since what asked for it wants the providers' state after
     * its own action and not the answer of a round begun before it. A press that lands while a
     * timed round runs makes that follow-up read every account, not only the due ones.
     */
    let running: Promise<void> | null = null;
    let queued: Promise<void> | null = null;
    let queuedAll = false;
    const run = (all: boolean): Promise<void> => {
        if (closed || accounts.length === 0) return Promise.resolve();
        if (running === null) {
            running = poll(all).finally(() => (running = null));
            return running;
        }
        queuedAll ||= all;
        queued ??= running
            .then(() => {
                const wanted = queuedAll;
                queuedAll = false;
                return run(wanted);
            })
            .finally(() => (queued = null));
        return queued;
    };

    const set = (next: ConnectAccountConfig[], nextDir: string): void => {
        if (closed) return;
        const moved = nextDir !== dir;
        const keys = next.map(connectKey);
        const held = accounts.map(connectKey);
        if (!moved && keys.length === held.length && keys.every((key, at) => key === held[at])) {
            return;
        }
        for (const key of held) {
            if (!moved && keys.includes(key)) continue;
            due.delete(key);
            for (const map of options.held) map.delete(key);
        }
        accounts = [...next];
        dir = nextDir;
        if (moved) options.moved?.(dir);
        options.publish();
        // An empty list clears the timer; otherwise the round that reads the accounts now due sets
        // it again when it ends.
        if (accounts.length === 0) schedule();
        else void run(false);
    };

    return {
        accounts: () => accounts,
        dir: () => dir,
        start: () => {
            if (accounts.length === 0) options.publish();
            else void run(true);
        },
        run,
        set,
        close: () => {
            closed = true;
            if (timer !== null) clearTimeout(timer);
            timer = null;
        }
    };
}
