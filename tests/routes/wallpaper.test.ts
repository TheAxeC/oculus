// What the /api/wallpaper route serves: the one image behind the panels, over a temporary directory
// of its own. The route itself is a single line handing the request to lib/server/wallpaper.ts,
// which is what this reads.
//
// Nothing here reads the real wallpaper folder or the real config: every case builds its own files
// under the system temporary directory and asserts the path it is about to write is inside it. What
// this does NOT cover: the browser painting the image, and settings() reading config/appearance.yml,
// which is exercised by the curl in the package's verification and not from a test that would have
// to depend on the machine's own local.yml.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DIR, choose, images, serve } from '../../src/lib/server/wallpaper.ts';

/** A directory holding the named files, each one byte, inside the system temporary directory. */
function folder(names: string[]): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-wallpaper-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(dir, { recursive: true });
    for (const name of names) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, 'x');
    }
    return dir;
}

/** The headers a page of the app itself sends. */
function local(): Headers {
    return new Headers({ origin: 'http://127.0.0.1:8790', 'sec-fetch-site': 'same-origin' });
}

const PICTURES = ['a-first.jpg', 'b-second.png', 'c-third.webp', 'notes.txt', '.hidden.jpg'];

describe('the images of a folder', () => {
    it('keeps the four picture extensions, by name, and drops everything else', () => {
        expect(images(folder(PICTURES))).toEqual(['a-first.jpg', 'b-second.png', 'c-third.webp']);
    });

    it('is empty for a folder with no picture in it and for one that is not there', () => {
        expect(images(folder(['notes.txt']))).toEqual([]);
        expect(images(join(folder([]), 'nothing'))).toEqual([]);
    });
});

describe('choosing the image', () => {
    it('takes the first by name when nothing names one', () => {
        expect(choose({ dir: folder(PICTURES) })).toBe('a-first.jpg');
    });

    it('takes the file whose name holds the fragment', () => {
        expect(choose({ dir: folder(PICTURES), file: 'second' })).toBe('b-second.png');
    });

    it('falls back to the first for a fragment no name holds', () => {
        expect(choose({ dir: folder(PICTURES), file: 'nothing-like-it' })).toBe('a-first.jpg');
    });

    it('refuses a file that names a path rather than a name', () => {
        const dir = folder(PICTURES);
        expect(choose({ dir, file: '../a-first.jpg' })).toBe(null);
        expect(choose({ dir, file: '/etc/hosts' })).toBe(null);
    });

    it('keeps one random image for the life of the process', () => {
        const dir = folder(PICTURES);
        const first = choose({ dir, pick: 'random' });
        expect(first).not.toBe(null);
        for (let i = 0; i < 20; i += 1) expect(choose({ dir, pick: 'random' })).toBe(first);
    });

    it('has nothing to choose in an empty folder', () => {
        expect(choose({ dir: folder([]) })).toBe(null);
    });
});

describe('the response', () => {
    it('serves the chosen image with its own type and a private cache header', async () => {
        const response = serve({ dir: folder(PICTURES) }, local());
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
        expect(await response.text()).toBe('x');
    });

    it('names the type by the extension', () => {
        const dir = folder(PICTURES);
        const type = (file: string): string | null =>
            serve({ dir, file }, local()).headers.get('content-type');
        expect(type('b-second')).toBe('image/png');
        expect(type('c-third')).toBe('image/webp');
    });

    it('answers 404 with no image, no folder and no configuration', () => {
        expect(serve({ dir: folder(['notes.txt']) }, local()).status).toBe(404);
        expect(serve({ dir: join(folder([]), 'nothing') }, local()).status).toBe(404);
        expect(serve(null, local()).status).toBe(404);
    });

    it('answers 404 to a file that would leave the folder', () => {
        expect(serve({ dir: folder(PICTURES), file: '../a-first.jpg' }, local()).status).toBe(404);
    });

    it('answers 403 to another origin, and to a cross-site fetch that names none', () => {
        const dir = folder(PICTURES);
        const foreign = new Headers({ origin: 'http://evil.invalid' });
        expect(serve({ dir }, foreign).status).toBe(403);
        expect(serve({ dir }, new Headers({ 'sec-fetch-site': 'cross-site' })).status).toBe(403);
    });

    it('answers the command line, which sends neither header', () => {
        expect(serve({ dir: folder(PICTURES) }, new Headers()).status).toBe(200);
    });
});

describe('the default folder', () => {
    it('is the one the images sit in today, relative to the hub', () => {
        expect(DEFAULT_DIR).toBe(join('tools', 'cockpit', 'assets', 'wallpaper'));
    });
});
