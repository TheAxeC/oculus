<script lang="ts">
    // Layer 3, Present partial. One slide of the deck drawn as the kind it is. It is the one place
    // that knows which component each kind is, so the pane draws a slide by handing this the slide
    // and the deck and nothing else. The slide sits in a reading column as wide as the frame's
    // inner width and at most `--slide-reading` (1040 px, themes/slide.css), centred in the frame
    // and as tall as its inner box, and a part that centres its content takes the column's height.
    //
    // The slide lays itself out from what it holds, in the frame's own px, so it is laid out the
    // same on every surface that draws it at the same frame: the pane, the presenter screen, the
    // Overview's tiles, the audience window and the print page. Its content is drawn at one factor
    // on the slide type scale (`--slide-fit` on the content's box), between 0.75 and 1.25: the
    // largest at which the content fits above the foot. A part with figures (a project slide's
    // panels, an image slide's image) draws them in a room under its title, at the boxes
    // screen/slide-layout.ts gives from the room this measures, each figure's ratio, read from its
    // image once it has loaded, the padding and border of its drawn image, the gap under its drawn
    // panel, the height of its caption and explanation at the width the figure is drawn at, and
    // the height of the text at the least factor. The factor is found by a bounded search, each
    // size drawn and measured in turn, run from the start each time the slide, its deck's frame,
    // the strip, the text size or the theme changes, an image of the slide loads or fails, or a
    // font loads; the search's own changes start no search, so a slide settles on one factor. A
    // factor fits when the content ends above the foot, the text inside its box and every figure's
    // box, caption included, inside the room. An image in a slide's Markdown is drawn no taller
    // than the room under the slide's heading at the factor tried, less what the rest of the
    // slide's Markdown takes of that room. A figure whose image has not
    // loaded is not drawn until it has, and one that fails is drawn as the missing-figure words,
    // as text. The content is hidden until it has been laid out once. A slide whose content does
    // not fit at the least factor is drawn at it and runs past its frame, its room as tall as its
    // lowest figure, which a measuring Stage reports as too tall.
    //
    // The slide's foot, under its content, holds the strip of a project's facts at the frame's own
    // type scale. A slide that comes from a project's deck (`row.project`) carries the strip of
    // that project's facts (`deck.projects`, read by `slideFacts`, no strip for a project with
    // none), on every surface that draws a slide, its words shown by the pane's Project facts
    // toggle (`facts`) and hidden, their room kept, when it is off. The content's room is taken
    // above the foot with the strip counted. The first slide of a deck carries the key hint when
    // the pane draws it; no deck file holds one. The hint is drawn out of the flow, under the
    // reading column in the frame's bottom padding, and takes no room while its lines fit that
    // padding; the lines past it, in a narrow reading column or at a large text size, are kept at
    // the column's foot and taken off the content's room.

    import { flushSync, untrack } from 'svelte';
    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Facts from './parts/project/Facts.svelte';
    import Project from './parts/project/Project.svelte';
    import Section from './parts/Section.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import { fitFormula } from './screen/formula';
    import {
        FIT_LEAST,
        FIT_MOST,
        layOut,
        type Box,
        type Figure,
        type Layout,
        type SlidePlace
    } from './screen/slide-layout';
    import { slideFacts, tagToneOf } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import type { Deck, DeckSlide } from '$lib/state/life/present';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether this is the deck's first slide, which names the keys under it. */
        first: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        /** Told each time the slide has been laid out: the print page waits for every slide. */
        onlaid?: () => void;
    };

    let { row, deck, first, facts, onlaid }: Props = $props();

    /**
     * How many times, at most, a factor's figures are laid out again with the heights measured
     * under them in the last layout drawn.
     */
    const UNDER_PASSES = 3;

    /** How many times the search halves the span of factors left once both ends are tried. */
    const HALVINGS = 6;

    /** How many px a measured height may pass its room by and count as fitting, for rounding. */
    const SLACK = 0.5;

    /** The facts the slide's strip draws, null for a slide that has no strip. */
    const held = $derived(slideFacts(deck, row));

    /** The factor on the slide type scale the content is drawn at. */
    let fit = $state(1);
    /** The room's layout, null while it is measured or the slide holds no placed figure. */
    let layout = $state<Layout | null>(null);
    /** Each placed figure's box, by the figure's index on the slide. */
    let boxes = $state<Record<number, Box>>({});
    /** The indexes of the figures whose image failed to load. */
    let failed = $state<number[]>([]);
    /** The bottom of the lowest figure's box as drawn, from the room's top, in px; 0 for none. */
    let depth = $state(0);
    /** The height a Markdown image may take: the room under the heading, 0 until measured. */
    let room = $state(0);
    /** The px of the key hint past the frame's bottom padding, kept at the column's foot. */
    let past = $state(0);
    /** Whether the slide has been laid out once. */
    let laid = $state(false);

    const place: SlidePlace = $derived({ layout, boxes, failed, depth });

    let reading = $state<HTMLElement | null>(null);
    let content = $state<HTMLElement | null>(null);
    let foot = $state<HTMLElement | null>(null);
    let probe = $state<HTMLElement | null>(null);
    let keys = $state<HTMLElement | null>(null);

    /** One figure of the drawn slide: its index on the slide and its image. */
    type Drawn = { index: number; image: HTMLImageElement };

    /** The figures of the slide whose image is drawn, in the order the slide holds them. */
    function figuresIn(within: HTMLElement): Drawn[] {
        return [...within.querySelectorAll<HTMLImageElement>('img[data-figure]')].map((image) => ({
            index: Number(image.dataset.figure),
            image
        }));
    }

    /** The box a figure is drawn in: its panel with the caption and explanation, or its image. */
    function holderOf(image: HTMLImageElement): Element {
        return image.closest('[data-figure-box]') ?? image;
    }

    /**
     * The px the drawn image's padding and border add to it: the larger of its two axes, the
     * left and right sides on the width and the top and bottom on the height, since the layout
     * takes one frame for both.
     */
    function frameOf(image: HTMLImageElement): number {
        const style = getComputedStyle(image);
        const px = (...sides: string[]): number =>
            sides.reduce((total, side) => total + (parseFloat(side) || 0), 0);
        const across = px(
            style.paddingLeft,
            style.paddingRight,
            style.borderLeftWidth,
            style.borderRightWidth
        );
        const down = px(
            style.paddingTop,
            style.paddingBottom,
            style.borderTopWidth,
            style.borderBottomWidth
        );
        return Math.max(across, down);
    }

    /** The gap between two figures of a block: the bottom margin of the first figure's box. */
    function gapOf(drawn: Drawn[]): number {
        if (drawn.length === 0) return 0;
        return parseFloat(getComputedStyle(holderOf(drawn[0].image)).marginBottom) || 0;
    }

    /**
     * Where the room for a Markdown image starts, from the content's top: the top of the part's
     * room (`data-room`), or, when the room is one Markdown field that opens with a heading (a
     * text slide's), under that heading, its bottom margin included; the content's top when the
     * part marks no room.
     */
    function capTopOf(
        space: Element | null,
        top: (element: Element) => number,
        tall: (element: Element) => number
    ): number {
        if (space === null) return 0;
        const opening = space.querySelector(':scope > .block')?.firstElementChild ?? null;
        if (opening !== null && /^H[1-6]$/.test(opening.tagName)) {
            const margin = parseFloat(getComputedStyle(opening).marginBottom) || 0;
            return top(opening) + tall(opening) + margin;
        }
        return top(space);
    }

    /** Fit every formula of the slide to the box it is drawn in now. */
    function fitFormulas(within: HTMLElement): void {
        for (const card of within.querySelectorAll<HTMLElement>('[data-formula]')) {
            fitFormula(card);
        }
    }

    /**
     * Lay the slide out: measure the room and the figures, then search the largest factor at
     * which the content fits above the foot, drawing each factor it tries. A slide that is not
     * drawn (a hidden tab) is left until it is.
     */
    function layOutSlide(): void {
        const column = reading;
        const box = content;
        const parent = column?.parentElement ?? null;
        if (column === null || box === null || parent === null || column.offsetWidth === 0) {
            return;
        }
        // The slide is drawn scaled; a rect divided by the scale is in the frame's own px.
        const scale = column.getBoundingClientRect().width / column.offsetWidth;
        const tall = (element: Element): number => element.getBoundingClientRect().height / scale;
        const frame = getComputedStyle(parent);
        const inner =
            parent.clientHeight - parseFloat(frame.paddingTop) - parseFloat(frame.paddingBottom);
        // The key hint's lines that pass the frame's bottom padding are kept at the column's foot.
        past =
            keys === null
                ? 0
                : Math.max(0, Math.ceil(tall(keys) - parseFloat(frame.paddingBottom)));
        flushSync();
        const kept = foot === null ? 0 : tall(foot);
        const above = inner - kept - past;
        /** An element's top from the content's top, in the frame's own px. */
        const top = (element: Element): number =>
            (element.getBoundingClientRect().top - box.getBoundingClientRect().top) / scale;

        const broken = figuresIn(box)
            .filter((one) => one.image.complete && one.image.naturalWidth === 0)
            .map((one) => one.index);
        if (broken.length > 0) failed = [...new Set([...failed, ...broken])];
        room = above;
        flushSync();
        const known = figuresIn(box).filter(
            (one) => one.image.complete && one.image.naturalWidth > 0 && one.image.naturalHeight > 0
        );
        const frames = known.map((one) => frameOf(one.image));
        const gap = gapOf(known);

        /** Put a layout on the slide, each of its boxes under the index of its figure. */
        const show = (next: Layout | null): void => {
            layout = next;
            depth = 0;
            boxes = Object.fromEntries(
                known
                    .map((one, at) => [one.index, next?.figures[at]] as const)
                    .filter((pair): pair is readonly [number, Box] => pair[1] !== undefined)
            );
            flushSync();
        };

        /** The bottom of each figure's box as drawn, caption included, from the content's top. */
        const bottoms = (): number[] =>
            known.map((one) => {
                const holder = holderOf(one.image);
                return top(holder) + tall(holder);
            });

        // The text's height at the least factor across the room's width, which a figure under
        // the text leaves it, measured with no figure placed.
        let least: number | null = null;
        if (known.length > 0) fit = FIT_LEAST;
        show(null);
        if (known.length > 0) {
            fitFormulas(box);
            const text = box.querySelector('[data-text]');
            least = text === null ? null : tall(text);
        }

        /**
         * Draw the slide at a factor: the room is measured under the title at that size, and a
         * Markdown image is held to the room under the heading.
         */
        const draw = (factor: number): void => {
            fit = factor;
            flushSync();
            const space = box.querySelector('[data-room]');
            const cap = Math.max(0, above - capTopOf(space, top, tall));
            if (cap !== room) {
                room = cap;
                flushSync();
            }
            // A Markdown image takes what the rest of the slide's Markdown leaves it: on a slide
            // with no placed figure whose content still runs past the foot, the cap is lowered
            // once by the overrun, from the height its tallest image is drawn at.
            const overrun = tall(box) - above;
            const images = [...box.querySelectorAll('.block img')];
            if (known.length === 0 && overrun > SLACK && images.length > 0) {
                const drawn = Math.max(...images.map((image) => tall(image)));
                room = Math.max(1, Math.min(room, drawn) - overrun);
                flushSync();
            }
            if (known.length > 0 && space !== null) {
                const size = {
                    width: space.getBoundingClientRect().width / scale,
                    height: above - top(space)
                };
                let asked: Figure[] = known.map((one, at) => ({
                    ratio: one.image.naturalWidth / one.image.naturalHeight,
                    frame: frames[at]
                }));
                show(layOut({ room: size, figures: asked, text: least, between: gap }));
                // What is drawn under each figure is measured at the width the layout gave it and
                // the figures laid out again with those heights, until no height grows. A height
                // is kept at the largest measured, so the passes end.
                for (let pass = 0; pass < UNDER_PASSES; pass += 1) {
                    const under = known.map((one) => tall(holderOf(one.image)) - tall(one.image));
                    const grown = asked.some((one, at) => under[at] > (one.under ?? 0) + SLACK);
                    if (!grown) break;
                    asked = asked.map((one, at) => ({
                        ...one,
                        under: Math.max(one.under ?? 0, under[at])
                    }));
                    show(layOut({ room: size, figures: asked, text: least, between: gap }));
                }
                // An absolute figure makes no room taller, so the room is drawn as tall as the
                // lowest figure's box where that ends below the layout's height.
                const lowest = Math.max(...bottoms()) - top(space);
                if (layout !== null && lowest > layout.height + SLACK) {
                    depth = lowest;
                    flushSync();
                }
            }
            fitFormulas(box);
        };

        /**
         * Whether the content fits above the foot at a factor: its text inside its box and every
         * figure's box, caption included, inside the room.
         */
        const fits = (factor: number): boolean => {
            draw(factor);
            const text = box.querySelector('[data-text]');
            const given = layout?.text ?? null;
            const inside = text === null || given === null || tall(text) <= given.height + SLACK;
            const placed = bottoms().every((bottom) => bottom <= above + SLACK);
            return inside && placed && tall(box) <= above + SLACK;
        };

        let best = FIT_MOST;
        if (!fits(FIT_MOST)) {
            if (fits(FIT_LEAST)) {
                let low = FIT_LEAST;
                let high = FIT_MOST;
                for (let step = 0; step < HALVINGS; step += 1) {
                    const middle = (low + high) / 2;
                    if (fits(middle)) low = middle;
                    else high = middle;
                }
                best = low;
            } else {
                best = FIT_LEAST;
            }
        }
        if (fit !== best) draw(best);
        laid = true;
        flushSync();
        onlaid?.();
    }

    /** An image of the slide that loads or fails changes what the slide holds. */
    function imageSettled(event: Event): void {
        if (event.target instanceof HTMLImageElement) layOutSlide();
    }

    $effect(() => {
        // What is drawn is read so that a change of the slide, its deck's frame or its strip runs
        // the effect again; the layout runs once the effect's flush is done, since it flushes.
        $state.snapshot([row, deck.frame, held]);
        untrack(() => {
            failed = [];
        });
        let gone = false;
        queueMicrotask(() => {
            if (!gone) layOutSlide();
        });
        return () => {
            gone = true;
        };
    });

    $effect(() => {
        // The probe is a line of the frame's body type outside the content: its size changes with
        // the text size, the theme and the slide being shown, and the factor the layout sets is
        // outside it.
        const element = probe;
        if (element === null) return;
        const sizeOf = (): string => `${element.offsetWidth} ${element.offsetHeight}`;
        let seen = sizeOf();
        const observer = new ResizeObserver(() => {
            const now = sizeOf();
            if (now === seen) return;
            seen = now;
            layOutSlide();
        });
        observer.observe(element);
        const fonts = document.fonts;
        fonts.addEventListener('loadingdone', layOutSlide);
        return () => {
            observer.disconnect();
            fonts.removeEventListener('loadingdone', layOutSlide);
        };
    });
