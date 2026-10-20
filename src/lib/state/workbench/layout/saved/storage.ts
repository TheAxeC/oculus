// Layer 2, client state. Where an arrangement is written and read back: the page state the server
// keeps in `layouts.json` of the state folder, through the page's copy of it (state/shared/stores/
// page-state.svelte.ts), and the id the page names itself by in the record of layout writes.
//
// An arrangement belongs to a workspace: it is kept under the identity of the open workspace, which
// is the real path of its file or `unsaved`. Nothing is read or written until the workspace answer
// has named the identity (`select`), so a page never reads the arrangement of a workspace it has
// not yet learned it is in, and nothing is written before a load has attached the store
// (`attach`), so nothing is saved before the saved arrangement has been read.
//
// The server is the one save turn for every page and app window: a save is admitted only when it
// was made from the envelope the server holds, and otherwise the page takes the envelope held and
// runs its last operation again on it. The page state store tells this module when the arrangement
// of a workspace changed under the page, by another page's save or by a refused one of its own, and
// whether the last operation is to run again (`follow`).

import type { PageStateStore } from '../../../shared/stores/page-state.svelte.ts';
import { tabsOf } from '../instance.ts';
import { hostsOf, type Pages } from '../model.ts';
import { serialiseLayout } from './saved.ts';

/** The identity of the workspace that has no file. */
export const UNSAVED = 'unsaved';

/**
 * The key a browser tab's id is kept under in `sessionStorage`, which lives and dies with the
 * browser tab and survives its reloads.
 */
const TAB_KEY = 'oculus.layout.tab';

/**
 * The id of this browser tab or app window, made on first use and kept in its session storage for
 * its life, so a reload keeps it, or null when the session storage cannot be used. The record of
 * layout writes names a write by it, and a float's address names the main page that opened the
 * float's window by it (`owner`).
 */
export function browserTabId(): string | null {
    try {
        const held = sessionStorage.getItem(TAB_KEY);
        if (held !== null && held !== '') return held;
        const made = Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(TAB_KEY, made);
        return made;
    } catch {
        return null;
    }
}

/** The name of the lock a main page holds for as long as it lives. */
function pageLock(id: string): string {
    return `oculus-page:${id}`;
}

/**
 * Whether the main page with this id is open: it holds its lock, in a browser tab and in an app
 * window alike, since every window of one session shares the locks of its origin. A page that
 * cannot ask is taken to be open, so a jump is sent and not refused for a missing API.
 */
export async function pageOpen(id: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return true;
    const { held } = await navigator.locks.query();
    return held?.some((one) => one.name === pageLock(id)) ?? true;
}

/**
 * Hold a Web Lock named for the id of this main page for as long as the page lives, and answer the
 * call that lets it go. A browser copies the session storage of a tab that is duplicated, so the
 * copy starts with the id of the original; the copy finds the lock taken, forgets the id and
 * reloads under a new one, which keeps every main page's id its own (a float's `owner` names one
 * page only). The lock is also what a float asks to know that its owner page is still open.
 */
export function holdBrowserTabId(id: string): () => void {
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return () => undefined;
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    void navigator.locks.request(pageLock(id), { ifAvailable: true }, (lock) => {
        if (lock !== null) return held;
        try {
            sessionStorage.removeItem(TAB_KEY);
        } catch {
            // A session storage that cannot be used holds no id to forget.
        }
        window.location.reload();
    });
    return release;
}

/** The arrangement's persistence: attached once by a load, then read and written by workspace. */
export type LayoutStorage = {
    /** Let saves through, once a load has read the saved arrangement. Nothing is saved before. */
    attach: () => void;
    /**
     * Name the workspace the arrangement belongs to. Until it is called nothing is read and nothing
     * is written, and a read answers null.
     */
    select: (identity: string) => void;
    /** The identity `select` named, or null before it was called. */
    identity: () => string | null;
    /** The arrangement saved for the selected workspace, as JSON text, or null when none. */
    readSaved: () => string | null;
    /** Keep a value `readSaved` answered and parseLayout could not read, for the selected one. */
    rememberUnread: (raw: string) => void;
    /**
     * Save a set of pages under the selected workspace, which is what every change to them ends in.
     * `call` names the layout store operation asking, which the record of layout writes names.
     */
    write: (next: Pages, call?: string) => void;
    /**
     * Save a set of pages under another workspace: the pages a workspace is left with, or the pages
     * Save As carries to the new file.
     */
    writeFor: (identity: string, next: Pages, call?: string) => void;
    /**
     * Call `changed` whenever the arrangement of the selected workspace changed under the page: a
     * save of another page, or a save of this page the server refused. `again` is true when the
     * page's last saving operation is to run again on the envelope now held. Answers how to stop.
     */
    follow: (changed: (again: boolean) => void) => () => void;
};

export function createStorage(state: PageStateStore): LayoutStorage {
    /** Whether a load has attached the store; nothing is saved before. */
    let attached = false;

    /** The workspace the arrangement belongs to, once the workspace answer has named it. */
    let selected: string | null = null;

    function writeFor(identity: string, next: Pages, call = ''): void {
        if (!attached) return;
        const envelope = JSON.parse(serialiseLayout(next)) as Record<string, unknown>;
        state.saveLayout(identity, envelope, {
            at: Date.now(),
            tab: browserTabId() ?? 'no-session-storage',
            call,
            page: next.current,
            tabs: hostsOf(next).flatMap((host) =>
                tabsOf(host.workbench.root).map((tab) => `${tab.id}:${tab.view}`)
            )
        });
    }

    return {
        attach: () => {
            attached = true;
        },
        select: (identity) => {
            selected = identity;
        },
        identity: () => selected,
        readSaved: () => (selected === null ? null : state.envelope(selected)),
        rememberUnread: (raw) => {
            if (selected !== null) state.keepUnread(selected, raw);
        },
        write: (next, call = '') => {
            if (selected !== null) writeFor(selected, next, call);
        },
        writeFor,
        follow: (changed) =>
            state.onLayout((identity, again) => {
                if (identity === selected) changed(again);
            })
    };
}
