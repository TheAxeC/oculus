// Layer 2, client state. The pure parts of the debug store: what is kept in the browser's storage
// and how it is read back, the breakpoint lists and how they move, the console a page holds and how
// an append continues it, the console's rows with identical neighbours drawn once, the earlier
// inputs offered under the console's input, and the value a hover shows.
//
// Nothing here reads the page: each function takes its values and answers a new one, so a test
// hands it plain objects. The storage is read through zod, so a value of another shape, a storage
// that throws, or no storage gives empty lists.

import { z } from 'zod';
import {
    DEBUG_CONSOLE_MAX,
    type DebugBreakpoint,
    type DebugConsole,
    type DebugConsoleAppend,
    type DebugConsoleLine,
    type DebugPayload
} from '../../../../data/model/index.ts';
import { deepestHolding } from '../../../../data/helpers/files/paths.ts';
import { mapOfShape, rowsShape } from '../../../../data/shapes/shapes.ts';
import type { ServedRoot } from '../../../sources/repositories/file-git.ts';

/** The key the breakpoints, watch expressions, chosen configurations and toolbar are kept under. */
export const DEBUG_KEY = 'oculus.debug.v1';

/** What the store needs of a Storage, so a test can hand it a plain object. */
export type Storable = Pick<Storage, 'getItem' | 'setItem'>;

/** How a breakpoint is drawn: the adapter holds it, has not yet, or the reader turned it off. */
export type MarkerState = 'verified' | 'unverified' | 'disabled';

/** A breakpoint as the editor draws it: its line, counting from one, and how it is drawn. */
export type Marker = { line: number; state: MarkerState };

/** A breakpoint the reader set: its line, and whether it is sent to the adapter. */
export type Point = { line: number; enabled: boolean };

/** What the browser keeps of the debugger. */
export type SavedDebug = {
    /** The breakpoints of each file, by absolute path, in line order. */
    breakpoints: Record<string, Point[]>;
    /** The function breakpoints' names. */
    functions: string[];
    /** The watch expressions, in the order the reader gave them. */
    watch: string[];
    /** The configuration chosen for each repository, by repository path. */
    chosen: Record<string, string>;
    /** How far the floating toolbar sits from the left of the workbench, in pixels. */
    toolbar: number | null;
};

const pointShape: z.ZodType<Point> = z.object({
    line: z.number().int().min(1),
    enabled: z.boolean().catch(true)
});

const savedShape = z.object({
    version: z.literal(1),
    breakpoints: mapOfShape(rowsShape(pointShape)).catch(() => ({})),
    functions: rowsShape(z.string().min(1)).catch(() => []),
    watch: rowsShape(z.string().min(1)).catch(() => []),
    chosen: mapOfShape(z.string()).catch(() => ({})),
    toolbar: z.number().nullable().catch(null)
});

/** What a browser that kept nothing holds. */
export function nothingSaved(): SavedDebug {
    return { breakpoints: {}, functions: [], watch: [], chosen: {}, toolbar: null };
}

/** What the storage holds, or nothing for a value that does not read or a storage that throws. */
export function loadSaved(storage: Storable | undefined): SavedDebug {
    try {
        const raw = storage?.getItem(DEBUG_KEY) ?? null;
        if (raw === null) return nothingSaved();
        const read = savedShape.safeParse(JSON.parse(raw));
        if (!read.success) return nothingSaved();
        const { version: _version, ...kept } = read.data;
        return kept;
    } catch {
        return nothingSaved();
    }
}

/** Write what is kept; a storage that throws keeps nothing and the page goes on. */
export function writeSaved(storage: Storable | undefined, saved: SavedDebug): void {
    try {
        storage?.setItem(DEBUG_KEY, JSON.stringify({ version: 1, ...saved }));
    } catch {
        // The breakpoints are kept for this page only.
    }
}

/** The lines in order, one breakpoint to a line, the first of two on a line kept. */
function ordered(points: readonly Point[]): Point[] {
    const seen = new Set<number>();
    return points
        .filter((one) => !seen.has(one.line) && seen.add(one.line))
        .sort((a, b) => a.line - b.line);
}

/** The breakpoints with one on the line taken away or, when there was none, one added. */
export function toggled(points: readonly Point[], line: number): Point[] {
    const held = points.some((one) => one.line === line);
    return held
        ? points.filter((one) => one.line !== line)
        : ordered([...points, { line, enabled: true }]);
}

/**
 * The breakpoints after an edit moved them: `lines` are where the first of them, the second of
 * them and so on now sit, in the order they were handed to the editor. A breakpoint keeps whether
 * it is enabled, and two that met on a line are one.
 */
export function movedTo(points: readonly Point[], lines: readonly number[]): Point[] {
    if (lines.length !== points.length) return [...points];
    return ordered(points.map((one, at) => ({ line: lines[at], enabled: one.enabled })));
}

/** The lines of the breakpoints the adapter is sent. */
export function enabledLines(points: readonly Point[]): number[] {
    return points.filter((one) => one.enabled).map((one) => one.line);
}

/**
 * How a breakpoint is drawn: off, held by the adapter, or not yet held. `answers` is null with no
 * session, when nothing has refused a breakpoint.
 */
