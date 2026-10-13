// Layer 3, view partial of RootedTree.svelte. What one explorer tree is built from: the record it
// keeps its state in, the rows treeRows() draws over the listings and the open folders, the rows a
// typed filter draws instead, the listings that failed, the git decoration, the problem marks, the
// bookmark stars and the presses that write into the record. The Files view and a project card both
// build their tree from this, each from the roots it draws, the folder it is rooted at and the
// record it owns.
//
// Everything here is read from the owner's record (`filesViewOf`), so a record of the wrong shape
// is an empty tree, and a press writes nothing into a record that was cleared with its tab
// (tab-actions.ts).

import { onDestroy, untrack } from 'svelte';
import type { ClientState } from '$lib/state/client/context';
import {
    filesViewOf,
    filterRows,
    markedKeys,
    nestingRulesOf,
    shownOf,
    problemMarkOf,
    statusFold,
    treeRows,
    type FilesView,
    type FsEntry,
    type FsRoot,
    type ProblemMark,
    type RowRef,
    type TreeTop,
    unopened
} from '$lib/state/sources/fs';
import { fixedRootKeys, openFailures } from '$lib/state/sources/fs-transport';
import { addedLine } from '$lib/state/sources/explorer/acts/folders';
import { refusal } from '$lib/state/sources/explorer/acts/refusal';
import { selectPruned, selectionChanged } from '$lib/state/sources/explorer/acts/selection';
import { bookmarkActions } from './control/bookmark-actions';
import { tabActions } from './control/tab-actions';

/** The open workspace the page holds, and its name and folders. */
export function readWorkspace(client: ClientState) {
    const saved = $derived(client.fs.workspaces());
    const current = $derived({ name: saved.open?.name ?? '', roots: saved.folders });
    return {
        get saved() {
            return saved;
        },
        get current() {
            return current;
        }
    };
}

/** What a tree is drawn from. */
export type RootedInput = {
    /** The open workspace, whose folders a dragged row's absolute path and the root menu use. */
    workspace: ReturnType<typeof readWorkspace>;
    /** The key of the record the tree keeps its state in. */
    owner: () => string;
    /** The roots the tree draws. */
    roots: () => FsRoot[];
    /** The folder the tree is rooted at, drawn as its head, or null for the roots as they are. */
    top: () => TreeTop | null;
    /** The folder the row above the head moves to, or null when there is no such row. */
    up: () => RowRef | null;
    /** Whether the tree follows a session, whose roots no press can take off. */
    following?: () => boolean;
    /** The folders drawn open while the owner's record has never been opened (`unopened`). */
    unsaved?: () => string[];
};

export type RootedTree = ReturnType<typeof createRootedTree>;

