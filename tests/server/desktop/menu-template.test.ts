// Layer 2, server test. The desktop app's menu as its template gives it
// (desktop/windows/menu-template.ts), read with no Electron: the menus in their order, the command
// each item sends a page, the key each item shows and whether it takes it, Open Recent over the
// recent workspaces, and where a command and Open in Browser go. Each key an item shows is read
// back into the press it spells and resolved by the page's own key resolver, so a row fails when
// the menu shows a key the page binds to another command. The words are the catalog keys
// themselves, so a row names the label it means.
//
// What this does NOT cover: Electron building the menu from the template, macOS handing a press the
// page left to the menu, and the page's answer to a command
// (tests/shell/window/menu-answer.test.ts).

import { describe, expect, it } from 'vitest';
import type { MenuItemConstructorOptions } from 'electron';
import { eventOfChord, parseKeybinding } from '../../../src/lib/data/helpers/keys/keys.ts';
import { menuKeys } from '../../../src/lib/data/helpers/keys/oculus/desktop-keys.ts';
import {
    MENU_COMMANDS,
    type MenuCommand,
    type RecentEntry
} from '../../../src/lib/data/helpers/keys/oculus/menu-commands.ts';
import {
    paletteKeyOf,
    togglesPalette
} from '../../../src/lib/data/helpers/keys/oculus/palette-keys.ts';
import {
    initialKeyState,
    resolveKey,
    type KeyAction
} from '../../../src/lib/data/helpers/keys/oculus/resolve.ts';
import {
    commandWindow,
    focusedOf,
    menuTemplate,
    openInBrowser,
    type MenuActions
} from '../../../src/desktop/windows/menu-template.ts';

/** The words: each catalog key stands for itself. */
const t = (key: string): string => key;

/** The template on a platform over a recent list, with every command an item sends recorded. */
function made(mac: boolean, recent: RecentEntry[] = []) {
    const sent: { name: MenuCommand; path?: string }[] = [];
    const actions: MenuActions = {
        newWindow: () => undefined,
        closeWindow: () => undefined,
        command: (name, path) => void sent.push(path === undefined ? { name } : { name, path }),
        zoom: () => undefined,
        switchToMain: () => undefined,
        openInBrowser: () => undefined
    };
    return { menus: menuTemplate(t, actions, mac, recent), sent };
}

/** The items of a menu, separators left out. */
function itemsOf(menu: MenuItemConstructorOptions): MenuItemConstructorOptions[] {
    const items = Array.isArray(menu.submenu) ? menu.submenu : [];
    return items.filter((one) => one.type !== 'separator');
}

/** Every item of the template, the items of each submenu after the item that holds them. */
function everyItem(menus: MenuItemConstructorOptions[]): MenuItemConstructorOptions[] {
    return menus.flatMap((menu) => itemsOf(menu).flatMap((one) => [one, ...everyItem([one])]));
}

/** What a menu holds, item by item: the command it sends, else its role, else its label. */
function namesOf(menu: MenuItemConstructorOptions): string[] {
    return itemsOf(menu).map((one) => one.id ?? one.role ?? one.label ?? '');
}

/** The item that sends one command. */
function itemOf(menus: MenuItemConstructorOptions[], command: MenuCommand) {
    const found = everyItem(menus).find((one) => one.id === command);
    if (found === undefined) throw new Error(`no item sends ${command}`);
    return found;
}

/** Press an item, as Electron calls its click. */
function click(item: MenuItemConstructorOptions): void {
    (item.click as (() => void) | undefined)?.();
}

/** The action the page's resolver gives the press an accelerator spells, in the desktop app. */
function resolved(accelerator: string, mac: boolean): KeyAction | string | null {
    const chords = parseKeybinding(accelerator.toLowerCase());
    const event = chords === null ? null : eventOfChord(chords[0]);
    if (event === null) return null;
    if (togglesPalette(event)) return 'palette-open';
    const mode = paletteKeyOf(event, mac);
    if (mode !== null) return `palette-${mode}`;
    const context = {
        cursorActive: false,
        typing: false,
        paletteOpen: false,
        trayOpen: false,
        confirmOpen: false,
        mac,
        app: true
    };
    return resolveKey(event, { chords: {} }, context, initialKeyState(), 0).action;
}

/** The action of the page each command with a key runs, as its key resolves to it. */
const KEYED: [MenuCommand, KeyAction | string][] = [
    ['new-text-file', { kind: 'new-text-file' }],
    ['save', { kind: 'save' }],
    ['reopen-closed-tab', { kind: 'reopen-closed-tab' }],
    ['close-tab', { kind: 'close-tab' }],
    ['find', { kind: 'find' }],
    ['find-in-files', { kind: 'find-in-files' }],
    ['command-palette', 'palette-commands'],
    ['quick-open', 'palette-open'],
    ['go-back', { kind: 'go-back' }],
    ['go-forward', { kind: 'go-forward' }],
    ['go-to-file', 'palette-files'],
    ['go-to-symbol', { kind: 'workspace-symbol' }],
    ['debug-start', { kind: 'debug', which: 'start' }],
    ['debug-stop', { kind: 'debug', which: 'stop' }],
    ['debug-restart', { kind: 'debug', which: 'restart' }],
    ['debug-over', { kind: 'debug', which: 'over' }],
    ['debug-into', { kind: 'debug', which: 'into' }],
    ['debug-out', { kind: 'debug', which: 'out' }],
    ['debug-toggle', { kind: 'debug', which: 'toggle' }],
    ['next-tab', { kind: 'cycle-tab', by: 1 }],
    ['previous-tab', { kind: 'cycle-tab', by: -1 }]
];

