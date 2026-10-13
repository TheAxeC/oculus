// Layer 2, server. The streams of the host's side of the connection: the byte and message flows of
// a language server, a debug adapter or a terminal, which ride the host's one JSON-RPC connection
// as DESIGN.md's `oculus/stream/*` rows say and never touch file descriptor 1 beside it.
//
// The host opens every stream (`oculus/stream/open`, answered at once or refused `refused:id`).
// `oculus/stream/data` carries base64 `bytes` of a terminal, one `message` object of a server or an
// adapter, or `stderr` text; `oculus/stream/control` carries `credit`, a terminal's `rows` and
// `columns`, or an `end` with a `code`; `oculus/stream/close` ends it. Each side grants the other a
// window at open (1 MiB of bytes, or 256 messages) and grants more as it consumes; a sender with no
// credit holds its data and tells its source to pause, so what is held per stream is bounded by the
// window. A `data`, `control` or `close` naming an id this host did not open, or one already
// closed, is dropped and written to the host's output, except a `close` that crosses the close the
// host sent for the same stream. A server's or adapter's data that is not one message object closes
// that stream with a line in its output. Neither ends the host. Oculus's end of the same protocol
// is apps/tools/streams.ts, which holds the same windows, the same bound and the same rules for an
// id it did not open; a change to one is made in both.

/** The window each side grants at open: bytes for a terminal, messages for the others. */
export const BYTE_WINDOW = 1024 * 1024;
export const MESSAGE_WINDOW = 256;

/** The most messages a stream with no credit holds before it is closed. */
const HELD_MESSAGES = 4096;

/**
 * The streams of one host.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   note: (line: string) => void,
 *   texts: () => Record<string, string>,
 * }} link `note` writes a line to the host's output, `texts` gives the runner's sentences
 */
