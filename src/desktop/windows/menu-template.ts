// Layer 2, server (the desktop host). The template of the application menu, which menu.ts hands
// Electron: oculus, File, Edit, View, Go, Run, Terminal, Window and Help. It is a function of the
// catalog's words, the actions, the platform and the recent workspaces, and imports only Electron's
// types, so a test reads it with no Electron. Every label is a catalog word.
//
// An item that runs a page command carries the command's name (data/helpers/keys/oculus/
// menu-commands.ts) as its id and sends that name to a page over the bridge; the page answers it
// as its key or its colon command does (shell/window/menu-answer.ts). The item shows the key the
// page binds for the command, read from the page's key tables (`commandKey` of
// data/helpers/keys/oculus/desktop-keys.ts). On macOS only a key that holds Cmd or Ctrl is shown,
// and the menu takes it when the page leaves the press, so a press runs the command once whoever
// answers it; a key that holds neither (`?`, F1, F5, F9, F10, F11) is shown on no item there.
// Off macOS every such key is shown with `registerAccelerator: false`, so the press reaches the
// page, which answers it. An item whose command has no key shows none.
//
// The menu's own items keep their keys, each one of ACCELERATORS, including on macOS those of the
// roles that quit, hide and minimize; off macOS those roles keep the accelerator Electron gives
// them. The Edit items keep their roles and their labels. Off macOS they do not register their
// accelerators, so Ctrl+Z, Ctrl+C and the others reach the page, where Monaco and the terminal
// answer them themselves, and a text field answers them as Chromium does. On macOS Electron
// registers a role's accelerator whatever `registerAccelerator` says (the option is Linux's and
// Windows' alone), so there the Edit roles hold Cmd+Z, Cmd+A and the others: Select All selects the
// text of the focused field, and a key sent to the page alone, as the DevTools protocol sends one
// without its `commands`, runs no role.
//
// A command goes to the window the reader is in when it is one of the app's entries, so Close Tab
// and Save act where the reader is, and to the main window focused last when no window is focused;
// Settings and Help go to the main window focused last; while a window that is none of the entries
// is focused, a presentation's audience window or an undocked DevTools window, no command is sent
// (`commandWindow`). Open in Browser opens the server of the entry the reader is in, else of the
// main window focused last, in the default browser (`openInBrowser`). Open Recent lists the recent
// workspaces the page last sent, a missing file drawn disabled, and sends `open-recent` with the
// chosen file's path.

import type { MenuItemConstructorOptions } from 'electron';
import { ACCELERATORS, commandKey } from '../../lib/data/helpers/keys/oculus/desktop-keys.ts';
import {
    profileCommand,
    type MenuCommand,
    type RecentEntry
} from '../../lib/data/helpers/keys/oculus/menu-commands.ts';
import { profileWords, TERMINAL_PROFILES } from '../../lib/data/model/machine/terminal-kinds.ts';
import type { Words } from '../../lib/server/root/process/words.ts';

/** What the menu's items ask of the app. */
export type MenuActions = {
    newWindow: () => void;
    closeWindow: () => void;
    /** Send a page command; `path` is Open Recent's workspace file. */
    command: (name: MenuCommand, path?: string) => void;
    zoom: (step: 'in' | 'out' | 'reset') => void;
    switchToMain: () => void;
    openInBrowser: () => void;
};

/** The commands that go to the main window focused last, wherever the reader is. */
const MAIN_ONLY: readonly MenuCommand[] = ['settings', 'help'];

/**
 * The window focused, as the menu reads it: one of the app's entries, no window, or a window that
 * is none of the entries, such as a presentation's audience window or an undocked DevTools window.
 */
export type Focused<W> = { kind: 'entry'; entry: W } | { kind: 'none' } | { kind: 'other' };

/**
 * The window focused, from Electron's focused window and whether its DevTools has the focus:
 * Electron answers the inspected window while its undocked DevTools is focused, so that window
 * reads as none of the entries.
 */
export function focusedOf<W, E extends { win: W }>(
    focus: { win: W; devTools: boolean } | null,
    entries: readonly E[]
): Focused<E> {
    if (focus === null) return { kind: 'none' };
    const entry = entries.find((one) => one.win === focus.win);
    if (entry === undefined || focus.devTools) return { kind: 'other' };
    return { kind: 'entry', entry };
}

/**
 * The window a command goes to: none while a window that is not one of the app's entries is
 * focused, the main window focused last for Settings and Help or with no window focused, else the
 * entry the reader is in.
 */
export function commandWindow<W>(
    name: MenuCommand,
    focused: Focused<W>,
    lastMain: W | null
): W | null {
    if (focused.kind === 'other') return null;
    if (focused.kind === 'none' || MAIN_ONLY.includes(name)) return lastMain;
    return focused.entry;
}

/**
 * Open the server of the window the reader is in, else of the main window focused last, in the
 * default browser; nothing with no window open.
 */
export function openInBrowser(
    reader: { origin: string } | null,
    lastMain: { origin: string } | null,
    open: (address: string) => void
): void {
    const from = reader ?? lastMain;
    if (from !== null) open(`${from.origin}/`);
}

