// Layer 2, server. The streams of one host, oculus's end of the `oculus/stream/*` methods: the
// byte and message flows of a language server, a debug adapter or a terminal that ride the host's
// one JSON-RPC connection (host/connection.ts) and never a second pipe.
//
// The host opens every stream (`oculus/stream/open`: an `id`, a `kind` and what it is for). A
// `languageServer` or `debugAdapter` stream was asked for by oculus and carries the `token` of
// that ask in its purpose, which settles the `expect` that waited for it; a `terminal` stream is
// announced to the listener of terminals. An id the host already holds open is refused
// `refused:id`.
//
// Flow is by credit. Each side grants the other a window at open, 1 MiB of bytes for a terminal and
// 256 messages for the others, and grants more as its consumer finishes with what it was given: a
// consumer's handler returns, or its promise settles, and only then are the bytes or messages
// counted back. A sender with no credit holds its data and tells its source to pause (`pause` and
// `resume` of `backpressure`), so what is held per stream is bounded by the window, plus at most
// `HELD_MESSAGES` messages or byte chunks of a source that does not pause; a stream that holds more
// is closed with a line in the output. The host's end of the same protocol is
// apps/host/runner/streams.mjs, which holds the same windows, the same bound and the same rules
// for an id it did not open; a change to one is made in both. A `data`, `control` or `close` naming
// an id the host did not open, or one closed, is dropped and written to the host's output, except a
// `close` that crosses the close oculus sent for the same stream. Data of a server or an adapter
// that is not one message object closes that stream with a line in the output. Neither ends the
// host.

import { Refused, type HostHandler, type HostNotice } from '../host/connection.ts';
import { words } from '../../../core/words.ts';

/** The three kinds of stream. */
type StreamKind = 'languageServer' | 'debugAdapter' | 'terminal';

/** The window each side grants at open. */
const BYTE_WINDOW = 1024 * 1024;
const MESSAGE_WINDOW = 256;

/** The most messages a stream with no credit holds before it is closed. */
const HELD_MESSAGES = 4096;

const ID = /^[A-Za-z0-9._-]{1,64}$/;
const KINDS: readonly StreamKind[] = ['languageServer', 'debugAdapter', 'terminal'];

/** A body of `oculus/stream/control`: a terminal's size, or the end of the stream. */
type StreamControl = {
    rows?: number;
    columns?: number;
    end?: boolean;
    code?: number | null;
};

/** One open stream, as the module that asked for it holds it. */
export type AppStream = {
    readonly id: string;
    readonly kind: StreamKind;
    /** What the host said the stream is for. */
    readonly purpose: Record<string, unknown>;
    /** Send one message object (a server or an adapter) to the host once credit allows. */
    sendMessage(message: unknown): void;
    /** Send bytes (a terminal) to the host once credit allows. */
    sendBytes(bytes: Uint8Array): void;
    /** Send a control body to the host. */
    sendControl(body: StreamControl): void;
    /**
     * Hear what the host sends; a promise a handler returns holds the credit back until it settles.
     */
    onMessage(listener: (message: Record<string, unknown>) => void | Promise<void>): void;
    onBytes(listener: (bytes: Buffer) => void | Promise<void>): void;
    onStderr(listener: (text: string) => void): void;
    onControl(listener: (body: StreamControl) => void): void;
    onClose(listener: () => void): void;
    /** The source oculus reads from is paused while the host has granted no credit. */
    backpressure(pause: () => void, resume: () => void): void;
    /** How many messages or bytes wait for credit. */
    held(): number;
    /** Whether the stream has been closed. */
    readonly closed: boolean;
    close(): void;
};

/** What a hub is made over. */
export type StreamsOptions = {
    /** Write a line to the host's output. */
    note: (line: string) => void;
    /** The server's text catalog, which `words` reads a sentence from. */
    catalog: () => Record<string, string>;
    /** The windows; the defaults are the protocol's. */
    byteWindow?: number;
    messageWindow?: number;
    /** Send a notification to the host. */
    notify: (method: string, params: unknown) => void;
};

type Listeners = {
    message: ((message: Record<string, unknown>) => void | Promise<void>)[];
    bytes: ((bytes: Buffer) => void | Promise<void>)[];
    stderr: ((text: string) => void)[];
    control: ((body: StreamControl) => void)[];
    close: (() => void)[];
};

type Held = { message?: unknown; bytes?: Uint8Array };

/** The streams of one host. */
export class StreamHub {
    readonly #options: StreamsOptions;
    readonly #open = new Map<string, Internal>();
    readonly #expected = new Map<string, (stream: AppStream) => void>();
    readonly #terminals: ((stream: AppStream) => void)[] = [];
    readonly #closed = new Set<string>();
    #token = 0;
    #over = false;

    constructor(options: StreamsOptions) {
        this.#options = options;
    }

    /** The handler of `oculus/stream/open`. */
    handlers(): Record<string, HostHandler> {
        return {
            'oculus/stream/open': (params) => {
                this.#openOne(params);
                return null;
            }
        };
    }

