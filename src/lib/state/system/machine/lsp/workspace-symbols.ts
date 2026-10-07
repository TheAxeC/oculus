// Layer 2, client state. The workspace symbols the palette's `#` list draws: the rows a server's
// `workspace/symbol` answer makes, and the asker a source tab registers so the palette can put the
// query to the server that serves the tab on screen (its language and root).
//
// A row is one symbol: its name, the container the server names for it, the symbol kind of the
// protocol, and the file and line it is in. A file of a served root has a root key and a path; a
// library file a server named has no root, and its path is the library address the relay gave the
// page, with `library` as the file's own name, as the References view's files are. A symbol whose
// answer holds a location with no range is at the file's first line. A server may name the range of
// the whole declaration (the TypeScript server does), which starts before the name, so the place a
// press opens is the name's own: the first whole-word match of the name from the range's start.

import { libraryOf, placeOf } from '../../../../data/prose/lsp-addresses.ts';

/** One symbol of the workspace. */
export type SymbolRow = {
    name: string;
    /** The name of what holds the symbol, empty for none. */
    container: string;
    /** The symbol kind of the protocol, from 1. */
    kind: number;
    root: string;
    path: string;
    /** The file's own name, for a library file. */
    library?: string;
    /** Counted from one. */
    line: number;
    column: number;
};

/** How many rows the palette draws of one answer. */
const ROWS_KEPT = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The rows of a `workspace/symbol` answer, in the order the server gave them. */
export function symbolRowsOf(answer: unknown): SymbolRow[] {
    if (!Array.isArray(answer)) return [];
    const rows: SymbolRow[] = [];
    for (const item of answer as unknown[]) {
        if (!isRecord(item) || typeof item.name !== 'string' || !isRecord(item.location)) continue;
        const uri = item.location.uri;
        if (typeof uri !== 'string') continue;
        const range = isRecord(item.location.range) ? item.location.range : null;
        const start = range !== null && isRecord(range.start) ? range.start : null;
        const line = typeof start?.line === 'number' ? start.line + 1 : 1;
        const column = typeof start?.character === 'number' ? start.character + 1 : 1;
        const library = libraryOf(uri);
        const place = library === null ? placeOf(uri) : null;
        if (library === null && place === null) continue;
        rows.push({
            name: item.name,
            container: typeof item.containerName === 'string' ? item.containerName : '',
            kind: typeof item.kind === 'number' ? item.kind : 0,
            ...(library === null
                ? { root: place?.root ?? '', path: place?.path ?? '' }
                : { root: '', path: library.library, library: library.name }),
            line,
            column
        });
        if (rows.length >= ROWS_KEPT) break;
    }
    return rows;
}

/** How many lines from the range's start the name is looked for in. */
const NAME_LINES = 8;

/**
 * The line and column of the symbol's name in the file's text: the first match of the name as a
 * whole word at or after the range's start, within a few lines of it; the range's start when none
 * is found.
 */
function placeOfName(
    text: string,
    row: Pick<SymbolRow, 'name' | 'line' | 'column'>
): { line: number; column: number } {
    if (row.name === '') return { line: row.line, column: row.column };
    const lines = text.split(/\r\n|\r|\n/);
    const word = /[A-Za-z0-9_$]/;
    for (let at = row.line - 1; at < Math.min(lines.length, row.line - 1 + NAME_LINES); at += 1) {
        const text = lines[at];
        let from = at === row.line - 1 ? row.column - 1 : 0;
        for (;;) {
            const found = text.indexOf(row.name, from);
            if (found < 0) break;
            const after = text[found + row.name.length] ?? '';
            const before = found === 0 ? '' : text[found - 1];
            if (!word.test(after) && !word.test(before)) return { line: at + 1, column: found + 1 };
            from = found + 1;
        }
    }
    return { line: row.line, column: row.column };
}

/** What a source tab answers for a query: the rows, or null when its server could not answer. */
type SymbolAsker = (query: string) => Promise<SymbolRow[] | null>;

export type WorkspaceSymbolsStore = {
    /** Make a source tab answerable for symbol queries; the call it returns ends that. */
    register: (instance: string, ask: SymbolAsker) => () => void;
    /** Put a query to the server of a source tab; null when the tab has none that answers. */
    ask: (instance: string, query: string) => Promise<SymbolRow[] | null>;
    /**
     * The line and column a press on a row opens at: the symbol's name, found in the file's text
     * when the row names a file of a served root, and the row's own place otherwise.
     */
    placeOf: (row: SymbolRow) => Promise<{ line: number; column: number }>;
};

/**
 * `read` gives the text of a file of a served root, or null when it cannot be read.
 */
export function createWorkspaceSymbols(
    read: (root: string, path: string) => Promise<string | null>
): WorkspaceSymbolsStore {
    const askers = new Map<string, SymbolAsker>();
    return {
        placeOf: async (row) => {
            if (row.library !== undefined) return { line: row.line, column: row.column };
            const text = await read(row.root, row.path);
            return text === null ? { line: row.line, column: row.column } : placeOfName(text, row);
        },
        register: (instance, ask) => {
            askers.set(instance, ask);
            return () => {
                if (askers.get(instance) === ask) askers.delete(instance);
            };
        },
        ask: (instance, query) => askers.get(instance)?.(query) ?? Promise.resolve(null)
    };
}
