// Layer 2, client state, pure. Where a path went when a file or folder was renamed or moved, and
// what that does to the state of the tabs that name it: a source, file or document tab, a diff pane
// over a file or over two files, and a Files view's open folders and selected row. Nothing here
// reads a store or posts a request; the store that holds the answer calls these and writes what
// they return.
//
// A path moves when it is the moved item or lies under it, at any depth: `dir` becoming `dir2`
// takes `dir/sub/a.md` to `dir2/sub/a.md` and leaves `dirx/a.md` alone, since only a whole segment
// is a folder's name. A tab whose label is the old file name takes the new one, and a label the
// reader or a bookmark gave stays.

import type { OpsPlace } from '../../../data/file-ops.ts';
import { diffState, heldDiff, type DiffState } from '../repositories/repositories.ts';
import { expandedOf, patchedFilesView, treeKey } from '../fs.ts';
import { nameOf } from './file-type.ts';
import { t } from '../../shared/words/text.ts';

/** One item that went from a place to another. */
export type Move = { from: OpsPlace; to: OpsPlace };

/** The place a path went, or null when the move did not touch it. */
export function followed(place: OpsPlace, move: Move): OpsPlace | null {
    if (place.root !== move.from.root || move.from.path === '') return null;
    if (place.path === move.from.path) return move.to;
    if (!place.path.startsWith(`${move.from.path}/`)) return null;
    const rest = place.path.slice(move.from.path.length + 1);
    return { root: move.to.root, path: move.to.path === '' ? rest : `${move.to.path}/${rest}` };
}

/** The place a path went under the first of the moves that touched it, or null for none. */
export function followedAny(place: OpsPlace, moves: Move[]): OpsPlace | null {
    for (const move of moves) {
        const next = followed(place, move);
        if (next !== null) return next;
    }
    return null;
}

/** The label a tab takes at a new path: the new name where the old label was the old name. */
function relabelled(label: string, from: OpsPlace, to: OpsPlace): string {
    return label === nameOf(from.path) ? nameOf(to.path) : label;
}

/** A layout state as a map, or null for anything that is not one. */
function mapOf(state: unknown): Record<string, unknown> | null {
    return typeof state === 'object' && state !== null && !Array.isArray(state)
        ? (state as Record<string, unknown>)
        : null;
}

/** The place a state names by its `root` and `path`, or null. */
function placeOf(map: Record<string, unknown>): OpsPlace | null {
    return typeof map.root === 'string' && typeof map.path === 'string' && map.path !== ''
        ? { root: map.root, path: map.path }
        : null;
}

/** The state of a tab that names one file by its `root` and `path`, at the file's new place. */
function restatedFile(
    map: Record<string, unknown>,
    place: OpsPlace,
    next: OpsPlace
): Record<string, unknown> {
    const label = typeof map.label === 'string' ? relabelled(map.label, place, next) : undefined;
    const moved = { ...map, root: next.root, path: next.path };
    return label === undefined ? moved : { ...moved, label };
}

/** A diff pane's state at the new places of its file and of the file it is compared against. */
export function followedDiffTab(state: unknown, moves: Move[]): DiffState | null {
    const held = heldDiff(state);
    const own: OpsPlace = { root: held.root, path: held.path };
    const history =
        held.commit !== '' || held.stash !== '' || held.worktree || held.group !== undefined;
    const path = history || held.path === '' ? null : followedAny(own, moves);
    const against = held.against === undefined ? null : followedAny(held.against, moves);
    if (path === null && against === null) return null;
    const subject = {
        root: path?.root ?? held.root,
        path: path?.path ?? held.path,
        staged: held.staged,
        worktree: held.worktree,
        commit: held.commit,
        stash: held.stash,
        group: held.group,
        against: against ?? held.against,
        line: held.line
    };
    const title = (file: string, against: string): string =>
        t('files.compare_title', nameOf(against), nameOf(file));
    const label =
        held.against !== undefined &&
        subject.against !== undefined &&
        held.label === title(held.path, held.against.path)
            ? title(subject.path, subject.against.path)
            : held.label;
    return diffState(subject, label);
}

/**
 * The layout state a source, file or document tab takes after the moves, or null when they leave
 * it as it is. A tab over a trashed file is not followed: it stays open on its missing file.
 */
export function followedFileTab(view: string, state: unknown, moves: Move[]): unknown {
    if (view !== 'source' && view !== 'file' && view !== 'document') return null;
    const map = mapOf(state);
    const place = map === null ? null : placeOf(map);
    if (map === null || place === null) return null;
    const next = followedAny(place, moves);
    if (next === null) return null;
    const restated = restatedFile(map, place, next);
    return view === 'document' ? { ...restated, id: `${next.root}/${next.path}` } : restated;
}

/** A Files view's state with its open folders and selected row at their new places, or null. */
export function followedFilesView(state: unknown, moves: Move[]): Record<string, unknown> | null {
    const expanded = expandedOf(state);
    const moved = expanded.map((key) => {
        const at = key.indexOf(':');
        const next =
            at < 0 ? null : followedAny({ root: key.slice(0, at), path: key.slice(at + 1) }, moves);
        return next === null ? key : treeKey(next.root, next.path);
    });
    const map = mapOf(state);
    const selected = map === null ? null : mapOf(map.selected);
    const place = selected === null ? null : placeOf(selected);
    const next = place === null ? null : followedAny(place, moves);
    if (next === null && moved.every((key, at) => key === expanded[at])) return null;
    return patchedFilesView(state, {
        expanded: moved,
        ...(next === null ? {} : { selected: next })
    });
}
