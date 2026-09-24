// Layer 2, server. The launch note: the builders a launcher started as processes of their own, and
// the session each one belongs under.
//
// A builder that is a native subagent is named by its parent's transcript; one started as a process
// (a Codex worker, or `claude -p`) is named nowhere its parent wrote. The launcher therefore writes
// one record per launch into `~/.oculus/dispatches.json` through bin/dispatch-note.mjs, and this
// reads it back: every record whose `parent` is a session's id joins that session's `agents`.
//
// A record may carry the builder's pid and the start time `ps` printed for it in UTC. A pid is
// reused by unrelated processes, so the builder counts as running only while that pid runs with
// that start time, asked through the registry's probe (signal 0 and `ps`), the one way oculus asks
// the system about a process; no other signal is ever sent to a recorded pid. A launch whose pid a
// scan sees running another process is stamped ended in the note itself (stampEnded), through the
// note writer's own lock and rename, so it reads done for good: no later scan asks about it again.
// The stamp tries the lock once and never waits for it, since a scan runs on the server's one
// thread; until a stamp is written the watcher remembers the launch as ended, and each scan tries
// the stamp again.
//
// The writer replaces the file by a rename, so a read never meets half a write; a hand edit can
// leave anything in it, though, so a missing, empty or garbled file reads as no records and a
// record without an id, a parent or a known harness is left out.

import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SessionAgent, SessionRecord } from '../../../data/model.ts';
import { PROC_START_SLACK, parseStamp } from '../registry.ts';
import { update } from '../../../../../bin/dispatch-note.mjs';
import { isMap, list, readJson, text } from './json.ts';

/** The harnesses a launch may name, which are the two session stores oculus reads. */
export const HARNESSES = ['claude', 'codex'];

/** The prefix a dispatched builder's agent id carries, so it never meets a subagent's id. */
export const DISPATCH_PREFIX = 'dispatch:';

/**
 * One launch, as bin/dispatch-note.mjs writes it. Every field but `pid` is a string, and empty
 * means unknown; `pid` is 0 when the launcher gave none, and `pidStart` is then empty.
 */
export type DispatchNote = {
    id: string;
    launcher: string;
    label: string;
    harness: string;
    model: string;
    parent: string;
    cwd: string;
    transcript: string;
    startedAt: string;
    endedAt: string;
    /** The builder's process id, or 0. */
    pid: number;
    /** That process's start time as `ps -o lstart=` printed it under the C locale and in UTC. */
    pidStart: string;
};

/** A recorded pid, or 0 for anything but a whole number above zero. */
function pidOf(value: unknown): number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

/** ~/.oculus/dispatches.json, resolved at the call rather than at import. */
export function defaultDispatchesPath(): string {
    return join(homedir(), '.oculus', 'dispatches.json');
}

/**
 * Every usable record of the note, in file order. A record repeating an id already read is left
 * out, so one launch is one row however the file was edited.
 */
export function readDispatches(path: string): DispatchNote[] {
    const notes: DispatchNote[] = [];
    const seen = new Set<string>();
    for (const item of list(readJson(path))) {
        if (!isMap(item)) continue;
        const note: DispatchNote = {
            id: text(item.id),
            launcher: text(item.launcher),
            label: text(item.label),
            harness: text(item.harness),
            model: text(item.model),
            parent: text(item.parent),
            cwd: text(item.cwd),
            transcript: text(item.transcript),
            startedAt: text(item.startedAt),
            endedAt: text(item.endedAt),
            pid: pidOf(item.pid),
            pidStart: text(item.pidStart)
        };
        if (!note.id || !note.parent || !HARNESSES.includes(note.harness)) continue;
        if (seen.has(note.id)) continue;
        seen.add(note.id);
        notes.push(note);
    }
    return notes;
}

/**
 * One launch as a row of its parent's agents. `child` is the builder's own session record when the
 * scan holds it: the row then opens it, falls back to its model, and for a Codex builder carries
 * its token totals, which the rollout fold assigns from the last usage event it read.
 *
 * The launcher's `end` stamp says the builder is done. Without one, a record carrying the
 * builder's pid follows that process: `builderLive` says whether it still runs, and the row reads
 * running while it does and done once it does not, whatever the launcher and the builder's session
 * read. A record without a pid (`builderLive` null) has no process witness. Its launcher, while its
 * own session is live, will still stamp the end, so the row reads running: a builder's session is
 * no witness while its launcher lives, since a Codex session reads not live after two minutes with
 * its rollout unwritten, which a builder inside a long command often is. Once the launcher's
 * session is not live, a builder whose own session the scan holds is running while that session is
 * live and done once it is not, which keeps a row from reading running for good after its launcher
 * died before stamping the end; a builder the scan does not hold reads running until the stamp.
 *
 * The row's end is the launcher's stamp. Without one it is the builder's own session's last
 * activity when that session is what read it done, and unknown when its process is.
 */
