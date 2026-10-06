// Layer 2, server (the desktop host). Who may call the bridge. A call is answered when it comes
// from the top frame of a page of the server's origin: the window's own page, or the find bar's
// view, which is the server's `/find` route in a view of its own. A subframe is never answered,
// whatever its origin, and neither is a frame of any other origin. The find bar is told apart by
// its address, and it may call only the find channels. Pure functions, read by
// tests/server/desktop/window-guard.test.ts.

import { BAR_CHANNELS } from './channels.ts';

/** The frame a call came from, as far as the decision reads it. */
export type SenderFrame = { origin: string; isTop: boolean; pathname: string };

/** Who the sender is: a window's page, the find bar, or no one the bridge answers. */
export type Sender = 'page' | 'find-bar' | null;

/** The path the find bar's view loads. */
export const FIND_PATH = '/find';

/** Who `frame` is, given the origin of the server the window shows. */
export function senderOf(frame: SenderFrame, serverOrigin: string): Sender {
    if (!frame.isTop || frame.origin !== serverOrigin) return null;
    return frame.pathname === FIND_PATH ? 'find-bar' : 'page';
}

/** Whether a sender may call a channel: a window's page any, the find bar the find channels. */
export function mayCall(who: Sender, channel: string): boolean {
    if (who === 'page') return true;
    return who === 'find-bar' && BAR_CHANNELS.includes(channel);
}
