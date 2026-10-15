// Layer 2, server (the desktop host). What a page may ask of the host over the bridge the preload
// exposes (preload.cjs). Every handler first finds who sent the call: the top frame of a window's
// page or of its find bar's view, on the origin of the server the window shows
// (decide/sender.ts); any other call does nothing, and a save it does not answer is refused. The
// arguments are read before they are used, since a page is not trusted with the shape of what it
// sends.

import {
    ipcMain,
    systemPreferences,
    type IpcMainEvent,
    type IpcMainInvokeEvent,
    type WebContents
} from 'electron';
import {
    CLOSE_FIND,
    CLOSE_SELF,
    DROP_OUTSIDE,
    DROP_TAKEN,
    EVENT,
    FIND,
    FOCUS_MAIN,
    FULL_SCREEN,
    OPEN_FLOAT_WINDOW,
    PRINT_PDF,
    SAVE_LAYOUT,
    SHOW_FIND,
    STOP_FIND,
    TITLE_COLOURS,
    TITLE_DOUBLE_CLICK
} from '../decide/channels.ts';
import { windowAt } from '../decide/drop.ts';
import { rectOf, type Rect } from '../decide/place.ts';
import type { SaveTurn } from '../decide/save-turn.ts';
import { mayCall, printTarget, senderOf, type Sender } from '../decide/sender.ts';
import { overlayColours, titleAction } from '../decide/window-options.ts';
import type {
    FindOptions,
    PrintAnswer,
    SaveAnswer
} from '../../lib/state/shared/stores/desktop.ts';
import type { Entry, Windows } from './windows.ts';

/** The answer to a save the bridge does not answer: refused, with no envelope to take. */
const REFUSED: SaveAnswer = { admitted: false, held: null };

/**
 * The answer to a print the bridge does not answer or for an address that is not the print route.
 */
const PRINT_REFUSED: PrintAnswer = { ok: false, error: 'refused' };

/** Print the deck at an address of the server to a PDF; the app's own printing (print.ts). */
export type Printer = (address: string) => Promise<PrintAnswer>;

/** The window a call came from and who in it sent the call. */
type Caller = { entry: Entry; who: Exclude<Sender, null> };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/** The screen bounds one value is, or null. */
function boundsOf(value: unknown): Rect | null {
    if (!isRecord(value)) return null;
    const { x, y, w, h } = value;
    return finite(x) && finite(y) && finite(w) && finite(h) && w >= 1 && h >= 1
        ? { x, y, w, h }
        : null;
}

/** The find options one value is, or null. */
function findOptionsOf(value: unknown): FindOptions | null {
    if (!isRecord(value)) return null;
    const { forward, matchCase, fresh } = value;
    return typeof forward === 'boolean' &&
        typeof matchCase === 'boolean' &&
        typeof fresh === 'boolean'
        ? { forward, matchCase, fresh }
        : null;
}

/** The drop one value is, or null. */
function dropOf(value: unknown): { tab: string; at: { x: number; y: number } } | null {
    if (!isRecord(value) || typeof value.tab !== 'string' || value.tab === '') return null;
    const at = value.at;
    if (!isRecord(at) || !finite(at.x) || !finite(at.y)) return null;
    return { tab: value.tab, at: { x: at.x, y: at.y } };
}

/** The origin and path of an address, or null for one that is none. */
function addressOf(url: string): { origin: string; pathname: string } | null {
    try {
        const { origin, pathname } = new URL(url);
        return { origin, pathname };
    } catch {
        return null;
    }
}

