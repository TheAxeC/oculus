// Layer 2, server. The `pty:<id>` channels of DESIGN.md's "The socket", and with the language
// server relay (server/machine/lsp/relay/relay.ts) the only place the socket accepts anything from
// the page beyond a subscription.
//
// A page subscribes to `pty:<id>`, gets what the pane already shows as its first message, and then
// one message per chunk tmux reports for that pane. It sends back `input` and `resize`, a `resize`
// also just before it subscribes, and both are accepted only from a socket the socket module found
// carrying the write token (server/root/socket.ts, which hands `gate` the `canWrite(sink)` that
// `inbound` asks); a socket without the token reads every channel and writes to none. That is
// DESIGN.md's "The socket accepts nothing from the page except subscriptions and, from a socket
// whose subscription carried the write token, terminal input and the frames of an `lsp:<language>`
// channel", made concrete for the terminals.
//
// A control client is opened per attached terminal and closed a minute after nothing is attached to
// that terminal, so a machine with no terminal open runs no tmux child. While one is open, tmux's
// own `%session-changed` and its relatives say when the terminal list moved; while none is, a
// `list-sessions` does, every five seconds while a page is attached to a terminal and once a minute
// while none is, since nothing but a hand-made session can move the list then. A task terminal
// stays in the list after its line ended, and tmux sends no notice when that happens, so while a
// task terminal runs the list is read every five seconds whether or not a page is attached and
// whether or not a control client is open, which is how its result reaches the page within five
// seconds of the line's end.
//
// Reads of the list run side by side and may answer in any order, so every read takes a turn when
// it starts and its answer is taken only while no read that started later has been taken: an older
// answer never puts back a list that a newer one has replaced. An answer of "no server" is read
// again before it is taken as an empty list, because tmux refuses a connection for a moment and
// that one answer would otherwise tell every page that all its terminals have ended.
//
// `Turns` (latex/turns.ts) serves the build requests of the terminal route one at a time per
// build; the `Terminals` of a server holds the one every request of that server shares.

import { z } from 'zod';
import { SCROLLBACK_LINES } from '../../../data/model/index.ts';
import type {
    Message,
    PtyPayload,
    Terminal,
    TerminalInput,
    TerminalResize
} from '../../../data/model/index.ts';
import type { Hub, Sink } from '../../core/channels.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import { paneScreen } from './capture.ts';
import {
    isTerminalId,
    listArgs,
    parseTerminals,
    serverPid,
    resizeArgs,
    inputArgs,
    sessionName
} from './sessions.ts';
import { Turns } from './latex/turns.ts';
import {
    control,
    run,
    tmuxRuns,
    RESTART_MS,
    type ControlClient,
    type TmuxOptions
} from './tmux.ts';

/** The prefix of a terminal channel. */
export const CHANNEL_PREFIX = 'pty:';

/** Milliseconds with nothing attached before the control client is closed. */
export const IDLE_MS = 60000;

/** Milliseconds between two `list-sessions` calls while a page is attached to a terminal. */
export const POLL_MS = 5000;

/**
 * Milliseconds between two `list-sessions` calls while nothing is attached and no task terminal
 * runs. Nobody is looking at a terminal then, and the only thing the list can report is a session
 * started outside oculus, so a minute is soon enough and costs a twelfth of the calls the attached
 * rate does.
 */
export const IDLE_POLL_MS = 60000;

/**
 * How many further reads confirm an answer of "no server" before it is taken as the empty list, and
 * the milliseconds before each. A tmux that has really exited says so on every read; one that
 * refused a single connection does not.
 */
export const NO_SERVER_CONFIRMS = 2;
export const NO_SERVER_CONFIRM_MS = 300;

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

/** The channel a terminal's output goes out on. */
export function ptyChannel(id: string): string {
    return `${CHANNEL_PREFIX}${id}`;
}

