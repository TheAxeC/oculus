// Layer 3, view partial. Which view a file of the file browser opens in, and opening it there: a
// text file in the source tab, which is where it is read and written, an HTML file in the document
// view, and a picture, a PDF or anything else in the file view; the same tab opens in the pane
// being read or, for Open to the Side, in a new pane beside it. A file the route says is gone also
// opens in the source tab, which says it cannot be opened and offers to read it again.
//
// Whether a file is text is its own first bytes, so a row's kind is awaited before a tab is opened.
// A bookmark opens through documentState for a document, the way the rail opens one, so a bookmark
// pressed here and the same one pressed there are the one tab. The store calls are passed in, so
// the rule reads the same whichever client it runs in.

import type { Entry } from '$lib/state/boards/collection';
import { bookmarkRef, typeOfFile, type BookmarkKind, type TreeRow } from '$lib/state/sources/fs';
import { documentState, tabForKind, tabWithEditor } from '$lib/state/workbench/layout';
import type { ClientState } from '$lib/state/client/context';

/** The store calls opening a file needs. */
export type Opener = {
    openView: ClientState['layout']['openView'];
    keepPreview: ClientState['layout']['keepPreview'];
    readFileKind: ClientState['fs']['readFileKind'];
    /**
     * Show a folder in the Files view of the page, open and selected, for a folder or root
     * bookmark.
     */
    showInFiles?: ClientState['layout']['showInFiles'];
    /** What opening a file asks of the apps: the apps folders and the custom editors. */
    opens: ClientState['appShell']['opens'];
    /**
     * Let the next press on the opened preview tab keep it. A press that opened the tab is a first
     * click, and the second click of a double click lands on the tab, not on the row.
     */
    armKeep?: (id: string, pressedAt: number) => void;
    /** Give the keyboard to a tab a pointer press kept, once its pane draws it. */
    askFocus?: (id: string) => void;
};

/** The store calls opening a file beside the pane being read needs. */
export type BesideOpener = {
    openBeside: ClientState['layout']['openBeside'];
    readFileKind: ClientState['fs']['readFileKind'];
    /** What opening a file asks of the apps: the apps folders and the custom editors. */
    opens: ClientState['appShell']['opens'];
};

/**
 * Open a file as a page in the Document view, or as source text when it lies in an apps folder.
 * Every opener of a page that does not know the file's kind (a project's documents, an entry's
 * link, a project's README) goes through here, so a page of an app is never run in the
 * Document view.
 */
export function openPage(
    client: Pick<ClientState, 'appShell' | 'layout'>,
    page: { root: string; path: string; label: string }
): string {
    const tab = tabForKind('html', page.root, page.path, undefined, client.appShell.opens);
    return client.layout.openView(
        tab.view,
        tab.view === 'document' ? documentState(page) : tab.state
    );
}

/**
 * Open one file as its own tab, in the view that can show it. A single click opens the pane's
 * preview tab and a double click keeps the tab it opened. A press passes the time it was made at
 * (`pressedAt`, in the timeline of `performance.now()`): the preview tab a single press opens then
 * keeps the next press on the tab for as long as a double click's second press can take, and the
 * tab a double click keeps takes the keyboard. A key that opens a kept tab passes no time, and the
 * keyboard stays where it is.
 */
export async function openRow(
    opener: Opener,
    row: TreeRow,
    preview: boolean,
    pressedAt?: number
): Promise<void> {
    const type = await opener.readFileKind(row.root, row.path);
    const tab = tabForKind(type.kind, row.root, row.path, row.size, opener.opens);
    const id = opener.openView(tab.view, tab.state, undefined, { preview });
    if (!preview) {
        opener.keepPreview(id);
        if (pressedAt !== undefined) opener.askFocus?.(id);
    } else if (pressedAt !== undefined) opener.armKeep?.(id, pressedAt);
}

/** Open one file in the view that can show it, in a new pane beside the one being read. */
export async function openRowBeside(opener: BesideOpener, row: TreeRow): Promise<void> {
    const type = await opener.readFileKind(row.root, row.path);
    const tab = tabForKind(type.kind, row.root, row.path, row.size, opener.opens);
    opener.openBeside(tab.view, tab.state);
}

/** The store calls Open With... needs. */
export type WithOpener = Pick<Opener, 'openView' | 'keepPreview'> & {
    chooseEditor: ClientState['appShell']['chooseEditor'];
};

/**
 * Open a file in the editor the reader chooses: Text Editor or one of the custom editors that
 * match it. The tab is kept, as a double click keeps one. Nothing opens when the pick is dismissed.
 */
export async function openWith(opener: WithOpener, row: TreeRow): Promise<void> {
    const choice = await opener.chooseEditor(row.root, row.path);
    if (choice === null) return;
    const tab = tabWithEditor(choice, row.root, row.path);
    opener.keepPreview(opener.openView(tab.view, tab.state, undefined, { preview: false }));
}

/**
 * Open what one bookmark names, under the label the reader gave it: a folder is shown open and
 * selected in the Files view of the page, and so is a root's top (the empty path), whether or not
 * the root is served, since the Files view says when it is not. A file opens in the view that can
 * show it.
 */
export function openBookmark(opener: Opener, entry: Entry & { kind?: BookmarkKind }): void {
    const ref = bookmarkRef(entry.fields);
    if (ref === null) return;
    if ((entry.kind === 'folder' || ref.path === '') && opener.showInFiles !== undefined) {
        opener.showInFiles(ref.path, ref.root, true);
        return;
    }
    const kind = typeOfFile(ref.path).kind;
    const { holds, editorFor } = opener.opens;
    if (kind === 'html' || holds(ref.root, ref.path) || editorFor(ref.root, ref.path) !== null) {
        const tab = tabForKind(kind, ref.root, ref.path, undefined, opener.opens);
        const state =
            tab.view === 'document' ? documentState({ label: entry.title, ...ref }) : tab.state;
        opener.openView(tab.view, state);
        return;
    }
    opener.openView('file', { ...ref, label: entry.title });
}
