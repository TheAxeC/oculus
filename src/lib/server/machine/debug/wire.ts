// Layer 2, server. The debug adapter protocol's messages over one child's standard streams. The
// framing (`Content-Length: <bytes>` and a JSON body) is vscode-jsonrpc's `StreamMessageReader` and
// `StreamMessageWriter`, the framing the language servers use, so the tree holds one. Around it
// this module pairs a response with the request whose `seq` it names, reads every message through
// a zod shape, and settles every pending request when the connection ends.
//
// A message the reader reports as an error (a header with no usable length, a body that is not
// JSON), a message that is neither a response nor an event, and a message that stops half way are
// reported once to the owner as a failure and end the connection; nothing throws out of a stream
// handler. The request arguments carry `@vscode/debugprotocol`'s types, used as types only.

import type { Readable, Writable } from 'node:stream';
import type { DebugProtocol } from '@vscode/debugprotocol';
import { StreamMessageReader, StreamMessageWriter, type Message } from 'vscode-jsonrpc/node';
import { z } from 'zod';

/** What went wrong with the bytes the adapter sent, for the owner to word. */
export type WireFailure = 'bad-header' | 'not-json' | 'not-message' | 'partial';

/** A request the adapter answered with `success: false`: `message` is the adapter's own text. */
export class Refused extends Error {}

/** A request that got no answer because the connection ended; `message` is the end's sentence. */
export class Ended extends Error {}

/** The thread of the adapter, which runs one. */
export const THREAD = 1;

/** The arguments each request takes. `finishFrame` is the adapter's own request. */
export type Requests = {
    initialize: DebugProtocol.InitializeRequestArguments;
    launch: DebugProtocol.LaunchRequestArguments;
    configurationDone: DebugProtocol.ConfigurationDoneArguments;
    setBreakpoints: DebugProtocol.SetBreakpointsArguments;
    setFunctionBreakpoints: DebugProtocol.SetFunctionBreakpointsArguments;
    setExceptionBreakpoints: DebugProtocol.SetExceptionBreakpointsArguments;
    stackTrace: DebugProtocol.StackTraceArguments;
    scopes: DebugProtocol.ScopesArguments;
    variables: DebugProtocol.VariablesArguments;
    evaluate: DebugProtocol.EvaluateArguments;
    continue: DebugProtocol.ContinueArguments;
    next: DebugProtocol.NextArguments;
    stepIn: DebugProtocol.StepInArguments;
    stepOut: DebugProtocol.StepOutArguments;
    finishFrame: Record<string, never>;
    disconnect: DebugProtocol.DisconnectArguments;
};

export type Command = keyof Requests;

const responseShape = z.object({
    type: z.literal('response'),
    request_seq: z.number(),
    success: z.boolean(),
    command: z.string(),
    message: z.string().optional(),
    body: z.unknown().optional()
});

const eventShape = z.object({
    type: z.literal('event'),
    event: z.string(),
    body: z.unknown().optional()
});

const messageShape = z.discriminatedUnion('type', [responseShape, eventShape]);

type Settle = { resolve: (body: unknown) => void; reject: (error: Error) => void };

/** What the owner is told besides the answers to its requests. */
export type WireHandlers = {
    /** An event of the adapter, with its body unread. */
    event: (event: string, body: unknown) => void;
    /** The adapter's bytes did not read; the connection has ended. */
    failed: (failure: WireFailure) => void;
};

/** One connection to an adapter. */
export type Wire = {
    /** Send a request and resolve its body: `Refused` if the adapter says no, `Ended` at an end. */
    request: <C extends Command>(command: C, args: Requests[C]) => Promise<unknown>;
    /** End the connection: every pending request is rejected with `reason` and nothing is read. */
    end: (reason: string) => void;
};

/** Open the connection over the child's input and output streams. */
export function openWire(output: Readable, input: Writable, handlers: WireHandlers): Wire {
    const reader = new StreamMessageReader(output);
    const writer = new StreamMessageWriter(input);
    const pending = new Map<number, Settle>();
    let next = 1;
    let over: string | null = null;

    function end(reason: string): void {
        if (over !== null) return;
        over = reason;
        reader.dispose();
        writer.dispose();
        for (const settle of pending.values()) settle.reject(new Ended(reason));
        pending.clear();
    }

    function fail(failure: WireFailure): void {
        if (over !== null) return;
        end(failure);
        handlers.failed(failure);
    }

    function read(message: Message): void {
        if (over !== null) return;
        const known = messageShape.safeParse(message);
        if (!known.success) {
            fail('not-message');
            return;
        }
        const heard = known.data;
        if (heard.type === 'event') {
            handlers.event(heard.event, heard.body);
            return;
        }
        const settle = pending.get(heard.request_seq);
        if (settle === undefined) return;
        pending.delete(heard.request_seq);
        if (heard.success) settle.resolve(heard.body);
        else settle.reject(new Refused(heard.message ?? ''));
    }

    reader.onError((error) => fail(error instanceof SyntaxError ? 'not-json' : 'bad-header'));
    reader.onPartialMessage(() => fail('partial'));
    writer.onError(() => undefined);
    input.on('error', () => undefined);
    reader.listen(read);

    function request<C extends Command>(command: C, args: Requests[C]): Promise<unknown> {
        if (over !== null) return Promise.reject(new Ended(over));
        const seq = next++;
        return new Promise((resolve, reject) => {
            pending.set(seq, { resolve, reject });
            const frame = { seq, type: 'request', command, arguments: args };
            writer.write(frame as unknown as Message).catch(() => {
                pending.delete(seq);
                reject(new Ended(over ?? 'closed'));
            });
        });
    }

    return { request, end };
}
