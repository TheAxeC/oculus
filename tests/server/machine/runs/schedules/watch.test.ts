// Layer 4, server test. The schedules over the real start (schedules/run.ts), a recording tmux
// double, scratch files and a fake clock: a due time starts one run, however the server met it. No
// case reaches tmux or `claude`: every watcher is handed the recording tmux as its runner, a stub
// path as the Claude program and the three scratch paths of its world, and no case reads
// `local.yml` or the home folder. Every clock is set a week before the real day or earlier, so a
// lock file's real modification time is never older than the fake `now`, and each case ends by
// checking that no write took over a lock. What this does not cover: the autumn change of a
// repeated hour, the page's reading of the payload, and the tmux of a real machine.
// @module-tag slow: a due-time row runs over the 5 s limit on a loaded machine.

import { afterEach, beforeEach, describe, expect, vi, type MockInstance } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { loadRecord } from '../../../../../src/lib/server/machine/runs/schedules/record.ts';
import type { SchedulesWatcher } from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import {
    entryText,
    plantRecord,
    plantSchedules,
    watcherOver,
    world,
    type Kind,
    type World
} from './schedules-fixture.ts';

/** The terminal of the schedule's earlier run, by what ran in it. */
const EARLIER: Record<'task' | 'command', string> = {
    task: 'aabbcc-claude',
    command: 'aabbcc-shell'
};

/** The real day, read before any test installs the fake clock. */
const TODAY = new Date();

/** A local time seven days before the real day, `days` days after it. */
function local(days: number, hour: number, minute = 0, second = 0): Date {
    const day = new Date(TODAY);
    day.setDate(day.getDate() - 7 + days);
    day.setHours(hour, minute, second, 0);
    return day;
}

const open: SchedulesWatcher[] = [];

let complaints: MockInstance<typeof console.error>;

beforeEach(() => {
    vi.useFakeTimers({ now: local(0, 6, 59, 50) });
    complaints = vi.spyOn(console, 'error');
});

/** Close every watcher a case opened, so the next scenario of the case starts with no timer. */
function closeAll(): void {
    for (const watcher of open.splice(0)) watcher.close();
}

afterEach(() => {
    closeAll();
    vi.useRealTimers();
    const lines = complaints.mock.calls.map((call) => String(call[0]));
    complaints.mockRestore();
    expect(lines.filter((line) => line.includes('took over'))).toEqual([]);
});

/** What the schedule's earlier terminal looks like on the `sessions` channel. */
type Listed = { kind: 'task' | 'command'; session: 'busy' | 'waiting' | 'idle' | 'none' | 'ended' };

/** Publish the `sessions` payload the case's terminals and registry records make. */
function publishSessions(hub: Hub, listed: Listed | null): void {
    if (listed === null) {
        hub.publish('sessions', { records: [], workspaces: [], terminals: [] });
        return;
    }
    const id = EARLIER[listed.kind];
    const terminal =
        listed.kind === 'command'
            ? { id, pid: 4300, task: true, exit: listed.session === 'ended' ? 0 : null }
            : { id, pid: 4300, task: false, exit: null };
    const live = ['busy', 'waiting', 'idle'].includes(listed.session);
    hub.publish('sessions', {
        records: live ? [{ pid: 4300, liveStatus: listed.session }] : [],
        workspaces: [],
        terminals: [terminal]
    });
}

/** The run record's runs of the schedule, newest first. */
function runsOf(w: World): Record<string, unknown>[] {
    const loaded = loadRecord(w.files.record);
    return loaded.ok ? (loaded.logs.get('Weekly radar')?.runs ?? []) : [];
}

function started(driver: ReturnType<typeof tmux>): string[][] {
    return driver.calls.filter((args) => args.includes('new-session'));
}

/** A run the record holds as the schedule's earlier one, ended in the terminal of `kind`. */
function earlierRun(kind: 'task' | 'command'): object {
    return {
        trigger: 'schedule',
        due: local(-1, 7).toISOString(),
        at: local(-1, 7).toISOString(),
        outcome: 'started',
        terminal: EARLIER[kind]
    };
}

/** Let every promise the watcher is waiting on run, with the fake clock where it is. */
async function settle(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(200);
}

/** A world holding the schedule `Weekly radar` that runs `kind` every day at 07:00. */
function daily(kind: Kind): { w: World; hub: Hub; driver: ReturnType<typeof tmux> } {
    const w = world();
    plantSchedules(w, entryText(w, kind));
    return { w, hub: new Hub(), driver: tmux() };
}

function watch(w: World, hub: Hub, driver: ReturnType<typeof tmux>, table?: () => Promise<[]>) {
    const made = watcherOver(w, hub, driver, table);
    open.push(made);
    return made;
}

