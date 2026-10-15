<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The rows of the Graph that
    // are not a commit: Incoming Changes and Outgoing Changes, and Load More. Incoming Changes and
    // Outgoing Changes stand above the first commit of their side of the upstream, the dashed
    // circle of their kind in that commit's lane, among the lanes that pass there, in place of a
    // glyph, and the number of commits of their side after the words; a press opens and closes the
    // files changed over their whole range under them, as a commit's press opens its own. Load More
    // is one row with its words centred in the link colour and no glyph.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Lanes from './Lanes.svelte';
    import type { LaneRow } from '$lib/state/sources/repositories/graph-lanes';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        nav: TreeNav;
        kind: 'incoming' | 'outgoing' | 'more';
        /** How many commits of its side an Incoming Changes or Outgoing Changes row stands for. */
        count?: number;
        /** The lanes of an Incoming Changes or Outgoing Changes row, its circle among them. */
        lane?: LaneRow;
        /** Whether the files of the row's range are open under it. */
        open?: boolean;
        /** What pressing Incoming Changes or Outgoing Changes does; without it the row is text. */
        onpress?: () => void;
        /** What pressing Load More does. */
        onmore?: () => void;
    };

    let { nav, kind, count, lane, open = false, onpress, onmore }: Props = $props();

    /** The one lane the circle sits in when no lanes are handed. */
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
            depth={1}
            tone="link"
            onclick={onmore}
        />
    </li>
{:else}
    <li role="none" class="head" data-graph={kind}>
        <Lanes row={lane ?? LANE_ZERO} {kind} />
        <div class="item">
            <TreeItem
                {label}
                id={`graph:${kind}`}
                {nav}
                level={2}
                {count}
                expanded={onpress === undefined ? undefined : open}
                onclick={onpress}
            />
        </div>
    </li>
{/if}

<style>
    /* The ring of the circle is the row's own background: the two values TreeItem gives its own
       line at rest and under the pointer (this row is never drawn selected), set here because the
       lanes sit beside the row and not inside it. Under the pointer the same background is painted
       under the lanes. The row stands one step in from the Graph's section head, the width of one
       guide of a tree row, its lanes included. */
    .head {
        display: flex;
        align-items: center;
        min-width: 0;
        padding-left: calc(var(--tree-guide-gap, 4px) + var(--tree-indent) * var(--text-scale, 1));
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
