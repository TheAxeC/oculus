// Layer 3, view helper. The handler xterm asks about every key before it sends the key to the
// program: a find key is the find bar's, and while a debug session runs a debug key is the
// debugger's, so the program gets neither. Both answer false to keep the key from the program; the
// find keys are also taken from the page, and a debug key goes on to the workbench's key handler,
// which runs it. With no session the program gets every key but the find keys.

import { debugKeyOf } from '$lib/state/system/machine/debug/debug';
import { findKey, type FindAction } from '../terminal-list';

/** What the handler reads of the grid and of the debugger, each read as the key arrives. */
export type GridKeys = {
    mac: boolean;
    /** Whether the find bar is open. */
    finding: () => boolean;
    /** Carry out a find key. */
    find: (action: FindAction) => void;
    /** Whether a debug session is starting, running or paused. */
    debugging: () => boolean;
};

/** The key handler for xterm's `attachCustomKeyEventHandler`. */
export function gridKeys(held: GridKeys): (event: KeyboardEvent) => boolean {
    return (event) => {
        if (held.debugging() && debugKeyOf(event, held.mac) !== null) return false;
        const action = findKey(event, { mac: held.mac, where: 'grid', open: held.finding() });
        if (action === null) return true;
        if (event.type === 'keydown') {
            event.preventDefault();
            held.find(action);
        }
        return false;
    };
}
