// Layer 1, data. The page's own keys as tables, one press per key: the save key, the keys the
// desktop app hands the page, Find in Files and Replace in Files, Next Tab and Previous Tab, Go
// Back and Go Forward, the debugger's keys and the key sheet's character. The workbench resolves a
// press against these rows (resolve.ts, debug-keys.ts), a Save control's tooltip shows the save
// key (ui/controls/editor/chords.ts), and the desktop app's menu shows each row on the item that
// runs the same command (desktop-keys.ts), so no key is written twice. The module imports nothing,
// so the desktop host reads it as the page does.

/**
 * One key press: the physical key's name (`KeyB`, `BracketLeft`, `F8`, `Tab`), which is also
 * Monaco's, and the modifiers held with it.
 */
export type Press = {
    code: string;
    /** Cmd on macOS and Ctrl elsewhere, Monaco's CtrlCmd. */
    cmd?: true;
    /** The Ctrl key, on every platform. */
    ctrl?: true;
    shift?: true;
    /** The Alt key, Option on macOS, Monaco's Alt. */
    alt?: true;
};

/** The save key: Cmd+S, Ctrl+S off macOS. */
export const SAVE_PRESS = { code: 'KeyS', cmd: true } as const satisfies Press;

/**
 * The keys only the desktop app delivers to the page, Chrome keeping them for itself: Close Tab,
 * New Text File, the app's find bar and Reopen Closed Tab.
 */
export const APP_PRESSES = {
    'close-tab': { code: 'KeyW', cmd: true },
    'new-text-file': { code: 'KeyN', cmd: true },
    find: { code: 'KeyF', cmd: true },
    'reopen-closed-tab': { code: 'KeyT', cmd: true, shift: true }
} as const satisfies Record<string, Press>;

/** Find in Files and Replace in Files, VS Code's: Cmd+Shift+F and Cmd+Shift+H. */
export const SEARCH_PRESSES = {
    'find-in-files': { code: 'KeyF', cmd: true, shift: true },
    'replace-in-files': { code: 'KeyH', cmd: true, shift: true }
} as const satisfies Record<string, Press>;

/** Next Tab and Previous Tab of the desktop app: Ctrl+Tab and Ctrl+Shift+Tab, on every platform. */
export const CYCLE_PRESSES = {
    next: { code: 'Tab', ctrl: true },
    previous: { code: 'Tab', ctrl: true, shift: true }
} as const satisfies Record<string, Press>;

/**
 * VS Code's Go Back and Go Forward: Ctrl+Minus and Ctrl+Shift+Minus on macOS, and Ctrl+Alt+Minus
 * and Ctrl+Shift+Minus elsewhere.
 */
export function navigatePresses(mac: boolean): { 'go-back': Press; 'go-forward': Press } {
    return {
        'go-back': mac ? { code: 'Minus', ctrl: true } : { code: 'Minus', ctrl: true, alt: true },
        'go-forward': { code: 'Minus', ctrl: true, shift: true }
    };
}

/**
 * The debugger's keys, as VS Code binds them: F5 starts or continues, Shift+F5 stops, Cmd+Shift+F5
 * (Ctrl+Shift+F5 off macOS) restarts, F9 toggles a breakpoint at the caret, F10 steps over, F11
 * steps into and Shift+F11 out.
 */
export const DEBUG_PRESSES = {
    start: { code: 'F5' },
    stop: { code: 'F5', shift: true },
    restart: { code: 'F5', cmd: true, shift: true },
    toggle: { code: 'F9' },
    over: { code: 'F10' },
    into: { code: 'F11' },
    out: { code: 'F11', shift: true }
} as const satisfies Record<string, Press>;

/** The key sheet's key: the `?` typed, read from the character whatever key types it. */
export const SHEET_CHARACTER = '?';

/** The modifiers of a key event a press is held against. */
type Held = { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean };

/**
 * Whether an event holds exactly the modifiers of a press: Cmd on macOS and Ctrl elsewhere for
 * `cmd`, the Ctrl key for `ctrl`, Shift for `shift` and Alt for `alt`, and no other. Off macOS Cmd
 * and Ctrl are one key, and the Meta key is held by no press.
 */
export function holdsPress(press: Press, event: Held, mac: boolean): boolean {
    const meta = mac && press.cmd === true;
    const ctrl = press.ctrl === true || (!mac && press.cmd === true);
    return (
        (event.metaKey === true) === meta &&
        (event.ctrlKey === true) === ctrl &&
        (event.shiftKey === true) === (press.shift === true) &&
        (event.altKey === true) === (press.alt === true)
    );
}

/** The letter a press of a letter key types, lower case: `KeyF` is `f`; empty for any other key. */
export function letterOf(press: Press): string {
    return /^Key[A-Z]$/.test(press.code) ? press.code.slice(3).toLowerCase() : '';
}
