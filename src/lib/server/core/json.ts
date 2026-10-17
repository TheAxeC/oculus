// Layer 2, server. Reading and writing small JSON and text files whole and atomically, the map
// guard `isMap` re-exported for the readers of those files, and the one write chain a process
// holds. The zod helpers the readers share are in data/shapes/shapes.ts, which cannot reach the
// disk. The sessions layer's transcript cache and per-session overrides, the file browser's
// workspaces and notes, the change log, the chat launcher and the image uploads all write through
// this module, which is why it sits in server/core, the bottom of the server's folder order.
//
// A file is written whole and atomically, by write-file-atomic: a half-written overrides file would
// lose the user's pins, and a half-written cache would be discarded on the next read anyway. The
// library writes a temporary file beside the target, flushes it to disk, gives it the target's
// mode and owner and renames it over the target, and removes it when the write throws. A path that
// is a symbolic link is written through to the file it names, and the link stays a link. An
// existing file this machine may not write is refused before the library runs, with the error an
// in-place write gives, since the rename would otherwise replace a file made read-only.
//
// Two processes that change one file take a lock file beside it first (`takeLock`): a file holding
// the name of the machine and the id of the process that took it, linked to the lock's path, which
// the operating system does for one caller only. A lock whose process on this machine has ended is
// taken over at once by one of the processes that find it, and, where the waits give an age, any
// other lock older than it. The schedule record and the generation of SvelteKit's types in
// vite.config.ts take it, each with its own waits.

import { randomUUID } from 'node:crypto';
import {
    accessSync,
    chmodSync,
    closeSync,
    constants,
    existsSync,
    fstatSync,
    linkSync,
    mkdirSync,
    openSync,
    readFileSync,
    readdirSync,
    renameSync,
    statSync,
    unlinkSync,
    writeFileSync
} from 'node:fs';
import { hostname } from 'node:os';
import { basename, dirname, join } from 'node:path';
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
 * What a read made for a write found: the parsed value, which is `undefined` for a file that is not
 * there, or the reason the file that is there does not read.
 */
export type JsonRead = { ok: true; value: unknown } | { ok: false; reason: string };

/**
 * Read one JSON file for a write that must not replace what it cannot read. A file that is not
 * there is `{ ok: true, value: undefined }`; one that is not JSON is `is not JSON`, and one that is
 * there and cannot be read is `cannot be read`. A caller refuses its write on `ok: false`, so the
 * bytes the reader put there are left as they are.
 */
export function readJsonChecked(path: string): JsonRead {
    if (!existsSync(path)) return { ok: true, value: undefined };
    try {
        return { ok: true, value: JSON.parse(readFileSync(path, 'utf8')) as unknown };
    } catch (error) {
        return {
            ok: false,
            reason: error instanceof SyntaxError ? 'is not JSON' : 'cannot be read'
        };
    }
}

/**
 * Write one JSON file whole: a temporary file in the same directory, then a rename, which is
 * atomic on the same filesystem. The temporary name is the target's with a hash of the process,
 * the thread and a counter after it, so two writers cannot collide. Throws when the file cannot be
 * written, the old content and the folder then left as they were. The file is indented by two
 * spaces and ends in a newline, so a person can read it, as `writePrivateJson` writes.
 */
export function writeJsonAtomic(path: string, payload: unknown): void {
    writeTextAtomic(path, `${JSON.stringify(payload, null, 2)}\n`);
}

/** Write text atomically, preserving an existing mode or using newMode for a new file. */
export function writeTextAtomic(path: string, content: string, newMode?: number): void {
    writeAtomic(path, content, newMode);
}

/** What a private write answers: done, or the sentence of why the file was left as it was. */
export type PrivateWrite = { ok: true } | { ok: false; error: string };

/**
 * Write the JSON `payload` whole, as the owner's file (mode 0600) in a folder made 0700 when it is
 * new, then read it back. `prepare` runs after the folder exists and before the write. A failure
 * answers the sentence naming the file, so a caller hands it to the reader.
 */
export function writePrivateJson(
    file: string,
    payload: unknown,
    prepare: (folder: string) => void = () => undefined
): PrivateWrite {
    const content = `${JSON.stringify(payload, null, 2)}\n`;
    try {
        mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
        prepare(dirname(file));
        writeAtomic(file, content, 0o600);
        chmodSync(file, 0o600);
        if (readFileSync(file, 'utf8') !== content) {
            return { ok: false, error: `${basename(file)} was not written as asked: ${file}` };
        }
    } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `${basename(file)} cannot be written: ${why}` };
    }
    return { ok: true };
}

