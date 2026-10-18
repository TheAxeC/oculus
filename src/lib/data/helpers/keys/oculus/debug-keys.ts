// Layer 1, data. The debugger's keys, read from their table (page-keys.ts, `DEBUG_PRESSES`), which
// the workbench resolves (resolve.ts), the terminal grid leaves to the workbench while a session
// runs, and the audit of an app's keybindings reads as keys oculus takes.

import { DEBUG_PRESSES, holdsPress } from './page-keys.ts';

/** What a debug key asks of the debugger. */
export type DebugKey = keyof typeof DEBUG_PRESSES;

/** The parts of a key press a debug key is read from. */
type KeyPress = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey'>;

/** The debug keys in the order a press is matched against them. */
const DEBUG_KEYS = Object.keys(DEBUG_PRESSES) as DebugKey[];

/**
 * The debug key a press is, as VS Code binds them: F5 starts or continues, Shift+F5 stops,
 * Cmd+Shift+F5 (Ctrl+Shift+F5 off macOS) restarts, F9 toggles a breakpoint at the caret, F10 steps
 * over, F11 steps into and Shift+F11 out. The function key is read from the key the event names,
 * which a function key's name and code share. Null for any other press, including the same keys
 * with Alt held or with the other of Cmd and Ctrl.
 */
export function debugKeyOf(press: KeyPress, mac: boolean): DebugKey | null {
    return (
        DEBUG_KEYS.find(
            (which) =>
                DEBUG_PRESSES[which].code === press.key &&
                holdsPress(DEBUG_PRESSES[which], press, mac)
        ) ?? null
    );
}
