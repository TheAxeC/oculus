// Layer 2, server. The files a Zenodo deposit uploads, as one zip: the project's `code/` staged by
// git as the GitHub mirror is (deposit-tree.ts), in a folder of its own under the OS temp folder
// with its own `git init`, removed when the files are read, so a project with no mirror needs no
// Adopt. The deposit scan's findings refuse it as they refuse a commit (deposit-scan.ts).
//
// For review, every path segment and every text file has each term of
// `code_availability.anonymize` replaced, without regard to case, by its `as` (`Anonymous` when it
// has none), the longest term first and each term matched as its letters, never as a pattern. A
// text file is one that decodes as UTF-8 with no NUL byte. Any other file is looked in for each
// term in its bytes read as UTF-8, Latin-1 and UTF-16 (both byte orders, both alignments); the
// entries of a zip-family file, the content of a `.gz` or `.tgz` and the FlateDecode streams of a
// `.pdf` are inflated with fflate and looked in the same way. A file whose bytes hold a term, a
// file of a compressed form that cannot be read (`.bz2`, `.xz`, `.7z`, `.rar`, `.zst`, or one of
// the forms above that does not inflate), and two paths that become one refuse the whole upload,
// each naming its file, before any request is sent.
//
// The zip is written in memory with fflate; its entries are the paths relative to `code/` with no
// top folder, as the GitHub repository holds them.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { gunzipSync, inflateSync, unzipSync, unzlibSync, zipSync } from 'fflate';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { words } from '../../core/words.ts';
import { failed } from './deposit.ts';
import { initMirror, type Outcome, type Where } from './deposit-git.ts';
import { scan } from './deposit-scan.ts';
import { pathsOf, stageTree } from './deposit-tree.ts';

/** What a term is replaced by when its row names nothing else. */
const ANONYMOUS = 'Anonymous';

/** The forms that are zip archives, whose entries are inflated and looked in. */
const ZIP_FAMILY = ['.zip', '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.npz', '.jar'];

/** The gzip forms, whose content is inflated and looked in. */
const GZIP = ['.gz', '.tgz'];

/** The compressed forms fflate does not read, which refuse the review copy by their name. */
const UNREAD = ['.bz2', '.xz', '.7z', '.rar', '.zst'];

/** A row of `code_availability.anonymize` as the copy applies it. */
export type Term = { term: string; as: string };

/** The files of the copy, each its path relative to `code/` and its bytes, in path order. */
export type Files = [string, Uint8Array][];

/** A refusal of the copy, worded. */
type Refused = { refused: Outcome };

/**
 * The rows of `code_availability.anonymize`, or the refusal of the first row with no term, named
 * by its place from 1. A key that holds no list holds no rows.
 */
export function termsOf(rows: unknown, text: Record<string, string>): Term[] | Refused {
    if (!Array.isArray(rows)) return [];
    const terms: Term[] = [];
    for (const [index, row] of rows.entries()) {
        const term = isMap(row) ? scalar(row.term).trim() : '';
        if (term === '') {
            return { refused: failed(words(text, 'server.zenodo.term_empty', index + 1)) };
        }
        const as = isMap(row) ? scalar(row.as).trim() : '';
        terms.push({ term, as: as === '' ? ANONYMOUS : as });
    }
    return terms;
}

/** A text with every term replaced by its `as`, the longest term first, without regard to case. */
export function replaceTerms(text: string, terms: readonly Term[]): string {
    if (terms.length === 0) return text;
    const ordered = [...terms].sort((a, b) => b.term.length - a.term.length);
    const pattern = new RegExp(ordered.map((one) => escaped(one.term)).join('|'), 'giu');
    return text.replace(pattern, (found) => {
        const low = found.toLowerCase();
        return ordered.find((one) => one.term.toLowerCase() === low)?.as ?? ANONYMOUS;
    });
}

