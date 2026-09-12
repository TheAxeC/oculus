<script module lang="ts">
    // Layer 3, shared view partial. One compact source strip over the files a feed view owns. Each
    // control opens the source tab for the hub root and path it names.

    import { openView } from '$lib/state/layout.svelte';
    import { sourceTabState } from '$lib/state/source.svelte';

    export type EditSource = { root: string; path: string; label?: string };

    export function openSourceFile(file: EditSource): string {
        const state = sourceTabState(file.root, file.path);
        return openView(
            'source',
            'main',
            file.label === undefined ? state : { ...state, label: file.label }
        );
    }
</script>

<script lang="ts">
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';

    let { files }: { files: EditSource[] } = $props();

    function label(file: EditSource): string {
        return file.label ?? sourceTabState(file.root, file.path).label;
    }
</script>

{#if files.length > 0}
    <div class="edit-bar" data-edit-source>
        <span>{t('helpers.edit_source', '')}</span>
        {#each files as file (JSON.stringify([file.root, file.path]))}
            <span data-source-root={file.root} data-source-path={file.path}>
                <ToolButton label={label(file)} glyph="edit" onclick={() => openSourceFile(file)} />
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
