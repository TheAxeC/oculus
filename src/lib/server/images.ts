// Layer 2, server. The rules every route that serves a picture out of a configured folder obeys:
// which extensions are pictures, what each is sent as, how long a browser may hold one, whether a
// path is inside its folder, whether the request came from this application's page, and the
// response that streams one file.
//
// It is one module rather than a copy per route because the rules are the security of those routes:
// the folder is resolved under the hub and refused if it is not inside it, the chosen file is
// resolved and refused if it is not inside the folder, and a name that carries a path rather than a
// file name is refused outright. A second copy of that would be a second place for one of the four
// to go missing. server/wallpaper.ts and server/memories.ts are the two readers.

import { createReadStream, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { byKey } from '../data/guards.ts';
import { loadConfig, loadLocal } from '../data/sources/config.ts';
import { allowedOrigin } from './auth.ts';

/** The extensions a picture folder is filtered to, and the type each one is served as. */
const TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

/** An hour: long enough that a reload does not re-read the file, short enough to swap a picture. */
const CACHE = 'private, max-age=3600';

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
export function inside(path: string, dir: string): boolean {
    const root = resolve(dir);
    const full = resolve(path);
    return full === root || full.startsWith(root + sep);
}

/** Whether a name is one file of a folder rather than a path reaching out of it. */
export function isName(name: string): boolean {
    if (name === '' || name.startsWith('.')) return false;
    return !name.includes('/') && !name.includes('\\') && !name.includes('..');
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
 * One picture of a folder, its type and its cache header, streamed from disk. 404 covers every way
 * there is no image to send: no name, a name that leaves the folder, an extension that is not a
 * picture, a file that has gone since the listing. The caller has already answered the origin.
 */
export function stream(dir: string, name: string | null): Response {
    if (name === null || !isName(name)) return new Response(null, { status: 404 });
    const type = byKey(TYPES, extname(name).toLowerCase());
    if (type === undefined) return new Response(null, { status: 404 });
    const path = join(dir, name);
    if (!inside(path, dir)) return new Response(null, { status: 404 });
    try {
        if (!statSync(path).isFile()) return new Response(null, { status: 404 });
    } catch {
        return new Response(null, { status: 404 });
    }
    // The bytes are streamed: a picture is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new Response(body, {
        status: 200,
        headers: { 'content-type': type, 'cache-control': CACHE }
    });
}

/**
 * The absolute directory a config block's `dir` names, resolved under the hub, and null when the
 * block names none or names one outside the hub. `refused` is the caller's memory of the
 * directories already reported, so a bad setting is said once rather than once per request.
 */
export function folderOf(
    block: unknown,
    engine: string,
    refused: Set<string>,
    label: string
): string | null {
    if (typeof block !== 'object' || block === null || Array.isArray(block)) return null;
    const held = block as Record<string, unknown>;
    if (typeof held.dir !== 'string' || held.dir === '') return null;
    const hub = loadLocal(engine).hub;
    const dir = resolve(hub, held.dir);
    if (!inside(dir, hub)) {
        const key = `directory:${dir}`;
        if (!refused.has(key)) {
            refused.add(key);
            console.error(`${label}: ${dir} is outside the hub ${hub}; serving no image`);
        }
        return null;
    }
    return dir;
}

/** The merged configuration of one engine directory, read per request so an edit shows on reload. */
export function configOf(engine: string): Record<string, unknown> {
    return loadConfig(engine).config;
}
