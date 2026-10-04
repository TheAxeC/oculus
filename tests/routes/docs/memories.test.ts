// Layer 2, route tests. What the /api/memories route serves and accepts: the picture list, one
// picture streamed, and one added. The route itself hands the request to
// lib/server/content/memories.ts, which is what this reads.
//
// Nothing here reads the engine's own assets/memories folder or machine-local config: every case
// builds its own directory under the system temporary directory and asserts each write stays inside
// it, so no case can write into the checkout. This does not cover the browser drawing the wall.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    add,
    folder,
    isPicture,
    listing,
    MAX_UPLOAD_BYTES,
    memoriesMemory,
    serve,
    upload,
    write
} from '../../../src/lib/server/content/memories.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { pagePost } from '../../fixtures/doubles.ts';

const TOKEN = mintToken();

/**
 * A directory holding the named files inside the system temporary directory: each one byte, or the
 * bytes `held` names for it.
 */
function pictures(names: string[], held: Record<string, Uint8Array> = {}): string {
    const dir = scratchDir('oculus-memories-');
    for (const name of names) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, held[name] ?? 'x');
    }
    return dir;
}

/** One POST of the wall's own page, carrying the process token. */
function request(body: unknown, token = TOKEN): Request {
    return pagePost('http://127.0.0.1:8790/api/memories', body, token);
}

const NAMES = ['b-second.png', 'a-first.jpg', 'c-third.webp', 'notes.txt', '.hidden.jpg'];

/** One pixel of JPEG, as base64: the smallest file that really starts with the JPEG marks. */
const JPEG =
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

/** Plain text, as base64, which is what a file that is not a picture at all looks like. */
const TEXT = Buffer.from('this is not a picture', 'utf8').toString('base64');

/** One pixel of PNG, as base64, which is what an upload carries. */
const PIXEL =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * The first bytes of a PNG as far as its IHDR chunk's width and height, which is all its size
 * needs.
 */
function pngHead(width: number, height: number): Uint8Array {
    const bytes = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
    bytes.writeUInt32BE(13, 8);
    bytes.write('IHDR', 12, 'ascii');
    bytes.writeUInt32BE(width, 16);
    bytes.writeUInt32BE(height, 20);
    return bytes;
}

describe('the picture list', () => {
    it('answers the picture extensions in name order, each with its size, and nothing else', async () => {
        const dir = pictures(NAMES, {
            'a-first.jpg': Buffer.from(JPEG, 'base64'),
            'b-second.png': pngHead(777, 1200)
        });
        const response = listing(dir);
        expect(response.status).toBe(200);
        // The WebP is one byte, so its header gives no size and its record says so.
        expect(await response.json()).toEqual({
            images: [
                { name: 'a-first.jpg', width: 1, height: 1 },
                { name: 'b-second.png', width: 777, height: 1200 },
                { name: 'c-third.webp', width: null, height: null }
            ]
        });
    });

    it('answers an empty list for a folder that is not configured', async () => {
        expect(await listing(null).json()).toEqual({ images: [] });
    });
});

describe('one picture served', () => {
    it('streams the named file with its own type and a private cache header', async () => {
        const response = serve(pictures(NAMES), 'a-first.jpg');
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
        expect(await response.text()).toBe('x');
    });

    it.each([
        ['a name that leaves the folder', '../a-first.jpg'],
        ['a name with a separator', 'sub/a-first.jpg'],
        ['an absolute path', '/etc/hosts'],
        ['a hidden file', '.hidden.jpg'],
        ['a name that is not a picture', 'notes.txt'],
        ['a name that is not there', 'nothing.png']
    ])('answers 404 for %s', (_row, name) => {
        expect(serve(pictures(NAMES), name).status).toBe(404);
    });

    it('answers 404 when no folder is configured', () => {
        expect(serve(null, 'a-first.jpg').status).toBe(404);
    });
});

describe('the body of an upload', () => {
    it('is a name and its data, and every other key is dropped', () => {
        expect(upload({ name: 'a.png', data: PIXEL })).toEqual({ name: 'a.png', data: PIXEL });
        expect(upload({ name: 'a', data: 'b', x: 1 })).toStrictEqual({ name: 'a', data: 'b' });
    });

    it.each([
        ['no data', { name: 'a.png' }],
        ['no name', { data: PIXEL }],
        ['a bare string', 'a.png'],
        ['a name that is not text', { name: 3, data: 'b' }]
    ])('is none for %s', (_row, body) => {
        expect(upload(body)).toBeNull();
    });
});

