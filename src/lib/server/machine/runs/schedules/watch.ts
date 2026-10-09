// Layer 2, server. The schedules. Each entry of `schedules.yml` in the hub's `.oculus` folder that
// has a cron pattern, is not paused and has no problem has one croner job, in the local time zone;
// at each due time the entry starts what it runs (schedules/run.ts), unless its earlier run is
// still working. The watcher publishes one complete payload on the `schedule` channel after every
// change of a job, of the run record or of one of the files it reads.
//
// The file and the saved commands file are read at start and again on every change of either, and
// through `reload()` after the route's write. A reload stops the job of an entry that went, became
// paused, got a problem or changed its `when`, starts the job of one that came or changed, and
// keeps the rest; a run in progress is left going. A file that does not read stops every job.
//
// A due time is decided once. The run record (schedules/record.ts) keeps the newest due time
// handled per schedule, and a decision writes it under the record's lock before anything starts, so
// a due time that was handled never starts again, after a restart or from a second oculus server
// over the same home. A due time missed while the server was down starts one catch-up run at the
// next start; the ones before it start nothing. A pattern first read, changed, removed, paused or
// resumed never catches up a due time from before it. Croner's timer skips a due time that falls
// in the hour the clocks skip, and the watcher also looks for a due time every half minute, so
// that run starts at the first look after its moved due time (03:30 for a 02:30) instead of
// waiting for the next day, and never before that time.
//
// One run of a schedule works at a time. The schedule's earlier run is the terminal of the newest
// run in the record that has one. It is working while that terminal is listed on the `sessions`
// channel and, for a task or a prompt, the Claude session in it is not idle (the session is the
// registry record whose pid is the terminal's pane pid or a process under it), or, for a command,
// its line has not ended. A working earlier run makes the due time start nothing and be recorded
// as skipped. An idle or ended one is closed, oculus having started that terminal itself, and the
// new run starts. A decision waits for the first `sessions` payload that lists terminals, so a
// terminal that outlived a restart of the server is seen. A due time that arrives while a decision
// waits is not decided on its own: the newest one replaces the waiting due time, so the payload's
// arrival starts one run for the latest due time. Only a due time that arrives after the claim is
// written and while the start is awaited is recorded as skipped.
//
// A Run now follows the same rule, handles no due time, and runs a paused or Off entry.

import { mkdirSync, watch, type FSWatcher } from 'node:fs';
import { basename, dirname } from 'node:path';
import { Cron } from 'croner';
import { z } from 'zod';
import type {
    ScheduleEntry,
    SchedulePayload,
    ScheduleRow,
    ScheduleRun
} from '../../../../data/model/index.ts';
import type { Hub, Sink } from '../../../core/channels.ts';
import type { Entry } from '../../processes/table.ts';
import { readAllSaved } from '../commands/saved.ts';
import { readSchedules, type Disk, type Reading } from './file.ts';
import {
    appendRun,
    claimDue,
    loadRecord,
    readPattern,
    settleRun,
    type RunTrigger,
    type ScheduleLog,
    type Settle
} from './record.ts';
import type { RunAnswer } from './run.ts';
import { SCHEDULED_SIZE } from './task.ts';

/** The channel the payload is published on. */
const CHANNEL = 'schedule';

/** Milliseconds between two checks for a due time croner's timer did not wake for. */
const CHECK_MS = 30_000;

/** What the watcher needs of the world beyond the hub. */
export type SchedulesOptions = {
    /** The schedules file, the run record and the saved commands file. */
    files: { schedules: string; record: string; commands: string };
    /** The directories the file browser serves, read at the call. */
    rootsFor: () => string[];
    /** The machine's configuration, read at the call: the hub folder. */
    local: () => { hub: string };
    /** Start what an entry runs, in a terminal of the given grid. */
    run: (entry: ScheduleEntry, size: { cols: number; rows: number }) => Promise<RunAnswer>;
    /** End a terminal oculus started. */
    stop: (terminal: string) => Promise<void>;
    /** The machine's process table, read when a terminal's session is not found by its pane pid. */
    table: () => Promise<Entry[]>;
    /** Re-read the terminal manager after a start or a stop. */
    refresh: () => void;
};

