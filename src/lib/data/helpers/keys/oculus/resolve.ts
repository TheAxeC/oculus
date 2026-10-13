// Layer 1, data. The workbench's keyboard routing, free of the DOM: which action a press of a key
// resolves to given the guards the workbench reads (a field typed in, an overlay open, the desktop
// app, a debug session), so that shortcut precedence is testable and the audit of an app's
// keybindings can ask whether oculus takes a key by resolving it. The workbench
// (shell/keys/workbench-keys.svelte.ts) supplies the guards and performs the returned action.

import { debugKeyOf, type DebugKey } from './debug-keys.ts';
import { SAVE_PRESS } from './editor-keys.ts';
import { isPress, KEY_ROWS } from './palette-table.ts';

/** The part of the rail's order the keys read: the lists a one-letter chord counts into. */
export type ChordOrder = { chords: Record<string, readonly string[] | undefined> };

export type KeyContext = {
    cursorActive: boolean;
    typing: boolean;
    paletteOpen: boolean;
    trayOpen: boolean;
    confirmOpen: boolean;
    /** Whether the command modifier is Cmd (macOS) and not Ctrl; macOS when absent. */
    mac?: boolean;
    /**
     * Whether the page is in the desktop app, which hands the page the keys Chrome keeps for
     * itself: Cmd+W, Cmd+N, Cmd+F, Cmd+T, Ctrl+Tab and Ctrl+Shift+Tab. In a browser they never
     * arrive.
     */
    app?: boolean;
    /** Whether a debug session is starting, running or paused. */
    debugging?: boolean;
    /** Whether the focus is in the editor of a source tab whose file takes breakpoints. */
    breakpointFocus?: boolean;
};

export type KeyEventLike = {
    key: string;
    /** The physical key, which names the letter of a chord Option turns into another character. */
    code?: string;
    defaultPrevented?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
};

export type KeyState = {
    chord: string;
    chordAt: number;
    lastG: number;
};

export type KeyAction =
    | { kind: 'open'; view: string }
    | { kind: 'page'; index: number }
    | { kind: 'tab'; index: number }
    | { kind: 'cycle-tab'; by: 1 | -1 }
    | { kind: 'cursor'; direction: 'left' | 'right' | 'up' | 'down' }
    | { kind: 'move'; direction: 'left' | 'right' }
    | { kind: 'activate' }
    | { kind: 'search' }
    | { kind: 'find-in-files' }
    | { kind: 'replace-in-files' }
    | { kind: 'scroll'; edge: 'top' | 'bottom' }
    | { kind: 'sheet' }
    | { kind: 'new-session' }
    | { kind: 'command-default'; which: 'build' | 'test' }
    | { kind: 'save' }
    | { kind: 'tex-view' }
    | { kind: 'toggle-problems' }
    | { kind: 'next-problem'; by: 1 | -1 }
    | { kind: 'debug'; which: DebugKey }
    | { kind: 'close-tab' }
    | { kind: 'new-text-file' }
    | { kind: 'find' }
    | { kind: 'workspace-symbol' }
    | { kind: 'clear-cursor' };

/**
 * What one key resolves to. `swallow` is a debug key the browser must not have, whether or not an
 * action follows: a key under an overlay does nothing and is still kept from the browser.
 */
export type KeyResult = { action: KeyAction | null; state: KeyState; swallow?: boolean };

export const CHORD_MS = 1500;
export const DOUBLE_G_MS = 500;

export function initialKeyState(): KeyState {
    return { chord: '', chordAt: 0, lastG: 0 };
}

/**
 * The default build on Cmd+Shift+B and the default test on Cmd+Alt+T (Ctrl in place of Cmd off
 * macOS), or null. The letter is read from the physical key, since Option and T type another
 * character on macOS. Both answer while a field is typed in, as the numbered tab keys do, and under
 * no overlay.
 */
