// Layer 4, test. The `config` pushes a page takes after its seed: the page's socket drops a push at
// or below the seed's version, which is the hub's replay of a read made before the config files
// changed, and after a reconnect it takes every push, since a restarted server numbers its pushes
// from the start again.
//
// Nothing here opens a socket: `WebSocket` is a stub that hands the page what a case delivers.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigPayload } from '../../../src/lib/data/model/index.ts';
import { createClientState } from '../../fixtures/client.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

const HOST = { name: 'test-machine', address: 'http://127.0.0.1:8799' };

/** A configuration that says how long a write waits, which is the value a stale push gets wrong. */
function payload(seconds: number): ConfigPayload {
    return {
        config: { writes: { timeout_seconds: seconds } },
        text: {},
        icons: {},
        host: HOST,
        findings: []
    };
}

/** The page's socket, as a stub: `deliver` hands it a message and `open` says it opened. */
function stubSocket(): {
    deliver: (channel: string, version: number, body: unknown) => void;
    open: () => void;
} {
    const listeners = new Map<string, ((event: { data?: string }) => void)[]>();
    vi.stubGlobal('location', { host: '127.0.0.1:8799' });
    vi.stubGlobal(
        'WebSocket',
        class {
            static OPEN = 1;
            readyState = 1;
            addEventListener(name: string, fn: (event: { data?: string }) => void): void {
                listeners.set(name, [...(listeners.get(name) ?? []), fn]);
            }
            send(): void {
                // What the page subscribes to is not this file's question.
            }
            close(): void {
                this.readyState = 3;
            }
        }
    );
    return {
        deliver: (channel, version, body) => {
            const data = JSON.stringify({ channel, version, payload: body });
            for (const fn of listeners.get('message') ?? []) fn({ data });
        },
        open: () => {
            for (const fn of listeners.get('open') ?? []) fn({});
        }
    };
}

describe("the page's config channel", () => {
    it('keeps the configuration it was built from over a replayed push that is not newer', () => {
        // revert: src/lib/state/client/socket.svelte.ts:250 => delete
        const { deliver, open } = stubSocket();
        const client = createClientState();
        client.socket.seedConfig(payload(1), 2);
        client.socket.connect(['config']);
        open();
        expect(client.entities.config()?.config).toEqual({ writes: { timeout_seconds: 1 } });

        // The hub replays what it held when the page subscribed: the read from before the change.
        deliver('config', 2, payload(30));
        expect(client.entities.config()?.config).toEqual({ writes: { timeout_seconds: 1 } });

        // The watcher's next push is newer than the page's read, and is taken.
        deliver('config', 3, payload(5));
        expect(client.entities.config()?.config).toEqual({ writes: { timeout_seconds: 5 } });
        client.socket.disconnect();
    });

    it('takes the held push when the seed says it is the same configuration', () => {
        // revert: src/lib/state/client/socket.svelte.ts:250 => if (message.channel === 'config' && message.version <= seededThrough + 1) return;
        const { deliver, open } = stubSocket();
        const client = createClientState();
        client.socket.seedConfig(undefined, 0);
        client.socket.connect(['config']);
        open();
        deliver('config', 1, { ...payload(1), findings: [{ file: 'f', key: 'k', message: 'm' }] });
        expect(client.entities.config()?.findings).toHaveLength(1);
        client.socket.disconnect();
    });

    it('takes every push after a reconnect, which may reach a restarted server numbering from 1', () => {
        // revert: src/lib/state/client/socket.svelte.ts:159 => delete
        // revert: src/lib/state/client/socket.svelte.ts:160 => delete
        const { deliver, open } = stubSocket();
        const client = createClientState();
        client.socket.seedConfig(payload(1), 4);
        client.socket.connect(['config']);
        open();
        // The socket drops and opens again, on a server whose hub starts its versions at 1.
        open();
        deliver('config', 1, payload(5));
        expect(client.entities.config()?.config).toEqual({ writes: { timeout_seconds: 5 } });
        client.socket.disconnect();
    });
});
