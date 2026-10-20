// Layer 2, server. The run record of the schedules: one machine-local file,
// `~/.oculus/schedule.json`, holding for each schedule, by its name, the cron pattern it was last
// read with, since when, the newest due time handled, and its latest runs, each a scheduled,
// catch-up or hand run that started, was skipped or failed. A key of the file that no schedule
// holds is kept by every write and is not shown.
//
// The file is read through readJsonChecked and written whole by a rename, then read back: a
// missing file is made by the first write, and a file that does not read
// (not JSON, or an entry not of this shape) is never written over, so what the reader put there
// stays and no scheduled run starts while it does not read. The entries are held in a Map keyed by
// the name as written, so a schedule named `__proto__`, `constructor` or `toString` has its own
// entry like any other. Every change takes `schedule.json.lock` first (a file opened with `wx`),
// reads the file again under it and writes once, so two oculus servers that share one home start
// one run per due time. A lock older than a minute is taken over with one stderr line, and a
// younger one is waited on for a short while.

import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { ScheduleRun } from '../../../../data/model/index.ts';
import {
    dropLock,
    readJsonChecked,
    takeLock,
    writeTextAtomic,
    type LockWaits
} from '../../../core/json.ts';

/** The mode of the file: it names the runs of this machine. */
const FILE_MODE = 0o600;

/** How many runs the record keeps for each schedule, the oldest dropped by the next one. */
const RUNS_KEPT = 20;

/**
 * The wait between two tries of a lock another process holds, the longest total wait, and the age
 * at which a lock file is taken to be left by a process that is gone: a change holds the lock for
 * one read and one write with no wait between them, so a lock a minute old is held by no change. A
 * save waits two seconds at most, too short to say whom it waits for.
 */
const LOCK_WAITS: LockWaits = { retryMs: 50, waitMs: 2000, staleMs: 60_000, tellWait: false };

/** How a run was started. */
export type RunTrigger = ScheduleRun['trigger'];

/** One schedule's entry of the record. */
export type ScheduleLog = {
    /**
     * The cron pattern the entry was last read with: the `when` of a schedule that is not paused
     * and has no problem, and empty otherwise.
     */
    pattern: string;
    /** When that pattern was first read: no due time before it is caught up. */
    since: string;
    /** The newest due time a run was decided for, or null while none was. */
    handled: string | null;
    /** The latest runs, newest first. */
    runs: ScheduleRun[];
};

/** The entries the record holds, by the name of the schedule as written. */
type ScheduleLogs = Map<string, ScheduleLog>;

/** The record as the file holds it: every entry, the ones no schedule holds included. */
export type Loaded = { ok: true; logs: ScheduleLogs } | { ok: false; reason: string };

/** ~/.oculus/schedule.json, resolved at the call rather than at import. */
export function defaultRecordPath(): string {
    return join(homedir(), '.oculus', 'schedule.json');
}

const runShape = z.object({
    trigger: z.enum(['schedule', 'catch-up', 'hand']),
    due: z.string().nullable(),
    at: z.string(),
    outcome: z.enum(['started', 'skipped', 'failed']),
    terminal: z.string().nullable(),
    why: z.object({ word: z.string(), names: z.array(z.string()) }).optional()
}) satisfies z.ZodType<ScheduleRun>;

const logShape = z.object({
    pattern: z.string(),
    since: z.string(),
    handled: z.string().nullable(),
    runs: z.array(runShape)
}) satisfies z.ZodType<ScheduleLog>;

/** The file as it stands: empty when it is not there, and the reason when it does not read. */
export function loadRecord(file: string): Loaded {
    const read = readJsonChecked(file);
    if (!read.ok) return { ok: false, reason: read.reason };
    const logs: ScheduleLogs = new Map();
    if (read.value === undefined) return { ok: true, logs };
    if (!isMap(read.value)) return { ok: false, reason: 'is not a map' };
    for (const [name, raw] of Object.entries(read.value)) {
        const log = logShape.safeParse(raw);
        if (!log.success)
            return { ok: false, reason: `holds an entry of ${name} of the wrong shape` };
        logs.set(name, log.data);
    }
    return { ok: true, logs };
}

/** Why a change did not happen. */
type Refused = { ok: false; why: 'unread' | 'locked' | 'unwritable'; reason: string };

/** What a change answers: the value its work gave, or why it did not run. */
export type Outcome<T> = { ok: true; value: T } | Refused;

/** What the work of a change answers: its value, and whether the entries are to be written. */
type Change<T> = { value: T; write: boolean };

/**
 * The text of the file for these entries. The object is made with no prototype, so a name such as
 * `__proto__` is an own key that JSON.stringify writes like any other.
 */
function recordText(logs: ScheduleLogs): string {
    const whole: Record<string, ScheduleLog> = Object.create(null) as Record<string, ScheduleLog>;
    for (const [name, log] of logs) whole[name] = log;
    return `${JSON.stringify(whole, null, 4)}\n`;
}

/**
 * Read the record under its lock, let `work` change the entries it is handed, and write them back
 * whole when `work` says to, keeping every entry the file holds. A file that does not read is not
 * written over, a lock that stays taken is not waited on for ever, and a write that does not read
 * back as written is refused.
 */
