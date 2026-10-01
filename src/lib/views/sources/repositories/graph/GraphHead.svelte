<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The rows of the Graph that
    // are not a commit: Incoming and Outgoing, each with the dashed circle of its kind in lane 0 in
    // place of a glyph and the number of commits after it, and Load More, one row with its words
    // centred in the link colour and no glyph.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Lanes from './Lanes.svelte';
    import type { LaneRow } from '$lib/state/sources/repositories/graph-lanes';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        nav: TreeNav;
        kind: 'incoming' | 'outgoing' | 'more';
        /** How many commits follow an Incoming or Outgoing row. */
        count?: number;
        /** What pressing Load More does. */
        onmore?: () => void;
    };

    let { nav, kind, count, onmore }: Props = $props();

    /** The one lane the circle of Incoming or Outgoing sits in. */
    const LANE_ZERO: LaneRow = { lane: 0, width: 1, lines: [] };

    const label = $derived(
        kind === 'incoming' ? t('repositories.incoming') : t('repositories.outgoing')
    );
</script>

{#if kind === 'more'}
    <li role="none" data-graph="more">
        <TreeItem
            label={t('repositories.graph_more')}
            id="graph:more"
            {nav}
            level={2}
            tone="link"
            onclick={onmore}
        />
    </li>
{:else}
    <li role="none" class="head" data-graph={kind}>
        <Lanes row={LANE_ZERO} {kind} />
        <div class="item">
            <TreeItem {label} id={`graph:${kind}`} {nav} level={2} {count} />
        </div>
    </li>
{/if}

<style>
    /* The ring of the circle is the row's own background: the two values TreeItem gives its own
       line at rest and under the pointer (this row is never drawn selected), set here because the
       lanes sit beside the row and not inside it. Under the pointer the same background is painted
       under the lanes. */
    .head {
        display: flex;
        align-items: center;
        min-width: 0;
        border-radius: var(--radius-sm);
        --row-bg: var(--panel);
    }

    .head:hover {
        --row-bg: var(--chip);
        --actions-opacity: 1;
        background: var(--row-bg);
    }

    .item {
        flex: 1 1 auto;
        min-width: 0;
    }
</style>
