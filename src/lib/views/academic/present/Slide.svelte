<script lang="ts">
    // Layer 3, Present partial. One slide of the deck drawn as the kind it is. It is the one place
    // that knows which component each kind is, so the pane draws a slide by handing this the slide
    // and the deck and nothing else. The slide takes the frame's inner box, and its content sits
    // in a reading column, centred in that box, as wide as it and at most `--slide-reading`
    // (81.25 hundredths of the frame's width, themes/slide.css), as tall as the box less the foot,
    // and a part that centres its content takes the column's height.
    //
    // The slide lays itself out from what it holds, every length a fraction of the frame's width:
    // each length it measures on the drawn slide is divided once by the frame's drawn width, and
    // the boxes and the room height it sets are written in container units of the frame. So it is
    // laid out the same on every surface that draws it, at any size: the pane, the presenter
    // screen, the Overview's tiles, the audience window and the print page, and a frame resized
    // after the layout draws the same boxes with no new layout. Its content is drawn at one factor
    // on the slide type scale (`--slide-fit` on the content's box), between 0.75 and 1.25: the
    // largest at which the content fits above the foot. A part with figures (a project slide's
    // panels, an image slide's image) draws them in a room under its title, at the boxes
    // screen/layout/slide-layout.ts gives from the measured room, each figure's ratio, read from
    // its image once it has loaded, the padding of its drawn image, the gap under its drawn panel,
    // the height of its caption and explanation at the width the figure is drawn at, the least
    // width those words need, and the height of the text at the least factor, so figures side by
    // side are never narrower than their words. A factor fits when the content ends above the foot,
    // the text inside its box and every figure's box, caption included, inside the room. An image
    // in a slide's Markdown is drawn no taller than the room under the slide's heading at the
    // factor tried, less what the rest of the slide's Markdown takes of that room. A figure whose
    // image has not loaded is not drawn until it has, and one that fails is drawn as the
    // missing-figure words, as text. The content is hidden until it has been laid out once. A slide
    // whose content does not fit at the least factor is drawn at it and runs past its frame, its
    // room as tall as its lowest figure, which a measuring Stage reports as too tall. The search of
    // the factor, when it runs, the queue it may wait on (`turns`) and the layouts kept of the
    // slides already drawn (`kept`) are screen/layout/search.svelte.ts's; what it reads off the
    // drawn slide is screen/layout/drawn-slide.ts's.
    //
    // The slide's foot, under its content, holds the strip of a project's facts in the strip's own
    // sizes at the frame's factor 1 (themes/slide.css), across the frame's whole inner width, which
    // is wider than the reading column (90 hundredths of the frame's width against 81.25). A slide
    // that comes from a project's deck (`row.project`) carries the strip of that project's facts
    // (`deck.projects`, read by `slideFacts`, no strip for a project with none), on every surface
    // that draws a slide, its words shown by the pane's Project facts toggle (`facts`) and hidden,
    // their room kept, when it is off. The strip wraps to as many lines as its facts need, so its
    // height differs from one project to the next; the layout measures the foot as drawn each time
    // it runs and takes the content's room above it, so a taller strip leaves the content less
    // room and never lies over it.

    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Facts from './parts/project/Facts.svelte';
    import Project from './parts/project/Project.svelte';
    import Section from './parts/Section.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import type { LayoutTurns } from './screen/layout/layout-turns';
    import { createSlideLayout } from './screen/layout/search.svelte';
    import { cqw } from './screen/layout/slide-layout';
    import { slideFacts, tagToneOf } from '$lib/state/life/present';
    import type { Deck, DeckSlide } from '$lib/state/life/present';
    import type { KeptLayouts } from '$lib/state/life/present.svelte';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        /** Told each time the slide has been laid out: the print page waits for every slide. */
        onlaid?: () => void;
        /** The queue every layout of this slide waits on, an Overview tile's; none: at once. */
        turns?: LayoutTurns;
        /** The layouts kept of the page's slides, which this one reads and fills; none: neither. */
        kept?: KeptLayouts;
    };

    let { row, deck, facts, onlaid, turns, kept }: Props = $props();

    /** The facts the slide's strip draws, null for a slide that has no strip. */
    const held = $derived(slideFacts(deck, row));

    let slide = $state<HTMLElement | null>(null);
    let content = $state<HTMLElement | null>(null);
    let foot = $state<HTMLElement | null>(null);
    let probe = $state<HTMLElement | null>(null);

    const layout = createSlideLayout({
        row: () => row,
        deck: () => deck,
        facts: () => held,
        slide: () => slide,
        content: () => content,
        foot: () => foot,
        probe: () => probe,
        turns: () => turns,
        kept: () => kept,
        onlaid: () => onlaid?.()
    });
    const place = $derived(layout.place);