async function change<T>(
    file: string,
    work: (logs: ScheduleLogs, now: Date) => Change<T>
): Promise<Outcome<T>> {
    const lock = `${file}.lock`;
    try {
        mkdirSync(dirname(file), { recursive: true });
    } catch (error) {
        return { ok: false, why: 'unwritable', reason: String(error) };
    }
    const taken = await takeLock(lock, LOCK_WAITS, 'schedule record');
    if (!taken.ok) return taken;
    try {
        const loaded = loadRecord(file);
        if (!loaded.ok) return { ok: false, why: 'unread', reason: loaded.reason };
        const done = work(loaded.logs, new Date());
        if (!done.write) return { ok: true, value: done.value };
        const content = recordText(loaded.logs);
        try {
            writeTextAtomic(file, content, FILE_MODE);
            if (readFileSync(file, 'utf8') !== content) {
                throw new Error('what was read back is not what was written');
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { ok: false, why: 'unwritable', reason };
        }
        return { ok: true, value: done.value };
    } finally {
        dropLock(lock);
    }
}

/** The runs of a schedule with `run` newest, the oldest dropped past RUNS_KEPT. */
function withRun(runs: ScheduleRun[], run: ScheduleRun): ScheduleRun[] {
    return [run, ...runs].slice(0, RUNS_KEPT);
}

/**
 * Read a schedule's pattern: when it differs from the one the entry holds (or the entry is not
 * there and the pattern is not empty), the entry is written again with `since` now and no due time
 * handled, so writing, changing, removing, pausing or resuming a pattern never catches up a due
 * time from before it. A schedule with no pattern and no entry writes nothing.
 */
export function readPattern(
    file: string,
    name: string,
    pattern: string
): Promise<Outcome<ScheduleLog | undefined>> {
    return change(file, (logs, now) => {
        const held = logs.get(name);
        if (held === undefined && pattern === '') return { value: undefined, write: false };
        if (held?.pattern === pattern) return { value: held, write: false };
        const next: ScheduleLog = {
            pattern,
            since: now.toISOString(),
            handled: null,
            runs: held?.runs ?? []
        };
        logs.set(name, next);
        return { value: next, write: true };
    });
}

/**
 * Decide a due time once: when `run.due` is later than the newest due time handled, it becomes the
 * handled one and `run` is kept, and the answer is `claimed`; otherwise nothing is written and the
 * answer is `handled`.
 */
export function claimDue(
    file: string,
    name: string,
    pattern: string,
    run: ScheduleRun
): Promise<Outcome<'claimed' | 'handled'>> {
    return change(file, (logs) => {
        const held = logs.get(name) ?? { pattern, since: run.at, handled: null, runs: [] };
        const due = Date.parse(run.due ?? '');
        if (held.handled !== null && Date.parse(held.handled) >= due) {
            return { value: 'handled' as const, write: false };
        }
        logs.set(name, { ...held, handled: run.due, runs: withRun(held.runs, run) });
        return { value: 'claimed' as const, write: true };
    });
}

/** Keep a run that was not decided for a due time, such as a Run now. */
export function appendRun(file: string, name: string, run: ScheduleRun): Promise<Outcome<true>> {
    return change(file, (logs, now) => {
        const held = logs.get(name) ?? {
            pattern: '',
            since: now.toISOString(),
            handled: null,
            runs: []
        };
        logs.set(name, { ...held, runs: withRun(held.runs, run) });
        return { value: true as const, write: true };
    });
}

/** What a started run learns once its terminal is there, or the refusal that failed it. */
export type Settle = { terminal: string } | { failed: { word: string; names: string[] } };

/**
 * Settle the run kept as started for `trigger` and `at`: it takes its terminal, or becomes a failed
 * run with the refusal. A run is found by its trigger and its time, since a Run now has no due
 * time to tell two of them apart; only a run still waiting for its terminal is settled.
 */
export function settleRun(
    file: string,
    name: string,
    key: { trigger: RunTrigger; at: string },
    settle: Settle
): Promise<Outcome<boolean>> {
    return change(file, (logs) => {
        const held = logs.get(name);
        const at = held?.runs.findIndex(
            (one) =>
                one.trigger === key.trigger &&
                one.at === key.at &&
                one.outcome === 'started' &&
                one.terminal === null
        );
        if (held === undefined || at === undefined || at < 0) {
            return { value: false, write: false };
        }
        const runs = [...held.runs];
        runs[at] =
            'terminal' in settle
                ? { ...runs[at], terminal: settle.terminal }
                : { ...runs[at], outcome: 'failed', why: settle.failed };
        logs.set(name, { ...held, runs });
        return { value: true, write: true };
    });
}

/** What a save of the schedules file does to the record's entries. */
export type RecordMove =
    /** A new schedule under a name: any entry the record holds under it is dropped. */
    | { drop: string }
    /** An entry renamed: its runs and its handled time move with it, over an entry under `to`. */
    | { rename: { from: string; to: string } };

/**
 * Hold the record's lock across `commit`, the write of the schedules file that makes the move
 * needed: the record is read first and `commit` runs only when it reads, then the entry is dropped
 * or moved. A lock that stays taken or a record that does not read answers before `commit` runs, so
 * nothing is written; the value is false when `commit` answered false, which changes nothing.
 * Nothing is written to the record when it holds no entry the move is about.
 */
export function moveRecord(
    file: string,
    move: RecordMove,
    commit: () => boolean
): Promise<Outcome<boolean>> {
    return change(file, (logs) => {
        if (!commit()) return { value: false, write: false };
        if ('drop' in move) return { value: true, write: logs.delete(move.drop) };
        const held = logs.get(move.rename.from);
        if (held === undefined || move.rename.from === move.rename.to) {
            return { value: true, write: false };
        }
        logs.delete(move.rename.from);
        logs.set(move.rename.to, held);
        return { value: true, write: true };
    });
}
