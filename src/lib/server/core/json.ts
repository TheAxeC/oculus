// Layer 2, server. Reading and writing small JSON and text files whole and atomically, plus the
// type guards every fold uses, and the one write chain a process holds. The sessions layer's
// transcript cache and per-session overrides, the file browser's workspaces and notes, the change
// log, the chat launcher and the image uploads all write through it, which is why it sits in
// server/core, the bottom of the server's folder order.
//
// A file is written whole and atomically: a half-written overrides file would lose the user's pins,
// and a half-written cache would be discarded on the next read anyway.

import { randomBytes } from 'node:crypto';
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

/**
 * Write one JSON file whole: a temporary file in the same directory, then a rename, which is
 * atomic on the same filesystem. The temporary name carries the pid and random bytes so two writers
 * in one process cannot collide. Throws only when the directory cannot be written.
 */
export function writeJsonAtomic(path: string, payload: unknown): void {
    writeTextAtomic(path, JSON.stringify(payload));
}

/** Write text atomically, preserving an existing mode or using newMode for a new file. */
export function writeTextAtomic(path: string, content: string, newMode?: number): void {
    writeAtomic(path, content, newMode);
}

/**
 * Write bytes atomically, by the same temporary file and rename: the one write in oculus that
 * carries a picture rather than a document, and it must not leave a half-written image in a folder
 * the wall lists.
 */
export function writeBytesAtomic(path: string, content: Uint8Array, newMode?: number): void {
    writeAtomic(path, content, newMode);
}

function writeAtomic(path: string, content: string | Uint8Array, newMode?: number): void {
    const folder = dirname(path) || '.';
    mkdirSync(folder, { recursive: true });
    const temporary = join(
        folder,
        `.oculus-write-${process.pid}-${randomBytes(6).toString('hex')}`
    );
    // An existing file keeps its mode: the replacement is created with it before the rename, so a
    // private file (0600) does not come back world-readable through the process's umask.
    let mode: number | undefined;
    try {
        mode = statSync(path).mode & 0o777;
    } catch {
        mode = newMode;
    }
    try {
        const handle =
            mode === undefined ? openSync(temporary, 'w') : openSync(temporary, 'w', mode);
        try {
            // `writeSync` declares a string overload and an ArrayBufferView overload, and a
            // `string | Uint8Array` matches neither, so the union is narrowed before either call.
            if (typeof content === 'string') writeSync(handle, content);
            else writeSync(handle, content);
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

// The one map guard, from data/helpers/guards.ts. It is re-exported under the name it has always
// had here, so the seven session modules that read a transcript line through it are unchanged.
export { isMap } from '../../data/helpers/guards.ts';

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

/**
 * The write chain of one process: each POST waits for the one before it, so a read, a change and a
 * write of the whole file cannot interleave with another's. It belongs to the ServerContext, which
 * is what owns everything a process holds; the file browser's writes and the change log's appends
 * both wait on it, which is why it sits here, under both.
 */
export type FsWrites = { chain: Promise<unknown> };

/** A fresh chain, for a ServerContext being built. */
export function fsWrites(): FsWrites {
    return { chain: Promise.resolve() };
}

/**
 * Run one write after every write of the chain before it, whichever way that one ended, and hold
 * the next one until this one has ended the same way.
 */
export function chained<T>(writes: FsWrites, work: () => T | Promise<T>): Promise<T> {
    const answer = writes.chain.then(work, work);
    writes.chain = answer.then(
        () => undefined,
        () => undefined
    );
    return answer;
}
