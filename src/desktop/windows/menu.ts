// Layer 2, server (the desktop host). The application menu, the macOS one: oculus, File, Edit,
// View, Window and Help. Every label is a catalog word. Cmd+W is on no item, so it reaches the
// page, which closes the active tab; the Edit items keep their roles and their labels but do not
// register their accelerators, so Cmd+Z, Cmd+C and the others reach the page, where Monaco and the
// terminal answer them themselves, and a text field answers them as Chromium does. The menu's own
// commands that the page answers (Settings, Help) are sent to a main window over the bridge.

import { Menu, type MenuItemConstructorOptions } from 'electron';
import type { Words } from '../../lib/server/root/process/words.ts';

/** What the menu's items ask of the app. */
export type MenuActions = {
    newWindow: () => void;
    closeWindow: () => void;
    command: (name: 'settings' | 'help') => void;
    zoom: (step: 'in' | 'out' | 'reset') => void;
    switchToMain: () => void;
};

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
                    accelerator: 'Cmd+,',
                    click: () => actions.command('settings')
                },
                separator,
                { role: 'hide', label: t('desktop.menu.hide') },
                { role: 'hideOthers', label: t('desktop.menu.hide_others') },
                { role: 'unhide', label: t('desktop.menu.show_all') },
                separator,
                { role: 'quit', label: t('desktop.menu.quit') }
            ]
        },
        {
            label: t('desktop.menu.file'),
            submenu: [
                {
                    label: t('desktop.menu.new_window'),
                    accelerator: 'Cmd+Shift+N',
                    click: actions.newWindow
                },
                {
                    label: t('desktop.menu.close_window'),
                    accelerator: 'Cmd+Shift+W',
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
                { role: 'reload', label: t('desktop.menu.reload'), accelerator: 'Cmd+R' },
                {
                    role: 'togglefullscreen',
                    label: t('desktop.menu.full_screen'),
                    accelerator: 'Ctrl+Cmd+F'
                },
                separator,
                {
                    label: t('desktop.menu.zoom_in'),
                    accelerator: 'Cmd+=',
                    click: () => actions.zoom('in')
                },
                {
                    label: t('desktop.menu.zoom_out'),
                    accelerator: 'Cmd+-',
                    click: () => actions.zoom('out')
                },
                {
                    label: t('desktop.menu.zoom_reset'),
                    accelerator: 'Cmd+0',
                    click: () => actions.zoom('reset')
                },
                separator,
                {
                    role: 'toggleDevTools',
                    label: t('desktop.menu.devtools'),
                    accelerator: 'Alt+Cmd+I'
                }
            ]
        },
        {
            label: t('desktop.menu.window'),
            role: 'window',
            submenu: [
                { role: 'minimize', label: t('desktop.menu.minimize') },
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
