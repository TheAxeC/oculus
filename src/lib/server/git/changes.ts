// Layer 2, server. The change log: one record per write that changed something, appended to a
// machine-local file as JSON lines and read back newest first.
//
// The record is made where the write is made. Every writer holds the value the file had and the
// value it wrote at the point of the edit, and hands both back on its outcome, so nothing here reads
// a file a second time and nothing compares one version of a file with another.
//
// The log is this machine's and not the researcher's data: git already holds the hub's history, and
// what this answers is what oculus did here. It lives beside the other files under ~/.oculus, or
// wherever local.yml's `changes` key puts it.
//
// An append goes behind the process's write chain, the one the file browser's writes use, so two
// requests never interleave a line. The time is stamped inside the chain and kept ahead of the last
// line's, so every record carries its own moment and a page addresses one change by it.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { sameOrigin } from '../core/auth.ts';
import { writeTextAtomic } from '../sessions/stores/json.ts';
import type { FsWrites } from '../files/fs.ts';

/**
 * How a change is taken back: `field` writes `before` back at the same address, `create` is undone
 * by a delete and `delete` by a create, `reorder` puts the earlier order back, and `none` is a write
 * with no inverse writer (a scaffolded idea folder, a renamed LinkedIn post).
 */
export type UndoKind = 'field' | 'create' | 'delete' | 'reorder' | 'none';

/** What a writer says about one thing it changed. The time and the body kind are added on append. */
export type ChangeRecord = {
    /** The file written, relative to the hub inside it and absolute outside it. */
    file: string;
    /** What the write addressed: a project id, an entry identity, a session id, a collection, `deck`. */
    key: string;
    /**
     * The field the write set, or `entries` when the whole record at `file` changed: an entry
     * created or deleted, a list reordered, a scaffolded idea's manifest.
     */
    field: string;
    before: unknown;
    after: unknown;
    undo: UndoKind;
};

/** One line of the log. */
export type Change = ChangeRecord & {
    /** The moment the line was written, ISO, unique in the file and rising down it. */
    at: string;
    /** The body kind of the write the record came from, which is the writer an undo goes through. */
    kind: string;
    /** The `at` of the change this one took back, absent on a change that took nothing back. */
    undoes?: string;
};

/** Where the log is, how much of it is kept, and the chain an append waits behind. */
export type ChangeLog = {
    file: string;
    keep: number;
    writes: FsWrites;
};

/** How many changes one read answers with, which is the page "load older" walks back through. */
export const PAGE = 50;

/** The mode the log is created with: it names this machine's own files and folders. */
const MODE = 0o600;

/** ~/.oculus/changes.jsonl, resolved at the call rather than at import. */
export function defaultChangesPath(): string {
    return join(homedir(), '.oculus', 'changes.jsonl');
}

/** The path a record names: relative to the hub inside it, and the absolute path outside it. */
export function pathOf(hub: string, file: string): string {
    const full = resolve(file);
    const root = resolve(hub);
    return full.startsWith(root + sep) ? relative(root, full) : full;
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

/** The lines of the log, blank ones dropped. A file that is not there yet holds none. */
function linesOf(file: string): string[] {
    if (!existsSync(file)) return [];
    try {
        return readFileSync(file, 'utf8')
            .split('\n')
            .filter((one) => one.trim() !== '');
    } catch {
        return [];
    }
}

/** One line as a change, or null when the line is not one: a half-written file loses that line. */
function parseLine(line: string): Change | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(line);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const one = parsed as Record<string, unknown>;
    if (typeof one.at !== 'string' || typeof one.kind !== 'string') return null;
    if (typeof one.file !== 'string' || typeof one.field !== 'string') return null;
    return one as unknown as Change;
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
 * The page is PAGE rows whatever the cap is. `keep` bounds the file and not the read: the file holds
 * up to twice it, and a page cut to the cap would leave the rows past it unreachable.
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

/**
 * Append the records of one write, behind the chain. The stamp rises past the last line's, so two
 * records of one request and two requests in one millisecond each get their own moment; the file is
 * rewritten to `keep` lines once it has grown past twice that, so a rewrite is rare and the read
 * never walks an unbounded file.
 */
function append(log: ChangeLog, kind: string, records: ChangeRecord[], undoes?: string): void {
    const lines = linesOf(log.file);
    let moment = Math.max(Date.now(), lastMoment(lines) + 1);
    const written = records.map((record) => {
        const one: Change = {
            at: new Date(moment).toISOString(),
            kind,
            ...record,
            ...(undoes === undefined ? {} : { undoes })
        };
        moment += 1;
        return JSON.stringify(one);
    });
    mkdirSync(dirname(log.file), { recursive: true });
    if (lines.length + written.length > log.keep * 2) {
        const kept = [...lines, ...written].slice(-log.keep);
        writeTextAtomic(log.file, `${kept.join('\n')}\n`, MODE);
        return;
    }
    appendFileSync(log.file, `${written.join('\n')}\n`, { encoding: 'utf8', mode: MODE });
}

/**
 * Record what one write changed. A write that changed nothing, and a request whose target names no
 * log, write nothing at all.
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
    const done = log.writes.chain.then(
        () => append(log, kind, records, undoes),
        () => append(log, kind, records, undoes)
    );
    log.writes.chain = done.then(
        () => undefined,
        () => undefined
    );
    await done;
}

/**
 * GET /api/changes: one page of the log, newest first, same-origin only as every read is. `before`
 * is the `at` of the oldest row the page already shows, and the answer is the page before it. A
 * process with no log answers an empty page rather than an error: there is nothing wrong, there is
 * simply nothing recorded yet.
 */
export function handleChanges(request: Request, log: ChangeLog | undefined): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return new Response(JSON.stringify({ error: 'origin' }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
        });
    }
    const before = new URL(request.url).searchParams.get('before') ?? undefined;
    const changes = log === undefined ? [] : readChanges(log, before);
    // The page size the read used, which is what tells the page whether a full page came back and
    // there may be older rows behind it.
    return new Response(JSON.stringify({ changes, page: PAGE }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}