describe('the menu template on macOS', () => {
    it('holds the menus and the items of each menu in their order', () => {
        const { menus } = made(true);
        expect(menus.map((menu) => menu.label)).toEqual([
            'desktop.menu.app',
            'desktop.menu.file',
            'desktop.menu.edit',
            'desktop.menu.view',
            'desktop.menu.go',
            'desktop.menu.run',
            'sessions.view_terminal',
            'desktop.menu.window',
            'desktop.menu.help'
        ]);
        expect(menus.map(namesOf)).toEqual([
            ['about', 'settings', 'services', 'hide', 'hideOthers', 'unhide', 'quit'],
            [
                'new-text-file',
                'desktop.menu.new_window',
                'open-folder',
                'desktop.menu.open_recent',
                'add-folder',
                'switch-workspace',
                'new-workspace',
                'save-workspace-as',
                'close-workspace',
                'save',
                'save-all',
                'revert-file',
                'reopen-closed-tab',
                'close-tab',
                'desktop.menu.close_window',
                'clone-repository',
                'files.menu_open_browser'
            ],
            ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll', 'find', 'find-in-files'],
            [
                'command-palette',
                'quick-open',
                'open-view',
                'toggle-left-dock',
                'toggle-right-dock',
                'toggle-bottom-dock',
                'theme',
                'file-icon-theme',
                'crt',
                'reload',
                'togglefullscreen',
                'desktop.menu.zoom_in',
                'desktop.menu.zoom_out',
                'desktop.menu.zoom_reset',
                'toggleDevTools'
            ],
            ['go-back', 'go-forward', 'go-to-file', 'go-to-symbol', 'go-to-line', 'go-to-project'],
            [
                'debug-start',
                'debug-stop',
                'debug-restart',
                'debug-over',
                'debug-into',
                'debug-out',
                'debug-toggle'
            ],
            ['new-terminal', 'sessions.menu_new_profile', 'split-terminal'],
            ['minimize', 'zoom', 'next-tab', 'previous-tab', 'front', 'desktop.menu.switch_main'],
            ['help', 'keyboard-shortcuts', 'update-tasks']
        ]);
        const profiles = everyItem(menus).find((one) => one.label === 'sessions.menu_new_profile');
        expect(profiles === undefined ? [] : namesOf(profiles)).toEqual([
            'terminal-shell',
            'terminal-claude',
            'terminal-codex'
        ]);
        expect(everyItem(menus).some((one) => /update/i.test(one.label ?? ''))).toBe(true);
        expect(everyItem(menus).some((one) => /check/i.test(one.label ?? ''))).toBe(false);
    });

    it('sends each command of the list once from its item, and only names of the list', () => {
        const { menus, sent } = made(true);
        const sending = everyItem(menus).filter((one) => one.id !== undefined);
        for (const item of sending) click(item);
        expect(sent.map((one) => one.name).sort()).toEqual(
            MENU_COMMANDS.filter((name) => name !== 'open-recent').sort()
        );
    });

    it('shows and takes the page key of each command whose key holds Cmd or Ctrl', () => {
        const { menus } = made(true);
        const shown = (command: MenuCommand) => itemOf(menus, command).accelerator;
        expect({
            save: shown('save'),
            closeTab: shown('close-tab'),
            newTextFile: shown('new-text-file'),
            quickOpen: shown('quick-open'),
            goToFile: shown('go-to-file'),
            commandPalette: shown('command-palette'),
            find: shown('find'),
            findInFiles: shown('find-in-files'),
            nextTab: shown('next-tab')
        }).toEqual({
            save: 'Cmd+S',
            closeTab: 'Cmd+W',
            newTextFile: 'Cmd+N',
            quickOpen: 'Cmd+K',
            goToFile: 'Cmd+P',
            commandPalette: 'Cmd+Shift+P',
            find: 'Cmd+F',
            findInFiles: 'Cmd+Shift+F',
            nextTab: 'Ctrl+Tab'
        });
        for (const [command, action] of KEYED) {
            const item = itemOf(menus, command);
            if (item.accelerator === undefined) continue;
            expect(item.registerAccelerator, command).not.toBe(false);
            expect(resolved(item.accelerator, true), command).toEqual(action);
            expect(menuKeys(), command).toContain(item.accelerator.toLowerCase());
        }
    });

    it('shows no key for a command whose key holds neither Cmd nor Ctrl', () => {
        const { menus } = made(true);
        for (const command of [
            'keyboard-shortcuts',
            'debug-start',
            'debug-stop',
            'debug-over',
            'debug-into',
            'debug-out',
            'debug-toggle'
        ] as const) {
            expect(itemOf(menus, command).accelerator, command).toBeUndefined();
        }
        expect(itemOf(menus, 'debug-restart').accelerator).toBe('Cmd+Shift+F5');
    });

    it('keeps the keys of its own items', () => {
        const { menus } = made(true);
        const own = everyItem(menus).filter((one) => one.id === undefined);
        const keyOf = (label: string) => own.find((one) => one.label === label)?.accelerator;
        expect(itemOf(menus, 'settings').accelerator).toBe('Cmd+,');
        expect(keyOf('desktop.menu.new_window')).toBe('Cmd+Shift+N');
        expect(keyOf('desktop.menu.close_window')).toBe('Cmd+Shift+W');
        expect(keyOf('desktop.menu.zoom_in')).toBe('Cmd+=');
        expect(keyOf('desktop.menu.quit')).toBe('Cmd+Q');
    });
});

