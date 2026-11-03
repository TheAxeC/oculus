<script lang="ts">
    // Layer 3, primitive. The pressable body of a list row whose lines the caller draws: one button
    // across the row's width beside the row's own controls, of one line or several stacked, with
    // no border and no fill of its own, so the row's hover and selection tint show through it. A
    // card draws its sessions with it and the project tab its own, and a transcript draws a run of
    // tool calls with it, which says whether the run is open through `expanded`. A row of an
    // explorer tree is ui/tree/TreeItem.svelte's.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The tooltip, when it says more than the row's lines do. */
        title?: string;
        /** Draw the words in the ink the selection tint is read on. */
        selected?: boolean;
        /** Whether what the row discloses is shown, for a row that discloses something. */
        expanded?: boolean;
        onclick: (event: MouseEvent) => void;
        /** A second press in quick succession, for a row whose two speeds mean two things. */
        ondblclick?: (event: MouseEvent) => void;
        /** The row's lines. */
        children: Snippet;
    };

    let { title, selected = false, expanded, onclick, ondblclick, children }: Props = $props();
</script>

<button
    type="button"
    class="row-button"
    class:selected
    aria-expanded={expanded}
    {title}
    {onclick}
    {ondblclick}
>
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
