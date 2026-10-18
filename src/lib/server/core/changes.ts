// Layer 2, server. The change log: one record per write that changed something, appended to a
// machine-local file as JSON lines and read back newest first. Every writer records here (the
// writes of server/edit, the feed edits and the session overrides of server/sessions), so it sits
// in server/core, below all of them.
//
// The record is made where the write is made. Every writer holds the value the file had and the
// value it wrote at the point of the edit, and hands both back on its outcome, so nothing here
// reads a file a second time and nothing compares one version of a file with another. A manifest
// write that removed a field also hands back the text it removed, where it stood and the text that
// followed it (`RemovedText`), which the record of that field keeps for the undo. One that wrote a
// bare note or a list of one note as a map hands back the text it replaced (`ReplacedText`), which
// the undo puts back while the file still holds the lines the write left, and so does an add or a
// delete of a collection entry.
//
// The log is this machine's and not the researcher's data: git already holds the hub's history, and
// what this answers is what oculus did here. It lives beside the other files under ~/.oculus, or
// wherever local.yml's `changes` key puts it.
//
// An append goes behind the process's write chain, the one the file browser's writes use, so two
// requests never interleave a line. The time is stamped inside the chain and kept ahead of the last
// line's, so every record carries its own moment and a page addresses one change by it.
//
// A line is read back through a zod schema of the four fields every change carries, which accepts
// or refuses the parsed line and hands the line itself on.
//
// Each append is announced on the hub's `changes` channel with the moment of its newest record,
// after the lines are on disk, so a page holding the log reads it again and finds them; the channel
// keeps its newest message, so a page that connects again after a write hears of it.
//
// A last line cut off by an interrupted write is closed with a newline before the next record, so
// that record is read back.
//
// A record whose values are too large for a line (an app's store) holds their byte sizes as
// `before` and `after` and hands the values themselves as `kept`. Append writes `kept` to
// `<undoDir>/<at>.json`, never to the log, and deletes that file when the record leaves the window
// the log keeps.

import { json } from '@sveltejs/kit';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { chained, writeTextAtomic } from './json.ts';
import type { FsWrites } from './json.ts';
import type { Hub } from './channels.ts';
import type { ChangesPayload } from '../../data/model/index.ts';

/**
 * How a change is taken back: `field` writes `before` back at the same address, `create` is undone
 * by a delete and `delete` by a create, `reorder` puts the earlier order back, `file` takes back a
 * file operation by moving, trashing or writing back the files it names (server/edit/writes/
 * file-undo.ts), and `none` is a write with no inverse writer (a scaffolded idea folder, a renamed
 * LinkedIn post).
 */
export type UndoKind = 'field' | 'create' | 'delete' | 'reorder' | 'file' | 'none';

/**
 * The text a manifest write took out of the file when it cleared a field, and where it stood, which
 * is what an undo puts back.
 */
export type RemovedText = {
    /**
     * The index in the file's text, counted in UTF-16 code units, where the text stood in the text
     * the write left. The record's own time is `at`; this is a place in the file.
     */
    offset: number;
    /** The characters removed, a trailing comment and a parent line included. */
    text: string;
    /**
     * The text of the file the write left from `offset` to the end of its line, the line break not
     * included: the whole following line for a removal of whole lines, and empty at the end of the
     * file.
     */
    next: string;
};

/**
 * The text a write replaced and the text it put in its place, which is what an undo puts back
 * while the file still holds what the write left: a manifest write that wrote a bare note or a
 * list of one note as the map it stands for, and a `config-value` write, whose two texts differ
 * from the common prefix and suffix of the file before and after, and an add or a delete of a
 * collection entry, whose two texts are widened to whole lines and one line around them. Putting
 * `before` over `after` at `offset` gives the earlier text.
 */
export type ReplacedText = {
    /** The index in the text the write left, counted in UTF-16 code units, where `after` begins. */
    offset: number;
    /** The characters the write replaced, comments included. */
    before: string;
    /** The lines the write put in their place. */
    after: string;
};

