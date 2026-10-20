// Layer 2, client state. Reading the saved arrangement and following it: the arrangement of the
// workspace a page is in, read once the workspace answer has named it and again whenever the page
// moves to another workspace, the arrangement another page or app window saved, and the arrangement
// the server answered a refused save of this page with. The layout factory holds the reactive
// pages and the write path; this part is built beside it, is handed the access object as the parts
// under open/ are, and reaches what only the factory can set (the pages, and the flags a load
// changes) through the functions it is given.

import { t } from '../../../shared/words/text.ts';
import type { LayoutAccess } from '../access.ts';
import { defaultPages, type Pages } from '../model.ts';
import { parseLayout } from './saved.ts';
import { UNSAVED, type LayoutStorage } from './storage.ts';

/** What the factory lets the load set: the pages without a save, and the flags. */
export type LoadSetters = {
    /** Make a set of pages current without saving them. */
    replace: (pages: Pages) => void;
    /** Whether the pages are the default a workspace with no saved layout was given. */
    fresh: () => boolean;
    /** Note that the pages are the default of a workspace with no saved layout, or are not. */
    setFresh: (fresh: boolean) => void;
    /** Forget which pane the reader last touched. */
    clearAttention: () => void;
    /** Note that the saved arrangement was read, or that none could be. */
    setLoaded: () => void;
    /** Run the last operation of this tab that saved the pages again, on the pages now current. */
    again: () => void;
};

/** The load of the saved arrangement and its following. */
export type Load = {
    /**
     * Let saves through, and start following the arrangement the other pages of the server save
     * for the open workspace and the saves of this page the server refuses. Nothing is read: the
     * arrangement is read by `workspaceOpened`, once the page knows which workspace it is in.
     */
    loadLayout: () => void;
    /**
     * The workspace the page is in is `identity` (the real path of the open workspace file, or
     * `unsaved`). The first call reads that workspace's arrangement and makes it current. A call
     * that names another workspace saves the pages as they are under the one left, then reads the
     * arrangement saved for the one opened and makes it current; a workspace that was never opened
     * gets the default arrangement. A value that fails parseLayout, or an envelope of a version
     * other than LAYOUT_VERSION, is first kept as the workspace's `unread` copy, since the next
     * change writes the default over it. A call that names the workspace already open changes
     * nothing. Returns whether a saved arrangement was restored, which is how a page knows whether
     * it is looking at the default.
     */
    workspaceOpened: (identity: string) => boolean;
    /**
     * The workspace answer as the page reads it: `loading` while it is on its way, `error` the
     * words of a failed read, `open` the open workspace file with `real` its path with every link
     * resolved. Nothing is read before it has come. A first answer that failed names `unsaved`; a
     * later answer that failed names nothing, so the workspace the page is in stays.
     */
    workspaceAnswered: (answer: {
        loading: boolean;
        error: string;
        open: { real: string } | null;
    }) => void;
    /**
     * Save As: the pages as they are are saved under the workspace left and under the file just
     * made, and the file becomes the open workspace, so the arrangement shown stays and the
     * workspace answer that names the file changes nothing.
     */
    workspaceCarried: (identity: string) => void;
    /** Stop following the arrangement other pages save. */
    stopFollowing: () => void;
};

export function createLoad(access: LayoutAccess, storage: LayoutStorage, set: LoadSetters): Load {
    /** Ends the listening a load began for the arrangement other pages save. */
    let unfollow: () => void = () => undefined;

    /**
     * Make an envelope's pages current. Its pages replace this page's; the page on screen stays the
     * one shown while it is still a page, since which page a browser tab is looking at is its own.
     * Nothing is written back, so the save that reached this page does not travel on to the page it
     * came from. A value that does not parse changes nothing.
     */
    function adopt(raw: string | null): void {
        const saved = raw === null ? null : parseLayout(raw);
        if (saved === null) return;
        const shown = access.held().current;
        set.setFresh(false);
        set.replace({
            ...saved,
            current: saved.pages.some((page) => page.id === shown) ? shown : saved.current
        });
    }

    /**
     * Take the arrangement now held for the open workspace, and run this page's last saving
     * operation again on it when the server refused this page's save or another page's save
     * replaced a change of this page not yet sent (`follow` of storage.ts), so its change is kept.
     */
    function takeSaved(again: boolean): void {
        adopt(storage.readSaved());
        if (again) set.again();
    }

    function loadLayout(): void {
        storage.attach();
        unfollow();
        unfollow = storage.follow(takeSaved);
    }

    function workspaceOpened(identity: string): boolean {
        const left = storage.identity();
        if (left === identity) return !set.fresh();
        if (left !== null && !set.fresh()) storage.writeFor(left, access.held(), 'workspaceOpened');
        storage.select(identity);
        const raw = storage.readSaved();
        const parsed = raw === null ? null : parseLayout(raw);
        if (raw !== null && raw !== '' && parsed === null) storage.rememberUnread(raw);
        set.clearAttention();
        set.replace(parsed ?? defaultPages(t('ui.page_default', 1)));
        set.setFresh(parsed === null);
        set.setLoaded();
        return parsed !== null;
    }

    function workspaceAnswered(answer: {
        loading: boolean;
        error: string;
        open: { real: string } | null;
    }): void {
        if (answer.loading || (answer.error !== '' && storage.identity() !== null)) return;
        workspaceOpened(answer.open?.real ?? UNSAVED);
    }

    function workspaceCarried(identity: string): void {
        const left = storage.identity();
        if (left === identity) return;
        if (left !== null) storage.writeFor(left, access.held(), 'workspaceCarried');
        storage.writeFor(identity, access.held(), 'workspaceCarried');
        storage.select(identity);
        set.setFresh(false);
    }

    return {
        loadLayout,
        workspaceOpened,
        workspaceAnswered,
        workspaceCarried,
        stopFollowing: () => {
            unfollow();
            unfollow = () => undefined;
        }
    };
}
