<script lang="ts">
    // Layer 3, primitive, partial of ui/controls/editor/Editor.svelte and diff/DiffEditor.svelte.
    // The bars an editor draws between its lines: each drawn by the parent's snippet inside a slot
    // Svelte keeps in order, and moved into the editor by zones.ts's `above`, which gives it a
    // place of its own above its line, below the bars of a lower order after the same line. The
    // container itself is never shown.

    import type { Snippet } from 'svelte';
    import type { EditorBar } from '../types';
    import type { LineBars } from './zones';

    type Props = { bars: EditorBar[]; bar: Snippet<[string]>; placed: LineBars };

    let { bars, bar, placed }: Props = $props();
</script>

<div class="line-bars">
    {#each bars as one (one.id)}
        <!-- The slot stays for Svelte to order; the bar inside it moves into the editor. -->
        <div>
            <div class="line-bar" {@attach placed.above(one.after, one.order ?? 0)}>
                {@render bar(one.id)}
            </div>
        </div>
    {/each}
</div>

<style>
    /* The bars wait here, out of the flow, until the editor places them over its lines. */
    .line-bars {
        display: none;
    }

    .line-bar {
        box-sizing: border-box;
        font-family: var(--font-sans, inherit);
    }
</style>
