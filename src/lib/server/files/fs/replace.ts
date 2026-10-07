// Layer 2, server. Replace in the Search view: the matches a request names in a list of files
// replaced by the text the replace box reads to, as POST /api/ops `replace`, and the same
// replacements applied in memory to one file for the Replace Preview, as POST /api/ops `preview`.
// server/files/fs/ops.ts dispatches to both.
//
// The page never decides what is written. A request names each match by its line, the place it
// starts at in that line and the text it covered, and the server runs ripgrep over the file as it
// is now (through `runRipgrep` of server/files/search.ts, the one place a process is started) and
// takes each named match from that run. A match the run does not find at that line and place with
// that text means the file changed since the search, and the file is refused `changed` before
// anything is written. The text written for a match is computed here from the current groups by
// `replacementOf` of data/helpers/search/replace.ts, never taken from the page.
//
// Files are checked in the order `outside`, `missing`, `protected`, `denied` (the file's mode locks
// it), `binary`, `too_large` (over what the history keeps a copy of, as the file is and as the
// replace would leave it, so the undo and the redo can keep a copy of each), `marker` (the file
// holds one of the private-use characters the group template is read with), `search-failed` and
// `changed`. A list of files stops at the first refusal and names the files done before it and the
// one it stopped at. Each file is written once: its copy is kept in the local history first (kind
// `replace`), the matches are spliced in from the end of the file back at their byte offsets so
// every other byte stays as it was, and the result is checked to hold the replacements at the
// places they were made before the file is written through the same atomic write a save uses. The
// whole request is one `files` record, with the stamps of the files as they were (each naming its
// copy) and as they are.
//
// Once a file is written, ripgrep reads it again and the answer carries its hits as they are now
// (`Reread`), the same hit a search answers. A hit whose match sits on text the write left alone
// also carries the line and place it had before (`was`), found by moving its byte offset back over
// the splices, so the page can tell a hit that stayed from one the write made.

