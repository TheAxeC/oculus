// Layer 2, server (the desktop host). The audience window of a presentation: the window the
// Present view's presenter screen opens with `window.open` on the server's `/present/show` route,
// which the link decision (decide/links.ts) names as the audience kind. This module makes it, keeps
// it, and decides what it does with an address and a close.
//
// It is the app's window but not one of its list (windows.ts): never in `entries()`, never in the
// window file, never restored at the next start. It is made with the preferences every window has
// and in the default session, which is what lets its page and the presenter screen share a
// BroadcastChannel and a Web Lock. Its page may call no channel of the bridge (decide/sender.ts).
// One window is open for a deck at a time: asking again brings it forward, loading its address
// again only when its page says the presentation ended, so a live talk is never reloaded. The
// window then belongs to the window that asked last. The asking page never learns whether it was
// made or only brought forward, since a page's `window.open` is always answered with nothing.
//
// It opens on a display other than the asking window's with simple full screen, which makes no
// Space and leaves the other displays usable, and beside the asking window when there is one
// display. It closes with the window that asked for it, so a float's audience window goes when
// the last main window closes the float. Its own `window.open` and its main-frame navigations go
// through the same routing as any window's, so a slide's link goes to the default browser and the
// window stays on the slide.

import { BrowserWindow, type WebContents } from 'electron';
import { audiencePlace, rectOf, type Rect } from '../decide/place.ts';
import { WINDOW_BACKGROUND, windowPreferences } from '../decide/window-options.ts';
import type { Entry } from './windows.ts';

/** What the audience windows need of the rest of the app. */
export type AudienceDeps = {
    preload: string;
    /** The work areas of the attached displays. */
    areas: () => Rect[];
    /** Send an address a window of the app met to where the link decision says. */
    route: (from: Entry, url: string) => void;
};

/** One audience window the app made. */
type Shown = {
    win: BrowserWindow;
    /** The deck it shows, by the server's origin, the root and the path. */
    key: string;
    from: Entry;
    /** The origin of the server the page was loaded from. */
    origin: string;
};

/** The audience windows. */
export type Audience = {
    /**
     * Open the window of the deck `url` names for `from`, or bring forward the one already open,
     * now `from`'s, loading the address again when its page has ended.
     */
    open: (from: Entry, url: string, deck: { root: string; path: string }) => void;
    /** The origin of the server an audience window's page was loaded from, or null for others. */
    originOf: (contents: WebContents) => string | null;
    /** Close the audience window the reader is in, and answer whether there was one. */
    closeFocused: () => boolean;
    /** Close every audience window that `from` asked for. */
    closeFor: (from: Entry) => void;
    closeAll: () => void;
};

export function createAudience(deps: AudienceDeps): Audience {
    const list: Shown[] = [];

    /** Bring a window forward without taking the keyboard from the presenter screen. */
    function bringForward(win: BrowserWindow): void {
        if (win.isMinimized()) win.restore();
        win.showInactive();
        win.moveTop();
    }

    /** Wire what the window does with an address: its own page stays, any other goes by routing. */
    function guard(shown: Shown, loaded: string): void {
        const contents = shown.win.webContents;
        contents.setWindowOpenHandler(({ url }) => {
            deps.route(shown.from, url);
            return { action: 'deny' };
        });
        contents.on('will-frame-navigate', (event) => {
            if (!event.isMainFrame || event.url === loaded) return;
            event.preventDefault();
            deps.route(shown.from, event.url);
        });
    }

    function make(from: Entry, url: string, key: string): void {
        const place = audiencePlace(rectOf(from.win.getBounds()), deps.areas());
        const rect = place.kind === 'display' ? place.area : place.rect;
        const win = new BrowserWindow({
            x: rect.x,
            y: rect.y,
            width: rect.w,
            height: rect.h,
            show: false,
            backgroundColor: WINDOW_BACKGROUND,
            webPreferences: windowPreferences(deps.preload)
        });
        const shown: Shown = { win, key, from, origin: from.origin };
        list.push(shown);
        guard(shown, url);
        win.once('ready-to-show', () => {
            win.showInactive();
            if (place.kind === 'display') win.setSimpleFullScreen(true);
        });
        win.on('closed', () => list.splice(list.indexOf(shown), 1));
        void win.webContents.loadURL(url);
    }

    return {
        open: (from, url, deck) => {
            const key = JSON.stringify([from.origin, deck.root, deck.path]);
            const open = list.find((one) => one.key === key);
            if (open === undefined) {
                make(from, url, key);
                return;
            }
            // A page that ended after a reload or a crash of the presenter screen is loaded again,
            // so the new presenter screen meets a live audience page; a live page is left as is.
            open.from = from;
            const page = open.win.webContents;
            void page
                .executeJavaScript("document.querySelector('[data-ended]') !== null")
                .then((ended: unknown) => (ended === false ? undefined : page.loadURL(url)))
                .catch(() => undefined);
            bringForward(open.win);
        },
        originOf: (contents) =>
            list.find((one) => one.win.webContents === contents)?.origin ?? null,
        closeFocused: () => {
            const focus = BrowserWindow.getFocusedWindow();
            const found = list.find((one) => one.win === focus);
            found?.win.close();
            return found !== undefined;
        },
        closeFor: (from) => {
            for (const one of [...list]) if (one.from === from) one.win.close();
        },
        closeAll: () => {
            for (const one of [...list]) one.win.close();
        }
    };
}