    /** The handlers of the data, control and close notifications of the host. */
    notices(): Record<string, HostNotice> {
        return {
            'oculus/stream/data': (params) => this.#data(params),
            'oculus/stream/control': (params) => this.#control(params),
            'oculus/stream/close': (params) => {
                // A close from the host that crosses the close oculus sent is no fault.
                if (isRecord(params) && this.#closed.has(String(params.id))) return;
                const stream = this.#named(params, 'close');
                if (stream !== null) this.#finish(stream, false);
            }
        };
    }

    /**
     * A token to put in a request that makes the host open a stream, and the promise of the stream
     * it opens with that token in its purpose. Rejects when `ms` pass first.
     */
    expect(ms: number): { token: string; stream: Promise<AppStream>; cancel(): void } {
        this.#token += 1;
        const token = `t${this.#token}`;
        let settle: (stream: AppStream) => void = () => undefined;
        let fail: (error: Error) => void = () => undefined;
        const stream = new Promise<AppStream>((resolve, reject) => {
            settle = resolve;
            fail = reject;
        });
        const timer = setTimeout(() => {
            this.#expected.delete(token);
            fail(new Refused('timeout'));
        }, ms);
        timer.unref();
        this.#expected.set(token, (opened) => {
            clearTimeout(timer);
            this.#expected.delete(token);
            settle(opened);
        });
        return {
            token,
            stream,
            cancel: () => {
                clearTimeout(timer);
                this.#expected.delete(token);
            }
        };
    }

    /** Hear the terminal streams the host opens on its own. */
    onTerminal(listener: (stream: AppStream) => void): void {
        this.#terminals.push(listener);
    }

    /** The streams that are open. */
    ids(): string[] {
        return [...this.#open.keys()];
    }

    /** End every stream: the host stopped. */
    closeAll(): void {
        this.#over = true;
        for (const stream of [...this.#open.values()]) this.#finish(stream, true);
        this.#expected.clear();
    }

    #openOne(params: unknown): void {
        const body = isRecord(params) ? params : {};
        const id = typeof body.id === 'string' ? body.id : '';
        const kind = KINDS.find((one) => one === body.kind);
        if (this.#over || !ID.test(id) || kind === undefined) throw new Refused('refused:params');
        if (this.#open.has(id)) throw new Refused('refused:id');
        if (this.#closed.has(id)) throw new Refused('refused:id');
        const purpose = isRecord(body.purpose) ? body.purpose : {};
        const token = typeof purpose.token === 'string' ? purpose.token : '';
        const expected = this.#expected.get(token);
        if (kind !== 'terminal' && expected === undefined) throw new Refused('refused:purpose');
        const stream = new Internal(this.#options, id, kind, purpose, (done) =>
            this.#finish(done, true)
        );
        this.#open.set(id, stream);
        if (expected !== undefined) expected(stream);
        else for (const listener of this.#terminals) listener(stream);
    }

    #named(params: unknown, what: string): Internal | null {
        const id = isRecord(params) && typeof params.id === 'string' ? params.id : '';
        const stream = this.#open.get(id);
        if (stream !== undefined) return stream;
        this.#options.note(words(this.#options.catalog(), 'server.apps.stream_unknown', what, id));
        return null;
    }

    #data(params: unknown): void {
        const stream = this.#named(params, 'data');
        if (stream === null || !isRecord(params)) return;
        if (typeof params.stderr === 'string') {
            stream.hearStderr(params.stderr);
            return;
        }
        if (stream.kind === 'terminal') {
            const bytes = params.bytes;
            if (typeof bytes !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(bytes)) {
                this.#bad(stream);
                return;
            }
            stream.hearBytes(Buffer.from(bytes, 'base64'));
            return;
        }
        const message = params.message;
        if (!isRecord(message)) {
            this.#bad(stream);
            return;
        }
        stream.hearMessage(message);
    }

    #bad(stream: Internal): void {
        this.#options.note(words(this.#options.catalog(), 'server.apps.stream_bad', stream.id));
        this.#finish(stream, true);
    }

    #control(params: unknown): void {
        const stream = this.#named(params, 'control');
        if (stream === null || !isRecord(params)) return;
        if (typeof params.credit === 'number' && params.credit > 0) {
            stream.grant(params.credit);
            return;
        }
        stream.hearControl({
            rows: typeof params.rows === 'number' ? params.rows : undefined,
            columns: typeof params.columns === 'number' ? params.columns : undefined,
            end: params.end === true ? true : undefined,
            code:
                typeof params.code === 'number'
                    ? params.code
                    : params.code === null
                      ? null
                      : undefined
        });
    }

    #finish(stream: Internal, tell: boolean): void {
        if (stream.closed) return;
        this.#open.delete(stream.id);
        this.#closed.add(stream.id);
        stream.end(tell);
    }
}

