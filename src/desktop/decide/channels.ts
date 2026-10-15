// Layer 2, server (the desktop host). The names the bridge's messages travel under between a page's
// preload and the host. preload.cjs spells the same names: a sandboxed preload is one file and
// cannot import this module, so the two lists are kept side by side and read together.

/** A page sending to the host: the arrangement to save, answered at once. */
export const SAVE_LAYOUT = 'oculus:save-layout';

/** A page asking the host for something, nothing answered. */
export const OPEN_FLOAT_WINDOW = 'oculus:open-float-window';
export const CLOSE_SELF = 'oculus:close-self';
export const FOCUS_MAIN = 'oculus:focus-main';
export const SHOW_FIND = 'oculus:show-find';

/** A double press on the empty part of the page's title bar strip, nothing answered. */
export const TITLE_DOUBLE_CLICK = 'oculus:title-double-click';

/**
 * A page telling the host the colours its title bar strip is drawn in, for the window buttons the
 * system draws over the strip off macOS, nothing answered.
 */
export const TITLE_COLOURS = 'oculus:title-colours';

/** A page asking whether its window is in full screen, answered with the state. */
export const FULL_SCREEN = 'oculus:full-screen';

/** The find channels, which the find bar's view may use as well as a window's page. */
export const FIND = 'oculus:find';
export const STOP_FIND = 'oculus:stop-find';
export const CLOSE_FIND = 'oculus:close-find';

/**
 * A page asking the host to print an address of its own server's print route to a PDF, answered
 * with the bytes or the reason it could not.
 */
export const PRINT_PDF = 'oculus:print-pdf';

/** A page handing the host a released tab, answered with whether a window took it. */
export const DROP_OUTSIDE = 'oculus:drop-outside';

/** The window a tab was handed to telling the host whether it took the tab. */
export const DROP_TAKEN = 'oculus:drop-taken';

/** The host sending a page a message by name. */
export const EVENT = 'oculus:event';

/** The channels the find bar's view may use. */
export const BAR_CHANNELS: readonly string[] = [FIND, STOP_FIND, CLOSE_FIND];

/** The channels the print route's page may use: none, since the host reads its readiness itself. */
export const PRINT_CHANNELS: readonly string[] = [];
