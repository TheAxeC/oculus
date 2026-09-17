// What the /api/memories route serves and accepts: the picture list, one picture streamed, and one
// added. The route itself hands the request to lib/server/memories.ts, which is what this reads.
//
// Nothing here reads the engine's own assets/memories folder or machine-local config: every case
// builds its own directory under the system temporary directory and asserts each write stays inside
// it, so no case can write into the checkout. This does not cover the browser drawing the wall.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { mintToken } from '../../src/lib/server/auth.ts';
import {
    add,
    BODY_LIMIT_BYTES,
    folder,
    isPicture,
    listing,
    MAX_UPLOAD_BYTES,
    memoriesMemory,
    serve,
    upload,
    write
} from '../../src/lib/server/memories.ts';

const TOKEN = mintToken();

/** Every directory this file made, taken away when the file's cases are done. */
const made: string[] = [];

afterAll(() => {
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
    made.length = 0;
});

/** A directory of this file's own inside the system temporary directory, remembered for removal. */
function scratch(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}

/**
 * A directory holding the named files inside the system temporary directory: each one byte, or the
 * bytes `held` names for it.
 */
function pictures(names: string[], held: Record<string, Uint8Array> = {}): string {
    const dir = scratch('oculus-memories-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const name of names) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, held[name] ?? 'x');
    }
    return dir;
}

/** The headers a page of the app itself sends. */
function local(): Headers {
    return new Headers({ origin: 'http://127.0.0.1:8790', 'sec-fetch-site': 'same-origin' });
}

/** One POST of the wall's own page, carrying the process token. */
function request(body: unknown, token = TOKEN): Request {
    return new Request('http://127.0.0.1:8790/api/memories', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
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

/** The first bytes of a PNG as far as its IHDR chunk's width and height, which is all its size needs. */
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
        const response = listing(dir, local());
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
        expect(await listing(null, local()).json()).toEqual({ images: [] });
    });

    it('answers 403 to another origin', () => {
        expect(
            listing(pictures(NAMES), new Headers({ origin: 'http://evil.invalid' })).status
        ).toBe(403);
    });
});

describe('one picture served', () => {
    it('streams the named file with its own type and a private cache header', async () => {
        const response = serve(pictures(NAMES), 'a-first.jpg', local());
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
        expect(await response.text()).toBe('x');
    });

    it('refuses a name that carries a separator or leaves the folder', () => {
        const dir = pictures(NAMES);
        expect(serve(dir, '../a-first.jpg', local()).status).toBe(404);
        expect(serve(dir, 'sub/a-first.jpg', local()).status).toBe(404);
        expect(serve(dir, '/etc/hosts', local()).status).toBe(404);
        expect(serve(dir, '.hidden.jpg', local()).status).toBe(404);
    });

    it('refuses a name that is not a picture and one that is not there', () => {
        const dir = pictures(NAMES);
        expect(serve(dir, 'notes.txt', local()).status).toBe(404);
        expect(serve(dir, 'nothing.png', local()).status).toBe(404);
        expect(serve(null, 'a-first.jpg', local()).status).toBe(404);
    });

    it('answers 403 to another origin', () => {
        const foreign = new Headers({ 'sec-fetch-site': 'cross-site' });
        expect(serve(pictures(NAMES), 'a-first.jpg', foreign).status).toBe(403);
    });
});

