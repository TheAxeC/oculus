// Layer 2, server. One local file, read from a directory the configuration names and streamed to the
// page. routes/api/file/[root]/[...path]/+server.ts is the endpoint and holds nothing but the GET,
// since a route module may export only its verbs.
//
// It is what DESIGN.md's decision of 2026-09-10 needs, "a local HTML file under a configured root
// opens as a tab": the manuals of cathedra and game-engine are single HTML files beside their own
// stylesheets and images, and a browser resolves `css/manual.css` against the document's own URL, so
// every asset the page asks for comes back through this same route without the file being rewritten.
//
// Nothing outside a root is ever served, which is DESIGN.md's "Auth" applied to a route that reads a
// path the request names. The root's directory and the resolved file are both put through realpath
// first, so a symbolic link pointing out of the root is refused rather than followed, and the file is
// then required to be the directory itself or something under it. The request is checked against
// `Origin` and `Sec-Fetch-Site` before any of that, since any page open in the browser can address
// localhost.

import { createReadStream, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { extname, isAbsolute, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { engineDir, loadConfig } from '../data/sources/config.ts';
import { sameOrigin } from './auth.ts';
import type { Finding } from '../data/model.ts';

/** One directory the server may serve files from: the key a URL names it by, and where it is. */
export type Root = { key: string; dir: string };

/** The extensions a manual and its assets are made of, and the type each one is served as. */
const TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.pdf': 'application/pdf'
};

/** Anything the map does not name is bytes: the browser is told nothing it cannot check. */
const FALLBACK = 'application/octet-stream';

/**
 * A minute. The file is the reader's own and changes under them, so it is re-read soon; it is
 * private because a manual is the machine's own document and no proxy has any business holding it.
 */
export const CACHE = 'private, max-age=60';

/** The type a name is served as, by its extension. */
export function typeOf(name: string): string {
    return TYPES[extname(name).toLowerCase()] ?? FALLBACK;
}

/** Whether `path` is the directory itself or something under it. Both are already real paths. */
function inside(path: string, dir: string): boolean {
    return path === dir || path.startsWith(dir + sep);
}

/** The real path of a file or directory, or null when there is nothing there to resolve. */
function real(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * The `roots:` list of config/sources.yml, and a finding for every entry that is not usable: one
 * that is not a pair of strings, a key two entries share, and a directory that is not on this
 * machine. A finding is reported and never repaired, so a root whose directory has moved shows up
 * in the Findings view rather than as a tab that silently serves nothing.
 */
export function readRoots(
    config: Record<string, unknown>,
    file: string
): { roots: Root[]; findings: Finding[] } {
    const roots: Root[] = [];
    const findings: Finding[] = [];
    const raw = config.roots;
    if (raw === undefined) return { roots, findings };
    if (!Array.isArray(raw)) {
        findings.push({ file, key: 'roots', message: 'roots is not a list' });
        return { roots, findings };
    }
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
            findings.push({ file, key: 'roots', message: 'a root is not a map of key and dir' });
            continue;
        }
        const held = entry as { key?: unknown; dir?: unknown };
        if (typeof held.key !== 'string' || held.key === '') {
            findings.push({ file, key: 'roots', message: 'a root has no key' });
            continue;
        }
        if (typeof held.dir !== 'string' || held.dir === '') {
            findings.push({ file, key: held.key, message: 'the root names no dir' });
            continue;
        }
        if (roots.some((one) => one.key === held.key)) {
            findings.push({ file, key: held.key, message: 'two roots carry this key' });
            continue;
        }
        const dir = expandHome(held.dir);
        if (!isAbsolute(dir)) {
            findings.push({
                file,
                key: held.key,
                message: `the dir ${held.dir} is relative; a root is absolute or starts with ~/`
            });
            continue;
        }
        roots.push({ key: held.key, dir });
        if (real(dir) === null) {
            findings.push({
                file,
                key: held.key,
                message: `no directory at ${dir}; this root serves nothing`
            });
        }
    }
    return { roots, findings };
}

/**
 * A dir written as `~` or `~/...` with the home directory in place of the tilde, so the tracked
 * config carries no user path (the hub's rule) and the same file serves another account unchanged.
 */
export function expandHome(dir: string): string {
    if (dir === '~') return homedir();
    if (dir.startsWith('~/')) return join(homedir(), dir.slice(2));
    return dir;
}

/**
 * The file the request names, streamed from disk. 404 covers every way there is nothing to send: a
 * root nothing configures, a root whose directory is not there, a path that leaves the root once
 * both ends are resolved, a file that is not there, and a directory. 403 covers a request from
 * another origin.
 */
export function serveFile(request: Request, list: Root[], key: string, path: string): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return new Response(null, { status: 403 });
    }
    const root = list.find((one) => one.key === key);
    if (root === undefined) return new Response(null, { status: 404 });
    const dir = real(root.dir);
    if (dir === null) return new Response(null, { status: 404 });
    const full = real(resolve(dir, path));
    if (full === null || !inside(full, dir)) return new Response(null, { status: 404 });
    try {
        if (!statSync(full).isFile()) return new Response(null, { status: 404 });
    } catch {
        return new Response(null, { status: 404 });
    }
    // The bytes are streamed: a manual is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(body, {
        status: 200,
        headers: { 'content-type': typeOf(full), 'cache-control': CACHE }
    });
}

/** The file config/sources.yml sits in, which is what a root's finding names. */
export function rootsFile(engine: string = engineDir()): string {
    return join(engine, 'config', 'sources.yml');
}

/**
 * The configured roots. The config is read per request as everything else in this release is, so an
 * edit shows on a reload; the findings are published on the config channel by the watcher, which is
 * where the Findings view reads them from.
 */
export function roots(): Root[] {
    const engine = engineDir();
    return readRoots(loadConfig(engine).config, rootsFile(engine)).roots;
}
