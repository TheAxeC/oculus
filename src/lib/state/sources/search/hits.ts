// Layer 2, client state, pure. What the Search view does with the hits of an answer once a replace
// is in play: which hits an action acts on, what is left after it, which row takes the focus, what
// each hit would be replaced with, and the request that replaces them.
//
// A hit is named by its file and by `line` and `at`, never by its column in the cut text, since two
// matches of one long line can be cut to windows that share a column. The replacement of a hit is
// computed on the page by the function the server writes by (data/helpers/search/replace.ts), over
// the groups the run reported, so the preview follows the replace text as it is typed.

import type { OpsRequest, ReplaceQuery } from '../../../data/file-ops.ts';
import { replacementOf } from '../../../data/helpers/search/replace.ts';
import { matchOf, type SearchFile, type SearchHit, type SearchState } from './search.ts';

/** What an action acts on: every hit listed, the hits of one file, or one hit. */
export type Chosen =
    | { kind: 'all' }
    | { kind: 'file'; file: SearchFile }
    | { kind: 'hit'; file: SearchFile; hit: SearchHit };

/** The key a file's heading row is known by. */
export function fileKey(file: SearchFile): string {
    return `file:${file.root}:${file.path}`;
}

/** The key a hit's row is known by. */
export function hitKey(file: SearchFile, hit: SearchHit): string {
    return `hit:${file.root}:${file.path}:${hit.line}:${hit.at}`;
}

/** Whether two files are the same file of the same root. */
function same(a: SearchFile, b: SearchFile): boolean {
    return a.root === b.root && a.path === b.path;
}

/** The files, each with only the hits a pick acts on; a file with none is left out. */
export function pickedFiles(files: SearchFile[], pick: Chosen): SearchFile[] {
    if (pick.kind === 'all') return files.filter((file) => file.hits.length > 0);
    return files.flatMap((file) => {
        if (!same(file, pick.file)) return [];
        if (pick.kind === 'file') return file.hits.length > 0 ? [file] : [];
        const hits = file.hits.filter(
            (one) => one.line === pick.hit.line && one.at === pick.hit.at
        );
        return hits.length > 0 ? [{ ...file, hits }] : [];
    });
}

/** The files with the hits of `taken` out of them; a file left with no hit is left out. */
export function without(files: SearchFile[], taken: SearchFile[]): SearchFile[] {
    return files.flatMap((file) => {
        const gone = taken.find((one) => same(one, file));
        if (gone === undefined) return [file];
        const kept = file.hits.filter(
            (hit) => !gone.hits.some((one) => one.line === hit.line && one.at === hit.at)
        );
        return kept.length > 0 ? [{ ...file, hits: kept }] : [];
    });
}

/** How many hits a list of files holds, and how many files. */
export function totals(files: SearchFile[]): { hits: number; files: number } {
    return {
        hits: files.reduce((sum, file) => sum + file.hits.length, 0),
        files: files.length
    };
}

/** One row of the results as the tree's keyboard reads it: its key and the file it sits under. */
type ResultRow = { id: string; parent: string | null };

/** The rows of a list of files as the tree reads them: a heading per file, its hits under it. */
export function resultRows(files: SearchFile[]): ResultRow[] {
    return files.flatMap((file) => [
        { id: fileKey(file), parent: null },
        ...file.hits.map((hit) => ({ id: hitKey(file, hit), parent: fileKey(file) }))
    ]);
}

/** Every row of a list of files in the order it is drawn: a file, then its hits. */
function rowKeys(files: SearchFile[]): string[] {
    return files.flatMap((file) => [fileKey(file), ...file.hits.map((hit) => hitKey(file, hit))]);
}

/**
 * The row the focus moves to once the hits of `taken` are out of `files`: the first row after the
 * rows taken that is still there, else the last row before them, else none.
 */
export function rowAfter(files: SearchFile[], taken: SearchFile[]): string {
    const before = rowKeys(files);
    const left = new Set(rowKeys(without(files, taken)));
    const gone = before.flatMap((key, at) => (left.has(key) ? [] : [at]));
    const first = gone.at(0);
    const last = gone.at(-1);
    if (first === undefined || last === undefined) return '';
    const next = before.slice(last + 1).find((key) => left.has(key));
    if (next !== undefined) return next;
    return before.slice(0, first).findLast((key) => left.has(key)) ?? '';
}

/** The file, and the hit when the key names a hit, that a row key names; null for a key of none. */
export function rowFor(
    files: SearchFile[],
    key: string
): { file: SearchFile; hit: SearchHit | null } | null {
    for (const file of files) {
        if (fileKey(file) === key) return { file, hit: null };
        const hit = file.hits.find((one) => hitKey(file, one) === key);
        if (hit !== undefined) return { file, hit };
    }
    return null;
}

/** What a pick would send, and the files of it that are left out. */
export type ReplaceScope = { sendable: SearchFile[]; left: SearchFile[] };

/**
 * The files a pick names split by `leave`: those a replace sends, and those it leaves out, which
 * are the files a source tab holds unsaved text of.
 */
export function replaceScope(
    files: SearchFile[],
    pick: Chosen,
    leave: (file: SearchFile) => boolean
): ReplaceScope {
    const picked = pickedFiles(files, pick);
    return {
        sendable: picked.filter((file) => !leave(file)),
        left: picked.filter((file) => leave(file))
    };
}

/** What a tab holds of a replace: the text, Preserve Case and the query the answer was found by. */
export type ReplaceSettings = Pick<SearchState, 'replace' | 'preserve' | 'ran'>;

/**
 * The text a hit would be replaced with, as the server will write it, or null for a hit of a
 * regular-expression run that carries no `groups`.
 */
function replacementFor(hit: SearchHit, settings: ReplaceSettings): string | null {
    const regex = settings.ran?.regex ?? false;
    const groups = regex ? hit.groups : { '0': matchOf(hit) };
    if (groups === undefined) return null;
    return replacementOf(settings.replace, groups, {
        regex,
        preserveCase: settings.preserve,
        crlf: false
    });
}

/**
 * The replacement of a hit as a row draws it: a newline the text writes is shown as `\n`, since
 * the line the hit is drawn on holds no line break. Null when the run did not report the groups.
 */
export function replacementShown(hit: SearchHit, settings: ReplaceSettings): string | null {
    return replacementFor(hit, settings)?.replaceAll('\r', '\\r').replaceAll('\n', '\\n') ?? null;
}

/**
 * The request that replaces the hits of `files`, named by line, place and the text they covered.
 */
export function replaceRequest(
    ran: ReplaceQuery,
    settings: Pick<SearchState, 'replace' | 'preserve'>,
    files: SearchFile[]
): Extract<OpsRequest, { op: 'replace' }> {
    return {
        op: 'replace',
        query: ran,
        replace: settings.replace,
        preserveCase: settings.preserve,
        items: files.map((file) => ({
            root: file.root,
            path: file.path,
            hits: file.hits.map((hit) => ({
                line: hit.line,
                at: hit.at,
                match: matchOf(hit)
            }))
        }))
    };
}
