// Layer 2, server. Reading and writing small JSON and text files whole and atomically, the map
// guard `isMap` re-exported for the readers of those files, and the one write chain a process
// holds. The zod helpers the readers share are in shapes.ts, which cannot reach the disk. The
// sessions layer's transcript cache and per-session overrides, the file browser's workspaces and
// notes, the change log, the chat launcher and the image uploads all write through this module,
// which is why it sits in server/core, the bottom of the server's folder order.
//
// A file is written whole and atomically, by write-file-atomic: a half-written overrides file would
// lose the user's pins, and a half-written cache would be discarded on the next read anyway. The
// library writes a temporary file beside the target, flushes it to disk, gives it the target's
// mode and owner and renames it over the target, and removes it when the write throws. A path that
// is a symbolic link is written through to the file it names, and the link stays a link. An
// existing file this machine may not write is refused before the library runs, with the error an
// in-place write gives, since the rename would otherwise replace a file made read-only.

import {
    accessSync,
    closeSync,
    constants,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync
} from 'node:fs';
import { dirname } from 'node:path';
import writeFileAtomic from 'write-file-atomic';

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
 * atomic on the same filesystem. The temporary name is the target's with a hash of the process,
 * the thread and a counter after it, so two writers cannot collide. Throws when the file cannot be
 * written, the old content and the folder then left as they were.
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

/**
 * Refuse an existing file this machine may not write, before the library runs: the library renames
 * a new file over the old one, which a read-only mode on the old one does not stop, and a file made
 * read-only is one its owner has refused writes to. The refusal is the error an in-place write
 * gives, raised by opening the file for writing without truncating it; should that open be let
 * through, the access check's own error is thrown. A file that is not there is not refused.
 */
function refuseReadonly(path: string): void {
    try {
        accessSync(path, constants.W_OK);
    } catch (denied) {
        if ((denied as NodeJS.ErrnoException).code === 'ENOENT') return;
        closeSync(openSync(path, 'r+'));
        throw denied;
    }
}

/**
 * The one atomic write: the folder made when it is missing, a read-only file refused, then the
 * library's write, fsynced. An existing file keeps its mode, since the library copies it when no
 * mode is passed; `newMode` is passed only for a file that is not there yet, so a private file
 * (0600) never comes back with a wider mode, and a new file is made with `newMode`, or through the
 * umask when there is none.
 */
function writeAtomic(path: string, content: string | Uint8Array, newMode?: number): void {
    mkdirSync(dirname(path) || '.', { recursive: true });
    refuseReadonly(path);
    const fresh = newMode !== undefined && !existsSync(path);
    writeFileAtomic.sync(path, content, fresh ? { mode: newMode } : {});
}

// The one map guard, from data/helpers/guards.ts, re-exported here for the modules of
// server/sessions that import it from here: group.ts, overrides.ts and stores/transcripts.ts.
export { isMap } from '../../data/helpers/guards.ts';

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
