// Layer 2, client state. The files of a names answer and the matching of a query against them, for
// the palette's file mode: a file is a `FileEntry`, the list prepares every entry once, and a query
// lists at most `FILE_ROWS` of them with the file name outranking the folder. A query that is a
// file's whole name, or the end of its path from a folder boundary (`site/run.sh`), lists that file
// ahead of every fuzzy match, as VS Code's Quick Open ranks a whole-name match first.
//
// The matching runs in a web worker (file-match.worker.ts), because a hundred thousand names are
// matched in more than a frame when several words are typed. This module is what that worker and
// the unit runs share: `fileList` is the synchronous form, `fileWorkerCore` turns the two messages
// the page posts (the names, then each query with its number) into the answers the page reads, and
// the message types are the whole of the protocol. It imports nothing that needs a window, so the
// worker bundle holds only the matcher.

import type { NamesAnswer } from '../../../data/model/index.ts';
import {
    fuzzyIndex,
    partsBetween,
    type FuzzyIndex,
    type TextPart
} from '../../shared/words/fuzzy.ts';

/** One file the file mode lists: its root, its path inside it, its name and its folder. */
export type FileEntry = { root: string; path: string; name: string; folder: string };

/** How many rows the file mode draws for one query. */
const FILE_ROWS = 200;

/**
 * The score under which a file is not a match. A query's letters found far apart in a long name
 * or path are not a file the reader meant, and in a list of a hundred thousand they would fill the
 * rows ahead of the files that are.
 */
const FILE_THRESHOLD = 0.3;

/** The entry for a path inside a root; the folder is empty for a file at the top of its root. */
export function fileEntry(root: string, path: string): FileEntry {
    const at = path.lastIndexOf('/');
    return { root, path, name: path.slice(at + 1), folder: at < 0 ? '' : path.slice(0, at) };
}

/** The files of a names answer, root after root in the order it came. */
function fileEntriesOf(answer: NamesAnswer): FileEntry[] {
    return answer.roots.flatMap((one) => one.paths.map((path) => fileEntry(one.root, path)));
}

/** The value of a file's row: what the palette's list selects it by. */
export function fileValue(entry: FileEntry): string {
    return `file:${entry.root}:${entry.path}`;
}

/** One file a query matched: the entry, and its name and folder in matched and unmatched runs. */
export type FileMatch = { entry: FileEntry; name: TextPart[]; folder: TextPart[] };

/** An entry with nothing marked. */
export function plainFile(entry: FileEntry): FileMatch {
    return {
        entry,
        name: [{ text: entry.name, hit: false }],
        folder: entry.folder === '' ? [] : [{ text: entry.folder, hit: false }]
    };
}

/**
 * The files a query matches in an index, at most `FILE_ROWS`: those whose name matched first, then
 * those only the path matched. A match in the path is drawn across the folder and the name it
 * spans.
 */
function matchesIn(index: FuzzyIndex<FileEntry>, query: string): FileMatch[] {
    return index.search(query, FILE_ROWS).map(({ row, key, parts }) => {
        if (key === 0) return { ...plainFile(row), name: parts };
        const named = row.folder === '' ? 0 : row.folder.length + 1;
        return {
            entry: row,
            name: partsBetween(parts, named, row.path.length),
            folder: partsBetween(parts, 0, row.folder.length)
        };
    });
}

/**
 * The entry with the end of its path a query named drawn marked: the whole name, and the end of
 * the folder the query reached into.
 */
function wholeMatch(entry: FileEntry, whole: string): FileMatch {
    const reach = Math.max(0, whole.length - entry.name.length - 1);
    const kept = entry.folder.length - reach;
    const folder: TextPart[] = [
        { text: entry.folder.slice(0, kept), hit: false },
        { text: entry.folder.slice(kept), hit: true }
    ].filter((one) => one.text !== '');
    return { entry, name: [{ text: entry.name, hit: true }], folder };
}

