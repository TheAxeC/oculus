// The HPC poller's settings changed while it runs: a new period moves the next poll and the next
// quota read to the earlier of the old time and the new period from the push, a new host clears
// what the old one answered and polls the new one, a new window polls at once, and a poll, quota
// read or prewarm begun under an older host or window drops its result.
import { describe, expect, vi, type Mock } from 'vitest';
import type { HpcPayload } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    RETRY_MIN,
    batchCommand,
    watchHpc,
    type HpcOptions
} from '../../../../src/lib/server/machine/hpc/poll.ts';
import type { RunResult, Runner } from '../../../../src/lib/server/machine/hpc/ssh.ts';
import { recording } from '../../root/watch/probe.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    options,
    MINUTE,
    ANSWER,
    held,
    swingingRunner,
    queueCalls,
    prewarmCalls,
    gate,
    TWO_FINISHED,
    LISTING,
    NOTHING,
    prewarmRunner
} from './poll-fixture.ts';

describe('settings changed while the watcher runs', () => {
    /** The settings the watcher starts with, which a case changes one key of. */
    const START = options;
    const QUOTA = '/home/user 10G 20G 40G';

    /** The queue commands the runner was given for one host. */
    function queueCallsTo(runner: Mock<Runner>, host: string): number {
        return runner.mock.calls.filter((call) => call[0] === host && call[1].startsWith('squeue'))
            .length;
    }

    /** How many times the quota was read. */
    function quotaCalls(runner: Mock<Runner>): number {
        return runner.mock.calls.filter((call) => call[1].startsWith('quota')).length;
    }

    /** A runner whose quota read answers a meter and whose queue answers like swingingRunner's. */
    function metered(cluster = { up: true }): Mock<Runner> {
        return vi.fn<Runner>((_host, remote) =>
            remote.startsWith('quota')
                ? Promise.resolve({ stdout: QUOTA, stderr: '', code: 0 })
                : cluster.up
                  ? Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 })
                  : Promise.reject(new Error('timeout'))
        );
    }

    /** A started watcher on fake timers, its first poll done. */
    async function started(runner: Mock<Runner>, over: Partial<HpcOptions> = {}) {
        vi.useFakeTimers();
        const hub = new Hub();
        const watcher = watchHpc(hub, { ...START, ...over, runner });
        await vi.advanceTimersByTimeAsync(0);
        return { hub, watcher };
    }

    it('moves the next poll to the new period from the push when that is sooner, and publishes it', async () => {
        const runner = swingingRunner({ up: true });
        const { hub, watcher } = await started(runner);
        try {
            await vi.advanceTimersByTimeAsync(5 * MINUTE);
            watcher.set({ ...START, pollMin: 5 });

            expect(held(hub).pollMin).toBe(5);
            await vi.advanceTimersByTimeAsync(5 * MINUTE - 1);
            expect(queueCalls(runner)).toBe(1);
            await vi.advanceTimersByTimeAsync(1);
            expect(queueCalls(runner)).toBe(2);
            await vi.advanceTimersByTimeAsync(5 * MINUTE);
            expect(queueCalls(runner)).toBe(3);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('leaves the next poll where it is for a longer period, and polls at the new period after it', async () => {
        const runner = swingingRunner({ up: true });
        const { watcher } = await started(runner, { pollMin: 5 });
        try {
            await vi.advanceTimersByTimeAsync(2 * MINUTE);
            watcher.set({ ...START, pollMin: 60 });

            // The poll waiting runs 3 minutes on; the one after it a full new period later.
            for (const [minutes, polls] of [
                [3, 2],
                [59, 2],
                [1, 3]
            ]) {
                await vi.advanceTimersByTimeAsync(minutes * MINUTE);
                expect(queueCalls(runner)).toBe(polls);
            }
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('treats the retry wait as the next poll: a shorter period moves it, a longer one leaves it', async () => {
        for (const [pollMin, polls] of [
            [1, 2],
            [5, 1]
        ]) {
            const runner = swingingRunner({ up: false });
            const { hub, watcher } = await started(runner);
            try {
                expect(held(hub).status).toBe('unreachable');
                watcher.set({ ...START, pollMin });
                await vi.advanceTimersByTimeAsync(1 * MINUTE);
                expect(queueCalls(runner)).toBe(polls);
                await vi.advanceTimersByTimeAsync(1 * MINUTE);
                expect(queueCalls(runner)).toBe(2);
            } finally {
                watcher.close();
                vi.useRealTimers();
            }
        }
    });

    it('clears what the old host answered and polls the new one at once', async () => {
        const runner = metered();
        const logPaths = new Map([['9', '/old/9.out']]);
        const { hub, watcher } = await started(runner, { prewarm: false, logPaths });
        try {
            expect(held(hub).jobs).toHaveLength(1);
            expect(held(hub).quota).toHaveLength(1);

            watcher.set({ ...START, host: 'other', prewarm: false });

            expect(held(hub)).toMatchObject({
                status: 'starting',
                host: 'other',
                jobs: [],
                quota: []
            });
            expect(held(hub).lastOk).toBeUndefined();
            expect(logPaths.size).toBe(0);
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCallsTo(runner, 'other')).toBe(1);
            expect(held(hub)).toMatchObject({ status: 'ok', host: 'other' });
            expect(held(hub).quota).toHaveLength(1);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('starts no poll for a host that did not change', async () => {
        const runner = swingingRunner({ up: true });
        const { hub, watcher } = await started(runner);
        try {
            const version = hub.version('hpc');
            watcher.set({ ...START });
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(1);
            expect(hub.version('hpc')).toBe(version);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('drops the rows of a poll begun under the old host and answers with one follow-up poll', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['hpc']);
        const first = gate();
        let calls = 0;
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
            calls += 1;
            return calls === 1
                ? first.answer
                : Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 });
        });
        const watcher = watchHpc(hub, { ...START, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...START, host: 'other' });
            first.settle({
                stdout: ANSWER.replace('1|x|cpu', '2|old|cpu'),
                stderr: '',
                code: 0
            });
            await vi.advanceTimersByTimeAsync(0);

            const names = client.got.flatMap((message) =>
                (message.payload as HpcPayload).jobs.map((job) => job.name)
            );
            expect(names).not.toContain('old');
            expect(queueCallsTo(runner, 'other')).toBe(1);
            expect(queueCallsTo(runner, 'fixture')).toBe(1);
            expect(held(hub)).toMatchObject({ status: 'ok', host: 'other' });
            expect(held(hub).jobs.map((job) => job.name)).toEqual(['x']);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('starts one poll for a push that changes the host and the day count together', async () => {
        const runner = swingingRunner({ up: true });
        const { watcher } = await started(runner);
        try {
            watcher.set({ ...START, host: 'other', days: 9 });
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('polls at once with the new window when the day count changes', async () => {
        const runner = swingingRunner({ up: true });
        const { watcher } = await started(runner);
        try {
            watcher.set({ ...START, days: 14 });
            await vi.advanceTimersByTimeAsync(0);

            expect(queueCalls(runner)).toBe(2);
            expect(
                runner.mock.calls.filter((call) => call[1].startsWith('squeue')).at(-1)?.[1]
            ).toBe(batchCommand(14));
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('reads the quota by the same rule as the poll: sooner at once, never later', async () => {
        const lowered = metered();
        const down = await started(lowered);
        try {
            expect(quotaCalls(lowered)).toBe(1);
            await vi.advanceTimersByTimeAsync(10 * MINUTE);
            down.watcher.set({ ...START, quotaMin: 30 });
            await vi.advanceTimersByTimeAsync(30 * MINUTE - 1);
            expect(quotaCalls(lowered)).toBe(1);
            await vi.advanceTimersByTimeAsync(1);
            expect(quotaCalls(lowered)).toBe(2);
            await vi.advanceTimersByTimeAsync(30 * MINUTE);
            expect(quotaCalls(lowered)).toBe(3);
        } finally {
            down.watcher.close();
            vi.useRealTimers();
        }

        const raised = metered();
        const up = await started(raised, { quotaMin: 5 });
        try {
            await vi.advanceTimersByTimeAsync(1 * MINUTE);
            up.watcher.set({ ...START, quotaMin: 30 });
            await vi.advanceTimersByTimeAsync(4 * MINUTE);
            expect(quotaCalls(raised)).toBe(2);
            await vi.advanceTimersByTimeAsync(29 * MINUTE);
            expect(quotaCalls(raised)).toBe(2);
            await vi.advanceTimersByTimeAsync(1 * MINUTE);
            expect(quotaCalls(raised)).toBe(3);
        } finally {
            up.watcher.close();
            vi.useRealTimers();
        }
    });

    it('stops prewarming from the next good poll when the prewarm is turned off', async () => {
        const early = prewarmRunner(undefined, { up: true }, ANSWER);
        const late = prewarmRunner(undefined, { up: true }, TWO_FINISHED);
        let phase = early;
        const runner = vi.fn<Runner>((...args) => phase(...args));
        const logPaths = new Map<string, string>();
        vi.useFakeTimers();
        const watcher = watchHpc(new Hub(), { ...START, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            expect([...logPaths.keys()]).toEqual(['9']);

            watcher.set({ ...START, prewarm: false });
            phase = late;
            await vi.advanceTimersByTimeAsync(20 * MINUTE);

            expect(queueCalls(runner)).toBe(2);
            expect(prewarmCalls(runner)).toBe(2);
            expect([...logPaths.keys()]).toEqual(['9']);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('does nothing once the watcher is closed: no timer, no poll, no publish', async () => {
        const runner = metered();
        const { hub, watcher } = await started(runner);
        watcher.close();
        const calls = runner.mock.calls.length;
        const version = hub.version('hpc');
        try {
            watcher.set({ host: 'other', days: 9, pollMin: 1, quotaMin: 1, prewarm: false });
            expect(vi.getTimerCount()).toBe(0);
            await vi.advanceTimersByTimeAsync(5 * MINUTE);
            expect(runner.mock.calls.length).toBe(calls);
            expect(hub.version('hpc')).toBe(version);
        } finally {
            vi.useRealTimers();
        }
    });

    /** Every meter percentage a client of the hpc channel was sent, in order. */
    const quotaPcts = (client: ReturnType<typeof recording>): number[] =>
        client.got.flatMap((message) =>
            (message.payload as HpcPayload).quota.map((item) => item.pct)
        );

    /** A runner whose first quota read waits on the gate; later reads answer `later` at once. */
    function quotaHeld(first: Promise<RunResult>, later: string): Mock<Runner> {
        let reads = 0;
        return vi.fn<Runner>((_host, remote) => {
            if (!remote.startsWith('quota'))
                return Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 });
            reads += 1;
            return reads === 1 ? first : Promise.resolve({ stdout: later, stderr: '', code: 0 });
        });
    }

    it('drops the meters of a quota read begun under the old host and publishes the new host', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['hpc']);
        const first = gate();
        const runner = quotaHeld(first.answer, '/home/user 30G 20G 40G');
        const watcher = watchHpc(hub, { ...START, prewarm: false, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...START, prewarm: false, host: 'other' });
            await vi.advanceTimersByTimeAsync(0);
            first.settle({ stdout: '/home/user 10G 20G 40G', stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);

            expect(quotaPcts(client)).not.toContain(25);
            expect(held(hub).quota.map((item) => item.pct)).toEqual([75]);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('lets a quota read in flight land when only the day count changes', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const first = gate();
        const runner = quotaHeld(first.answer, '/home/user 30G 20G 40G');
        const watcher = watchHpc(hub, { ...START, prewarm: false, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...START, prewarm: false, days: 14 });
            await vi.advanceTimersByTimeAsync(0);
            first.settle({ stdout: '/home/user 10G 20G 40G', stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);

            expect(held(hub).quota.map((item) => item.pct)).toEqual([25]);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('drops the log paths of a prewarm begun under the old host', async () => {
        vi.useFakeTimers();
        const listing = gate();
        const old = prewarmRunner(listing.answer);
        // The new host answers its queue like the old one and its directory walk with nothing.
        const runner = vi.fn<Runner>((host, remote, limit) =>
            host === 'other' && !remote.startsWith('squeue') && !remote.startsWith('quota')
                ? Promise.resolve(NOTHING)
                : old(host, remote, limit)
        );
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(new Hub(), { ...START, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBeGreaterThan(0);

            watcher.set({ ...START, host: 'other' });
            listing.settle({ stdout: LISTING, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);

            expect([...logPaths]).toEqual([]);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('drops the failure of a poll begun under the old host and publishes the new host', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['hpc']);
        let fail: (error: Error) => void = () => {
            throw new Error('the poll was failed before its promise existed');
        };
        const first = new Promise<RunResult>((_resolve, reject) => (fail = reject));
        let calls = 0;
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
            calls += 1;
            return calls === 1 ? first : Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 });
        });
        const watcher = watchHpc(hub, { ...START, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...START, host: 'other' });
            fail(new Error('timeout'));
            await vi.advanceTimersByTimeAsync(0);

            const statuses = client.got.map((message) => (message.payload as HpcPayload).status);
            expect(statuses).not.toContain('unreachable');
            expect(held(hub)).toMatchObject({ status: 'ok', host: 'other' });
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('asks again about the jobs of a prewarm dropped by a change of the day count', async () => {
        vi.useFakeTimers();
        const listing = gate();
        let listings = 0;
        const answer = prewarmRunner();
        const runner = vi.fn<Runner>((host, remote, limit) => {
            if (remote.includes('@@oculus:wd=')) {
                listings += 1;
                if (listings === 1) return listing.answer;
            }
            return answer(host, remote, limit);
        });
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(new Hub(), { ...START, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(listings).toBe(1);

            watcher.set({ ...START, days: 14 });
            listing.settle({ stdout: LISTING, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(START.pollMin * MINUTE);

            expect([...logPaths.keys()].sort()).toEqual(['10', '9']);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('drops the rows of a poll begun under the old window and answers with one poll at the new one', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['hpc']);
        const first = gate();
        let queues = 0;
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
            queues += 1;
            return queues === 1
                ? first.answer
                : Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 });
        });
        const watcher = watchHpc(hub, { ...START, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...START, days: 14 });
            first.settle({ stdout: ANSWER.replace('1|x|cpu', '2|old|cpu'), stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);

            const names = client.got.flatMap((message) =>
                (message.payload as HpcPayload).jobs.map((job) => job.name)
            );
            expect(names).not.toContain('old');
            expect(queueCalls(runner)).toBe(2);
            const queues14 = runner.mock.calls.filter((call) => call[1] === batchCommand(14));
            expect(queues14).toHaveLength(1);
            expect(held(hub).jobs.map((job) => job.name)).toEqual(['x']);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
});

describe('a host the settings do not give', () => {
    const NONE = { ...options, host: '', missing: 'nowhere names no resource' };

    /** A runner that fails the case when it is called. */
    function forbidden(): Mock<Runner> {
        return vi.fn<Runner>(() => Promise.reject(new Error('ssh ran')));
    }

    it('runs no ssh, and publishes unreachable with the sentence and no host', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = forbidden();
        const watcher = watchHpc(hub, { ...NONE, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({
                status: 'unreachable',
                hint: 'nowhere names no resource',
                host: ''
            });
            await vi.advanceTimersByTimeAsync(options.pollMin * MINUTE);
            await watcher.refresh();
            expect(runner).not.toHaveBeenCalled();
            expect(held(hub)).toMatchObject({ status: 'unreachable', host: '' });
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('arms the short retry as for an unreachable cluster', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const watcher = watchHpc(hub, { ...NONE, runner: forbidden() });
        const publishes = vi.spyOn(hub, 'publish');
        try {
            await vi.advanceTimersByTimeAsync(0);
            const before = publishes.mock.calls.length;
            await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE);
            expect(publishes.mock.calls.length).toBeGreaterThan(before);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('polls the host a later setting gives, and goes back to the sentence when it is taken away', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = swingingRunner({ up: true });
        const watcher = watchHpc(hub, { ...NONE, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(0);
            watcher.set({ ...options, host: 'utwente2' });
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({ status: 'ok', host: 'utwente2' });
            watcher.set({ ...NONE, missing: 'the cluster utwente has no host' });
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({
                status: 'unreachable',
                hint: 'the cluster utwente has no host',
                host: '',
                jobs: []
            });
            expect(queueCalls(runner)).toBe(1);
            watcher.set({ ...options, host: 'utwente' });
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({ status: 'ok', host: 'utwente' });
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('drops the answer of a poll in flight when the host is taken away', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const first = gate();
        const runner = vi.fn<Runner>((_host, remote) =>
            remote.startsWith('quota') ? Promise.resolve(NOTHING) : first.answer
        );
        const watcher = watchHpc(hub, { ...options, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set(NONE);
            first.settle({ stdout: ANSWER, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({ status: 'unreachable', host: '', jobs: [] });
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it('answers with the last of two sentences set in a row', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const watcher = watchHpc(hub, { ...NONE, runner: forbidden() });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.set({ ...NONE, missing: 'first sentence' });
            watcher.set({ ...NONE, missing: 'second sentence' });
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub)).toMatchObject({ status: 'unreachable', hint: 'second sentence' });
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
});