/**
 * What a writer says about one thing it changed. The time and the body kind are added on append.
 */
export type ChangeRecord = {
    /** The file written, by its absolute path. */
    file: string;
    /**
     * What the write addressed: a project id, an entry identity, a session id, a collection,
     * a deck group name, `rail` for the rail list, or a config file's name for a setting.
     */
    key: string;
    /**
     * The field the write set, or `entries` when the whole record at `file` changed: an entry
     * created or deleted, a list reordered, a scaffolded idea's manifest.
     */
    field: string;
    before: unknown;
    after: unknown;
    undo: UndoKind;
    /**
     * The lines a manifest write removed, on the record of each field whose edit took text out and
     * put none in, and on no other record.
     */
    removed?: RemovedText;
    /**
     * The text a write replaced: on the record of each manifest field whose edit rewrote a note as
     * a map and left the rewritten lines in the file, on the record of a `config-value` write, on
     * the record of a config write that added a key (the added text, with an empty `before`), on
     * the record of a Lit Watch append and of a Save to Literature, on the record of an add or a
     * delete of a collection entry (`new-entry`, `delete-entry`) and of the delete of a feed entry
     * (`feed-delete`), and on the record of an undo that put text back; on no other record.
     */
    replaced?: ReplacedText;
    /**
     * The paths a write made that the config did not have: on the record of a write that added a
     * key to the hub's settings file (`<hub>/.oculus/config.yml`), the folders and the file it
     * created, outermost first, and none when the key went into a file that was there. Its undo
     * takes the added text (`replaced`) out and removes each path made, while it holds nothing
     * else.
     */
    created?: string[];
    /**
     * The two values themselves, for a record whose `before` and `after` are their byte sizes. They
     * are written to the undo folder under the record's moment and are not part of the line.
     */
    kept?: { before: unknown; after: unknown };
    /** The view id of the app whose frame sent the write, on a write an app made. */
    app?: string;
    /**
     * The identity an entry had before a write that renamed it, on each record of that write and on
     * no other: `key` is the identity the write gave it, and an undo finds the entry under either.
     */
    was?: string;
};

/** One line of the log. */
export type Change = ChangeRecord & {
    /** The moment the line was written, ISO, unique in the file and rising down it. */
    at: string;
    /**
     * The body kind of the write the record came from, which is the writer an undo goes through.
     */
    kind: string;
    /** The `at` of the change this one took back, absent on a change that took nothing back. */
    undoes?: string;
};

/** Where the log is, how much of it is kept, and the chain an append waits behind. */
export type ChangeLog = {
    file: string;
    keep: number;
    writes: FsWrites;
    /** The folder the values of a record's `kept` are written to, one `<at>.json` each. */
    undoDir?: string;
    /** The server's channels, on which each append is announced as the `changes` channel. */
    hub?: Pick<Hub, 'publish'>;
};

/** How many changes one read answers with, which is the page "load older" walks back through. */
export const PAGE = 50;

/** The mode the log is created with: it names this machine's own files and folders. */
const MODE = 0o600;

/** ~/.oculus/changes.jsonl, resolved at the call rather than at import. */
export function defaultChangesPath(): string {
    return join(homedir(), '.oculus', 'changes.jsonl');
}

/** A value as the log can hold it: `undefined` is absent in JSON, and absent is not a value. */
export function plain(value: unknown): unknown {
    return value === undefined ? null : value;
}

/**
 * Whether two recorded values are the same thing. Maps are compared by their keys and not by the
 * order the two of them list those keys in: one side comes from a JSON line and the other from a
 * fresh parse of the file, and an undo refused because two maps agree in a different order would be
 * a refusal over nothing.
 */
export function same(left: unknown, right: unknown): boolean {
    if (left === right) return true;
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
            return false;
        }
        return left.every((one, at) => same(one, right[at]));
    }
    if (typeof left !== 'object' || typeof right !== 'object') return false;
    if (left === null || right === null) return false;
    const one = left as Record<string, unknown>;
    const other = right as Record<string, unknown>;
    const keys = Object.keys(one);
    if (keys.length !== Object.keys(other).length) return false;
    return keys.every((key) => key in other && same(one[key], other[key]));
}

