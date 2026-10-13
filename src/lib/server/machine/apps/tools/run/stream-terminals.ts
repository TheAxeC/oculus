// Layer 2, server. The terminals whose bytes are a `terminal` stream to an app's host: the
// `{ name, pty }` terminals of `window.createTerminal` and the custom executions of tasks. They are
// listed beside tmux's terminals and attach to the same `pty:<id>` channels (pty/channel.ts takes
// this module as its `StreamTerminals`), so a page draws, moves, splits and closes them as any
// terminal.
//
// The server keeps the last `RING_BYTES` the stream wrote, which a page that attaches or reloads is
// painted from, as a tmux pane's capture is. What the pages type is written to the stream as bytes
// (the host's `Pseudoterminal.handleInput`), and the terminal's size is the smallest of the sizes
// the pages that show it reported, sent as the stream's control message. The bytes of a stream
// are taken by the listeners one chunk at a time, and the credit for a chunk goes back to the host
// when they settle, so a page that does not read holds the host and not the server's memory. In the
// other direction the stream tells this module to stop writing while the host's credit is out: what
// the pages type then waits here as one run of bytes, and is written when credit returns. A
// terminal whose host leaves more than `TYPED_BYTES` typed bytes unread is ended.
//
// A terminal ends when the host ends its stream or the host stops. It stays in the list with the
// code it ended with and a line saying so in its output, until a reader closes it.

import { randomBytes } from 'node:crypto';
import type { Terminal, TerminalJob } from '../../../../../data/model/index.ts';
import type { StreamTerminals } from '../../../pty/channel.ts';
import type { AppStream } from '../streams.ts';

/** The most bytes of a terminal's output the server keeps. */
const RING_BYTES = 1024 * 1024;

/** The most typed bytes that wait for the host's credit before the terminal is ended. */
const TYPED_BYTES = 8 * 1024 * 1024;

/** What a terminal needs to be made. */
export type StreamTerminalInit = {
    app: string;
    name: string;
    cwd: string;
    stream: AppStream;
    /** The task it runs, when a task made it. */
    job?: TerminalJob;
    /** The line written when it ends: the sentence for a code. */
    ended: (code: number) => string;
};

type Entry = {
    record: Terminal;
    stream: AppStream;
    chunks: Buffer[];
    bytes: number;
    sizes: Map<object, { cols: number; rows: number }>;
    sent: { cols: number; rows: number } | null;
    ended: (code: number) => string;
    over: boolean;
    /** What the pages typed that the stream has not been given, oldest first. */
    typed: Buffer[];
    typedBytes: number;
    /** Whether the stream asked for no more bytes until the host's credit returns. */
    blocked: boolean;
};

/** What a task run has promised the terminal its host is about to open under a token. */
export type Claim = {
    /** The view id of the app whose host opens it. */
    app: string;
    /** The job the terminal is the run of. */
    job: TerminalJob;
    /** The row of an ended terminal the new stream takes over, for a run again. */
    rebind?: string;
    /** Called with the terminal's id once the stream is held. */
    taken: (id: string) => void;
};

/** The stream terminals of every host. */
export class StreamTerminalSet implements StreamTerminals {
    readonly #entries = new Map<string, Entry>();
    readonly #claims = new Map<string, Claim>();
    readonly #changed: (() => void)[] = [];
    readonly #output: ((id: string, bytes: Buffer) => void | Promise<void>)[] = [];
    readonly #ringBytes: number;
    readonly #now: () => Date;

    constructor(ringBytes: number = RING_BYTES, now: () => Date = () => new Date()) {
        this.#ringBytes = ringBytes;
        this.#now = now;
    }

