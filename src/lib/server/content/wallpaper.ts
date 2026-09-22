// Layer 2, server. The one image the page paints behind the panels: which file it is, and the
// response that carries it. routes/api/(docs)/wallpaper/+server.ts is the endpoint and holds
// nothing but the GET, since a route module may export only its verbs.
//
// The image is served rather than inlined: the picture is megabytes, the document is not, and a
// browser caches a URL. Which extensions are pictures, what is inside a folder, the same-origin
// check and the streamed response are server/content/images.ts's, shared with the Memories wall;
// what is here is the one thing this route has of its own, which is choosing a file when the reader
// named a fragment or asked for a random one.

import { resolve } from 'node:path';
import { byKey } from '../../data/helpers/guards.ts';
import { configOf, folderOf, images, sameOrigin, stream } from './images.ts';

export { images, sameOrigin } from './images.ts';

/** What serving needs of the configuration; a test passes its own rather than reading the config. */
export type Wallpaper = {
    /** The absolute directory the images are read from. */
    dir: string;
    /** Full name or any part of one, naming the image to use. Empty leaves it to `pick`. */
    file?: string;
    /** `first` is the first by name; `random` is one image per server process. */
    pick: 'first' | 'random';
};

/** What the owning server context remembers: the random pick per directory, and the directories refused once. */
export type WallpaperMemory = { chosen: Record<string, string>; refused: Set<string> };

export function wallpaperMemory(): WallpaperMemory {
    return { chosen: {}, refused: new Set() };
}

/**
 * The file name the settings name, or null when the directory holds no image. `file` matches a full
 * name first and then any name that contains it, which is what makes a fragment enough. A `file`
 * carrying a path separator or `..` names no file here and is refused rather than falling back: it
 * is an attempt to leave the directory, not a fragment that failed to match.
 */
export function choose(settings: Wallpaper, memory: WallpaperMemory): string | null {
    const found = images(settings.dir);
    if (found.length === 0) return null;
    const want = (settings.file ?? '').trim();
    if (want !== '') {
        if (want.includes('/') || want.includes('\\') || want.includes('..')) return null;
        const exact = found.find((name) => name === want);
        if (exact !== undefined) return exact;
        const part = found.find((name) => name.toLowerCase().includes(want.toLowerCase()));
        if (part !== undefined) return part;
        return found[0];
    }
    if (settings.pick === 'random') {
        const key = resolve(settings.dir);
        const held = byKey(memory.chosen, key);
        if (held === undefined || !found.includes(held)) {
            memory.chosen[key] = found[Math.floor(Math.random() * found.length)];
        }
        return memory.chosen[key];
    }
    return found[0];
}

/**
 * The image, its type and its cache header, streamed from disk. 404 covers every way there is no
 * image to send: no directory, no image in it, a name that leaves the directory, a file that has
 * gone since the listing. 403 covers a request from another origin.
 */
export function serve(
    settings: Wallpaper | null,
    headers: Headers,
    memory: WallpaperMemory
): Response {
    if (!sameOrigin(headers)) return new Response(null, { status: 403 });
    if (settings === null) return new Response(null, { status: 404 });
    return stream(settings.dir, choose(settings, memory));
}

/**
 * The configured wallpaper, or null when there is nothing to serve. The config is read per request
 * so an edit shows on reload. A missing `dir`, or one outside the hub, serves nothing.
 */
export function settings(memory: WallpaperMemory, engine: string): Wallpaper | null {
    const raw = configOf(engine).wallpaper;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const held = raw as Record<string, unknown>;
    if (typeof held.dir !== 'string' || held.dir === '') return null;
    if (held.pick !== 'first' && held.pick !== 'random') {
        const key = `pick:${String(held.pick)}`;
        if (!memory.refused.has(key)) {
            memory.refused.add(key);
            console.error(
                `wallpaper: pick must be first or random, not ${String(held.pick)}; serving no image`
            );
        }
        return null;
    }
    const dir = folderOf(raw, engine, memory.refused, 'wallpaper');
    if (dir === null) return null;
    return {
        dir,
        file: typeof held.file === 'string' ? held.file : undefined,
        pick: held.pick
    };
}
