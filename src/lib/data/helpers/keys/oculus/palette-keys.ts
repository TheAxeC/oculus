// Layer 1, data. The keys that open the palette: F1, Cmd+Shift+P and Cmd+P by mode, Cmd+K and
// Ctrl+K, and the colon. The workbench's key handler (shell/keys/workbench-keys.svelte.ts) and the
// terminal grid answer a press through these, and the audit of an app's keybindings asks them
// whether oculus takes a key.

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
 * Cmd+P the file mode, VS Code's three. Cmd is the Meta key on macOS and the Control key elsewhere,
 * the other of the two left to the editor, the terminal and the field (on macOS Ctrl+P is the
 * cursor up of a text and the previous line of a shell). The letter is the typed one, as Cmd+K's
 * is, since the browser's own key for it (print) is the typed letter's too. F1 answers with no
 * modifier held.
 */
export function paletteKeyOf(event: PaletteKeyEvent, mac: boolean): PaletteKey | null {
    const [meta, ctrl, shift, alt] = [
        event.metaKey === true,
        event.ctrlKey === true,
        event.shiftKey === true,
        event.altKey === true
    ];
    if (event.key === 'F1') return meta || ctrl || shift || alt ? null : 'commands';
    if (event.key.toLowerCase() !== 'p' || alt) return null;
    if (mac ? !meta || ctrl : !ctrl || meta) return null;
    return shift ? 'commands' : 'files';
}

/** Whether the key is Cmd+K or Ctrl+K, which opens the palette or closes it when it is open. */
export function togglesPalette(event: PaletteKeyEvent): boolean {
    return (event.metaKey === true || event.ctrlKey === true) && event.key.toLowerCase() === 'k';
}

/** Whether the key is the colon bare, which opens the palette in its command line. */
export function opensCommandLine(event: PaletteKeyEvent): boolean {
    return (
        event.key === ':' &&
        event.metaKey !== true &&
        event.ctrlKey !== true &&
        event.altKey !== true
    );
}