/** The file that holds the values a record kept, or null for a log that has no undo folder. */
function keptFile(log: ChangeLog, at: string): string | null {
    return log.undoDir === undefined ? null : join(log.undoDir, `${at}.json`);
}

/** The values a record kept, or null when the file is gone or does not hold two values. */
export function keptValues(log: ChangeLog, at: string): { before: unknown; after: unknown } | null {
    const file = keptFile(log, at);
    if (file === null || !existsSync(file)) return null;
    try {
        const held = JSON.parse(readFileSync(file, 'utf8')) as unknown;
        if (typeof held !== 'object' || held === null) return null;
        if (!('before' in held) || !('after' in held)) return null;
        return { before: held.before, after: held.after };
    } catch {
        return null;
    }
}

/** The text of the log, or the empty string for a file that is not there yet or cannot be read. */
function textOf(file: string): string {
    if (!existsSync(file)) return '';
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return '';
    }
}

/** The lines of a log's text, blank ones dropped. */
function linesIn(text: string): string[] {
    return text.split('\n').filter((one) => one.trim() !== '');
}

/** The lines of the log, blank ones dropped. A file that is not there yet holds none. */
function linesOf(file: string): string[] {
    return linesIn(textOf(file));
}

/**
 * The four fields a line must carry to be a change. Any other field, and any of the rest of a
 * `Change`, is read as the line holds it: a line oculus did not write may lack them.
 */
const changeLineShape = z.looseObject({
    at: z.string(),
    kind: z.string(),
    file: z.string(),
    field: z.string()
}) satisfies z.ZodType<Pick<Change, 'at' | 'kind' | 'file' | 'field'>>;

/**
 * One line as a change, or null when the line is not one: a half-written file loses that line. The
 * answer is the parsed line itself, so its keys stay in the order written, an own `__proto__` key
 * stays an own key, and a key the shape does not name is kept; the schema only accepts or refuses.
 */
function parseLine(line: string): Change | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(line);
    } catch {
        return null;
    }
    return changeLineShape.safeParse(parsed).success ? (parsed as Change) : null;
}

/** Every change the file holds, oldest first. */
function allOf(log: ChangeLog): Change[] {
    return linesOf(log.file).flatMap((line) => {
        const one = parseLine(line);
        return one === null ? [] : [one];
    });
}

/**
 * One page of the log, newest first. `before` walks back: it is the `at` of the oldest row a page
 * already shows, and the answer is the page before that one.
 *
 * The page is PAGE rows whatever the cap is. `keep` bounds the file and not the read: the file
 * holds up to twice it, and a page cut to the cap would leave the rows past it unreachable.
 */
export function readChanges(log: ChangeLog, before?: string): Change[] {
    const rows = allOf(log).reverse();
    const older =
        before === undefined || before === '' ? rows : rows.filter((one) => one.at < before);
    return older.slice(0, PAGE);
}

/** The change one moment names, or undefined when the log no longer holds it. */
export function changeAt(log: ChangeLog, at: string): Change | undefined {
    return allOf(log).find((one) => one.at === at);
}

/**
 * The changes one write made, the one given included: those of the log of the same kind and key
 * that took back the same change (or none). A write that changes several files files each under one
 * key, so taking one back can take the others back with it. The log prunes whole acts of that
 * kind, so every record of a kept act is among them.
 */
export function writtenWith(log: ChangeLog, change: Change): Change[] {
    return allOf(log).filter(
        (one) => one.kind === change.kind && one.key === change.key && one.undoes === change.undoes
    );
}

/** The time of the last line, as milliseconds, or zero when the file holds none. */
function lastMoment(lines: string[]): number {
    for (let at = lines.length - 1; at >= 0; at -= 1) {
        const one = parseLine(lines[at]);
        if (one === null) continue;
        const moment = Date.parse(one.at);
        return Number.isFinite(moment) ? moment : 0;
    }
    return 0;
}

