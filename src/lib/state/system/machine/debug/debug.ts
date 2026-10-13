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
    type DebugBreakpointSpec,
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

/**
 * A breakpoint the reader set: its line, whether it is sent to the adapter, and the condition, hit
 * condition and log message it is set with. A breakpoint with a log message is a logpoint. An empty
 * or absent field is not set.
 */
export type Point = {
    line: number;
    enabled: boolean;
    condition?: string | undefined;
    hitCondition?: string | undefined;
    logMessage?: string | undefined;
};

/** The text, or undefined for the empty text, which clears a field of a breakpoint. */
export function filled(text: string | undefined): string | undefined {
    return text === undefined || text === '' ? undefined : text;
}

/** The condition and hit condition a function breakpoint is set with. */
export type FunctionOptions = { condition?: string | undefined; hitCondition?: string | undefined };

/** What the browser keeps of the debugger. */
export type SavedDebug = {
    /** The breakpoints of each file, by absolute path, in line order. */
    breakpoints: Record<string, Point[]>;
    /** The function breakpoints' names. */
    functions: string[];
    /** The condition and hit condition of function breakpoints, by name. */
    functionOptions: Record<string, FunctionOptions>;
    /** The watch expressions, in the order the reader gave them. */
    watch: string[];
    /** The configuration chosen for each repository, by repository path. */
    chosen: Record<string, string>;
    /** How far the floating toolbar sits from the left of the workbench, in pixels. */
    toolbar: number | null;
};

const pointShape: z.ZodType<Point> = z.object({
    line: z.number().int().min(1),
    enabled: z.boolean().catch(true),
    condition: z.string().optional().catch(undefined),
    hitCondition: z.string().optional().catch(undefined),
    logMessage: z.string().optional().catch(undefined)
});

const optionsShape: z.ZodType<FunctionOptions> = z.object({
    condition: z.string().optional().catch(undefined),
    hitCondition: z.string().optional().catch(undefined)
});

const savedShape = z.object({
    version: z.literal(1),
    breakpoints: mapOfShape(rowsShape(pointShape)).catch(() => ({})),
    functions: rowsShape(z.string().min(1)).catch(() => []),
    functionOptions: mapOfShape(optionsShape).catch(() => ({})),
    watch: rowsShape(z.string().min(1)).catch(() => []),
    chosen: mapOfShape(z.string()).catch(() => ({})),
    toolbar: z.number().nullable().catch(null)
});

/** What a browser that kept nothing holds. */
export function nothingSaved(): SavedDebug {
    return {
        breakpoints: {},
        functions: [],
        functionOptions: {},
        watch: [],
        chosen: {},
        toolbar: null
    };
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
    return ordered(points.map((one, at) => ({ ...one, line: lines[at] })));
}

/** The breakpoints the adapter is sent: the enabled ones, each with the fields it is set with. */
export function enabledSpecs(points: readonly Point[]): DebugBreakpointSpec[] {
    return points
        .filter((one) => one.enabled)
        .map((one) => ({
            line: one.line,
            ...(one.condition ? { condition: one.condition } : {}),
            ...(one.hitCondition ? { hitCondition: one.hitCondition } : {}),
            ...(one.logMessage ? { logMessage: one.logMessage } : {})
        }));
}

/** The function breakpoints the adapter is sent, each with the fields it is set with. */
export function functionSpecs(
    names: readonly string[],
    options: Readonly<Record<string, FunctionOptions>>
): { name: string; condition?: string; hitCondition?: string }[] {
    return names.map((name) => {
        const set = Object.hasOwn(options, name) ? options[name] : undefined;
        return {
            name,
            ...(set?.condition ? { condition: set.condition } : {}),
            ...(set?.hitCondition ? { hitCondition: set.hitCondition } : {})
        };
    });
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

/**
 * The words for a paused session: those of its reason, the three kinds of breakpoint sharing the
 * words of a breakpoint, or for a reason the protocol does not name, the adapter's own description
 * of it, else the reason itself.
 */
function pausedWords(
    pause: DebugPayload['pause'],
    t: (key: string, ...args: string[]) => string
): string {
    const reason = pause?.reason ?? '';
    switch (reason) {
        case 'step':
            return t('debug.state_paused_step');
        case 'breakpoint':
        case 'function breakpoint':
        case 'data breakpoint':
        case 'instruction breakpoint':
            return t('debug.state_paused_breakpoint');
        case 'exception':
            return t('debug.state_paused_exception');
        case 'pause':
            return t('debug.state_paused_pause');
        case 'entry':
            return t('debug.state_paused_entry');
        case 'goto':
            return t('debug.state_paused_goto');
    }
    const description = pause?.description ?? '';
    const said = description === '' ? reason : description;
    return said === '' ? t('debug.state_paused_pause') : t('debug.state_paused_other', said);
}

/** The words the Debug view's state line shows for a session's state, from the catalog's `t`. */
export function stateWords(
    now: DebugPayload,
    t: (key: string, ...args: string[]) => string
): string {
    switch (now.status) {
        case 'idle':
            return t('debug.state_idle');
        case 'starting':
            return t('debug.state_starting');
        case 'running':
            return t('debug.state_running');
        case 'paused':
            return pausedWords(now.pause, t);
        case 'ended':
            return t('debug.state_ended', now.ended);
    }
}
