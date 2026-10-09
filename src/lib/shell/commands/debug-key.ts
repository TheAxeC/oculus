// Layer 3, shell. Carries out one debug key on the debug store: the toggle of a breakpoint at the
// caret, the start, the restart, the stop and the three steps. The steps and the stop act only on
// a session that can take them, so a key pressed with nothing to act on does nothing. It answers
// true for every key, which tells the key handler the press was taken.

import type { DebugKey } from '$lib/state/system/machine/debug/debug';
import type { ClientState } from '$lib/state/client/context';

/** Carry out one debug key. */
export function pressDebug(debug: ClientState['debug'], which: DebugKey): boolean {
    if (which === 'toggle') return debug.toggleAtCaret();
    if (which === 'start') void debug.press();
    else if (which === 'restart') {
        if (debug.active()) void debug.restart();
    } else if (which === 'stop') {
        if (debug.active() || debug.waiting() !== null) void debug.stop();
    } else if (debug.paused()) {
        void debug.resume(which === 'over' ? 'next' : which === 'into' ? 'stepIn' : 'stepOut');
    }
    return true;
}