export function stateOf(point: Point, answers: readonly DebugBreakpoint[] | null): MarkerState {
    if (!point.enabled) return 'disabled';
    if (answers === null) return 'verified';
    return answers.find((one) => one.line === point.line)?.verified === true
        ? 'verified'
        : 'unverified';
}

/** The adapter's reason a breakpoint is not held, or the empty string. */
export function messageOf(point: Point, answers: readonly DebugBreakpoint[]): string {
    return point.enabled ? (answers.find((one) => one.line === point.line)?.message ?? '') : '';
}

/** The console a page that has heard nothing holds. */
export const EMPTY_CONSOLE: DebugConsole = { session: 0, first: 0, lines: [] };

/** The console cut to its last DEBUG_CONSOLE_MAX lines, `first` raised by the lines dropped. */
function capped(held: DebugConsole): DebugConsole {
    const over = held.lines.length - DEBUG_CONSOLE_MAX;
    if (over <= 0) return held;
    return { session: held.session, first: held.first + over, lines: held.lines.slice(over) };
}

/**
 * The console after an append of the server: the lines it adds past the end of the held console
 * when it continues it (the next line, or lines overlapping the end), the new session's console
 * when it opens one, and `null` for an append the page cannot place, which is when the page reads
 * the whole console.
 */
export function consoleAfter(held: DebugConsole, append: DebugConsoleAppend): DebugConsole | null {
    if (append.session !== held.session) {
        return append.start === 0
            ? capped({ session: append.session, first: 0, lines: append.lines })
            : null;
    }
    const end = held.first + held.lines.length;
    if (append.start > end) return null;
    const fresh = append.lines.slice(Math.max(0, end - append.start));
    return fresh.length === 0 ? held : capped({ ...held, lines: [...held.lines, ...fresh] });
}

/** A console with no line held for a session just begun. */
export function consoleOfSession(session: number): DebugConsole {
    return { session, first: 0, lines: [] };
}

/** One row of the console: a line drawn with how many identical lines in a row it stands for. */
export type ConsoleRow = {
    kind: DebugConsoleLine['kind'];
    text: string;
    count: number;
    at: number;
};

/** The console's lines with each run of identical neighbours of one kind drawn as one row. */
export function consoleRows(lines: readonly DebugConsoleLine[]): ConsoleRow[] {
    const rows: ConsoleRow[] = [];
    lines.forEach((line, at) => {
        const last = rows.at(-1);
        if (last?.kind === line.kind && last.text === line.text) {
            last.count += 1;
        } else {
            rows.push({ kind: line.kind, text: line.text, count: 1, at });
        }
    });
    return rows;
}

/** The earlier inputs that start with what is typed, the newest first, each once. */
export function historyMatches(history: readonly string[], typed: string): string[] {
    if (typed === '') return [];
    const found: string[] = [];
    for (const one of [...history].reverse()) {
        if (one !== typed && one.startsWith(typed) && !found.includes(one)) found.push(one);
    }
    return found;
}

/** The value the selected frame's scopes give a name, or null for a name no scope holds. */
export function scopeValue(payload: DebugPayload, name: string): string | null {
    for (const scope of payload.scopes) {
        const found = scope.variables.find((one) => one.name === name);
        if (found !== undefined) return found.value;
    }
    return null;
}

/**
 * The repository a file belongs to: the deepest git root holding it, else the served root holding
 * it, else null.
 */
export function repoOfFile(
    gitRoots: readonly string[],
    served: readonly ServedRoot[],
    file: string
): string | null {
    const repo = deepestHolding(gitRoots, (root) => root, file);
    if (repo !== null) return repo.item;
    return deepestHolding(served, (root) => root.dir, file)?.item.dir ?? null;
}

/** The text a new `.oculus/launch.yml` holds. */
export const LAUNCH_TEXT =
    'configurations:\n    - name: Debug the open file\n      program: ${file}\n';

/** What a debug key asks of the debugger. */
export type DebugKey = 'start' | 'stop' | 'restart' | 'toggle' | 'over' | 'into' | 'out';

/** The parts of a key press a debug key is read from. */
type Press = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey'>;

/**
 * The debug key a press is, as VS Code binds them: F5 starts or continues, Shift+F5 stops,
 * Cmd+Shift+F5 (Ctrl+Shift+F5 off macOS) restarts, F9 toggles a breakpoint at the caret, F10 steps
 * over, F11 steps into and Shift+F11 out. Null for any other press, including the same keys with
 * Alt held or with the other of Cmd and Ctrl.
 */
export function debugKeyOf(press: Press, mac: boolean): DebugKey | null {
    if (press.altKey || (mac ? press.ctrlKey : press.metaKey)) return null;
    const command = mac ? press.metaKey : press.ctrlKey;
    if (press.key === 'F5') {
        if (command) return press.shiftKey ? 'restart' : null;
        return press.shiftKey ? 'stop' : 'start';
    }
    if (command) return null;
    if (press.key === 'F9') return press.shiftKey ? null : 'toggle';
    if (press.key === 'F10') return press.shiftKey ? null : 'over';
    if (press.key === 'F11') return press.shiftKey ? 'out' : 'into';
    return null;
}
