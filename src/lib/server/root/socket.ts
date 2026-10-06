// Layer 2, server. The one WebSocket of DESIGN.md, "The socket": it attaches to an http server
// that already exists, turns each connection into a Sink the Hub can send to, and accepts the
// subscription from the page. Nothing else a page sends is acted on, except the two exceptions
// below; the write side is `POST /api/write`'s and goes over fetch, not over here.
//
// The two exceptions DESIGN.md's "The socket" names are terminal input and language server
// messages. A page that carried the write token in a subscribe message may send `input` and
// `resize` on a `pty:` channel, which this hands to server/machine/pty/channel.ts, and a frame on
// an `lsp:<language>` channel, which this hands to server/machine/lsp/relay.ts. A socket without
// the token reads every channel and writes to none. This module holds the one set of sockets that
// carried the token: every subscribe message is read for it, one of no channels included (the page
// sends a token it installed after the socket subscribed in that form), and both consumers are
// handed `canWrite(sink)` once, which each calls at every message. A `pty:` and an `lsp:` channel
// are neither of them the Hub's, so neither is subscribed there. The message is read through a zod
// schema held to the `Subscription` type of data/model.
//
// The origin check is the read half of DESIGN.md's "Auth". The server binds 127.0.0.1, but any page
// open in the browser can address 127.0.0.1, so a connection is refused unless its Origin names
// this machine. A missing Origin is refused with the rest: a browser always sends one on a
// WebSocket handshake, so its absence is not a browser tab. The rule itself is
// server/core/auth.ts's, where the write half of "Auth" is, and this uses it rather than holding a
// second copy.

import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { z } from 'zod';
import { allowedOrigin, carriesToken } from '../core/auth.ts';
import type { Hub, Sink } from '../core/channels.ts';
import { LSP_PREFIX } from '../machine/lsp/wire.ts';
import { CHANNEL_PREFIX } from '../machine/pty/channel.ts';
import type { Subscription } from '../../data/model/index.ts';

/**
 * What the socket needs of the terminals; server/machine/pty/channel.ts's Terminals is the one
 * there is.
 */
export type TerminalSink = {
    /** Takes the socket's `canWrite(sink)`, which says whether a sink carried the token. */
    gate(canWrite: (sink: Sink) => boolean): void;
    subscribed(sink: Sink, channels: string[]): void;
    /** Whether the message was a terminal message. */
    inbound(sink: Sink, data: string): boolean;
    remove(sink: Sink): void;
};

/**
 * What the socket needs of the language server relay; server/machine/lsp/relay.ts's Relay is the
 * one there is.
 */
export type RelaySink = {
    /** Takes the socket's `canWrite(sink)`, as the terminals do. */
    gate(canWrite: (sink: Sink) => boolean): void;
    /** Whether the message was a frame of an `lsp:` channel. */
    inbound(sink: Sink, data: string): boolean;
    remove(sink: Sink): void;
};

export type SocketOptions = {
    /** The path the upgrade must be on. An upgrade on any other path is left to its own handler. */
    path: string;
    /** The write token minted with the rest of this server context. */
    token: string;
    /** The terminals, when this process has any. Without it a `pty:` channel carries nothing. */
    terminals?: TerminalSink;
    /**
     * The language server relay, when this process has one. Without it an `lsp:` frame is dropped.
     */
    relay?: RelaySink;
};

export type Attached = {
    /** Stop listening for upgrades and close every open connection. */
    close(): void;
};

/**
 * The subscribe message a page sends. A token of the wrong type is dropped and the message kept; a
 * message of another type, or whose channels are not all strings, is refused.
 */
const subscriptionShape = z.object({
    type: z.literal('subscribe'),
    channels: z.array(z.string()),
    token: z.string().optional().catch(undefined)
}) satisfies z.ZodType<Subscription>;

/** A subscribe message, with the write token when the page sent one, or null when it is not one. */
export function parseSubscription(data: string): Subscription | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(data);
    } catch {
        return null;
    }
    const message = subscriptionShape.safeParse(parsed);
    if (!message.success) return null;
    const { channels, token } = message.data;
    return { type: 'subscribe', channels, token };
}

export function attachSocket(server: Server, hub: Hub, options: SocketOptions): Attached {
    const wss = new WebSocketServer({ noServer: true });

    const upgrade = (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
        // The base is only there to parse the path out of a request-target; it is not used.
        const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
        if (path !== options.path) return;
        if (!allowedOrigin(request.headers.origin)) {
            socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
    };
    server.on('upgrade', upgrade);

    // The sockets whose subscribe message carried the write token, which is what may write.
    const writable = new WeakSet<Sink>();
    const canWrite = (sink: Sink): boolean => writable.has(sink);
    options.relay?.gate(canWrite);
    options.terminals?.gate(canWrite);

    wss.on('connection', (ws: WebSocket) => {
        const sink: Sink = {
            send: (text: string) =>
                new Promise((resolve, reject) => {
                    ws.send(text, (error) => (error ? reject(error) : resolve()));
                }),
            close: () => ws.close()
        };
        const drop = (): void => {
            options.relay?.remove(sink);
            options.terminals?.remove(sink);
            hub.remove(sink);
        };
        ws.on('message', (data: unknown) => {
            const text = String(data);
            const subscription = parseSubscription(text);
            if (subscription !== null) {
                if (carriesToken(subscription.token, options.token)) writable.add(sink);
                // A terminal channel is subscribed by the terminals, which send the scrollback
                // first, and a language server channel is the relay's and has no latest message;
                // every other channel is the Hub's own and gets its latest message here.
                const plain = subscription.channels.filter(
                    (channel) =>
                        !channel.startsWith(CHANNEL_PREFIX) && !channel.startsWith(LSP_PREFIX)
                );
                if (plain.length > 0) hub.subscribe(sink, plain);
                options.terminals?.subscribed(sink, subscription.channels);
                return;
            }
            if (options.relay?.inbound(sink, text) === true) return;
            options.terminals?.inbound(sink, text);
        });
        ws.on('close', drop);
        ws.on('error', drop);
    });

    return {
        close(): void {
            server.off('upgrade', upgrade);
            for (const client of wss.clients) client.terminate();
            wss.close();
        }
    };
}