/** The terminal a channel names, or null when the channel is not a terminal's. */
export function channelTerminal(channel: string): string | null {
    if (!channel.startsWith(CHANNEL_PREFIX)) return null;
    const id = channel.slice(CHANNEL_PREFIX.length);
    return isTerminalId(id) ? id : null;
}

/**
 * Two chunks of one terminal as one. The Hub keeps only the newest message per channel for a sink
 * that is behind, which for a stream of bytes would be output the page never sees; on a `pty:`
 * channel the held chunk and the next one are joined instead, so a slow page is late and never
 * short. The version is the newer one's, since that is how many chunks have gone out.
 */
export function mergeChunks(held: Message, next: Message): Message {
    const first = Buffer.from((held.payload as PtyPayload).bytes, 'base64');
    const second = Buffer.from((next.payload as PtyPayload).bytes, 'base64');
    return {
        channel: next.channel,
        version: next.version,
        payload: { bytes: Buffer.concat([first, second]).toString('base64') }
    };
}

/**
 * A number of any value, as the page's resize reports it: `typeof` is the whole test, so `NaN` and
 * the infinite numbers pass as they do for the tmux arguments built from them.
 */

/** The channel of a message: the text of a `pty:<id>` channel that names a terminal. */
const terminalChannelShape = z.string().refine((channel) => channelTerminal(channel) !== null);

/**
 * The two messages this module knows. A message of another type, a channel that names no terminal
 * and a field of the wrong type each refuse the whole message; the keys the shape does not name are
 * left out of the answer.
 */
const terminalMessageShape = z.union([
    z.object({ type: z.literal('input'), channel: terminalChannelShape, bytes: z.string() }),
    z.object({
        type: z.literal('resize'),
        channel: terminalChannelShape,
        cols: anyNumberShape,
        rows: anyNumberShape
    })
]) satisfies z.ZodType<TerminalInput | TerminalResize>;

/** One inbound message from the page, or null when it is neither of the two this module knows. */
export function terminalMessage(data: string): TerminalInput | TerminalResize | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(data);
    } catch {
        return null;
    }
    const message = terminalMessageShape.safeParse(parsed);
    return message.success ? message.data : null;
}

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
    /** The terminals the page is attached to; the control client follows them. */
    attached(ids: string[]): void;
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
 * to its own terminal, so nothing here maps pane ids to sessions.
 */
