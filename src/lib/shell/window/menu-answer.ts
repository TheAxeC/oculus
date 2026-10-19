// Layer 3, shell. A page's answer to a command of the desktop app's menu, which the host sends over
// the bridge's `command` message with the command's name
// (data/helpers/keys/oculus/menu-commands.ts) and, for Open Recent, the workspace file's path. Each
// name runs the page command its key or its colon command runs: a key's action goes to the
// workbench's own carrying out of keys (`act`, shell/keys/workbench-keys.svelte.ts), so Close Tab
// closes in the pane the reader is in; a colon command that takes an argument or lists choices
// opens the palette typed with its name and a space, as a press of its row does; one that runs at
// once runs its effect (shell/window/colon-effects.ts). Save and Revert File ask the source tab
// on screen, as the palette's editor actions do; Save on any other tab saves what the tab's views
// registered, as the save key does. Settings, Help and Keyboard Shortcuts open as views of the
// page; the host sends them to a main window alone (desktop/windows/menu-template.ts). A command
// that is unavailable says why as a notice, in the words its palette row carries. Under an overlay
// (the palette, the update tray or a confirm) nothing runs, as no key runs there; nor does a name
// not in the list or an argument a command does not take.

import type { KeyAction } from '$lib/data/helpers/keys/oculus/resolve';
import { isMenuCommand, type MenuCommand } from '$lib/data/helpers/keys/oculus/menu-commands';
import type { TerminalProfile } from '$lib/state/sessions/terminals.svelte';
import { PREFIX_ROWS } from '$lib/data/helpers/keys/oculus/palette-table';
import type { ClientState } from '$lib/state/client/context';
import { commands, type CommandOutcome } from '$lib/state/workbench/palette';
import {
    REVERT_ACTION,
    sourceOnScreen
} from '$lib/state/workbench/navigation/editor-status.svelte';
import { SETTINGS_VIEW } from '$lib/state/workbench/navigation/rail';
import { colonEffects, dockEdgeOf, dockedEdges, opensAsMode, pressRefusal } from './colon-effects';
import { sourceKeys } from './source-keys';
import { t } from '$lib/state/shared/words/text';

/** What the menu's commands ask of a page. */
export type MenuPage = {
    /** Whether an overlay holds the keys, under which no command runs. */
    covered: () => boolean;
    /** Carry out a key's action, as its press does. */
    act: (action: KeyAction) => void;
    /** Open the palette typed with `prefill`, in the file mode or as Go to Line. */
    openPalette: (prefill: string, files: boolean, line: boolean) => void;
    openView: (view: string) => void;
    /** Run a colon command by its name, as a press of its row with nothing typed after it. */
    colon: (name: string) => void;
    save: () => void;
    saveAll: () => void;
    revert: () => void;
    /** Start a terminal of a kind, as the Terminal tab's New and its kinds list do. */
    terminal: (kind: TerminalProfile) => void;
    /** Split the terminal the Terminal tab on screen shows, as its Split does. */
    split: () => void;
    /** Open a workspace file, as a pick of `:workspace` does. */
    openRecent: (path: string) => void;
};

/** The command line's prefix, which Command Palette and Go to Line open the palette with. */
const COLON = PREFIX_ROWS.command.prefix;

/** What each command of the menu but Open Recent runs. */
const RUNS: Record<Exclude<MenuCommand, 'open-recent'>, (page: MenuPage) => void> = {
    settings: (page) => page.openView(SETTINGS_VIEW),
    'new-text-file': (page) => page.act({ kind: 'new-text-file' }),
    'open-folder': (page) => page.colon('folder'),
    'add-folder': (page) => page.colon('folder-add'),
    'switch-workspace': (page) => page.colon('workspace'),
    'new-workspace': (page) => page.colon('workspace-new'),
    'save-workspace-as': (page) => page.colon('workspace-save'),
    'close-workspace': (page) => page.colon('workspace-close'),
    save: (page) => page.save(),
    'save-all': (page) => page.saveAll(),
    'revert-file': (page) => page.revert(),
    'reopen-closed-tab': (page) => page.act({ kind: 'reopen-closed-tab' }),
    'close-tab': (page) => page.act({ kind: 'close-tab' }),
    'clone-repository': (page) => page.colon('clone'),
    find: (page) => page.act({ kind: 'find' }),
    'find-in-files': (page) => page.act({ kind: 'find-in-files' }),
    'command-palette': (page) => page.openPalette(COLON, false, false),
    'quick-open': (page) => page.openPalette('', false, false),
    'open-view': (page) => page.colon('tab'),
    'toggle-left-dock': (page) => page.colon('toggle-left-dock'),
    'toggle-right-dock': (page) => page.colon('toggle-right-dock'),
    'toggle-bottom-dock': (page) => page.colon('toggle-bottom-dock'),
    theme: (page) => page.colon('theme'),
    'file-icon-theme': (page) => page.colon('file-icons'),
    crt: (page) => page.colon('crt'),
    'go-back': (page) => page.act({ kind: 'go-back' }),
    'go-forward': (page) => page.act({ kind: 'go-forward' }),
    'go-to-file': (page) => page.openPalette('', true, false),
    'go-to-symbol': (page) => page.act({ kind: 'workspace-symbol' }),
    'go-to-line': (page) => page.openPalette(COLON, false, true),
    'go-to-project': (page) => page.colon('goto'),
    'debug-start': (page) => page.act({ kind: 'debug', which: 'start' }),
    'debug-stop': (page) => page.act({ kind: 'debug', which: 'stop' }),
    'debug-restart': (page) => page.act({ kind: 'debug', which: 'restart' }),
    'debug-over': (page) => page.act({ kind: 'debug', which: 'over' }),
    'debug-into': (page) => page.act({ kind: 'debug', which: 'into' }),
    'debug-out': (page) => page.act({ kind: 'debug', which: 'out' }),
    'debug-toggle': (page) => page.act({ kind: 'debug', which: 'toggle' }),
    'new-terminal': (page) => page.terminal('shell'),
    'terminal-shell': (page) => page.terminal('shell'),
    'terminal-claude': (page) => page.terminal('claude'),
    'terminal-codex': (page) => page.terminal('codex'),
    'split-terminal': (page) => page.split(),
    'next-tab': (page) => page.act({ kind: 'cycle-tab', by: 1 }),
    'previous-tab': (page) => page.act({ kind: 'cycle-tab', by: -1 }),
    help: (page) => page.openView('help'),
    'keyboard-shortcuts': (page) => page.openView('keys'),
    'update-tasks': (page) => page.colon('update')
};

