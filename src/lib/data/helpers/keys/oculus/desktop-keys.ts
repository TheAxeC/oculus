// Layer 1, data. The accelerators of the desktop app's menu (desktop/windows/menu-template.ts). The
// menu's own items (Settings, New Window, the zooms and the roles that quit, hide and minimize)
// carry the keys written below, on macOS including the roles whose accelerator Electron would
// otherwise choose itself. An item that runs a page command shows the key the page binds for that
// command, read from the page's key tables (page-keys.ts and palette-table.ts's KEY_ROWS) and never
// written here: on macOS only a key that holds Cmd or Ctrl, which the menu then takes whenever the
// page leaves the press to it, and off macOS every such key, drawn and not registered. So
// ACCELERATORS is every key the menu takes on macOS, and the audit of an app's keybindings reads
// it as keys oculus takes there.

import { MENU_COMMANDS, type MenuCommand } from './menu-commands.ts';
import {
    APP_PRESSES,
    CYCLE_PRESSES,
    DEBUG_PRESSES,
    navigatePresses,
    SAVE_PRESS,
    SEARCH_PRESSES,
    SHEET_CHARACTER,
    type Press
} from './page-keys.ts';
import { KEY_ROWS, type Press as PalettePress } from './palette-table.ts';

/** The accelerator of each of the menu's own items, in Electron's syntax. */
const OWN = {
    settings: 'Cmd+,',
    newWindow: 'Cmd+Shift+N',
    closeWindow: 'Cmd+Shift+W',
    reload: 'Cmd+R',
    fullScreen: 'Ctrl+Cmd+F',
    zoomIn: 'Cmd+=',
    zoomOut: 'Cmd+-',
    zoomReset: 'Cmd+0',
    devTools: 'Alt+Cmd+I',
    hide: 'Cmd+H',
    hideOthers: 'Alt+Cmd+H',
    quit: 'Cmd+Q',
    minimize: 'Cmd+M'
} as const;

/**
 * The key a page command is bound to: a press of the page's tables, a palette key or a character.
 */
type BoundKey =
    | { kind: 'press'; press: Press }
    | { kind: 'palette'; press: PalettePress }
    | { kind: 'character'; character: string };

const press = (one: Press): BoundKey => ({ kind: 'press', press: one });
const palette = (one: PalettePress): BoundKey => ({ kind: 'palette', press: one });

/** The key the page binds for a menu command on a platform, or null for a command with none. */
function boundKey(command: MenuCommand, mac: boolean): BoundKey | null {
    const navigate = navigatePresses(mac);
    const keys: Partial<Record<MenuCommand, BoundKey>> = {
        'new-text-file': press(APP_PRESSES['new-text-file']),
        save: press(SAVE_PRESS),
        'reopen-closed-tab': press(APP_PRESSES['reopen-closed-tab']),
        'close-tab': press(APP_PRESSES['close-tab']),
        find: press(APP_PRESSES.find),
        'find-in-files': press(SEARCH_PRESSES['find-in-files']),
        'command-palette': palette(KEY_ROWS.commands.presses[0]),
        'quick-open': palette(KEY_ROWS.open.presses[0]),
        'go-back': press(navigate['go-back']),
        'go-forward': press(navigate['go-forward']),
        'go-to-file': palette(KEY_ROWS.files.presses[0]),
        'go-to-symbol': palette(KEY_ROWS.symbols.presses[0]),
        'debug-start': press(DEBUG_PRESSES.start),
        'debug-stop': press(DEBUG_PRESSES.stop),
        'debug-restart': press(DEBUG_PRESSES.restart),
        'debug-over': press(DEBUG_PRESSES.over),
        'debug-into': press(DEBUG_PRESSES.into),
        'debug-out': press(DEBUG_PRESSES.out),
        'debug-toggle': press(DEBUG_PRESSES.toggle),
        'next-tab': press(CYCLE_PRESSES.next),
        'previous-tab': press(CYCLE_PRESSES.previous),
        'keyboard-shortcuts': { kind: 'character', character: SHEET_CHARACTER }
    };
    return keys[command] ?? null;
}

/** The name Electron's syntax gives a physical key: `KeyS` is `S`, `Minus` is `-`, `F5` is `F5`. */
function keyName(code: string): string {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return code === 'Minus' ? '-' : code;
}

/** A bound key in Electron's syntax on a platform, with whether it holds Cmd or Ctrl. */
function acceleratorOf(key: BoundKey, mac: boolean): { text: string; command: boolean } {
    if (key.kind === 'character') return { text: key.character, command: false };
    const command = mac ? 'Cmd' : 'Ctrl';
    if (key.kind === 'palette') {
        const name = key.press.key.length === 1 ? key.press.key.toUpperCase() : key.press.key;
        const held = [
            key.press.command === true ? command : '',
            key.press.shift === true ? 'Shift' : ''
        ];
        return {
            text: [...held.filter((one) => one !== ''), name].join('+'),
            command: key.press.command === true
        };
    }
    const one = key.press;
    const ctrl = one.ctrl === true || (!mac && one.cmd === true);
    const held = [
        ctrl ? 'Ctrl' : '',
        mac && one.cmd === true ? 'Cmd' : '',
        one.alt === true ? 'Alt' : '',
        one.shift === true ? 'Shift' : ''
    ];
    return {
        text: [...held.filter((part) => part !== ''), keyName(one.code)].join('+'),
        command: ctrl || one.cmd === true
    };
}

/**
 * The accelerator a menu item that runs a page command shows: on macOS the page's key when it holds
 * Cmd or Ctrl, else none; off macOS the page's key, whatever it holds. Null for a command the page
 * binds no key for.
 */
export function commandKey(command: MenuCommand, mac: boolean): string | null {
    const key = boundKey(command, mac);
    if (key === null) return null;
    const accelerator = acceleratorOf(key, mac);
    return mac && !accelerator.command ? null : accelerator.text;
}

/** A page command that is none of the menu's own items, which carry their keys in OWN. */
type PageCommand = Exclude<MenuCommand, keyof typeof OWN>;

/** The keys the menu takes on macOS for the page commands, by command. */
function pageAccelerators(): Partial<Record<PageCommand, string>> {
    return Object.fromEntries(
        MENU_COMMANDS.flatMap((command) => {
            const key = commandKey(command, true);
            return key === null ? [] : [[command, key]];
        })
    );
}

/**
 * Every key the menu takes on macOS: its own items' and those of the page commands it shows, in
 * Electron's syntax.
 */
export const ACCELERATORS: typeof OWN & Partial<Record<PageCommand, string>> = {
    ...OWN,
    ...pageAccelerators()
};

/**
 * The keys the menu takes on macOS as an app's keybinding writes a key, `Cmd+Shift+N` as
 * `cmd+shift+n`: the menu's own and the page commands' it takes when the page leaves the press.
 */
export function menuKeys(): string[] {
    return Object.values(ACCELERATORS).map((accelerator) => accelerator.toLowerCase());
}