type Row = {
    name: string;
    kind: 'task' | 'command';
    /** When the watcher starts, and the due time the record holds as handled. */
    now: Date;
    handled: Date;
    /** The earlier run's terminal as the `sessions` channel lists it; none when it has no run. */
    listed: Listed | null;
    /** What the run record and tmux hold after the due time. */
    expected: {
        starts: number;
        killed: boolean;
        run: Record<string, unknown>;
    };
};

/** A catch-up row: the record says what was handled, and the server starts at `now`. */
function missed(name: string, now: Date, handled: Date, due: Date): Row {
    return {
        name,
        kind: 'task',
        now,
        handled,
        listed: null,
        expected: {
            starts: 1,
            killed: false,
            run: {
                trigger: 'catch-up',
                due: due.toISOString(),
                outcome: 'started',
                terminal: expect.any(String)
            }
        }
    };
}

/** A row for a due time that falls at 07:00 of the day the watcher starts just before. */
function due(
    name: string,
    kind: 'task' | 'command',
    session: Listed['session'],
    expected: Row['expected']
): Row {
    return {
        name,
        kind,
        now: local(0, 6, 59, 50),
        handled: local(-1, 7),
        listed: { kind, session },
        expected
    };
}

const SKIPPED = (kind: 'task' | 'command') => ({
    starts: 0,
    killed: false,
    run: {
        trigger: 'schedule',
        due: local(0, 7).toISOString(),
        outcome: 'skipped',
        terminal: EARLIER[kind]
    }
});

const RESTARTED = {
    starts: 1,
    killed: true,
    run: {
        trigger: 'schedule',
        due: local(0, 7).toISOString(),
        outcome: 'started',
        terminal: expect.any(String) as string
    }
};

const ROWS: Row[] = [
    missed(
        'a due time missed over half an hour of downtime',
        local(0, 7, 30),
        local(-1, 7),
        local(0, 7)
    ),
    missed(
        'the latest of the due times missed over three days',
        local(3, 9),
        local(0, 7),
        local(3, 7)
    ),
    due('a task whose session is busy', 'task', 'busy', SKIPPED('task')),
    due('a task whose session waits on a prompt', 'task', 'waiting', SKIPPED('task')),
    due('a task whose terminal no session matches', 'task', 'none', SKIPPED('task')),
    due('a command whose line is running', 'command', 'none', SKIPPED('command')),
    due('a task whose session is idle', 'task', 'idle', RESTARTED),
    due('a command whose line ended', 'command', 'ended', RESTARTED)
];

