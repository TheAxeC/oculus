// Layer 2, server (the desktop host). Where ~/.oculus/window.json is read and written. The main
// window's state is read before the window is made and written when the window moves, resizes,
// changes state or closes: a change is held for the wait and the latest one is written, through a
// temporary file and a rename so a reader never meets half a file. `flush` writes what is held at
// once, for the close and the quit. A file that cannot be read is no state (decide/window-file.ts).

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseWindowFile, windowFileText, type WindowState } from '../decide/window-file.ts';

/** The wait between a change and its write, in milliseconds. */
const WRITE_WAIT_MS = 500;

/** The kept state of the main window. */
export type WindowStore = {
    /** The state the file holds, or null when it holds none. */
    read: () => WindowState | null;
    /** Keep a state; it is written after the wait unless a later one replaces it. */
    keep: (state: WindowState) => void;
    /** Write the state held now, if any. */
    flush: () => void;
};

export function createWindowStore(file: string, wait: number = WRITE_WAIT_MS): WindowStore {
    let held: WindowState | null = null;
    let timer: NodeJS.Timeout | undefined;

    function write(): void {
        clearTimeout(timer);
        timer = undefined;
        if (held === null) return;
        const text = windowFileText(held);
        held = null;
        const temporary = `${file}.${process.pid}.tmp`;
        try {
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(temporary, text);
            renameSync(temporary, file);
        } catch (error) {
            console.error(`window.json was not written: ${(error as Error).message}`);
        }
    }

    return {
        read: () => {
            try {
                return parseWindowFile(readFileSync(file, 'utf8'));
            } catch {
                return null;
            }
        },
        keep: (state) => {
            held = state;
            clearTimeout(timer);
            timer = setTimeout(write, wait);
        },
        flush: write
    };
}
