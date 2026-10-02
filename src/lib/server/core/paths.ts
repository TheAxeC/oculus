// Layer 2, server. Whether a path lies in a folder, and a path's real place on disk: the checks
// every route, write and read that takes a path from a request makes before it touches the file.
//
// Two containment rules, because the tree uses both: `inside` admits the folder itself (a file
// route may list the root it serves), `below` does not (a write into the hub may never name the hub
// folder itself). Both resolve first, so a `..` is worked out before the test and a sibling whose
// name starts with the folder's is never taken for a child of it. A folder of `/` holds only
// itself, since no resolved path below it starts with `//`. It sits in server/core, the bottom of
// the server's folder order, so every server module reads the one rule from here.

import { realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/** Whether the resolved path is the resolved folder or lies below it. */
export function inside(path: string, dir: string): boolean {
    const full = resolve(path);
    const root = resolve(dir);
    return full === root || full.startsWith(root + sep);
}

/** Whether the resolved path lies strictly below the resolved folder, never the folder itself. */
export function below(path: string, dir: string): boolean {
    const full = resolve(path);
    const root = resolve(dir);
    return full !== root && full.startsWith(root + sep);
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
