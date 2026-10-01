// Layer 2, server. The triage notes: one machine-local JSON file under `mail_dir`, one note per
// thread id, written by the Inbox view and by the triage skill.
//
// The notes are the one part of the inbox that is not the provider's: what a thread wants, one line
// about it, a suggested answer, and whether the reader is done with it. They live beside the
// credential files rather than in the hub, because they are private and because the plate they
// describe is read live from the mailbox.
//
// A note whose thread has left the plate is kept for thirty days and then dropped, so a thread that
// comes back inside a month finds its note again and the file does not grow without end. A note
// carries no part of a message: what the skill writes is its own sentence and its own draft.
//
// The folder is resolved by the caller, as the credential store's is, so a test and a served test
// run write a directory of their own.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import type { InboxKind, TriageFile, TriageNote } from '../../../data/model/index.ts';
import { writeTextAtomic } from '../../core/json.ts';

/** The mode the notes file is created and kept at, as the credential files are. */
const MODE = 0o600;

/** The mode the mail folder is created at. */
const DIR_MODE = 0o700;

/** How long a note outlives the thread it is about, in days. */
export const KEEP_DAYS = 30;

/** The file the notes live in, inside the folder the machine's own configuration names. */
export function triageFile(dir: string): string {
    return join(dir, 'triage.json');
}

/** The three words a `kind` may be, and nothing when it is something else. */
export const inboxKindShape = z
    .enum(['reply', 'action', 'info'])
    .optional()
    .catch(undefined) satisfies z.ZodType<InboxKind | undefined>;

/**
 * What a note holds under a thread id. A field of another type reads as unset, `triaged` is only
 * ever true, and a value that is no map is no note.
 */
const noteShape = z.object({
    kind: inboxKindShape,
    what: z.string().optional().catch(undefined),
    draft: z.string().optional().catch(undefined),
    triaged: z.literal(true).optional().catch(undefined),
    written: z.string().catch('')
});

/** One note out of whatever the file held under a thread id. */
function noteOf(value: unknown): TriageNote | null {
    const parsed = noteShape.safeParse(value);
    if (!parsed.success) return null;
    const { kind, what, draft, triaged, written } = parsed.data;
    return {
        ...(kind === undefined ? {} : { kind }),
        ...(what === undefined ? {} : { what }),
        ...(draft === undefined ? {} : { draft }),
        ...(triaged === undefined ? {} : { triaged }),
        written
    };
}

/**
 * The file as a whole: the time of the last triage run when it is text, and the notes as a map read
 * from its own keys, which is no notes at all when the value is anything else.
 */
const triageFileShape = z.object({
    run: z.string().optional().catch(undefined),
    notes: z.custom<Record<string, unknown>>(isMap).optional().catch(undefined)
});

/**
 * The notes as the file holds them, or an empty set when there is no file yet. A file that is there
 * and does not parse throws the one sentence the view shows, which names the file and never what it
 * held; a key inside it that is not a note is left out rather than throwing, so one bad entry
 * written from outside does not take the whole plate's notes away.
 */
export function readTriage(dir: string): TriageFile {
    const file = triageFile(dir);
    if (!existsSync(file)) return { run: null, notes: {} };
    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        throw new Error(`${file} is not JSON`);
    }
    const held = triageFileShape.safeParse(parsed);
    if (!isMap(parsed) || !held.success) throw new Error(`${file} must hold a JSON object`);
    const notes: Record<string, TriageNote> = {};
    // A key `__proto__` assigned would set the prototype of `notes` to that note, so it is skipped.
    for (const [id, value] of Object.entries(held.data.notes ?? {})) {
        const note = noteOf(value);
        if (note !== null && id !== '__proto__') notes[id] = note;
    }
    return { run: held.data.run ?? null, notes };
}

/** Write the whole file, owner-readable alone, making the folder when it is not there yet. */
function writeTriage(dir: string, held: TriageFile): void {
    mkdirSync(dir, { recursive: true, mode: DIR_MODE });
    writeTextAtomic(triageFile(dir), `${JSON.stringify(held, null, 4)}\n`, MODE);
}

/** What one write of the page may set; a field it does not name is left as the note had it. */
export type TriageFields = {
    kind?: InboxKind;
    what?: string;
    draft?: string;
    triaged?: boolean;
};

/**
 * Put one thread's fields into the file and answer the note that is now there. A field given as the
 * empty string, or `triaged` given as false, takes that field off the note, so a reader who clears
 * a draft or restores a thread leaves nothing behind. The thread id `__proto__` is refused, since
 * assigning to that key of the notes would set the prototype of the map and store no note.
 */
export function writeNote(
    dir: string,
    thread: string,
    fields: TriageFields,
    now: () => Date = () => new Date()
): TriageNote {
    if (thread === '__proto__') throw new Error('no such thread');
    const held = readTriage(dir);
    const before = held.notes[thread] ?? { written: '' };
    const next: TriageNote = { ...before, written: now().toISOString() };
    if (fields.kind !== undefined) next.kind = fields.kind;
    // A field given as the empty string, and `triaged` given as false, take that field off the
    // note; the note is rebuilt without it rather than deleted out of, so the shape stays a literal
    // one.
    const what = fields.what ?? next.what;
    const draft = fields.draft ?? next.draft;
    const triaged = fields.triaged ?? next.triaged === true;
    held.notes[thread] = {
        ...(next.kind === undefined ? {} : { kind: next.kind }),
        ...(what === undefined || what === '' ? {} : { what }),
        ...(draft === undefined || draft === '' ? {} : { draft }),
        ...(triaged ? { triaged: true } : {}),
        written: next.written
    };
    writeTriage(dir, held);
    return held.notes[thread];
}

/**
 * Drop every note whose thread is not on the plate and whose last write is more than thirty days
 * old, and answer what is left. The file is rewritten only when something went, so a poll over an
 * unchanged file writes nothing and the watcher does not see its own write.
 */
export function pruneNotes(dir: string, onPlate: Set<string>, now: number): TriageFile {
    const held = readTriage(dir);
    const cutoff = now - KEEP_DAYS * 86400000;
    const keeping = Object.entries(held.notes).filter(([id, note]) => {
        if (onPlate.has(id)) return true;
        const written = Date.parse(note.written);
        return Number.isFinite(written) && written > cutoff;
    });
    if (keeping.length === Object.keys(held.notes).length) return held;
    const left: TriageFile = { run: held.run, notes: Object.fromEntries(keeping) };
    writeTriage(dir, left);
    return left;
}
