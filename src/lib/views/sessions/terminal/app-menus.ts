// Layer 3, view helper of views/sessions/terminal/list/TerminalList.svelte and
// grid/TerminalGrid.svelte. The entries apps contribute to the menus of a terminal:
// `terminal/title/context` on a row of the Terminal tab's list and `terminal/context` on the grid.
// The entries are appended to oculus's own items under a rule and run with the terminal as the
// command's argument, `{ $terminal: id }`, which the app's host turns into its `Terminal` object.
// The context key `terminalProcessSupported` is true for a terminal oculus holds a process of (a
// tmux terminal) and false for one an app's host draws itself.

import type { MenuItem } from '$lib/ui/menu/menu-items';
import type { ClientState } from '$lib/state/client/shapes/client-state';
import { appMenu } from '$lib/views/shared/explorer/control/app-menu';

/** The menus of a terminal that apps contribute to. */
type TerminalMenu = 'terminal/context' | 'terminal/title/context';

/** What a list row and a grid read of the apps' entries, and how a pick runs one. */
export type TerminalAppMenus = {
    /** The entries of a menu for a terminal, read as the menu opens. */
    items: (menu: TerminalMenu, terminal: string) => MenuItem[];
    /** Run the entry a pick stands for on a terminal; false when the pick is oculus's own. */
    run: (pick: string, terminal: string, event: MouseEvent) => boolean;
};

export function terminalAppMenus(
    client: Pick<ClientState, 'appShell' | 'terminals'>
): TerminalAppMenus {
    const menu = appMenu(client.appShell);
    return {
        items(which, terminal) {
            const held = client.terminals.terminalById(terminal);
            const supported = held !== null && held.pid !== 0;
            return menu.items(which, { keys: { terminalProcessSupported: supported } });
        },
        run: (pick, terminal, event) => menu.run(pick, [{ $terminal: terminal }], event)
    };
}