describe('one picture added', () => {
    it('writes the file under the folder and nowhere else', () => {
        const dir = pictures([]);
        expect(write(dir, { name: 'added.png', data: PIXEL })).toEqual({ written: 'added.png' });
        const full = join(dir, 'added.png');
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        expect(readFileSync(full).byteLength).toBeGreaterThan(0);
        expect(existsSync(join(dir, 'added.png'))).toBe(true);
    });

    it('takes the data: prefix a browser FileReader writes', () => {
        const dir = pictures([]);
        expect(
            write(dir, { name: 'prefixed.png', data: `data:image/png;base64,${PIXEL}` })
        ).toEqual({ written: 'prefixed.png' });
        expect(existsSync(join(dir, 'prefixed.png'))).toBe(true);
    });

    it('reduces a name that carries a path to its own last segment', () => {
        const dir = pictures([]);
        const above = resolve(dir, '..', 'escaped.png');
        expect(write(dir, { name: '../escaped.png', data: PIXEL })).toEqual({
            written: 'escaped.png'
        });
        expect(existsSync(join(dir, 'escaped.png'))).toBe(true);
        expect(existsSync(above)).toBe(false);
    });

    it('refuses an extension the wall does not write, and writes nothing', () => {
        const dir = pictures([]);
        for (const name of ['notes.txt', 'picture.webp', 'picture', '.hidden.png']) {
            expect(write(dir, { name, data: PIXEL })).toEqual({ error: 'name' });
        }
        expect(existsSync(join(dir, 'notes.txt'))).toBe(false);
        expect(existsSync(join(dir, 'picture.webp'))).toBe(false);
    });

    it.each([
        ['text under a PNG name', 'fake.png', TEXT],
        ['text under a JPEG name', 'x.jpg', TEXT],
        ['a PNG under a JPEG name', 'mislabelled.jpg', PIXEL],
        ['a JPEG under a PNG name', 'mislabelled.png', JPEG],
        [
            'a picture larger than the wall takes',
            'large.png',
            Buffer.concat([Buffer.from(PIXEL, 'base64'), Buffer.alloc(MAX_UPLOAD_BYTES)]).toString(
                'base64'
            )
        ],
        ['an empty body of data', 'empty.png', '']
    ])('refuses %s, and writes nothing', (_row, name, data) => {
        const dir = pictures([]);
        expect(write(dir, { name, data })).toEqual({ error: 'data' });
        expect(existsSync(join(dir, name))).toBe(false);
    });

    it('refuses a name already on the wall, and leaves that picture as it was', () => {
        const dir = pictures([]);
        expect(write(dir, { name: 'same.png', data: PIXEL })).toEqual({ written: 'same.png' });
        const first = readFileSync(join(dir, 'same.png'));
        const second = Buffer.concat([Buffer.from(PIXEL, 'base64'), Buffer.from('tail', 'utf8')]);
        expect(write(dir, { name: 'same.png', data: second.toString('base64') })).toEqual({
            error: 'taken'
        });
        expect(readFileSync(join(dir, 'same.png')).equals(first)).toBe(true);
    });
});

describe('the endpoint of an upload', () => {
    it('writes the picture and says which name it wrote', async () => {
        const dir = pictures([]);
        const response = await add(dir, request({ name: 'one.png', data: PIXEL }), TOKEN);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, written: 'one.png' });
        expect(existsSync(join(dir, 'one.png'))).toBe(true);
    });

    it('refuses a request without the token, and writes nothing', async () => {
        const dir = pictures([]);
        const response = await add(dir, request({ name: 'one.png', data: PIXEL }, 'stale'), TOKEN);
        expect(response.status).toBe(403);
        expect(existsSync(join(dir, 'one.png'))).toBe(false);
    });

    it('refuses a body that is not a picture, and one with no folder to write into', async () => {
        const dir = pictures([]);
        expect((await add(dir, request({ name: 'one.png' }), TOKEN)).status).toBe(400);
        expect((await add(null, request({ name: 'one.png', data: PIXEL }), TOKEN)).status).toBe(
            404
        );
    });
});

describe('the first bytes against the extension', () => {
    const png = Buffer.from(PIXEL, 'base64');
    const jpeg = Buffer.from(JPEG, 'base64');

    it.each([
        ['takes a PNG under .png', 'a.png', png, true],
        ['takes a JPEG under .jpg', 'a.jpg', jpeg, true],
        ['takes a JPEG under .jpeg', 'a.jpeg', jpeg, true],
        ['refuses a JPEG under .png', 'a.png', jpeg, false],
        ['refuses a PNG under .jpg', 'a.jpg', png, false],
        ['refuses a PNG under .webp, which has no marks', 'a.webp', png, false],
        [
            'refuses two bytes under .png, which is too short',
            'a.png',
            Buffer.from([0x89, 0x50]),
            false
        ],
        ['refuses no bytes under .png', 'a.png', Buffer.alloc(0), false]
    ])('%s', (_row, name, bytes, taken) => {
        expect(isPicture(name, bytes)).toBe(taken);
    });
});

describe('the configured folder', () => {
    /**
     * An engine directory of this case's own: its config folder, its appearance and its local.yml.
     */
    function fixture(body: string): { engine: string; hub: string } {
        const root = scratchDir('oculus-memories-config-');
        const engine = join(root, 'engine');
        const hub = join(root, 'hub');
        mkdirSync(join(engine, 'config'), { recursive: true });
        mkdirSync(hub, { recursive: true });
        writeFileSync(join(engine, 'config', 'appearance.yml'), body);
        writeFileSync(join(engine, 'config', 'local.yml'), `hub: ${JSON.stringify(hub)}\n`);
        return { engine, hub };
    }

    it('resolves the configured directory under the hub', () => {
        const own = fixture('memories:\n  dir: pictures\n');
        expect(folder(memoriesMemory(), loadConfig(own.engine).config, own.engine)).toBe(
            join(own.hub, 'pictures')
        );
    });

    it('is null when the key is absent, and when the directory leaves the hub', () => {
        const absent = fixture('themes: []\n');
        expect(
            folder(memoriesMemory(), loadConfig(absent.engine).config, absent.engine)
        ).toBeNull();
        const outside = fixture('memories:\n  dir: ../elsewhere\n');
        expect(
            folder(memoriesMemory(), loadConfig(outside.engine).config, outside.engine)
        ).toBeNull();
    });
});
