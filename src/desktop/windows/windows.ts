// Layer 2, server (the desktop host). The app's windows: the main windows, each on a server's page,
// and the windows of popped-out floats, each on the same page with `?float=<id>`. This module makes
// them, keeps them, and decides what each does with an address, a crash and a close; what a page
// may ask of the host over the bridge is bridge.ts, and the menu is menu.ts.
//
// A main window closed leaves the app and the server running; the popped-out windows close with
// the last main window and keep their places in the arrangement, so they open again with the next
// main window. A popped-out window closed by the reader is asked to put its tabs back in the main
// window first (its page does that and closes the window); a window the app closes itself (a quit,
// the last main window) closes at once.

import { BrowserWindow, screen, shell, type WebContents } from 'electron';
import { linkDecision, movedPort } from '../decide/links.ts';
import { placeWindow, rectOf, type Rect } from '../decide/place.ts';
import { WINDOW_BACKGROUND, windowPreferences } from '../decide/window-options.ts';
import {
    NO_ZOOM,
    recordWindow,
    type PageFullScreen,
    type WindowChange,
    type WindowState
} from '../decide/window-file.ts';
import { EVENT } from '../decide/channels.ts';
import { oculusAnswers } from '../server/health.ts';
import { createFindBar, type FindBar } from './find-bar.ts';
import type { WindowStore } from './window-state.ts';

/** How far each further main window is moved from the one before, in points. */
const CASCADE = 28;

/** How long the host waits to learn that a server answers on a port a window is moving to. */
const MOVE_WAIT_MS = 5000;

/** How long a popped-out window waits for its page to put its tabs back before it closes. */
const RESTORE_WAIT_MS = 2000;

/** The width and height a popped-out window opens at when its float was docked. */
const FLOAT_SIZE = { w: 600, h: 400 } as const;

/** One window the app made. */
export type Entry = {
    win: BrowserWindow;
    kind: 'main' | 'float';
    /** The float this window draws, null for a main window. */
    float: string | null;
    /** The origin of the server the page was loaded from; it follows a port move. */
    origin: string;
    focusedAt: number;
    bar: FindBar;
    /** Whether the close that is under way is one the app asked for. */
    allowClose: boolean;
};

/** What the windows need of the rest of the app. */
export type WindowsDeps = {
    preload: string;
    store: WindowStore;
    log: (line: string) => void;
    /** Whether this app's own server last reported `port`, so a window may follow it there. */
    ownPort: (port: number) => boolean;
    /** Hear each port this app's own server reports listening on. */
    onListening: (listener: (port: number) => void) => () => void;
    /** A main window followed a port move of a server this app did not start, to `origin`. */
    followed: (origin: string) => void;
};

/** The windows. */
export type Windows = {
    openMain: (origin: string) => Entry;
    /** The window of a float; one already open is left as it is. */
    openFloat: (id: string, bounds: Rect | null, origin: string) => Entry;
    entries: () => Entry[];
    /**
     * The window a web contents belongs to, and whether it is the window's page or its find bar.
     */
    entryOf: (contents: WebContents) => { entry: Entry; who: 'page' | 'find-bar' } | null;
    /** Load the page of every window whose server is not at `origin` from `origin` instead. */
    moveTo: (origin: string) => void;
    /** The main window focused last, or null with none open. */
    lastMain: () => Entry | null;
    /** The window the reader is in, or the main window focused last. */
    focused: () => Entry | null;
    /** Close every window without the popped-out windows asking their pages first. */
    closeAll: () => void;
    /** Mark the app as quitting, so no window asks anything on its way out; keep the state. */
    quitting: () => void;
    /** Hear a main window's state change, for the zoom the menu sets. */
    remember: (entry: Entry) => void;
};

/** The work areas of the attached displays and the primary display's. */
function displays(): { areas: Rect[]; primary: Rect } {
    return {
        areas: screen.getAllDisplays().map((one) => rectOf(one.workArea)),
        primary: rectOf(screen.getPrimaryDisplay().workArea)
    };
}

