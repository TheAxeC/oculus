// Layer 3, view partial of Notes.svelte. What the Notes section's tree is built from and what its
// presses write: the notes of every hub (fs.svelte.ts's `notes`) as the rows of
// state/sources/explorer/notes/note-tree.ts, the record the tree keeps its open folders, its
// selection and the name being typed in (`notesTreeKey`, under the Files tab's own key, so it goes
// with the tab), and the three things only this tree has: a typed name made a note, the order the
// notes keep, and the New Note and New Folder of each group.
//
// A name typed in the tree names one item, so the name rule of the notes refuses a `/` in it as any
// character it refuses (note-tree.ts's typedRefusal). A new file's typed name is a note's: `.md` is
// added unless it ends so, and a hub whose notes folder is not there yet gets it made by the same
// create (note-tree.ts's noteMaking), which History undoes with the note. The note made opens in a
// source tab.
//
// A drag of notes onto a note of their own folder, and Alt+Up and Alt+Down on a note, write the
// hub's order (`order-notes`); a drag onto a folder moves through the file operations as in any
// tree. What a press answered is said on the Files view's line, in the instance it was made in.

import { untrack } from 'svelte';
import type { ClientState } from '$lib/state/client/context';
import {
    filesViewOf,
    markedKeys,
    notesTreeKey,
    patchedFilesView,
    rowKey,
    setExpanded,
    treeKey,
    unopened,
    type FilesView,
    type RowRef,
    type TreeRow
} from '$lib/state/sources/fs';
import { namingStarted, type Naming } from '$lib/state/sources/explorer/naming';
import { selectOnly } from '$lib/state/sources/explorer/acts/selection';
import { refusal } from '$lib/state/sources/explorer/acts/refusal';
import {
    NOTES_FOLDER,
    NOTE_SUFFIX,
    noteEntries,
    noteGroups,
    noteMaking,
    noteRows,
    orderPlaced,
    orderStepped,
    typedRefusal,
    type NoteGroup
} from '$lib/state/sources/explorer/notes/note-tree';
import { noteOf } from '$lib/state/sources/explorer/notes/note-index';
import type { Place } from '$lib/state/sources/explorer/ops.svelte';
import { t } from '$lib/state/shared/words/text';
import { openRow, type Opener } from '$lib/views/shared/explorer/opening';
import { bookmarkActions } from '$lib/views/shared/explorer/control/bookmark-actions';
import type { RowOrder } from '$lib/views/shared/explorer/tree/control/dragging.svelte';
import type { NamingHooks } from '$lib/views/shared/explorer/tree/menu/row-ops';
import { openSourceFile } from '$lib/views/shared/links/source-file';

/** The folder a path sits in. */
function folderOf(path: string): string {
    return path.slice(0, Math.max(0, path.lastIndexOf('/')));
}

export type NotesSectionDeps = {
    /** The Files tab the section is drawn in. */
    owner: () => string;
    /** Say what a press answered on the Files view's line of the instance it was made in. */
    say: (owner: string, note: string) => void;
};

