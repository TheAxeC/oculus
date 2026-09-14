<script lang="ts">
    // Layer 3, shared view partial. One compact source strip over the files a feed view owns. Each
    // control opens the source tab for the hub root and path it names.

    import { type EditSource, openSourceFile } from './edit-bar';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { sourceTabState } from '$lib/state/source.svelte';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const client = useState();

    let { files }: { files: EditSource[] } = $props();

    function label(file: EditSource): string {
        return file.label ?? sourceTabState(file.root, file.path).label;
    }
</script>

{#if files.length > 0}
    <div class="edit-bar" data-edit-source>
        <span>{t('project.helper.edit_source', '')}</span>
        {#each files as file (JSON.stringify([file.root, file.path]))}
            <span data-source-root={file.root} data-source-path={file.path}>
                <ToolButton
                    label={label(file)}
                    glyph="edit"
                    onclick={() => openSourceFile(client, file)}
                />
            </span>
        {/each}
    </div>
{/if}

<style>
    .edit-bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
