// Layer 2, server. Taking back a file operation: the undo of a `files` record of the change log.
//
// An operation of POST /api/ops (server/files/fs/ops.ts) is recorded with the stamps of the paths
// it took from (`before`) and the paths it put in place (`after`). Taking it back is a different
// kind of write from the field writes of undo.ts, since it moves, trashes and writes files, so it
// is its own module and its own answer, and it is checked the same way: nothing is touched unless
// every path is as the record left it.
//
// - `create`, `copy` and `upload` are taken back by moving what they made to the Trash, only while
//   each path is as the operation left it (kind, size and modification time).
// - `rename` and `move` are taken back by moving each item to the name it came from, only while the
//   item is there as the operation left it and the old name is free.
// - `trash` and `delete` are taken back by writing back each file whose content was kept in the
//   local history, up to 5 MB, and by making each folder again empty, only while the name is free.
//   A file with no kept content and a link are not brought back; an undo that brings back nothing
//   is refused as `nothing`. A file whose kept copy the history has since pruned refuses the whole
//   undo as `copy-gone`, before anything is written.
// - `replace` is taken back by writing each file back from the copy the replace kept of it, only
//   while every file is as the replace left it (`moved` otherwise). The undo keeps a copy of each
//   file as the replace left it and records itself as a `replace` whose `before` names those
//   copies, so the undo of that record writes the replaced text back: the redo is the same path.
//   A copy the history has since pruned refuses the whole undo as `copy-gone`.
//
// The paths of a record are absolute, the log being a file a hand may edit, so every path must lie
// in a served root. The undo is itself recorded, as the operation that reverses it, so it can be
// taken back too. An undo that failed part way records the items it did before the one it stopped
// at.
//
// The Trash is a parameter, so a test hands in a spy and moves nothing to the real Trash.

import { lstatSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import trashLibrary from 'trash';
import { z } from 'zod';
import { FILES_KIND, FILE_FIELDS, type FileField, type FileStamp } from '../../../data/file-ops.ts';
import type { Change, ChangeRecord } from '../../core/changes.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { below, realPath } from '../../core/paths.ts';
import { holds, recordOf, stampKept, stampOf } from '../../files/fs/file-changes.ts';
import { defaultHistoryDir, keepCopy, readCopy, restoreCopy } from '../../files/fs/history.ts';
import type { Root } from '../../files/files.ts';
import type { UndoOutcome } from './undo.ts';
import type { WriteTarget } from '../writes.ts';

/** What the undo of a file operation runs over: the roots, the history folder and the chain. */
export type FilesTarget = {
    /** The roots the file browser serves, which every path of a record must lie in. */
    roots: () => Root[];
    /** The local history folder a trash keeps content in, and a restore reads it from. */
    history?: string;
    /** The chain the file operations wait on, which an undo waits on too. */
    writes?: FsWrites;
};

/**
 * The target of the file undo for the roots in force: the history folder is the machine's own
 * unless a local.yml names one.
 */
export function filesTargetOf(
    roots: () => Root[],
    history: string | undefined,
    writes: FsWrites | undefined
): FilesTarget {
    return { roots, history: history ?? defaultHistoryDir(), writes };
}

/** The one call a test replaces: the Trash. */
export type FilesDeps = { trash?: (path: string, options: { glob: false }) => Promise<void> };

const stampShape = z.object({
    path: z.string().min(1),
    kind: z.enum(['file', 'dir', 'link']),
    size: z.number(),
    mtime: z.number(),
    kept: z.string().optional()
}) satisfies z.ZodType<FileStamp>;

const stampsShape = z.array(stampShape);

const fieldShape = z.enum(FILE_FIELDS);

/** What an undo of file operations answers: the records of what it did, or the word refusing it. */
type FilesOutcome = UndoOutcome;

/** Whether nothing is at the path, or what is there is the path `same` under another spelling. */
function free(path: string, same?: string): boolean {
    try {
        const there = lstatSync(path);
        if (same === undefined) return false;
        const other = lstatSync(same);
        return there.ino === other.ino && there.dev === other.dev;
    } catch {
        return true;
    }
}

/** Whether a path lies in a served root, by the real path of the folder it is in. */
function served(roots: Root[], path: string): boolean {
    const folder = realPath(dirname(path));
    if (folder === null) return false;
    return roots.some((root) => {
        const dir = realPath(root.dir);
        return dir !== null && (folder === dir || below(folder, dir));
    });
}

/** The change a record's undo made so far, which becomes the record of the undo. */
type Done = { field: FileField; before: FileStamp[]; after: FileStamp[] };

/** Move one path to the Trash after keeping its content in the history. */
async function trashIt(
    target: FilesTarget,
    trash: NonNullable<FilesDeps['trash']>,
    stamp: FileStamp,
    done: Done
): Promise<void> {
    const kept = stampKept(stamp.path, target.history);
    await trash(stamp.path, { glob: false });
    done.before.push(kept ?? stamp);
}

/** Whether a file's kept copy was named by the record and the history no longer holds it. */
function copyGone(target: FilesTarget, stamp: FileStamp): boolean {
    if (stamp.kind !== 'file' || stamp.kept === undefined || target.history === undefined) {
        return false;
    }
    return readCopy(target.history, stamp.path, stamp.kept) === null;
}

/** Write one stamp's path back: a folder empty, a file from its kept copy, anything else not. */
async function writeBack(target: FilesTarget, stamp: FileStamp, done: Done): Promise<boolean> {
    if (stamp.kind === 'dir') {
        await mkdir(stamp.path, { recursive: true });
    } else if (stamp.kind === 'file' && stamp.kept !== undefined && target.history !== undefined) {
        if (!restoreCopy(target.history, stamp.path, stamp.kept, stamp.path)) return false;
    } else {
        return false;
    }
    const now = stampOf(stamp.path);
    if (now !== null) done.after.push(now);
    return true;
}

/**
 * Write the files of a `replace`, `lsp-edit` or `writing-fix` record back from the copies it kept,
 * keeping a copy of each file as it is first, of the record's own kind, so that the record this
 * undo makes can be taken back too. Each stamp of `before` is paired with the stamp of `after` at
 * the same place.
 */
function writeReplaced(
    target: FilesTarget,
    via: 'replace' | 'lsp-edit' | 'writing-fix',
    before: FileStamp[],
    after: FileStamp[],
    done: Done
): void {
    const history = target.history;
    if (history === undefined) return;
    for (const [at, was] of before.entries()) {
        const left = after.at(at);
        if (left === undefined || was.kept === undefined) continue;
        const kept = keepCopy(history, left.path, via);
        const id = kept.ok ? kept.kept?.id : undefined;
        if (!restoreCopy(history, was.path, was.kept, was.path)) continue;
        done.before.push(id === undefined ? left : { ...left, kept: id });
        const now = stampOf(was.path);
        if (now !== null) done.after.push(now);
    }
}

/** The records of what an undo did, none when it did nothing. */
function recordsOf(done: Done): ChangeRecord[] {
    if (done.before.length === 0 && done.after.length === 0) return [];
    return [recordOf(done.field, done.before, done.after)];
}

/**
 * Take one `files` record back. The paths are checked first, all of them, and nothing is touched
 * unless they all pass.
 */
async function undoNow(
    target: FilesTarget,
    change: Change,
    deps: FilesDeps
): Promise<FilesOutcome> {
    const field = fieldShape.safeParse(change.field);
    const before = stampsShape.safeParse(change.before);
    const after = stampsShape.safeParse(change.after);
    if (!field.success || !before.success || !after.success) return { error: 'nothing' };
    const roots = target.roots();
    const named = [...before.data, ...after.data];
    if (named.some((one) => !served(roots, one.path))) return { error: 'gone' };
    const trash = deps.trash ?? ((path, options) => trashLibrary(path, options));
    const via = field.data;
    let done: Done;
    if (via === 'create' || via === 'copy' || via === 'upload') {
        if (after.data.length === 0) return { error: 'nothing' };
        if (after.data.some((one) => stampOf(one.path) === null)) return { error: 'gone' };
        if (!after.data.every((one) => holds(one))) return { error: 'moved' };
        done = { field: 'trash', before: [], after: [] };
        try {
            for (const stamp of after.data) await trashIt(target, trash, stamp, done);
        } catch {
            return finish(done, 'unwritable');
        }
    } else if (via === 'rename' || via === 'move') {
        if (after.data.length === 0 || after.data.length !== before.data.length) {
            return { error: 'nothing' };
        }
        if (after.data.some((one) => stampOf(one.path) === null)) return { error: 'gone' };
        if (!after.data.every((one) => holds(one))) return { error: 'moved' };
        const taken = before.data.some((one, at) => !free(one.path, after.data[at]?.path));
        if (taken) return { error: 'moved' };
        done = { field: via, before: [], after: [] };
        try {
            for (const [at, stamp] of after.data.entries()) {
                const home = before.data.at(at);
                if (home === undefined) continue;
                await mkdir(dirname(home.path), { recursive: true });
                await rename(stamp.path, home.path);
                done.before.push(stamp);
                const now = stampOf(home.path);
                if (now !== null) done.after.push(now);
            }
        } catch {
            return finish(done, 'unwritable');
        }
    } else if (via === 'replace' || via === 'lsp-edit' || via === 'writing-fix') {
        const paired = before.data.length === after.data.length;
        if (!paired || before.data.length === 0) return { error: 'nothing' };
        if (before.data.some((one, at) => one.path !== after.data[at]?.path)) {
            return { error: 'nothing' };
        }
        if (after.data.some((one) => stampOf(one.path) === null)) return { error: 'gone' };
        if (!after.data.every((one) => holds(one))) return { error: 'moved' };
        if (before.data.some((one) => one.kept === undefined || copyGone(target, one))) {
            return { error: 'copy-gone' };
        }
        done = { field: via, before: [], after: [] };
        try {
            writeReplaced(target, via, before.data, after.data, done);
        } catch {
            return finish(done, 'unwritable');
        }
    } else {
        if (before.data.length === 0) return { error: 'nothing' };
        if (before.data.some((one) => !free(one.path))) return { error: 'moved' };
        if (before.data.some((one) => copyGone(target, one))) return { error: 'copy-gone' };
        done = { field: 'create', before: [], after: [] };
        try {
            let brought = 0;
            for (const stamp of before.data) if (await writeBack(target, stamp, done)) brought += 1;
            if (brought === 0) return { error: 'nothing' };
        } catch {
            return finish(done, 'unwritable');
        }
    }
    return finish(done);
}

/**
 * The outcome of an undo that did what it did: the answer, or when it failed part way, the failure
 * with the records of the items it did, which the route writes to the change log.
 */
function finish(done: Done, error?: 'unwritable'): FilesOutcome {
    const records = recordsOf(done);
    if (error === undefined) {
        return { found: true, changed: [FILES_KIND], refused: [], records };
    }
    return { error, records };
}

/**
 * Take one `files` record back, behind the chain the file operations wait on. A target built with
 * no `files` has nothing to move and answers `unwritable`.
 */
export async function undoFiles(
    into: WriteTarget,
    change: Change,
    deps: FilesDeps = {}
): Promise<FilesOutcome> {
    const target = into.files;
    if (target === undefined) return { error: 'unwritable' };
    const run = () => undoNow(target, change, deps);
    return target.writes === undefined ? run() : chained(target.writes, run);
}
