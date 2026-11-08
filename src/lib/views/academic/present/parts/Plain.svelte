<script lang="ts">
    // Layer 3, Present partial. The general slides a deck writes in Markdown: text, one image, two
    // columns, a display equation and a code block. Each is a heading over its Markdown, drawn
    // through Words so the sanitiser and the typesetter see every field; the equation is drawn in
    // the card of Equation. Code is a fenced block, so the Markdown renderer highlights it.
    //
    // An image slide's image is its one figure (index 0): it is drawn in the room under the
    // heading at the box the slide's layout gives it (`place`, Slide.svelte and
    // screen/slide-layout.ts), in container units of the frame, the whole room for its proportions
    // and centred, its padding inside the box. It is not drawn until its image has loaded, and an
    // image that fails to load is drawn as the missing-figure words, as an image the folder lacks
    // is. Every size here is a fraction of the frame's width (`cqw`), as every size inside a slide
    // is (themes/slide.css), and a hairline is a shadow or an outline one pixel wide, which takes
    // no room.
    //
    // Every other kind marks the box of its Markdown as its room (`data-room`), so an image in the
    // Markdown is held to the room under the slide's heading: under the heading drawn above the
    // box, or under the heading the Markdown opens with (Slide.svelte, `--slide-room-height`).

    import Equation from './Equation.svelte';
    import Words from './Words.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { DECK_GAP, type DeckSlide } from '$lib/state/life/present';
    import { cqw, type Box, type SlidePlace } from '../screen/slide-layout';

    type Props = {
        row: Extract<DeckSlide, { kind: 'text' | 'image' | 'columns' | 'equation' | 'code' }>;
        /** Where the slide's layout puts an image slide's image. */
        place: SlidePlace;
    };

    let { row, place }: Props = $props();

    /** The image's box in the room; none while its image has not loaded. */
    const box: Box | undefined = $derived(place.boxes[0]);
</script>

<section class="slide" data-slide-kind={row.kind}>
    {#if row.kind !== 'text' && row.heading !== ''}
        <h3 class="headline"><Words text={row.heading} /></h3>
    {/if}
    {#if row.kind === 'text'}
        <div class="body" data-room><Words text={row.body} block /></div>
    {:else if row.kind === 'image'}
        {#if row.src === DECK_GAP || place.failed.includes(0)}
            <p class="gap">{t('present.figure_missing', row.alt)}</p>
        {:else if row.src !== ''}
            <div
                class="room"
                data-room
                style:min-height={place.layout === null
                    ? undefined
                    : cqw(Math.max(place.layout.height, place.depth))}
            >
                <img
                    class="figure"
                    class:waiting={box === undefined}
                    data-figure="0"
                    src={row.src}
                    alt={row.alt}
                    style:left={box === undefined ? undefined : cqw(box.x)}
                    style:top={box === undefined ? undefined : cqw(box.y)}
                    style:width={box === undefined ? undefined : cqw(box.width)}
                    style:height={box === undefined ? undefined : cqw(box.height)}
                />
            </div>
        {/if}
    {:else if row.kind === 'columns'}
        <div class="columns" data-room>
            <div><Words text={row.left} block /></div>
            <div><Words text={row.right} block /></div>
        </div>
    {:else if row.kind === 'equation'}
        <Equation slide={{ equation: row.equation }} />
        {#if row.rest !== ''}
            <div class="body" data-room><Words text={row.rest} block /></div>
        {/if}
    {:else}
        <div class="body" data-room><Words text={row.code} block /></div>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.4em;
        font-size: var(--slide-fs-h);
        line-height: 1.15;
    }

    .body {
        font-size: var(--slide-fs-body);
        line-height: 1.45;
    }

    .room {
        position: relative;
    }

    /* The image stands at its box in the room, its padding inside the box. */
    .figure {
        position: absolute;
        display: block;
        box-sizing: border-box;
        object-fit: contain;
        padding: 0.46875cqw;
        box-shadow: inset 0 0 0 1px var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    /* An image that has not loaded takes no room; it loads all the same. */
    .waiting {
        display: none;
    }

    .gap {
        margin: 0.625cqw 0;
        padding: 0.703125cqw 0.859375cqw;
        outline: 1px dashed var(--line);
        outline-offset: -1px;
        border-radius: var(--radius-sm);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(23.4375cqw, 100%), 1fr));
        gap: 2.03125cqw;
        font-size: var(--slide-fs-body);
        line-height: 1.45;
    }
</style>
