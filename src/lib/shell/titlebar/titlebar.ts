// Layer 3, shell. What the window's title bar strip draws, apart from the component so it can be
// read without a DOM: the room it leaves for the window buttons and the words of its Command
// Center.

/**
 * Where the strip leaves room for the window buttons: at its left in the macOS app, where the
 * buttons sit inside the strip; at its right in the app on another system, where they are drawn
 * over the strip's right end; none in a browser, and none in full screen, where they are hidden.
 */
export type ButtonsRoom = 'left' | 'right' | 'none';

export function buttonsRoom(app: boolean, mac: boolean, full: boolean): ButtonsRoom {
    if (!app || full) return 'none';
    return mac ? 'left' : 'right';
}

/** The open workspace file as the strip reads it: its name and the hub that holds it. */
type OpenWorkspace = { name: string; hub: string };

/**
 * The Command Center's words: the open workspace's name, as VS Code shows the workspace there,
 * after the name of the hub that holds it when the two differ, as the workspace list writes a name
 * two hubs share (`hub/name`); `untitled` with no workspace file open; nothing while the
 * workspaces are still being read.
 */
export function centerWords(
    open: OpenWorkspace | null,
    loading: boolean,
    untitled: string
): string {
    if (loading) return '';
    if (open === null) return untitled;
    return open.hub === '' || open.hub === open.name ? open.name : `${open.hub}/${open.name}`;
}
