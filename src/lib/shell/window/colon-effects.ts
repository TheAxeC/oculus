// Layer 3, shell. The colon commands that run at once, with no argument and no list of their own:
// `:folder`, `:folder-add`, `:workspace-close`, `:crt` and the three dock toggles; the switch to a
// workspace file that a `:workspace` row and the menu's Open Recent make; the commands that open a
// list of their own instead (`opensAsMode`); and the words an unavailable command says. The
// palette's command rows (keys/rows/CommandRows.svelte), its workspace rows
// (keys/rows/WorkspaceRows.svelte) and the page's answer to the app menu's commands
// (window/menu-answer.ts) run them from here, so each effect is written once. The folder commands,
// Close Workspace and the switch answer what is left to say, which the palette says in itself and
// the menu as a notice.

import type { ClientState } from '$lib/state/client/context';
import type { DockEdge, Float } from '$lib/state/workbench/layout';
import {
    addFolderCommand,
    folderCommand,
    workspaceCommand,
    type CommandOutcome,
    type PaletteCommand
} from '$lib/state/workbench/palette';
import { t } from '$lib/state/shared/words/text';
import { LSP_CHOICES } from '$lib/data/prose/lsp-servers';

/** The effects of the commands that run at once. */
export type ColonEffects = {
    /** `:folder`: the folder panel, and the folder chosen shown. */
    folder: () => Promise<CommandOutcome>;
    /** `:folder-add`: the folder panel, and the folders chosen made roots. */
    folderAdd: () => Promise<CommandOutcome>;
    /** `:workspace-close`: the open workspace file left. */
    workspaceClose: () => Promise<CommandOutcome>;
    /** A `:workspace` row picked, and Open Recent: the workspace file at `path` switched to. */
    openWorkspace: (path: string) => Promise<CommandOutcome>;
    /** `:crt`: the CRT overlay turned on or off. */
    crt: () => void;
    /** `:toggle-left-dock`, `:toggle-bottom-dock`, `:toggle-right-dock`: the floats of an edge. */
    dock: (edge: DockEdge) => void;
};

/** The edge each dock toggle command hides or shows the floats of. */
const DOCK_COMMANDS: readonly (readonly [string, DockEdge])[] = [
    ['toggle-left-dock', 'left'],
    ['toggle-bottom-dock', 'bottom'],
    ['toggle-right-dock', 'right']
];

/** The edge a dock toggle command names, or null for any other command. */
export function dockEdgeOf(name: string): DockEdge | null {
    return DOCK_COMMANDS.find(([command]) => command === name)?.[1] ?? null;
}

/** The effects over a page's stores, each store read when its command runs. */
export function colonEffects(
    client: Pick<ClientState, 'explorer' | 'fs' | 'layout' | 'ui'>
): ColonEffects {
    return {
        folder: () => folderCommand(client.explorer.openFolder),
        folderAdd: () => addFolderCommand(client.explorer.addFolders),
        workspaceClose: () => workspaceCommand(() => client.fs.closeWorkspace({ said: true }), ''),
        openWorkspace: (path) =>
            workspaceCommand((value) => client.fs.selectWorkspace(value, { said: true }), path),
        crt: () => client.ui.setCrt(!client.ui.crt()),
        dock: (edge) => client.layout.toggleDock(edge)
    };
}

/** The edges a float is docked at, whose dock toggles can run. */
export function dockedEdges(floats: readonly Float[]): DockEdge[] {
    return floats.flatMap((one) => (one.place.kind === 'dock' ? [one.place.edge] : []));
}

/** The note an unavailable command's row carries: its own reason, else the palette's words. */
export function noteOf(command: PaletteCommand): string {
    return command.why ?? t('app.palette_unavailable');
}

/**
 * What a press of an unavailable command says in the palette: the folder commands, unavailable
 * while the folder panel is open, say so; the others say nothing there, their row's note being on
 * screen.
 */
export function pressRefusal(command: PaletteCommand): string | null {
    return command.name === 'folder' || command.name === 'folder-add'
        ? t('files.picker_busy')
        : null;
}

/** The commands that, chosen, open the list of their own instead of running. */
const MODE_COMMANDS = [
    'language',
    'workspace',
    'workspace-save',
    'workspace-new',
    'eslint-config',
    'clone',
    'folder-remove',
    ...Object.values(LSP_CHOICES).map((one) => one.command)
];

/** Whether choosing a command types its name and a space, which opens its list. */
export function opensAsMode(name: string): boolean {
    return MODE_COMMANDS.includes(name);
}
