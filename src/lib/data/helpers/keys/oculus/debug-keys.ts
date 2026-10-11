// Layer 1, data. The debugger's keys, which the workbench resolves (resolve.ts), the terminal grid
// leaves to the workbench while a session runs, and the audit of an app's keybindings reads as keys
// oculus takes.

/** What a debug key asks of the debugger. */
export type DebugKey = 'start' | 'stop' | 'restart' | 'toggle' | 'over' | 'into' | 'out';

/** The parts of a key press a debug key is read from. */
type Press = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey'>;

/**
 * The debug key a press is, as VS Code binds them: F5 starts or continues, Shift+F5 stops,
 * Cmd+Shift+F5 (Ctrl+Shift+F5 off macOS) restarts, F9 toggles a breakpoint at the caret, F10 steps
 * over, F11 steps into and Shift+F11 out. Null for any other press, including the same keys with
 * Alt held or with the other of Cmd and Ctrl.
 */
export function debugKeyOf(press: Press, mac: boolean): DebugKey | null {
    if (press.altKey || (mac ? press.ctrlKey : press.metaKey)) return null;
    const command = mac ? press.metaKey : press.ctrlKey;
    if (press.key === 'F5') {
        if (command) return press.shiftKey ? 'restart' : null;
        return press.shiftKey ? 'stop' : 'start';
    }
    if (command) return null;
    if (press.key === 'F9') return press.shiftKey ? null : 'toggle';
    if (press.key === 'F10') return press.shiftKey ? null : 'over';
    if (press.key === 'F11') return press.shiftKey ? 'out' : 'into';
    return null;
}
