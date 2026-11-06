<script lang="ts">
    // Layer 3, shared view partial. The box a plain press of a card sits in: a ui/ ToolButton drawn
    // `plain` draws nothing of its own, so this box draws its look, no frame until the pointer is
    // over it, then the chip surface. Every plain press of a project card is drawn in it: the
    // cross-link tags of CardLinks.svelte, the DISSEMINATED IN tags of CardDetails.svelte, the
    // compute resources and the folder of CardFacts.svelte, the domain tag of ProjectCard.svelte,
    // and the venue of a Focus lane card (views/boards/focus/lanes/LaneCard.svelte), so the look is
    // one rule.
    //
    // The box is as wide as what it holds, up to the line it sits on, or up to `width` where the
    // caller gives one, as the lane card's venue is cut at its own width. `mono` sets its words in
    // the monospace face, for the folder, the one fact of a card that names a place on disk.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The widest the box is drawn, a CSS length; the line's whole width when none is given. */
        width?: string;
        /** Whether the words are in the monospace face. */
        mono?: boolean;
        /** The plain press the box holds. */
        children: Snippet;
    };
    let { width, mono = false, children }: Props = $props();
</script>

<!-- The width is set on every box, so a box never takes the width of another it sits in. -->
<span class="press" class:mono style={`--press-width: ${width ?? '100%'}`}>
    {@render children()}
</span>

<style>
    .press {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: var(--press-width);
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        text-align: left;
    }

    .press:hover {
        background: var(--chip);
    }

    .mono {
        font-family: var(--font-mono);
    }
</style>
