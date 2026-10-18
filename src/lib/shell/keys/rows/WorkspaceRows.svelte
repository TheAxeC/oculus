<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:workspace`, `:workspace-save`,
    // `:workspace-new` and `:folder-remove`: the recent workspace files and the ones the open
    // workspace's hubs hold, the one open marked and a recent file that is gone noted, a pick
    // switching in place; the one row that saves the open folders, or makes a workspace with no
    // folder, under the name typed after the command; and the folders of the open workspace, a pick
    // taking that folder out of the workspace, as the Files view's Remove Folder from Workspace
    // does once asked (the pick is the choice, as in VS Code's list of the folders to remove). The
    // file store writes and answers, and a refusal is said in the palette, which stays open while a
    // success closes it.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { colonEffects } from '$lib/shell/window/colon-effects';
    import type { FolderRow } from '$lib/shell/keys/palette-modes';
    import {
        workspaceCommand,
        type CommandOutcome,
        type WorkspaceChoice
    } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const state = useState();
    const {
        fs: { newWorkspace, removeRoot, saveWorkspace }
    } = state;
    const effects = colonEffects(state);

    type Props = {
        /** The workspaces `:workspace` lists, or null for the commands that make one. */
        choices: WorkspaceChoice[] | null;
        /** The folders `:folder-remove` lists, or null for the other commands. */
        folders: FolderRow[] | null;
        /** The name typed after `:workspace-save` or `:workspace-new`. */
        name: string;
        /** Which of the two commands that make a workspace the query is. */
        command: string;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { choices, folders, name, command, onclose, onsaid }: Props = $props();

    /** Whether the query makes a workspace with no folder rather than saving the open ones. */
    const makes = $derived(command === 'workspace-new');

    /** A workspace write sent as one whose refusal the palette says itself (`said`). */
    const saying =
        <Answer,>(write: (value: string, options: { said: boolean }) => Answer) =>
        (value: string): Answer =>
            write(value, { said: true });

    /** Close the palette when a command went through; otherwise keep it open saying why. */
    async function settled(outcome: Promise<CommandOutcome>): Promise<void> {
        const result = await outcome;
        if (result.closed) onclose();
        else onsaid(result.said);
    }
</script>

{#if folders !== null}
    {#each folders as folder (folder.value)}
        <PaletteRow
            row={{
                value: folder.value,
                kind: t('app.palette.kind_folder'),
                label: folder.key,
                hint: folder.dir,
                pick: () => void settled(workspaceCommand(saying(removeRoot), folder.key))
            }}
        />
    {/each}
{:else if choices !== null}
    {#each choices as choice (choice.path)}
        <PaletteRow
            row={{
                value: `workspace:${choice.path}`,
                kind: t('app.palette.kind_workspace'),
                label: choice.label,
                active: choice.current,
                ...(choice.missing ? { note: t('app.palette.workspace_missing') } : {}),
                pick: () => void settled(effects.openWorkspace(choice.path))
            }}
        />
    {/each}
{:else}
    <PaletteRow
        row={{
            value: command,
            kind: t('app.palette.kind_workspace'),
            label: makes
                ? name === ''
                    ? t('app.palette.workspace_new_name')
                    : t('app.palette.workspace_new', name)
                : name === ''
                  ? t('app.palette.workspace_save_name')
                  : t('app.palette.workspace_save', name),
            pick: () =>
                void settled(workspaceCommand(saying(makes ? newWorkspace : saveWorkspace), name))
        }}
    />
{/if}