</script>

<div
    class="reading"
    data-slide-key={row.key}
    style:--keys-past={past > 0 ? `${past}px` : undefined}
    bind:this={reading}
>
    <div
        class="content slide-fit"
        class:waiting={!laid}
        style:--slide-fit={fit}
        style:--slide-room-height={room > 0 ? `${room}px` : undefined}
        bind:this={content}
        onloadcapture={imageSettled}
        onerrorcapture={imageSettled}
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
    {#if first}
        <p class="keys" bind:this={keys}>{t('present.key_hint')}</p>
    {/if}
    <span class="probe" aria-hidden="true" bind:this={probe}>{t('present.key_hint')}</span>
</div>

<style>
    /* The column keeps at its foot, inside its height, the lines of the key hint past the frame's
       bottom padding (`--keys-past`). */
    .reading {
        position: relative;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        width: 100%;
        max-width: var(--slide-reading);
        min-height: 100%;
        margin-inline: auto;
        padding-bottom: var(--keys-past, 0px);
    }

    /* The content takes the column's height above the foot, so a part that centres its content
       centres it there; the content's box carries the factor its type is drawn at. */
    .content {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
    }

    .waiting {
        visibility: hidden;
    }

    /* The foot sits at the bottom of the reading column, under the slide's content, and holds the
       strip with its own space above it. */
    .foot {
        margin-top: auto;
    }

    .strip {
        padding-top: 1.2em;
    }

    /* The key hint is drawn out of the flow, in the app's type step at the frame, at the factor 1,
       under the reading column in the frame's 64 px bottom padding (themes/slide.css). In the
       1040 px column of a 1280 by 720 frame it takes two lines at most up to a text size of 1.6
       (2 x 13 x 1.6 x 1.25 = 52 px and a padding of 10.4 px), which fit the padding, and takes
       no room. In a narrower column or at a larger size it starts above the column's foot by as
       many px as it passes the padding, in the room the column keeps for them, so its last line
       ends at the frame's inner edge. */
    .keys {
        position: absolute;
        top: calc(100% - var(--keys-past, 0px));
        right: 0;
        left: 0;
        margin: 0;
        padding-top: 0.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        line-height: 1.25;
        text-align: center;
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