/**
 * Write bytes atomically, by the same temporary file and rename: the write that carries a picture
 * or an uploaded file rather than a document, and it must not leave a half-written image in a
 * folder the wall lists or a half-written upload in a folder the Files view lists.
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

/**
 * How a lock file is waited on: the wait between two tries, the longest total wait, the age past
 * which a lock whose process is not known to have ended is taken over (null: never, the lock is
 * waited on while that process runs), and whether a start that waits says once whom it waits for.
 */
export type LockWaits = {
    retryMs: number;
    waitMs: number;
    staleMs: number | null;
    tellWait: boolean;
};

/**
 * A lock taken, and whether it was taken over from a process that left it, or why it was not: held
 * by another past the wait, or not creatable.
 */
type LockTaken =
    { ok: true; tookOver: boolean } | { ok: false; why: 'locked' | 'unwritable'; reason: string };

/** A lock file as one read of it found it: its inode, its time, and the process it names. */
type Holder = { ino: number; mtimeMs: number; host: string; pid: number };

/**
 * Wait `ms`. The timer holds the process open: a process whose only work left is waiting on a lock,
 * as a vitest start is, would otherwise end there with nothing done.
 */
function pause(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/** What a lock file holds: the machine's name and the id of the process that took it. */
function lockText(): string {
    return `${hostname()} ${String(process.pid)}`;
}

/**
 * Whether the process with this id runs on this machine. A process this one may not signal runs;
 * only one that is not there has ended.
 */
export function processRuns(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'EPERM';
    }
}

/**
 * The lock file at `path` as one open file reads it, so the inode and the process it names are of
 * the same file; null when there is none.
 */
function holderOf(path: string): Holder | null {
    let file: number;
    try {
        file = openSync(path, 'r');
    } catch {
        return null;
    }
    try {
        const { ino, mtimeMs } = fstatSync(file);
        const [host = '', pid = ''] = readFileSync(file, 'utf8').trim().split(' ');
        return { ino, mtimeMs, host, pid: Number(pid) };
    } catch {
        return null;
    } finally {
        closeSync(file);
    }
}

/** Whether a holder is a process of this machine that has ended. */
function ended(holder: Holder): boolean {
    const { host, pid } = holder;
    return host === hostname() && Number.isInteger(pid) && pid > 0 && !processRuns(pid);
}

/** Whether `now` is the very file `seen` described: the same inode written at the same time. */
function sameFile(seen: Holder, now: Holder | null): boolean {
    return now !== null && now.ino === seen.ino && now.mtimeMs === seen.mtimeMs;
}

/**
 * A new file beside `path` that names this process, whole before any other process can see it at
 * `path`, where it is put by a link or a rename.
 */
function namingFile(path: string): string {
    const file = `${path}.${String(process.pid)}.${randomUUID()}`;
    writeFileSync(file, lockText(), { flag: 'wx' });
    return file;
}

/** Remove a file, gone already or not. */
function removeFile(path: string): void {
    try {
        unlinkSync(path);
    } catch {
        // gone already
    }
}

/**
 * Make `path` a second name of `file`, only when `path` does not exist: the system makes a link for
 * one caller only.
 */
function linkOnce(file: string, path: string): boolean {
    try {
        linkSync(file, path);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
        throw error;
    }
}

/**
 * Put `fresh` at `path` in place of the left lock `seen`, and of no other file. The processes that
 * found the same left lock each make a claim beside it, named by its inode and time, by a link,
 * which the system makes for one of them only; the one that made it reads the path again and
 * renames `fresh` over it only when it is still the lock seen, and the others answer false and
 * wait. A claim whose process ended while it held it is taken over in the same way.
 */
function replaceLeft(path: string, seen: Holder, fresh: string): boolean {
    const claim = `${path}.${String(seen.ino)}-${String(Math.trunc(seen.mtimeMs))}`;
    if (!linkOnce(fresh, claim) && !takeLeftClaim(claim)) return false;
    try {
        if (!sameFile(seen, holderOf(path))) return false;
        renameSync(fresh, path);
        return true;
    } finally {
        removeFile(claim);
    }
}

