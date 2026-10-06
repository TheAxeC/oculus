// Layer 2, server (the desktop host). The folder panel in the app. The server asks for it
// (`pick-folders`); the host shows Electron's open dialog as a sheet on the window the reader is in
// and answers with the paths, `cancelled`, or `failed`. The sheet cannot be taken down from here,
// so a pick is tied to the page it was shown on: when that page goes (it reloads, navigates or
// crashes, or its window closes) before the sheet answers, the pick is answered `cancelled` at once
// and the sheet's later answer is dropped. The server's panel is then free, nothing is added and
// no failure is said; a sheet left on screen is cancelled by the reader and its answer ignored.

import { dialog } from 'electron';
import { homedir } from 'node:os';
import type { MainMessage } from '../../lib/server/root/process/parent.ts';
import type { Words } from '../../lib/server/root/process/words.ts';
import type { Entry, Windows } from './windows.ts';

/** Answer the pick `id` of the server with the folders chosen, if any. */
export type PickAnswer = (message: MainMessage) => void;

/** The picks in flight are told apart by the id the server gave them. */
export function createPicker(windows: Windows, t: Words, answer: PickAnswer) {
    return function pick(id: number): void {
        const entry: Entry | null = windows.focused();
        if (entry === null) {
            answer({ kind: 'picked', id, cancelled: true });
            return;
        }
        let answered = false;
        const contents = entry.win.webContents;
        const settle = (message: MainMessage): void => {
            if (answered) return;
            answered = true;
            if (!contents.isDestroyed()) {
                contents.off('did-start-navigation', navigated);
                contents.off('render-process-gone', gone);
            }
            if (!entry.win.isDestroyed()) entry.win.off('closed', gone);
            answer(message);
        };
        const gone = (): void => settle({ kind: 'picked', id, cancelled: true });
        const navigated = (details: { isMainFrame: boolean; isSameDocument: boolean }): void => {
            if (details.isMainFrame && !details.isSameDocument) gone();
        };
        contents.on('did-start-navigation', navigated);
        contents.on('render-process-gone', gone);
        entry.win.on('closed', gone);
        dialog
            .showOpenDialog(entry.win, {
                properties: ['openDirectory', 'multiSelections', 'createDirectory'],
                buttonLabel: t('desktop.pick.add'),
                defaultPath: homedir()
            })
            .then(
                (result) =>
                    settle(
                        result.canceled
                            ? { kind: 'picked', id, cancelled: true }
                            : { kind: 'picked', id, paths: result.filePaths }
                    ),
                () => settle({ kind: 'picked', id, failed: true })
            );
    };
}
