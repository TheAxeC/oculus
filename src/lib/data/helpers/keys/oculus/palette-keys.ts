// Layer 1, data. The keys that open the palette: F1, Cmd+Shift+P and Cmd+P by mode, Cmd+K and
// Ctrl+K, and the colon. The workbench's key handler (shell/keys/workbench-keys.svelte.ts) and the
// terminal grid answer a press through these, and the audit of an app's keybindings asks them
// whether oculus takes a key. The keys and the colon are the rows of the palette table
// (palette-table.ts).

import { isPress, KEY_ROWS, PREFIX_ROWS } from './palette-table.ts';
import type { Press } from './palette-table.ts';

/** Which mode of the palette a key opens: the colon commands or the file mode. */
export type PaletteKey = 'commands' | 'files';

/** The parts of a key event the palette keys read. */
type PaletteKeyEvent = {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
};

/**
 * The mode a key opens, or null for any other key: F1 and Cmd+Shift+P open the command mode, and
 * Cmd+P the file mode, VS Code's three. The presses are the rows of the palette table
 * (palette-table.ts), where Cmd is the Meta key on macOS and the Control key elsewhere, the other
 * of the two left to the editor, the terminal and the field (on macOS Ctrl+P is the cursor up of a
 * text and the previous line of a shell). The letter is the typed one, as Cmd+K's is, since the
 * browser's own key for it (print) is the typed letter's too. F1 answers with no modifier held.
 */
export function paletteKeyOf(event: PaletteKeyEvent, mac: boolean): PaletteKey | null {
    for (const mode of ['commands', 'files'] as const) {
        if (KEY_ROWS[mode].presses.some((press) => isPress(press, event, mac))) return mode;
    }
    return null;
}

/**
 * Whether the key is a press of the open row, its command modifier read as Cmd or Ctrl on every
 * platform: Cmd+K or Ctrl+K opens the palette or closes it when it is open. The workbench leaves a
 * press made in the editor to the editor, where Cmd+K starts Monaco's chords.
 */
export function togglesPalette(event: PaletteKeyEvent): boolean {
    const held = event.metaKey === true || event.ctrlKey === true;
    return KEY_ROWS.open.presses.some(
        (press: Press) => press.key === event.key.toLowerCase() && (press.command === true) === held
    );
}

/** Whether the key is the colon bare, which opens the palette in its command line. */
export function opensCommandLine(event: PaletteKeyEvent): boolean {
    return (
        event.key === PREFIX_ROWS.command.prefix &&
        event.metaKey !== true &&
        event.ctrlKey !== true &&
        event.altKey !== true
    );
}