/** Build the section's tree. Called while a component is initialised, since it holds an effect. */
export function createNotesSection(client: ClientState, deps: NotesSectionDeps) {
    const { fs, layout, ui } = client;
    const key = $derived(notesTreeKey(deps.owner()));
    const held = $derived(fs.notes());
    const groups = $derived(noteGroups(held.hubs, fs.roots()));
    /** The group rows' keys, open the first time the section is drawn. */
    const heads = $derived(groups.map(({ root }) => treeKey(root.key, NOTES_FOLDER)));
    const record = $derived(ui.instanceState(key));
    const view = $derived.by((): FilesView => {
        const kept = filesViewOf(record);
        return unopened(record) ? { ...kept, expanded: heads } : kept;
    });
    const rows = $derived(noteRows(groups, view.expanded, view.naming, t));
    const marked = $derived(markedKeys(fs.bookmarks().entries));

    // A record never opened keeps its groups open from then on, which also makes the record the
    // tree's own writes need.
    $effect(() => {
        const open = heads;
        untrack(() => {
            const kept = ui.instanceState(key);
            if (unopened(kept) && open.length > 0) {
                ui.setInstanceState(key, patchedFilesView(kept, { expanded: open }));
            }
        });
    });

    /**
     * Write part of the tree's record, with the folders it draws open, which a record never opened
     * holds only once this is written.
     */
    function patch(part: Partial<FilesView>): void {
        const held = ui.instanceState(key);
        ui.setInstanceState(key, patchedFilesView(held, { expanded: view.expanded, ...part }));
    }

    /** The group a root key draws. */
    function groupOf(root: string): NoteGroup | undefined {
        return groups.find((one) => one.root.key === root);
    }

    /** The calls a file of the tree opens through. */
    const opener: Opener = {
        openView: layout.openView,
        keepPreview: layout.keepPreview,
        readFileKind: fs.readFileKind,
        opens: client.appShell.opens,
        armKeep: (id, pressedAt) => layout.armKeep(id, deps.owner(), pressedAt),
        askFocus: layout.askFocus
    };

    const marking = bookmarkActions({
        client,
        id: deps.owner,
        entries: () => fs.bookmarks().entries,
        tab: { answerAt: (owner, part) => deps.say(owner, part.note) }
    });

    /** Start the name of a new note or folder in a folder of a hub's notes. */
    function start(mode: 'file' | 'folder', folder: RowRef): void {
        patch({ ...namingStarted(view.expanded, mode, folder), note: '' });
    }

    /** The folder the section head's New Note writes into: the primary hub's, else the first's. */
    const headHub = $derived(groups.find((one) => one.hub.primary) ?? groups.at(0));

    const naming: NamingHooks = {
        refuse: (text: string) => typedRefusal(text, t),
        making: (at: Naming, text: string) => {
            const group = groupOf(at.root);
            const typed = text.trim();
            const name =
                at.mode === 'file' && !typed.toLowerCase().endsWith(NOTE_SUFFIX)
                    ? `${typed}${NOTE_SUFFIX}`
                    : typed;
            if (group === undefined || at.path !== NOTES_FOLDER) {
                return { into: { root: at.root, path: at.path }, name };
            }
            const making = noteMaking(group.hub, name);
            return { into: { root: at.root, path: making.into }, name: making.name };
        },
        entries: (root: string, path: string) => {
            const group = groupOf(root);
            return group === undefined ? null : noteEntries(group.hub, path);
        },
        made: (file: Place) => {
            if (file.path.toLowerCase().endsWith(NOTE_SUFFIX)) {
                openSourceFile(client, { root: file.root, path: file.path });
            }
        }
    };

    /** Write a hub's order and say a refusal. */
    async function order(root: string, paths: string[] | null): Promise<void> {
        if (paths === null) return;
        const owner = deps.owner();
        const answer = await fs.orderNotes(root, paths, { said: true });
        deps.say(owner, answer.ok ? '' : refusal(answer.error ?? ''));
    }

    /** Whether a row is a note of the section, in a hub whose notes read. */
    function isNoteRow(row: RowRef & { kind?: string }): boolean {
        return row.kind !== 'dir' && noteOf(held.hubs, row.root, row.path) !== null;
    }

    const rowOrder: RowOrder = {
        takes: (moving, onto) =>
            isNoteRow(onto) &&
            moving.length > 0 &&
            moving.every(
                (one) =>
                    one.root === onto.root &&
                    one.path !== onto.path &&
                    isNoteRow(one) &&
                    folderOf(one.path) === folderOf(onto.path)
            ),
        place: (moving, onto, place) => {
            const group = groupOf(onto.root);
            if (group === undefined) return;
            const paths = moving.map((one) => one.path);
            void order(onto.root, orderPlaced(group.hub, paths, onto.path, place));
        },
        step: (row, direction) => {
            const group = groupOf(row.root);
            if (group === undefined || !isNoteRow(row)) return false;
            void order(row.root, orderStepped(group.hub, row.path, direction));
            return true;
        }
    };

    return {
        rowOrder,
        naming,
        marking,
        start,
        patch,
        /** Open a file of the tree, as the Files tree opens one; a sentence row opens nothing. */
        open: (row: TreeRow, preview: boolean, pressedAt?: number) => {
            if (row.said === undefined && row.kind === 'file')
                void openRow(opener, row, preview, pressedAt);
        },
        select: (row: RowRef) => patch({ ...selectOnly(row), revealed: null }),
        toggle: (row: TreeRow) =>
            patch({ expanded: setExpanded(view.expanded, rowKey(row), !row.open), note: '' }),
        /** The section head's New Note: into the primary hub, else the first. */
        newNote: () => {
            const group = headHub;
            if (group !== undefined) start('file', { root: group.root.key, path: NOTES_FOLDER });
        },
        get key() {
            return key;
        },
        get view() {
            return view;
        },
        get rows() {
            return rows;
        },
        get groups() {
            return groups;
        },
        get notes() {
            return held;
        },
        get marked() {
            return marked;
        },
        get headHub() {
            return headHub;
        }
    };
}
