// The account loop both connector pollers run on, over a list the machine's file can change while
// it runs: an account added is read at once, one removed is forgotten and leaves the next publish,
// a new folder reads every account again, and a read of an account that left is dropped.
//
// The reader is a recorder; nothing here reads a file or calls a provider.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConnectAccountConfig } from '../../../../src/lib/data/model/index.ts';
import { accountLoop, type AccountLoop } from '../../../../src/lib/server/accounts/connect/loop.ts';

const WORK: ConnectAccountConfig = { provider: 'google', label: 'work' };
const UNI: ConnectAccountConfig = { provider: 'microsoft', label: 'uni' };

const loops: AccountLoop<ConnectAccountConfig>[] = [];

afterEach(() => {
    for (const loop of loops.splice(0)) loop.close();
    vi.useRealTimers();
});

/** A loop over a recording reader, and what it read, published and was told to move to. */
function recorded(
    accounts: ConnectAccountConfig[],
    read = (): Promise<boolean> => Promise.resolve(true)
) {
    const reads: string[] = [];
    const moves: string[] = [];
    const held = new Map<string, unknown>(
        accounts.map((one) => [`${one.provider}-${one.label}`, 1])
    );
    const publish = vi.fn();
    const loop = accountLoop(
        { accounts, dir: '/first', pollMin: 15 },
        {
            retryMin: 2,
            now: () => new Date(),
            read: (account, dir) => {
                reads.push(`${dir}:${account.provider}-${account.label}`);
                return read();
            },
            publish,
            held: [held],
            moved: (dir) => void moves.push(dir)
        }
    );
    loops.push(loop);
    return { loop, reads, moves, held, publish };
}

/** Let every queued round run to its end. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
}

describe('an account list the machine file changes', () => {
    it('reads an added account at once, and only that one', async () => {
        const { loop, reads, publish } = recorded([WORK]);
        await loop.run(true);
        reads.length = 0;
        publish.mockClear();

        loop.set([WORK, UNI], '/first');
        await settle();

        expect(loop.accounts()).toEqual([WORK, UNI]);
        expect(reads).toEqual(['/first:microsoft-uni']);
        expect(publish).toHaveBeenCalled();
    });

    it('forgets a removed account and publishes without it', async () => {
        const { loop, held, publish } = recorded([WORK, UNI]);
        await loop.run(true);
        publish.mockClear();

        loop.set([UNI], '/first');

        expect(loop.accounts()).toEqual([UNI]);
        // What the poller held for the account that left is gone; the one that stays keeps its own.
        expect([...held.keys()]).toEqual(['microsoft-uni']);
        expect(publish).toHaveBeenCalledTimes(1);
    });

    it('changes nothing for the same list in the same order and folder', async () => {
        const { loop, reads, publish } = recorded([WORK, UNI]);
        await loop.run(true);
        reads.length = 0;
        publish.mockClear();

        loop.set([{ ...WORK }, { ...UNI }], '/first');
        await settle();

        expect(reads).toEqual([]);
        expect(publish).not.toHaveBeenCalled();
    });

    it('reads every account again from a new folder, and says it moved', async () => {
        const { loop, reads, moves, held } = recorded([WORK, UNI]);
        await loop.run(true);
        reads.length = 0;

        loop.set([WORK, UNI], '/second');
        await settle();

        expect(moves).toEqual(['/second']);
        expect(loop.dir()).toBe('/second');
        expect(reads).toEqual(['/second:google-work', '/second:microsoft-uni']);
        // Nothing read from the old folder is kept for either account.
        expect(held.size).toBe(0);
    });

    it('answers a read in flight for an account that left as no longer live', async () => {
        let release = (): void => undefined;
        const lives: boolean[] = [];
        const reads: string[] = [];
        const loop = accountLoop(
            { accounts: [WORK], dir: '/first', pollMin: 15 },
            {
                retryMin: 2,
                now: () => new Date(),
                read: async (account, _dir, live) => {
                    reads.push(account.label);
                    await new Promise<void>((resolve) => (release = resolve));
                    lives.push(live());
                    return true;
                },
                publish: vi.fn(),
                held: []
            }
        );
        loops.push(loop);
        const round = loop.run(true);
        await settle();

        loop.set([], '/first');
        release();
        await round;

        expect(reads).toEqual(['work']);
        expect(lives).toEqual([false]);
    });

    it('holds no timer once the last account has left', async () => {
        vi.useFakeTimers();
        const { loop } = recorded([WORK]);
        await loop.run(true);
        expect(vi.getTimerCount()).toBe(1);

        loop.set([], '/first');

        expect(vi.getTimerCount()).toBe(0);
    });
});
