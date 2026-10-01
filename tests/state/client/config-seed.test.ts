// Layer 4, test. The `config` pushes a page takes after its seed: the page's socket drops a push at
// or below the seed's version, which is the hub's replay of a read made before the config files
// changed, and after a reconnect it takes every push, since a restarted server numbers its pushes
// from the start again. Also what the socket makes of a frame: the frames and payloads it keeps and
// the ones it drops, and the map of strings it installs from a config key.
//
// Nothing here opens a socket: `WebSocket` is a stub that hands the page what a case delivers.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigPayload, Message } from '../../../src/lib/data/model/index.ts';
import { glyph, hasGlyph } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState } from '../../fixtures/client.ts';
import { stubSocket } from './socket-stub.ts';

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

describe("the page's config channel", () => {
    it('keeps the configuration it was built from over a replayed push that is not newer', () => {
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

/** The messages the page keeps of these frames, in the order it kept them. */
function kept(frames: string[]): Message[] {
    const { deliverText, open } = stubSocket();
    const client = createClientState();
    const seen: Message[] = [];
    client.entities.afterReceive((message) => seen.push(message));
    client.socket.connect(['config']);
    open();
    for (const frame of frames) deliverText(frame);
    client.socket.disconnect();
    return seen;
}

/** A frame as the server writes it, with `payload` as the text of its JSON. */
function frame(channel: string, payloadJson: string, version = '1'): string {
    return `{"channel":"${channel}","version":${version},"payload":${payloadJson}}`;
}

describe("the page's frames", () => {
    it('keeps a frame whose channel is a string, version a number and payload a map', () => {
        expect(kept([frame('other', '{}')])).toStrictEqual([
            { channel: 'other', version: 1, payload: {} }
        ]);
        expect(kept([frame('config', JSON.stringify(payload(1)))])).toHaveLength(1);
    });

    it.each([
        ['a list', '[]'],
        ['null', 'null'],
        ['a string', '"x"'],
        ['text that is not JSON', 'not json'],
        ['a channel that is a number', '{"channel":3,"version":1,"payload":{}}'],
        ['a version that is a string', frame('other', '{}', '"1"')],
        ['a payload that is a list', frame('other', '[]')],
        ['a payload that is null', frame('other', 'null')]
    ])('drops %s', (_name, text) => {
        expect(kept([text])).toStrictEqual([]);
    });

    it('keeps a version the JSON writes as infinity, as a number', () => {
        const [message] = kept([frame('other', '{}', '1e999')]);
        expect(message.version).toBe(Infinity);
    });

    it('keeps a payload whose top-level fields are the ones its channel declares', () => {
        const portfolio = '{"version":1,"entities":{},"relations":{},"findings":[]}';
        const sessions = '{"records":[],"workspaces":[]}';
        const files = '{"root":"","bookmarks":true}';
        expect(
            kept([
                frame('portfolio', portfolio),
                frame('sessions', sessions),
                frame('files', files)
            ])
        ).toHaveLength(3);
    });

    it.each([
        ['a portfolio without the fields a snapshot has', 'portfolio', '{"projects":{}}'],
        [
            'a portfolio whose findings are a map',
            'portfolio',
            '{"version":1,"entities":{},"relations":{},"findings":{}}'
        ],
        [
            'a sessions payload whose terminals are a string',
            'sessions',
            '{"records":[],"workspaces":[],"terminals":"x"}'
        ],
        ['a sessions payload without records', 'sessions', '{"terminals":"x"}'],
        ['a config payload with none of its fields', 'config', '{}'],
        ['a files payload whose root is a number', 'files', '{"root":3}'],
        ['a files payload whose bookmarks flag is a string', 'files', '{"root":"","bookmarks":"x"}']
    ])('drops %s', (_name, channel, body) => {
        expect(kept([frame(channel, body)])).toStrictEqual([]);
    });
});

describe('the strings a config key installs', () => {
    /** Install `glyphs` as the config key `glyphs` holds it, from a payload with nothing else. */
    function installed(glyphs: unknown): void {
        const client = createClientState();
        client.socket.installConfig({
            config: { glyphs },
            text: {},
            icons: {},
            host: HOST,
            findings: []
        });
    }

    it('keeps the string values and leaves out the others and an own __proto__ key', () => {
        installed(JSON.parse('{"a":"x","b":3,"__proto__":"y"}'));
        expect([hasGlyph('a'), hasGlyph('b'), hasGlyph('__proto__')]).toStrictEqual([
            true,
            false,
            false
        ]);
        expect(glyph('a')).toBe('x');
    });

    it('leaves a map under an own __proto__ key out and keeps the map itself plain', () => {
        installed(JSON.parse('{"__proto__":{"a":"x"},"b":"y"}'));
        expect([hasGlyph('b'), hasGlyph('a')]).toStrictEqual([true, false]);
        expect(() => glyph('a')).toThrow();
    });
});