export function createStreams(link) {
    const { connection, note } = link;
    const open = new Map();
    const closed = new Set();
    let counter = 0;
    const fill = (template, args) =>
        String(template ?? '{0}').replace(/\{(\d+)\}/g, (found, at) => args[Number(at)] ?? found);

    /** A stream of a kind, made by the host and announced to oculus. */
    async function make(kind, purpose = {}) {
        counter += 1;
        const id = `s${counter}`;
        const bytes = kind === 'terminal';
        const stream = {
            id,
            kind,
            bytes,
            window: bytes ? BYTE_WINDOW : MESSAGE_WINDOW,
            /** What the host may still send oculus. */
            sendCredit: bytes ? BYTE_WINDOW : MESSAGE_WINDOW,
            queue: [],
            owed: 0,
            chain: Promise.resolve(),
            listeners: { message: [], bytes: [], stderr: [], control: [], close: [] },
            pause: undefined,
            resume: undefined,
            ended: false
        };
        open.set(id, stream);
        try {
            await connection.sendRequest('oculus/stream/open', { id, kind, purpose });
        } catch (error) {
            open.delete(id);
            throw error;
        }
        return handle(stream);
    }

    /** Send what the credit allows of a stream's queue. */
    function flush(stream) {
        while (stream.queue.length > 0 && stream.sendCredit > 0) {
            const item = stream.queue[0];
            if (stream.bytes && item.bytes.length > stream.sendCredit) {
                const part = item.bytes.subarray(0, stream.sendCredit);
                item.bytes = item.bytes.subarray(stream.sendCredit);
                stream.sendCredit = 0;
                connection.sendNotification('oculus/stream/data', {
                    id: stream.id,
                    bytes: Buffer.from(part).toString('base64')
                });
                continue;
            }
            stream.queue.shift();
            stream.sendCredit -= stream.bytes ? item.bytes.length : 1;
            connection.sendNotification('oculus/stream/data', {
                id: stream.id,
                ...(stream.bytes
                    ? { bytes: Buffer.from(item.bytes).toString('base64') }
                    : { message: item.message })
            });
        }
        if (stream.queue.length === 0) stream.resume?.();
    }

    /** Count what the host finished with and grant oculus more once half the window is owed. */
    function consumed(stream, count) {
        stream.owed += count;
        if (stream.owed < stream.window / 2 || stream.ended) return;
        const credit = stream.owed;
        stream.owed = 0;
        connection.sendNotification('oculus/stream/control', { id: stream.id, credit });
    }

    /** The object a module holds for one stream. */
    function handle(stream) {
        return {
            id: stream.id,
            kind: stream.kind,
            /** Send one message object (a server or an adapter) once credit allows. */
            sendMessage(message) {
                if (stream.ended) return;
                stream.queue.push({ message });
                if (stream.queue.length > HELD_MESSAGES) {
                    note(fill(link.texts().streamFull, [stream.id]));
                    finish(stream, true);
                    return;
                }
                flush(stream);
                if (stream.queue.length > 0) stream.pause?.();
            },
            /** Send bytes (a terminal) once credit allows. */
            sendBytes(buffer) {
                if (stream.ended) return;
                stream.queue.push({ bytes: Buffer.from(buffer) });
                if (stream.queue.length > HELD_MESSAGES) {
                    note(fill(link.texts().streamFull, [stream.id]));
                    finish(stream, true);
                    return;
                }
                flush(stream);
                if (stream.queue.length > 0) stream.pause?.();
            },
            /** Send text lines of the server's or adapter's own output. */
            sendStderr(text) {
                if (!stream.ended) {
                    connection.sendNotification('oculus/stream/data', {
                        id: stream.id,
                        stderr: text
                    });
                }
            },
            /** A control message: a terminal's size, or the end of the stream with a code. */
            sendControl(body) {
                if (!stream.ended) {
                    connection.sendNotification('oculus/stream/control', {
                        id: stream.id,
                        ...body
                    });
                }
            },
            /**
             * The source of the data (a child's readable) is paused and resumed with the credit.
             */
            backpressure(pause, resume) {
                stream.pause = pause;
                stream.resume = resume;
            },
            /**
             * A listener may return a promise: the credit for its message returns when it settles.
             */
            onMessage: (listener) => stream.listeners.message.push(listener),
            onBytes: (listener) => stream.listeners.bytes.push(listener),
            onStderr: (listener) => stream.listeners.stderr.push(listener),
            onControl: (listener) => stream.listeners.control.push(listener),
            onClose: (listener) => stream.listeners.close.push(listener),
            /** Whether the stream has been closed. */
            get closed() {
                return stream.ended;
            },
            /** How many messages or bytes wait for credit. */
            held: () => stream.queue.reduce((sum, one) => sum + (one.bytes?.length ?? 1), 0),
            close() {
                finish(stream, true);
            }
        };
    }

    /** End a stream; tell oculus when the host ends it. */
    function finish(stream, tell) {
        if (stream.ended) return;
        stream.ended = true;
        stream.queue = [];
        open.delete(stream.id);
        closed.add(stream.id);
        if (tell) connection.sendNotification('oculus/stream/close', { id: stream.id });
        for (const listener of stream.listeners.close) listener();
    }

    /** The stream a notification names, or null after a line in the host's output. */
    function held(params, what) {
        const id = typeof params?.id === 'string' ? params.id : '';
        const stream = open.get(id);
        if (stream !== undefined) return stream;
        note(fill(link.texts().streamUnknown, [what, id]));
        return null;
    }

    /** Hand one received item to the listeners in order, then return its credit. */
    function hear(stream, listeners, item, size) {
        stream.chain = stream.chain.then(async () => {
            if (stream.ended) return;
            for (const listener of listeners) {
                try {
                    await listener(item);
                } catch (error) {
                    note(
                        fill(link.texts().listenerFailed, [
                            error instanceof Error ? error.message : String(error)
                        ])
                    );
                }
            }
            consumed(stream, size);
        });
    }

    connection.onNotification('oculus/stream/data', (params) => {
        const stream = held(params, 'data');
        if (stream === null) return;
        if (typeof params.stderr === 'string') {
            for (const listener of stream.listeners.stderr) listener(params.stderr);
            return;
        }
        if (stream.bytes) {
            if (typeof params.bytes !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(params.bytes)) {
                note(fill(link.texts().streamBad, [stream.id]));
                finish(stream, true);
                return;
            }
            const buffer = Buffer.from(params.bytes, 'base64');
            hear(stream, stream.listeners.bytes, buffer, buffer.length);
            return;
        }
        const message = params.message;
        if (message === null || typeof message !== 'object' || Array.isArray(message)) {
            note(fill(link.texts().streamBad, [stream.id]));
            finish(stream, true);
            return;
        }
        hear(stream, stream.listeners.message, message, 1);
    });

    connection.onNotification('oculus/stream/control', (params) => {
        const stream = held(params, 'control');
        if (stream === null) return;
        if (typeof params.credit === 'number' && params.credit > 0) {
            stream.sendCredit += params.credit;
            flush(stream);
            return;
        }
        for (const listener of stream.listeners.control) listener(params);
    });

    connection.onNotification('oculus/stream/close', (params) => {
        // A close from oculus that crosses the close the host sent for the same stream is no fault.
        if (closed.has(params?.id)) return;
        const stream = held(params, 'close');
        if (stream !== null) finish(stream, false);
    });

    return {
        make,
        /** End every stream the host opened; used when the host stops. */
        closeAll() {
            for (const stream of [...open.values()]) finish(stream, true);
        }
    };
}
