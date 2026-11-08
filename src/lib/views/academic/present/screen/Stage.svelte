<script lang="ts">
    // Layer 3, view partial. A slide in its frame, drawn at the largest box of the slide's shape
    // (`SLIDE_SHAPE`, 16:9) the room the parent gives it holds, at that box's own size, centred in
    // the room. The Present pane, its presenter screen, the Overview's tiles and the audience
    // window draw a slide through this one component. The box that holds the frame is a size
    // container, and every size inside the slide is a fraction of its width (themes/slide.css), so
    // a slide keeps its proportions and its words shrink or grow with the room as a slide
    // program's do, and the slide's layout, made in fractions of the frame (Slide.svelte), draws
    // the same boxes at any size. The box is sized by CSS from the room, itself a size container,
    // so a room resized after the slide was laid out draws the frame at its new size with no new
    // layout. The frame draws its own surface (the card colour, translucent over a wallpaper) and
    // carries the slide type scale. Its line is a shadow, which takes no room, and a bare frame
    // draws none, so the slide has the same inner box in a framed one, a bare one and on the print
    // page. A slide taller than the frame, one whose text or whose figures with their captions do
    // not fit at its least size, scrolls inside it. The room is measured here, and the frame stays
    // hidden until it has a size.
    //
    // Given `onmeasure`, the Stage measures the slide it draws: how far the frame's content runs
    // past the frame's height, as a fraction of that height, 0 when it fits, so a tile measures
    // what the pane does. The heights are taken from the drawn boxes unrounded, so a frame drawn
    // small rounds no pixel of its own into the measure. The strip of a project's facts at the
    // slide's foot is counted: it keeps its room whether its words are shown or not, so the measure
    // is the same with the pane's Project facts toggle on and off. The slide is measured each time
    // `drawing` changes, so a Stage moved to another slide or shown a retitled one measures it, and
    // a ResizeObserver on the frame and on its content measures again when either changes size (an
    // image or a formula that loads late, the text size, the room). The observer is disconnected
    // when the Stage goes away or measures anew. A frame with no height (a hidden tab) is not
    // measured.
    //
    // The parent gives the room a height: this fills its parent's width and height.

    import type { Snippet } from 'svelte';
    import { SLIDE_SHAPE } from '$lib/state/life/present';

    type Props = {
        /** Whether the frame goes edge to edge with no line and no corner, as on the monitor. */
        bare?: boolean;
        /**
         * Told how far the slide runs past the frame, as a fraction of the frame's height, 0 when
         * it fits; none: no measure.
         */
        onmeasure?: (over: number) => void;
        /** What the Stage draws, named in a text that changes with it; a change measures again. */
        drawing?: string;
        /** The slide. */
        children: Snippet;
    };

    let { bare = false, onmeasure, drawing = '', children }: Props = $props();

    /** The room's measured size, 0 until it has been laid out and while its tab is hidden. */
    let width = $state(0);
    let height = $state(0);

    /** The box of the slide's shape the room holds, its sides in container units of the room. */
    const across = `min(100cqw, 100cqh * ${SLIDE_SHAPE.width} / ${SLIDE_SHAPE.height})`;
    const down = `min(100cqh, 100cqw * ${SLIDE_SHAPE.height} / ${SLIDE_SHAPE.width})`;

    let drawn = $state<HTMLElement | null>(null);

    $effect(() => {
        const element = drawn;
        const report = onmeasure;
        // What is drawn is read so that its change runs the effect again and measures it anew.
        $state.snapshot(drawing);
        if (element === null || report === undefined) return;
        const measure = (): void => {
            // The drawn height, unrounded, which `clientHeight` would round.
            const box = element.getBoundingClientRect();
            if (box.height === 0) return;
            let bottom = 0;
            for (const child of element.children) {
                bottom = Math.max(bottom, child.getBoundingClientRect().bottom - box.top);
            }
            const padding = parseFloat(getComputedStyle(element).paddingBottom) || 0;
            const content = bottom + element.scrollTop + padding;
            report(Math.max(0, (content - box.height) / box.height));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        for (const child of element.children) observer.observe(child);
        return () => observer.disconnect();
    });
</script>

<div class="room" bind:clientWidth={width} bind:clientHeight={height}>
    <div class="stage" style:width={across} style:height={down}>
        <div
            class="frame slide-frame"
            class:bare
            data-frame
            data-scroll
            data-surface
            bind:this={drawn}
            style:visibility={width === 0 || height === 0 ? 'hidden' : undefined}
        >
            {@render children()}
        </div>
    </div>
</div>

<style>
    /* The room is what the parent leaves, a size container the stage's box is measured against;
       what is not the frame's is letterbox. */
    .room {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        container-type: size;
    }

    /* The box the frame is drawn in, the largest of the slide's shape the room holds, which the
       element's style sets; a size container, so every size inside the slide is a fraction of
       its width. */
    .stage {
        flex: 0 0 auto;
        container-type: size;
    }

    /* The frame fills the stage's box. */
    .frame {
        width: 100%;
        height: 100%;
        overflow-y: auto;
    }

    .frame.bare {
        box-shadow: none;
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