/** What a Run now answers: the terminal it started, the run it skipped, or why it was refused. */
type RunNowAnswer =
    { terminal: string } | { skipped: string | null } | { refused: string; names: string[] };

export type SchedulesWatcher = {
    /** Read the files again and start, stop or keep each job by what they now hold. */
    reload(): void;
    /** Start the entry of that name now, by the one-run rule. */
    runNow(name: string): Promise<RunNowAnswer>;
    /** Stop every job. Nothing starts and nothing is published after it. */
    close(): void;
};

/** The parts of the `sessions` payload this module reads. */
const sessionsShape = z.object({
    records: z.array(z.object({ pid: z.number().nullable(), liveStatus: z.string().nullable() })),
    terminals: z
        .array(
            z.object({
                id: z.string(),
                pid: z.number(),
                task: z.boolean().optional(),
                exit: z.number().nullable().optional()
            })
        )
        .optional()
});

/**
 * How many due times before a moment `dueAt` looks through: the due times of a minute pattern that
 * croner moves out of an hour the clocks skip, one per minute of that hour, can all lie after it.
 */
const LOOKBACK = 61;

/** The span `walkedDueAt` first walks over, in milliseconds, and the factor it widens by. */
const WALK_FIRST_MS = 90_000;
const WALK_GROWTH = 4;
/** The longest span `walkedDueAt` walks over: a 29 February pattern that also names a weekday. */
const WALK_LAST_MS = 30 * 366 * 86_400_000;

/**
 * The newest due time of a job at or before `now` found by walking croner's forward runs from a
 * moment before `now`, the span widening until a run falls inside it, or undefined when it has
 * none.
 */
function walkedDueAt(job: Cron, now: Date): Date | undefined {
    const end = now.getTime();
    for (let span = WALK_FIRST_MS; ; span *= WALK_GROWTH) {
        const first = job.nextRun(new Date(end - span));
        if (first !== null && first.getTime() <= end) return lastRunUpTo(job, first, end);
        if (span > WALK_LAST_MS) return undefined;
    }
}

/**
 * The last run of a job at or before `end`, from `run`, a run at or before it. No run lies after
 * `upper` and at or before `end`; each turn either moves to a run past the middle of what is left
 * or halves it, so a pattern that runs every minute of a month takes a few dozen of croner's
 * forward walks, never one per run.
 */
function lastRunUpTo(job: Cron, run: Date, end: number): Date {
    let latest = run;
    let upper = end;
    for (;;) {
        const after = job.nextRun(latest);
        if (after === null || after.getTime() > end) return latest;
        latest = after;
        const middle = Math.floor((latest.getTime() + upper) / 2);
        if (middle <= latest.getTime()) continue;
        const probe = job.nextRun(new Date(middle));
        if (probe !== null && probe.getTime() <= end) latest = probe;
        else upper = middle;
    }
}

/**
 * The newest due time of a job at or before `now`, or undefined when it has none. Croner answers
 * "before" in whole seconds, so a `now` inside the second of a due time still sees the one before
 * it; asking from the start of the next second gives the due time that second holds. On the day
 * the clocks skip an hour croner answers the due times inside that hour, moved after it (a 02:30
 * as 03:30), from the start of the hour, so a due time later than `now` is passed over. Croner's
 * backward walk throws for some patterns the pattern rule accepts (`0 0 29 2 *`, `0 7 29 2 *`,
 * `0 0 30 1-2 *`); the due time of such a job is found by `walkedDueAt`. A pattern croner cannot
 * walk either way has no due time and is worded once, so a failure of croner never stops the
 * server.
 */
