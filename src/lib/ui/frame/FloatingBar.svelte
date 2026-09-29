<script lang="ts">
    // Layer 3, primitive. A strip of controls that floats over the top right of the box it sits
    // in, as VS Code's find widget floats over a terminal or an editor: the frame, its shadow and
    // its surface, and nothing of what the controls are, which is the caller's snippet. The box
    // it floats over is the caller's positioned parent.
    //
    // It floats over content that is read under it, so over a wallpaper it keeps the popover's
    // share of its colour, as a tooltip, a menu's list and a confirmation do, rather than the
    // pane's.

    import type { Snippet } from 'svelte';

    type Props = {
        children: Snippet;
    };

    let { children }: Props = $props();
</script>

<div class="floating">
    {@render children()}
</div>

<style>
    .floating {
        position: absolute;
        top: 0;
        right: 16px;
        z-index: 1;
        display: flex;
        align-items: center;
        padding: 4px;
        border: 1px solid var(--line);
        border-top: 0;
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        background: var(--card);
        box-shadow: var(--shadow);
    }

    :global(body.wall) .floating {
        background: color-mix(in srgb, var(--card) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