</script>

<div class="slide" data-slide-key={row.key} bind:this={slide}>
    <div
        class="content slide-fit"
        class:waiting={!layout.laid}
        style:--slide-fit={layout.fit}
        style:--slide-room-height={layout.room > 0 ? cqw(layout.room) : undefined}
        bind:this={content}
        onloadcapture={layout.imageSettled}
        onerrorcapture={layout.imageSettled}
    >
        {#if row.kind === 'title' || row.kind === 'closing'}
            <Title
                kind={row.kind}
                kicker={row.kicker}
                heading={row.heading}
                lede={row.lede}
                contact={row.contact}
                legend={row.legend}
            />
        {:else if row.kind === 'section'}
            <Section
                heading={row.heading}
                lede={row.lede}
                cards={row.cards}
                foot={row.foot}
                legend={row.legend}
            />
        {:else if row.kind === 'summary'}
            <Summary heading={row.heading} rows={row.rows} foot={row.foot} />
        {:else if row.kind === 'grid'}
            <Grid
                kind="grid"
                heading={row.heading}
                lede={row.lede}
                cards={row.cards}
                foot={row.foot}
                legend={row.legend}
                hub={deck.hub}
            />
        {:else if row.kind === 'idea'}
            <Grid kind="idea" cards={[row.card]} hub={deck.hub} />
        {:else if row.kind === 'project'}
            <Project
                slide={row.slide}
                title={row.title}
                stage={row.stage}
                domain={row.domain}
                hub={deck.hub}
                tagTone={tagToneOf(deck, row.slide)}
                {place}
            />
        {:else if row.kind === 'text' || row.kind === 'image' || row.kind === 'columns' || row.kind === 'equation' || row.kind === 'code'}
            <Plain {row} {place} />
        {/if}
    </div>
    {#if held !== null}
        <div class="foot" bind:this={foot}>
            <div class="strip">
                <Facts facts={held} shown={facts} hub={deck.hub} />
            </div>
        </div>
    {/if}
    <span class="probe" aria-hidden="true" bind:this={probe}>Mg</span>
</div>

<style>
    /* The slide takes the frame's inner box: the content and the foot stand in its flow, and the
       probe is placed against its top-left corner. */
    .slide {
        position: relative;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        width: 100%;
        min-height: 100%;
    }

    /* The content is the reading column: as wide as the slide and at most `--slide-reading`,
       centred, and as tall as the slide above the foot, so a part that centres its content
       centres it there; the content's box carries the factor its type is drawn at. */
    .content {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        box-sizing: border-box;
        width: 100%;
        max-width: var(--slide-reading);
        margin-inline: auto;
    }

    .waiting {
        visibility: hidden;
    }

    /* The foot sits at the bottom of the slide, under the content, across the slide's whole
       width, and holds the strip with its own space above it. */
    .foot {
        margin-top: auto;
    }

    .strip {
        padding-top: 1.2em;
    }

    /* One line of the frame's body type, drawn nowhere and taking no room. */
    .probe {
        position: absolute;
        top: 0;
        left: 0;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        font-size: var(--slide-fs-body);
        visibility: hidden;
        pointer-events: none;
    }
</style>
