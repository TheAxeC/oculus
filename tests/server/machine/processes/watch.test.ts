// The Processes watcher: one payload per read on the `processes` channel, a read every ten seconds
// while the hub has a subscriber on the channel and none while it has not, the last good rows kept
// through a failed read, one read at a time, and nothing published or left running after close().
// The table, the tmux panes and lsof are injected, and the clock is faked; the cases over the `ps`
// child give the watcher the real table reader over a double child that the case drives.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessesPayload } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { Hub, type Sink } from '../../../../src/lib/server/core/channels.ts';
import { ReadFailure } from '../../../../src/lib/server/machine/processes/failure.ts';
import { readTable } from '../../../../src/lib/server/machine/processes/ps.ts';
import type { ReadDeps } from '../../../../src/lib/server/machine/processes/read.ts';
import type { Entry } from '../../../../src/lib/server/machine/processes/table.ts';
import {
    watchProcesses as watchWith,
    type ProcessesOptions
} from '../../../../src/lib/server/machine/processes/watch.ts';
import { ChildDouble, noop } from '../../../fixtures/doubles.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Milliseconds between two reads while a page is open. */
const READ_MS = 10 * 1000;

const TEXT = textCatalog(loadConfig(engineDir()).config);

/** The watcher over the catalog's own text; a case that words a failure otherwise passes `text`. */
function watchProcesses(
    hub: Hub,
    options: Omit<ProcessesOptions, 'text'> & Partial<Pick<ProcessesOptions, 'text'>>
) {
    return watchWith(hub, { text: TEXT, ...options });
}

function proc(pid: number, ppid: number, command: string, cpu = 0): Entry {
    return { pid, ppid, user: 'axel', started: '', cpu, memory: 1, command };
}

const TABLE = [proc(200, 1, 'claude --resume x', 3), proc(300, 1, 'node x.js', 1)];

/** A sink that records what it was sent, parsed. */
function recorder(): { sink: Sink; got: { channel: string; payload: ProcessesPayload }[] } {
    const got: { channel: string; payload: ProcessesPayload }[] = [];
    const sink: Sink = {
        send: (text) => {
            got.push(JSON.parse(text) as { channel: string; payload: ProcessesPayload });
            return Promise.resolve();
        },
        close: noop
    };
    return { sink, got };
}

type Control = {
    table: ReturnType<typeof vi.fn<ReadDeps['table']>>;
    folders: ReturnType<typeof vi.fn<ReadDeps['folders']>>;
    deps: ReadDeps;
};

/** Dependencies over a fixed table; `table` and `folders` are spies a case reads or replaces. */
function control(table: Entry[] = TABLE): Control {
    const read = vi.fn<ReadDeps['table']>(() => Promise.resolve(table));
    const folders = vi.fn<ReadDeps['folders']>(() => Promise.resolve(new Map()));
    return {
        table: read,
        folders,
        deps: {
            table: read,
            panes: () => Promise.resolve([]),
            folders,
            projects: () => []
        }
    };
}

function held(hub: Hub): ProcessesPayload {
    return hub.latest('processes')?.payload as ProcessesPayload;
}

/** A promise the case settles when it chooses. */
function gate<T>(): { promise: Promise<T>; settle: (value: T) => void } {
    let settle: (value: T) => void = noop;
    const promise = new Promise<T>((resolve) => (settle = resolve));
    return { promise, settle };
}

const patterns = (list: string[]) => ({ patterns: list });

