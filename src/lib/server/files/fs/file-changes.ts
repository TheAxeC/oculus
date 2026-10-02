// Layer 2, server. What the change log records of a file operation: the stamp of a path, the check
// that a path is still as a record left it, and the record an operation makes.
//
// A stamp (data/file-ops.ts FileStamp) is the kind, the size and the modification time of what is
// at a path, a link not followed. A folder's size is the bytes below it and its time the newest
// modification below it, over the first 5000 entries in name order, so a folder that something was
// added to or changed in is not the folder an operation left. A file's content is kept in the local
// history (fs/history.ts) before a trash or a delete, and its stamp names the copy.
//
// Nothing here holds state between calls.

import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ChangeRecord } from '../../core/changes.ts';
import { FILES_KIND, type FileField, type FileStamp } from '../../../data/file-ops.ts';
import { realPath } from '../../core/paths.ts';
import { forgetCopy, keepCopy } from './history.ts';

/** How many entries of a folder's tree its stamp reads. */
const WALK_LIMIT = 5000;

/** The bytes and the newest modification in a folder's tree, read in name order up to the limit. */
function treeOf(folder: string): { size: number; mtime: number } {
    let size = 0;
    let mtime = 0;
    let seen = 0;
    const pending = [folder];
    while (pending.length > 0 && seen < WALK_LIMIT) {
        const here = pending.pop() ?? '';
        let names: string[];
        try {
            names = readdirSync(here).sort();
        } catch {
            continue;
        }
        for (const name of names) {
            if (seen >= WALK_LIMIT) break;
            seen += 1;
            try {
                const info = lstatSync(join(here, name));
                mtime = Math.max(mtime, info.mtimeMs);
                if (info.isDirectory()) pending.push(join(here, name));
                else size += info.size;
            } catch {
                // An entry that went while the folder was read is not part of what it holds.
            }
        }
    }
    return { size, mtime };
}

/** What is at a path now, or null when nothing is. */
export function stampOf(path: string): FileStamp | null {
    try {
        const info = lstatSync(path);
        if (info.isDirectory()) {
            const tree = treeOf(path);
            return {
                path,
                kind: 'dir',
                size: tree.size,
                mtime: Math.max(info.mtimeMs, tree.mtime)
            };
        }
        const kind = info.isSymbolicLink() ? 'link' : 'file';
        return { path, kind, size: info.size, mtime: info.mtimeMs };
    } catch {
        return null;
    }
}

/**
 * What is at a path now, with the content of a file kept in the history first, so that the delete
 * or the trash about to remove it can be taken back. A file over the history's limit, a folder and
 * a link are stamped without a copy.
 */
export function stampKept(path: string, history: string | undefined): FileStamp | null {
    const stamp = stampOf(path);
    if (stamp?.kind !== 'file' || history === undefined) return stamp;
    const real = realPath(path);
    if (real === null) return stamp;
    const kept = keepCopy(history, real, 'delete');
    const id = kept.ok ? kept.kept?.id : undefined;
    return id === undefined ? stamp : { ...stamp, kept: id };
}

/** Whether the path is still as the stamp says: the same kind, size and modification time. */
export function holds(stamp: FileStamp): boolean {
    const now = stampOf(stamp.path);
    return (
        now !== null &&
        now.kind === stamp.kind &&
        now.size === stamp.size &&
        now.mtime === stamp.mtime
    );
}

/** The record of one operation, filed under the first path it names. */
export function recordOf(
    field: FileField,
    before: FileStamp[],
    after: FileStamp[],
    undo: ChangeRecord['undo'] = 'file'
): ChangeRecord {
    return {
        file: (after.at(0) ?? before.at(0))?.path ?? '',
        key: FILES_KIND,
        field,
        before,
        after,
        undo
    };
}

/** Take back the copy `stampKept` made, for an item whose removal did not happen. */
export function unkeep(stamp: FileStamp | null, history: string | undefined): void {
    if (stamp?.kept === undefined || history === undefined) return;
    const real = realPath(stamp.path);
    if (real !== null) forgetCopy(history, real, stamp.kept);
}