/** The stream object, with the parts only the hub calls. */
class Internal implements AppStream {
    readonly id: string;
    readonly kind: StreamKind;
    readonly purpose: Record<string, unknown>;
    closed = false;
    readonly #options: StreamsOptions;
    readonly #window: number;
    readonly #done: (stream: Internal) => void;
    readonly #listeners: Listeners = { message: [], bytes: [], stderr: [], control: [], close: [] };
    #credit: number;
    #queue: Held[] = [];
    #owed = 0;
    #chain: Promise<void> = Promise.resolve();
    #pause: (() => void) | undefined;
    #resume: (() => void) | undefined;

    constructor(
        options: StreamsOptions,
        id: string,
        kind: StreamKind,
        purpose: Record<string, unknown>,
        done: (stream: Internal) => void
    ) {
        this.#options = options;
        this.id = id;
        this.kind = kind;
        this.purpose = purpose;
        this.#done = done;
        this.#window =
            kind === 'terminal'
                ? (options.byteWindow ?? BYTE_WINDOW)
                : (options.messageWindow ?? MESSAGE_WINDOW);
        this.#credit = this.#window;
    }

    sendMessage(message: unknown): void {
        if (this.closed) return;
        this.#queue.push({ message });
        if (this.#queue.length > HELD_MESSAGES) {
            this.#options.note(words(this.#options.catalog(), 'server.apps.stream_full', this.id));
            this.#done(this);
            return;
        }
        this.#flush();
        if (this.#queue.length > 0) this.#pause?.();
    }

    sendBytes(bytes: Uint8Array): void {
        if (this.closed) return;
        this.#queue.push({ bytes });
        if (this.#queue.length > HELD_MESSAGES) {
            this.#options.note(words(this.#options.catalog(), 'server.apps.stream_full', this.id));
            this.#done(this);
            return;
        }
        this.#flush();
        if (this.#queue.length > 0) this.#pause?.();
    }

    sendControl(body: StreamControl): void {
        if (!this.closed) this.#options.notify('oculus/stream/control', { id: this.id, ...body });
    }

    onMessage(listener: (message: Record<string, unknown>) => void | Promise<void>): void {
        this.#listeners.message.push(listener);
    }

    onBytes(listener: (bytes: Buffer) => void | Promise<void>): void {
        this.#listeners.bytes.push(listener);
    }

    onStderr(listener: (text: string) => void): void {
        this.#listeners.stderr.push(listener);
    }

    onControl(listener: (body: StreamControl) => void): void {
        this.#listeners.control.push(listener);
    }

    onClose(listener: () => void): void {
        this.#listeners.close.push(listener);
    }

    backpressure(pause: () => void, resume: () => void): void {
        this.#pause = pause;
        this.#resume = resume;
    }

    held(): number {
        return this.#queue.reduce((sum, one) => sum + (one.bytes?.length ?? 1), 0);
    }

    close(): void {
        this.#done(this);
    }

    /** The host granted credit. */
    grant(credit: number): void {
        this.#credit += credit;
        this.#flush();
    }

    hearStderr(text: string): void {
        for (const listener of this.#listeners.stderr) listener(text);
    }

    hearControl(body: StreamControl): void {
        for (const listener of this.#listeners.control) listener(body);
    }

    /**
     * A message of the host, handed to the listeners in order; its credit returns when they finish.
     */
    hearMessage(message: Record<string, unknown>): void {
        this.#chain = this.#chain.then(async () => {
            if (this.closed) return;
            for (const listener of this.#listeners.message) await listener(message);
            this.#consumed(1);
        });
    }

    hearBytes(bytes: Buffer): void {
        this.#chain = this.#chain.then(async () => {
            if (this.closed) return;
            for (const listener of this.#listeners.bytes) await listener(bytes);
            this.#consumed(bytes.length);
        });
    }

    #consumed(count: number): void {
        this.#owed += count;
        if (this.#owed < this.#window / 2 || this.closed) return;
        const credit = this.#owed;
        this.#owed = 0;
        this.#options.notify('oculus/stream/control', { id: this.id, credit });
    }

    #flush(): void {
        while (this.#queue.length > 0 && this.#credit > 0) {
            const item = this.#queue[0];
            if (item.bytes !== undefined) {
                const part = item.bytes.subarray(0, this.#credit);
                item.bytes = item.bytes.subarray(part.length);
                this.#credit -= part.length;
                if (item.bytes.length === 0) this.#queue.shift();
                this.#options.notify('oculus/stream/data', {
                    id: this.id,
                    bytes: Buffer.from(part).toString('base64')
                });
                continue;
            }
            this.#queue.shift();
            this.#credit -= 1;
            this.#options.notify('oculus/stream/data', { id: this.id, message: item.message });
        }
        if (this.#queue.length === 0) this.#resume?.();
    }

    /** End the stream; the host is told when oculus ends it. */
    end(tell: boolean): void {
        if (this.closed) return;
        this.closed = true;
        this.#queue = [];
        if (tell) this.#options.notify('oculus/stream/close', { id: this.id });
        for (const listener of this.#listeners.close) listener();
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
