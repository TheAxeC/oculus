// Layer 3, view partial. Which view a file of the file browser opens in, and opening it there: a
// text file in the source tab, which is where it is read and written, an HTML file in the document
// view, and a picture, a PDF or anything else in the file view.
//
// Whether a file is text is its own first bytes, so a row's kind is awaited before a tab is opened.
// A bookmark opens through documentState for a document, the way the rail opens one, so a bookmark
// pressed here and the same one pressed there are the one tab. The store calls are passed in, so
// the rule reads the same whichever client it runs in.

import type { Entry } from '$lib/state/boards/collection';
import { nameOf, typeOfFile, type TreeRow } from '$lib/state/sources/fs';
import { documentState } from '$lib/state/workbench/layout';
import { sourceTabState } from '$lib/state/sessions/source.svelte';
import type { ClientState } from '$lib/state/client/context';

/** The store calls opening a file needs. */
export type Opener = {
    openView: ClientState['layout']['openView'];
    keepPreview: ClientState['layout']['keepPreview'];
    readFileKind: ClientState['fs']['readFileKind'];
};

/**
 * Open one file as its own tab, in the view that can show it. A single click opens the pane's
 * preview tab and a double click keeps the tab it opened.
 */
export async function openRow(opener: Opener, row: TreeRow, preview: boolean): Promise<void> {
    const label = nameOf(row.path);
    const type = await opener.readFileKind(row.root, row.path);
    const id =
        type.kind === 'html'
            ? opener.openView(
                  'document',
                  documentState({ label, root: row.root, path: row.path }),
                  undefined,
                  { preview }
              )
            : type.kind === 'text'
              ? opener.openView('source', sourceTabState(row.root, row.path), undefined, {
                    preview
                })
              : opener.openView(
                    'file',
                    { root: row.root, path: row.path, label, size: row.size },
                    undefined,
                    { preview }
                );
    if (!preview) opener.keepPreview(id);
}

/** Open the file one bookmark names, under the label the reader gave it. */
export function openBookmark(opener: Opener, entry: Entry): void {
    const root = entry.fields.root;
    const path = entry.fields.path;
    if (typeof root !== 'string' || typeof path !== 'string') return;
    const mark = { label: entry.title, root, path };
    if (typeOfFile(path).kind === 'html') {
        opener.openView('document', documentState(mark));
        return;
    }
    opener.openView('file', { root, path, label: entry.title });
}
