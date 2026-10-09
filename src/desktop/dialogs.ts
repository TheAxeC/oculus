// Layer 2, server (the desktop host). The app's dialogs: one box with a message and the buttons the
// caller names, answering the index of the one pressed. The message is also printed on the app's
// output, so a run that cannot see the screen reads what was said. Every word is handed in by the
// caller: a catalog word, or a literal of main.ts's dialog for a missing package, which is said
// before the catalog can be read.

import { dialog, type BrowserWindow } from 'electron';

/** What one dialog says and offers. */
export type Say = {
    message: string;
    /** The buttons, the first being the default. */
    buttons: string[];
    /** The index of the button a Escape or a close answers; the last by default. */
    cancel?: number;
    /**
     * The window the dialog is a sheet of. A dialog of no window holds the whole app's event loop
     * until it is answered; a sheet does not.
     */
    window?: BrowserWindow;
};

/** Show a dialog and answer the index of the button pressed. */
export async function say(options: Say, log: (line: string) => void): Promise<number> {
    log(`dialog: ${options.message}`);
    const box = {
        type: 'warning' as const,
        message: options.message,
        buttons: options.buttons,
        defaultId: 0,
        cancelId: options.cancel ?? options.buttons.length - 1
    };
    const shown =
        options.window === undefined
            ? await dialog.showMessageBox(box)
            : await dialog.showMessageBox(options.window, box);
    return shown.response;
}
