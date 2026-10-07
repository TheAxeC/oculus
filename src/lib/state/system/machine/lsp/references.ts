// Layer 2, client state, pure. What the References view holds for one instance and what it draws:
// the locations a language server answered for Find All References or Find All Implementations,
// grouped by file with each location's line text, the history of the last searches, and the
// numbers and words the view draws from them.
//
// A file is one of a served root (`root` and `path`) or a library file a language server named
// outside every root, which has no root: its `root` is empty, its `path` is the library address
// the relay gave the page, and `library` is the file's own name. An address lives with the page's
// connection, so a saved result that names one opens a tab saying the file is no longer open.
//
// The state is the instance's own, kept with the layout, so a reloaded page draws the same result
// without asking the server again. A saved state is read back safely, since a page restored from
// storage carries whatever was written there.

import { z } from 'zod';
import { anyNumberShape, readAs, rowsShape } from '../../../../data/shapes/shapes.ts';

/** Which request a search made. */
type RefKind = 'references' | 'implementations';

/** One search: what it asked and where, which a history row runs again. */
export type RefSearch = {
    kind: RefKind;
    /** The word under the caret, which titles the result. */
    word: string;
    root: string;
    path: string;
    /** The name of the library file the search was made in, for a search made in one. */
    library?: string;
    /** Where the caret was, lines and columns counted from one. */
    line: number;
    column: number;
};

/** One location: a line of a file, and the match in the line's text. */
export type RefLine = {
    /** Counted from one. */
    line: number;
    /** The match's first and last character in `text`, counted from zero. */
    start: number;
    end: number;
    text: string;
};

/** The locations of one file. */
export type RefFile = {
    root: string;
    path: string;
    /** The name of the library file, for a file that is one. */
    library?: string;
    lines: RefLine[];
};

/** Everything one References tab holds. */
export type RefsState = {
    search: RefSearch | null;
    files: RefFile[];
    /** The last searches, newest first. */
    history: RefSearch[];
};

/** How many searches the history keeps. */
const HISTORY_KEPT = 10;

/** The state a References tab opens with. */
const EMPTY_REFS: RefsState = { search: null, files: [], history: [] };

const searchShape = z.object({
    kind: z.enum(['references', 'implementations']),
    word: z.string().catch(''),
    root: z.string(),
    path: z.string(),
    library: z.string().optional().catch(undefined),
    line: anyNumberShape.catch(1),
    column: anyNumberShape.catch(1)
}) satisfies z.ZodType<RefSearch>;

const lineShape = z.object({
    line: anyNumberShape,
    start: anyNumberShape.catch(0),
    end: anyNumberShape.catch(0),
    text: z.string().catch('')
}) satisfies z.ZodType<RefLine>;

const fileShape = z.object({
    root: z.string(),
    path: z.string(),
    library: z.string().optional().catch(undefined),
    lines: rowsShape(lineShape)
}) satisfies z.ZodType<RefFile>;

const stateShape = z.object({
    search: searchShape.nullable().catch(null),
    files: rowsShape(fileShape).catch([]),
    history: rowsShape(searchShape).catch([])
});

/** A tab's saved state, or the empty one for anything that is not a state. */
export function parseRefsState(value: unknown): RefsState {
    const held = readAs(stateShape, value);
    return held === null ? EMPTY_REFS : { ...held, history: held.history.slice(0, HISTORY_KEPT) };
}

/** How many locations and files a result holds. */
export function totals(files: readonly RefFile[]): { locations: number; files: number } {
    return {
        locations: files.reduce((sum, file) => sum + file.lines.length, 0),
        files: files.length
    };
}

/** One location a walk or a press opens. */
export type RefPick = {
    root: string;
    path: string;
    library?: string;
    line: number;
    column: number;
};

/** The locations of a result in the order they are drawn: by file, then by line. */
export function picks(files: readonly RefFile[]): RefPick[] {
    return files.flatMap((file) =>
        file.lines.map((one) => ({
            root: file.root,
            path: file.path,
            ...(file.library === undefined ? {} : { library: file.library }),
            line: one.line,
            column: one.start + 1
        }))
    );
}

/** The place after or before `at` in a result, wrapping round; -1 when there is none. */
export function stepped(count: number, at: number, delta: 1 | -1): number {
    if (count === 0) return -1;
    if (at < 0) return delta === 1 ? 0 : count - 1;
    return (at + delta + count) % count;
}

/** A search's key, which tells two searches of the same place apart from the same one run twice. */
export function searchKey(search: RefSearch): string {
    return JSON.stringify([search.kind, search.root, search.path, search.line, search.column]);
}

/** A search put first in the history, once, and the history cut to what it keeps. */
export function remembered(history: readonly RefSearch[], search: RefSearch): RefSearch[] {
    const key = searchKey(search);
    return [search, ...history.filter((one) => searchKey(one) !== key)].slice(0, HISTORY_KEPT);
}

/** A location without the one the reader dismissed. */
export function withoutLine(
    files: readonly RefFile[],
    root: string,
    path: string,
    line: number,
    start: number
): RefFile[] {
    return files
        .map((file) =>
            file.root === root && file.path === path
                ? {
                      ...file,
                      lines: file.lines.filter((one) => !(one.line === line && one.start === start))
                  }
                : file
        )
        .filter((file) => file.lines.length > 0);
}

/** A file without the locations the reader dismissed with it. */
export function withoutFile(files: readonly RefFile[], root: string, path: string): RefFile[] {
    return files.filter((file) => !(file.root === root && file.path === path));
}

/** The lines Copy All and Copy put on the clipboard: `path:line:column` for each location. */
export function copyText(files: readonly RefFile[]): string {
    return files
        .flatMap((file) =>
            file.lines.map(
                (one) => `${file.library ?? file.path}:${String(one.line)}:${String(one.start + 1)}`
            )
        )
        .join('\n');
}
