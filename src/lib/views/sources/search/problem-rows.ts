// Layer 3, view partial of Problems.svelte. The rows of the Problems view apart from the view so
// they can be read without a rendering: the filter, the rows the tree draws, and the words and the
// JSON a row is copied as.
//
// The filter is VS Code's. Its text is split into terms at the commas outside braces. A term with
// `*`, `?`, `[` or `{` in it is a glob over the file's path (a term without a slash also matches
// the file's name), and any other term is matched in a row's message, source, code and path in the
// order of its letters (state/shared/words/fuzzy.ts). `!` before a term excludes the rows it
// matches. A row stays when it matches at least one term that does not exclude, or when there is
// none, and no term that does. A glob that cannot be read is the text itself, so it matches only
// that path.

import picomatch from 'picomatch';
import { fuzzyMatches } from '$lib/state/shared/words/fuzzy';
import { t } from '$lib/state/shared/words/text';
import type { Problem, ProblemFile, ProblemSeverity } from '$lib/state/system/problems.svelte';

/** What the view's controls say: the filter text, the severities shown, and where to look. */
export type ProblemFilter = {
    text: string;
    errors: boolean;
    warnings: boolean;
    infos: boolean;
    /** Only the rows of the file the reader is in (`active`), none with no file. */
    activeOnly: boolean;
    active: { root: string; path: string } | null;
    /** Only the rows of this root, the empty text for every root. */
    scope: string;
};

type Term = { text: string; exclude: boolean; glob: boolean };

/** The text cut at the commas that are outside braces, so `src/{x,y}.ts` is one term. */
function cutAtCommas(text: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let from = 0;
    for (let at = 0; at < text.length; at++) {
        const char = text[at];
        if (char === '{') depth++;
        else if (char === '}' && depth > 0) depth--;
        else if (char === ',' && depth === 0) {
            parts.push(text.slice(from, at));
            from = at + 1;
        }
    }
    parts.push(text.slice(from));
    return parts;
}

