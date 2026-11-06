<script lang="ts">
    // Layer 3, view partial. A slide in its deck's frame, the size in px its parts are laid out
    // for, scaled uniformly to the room the parent gives it and centred in that room. The Present
    // pane, its presenter screen, the Overview's tiles and the audience window draw a slide through
    // this one component, so a slide keeps its proportions and its words shrink or grow with the
    // room as a slide program's do. The frame draws its own surface (the card colour, translucent
    // over a wallpaper) and carries the slide type scale (themes/slide.css). A slide taller than
    // the frame scrolls inside it. The room is measured here, and the frame stays hidden until it
    // has a size.
    //
    // Given `onmeasure`, the Stage measures the slide it draws: how many px the frame's content
    // runs past the frame's height, 0 when it fits, taken at the frame's own size, so a tile
    // measures what the pane does. The key hint the pane draws on a deck's first slide
    // (`data-key-hint`, Slide.svelte) is left out of the measure, so the first slide measures the
    // same wherever it is drawn: the content's height and the hint's are taken unrounded, in the
    // frame's own px, and the difference is rounded once. The strip of a project's facts at the
    // slide's foot is counted: it keeps its room whether its words are shown or not, so the measure
    // is the same with the pane's Project facts toggle on and off, and the space above it is the
    // same with the hint drawn above it or not, so a project deck's first slide measures the same
    // in the pane as on the presenter screen, a tile, the audience window and the print page. The
    // hint's own space above it is part of the hint's box, so it leaves the measure with the hint.
    // The slide is measured each time `drawing` changes, so a Stage moved to another slide or shown
    // a retitled one measures it, and a ResizeObserver on the frame and on its content measures
    // again when either changes size (an image or a formula that loads late, the text size, the
    // deck's frame). The observer is disconnected when the Stage goes away or measures anew. A
    // frame with no height (a hidden tab) is not measured.
    //
    // The parent gives the room a height: this fills its parent's width and height.

    import type { Snippet } from 'svelte';
    import { fit, type DeckFrame } from '$lib/state/life/present';

    type Props = {
        /** The deck's frame, in px. */
        frame: DeckFrame;
        /** Whether the frame goes edge to edge with no border and no corner, as on the monitor. */
        bare?: boolean;
        /** Told how many px the slide runs past the frame, 0 when it fits; none: no measure. */
        onmeasure?: (over: number) => void;
        /** What the Stage draws, named in a text that changes with it; a change measures again. */
        drawing?: string;
        /** The slide. */
        children: Snippet;
    };

    let { frame, bare = false, onmeasure, drawing = '', children }: Props = $props();

    /** The room's measured size, 0 until it has been laid out and while its tab is hidden. */
    let width = $state(0);
    let height = $state(0);
    const scale = $derived(fit(width, height, frame));

    let drawn = $state<HTMLElement | null>(null);

    $effect(() => {
        const element = drawn;
        const report = onmeasure;
        // What is drawn is read so that its change runs the effect again and measures it anew.
        $state.snapshot(drawing);
        if (element === null || report === undefined) return;
        const measure = (): void => {
            if (element.clientHeight === 0) return;
            // The frame is drawn scaled; a rect divided by the scale is in the frame's own px.
            const box = element.getBoundingClientRect();
            const scaled = box.height / element.offsetHeight;
            if (scaled === 0) return;
            let bottom = 0;
            for (const child of element.children) {
                bottom = Math.max(bottom, child.getBoundingClientRect().bottom - box.top);
            }
            const padding = parseFloat(getComputedStyle(element).paddingBottom);
            const content = bottom / scaled + element.scrollTop - element.clientTop + padding;
            const hint =
                element.querySelector('[data-key-hint]')?.getBoundingClientRect().height ?? 0;
            const over = Math.round(content - hint / scaled) - element.clientHeight;
            report(Math.max(0, over));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        for (const child of element.children) observer.observe(child);
        return () => observer.disconnect();
    });
</script>

<div class="room" bind:clientWidth={width} bind:clientHeight={height}>
    <div
        class="stage"
        style:width="{frame.width * scale}px"
        style:height="{frame.height * scale}px"
    >
        <div
            class="frame slide-frame"
            class:bare
            data-frame
            data-scroll
            data-surface
            bind:this={drawn}
            style:width="{frame.width}px"
            style:height="{frame.height}px"
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

    /* The frame is laid out at the deck's frame (themes/slide.css) and scaled from its top left
       corner. */
    .frame {
        overflow-y: auto;
        transform-origin: 0 0;
    }

    .frame.bare {
        border: none;
        border-radius: 0;
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. The frame
       is the one translucent layer under the slide, so it carries `data-surface` and the slide's
       own cards paint nothing on it; inside a surface already (a free float's fill) it paints
       nothing in turn. */
    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .frame {
        background: transparent;
        backdrop-filter: none;
    }
</style>