export function dispatchedAgent(
    note: DispatchNote,
    child: SessionRecord | null,
    launcherLive: boolean,
    builderLive: boolean | null
): SessionAgent {
    const unwitnessed = !launcherLive && child !== null && !child.live;
    const done = note.endedAt !== '' || (builderLive === null ? unwitnessed : !builderLive);
    // Unstamped, a builder read done by its own session ended at that session's last activity; one
    // read done by its process leaves no time of its own, since a rollout can fall silent long
    // before the process exits, so its end stays unknown until the launcher stamps it.
    const byChild = done && builderLive === null ? (child?.lastActivity ?? null) : null;
    const ended = note.endedAt !== '' ? note.endedAt : byChild;
    return {
        id: `${DISPATCH_PREFIX}${note.id}`,
        description: note.label,
        subagentType: note.launcher,
        model: note.model !== '' ? note.model : (child?.model ?? null),
        started: note.startedAt || null,
        ended,
        status: done ? 'done' : 'running',
        resultChars: 0,
        dispatch: {
            launcher: note.launcher,
            harness: note.harness,
            cwd: note.cwd,
            transcript: note.transcript,
            session: child?.id ?? null,
            tokens: child !== null && child.tool === 'codex' ? { ...child.tokens } : null
        }
    };
}

/**
 * What the probe says of the recorded process: it runs as the builder, it is gone, or its pid runs
 * another process, which is a reuse. As in the registry, a start time `ps` did not give, or a
 * recorded one that does not parse, leaves the running pid as the only witness.
 */
function builderState(
    note: DispatchNote,
    running: boolean,
    actual: number | undefined
): 'running' | 'gone' | 'reused' {
    if (!running) return 'gone';
    const recorded = parseStamp(note.pidStart);
    if (actual === undefined || recorded === null) return 'running';
    // The writer asks `ps` in UTC, so the stamp's UTC reading is the moment, whatever zone the
    // launcher and the server run in; `actual` is the probe's epoch seconds.
    return Math.abs(recorded.utc - actual) <= PROC_START_SLACK ? 'running' : 'reused';
}

/**
 * The launches whose builder's process is watched: a pid recorded, no end stamp, and started at
 * `since` or later, the scan's window, so a note that keeps its unstamped records for good does not
 * grow the work of every scan; a launch older than the window reads as one without a pid.
 */
export function pendingBuilders(notes: readonly DispatchNote[], since = 0): DispatchNote[] {
    return notes.filter(
        (note) => note.pid > 0 && note.endedAt === '' && !(Date.parse(note.startedAt) < since)
    );
}

/** builderProcesses's answer: the process witness of each pending launch, and the reused ones. */
export type Builders = {
    /** Note id to whether its builder's process still runs; a note left out has no witness. */
    live: Map<string, boolean>;
    /** The pending launches whose pid runs another process now, sorted. */
    reused: string[];
};

/**
 * Note id to whether its builder's process still runs, for every pending launch. `running` holds
 * the pids that answered the probe's signal 0 and `starts` the probe's start times, one answer a
 * scan shares with the registry so `ps` runs once. The launches whose pid runs another process are
 * named as well, for stampEnded.
 */
export function builderProcesses(
    pending: readonly DispatchNote[],
    running: ReadonlySet<number>,
    starts: ReadonlyMap<number, number>
): Builders {
    const live = new Map<string, boolean>();
    const reused: string[] = [];
    for (const note of pending) {
        const state = builderState(note, running.has(note.pid), starts.get(note.pid));
        if (state === 'reused') reused.push(note.id);
        live.set(note.id, state === 'running');
    }
    return { live, reused: reused.sort() };
}

/**
 * Stamp each launch ended in the note at `path`, each at its own moment from `stamps`, through
 * bin/dispatch-note.mjs's own locked read-change-write, keeping a stamp already there, and answer
 * whether the write went through. A launch whose pid runs another process has no builder left and
 * cannot get one back under that record, and a later scan whose `ps` gives no start time would
 * otherwise take the running pid for the builder again. The lock is tried once and never waited
 * for: a lock another writer holds leaves the stamp to the caller's next try.
 */
export function stampEnded(path: string, stamps: ReadonlyMap<string, string>): boolean {
    if (stamps.size === 0) return true;
    try {
        update(
            path,
            (records: Record<string, unknown>[]) => {
                for (const record of records) {
                    const stamp = typeof record.id === 'string' ? stamps.get(record.id) : undefined;
                    if (stamp !== undefined && !record.endedAt) record.endedAt = stamp;
                }
            },
            { once: true }
        );
        return true;
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`sessions: could not stamp a reused launch ended yet: ${reason}`);
        return false;
    }
}

/**
 * Join every note to the record whose id is its parent, in place. `childFor` answers the builder's
 * own record from the note's transcript path, or null; `processes` is builderProcesses's answer. A
 * note whose parent the scan does not hold joins nothing.
 */
export function joinDispatches(
    records: SessionRecord[],
    notes: DispatchNote[],
    childFor: (note: DispatchNote) => SessionRecord | null,
    processes: ReadonlyMap<string, boolean>
): void {
    const byId = new Map<string, SessionRecord>();
    for (const record of records) if (!byId.has(record.id)) byId.set(record.id, record);
    for (const note of notes) {
        const parent = byId.get(note.parent);
        if (parent === undefined) continue;
        const agent = dispatchedAgent(
            note,
            childFor(note),
            parent.live,
            processes.get(note.id) ?? null
        );
        parent.agents = [...parent.agents, agent];
    }
}