/** The terms of a filter's text. */
function termsOf(text: string): Term[] {
    return cutAtCommas(text)
        .map((one) => one.trim())
        .filter((one) => one !== '')
        .map((one) => {
            const exclude = one.startsWith('!');
            const body = exclude ? one.slice(1).trim() : one;
            return { text: body, exclude, glob: /[*?[{]/.test(body) };
        })
        .filter((term) => term.text !== '');
}

/**
 * A path test for a glob: the glob's, or equality with its text when it cannot be read. A glob
 * without a slash is tested on the file's name as well, since picomatch's `basename` option tests
 * only the name and would stop a glob with a slash from matching.
 */
function globTest(glob: string): (path: string) => boolean {
    try {
        return picomatch(glob, { dot: true, basename: !glob.includes('/') });
    } catch {
        return (path) => path === glob;
    }
}

/** The rows one term matches. */
function matched(term: Term, rows: readonly Problem[]): Set<Problem> {
    if (term.glob) {
        const test = globTest(term.text);
        return new Set(rows.filter((row) => test(row.path)));
    }
    const found = fuzzyMatches(term.text, rows, [
        (row) => row.message,
        (row) => row.source,
        (row) => row.code ?? '',
        (row) => row.path
    ]);
    return new Set(found.map((one) => one.row));
}

/** The rows of a file the filter keeps, in their order. */
function kept(rows: readonly Problem[], filter: ProblemFilter): Problem[] {
    const shown: Record<ProblemSeverity, boolean> = {
        error: filter.errors,
        warning: filter.warnings,
        info: filter.infos
    };
    const terms = termsOf(filter.text);
    const including = terms.filter((term) => !term.exclude).map((term) => matched(term, rows));
    const excluding = terms.filter((term) => term.exclude).map((term) => matched(term, rows));
    return rows.filter(
        (row) =>
            shown[row.severity] &&
            (filter.scope === '' || row.root === filter.scope) &&
            (including.length === 0 || including.some((set) => set.has(row))) &&
            !excluding.some((set) => set.has(row))
    );
}

/** The files with the rows the filter keeps; a file left with none is not listed. */
export function filterFiles(files: readonly ProblemFile[], filter: ProblemFilter): ProblemFile[] {
    const { active } = filter;
    return files
        .filter(
            (file) =>
                !filter.activeOnly ||
                (active !== null && file.root === active.root && file.path === active.path)
        )
        .map((file) => ({ ...file, rows: kept(file.rows, filter) }))
        .filter((file) => file.rows.length > 0);
}

/** One line of the tree as the view draws it: a file, or a problem under its file. */
export type Entry =
    | { kind: 'file'; id: string; file: ProblemFile; open: boolean }
    | { kind: 'row'; id: string; parent: string; file: ProblemFile; row: Problem };

/** A problem row with its id, its file and the file's key, as the tree and the table list it. */
type RowEntry = Extract<Entry, { kind: 'row' }>;

/** The row at a place of a file. */
function rowEntry(file: ProblemFile, row: Problem, at: number): RowEntry {
    return { kind: 'row', id: `${file.key}#${String(at)}`, parent: file.key, file, row };
}

/** The lines the tree draws: each file, then its rows unless the reader closed it. */
export function entriesOf(files: readonly ProblemFile[], closed: readonly string[]): Entry[] {
    return files.flatMap((file): Entry[] => {
        const open = !closed.includes(file.key);
        const head: Entry = { kind: 'file', id: file.key, file, open };
        if (!open) return [head];
        return [head, ...file.rows.map((row, at) => rowEntry(file, row, at))];
    });
}

/** Every problem row of the files, whichever of them the tree has folded; the table lists these. */
export function rowEntriesOf(files: readonly ProblemFile[]): RowEntry[] {
    return files.flatMap((file) => file.rows.map((row, at) => rowEntry(file, row, at)));
}

/** The name a file is listed by: a library file's own name, else the last part of its path. */
export function fileName(file: Pick<ProblemFile, 'path' | 'library'>): string {
    if (file.library !== undefined) return file.library;
    return file.path.split('/').filter(Boolean).at(-1) ?? file.path;
}

/** The folder a file is listed under: its path without its name, and the address of a library. */
export function fileFolder(file: Pick<ProblemFile, 'path' | 'library'>): string {
    if (file.library !== undefined) return file.path;
    const at = file.path.lastIndexOf('/');
    return at < 0 ? '' : file.path.slice(0, at);
}

/** `source(code)` as VS Code writes it, or the source alone for a row with no code. */
export function sourceText(row: Problem): string {
    return row.code === undefined ? row.source : `${row.source}(${row.code})`;
}

/** `[Ln 3, Col 5]`, with column 1 for a source that names none. */
export function positionText(row: Problem): string {
    return t('problems.position', row.line, Math.max(row.column, 1));
}

/** The glyph and the colour of a severity. */
export function severityLook(severity: ProblemSeverity): { glyph: string; style: string } {
    if (severity === 'error') return { glyph: 'cross', style: 'color: var(--c-red-txt)' };
    if (severity === 'warning') return { glyph: 'warn', style: 'color: var(--c-amber-txt)' };
    return { glyph: 'info', style: 'color: var(--c-blue-txt)' };
}

/** VS Code's marker severities. */
const MARKER_SEVERITY: Record<ProblemSeverity, number> = { error: 8, warning: 4, info: 2 };

/** A row as VS Code copies it: the marker, as JSON indented with tabs. */
export function copyText(row: Problem): string {
    return JSON.stringify(
        {
            resource: row.path,
            owner: row.owner,
            ...(row.code === undefined ? {} : { code: row.code }),
            severity: MARKER_SEVERITY[row.severity],
            message: row.message,
            source: row.source,
            startLineNumber: row.line,
            startColumn: Math.max(row.column, 1),
            endLineNumber: row.endLine > 0 ? row.endLine : row.line,
            endColumn: row.endLine > 0 ? row.endColumn : Math.max(row.column, 1)
        },
        null,
        '\t'
    );
}
