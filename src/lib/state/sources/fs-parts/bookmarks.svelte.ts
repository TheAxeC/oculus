// Layer 2, client state, part of fs.svelte.ts. The reader's own bookmarks: the read, held in the
// client state's query client under `fs` and `bookmarks` as the workspaces and the notes are
// (fs.svelte.ts marks it when a message says the file changed), and the three writes, a star
// added, a label changed and a bookmark taken out. A bookmark is a collection entry of the reader's
// own bookmarks file, so each write goes through /api/write by the collection key the write path
// resolves to that file, and a write that lands has the file browser ask for everything it holds
// again.
//
// A removal the server took drops its row from the held bookmarks at once, before the bookmarks
// are read again, so the row leaves the rail and the Files view as the answer comes; the fresh read
// replaces the held list when it lands. A refused removal leaves the row and is said by the writes
// store, as every refused write is.

import type { Queries, WriteAnswer, WritesStore } from '../../shared/stores/shapes.ts';
import { inBrowser } from '../../shared/stores/in-browser.ts';
import { NO_BOOKMARKS, bookmarksAnswer, type BookmarksState } from '../fs-transport.ts';

/**
 * The collection key the write path resolves to the reader's own bookmarks file. A bookmark is
 * written through /api/write like any other collection entry, so the star, the row's rename and the
 * removal reach the file without knowing where it lives.
 */
export const BOOKMARK_COLLECTION = 'bookmarks';

/** The query key the bookmarks are held under. */
export const BOOKMARKS = ['fs', 'bookmarks'];

/** The bookmarks' reads and writes, which the file browser's store hands on as its own. */
export type BookmarksStore = {
    /** The reader's own bookmarks, asked for once a round like the workspaces. */
    bookmarks: () => BookmarksState;
    /**
     * The same bookmarks once they are answered: what is held for the round, or the answer of the
     * one request made for them. A caller that has to rewrite the bookmarks awaits it.
     */
    bookmarksNow: () => Promise<BookmarksState>;
    /** Add one bookmark through the collection write path, and ask for them again. */
    addBookmark: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /** Take one bookmark out, by the label it is found by, and ask for them again. */
    removeBookmark: (label: string) => Promise<WriteAnswer>;
    /** Give one bookmark another label, by the label it is found by, and ask for them again. */
    renameBookmark: (id: string, label: string) => Promise<WriteAnswer>;
};

/**
 * The bookmarks over the file browser's query client; `invalidate` asks for everything the file
 * browser holds again, which a write that lands does.
 */
export function createBookmarks(
    writes: Pick<WritesStore, 'send' | 'writeEntry'>,
    queries: Queries,
    invalidate: () => void
): BookmarksStore {
    /** Asked for once and held until they are marked. */
    function bookmarks(): BookmarksState {
        const { data } = queries.read(BOOKMARKS, bookmarksAnswer, { enabled: inBrowser() });
        return data ?? NO_BOOKMARKS;
    }

    async function bookmarksNow(): Promise<BookmarksState> {
        const found = queries.peek<BookmarksState>(BOOKMARKS);
        if (found.data !== undefined && !found.stale && !found.data.loading) return found.data;
        if (!inBrowser()) return NO_BOOKMARKS;
        return queries.fetch(BOOKMARKS, bookmarksAnswer);
    }

    /** Whether a write landed: answered, with no field refused. */
    function landed(answer: WriteAnswer): boolean {
        return answer.ok && answer.refused.length === 0;
    }

    async function addBookmark(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send({
            kind: 'new-entry',
            collection: BOOKMARK_COLLECTION,
            fields
        });
        if (answer.ok) invalidate();
        return answer;
    }

    /**
     * Take the bookmark found by `label` out. Once the server took it, the held bookmarks lose its
     * row before they are read again.
     */
    async function removeBookmark(label: string): Promise<WriteAnswer> {
        const answer = await writes.send({
            kind: 'delete-entry',
            collection: BOOKMARK_COLLECTION,
            id: label
        });
        if (!answer.ok) return answer;
        const held = queries.peek<BookmarksState>(BOOKMARKS).data;
        if (landed(answer) && held !== undefined) {
            const entries = held.entries.filter((one) => one.id !== label);
            queries.hold(BOOKMARKS, { ...held, entries });
        }
        invalidate();
        return answer;
    }

    async function renameBookmark(id: string, label: string): Promise<WriteAnswer> {
        const answer = await writes.writeEntry(BOOKMARK_COLLECTION, id, { label });
        if (answer.ok) invalidate();
        return answer;
    }

    return { bookmarks, bookmarksNow, addBookmark, removeBookmark, renameBookmark };
}
