// Layer 2, server (the desktop host). The application menu, the macOS one: oculus, File, Edit,
// View, Window and Help. Every label is a catalog word. Cmd+W is on no item, so it reaches the
// page, which closes the active tab. The Edit items keep their roles and their labels. Off macOS
// they do not register their accelerators, so Ctrl+Z, Ctrl+C and the others reach the page, where
// Monaco and the terminal answer them themselves, and a text field answers them as Chromium does.
// On macOS Electron registers a role's accelerator whatever `registerAccelerator` says (the option
// is Linux's and Windows' alone), so there the Edit roles hold Cmd+Z, Cmd+A and the others: Select
// All selects the text of the focused field, and a key sent to the page alone, as the DevTools
// protocol sends one without its `commands`, runs no role. The menu's own commands that the page
// answers (Settings, Help) are sent to a main window over the bridge. Every accelerator is one of
// ACCELERATORS (data/helpers/keys/oculus/desktop-keys.ts), including on macOS those of the roles
// that quit, hide and minimize, so the list is every key the menu takes there besides the Edit
// roles' own. Off macOS those roles keep the accelerator Electron gives them on that platform.

import { Menu, type MenuItemConstructorOptions } from 'electron';
import { ACCELERATORS } from '../../lib/data/helpers/keys/oculus/desktop-keys.ts';
import type { Words } from '../../lib/server/root/process/words.ts';

/** What the menu's items ask of the app. */
export type MenuActions = {
    newWindow: () => void;
    closeWindow: () => void;
    command: (name: 'settings' | 'help') => void;
    zoom: (step: 'in' | 'out' | 'reset') => void;
    switchToMain: () => void;
};

/** The accelerator of a role whose own key Electron chooses per platform: set on macOS alone. */
function roleKey(accelerator: string): { accelerator?: string } {
    return process.platform === 'darwin' ? { accelerator } : {};
}

/** The application menu, made from the catalog's words. */
export function buildMenu(t: Words, actions: MenuActions): Menu {
    const separator: MenuItemConstructorOptions = { type: 'separator' };
    const template: MenuItemConstructorOptions[] = [
        {
            label: t('desktop.menu.app'),
            submenu: [
                { role: 'about', label: t('desktop.menu.about') },
                separator,
                {
                    label: t('desktop.menu.settings'),
                    accelerator: ACCELERATORS.settings,
                    click: () => actions.command('settings')
                },
                separator,
                { role: 'hide', label: t('desktop.menu.hide'), ...roleKey(ACCELERATORS.hide) },
                {
                    role: 'hideOthers',
                    label: t('desktop.menu.hide_others'),
                    ...roleKey(ACCELERATORS.hideOthers)
                },
                { role: 'unhide', label: t('desktop.menu.show_all') },
                separator,
                { role: 'quit', label: t('desktop.menu.quit'), ...roleKey(ACCELERATORS.quit) }
            ]
        },
        {
            label: t('desktop.menu.file'),
            submenu: [
                {
                    label: t('desktop.menu.new_window'),
                    accelerator: ACCELERATORS.newWindow,
                    click: actions.newWindow
                },
                {
                    label: t('desktop.menu.close_window'),
                    accelerator: ACCELERATORS.closeWindow,
                    click: actions.closeWindow
                }
            ]
        },
        {
            label: t('desktop.menu.edit'),
            submenu: [
                { role: 'undo', label: t('desktop.menu.undo'), registerAccelerator: false },
                { role: 'redo', label: t('desktop.menu.redo'), registerAccelerator: false },
                separator,
                { role: 'cut', label: t('desktop.menu.cut'), registerAccelerator: false },
                { role: 'copy', label: t('desktop.menu.copy'), registerAccelerator: false },
                { role: 'paste', label: t('desktop.menu.paste'), registerAccelerator: false },
                {
                    role: 'selectAll',
                    label: t('desktop.menu.select_all'),
                    registerAccelerator: false
                }
            ]
        },
        {
            label: t('desktop.menu.view'),
            submenu: [
                {
                    role: 'reload',
                    label: t('desktop.menu.reload'),
                    accelerator: ACCELERATORS.reload
                },
                {
                    role: 'togglefullscreen',
                    label: t('desktop.menu.full_screen'),
                    accelerator: ACCELERATORS.fullScreen
                },
                separator,
                {
                    label: t('desktop.menu.zoom_in'),
                    accelerator: ACCELERATORS.zoomIn,
                    click: () => actions.zoom('in')
                },
                {
                    label: t('desktop.menu.zoom_out'),
                    accelerator: ACCELERATORS.zoomOut,
                    click: () => actions.zoom('out')
                },
                {
                    label: t('desktop.menu.zoom_reset'),
                    accelerator: ACCELERATORS.zoomReset,
                    click: () => actions.zoom('reset')
                },
                separator,
                {
                    role: 'toggleDevTools',
                    label: t('desktop.menu.devtools'),
                    accelerator: ACCELERATORS.devTools
                }
            ]
        },
        {
            label: t('desktop.menu.window'),
            role: 'window',
            submenu: [
                {
                    role: 'minimize',
                    label: t('desktop.menu.minimize'),
                    ...roleKey(ACCELERATORS.minimize)
                },
                { role: 'zoom', label: t('desktop.menu.zoom') },
                { role: 'front', label: t('desktop.menu.front') },
                separator,
                { label: t('desktop.menu.switch_main'), click: actions.switchToMain }
            ]
        },
        {
            label: t('desktop.menu.help'),
            role: 'help',
            submenu: [{ label: t('desktop.menu.help_item'), click: () => actions.command('help') }]
        }
    ];
    return Menu.buildFromTemplate(template);
}
