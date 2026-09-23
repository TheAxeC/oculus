<script lang="ts">
    // Layer 3, shell. A child of a split collapsed to its edge: one control that shows it again,
    // and, for a pane, the name of the tab it is showing, so a reader can tell two collapsed panes
    // apart without expanding either. That name is the one the document title uses, so this reads
    // the registry as PaneView does, which is why the strip is drawn here and not in SplitView.
    //
    // A folded pane the next view opened would land in draws the accent line a shown tab draws,
    // along the strip's top edge, so folding a pane never leaves the window with nothing saying
    // where a view will land.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { activeLabel } from '$lib/shell/workbench-title';
    import { pageNameOf } from '$lib/state/workbench/navigation/pages';
    import { t } from '$lib/state/words/text';
    import type { Layout } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: { openingInstance, pages }
    } = client;

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
     * What the strip is called: the name of the tab a collapsed pane is showing, the name of the
     * page a collapsed page leaf shows, and nothing for a collapsed split, which is neither. A tab
     * is read by the rule the document title reads it by, so the strip and the title never
     * disagree.
     */
    const label = $derived.by(() => {
        if (node.kind === 'page') return pageNameOf(pages(), node.page);
        return shown === null ? '' : activeLabel(client.registry, shown);
    });

    /** Whether this folded pane is the one the next view opened lands in. */
    const marked = $derived(shown !== null && openingInstance()?.id === shown.id);
</script>

<div class="fold {dir}" class:marked data-fold>
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

    /* The mark a folded strip carries is the line a shown tab carries: the accent along its top
       edge, at the strip's own border width, which is the width a tab draws it at. */
    .fold.marked {
        border-top-color: var(--accent);
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
