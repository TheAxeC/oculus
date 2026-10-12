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
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import mime from 'mime';
import { inAppsFolder } from '../../data/helpers/files/apps/apps.ts';
import { folderOnDisk } from '../../data/places/folder-on-disk.ts';
import type { Project } from '../../data/model/index.ts';
import { inside, realPath } from '../core/paths.ts';
import { expandHome, type Root } from './workspace/folders.ts';

export { expandHome, type Root };

/**
 * A project's folder from the snapshot, resolved beneath the configured hub root unless it is a
 * repository's, which is the repository's own folder. Every action that starts a terminal in a
 * project's own folder, and the LaTeX reader of its manuscript folder, resolves it here, so the
 * check that a hub folder did not leave the hub exists once.
 */
export function projectDirectory(
    hub: string,
    project: Pick<Project, 'folder' | 'workspaceFolder'>
): string {
    const cwd = folderOnDisk(hub, project);
    if (project.workspaceFolder !== undefined) return cwd;
    const within = relative(hub, cwd);
    if (within.startsWith('..') || isAbsolute(within)) {
        throw new Error('the project folder is outside the configured hub');
    }
    return cwd;
}

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
 * The file the request names, streamed from disk. 404 covers every way there is nothing to send: a
 * root nothing configures, a root whose directory is not there, a path that leaves the root once
 * both ends are resolved, a file that is not there, and a directory.
 */
export function serveFile(
    list: Root[],
    key: string,
    path: string,
    appFolders: readonly string[] = []
): Response {
    const full = resolveRootFile(list, key, path);
    if (full === null) return new Response(null, { status: 404 });
    // The bytes are streamed: a manual is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
    // A file of an apps folder is app code. It is sent as plain text with sniffing off, so a page
    // that opens it (the Document view's frame has this origin) shows its source and never runs it.
    const app = inAppsFolder(appFolders, full, '');
    return new Response(body, {
        status: 200,
        headers: {
            'content-type': app ? 'text/plain; charset=utf-8' : typeOf(full),
            'cache-control': CACHE,
            ...(app ? { 'x-content-type-options': 'nosniff' } : {})
        }
    });
}
