// Layer 2, server. Taking back an act of `deck-edit`: every file the act changed goes back as it
// was, or none does.
//
// An act's records share one key (deck-files.ts), and so do the records of an undo of it, which
// also carry the moment of the change they took back; the records of one write are those of the log
// with that kind, key and `undoes`. The undo is checked first, for all of them: each file must hold
// the text the act left (an image its hash), and a file that is not there must be what the act made
// away. Then the texts go back and the files the act made go to the Trash, and the undo is recorded
// as an act of its own, which a further undo takes back in turn.
//
// A dropped image whose file the undo trashed is not brought back by taking that undo back: the
// record holds its hash and never its bytes, so the records of that undo offer no undo.

import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import trashLibrary from 'trash';
import { configDir } from '../../../../../../data/sources/config.ts';
import { writtenWith, type Change, type ChangeRecord } from '../../../../../core/changes.ts';
import { writeTextAtomic } from '../../../../../core/json.ts';
import { inside, realPath } from '../../../../../core/paths.ts';
import { guarded, protectedFiles } from '../../../../../files/fs/ops.ts';
import type { UndoOutcome } from '../../../undo.ts';
import type { FilesDeps } from '../../../file-undo.ts';
import type { WriteTarget } from '../../../../writes.ts';
import { IMAGE_BYTES, hashOf, textOf } from './deck-files.ts';

/** One file of an act, with the path it is at and the text or hash it is to hold. */
type Part = { change: Change; path: string; before: string; after: string };

/** The state a file is in as the records state it: its text, or the hash of an image. */
function stateOf(part: Part): string {
    if (part.change.field !== IMAGE_BYTES) return textOf(part.path);
    return existsSync(part.path) ? hashOf(readFileSync(part.path)) : '';
}

/** The text a record holds in a place, empty when it holds none. */
function held(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/**
 * Whether a path is one an undo may write: inside a served root, and not one of the machine's
 * `local.yml` files.
 */
function writable(into: WriteTarget, path: string): boolean {
    const roots = into.files?.roots() ?? [];
    const guard = protectedFiles({ roots, config: configDir(into.engine) });
    if (guarded(guard, path)) return false;
    const folder = realPath(dirname(path)) ?? dirname(path);
    return roots.some((root) => inside(folder, realPath(root.dir) ?? root.dir));
}

/** Take one act back, with every file it changed. */
export async function undoDeckEdit(
    into: WriteTarget,
    change: Change,
    deps: FilesDeps
): Promise<UndoOutcome> {
    if (into.changes === undefined) return { error: 'unwritable' };
    if (change.undo === 'none') return { error: 'nothing' };
    const parts: Part[] = writtenWith(into.changes, change).map((one) => ({
        change: one,
        path: resolve(one.file),
        before: held(one.before),
        after: held(one.after)
    }));
    if (parts.some((one) => !writable(into, one.path))) return { error: 'gone' };
    if (parts.some((one) => stateOf(one) !== one.after)) return { error: 'moved' };
    // An image that was trashed cannot be written back from a hash.
    if (parts.some((one) => one.change.field === IMAGE_BYTES && one.before !== '')) {
        return { error: 'nothing' };
    }
    const records: ChangeRecord[] = [];
    const trash = deps.trash ?? ((path, options) => trashLibrary(path, options));
    // The files the undo has changed so far, which a failure puts back as the act left them.
    const done: Part[] = [];
    try {
        for (const one of parts.filter((part) => part.before !== '')) {
            mkdirSync(dirname(one.path), { recursive: true });
            writeTextAtomic(one.path, one.before);
            done.push(one);
        }
        for (const one of parts.filter((part) => part.before === '')) {
            await trash(one.path, { glob: false });
            if (one.change.field !== IMAGE_BYTES) done.push(one);
            // The folder an outline made is empty once its files are in the Trash.
            if (one.change.field === 'outline') {
                try {
                    rmdirSync(dirname(one.path));
                } catch {
                    // A folder that holds something is the reader's and stays.
                }
            }
        }
    } catch {
        for (const one of done) {
            // A file the act left absent is removed again rather than written empty.
            if (one.after === '') rmSync(one.path, { force: true });
            else {
                mkdirSync(dirname(one.path), { recursive: true });
                writeTextAtomic(one.path, one.after);
            }
        }
        return { error: 'unwritable' };
    }
    // An undo that trashed an image cannot be taken back, so its records offer no undo.
    const undo = parts.some((one) => one.change.field === IMAGE_BYTES) ? 'none' : 'field';
    for (const one of parts) {
        records.push({
            file: one.path,
            key: one.change.key,
            field: one.change.field,
            before: one.after,
            after: one.change.field === IMAGE_BYTES ? '' : one.before,
            undo
        });
    }
    return {
        found: true,
        changed: parts.map((one) => one.path),
        refused: [],
        records
    };
}