/** A term with every character a pattern reads as syntax escaped, so it matches as its letters. */
function escaped(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The files git stages out of `code` (deposit-tree.ts), read from a folder under the OS temp folder
 * that is removed before the answer; `where` points a command at that folder. A scan finding
 * refuses them, naming each file.
 */
export async function stagedFiles(
    code: string,
    where: (dir: string, mirrors: string) => Where,
    text: Record<string, string>
): Promise<Files | Refused> {
    if (!existsSync(code)) return { refused: failed(words(text, 'server.deposit.no_code')) };
    const root = mkdtempSync(join(tmpdir(), 'oculus-zenodo-'));
    try {
        const dir = join(root, 'copy');
        mkdirSync(dir);
        const at = where(dir, root);
        const started = await initMirror(at);
        if (!started.ok) return { refused: started };
        const { staged, listed } = await stageTree(code, at);
        if (!staged.ok) return { refused: staged };
        if (!listed.ok) return { refused: listed };
        const paths = pathsOf(listed.output).sort();
        const found = [...new Set(scan(dir, paths).map((one) => one.path))];
        if (found.length > 0) {
            return { refused: failed(words(text, 'server.zenodo.scan_found', found.join(', '))) };
        }
        return paths.map((path) => [path, new Uint8Array(readFileSync(join(dir, path)))]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

/**
 * The review copy of the files: each path and each text file with the terms replaced, or the
 * refusal of the first file that holds a term where it cannot be replaced, of a compressed form
 * that cannot be read, or of two paths that become one.
 */
export function anonymised(
    files: Files,
    terms: readonly Term[],
    text: Record<string, string>
): Files | Refused {
    const out: Files = [];
    const from = new Map<string, string>();
    for (const [path, bytes] of files) {
        const target = path
            .split('/')
            .map((segment) => replaceTerms(segment, terms))
            .join('/');
        const held = from.get(target);
        if (held !== undefined) {
            const [first, second] = [held, path].sort();
            return { refused: failed(words(text, 'server.zenodo.collision', first, second)) };
        }
        from.set(target, path);
        const content = asText(bytes);
        if (content !== null && !isContainer(path)) {
            out.push([target, new TextEncoder().encode(replaceTerms(content, terms))]);
            continue;
        }
        const found = inspect(path, bytes, terms);
        if (found === 'term_in_bytes') {
            return { refused: failed(words(text, 'server.zenodo.term_in_bytes', path)) };
        }
        if (found === 'compressed_unread') {
            return { refused: failed(words(text, 'server.zenodo.compressed_unread', path)) };
        }
        out.push([target, bytes]);
    }
    return out;
}

/** The zip of the files, its entries their paths, with no top folder. */
export function zipOf(files: Files): Uint8Array {
    return zipSync(Object.fromEntries(files));
}

/** The text of a file that decodes as UTF-8 and holds no NUL byte, or null for any other. */
function asText(bytes: Uint8Array): string | null {
    if (bytes.includes(0)) return null;
    try {
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch {
        return null;
    }
}

/** The lower-case ending of a path, which says its form. */
function formOf(path: string): string {
    return extname(path).toLowerCase();
}

/** Whether a path is of a form whose content is inflated rather than read as text. */
function isContainer(path: string): boolean {
    const form = formOf(path);
    return [...ZIP_FAMILY, ...GZIP, ...UNREAD, '.pdf'].includes(form);
}

/** Why a file refuses the copy: a term in its bytes, or a compressed form that is not read. */
type Finding = 'term_in_bytes' | 'compressed_unread';

/**
 * Whether a file, in any of its forms, holds a term: its own bytes, and the files inflated out of
 * it, each looked in the same way.
 */
function inspect(path: string, bytes: Uint8Array, terms: readonly Term[]): Finding | null {
    const inner = expanded(path, bytes);
    if (inner === null) return 'compressed_unread';
    if (holdsTerm(bytes, terms)) return 'term_in_bytes';
    for (const [name, held] of inner) {
        const found = inspect(name, held, terms);
        if (found !== null) return found;
    }
    return null;
}

/**
 * The files inflated out of a file by its form: a zip-family file's entries, a gzip file's content,
 * a PDF's FlateDecode streams, and none for any other form; null for a form fflate does not read
 * and for a file of a read form that does not inflate.
 */
function expanded(path: string, bytes: Uint8Array): Files | null {
    const form = formOf(path);
    if (UNREAD.includes(form)) return null;
    try {
        if (ZIP_FAMILY.includes(form)) return Object.entries(unzipSync(bytes));
        if (GZIP.includes(form)) return [[path.slice(0, -form.length), gunzipSync(bytes)]];
        if (form === '.pdf') return pdfStreams(bytes);
    } catch {
        return null;
    }
    return [];
}

/** The keyword a PDF stream's data follows, and the one it ends at. */
const STREAM = /(?<!end)stream\r?\n/g;
const END_STREAM = 'endstream';

/**
 * The FlateDecode streams of a PDF, inflated: each stream whose object names `/FlateDecode` before
 * its `stream` keyword, its data up to `endstream` with the line end before it dropped. A stream
 * that does not inflate as zlib or as raw deflate throws, which refuses the file.
 */
function pdfStreams(bytes: Uint8Array): Files {
    const body = Buffer.from(bytes).toString('latin1');
    const streams: Files = [];
    let after = 0;
    for (const found of body.matchAll(STREAM)) {
        // A keyword inside the data of the stream before it is a byte of that data.
        if (found.index < after) continue;
        const start = found.index + found[0].length;
        const end = body.indexOf(END_STREAM, start);
        if (end < 0) break;
        after = end + END_STREAM.length;
        const head = body.slice(body.lastIndexOf(' obj', found.index), found.index);
        if (!head.includes('/FlateDecode')) continue;
        const data = bytes.subarray(start, end);
        streams.push([`stream ${String(streams.length + 1)}`, inflated(trimmedEnd(data))]);
    }
    return streams;
}

/** The data with the line end before `endstream` dropped. */
function trimmedEnd(data: Uint8Array): Uint8Array {
    let end = data.length;
    if (end > 0 && data[end - 1] === 0x0a) end -= 1;
    if (end > 0 && data[end - 1] === 0x0d) end -= 1;
    return data.subarray(0, end);
}

/** A deflated stream inflated as zlib, or as raw deflate when it has no zlib header. */
function inflated(data: Uint8Array): Uint8Array {
    try {
        return unzlibSync(data);
    } catch {
        return inflateSync(data);
    }
}

/**
 * Whether the bytes hold a term, without regard to case, read as UTF-8, as Latin-1, and as UTF-16
 * in both byte orders from the first and from the second byte.
 */
function holdsTerm(bytes: Uint8Array, terms: readonly Term[]): boolean {
    if (terms.length === 0) return false;
    const held = Buffer.from(bytes);
    const views = [
        new TextDecoder('utf-8').decode(held),
        held.toString('latin1'),
        utf16(held, false),
        utf16(held.subarray(1), false),
        utf16(held, true),
        utf16(held.subarray(1), true)
    ].map((one) => one.toLowerCase());
    return terms.some((one) => views.some((view) => view.includes(one.term.toLowerCase())));
}

/** The bytes read as UTF-16, little-endian or big-endian, a last odd byte left out. */
function utf16(bytes: Buffer, big: boolean): string {
    const even = Buffer.from(bytes.subarray(0, bytes.length - (bytes.length % 2)));
    return (big ? even.swap16() : even).toString('utf16le');
}
