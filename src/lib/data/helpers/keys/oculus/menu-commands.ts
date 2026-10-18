// Layer 1, data. The names of the commands the desktop app's menu sends a page over the bridge's
// `command` message, one fixed list that the host's menu (desktop/windows/menu-template.ts) and the
// page's answer (shell/window/menu-answer.ts) both read, so a name the one side sends is a name the
// other answers. Beside it, the command that starts a terminal of each kind New Terminal With
// Profile offers (the kinds are data/model/machine/terminal-kinds.ts), and the entry of the recent
// workspaces a page hands the host for Open Recent. The module imports nothing but those kinds,
// which import only a type, so the host reads it as the page does.

import { TERMINAL_PROFILES, type TerminalProfile } from '../../../model/machine/terminal-kinds.ts';

/** The command of the menu that starts a terminal of one kind. */
export function profileCommand(kind: TerminalProfile): `terminal-${TerminalProfile}` {
    return `terminal-${kind}`;
}

/** The commands a page answers, in the order of the menu. */
export const MENU_COMMANDS = [
    'settings',
    'new-text-file',
    'open-folder',
    'open-recent',
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
    'clone-repository',
    'find',
    'find-in-files',
    'command-palette',
    'quick-open',
    'open-view',
    'toggle-left-dock',
    'toggle-right-dock',
    'toggle-bottom-dock',
    'theme',
    'file-icon-theme',
    'crt',
    'go-back',
    'go-forward',
    'go-to-file',
    'go-to-symbol',
    'go-to-line',
    'go-to-project',
    'debug-start',
    'debug-stop',
    'debug-restart',
    'debug-over',
    'debug-into',
    'debug-out',
    'debug-toggle',
    'new-terminal',
    ...TERMINAL_PROFILES.map(profileCommand),
    'split-terminal',
    'next-tab',
    'previous-tab',
    'help',
    'keyboard-shortcuts',
    'update-tasks'
] as const;

/** One command of the menu. */
export type MenuCommand = (typeof MENU_COMMANDS)[number];

/** Whether a value is the name of a command of the menu. */
export function isMenuCommand(value: unknown): value is MenuCommand {
    return typeof value === 'string' && (MENU_COMMANDS as readonly string[]).includes(value);
}

/**
 * One recent workspace file as Open Recent lists it: its path, its words and whether it is gone.
 */
export type RecentEntry = { path: string; label: string; missing: boolean };
