// Layer 1, data. The table the palette runs on: each prefix a query can start with and each key
// that opens, switches or answers the palette is one row. The functions that read a press
// (palette-keys.ts, resolve.ts) and a query (state/workbench/palette.ts), and the workbench that
// opens the palette on a prefix, take their characters and chords from these rows, and
// docs/palette.md is written from the same rows (utils/diagrams/palette.mjs), so a row added
// appears on the page and a row taken out stops working and leaves it. The rows of the walk keys
// and Escape are the exception: the walk keys are answered by the list component the palette is
// drawn with (bits-ui's Command) and Escape by the dialog it stands in (ui/frame/Modal.svelte, on
// bits-ui's Dialog), and the Enter of the task-add row is the list component's too, only its Shift
// is read; those rows are listed on the page and read by no function of oculus.

/** One press of a key: the key as an event reports it, and the modifiers it needs. */
export type Press = {
    key: string;
    /** Whether Cmd (macOS) or Ctrl (elsewhere) is held. */
    command?: true;
    shift?: true;
    /**
     * The key read from its physical position (`Key` and the letter) and not from the character it
     * types, for a press the desktop app reads that way.
     */
    byPosition?: true;
};

/**
 * A key of the palette: the presses that give it, the words of the text catalog saying it, and for
 * a key that opens the palette in a mode no prefix names, the words saying what a query then is.
 */
export type KeyRow = { word: string; presses: Press[]; mode?: string };

/** A prefix of a query: its character, and the words saying what the query then is. */
export type PrefixRow = {
    word: string;
    /** The character a query starts with. */
    prefix: string;
    /** What must follow the prefix and nothing more, for a query that names a number. */
    only?: { name: string; pattern: RegExp };
};

/** The keys, in the order of the page. */
export const KEY_ROWS = {
    open: { word: 'palette_page.key_open', presses: [{ key: 'k', command: true }] },
    commands: {
        word: 'palette_page.key_commands',
        presses: [{ key: 'p', command: true, shift: true }, { key: 'F1' }]
    },
    files: {
        word: 'palette_page.key_files',
        presses: [{ key: 'p', command: true }],
        mode: 'palette_page.prefix_files'
    },
    symbols: {
        word: 'palette_page.key_symbols',
        presses: [{ key: 't', command: true, byPosition: true }]
    },
    walk: {
        word: 'palette_page.key_walk',
        presses: [
            { key: 'ArrowUp' },
            { key: 'ArrowDown' },
            { key: 'Home' },
            { key: 'End' },
            { key: 'Enter' }
        ]
    },
    taskAdd: { word: 'palette_page.key_task_add', presses: [{ key: 'Enter', shift: true }] },
    close: { word: 'palette_page.key_close', presses: [{ key: 'Escape' }] }
} satisfies Record<string, KeyRow>;

/** The prefixes, in the order of the page. */
export const PREFIX_ROWS = {
    command: { word: 'palette_page.prefix_colon', prefix: ':' },
    line: {
        word: 'palette_page.prefix_line',
        prefix: ':',
        only: { name: 'number', pattern: /^\d+$/ }
    },
    symbols: { word: 'palette_page.prefix_symbols', prefix: '#' }
} satisfies Record<string, PrefixRow>;

/** The parts of a key event a press is read from. */
type PressEvent = {
    key: string;
    code?: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
};

/**
 * Whether the event is the press: the key, read from its position when the press says so, with the
 * command modifier held exactly when the press needs it (Cmd on macOS, Ctrl elsewhere, the other of
 * the two left to the editor, the terminal and the field), Shift held exactly when it needs it, and
 * Alt not held.
 */
export function isPress(press: Press, event: PressEvent, mac: boolean): boolean {
    const hit =
        press.byPosition === true
            ? event.code === `Key${press.key.toUpperCase()}`
            : event.key.toLowerCase() === press.key.toLowerCase();
    if (!hit || event.altKey === true) return false;
    const [meta, ctrl] = [event.metaKey === true, event.ctrlKey === true];
    if (press.command === true) {
        if (mac ? !meta || ctrl : !ctrl || meta) return false;
    } else if (meta || ctrl) {
        return false;
    }
    return (event.shiftKey === true) === (press.shift === true);
}

/** Whether a press or a click holds the Shift of the task-add row, which opens the task's page. */
export function opensTaskPage(event: { shiftKey: boolean }): boolean {
    return event.shiftKey === KEY_ROWS.taskAdd.presses[0].shift;
}