describe('the cadence', () => {
    it('reads nothing while no page subscribes, however many ticks pass', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['claude'], deps: probe.deps });
        await vi.advanceTimersByTimeAsync(30 * 1000);
        expect(probe.table).not.toHaveBeenCalled();
        expect(hub.latest('processes')).toBeUndefined();
        watcher.close();
    });

    it('reads at once for the first subscriber, then every ten seconds', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['claude'], deps: probe.deps });
        await vi.advanceTimersByTimeAsync(3000);
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(READ_MS - 1000);
        expect(probe.table).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1000);
        expect(probe.table).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(probe.table).toHaveBeenCalledTimes(3);
        watcher.close();
    });

    it('starts no extra read for a second sink or a repeated subscribe message of the first', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['claude'], deps: probe.deps });
        const first = recorder();
        hub.subscribe(first.sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        hub.subscribe(first.sink, ['processes', 'config']);
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(1);
        watcher.close();
    });

    it('reads nothing in the next thirty seconds once the last subscriber is removed, and at once for the next first one', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['claude'], deps: probe.deps });
        const first = recorder();
        const second = recorder();
        hub.subscribe(first.sink, ['processes']);
        hub.subscribe(second.sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        hub.remove(first.sink);
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(probe.table).toHaveBeenCalledTimes(2);
        hub.remove(second.sink);
        await vi.advanceTimersByTimeAsync(30 * 1000);
        expect(probe.table).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(3);
        watcher.close();
    });
});

describe('the payload', () => {
    it('carries the status, the time, the rows, the agents and the projects of one good read', async () => {
        vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
        const hub = new Hub();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: control().deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toEqual({
            status: 'ok',
            updated: '2026-10-02T10:00:00.000Z',
            rows: [
                {
                    pid: 300,
                    ppid: 1,
                    user: 'axel',
                    started: '',
                    cpu: 1,
                    memory: 1,
                    command: 'node x.js',
                    folder: ''
                }
            ],
            agents: 1,
            projects: 0
        });
        watcher.close();
    });
});

describe('a read that fails', () => {
    it('publishes failed with the sentence and no rows on a first read that throws', async () => {
        const hub = new Hub();
        const probe = control();
        probe.table.mockRejectedValue(new ReadFailure('status', 2));
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toMatchObject({
            status: 'failed',
            rows: [],
            agents: 0,
            projects: 0,
            error: 'ps ended with status 2'
        });
        watcher.close();
    });

    it('holds rows of its own for each watcher before a first good read', async () => {
        const rowsOf = async (): Promise<ProcessesPayload['rows']> => {
            const hub = new Hub();
            const probe = control();
            probe.table.mockRejectedValue(new ReadFailure('status', 2));
            const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
            hub.subscribe(recorder().sink, ['processes']);
            await vi.advanceTimersByTimeAsync(0);
            watcher.close();
            return held(hub).rows;
        };
        const [first, second] = [await rowsOf(), await rowsOf()];
        expect(first).toEqual([]);
        expect(first).not.toBe(second);
    });

    it('keeps the rows of the last good read through a failed one, and reads again at the next tick', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        const good = held(hub);
        expect(good.rows).toHaveLength(1);

        probe.table.mockRejectedValueOnce(new ReadFailure('status', 2));
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(held(hub)).toMatchObject({
            status: 'failed',
            rows: good.rows,
            agents: good.agents,
            projects: good.projects,
            error: 'ps ended with status 2'
        });

        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(probe.table).toHaveBeenCalledTimes(3);
        expect(held(hub).status).toBe('ok');
        expect(held(hub)).not.toHaveProperty('error');
        watcher.close();
    });
});

describe('the sentence of a failure', () => {
    it.each<[ReadFailure['reason'], string | number, string]>([
        ['timeout', 10, 'the process table did not answer within 10 seconds'],
        ['start', '', 'ps could not be started'],
        ['status', 'SIGTERM', 'ps ended with status SIGTERM'],
        ['output', '', 'the output of ps could not be read'],
        ['empty', '', 'the process table is empty'],
        ['cancelled', '', 'the read was stopped']
    ])('words a %s failure from the catalog', async (reason, detail, sentence) => {
        const hub = new Hub();
        const probe = control();
        probe.table.mockRejectedValue(new ReadFailure(reason, detail));
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toMatchObject({ status: 'failed', error: sentence });
        watcher.close();
    });

    it('words an error that is no ReadFailure with the general sentence, never its own message', async () => {
        const hub = new Hub();
        const probe = control();
        probe.table.mockRejectedValue(new Error('spawn ps ENOENT in /Users/axel'));
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toMatchObject({
            status: 'failed',
            error: 'the processes could not be read'
        });
        watcher.close();
    });

    it('words the next failure from a catalog it was given by setText', async () => {
        const hub = new Hub();
        const probe = control();
        probe.table.mockRejectedValue(new ReadFailure('empty'));
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toMatchObject({ error: 'the process table is empty' });
        watcher.setText({ ...TEXT, 'processes.failed_empty': 'de tabel is leeg' });
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(held(hub)).toMatchObject({ status: 'failed', error: 'de tabel is leeg' });
        watcher.close();
    });
});

