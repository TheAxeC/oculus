// Layer 1, data. Where a deck's files are: a path a deck names, resolved inside the served root the
// deck was found in, and the address the file route answers a file under that root at.
//
// A deck names files in four places: the Markdown files of `order:`, the images of a slide, the
// figures of a project slide's panels and the globs of a group's `find.folders`. Each is joined
// against a folder of the deck and put through realpath, so a `..`, an absolute path and a symbolic
// link that points out of the root are all refused the same way, and nothing is read through them.
// The rule is the one server/files/files.ts's `resolveRootPath` applies to the file route; it is
// written again here because layer 1 imports nothing of the server.

import { realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { LOCAL_NAME } from '../config.ts';

/** One directory the server may serve files from: the key a URL names it by, and where it is. */
export type DeckRoot = { key: string; dir: string };

/** What a path resolved to: the real file, and its place under the root with `/` separators. */
export type Resolved = { path: string; under: string };

/** The real path of something, or null when there is nothing there. */
export function realOf(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/** Whether a path is the folder or lies under it. */
function holds(dir: string, path: string): boolean {
    const within = relative(dir, path);
    return within === '' || (!within.startsWith('..') && !isAbsolute(within));
}

/** A path with the OS separator turned into `/`. */
function slashed(path: string): string {
    return sep === '/' ? path : path.split(sep).join('/');
}

/**
 * The file or folder a path names, joined against a folder of the deck, when it lies inside the
 * root; `outside` for anything that leaves the root, and `missing` for a path inside it that holds
 * nothing.
 */
export function resolveIn(
    root: DeckRoot,
    from: string,
    path: string
): Resolved | { error: 'outside' | 'missing' } {
    const base = realOf(root.dir);
    if (base === null || isAbsolute(path)) return { error: 'outside' };
    const candidate = resolve(from, path);
    const real = realOf(candidate);
    // The machine's own config/local.yml is never read into a deck, whichever root holds it.
    if (real !== null && basename(real) === LOCAL_NAME) return { error: 'outside' };
    if (real !== null) {
        return holds(base, real)
            ? { path: real, under: slashed(relative(base, real)) }
            : { error: 'outside' };
    }
    if (!holds(base, candidate)) return { error: 'outside' };
    // A missing child of a linked folder can be outside the root.
    let parent = dirname(candidate);
    while (holds(base, parent)) {
        const ancestor = realOf(parent);
        if (ancestor !== null) return { error: holds(base, ancestor) ? 'missing' : 'outside' };
        const next = dirname(parent);
        if (next === parent) break;
        parent = next;
    }
    return { error: 'missing' };
}
