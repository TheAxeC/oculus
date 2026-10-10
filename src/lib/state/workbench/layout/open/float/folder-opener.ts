// Layer 2, client state. The workbench: a page that belongs to one folder. This module makes the
// page's arrangement from the `workbench:` key of config/layout.yml, gives each of its tabs the
// folder, marks the arrangement's empty pane as the page's documents pane (`Pane.documents`, where
// a view opened from the workbench lands first), names the page, opens the item the page was opened
// for in that pane, and remakes the page for Reset layout. The layout store
// (state/workbench/layout/open/float/folder-store.ts) shows an open page, makes one from its kept
// layout, or asks this module for the arrangement; it knows nothing of the views.
//
// Each tab starts limited to the folder in the state its view reads: Files is rooted at it (`top`),
// Search is under it (`under`), Problems is scoped to its root and path (`scope` and `under`),
// Repositories and the sessions list hold it as `folder` (limit.ts), and LaTeX points at it in the
// folder-only shape `{ root, path, label }` that names the folder's first main file. A tab of a
// view that is not listed here starts as the arrangement gives it.

import { fields } from '../../../../../data/helpers/guards.ts';
import { nameOf } from '../../../../../data/helpers/files/paths.ts';
import { parseArrangement } from '../../../navigation/arrangement.ts';
import {
    markDocuments,
    restate,
    tabsOf,
    type FolderItem,
    type FolderLayout,
    type FolderRef
} from '../../index.ts';
import type { LayoutStore } from '../../../layout.svelte.ts';
import type { FsRoot } from '../../../../sources/explorer/view/place.ts';
import { withLimit } from '../../../../sources/explorer/view/limit.ts';
import { rootedState } from '../../../../sources/explorer/view/tab-roots.ts';

/** What one tab starts with: its layout state, and the state its view keeps in the ui store. */
type Start = { layout?: unknown; ui?: unknown };

/** What the workbench needs of the rest of the client. */
export type FolderPagesDeps = {
    /** The merged config, whose `workbench` key is the arrangement. */
    config: () => Record<string, unknown> | undefined;
    /** The roots this page serves, whose key a folder names. */
    roots: () => FsRoot[];
    layout: Pick<LayoutStore, 'openFolderPage' | 'resetFolderPage' | 'pages' | 'openView'>;
};

/** The workbench operations of a client. */
export type FolderPages = {
    /**
     * Show the workbench of a folder, made when none is open: named by `label` when the caller has
     * the item's name, else by the folder, and with the item opened in its documents pane when the
     * page is made new. The id of the page, or the empty text when the folder is under no served
     * root or the arrangement does not read.
     */
    open: (folder: FolderRef, opened?: { label?: string; item?: FolderItem }) => string;
    /** Make a workbench again from the arrangement; whether it was remade. */
    reset: (id: string) => boolean;
    /** Whether a workbench can be opened for a root: a served root's key. */
    served: (root: string) => boolean;
};

/** The words of a folder: the last name of its path, and the root's key for the root itself. */
function folderName(folder: FolderRef): string {
    return folder.path === '' ? folder.root : nameOf(folder.path);
}

/** What each view of the left pane starts with, given the folder. */
function startOf(view: string, folder: FolderRef): Start {
    const name = folderName(folder);
    switch (view) {
        case 'files':
            return {
                layout: { root: folder.root, path: folder.path, label: name },
                ui: rootedState(undefined, folder)
            };
        case 'search':
            return { ui: { root: folder.root, under: folder.path } };
        case 'problems':
            return { ui: { scope: folder.root, under: folder.path } };
        case 'repositories':
        case 'session-list':
            return { ui: withLimit(undefined, folder) };
        case 'latex':
            return { layout: { root: folder.root, path: folder.path, label: name } };
        default:
            return {};
    }
}

/** The arrangement given the folder: each tab restated, and the ui state each one starts with. */
function arranged(node: unknown, folder: FolderRef): FolderLayout | null {
    const made = parseArrangement(node);
    if (made === null) return null;
    let root = made.root;
    const states: Record<string, unknown> = {};
    for (const tab of tabsOf(root)) {
        const start = startOf(tab.view, folder);
        if (start.layout !== undefined) root = restate(root, tab.id, start.layout);
        if (start.ui !== undefined) states[tab.id] = start.ui;
    }
    return { workbench: { ...made, root: markDocuments(root) }, states };
}

export function createFolderPages(deps: FolderPagesDeps): FolderPages {
    const served = (root: string): boolean => deps.roots().some((one) => one.key === root);

    function make(folder: FolderRef): FolderLayout | null {
        return arranged(fields(deps.config()).workbench, folder);
    }

    function open(folder: FolderRef, opened: { label?: string; item?: FolderItem } = {}): string {
        if (!served(folder.root)) return '';
        const shown = deps.layout.openFolderPage({
            folder,
            label: opened.label ?? folderName(folder),
            item: opened.item,
            make: () => make(folder)
        });
        if (shown === null) return '';
        if (shown.how === 'made' && opened.item !== undefined) {
            deps.layout.openView(opened.item.view, opened.item.state, shown.id);
        }
        return shown.id;
    }

    function reset(id: string): boolean {
        const page = deps.layout.pages().find((one) => one.id === id);
        if (page?.folder === undefined) return false;
        const layout = make(page.folder);
        if (layout === null || !deps.layout.resetFolderPage(id, layout)) return false;
        if (page.item !== undefined) deps.layout.openView(page.item.view, page.item.state, id);
        return true;
    }

    return { open, reset, served };
}