const LINE = '  100     1 axel       1.5  2048 Wed Sep 30 08:15:42 2026 node x.js';

/**
 * Dependencies whose table is the real reader over doubles, one per run it starts, each run given
 * `timeoutMs` before its child is killed.
 */
function psControl(timeoutMs = 10 * 1000): { children: ChildDouble[]; deps: ReadDeps } {
    const children: ChildDouble[] = [];
    const start: NonNullable<NonNullable<Parameters<typeof readTable>[0]>['start']> = () => {
        const child = new ChildDouble();
        children.push(child);
        return child;
    };
    const deps: ReadDeps = {
        ...control().deps,
        table: (signal) =>
            readTable({ start, timeoutMs, ...(signal === undefined ? {} : { signal }) })
    };
    return { children, deps };
}

describe('the ps child of a read', () => {
    it('publishes failed for a child that never answers, at the time limit, with the child killed', async () => {
        const hub = new Hub();
        const probe = psControl();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(10 * 1000 - 1);
        expect(hub.latest('processes')).toBeUndefined();
        expect(probe.children[0].kills).toEqual([]);
        await vi.advanceTimersByTimeAsync(1);
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect(held(hub)).toMatchObject({
            status: 'failed',
            error: 'the process table did not answer within 10 seconds'
        });
        watcher.close();
    });

    it('starts no second child while a killed one has not closed, and one at the tick after it closed', async () => {
        const hub = new Hub();
        const probe = psControl();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(10 * 1000);
        expect(probe.children).toHaveLength(1);
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        await vi.advanceTimersByTimeAsync(30 * 1000);
        expect(probe.children).toHaveLength(1);
        probe.children[0].end(null, 'SIGKILL');
        await vi.advanceTimersByTimeAsync(10 * 1000);
        expect(probe.children).toHaveLength(2);
        watcher.close();
    });

    it('starts no second child on any tick while one runs, however many ticks pass', async () => {
        const hub = new Hub();
        const probe = psControl(55 * 1000);
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(50 * 1000);
        expect(probe.children).toHaveLength(1);
        expect(probe.children[0].kills).toEqual([]);
        await vi.advanceTimersByTimeAsync(5 * 1000);
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        expect(probe.children).toHaveLength(1);
        probe.children[0].end(null, 'SIGKILL');
        await vi.advanceTimersByTimeAsync(5 * 1000);
        expect(probe.children).toHaveLength(2);
        watcher.close();
    });

    it('kills the child at close() and publishes nothing after it', async () => {
        const hub = new Hub();
        const probe = psControl();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        const page = recorder();
        hub.subscribe(page.sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.children[0].kills).toEqual([]);
        watcher.close();
        expect(probe.children[0].kills).toEqual(['SIGKILL']);
        probe.children[0].stdout.emit('data', `${LINE}\n`);
        probe.children[0].emit('close', 0, null);
        await vi.advanceTimersByTimeAsync(60 * 1000);
        expect(page.got).toEqual([]);
        expect(hub.latest('processes')).toBeUndefined();
        expect(probe.children).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('publishes the rows of a child that answers', async () => {
        const hub = new Hub();
        const probe = psControl();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        probe.children[0].stdout.emit('data', `${LINE}\n`);
        probe.children[0].emit('close', 0, null);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).rows.map((row) => row.pid)).toEqual([100]);
        expect(probe.children[0].kills).toEqual([]);
        watcher.close();
    });
});

