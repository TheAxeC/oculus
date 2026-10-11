// Layer 2, server. The JSON-RPC 2.0 connection between oculus and one host, oculus's end of it.
// The framing, the request ids, the cancellation and the progress are `vscode-jsonrpc`'s
// `createMessageConnection` over the host process's standard input and output; the runner
// (host-runner.mjs) is its other end. The methods are in DESIGN.md's "Apps added while oculus
// runs".
//
// Requests and notifications go both ways. A request to the host may be cancelled with a
// `CancellationToken`, which sends `$/cancelRequest`, and may ask for progress: the host reports
// with `$/progress` on the token the caller names, and `onProgress` is called with each value. A
// handler for a request of the host receives the params and a token the host's cancel ends.
//
// A refusal is a `Refused`, which carries the word an app is told (`rate`, `not_declared`,
// `host_down`, `refused:<reason>`). On the wire it is a `ResponseError` with the word as its
// message; a request that fails any other way, because the connection closed or the host sent a
// malformed message, is `host_down` to the caller. A message that cannot be read calls `broken`
// once: the stream is no longer trusted.

import type { Readable, Writable } from 'node:stream';
import {
    CancellationToken,
    ProgressType,
    ResponseError,
    StreamMessageReader,
    StreamMessageWriter,
    createMessageConnection,
    type MessageConnection
} from 'vscode-jsonrpc/node';

/** The code of a `ResponseError` that carries an app-facing word. */
const REFUSED = 1;

/** An error that carries the word an app is refused with. */
export class Refused extends Error {
    readonly word: string;

    constructor(word: string) {
        super(word);
        this.word = word;
    }
}

/** A handler for a request of the host: its params and the token the host's cancel ends. */
export type HostHandler = (params: unknown, token: CancellationToken) => unknown;

/** One request to the host, with the cancellation and the progress it may ask for. */
export type HostCall = {
    cancel?: CancellationToken;
    /** Called with each value the host reports on the progress token the params carry. */
    progress?: { token: string; report: (value: unknown) => void };
};

/** oculus's end of the connection. */
export type HostLink = {
    request(method: string, params: unknown, call?: HostCall): Promise<unknown>;
    notify(method: string, params: unknown): void;
    /** Ends the connection; every request in flight is rejected. */
    dispose(): void;
};

/** What the connection is made over. */
export type LinkOptions = {
    input: Readable;
    output: Writable;
    handlers: Record<string, HostHandler>;
    /** Called once when a message of the host cannot be read. */
    broken: (reason: string) => void;
};

/** The word an error stands for toward an app: its own, or `host_down` for a lost connection. */
function wordOf(error: unknown): string {
    if (error instanceof ResponseError && error.code === REFUSED) return `refused:${error.message}`;
    return 'host_down';
}

/** Connect to a host over its two streams. */
export function connectHost(options: LinkOptions): HostLink {
    const connection: MessageConnection = createMessageConnection(
        new StreamMessageReader(options.input),
        new StreamMessageWriter(options.output)
    );
    let told = false;
    connection.onError(([error]) => {
        if (told) return;
        told = true;
        options.broken(error.message);
    });
    for (const [method, handler] of Object.entries(options.handlers)) {
        connection.onRequest(method, async (params: unknown, token: CancellationToken) => {
            try {
                return (await handler(params, token)) ?? null;
            } catch (error) {
                if (error instanceof Refused) throw new ResponseError(REFUSED, error.word);
                throw new ResponseError(REFUSED, 'failed');
            }
        });
    }
    connection.listen();
    return {
        async request(method, params, call = {}) {
            const progress = call.progress;
            const watching =
                progress === undefined
                    ? undefined
                    : connection.onProgress(
                          new ProgressType<unknown>(),
                          progress.token,
                          progress.report
                      );
            try {
                return await connection.sendRequest(method, params, call.cancel);
            } catch (error) {
                throw new Refused(wordOf(error));
            } finally {
                watching?.dispose();
            }
        },
        notify(method, params) {
            void connection.sendNotification(method, params).catch(() => undefined);
        },
        dispose() {
            connection.dispose();
        }
    };
}