export function tmuxDriver(options: TmuxOptions = {}): TerminalDriver {
    const clients = new Map<string, ControlClient>();
    const restarts = new Map<string, ReturnType<typeof setTimeout>>();
    const idles = new Map<string, ReturnType<typeof setTimeout>>();
    let ids = new Set<string>();
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

    const open = (id: string): void => {
        if (closed || clients.has(id) || !ids.has(id)) return;
        const client = control(
            sessionName(id),
            {
                output: (_pane, bytes) => outputs(id, bytes),
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
            options
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
        attached(next: string[]): void {
            ids = new Set(next);
            for (const id of ids) {
                forget(idles, id);
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

/**
 * The terminals the hosts of apps hold as streams, which the list and the channels carry beside
 * tmux's: their rows, their output (the promise a listener returns holds the host's credit until
 * every page has taken the bytes), what a page that attaches is sent first, and what the pages
 * type and their sizes, which the terminal follows as the smallest of.
 */
export type StreamTerminals = {
    list(): Terminal[];
    has(id: string): boolean;
    onChange(listener: () => void): void;
    onOutput(listener: (id: string, bytes: Buffer) => void | Promise<void>): void;
    /** The last bytes the terminal wrote, which the page's terminal is painted from. */
    replay(id: string): Buffer;
    input(id: string, bytes: Buffer): void;
    size(id: string, page: object, cols: number, rows: number): void;
    release(id: string, page: object): void;
};

export type TerminalsOptions = {
    /** The tmux side; the control client of this module when absent. */
    driver?: TerminalDriver;
    /** The terminals the hosts of apps hold as streams. */
    streams?: StreamTerminals;
    /** How many lines of scrollback an attaching page is given. */
    scrollbackLines?: number;
    /**
     * Milliseconds between two list polls while a page is attached or a task terminal runs; 0 turns
     * the poll off.
     */
    poll?: number;
    /** Milliseconds between two list polls while nothing is attached; 0 turns the poll off. */
    idlePoll?: number;
    /** Passed to the default driver. A test points it at a private tmux server. */
    tmux?: TmuxOptions;
};

/**
 * The terminals as the socket sees them: who is attached to what, what may write, and the list the
 * `sessions` channel carries.
 */
export class Terminals {
    /** The turns of the requests that start one build, which every page's request shares. */
    readonly turns = new Turns();
    #hub: Hub;
    #driver: TerminalDriver;
    #lines: number;
    #attached = new Map<string, Set<Sink>>();
    #held = new Map<Sink, Set<string>>();
    /**
     * The size a socket asked of each terminal it was not attached to, kept for its attach, which
     * applies it before the pane is read.
     */
    #asked = new Map<Sink, Map<string, { cols: number; rows: number }>>();
    /**
     * Per tmux terminal, the sinks whose screen is being read, each with the output that came after
     * the reply of the last read: the screen holds what came before it.
     */
    #opening = new Map<string, Map<Sink, Buffer[]>>();
    /**
     * The tail of each terminal's command chain while one runs, so its keystrokes reach tmux in
     * order and an attach reads the pane after the resizes asked before it.
     */
    #queue = new Map<string, Promise<void>>();
    /** The last list tmux gave, or null before it has given one. */
    #tmux: Terminal[] | null = null;
    /** The terminals the pages are told of: tmux's and the apps' stream terminals. */
    #terminals: Terminal[] | null = null;
    /**
     * Tmux's words for the last read when it failed for a reason other than "no server" (a socket
     * path too long to reach, a tmux that cannot run), null once a list is taken.
     */
    #unreadable: string | null = null;
    #streams: StreamTerminals | undefined;
    #signature = '';
    #listeners = new Set<() => void>();
    #poll: number;
    #idlePoll: number;
    #timer: ReturnType<typeof setInterval> | null = null;
    /**
     * The period the running timer was armed with, so an attach that changes nothing rearms none.
     */
    #period = 0;
    #closed = false;
    #canWrite: (sink: Sink) => boolean = () => false;
    /** The turn of the read that started last, and of the newest read whose answer was taken. */
    #issued = 0;
    #applied = 0;
    /** The pid of the tmux server that gave the last list taken, null when that list named none. */
    #serverPid: number | null = null;
    /** The waits between a no-server answer and the read that confirms it, each with its waker. */
    #pauses = new Set<() => void>();

    constructor(hub: Hub, options: TerminalsOptions = {}) {
        this.#hub = hub;
        this.#driver = options.driver ?? tmuxDriver(options.tmux ?? {});
        this.#lines = options.scrollbackLines ?? SCROLLBACK_LINES;
        this.#driver.onOutput((id, bytes) => this.#output(id, bytes));
        this.#driver.onChange(() => this.refresh());
        this.#streams = options.streams;
        this.#streams?.onOutput((id, bytes) => this.#streamOutput(id, bytes));
        this.#streams?.onChange(() => this.#took(this.#tmux));
        this.#poll = options.poll ?? POLL_MS;
        // `poll: 0` is how a caller asks for no list poll at all, so the idle rate follows it
        // unless the caller named one of its own.
        this.#idlePoll = options.idlePoll ?? (this.#poll === 0 ? 0 : IDLE_POLL_MS);
        this.#arm();
        this.refresh();
    }

    /**
     * Whether a task terminal's line is running in the last list taken. Its end is a change tmux
     * does not announce, so it keeps the fast rate and the poll that ignores the control client.
     */
    #taskRuns(): boolean {
        return (this.#tmux ?? []).some((one) => one.task && one.exit === null);
    }

    /**
     * Arm the list poll at the rate the current attachment and the last list call for, and do
     * nothing when it is already armed at that rate. Called at construction, whenever a page
     * attaches or detaches and whenever the list changes.
     */
    #arm(): void {
        const wanted = this.#attached.size > 0 || this.#taskRuns() ? this.#poll : this.#idlePoll;
        if (this.#closed || wanted === this.#period) return;
        if (this.#timer !== null) clearInterval(this.#timer);
        this.#timer = null;
        this.#period = wanted;
        if (wanted <= 0) return;
        this.#timer = setInterval(() => {
            // While a control client is open, tmux itself says when the list moved, except for the
            // end of a task terminal's line.
            if (!this.#driver.live() || this.#taskRuns()) this.refresh();
        }, wanted);
        const timer = this.#timer;
        if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
    }

    /**
     * Every oculus terminal as the last list reported it, or null before any list was read. The
     * `sessions` payload carries this, and carries no list while it is null, so a page that
     * connects in the moment after the server starts is not told that every terminal has gone.
     */
    list(): Terminal[] | null {
        return this.#terminals;
    }

    /**
     * Why the terminal list cannot be read: tmux's words for the newest read when it failed for a
     * reason other than "no server", null once a list is taken. The listeners are told when it
     * changes, so the schedules can say why they wait while no list was ever read.
     */
    unreadable(): string | null {
        return this.#unreadable;
    }

    /** Called when the list changed; the sessions watcher republishes its payload on it. */
    onChange(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /**
     * Re-read the list and tell the listeners when it moved. Another read may be in flight: the
     * answer of this one is dropped when a read that started after it has been taken already.
     */
    refresh(): void {
        if (this.#closed) return;
        this.#issued += 1;
        this.#read(this.#issued).catch((error: unknown) => {
            console.error(`pty: the terminal list could not be taken: ${reason(error)}`);
        });
    }

    /**
     * One read and what follows its answer. Any failure but "no server" says nothing about the
     * terminals (a timeout, a busy server), so the last list stands and an empty one would have
     * every page close its Terminal tabs. "No server" is the answer of a tmux that has exited and
     * of one whose socket could not be reached for a while, and a control client tells them
     * apart in two ways. A control client's process ends with the tmux server, so while one runs
     * tmux runs too. With none, the pid of the server that gave the last list is asked of the
     * operating system (serverRuns), which answers while the socket is unreachable. The answer is
     * read again NO_SERVER_CONFIRMS times, NO_SERVER_CONFIRM_MS apart, and is the empty list only
     * when every read gave it and neither holds: no control client runs, and no kept pid is a
     * running tmux (none is kept before a list was read, or when it names none). In the other two
     * cases the read is given up and the last list stands, however long the socket stays
     * unreachable, and the list is read again at the next change tmux reports or the next poll.
     */
    async #read(turn: number): Promise<void> {
        for (let confirmed = 0; ; confirmed += 1) {
            let text: string;
            try {
                text = await this.#driver.run(listArgs());
            } catch (error) {
                const said = reason(error);
                if (!noServer(said)) {
                    this.#failed(turn, said);
                    return;
                }
                if (confirmed >= NO_SERVER_CONFIRMS) {
                    if (!this.#driver.live() && !(await this.#serverKeptRuns()))
                        this.#take(turn, []);
                    return;
                }
                await this.#pause(NO_SERVER_CONFIRM_MS);
                if (this.#stale(turn)) return;
                continue;
            }
            if (!this.#stale(turn)) this.#serverPid = serverPid(text);
            this.#take(turn, parseTerminals(text));
            return;
        }
    }

    /**
     * Whether the tmux server that gave the last list still runs. False when no list named a
     * server, and when the driver cannot tell, which is the same as a server that does not run.
     */
    async #serverKeptRuns(): Promise<boolean> {
        const pid = this.#serverPid;
        if (pid === null) return false;
        return this.#driver.serverRuns(pid).catch(() => false);
    }

    /** Whether a read's answer no longer counts: the channels closed, or a newer read was taken. */
    #stale(turn: number): boolean {
        return this.#closed || turn < this.#applied;
    }

    /** Take the answer of the read of a turn, unless it is stale. */
    #take(turn: number, terminals: Terminal[]): void {
        if (this.#stale(turn)) return;
        this.#applied = turn;
        const cleared = this.#unreadable !== null;
        this.#unreadable = null;
        if (!this.#took(terminals) && cleared) this.#tell();
    }

    /** Keep tmux's words of a failed read that is not stale, and tell the listeners of a change. */
    #failed(turn: number, said: string): void {
        if (this.#stale(turn) || this.#unreadable === said) return;
        this.#unreadable = said;
        this.#tell();
    }

    #tell(): void {
        for (const listener of this.#listeners) listener();
    }

    /** Wait, and wake early when the channels close, so a waiting read does not outlive them. */
    #pause(ms: number): Promise<void> {
        return new Promise((resolve) => {
            const wake = (): void => {
                clearTimeout(timer);
                this.#pauses.delete(wake);
                resolve();
            };
            const timer = setTimeout(wake, ms);
            if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
            this.#pauses.add(wake);
        });
    }

    /** The socket's answer to whether a sink carried the write token; until given, none did. */
    gate(canWrite: (sink: Sink) => boolean): void {
        this.#canWrite = canWrite;
    }

    /** A subscribe message: the pty channels in it are attached to the sink. */
    subscribed(sink: Sink, channels: string[]): void {
        for (const channel of channels) {
            const id = channelTerminal(channel);
            if (id !== null) void this.#attach(sink, id);
        }
    }

    /**
     * One message from the page that was not a subscription. True when it was a terminal message,
     * which is what tells the socket the message was accounted for. A socket that did not carry
     * the write token can read every channel and write to none, so a page of another origin that
     * got past the handshake types nothing. A page types only into a terminal it is attached to. A
     * page resizes a terminal before it attaches, so the screen it is sent is read at its grid's
     * size: the size a socket asks of a terminal it is not attached to is kept for its attach and
     * applied there (`#attach`), and never sizes the terminal before then, so a late resize from a
     * page that has left sizes nothing another page is viewing.
     */
    inbound(sink: Sink, data: string): boolean {
        const message = terminalMessage(data);
        if (message === null) return false;
        const id = channelTerminal(message.channel);
        if (id === null) return true;
        if (!this.#canWrite(sink)) {
            console.error(`pty: input on ${message.channel} from a socket without the write token`);
            return true;
        }
        if (this.#attached.get(id)?.has(sink) !== true) {
            if (message.type === 'input') return true;
            const asked =
                this.#asked.get(sink) ?? new Map<string, { cols: number; rows: number }>();
            asked.set(id, { cols: message.cols, rows: message.rows });
            this.#asked.set(sink, asked);
            return true;
        }
        this.#chain(id, () =>
            message.type === 'input'
                ? this.#input(id, message.bytes)
                : this.#resize(id, message.cols, message.rows, sink)
        );
        return true;
    }

    /**
     * Run one command of a terminal after the ones asked before it. Each keystroke is its own
     * message and its own tmux process, and two started at once can finish in either order, which
     * types "ceho" for "echo".
     */
    #chain(id: string, work: () => Promise<void>): void {
        const after = (this.#queue.get(id) ?? Promise.resolve()).then(work, work);
        this.#queue.set(id, after);
        void after.then(() => {
            if (this.#queue.get(id) === after) this.#queue.delete(id);
        });
    }

    /** The socket closed: nothing is delivered to this sink, and the tmux sessions live on. */
    remove(sink: Sink): void {
        this.#asked.delete(sink);
        const ids = this.#held.get(sink);
        if (ids === undefined) return;
        this.#held.delete(sink);
        for (const id of ids) {
            this.#streams?.release(id, sink);
            const sinks = this.#attached.get(id);
            if (sinks === undefined) continue;
            sinks.delete(sink);
            if (sinks.size === 0) {
                this.#attached.delete(id);
                this.#queue.delete(id);
                this.#hub.merge(ptyChannel(id), null);
            }
        }
        this.#driver.attached(this.#tmuxAttached());
        this.#arm();
    }

    close(): void {
        this.#closed = true;
        if (this.#timer !== null) clearInterval(this.#timer);
        this.#timer = null;
        this.#period = 0;
        for (const wake of [...this.#pauses]) wake();
        for (const id of this.#attached.keys()) this.#hub.merge(ptyChannel(id), null);
        this.#listeners.clear();
        this.#attached.clear();
        this.#held.clear();
        this.#asked.clear();
        this.#driver.close();
    }

    /** Take a list read from tmux; true when the listeners were told it changed. */
    #took(read: Terminal[] | null): boolean {
        if (read === null) return false;
        this.#tmux = read;
        const terminals = [...read, ...(this.#streams?.list() ?? [])];
        // Everything the reader sets on a terminal is in the signature, so a rename or a new icon
        // or colour is a change the pages are told of, and so is the end of a task terminal's line.
        // The pane's process is in it too: a task terminal run again that ends with the status it
        // ended with before is another process, and the pages are told of it.
        const signature = JSON.stringify(
            terminals.map((one) => [
                one.id,
                one.name,
                one.title,
                one.icon,
                one.color,
                one.task,
                one.exit,
                one.pid,
                one.app
            ])
        );
        // The first list is taken even when it is empty: it is what turns "not read yet" into a
        // list.
        if (this.#terminals !== null && signature === this.#signature) return false;
        this.#signature = signature;
        this.#terminals = terminals;
        this.#arm();
        this.#tell();
        return true;
    }

    /**
     * Attach one sink to one terminal. A tmux terminal's sink takes the channel's chunks only once
     * its screen (capture.ts, `paneScreen`) is sent, since the page resets its grid for the screen
     * and would wipe a chunk sent before it. The pane is read after the resizes asked before the
     * attach, through the terminal's control client once that is attached, so the screen holds the
     * output from before the attach, and the output that came after the last read's reply goes out
     * behind the screen in the same message. A second page attaching is sent its own screen and
     * does not repaint the first page's. A size the socket asked before it attached is applied
     * first, so the pane is read at that size.
     */
    async #attach(sink: Sink, id: string): Promise<void> {
        const channel = ptyChannel(id);
        const sinks = this.#attached.get(id) ?? new Set<Sink>();
        if (!sinks.has(sink)) {
            sinks.add(sink);
            this.#attached.set(id, sinks);
            this.#hub.merge(channel, mergeChunks);
            const held = this.#held.get(sink) ?? new Set<string>();
            held.add(id);
            this.#held.set(sink, held);
            this.#driver.attached(this.#tmuxAttached());
            this.#arm();
        }
        const size = this.#asked.get(sink)?.get(id);
        if (size !== undefined) {
            this.#asked.get(sink)?.delete(id);
            this.#chain(id, () => this.#resize(id, size.cols, size.rows, sink));
        }
        if (this.#streams?.has(id) === true) {
            this.#hub.subscribe(sink, [channel], false);
            await this.#sendReplay(sink, id);
            return;
        }
        this.#hub.unsubscribe(sink, [channel]);
        const after: Buffer[] = [];
        const opening = this.#opening.get(id) ?? new Map<Sink, Buffer[]>();
        opening.set(sink, after);
        this.#opening.set(id, opening);
        let screen: string;
        try {
            await this.#queue.get(id);
            const read = (args: string[]): Promise<string> =>
                this.#driver.read(id, args, () => (after.length = 0));
            screen = await paneScreen(sessionName(id), this.#lines, read);
        } finally {
            if (opening.get(sink) === after) opening.delete(sink);
            if (opening.size === 0 && this.#opening.get(id) === opening) this.#opening.delete(id);
        }
        if (!this.#attached.get(id)?.has(sink)) return;
        this.#hub.subscribe(sink, [channel], false);
        const message = {
            channel,
            // The scrollback is not a chunk, so it carries no chunk number; the chunks count from
            // 1.
            version: 0,
            payload: {
                bytes: Buffer.concat([Buffer.from(screen, 'utf8'), ...after]).toString('base64')
            }
        };
        try {
            await sink.send(JSON.stringify(message));
        } catch (error) {
            console.error(`pty: the scrollback of ${id} could not be sent: ${reason(error)}`);
        }
    }

    /** The attached terminals tmux holds: the control clients follow these and no others. */
    #tmuxAttached(): string[] {
        return [...this.#attached.keys()].filter((id) => this.#streams?.has(id) !== true);
    }

    /** The last output of a stream terminal, sent to the one sink that attached. */
    async #sendReplay(sink: Sink, id: string): Promise<void> {
        const replay = this.#streams?.replay(id) ?? Buffer.alloc(0);
        if (!this.#attached.get(id)?.has(sink)) return;
        const message = {
            channel: ptyChannel(id),
            version: 0,
            payload: { bytes: replay.toString('base64') }
        };
        try {
            await sink.send(JSON.stringify(message));
        } catch (error) {
            console.error(`pty: the output of ${id} could not be sent: ${reason(error)}`);
        }
    }

    #output(id: string, bytes: Buffer): void {
        if (!this.#attached.has(id)) return;
        for (const after of this.#opening.get(id)?.values() ?? []) after.push(bytes);
        this.#hub.publish(ptyChannel(id), { bytes: bytes.toString('base64') });
    }

    /** The output of a stream terminal; settles when no page holds a chunk of it back. */
    #streamOutput(id: string, bytes: Buffer): Promise<void> {
        if (!this.#attached.has(id)) return Promise.resolve();
        this.#hub.publish(ptyChannel(id), { bytes: bytes.toString('base64') });
        return this.#hub.backlog(ptyChannel(id));
    }

    /** Type bytes into a terminal as a page does: a stream terminal's host, or tmux's pane. */
    type(id: string, bytes: Buffer): Promise<void> {
        return this.#input(id, bytes.toString('base64'));
    }

    /**
     * Type what the page sent into the pane as the bytes it is, one `send-keys -H` per piece of at
     * most INPUT_MOST bytes (inputArgs), in order, stopping at the first that fails. A mouse report
     * or a focus report is one escape sequence and stays in one piece, so the pane reads it in one
     * write and never as a lone Escape followed by text. A paste longer than INPUT_MOST arrives in
     * several writes, in order, its opening and closing markers each whole.
     */
    async #input(id: string, encoded: string): Promise<void> {
        if (this.#streams?.has(id) === true) {
            this.#streams.input(id, Buffer.from(encoded, 'base64'));
            return;
        }
        for (const args of inputArgs(id, Buffer.from(encoded, 'base64'))) {
            try {
                await this.#driver.run(args);
            } catch (error) {
                console.error(`pty: input to ${id} failed: ${reason(error)}`);
                return;
            }
        }
    }

    async #resize(id: string, cols: number, rows: number, sink: Sink): Promise<void> {
        if (!Number.isInteger(cols) || !Number.isInteger(rows)) return;
        if (cols < 1 || rows < 1 || cols > 2000 || rows > 2000) return;
        if (this.#streams?.has(id) === true) {
            this.#streams.size(id, sink, cols, rows);
            return;
        }
        try {
            await this.#driver.run(resizeArgs(id, cols, rows));
        } catch (error) {
            console.error(`pty: resize of ${id} failed: ${reason(error)}`);
        }
    }
}

/**
 * Whether tmux's error says no server runs: an empty list once every read of a run says it (see
 * `#read`), and a failed read until then.
 */
export function noServer(said: string): boolean {
    return (
        said.includes('no server running on') ||
        (said.includes('error connecting to') && said.includes('(No such file or directory)'))
    );
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