describe('the menu template off macOS', () => {
    it('shows the page key of every command that has one, and registers none of them', () => {
        const { menus } = made(false);
        for (const [command, action] of KEYED) {
            const item = itemOf(menus, command);
            expect(item.accelerator, command).toBeDefined();
            expect(item.registerAccelerator, command).toBe(false);
            expect(resolved(item.accelerator ?? '', false), command).toEqual(action);
        }
        const shown = (command: MenuCommand) => itemOf(menus, command).accelerator;
        expect([shown('save'), shown('go-back'), shown('debug-start')]).toEqual([
            'Ctrl+S',
            'Ctrl+Alt+-',
            'F5'
        ]);
        expect(itemOf(menus, 'keyboard-shortcuts')).toMatchObject({
            accelerator: '?',
            registerAccelerator: false
        });
    });
});

describe('Open Recent', () => {
    it('lists each recent workspace, a missing one disabled, and sends the path chosen', () => {
        const { menus, sent } = made(true, [
            { path: '/hub/.oculus/workspaces/one.yml', label: 'one', missing: false },
            { path: '/hub/.oculus/workspaces/gone.yml', label: 'gone', missing: true }
        ]);
        const recent = everyItem(menus).find((one) => one.label === 'desktop.menu.open_recent');
        const entries = recent === undefined ? [] : itemsOf(recent);
        expect(entries.map((one) => [one.label, one.enabled !== false])).toEqual([
            ['one', true],
            ['gone', false]
        ]);
        click(entries[0]);
        expect(sent).toEqual([{ name: 'open-recent', path: '/hub/.oculus/workspaces/one.yml' }]);
    });

    it('is drawn disabled with no recent workspace', () => {
        const { menus } = made(true);
        const recent = everyItem(menus).find((one) => one.label === 'desktop.menu.open_recent');
        expect(recent?.enabled).toBe(false);
    });
});

describe('where a command and Open in Browser go', () => {
    const reader = { origin: 'http://127.0.0.1:8797' };
    const main = { origin: 'http://127.0.0.1:8790' };

    it("sends a command to the reader's entry, Settings, Help and Keyboard Shortcuts to the main window", () => {
        const inReader = { kind: 'entry', entry: reader } as const;
        expect(commandWindow('close-tab', inReader, main)).toBe(reader);
        expect(commandWindow('settings', inReader, main)).toBe(main);
        expect(commandWindow('help', inReader, main)).toBe(main);
        expect(commandWindow('keyboard-shortcuts', inReader, main)).toBe(main);
    });

    it('sends a command to the main window focused last while no window is focused', () => {
        expect(commandWindow('close-tab', { kind: 'none' }, main)).toBe(main);
        expect(commandWindow('settings', { kind: 'none' }, main)).toBe(main);
    });

    it('sends no command while a window that is none of the entries is focused', () => {
        // An audience window and an undocked DevTools window both read as `other`.
        expect(commandWindow('save', { kind: 'other' }, main)).toBeNull();
        expect(commandWindow('settings', { kind: 'other' }, main)).toBeNull();
    });

    it('reads an entry, no window, and a window of no entry or with its DevTools focused', () => {
        const one = { win: 'w1' };
        const two = { win: 'w2' };
        expect(focusedOf({ win: 'w2', devTools: false }, [one, two])).toEqual({
            kind: 'entry',
            entry: two
        });
        expect(focusedOf(null, [one, two])).toEqual({ kind: 'none' });
        expect(focusedOf({ win: 'audience', devTools: false }, [one, two])).toEqual({
            kind: 'other'
        });
        expect(focusedOf({ win: 'w1', devTools: true }, [one, two])).toEqual({ kind: 'other' });
    });

    it("opens the server of the reader's window, else of the main window, in the browser", () => {
        const opened: string[] = [];
        const shell = { openExternal: (address: string) => void opened.push(address) };
        openInBrowser(reader, main, shell.openExternal);
        openInBrowser(null, main, shell.openExternal);
        openInBrowser(null, null, shell.openExternal);
        expect(opened).toEqual(['http://127.0.0.1:8797/', 'http://127.0.0.1:8790/']);
    });
});