function dueAt(job: Cron, now: Date, unreadable: Set<string>): Date | undefined {
    try {
        try {
            const ask = new Date(Math.floor(now.getTime() / 1000) * 1000 + 1000);
            return job.previousRuns(LOOKBACK, ask).find((due) => due.getTime() <= now.getTime());
        } catch {
            return walkedDueAt(job, now);
        }
    } catch (error) {
        const pattern = job.getPattern() ?? '';
        if (!unreadable.has(pattern)) {
            unreadable.add(pattern);
            const reason = error instanceof Error ? error.message : String(error);
            console.error(
                `schedule: the due time of the pattern ${pattern} was not found: ${reason}`
            );
        }
        return undefined;
    }
}

/** Whether the process `pid` is `root` or has it among its ancestors in the table. */
function under(table: Entry[], root: number, pid: number): boolean {
    const parents = new Map(table.map((entry) => [entry.pid, entry.ppid]));
    for (let at: number | undefined = pid, steps = 0; at !== undefined; steps += 1) {
        if (at === root) return true;
        if (steps > table.length) return false;
        at = parents.get(at);
    }
    return false;
}

/** What a schedule's earlier run is doing: gone, or listed and idle (or ended) or working. */
type Earlier = { state: 'gone' } | { state: 'idle' | 'working'; terminal: string };

