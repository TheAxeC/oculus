// Layer 2, server. An app's store: the one JSON value an app keeps for all its tabs, in a file
// outside the app's folder so that writing it never changes the app's content hash or approval.
//
// A machine app's store is `<app data>/<name>.json` with the app data folder `~/.oculus/app-data`
// unless the caller names another, and a root app's is `<root>/.oculus/app-data/<name>.json`. This
// module names the paths, reads a store with its size and version, and says whether the folder a
// store is written into lies where it should; the write itself is the write chain's
// (server/edit/writes/app-store.ts).
//
// The version is the first 16 hex characters of the SHA-256 of the file's bytes, so a rewrite with
// the same bytes is no change. A file over the limit is not read whole: its version is taken from
// `<size>:<modification time in ms>`, which costs one stat. A file that is absent, is no regular
// file, cannot be read, does not parse or is over the limit holds no value, and counts as absent
// in size and version when it cannot be read at all.

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { below, realPath } from '../../core/paths.ts';

/** The folder under a root that holds its apps' stores, and the apps folder beside it. */
export const ROOT_DATA = join('.oculus', 'app-data');

/** What a store file is: its size in bytes, its version, and the value it holds. */
export type StoreRead = { bytes: number; version: string; value: unknown };

/** ~/.oculus/app-data, resolved at the call rather than at import. */
export function defaultAppData(): string {
    return join(homedir(), '.oculus', 'app-data');
}

/** The first 16 hex characters of the SHA-256 of some bytes or text. */
function short(data: Uint8Array | string): string {
    return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/** The path of a store: the folder that holds it and the app's name. */
export function storeFile(folder: string, name: string): string {
    return join(folder, `${name}.json`);
}

/**
 * Read a store. `maxKb` is the limit above which the file is not read whole. A file that is not
 * there, is not a regular file or cannot be read is 0 bytes with the empty version; a file that
 * does not parse, or is over the limit, has its size and version and a null value. With `parse`
 * false the value is left null whatever the file holds, which is all the watcher needs of it.
 */
export function readStore(file: string, maxKb: number, parse = true): StoreRead {
    const absent: StoreRead = { bytes: 0, version: '', value: null };
    let stat;
    try {
        stat = lstatSync(file);
    } catch {
        return absent;
    }
    if (!stat.isFile()) return absent;
    if (stat.size > maxKb * 1024) {
        return { bytes: stat.size, version: short(`${stat.size}:${stat.mtimeMs}`), value: null };
    }
    let bytes: Uint8Array;
    try {
        bytes = readFileSync(file);
    } catch {
        return absent;
    }
    let value: unknown = null;
    if (parse && bytes.length > 0) {
        try {
            value = JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown;
        } catch {
            value = null;
        }
    }
    return { bytes: bytes.length, version: short(bytes), value };
}

/**
 * The real path of a path that may not exist yet: the real path of its deepest existing folder
 * followed by the segments below it, or null when no folder of it exists.
 */
function resolvedPath(path: string): string | null {
    let probe = path;
    const rest: string[] = [];
    for (;;) {
        const real = realPath(probe, true);
        if (real !== null) return join(real, ...rest);
        const up = dirname(probe);
        if (up === probe) return null;
        rest.unshift(basename(probe));
        probe = up;
    }
}

/**
 * Whether the folder a store is written into lies inside `base` once links are resolved, so a
 * `.oculus/app-data` that is a link out of its root never carries a write out of it. A folder or a
 * base that does not exist yet is judged by its deepest existing parent, which is how the first
 * write of a store, before its folder is made, is judged.
 */
export function storeFolderInside(folder: string, base: string): boolean {
    const realBase = resolvedPath(base);
    const real = resolvedPath(folder);
    if (realBase === null || real === null) return false;
    return real === realBase || below(real, realBase);
}