/** Register the bridge's handlers over the app's windows. */
export function registerBridge(windows: Windows, turn: SaveTurn, print: Printer): void {
    /** The tabs handed to a window that has not answered yet, by request number. */
    const waiting = new Map<number, { contents: WebContents; settle: (taken: boolean) => void }>();
    let requests = 0;

    /** Who sent a call on `channel`, or null when the bridge does not answer it. */
    function callerOf(event: IpcMainEvent | IpcMainInvokeEvent, channel: string): Caller | null {
        const frame = event.senderFrame;
        const found = windows.entryOf(event.sender);
        if (frame === null || found === null) return null;
        const where = addressOf(frame.url);
        if (where === null) return null;
        const who = senderOf(
            { origin: where.origin, isTop: frame.parent === null, pathname: where.pathname },
            found.entry.origin
        );
        if (who === null || who !== found.who || !mayCall(who, channel)) return null;
        return { entry: found.entry, who };
    }

    ipcMain.on(SAVE_LAYOUT, (event, key: unknown, next: unknown, from: unknown) => {
        const caller = callerOf(event, SAVE_LAYOUT);
        const valid =
            typeof key === 'string' &&
            key !== '' &&
            typeof next === 'string' &&
            (from === null || typeof from === 'string');
        // A call the bridge does not answer, or one with invalid arguments, is refused: the page
        // writes only with the turn.
        event.returnValue = caller !== null && valid ? turn(key, next, from) : REFUSED;
    });

    ipcMain.on(OPEN_FLOAT_WINDOW, (event, id: unknown, bounds: unknown, owner: unknown) => {
        const caller = callerOf(event, OPEN_FLOAT_WINDOW);
        const rect = boundsOf(bounds);
        if (caller === null || typeof id !== 'string' || id === '' || rect === null) return;
        const page = typeof owner === 'string' && owner !== '' ? owner : null;
        // The window that asks is the main window of the page the float's address names.
        if (caller.entry.kind === 'main') caller.entry.page = page;
        windows.openFloat(id, rect, caller.entry.origin, page);
    });

    ipcMain.on(CLOSE_SELF, (event) => {
        const caller = callerOf(event, CLOSE_SELF);
        if (caller === null) return;
        caller.entry.allowClose = true;
        caller.entry.win.close();
    });

    // A main window raises itself, which is what the page that heard a jump asks. A float window
    // raises the main window of the page that opened it, and the main window focused last once
    // that window is gone.
    ipcMain.on(FOCUS_MAIN, (event) => {
        const caller = callerOf(event, FOCUS_MAIN);
        if (caller === null) return;
        const { entry } = caller;
        const owner = entry.owner === null ? null : windows.mainOf(entry.owner);
        const main = entry.kind === 'main' ? entry : (owner ?? windows.lastMain());
        if (main !== null) {
            main.win.show();
            main.win.focus();
        }
    });

    ipcMain.handle(DROP_OUTSIDE, (event, value: unknown) => {
        const caller = callerOf(event, DROP_OUTSIDE);
        const drop = dropOf(value);
        if (caller === null || drop === null) return false;
        const all = windows.entries();
        const id = windowAt(
            drop.at,
            all.map((one) => ({
                id: one.win.id,
                bounds: rectOf(one.win.getContentBounds()),
                focusedAt: one.focusedAt
            }))
        );
        const target = all.find((one) => one.win.id === id);
        if (target === undefined) return false;
        // Let go over its own window's content: nothing is moved.
        if (target === caller.entry) return true;
        const { webContents } = target.win;
        // A page still loading has no listener for the drop yet, so it is answered as not taken,
        // and the source opens a window of its own.
        if (webContents.isLoading()) return false;
        const request = (requests += 1);
        return new Promise<boolean>((resolve) => {
            const settle = (taken: boolean): void => {
                waiting.delete(request);
                target.win.off('closed', gone);
                webContents.off('did-start-navigation', moved);
                webContents.off('render-process-gone', gone);
                if (taken && !target.win.isDestroyed()) target.win.show();
                resolve(taken);
            };
            // A target that closes, crashes or loads its page again never answers.
            const gone = (): void => settle(false);
            const moved = (details: { isMainFrame: boolean; isSameDocument: boolean }): void => {
                if (details.isMainFrame && !details.isSameDocument) settle(false);
            };
            waiting.set(request, { contents: webContents, settle });
            target.win.once('closed', gone);
            webContents.on('did-start-navigation', moved);
            webContents.once('render-process-gone', gone);
            webContents.send(EVENT, 'drop-here', { ...drop, request });
        });
    });

    ipcMain.on(DROP_TAKEN, (event, request: unknown, taken: unknown) => {
        if (callerOf(event, DROP_TAKEN) === null || typeof taken !== 'boolean') return;
        const asked = typeof request === 'number' ? waiting.get(request) : undefined;
        if (asked?.contents === event.sender) asked.settle(taken);
    });

    ipcMain.handle(PRINT_PDF, (event, address: unknown): Promise<PrintAnswer> => {
        const caller = callerOf(event, PRINT_PDF);
        const target =
            caller === null || typeof address !== 'string'
                ? null
                : printTarget(address, caller.entry.origin);
        return target === null ? Promise.resolve(PRINT_REFUSED) : print(target);
    });

    // macOS's setting is read at each press, so a change in System Settings applies at once; on
    // another system the press zooms, as a title bar there does. A window in full screen has no
    // size to change, so the press does nothing there.
    ipcMain.on(TITLE_DOUBLE_CLICK, (event) => {
        const caller = callerOf(event, TITLE_DOUBLE_CLICK);
        if (caller === null || caller.entry.win.isFullScreen()) return;
        const { win } = caller.entry;
        const setting =
            process.platform === 'darwin'
                ? systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string')
                : undefined;
        const action = titleAction(setting);
        if (action === 'minimise') win.minimize();
        else if (action === 'zoom' && win.isMaximized()) win.unmaximize();
        else if (action === 'zoom') win.maximize();
    });

    // Off macOS the window buttons the system draws over the strip take the strip's colours, as
    // the window's own page sent them; a call from any other sender, and a value that is not a hex
    // colour, changes nothing.
    ipcMain.on(TITLE_COLOURS, (event, color: unknown, symbolColor: unknown) => {
        const caller = callerOf(event, TITLE_COLOURS);
        const colours = overlayColours(process.platform, color, symbolColor);
        if (caller === null || colours === null) return;
        caller.entry.win.setTitleBarOverlay(colours);
    });

    ipcMain.handle(FULL_SCREEN, (event) => {
        const caller = callerOf(event, FULL_SCREEN);
        return caller?.entry.win.isFullScreen() === true;
    });

    ipcMain.on(SHOW_FIND, (event) => {
        callerOf(event, SHOW_FIND)?.entry.bar.show();
    });

    ipcMain.on(FIND, (event, query: unknown, options: unknown) => {
        const how = findOptionsOf(options);
        if (typeof query === 'string' && how !== null)
            callerOf(event, FIND)?.entry.bar.find(query, how);
    });

    ipcMain.on(STOP_FIND, (event) => {
        callerOf(event, STOP_FIND)?.entry.bar.find('', {
            forward: true,
            matchCase: false,
            fresh: true
        });
    });

    ipcMain.on(CLOSE_FIND, (event) => {
        callerOf(event, CLOSE_FIND)?.entry.bar.hide();
    });
}
