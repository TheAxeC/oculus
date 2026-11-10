// Layer 2, client state, pure. The Notes section's tree: each hub of the workspace a group row, its
// notes folder's folders and files the rows under it in the section's order, drawn by the
// Explorer's own tree (views/shared/explorer/tree/Tree.svelte) from the rows treeRows() makes, so a
// press, a key, the menu, the name input and a drag act on a note as on any file of the tree. The
// rows are read from the notes of every hub as GET /api/fs?notes=1 answers them (fs.svelte.ts's
// `notes`), which come in the order the section keeps, so a listing of the tree is never asked for.
//
// A group is the depth-0 row at the hub's notes folder, named by the workspace's name of the hub. A
// group that lists nothing has one muted row under it (`said`): the notes folder is empty or not
// there yet, a link out of its hub, or unreadable, the last with the read again. A workspace with
// no hub is that one row and no group.
//
// The order (`orderStepped`, `orderPlaced`) is the paths of every note of the hub, each without
// `.md`, in the order the section lists them, with the reader's move made: the whole list is
// written, so the notes the order file did not name keep the place they were listed at.

import { notesMark } from '../../../../data/helpers/files/private-folders.ts';
import type { HubNotes } from '../../../../data/model/index.ts';
import {
    NOTE_SUFFIX,
    inNotes,
    isNote,
    nameRefusalMessage,
    noteName,
    type NameRefusal
} from '../../../../data/prose/markdown/note-names.ts';
import type { Naming } from '../naming.ts';
import { treeRows } from '../rows/tree-rows.ts';
import type { FsEntry, FsRoot, TreeRow } from '../view/place.ts';

// The views read a note's suffix through this module, since a view imports `state/` and not
// `data/`.
export { NOTE_SUFFIX };

type Words = (key: string, ...args: (string | number)[]) => string;

/** One hub of the section: its notes and the root the workspace serves it under. */
export type NoteGroup = { hub: HubNotes; root: FsRoot };

/**
 * The path under the hub's root of a path inside its notes folder, the hub's `folder` as its notes
 * answer names it.
 */
export function notePath(hub: Pick<HubNotes, 'folder'>, pathInNotes: string): string {
    return [hub.folder, pathInNotes].filter((one) => one !== '').join('/');
}

/**
 * The notes folder of the root of `roots` with the key, its `notes_dir` as the workspaces answer
 * marks a hub with: the empty text for a root that is no hub or not served.
 */
export function rootNotes(roots: readonly FsRoot[], key: string): string {
    return notesMark(roots.find((one) => one.key === key));
}

/**
 * The path under its root of a path inside the notes folder of the hub of `hubs` served under
 * `root`; a root no hub of them is served under has no notes folder, and the path is its own.
 */
export function notePathOf(hubs: readonly HubNotes[], root: string, pathInNotes: string): string {
    return notePath({ folder: hubs.find((one) => one.root === root)?.folder ?? '' }, pathInNotes);
}

/**
 * The create that makes a file or folder at a path inside a hub's notes folder: into the notes
 * folder under the path, or, for a hub with no notes folder yet, into the top of the hub under the
 * notes folder's path and the path, so the one create makes the notes folder and every folder above
 * it that is not there, and History undoes them all.
 */
export function noteMaking(hub: HubNotes, pathInNotes: string): { into: string; name: string } {
    if (hub.state !== 'none') return { into: hub.folder, name: pathInNotes };
    return { into: '', name: notePath(hub, pathInNotes) };
}

/** The folder a path sits in, the empty path for the top. */
function folderOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** The last segment of a path. */
function baseOf(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1);
}

/**
 * The hubs the section draws, in the order the notes came in (the workspace's folder order), each
 * with the root of the same name; a hub no served root names is left out.
 */
export function noteGroups(hubs: readonly HubNotes[], roots: readonly FsRoot[]): NoteGroup[] {
    return hubs.flatMap((hub) => {
        const root = roots.find((one) => one.key === hub.root);
        return root === undefined ? [] : [{ hub, root }];
    });
}

/**
 * The entries of one folder of a hub's notes (a path under the hub's root), in the section's order.
 */
export function noteEntries(hub: HubNotes, path: string): FsEntry[] {
    const inside = inNotes(path, hub.folder);
    if (inside === null) return [];
    return hub.entries
        .filter((one) => folderOf(one.path) === inside)
        .map((one) => ({ name: baseOf(one.path), kind: one.kind, size: 0, mtime: one.modified }));
}

/**
 * A row that is a sentence, drawn under a group at a path no file can have under the notes folder
 * it speaks of (`folder`), and on its own at the top for a workspace with no hub.
 */
function saidRow(root: string, depth: number, text: string, retry: boolean, folder = ''): TreeRow {
    return {
        root,
        path: depth === 0 ? '\0' : `${folder}/\0`,
        name: text,
        kind: 'file',
        size: 0,
        depth,
        open: false,
        said: retry ? { text, retry: true } : { text }
    };
}

