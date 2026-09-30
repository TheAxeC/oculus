// Layer 2, server. The `pty:<id>` channels of DESIGN.md's "The socket", and the only place the
// socket accepts anything from the page beyond a subscription.
//
// A page subscribes to `pty:<id>`, gets what the pane already shows as its first message, and then
// one message per chunk tmux reports for that pane. It sends back `input` and `resize`, and both
// are accepted only on a socket whose subscribe message carried the write token; a socket without
// the token reads every channel and writes to none. That is DESIGN.md's "The socket accepts nothing
// from the page except subscriptions and, later, terminal input", made concrete.
//
// A control client is opened per attached terminal and closed a minute after nothing is attached
// to that terminal, so a machine with no terminal open runs no tmux child. While one is open,
// tmux's own `%session-changed` and its relatives say when the terminal list moved; while none is,
// a `list-sessions` does, every five seconds while a page is attached to a terminal and once a
// minute while none is, since nothing but a hand-made session can move the list then.

import type {
    Message,
    PtyPayload,
    Terminal,
    TerminalInput,
    TerminalResize
} from '../../../data/model/index.ts';
import type { Hub, Sink } from '../../core/channels.ts';
import {
    captureArgs,
    cursorArgs,
    isTerminalId,
    listArgs,
    parseTerminals,
    resizeArgs,
    inputArgs,
    screenAt,
    sessionName,
    SCROLLBACK_LINES
} from './sessions.ts';
import { control, run, RESTART_MS, type ControlClient, type TmuxOptions } from './tmux.ts';

/** The prefix of a terminal channel. */
export const CHANNEL_PREFIX = 'pty:';

/** Milliseconds with nothing attached before the control client is closed. */
export const IDLE_MS = 60000;

/** Milliseconds between two `list-sessions` calls while a page is attached to a terminal. */
export const POLL_MS = 5000;

/**
 * Milliseconds between two `list-sessions` calls while nothing is attached. Nobody is looking at a
 * terminal then, and the only thing the list can report is a session started outside oculus, so a
 * minute is soon enough and costs a twelfth of the calls the attached rate does.
 */
export const IDLE_POLL_MS = 60000;

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

/** One inbound message from the page, or null when it is neither of the two this module knows. */
export function terminalMessage(data: string): TerminalInput | TerminalResize | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(data);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const message = parsed as Record<string, unknown>;
    if (typeof message.channel !== 'string' || channelTerminal(message.channel) === null) {
        return null;
    }
    if (message.type === 'input' && typeof message.bytes === 'string') {
        return { type: 'input', channel: message.channel, bytes: message.bytes };
    }
    if (
        message.type === 'resize' &&
        typeof message.cols === 'number' &&
        typeof message.rows === 'number'
    ) {
        return {
            type: 'resize',
            channel: message.channel,
            cols: message.cols,
            rows: message.rows
        };
    }
    return null;
}

/**
 * What the channels need of tmux. The default is the control client below; a test passes a recorder
 * so that every tmux command the channels build is an assertion rather than a process.
 */
export type TerminalDriver = {
    /** One tmux command, the argument list sessions.ts built. */
    run(args: string[]): Promise<string>;
    /** Pane output, already routed to the terminal it belongs to. */
    onOutput(listener: (id: string, bytes: Buffer) => void): void;
    /** Something tmux said that moves the terminal list. */
    onChange(listener: () => void): void;
    /** The terminals the page is attached to; the control client follows them. */
    attached(ids: string[]): void;
    /** Whether a control client is open, which is what turns the poll off. */
    live(): boolean;
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

    const drop = (id: string): void => {
        forget(restarts, id);
        forget(idles, id);
        clients.get(id)?.close();
        clients.delete(id);
    };

    return {
        run: (args: string[]) => run(args, options),
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
        close(): void {
            closed = true;
            for (const id of [...clients.keys()]) drop(id);
            for (const id of [...restarts.keys()]) forget(restarts, id);
            for (const id of [...idles.keys()]) forget(idles, id);
        }
    };
}

