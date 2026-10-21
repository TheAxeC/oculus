// Layer 2, server (the desktop host). Find in the page. Electron draws no find bar, and a bar in
// the page's own document would be counted as a match of the query it holds (`findInPage` counts a
// text box), so the bar is a view of its own: a `WebContentsView` laid over the window's top right,
// under the page's title bar strip, loading the server's `/find` route. The host runs `findInPage`
// and `stopFindInPage` on the window's page and sends the bar's page the count each time Chromium
// reports one.

import { WebContentsView, type BrowserWindow, type WebContents } from 'electron';
import type { FindOptions } from '../../lib/state/shared/stores/desktop.ts';
import type { WindowColours } from '../../lib/themes/parse.ts';
import { TITLEBAR_HEIGHT, windowPreferences } from '../decide/window-options.ts';
import { FIND_PATH } from '../decide/sender.ts';
import { EVENT } from '../decide/channels.ts';

/**
 * The bar's width and height, and its distance from the window's right, in points. Its top is the
 * foot of the page's title bar strip, so the bar covers none of the strip's controls.
 */
const WIDTH = 400;
const HEIGHT = 48;
const INSET = 8;

/** One window's find bar. */
export type FindBar = {
    /** Lay the bar over the window and give it the keyboard. */
    show: () => void;
    /** Take the bar away, clear the find's marks and give the page the keyboard. */
    hide: () => void;
    /** Run a find of the window's page, or step the one under way. */
    find: (query: string, options: FindOptions) => void;
    /** The bar's page, to tell the bar's messages from the window's. */
    contents: () => WebContents;
    /** End the find and let the bar go with its window. */
    dispose: () => void;
};

/** What a bar needs of its window. */
export type FindBarOptions = {
    window: BrowserWindow;
    /** The origin of the server the window shows, read each time the bar is shown. */
    origin: () => string;
    preload: string;
    /** The colours of the theme the window started on, whose background fills the bar's view. */
    colours: WindowColours | null;
};

export function createFindBar(options: FindBarOptions): FindBar {
    const { window: win } = options;
    const view = new WebContentsView({ webPreferences: windowPreferences(options.preload) });
    if (options.colours !== null) view.setBackgroundColor(options.colours.background);
    let shown = false;
    let address = '';

    function place(): void {
        const { width } = win.getContentBounds();
        view.setBounds({
            x: Math.max(0, width - WIDTH - INSET),
            y: TITLEBAR_HEIGHT,
            width: WIDTH,
            height: HEIGHT
        });
    }

    function tell(active: number, matches: number): void {
        if (!view.webContents.isDestroyed()) {
            view.webContents.send(EVENT, 'found', { active, matches });
        }
    }

    win.webContents.on('found-in-page', (_event, result) => {
        tell(result.activeMatchOrdinal, result.matches);
    });
    win.on('resize', () => {
        if (shown) place();
    });

    function show(): void {
        const wanted = `${options.origin()}${FIND_PATH}`;
        if (address !== wanted) {
            address = wanted;
            void view.webContents.loadURL(wanted);
        }
        if (!shown) {
            shown = true;
            win.contentView.addChildView(view);
        }
        place();
        view.webContents.focus();
        view.webContents.send(EVENT, 'shown', null);
    }

    function hide(): void {
        win.webContents.stopFindInPage('clearSelection');
        if (shown) {
            shown = false;
            win.contentView.removeChildView(view);
        }
        win.webContents.focus();
    }

    function find(query: string, how: FindOptions): void {
        if (query === '') {
            win.webContents.stopFindInPage('clearSelection');
            tell(0, 0);
            return;
        }
        win.webContents.findInPage(query, {
            forward: how.forward,
            matchCase: how.matchCase,
            findNext: how.fresh
        });
    }

    return {
        show,
        hide,
        find,
        contents: () => view.webContents,
        dispose: () => {
            if (!view.webContents.isDestroyed()) view.webContents.close();
        }
    };
}