/** The kind whose records of one write share a key and are taken back together. */
const ACT_KIND = 'deck-edit';

/**
 * Where a cut of the lines at `cut` keeps whole acts: the cut itself, or the first line of the act
 * it falls inside. An act is the run of lines of kind `deck-edit` with one key and `undoes`, as
 * `writtenWith` takes it, so a kept act is never missing its first records.
 */
function actStart(lines: string[], cut: number): number {
    let at = Math.max(0, cut);
    while (at > 0 && at < lines.length) {
        const before = parseLine(lines[at - 1]);
        const after = parseLine(lines[at]);
        const inside =
            before !== null &&
            after !== null &&
            before.kind === ACT_KIND &&
            before.kind === after.kind &&
            before.key === after.key &&
            before.undoes === after.undoes;
        if (!inside) break;
        at -= 1;
    }
    return at;
}

/**
 * Append the records of one write, behind the chain, and answer the moment of the last one. The
 * stamp rises past the last line's, so two records of one request and two requests in one
 * millisecond each get their own moment; the file is rewritten to `keep` lines once it has grown
 * past twice that, so a rewrite is rare and the read never walks an unbounded file.
 */
function append(log: ChangeLog, kind: string, records: ChangeRecord[], undoes?: string): string {
    const text = textOf(log.file);
    const lines = linesIn(text);
    const closing = text !== '' && !text.endsWith('\n') ? '\n' : '';
    let moment = Math.max(Date.now(), lastMoment(lines) + 1);
    const written = records.map((record) => {
        const { kept, ...line } = record;
        const one: Change = {
            at: new Date(moment).toISOString(),
            kind,
            ...line,
            ...(undoes === undefined ? {} : { undoes })
        };
        const file = kept === undefined ? null : keptFile(log, one.at);
        if (file !== null) writeTextAtomic(file, JSON.stringify(kept), MODE);
        moment += 1;
        return JSON.stringify(one);
    });
    mkdirSync(dirname(log.file), { recursive: true });
    if (lines.length + written.length > log.keep * 2) {
        const all = [...lines, ...written];
        const kept = all.slice(actStart(all, all.length - log.keep));
        for (const gone of all.slice(0, all.length - kept.length)) {
            const old = parseLine(gone);
            const file = old === null || log.undoDir === undefined ? null : keptFile(log, old.at);
            if (file !== null) rmSync(file, { force: true });
        }
        writeTextAtomic(log.file, `${kept.join('\n')}\n`, MODE);
    } else {
        appendFileSync(log.file, `${closing}${written.join('\n')}\n`, {
            encoding: 'utf8',
            mode: MODE
        });
    }
    return new Date(moment - 1).toISOString();
}

/**
 * Record what one write changed, and announce it on the log's hub. A write that changed nothing,
 * and a request whose target names no log, write and announce nothing at all.
 */
export async function logChanges(
    log: ChangeLog | undefined,
    kind: string,
    records: ChangeRecord[] | undefined,
    undoes?: string
): Promise<void> {
    if (log === undefined || records === undefined || records.length === 0) return;
    // Whichever request got here first finishes its read, its stamp and its append before the next
    // one starts, so two writes in flight are two lines and never one interleaved with another.
    const at = await chained(log.writes, () => append(log, kind, records, undoes));
    log.hub?.publish('changes', { at } satisfies ChangesPayload);
}

/**
 * GET /api/changes: one page of the log, newest first, same-origin only as every read is. `before`
 * is the `at` of the oldest row the page already shows, and the answer is the page before it. A
 * process with no log answers an empty page rather than an error: there is nothing wrong, there is
 * simply nothing recorded yet.
 */
export function handleChanges(request: Request, log: ChangeLog | undefined): Response {
    const before = new URL(request.url).searchParams.get('before') ?? undefined;
    const changes = log === undefined ? [] : readChanges(log, before);
    // The page size the read used, which is what tells the page whether a full page came back and
    // there may be older rows behind it.
    return json({ changes, page: PAGE });
}
