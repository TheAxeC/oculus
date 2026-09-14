<script lang="ts">
    // Layer 3, shell. A child of a split collapsed to its edge: one control that shows it again,
    // and, for a pane, the name of the tab it is showing, so a reader can tell two collapsed panes
    // apart without expanding either. That name is the one the document title uses, so this reads
    // the registry as PaneView does, which is why the strip is drawn here and not in SplitView.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { activeLabel } from '$lib/shell/workbench-title';
    import { t } from '$lib/state/text';
    import type { Layout } from '$lib/state/layout';
    import { useState } from '$lib/state/use';

    const client = useState();

    type Props = {
        /** The collapsed child. A split has no tab to name, and shows the control alone. */
        node: Layout;
        /** The direction of the split holding it: a row of children collapses to a column strip. */
        dir: 'row' | 'col';
        /** Show this child at the share it kept. */
        onexpand: () => void;
    };

    let { node, dir, onexpand }: Props = $props();

    /** The active instance of a collapsed pane, and null for a collapsed split. */
    const shown = $derived(
        node.kind === 'pane' ? (node.tabs.find((tab) => tab.id === node.active) ?? null) : null
    );

    /**
     * The name of the tab the collapsed pane is showing, or nothing for a collapsed split. It is
     * the same rule the document title reads a tab by, so the strip and the title never disagree.
     */
    const label = $derived(shown === null ? '' : activeLabel(client.registry, shown));
</script>

<div class="fold {dir}" data-fold>
    <ToolButton
        label={t('ui.pane_expand')}
        glyph={t('ui.pane_expand_glyph')}
        compact
        onclick={onexpand}
    />
    {#if label !== ''}
        <span class="name" data-fold-label>{label}</span>
    {/if}
</div>

<style>
    .fold {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;
        padding: 2px;
        box-sizing: border-box;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
    }

    /* A strip beside its neighbours is a column of controls; one under them is a row of them. */
    .fold.row {
        flex-direction: column;
    }

    .fold.col {
        flex-direction: row;
    }

    :global(body.wall) .fold {
        background: transparent;
    }

    .name {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* In a column strip the name runs down it, which is the only way it fits the thickness. */
    .fold.row .name {
        writing-mode: vertical-rl;
        max-height: 100%;
    }

    .fold.col .name {
        max-width: 100%;
    }
</style>
