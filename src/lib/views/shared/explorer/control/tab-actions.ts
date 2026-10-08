// Layer 3, view partial of rooted-tree.svelte.ts. What a press on an explorer tree writes into the
// tree's own record (a Files tab's instance state, or the record a project card keeps): part of the
// record written for this tree or for the one an answer was sent from, a folder opened or closed, a
// row selected, one of the tree's toggles flipped, a section opened or closed, every folder closed
// (and, when none is open, every root), and the name of a new file or folder started.

import type { ClientState } from '$lib/state/client/context';
import {
    collapsedAll,
    patchedFilesView,
    rowKey,
    setExpanded,
    shownOf,
    type FilesView,
    type FsRoot,
    type RowRef,
    type TreeRow
} from '$lib/state/sources/fs';
import { newItemFolder, namingStarted } from '$lib/state/sources/explorer/naming';
import { selectOnly } from '$lib/state/sources/explorer/acts/selection';
import { sectionFlipped } from '$lib/state/sources/explorer/sections/section-state';

export type TabActionsDeps = {
    client: ClientState;
    /** The id of the Files tab on screen. */
    id: () => string;
    view: () => FilesView;
    /** What the tab's listings show beside the default: its two toggles. */
    listed: () => ReturnType<typeof shownOf>;
    rows: () => TreeRow[];
    shownRoots: () => FsRoot[];
    /** The folder a rooted tab is drawn from, or null. */
    top: () => { path: string } | null;
    filtering: () => boolean;
};

export type TabActions = ReturnType<typeof tabActions>;

/** What every press that acts clears: the refusal line. */
const LINES_CLEARED = { note: '' } as const;

export function tabActions(deps: TabActionsDeps) {
    const { client } = deps;
    const { instanceState, setInstanceState } = client.ui;

    /** Write part of what one instance remembers, keeping the rest of it as it was. */
    function patchAt(id: string, part: Partial<FilesView>): void {
        setInstanceState(id, patchedFilesView(instanceState(id), part));
    }

    /** Write part of what the instance on screen remembers, for a press made on it now. */
    function patch(part: Partial<FilesView>): void {
        patchAt(deps.id(), part);
    }

    /**
     * Say what a request answered in the instance it was sent from, which the reader may have
     * switched away from by the time it lands. A tab closed meanwhile has no record left, and is
     * not given one back for a line nobody will see.
     */
    function answerAt(owner: string, part: Pick<Partial<FilesView>, 'note'>): void {
        if (owner !== deps.id() && instanceState(owner) === undefined) return;
        patchAt(owner, part);
    }

    /**
     * Open or close one folder. While a filter draws the tree, a folder is drawn open because the
     * filter holds it so, and a press on it writes nothing, so clearing the filter gives back the
     * folders that were open before it.
     */
    function toggle(row: TreeRow): void {
        if (deps.filtering()) return;
        patch({
            expanded: setExpanded(deps.view().expanded, rowKey(row), !row.open),
            ...LINES_CLEARED
        });
    }

    /** Select one row; the outcome line of an ask to show a path is about the row it selected. */
    function selectRow(row: RowRef): void {
        patch({ ...selectOnly({ root: row.root, path: row.path }), revealed: null });
    }

    /** Flip one of the tab's toggles, and read every folder held under the pair it now names. */
    function flip(which: 'hidden' | 'ignored' | 'nesting'): void {
        if (which === 'nesting') {
            patch({ nesting: !deps.view().nesting, ...LINES_CLEARED });
            return;
        }
        const listed = deps.listed();
        const next = { ...listed, [which]: !listed[which] };
        client.fs.relist(next);
        patch({ ...next, ...LINES_CLEARED });
    }

    /** Open or close one section, or the workspace header's roots. */
    function toggleSection(id: string): void {
        patch({ ...sectionFlipped(deps.view(), id), ...LINES_CLEARED });
    }

    /**
     * Close every folder under the roots the tree draws, leaving each root's own row open; with
     * none open to close, the roots close too (place.ts's collapsedAll).
     */
    function collapseAll(): void {
        patch({
            expanded: collapsedAll(
                deps.view().expanded,
                deps.shownRoots().map((root) => root.key),
                deps.top()?.path,
                deps.filtering()
            ),
            ...LINES_CLEARED
        });
    }

    /** Start the name of a new file or folder in the selected folder, else in the first root. */
    function newItem(mode: 'file' | 'folder'): void {
        const view = deps.view();
        const into = newItemFolder(deps.rows(), view.selected, deps.shownRoots());
        if (into === null) return;
        patch({ ...namingStarted(view.expanded, mode, into), ...LINES_CLEARED });
    }

    return {
        patchAt,
        patch,
        answerAt,
        toggle,
        selectRow,
        flip,
        toggleSection,
        collapseAll,
        newItem
    };
}
