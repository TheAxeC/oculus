<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:workspace` and
    // `:workspace-save`: the recent workspace files and the ones the open workspace's hubs hold,
    // the one open marked and a recent file that is gone noted, a pick switching in place; and the
    // one row that saves the open folders under the name typed after the command. The file store
    // writes and answers, and a refusal is said in the palette, which stays open while a success
    // closes it.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import {
        workspaceCommand,
        type CommandOutcome,
        type WorkspaceChoice
    } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { saveWorkspace, selectWorkspace }
    } = useState();

    type Props = {
        /** The workspaces `:workspace` lists, or null for the save command. */
        choices: WorkspaceChoice[] | null;
        /** The name typed after `:workspace-save`. */
        name: string;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { choices, name, onclose, onsaid }: Props = $props();

    /** Close the palette when a command went through; otherwise keep it open saying why. */
    async function settled(outcome: Promise<CommandOutcome>): Promise<void> {
        const result = await outcome;
        if (result.closed) onclose();
        else onsaid(result.said);
    }
</script>

{#if choices !== null}
    {#each choices as choice (choice.path)}
        <PaletteRow
            row={{
                value: `workspace:${choice.path}`,
                kind: t('app.palette.kind_workspace'),
                label: choice.label,
                active: choice.current,
                ...(choice.missing ? { note: t('app.palette.workspace_missing') } : {}),
                pick: () => void settled(workspaceCommand(selectWorkspace, choice.path))
            }}
        />
    {/each}
{:else}
    <PaletteRow
        row={{
            value: 'workspace-save',
            kind: t('app.palette.kind_workspace'),
            label:
                name === ''
                    ? t('app.palette.workspace_save_name')
                    : t('app.palette.workspace_save', name),
            pick: () => void settled(workspaceCommand(saveWorkspace, name))
        }}
    />
{/if}
