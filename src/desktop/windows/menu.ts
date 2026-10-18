// Layer 2, server (the desktop host). The application menu: Electron's Menu built from the template
// of menu-template.ts on this platform, over the recent workspaces a page last sent (bridge.ts).
// The template holds the menus, the page command each item sends, the key each item shows and
// whether it takes it; the app (app.ts) builds the menu again when a page sends a new recent list.

import { Menu } from 'electron';
import type { RecentEntry } from '../../lib/data/helpers/keys/oculus/menu-commands.ts';
import type { Words } from '../../lib/server/root/process/words.ts';
import { menuTemplate, type MenuActions } from './menu-template.ts';

/** The application menu, made from the catalog's words. */
export function buildMenu(t: Words, actions: MenuActions, recent: readonly RecentEntry[]): Menu {
    return Menu.buildFromTemplate(menuTemplate(t, actions, process.platform === 'darwin', recent));
}
