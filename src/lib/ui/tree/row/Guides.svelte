<script lang="ts">
    // Layer 3, primitive, drawn by ../TreeItem.svelte at the start of a row's line. The indent
    // guides of one tree row, one per level of its depth. It draws no box of its own, so each guide
    // is a part of the row's line and takes the line's 4px gap after it, which the measures below
    // count on; the measures of a level and the rule that shows the guides are kept here together.

    type Props = {
        /** How many levels the row stands in, 0 or more. */
        depth: number;
    };

    let { depth }: Props = $props();

    const guides = $derived(Array.from({ length: depth }, (_, at) => at));
</script>

{#each guides as at (at)}
    <span class="guide" aria-hidden="true"></span>
{/each}

<style>
    /* One guide per level: a column the indent's width with the line on its left edge, moved right
       by the shift, so the guides of the rows under one folder join into one vertical rule down the
       centre of the folder's twistie. It is drawn while the tree is hovered or holds the focus, and
       is transparent otherwise. The gap before a guide and the shift of its line are the theme's
       tokens (`--tree-guide-gap`, `--tree-guide-shift`), which a tree may set for its own rows. The
       margin after a guide is its gap less the line's 4px gap, so each level is the indent and
       twice the gap, which is the indent alone at the default gap of 0. */
    .guide {
        flex: 0 0 calc(var(--tree-indent) * var(--text-scale, 1));
        align-self: stretch;
        box-sizing: border-box;
        margin-left: var(--tree-guide-gap);
        margin-right: calc(var(--tree-guide-gap) - 4px);
        border-left: 1px solid transparent;
        translate: calc(var(--tree-guide-shift) * var(--text-scale, 1));
    }

    :global([role='tree']:hover) .guide,
    :global([role='tree']:focus-within) .guide {
        border-left-color: var(--line);
    }
</style>
