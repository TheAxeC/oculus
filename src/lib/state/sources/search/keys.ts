// Layer 2, client state, pure. The keys of the Search view's results and what each does on the row
// that holds the focus.
//
// The keymap is data handed to the tree the results are drawn in, which reads it as
// ui/tree/tree-keys.ts's `Chord`: a press that matches a chord is routed to the view with the
// chord's action, and every other key stays the tree's own. A key is matched on the physical key
// (`code`), so Shift does not change what it is. Cmd is the Meta key on macOS and the Control key
// elsewhere. The chords are VS Code's: Cmd+Shift+1 replaces the hit or the file in focus,
// Cmd+Shift+Enter also replaces the file in focus, Delete dismisses the row in focus, and on macOS
// that is Cmd+Backspace.

/** What a bound key asks the Search view to do. */
export type SearchAction = 'replace' | 'replace-file' | 'dismiss';

/** One chord of the keymap: the physical key, the modifiers held and the action it asks for. */
type SearchChord = {
    code: string;
    meta: boolean;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    action: SearchAction;
};

/** One chord as the table below writes it: Cmd stands for the platform's command key. */
type Entry = {
    code: string;
    cmd?: true;
    shift?: true;
    /** The platform the chord is bound on; absent for every platform. */
    only?: 'mac' | 'other';
    action: SearchAction;
};

const ENTRIES: readonly Entry[] = [
    { code: 'Digit1', cmd: true, shift: true, action: 'replace' },
    { code: 'Enter', cmd: true, shift: true, action: 'replace-file' },
    { code: 'Delete', only: 'other', action: 'dismiss' },
    { code: 'Backspace', cmd: true, only: 'mac', action: 'dismiss' }
];

/** The keymap of the Search results on a platform. */
export function searchKeymap(mac: boolean): SearchChord[] {
    return ENTRIES.filter((one) => one.only === undefined || (one.only === 'mac') === mac).map(
        (one) => ({
            code: one.code,
            meta: mac && one.cmd === true,
            ctrl: !mac && one.cmd === true,
            alt: false,
            shift: one.shift === true,
            action: one.action
        })
    );
}

/** What a result row is: a file's heading, or one hit. */
type RowKind = 'file' | 'hit';

/** What a bound key does on a row. */
export type SearchPlan = 'replace-hit' | 'replace-file' | 'dismiss-hit' | 'dismiss-file' | 'pass';

/**
 * What an action does on a row. Replace is offered only while the replace row is shown, as VS Code
 * offers it only while its replace widget is open; Dismiss is offered on every row.
 */
export function searchPlan(action: SearchAction, row: RowKind, replacing: boolean): SearchPlan {
    if (action === 'dismiss') return row === 'hit' ? 'dismiss-hit' : 'dismiss-file';
    if (!replacing) return 'pass';
    if (action === 'replace-file') return row === 'hit' ? 'pass' : 'replace-file';
    return row === 'hit' ? 'replace-hit' : 'replace-file';
}