/** Whether a lowercased query is the entry's whole name or the end of its path at a folder. */
function namesWhole(entry: FileEntry, whole: string): boolean {
    const path = entry.path.toLowerCase();
    return path === whole || path.endsWith(`/${whole}`);
}

/** What a names answer holds, which the palette says under its rows. */
export type FileSummary = {
    /** How many files the answer holds. */
    count: number;
    /** How many roots hold at least one of them. */
    roots: number;
    /** Whether the answer was cut at the configured number of names. */
    cut: boolean;
    /** The roots whose list is not whole because a run of theirs ran out of time or failed. */
    partial: string[];
};

/** The summary of a names answer, read from the answer without preparing any name. */
export function fileSummary(answer: NamesAnswer): FileSummary {
    return {
        count: answer.roots.reduce((sum, one) => sum + one.paths.length, 0),
        roots: answer.roots.filter((one) => one.paths.length > 0).length,
        cut: answer.cut,
        partial: answer.roots.filter((one) => one.error !== undefined).map((one) => one.root)
    };
}

/** The files of a names answer, ready to match a query against. */
type FileList = FileSummary & {
    /** The files a query matches, best first. */
    matches: (query: string) => FileMatch[];
};

/**
 * The files of a names answer with every name prepared, which is done here and once: the file name
 * is the first key and the path the second.
 */
export function fileList(answer: NamesAnswer): FileList {
    const entries = fileEntriesOf(answer);
    const index = fuzzyIndex(entries, [(one) => one.name, (one) => one.path], FILE_THRESHOLD);
    const byName = new Map<string, FileEntry[]>();
    for (const entry of entries) {
        const name = entry.name.toLowerCase();
        const held = byName.get(name);
        if (held === undefined) byName.set(name, [entry]);
        else held.push(entry);
    }
    /** The fuzzy matches, with the files the query names whole ahead of them in list order. */
    function matches(query: string): FileMatch[] {
        const fuzzy = matchesIn(index, query);
        const whole = query.trim().toLowerCase();
        if (whole === '' || /\s/.test(whole)) return fuzzy;
        const named = byName.get(whole.slice(whole.lastIndexOf('/') + 1)) ?? [];
        const exact = named.filter((entry) => namesWhole(entry, whole));
        if (exact.length === 0) return fuzzy;
        const first = new Set(exact);
        return [
            ...exact.map((entry) => wholeMatch(entry, whole)),
            ...fuzzy.filter((one) => !first.has(one.entry))
        ].slice(0, FILE_ROWS);
    }
    return { ...fileSummary(answer), matches };
}

/** What the page posts to the worker: the names once, then each query with its number. */
export type FileWorkerIn =
    { kind: 'names'; answer: NamesAnswer } | { kind: 'query'; id: number; query: string };

/** What the worker answers: the rows of the query with that number. */
export type FileWorkerOut = { id: number; rows: FileMatch[] };

/**
 * The worker's side of the protocol: a function that takes each message the page posts and posts
 * an answer through `post`. The names message is prepared with `prepare` (`fileList` in the
 * worker), which replaces any earlier list; a query before any names is answered with no rows.
 *
 * A message is handled when `later` runs, after the messages already waiting have arrived too, and
 * of the queries among them only the newest is answered: the page draws only the newest query's
 * answer, so matching the others is time the newest waits for.
 */
export function fileWorkerCore(
    prepare: (answer: NamesAnswer) => FileList,
    post: (out: FileWorkerOut) => void,
    later: (run: () => void) => void
): (message: FileWorkerIn) => void {
    let list: FileList | null = null;
    let waiting: FileWorkerIn[] = [];

    function drain(): void {
        const batch = waiting;
        waiting = [];
        const newest = batch.findLast((one) => one.kind === 'query');
        for (const message of batch) {
            if (message.kind === 'names') list = prepare(message.answer);
            else if (message === newest) {
                post({ id: message.id, rows: list === null ? [] : list.matches(message.query) });
            }
        }
    }

    return (message) => {
        waiting.push(message);
        if (waiting.length === 1) later(drain);
    };
}
