// Layer 4, server test. The token gate of the language server channels, on a real socket
// server over a relay whose servers are stub processes: an `lsp:` frame from a socket that carried
// no token is read and dropped and nothing reaches a server, a socket whose subscribe carried the
// token (one of no channels included) is answered and its documents reach the server, and a
// subscribe of a wrong token does not admit.

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, vi } from 'vitest';
import { WebSocket } from 'ws';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts';
import { attachSocket } from '../../../../src/lib/server/root/socket.ts';
import { it } from '../../../fixtures/scratch.ts';
import { frame, makeRelay, pageFile, plantRoot, stubSpawn } from './lsp-fixture.ts';

const TOKEN = 'a token minted for this test';
const CHANNEL = 'lsp:python';

const closers: (() => void | Promise<void>)[] = [];
const clients: WebSocket[] = [];

afterEach(async () => {
    while (clients.length > 0) clients.pop()?.close();
    while (closers.length > 0) await closers.pop()?.();
});

/** A real socket server over a relay on stub processes, and what each was asked. */
async function socketOver(): Promise<{
    port: number;
    relay: Relay;
    spawned: ReturnType<typeof stubSpawn>;
}> {
    const dir = plantRoot();
    const spawned = stubSpawn();
    const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
    const server: Server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const attached = attachSocket(server, new Hub(), { path: '/ws', token: TOKEN, relay });
    closers.push(async () => {
        attached.close();
        server.close();
        await relay.close();
    });
    return { port: (server.address() as AddressInfo).port, relay, spawned };
}

/** A page's socket, open, with the frames it is sent kept in order. */
async function pageOn(
    port: number
): Promise<{ client: WebSocket; got: Record<string, unknown>[] }> {
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
        headers: { origin: `http://127.0.0.1:${port}` }
    });
    clients.push(client);
    const got: Record<string, unknown>[] = [];
    client.on('message', (data) => {
        if (Buffer.isBuffer(data))
            got.push(JSON.parse(data.toString('utf8')) as Record<string, unknown>);
    });
    await new Promise((resolve) => client.once('open', resolve));
    return { client, got };
}

const INITIALIZE = (id: number) =>
    frame(CHANNEL, {
        jsonrpc: '2.0',
        id,
        method: 'initialize',
        params: { capabilities: {} }
    });

const DID_OPEN = frame(CHANNEL, {
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
        textDocument: {
            uri: pageFile('repo', 'a.py'),
            languageId: 'python',
            version: 1,
            text: 'x = 1\n'
        }
    }
});

/** The ids of the answers a page has been sent. */
const answered = (got: Record<string, unknown>[]): unknown[] =>
    got.map((one) => (one.payload as { id?: unknown }).id);

type Row = {
    name: string;
    steps: (
        page: Awaited<ReturnType<typeof pageOn>>,
        spawned: ReturnType<typeof stubSpawn>
    ) => Promise<void>;
};

const ROWS: Row[] = [
    {
        name: 'refuses an lsp message from a socket that carried no token, and sends nothing to a server',
        steps: async ({ client, got }, spawned) => {
            client.send(JSON.stringify({ type: 'subscribe', channels: [CHANNEL] }));
            client.send(INITIALIZE(1));
            client.send(DID_OPEN);
            // A later frame of the same socket, once it carries the token, is the marker that the
            // two before it were read: the socket handles its frames in order.
            client.send(JSON.stringify({ type: 'subscribe', channels: [], token: TOKEN }));
            client.send(INITIALIZE(2));
            await vi.waitFor(() => expect(answered(got)).toContain(2));
            expect(answered(got)).not.toContain(1);
            expect(spawned.calls).toEqual([]);
        }
    },
    {
        name: 'admits a socket whose subscribe of no channels carries the token',
        steps: async ({ client, got }, spawned) => {
            client.send(JSON.stringify({ type: 'subscribe', channels: [CHANNEL] }));
            client.send(JSON.stringify({ type: 'subscribe', channels: [], token: TOKEN }));
            client.send(INITIALIZE(1));
            client.send(DID_OPEN);
            await vi.waitFor(() => expect(answered(got)).toContain(1));
            await vi.waitFor(() => expect(spawned.calls).toHaveLength(1));
            expect(spawned.calls[0].args).toContain('--stdio');
        }
    },
    {
        name: 'keeps refusing a socket whose subscribe of no channels carries a wrong token',
        steps: async ({ client, got }, spawned) => {
            client.send(
                JSON.stringify({ type: 'subscribe', channels: [], token: 'not the token' })
            );
            client.send(INITIALIZE(1));
            client.send(DID_OPEN);
            client.send(JSON.stringify({ type: 'subscribe', channels: [], token: TOKEN }));
            client.send(INITIALIZE(2));
            await vi.waitFor(() => expect(answered(got)).toContain(2));
            expect(answered(got)).not.toContain(1);
            expect(spawned.calls).toEqual([]);
        }
    },
    {
        name: 'answers each initialize of a channel, as a client made again on the same socket sends one, and starts one server',
        steps: async ({ client, got }, spawned) => {
            client.send(JSON.stringify({ type: 'subscribe', channels: [], token: TOKEN }));
            client.send(INITIALIZE(1));
            client.send(DID_OPEN);
            await vi.waitFor(() => expect(spawned.calls).toHaveLength(1));
            client.send(INITIALIZE(2));
            client.send(DID_OPEN);
            await vi.waitFor(() => expect(answered(got)).toContain(2));
            expect(answered(got)).toContain(1);
            expect(spawned.calls).toHaveLength(1);
        }
    },
    {
        name: 'reads a frame that is not JSON-RPC and sends nothing of it to a server',
        steps: async ({ client, got }, spawned) => {
            client.send(JSON.stringify({ type: 'subscribe', channels: [], token: TOKEN }));
            client.send(JSON.stringify({ channel: CHANNEL, payload: { not: 'a message' } }));
            client.send(JSON.stringify({ channel: CHANNEL, payload: 'text' }));
            client.send(JSON.stringify({ channel: 'lsp:', payload: {} }));
            client.send(INITIALIZE(2));
            await vi.waitFor(() => expect(answered(got)).toContain(2));
            expect(spawned.calls).toEqual([]);
        }
    }
];

describe('the lsp channel', () => {
    it.each(ROWS)('$name', async ({ steps }) => {
        const { port, spawned } = await socketOver();
        await steps(await pageOn(port), spawned);
    });
});