describe('the body of an upload', () => {
    it('is a name and its data, and nothing else is one', () => {
        expect(upload({ name: 'a.png', data: PIXEL })).toEqual({ name: 'a.png', data: PIXEL });
        expect(upload({ name: 'a.png' })).toBeNull();
        expect(upload({ data: PIXEL })).toBeNull();
        expect(upload('a.png')).toBeNull();
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

    it('writes a real PNG and a real JPEG under their own extensions', () => {
        const dir = pictures([]);
        expect(write(dir, { name: 'one.png', data: PIXEL })).toEqual({ written: 'one.png' });
        expect(write(dir, { name: 'two.jpg', data: JPEG })).toEqual({ written: 'two.jpg' });
        expect(write(dir, { name: 'three.jpeg', data: JPEG })).toEqual({ written: 'three.jpeg' });
    });

    it('refuses bytes that are not the format the extension names, and writes nothing', () => {
        const dir = pictures([]);
        // Plain text and a script under a picture's name are what the extension alone would let in.
        expect(write(dir, { name: 'fake.png', data: TEXT })).toEqual({ error: 'data' });
        expect(write(dir, { name: 'x.jpg', data: TEXT })).toEqual({ error: 'data' });
        // A real PNG under a JPEG's name is refused too: the bytes and the name must agree.
        expect(write(dir, { name: 'mislabelled.jpg', data: PIXEL })).toEqual({ error: 'data' });
        expect(write(dir, { name: 'mislabelled.png', data: JPEG })).toEqual({ error: 'data' });
        for (const name of ['fake.png', 'x.jpg', 'mislabelled.jpg', 'mislabelled.png']) {
            expect(existsSync(join(dir, name))).toBe(false);
        }
    });

    it('refuses a picture larger than the wall takes, and writes nothing', () => {
        const dir = pictures([]);
        // A real PNG header followed by enough bytes to pass the limit.
        const header = Buffer.from(PIXEL, 'base64');
        const large = Buffer.concat([header, Buffer.alloc(MAX_UPLOAD_BYTES)]);
        expect(large.byteLength).toBeGreaterThan(MAX_UPLOAD_BYTES);
        expect(write(dir, { name: 'large.png', data: large.toString('base64') })).toEqual({
            error: 'data'
        });
        expect(existsSync(join(dir, 'large.png'))).toBe(false);
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

    it('refuses an empty body of data', () => {
        const dir = pictures([]);
        expect(write(dir, { name: 'empty.png', data: '' })).toEqual({ error: 'data' });
        expect(existsSync(join(dir, 'empty.png'))).toBe(false);
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

    it('refuses a request from another origin, and writes nothing', async () => {
        const dir = pictures([]);
        const foreign = new Request('http://127.0.0.1:8790/api/memories', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'sec-fetch-site': 'cross-site',
                'x-oculus-token': TOKEN
            },
            body: JSON.stringify({ name: 'one.png', data: PIXEL })
        });
        expect((await add(dir, foreign, TOKEN)).status).toBe(403);
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
    it('takes a PNG only under .png and a JPEG only under .jpg or .jpeg', () => {
        const png = Buffer.from(PIXEL, 'base64');
        const jpeg = Buffer.from(JPEG, 'base64');
        expect(isPicture('a.png', png)).toBe(true);
        expect(isPicture('a.jpg', jpeg)).toBe(true);
        expect(isPicture('a.jpeg', jpeg)).toBe(true);
        expect(isPicture('a.png', jpeg)).toBe(false);
        expect(isPicture('a.jpg', png)).toBe(false);
    });

    it('takes nothing under an extension it has no marks for, and nothing too short', () => {
        expect(isPicture('a.webp', Buffer.from(PIXEL, 'base64'))).toBe(false);
        expect(isPicture('a.png', Buffer.from([0x89, 0x50]))).toBe(false);
        expect(isPicture('a.png', Buffer.alloc(0))).toBe(false);
    });
});

describe('the request the server accepts', () => {
    it('leaves room for the picture base64-encoded inside its JSON wrapper', () => {
        expect(BODY_LIMIT_BYTES).toBeGreaterThan(Math.ceil((MAX_UPLOAD_BYTES * 4) / 3));
    });

    it('is told to the built handler before the handler is loaded', () => {
        // The adapter reads its limit once, when its module is evaluated, so the assignment has to
        // come before the dynamic import; a static import of the handler would hoist past it.
        const source = readFileSync('src/server.ts', 'utf8');
        const set = source.indexOf('process.env.BODY_SIZE_LIMIT = String(BODY_LIMIT_BYTES)');
        const loaded = source.indexOf('await import(');
        expect(set).toBeGreaterThan(-1);
        expect(loaded).toBeGreaterThan(set);
        expect(source).not.toMatch(/^import .*build\/handler/m);
    });
});

describe('the configured folder', () => {
    /** An engine directory of this case's own: its config folder, its appearance and its local.yml. */
    function fixture(body: string): { engine: string; hub: string } {
        const root = scratch('oculus-memories-config-');
        expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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
        expect(folder(memoriesMemory(), own.engine)).toBe(join(own.hub, 'pictures'));
    });

    it('is null when the key is absent, and when the directory leaves the hub', () => {
        const absent = fixture('themes: []\n');
        expect(folder(memoriesMemory(), absent.engine)).toBeNull();
        const outside = fixture('memories:\n  dir: ../elsewhere\n');
        expect(folder(memoriesMemory(), outside.engine)).toBeNull();
    });
});
