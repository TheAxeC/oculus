// Layer 2, server. The types the debug client (session.ts) and the code that starts a session
// (start.ts) share: what a launch carries, what the client is made of, and the state of one run of
// an adapter. The events of the protocol the client reads or leaves alone are named here, since any
// other event is the adapter's own and is told to the host of the debugger.

import type { DebugBreakpointSpec, DebugConsoleKind } from '../../../../data/model/index.ts';
import type { Hub } from '../../../core/channels.ts';
import type { Spawn } from '../../lsp/held/process.ts';
import type { Adapter } from '../app/adapter.ts';
import { RITE, RITE_CAPABILITIES, type Declared } from '../app/capabilities.ts';
import { THREAD, type Wire } from '../wire.ts';

/** The milliseconds from SIGTERM to SIGKILL when the options name none. */
export const KILL_MS = 2000;

/** A function breakpoint as the page holds it. */
export type FunctionSpec = { name: string; condition?: string; hitCondition?: string };

/** The debugger of an app a launch runs, and the configuration its providers resolved. */
export type AppLaunch = {
    /** The view id of the app. */
    app: string;
    type: string;
    label: string;
    request: 'launch' | 'attach';
    /** The configuration as the adapter is launched or attached with it. */
    configuration: Record<string, unknown>;
    /** The file URI of the workspace folder, or the empty text. */
    folder: string;
};

/** What a launch carries: the program and folder the route resolved, and what the page holds. */
export type LaunchRequest = {
    repo: string;
    name: string;
    /** The absolute path of the `.rite` file; the empty text for a debugger of an app. */
    program: string;
    /** The absolute real path of the folder the adapter runs in. */
    cwd: string;
    breakpoints: { path: string; lines: DebugBreakpointSpec[] }[];
    functions: FunctionSpec[];
    watch: string[];
    /** Present for a debugger of an app; absent for oculus's own adapter. */
    app?: AppLaunch;
};

/** What the client is made of: the hub, how a child is spawned, and the values read at a launch. */
export type DebugOptions = {
    hub: Hub;
    spawn: Spawn;
    /** The adapter's program, `rite_dap_bin` of local.yml, read at each launch. */
    adapter: () => string;
    /** The text catalog, which words the sentences of `server.debug`. */
    catalog: () => Record<string, string>;
    /** The milliseconds from SIGTERM to SIGKILL. */
    killAfterMs?: number;
};

/** A refusal, in words. */
export type Refusal = { error: string };

/** The commands that let a paused program go on. */
export type Resume = 'continue' | 'next' | 'stepIn' | 'stepOut' | 'finishFrame';

/** What belongs to one started adapter. */
export type Run = {
    number: number;
    adapter: Adapter | null;
    wire: Wire | null;
    /** The debugger type: `rite` or an app's. */
    type: string;
    /** The app's debugger and the configuration it runs; null for the oculus adapter. */
    app: AppLaunch | null;
    /** What the adapter declared in its answer to `initialize`; the oculus adapter's until then. */
    capabilities: Declared;
    /** The thread the commands name: the one the adapter last stopped, `THREAD` before any. */
    thread: number;
    /** Whether the adapter said `terminated` or `exited`, so its end is the program's. */
    ended: boolean;
    /** Whether the host of the debugger was told the session started. */
    started: boolean;
    /** The real path of each file the page named, to the path it named it by. */
    named: Map<string, string>;
    /** Bumped at each pause and each resume; an answer asked in an earlier one is dropped. */
    stop: number;
    stopping: boolean;
    over: boolean;
    /** The sentence a failure of the adapter's messages ended the session with. */
    failure: string | null;
    /** The unfinished last line of each output kind. */
    partial: Map<DebugConsoleKind, string>;
    /** Resolves when the adapter said `initialized`, or the run is over. */
    initialized: Promise<void>;
    isInitialized: () => void;
    /** Resolves when the handshake and the first breakpoints are done. */
    armed: Promise<void>;
    killTimer: ReturnType<typeof setTimeout> | null;
};

/** The state of a run of an adapter that has just been asked for. */
export function newRun(number: number, app: AppLaunch | null): Run {
    let isInitialized: () => void = () => undefined;
    const initialized = new Promise<void>((resolve) => {
        isInitialized = resolve;
    });
    return {
        number,
        adapter: null,
        wire: null,
        type: app?.type ?? RITE,
        app,
        capabilities: RITE_CAPABILITIES,
        thread: THREAD,
        ended: false,
        started: false,
        named: new Map(),
        stop: 0,
        stopping: false,
        over: false,
        failure: null,
        partial: new Map(),
        initialized,
        isInitialized,
        armed: Promise.resolve(),
        killTimer: null
    };
}

/** The events of the protocol the client reads or leaves alone; any other is the adapter's own. */
export const STANDARD_EVENTS = [
    'initialized',
    'output',
    'stopped',
    'continued',
    'exited',
    'terminated',
    'thread',
    'breakpoint',
    'module',
    'loadedSource',
    'process',
    'capabilities',
    'progressStart',
    'progressUpdate',
    'progressEnd',
    'invalidated',
    'memory'
];

/**
 * The milliseconds an app's adapter has to end after it was told to, before its stream is closed.
 */
export const CLOSE_MS = 2000;
