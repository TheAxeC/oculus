// What the /api/wallpaper route serves: the one image behind the panels, over a temporary directory
// of its own. The route itself is a single line handing the request to
// lib/server/content/wallpaper.ts, which is what this reads.
//
// Nothing here reads the real wallpaper folder or machine-local config: every case builds its own
// files under the system temporary directory and asserts each write stays inside it. This does not
// cover the browser painting the image.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    choose,
    images,
    serve,
    settings,
    wallpaperMemory
} from '../../../src/lib/server/content/wallpaper.ts';
import { loadConfig } from '../../../src/lib/data/sources/config.ts';
import { noop } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A directory holding the named files, each one byte, inside the system temporary directory. */
function folder(names: string[]): string {
    const dir = scratchDir('oculus-wallpaper-');
    mkdirSync(dir, { recursive: true });
    for (const name of names) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, 'x');
    }
    return dir;
}

const PICTURES = ['a-first.jpg', 'b-second.png', 'c-third.webp', 'notes.txt', '.hidden.jpg'];

const memory = wallpaperMemory();

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
        expect(choose({ dir: folder(PICTURES), pick: 'first' }, memory)).toBe('a-first.jpg');
    });

    it('takes the file whose name holds the fragment', () => {
        expect(choose({ dir: folder(PICTURES), file: 'second', pick: 'first' }, memory)).toBe(
            'b-second.png'
        );
    });

    it('falls back to the first for a fragment no name holds', () => {
        expect(
            choose({ dir: folder(PICTURES), file: 'nothing-like-it', pick: 'first' }, memory)
        ).toBe('a-first.jpg');
    });

    it('refuses a file that names a path rather than a name', () => {
        const dir = folder(PICTURES);
        expect(choose({ dir, file: '../a-first.jpg', pick: 'first' }, memory)).toBe(null);
        expect(choose({ dir, file: '/etc/hosts', pick: 'first' }, memory)).toBe(null);
    });

    it('keeps one random image for the life of the process', () => {
        const dir = folder(PICTURES);
        const first = choose({ dir, pick: 'random' }, memory);
        expect(first).not.toBe(null);
        for (let i = 0; i < 20; i += 1) expect(choose({ dir, pick: 'random' }, memory)).toBe(first);
    });

    it('has nothing to choose in an empty folder', () => {
        expect(choose({ dir: folder([]), pick: 'first' }, memory)).toBe(null);
    });
});

describe('the response', () => {
    it('serves the chosen image with its own type and a private cache header', async () => {
        const response = serve({ dir: folder(PICTURES), pick: 'first' }, memory);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
        expect(await response.text()).toBe('x');
    });

    it('names the type by the extension', () => {
        const dir = folder(PICTURES);
        const type = (file: string): string | null =>
            serve({ dir, file, pick: 'first' }, memory).headers.get('content-type');
        expect(type('b-second')).toBe('image/png');
        expect(type('c-third')).toBe('image/webp');
    });

    it('answers 404 with no image, no folder and no configuration', () => {
        expect(serve({ dir: folder(['notes.txt']), pick: 'first' }, memory).status).toBe(404);
        expect(serve({ dir: join(folder([]), 'nothing'), pick: 'first' }, memory).status).toBe(404);
        expect(serve(null, memory).status).toBe(404);
    });

    it('answers 404 to a file that would leave the folder', () => {
        expect(
            serve({ dir: folder(PICTURES), file: '../a-first.jpg', pick: 'first' }, memory).status
        ).toBe(404);
    });
});

describe('the configured settings', () => {
    /**
     * An engine directory of this case's own: its config folder, its appearance and its local.yml.
     */
    function fixture(body: string): { engine: string; hub: string } {
        const root = scratchDir('oculus-wallpaper-config-');
        const engine = join(root, 'engine');
        const hub = join(root, 'hub');
        const config = join(engine, 'config');
        mkdirSync(config, { recursive: true });
        mkdirSync(hub, { recursive: true });
        writeFileSync(join(config, 'appearance.yml'), body);
        writeFileSync(join(config, 'local.yml'), `hub: ${JSON.stringify(hub)}\n`);
        return { engine, hub };
    }

    it('reads the configured directory under the hub of the engine it is given', () => {
        const own = fixture('wallpaper:\n  dir: pictures\n  pick: first\n');
        expect(settings(wallpaperMemory(), loadConfig(own.engine).config, own.engine)).toEqual({
            dir: join(own.hub, 'pictures'),
            file: undefined,
            pick: 'first'
        });
    });

    it('returns null when dir is absent', () => {
        const own = fixture('wallpaper:\n  pick: first\n');
        expect(settings(wallpaperMemory(), loadConfig(own.engine).config, own.engine)).toBeNull();
    });

    it('reports a missing or unknown pick once and returns null', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(noop);
        try {
            const missing = fixture('wallpaper:\n  dir: pictures\n');
            const missingMemory = wallpaperMemory();
            expect(
                settings(missingMemory, loadConfig(missing.engine).config, missing.engine)
            ).toBeNull();
            expect(
                settings(missingMemory, loadConfig(missing.engine).config, missing.engine)
            ).toBeNull();
            const unknown = fixture('wallpaper:\n  dir: pictures\n  pick: newest\n');
            const unknownMemory = wallpaperMemory();
            expect(
                settings(unknownMemory, loadConfig(unknown.engine).config, unknown.engine)
            ).toBeNull();
            expect(
                settings(unknownMemory, loadConfig(unknown.engine).config, unknown.engine)
            ).toBeNull();
            expect(error).toHaveBeenCalledTimes(2);
        } finally {
            error.mockRestore();
        }
    });
});
