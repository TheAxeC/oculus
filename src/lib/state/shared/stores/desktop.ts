// Layer 2, client state. What the desktop host gives a page: the bridge the host's preload exposes
// as `window.oculusDesktop`, the messages the host sends over it, and the reading of both by the
// page. A page in a browser has no bridge and every desktop feature is then absent, so the type is
// declared here once and the page reads the object once, in routes/+page.svelte, and hands it to
// the client as a dependency; no other module reads `window` for it.
//
// Every position is in screen points, as Electron reports a window's content bounds. The preload
// (src/desktop/preload.cjs) names this type in a JSDoc import and implements it.

import type { MenuCommand, RecentEntry } from '../../../data/helpers/keys/oculus/menu-commands.ts';

/** A window's content area on the screen. */
type ScreenBounds = { x: number; y: number; w: number; h: number };

/**
 * How a find runs: forward or back, whether the case counts, and whether it begins a find (the
 * query changed) or steps the find under way.
 */
export type FindOptions = { forward: boolean; matchCase: boolean; fresh: boolean };

/** The match the find is on and how many the page holds. */
type FindCount = { active: number; matches: number };

/** A tab released over the screen, at the point of the release. */
type TabDrop = { tab: string; at: { x: number; y: number } };

/** A tab handed to the window under the point, with the number its answer is sent back under. */
type DropHere = TabDrop & { request: number };

/** What the spell checker says of one word. */
type Spelling = { misspelled: boolean; suggestions: string[] };

/**
 * The host's answer to a save of the arrangement: taken, or refused with the envelope it holds, or
 * refused with none (`held` null) when the host did not answer the call.
 */
export type SaveAnswer = { admitted: true } | { admitted: false; held: string | null };

export { READY_WAIT_MS } from '../../../data/file-ops.ts';

/**
 * What the host answers to a print of the deck at an address: the PDF's bytes, or why there are
 * none: the page was not ready within the wait, the print failed, or the address is not the print
 * route of this server.
 */
export type PrintAnswer =
    { ok: true; bytes: Uint8Array } | { ok: false; error: 'timeout' | 'failed' | 'refused' };

/** The messages the host sends a page, by name, with what each carries. */
type DesktopEvents = {
    /** The window of a popped-out float moved or was resized. */
    bounds: ScreenBounds;
    /** A tab was released over this window from another one. */
    'drop-here': DropHere;
    /**
     * A menu item the page answers, by the name of the list (menu-commands.ts); Open Recent's
     * workspace file comes as the listener's argument.
     */
    command: MenuCommand;
    /** The count of the find the window runs. */
    found: FindCount;
    /** The find bar was shown. */
    shown: null;
    /** The reader closed a popped-out window, whose tabs go back to the main window. */
    restore: null;
    /** The server listens at another origin after a restart; the page goes there itself. */
    'move-to': string;
    /** The window entered full screen (true) or left it (false). */
    'full-screen': boolean;
};

/** The bridge. */
export type DesktopBridge = {
    /** Ask for the window of a float placed in a window; one already open stays as it is. */
    openFloatWindow: (id: string, bounds: ScreenBounds, owner: string) => void;
    /** Close the window this page is in. */
    closeSelf: () => void;
    /** Bring a main window to the front. */
    focusMain: () => void;
    /** Hand a released tab to the window under the point; answers whether one took it. */
    dropOutside: (drop: TabDrop) => Promise<boolean>;
    /** Tell the host whether this window took the tab it was handed, under its request number. */
    answerDrop: (request: number, taken: boolean) => void;
    /** Save the arrangement `next` under `key`, made from the arrangement `from`. */
    saveLayout: (key: string, next: string, from: string | null) => SaveAnswer;
    /** Show the find bar over the window. */
    showFind: () => void;
    /** Run a find of the window's page, or step it. */
    find: (query: string, options: FindOptions) => void;
    /** End the find and clear its marks. */
    stopFind: () => void;
    /** Hide the find bar and give the page the keyboard. */
    closeFind: () => void;
    /** Print the deck the print route at `address` draws to a PDF, in a window the host hides. */
    printPdf: (address: string) => Promise<PrintAnswer>;
    /**
     * The reader pressed the empty part of the title bar strip twice: the host does what the
     * system's title bar does (zoom, minimise or nothing, as macOS's setting says).
     */
    titleDoubleClick: () => void;
    /**
     * The colours the title bar strip is drawn in, its background and its words, each a hex
     * colour: off macOS the host draws the window buttons over the strip in them.
     */
    titleColours: (color: string, symbolColor: string) => void;
    /** Whether this page's window is in full screen now. */
    fullScreen: () => Promise<boolean>;
    /** Whether the spell checker holds a word wrong, and what it suggests. */
    spelling: (word: string) => Promise<Spelling>;
    /** Hand the host the open workspace's recent workspace files, for the menu's Open Recent. */
    recentWorkspaces: (entries: RecentEntry[]) => void;
    /**
     * Hear a message of the host; answers how to stop. A message may carry one argument after its
     * payload, which the listener reads as it reads anything the host sends.
     */
    on: <K extends keyof DesktopEvents>(
        event: K,
        listener: (payload: DesktopEvents[K], argument?: unknown) => void
    ) => () => void;
};

/**
 * What a client is built with in the app: the bridge, the float a popped-out page draws, and the id
 * of the main window that opened it.
 */
export type Desktop = { bridge: DesktopBridge; float: string | null; owner: string | null };

/** The bridge `window.oculusDesktop` is when the host gave the page one. */
type DesktopWindow = { oculusDesktop?: DesktopBridge };

/**
 * The desktop a page has: the bridge of a page the host made, the float id its address names with
 * `?float=<id>` and the main window that opened it with `&owner=<id>`, both null for a main window;
 * undefined in a browser. An empty id names none.
 */
export function desktopOf(win: object, search: string): Desktop | undefined {
    const bridge = (win as DesktopWindow).oculusDesktop;
    if (bridge === undefined) return undefined;
    const params = new URLSearchParams(search);
    const named = params.get('float');
    const owner = params.get('owner');
    return {
        bridge,
        float: named === null || named === '' ? null : named,
        owner: owner === null || owner === '' ? null : owner
    };
}
