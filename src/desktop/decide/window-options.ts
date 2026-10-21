// Layer 2, server (the desktop host). What every window the app makes is made with. One pure
// function makes the web preferences, so the options that keep a page from reaching Node are read
// in one place and tests/server/desktop/window-guard.test.ts reads them without an app: Node
// integration is off, in subframes too, context isolation and the sandbox are on, and the web
// security stays on.
//
// The main windows and the windows of popped-out floats draw no title bar of the system's: the
// page draws its own strip across its top (shell/titlebar/), and the window buttons are kept and
// placed inside that strip, centred in its height. The strip's height is one constant here, which
// the buttons' place and the find bar's top both read, and which the page's `--titlebar-height`
// (themes/tokens.css) matches. What a double press on the strip's empty part does is read from
// macOS's own setting, as its title bar reads it. Off macOS the window buttons the system draws
// over the strip's right end are drawn in the strip's own colours, which the page sends at load and
// at each change of theme (`overlayColours`); until it does, they take the colours of the theme the
// window starts on, which the host reads from that theme's stylesheet block (`windowFrame`). The
// window's fill is that start theme's background when the window is made (`windowFill`), and the
// background of the theme its page drew from the page's first send on (`drawnFill`).

import { isHexColour, type WindowColours } from '../../lib/themes/parse.ts';

/** The web preferences of a window, the subset the app sets. */
export type WindowPreferences = {
    contextIsolation: true;
    sandbox: true;
    nodeIntegration: false;
    nodeIntegrationInSubFrames: false;
    webSecurity: true;
    spellcheck: true;
    preload: string;
};

/**
 * The web preferences of every window and of the find bar's view, with the preload at `preload`.
 */
export function windowPreferences(preload: string): WindowPreferences {
    return {
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: false,
        webSecurity: true,
        spellcheck: true,
        preload
    };
}

/**
 * The fill of a window or of the find bar's view before the page paints, as BrowserWindow takes
 * it: the background of the theme the window starts on (windows/start-colours.ts), so no white
 * shows while a page loads, and nothing when the theme gives none, which leaves Electron's own.
 */
export function windowFill(colours: WindowColours | null): { backgroundColor?: string } {
    return colours === null ? {} : { backgroundColor: colours.background };
}

/**
 * The fill a window takes, as `setBackgroundColor` takes it, once its page has drawn a theme: the
 * background of that theme as the page sent it, on every system; null for a value that is not a
 * hex colour, which leaves the fill as it is.
 */
export function drawnFill(background: unknown): string | null {
    return isHexColour(background) ? background : null;
}

/** The height of the strip the page draws across a window's top, in points: VS Code's title bar. */
export const TITLEBAR_HEIGHT = 35;

/** The height of the frame macOS draws its window buttons in, in points. */
const BUTTONS_HEIGHT = 16;

/** Where macOS's window buttons sit: in from the window's left, centred in the strip's height. */
const TRAFFIC_LIGHTS = {
    x: 12,
    y: Math.round((TITLEBAR_HEIGHT - BUTTONS_HEIGHT) / 2)
} as const;

/** The options of a window's frame, the subset the app sets. */
export type WindowFrame = {
    titleBarStyle: 'hidden';
    /** On macOS, the first press on an inactive window reaches its page as well as raising it. */
    acceptFirstMouse?: true;
    trafficLightPosition?: { x: number; y: number };
    titleBarOverlay?: { height: number; color?: string; symbolColor?: string };
};

/**
 * The frame of a main window and of a float's window on `platform`: no title bar of the system's.
 * On macOS the window buttons are placed inside the strip, and the first press on an inactive
 * window reaches its page, so a tab drag or a click started there acts at once, as it does in VS
 * Code; elsewhere the buttons are drawn over the strip's right end at its height, since a hidden
 * title bar there takes them away otherwise, on the background of the theme the window starts on
 * and with its symbols in that theme's title bar words (`colours`), the system's own colours when
 * the theme gives none.
 */
export function windowFrame(platform: string, colours: WindowColours | null): WindowFrame {
    if (platform === 'darwin') {
        return {
            titleBarStyle: 'hidden',
            acceptFirstMouse: true,
            trafficLightPosition: { ...TRAFFIC_LIGHTS }
        };
    }
    const painted =
        colours === null ? {} : { color: colours.background, symbolColor: colours.symbol };
    return { titleBarStyle: 'hidden', titleBarOverlay: { height: TITLEBAR_HEIGHT, ...painted } };
}

/** The colours of the window buttons drawn over the strip, as `setTitleBarOverlay` takes them. */
export type OverlayColours = { color: string; symbolColor: string };

/**
 * The colours the window buttons drawn over the strip take on `platform`, from the two a page sent:
 * the strip's background and the colour of its words. Null on macOS, where the buttons sit inside
 * the strip and the system colours them, and for a value that is not a hex colour.
 */
export function overlayColours(
    platform: string,
    color: unknown,
    symbolColor: unknown
): OverlayColours | null {
    if (platform === 'darwin' || !isHexColour(color) || !isHexColour(symbolColor)) return null;
    return { color, symbolColor };
}

/** What a double press on a window's title bar does. */
export type TitleAction = 'zoom' | 'minimise' | 'none';

/**
 * What a double press on the strip's empty part does, from macOS's `AppleActionOnDoubleClick`
 * (System Settings, Desktop & Dock, "Double-click a window's title bar to"): `Minimize` minimises,
 * `None` does nothing, and `Maximize`, or the setting unset, zooms, which is macOS's default.
 */
export function titleAction(setting: unknown): TitleAction {
    if (setting === 'Minimize') return 'minimise';
    if (setting === 'None') return 'none';
    return 'zoom';
}
