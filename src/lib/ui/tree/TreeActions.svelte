<script lang="ts">
    // Layer 3, partial of ui/tree/TreeItem.svelte. The controls of one row, drawn beside its line
    // at the right. They are transparent until the row says otherwise: the row sets
    // `--actions-opacity` to 1 while the pointer is over it or the focus is inside it, `shown`
    // draws them at full strength always, and a screen with no pointer that hovers shows them all
    // the time, since a control pressed where nothing is drawn is one nobody can aim at.
    //
    // `yielding` makes them the part of the line that shrinks first, cut at the row's edge, so the
    // branch name and the counts of a repository's row give way before the repository's name; each
    // control of such a row has 4px on its left and a 16px line.

    import type { Snippet } from 'svelte';

    type Props = {
        shown: boolean;
        yielding: boolean;
        children: Snippet;
    };

    let { shown, yielding, children }: Props = $props();
</script>

<span class="actions" class:shown class:yielding>{@render children()}</span>

<style>
    .actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 1px;
        padding-right: 2px;
        opacity: var(--actions-opacity, 0);
    }

    .actions.shown {
        opacity: 1;
    }

    .actions.yielding {
        flex: 1 10000 auto;
        min-width: 0;
        justify-content: flex-end;
        overflow: hidden;
    }

    /* Each control of a yielding row has 4px on its left and a 16px line. */
    .actions.yielding :global(.tool),
    .actions.yielding :global(.opener) {
        margin-left: 4px;
        line-height: calc(var(--button-line) * var(--text-scale, 1));
    }

    /* The `...` menu of such a row is the same 20px box as the other controls. */
    .actions.yielding :global(.opener.bare) {
        min-width: calc(20px * var(--text-scale, 1));
        height: calc(20px * var(--text-scale, 1));
        padding: 0 1px;
    }

    @media (hover: none) {
        .actions {
            opacity: 1;
        }
    }

    /* A control on a row is a glyph on the row's own surface: the box a toolbar button draws would
       make every line of the tree a line of boxes. */
    .actions :global(.tool) {
        border-color: transparent;
        background: none;
        padding: var(--action-pad, 1px 3px);
    }

    /* A view that draws the icon controls of its rows larger sets `--action-pad`, `--action-font`
       and `--action-glyph`: the padding round the icon, its size and the width of its box. */
    .actions :global(.tool.compact) {
        padding: var(--action-pad, 1px 3px);
        font-size: var(--action-font, var(--fs-sm));
    }

    .actions :global(.tool.compact .glyph) {
        width: var(--action-glyph, 1.2em);
    }

    .actions :global(.tool:hover:not(:disabled)) {
        border-color: var(--line);
    }
</style>
