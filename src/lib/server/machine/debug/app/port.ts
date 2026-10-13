// Layer 2, server. What the debug client asks of the apps' hosts and what a host asks of the
// client. The client (session.ts) runs a session against the adapter of an app's debugger through
// an `AppDebugPort`: it gets the debugger a configuration names, the configuration the app's
// providers resolve, and the stream the adapter's messages ride on. A host starts, stops and
// sends custom requests to a session through a `DebugControl`. Both are types here so that
// neither side imports the other: apps/tools/debug.ts makes the port, session.ts makes the
// control, and the composition root joins them.

import type { AppDebugger } from '../../../../data/model/index.ts';

/** A debugger of an acting app, and the app that declares it. */
type AppDebuggerEntry = { app: string; appTitle: string; debugger: AppDebugger };

/** The adapter's end of a stream, which carries the adapter's messages as objects. */
export type AppCarrier = {
    send(message: unknown): void;
    onMessage(listener: (message: Record<string, unknown>) => void): void;
    onStderr(listener: (text: string) => void): void;
    /** Called once when the stream ends, with the exit code the host reported. */
    onClose(listener: (code: number | null) => void): void;
    close(): void;
};

/** The session an adapter is started for, as the host's `DebugSession` shows it. */
export type AppSessionInfo = {
    id: string;
    type: string;
    name: string;
    /** The file URI of the workspace folder, or the empty text. */
    folder: string;
    configuration: Record<string, unknown>;
};

/** The two moments a provider resolves a configuration. */
export type ResolveStage = 'initial' | 'substituted';

/**
 * What a provider answered for a configuration: the configuration, or that the launch is aborted.
 */
export type Resolved = { configuration: Record<string, unknown> } | { abort: true };

/** How the debug client reaches the debuggers of the apps. */
export type AppDebugPort = {
    /** The debuggers of the acting apps, in the Views list's order. */
    debuggers(): AppDebuggerEntry[];
    /** Start the host of the app that declares a type, for a debug launch; whether it runs. */
    activate(type: string): Promise<boolean>;
    /** Ask the host to start the adapter of a type for a session; the stream it opens. */
    open(type: string, session: AppSessionInfo, cwd: string): Promise<AppCarrier>;
    /** The configurations the providers of a type offer for Add Configuration. */
    configurations(type: string, folder: string): Promise<Record<string, unknown>[]>;
    /** Ask the providers of a type to resolve a configuration. */
    resolve(
        type: string,
        folder: string,
        configuration: Record<string, unknown>,
        stage: ResolveStage
    ): Promise<Resolved>;
    /** Tell the host that declares a type an event of its session. */
    tell(type: string, event: Record<string, unknown>): void;
    /** Tell every host that registered a debugger an event that is not about one session. */
    broadcast(event: Record<string, unknown>): void;
};

/** A session of an app's debugger as the control reports it. */
type ControlSession = { id: string; type: string };

/** How a host reaches the client's session. */
export type DebugControl = {
    /** Start a session from a `launch.yml` entry by its name, or from a configuration. */
    start(request: {
        app: string;
        folder: string;
        name: string;
        configuration: Record<string, unknown> | null;
    }): Promise<boolean>;
    /** End a session by its id; whether one ended. */
    stop(session: string): Promise<boolean>;
    /** A custom request to the adapter of a session. */
    custom(session: string, command: string, args: unknown): Promise<unknown>;
    /** The session now running, or null. */
    current(): ControlSession | null;
};
