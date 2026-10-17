// Layer 3, shell, partial of Palette.svelte. The lists of the workspace commands, read from the
// query: the workspace files `:workspace` lists (state/workbench/palette.ts `workspaceChoicesOf`),
// whether the query is `:workspace-save` or `:workspace-new`, which draw the one row that makes the
// workspace under the name typed, and the folders of the open workspace `:folder-remove` lists
// (palette-modes.ts `folderRemovals`). Each is null, or false, while the query is another command.

import { folderRemovals, type FolderRow } from '$lib/shell/keys/palette-modes';
import {
    workspaceChoicesOf,
    type ParsedCommand,
    type WorkspaceChoice
} from '$lib/state/workbench/palette';

/** What the lists are read from: the query, the saved workspaces and the open workspace's roots. */
export type WorkspaceListInput = {
    parsed: () => ParsedCommand | null;
    saved: () => Parameters<typeof workspaceChoicesOf>[1];
    roots: () => Parameters<typeof folderRemovals>[1];
};

/** The lists of the workspace commands. */
export type WorkspaceList = {
    /** Whether the query is one of these commands, whose rows this list holds. */
    readonly active: boolean;
    /** The workspace files of `:workspace`, or null for another query. */
    readonly choices: WorkspaceChoice[] | null;
    /** Whether the query makes a workspace under the name typed after it. */
    readonly saving: boolean;
    /** The folders of `:folder-remove`, or null for another query. */
    readonly folders: FolderRow[] | null;
};

export function createWorkspaceList(input: WorkspaceListInput): WorkspaceList {
    const name = $derived(input.parsed()?.name ?? null);
    const argument = $derived(input.parsed()?.argument ?? '');
    const choices = $derived(
        name === 'workspace' ? workspaceChoicesOf(argument, input.saved()) : null
    );
    const folders = $derived(
        name === 'folder-remove' ? folderRemovals(argument, input.roots()) : null
    );
    const saving = $derived(name === 'workspace-save' || name === 'workspace-new');
    return {
        get active() {
            return choices !== null || saving || folders !== null;
        },
        get choices() {
            return choices;
        },
        get saving() {
            return saving;
        },
        get folders() {
            return folders;
        }
    };
}
