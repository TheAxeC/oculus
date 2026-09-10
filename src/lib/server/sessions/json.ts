// Layer 2, server. Reading and writing the two small JSON files the sessions layer owns (the
// transcript cache and the per-session overrides), plus the type guards every fold uses.
//
// Both files are written whole and atomically: a half-written overrides file would lose the user's
// pins, and a half-written cache would be discarded on the next read anyway.

import {
    closeSync,
    mkdirSync,
    openSync,
    readFileSync,
    renameSync,
    rmSync,
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
    const folder = dirname(path) || '.';
    mkdirSync(folder, { recursive: true });
    counter += 1;
    const temporary = join(folder, `.oculus-write-${process.pid}-${Date.now()}-${counter}`);
    try {
        const handle = openSync(temporary, 'w');
        try {
            writeSync(handle, JSON.stringify(payload));
        } finally {
            closeSync(handle);
        }
        renameSync(temporary, path);
    } catch (error) {
        rmSync(temporary, { force: true });
        throw error;
    }
}

export function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