export type TerminalsOptions = {
    /** The tmux side; the control client of this module when absent. */
    driver?: TerminalDriver;
    /** How many lines of scrollback an attaching page is given. */
    scrollbackLines?: number;
    /** Milliseconds between two list polls while a page is attached; 0 turns the poll off. */
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
    #hub: Hub;
    #driver: TerminalDriver;
    #lines: number;
    #attached = new Map<string, Set<Sink>>();
    #held = new Map<Sink, Set<string>>();
    #writable = new WeakSet<Sink>();
    /** The tail of each terminal's command chain, so its keystrokes reach tmux in order. */
    #queue = new Map<string, Promise<void>>();
    /** The last list tmux gave, or null before it has given one. */
    #terminals: Terminal[] | null = null;
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

    constructor(hub: Hub, options: TerminalsOptions = {}) {
        this.#hub = hub;
        this.#driver = options.driver ?? tmuxDriver(options.tmux ?? {});
        this.#lines = options.scrollbackLines ?? SCROLLBACK_LINES;
        this.#driver.onOutput((id, bytes) => this.#output(id, bytes));
        this.#driver.onChange(() => this.refresh());
        this.#poll = options.poll ?? POLL_MS;
        // `poll: 0` is how a caller asks for no list poll at all, so the idle rate follows it
        // unless the caller named one of its own.
        this.#idlePoll = options.idlePoll ?? (this.#poll === 0 ? 0 : IDLE_POLL_MS);
        this.#arm();
        this.refresh();
    }

    /**
     * Arm the list poll at the rate the current attachment calls for, and do nothing when it is
     * already armed at that rate. Called at construction and whenever a page attaches or detaches.
     */
    #arm(): void {
        const wanted = this.#attached.size > 0 ? this.#poll : this.#idlePoll;
        if (this.#closed || wanted === this.#period) return;
        if (this.#timer !== null) clearInterval(this.#timer);
        this.#timer = null;
        this.#period = wanted;
        if (wanted <= 0) return;
        this.#timer = setInterval(() => {
            // While a control client is open, tmux itself says when the list moved.
            if (!this.#driver.live()) this.refresh();
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

    /** Called when the list changed; the sessions watcher republishes its payload on it. */
    onChange(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /** Re-read the list and tell the listeners when it moved. */
    refresh(): void {
        if (this.#closed) return;
        void this.#driver
            .run(listArgs())
            .then((text) => this.#took(parseTerminals(text)))
            .catch((error: unknown) => {
                // No server is the one failure that is a list: the last session exited and tmux
                // with it. Any other failure (a timeout, a busy server) says nothing about the
                // terminals, and an empty list would have every page close its Terminal tabs.
                if (noServer(reason(error))) this.#took([]);
            });
    }

    /**
     * A subscribe message: the pty channels in it are attached, and the token in it is what lets
     * this socket write. A socket that never carried the token can read every channel and write to
     * none, so a page of another origin that got past the handshake still types nothing.
     */
    subscribed(sink: Sink, channels: string[], token: unknown, expectedToken: string): void {
        if (expectedToken !== '' && token === expectedToken) this.#writable.add(sink);
        for (const channel of channels) {
            const id = channelTerminal(channel);
            if (id !== null) void this.#attach(sink, id);
        }
    }

    /**
     * One message from the page that was not a subscription. True when it was a terminal message,
     * which is what tells the socket the message was accounted for.
     */
    inbound(sink: Sink, data: string): boolean {
        const message = terminalMessage(data);
        if (message === null) return false;
        const id = channelTerminal(message.channel);
        if (id === null) return true;
        if (!this.#writable.has(sink)) {
            console.error(`pty: input on ${message.channel} from a socket without the write token`);
            return true;
        }
        if (this.#attached.get(id)?.has(sink) !== true) return true;
        // One terminal's commands run one after another: each keystroke is its own message and its
        // own tmux process, and two started at once can finish in either order, which types "ceho"
        // for "echo".
        const work =
            message.type === 'input'
                ? () => this.#input(id, message.bytes)
                : () => this.#resize(id, message.cols, message.rows);
        const after = (this.#queue.get(id) ?? Promise.resolve()).then(work, work);
        this.#queue.set(id, after);
        return true;
    }

    /** The socket closed: nothing is delivered to this sink, and the tmux sessions live on. */
    remove(sink: Sink): void {
        const ids = this.#held.get(sink);
        if (ids === undefined) return;
        this.#held.delete(sink);
        for (const id of ids) {
            const sinks = this.#attached.get(id);
            if (sinks === undefined) continue;
            sinks.delete(sink);
            if (sinks.size === 0) {
                this.#attached.delete(id);
                this.#queue.delete(id);
                this.#hub.merge(ptyChannel(id), null);
            }
        }
        this.#driver.attached([...this.#attached.keys()]);
        this.#arm();
    }

    close(): void {
        this.#closed = true;
        if (this.#timer !== null) clearInterval(this.#timer);
        this.#timer = null;
        this.#period = 0;
        for (const id of this.#attached.keys()) this.#hub.merge(ptyChannel(id), null);
        this.#listeners.clear();
        this.#attached.clear();
        this.#held.clear();
        this.#driver.close();
    }

    #took(terminals: Terminal[]): void {
        // Everything the reader sets on a terminal is in the signature, so a rename or a new icon
        // or colour is a change the pages are told of.
        const signature = JSON.stringify(
            terminals.map((one) => [one.id, one.name, one.title, one.icon, one.color])
        );
        // The first list is taken even when it is empty: it is what turns "not read yet" into a
        // list.
        if (this.#terminals !== null && signature === this.#signature) return;
        this.#signature = signature;
        this.#terminals = terminals;
        for (const listener of this.#listeners) listener();
    }

    /**
     * Attach one sink to one terminal. The sink is subscribed without the channel's latest message,
     * since that is the previous chunk and the scrollback below already holds it; the scrollback is
     * then sent to this sink alone, so a second page attaching does not repaint the first page's.
     */
    async #attach(sink: Sink, id: string): Promise<void> {
        const sinks = this.#attached.get(id) ?? new Set<Sink>();
        if (!sinks.has(sink)) {
            sinks.add(sink);
            this.#attached.set(id, sinks);
            this.#hub.merge(ptyChannel(id), mergeChunks);
            const held = this.#held.get(sink) ?? new Set<string>();
            held.add(id);
            this.#held.set(sink, held);
            this.#hub.subscribe(sink, [ptyChannel(id)], false);
            this.#driver.attached([...this.#attached.keys()]);
            this.#arm();
        }
        let text = '';
        try {
            text = await this.#driver.run(captureArgs(id, this.#lines));
        } catch (error) {
            console.error(`pty: no scrollback for ${id}: ${reason(error)}`);
        }
        // The cursor is read after the capture, so output that lands between the two moves the
        // cursor down over rows the capture already holds rather than past rows it lacks.
        let cursor = '';
        try {
            cursor = await this.#driver.run(cursorArgs(id));
        } catch (error) {
            console.error(`pty: no cursor for ${id}, the whole capture is sent: ${reason(error)}`);
        }
        if (!this.#attached.get(id)?.has(sink)) return;
        const placed = screenAt(text, cursor);
        if (placed === text && cursor !== '') {
            console.error(`pty: the cursor of ${id} did not read, the whole capture is sent`);
        }
        // capture-pane writes one line per row with a bare newline between them; a terminal moves
        // down without returning to the left on a bare newline, so the rows would step across the
        // grid (seen in Chrome as a staircase). Every line break goes out as CR LF.
        const screen = placed.replace(/\r?\n/g, '\r\n');
        const message = {
            channel: ptyChannel(id),
            // The scrollback is not a chunk, so it carries no chunk number; the chunks count from
            // 1.
            version: 0,
            payload: { bytes: Buffer.from(screen, 'utf8').toString('base64') }
        };
        try {
            await sink.send(JSON.stringify(message));
        } catch (error) {
            console.error(`pty: the scrollback of ${id} could not be sent: ${reason(error)}`);
        }
    }

    #output(id: string, bytes: Buffer): void {
        if (!this.#attached.has(id)) return;
        this.#hub.publish(ptyChannel(id), { bytes: bytes.toString('base64') });
    }

    /**
     * Type what the page sent into the pane as the bytes it is, one `send-keys -H` per piece of at
     * most INPUT_MOST bytes (inputArgs), in order, stopping at the first that fails. A mouse report
     * or a focus report is one escape sequence and stays in one piece, so the pane reads it in one
     * write and never as a lone Escape followed by text. A paste longer than INPUT_MOST arrives in
     * several writes, in order, its opening and closing markers each whole.
     */
    async #input(id: string, encoded: string): Promise<void> {
        for (const args of inputArgs(id, Buffer.from(encoded, 'base64'))) {
            try {
                await this.#driver.run(args);
            } catch (error) {
                console.error(`pty: input to ${id} failed: ${reason(error)}`);
                return;
            }
        }
    }

    async #resize(id: string, cols: number, rows: number): Promise<void> {
        if (!Number.isInteger(cols) || !Number.isInteger(rows)) return;
        if (cols < 1 || rows < 1 || cols > 2000 || rows > 2000) return;
        try {
            await this.#driver.run(resizeArgs(id, cols, rows));
        } catch (error) {
            console.error(`pty: resize of ${id} failed: ${reason(error)}`);
        }
    }
}

/** Whether tmux's error says no server runs, which is an empty list rather than a failed one. */
export function noServer(said: string): boolean {
    return (
        said.includes('no server running on') ||
        (said.includes('error connecting to') && said.includes('(No such file or directory)'))
    );
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