/** Take over a claim whose process ended while it held it, as a left lock is taken over. */
function takeLeftClaim(claim: string): boolean {
    const held = holderOf(claim);
    if (held === null || !ended(held)) return false;
    const fresh = namingFile(claim);
    try {
        return replaceLeft(claim, held, fresh);
    } finally {
        removeFile(fresh);
    }
}

/**
 * Remove the files beside `lock` that a process of this machine made while it took the lock and
 * left when it ended before it could remove them, as an interrupted start does: its naming files
 * (`namingFile`) and its claims (`replaceLeft`), each read as a lock file is. A file whose process
 * runs, or of another machine, is kept.
 */
function dropLeftFiles(lock: string): void {
    const folder = dirname(lock);
    const named = `${basename(lock)}.`;
    let names: string[];
    try {
        names = readdirSync(folder);
    } catch {
        return;
    }
    for (const name of names) {
        if (!name.startsWith(named)) continue;
        const rest = name.slice(named.length);
        if (!/^\d+\.[0-9a-f-]{36}$/.test(rest) && !/^\d+-\d+$/.test(rest)) continue;
        const file = join(folder, name);
        const held = holderOf(file);
        if (held !== null && ended(held)) removeFile(file);
    }
}

/**
 * Whether another take of `lock` by this process waits beside `fresh`, its own naming file, and
 * began first: its naming file was made earlier, or at the same moment under a smaller name. The
 * test projects of one vitest start each take the types lock, and only the first of them says
 * whom the start waits for.
 */
function earlierWaiter(lock: string, fresh: string): boolean {
    const folder = dirname(lock);
    const mine = basename(fresh);
    const ours = `${basename(lock)}.${String(process.pid)}.`;
    try {
        const born = statSync(fresh).birthtimeMs;
        return readdirSync(folder).some((name) => {
            if (name === mine || !name.startsWith(ours)) return false;
            const other = statSync(join(folder, name)).birthtimeMs;
            return other < born || (other === born && name < mine);
        });
    } catch {
        return false;
    }
}

/**
 * Take the lock file, waiting while its process runs. The lock is a file that names this process,
 * linked to the lock's path, so no process ever finds the lock empty. A lock left by a process of
 * this machine that has ended is taken over at once, and, when `staleMs` is a number, any other
 * lock older than it; of two processes that take over one lock, one holds it (`replaceLeft`). A
 * takeover writes one stderr line that starts with `owner`, and the answer says it took over, since
 * the work the process that left it was doing may be half done. A folder the lock cannot be made in
 * is a change that cannot happen, not a lock that is held. The files an ended process left beside
 * the lock are removed first (`dropLeftFiles`).
 */
export async function takeLock(lock: string, waits: LockWaits, owner: string): Promise<LockTaken> {
    let fresh: string;
    try {
        dropLeftFiles(lock);
        fresh = namingFile(lock);
    } catch (error) {
        return { ok: false, why: 'unwritable', reason: String(error) };
    }
    try {
        let told = false;
        for (let waited = 0; waited <= waits.waitMs; waited += waits.retryMs) {
            if (linkOnce(fresh, lock)) return { ok: true, tookOver: false };
            const held = holderOf(lock);
            if (held === null) continue;
            const age = Date.now() - held.mtimeMs;
            const left = ended(held);
            if (left || (waits.staleMs !== null && age > waits.staleMs)) {
                if (replaceLeft(lock, held, fresh)) {
                    const why = left
                        ? 'whose process has ended'
                        : `which was ${String(age)} ms old`;
                    console.error(`${owner}: took over ${lock}, ${why}`);
                    return { ok: true, tookOver: true };
                }
            } else if (waits.tellWait && !told) {
                if (!earlierWaiter(lock, fresh)) {
                    console.error(
                        `${owner}: waiting for ${lock}, held by process ${String(held.pid)}`
                    );
                }
                told = true;
            }
            await pause(waits.retryMs);
        }
        return { ok: false, why: 'locked', reason: `${lock} stays taken` };
    } catch (error) {
        return { ok: false, why: 'unwritable', reason: String(error) };
    } finally {
        removeFile(fresh);
    }
}

/**
 * Remove the lock file this process took, and only while it names this process: a lock another
 * process has taken over since is that process's.
 */
export function dropLock(lock: string): void {
    const held = holderOf(lock);
    if (held?.host === hostname() && held.pid === process.pid) removeFile(lock);
}
