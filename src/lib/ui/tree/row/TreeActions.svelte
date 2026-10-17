<script lang="ts">
    // Layer 3, partial of ui/tree/TreeItem.svelte. The controls of one row, drawn beside its line
    // at the right. As in VS Code's lists they are not drawn and take no room until the row says
    // otherwise, so a narrow pane gives a row's whole width to its name: the row sets
    // `--actions-display` to `flex` while the pointer is over it, the focus is inside it or it is
    // selected, and the name gives way to them then. `shown` draws them always; a control whose
    // menu is open keeps them drawn while the pointer and the focus are in the menu, so the menu
    // stays by its opener; and a screen with no pointer that hovers shows them all the time, since
    // a control drawn only under a pointer is one nobody can reach there.
    //
    // Drawn in a row too narrow for them beside its icon and the first characters of its name (the
    // least the row's name keeps, ui/tree/TreeItem.svelte), they are cut at the row's edge rather
    // than drawn over the name.
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
        display: var(--actions-display, none);
        flex: 0 1 auto;
        align-items: center;
        min-width: 0;
        overflow: hidden;
        gap: 1px;
        padding-right: 2px;
    }

    .actions.shown,
    .actions:has(:global([aria-haspopup][aria-expanded='true'])) {
        display: flex;
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
            display: flex;
        }
    }

    /* A control on a row is a glyph on the row's own surface: the box a toolbar button draws would
       make every line of the tree a line of boxes. */
    .actions :global(.tool) {
        border-color: transparent;
        background: none;
        padding: var(--action-pad, 1px 3px);
    }

    /* A control that is on (a set bookmark star) has no fill here to carry the text colour drawn
       on the accent, so its glyph takes the accent itself, in every theme. */
    .actions :global(.tool.active) {
        color: var(--accent-txt, var(--accent));
    }

    /* A view that draws the icon controls of its rows closer sets `--action-pad`, the padding round
       the 16 px icon. */
    .actions :global(.tool.compact) {
        padding: var(--action-pad, 0 var(--tab-action-pad));
    }

    .actions :global(.tool:hover:not(:disabled)) {
        border-color: var(--line);
    }
</style>
