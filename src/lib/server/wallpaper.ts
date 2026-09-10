// Layer 2, server. The one image the page paints behind the panels: which file it is, and the
// response that carries it. routes/api/wallpaper/+server.ts is the endpoint and holds nothing but
// the GET, since a route module may export only its verbs.
//
// The image is served rather than inlined: the picture is megabytes, the document is not, and a
// browser caches a URL. Nothing outside the configured directory is ever served, which is
// DESIGN.md's "Auth" applied to the one route that reads a file the config names: the directory is
// resolved under the hub and refused if it is not inside it, the chosen file is resolved and refused
// if it is not inside the directory, and a `file:` that names a path rather than a name is refused
// outright. The request is checked against `Origin` and `Sec-Fetch-Site` first, since any page open
// in the browser can address localhost.

import { createReadStream, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { engineDir, loadConfig, loadLocal } from '../data/sources/config.ts';
import { allowedOrigin } from './socket.ts';

/** Where the images sit when config/appearance.yml names no `dir`, relative to the hub. */
export const DEFAULT_DIR = join('tools', 'cockpit', 'assets', 'wallpaper');

/** The extensions the folder is filtered to, and the type each one is served as. */
const TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

/** An hour: long enough that a reload does not re-read the file, short enough to swap a picture. */
const CACHE = 'private, max-age=3600';

/** What serving needs of the configuration; a test passes its own rather than reading the config. */
export type Wallpaper = {
    /** The absolute directory the images are read from. */
    dir: string;
    /** Full name or any part of one, naming the image to use. Empty leaves it to `pick`. */
    file?: string;
    /** `first` is the first by name; `random` is one image per server process. */
    pick?: string;
};

/** The image files of a directory, by name, dotfiles and every other extension left out. */
export function images(dir: string): string[] {
    let names: string[];
    try {
        names = readdirSync(dir);
    } catch {
        return [];
    }
    return names
        .filter((name) => !name.startsWith('.') && extname(name).toLowerCase() in TYPES)
        .sort();
}

/** Whether `path` is the directory itself or something under it, as a resolved path. */
function inside(path: string, dir: string): boolean {
    const root = resolve(dir);
    const full = resolve(path);
    return full === root || full.startsWith(root + sep);
}

/** One image chosen per server process, so `pick: random` does not change under a reload. */
const chosen: Record<string, string> = {};

/**
 * The file name the settings name, or null when the directory holds no image. `file` matches a full
 * name first and then any name that contains it, which is what makes a fragment enough. A `file`
 * carrying a path separator or `..` names no file here and is refused rather than falling back: it
 * is an attempt to leave the directory, not a fragment that failed to match.
 */
export function choose(settings: Wallpaper): string | null {
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
    if ((settings.pick ?? 'first').toLowerCase() === 'random') {
        const key = resolve(settings.dir);
        const held = chosen[key];
        if (held === undefined || !found.includes(held)) {
            chosen[key] = found[Math.floor(Math.random() * found.length)];
        }
        return chosen[key];
    }
    return found[0];
}

/** A request from another origin is refused; a request that names none is the command line's. */
export function sameOrigin(headers: Headers): boolean {
    const site = headers.get('sec-fetch-site');
    if (site !== null && site !== 'same-origin' && site !== 'none') return false;
    const origin = headers.get('origin');
    if (origin === null || origin === '') return true;
    return allowedOrigin(origin);
}

/**
 * The image, its type and its cache header, streamed from disk. 404 covers every way there is no
 * image to send: no directory, no image in it, a name that leaves the directory, a file that has
 * gone since the listing. 403 covers a request from another origin.
 */
export function serve(settings: Wallpaper | null, headers: Headers): Response {
    if (!sameOrigin(headers)) return new Response(null, { status: 403 });
    if (settings === null) return new Response(null, { status: 404 });
    const name = choose(settings);
    if (name === null) return new Response(null, { status: 404 });
    const path = join(settings.dir, name);
    if (!inside(path, settings.dir)) return new Response(null, { status: 404 });
    try {
        if (!statSync(path).isFile()) return new Response(null, { status: 404 });
    } catch {
        return new Response(null, { status: 404 });
    }
    // The bytes are streamed: a wallpaper is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new Response(body, {
        status: 200,
        headers: {
            'content-type': TYPES[extname(name).toLowerCase()],
            'cache-control': CACHE
        }
    });
}

/** Directories already refused, so the reason is said once rather than once per request. */
const refused = new Set<string>();

/**
 * The configured wallpaper, or null when there is nothing to serve. The config is read per request
 * as everything else in this release is, so an edit shows on a reload; O6's watcher takes it over.
 * A `dir` that resolves outside the hub is refused with a line on stderr and serves nothing.
 */
export function settings(): Wallpaper | null {
    const engine = engineDir();
    const { config } = loadConfig(engine);
    const raw = config.wallpaper;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const held = raw as Record<string, unknown>;
    const hub = loadLocal(engine).hub;
    const named = typeof held.dir === 'string' && held.dir !== '' ? held.dir : DEFAULT_DIR;
    const dir = resolve(hub, named);
    if (!inside(dir, hub)) {
        if (!refused.has(dir)) {
            refused.add(dir);
            console.error(`wallpaper: ${dir} is outside the hub ${hub}; serving no image`);
        }
        return null;
    }
    return {
        dir,
        file: typeof held.file === 'string' ? held.file : undefined,
        pick: typeof held.pick === 'string' ? held.pick : undefined
    };
}
