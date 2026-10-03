// The run of `ps` that reads the process table. The child is a double that the case drives, so the
// time limit, the abort, the bound on the output and the exit status are exercised with no real
// `ps`, no read of the machine's process table and no signal sent to a process of the machine.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadFailure } from '../../../../src/lib/server/machine/processes/failure.ts';
import { readTable } from '../../../../src/lib/server/machine/processes/ps.ts';
import { ChildDouble } from '../../../fixtures/doubles.ts';

/** How the run starts its child, as the run's options name it. */
type PsStart = NonNullable<NonNullable<Parameters<typeof readTable>[0]>['start']>;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A start that hands out one double per call and records what it was given. */
function starter(): {
    start: PsStart;
    children: ChildDouble[];
    calls: { file: string; args: string[]; env: NodeJS.ProcessEnv }[];
} {
    const children: ChildDouble[] = [];
    const calls: { file: string; args: string[]; env: NodeJS.ProcessEnv }[] = [];
    const start: PsStart = (file, args, env) => {
        calls.push({ file, args, env });
        const child = new ChildDouble();
        children.push(child);
        return child;
    };
    return { start, children, calls };
}

const A = '  100     1 axel       1.5  2048 Wed Sep 30 08:15:42 2026 zsh -c x';
const B = '  200   100 axel       0.0  4096 Wed Sep 30 08:16:00 2026 node y.js';

/** The failure a read rejects with. */
async function failureOf(pending: Promise<unknown>): Promise<ReadFailure> {
    const error: unknown = await pending.then(
        () => undefined,
        (reason: unknown) => reason
    );
    expect(error).toBeInstanceOf(ReadFailure);
    return error as ReadFailure;
}

describe('the run', () => {
    it('starts ps once with the column list as an argument list, in the C locale', async () => {
        const probe = starter();
        const pending = readTable({ start: probe.start, env: { PATH: '/bin', LC_ALL: 'nl_NL' } });
        probe.children[0].write(`${A}\n`);
        probe.children[0].end(0);
        await pending;
        expect(probe.calls).toEqual([
            {
                file: 'ps',
                args: ['-axww', '-o', 'pid=,ppid=,user=,pcpu=,rss=,lstart=,command='],
                env: { PATH: '/bin', LC_ALL: 'C' }
            }
        ]);
    });

    it('reads the rows of lines that arrive split anywhere, the last without a line end', async () => {
        const probe = starter();
        const pending = readTable({ start: probe.start });
        const [child] = probe.children;
        child.write(A.slice(0, 20));
        child.write(`${A.slice(20)}\n${B.slice(0, 5)}`);
        child.write(B.slice(5));
        child.end(0);
        const rows = await pending;
        expect(rows.map((row) => [row.pid, row.ppid, row.command])).toEqual([
            [100, 1, 'zsh -c x'],
            [200, 100, 'node y.js']
        ]);
    });

    it('leaves out a line that does not read and keeps the rest', async () => {
        const probe = starter();
        const pending = readTable({ start: probe.start });
        probe.children[0].write(`not a row\n${A}\n`);
        probe.children[0].end(0);
        expect((await pending).map((row) => row.pid)).toEqual([100]);
    });

    it('answers an empty table for a child that printed nothing and exited 0', async () => {
        const probe = starter();
        const pending = readTable({ start: probe.start });
        probe.children[0].end(0);
        expect(await pending).toEqual([]);
        expect(probe.children[0].kills).toEqual([]);
    });

    it('leaves no timer behind after a read that ends', async () => {
        const probe = starter();
        const pending = readTable({ start: probe.start });
        probe.children[0].write(`${A}\n`);
        probe.children[0].end(0);
        await pending;
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('a run that fails', () => {
    it('kills the child at the time limit and fails with the seconds it was given', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        await vi.advanceTimersByTimeAsync(10000 - 1);
        expect(probe.children[0].kills).toEqual([]);
        await vi.advanceTimersByTimeAsync(1);
        const failure = await pending;
        expect([failure.reason, failure.detail]).toEqual(['timeout', 10]);
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does nothing more for output that comes after the kill', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start, timeoutMs: 50 }));
        await vi.advanceTimersByTimeAsync(50);
        await pending;
        probe.children[0].write(`${A}\n`);
        probe.children[0].end(0);
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect(probe.children).toHaveLength(1);
    });

    it('kills the child when the signal is aborted and fails as cancelled', async () => {
        const probe = starter();
        const controller = new AbortController();
        const pending = failureOf(readTable({ start: probe.start, signal: controller.signal }));
        controller.abort();
        expect((await pending).reason).toBe('cancelled');
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('starts no child for a signal that is aborted already', async () => {
        const probe = starter();
        const controller = new AbortController();
        controller.abort();
        const failure = await failureOf(
            readTable({ start: probe.start, signal: controller.signal })
        );
        expect(failure.reason).toBe('cancelled');
        expect(probe.children).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('kills the child that prints past the bound on its output', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start, maxOutput: 100 }));
        probe.children[0].write('x'.repeat(60));
        expect(probe.children[0].kills).toEqual([]);
        probe.children[0].write('x'.repeat(60));
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect((await pending).reason).toBe('output');
    });

    it('fails with the exit status of a child that exited with one', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        probe.children[0].write(`${A}\n`);
        probe.children[0].end(2);
        const failure = await pending;
        expect([failure.reason, failure.detail]).toEqual(['status', 2]);
    });

    it('fails with the signal of a child that a signal ended', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        probe.children[0].end(null, 'SIGTERM');
        const failure = await pending;
        expect([failure.reason, failure.detail]).toEqual(['status', 'SIGTERM']);
    });

    it('fails as output when a child exited 0 with text and no line that reads', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        probe.children[0].write('ps: something unexpected\n');
        probe.children[0].end(0);
        expect((await pending).reason).toBe('output');
    });

    it('fails as start when the program cannot be started, whether it throws or reports', async () => {
        const throwing: PsStart = () => {
            throw new Error('spawn ps ENOENT');
        };
        expect((await failureOf(readTable({ start: throwing }))).reason).toBe('start');

        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        probe.children[0].emit('error', new Error('spawn ps ENOENT'));
        expect((await pending).reason).toBe('start');
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
    });

    it('fails as output when the stream of the child fails', async () => {
        const probe = starter();
        const pending = failureOf(readTable({ start: probe.start }));
        probe.children[0].stdout.emit('error', new Error('broken pipe'));
        expect((await pending).reason).toBe('output');
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
    });
});
