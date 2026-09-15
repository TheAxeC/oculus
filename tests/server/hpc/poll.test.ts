// Live HPC poller coverage uses injected runners only, so start, success, timeout, forced refresh,
// the short cadence after a failure, the last good rows a failed poll keeps, one poll at a time and
// timer closure are all reached without ssh.
import { describe, expect, it, vi, type Mock } from 'vitest';
import type { HpcPayload } from '../../../src/lib/data/model.ts';
import { Hub } from '../../../src/lib/server/channels.ts';
import { SEC_RC, SEC_SACCT, SEC_SINFO } from '../../../src/lib/server/hpc/parse.ts';
import { RETRY_MIN, watchHpc } from '../../../src/lib/server/hpc/poll.ts';
import { PREWARM_MAX } from '../../../src/lib/server/hpc/prewarm.ts';
import type { RunResult, Runner } from '../../../src/lib/server/hpc/ssh.ts';

const options = { host: 'fixture', days: 3, pollMin: 20, quotaMin: 60, prewarm: true };
const MINUTE = 60000;
/** One queued job, one finished job and one partition, in the shape the batch command answers with. */
const ANSWER = `1|x|cpu|RUNNING|1|2|1|1||1G|1||n\n${SEC_RC}0@@\n${SEC_SACCT}\n9|y|COMPLETED|0:0|10:00|2026-09-11T10:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}\ncpu|up|1|idle|(null)`;

/** The payload the hub currently holds on the hpc channel. */
function held(hub: Hub): HpcPayload {
    return hub.latest('hpc')?.payload as HpcPayload;
}

/**
 * A runner whose queue answer is whatever `cluster.up` says at the moment it is called, so one
 * watcher can be taken down and brought back inside a case. Quota always answers nothing.
 */
function swingingRunner(cluster: { up: boolean }): Mock<Runner> {
    return vi.fn<Runner>((_host, remote) =>
        remote.startsWith('quota')
            ? Promise.resolve({ stdout: '', stderr: '', code: 0 })
            : cluster.up
              ? Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 })
              : Promise.reject(new Error('timeout'))
    );
}

/** How many times the queue command, and neither the quota read nor a prewarm query, was run. */
function queueCalls(runner: Mock<Runner>): number {
    return runner.mock.calls.filter((call) => call[1].startsWith('squeue')).length;
}

/** How many times the prewarm asked the cluster anything, over both of its queries. */
function prewarmCalls(runner: Mock<Runner>): number {
    return runner.mock.calls.filter(
        (call) => call[1].startsWith('sacct') || call[1].includes('@@oculus:wd=')
    ).length;
}

/** A promise the case settles when it chooses, so a poll can be held in flight. */
function gate(): { answer: Promise<RunResult>; settle: (value: RunResult) => void } {
    let settle: (value: RunResult) => void = () => {
        throw new Error('the gate was settled before its promise existed');
    };
    const answer = new Promise<RunResult>((resolve) => (settle = resolve));
    return { answer, settle: (value) => settle(value) };
}

/** A runner whose queue command waits on the gate and whose quota command answers nothing. */
function gatedRunner(answer: Promise<RunResult>): Mock<Runner> {
    return vi.fn<Runner>((_host, remote) =>
        remote.startsWith('quota') ? Promise.resolve({ stdout: '', stderr: '', code: 0 }) : answer
    );
}
/** Two finished jobs in the queue answer, which is what the prewarm has to resolve. */
const TWO_FINISHED = ANSWER.replace(
    SEC_SINFO,
    `10|z|COMPLETED|0:0|10:00|2026-09-11T09:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}`
);

/** A queue answer whose third finished row is a job that is still finishing. */
const WITH_COMPLETING = TWO_FINISHED.replace(
    SEC_SINFO,
    `11|w|COMPLETING|0:0|10:00|2026-09-11T08:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}`
);

/** One working directory holding the jobs' logs, on the second rung. */
const LISTING = [
    '@@oculus:wd=/work/one@@',
    '@@oculus:rung@@',
    '/work/one/hpc/logs/*',
    '@@oculus:rung@@',
    '/work/one/logs/run-9.out',
    '/work/one/logs/run-10.out',
    '/work/one/logs/run-11.out',
    '@@oculus:rung@@',
    '@@oculus:rung@@',
    '@@oculus:rung@@'
].join('\n');

const NOTHING: RunResult = { stdout: '', stderr: '', code: 0 };