/** The application menu's template on a platform, over the recent workspaces the page sent. */
export function menuTemplate(
    t: Words,
    actions: MenuActions,
    mac: boolean,
    recent: readonly RecentEntry[]
): MenuItemConstructorOptions[] {
    const separator: MenuItemConstructorOptions = { type: 'separator' };

    /**
     * The accelerator of a role whose own key Electron chooses per platform: set on macOS alone.
     */
    const roleKey = (accelerator: string): { accelerator?: string } => (mac ? { accelerator } : {});

    /** An item that sends a page command and shows the key the page binds for it. */
    const run = (command: MenuCommand, label: string): MenuItemConstructorOptions => {
        const key = commandKey(command, mac);
        return {
            id: command,
            label,
            ...(key === null
                ? {}
                : { accelerator: key, ...(mac ? {} : { registerAccelerator: false }) }),
            click: () => actions.command(command)
        };
    };

    const openRecent: MenuItemConstructorOptions = {
        label: t('desktop.menu.open_recent'),
        enabled: recent.length > 0,
        submenu: recent.map((one) => ({
            label: one.label,
            enabled: !one.missing,
            click: () => actions.command('open-recent', one.path)
        }))
    };

    return [
        {
            label: t('desktop.menu.app'),
            submenu: [
                { role: 'about', label: t('desktop.menu.about') },
                separator,
                {
                    id: 'settings',
                    label: t('desktop.menu.settings'),
                    accelerator: ACCELERATORS.settings,
                    click: () => actions.command('settings')
                },
                separator,
                { role: 'services', label: t('desktop.menu.services') },
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
                run('new-text-file', t('ui.strip_new_text_file')),
                {
                    label: t('desktop.menu.new_window'),
                    accelerator: ACCELERATORS.newWindow,
                    click: actions.newWindow
                },
                separator,
                run('open-folder', t('files.menu_open_folder')),
                openRecent,
                run('add-folder', t('files.menu_add_root')),
                separator,
                run('switch-workspace', t('files.menu_switch_workspace')),
                run('new-workspace', t('files.menu_new_workspace')),
                run('save-workspace-as', t('files.menu_save_workspace')),
                run('close-workspace', t('app.palette.cmd_workspace_close')),
                separator,
                run('save', t('source.bar_save')),
                run('save-all', t('desktop.menu.save_all')),
                run('revert-file', t('source.bar_revert')),
                separator,
                run('reopen-closed-tab', t('desktop.menu.reopen_closed_tab')),
                run('close-tab', t('desktop.menu.close_tab')),
                {
                    label: t('desktop.menu.close_window'),
                    accelerator: ACCELERATORS.closeWindow,
                    click: actions.closeWindow
                },
                separator,
                run('clone-repository', t('repositories.clone')),
                { label: t('files.menu_open_browser'), click: actions.openInBrowser }
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
                },
                separator,
                run('find', t('sessions.find_input')),
                run('find-in-files', t('desktop.menu.find_in_files'))
            ]
        },
        {
            label: t('desktop.menu.view'),
            submenu: [
                run('command-palette', t('desktop.menu.command_palette')),
                run('quick-open', t('desktop.menu.quick_open')),
                run('open-view', t('desktop.menu.open_view')),
                separator,
                run('toggle-left-dock', t('app.palette.cmd_toggle_left_dock')),
                run('toggle-right-dock', t('app.palette.cmd_toggle_right_dock')),
                run('toggle-bottom-dock', t('app.palette.cmd_toggle_bottom_dock')),
                separator,
                run('theme', t('desktop.menu.theme')),
                run('file-icon-theme', t('desktop.menu.file_icon_theme')),
                run('crt', t('desktop.menu.crt')),
                separator,
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
            label: t('desktop.menu.go'),
            submenu: [
                run('go-back', t('app.palette.cmd_go_back')),
                run('go-forward', t('app.palette.cmd_go_forward')),
                separator,
                run('go-to-file', t('desktop.menu.go_to_file')),
                run('go-to-symbol', t('desktop.menu.go_to_symbol')),
                run('go-to-line', t('desktop.menu.go_to_line')),
                run('go-to-project', t('desktop.menu.go_to_project'))
            ]
        },
        {
            label: t('desktop.menu.run'),
            submenu: [
                run('debug-start', t('desktop.menu.debug_start')),
                run('debug-stop', t('debug.stop')),
                run('debug-restart', t('debug.restart')),
                separator,
                run('debug-over', t('debug.step_over')),
                run('debug-into', t('debug.step_into')),
                run('debug-out', t('debug.step_out')),
                separator,
                run('debug-toggle', t('desktop.menu.toggle_breakpoint'))
            ]
        },
        {
            label: t('sessions.view_terminal'),
            submenu: [
                run('new-terminal', t('sessions.menu_new')),
                {
                    label: t('sessions.menu_new_profile'),
                    submenu: TERMINAL_PROFILES.map((kind) =>
                        run(profileCommand(kind), profileWords(kind, t))
                    )
                },
                run('split-terminal', t('sessions.menu_split'))
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
                separator,
                run('next-tab', t('desktop.menu.next_tab')),
                run('previous-tab', t('desktop.menu.previous_tab')),
                separator,
                { role: 'front', label: t('desktop.menu.front') },
                separator,
                { label: t('desktop.menu.switch_main'), click: actions.switchToMain }
            ]
        },
        {
            label: t('desktop.menu.help'),
            role: 'help',
            submenu: [
                {
                    id: 'help',
                    label: t('desktop.menu.help_item'),
                    click: () => actions.command('help')
                },
                run('keyboard-shortcuts', t('desktop.menu.keyboard_shortcuts')),
                run('update-tasks', t('desktop.menu.update_tasks'))
            ]
        }
    ];
}