function defaultCommand(event: KeyEventLike, context: KeyContext): 'build' | 'test' | null {
    if (event.defaultPrevented === true) return null;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) return null;
    const mac = context.mac !== false;
    if ((mac ? event.metaKey : event.ctrlKey) !== true) return null;
    if ((mac ? event.ctrlKey : event.metaKey) === true) return null;
    if (event.code === 'KeyB' && event.shiftKey === true && event.altKey !== true) return 'build';
    if (event.code === 'KeyT' && event.altKey === true && event.shiftKey !== true) return 'test';
    return null;
}

/**
 * Whether the key is Cmd+Alt+X (Ctrl+Alt+X off macOS), LaTeX Workshop's Show TeX View. The letter
 * is read from the physical key, since Option and X type another character on macOS. It answers
 * while a field is typed in, as the editor is one, and under no overlay.
 */
function showsTexView(event: KeyEventLike, context: KeyContext): boolean {
    if (event.defaultPrevented === true) return false;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) return false;
    const mac = context.mac !== false;
    if ((mac ? event.metaKey : event.ctrlKey) !== true) return false;
    if ((mac ? event.ctrlKey : event.metaKey) === true) return false;
    return event.code === 'KeyX' && event.altKey === true && event.shiftKey !== true;
}

/**
 * Whether the key is Cmd+Shift+M (Ctrl+Shift+M off macOS), which shows the Problems view and, when
 * that view is the one on screen, hides it. The letter is read from the physical key. On macOS
 * Ctrl+Shift+M is the LaTeX tab's math chord and is not this key. It answers while a field is
 * typed in, as the editor is one, and under no overlay.
 */
function togglesProblems(event: KeyEventLike, context: KeyContext): boolean {
    if (event.defaultPrevented === true) return false;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) return false;
    const mac = context.mac !== false;
    if ((mac ? event.metaKey : event.ctrlKey) !== true) return false;
    if ((mac ? event.ctrlKey : event.metaKey) === true) return false;
    return event.code === 'KeyM' && event.shiftKey === true && event.altKey !== true;
}

/**
 * F8 (+1) and Shift+F8 (-1), which step to the next and the previous problem. They answer with a
 * field focused, as the editor is one, and under no overlay.
 */
function problemStep(event: KeyEventLike, context: KeyContext): 1 | -1 | null {
    if (event.defaultPrevented === true) return null;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) return null;
    if (event.key !== 'F8' || event.metaKey === true || event.ctrlKey === true) return null;
    if (event.altKey === true) return null;
    return event.shiftKey === true ? -1 : 1;
}

/**
 * Whether the key is Cmd+S (Ctrl+S off macOS), which saves the source tab on screen. The letter is
 * read from the physical key, since Option and S type another character on macOS. It answers with
 * a field focused, as the editor is one, and under an overlay, where the key is still taken from
 * the browser, whose own save dialog the page never wants.
 */
function savesFile(event: KeyEventLike, context: KeyContext): boolean {
    if (event.defaultPrevented === true) return false;
    const mac = context.mac !== false;
    if ((mac ? event.metaKey : event.ctrlKey) !== true) return false;
    if ((mac ? event.ctrlKey : event.metaKey) === true) return false;
    return event.code === SAVE_PRESS.code && event.shiftKey !== true && event.altKey !== true;
}

/**
 * The key only the desktop app delivers: Cmd+W closes the active tab of the focused pane, Cmd+N
 * opens a new text file in it, Cmd+F opens the find bar, and Cmd+T opens the palette on the symbols
 * of the workspace (`#`). Cmd and the letter alone, the letter read from the physical key; each
 * answers with a field focused, as the editor is one, and under no overlay. A view that takes
 * Cmd+F itself (Monaco, the terminal) calls preventDefault first, and then the key is not the
 * page's.
 */
function appKey(event: KeyEventLike, context: KeyContext): KeyAction | null {
    if (context.app !== true || event.defaultPrevented === true) return null;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) return null;
    const mac = context.mac !== false;
    if ((mac ? event.metaKey : event.ctrlKey) !== true) return null;
    if ((mac ? event.ctrlKey : event.metaKey) === true) return null;
    if (event.shiftKey === true || event.altKey === true) return null;
    if (event.code === 'KeyW') return { kind: 'close-tab' };
    if (event.code === 'KeyN') return { kind: 'new-text-file' };
    if (event.code === 'KeyF') return { kind: 'find' };
    if (KEY_ROWS.symbols.presses.some((press) => isPress(press, event, mac))) {
        return { kind: 'workspace-symbol' };
    }
    return null;
}

