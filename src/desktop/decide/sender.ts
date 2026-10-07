// Layer 2, server (the desktop host). Who may call the bridge. A call is answered when it comes
// from the top frame of a page of the server's origin: the window's own page, the find bar's
// view, which is the server's `/find` route in a view of its own, or the hidden window that prints
// a deck, which is the server's print route. A subframe is never answered, whatever its origin,
// and neither is a frame of any other origin. The find bar and the print window are told apart by
// their addresses; the find bar may call only the find channels and the print window none. Pure
// functions, read by tests/server/desktop/window-guard.test.ts.

import { BAR_CHANNELS, PRINT_CHANNELS } from './channels.ts';

/** The frame a call came from, as far as the decision reads it. */
export type SenderFrame = { origin: string; isTop: boolean; pathname: string };

/**
 * Who the sender is: a window's page, the find bar, the print window, or no one the bridge answers.
 */
export type Sender = 'page' | 'find-bar' | 'print' | null;

/** The path the find bar's view loads. */
export const FIND_PATH = '/find';

/** The path the print window loads, and the only address the host prints. */
const PRINT_PATH = '/present/print';

/** Who `frame` is, given the origin of the server the window shows. */
export function senderOf(frame: SenderFrame, serverOrigin: string): Sender {
    if (!frame.isTop || frame.origin !== serverOrigin) return null;
    if (frame.pathname === FIND_PATH) return 'find-bar';
    return frame.pathname === PRINT_PATH ? 'print' : 'page';
}

/**
 * Whether a sender may call a channel: a window's page any, the find bar the find channels, the
 * print window the print channels.
 */
export function mayCall(who: Sender, channel: string): boolean {
    if (who === 'page') return true;
    if (who === 'find-bar') return BAR_CHANNELS.includes(channel);
    return who === 'print' && PRINT_CHANNELS.includes(channel);
}

/**
 * The address the host prints, or null for any other: an address of the server the window shows,
 * on the print route, naming the deck by `root` and `path`, with nothing else in it. The host loads
 * no other address in the print window.
 */
export function printTarget(address: string, serverOrigin: string): string | null {
    try {
        const url = new URL(address);
        const names = [...url.searchParams.keys()].sort().join(',');
        const kept =
            url.origin === serverOrigin &&
            url.pathname === PRINT_PATH &&
            url.hash === '' &&
            url.searchParams.has('root') &&
            names === 'path,root';
        return kept ? url.href : null;
    } catch {
        return null;
    }
}
