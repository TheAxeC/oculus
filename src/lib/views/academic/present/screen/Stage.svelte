<script lang="ts">
    // Layer 3, view partial. A slide in its frame of 1280 by 720 px, the size its parts are laid
    // out for, scaled uniformly to the room the parent gives it and centred in that room. The
    // Present pane, its presenter screen and the audience window draw a slide through this one
    // component, so a slide keeps its proportions and its words shrink or grow with the room as a
    // slide program's do. The frame draws its own surface (the card colour, translucent over a
    // wallpaper) and carries the slide type scale (themes/slide.css). A slide taller than the
    // frame scrolls inside it. The room is measured here, and the frame stays hidden until it has
    // a size.
    //
    // The parent gives the room a height: this fills its parent's width and height.

    import type { Snippet } from 'svelte';
    import { FRAME_HEIGHT, FRAME_WIDTH, fit } from '$lib/state/life/present';

    type Props = {
        /** Whether the frame goes edge to edge with no border and no corner, as on the monitor. */
        bare?: boolean;
        /** The slide. */
        children: Snippet;
    };

    let { bare = false, children }: Props = $props();

    /** The room's measured size, 0 until it has been laid out and while its tab is hidden. */
    let width = $state(0);
    let height = $state(0);
    const scale = $derived(fit(width, height));
</script>

<div class="room" bind:clientWidth={width} bind:clientHeight={height}>
    <div
        class="stage"
        style:width="{FRAME_WIDTH * scale}px"
        style:height="{FRAME_HEIGHT * scale}px"
    >
        <div
            class="frame slide-frame"
            class:bare
            data-frame
            data-scroll
            style:width="{FRAME_WIDTH}px"
            style:height="{FRAME_HEIGHT}px"
            style:transform="scale({scale})"
            style:visibility={scale === 0 ? 'hidden' : undefined}
        >
            {@render children()}
        </div>
    </div>
</div>

<style>
    /* The room is what the parent leaves; what is not the frame's is letterbox. */
    .room {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    /* The box the scaled frame occupies on screen: the frame's transform does not change its layout
       size, so this box is the one that takes room. */
    .stage {
        flex: 0 0 auto;
    }

    /* The frame is laid out at the design size (themes/slide.css) and scaled from its top left
       corner. */
    .frame {
        overflow-y: auto;
        transform-origin: 0 0;
    }

    .frame.bare {
        border: none;
        border-radius: 0;
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