/** Build the model of one tree. Called while a component is initialised, since it holds effects. */
export function createRootedTree(client: ClientState, input: RootedInput) {
    const {
        explorer,
        problems,
        appShell: { opens },
        fs: { bookmarks, entries, heldEntries, listing, readFileKind },
        layout: { armKeep, askFocus, disarmKeep, keepPreview, openView, showInFiles },
        selectors: { configMap, gitFor, repositories },
        ui: { instanceState }
    } = client;

    /**
     * Whether the tab holding this tree is gone. A press whose file is still being read when the
     * tab closes opens its tab afterwards and arms no keep, and the keep this tree armed ends with
     * the tab.
     */
    let closed = false;
    onDestroy(() => {
        closed = true;
        disarmKeep(input.owner());
    });

    /** The store calls a file or a bookmark is opened through. */
    const opener = {
        openView,
        keepPreview,
        readFileKind,
        showInFiles,
        opens,
        armKeep: (id: string, pressedAt: number) => {
            if (!closed) armKeep(id, input.owner(), pressedAt);
        },
        askFocus: (id: string) => {
            if (!closed) askFocus(id);
        }
    };

    const record = $derived(instanceState(input.owner()));
    const view = $derived.by((): FilesView => {
        const kept = filesViewOf(record);
        return input.unsaved !== undefined && unopened(record)
            ? { ...kept, expanded: input.unsaved() }
            : kept;
    });
    /** What this tree's listings show beside the default: its two toggles. */
    const listed = $derived(shownOf(view));
    /** The nesting rules the tree draws with: the catalog's, or none while File Nesting is off. */
    const nesting = $derived(view.nesting ? nestingRulesOf(configMap()) : []);

    /** The entries of one folder already read, as this tree's toggles list them. */
    function held(root: string, path: string): FsEntry[] | null {
        return heldEntries(root, path, listed);
    }

    const rows = $derived(
        treeRows(
            input.roots(),
            (root, path) => entries(root, path, listed),
            view.expanded,
            input.top(),
            view.naming,
            { held, nesting, up: input.up() }
        )
    );
    const filtering = $derived(view.filter.trim() !== '');
    /** What the typed filter matches among the folders already read, or the tree when none is. */
    const shown = $derived(
        filtering ? filterRows(input.roots(), held, view.filter, input.top(), view.fuzzy) : rows
    );
    /** The roots the reader cannot take off. */
    const fixed = $derived(
        fixedRootKeys(input.workspace.current.roots, input.following?.() ?? false)
    );
    /**
     * What git says of the paths under the repositories the page carries. A repository is read
     * once, through the root that shows it: its state's paths are relative to its top folder, so a
     * second root inside the same repository would put them under the wrong folder.
     */
    const fold = $derived(
        statusFold(
            repositories('all').flatMap((group) => {
                const git = gitFor(group.shown);
                return git !== null && git.repository && git.error === null
                    ? [{ dir: group.base, git }]
                    : [];
            })
        )
    );
    /** What the Problems view counts for a row: its errors and warnings, from the store's fold. */
    function problemOf(root: string, path: string, kind: 'file' | 'dir'): ProblemMark | null {
        return problemMarkOf(
            kind === 'dir' ? problems.folderCounts(root, path) : problems.fileCounts(root, path),
            kind
        );
    }

    const marks = $derived(bookmarks());
    /** The row keys a bookmark of the reader's own names, which the tree draws its star from. */
    const marked = $derived(markedKeys(marks.entries));
    /**
     * The open folders on screen the server would not list. Without this a root whose directory
     * has moved is drawn as an open folder holding nothing, which is the one thing it is not. Only
     * a drawn row is asked: a folder remembered as open under a closed parent, or under a root the
     * workspace no longer has, is neither fetched nor named.
     */
    const failures = $derived(
        openFailures(rows, (root, path) => listing(root, path, listed).error)
    );

    const tab = tabActions({
        client,
        id: input.owner,
        view: () => view,
        listed: () => listed,
        rows: () => rows,
        shownRoots: input.roots,
        top: input.top,
        filtering: () => filtering
    });
    const marking = bookmarkActions({
        client,
        id: input.owner,
        entries: () => marks.entries,
        tab
    });

    // A refresh that no longer lists a selected row takes it out of the selection.
    $effect(() => {
        const now = { selected: view.selected, selection: view.selection, anchor: view.anchor };
        const next = selectPruned(now, held);
        if (selectionChanged(now, next)) untrack(() => tab.patch(next));
    });

    /**
     * Add Folder to Workspace: the panel's folders become roots, and the line says what was left.
     */
    async function addFolders(): Promise<void> {
        const owner = input.owner();
        const answer = await explorer.addFolders();
        tab.answerAt(owner, { note: addedLine(answer, refusal) });
    }

    return {
        opener,
        tab,
        marking,
        held,
        problemOf,
        addFolders,
        get view() {
            return view;
        },
        get listed() {
            return listed;
        },
        get rows() {
            return rows;
        },
        get shown() {
            return shown;
        },
        get filtering() {
            return filtering;
        },
        get fixed() {
            return fixed;
        },
        get fold() {
            return fold;
        },
        get marks() {
            return marks;
        },
        get marked() {
            return marked;
        },
        get failures() {
            return failures;
        }
    };
}
