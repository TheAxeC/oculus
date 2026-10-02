// Layer 3, view partial. Which view a file of the file browser opens in, and opening it there: a
// text file in the source tab, which is where it is read and written, an HTML file in the document
// view, and a picture, a PDF or anything else in the file view; the same tab opens in the pane
// being read or, for Open to the Side, in a new pane beside it.
//
// Whether a file is text is its own first bytes, so a row's kind is awaited before a tab is opened.
// A bookmark opens through documentState for a document, the way the rail opens one, so a bookmark
// pressed here and the same one pressed there are the one tab. The store calls are passed in, so
// the rule reads the same whichever client it runs in.

import type { Entry } from '$lib/state/boards/collection';
import {
    bookmarkRef,
    nameOf,
    typeOfFile,
    type BookmarkKind,
    type TreeRow
} from '$lib/state/sources/fs';
import { documentState } from '$lib/state/workbench/layout';
import { sourceTabState } from '$lib/state/sessions/source.svelte';
import type { ClientState } from '$lib/state/client/context';

/** The store calls opening a file needs. */
export type Opener = {
    openView: ClientState['layout']['openView'];
    keepPreview: ClientState['layout']['keepPreview'];
    readFileKind: ClientState['fs']['readFileKind'];
    /** Show a folder in the Files view of the page, open and selected, for a folder bookmark. */
    showInFiles?: ClientState['layout']['showInFiles'];
};

/** The store calls opening a file beside the pane being read needs. */
export type BesideOpener = {
    openBeside: ClientState['layout']['openBeside'];
    readFileKind: ClientState['fs']['readFileKind'];
};

/** The view a file of one kind opens in, and the state that tab is given. */
function tabOf(kind: string, row: TreeRow): { view: string; state: unknown } {
    const label = nameOf(row.path);
    if (kind === 'html') {
        return {
            view: 'document',
            state: documentState({ label, root: row.root, path: row.path })
        };
    }
    if (kind === 'text') return { view: 'source', state: sourceTabState(row.root, row.path) };
    return { view: 'file', state: { root: row.root, path: row.path, label, size: row.size } };
}

/**
 * Open one file as its own tab, in the view that can show it. A single click opens the pane's
 * preview tab and a double click keeps the tab it opened.
 */
export async function openRow(opener: Opener, row: TreeRow, preview: boolean): Promise<void> {
    const type = await opener.readFileKind(row.root, row.path);
    const tab = tabOf(type.kind, row);
    const id = opener.openView(tab.view, tab.state, undefined, { preview });
    if (!preview) opener.keepPreview(id);
}

/** Open one file in the view that can show it, in a new pane beside the one being read. */
export async function openRowBeside(opener: BesideOpener, row: TreeRow): Promise<void> {
    const type = await opener.readFileKind(row.root, row.path);
    const tab = tabOf(type.kind, row);
    opener.openBeside(tab.view, tab.state);
}

/**
 * Open what one bookmark names, under the label the reader gave it: a folder is shown open and
 * selected in the Files view of the page, a file opens in the view that can show it.
 */
export function openBookmark(opener: Opener, entry: Entry & { kind?: BookmarkKind }): void {
    const ref = bookmarkRef(entry.fields);
    if (ref === null) return;
    if (entry.kind === 'folder' && opener.showInFiles !== undefined) {
        opener.showInFiles(ref.path, ref.root, true);
        return;
    }
    if (typeOfFile(ref.path).kind === 'html') {
        opener.openView('document', documentState({ label: entry.title, ...ref }));
        return;
    }
    opener.openView('file', { ...ref, label: entry.title });
}
