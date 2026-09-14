// Layer 2, server. The one WebSocket of DESIGN.md, "The socket": it attaches to an http server
// that already exists, turns each connection into a Sink the Hub can send to, and accepts exactly
// one message from the page, the subscription. Nothing else a page sends is acted on; the write
// side is `POST /api/write`'s and goes over fetch, not over here.
//
// The one exception DESIGN.md's "The socket" names is terminal input: a page that carried the write
// token in its subscribe message may also send `input` and `resize` on a `pty:` channel, which this
// hands to server/pty/channel.ts. A socket without the token reads every channel and writes to none.
//
// The origin check is the read half of DESIGN.md's "Auth". The server binds 127.0.0.1, but any page
// open in the browser can address 127.0.0.1, so a connection is refused unless its Origin names
// this machine. A missing Origin is refused with the rest: a browser always sends one on a
// WebSocket handshake, so its absence is not a browser tab. The rule itself is server/auth.ts's,
// where the write half of "Auth" is, and this uses it rather than holding a second copy.

import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { allowedOrigin } from './auth.ts';
import type { Hub, Sink } from './channels.ts';
import { CHANNEL_PREFIX } from './pty/channel.ts';
import type { Subscription } from '../data/model.ts';

/** What the socket needs of the terminals; server/pty/channel.ts's Terminals is the one there is. */
export type TerminalSink = {
    subscribed(sink: Sink, channels: string[], token: unknown, expectedToken: string): void;
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
};

export type Attached = {
    /** Stop listening for upgrades and close every open connection. */
    close(): void;
};

/** A subscribe message, with the write token when the page sent one, or null when it is not one. */
export function parseSubscription(data: string): Subscription | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(data);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const message = parsed as Record<string, unknown>;
    if (message.type !== 'subscribe' || !Array.isArray(message.channels)) return null;
    if (!message.channels.every((channel) => typeof channel === 'string')) return null;
    return {
        type: 'subscribe',
        channels: message.channels as string[],
        token: typeof message.token === 'string' ? message.token : undefined
    };
}

/** The channels of a subscribe message, or null when the message is not one. */
export function subscriptionChannels(data: string): string[] | null {
    return parseSubscription(data)?.channels ?? null;
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

    wss.on('connection', (ws: WebSocket) => {
        const sink: Sink = {
            send: (text: string) =>
                new Promise((resolve, reject) => {
                    ws.send(text, (error) => (error ? reject(error) : resolve()));
                }),
            close: () => ws.close()
        };
        const drop = (): void => {
            options.terminals?.remove(sink);
            hub.remove(sink);
        };
        ws.on('message', (data: unknown) => {
            const text = String(data);
            const subscription = parseSubscription(text);
            if (subscription !== null) {
                // A terminal channel is subscribed by the terminals, which send the scrollback
                // first; every other channel is the Hub's own and gets its latest message here.
                const plain = subscription.channels.filter(
                    (channel) => !channel.startsWith(CHANNEL_PREFIX)
                );
                if (plain.length > 0) hub.subscribe(sink, plain);
                options.terminals?.subscribed(
                    sink,
                    subscription.channels,
                    subscription.token,
                    options.token
                );
                return;
            }
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