describe('watchSchedules', () => {
    it('starts a schedule once per due time', async () => {
        for (const row of ROWS) {
            const { w, hub, driver } = daily(row.kind);
            vi.setSystemTime(row.now);
            plantRecord(w, {
                handled: row.handled,
                since: local(-5, 8),
                runs: row.listed === null ? [] : [earlierRun(row.kind)]
            });
            publishSessions(hub, row.listed);
            watch(w, hub, driver);
            await vi.advanceTimersByTimeAsync(20_000);
            await settle();
            expect(started(driver), row.name).toHaveLength(row.expected.starts);
            const kills = driver.calls.filter((args) => args[0] === 'kill-session');
            expect(kills.length > 0, row.name).toBe(row.expected.killed);
            if (row.expected.killed) {
                const kill = driver.calls.findIndex((args) => args[0] === 'kill-session');
                const created = driver.calls.findIndex((args) => args.includes('new-session'));
                expect(driver.calls[kill], row.name).toEqual([
                    'kill-session',
                    '-t',
                    `oculus-${EARLIER[row.kind]}`
                ]);
                expect(created, row.name).toBeGreaterThan(kill);
            }
            expect(runsOf(w)[0], row.name).toMatchObject(row.expected.run);
            const loaded = loadRecord(w.files.record);
            const handled = row.expected.run.due as string;
            expect(loaded.ok && loaded.logs.get('Weekly radar')?.handled, row.name).toBe(handled);
            closeAll();
        }

        // A due time the record holds as handled is never started: after a restart, and from a
        // second watcher over the same record.
        const restarted = daily('task');
        vi.setSystemTime(local(0, 7, 30));
        plantRecord(restarted.w, { handled: local(0, 7), since: local(-5, 8) });
        publishSessions(restarted.hub, null);
        watch(restarted.w, restarted.hub, restarted.driver);
        await settle();
        expect(started(restarted.driver), 'after a restart').toHaveLength(0);
        expect(runsOf(restarted.w), 'after a restart').toEqual([]);
        closeAll();

        const shared = daily('task');
        const second = new Hub();
        vi.setSystemTime(local(0, 6, 59, 50));
        plantRecord(shared.w, { handled: local(-1, 7), since: local(-5, 8) });
        publishSessions(shared.hub, null);
        publishSessions(second, null);
        watch(shared.w, shared.hub, shared.driver);
        watch(shared.w, second, shared.driver);
        await vi.advanceTimersByTimeAsync(20_000);
        await settle();
        expect(started(shared.driver), 'from a second watcher').toHaveLength(1);
        expect(runsOf(shared.w), 'from a second watcher').toHaveLength(1);
        closeAll();

        // close() leaves no timer and starts nothing: with a job armed, and with a decision that
        // waits for the process table or for the first `sessions` payload.
        vi.setSystemTime(local(0, 6, 59, 50));
        const armed = daily('task');
        publishSessions(armed.hub, null);
        const first = watch(armed.w, armed.hub, armed.driver);
        await settle();
        first.close();
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        expect(vi.getTimerCount(), 'armed').toBe(0);
        expect(started(armed.driver), 'armed').toHaveLength(0);
        closeAll();

        vi.setSystemTime(local(0, 6, 59, 50));
        const waiting = daily('task');
        plantRecord(waiting.w, {
            handled: local(-1, 7),
            since: local(-5, 8),
            runs: [earlierRun('task')]
        });
        waiting.hub.publish('sessions', {
            records: [{ pid: 4301, liveStatus: 'idle' }],
            workspaces: [],
            terminals: [{ id: EARLIER.task, pid: 4300, task: false, exit: null }]
        });
        let answer: (table: []) => void = () => undefined;
        const table = new Promise<[]>((resolve) => {
            answer = resolve;
        });
        const awaiting = watch(waiting.w, waiting.hub, waiting.driver, () => table);
        await vi.advanceTimersByTimeAsync(20_000);
        awaiting.close();
        answer([]);
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        expect(vi.getTimerCount(), 'awaited table').toBe(0);
        expect(waiting.driver.calls.filter((args) => args[0] !== 'list-sessions')).toEqual([]);
        expect(runsOf(waiting.w), 'awaited table').toHaveLength(1);

        vi.setSystemTime(local(0, 6, 59, 50));
        const unlisted = daily('task');
        plantRecord(unlisted.w, {
            handled: local(-1, 7),
            since: local(-5, 8),
            runs: [earlierRun('task')]
        });
        let reads = 0;
        const third = watch(unlisted.w, unlisted.hub, unlisted.driver, () => {
            reads += 1;
            return Promise.resolve([]);
        });
        await vi.advanceTimersByTimeAsync(20_000);
        unlisted.hub.publish('sessions', {
            records: [{ pid: 4301, liveStatus: 'idle' }],
            workspaces: [],
            terminals: [{ id: EARLIER.task, pid: 4300, task: false, exit: null }]
        });
        third.close();
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        expect(reads, 'awaited sessions').toBe(0);
        expect(unlisted.driver.calls.filter((args) => args[0] !== 'list-sessions')).toEqual([]);
        expect(runsOf(unlisted.w), 'awaited sessions').toHaveLength(1);
        closeAll();

        // A close while the earlier idle terminal is being ended starts no run, and the claimed
        // run is recorded as failed because the server stopped.
        vi.setSystemTime(local(0, 6, 59, 50));
        const ending = daily('task');
        plantRecord(ending.w, {
            handled: local(-1, 7),
            since: local(-5, 8),
            runs: [earlierRun('task')]
        });
        publishSessions(ending.hub, { kind: 'task', session: 'idle' });
        let ended: () => void = () => undefined;
        const stopping = new Promise<void>((resolve) => {
            ended = resolve;
        });
        const asked: string[][] = [];
        const slow: ReturnType<typeof tmux> = {
            calls: ending.driver.calls,
            run: (args) => {
                if (args[0] !== 'kill-session') return ending.driver.run(args);
                asked.push(args);
                return stopping.then(() => ending.driver.run(args));
            }
        };
        const fourth = watch(ending.w, ending.hub, slow);
        await vi.advanceTimersByTimeAsync(20_000);
        expect(asked, 'the earlier terminal is being ended').toHaveLength(1);
        fourth.close();
        ended();
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        expect(vi.getTimerCount(), 'stop pending').toBe(0);
        expect(started(ending.driver), 'stop pending').toHaveLength(0);
        expect(runsOf(ending.w)[0], 'stop pending').toMatchObject({
            trigger: 'schedule',
            due: local(0, 7).toISOString(),
            outcome: 'failed',
            terminal: null,
            why: { word: 'server-stopped', names: [] }
        });
    });
});