/**
 * A runner that answers all four commands: the queue batch (whatever `cluster.up` says at the
 * moment it is called, so a case can take the cluster down), the quota read with nothing, and the
 * prewarm's two queries. `listing` holds the directory walk until the case settles it, which is how
 * a case presses a refresh while a prewarm is in flight.
 */
function prewarmRunner(
    listing?: Promise<RunResult>,
    cluster = { up: true },
    queue = TWO_FINISHED
): Mock<Runner> {
    return vi.fn<Runner>((_host, remote) => {
        if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
        if (remote.startsWith('squeue'))
            return cluster.up
                ? Promise.resolve({ stdout: queue, stderr: '', code: 0 })
                : Promise.reject(new Error('timeout'));
        if (remote.startsWith('sacct'))
            return Promise.resolve({
                stdout: '9|/work/one\n10|/work/one\n11|/work/one',
                stderr: '',
                code: 0
            });
        return listing ?? Promise.resolve({ stdout: LISTING, stderr: '', code: 0 });
    });
}

describe('the watcher prewarm', () => {
    it('resolves the finished jobs it does not hold a path for, and keeps the ones it does', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = prewarmRunner();
        const logPaths = new Map([['9', '/pressed/9.out']]);
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(1);
            expect(prewarmCalls(runner)).toBe(2);
            // The path a press resolved came from scontrol and is exact, so it stands.
            expect([...logPaths]).toEqual([
                ['9', '/pressed/9.out'],
                ['10', '/work/one/logs/run-10.out']
            ]);
            await vi.advanceTimersByTimeAsync(20 * MINUTE);
            expect(queueCalls(runner)).toBe(2);
            // Both ids are held now, so the second cycle asks the cluster nothing.
            expect(prewarmCalls(runner)).toBe(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('starts the paths again once it holds more than it was given room for', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = prewarmRunner();
        // None of the seeded ids is one of the two being resolved, so the cycle writes its finds
        // and only then finds the map too big.
        const logPaths = new Map(
            Array.from({ length: PREWARM_MAX + 1 }, (_one, at) => [`${at + 100}`, `/old/${at}.out`])
        );
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            expect(logPaths.size).toBe(0);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('asks the cluster nothing when the prewarm is off', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = prewarmRunner();
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, prewarm: false, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(1);
            expect(prewarmCalls(runner)).toBe(0);
            expect(logPaths.size).toBe(0);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('leaves the paths and the cadence alone when the prewarm fails', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
            if (remote.startsWith('squeue'))
                return Promise.resolve({ stdout: TWO_FINISHED, stderr: '', code: 0 });
            return Promise.reject(new Error('timeout'));
        });
        const logPaths = new Map([['9', '/pressed/9.out']]);
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(1);
            expect([...logPaths]).toEqual([['9', '/pressed/9.out']]);
            expect(held(hub).status).toBe('ok');
            await vi.advanceTimersByTimeAsync(20 * MINUTE);
            expect(queueCalls(runner)).toBe(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('lets a press run beside the walk and starts no second prewarm while one is in flight', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const walk = gate();
        const runner = prewarmRunner(walk.answer);
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            expect(logPaths.size).toBe(0);
            // The press opens its own connection beside the walk and answers without it.
            await watcher.refresh();
            expect(queueCalls(runner)).toBe(2);
            expect(logPaths.size).toBe(0);
            // That poll was good and asked for a prewarm of its own, which waits for this one.
            expect(prewarmCalls(runner)).toBe(2);
            walk.settle({ stdout: LISTING, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect([...logPaths]).toEqual([
                ['9', '/work/one/logs/run-9.out'],
                ['10', '/work/one/logs/run-10.out']
            ]);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('runs no prewarm for the rows of a poll that failed', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const walk = gate();
        const cluster = { up: true };
        const runner = prewarmRunner(walk.answer, cluster);
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            // A good poll while the walk runs asks for a turn, and the failed poll after it takes
            // that turn away: the rows it would have run against are no longer the newest.
            await vi.advanceTimersByTimeAsync(20 * MINUTE);
            expect(queueCalls(runner)).toBe(2);
            cluster.up = false;
            await vi.advanceTimersByTimeAsync(20 * MINUTE);
            expect(held(hub).status).toBe('unreachable');
            walk.settle({ stdout: '', stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            expect(logPaths.size).toBe(0);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('leaves a job that is still finishing to the press', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = prewarmRunner(undefined, { up: true }, WITH_COMPLETING);
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub).recent.map((job) => job.id)).toEqual(['9', '10', '11']);
            // The listing holds a file for 11 as well, and it is not taken: scontrol still answers
            // for a job that is completing, and exactly.
            expect([...logPaths.keys()]).toEqual(['9', '10']);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('asks about an unresolved job once, so it cannot hold a listing slot every cycle', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        // A listing that names nobody: every job stays unresolved.
        const runner = prewarmRunner(
            Promise.resolve({ stdout: '@@oculus:wd=/work/one@@', stderr: '', code: 0 })
        );
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            await vi.advanceTimersByTimeAsync(options.pollMin * 60000);
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            expect(logPaths.size).toBe(0);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('writes nothing when the walk lands after the watcher closed', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const walk = gate();
        const runner = prewarmRunner(walk.answer);
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            watcher.close();
            walk.settle({ stdout: LISTING, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect(logPaths.size).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
    it('runs no prewarm for a poll whose answer the parser refuses', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        let polls = 0;
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota')) return Promise.resolve(NOTHING);
            if (remote.startsWith('squeue')) {
                polls += 1;
                return Promise.resolve({
                    stdout: polls === 1 ? TWO_FINISHED : 'no markers here',
                    stderr: '',
                    code: 0
                });
            }
            if (remote.startsWith('sacct'))
                return Promise.resolve({
                    stdout: '9|/work/one\n10|/work/one',
                    stderr: '',
                    code: 0
                });
            return Promise.resolve({ stdout: LISTING, stderr: '', code: 0 });
        });
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(prewarmCalls(runner)).toBe(2);
            logPaths.clear();
            await vi.advanceTimersByTimeAsync(options.pollMin * 60000);
            await vi.advanceTimersByTimeAsync(0);
            expect(held(hub).status).toBe('unreachable');
            expect(prewarmCalls(runner)).toBe(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('keeps a path a press wrote while the walk was running', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const walk = gate();
        const runner = prewarmRunner(walk.answer);
        const logPaths = new Map<string, string>();
        const watcher = watchHpc(hub, { ...options, runner, logPaths });
        try {
            await vi.advanceTimersByTimeAsync(0);
            logPaths.set('9', '/pressed/9.out');
            walk.settle({ stdout: LISTING, stderr: '', code: 0 });
            await vi.advanceTimersByTimeAsync(0);
            expect([...logPaths]).toEqual([
                ['9', '/pressed/9.out'],
                ['10', '/work/one/logs/run-10.out']
            ]);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
});

describe('watchHpc', () => {
    it('publishes starting, parsed data, refreshes, and closes timers', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = vi.fn((_h, remote: string) =>
            Promise.resolve(
                remote.startsWith('quota')
                    ? { stdout: '', stderr: '', code: 0 }
                    : {
                          stdout: `1|x|cpu|RUNNING|1|2|1|1||1G|1||n\n${SEC_RC}0@@\n${SEC_SACCT}\n${SEC_SINFO}\ncpu|up|1|idle|(null)`,
                          stderr: '',
                          code: 0
                      }
            )
        );
        const watcher = watchHpc(hub, { ...options, runner });
        expect((hub.latest('hpc')?.payload as { status: string }).status).toBe('starting');
        await Promise.resolve();
        await Promise.resolve();
        await watcher.refresh();
        expect((hub.latest('hpc')?.payload as { running: number }).running).toBe(1);
        await watcher.refresh();
        expect(runner).toHaveBeenCalled();
        expect((hub.latest('hpc')?.payload as { retryMin?: number }).retryMin).toBe(RETRY_MIN);
        watcher.close();
        expect(vi.getTimerCount()).toBe(0);
        vi.useRealTimers();
    });
    it('runs one follow-up poll after the one in flight for a refresh asked for meanwhile', async () => {
        const hub = new Hub();
        let settle: () => void = () => undefined;
        const first = new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
            settle = () => resolve({ stdout: ANSWER, stderr: '', code: 0 });
        });
        let calls = 0;
        const runner = vi.fn<Runner>((_host, remote) => {
            if (remote.startsWith('quota'))
                return Promise.resolve({ stdout: '', stderr: '', code: 0 });
            calls += 1;
            return calls === 1 ? first : Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 });
        });
        const watcher = watchHpc(hub, { ...options, runner });
        await Promise.resolve();
        const during = watcher.refresh();
        const same = watcher.refresh();
        expect(same).toBe(during);
        expect(calls).toBe(1);
        settle();
        await during;
        expect(calls).toBe(2);
        watcher.close();
    });
    it('marks a timeout unreachable', async () => {
        const hub = new Hub();
        const watcher = watchHpc(hub, {
            ...options,
            runner: () => Promise.reject(new Error('timeout'))
        });
        await watcher.refresh();
        expect((hub.latest('hpc')?.payload as { status: string }).status).toBe('unreachable');
        watcher.close();
    });
    it('retries soon after a failure and returns to the regular cadence once the cluster answers', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const cluster = { up: false };
        const runner = swingingRunner(cluster);
        const watcher = watchHpc(hub, { ...options, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(1);
            expect(held(hub).status).toBe('unreachable');
            cluster.up = true;
            await vi.advanceTimersByTimeAsync(2 * MINUTE);
            expect(queueCalls(runner)).toBe(2);
            expect(held(hub).status).toBe('ok');
            await vi.advanceTimersByTimeAsync(19 * MINUTE);
            expect(queueCalls(runner)).toBe(2);
            await vi.advanceTimersByTimeAsync(1 * MINUTE);
            expect(queueCalls(runner)).toBe(3);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('joins a refresh to the one follow-up poll rather than opening a second connection beside the poll in flight', async () => {
        const hub = new Hub();
        const held = gate();
        const runner = gatedRunner(held.answer);
        const watcher = watchHpc(hub, { ...options, runner });
        expect(queueCalls(runner)).toBe(1);
        const first = watcher.refresh();
        const second = watcher.refresh();
        // Both share the one follow-up poll, and nothing runs beside the poll in flight.
        expect(second).toBe(first);
        expect(queueCalls(runner)).toBe(1);
        held.settle({ stdout: ANSWER, stderr: '', code: 0 });
        expect(await Promise.all([first, second])).toEqual([undefined, undefined]);
        expect(queueCalls(runner)).toBe(2);
        watcher.close();
    });
    it('publishes nothing when the poll in flight lands after the watcher closed', async () => {
        const hub = new Hub();
        const gated = gate();
        const runner = gatedRunner(gated.answer);
        const watcher = watchHpc(hub, { ...options, runner });
        const inFlight = watcher.refresh();
        const version = hub.version('hpc');
        watcher.close();
        gated.settle({ stdout: ANSWER, stderr: '', code: 0 });
        await inFlight;
        expect(hub.version('hpc')).toBe(version);
        expect(held(hub).status).toBe('starting');
        expect(held(hub).jobs).toEqual([]);
    });
    it.each([
        ['the remote script never ran', '', 'ssh exited 255'],
        ['the queue query failed', `${SEC_RC}1@@\n${SEC_SACCT}\n${SEC_SINFO}`, 'squeue: error']
    ])('retries after the short cadence when %s', async (_what, stdout, stderr) => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = vi.fn<Runner>((_host, remote) =>
            Promise.resolve(
                remote.startsWith('quota')
                    ? { stdout: '', stderr: '', code: 0 }
                    : { stdout, stderr: stderr === 'ssh exited 255' ? '' : stderr, code: 255 }
            )
        );
        const watcher = watchHpc(hub, { ...options, runner });
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(queueCalls(runner)).toBe(1);
            expect(held(hub).status).toBe('unreachable');
            expect(held(hub).hint).toBe(stderr);
            await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE - 1);
            expect(queueCalls(runner)).toBe(1);
            await vi.advanceTimersByTimeAsync(1);
            expect(queueCalls(runner)).toBe(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });
    it('keeps the last good rows under a failed poll and names when they were read', async () => {
        const hub = new Hub();
        const cluster = { up: true };
        const runner = swingingRunner(cluster);
        const watcher = watchHpc(hub, { ...options, runner });
        await watcher.refresh();
        const good = held(hub);
        expect(good.status).toBe('ok');
        expect(good.jobs).toHaveLength(1);
        expect(good.recent).toHaveLength(1);
        expect(good.lastOk).toBe(good.updated);
        cluster.up = false;
        await watcher.refresh();
        const down = held(hub);
        expect(down.status).toBe('unreachable');
        expect(down.jobs).toEqual(good.jobs);
        expect(down.recent).toEqual(good.recent);
        expect(down.sinfo).toEqual(good.sinfo);
        expect(down.running).toBe(good.running);
        expect(down.lastOk).toBe(good.lastOk);
        watcher.close();
        const fresh = watchHpc(hub, { ...options, runner });
        const started = held(hub);
        fresh.close();
        expect(started.status).toBe('starting');
        expect(started.jobs).toEqual([]);
        expect(started.recent).toEqual([]);
        expect(started.lastOk).toBeUndefined();
    });
});