/**
 * A debug key (F5, Shift+F5, Cmd+Shift+F5, F9, F10, F11, Shift+F11) answers with a field or the
 * editor focused and under no overlay, as the default build does. It is swallowed, so the browser
 * never reloads the page or goes fullscreen on it, whenever a debug session runs or the editor
 * of a file that takes breakpoints has the focus, and under an overlay it then does nothing; with
 * neither, an overlay leaves the key to the browser.
 */
function debugAction(event: KeyEventLike, context: KeyContext, state: KeyState): KeyResult | null {
    if (event.defaultPrevented === true) return null;
    const which = debugKeyOf(
        {
            key: event.key,
            shiftKey: event.shiftKey === true,
            metaKey: event.metaKey === true,
            ctrlKey: event.ctrlKey === true,
            altKey: event.altKey === true
        },
        context.mac !== false
    );
    if (which === null) return null;
    const swallow = context.debugging === true || context.breakpointFocus === true;
    if (context.paletteOpen || context.trayOpen || context.confirmOpen) {
        return { action: null, state, swallow };
    }
    return { action: { kind: 'debug', which }, state: { ...state, chord: '' }, swallow };
}

/** Resolve one workbench key, retaining only the two short-lived chord timestamps. */
export function resolveKey(
    event: KeyEventLike,
    order: ChordOrder,
    context: KeyContext,
    state: KeyState,
    now: number
): KeyResult {
    // A modifier chord is not typing, so the numbered tab keys answer with a field focused and
    // under an overlay; Cmd plus a digit is left to the browser, which has its own use for it.
    if (event.ctrlKey === true && event.metaKey !== true && /^[1-9]$/.test(event.key)) {
        return { action: { kind: 'tab', index: Number(event.key) }, state };
    }
    // Cmd+Shift+F and Cmd+Shift+H open the Search view, the second with its replace row shown, as
    // VS Code's Find in Files and Replace in Files do. Cmd is the Meta key on macOS and the Control
    // key elsewhere, so the chord is the one of the two held. Like the tab keys it answers with a
    // field focused, and an overlay keeps the keyboard while it is open.
    const command = (event.metaKey === true) !== (event.ctrlKey === true);
    if (
        command &&
        event.shiftKey === true &&
        event.altKey !== true &&
        event.defaultPrevented !== true &&
        !context.paletteOpen &&
        !context.trayOpen &&
        !context.confirmOpen &&
        (event.key.toLowerCase() === 'f' || event.key.toLowerCase() === 'h')
    ) {
        const kind = event.key.toLowerCase() === 'f' ? 'find-in-files' : 'replace-in-files';
        return { action: { kind }, state: { ...state, chord: '' } };
    }
    if (savesFile(event, context)) {
        return { action: { kind: 'save' }, state: { ...state, chord: '' } };
    }
    if (showsTexView(event, context)) {
        return { action: { kind: 'tex-view' }, state: { ...state, chord: '' } };
    }
    if (togglesProblems(event, context)) {
        return { action: { kind: 'toggle-problems' }, state: { ...state, chord: '' } };
    }
    const step = problemStep(event, context);
    if (step !== null) {
        return { action: { kind: 'next-problem', by: step }, state: { ...state, chord: '' } };
    }
    const which = defaultCommand(event, context);
    if (which !== null) {
        return { action: { kind: 'command-default', which }, state: { ...state, chord: '' } };
    }
    const taken = appKey(event, context);
    if (taken !== null) return { action: taken, state: { ...state, chord: '' } };
    const debug = debugAction(event, context, state);
    if (debug !== null) return debug;
    const held = context.typing || context.paletteOpen || context.trayOpen || context.confirmOpen;
    // Ctrl and a bracket carry the focused pane one tab along, the left one backwards. The browser
    // keeps Ctrl and Tab for its own tabs and never hands it to a page, so in a browser the pair is
    // the brackets, which Chrome binds to nothing; in the desktop app Ctrl+Tab and Ctrl+Shift+Tab
    // do the same, since the app has no browser tabs to keep them for. A field, a textarea and an
    // overlay keep the keyboard while they hold it, and Cmd and a bracket is left alone, being a
    // browser's own navigation.
    if (
        context.app === true &&
        event.key === 'Tab' &&
        event.ctrlKey === true &&
        event.metaKey !== true &&
        event.altKey !== true &&
        event.defaultPrevented !== true &&
        !held
    ) {
        return {
            action: { kind: 'cycle-tab', by: event.shiftKey === true ? -1 : 1 },
            state: { ...state, chord: '' }
        };
    }
    if (
        (event.key === ']' || event.key === '[') &&
        event.ctrlKey === true &&
        event.metaKey !== true &&
        event.altKey !== true &&
        event.defaultPrevented !== true &&
        !held
    ) {
        return {
            action: { kind: 'cycle-tab', by: event.key === ']' ? 1 : -1 },
            state: { ...state, chord: '' }
        };
    }
    if (held || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return { action: null, state };
    }

    if (event.key === 'Escape' && context.cursorActive) {
        return { action: { kind: 'clear-cursor' }, state: { ...state, chord: '' } };
    }
    if (event.key === '?') {
        return { action: { kind: 'sheet' }, state: { ...state, chord: '' } };
    }
    if (Object.hasOwn(order.chords, event.key)) {
        return { action: null, state: { ...state, chord: event.key, chordAt: now } };
    }
    if (/^[1-9]$/.test(event.key)) {
        const cleared = { ...state, chord: '' };
        // A live chord names the list the digit counts into, and a digit past that list opens
        // nothing rather than falling through to a rail page, which would be a different surface.
        const chorded = now - state.chordAt < CHORD_MS ? order.chords[state.chord] : undefined;
        if (chorded !== undefined) {
            const view = chorded.at(Number(event.key) - 1);
            return {
                action: view === undefined ? null : { kind: 'open', view },
                state: cleared
            };
        }
        return { action: { kind: 'page', index: Number(event.key) }, state: cleared };
    }

    const cleared = { ...state, chord: '' };
    // The shifted cursor keys carry the card under the cursor rather than the cursor, which is the
    // keyboard path to the reorder the pointer does by dragging a card onto its neighbour.
    if (context.cursorActive && (event.key === 'J' || event.key === 'K')) {
        return {
            action: { kind: 'move', direction: event.key === 'J' ? 'left' : 'right' },
            state: cleared
        };
    }
    if (event.key === 'j' || event.key === 'ArrowLeft') {
        return { action: { kind: 'cursor', direction: 'left' }, state: cleared };
    }
    if (event.key === 'k' || event.key === 'ArrowRight') {
        return { action: { kind: 'cursor', direction: 'right' }, state: cleared };
    }
    if (event.key === 'i' || event.key === 'ArrowUp') {
        return { action: { kind: 'cursor', direction: 'up' }, state: cleared };
    }
    if (event.key === 'o' || event.key === 'ArrowDown') {
        return { action: { kind: 'cursor', direction: 'down' }, state: cleared };
    }
    if (event.key === 'Enter' && context.cursorActive) {
        return { action: { kind: 'activate' }, state: cleared };
    }
    if (event.key === '/') return { action: { kind: 'search' }, state: cleared };
    // `n` starts a new agent session: the composer, in the page's Terminal tab. No chord prefix of
    // the catalogue's groups is `n`, and `direct_chord` is `v`.
    if (event.key === 'n') return { action: { kind: 'new-session' }, state: cleared };
    if (event.key === 'G') {
        return { action: { kind: 'scroll', edge: 'bottom' }, state: { ...cleared, lastG: 0 } };
    }
    if (event.key === 'g') {
        if (state.lastG > 0 && now - state.lastG < DOUBLE_G_MS) {
            return {
                action: { kind: 'scroll', edge: 'top' },
                state: { ...cleared, lastG: 0 }
            };
        }
        return { action: null, state: { ...cleared, lastG: now } };
    }
    return { action: null, state: cleared };
}