export function createWindows(deps: WindowsDeps): Windows {
    const list: Entry[] = [];
    let clock = 0;
    let quit = false;

    /** Print the refusal of an address and do nothing else with it. */
    function refuse(url: string): void {
        deps.log(`refused an address: ${url}`);
    }

    /** Send an address to where the decision says. */
    function route(from: Entry, url: string): void {
        const where = linkDecision(url, from.origin);
        if (where.kind === 'main') openMain(from.origin);
        else if (where.kind === 'float') openFloat(where.id, null, from.origin);
        else if (where.kind === 'browser') void shell.openExternal(url);
        else refuse(url);
    }

    /**
     * Whether a window may follow a navigation to `port`: it is the port this app's server last
     * reported, or the server reports it, or an oculus answers on it, within the wait.
     */
    function admitsPort(port: number): Promise<boolean> {
        if (deps.ownPort(port)) return Promise.resolve(true);
        return new Promise((resolve) => {
            const settle = (admitted: boolean): void => {
                clearTimeout(timer);
                stop();
                resolve(admitted);
            };
            const timer = setTimeout(() => settle(false), MOVE_WAIT_MS);
            const stop = deps.onListening((heard) => {
                if (heard === port) settle(true);
            });
            void oculusAnswers(port, MOVE_WAIT_MS).then((answers) => {
                if (answers) settle(true);
            });
        });
    }

    /** A navigation of a window to the page of the same server at another port. */
    async function follow(entry: Entry, url: string, port: number): Promise<void> {
        if (!(await admitsPort(port))) {
            route(entry, url);
            return;
        }
        if (entry.win.isDestroyed()) return;
        entry.origin = new URL(url).origin;
        if (entry.kind === 'main') deps.followed(entry.origin);
        await entry.win.webContents.loadURL(url);
    }

    /**
     * Send every window to the server's new origin. A page that runs goes there itself, carrying
     * its arrangement and settings across the change of origin as a page that follows its server
     * does (workbench/layout/saved/carry.ts); a page that is loading or has crashed cannot, and is
     * loaded at the new origin.
     */
    function moveTo(origin: string): void {
        for (const entry of list) {
            if (entry.origin === origin || entry.win.isDestroyed()) continue;
            entry.origin = origin;
            const contents = entry.win.webContents;
            if (contents.isLoading() || contents.isCrashed()) {
                void contents.loadURL(`${origin}/${searchOf(entry)}`);
            } else contents.send(EVENT, 'move-to', origin);
        }
    }

    /** The search a window's own page carries, which a navigation in place keeps. */
    function searchOf(entry: Entry): string {
        return entry.float === null ? '' : `?float=${encodeURIComponent(entry.float)}`;
    }

    /** Whether a navigation is the window's own page loading again, which is let through. */
    function inPlace(entry: Entry, url: string): boolean {
        try {
            const target = new URL(url);
            return (
                target.origin === entry.origin &&
                target.pathname === '/' &&
                target.search === searchOf(entry)
            );
        } catch {
            return false;
        }
    }

    /** Wire what every window does with an address, a crash and a permission. */
    function guard(entry: Entry): void {
        const contents = entry.win.webContents;
        contents.setWindowOpenHandler(({ url }) => {
            route(entry, url);
            return { action: 'deny' };
        });
        contents.on('will-frame-navigate', (event) => {
            if (!event.isMainFrame || inPlace(entry, event.url)) return;
            event.preventDefault();
            const port = movedPort(event.url, entry.origin);
            if (port === null) route(entry, event.url);
            else void follow(entry, event.url, port);
        });
        contents.on('render-process-gone', (_event, details) => {
            deps.log(`a window's page went: ${details.reason}`);
            if (!quit && details.reason !== 'clean-exit') contents.reload();
        });
    }

    /** The state of a main window, kept for window.json. */
    function stateOf(entry: Entry): WindowState {
        const { win } = entry;
        return {
            bounds: rectOf(win.getNormalBounds()),
            maximised: win.isMaximized(),
            fullScreen: win.isFullScreen(),
            zoom: win.webContents.getZoomFactor()
        };
    }

    /** The window's own state of each main window whose page is in full screen. */
    const held = new WeakMap<Entry, PageFullScreen>();

    /** Keep what a change of a main window leaves the file holding (decide/window-file.ts). */
    function record(entry: Entry, change: WindowChange): void {
        if (entry.kind !== 'main' || entry.win.isDestroyed()) return;
        const recorded = recordWindow(held.get(entry) ?? null, change, stateOf(entry));
        if (recorded.hold === null) held.delete(entry);
        else held.set(entry, recorded.hold);
        if (recorded.state !== null) deps.store.keep(recorded.state);
    }

    function remember(entry: Entry): void {
        record(entry, 'other');
    }

    /**
     * Keep a main window's state when it moves, resizes, changes state or closes, and when its page
     * enters or leaves full screen.
     */
    function keepState(entry: Entry): void {
        for (const event of [
            'moved',
            'resized',
            'maximize',
            'unmaximize',
            'enter-full-screen',
            'leave-full-screen'
        ] as const) {
            entry.win.on(event as 'moved', () => record(entry, 'other'));
        }
        entry.win.on('enter-html-full-screen', () => record(entry, 'page-enter'));
        entry.win.on('leave-html-full-screen', () => record(entry, 'page-leave'));
        entry.win.on('close', () => {
            record(entry, 'other');
            deps.store.flush();
        });
    }

    /** Tell a popped-out window's page where its window is, once it stops moving. */
    function tellBounds(entry: Entry): void {
        let timer: NodeJS.Timeout | undefined;
        // While the page is in full screen the window is the size of the monitor, and those are not
        // the bounds the float is kept at. On macOS the page's leave comes before the window has
        // left its own full screen, so a window that was not in full screen before is let go by its
        // own `leave-full-screen`.
        let pageFullScreen = false;
        let windowWasFull = false;
        const tell = (): void => {
            clearTimeout(timer);
            if (pageFullScreen) return;
            timer = setTimeout(() => {
                if (entry.win.isDestroyed() || pageFullScreen) return;
                entry.win.webContents.send(EVENT, 'bounds', rectOf(entry.win.getContentBounds()));
            }, 500);
        };
        entry.win.on('moved', tell);
        entry.win.on('resized', tell);
        entry.win.on('enter-html-full-screen', () => {
            pageFullScreen = true;
            windowWasFull = entry.win.isFullScreen();
            clearTimeout(timer);
        });
        entry.win.on('leave-html-full-screen', () => {
            if (windowWasFull || !entry.win.isFullScreen()) pageFullScreen = false;
        });
        entry.win.on('leave-full-screen', () => {
            pageFullScreen = false;
        });
        entry.win.on('closed', () => clearTimeout(timer));
    }

    /** What a close of a popped-out window does: ask its page to put the tabs back first. */
    function askRestore(entry: Entry): void {
        const contents = entry.win.webContents;
        if (contents.isDestroyed() || contents.isCrashed()) {
            entry.allowClose = true;
            entry.win.close();
            return;
        }
        contents.send(EVENT, 'restore', null);
        setTimeout(() => {
            if (entry.win.isDestroyed()) return;
            entry.allowClose = true;
            entry.win.close();
        }, RESTORE_WAIT_MS);
    }

    /** Make the window, wire it, and put it in the list. */
    function make(
        kind: Entry['kind'],
        float: string | null,
        origin: string,
        rect: Rect,
        content: boolean
    ): Entry {
        const win = new BrowserWindow({
            x: rect.x,
            y: rect.y,
            width: rect.w,
            height: rect.h,
            useContentSize: content,
            show: false,
            backgroundColor: WINDOW_BACKGROUND,
            webPreferences: windowPreferences(deps.preload)
        });
        const entry: Entry = {
            win,
            kind,
            float,
            origin,
            focusedAt: ++clock,
            bar: createFindBar({ window: win, origin: () => entry.origin, preload: deps.preload }),
            allowClose: false
        };
        list.push(entry);
        guard(entry);
        win.on('focus', () => (entry.focusedAt = ++clock));
        win.once('ready-to-show', () => win.show());
        win.on('close', (event) => {
            if (entry.kind === 'float' && !entry.allowClose && !quit) {
                event.preventDefault();
                askRestore(entry);
            }
        });
        win.on('closed', () => {
            list.splice(list.indexOf(entry), 1);
            entry.bar.dispose();
            if (kind === 'main' && !list.some((one) => one.kind === 'main')) closeFloats();
        });
        return entry;
    }

    function closeFloats(): void {
        for (const one of [...list]) {
            if (one.kind !== 'float') continue;
            one.allowClose = true;
            one.win.close();
        }
    }

    function openMain(origin: string): Entry {
        const saved = deps.store.read();
        const { areas, primary } = displays();
        const count = list.filter((one) => one.kind === 'main').length;
        const first = placeWindow(saved?.bounds ?? null, areas, primary);
        const rect =
            count === 0
                ? first
                : placeWindow(
                      { ...first, x: first.x + CASCADE * count, y: first.y + CASCADE * count },
                      areas,
                      primary
                  );
        const entry = make('main', null, origin, rect, false);
        keepState(entry);
        const contents = entry.win.webContents;
        if (saved?.maximised === true) entry.win.maximize();
        if (saved?.fullScreen === true) entry.win.setFullScreen(true);
        contents.on('did-finish-load', () => {
            contents.setZoomFactor(saved?.zoom ?? NO_ZOOM);
        });
        void contents.loadURL(`${origin}/`);
        return entry;
    }

    function openFloat(id: string, bounds: Rect | null, origin: string): Entry {
        const open = list.find((one) => one.float === id);
        if (open !== undefined) return open;
        const { areas, primary } = displays();
        const rect = placeWindow(
            bounds ?? {
                x: primary.x + CASCADE,
                y: primary.y + CASCADE,
                w: FLOAT_SIZE.w,
                h: FLOAT_SIZE.h
            },
            areas,
            primary
        );
        const entry = make('float', id, origin, rect, true);
        entry.win.setContentBounds({ x: rect.x, y: rect.y, width: rect.w, height: rect.h });
        tellBounds(entry);
        void entry.win.webContents.loadURL(`${origin}/?float=${encodeURIComponent(id)}`);
        return entry;
    }

    function lastMain(): Entry | null {
        const mains = list.filter((one) => one.kind === 'main');
        return mains.reduce<Entry | null>(
            (best, one) => (best === null || one.focusedAt > best.focusedAt ? one : best),
            null
        );
    }

    return {
        openMain,
        openFloat,
        entries: () => [...list],
        entryOf: (contents) => {
            for (const entry of list) {
                if (entry.win.webContents === contents) return { entry, who: 'page' };
                if (entry.bar.contents() === contents) return { entry, who: 'find-bar' };
            }
            return null;
        },
        moveTo,
        lastMain,
        focused: () => {
            const focus = BrowserWindow.getFocusedWindow();
            return list.find((one) => one.win === focus) ?? lastMain();
        },
        closeAll: () => {
            for (const one of [...list]) {
                one.allowClose = true;
                one.win.close();
            }
        },
        quitting: () => {
            quit = true;
            const main = lastMain();
            if (main !== null) remember(main);
            deps.store.flush();
        },
        remember
    };
}
