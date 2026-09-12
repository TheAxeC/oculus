// Layer 2, server. Reading and writing the two small JSON files the sessions layer owns (the
// transcript cache and the per-session overrides), plus the type guards every fold uses.
//
// Both files are written whole and atomically: a half-written overrides file would lose the user's
// pins, and a half-written cache would be discarded on the next read anyway.

import {
    closeSync,
    fchmodSync,
    mkdirSync,
    openSync,
    readFileSync,
    renameSync,
    rmSync,
    statSync,
    writeSync
} from 'node:fs';
import { dirname, join } from 'node:path';

/** Read one JSON file. Missing, unreadable or unparseable all come back as null. */
export function readJson(path: string): unknown {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch {
        return null;
    }
}

let counter = 0;

/**
 * Write one JSON file whole: a temporary file in the same directory, then a rename, which is
 * atomic on the same filesystem. The temporary name carries the pid and a counter so two writers
 * in one process cannot collide. Throws only when the directory cannot be written.
 */
export function writeJsonAtomic(path: string, payload: unknown): void {
    writeTextAtomic(path, JSON.stringify(payload));
}

/** Write one text file whole through a temporary neighbour and an atomic rename. */
export function writeTextAtomic(path: string, content: string): void {
    const folder = dirname(path) || '.';
    mkdirSync(folder, { recursive: true });
    counter += 1;
    const temporary = join(folder, `.oculus-write-${process.pid}-${Date.now()}-${counter}`);
    // An existing file keeps its mode: the replacement is created with it before the rename, so a
    // private file (0600) does not come back world-readable through the process's umask.
    let mode: number | undefined;
    try {
        mode = statSync(path).mode & 0o777;
    } catch {
        mode = undefined;
    }
    try {
        const handle =
            mode === undefined ? openSync(temporary, 'w') : openSync(temporary, 'w', mode);
        try {
            writeSync(handle, content);
            if (mode !== undefined) fchmodSync(handle, mode);
        } finally {
            closeSync(handle);
        }
        renameSync(temporary, path);
    } catch (error) {
        rmSync(temporary, { force: true });
        throw error;
    }
}

// The one map guard, from data/guards.ts. It is re-exported under the name it has always had here,
// so the seven session modules that read a transcript line through it are unchanged.
export { isMap } from '../../data/guards.ts';

/** A string value, or the empty string for anything else. */
export function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** A whole number, or zero for anything else. Booleans are not numbers here. */
export function whole(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;
}

/** A list, or the empty list for anything else. */
export function list(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}
