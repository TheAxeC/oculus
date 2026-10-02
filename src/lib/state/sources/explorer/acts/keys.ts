// Layer 2, client state, pure. The keys of the file browser's tree and what each does on the row
// that holds the focus.
//
// The keymap is data handed to the tree, which reads it as ui/tree/tree-keys.ts's `Chord` (the same
// fields, with the action as text): the tree routes a press that matches a chord to the view, and
// every other key stays the tree's own. A letter chord is
// matched on the physical key (`code`), since Option changes the character a letter types on
// macOS. Cmd is the Meta key on macOS and the Control key elsewhere. `keyPlan` decides what a bound
// action does on a row, so Enter on a root, on the header or over a multiple selection can be seen
// to do nothing without a DOM.

/** What a bound key asks the file browser to do. */
export type FilesAction =
    | 'rename'
    | 'open'
    | 'delete'
    | 'copy'
    | 'cut'
    | 'paste'
    | 'cancel-cut'
    | 'copy-path'
    | 'copy-relative'
    | 'open-background'
    | 'undo'
    | 'redo'
    | 'select-all'
    | 'extend-up'
    | 'extend-down';

/** One chord as the table below writes it: Cmd stands for the platform's command key. */
type Entry = {
    code: string;
    cmd?: true;
    alt?: true;
    shift?: true;
    action: FilesAction;
};

/** The keys, as VS Code's Explorer binds them on macOS. */
const ENTRIES: readonly Entry[] = [
    { code: 'Enter', action: 'rename' },
    { code: 'F2', action: 'rename' },
    { code: 'ArrowDown', cmd: true, action: 'open' },
    { code: 'Backspace', cmd: true, action: 'delete' },
    { code: 'KeyC', cmd: true, action: 'copy' },
    { code: 'KeyX', cmd: true, action: 'cut' },
    { code: 'KeyV', cmd: true, action: 'paste' },
    { code: 'Escape', action: 'cancel-cut' },
    { code: 'KeyC', cmd: true, alt: true, action: 'copy-path' },
    { code: 'KeyC', cmd: true, alt: true, shift: true, action: 'copy-relative' },
    { code: 'Space', action: 'open-background' },
    { code: 'KeyZ', cmd: true, action: 'undo' },
    { code: 'KeyZ', cmd: true, shift: true, action: 'redo' },
    { code: 'KeyA', cmd: true, action: 'select-all' },
    { code: 'ArrowUp', shift: true, action: 'extend-up' },
    { code: 'ArrowDown', shift: true, action: 'extend-down' }
];

/** One chord of the keymap: the physical key, the modifiers held and the action it asks for. */
export type FilesChord = {
    code: string;
    meta: boolean;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    action: FilesAction;
};

/** The keymap of the file browser's tree on a platform: Cmd is Meta on macOS and Ctrl elsewhere. */
export function filesKeymap(mac: boolean): FilesChord[] {
    return ENTRIES.map((one) => ({
        code: one.code,
        meta: mac && one.cmd === true,
        ctrl: !mac && one.cmd === true,
        alt: one.alt === true,
        shift: one.shift === true,
        action: one.action
    }));
}

/** The words a key hint is written with: one per modifier, and one per key that is not a letter. */
export type KeyWords = {
    cmd: string;
    ctrl: string;
    alt: string;
    shift: string;
    keys: Record<string, string>;
};

/**
 * The words a platform writes its keys with, from a catalog reader: Cmd and Option on macOS, Ctrl
 * and Alt elsewhere, where the Cmd chords are Ctrl chords.
 */
export function keyWords(t: (key: string) => string, mac: boolean): KeyWords {
    return {
        cmd: mac ? t('files.key_cmd') : t('files.key_ctrl'),
        ctrl: t('files.key_ctrl'),
        alt: mac ? t('files.key_option') : t('files.key_alt'),
        shift: t('files.key_shift'),
        keys: {
            Enter: t('files.key_enter'),
            Backspace: t('files.key_backspace'),
            ArrowDown: t('files.key_down'),
            ArrowUp: t('files.key_up'),
            Escape: t('files.key_escape'),
            Space: t('files.key_space'),
            F2: t('files.key_f2')
        }
    };
}

/**
 * The hint of the first chord that asks for an action, as VS Code's menu writes it: the modifiers
 * in the order Ctrl, Option or Alt, Shift, Cmd, then the key. Null for an action no chord asks for.
 */
export function chordHint(
    keymap: readonly FilesChord[],
    action: FilesAction,
    words: KeyWords
): string | null {
    const chord = keymap.find((one) => one.action === action);
    if (chord === undefined) return null;
    const key = words.keys[chord.code] ?? chord.code.replace(/^Key/, '');
    return [
        chord.ctrl ? words.ctrl : null,
        chord.alt ? words.alt : null,
        chord.shift ? words.shift : null,
        chord.meta ? words.cmd : null,
        key
    ]
        .filter((part): part is string => part !== null)
        .join('+');
}

/** What the focused row is, for deciding what a key does on it. */
export type KeyRow = {
    /** The row is a root's own line. */
    root: boolean;
    kind: 'file' | 'dir';
    /** How many rows the action would act on. */
    acting: number;
    /** How many of those are not a root's line. */
    actable: number;
    /** Whether the clipboard holds a Cut. */
    cutting: boolean;
};

/** What a bound key does on a row; `pass` leaves the key to whatever else would take it. */
export type KeyPlan =
    | 'nothing'
    | 'pass'
    | 'rename'
    | 'open-preview'
    | 'toggle'
    | 'delete'
    | 'copy'
    | 'cut'
    | 'paste'
    | 'cancel-cut'
    | 'copy-path'
    | 'copy-relative'
    | 'open-background'
    | 'undo'
    | 'redo'
    | 'select-all'
    | 'extend-up'
    | 'extend-down';

/**
 * What an action does on the focused row. Rename needs one row that is not a root; delete, cut and
 * copy need at least one row that is not a root; Cmd+Down opens a file as the preview tab and
 * toggles a folder; Escape cancels a cut only while there is one; Space opens a file in the
 * background and leaves a folder alone.
 */
export function keyPlan(action: FilesAction, row: KeyRow): KeyPlan {
    switch (action) {
        case 'rename':
            return row.root || row.acting > 1 ? 'nothing' : 'rename';
        case 'open':
            return row.kind === 'file' && !row.root ? 'open-preview' : 'toggle';
        case 'delete':
        case 'cut':
        case 'copy':
            return row.actable === 0 ? 'nothing' : action;
        case 'cancel-cut':
            return row.cutting ? 'cancel-cut' : 'pass';
        case 'open-background':
            return row.kind === 'file' && !row.root ? 'open-background' : 'pass';
        default:
            return action;
    }
}
