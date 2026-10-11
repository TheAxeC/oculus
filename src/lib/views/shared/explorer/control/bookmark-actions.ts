// Layer 3, view partial of rooted-tree.svelte.ts. What the bookmark star on a row and the bookmark
// rows of the Files view write: a file, folder or root bookmarked or the bookmark on it taken
// away, a bookmark renamed, and a bookmark removed from its row. Each answer is said on the refusal
// line of the instance the press was made in, which the reader may have switched away from by the
// time it lands.

import type { ClientState } from '$lib/state/client/context';
import { markLabel, type TreeRow } from '$lib/state/sources/fs';
import { bookmarkAt, bookmarkTitles, markRefusal } from '$lib/state/sources/fs-transport';
import { t } from '$lib/state/shared/words/text';
import type { TabActions } from './tab-actions';

export type BookmarkActionsDeps = {
    client: ClientState;
    id: () => string;
    entries: () => ReturnType<ClientState['fs']['bookmarks']>['entries'];
    tab: Pick<TabActions, 'answerAt'>;
};

export function bookmarkActions(deps: BookmarkActionsDeps) {
    const { client, tab } = deps;

    /** Say what a bookmark write answered, in the instance it was sent from. */
    function said(owner: string, answer: Parameters<typeof markRefusal>[0]): void {
        const reason = markRefusal(answer);
        tab.answerAt(owner, { note: reason === '' ? '' : t('files.bookmark_failed', reason) });
    }

    /**
     * Bookmark one file, folder or root, or take the bookmark on it away again. The label is the
     * name, or its path under the root when another bookmark already carries that name; a label
     * that is taken even so (a root's name has no path under the root) is refused rather than
     * written over, and the refusal is said.
     */
    async function bookmark(row: TreeRow): Promise<void> {
        const owner = deps.id();
        const found = bookmarkAt(deps.entries(), row.root, row.path);
        const label = markLabel(row, bookmarkTitles(deps.entries()));
        said(
            owner,
            found === null
                ? await client.fs.addBookmark({ label, root: row.root, path: row.path })
                : await client.fs.removeBookmark(found.id)
        );
    }

    /** Give one bookmark another label; the server refuses a label another bookmark holds. */
    async function rename(id: string, label: string): Promise<void> {
        const owner = deps.id();
        said(owner, await client.fs.renameBookmark(id, label.trim()));
    }

    /** Take one bookmark away from its row. */
    async function remove(id: string): Promise<void> {
        const owner = deps.id();
        said(owner, await client.fs.removeBookmark(id));
    }

    return { bookmark, rename, remove };
}
