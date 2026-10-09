// Layer 2, client state, pure. Which record of the change log Cmd+Z and Shift+Cmd+Z take back in
// the Files view.
//
// A file operation is one record of kind `files`; taking it back appends a record of its own whose
// `undoes` names the first. A record is undone while a record that undoes it is not itself undone,
// so an undo that was taken back (a redo) leaves its operation done again.
//
// Cmd+Z takes back the newest operation of the log that is not undone: a record that undoes none
// and has a way back. Shift+Cmd+Z takes back the newest undo that is not itself taken back, which
// puts its operation again: a record that undoes an operation, as opposed to one that undoes an
// undo. The files a taken-back replace writes are named from its record, so the tabs over them read
// the file again.

import { FILES_KIND, type OpsPlace } from '../../../../data/file-ops.ts';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { z } from 'zod';
import type { Move } from '../follow.ts';
import type { FsRoot } from '../view/place.ts';
import { rootHolding } from '../view/tab-roots.ts';

/** The fields of a change-log record the choice reads. */
export type LoggedChange = { at: string; kind: string; undo: string; undoes?: string };

/** Whether a record is undone: some record undoes it that is not undone itself. */
function undone(rows: readonly LoggedChange[], at: string, seen: ReadonlySet<string>): boolean {
    if (seen.has(at)) return false;
    const next = new Set(seen).add(at);
    return rows.some((one) => one.undoes === at && !undone(rows, one.at, next));
}

/**
 * The records Cmd+Z and Shift+Cmd+Z act on, from the log newest first: `undo` is the operation to
 * take back and `redo` the undo to take back, each null when there is none.
 */
export function undoPlan<Row extends LoggedChange>(
    rows: readonly Row[]
): {
    undo: Row | null;
    redo: Row | null;
} {
    const files = rows.filter((one) => one.kind === FILES_KIND);
    const originals = new Set(files.filter((one) => one.undoes === undefined).map((one) => one.at));
    const undo = files.find(
        (one) => one.undoes === undefined && one.undo !== 'none' && !undone(rows, one.at, new Set())
    );
    const redo = files.find(
        (one) =>
            one.undoes !== undefined &&
            originals.has(one.undoes) &&
            !undone(rows, one.at, new Set())
    );
    return { undo: undo ?? null, redo: redo ?? null };
}

/** A record of the log with the two lists of stamps a file operation writes. */
export type FileRecord = LoggedChange & { field: string; before: unknown; after: unknown };

const stampsShape = z.array(z.object({ path: z.string().min(1) }));

/** The absolute paths a record's list of stamps names, in order. */
export function stampPaths(stamps: unknown): string[] {
    return readAs(stampsShape, stamps)?.map((one) => one.path) ?? [];
}

/**
 * The moves taking a rename or a move record back makes: each path the operation put in place goes
 * back to the path it came from, as the tabs and bookmarks over it are restated. A path outside the
 * served roots, and any other kind of operation, gives none.
 */
export function undoneMoves(record: FileRecord, roots: FsRoot[]): Move[] {
    if (record.field !== 'rename' && record.field !== 'move') return [];
    const from = stampPaths(record.after);
    const to = stampPaths(record.before);
    return from.flatMap((path, at): Move[] => {
        const was = rootHolding(roots, path);
        const now = rootHolding(roots, to[at] ?? '');
        if (was === null || now === null) return [];
        return [
            {
                from: { root: was.root.key, path: was.path },
                to: { root: now.root.key, path: now.path }
            }
        ];
    });
}

/**
 * The files taking a replace, lsp-edit or writing-fix record back writes, as the root and path each
 * is served under, so the source tabs over them read the file again. A path outside the served
 * roots, and any other kind of operation, gives none.
 */
export function replacedPlaces(record: FileRecord, roots: FsRoot[]): OpsPlace[] {
    const edits = ['replace', 'lsp-edit', 'writing-fix'];
    if (!edits.includes(record.field)) return [];
    return stampPaths(record.after).flatMap((path): OpsPlace[] => {
        const held = rootHolding(roots, path);
        return held === null ? [] : [{ root: held.root.key, path: held.path }];
    });
}