/** What a group says in its one row, or the empty text when it lists notes. */
function groupSays(hub: HubNotes, listed: boolean, t: Words): { text: string; retry: boolean } {
    if (hub.state === 'refused') return { text: t('notes.folder_refused'), retry: false };
    if (hub.state === 'unreadable') return { text: t('notes.failed', hub.error), retry: true };
    return { text: listed ? '' : t('files.notes_empty'), retry: false };
}

/**
 * The rows of the section: each group with the rows treeRows() makes under it from the folders
 * `expanded` holds open and the name being typed, and a group that lists nothing with its one row.
 */
export function noteRows(
    groups: readonly NoteGroup[],
    expanded: string[],
    naming: Naming | null,
    t: Words
): TreeRow[] {
    if (groups.length === 0) return [saidRow('', 0, t('notes.no_hub'), false)];
    return groups.flatMap(({ hub, root }) => {
        const rows = treeRows(
            [root],
            (_key, path) => noteEntries(hub, path),
            expanded,
            { path: hub.folder, name: root.key },
            naming
        );
        const head = rows.at(0);
        if (!head?.open) return rows;
        const says = groupSays(hub, rows.length > 1, t);
        if (says.text === '') return rows;
        return [...rows, saidRow(root.key, 1, says.text, says.retry, hub.folder)];
    });
}

/** The notes of a hub in the order the section lists them, as paths inside the folder. */
function notesListed(hub: HubNotes): string[] {
    return hub.entries.flatMap((one) =>
        one.kind === 'file' && isNote(one.path) ? [one.path] : []
    );
}

/** A note's path as the order file names it: without `.md`. */
function orderName(path: string): string {
    return path.slice(0, -NOTE_SUFFIX.length);
}

/**
 * The order after Alt+Up or Alt+Down on a note: the note one place up or down among the notes of
 * its folder, or null when it does not move (the first going up, the last going down, a path that
 * is no note of the hub).
 */
export function orderStepped(
    hub: HubNotes,
    path: string,
    direction: 'up' | 'down'
): string[] | null {
    const inside = inNotes(path, hub.folder);
    const listed = notesListed(hub);
    if (inside === null || !listed.includes(inside)) return null;
    const folder = listed.filter((one) => folderOf(one) === folderOf(inside));
    const at = folder.indexOf(inside);
    const next = direction === 'up' ? at - 1 : at + 1;
    if (next < 0 || next >= folder.length) return null;
    const other = folder[next];
    const swapped = listed.map((one) => (one === inside ? other : one === other ? inside : one));
    return swapped.map(orderName);
}

/**
 * The order after a drop of notes on a note of the same folder, before or after it, or null when
 * the drop reorders nothing: notes of another folder, a drop on one of the notes dropped.
 */
export function orderPlaced(
    hub: HubNotes,
    paths: readonly string[],
    onto: string,
    place: 'before' | 'after'
): string[] | null {
    const target = inNotes(onto, hub.folder);
    const moving = paths.map((one) => inNotes(one, hub.folder));
    const listed = notesListed(hub);
    if (target === null || !listed.includes(target) || moving.includes(target)) return null;
    if (moving.some((one) => one === null || !listed.includes(one))) return null;
    if (moving.some((one) => folderOf(one ?? '') !== folderOf(target))) return null;
    const kept = listed.filter((one) => !moving.includes(one));
    const at = kept.indexOf(target) + (place === 'after' ? 1 : 0);
    const next = [...kept.slice(0, at), ...(moving as string[]), ...kept.slice(at)];
    return next.every((one, index) => one === listed[index]) ? null : next.map(orderName);
}

/** The sentence a name is refused with, in the catalog's words. */
export function nameRefusalSentence(refusal: NameRefusal, t: Words): string {
    const message = nameRefusalMessage(refusal);
    return t(message.key, ...message.args);
}

/**
 * The sentence refusing a name typed in the Notes section's name input, which names one item of the
 * folder the input is in (a note's name read without `.md`, a folder's or another file's whole
 * name), so a `/` in it is refused as any character the rule refuses; the empty text for a name the
 * rule takes.
 */
export function typedRefusal(text: string, t: Words): string {
    const typed = text.trim();
    const made = noteName(isNote(typed) ? typed.slice(0, -NOTE_SUFFIX.length) : typed);
    return made.ok ? '' : nameRefusalSentence(made.refusal, t);
}

/**
 * The sentence refusing a path of a hub's root whose names land in its notes folder (`notes`, the
 * empty text for a root with none) and break the rule of the notes (a note's name read without
 * `.md`, a folder's or another file's whole name), and the empty text for a path the rule takes or
 * that lands nowhere in a notes folder.
 */
export function landingRefusal(notes: string, path: string, t: Words): string {
    const parts = path.split('/').filter((one) => one !== '');
    for (const [at, name] of parts.entries()) {
        if (inNotes(parts.slice(0, at).join('/'), notes) === null) continue;
        const made = noteName(isNote(name) ? name.slice(0, -NOTE_SUFFIX.length) : name);
        if (!made.ok) return nameRefusalSentence(made.refusal, t);
    }
    return '';
}