/**
 * Answer one command the menu sent: true when it ran. Open Recent takes the workspace file's path
 * as its one argument, and every other command takes none.
 */
export function answerMenu(page: MenuPage, name: unknown, argument?: unknown): boolean {
    if (!isMenuCommand(name) || page.covered()) return false;
    if (name === 'open-recent') {
        if (typeof argument !== 'string' || argument === '') return false;
        page.openRecent(argument);
        return true;
    }
    if (argument !== undefined) return false;
    RUNS[name](page);
    return true;
}

/** What a page hands the answer beside its client: the workbench's own parts. */
export type MenuDeps = {
    covered: () => boolean;
    act: (action: KeyAction) => void;
    openPalette: (prefill: string, files: boolean, line: boolean) => void;
    openUpdate: () => void;
    /** Save every tab's unsaved edits, which the page does since the shell may not. */
    saveAll: () => void;
    /** The active tab of the area the page draws (shell/panes/workbench-title.ts). */
    tab: () => { id: string; view: string; state: unknown } | null;
};

/** The page a window's client and workbench make, every store read when its command runs. */
export function menuPage(client: ClientState, deps: MenuDeps): MenuPage {
    /** The float the page draws in a popped-out window, where a terminal starts. */
    const into = client.float ?? undefined;
    const effects = colonEffects(client);
    const say = (words: string): void => void client.notices.post(words, { tone: 'warning' });
    /** What is left to say of a command that went through the folder panel or a write. */
    const settled = (outcome: Promise<CommandOutcome>): void =>
        void outcome.then((result) => {
            if (!result.closed) say(result.said);
        });

    function colon(name: string): void {
        const command = commands(
            client.paletteSource.paletteSource().config,
            client.appShell.offers(),
            false,
            '',
            client.explorer.panelOpen(),
            true,
            dockedEdges(client.layout.floats())
        ).find((one) => one.name === name);
        if (command === undefined) return;
        if (!command.available) {
            // The palette's note sits beside the row's name; a notice stands alone, so it names
            // the command.
            say(
                pressRefusal(command) ??
                    command.why ??
                    t('app.palette_unavailable_named', command.description)
            );
            return;
        }
        if (opensAsMode(name) || command.hint !== '') {
            deps.openPalette(`${COLON}${name} `, false, false);
            return;
        }
        const edge = dockEdgeOf(name);
        if (name === 'folder') settled(effects.folder());
        else if (name === 'folder-add') settled(effects.folderAdd());
        else if (name === 'workspace-close') settled(effects.workspaceClose());
        else if (name === 'crt') effects.crt();
        else if (name === 'update') deps.openUpdate();
        else if (edge !== null) effects.dock(edge);
    }

    return {
        covered: deps.covered,
        act: deps.act,
        openPalette: deps.openPalette,
        openView: (view) => void client.layout.openView(view),
        colon,
        save: () => sourceKeys(client, deps.tab).saveSource(),
        saveAll: deps.saveAll,
        revert: () => {
            const tab = sourceOnScreen(deps.tab(), client.editorStatus.statusOf);
            if (tab !== null) {
                client.editorStatus.ask(tab.instance, { kind: 'action', id: REVERT_ACTION });
            }
        },
        terminal: (kind) =>
            void client.terminals.startOnPage(into ?? client.layout.currentPage().id, kind),
        split: () => {
            const shown = deps.tab();
            if (shown !== null) client.terminals.splitShown(shown.id);
        },
        openRecent: (path) => settled(effects.openWorkspace(path))
    };
}