describe('one read at a time', () => {
    it('starts no second read while one is in flight, and reads again at the tick after it ends', async () => {
        const hub = new Hub();
        const probe = control();
        const hold = gate<Map<number, string>>();
        probe.folders.mockReturnValueOnce(hold.promise);
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(35 * 1000);
        expect(probe.table).toHaveBeenCalledTimes(1);
        hold.settle(new Map());
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).status).toBe('ok');
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(probe.table).toHaveBeenCalledTimes(2);
        watcher.close();
    });

    it('publishes nothing after close() and leaves no timer, and aborts the read in flight', async () => {
        const hub = new Hub();
        const probe = control();
        const hold = gate<Map<number, string>>();
        probe.folders.mockReturnValueOnce(hold.promise);
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        const page = recorder();
        hub.subscribe(page.sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        const signal = probe.folders.mock.calls[0][1];
        expect(signal?.aborted).toBe(false);

        watcher.close();
        expect(signal?.aborted).toBe(true);
        hold.settle(new Map());
        await vi.advanceTimersByTimeAsync(60 * 1000);
        expect(hub.latest('processes')).toBeUndefined();
        expect(page.got).toEqual([]);
        expect(probe.table).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('starts no read for a first subscriber after close()', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        watcher.close();
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(30 * 1000);
        expect(probe.table).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('closes twice without harm', () => {
        const watcher = watchProcesses(new Hub(), { patterns: [], deps: control().deps });
        watcher.close();
        watcher.close();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('patterns changed by a config push', () => {
    it('lists the rows of the new patterns at the next read and none of the old', async () => {
        const hub = new Hub();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: control().deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).rows.map((row) => row.pid)).toEqual([300]);

        watcher.set(patterns(['claude']));
        await vi.advanceTimersByTimeAsync(READ_MS);
        expect(held(hub).rows.map((row) => row.pid)).toEqual([200]);
        watcher.close();
    });

    it('shows no row of the old list under a failed read of the new one', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).rows.map((row) => row.pid)).toEqual([300]);

        probe.table.mockRejectedValueOnce(new ReadFailure('status', 2));
        watcher.set(patterns(['claude']));
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub)).toMatchObject({ status: 'failed', rows: [], agents: 0, projects: 0 });
        watcher.close();
    });

    it('reads again at once for a changed list, and for an unchanged one does nothing', async () => {
        const hub = new Hub();
        const probe = control();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(recorder().sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        watcher.set(patterns(['node']));
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(1);
        watcher.set(patterns(['claude']));
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(2);
        watcher.close();
    });

    it('reads nothing for a changed list while no page subscribes', async () => {
        const probe = control();
        const watcher = watchProcesses(new Hub(), { patterns: ['node'], deps: probe.deps });
        watcher.set(patterns(['claude']));
        await vi.advanceTimersByTimeAsync(30 * 1000);
        expect(probe.table).not.toHaveBeenCalled();
        watcher.close();
    });

    it('drops the result of a read in flight and publishes a fresh read of the new list', async () => {
        const hub = new Hub();
        const probe = control();
        const hold = gate<Map<number, string>>();
        probe.folders.mockReturnValueOnce(hold.promise);
        const page = recorder();
        const watcher = watchProcesses(hub, { patterns: ['node'], deps: probe.deps });
        hub.subscribe(page.sink, ['processes']);
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(1);

        watcher.set(patterns(['claude']));
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(1);
        expect(page.got).toEqual([]);

        hold.settle(new Map());
        await vi.advanceTimersByTimeAsync(0);
        expect(probe.table).toHaveBeenCalledTimes(2);
        expect(page.got).toHaveLength(1);
        expect(page.got[0].payload.rows.map((row) => row.pid)).toEqual([200]);
        watcher.close();
    });
});
