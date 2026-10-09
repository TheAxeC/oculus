// Layer 2, server (the desktop host). What every window the app makes is made with. One pure
// function makes the web preferences, so the options that keep a page from reaching Node are read
// in one place and tests/server/desktop/window-guard.test.ts reads them without an app: Node
// integration is off, in subframes too, context isolation and the sandbox are on, and the web
// security stays on.

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
 * The colour a window and the find bar's view are filled with before the page paints: the
 * background of the app's dark theme (vscode.css, `vscode-dark-modern`), so no white shows while a
 * page loads.
 */
export const WINDOW_BACKGROUND = '#181818';
