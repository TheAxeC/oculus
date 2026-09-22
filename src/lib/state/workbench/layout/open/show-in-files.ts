// Layer 2, client state. The file browser's ask: one path shown in the Files view of the page the
// reader is in.
//
// The ask is written into the Files instance's own state rather than acted on here: the folders on
// the way are read by the view, which is what draws them, and an ask written into the state is
// still there for a tab that mounts after it. It is its own module because it is the one part of
// the store that opens a named view for another part of the app rather than for the reader.

import { revealAsked } from '../../../sources/fs.ts';
import { findView } from '../../../client/instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import type { ViewId } from '../model.ts';
import { paneAt } from '../tree.ts';
import { focusedPane } from '../workbench.ts';

export type ShowInFiles = {
    showInFiles: (path: string, root?: string) => string;
};

export function createShowInFiles(
    access: LayoutAccess,
    attention: Attention,
    openView: (view: ViewId, state?: unknown, page?: string) => string
): ShowInFiles {
    /**
     * Show one path in the file browser. The Files tab of the page the reader is in is activated,
     * or one is opened there when the page has none, and it is asked to open the folders on the
     * way, select the path and scroll it into view.
     */
    function showInFiles(path: string, root?: string): string {
        const page = attention.touched().id;
        const tree = access.layout(page);
        const held = findView(tree, 'files', null);
        const focus = focusedPane(access.workbench(page));
        const shown = focus === null ? null : paneAt(tree, focus.path);
        // openView looks inside a maximised pane alone, which would open a second Files tab there
        // while the page's own one waits behind it; the panes are given back so that one is found.
        // A maximised pane that holds a Files tab of its own keeps the reader's layout and is used.
        if (held !== null && shown !== null && !shown.tabs.some((tab) => tab.view === 'files')) {
            access.restorePanes(page);
        }
        const id = openView('files', undefined, page);
        if (id === '') return '';
        access.ui.setInstanceState(id, revealAsked(access.ui.instanceState(id), path, root));
        return id;
    }

    return { showInFiles };
}
