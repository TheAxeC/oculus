// Layer 2, client state. Reading the saved arrangement and following it: the load a page makes
// once, the arrangement another browser tab or app window saved, and the arrangement the desktop
// host answered a refused save with. The layout factory holds the reactive pages and the write
// path; this part is built beside it, is handed the access object as the parts under open/ are, and
// reaches what only the factory can set (the pages, and the flags a load changes) through the
// functions it is given.

import { t } from '../../../shared/words/text.ts';
import type { LayoutAccess } from '../access.ts';
import { defaultPages, type Pages } from '../model.ts';
import { parseLayout } from './saved.ts';
import { LAYOUT_KEY, UNREAD_KEY, type LayoutStorage, type Storable } from './storage.ts';

/** What the factory lets the load set: the pages without a save, and the flags. */
export type LoadSetters = {
    /** Make a set of pages current without saving them. */
    replace: (pages: Pages) => void;
    /** Whether the pages are the default a browser with no saved layout was given. */
    setFresh: (fresh: boolean) => void;
    /** Forget which pane the reader last touched. */
    clearAttention: () => void;
    /** Note that the saved arrangement was read, or that none could be. */
    setLoaded: () => void;
};

/** The load of the saved arrangement and its following. */
export type Load = {
    /**
     * Read the saved arrangement and make it current, falling back to the default when there is
     * none or the saved value fails parseLayout; a value that fails is first copied under
     * UNREAD_KEY, since the next change writes the default over it. An envelope of a version other
     * than LAYOUT_VERSION fails parseLayout the same way. Returns whether a saved
     * arrangement was restored, which is how a page knows whether it is looking at the default. The
     * default argument is evaluated at the call and not at the import, so a test that never calls
     * this touches no localStorage. A source of the browser's `storage` events (the window) makes
     * this tab follow the arrangement the other browser tabs of the server save; without one it
     * follows none.
     */
    loadLayout: (held?: Storable, source?: EventTarget) => boolean;
    /** Stop following the arrangement other tabs save. */
    stopFollowing: () => void;
    /**
     * Take the envelope the host refused the last save with, as `takeSaved` takes another tab's
     * write; true when there was one, which is the caller's cue to run its operation again.
     */
    retake: () => boolean;
};

export function createLoad(access: LayoutAccess, storage: LayoutStorage, set: LoadSetters): Load {
    /** Ends the listening a load began for the arrangement other browser tabs save. */
    let unfollow: () => void = () => undefined;

    /**
     * Make an envelope's pages current. Its pages replace this tab's; the page this tab shows stays
     * the one shown while it is still a page, since which page a tab is looking at is that tab's
     * own. Nothing is written back, so the save that reached this tab does not travel on to the tab
     * it came from. A value that does not parse changes nothing.
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

    function takeSaved(): void {
        adopt(storage.read(LAYOUT_KEY));
    }

    function retake(): boolean {
        const held = storage.refusal();
        if (held === null) return false;
        adopt(held);
        return true;
    }

    function loadLayout(held: Storable = localStorage, source?: EventTarget): boolean {
        storage.attach(held);
        unfollow();
        unfollow = source === undefined ? () => undefined : storage.follow(source, takeSaved);
        const raw = storage.read(LAYOUT_KEY);
        const parsed = raw === null ? null : parseLayout(raw);
        if (raw !== null && raw !== '' && parsed === null) storage.remember(UNREAD_KEY, raw);
        set.clearAttention();
        set.replace(parsed ?? defaultPages(t('ui.page_default', 1)));
        set.setFresh(parsed === null);
        set.setLoaded();
        return parsed !== null;
    }

    return {
        loadLayout,
        stopFollowing: () => {
            unfollow();
            unfollow = () => undefined;
        },
        retake
    };
}