import { readFileSync, statSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import {
    TEXT_LIMIT,
    type OpsAnswer,
    type OpsRefusal,
    type Reread,
    type RereadHit,
    type ReplaceHit,
    type ReplaceQuery,
    type FileStamp
} from '../../../data/file-ops.ts';
import { ALL_ROOTS, fileArgs, refusalOf } from '../../../data/helpers/search/query.ts';
import {
    groupsFrom,
    hasMarker,
    replacementOf,
    type MatchGroups
} from '../../../data/helpers/search/replace.ts';
import { writeBytesAtomic } from '../../core/json.ts';
import { resolveRootPath, type Root } from '../files.ts';
import { isBinaryFile, isReadonly } from '../source.ts';
import {
    hitOf,
    ripgrepRecord,
    lineMatches,
    runRipgrep,
    type LineMatch,
    type SearchRunner
} from '../search.ts';
import { stampOf } from './file-changes.ts';
import { SAVE_MAX_BYTES, keepCopy } from './history.ts';

/** A refusal before or at a file. */
export type Fail = { ok: false; error: OpsRefusal };

export const fail = (error: OpsRefusal): Fail => ({ ok: false, error });

/** What a preview runs over: the roots, the files never changed and how ripgrep is run. */
type ReadScope = {
    roots: Root[];
    /** Whether a path is a file the server never changes, or a folder that holds one. */
    guarded: (path: string) => boolean;
    /** Milliseconds one file's search is given, from `search.timeout_s`; absent refuses a run. */
    timeout?: number;
    /** How ripgrep is run; the real binary when absent. */
    run?: SearchRunner;
};

/** What a replace runs over: a preview's scope, the history it keeps copies in and the record. */
export type ReplaceScope = ReadScope & {
    /** The local history folder a copy is kept in before a file is written; none keeps none. */
    history?: string;
    /** Say that files were written: the stamps of what was there and of what is there now. */
    note: (before: FileStamp[], after: FileStamp[]) => void;
};

/** The request of a replace, as ./ops.ts hands it over. */
type ReplaceRequest = {
    query: ReplaceQuery;
    replace: string;
    preserveCase: boolean;
    items: { root: string; path: string; hits: ReplaceHit[] }[];
};

/** One file read for a replace: where it really is and what it holds. */
export type Loaded = { real: string; bytes: Buffer };

/** One match to replace: the bytes it covers in the file and the bytes that take its place. */
type Splice = { from: number; to: number; text: Buffer };

/** Whether a step answered a refusal rather than its value. */
export function refused(step: object): step is Fail {
    return 'ok' in step && step.ok === false;
}

/**
 * Whether the file ends its lines with CRLF, by VS Code's rule for a text model: CR and CRLF line
 * ends together outnumber half of all the line ends.
 */
function endsWithCrlf(bytes: Buffer): boolean {
    let crlf = 0;
    let lf = 0;
    let cr = 0;
    for (let at = 0; at < bytes.length; at += 1) {
        if (bytes[at] === 0x0d) {
            if (bytes[at + 1] === 0x0a) {
                crlf += 1;
                at += 1;
            } else {
                cr += 1;
            }
        } else if (bytes[at] === 0x0a) {
            lf += 1;
        }
    }
    const lines = cr + lf + crlf;
    return lines > 0 && cr + crlf > lines / 2;
}

/**
 * The file a root's key and a path name, read: its refusal, or where it is and what it holds. A
 * file that is to be written is refused `denied` when its mode locks it, before its bytes are
 * looked at. The checks are `outside`, `missing`, `protected`, `denied`, `binary` and `too_large`,
 * in that order; a file the server may read and write is returned with its bytes.
 */
export function readChecked(
    scope: Pick<ReadScope, 'roots' | 'guarded'>,
    root: string,
    path: string,
    limit: number,
    writing: boolean
): Loaded | Fail {
    const found = resolveRootPath(scope.roots, root, path);
    if ('error' in found) return fail(found.error);
    let size: number;
    try {
        const info = statSync(found.path);
        if (!info.isFile()) return fail('missing');
        size = info.size;
    } catch {
        return fail('missing');
    }
    if (scope.guarded(found.path)) return fail('protected');
    if (writing && isReadonly(found.path)) return fail('denied');
    if (isBinaryFile(found.path)) return fail('binary');
    if (size > limit) return fail('too_large');
    let bytes: Buffer;
    try {
        bytes = readFileSync(found.path);
    } catch {
        return fail('denied');
    }
    return { real: found.path, bytes };
}

/** A file read as `readChecked` does, refused `marker` when its text holds the replace marker. */
function loaded(
    scope: ReadScope,
    root: string,
    path: string,
    limit: number,
    writing: boolean
): Loaded | Fail {
    const read = readChecked(scope, root, path, limit, writing);
    if (refused(read)) return read;
    return hasMarker(read.bytes.toString('utf8')) ? fail('marker') : read;
}

/** Every match ripgrep finds in a file as it is now, by line and place, or why it could not run. */
async function matchesIn(
    scope: ReadScope,
    real: string,
    query: ReplaceQuery
): Promise<Map<string, LineMatch> | Fail> {
    if (scope.timeout === undefined) return fail('search-failed');
    const found = new Map<string, LineMatch>();
    const outcome = await (scope.run ?? runRipgrep)(
        dirname(real),
        fileArgs(query, basename(real)),
        scope.timeout,
        (line) => {
            const parsed = ripgrepRecord(line);
            if (parsed?.type === 'match') {
                for (const one of lineMatches(parsed.data)) found.set(`${one.line}:${one.at}`, one);
            }
            return true;
        }
    );
    if (outcome.timedOut || outcome.code >= 2) return fail('search-failed');
    return found;
}

/**
 * The most hits one written file is read again for. A file with more is left to a new search, and
 * its answer says the read failed, so the page asks the reader to search again.
 */
const REREAD_MAX = 2000;

/** The matches a replace or a preview names; a write names the text each one covered. */
type Wanted = { line: number; at: number; match?: string };

/**
 * The splices for the matches named in one file, in file order. A write is `exact`: a named match
 * the run does not find with the text it was named with refuses the file `changed`. A preview
 * leaves such a match unreplaced.
 */
async function splicesFor(
    scope: ReadScope,
    file: Loaded,
    request: Pick<ReplaceRequest, 'query' | 'replace' | 'preserveCase'>,
    hits: Wanted[],
    exact: boolean
): Promise<{ splices: Splice[]; found: Map<string, LineMatch> } | Fail> {
    const found = await matchesIn(scope, file.real, request.query);
    if (refused(found)) return found;
    const crlf = endsWithCrlf(file.bytes);
    const splices: Splice[] = [];
    for (const hit of hits) {
        const match = found.get(`${hit.line}:${hit.at}`);
        if (match === undefined || (hit.match !== undefined && match.matched !== hit.match)) {
            if (exact) return fail('changed');
            continue;
        }
        const groups = groupsOf(match, request.query);
        if (groups === null) return fail('search-failed');
        const text = replacementOf(request.replace, groups, {
            regex: request.query.regex,
            preserveCase: request.preserveCase,
            crlf
        });
        const from = match.offset + match.start;
        const to = match.offset + match.end;
        if (file.bytes.subarray(from, to).toString('utf8') !== (match.matched ?? '')) {
            return fail('changed');
        }
        splices.push({ from, to, text: Buffer.from(text, 'utf8') });
    }
    return { splices: splices.sort((a, b) => a.from - b.from), found };
}

/** The groups of one match: those ripgrep reported in regular-expression mode, else the match. */
function groupsOf(match: LineMatch, query: ReplaceQuery): MatchGroups | null {
    if (query.regex) {
        return match.replacement === undefined ? null : groupsFrom(match.replacement, query.q);
    }
    return { '0': match.matched ?? '' };
}

/** The file's bytes with each splice's bytes in place of the bytes it covers. */
function spliced(bytes: Buffer, splices: Splice[]): Buffer | null {
    const parts: Buffer[] = [];
    let at = 0;
    for (const one of splices) {
        if (one.from < at || one.to < one.from) return null;
        parts.push(bytes.subarray(at, one.from), one.text);
        at = one.to;
    }
    parts.push(bytes.subarray(at));
    return Buffer.concat(parts);
}

/**
 * Whether a result holds each replacement where it was made and every byte between them as the
 * file had it, which is read from the result and not from how it was built.
 */
function reparsed(result: Buffer, bytes: Buffer, splices: Splice[]): boolean {
    let source = 0;
    let target = 0;
    for (const one of splices) {
        const gap = one.from - source;
        if (!result.subarray(target, target + gap).equals(bytes.subarray(source, one.from))) {
            return false;
        }
        target += gap;
        if (!result.subarray(target, target + one.text.length).equals(one.text)) return false;
        target += one.text.length;
        source = one.to;
    }
    return result.subarray(target).equals(bytes.subarray(source));
}

/** Whether a request names a file twice, or a match twice in a file, or names nothing. */
function malformed(request: ReplaceRequest): boolean {
    if (request.items.length === 0) return true;
    const files = new Set<string>();
    for (const item of request.items) {
        const key = `${item.root}\0${item.path}`;
        const places = new Set(item.hits.map((one) => `${one.line}:${one.at}`));
        if (files.has(key) || item.hits.length === 0 || places.size !== item.hits.length) {
            return true;
        }
        files.add(key);
    }
    return false;
}

/**
 * Why the query of a request is refused, as `bad-query`, or null: the pattern's own bounds, and the
 * folder it was scoped to under each root the request names that the server serves.
 */
function queryRefusal(scope: ReadScope, query: ReplaceQuery, named: string[]): Fail | null {
    const keys = scope.roots.map((one) => one.key);
    const bounds = { ...query, root: ALL_ROOTS, max: 1, under: '' };
    if (refusalOf(bounds, keys) !== null) return fail('bad-query');
    for (const root of new Set(named)) {
        if (keys.includes(root) && refusalOf({ ...bounds, root, under: query.under }, keys)) {
            return fail('bad-query');
        }
    }
    return null;
}

/** One file replaced in, or why not. */
async function replaceFile(
    scope: ReplaceScope,
    request: ReplaceRequest,
    item: ReplaceRequest['items'][number]
): Promise<{ before: FileStamp[]; after: FileStamp[]; reread: Reread } | Fail> {
    const file = loaded(scope, item.root, item.path, SAVE_MAX_BYTES, true);
    if (refused(file)) return file;
    const planned = await splicesFor(scope, file, request, item.hits, true);
    if (refused(planned)) return planned;
    const { splices, found } = planned;
    const result = spliced(file.bytes, splices);
    if (result === null || !reparsed(result, file.bytes, splices)) return fail('changed');
    if (result.length > SAVE_MAX_BYTES) return fail('too_large');
    const was = stampOf(file.real);
    if (was === null) return fail('missing');
    let kept: string | undefined;
    if (scope.history !== undefined) {
        const copy = keepCopy(scope.history, file.real, 'replace');
        if (!copy.ok) return fail('denied');
        kept = copy.kept?.id;
    }
    try {
        writeBytesAtomic(file.real, result);
    } catch {
        return fail('denied');
    }
    const now = stampOf(file.real);
    return {
        before: [kept === undefined ? was : { ...was, kept }],
        after: now === null ? [] : [now],
        reread: await rereadFile(scope, request.query, item, file.real, found, splices)
    };
}

/**
 * Where the text a splice wrote sits in the file after the write, in bytes: each splice's start
 * moved over the splices before it, and its end after its own text.
 */
function writtenRegions(splices: Splice[]): { from: number; to: number; shift: number }[] {
    let shift = 0;
    return splices.map((one) => {
        const from = one.from + shift;
        shift += one.text.length - (one.to - one.from);
        return { from, to: from + one.text.length, shift };
    });
}

/**
 * Whether the text a write put in the file lies on a line, which spans `start` to `end` in bytes of
 * the file as it is now, its line end included: a line the write changed reads differently than it
 * did. A deletion leaves an empty region, which is on the line from its first byte up to its line
 * end, and at `end` itself only when the line has no line end, as the last line of a file may not.
 */
function written(
    regions: { from: number; to: number }[],
    start: number,
    end: number,
    ended: boolean
): boolean {
    return regions.some((one) =>
        one.from === one.to
            ? start <= one.from && (one.from < end || (one.from === end && !ended))
            : one.from < end && one.to > start
    );
}

/**
 * The hits a written file holds now. A match that sits wholly on text the write left alone gets
 * `was`, the line and place the match at the same bytes of the old file had, and `edited` when the
 * write changed some other text on its line; a match that touches what the write wrote has no
 * `was`, since the write made it.
 */
async function rereadFile(
    scope: ReadScope,
    query: ReplaceQuery,
    item: { root: string; path: string },
    real: string,
    before: Map<string, LineMatch>,
    splices: Splice[]
): Promise<Reread> {
    const failed: Reread = { root: item.root, path: item.path, hits: [], failed: true };
    const now = await matchesIn(scope, real, query);
    if (refused(now) || now.size > REREAD_MAX) return failed;
    const old = new Map<number, LineMatch>();
    for (const one of before.values()) old.set(one.offset + one.start, one);
    const regions = writtenRegions(splices);
    const pattern = query.regex ? query.q : undefined;
    const hits: RereadHit[] = [];
    for (const match of now.values()) {
        const hit: RereadHit = hitOf(match, pattern);
        const from = match.offset + match.start;
        const to = match.offset + match.end;
        const touches = regions.some(
            (one) =>
                (from < one.to && to > one.from) ||
                (one.from === one.to && from < one.from && one.from < to)
        );
        if (!touches) {
            const shift = regions.filter((one) => one.to <= from).at(-1)?.shift ?? 0;
            const was = old.get(from - shift);
            if (
                was !== undefined &&
                was.matched === match.matched &&
                was.end - was.start === to - from
            ) {
                const line = match.offset;
                const ended = /[\r\n]$/.test(match.text);
                const edited = written(regions, line, line + Buffer.byteLength(match.text), ended);
                hit.was = edited
                    ? { line: was.line, at: was.at, edited }
                    : { line: was.line, at: was.at };
            }
        }
        hits.push(hit);
    }
    return { root: item.root, path: item.path, hits };
}

/**
 * POST /api/ops `replace`: the matches the request names, replaced file by file in order. The
 * answer names the files written as `root/path`, or the files done and the one a refusal stopped
 * at.
 */
export async function replaceFiles(
    scope: ReplaceScope,
    request: ReplaceRequest
): Promise<OpsAnswer> {
    if (malformed(request)) return fail('not-an-action');
    if (hasMarker(request.replace)) return fail('marker');
    const refusal = queryRefusal(
        scope,
        request.query,
        request.items.map((one) => one.root)
    );
    if (refusal !== null) return refusal;
    const done: string[] = [];
    const rereads: Reread[] = [];
    for (const item of request.items) {
        const name = `${item.root}/${item.path}`;
        const outcome = await replaceFile(scope, request, item);
        if (refused(outcome)) {
            return { ok: false, error: outcome.error, done, failed: name, rereads };
        }
        scope.note(outcome.before, outcome.after);
        done.push(name);
        rereads.push(outcome.reread);
    }
    return { ok: true, paths: done, rereads };
}

/**
 * POST /api/ops `preview`: one file with the named matches replaced, as the text the Replace
 * Preview shows on the right. The file is held to what a comparison reads and to the checks a
 * write makes of its content.
 */
export async function previewReplace(
    scope: ReadScope,
    place: { root: string; path: string },
    request: Pick<ReplaceRequest, 'query' | 'replace' | 'preserveCase'> & {
        hits: Pick<ReplaceHit, 'line' | 'at'>[];
    }
): Promise<{ ok: true; original: string; modified: string } | Fail> {
    const refusal = queryRefusal(scope, request.query, [place.root]);
    if (refusal !== null) return refusal;
    const file = loaded(scope, place.root, place.path, TEXT_LIMIT, false);
    if (refused(file)) return file;
    const planned = await splicesFor(scope, file, request, request.hits, false);
    if (refused(planned)) return planned;
    const result = spliced(file.bytes, planned.splices);
    if (result === null) return fail('changed');
    return { ok: true, original: file.bytes.toString('utf8'), modified: result.toString('utf8') };
}
