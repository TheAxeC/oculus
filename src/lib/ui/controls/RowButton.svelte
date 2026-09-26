<script lang="ts">
    // Layer 3, primitive. The pressable body of a list row whose lines the caller draws: one button
    // across the row's width beside the row's own controls, its lines stacked, with no border and
    // no fill of its own, so the row's hover and selection tint show through it. A row of one line
    // in an explorer is ui/tree/TreeItem.svelte's; this is the row of several lines the Sessions
    // list draws, as VS Code's Agents window draws a session.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The tooltip, when it says more than the row's lines do. */
        title?: string;
        /** Draw the words in the ink the selection tint is read on. */
        selected?: boolean;
        onclick: (event: MouseEvent) => void;
        /** A second press in quick succession, for a row whose two speeds mean two things. */
        ondblclick?: (event: MouseEvent) => void;
        /** The row's lines. */
        children: Snippet;
    };

    let { title, selected = false, onclick, ondblclick, children }: Props = $props();
</script>

<button type="button" class="row-button" class:selected {title} {onclick} {ondblclick}>
    {@render children()}
</button>

<style>
    .row-button {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
        border: 0;
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        text-align: left;
        padding: 0 6px;
        cursor: pointer;
    }

    .row-button.selected {
        color: var(--on-accent-bg, var(--ink));
    }

    .row-button:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
