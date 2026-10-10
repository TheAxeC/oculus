// Layer 2, server. Whether a path lies in a folder, and a path's real place on disk: the checks
// every route, write and read that takes a path from a request makes before it touches the file.
//
// Two containment rules, because the tree uses both: `inside` admits the folder itself (a file
// route may list the root it serves), `below` does not (a write into the hub may never name the hub
// folder itself). Both resolve first, so a `..` is worked out before the test and a sibling whose
// name starts with the folder's is never taken for a child of it. A folder of `/` holds only
// itself, since no resolved path below it starts with `//`. `under` asks the same of a list of
// folders for a real path, each folder compared as written and as resolved and the path also in the
// operating system's own spelling, so another letter case of a private folder is that folder: it
// tells the folders this machine keeps to itself (data/helpers/files/private-folders.ts) from the
// rest. `foldsCase` tells whether a folder's file system reads another letter case as the same
// path, which the workspaces answer reports for the page. It sits in server/core, the bottom of the
// server's folder order, so every server module reads the one rule from here.

import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';

/** Whether the resolved path is the resolved folder or lies below it. */
export function inside(path: string, dir: string): boolean {
    const full = resolve(path);
    const root = resolve(dir);
    return full === root || full.startsWith(root + sep);
}

/** Whether a root is an absolute path that is one of the given roots or lies under one. */
export function permitted(root: string, roots: string[]): boolean {
    if (typeof root !== 'string' || root === '' || !isAbsolute(root)) return false;
    return roots.some((one) => inside(root, one));
}

/** Whether the resolved path lies strictly below the resolved folder, never the folder itself. */
export function below(path: string, dir: string): boolean {
    const full = resolve(path);
    const root = resolve(dir);
    return full !== root && full.startsWith(root + sep);
}

/**
 * Whether a real path lies in one of the folders, each compared as written and as resolved. The
 * path is also compared in the operating system's own spelling, so on a case-insensitive file
 * system a path written in another letter case is in the folder it names.
 */
export function under(real: string, folders: readonly string[]): boolean {
    const targets = [real, realPath(real, true)].flatMap((one) =>
        one === null ? [] : [one.normalize('NFC')]
    );
    return folders.some((folder) => {
        const own = resolve(folder).normalize('NFC');
        const there = realPath(folder, true)?.normalize('NFC') ?? null;
        return targets.some(
            (target) => inside(target, own) || (there !== null && inside(target, there))
        );
    });
}

/**
 * The real path of a file or folder, links followed, or null when there is nothing to resolve. With
 * `native` it is the operating system's own resolution, which on a case-insensitive file system
 * gives every letter case of one path the same spelling, for a check of whether two paths are one.
 */
export function realPath(path: string, native = false): string | null {
    try {
        return native ? realpathSync.native(path) : realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * Whether the file system holding a folder reads a path written in another letter case as the same
 * path: the folder's real path with its last letter in the other case names the same folder. A
 * folder that is not there, and one whose path holds no letter, answers false.
 */
export function foldsCase(dir: string): boolean {
    const real = realPath(dir, true);
    if (real === null) return false;
    const swapped = real.replace(/[A-Za-z](?=[^A-Za-z]*$)/, (letter) =>
        letter === letter.toLowerCase() ? letter.toUpperCase() : letter.toLowerCase()
    );
    if (swapped === real) return false;
    try {
        const one = statSync(real);
        const other = statSync(swapped);
        return one.dev === other.dev && one.ino === other.ino;
    } catch {
        return false;
    }
}
