// Layer 4, server test support. The app's entry for the start tests, run under Electron with three
// differences from the shipped entry. The default port is one the test names, so a start on an
// engine with no local.yml can be pointed at a scratch port instead of the shipped one. Next,
// nothing reaches the screen: a recorder takes the place of every call that would show a window,
// bring one forward or open a dialog, prints one `[screen]` line for it and does nothing else, so a
// row reads what the app asked for from its output and no window appears and no focus moves. The
// windows the app makes are created unshown by its own code, and a dialog stays unanswered. And it
// ends when the process that started it ends: it reads its standard input, which the starter holds
// as a pipe, and quits the app through its own quit path on the input's end, so the server stops as
// it does on any quit and no Electron outlives a test run that was killed.

import { app, BrowserWindow, dialog } from 'electron';
import { startApp } from '../../../src/desktop/app.ts';

function record(what: string): void {
    process.stdout.write(`[screen] ${what}\n`);
}

for (const name of ['show', 'showInactive', 'focus', 'moveTop'] as const) {
    BrowserWindow.prototype[name] = function (): void {
        record(`window.${name}`);
    };
}

dialog.showMessageBox = (): Promise<never> => {
    record('dialog');
    return new Promise<never>(() => undefined);
};

app.dock?.hide();

process.stdin.on('end', () => app.quit());
process.stdin.resume();

startApp({ defaultPort: Number(process.env.OCULUS_TEST_DEFAULT_PORT) });