export function watchSchedules(hub: Hub, options: SchedulesOptions): SchedulesWatcher {
    const files = options.files;
    let closed = false;
    /** Read through a call, so a check before an await never stands in for the one after it. */
    const stopped = (): boolean => closed;
    /** The last read of the schedules file. */
    let current: Reading = { ok: true, rows: [], commandsUnread: false };
    /** The pattern each named entry was last applied with, empty when it does not run. */
    const patterns = new Map<string, string>();
    /** The entry each running schedule starts, as the last read holds it. */
    const entries = new Map<string, ScheduleEntry>();
    const jobs = new Map<string, Cron>();
    /** The newest due time of each job a decision was made for or that was taken as past. */
    const seen = new Map<string, number>();
    /** The patterns whose due time could not be found at all, each worded once. */
    const unreadable = new Set<string>();
    /** The schedules with a decision or a start in progress. */
    const deciding = new Set<string>();
    /**
     * The schedules whose claim is written and whose start is awaited; a due time then is skipped.
     */
    const starting = new Set<string>();
    /**
     * The newest due time that arrived while the schedule's decision had not written its claim,
     * which the decision takes in place of its own, or a later decision takes if this one starts
     * nothing.
     */
    const pending = new Map<string, { trigger: RunTrigger; due: Date; pattern: string }>();
    let lastPublished = '';
    let recordSaid = false;
    let fileSaid = false;

    const disk = (): Disk => ({
        hub: options.local().hub,
        roots: options.rootsFor(),
        commands: files.commands
    });

    // ---- the payload -----------------------------------------------------------------------

    const payload = (): SchedulePayload => {
        const record = loadRecord(files.record);
        if (!record.ok && !recordSaid) {
            recordSaid = true;
            console.error(
                `schedule record: ${files.record} ${record.reason}; no scheduled run starts while it does not read`
            );
        }
        if (record.ok) recordSaid = false;
        const saved = readAllSaved(files.commands);
        const rows: ScheduleRow[] = current.ok
            ? current.rows.map((row) => ({
                  at: row.at,
                  name: row.name,
                  entry: row.entry,
                  problem: row.problem,
                  unchosen: row.unchosen,
                  next: jobs.get(row.name)?.nextRun()?.toISOString() ?? null,
                  runs:
                      (record.ok && row.name !== '' ? record.logs.get(row.name)?.runs : null) ?? []
              }))
            : [];
        const unread: SchedulePayload['unread'] = [];
        if (!current.ok) unread.push({ file: 'schedules', line: current.line });
        if (!record.ok) unread.push({ file: 'record', line: null });
        if (!saved.ok) unread.push({ file: 'commands', line: null });
        const roots = [options.local().hub, ...options.rootsFor()];
        return {
            schedules: rows,
            commands: saved.ok ? saved.commands : [],
            folders: roots.filter((root, at) => roots.indexOf(root) === at),
            unread
        };
    };

    /** Publish the payload when it differs from the last one published. */
    const publish = (): void => {
        if (stopped()) return;
        const next = payload();
        const encoded = JSON.stringify(next);
        if (encoded === lastPublished) return;
        lastPublished = encoded;
        hub.publish(CHANNEL, next);
    };

    // ---- the sessions payload ----------------------------------------------------------------

    const sessionsNow = (): z.infer<typeof sessionsShape> | null => {
        const parsed = sessionsShape.safeParse(hub.latest('sessions')?.payload);
        return parsed.success && parsed.data.terminals !== undefined ? parsed.data : null;
    };

    let stopWaiting = (): void => undefined;
    /** Settles once a `sessions` payload that lists terminals has been published. */
    const sessionsReady = new Promise<void>((resolve) => {
        if (sessionsNow() !== null) {
            resolve();
            return;
        }
        const waiting: Sink = {
            send() {
                if (sessionsNow() !== null) {
                    hub.remove(waiting);
                    resolve();
                }
                return Promise.resolve();
            },
            close() {
                // The hub never closes a sink it did not open; there is no socket behind this one.
            }
        };
        hub.subscribe(waiting, ['sessions'], false);
        stopWaiting = () => hub.remove(waiting);
    });

    /**
     * What the schedule's earlier run is doing now: `gone` when it has no terminal or that terminal
     * is not listed, `idle` or `working` when it is listed. A command's terminal is working while
     * its line runs and idle once the line ended; any other terminal is working while the Claude
     * session in it is not idle.
     */
    const earlierRun = async (log: ScheduleLog | undefined): Promise<Earlier> => {
        const terminalId = log?.runs.find((run) => run.terminal !== null)?.terminal ?? null;
        const sessions = sessionsNow();
        if (terminalId === null || sessions === null) return { state: 'gone' };
        const listed = sessions.terminals?.find((one) => one.id === terminalId);
        if (listed === undefined) return { state: 'gone' };
        if (listed.task === true) {
            return {
                state: listed.exit === null || listed.exit === undefined ? 'working' : 'idle',
                terminal: terminalId
            };
        }
        let session = sessions.records.find((one) => one.pid === listed.pid);
        if (session === undefined) {
            const table = await options.table().catch(() => []);
            session = sessions.records.find(
                (one) => one.pid !== null && under(table, listed.pid, one.pid)
            );
        }
        const idle = session?.liveStatus === 'idle';
        return { state: idle ? 'idle' : 'working', terminal: terminalId };
    };

    // ---- one due time ------------------------------------------------------------------------

    /** A run as the claim keeps it before the start answers. */
    const runFor = (
        trigger: RunTrigger,
        due: Date | null,
        outcome: ScheduleRun['outcome'],
        terminal: string | null
    ): ScheduleRun => ({
        trigger,
        due: due === null ? null : due.toISOString(),
        at: new Date().toISOString(),
        outcome,
        terminal
    });

    /** Record a due time that arrived while the schedule's own start was awaited as skipped. */
    const skipWhileStarting = async (
        name: string,
        trigger: RunTrigger,
        due: Date
    ): Promise<void> => {
        const claimed = await claimDue(
            files.record,
            name,
            patterns.get(name) ?? '',
            runFor(trigger, due, 'skipped', null)
        );
        if (!claimed.ok) console.error(`schedule: ${name} ${due.toISOString()}: ${claimed.reason}`);
        publish();
    };

    /**
     * Settle a run the claim kept as failed because the server closed before its start, so the row
     * shows that the due time did not run rather than a run that started with no terminal.
     */
    const settleStopped = async (name: string, run: ScheduleRun): Promise<void> => {
        const kept = await settleRun(
            files.record,
            name,
            { trigger: run.trigger, at: run.at },
            { failed: { word: 'server-stopped', names: [] } }
        );
        if (!kept.ok) {
            console.error(`schedule record: a run of ${name} was not settled: ${kept.reason}`);
        }
    };

    /**
     * Close an idle earlier terminal, start the entry, and settle the run the claim kept: it takes
     * the terminal, or becomes a failed run with the word that refused it. A server that closed
     * before the start, while the earlier terminal was being ended or while the run was being
     * kept, starts nothing and settles the run as stopped. Answers what the start answered.
     */
    const launch = async (
        name: string,
        entry: ScheduleEntry | undefined,
        earlier: Earlier,
        run: ScheduleRun
    ): Promise<RunAnswer> => {
        if (earlier.state === 'idle') {
            await options.stop(earlier.terminal).catch((error: unknown) => {
                const reason = error instanceof Error ? error.message : String(error);
                console.error(`schedule: ${name}: the earlier terminal was not ended: ${reason}`);
            });
            options.refresh();
        }
        if (stopped()) {
            await settleStopped(name, run);
            return { refused: 'server-stopped', names: [] };
        }
        let answer: RunAnswer;
        if (entry === undefined) answer = { refused: 'entry-changed', names: [] };
        else {
            answer = await options
                .run(entry, SCHEDULED_SIZE)
                .catch(() => ({ refused: 'terminal-failed', names: [] }));
        }
        const settle: Settle =
            'terminal' in answer
                ? { terminal: answer.terminal.id }
                : { failed: { word: answer.refused, names: answer.names } };
        const kept = await settleRun(
            files.record,
            name,
            { trigger: run.trigger, at: run.at },
            settle
        );
        if (!kept.ok) {
            console.error(`schedule record: a run of ${name} was not settled: ${kept.reason}`);
        }
        options.refresh();
        return answer;
    };

    /** Take the due time held while a decision of the schedule ran, if any: decide it next. */
    const decideHeld = (name: string): void => {
        const next = pending.get(name);
        if (next === undefined) return;
        pending.delete(name);
        if (!stopped()) void decide(name, next.trigger, next.due);
    };

    /**
     * Decide one due time of a schedule: claim it and start the run, or claim it as skipped while
     * the schedule's earlier run is working. A due time that arrives while an earlier decision of
     * the schedule has not written its claim (it waits for the first `sessions` payload, or reads
     * the earlier run) is held, and the newest one is decided in place of the older. A pattern
     * changed or emptied while the decision waits ends it; a held due time of the old pattern is
     * dropped, and one of the new pattern is decided next.
     */
    const decide = async (name: string, trigger: RunTrigger, due: Date): Promise<void> => {
        if (stopped()) return;
        const pattern = patterns.get(name) ?? '';
        if (deciding.has(name)) {
            if (starting.has(name)) {
                await skipWhileStarting(name, trigger, due);
                return;
            }
            const held = pending.get(name);
            if (held?.pattern !== pattern || due.getTime() > held.due.getTime()) {
                pending.set(name, { trigger, due, pattern });
            }
            return;
        }
        deciding.add(name);
        try {
            await sessionsReady;
            if (stopped()) return;
            const loaded = loadRecord(files.record);
            if (!loaded.ok) {
                publish();
                return;
            }
            const earlier = await earlierRun(loaded.logs.get(name));
            if (stopped()) return;
            const now = patterns.get(name) ?? '';
            if (now !== pattern) {
                if (pending.get(name)?.pattern !== now) pending.delete(name);
                return;
            }
            const working = earlier.state === 'working' ? earlier : null;
            const newest = pending.get(name);
            if (newest !== undefined) {
                pending.delete(name);
                trigger = newest.trigger;
                due = newest.due;
            }
            const run = runFor(
                trigger,
                due,
                working === null ? 'started' : 'skipped',
                working?.terminal ?? null
            );
            const claimed = await claimDue(files.record, name, pattern, run);
            if (!claimed.ok) {
                console.error(`schedule: ${name} ${due.toISOString()}: ${claimed.reason}`);
                return;
            }
            publish();
            if (claimed.value === 'handled' || working !== null) return;
            if (stopped()) {
                await settleStopped(name, run);
                return;
            }
            starting.add(name);
            const late = pending.get(name);
            if (late !== undefined) {
                pending.delete(name);
                void skipWhileStarting(name, late.trigger, late.due);
            }
            await launch(name, entries.get(name), earlier, run);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.error(
                `schedule: ${name} ${due.toISOString()}: the run did not start: ${reason}`
            );
        } finally {
            deciding.delete(name);
            starting.delete(name);
            publish();
            decideHeld(name);
        }
    };

    // ---- one schedule's job ------------------------------------------------------------------

    /**
     * Decide the newest due time of a schedule's job that no decision has seen yet. Croner's timer
     * calls it at a due time, and the check below calls it every half minute, because croner's
     * timer skips a due time inside a daylight saving gap (a daily 02:30 on the day the clocks
     * jump from 02:00 to 03:00) while its pattern still answers 03:30 for that day; a due time
     * seen by one path is not decided again by the other.
     */
    const consider = (name: string): void => {
        const job = jobs.get(name);
        if (stopped() || job === undefined) return;
        const due = dueAt(job, new Date(), unreadable);
        if (due !== undefined && due.getTime() > (seen.get(name) ?? 0)) {
            seen.set(name, due.getTime());
            void decide(name, 'schedule', due);
        }
        publish();
    };

    /**
     * Take a schedule's pattern: replace its job, keep the record's entry and catch up one run. An
     * empty pattern is a schedule that does not run: its job goes and the record's entry is read
     * with no pattern, so a later pattern is read as new.
     */
    const apply = async (name: string, pattern: string): Promise<void> => {
        jobs.get(name)?.stop();
        jobs.delete(name);
        patterns.set(name, pattern);
        let job: Cron | undefined;
        if (pattern !== '') {
            try {
                job = new Cron(pattern, { mode: '5-part' }, () => consider(name));
                jobs.set(name, job);
                seen.set(name, Date.now());
            } catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                console.error(`schedule: ${name}: the pattern ${pattern} was not read: ${reason}`);
            }
        }
        publish();
        const read = await readPattern(files.record, name, job === undefined ? '' : pattern);
        if (stopped() || jobs.get(name) !== job || patterns.get(name) !== pattern) return;
        publish();
        if (!read.ok || read.value === undefined || job === undefined) return;
        const missed = dueAt(job, new Date(), unreadable);
        const after = Math.max(
            read.value.handled === null ? 0 : Date.parse(read.value.handled),
            Date.parse(read.value.since)
        );
        if (missed !== undefined && missed.getTime() > after) {
            seen.set(name, Math.max(seen.get(name) ?? 0, missed.getTime()));
            await decide(name, 'catch-up', missed);
        }
    };

    // ---- the files ---------------------------------------------------------------------------

    const reload = (): void => {
        if (stopped()) return;
        const read = readSchedules(files.schedules, disk());
        current = read;
        if (!read.ok) {
            if (!fileSaid) {
                fileSaid = true;
                const at = read.line === null ? '' : ` at line ${read.line}`;
                console.error(`schedules: ${files.schedules} does not read${at}; no schedule runs`);
            }
            for (const job of jobs.values()) job.stop();
            jobs.clear();
            patterns.clear();
            entries.clear();
            publish();
            return;
        }
        fileSaid = false;
        const wanted = new Map<string, string>();
        for (const row of read.rows) {
            if (row.entry === null || row.name === '') continue;
            const runs = row.problem === null && !row.entry.paused && row.entry.when !== '';
            if (runs) entries.set(row.name, row.entry);
            else entries.delete(row.name);
            wanted.set(row.name, runs ? row.entry.when : '');
        }
        for (const name of [...patterns.keys()]) {
            if (wanted.has(name)) continue;
            jobs.get(name)?.stop();
            jobs.delete(name);
            patterns.delete(name);
            entries.delete(name);
        }
        for (const [name, pattern] of wanted) {
            if (patterns.get(name) !== pattern) void apply(name, pattern);
        }
        publish();
    };

    // A press of Run now, a run the schedule settles and a second server all write the record, and
    // an editor or the route writes the schedules file; the folders are watched so every one of
    // them reaches the page. A file is replaced by a rename, so the folder is the thing to watch.
    const folders = new Map<string, FSWatcher>();
    const onChange = (file: string | null): void => {
        if (file === null || file === basename(files.record)) publish();
        if (
            file === null ||
            file === basename(files.schedules) ||
            file === basename(files.commands)
        ) {
            reload();
        }
    };
    for (const folder of new Set(Object.values(files).map((file) => dirname(file)))) {
        try {
            mkdirSync(folder, { recursive: true });
            const handle = watch(folder, { persistent: false }, (_event, file) => onChange(file));
            handle.on('error', () => undefined);
            folders.set(folder, handle);
        } catch {
            // a folder that cannot be watched is read at start and after the route's writes
        }
    }

    const check = setInterval(() => {
        for (const name of [...jobs.keys()]) consider(name);
    }, CHECK_MS);
    check.unref();

    // ---- Run now -----------------------------------------------------------------------------

    const runNow = async (name: string): Promise<RunNowAnswer> => {
        if (stopped()) return { refused: 'entry-changed', names: [] };
        const read = readSchedules(files.schedules, disk());
        if (!read.ok) return { refused: 'schedules-unread', names: [] };
        const row = read.rows.find((one) => one.entry !== null && one.name === name);
        const entry = row?.entry ?? null;
        if (row === undefined || entry === null) return { refused: 'entry-changed', names: [] };
        if (row.problem !== null) {
            return { refused: row.problem.word, names: row.problem.names };
        }
        const first = loadRecord(files.record);
        if (!first.ok) return { refused: 'record-unread', names: [] };
        const keep = async (run: ScheduleRun): Promise<boolean> => {
            const kept = await appendRun(files.record, name, run);
            if (!kept.ok)
                console.error(`schedule record: a run of ${name} was not kept: ${kept.reason}`);
            publish();
            return kept.ok;
        };
        if (deciding.has(name)) {
            if (!(await keep(runFor('hand', null, 'skipped', null)))) {
                return { refused: 'record-unread', names: [] };
            }
            return { skipped: null };
        }
        deciding.add(name);
        try {
            await sessionsReady;
            if (stopped()) return { refused: 'entry-changed', names: [] };
            const loaded = loadRecord(files.record);
            if (!loaded.ok) return { refused: 'record-unread', names: [] };
            const earlier = await earlierRun(loaded.logs.get(name));
            if (stopped()) return { refused: 'entry-changed', names: [] };
            if (earlier.state === 'working') {
                if (!(await keep(runFor('hand', null, 'skipped', earlier.terminal)))) {
                    return { refused: 'record-unread', names: [] };
                }
                return { skipped: earlier.terminal };
            }
            starting.add(name);
            const run = runFor('hand', null, 'started', null);
            if (!(await keep(run))) return { refused: 'record-unread', names: [] };
            const answer = await launch(name, entry, earlier, run);
            return 'terminal' in answer
                ? { terminal: answer.terminal.id }
                : { refused: answer.refused, names: answer.names };
        } finally {
            deciding.delete(name);
            starting.delete(name);
            publish();
            decideHeld(name);
        }
    };

    reload();

    return {
        reload,
        runNow,
        close(): void {
            closed = true;
            for (const job of jobs.values()) job.stop();
            jobs.clear();
            stopWaiting();
            clearInterval(check);
            for (const handle of folders.values()) handle.close();
        }
    };
}
