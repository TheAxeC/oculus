// The socket on a real http server: the origin check, the subscription, and a push.
//
// Every server listens on 127.0.0.1 port 0, so the port is the operating system's choice and no
// port this machine runs anything on is touched. Every server and every client this file opens is
// closed before the test returns.

import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { allowedOrigin } from '../../../src/lib/server/core/auth.ts';
import { attachSocket, subscriptionChannels } from '../../../src/lib/server/core/socket.ts';
import type { Attached, TerminalSink } from '../../../src/lib/server/core/socket.ts';
import type { Message } from '../../../src/lib/data/model.ts';
import { noop } from '../../fixtures/doubles.ts';
import { present } from '../../fixtures/present.ts';

type Running = {
    hub: Hub;
    port: number;
    server: Server;
    attached: Attached;
};

const running: Running[] = [];

async function start(terminals?: TerminalSink): Promise<Running> {
    const hub = new Hub();
    const server = createServer((_request, response) => response.end('oculus'));
    const attached = attachSocket(server, hub, {
        path: '/ws',
        token: 'socket-token',
        terminals
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    const started = { hub, port, server, attached };
    running.push(started);
    return started;
}

/** Wait for one event of a WebSocket, whichever comes first of the two names. */
function once(ws: WebSocket, _name: 'open' | 'error'): Promise<Error | null> {
    return new Promise((resolve) => {
        ws.once('open', () => resolve(null));
        ws.once('error', (error: Error) => resolve(error));
    });
}

/** Read messages off a client until `count` of them have arrived. */
function collect(ws: WebSocket, count: number): Promise<Message[]> {
    const got: Message[] = [];
    return new Promise((resolve) => {
        ws.on('message', (data: unknown) => {
            got.push(JSON.parse(String(data)) as Message);
            if (got.length === count) resolve(got);
        });
    });
}

afterEach(async () => {
    while (running.length > 0) {
        const started = present(running.pop(), 'running server to close');
        started.attached.close();
        await new Promise<void>((resolve) => started.server.close(() => resolve()));
    }
});

describe('allowedOrigin', () => {
    it('takes this machine on any port and nothing else', () => {
        expect(allowedOrigin('http://127.0.0.1:8791')).toBe(true);
        expect(allowedOrigin('http://localhost:5173')).toBe(true);
        expect(allowedOrigin('https://localhost')).toBe(true);
        expect(allowedOrigin('http://evil.invalid')).toBe(false);
        expect(allowedOrigin('http://127.0.0.1.evil.invalid')).toBe(false);
        expect(allowedOrigin('not a url')).toBe(false);
        expect(allowedOrigin(undefined)).toBe(false);
        expect(allowedOrigin('')).toBe(false);
    });
});

describe('subscriptionChannels', () => {
    it('reads the one message a client may send and refuses everything else', () => {
        expect(subscriptionChannels('{"type":"subscribe","channels":["portfolio"]}')).toEqual([
            'portfolio'
        ]);
        expect(subscriptionChannels('{"type":"subscribe","channels":[]}')).toEqual([]);
        expect(subscriptionChannels('{"type":"write","path":"/etc/passwd"}')).toBe(null);
        expect(subscriptionChannels('{"type":"subscribe","channels":[3]}')).toBe(null);
        expect(subscriptionChannels('["subscribe"]')).toBe(null);
        expect(subscriptionChannels('not json')).toBe(null);
    });
});

describe('attachSocket', () => {
    it('refuses an upgrade from another origin', async () => {
        const started = await start();
        const ws = new WebSocket(`ws://127.0.0.1:${started.port}/ws`, {
            headers: { Origin: 'http://evil.invalid' }
        });
        const error = await once(ws, 'error');
        ws.terminate();

        expect(error?.message).toMatch(/403/);
        expect(started.hub.size).toBe(0);
    });

    it('refuses an upgrade with no origin at all', async () => {
        const started = await start();
        const ws = new WebSocket(`ws://127.0.0.1:${started.port}/ws`);
        const error = await once(ws, 'error');
        ws.terminate();

        expect(error?.message).toMatch(/403/);
    });

    it('sends a feeds subscriber the current payload and then every push', async () => {
        const started = await start();
        started.hub.publish('feeds', { radar: { entries: [{ title: 'First' }] } });

        const ws = new WebSocket(`ws://127.0.0.1:${started.port}/ws`, {
            headers: { Origin: `http://127.0.0.1:${started.port}` }
        });
        expect(await once(ws, 'open')).toBe(null);

        const arrived = collect(ws, 2);
        ws.send(JSON.stringify({ type: 'subscribe', channels: ['feeds'] }));
        // The publish has to follow the subscription, which is why it waits for the first message.
        await new Promise<void>((resolve) => {
            ws.once('message', () => resolve());
        });
        started.hub.publish('feeds', { radar: { entries: [{ title: 'Second' }] } });

        expect(await arrived).toEqual([
            {
                channel: 'feeds',
                version: 1,
                payload: { radar: { entries: [{ title: 'First' }] } }
            },
            {
                channel: 'feeds',
                version: 2,
                payload: { radar: { entries: [{ title: 'Second' }] } }
            }
        ]);
        ws.close();
    });

    it('passes the subscription token and context token to the terminal sink', async () => {
        let record = (_value: { channels: string[]; token: unknown; expected: string }): void => {
            // Replaced by the promise's resolve below, before anything calls it.
        };
        const received = new Promise<{ channels: string[]; token: unknown; expected: string }>(
            (resolve) => {
                record = resolve;
            }
        );
        const terminals: TerminalSink = {
            subscribed: (_sink, channels, token, expected) => {
                record({ channels, token, expected });
            },
            inbound: () => false,
            remove: noop
        };
        const started = await start(terminals);
        const ws = new WebSocket(`ws://127.0.0.1:${started.port}/ws`, {
            headers: { Origin: `http://127.0.0.1:${started.port}` }
        });
        expect(await once(ws, 'open')).toBe(null);

        ws.send(
            JSON.stringify({
                type: 'subscribe',
                channels: ['pty:terminal-one'],
                token: 'subscription-token'
            })
        );

        expect(await received).toEqual({
            channels: ['pty:terminal-one'],
            token: 'subscription-token',
            expected: 'socket-token'
        });
        ws.close();
    });

    it('leaves an upgrade on another path to its own handler', async () => {
        const started = await start();
        started.server.on('upgrade', (_request, socket) => {
            socket.write('HTTP/1.1 418 I am a teapot\r\nConnection: close\r\n\r\n');
            socket.destroy();
        });

        const ws = new WebSocket(`ws://127.0.0.1:${started.port}/hmr`, {
            headers: { Origin: 'http://evil.invalid' }
        });
        const error = await once(ws, 'error');
        ws.terminate();

        expect(error?.message).toMatch(/418/);
    });
});
