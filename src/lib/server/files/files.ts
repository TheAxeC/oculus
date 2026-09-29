// Layer 2, server. One local file, read from a directory the configuration names and streamed to
// the page. routes/api/(files)/file/[root]/[...path]/+server.ts is the endpoint and holds nothing
// but the GET, since a route module may export only its verbs.
//
// It is what DESIGN.md's decision needs, "a local HTML file under a configured root opens as a
// tab": the manuals of cathedra and game-engine are single HTML files beside their own stylesheets
// and images, and a browser resolves `css/manual.css` against the document's own URL, so every
// asset the page asks for comes back through this same route without the file being rewritten.
//
// Nothing outside a root is ever served, which is DESIGN.md's "Auth" applied to a route that reads
// a path the request names. The root's directory and the resolved file are both put through
// realpath first, so a symbolic link pointing out of the root is refused rather than followed, and
// the file is then required to be the directory itself or something under it. Where the request
// came from is answered before any of that, by the origin guard in src/hooks.server.ts.
//
// Whether a path lies in a folder and where a path really is are read from server/core/paths.ts
// (`inside`, `realPath`).

import { createReadStream, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import mime from 'mime';
import { configDir } from '../../data/sources/config.ts';
import type { Finding } from '../../data/model/index.ts';
import { inside, realPath } from '../core/paths.ts';

/**
 * A project folder from the snapshot, resolved beneath the configured hub root. Every action that
 * starts a terminal in a project's own folder, and the LaTeX reader of its manuscript folder,
 * resolves it here, so the check that it did not leave the hub exists once.
 */
export function projectDirectory(hub: string, folder: string): string {
    const cwd = resolve(hub, folder);
    const within = relative(hub, cwd);
    if (within.startsWith('..') || isAbsolute(within)) {
        throw new Error('the project folder is outside the configured hub');
    }
    return cwd;
}

/** One directory the server may serve files from: the key a URL names it by, and where it is. */
export type Root = { key: string; dir: string };

/** Anything mime does not name is bytes: the browser is told nothing it cannot check. */
const FALLBACK = 'application/octet-stream';

/**
 * The extensions mime names as MPEG transport streams, which a code tree holds as TypeScript,
 * served as bytes, as any other source file the browser is not meant to run.
 */
const TYPESCRIPT: readonly string[] = ['.ts', '.mts', '.cts'];

/**
 * A minute. The file is the reader's own and changes under them, so it is re-read soon; it is
 * private because a manual is the machine's own document and no proxy has any business holding it.
 */
export const CACHE = 'private, max-age=60';

/**
 * The type a name is served as, by its extension, as mime names it: a text type and JSON with the
 * charset every file here is read in, anything mime does not know and TypeScript as bytes. A bare
 * dotfile such as `.png` has no extension, and is bytes too.
 */
export function typeOf(name: string): string {
    const extension = extname(name).toLowerCase();
    const type = TYPESCRIPT.includes(extension) ? null : mime.getType(extension);
    if (type === null) return FALLBACK;
    const text = type.startsWith('text/') || type === 'application/json';
    return text ? `${type}; charset=utf-8` : type;
}

/** Resolve an existing file under a named root, refusing missing roots, directories and escapes. */
export function resolveRootFile(list: Root[], key: string, path: string): string | null {
    const result = resolveRootFileResult(list, key, path);
    return 'path' in result ? result.path : null;
}

/** The same resolution, retaining the distinction between a missing file and a root escape. */
export function resolveRootFileResult(
    list: Root[],
    key: string,
    path: string
): { path: string } | { error: 'outside' | 'missing' } {
    const found = resolveRootPath(list, key, path);
    if ('error' in found) return found;
    try {
        return statSync(found.path).isFile() ? found : { error: 'missing' };
    } catch {
        return { error: 'missing' };
    }
}

/**
 * The real path a root's key and a relative path name, whatever is there: a file, a directory or
 * nothing. Both ends go through realpath first, so a symbolic link pointing out of the root is
 * refused rather than followed, and the result is then required to be the root itself or something
 * under it. The file route and the directory listing share this, so neither can drift from the
 * other on what is inside a root.
 */
export function resolveRootPath(
    list: Root[],
    key: string,
    path: string
): { path: string } | { error: 'outside' | 'missing' } {
    const root = list.find((one) => one.key === key);
    if (root === undefined) return { error: 'outside' };
    const dir = realPath(root.dir);
    if (dir === null) return { error: 'outside' };
    const candidate = resolve(dir, path);
    const full = realPath(candidate);
    if (full === null) {
        if (!inside(candidate, dir)) return { error: 'outside' };
        // A missing child of a symlinked directory can still be outside the named root.
        let parent = dirname(candidate);
        while (inside(parent, dir)) {
            const ancestor = realPath(parent);
            if (ancestor !== null) return { error: inside(ancestor, dir) ? 'missing' : 'outside' };
            const next = dirname(parent);
            if (next === parent) break;
            parent = next;
        }
        return { error: 'missing' };
    }
    if (!inside(full, dir)) return { error: 'outside' };
    return { path: full };
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
        if (realPath(dir) === null) {
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
 * both ends are resolved, a file that is not there, and a directory.
 */
export function serveFile(list: Root[], key: string, path: string): Response {
    const full = resolveRootFile(list, key, path);
    if (full === null) return new Response(null, { status: 404 });
    // The bytes are streamed: a manual is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(body, {
        status: 200,
        headers: { 'content-type': typeOf(full), 'cache-control': CACHE }
    });
}

/** The file config/sources.yml sits in, which is what a root's finding names. */
export function rootsFile(engine: string): string {
    return join(configDir(engine), 'sources.yml');
}

/** The key the hub itself is served under, so a collection's `link` to a file in the hub opens. */
export const HUB_ROOT = 'hub';

/**
 * The key the engine's own `config/` folder is served under. The Config view lists that folder,
 * shows each file and opens one in a source tab, and an edit saved there is an ordinary write under
 * a root, which the config watcher sees like any other. `local.yml` is a file of that folder and is
 * served, read and saved like the tracked ones. Nothing above the folder is served: the root is the
 * folder itself, so the rest of the engine directory stays outside every route.
 */
export const ENGINE_ROOT = 'engine';

/**
 * The engine's config folder as a root, which is the directory loadConfig merges its files from and
 * loadLocal reads local.yml in: the folder the page lists and saves into is the folder the server
 * reads, so a run started over another engine directory never writes the checkout.
 */
export function engineRoot(engine: string): Root {
    return { key: ENGINE_ROOT, dir: configDir(engine) };
}

/**
 * The roots config/sources.yml names, without the hub in front of them, out of a config already
 * read.
 */
export function configuredRootsOf(config: Record<string, unknown>, engine: string): Root[] {
    return readRoots(config, rootsFile(engine)).roots;
}

/**
 * The configured roots with the two fixed ones in front of them, the hub under `hub` and the
 * engine's config folder under `engine`, unless the config names that key itself, in which case the
 * config's entry stands. The hub is where `local.yml` says it is, so the tracked config never
 * carries it twice.
 */
export function withFixed(list: Root[], hub: string, engine: string): Root[] {
    const fixed: Root[] = [];
    if (!list.some((one) => one.key === HUB_ROOT)) fixed.push({ key: HUB_ROOT, dir: hub });
    if (!list.some((one) => one.key === ENGINE_ROOT)) fixed.push(engineRoot(engine));
    return [...fixed, ...list];
}

/**
 * The roots api/file serves: the hub, the engine's config folder, the configured ones, and the ones
 * `added` names.
 *
 * `added` is the current workspace's own roots, so a folder the reader added in the file browser is
 * served exactly as a configured one is. The two fixed keys and every configured key win over an
 * added root carrying the same key, so a saved workspace can only ever add a root and never
 * redirect one the rest of the application reads; the inside-root check is the same for both.
 */
export function rootsFrom(
    configured: Root[],
    hub: string,
    engine: string,
    added: Root[] = []
): Root[] {
    const taken = new Set([HUB_ROOT, ENGINE_ROOT, ...configured.map((one) => one.key)]);
    const extra = added.filter((one) => !taken.has(one.key));
    return withFixed([...configured, ...extra], hub, engine);
}
