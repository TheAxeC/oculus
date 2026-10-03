// Layer 3, view partial of rooted-tree.svelte.ts. What the bookmark star on a row and the bookmark
// form write: a file bookmarked or the bookmark on it taken away, the form opened over a bookmark
// or closed, and the form closed once its own answer says so.
//
// A write closes its form on its answer, which may land after the reader has opened another form,
// opened the same one again or closed the tab. The instance id and the forms are taken before the
// request goes, and the answer closes only that opening in that instance (formSettled).

import type { ClientState } from '$lib/state/client/context';
import {
    editShown,
    filesViewOf,
    formSettled,
    formShown,
    markLabel,
    type FilesForms,
    type FilesView,
    type TreeRow
} from '$lib/state/sources/fs';
import { bookmarkAt, bookmarkTitles, markRefusal } from '$lib/state/sources/fs-transport';
import { t } from '$lib/state/shared/words/text';
import type { TabActions } from './tab-actions';

export type BookmarkActionsDeps = {
    client: ClientState;
    id: () => string;
    view: () => FilesView;
    entries: () => ReturnType<ClientState['fs']['bookmarks']>['entries'];
    tab: Pick<TabActions, 'patchAt' | 'patch' | 'answerAt'>;
};

export function bookmarkActions(deps: BookmarkActionsDeps) {
    const { client, tab } = deps;

    /**
     * Bookmark one file or folder, or take the bookmark on it away again. The label is the name, or
     * its path under the root when another bookmark already carries that name; a label that is
     * taken even so is refused rather than written over, and the refusal is said.
     */
    async function bookmark(row: TreeRow): Promise<void> {
        const owner = deps.id();
        const found = bookmarkAt(deps.entries(), row.root, row.path);
        const label = markLabel(row, bookmarkTitles(deps.entries()));
        const answer =
            found === null
                ? await client.fs.addBookmark({ label, root: row.root, path: row.path })
                : await client.fs.removeBookmark(found.id);
        const reason = markRefusal(answer);
        tab.answerAt(owner, { note: reason === '' ? '' : t('files.bookmark_failed', reason) });
    }

    /**
     * Close the form an answer was for in the instance it was sent from, if it is still open as it
     * was. The bookmark form asks for it once Cancel, a save or a delete is done with it, when the
     * form has forgotten its own draft; a form the reader has since left is not closed.
     */
    function settle(owner: string, asked: FilesForms): void {
        const closed = formSettled(filesViewOf(client.ui.instanceState(owner)), asked);
        if (closed !== null) tab.patchAt(owner, closed);
    }

    /** Move to the forms a press asks for, clearing the lines that answered the last press. */
    function move(next: FilesForms): void {
        client.fs.shiftForms(deps.id(), deps.view(), next);
        tab.patch({ note: '', said: '' });
    }

    function showMarkForm(): void {
        move(formShown(deps.view(), 'bookmark'));
    }

    /** Open the entry form over one bookmark, or close it when it is already that one's. */
    function edit(id: string): void {
        move(editShown(deps.view(), id));
    }

    /**
     * Open the bookmark form over the id its own save gave the bookmark. The form is drawn per
     * instance and per opening, and a rename moves neither, so the form stays as it is with what
     * was typed into it; the bookmark it edits is the one the file now holds, so the close of a
     * form over a bookmark that is gone has nothing to close.
     */
    function renameMark(owner: string, id: string): void {
        tab.patchAt(owner, { editing: id });
    }

    return { bookmark, settle, showMarkForm, edit, renameMark };
}
