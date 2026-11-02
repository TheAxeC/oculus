// Layer 2, server. What the `pty:` channels (channel.ts) need of tmux, and the control clients that
// give it. A by-hand terminal is one pane of a session oculus did not start: its client attaches to
// that session by the tmux session id the list gave and hands on the output of that pane alone, so
// two agents in one session share nothing. A control client that sends no size leaves the session's
// windows as the user has them, and `-E` leaves its environment so: an attach otherwise copies
// tmux's `update-environment` names from this process into the session.

import {
    control,
    run,
    tmuxRuns,
    RESTART_MS,
    type ControlClient,
    type TmuxOptions
} from '../tmux.ts';
import { paneTarget, sessionName } from './target.ts';

/** Milliseconds with nothing attached before the control client is closed. */
const IDLE_MS = 60000;

/** The tmux notifications that mean the terminal list or the pane map moved. */
const CHANGE_EVENTS = new Set([
    'sessions-changed',
    'session-changed',
    'session-renamed',
    'session-window-changed',
    'window-add',
    'window-close',
    'unlinked-window-add',
    'unlinked-window-close',
    'exit'
]);

/**
 * What the channels need of tmux. The default is the control client below; a test passes a recorder
 * so that every tmux command the channels build is an assertion rather than a process.
 */
export type TerminalDriver = {
    /** One tmux command, the argument list sessions.ts built. */
    run(args: string[]): Promise<string>;
    /**
     * One read of an attached terminal's pane, run by its control client once that client is
     * attached, so `replied` is called at the reply's place in the terminal's output (tmux.ts,
     * `command`). The reads of one terminal run in the order they were asked. A terminal with no
     * attached control client is read by `run`, and `replied` is called as the answer comes.
     */
    read(id: string, args: string[], replied: () => void): Promise<string>;
    /** Pane output, already routed to the terminal it belongs to. */
    onOutput(listener: (id: string, bytes: Buffer) => void): void;
    /** Something tmux said that moves the terminal list. */
    onChange(listener: () => void): void;
    /**
     * The terminals the page is attached to; the control client follows them. `sessions` holds the
     * tmux session of each by-hand id among them.
     */
    attached(ids: string[], sessions: ReadonlyMap<string, string>): void;
    /** Whether a control client is open, which is what turns the poll off. */
    live(): boolean;
    /**
     * Whether the process with this pid is a running tmux. It is asked of the operating system and
     * not of tmux, so it answers while the socket of a running server cannot be reached.
     */
    serverRuns(pid: number): Promise<boolean>;
    close(): void;
};

/**
 * One control client per attached terminal, each restarted on its own when it exits and closed a
 * minute after its terminal has no page on it. tmux sends `%output` for the panes of the session a
 * control client is attached to and for no other (measured with two sessions on a
 * private server: a client attached to one saw nothing typed into the other), so one client for
 * every attached terminal is what makes every attached terminal stream. A client's output belongs
 * to its own terminal, by the pane for a by-hand one, so nothing here maps pane ids to sessions.
 */
export function tmuxDriver(options: TmuxOptions = {}): TerminalDriver {
    const clients = new Map<string, ControlClient>();
    const restarts = new Map<string, ReturnType<typeof setTimeout>>();
    const idles = new Map<string, ReturnType<typeof setTimeout>>();
    let ids = new Set<string>();
    let byHand: ReadonlyMap<string, string> = new Map();
    let closed = false;
    let outputs: (id: string, bytes: Buffer) => void = () => {
        // Bytes read before attach() wires a sink have nowhere to go.
    };
    let changed: () => void = () => {
        // The same for a roster change: nobody is listening until attach().
    };

    const unref = (timer: ReturnType<typeof setTimeout>): void => {
        if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
    };

    const forget = (timers: Map<string, ReturnType<typeof setTimeout>>, id: string): void => {
        const timer = timers.get(id);
        if (timer === undefined) return;
        clearTimeout(timer);
        timers.delete(id);
    };

    /** The tmux session each terminal's client was last opened on. */
    const opened = new Map<string, string>();

    const open = (id: string): void => {
        if (closed || clients.has(id) || !ids.has(id)) return;
        const only = paneTarget(id);
        const session = byHand.get(id) ?? sessionName(id);
        opened.set(id, session);
        const client = control(
            session,
            {
                output: (pane, bytes) => {
                    if (only === null || pane === only) outputs(id, bytes);
                },
                event: (event) => {
                    if (CHANGE_EVENTS.has(event.name)) changed();
                },
                exit: () => {
                    if (clients.get(id) === client) clients.delete(id);
                    if (closed || !ids.has(id)) return;
                    forget(restarts, id);
                    const timer = setTimeout(() => {
                        restarts.delete(id);
                        open(id);
                    }, RESTART_MS);
                    unref(timer);
                    restarts.set(id, timer);
                }
            },
            options,
            only === null ? [] : ['-E']
        );
        clients.set(id, client);
    };

    /** The last read of each terminal that went to `run`, which the next one waits for. */
    const reads = new Map<string, Promise<unknown>>();

    const runRead = (id: string, args: string[], replied: () => void): Promise<string> => {
        const after = (reads.get(id) ?? Promise.resolve()).then(
            () => run(args, options),
            () => run(args, options)
        );
        const done = after.then((text) => {
            replied();
            return text;
        });
        reads.set(id, done);
        void done
            .finally(() => {
                if (reads.get(id) === done) reads.delete(id);
            })
            .catch(() => undefined);
        return done;
    };

    const drop = (id: string): void => {
        forget(restarts, id);
        forget(idles, id);
        clients.get(id)?.close();
        clients.delete(id);
    };

    return {
        run: (args: string[]) => run(args, options),
        read(id, args, replied): Promise<string> {
            const client = clients.get(id);
            if (client === undefined) return runRead(id, args, replied);
            // Reads asked in one turn are written in that order before any reply is read, so tmux
            // takes them together.
            return client
                .ready()
                .then((attached) =>
                    attached && client.live()
                        ? client.command(args, replied)
                        : runRead(id, args, replied)
                );
        },
        onOutput(listener): void {
            outputs = listener;
        },
        onChange(listener): void {
            changed = listener;
        },
        attached(next, sessions): void {
            ids = new Set(next);
            byHand = sessions;
            for (const id of ids) {
                forget(idles, id);
                // A by-hand pane's session can go, or the pane can move, with the pane still there.
                if (byHand.has(id) && opened.get(id) !== byHand.get(id)) drop(id);
                if (!clients.has(id)) open(id);
            }
            for (const id of clients.keys()) {
                if (ids.has(id) || idles.has(id)) continue;
                const timer = setTimeout(() => {
                    idles.delete(id);
                    if (!ids.has(id)) drop(id);
                }, IDLE_MS);
                unref(timer);
                idles.set(id, timer);
            }
        },
        live(): boolean {
            for (const client of clients.values()) if (client.live()) return true;
            return false;
        },
        serverRuns: tmuxRuns,
        close(): void {
            closed = true;
            for (const id of [...clients.keys()]) drop(id);
            for (const id of [...restarts.keys()]) forget(restarts, id);
            for (const id of [...idles.keys()]) forget(idles, id);
        }
    };
}
