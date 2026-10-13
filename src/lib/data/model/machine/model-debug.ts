// Layer 1, data. What the debug view reads: the state of the one debug session (its frames,
// scopes, watches, breakpoints and capabilities), the console it prints, and the configurations of
// a repository's launch file.

import type { CommandFinding } from '../model-sessions.ts';

/** Where a debug session stands: no session yet, starting, running, paused, or ended. */
export const DEBUG_STATUSES = ['idle', 'starting', 'running', 'paused', 'ended'] as const;
export type DebugStatus = (typeof DEBUG_STATUSES)[number];

/** The session a debug launch made: what it runs, where, and the adapter's process. */
export type DebugSession = {
    /** The repository the launch belongs to, as a real path. */
    repo: string;
    /** The configuration's name, or the default configuration's. */
    name: string;
    /** The program as run: an absolute path. */
    program: string;
    /** The folder the adapter runs in: an absolute real path. */
    cwd: string;
    /** The adapter's process id, 0 while it has none. */
    pid: number;
    /** The session's number, which grows by one for each launch the server answers. */
    number: number;
};

/** One frame of the stack, the top one first; `path` is the file as the page named it. */
export type DebugFrame = {
    id: number;
    name: string;
    path: string;
    line: number;
    column: number;
};

/** One name and the value the adapter gives it. */
type DebugVariable = { name: string; value: string };

/** One scope of the selected frame and what it holds; `reference` names it to the adapter. */
export type DebugScope = { name: string; reference: number; variables: DebugVariable[] };

/** A watch expression's result at the pause: its value or the adapter's error, one of them. */
export type DebugWatch = { expression: string; value?: string; error?: string };

/** One line the adapter answered a breakpoint for. `line` is the line the page asked for. */
export type DebugBreakpoint = {
    line: number;
    verified: boolean;
    /** The adapter's reason a breakpoint is not verified; empty when it is. */
    message: string;
    /** The condition, hit condition and log message the breakpoint was set with; empty for none. */
    condition: string;
    hitCondition: string;
    logMessage: string;
};

/** The breakpoints of one file as the adapter last answered them. */
export type DebugFileBreakpoints = { path: string; breakpoints: DebugBreakpoint[] };

/** One function breakpoint as the adapter last answered it. */
export type DebugFunctionBreakpoint = {
    name: string;
    verified: boolean;
    message: string;
    condition: string;
    hitCondition: string;
};

/**
 * What a breakpoint carries beside its line, as the page holds it and a launch or a change sends
 * it.
 */
export type DebugBreakpointSpec = {
    line: number;
    condition?: string;
    hitCondition?: string;
    logMessage?: string;
};

/** One exception breakpoint filter an adapter offers, and whether it is on. */
export type DebugExceptionFilter = {
    filter: string;
    label: string;
    enabled: boolean;
    supportsCondition: boolean;
    condition: string;
};

/**
 * What an adapter declared in its answer to `initialize`, as the controls follow it. Pause is not
 * among them: the protocol has no capability for it, and every adapter takes the request. The
 * oculus adapter's are fixed.
 */
export type DebugCapabilities = {
    conditions: boolean;
    hitConditions: boolean;
    logpoints: boolean;
    functions: boolean;
    functionConditions: boolean;
    setVariable: boolean;
    restart: boolean;
    terminate: boolean;
    hover: boolean;
    completions: boolean;
    loadedSources: boolean;
    exceptionFilters: {
        filter: string;
        label: string;
        enabled: boolean;
        supportsCondition: boolean;
    }[];
};

/** Which adapter a session runs: oculus's own, or the debugger of an app. */
export type DebugAdapterInfo = { type: string; label: string; app: string };

/** A source the adapter reports loaded. */
export type DebugLoadedSource = { name: string; path: string };

/** Why the program is paused, as the adapter says it. */
type DebugPause = {
    /** The reason the adapter's `stopped` event names, such as `breakpoint`, `step` or `entry`. */
    reason: string;
    description: string;
};

/** The payload of the `debug` channel: the whole state, replaced by each message. */
export type DebugPayload = {
    status: DebugStatus;
    /** The session running or the last one that ran since the server started; null before any. */
    session: DebugSession | null;
    /** The reason of the current pause, null unless the status is `paused`. */
    pause: DebugPause | null;
    frames: DebugFrame[];
    /** The id of the selected frame, null unless the status is `paused`. */
    frame: number | null;
    /** The id of the thread the commands name: the one the adapter last stopped. */
    thread: number | null;
    scopes: DebugScope[];
    watch: DebugWatch[];
    breakpoints: DebugFileBreakpoints[];
    functions: DebugFunctionBreakpoint[];
    /** Why the session ended, in words; empty unless the status is `ended`. */
    ended: string;
    /** The adapter of the session, null before any. */
    adapter: DebugAdapterInfo | null;
    /** The exception filters of the session's adapter with their state. */
    exceptions: DebugExceptionFilter[];
    /** What each adapter type that answered `initialize` since the server started declared. */
    declared: Record<string, DebugCapabilities>;
};

/**
 * The kind of a console line: what the program wrote (`stdout`, `stderr`), what the adapter said
 * (`console`), an expression the reader typed (`input`) and its result or its error.
 */
export const DEBUG_CONSOLE_KINDS = [
    'stdout',
    'stderr',
    'console',
    'input',
    'result',
    'error'
] as const;
export type DebugConsoleKind = (typeof DEBUG_CONSOLE_KINDS)[number];

/** The most lines a session's console holds, on the server and on a page. */
export const DEBUG_CONSOLE_MAX = 10_000;

/** One line of the console. */
export type DebugConsoleLine = { kind: DebugConsoleKind; text: string };

/**
 * The payload of the `debug-console` channel: lines of one session appended to its console, the
 * first of them the console's line number `start`. Lines are numbered from 0 in each session.
 */
export type DebugConsoleAppend = { session: number; start: number; lines: DebugConsoleLine[] };

/** The console as the server holds it: `first` is the number of its first held line. */
export type DebugConsole = { session: number; first: number; lines: DebugConsoleLine[] };

/** One configuration of a repository's `.oculus/launch.yml`, its fields as written. */
export type DebugConfiguration = {
    name: string;
    /** The debugger's type: `rite` for oculus's own adapter, else the type an app declares. */
    type: string;
    /** `launch` or `attach`. */
    request: 'launch' | 'attach';
    /** The keys beside `name`, `type`, `request`, `program`, `cwd` and `before`, as written. */
    args: Record<string, unknown>;
    /** The `.rite` file to run: a path in the repository or a text holding placeholders. */
    program: string;
    /** The folder the adapter runs in relative to the repository; `.` for the repository. */
    cwd: string;
    /** The name of a command to run first; absent when none is named. */
    before?: string;
    /** The line the entry starts on in the file. */
    line?: number;
};

/** The answer of GET /api/debug: what the launch file holds and what in it did not read. */
export type DebugLaunches = {
    /** Whether `.oculus/launch.yml` is there. */
    exists: boolean;
    configurations: DebugConfiguration[];
    findings: CommandFinding[];
};