    list(): Terminal[] {
        return [...this.#entries.values()].map((entry) => entry.record);
    }

    has(id: string): boolean {
        return this.#entries.has(id);
    }

    onChange(listener: () => void): void {
        this.#changed.push(listener);
    }

    onOutput(listener: (id: string, bytes: Buffer) => void | Promise<void>): void {
        this.#output.push(listener);
    }

    /** The terminals of one app. */
    ofApp(app: string): Terminal[] {
        return this.list().filter((one) => one.app === app);
    }

    /** The record of a terminal, or undefined. */
    record(id: string): Terminal | undefined {
        return this.#entries.get(id)?.record;
    }

    /** Promise the terminal a host opens under this token to a task run. */
    expect(token: string, claim: Claim): void {
        this.#claims.set(token, claim);
    }

    /** Take the promise made under a token, or undefined. */
    claim(token: string, app: string): Claim | undefined {
        const found = this.#claims.get(token);
        if (found?.app !== app) return undefined;
        this.#claims.delete(token);
        return found;
    }

    /** Forget a promise whose terminal never opened. */
    forget(token: string): void {
        this.#claims.delete(token);
    }

    /** End the terminal as the host's own end does: the row stays with the code. */
    end(id: string, code: number): boolean {
        const entry = this.#entries.get(id);
        if (entry === undefined) return false;
        this.#end(id, entry, code);
        return true;
    }

    /** Hold the terminal a stream opened; its row. */
    add(init: StreamTerminalInit): Terminal {
        let id: string;
        do {
            id = `${randomBytes(3).toString('hex')}-app`;
        } while (this.#entries.has(id));
        const record: Terminal = {
            id,
            name: init.name === '' ? id : init.name,
            title: '',
            icon: '',
            color: '',
            kind: 'app',
            app: init.app,
            cwd: init.cwd,
            command: '',
            pid: 0,
            created: this.#now().toISOString(),
            attached: false,
            resumes: null,
            task: init.job !== undefined,
            exit: null,
            job: init.job ?? null
        };
        const entry: Entry = {
            record,
            stream: init.stream,
            chunks: [],
            bytes: 0,
            sizes: new Map(),
            sent: null,
            ended: init.ended,
            over: false,
            typed: [],
            typedBytes: 0,
            blocked: false
        };
        this.#entries.set(id, entry);
        this.#wire(id, entry);
        this.#tell();
        return record;
    }

    /** Bind a new stream to the row of a terminal that ended, as a task run again does. */
    rebind(id: string, stream: AppStream, job?: TerminalJob): boolean {
        const entry = this.#entries.get(id);
        if (!entry?.over) return false;
        entry.stream = stream;
        entry.over = false;
        entry.typed = [];
        entry.typedBytes = 0;
        entry.blocked = false;
        entry.chunks = [];
        entry.bytes = 0;
        entry.sent = null;
        entry.record = { ...entry.record, exit: null, ...(job === undefined ? {} : { job }) };
        this.#wire(id, entry);
        this.#tell();
        return true;
    }

    /** Rename the row; the host's `onDidChangeName`. */
    rename(id: string, name: string): void {
        const entry = this.#entries.get(id);
        if (entry === undefined) return;
        entry.record = { ...entry.record, name };
        this.#tell();
    }

    /** Give the row a title, icon or colour. */
    style(id: string, change: Partial<Pick<Terminal, 'title' | 'icon' | 'color'>>): boolean {
        const entry = this.#entries.get(id);
        if (entry === undefined) return false;
        entry.record = { ...entry.record, ...change };
        this.#tell();
        return true;
    }

    /**
     * Empty what the server keeps of the terminal's output, so a page that attaches next is painted
     * blank.
     */
    clear(id: string): boolean {
        const entry = this.#entries.get(id);
        if (entry === undefined) return false;
        entry.chunks = [];
        entry.bytes = 0;
        return true;
    }

    /** Close the terminal: its stream ends and the row goes. */
    close(id: string): boolean {
        const entry = this.#entries.get(id);
        if (entry === undefined) return false;
        this.#entries.delete(id);
        if (!entry.stream.closed) entry.stream.close();
        this.#tell();
        return true;
    }

    /** The host of an app stopped: its terminals end. */
    endApp(app: string, code: number): void {
        for (const [id, entry] of this.#entries) {
            if (entry.record.app === app) this.#end(id, entry, code);
        }
    }

    replay(id: string): Buffer {
        const entry = this.#entries.get(id);
        return entry === undefined ? Buffer.alloc(0) : Buffer.concat(entry.chunks);
    }

    input(id: string, bytes: Buffer): void {
        const entry = this.#entries.get(id);
        if (entry === undefined || entry.over || entry.stream.closed) return;
        entry.typed.push(bytes);
        entry.typedBytes += bytes.length;
        this.#type(entry);
    }

    /** Give the stream what was typed, as one run, unless it asked for no more. */
    #type(entry: Entry): void {
        if (entry.typedBytes > TYPED_BYTES) {
            entry.typed = [];
            entry.typedBytes = 0;
            if (!entry.stream.closed) entry.stream.close();
            return;
        }
        if (entry.blocked || entry.typed.length === 0 || entry.stream.closed) return;
        const run = Buffer.concat(entry.typed);
        entry.typed = [];
        entry.typedBytes = 0;
        entry.stream.sendBytes(run);
    }

    size(id: string, page: object, cols: number, rows: number): void {
        const entry = this.#entries.get(id);
        if (entry === undefined) return;
        entry.sizes.set(page, { cols, rows });
        this.#follow(entry);
    }

    release(id: string, page: object): void {
        const entry = this.#entries.get(id);
        if (!entry?.sizes.delete(page)) return;
        this.#follow(entry);
    }

    /** Write the stream's output into the ring and to the listeners; the credit returns after. */
    #wire(id: string, entry: Entry): void {
        const stream = entry.stream;
        stream.backpressure(
            () => {
                if (entry.stream === stream) entry.blocked = true;
            },
            () => {
                if (entry.stream !== stream) return;
                entry.blocked = false;
                this.#type(entry);
            }
        );
        stream.onBytes(async (bytes) => {
            if (entry.stream !== stream) return;
            this.#keep(entry, bytes);
            await Promise.all(
                this.#output.map(async (listener) => {
                    await listener(id, bytes);
                })
            );
        });
        stream.onControl((body) => {
            if (entry.stream === stream && body.end === true) this.#end(id, entry, body.code ?? 0);
        });
        stream.onClose(() => {
            if (entry.stream === stream && this.#entries.get(id) === entry) {
                this.#end(id, entry, entry.record.exit ?? 0);
            }
        });
    }

    #keep(entry: Entry, bytes: Buffer): void {
        entry.chunks.push(bytes);
        entry.bytes += bytes.length;
        while (entry.bytes > this.#ringBytes && entry.chunks.length > 0) {
            const first = entry.chunks[0];
            const over = entry.bytes - this.#ringBytes;
            if (first.length <= over) {
                entry.chunks.shift();
                entry.bytes -= first.length;
            } else {
                entry.chunks[0] = first.subarray(over);
                entry.bytes -= over;
            }
        }
    }

    /** The terminal ended: its exit and the line saying so, and the row stays. */
    #end(id: string, entry: Entry, code: number): void {
        if (entry.over) return;
        entry.over = true;
        entry.record = { ...entry.record, exit: code };
        const line = Buffer.from(`\r\n${entry.ended(code)}\r\n`, 'utf8');
        this.#keep(entry, line);
        for (const listener of this.#output) void listener(id, line);
        if (!entry.stream.closed) entry.stream.close();
        this.#tell();
    }

    /** Send the smallest size of the pages that show the terminal, when it changed. */
    #follow(entry: Entry): void {
        if (entry.over || entry.sizes.size === 0) return;
        let cols = Infinity;
        let rows = Infinity;
        for (const size of entry.sizes.values()) {
            cols = Math.min(cols, size.cols);
            rows = Math.min(rows, size.rows);
        }
        if (entry.sent?.cols === cols && entry.sent.rows === rows) return;
        entry.sent = { cols, rows };
        entry.stream.sendControl({ columns: cols, rows });
    }

    #tell(): void {
        for (const listener of this.#changed) listener();
    }
}
