// Layer 2, server test support. The runners and answers the HPC poller's tests share: a queue
// answer, runners that swing, hold or prewarm, and a gate that holds a call in flight.

import { vi, type Mock } from 'vitest';
import type { HpcPayload } from '../../../../src/lib/data/model/index.ts';
import type { Hub } from '../../../../src/lib/server/core/channels.ts';
import { SEC_RC, SEC_SACCT, SEC_SINFO } from '../../../../src/lib/server/machine/hpc/parse.ts';
import type { RunResult, Runner } from '../../../../src/lib/server/machine/hpc/ssh.ts';

export const options = { host: 'fixture', days: 3, pollMin: 20, quotaMin: 60, prewarm: true };
export const MINUTE = 60000;
/**
 * One queued job, one finished job and one partition, in the shape the batch command answers with.
 */
export const ANSWER = `1|x|cpu|RUNNING|1|2|1|1||1G|1||n\n${SEC_RC}0@@\n${SEC_SACCT}\n9|y|COMPLETED|0:0|10:00|2026-09-11T10:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}\ncpu|up|1|idle|(null)`;

/** The payload the hub currently holds on the hpc channel. */
export function held(hub: Hub): HpcPayload {
    return hub.latest('hpc')?.payload as HpcPayload;
}

/**
 * A runner whose queue answer is whatever `cluster.up` says at the moment it is called, so one
 * watcher can be taken down and brought back inside a case. Quota always answers nothing.
 */
export function swingingRunner(cluster: { up: boolean }): Mock<Runner> {
    return vi.fn<Runner>((_host, remote) =>
        remote.startsWith('quota')
            ? Promise.resolve({ stdout: '', stderr: '', code: 0 })
            : cluster.up
              ? Promise.resolve({ stdout: ANSWER, stderr: '', code: 0 })
              : Promise.reject(new Error('timeout'))
    );
}

/** How many times the queue command, and neither the quota read nor a prewarm query, was run. */
export function queueCalls(runner: Mock<Runner>): number {
    return runner.mock.calls.filter((call) => call[1].startsWith('squeue')).length;
}

/** How many times the prewarm asked the cluster anything, over both of its queries. */
export function prewarmCalls(runner: Mock<Runner>): number {
    return runner.mock.calls.filter(
        (call) => call[1].startsWith('sacct') || call[1].includes('@@oculus:wd=')
    ).length;
}

/** A promise the case settles when it chooses, so a poll can be held in flight. */
export function gate(): { answer: Promise<RunResult>; settle: (value: RunResult) => void } {
    let settle: (value: RunResult) => void = () => {
        throw new Error('the gate was settled before its promise existed');
    };
    const answer = new Promise<RunResult>((resolve) => (settle = resolve));
    return { answer, settle: (value) => settle(value) };
}

/** A runner whose queue command waits on the gate and whose quota command answers nothing. */
export function gatedRunner(answer: Promise<RunResult>): Mock<Runner> {
    return vi.fn<Runner>((_host, remote) =>
        remote.startsWith('quota') ? Promise.resolve({ stdout: '', stderr: '', code: 0 }) : answer
    );
}
/** Two finished jobs in the queue answer, which is what the prewarm has to resolve. */
export const TWO_FINISHED = ANSWER.replace(
    SEC_SINFO,
    `10|z|COMPLETED|0:0|10:00|2026-09-11T09:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}`
);

/** A queue answer whose third finished row is a job that is still finishing. */
export const WITH_COMPLETING = TWO_FINISHED.replace(
    SEC_SINFO,
    `11|w|COMPLETING|0:0|10:00|2026-09-11T08:00:00|1G|512M|1:00|1|1|600\n${SEC_SINFO}`
);

/** One working directory holding the jobs' logs, on the second rung. */
export const LISTING = [
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

export const NOTHING: RunResult = { stdout: '', stderr: '', code: 0 };

/**
 * A runner that answers all four commands: the queue batch (whatever `cluster.up` says at the
 * moment it is called, so a case can take the cluster down), the quota read with nothing, and the
 * prewarm's two queries. `listing` holds the directory walk until the case settles it, which is how
 * a case presses a refresh while a prewarm is in flight.
 */
export function prewarmRunner(
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
