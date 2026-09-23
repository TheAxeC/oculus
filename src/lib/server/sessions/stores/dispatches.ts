// Layer 2, server. The launch note: the builders a launcher started as processes of their own, and
// the session each one belongs under.
//
// A builder that is a native subagent is named by its parent's transcript; one started as a process
// (a Codex worker, or `claude -p`) is named nowhere its parent wrote. The launcher therefore writes
// one record per launch into `~/.oculus/dispatches.json` through bin/dispatch-note.mjs, and this
// reads it back: every record whose `parent` is a session's id joins that session's `agents`.
//
// The writer replaces the file by a rename, so a read never meets half a write; a hand edit can
// leave anything in it, though, so a missing, empty or garbled file reads as no records and a
// record without an id, a parent or a known harness is left out.

import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SessionAgent, SessionRecord } from '../../../data/model.ts';
import { isMap, list, readJson, text } from './json.ts';

/** The harnesses a launch may name, which are the two session stores oculus reads. */
export const HARNESSES = ['claude', 'codex'];

/** The prefix a dispatched builder's agent id carries, so it never meets a subagent's id. */
export const DISPATCH_PREFIX = 'dispatch:';

/** One launch, as bin/dispatch-note.mjs writes it. Every field is a string; empty means unknown. */
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
};

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
            endedAt: text(item.endedAt)
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
 * The launcher's `end` stamp says the builder is done. Without one, a launcher whose own session
 * is live will still stamp it, so the row reads running: a builder's session is no witness while
 * its launcher lives, since a Codex session reads not live after two minutes with its rollout
 * unwritten, which a builder inside a long command often is. Once the launcher's session is not
 * live, a builder whose own session the scan holds is running while that session is live and done
 * once it is not, which keeps a row from reading running for good after its launcher died before
 * stamping the end; a builder the scan does not hold has no other witness, and reads running until
 * the stamp.
 */
export function dispatchedAgent(
    note: DispatchNote,
    child: SessionRecord | null,
    launcherLive: boolean
): SessionAgent {
    const done = note.endedAt !== '' || (!launcherLive && child !== null && !child.live);
    const ended = note.endedAt !== '' ? note.endedAt : done ? (child?.lastActivity ?? null) : null;
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
 * Join every note to the record whose id is its parent, in place. `childFor` answers the builder's
 * own record from the note's transcript path, or null. A note whose parent the scan does not hold
 * joins nothing.
 */
export function joinDispatches(
    records: SessionRecord[],
    notes: DispatchNote[],
    childFor: (note: DispatchNote) => SessionRecord | null
): void {
    const byId = new Map<string, SessionRecord>();
    for (const record of records) if (!byId.has(record.id)) byId.set(record.id, record);
    for (const note of notes) {
        const parent = byId.get(note.parent);
        if (parent === undefined) continue;
        parent.agents = [...parent.agents, dispatchedAgent(note, childFor(note), parent.live)];
    }
}
