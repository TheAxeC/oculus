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
    // screen/slide-layout.ts gives from the room this measures, each figure's ratio, read from its
    // image once it has loaded, the padding of its drawn image, the gap under its drawn panel, the
    // height of its caption and explanation at the width the figure is drawn at, the least width
    // those words need, and the height of the text at the least factor, so figures side by side are
    // never narrower than their words. The factor is found by a bounded search, each size drawn and
    // measured in turn, run from the start each time the slide, the strip, the text size or the
    // theme changes, an image of the slide loads or fails, or a font loads; the search's own
    // changes start no search, so a slide settles on one factor. A factor fits when the content
    // ends above the foot, the text inside its box and every figure's box, caption included, inside
    // the room. An image in a slide's Markdown is drawn no taller than the room under the slide's
    // heading at the factor tried, less what the rest of the slide's Markdown takes of that room. A
    // figure whose image has not loaded is not drawn until it has, and one that fails is drawn as
    // the missing-figure words, as text. The content is hidden until it has been laid out once. A
    // slide whose content does not fit at the least factor is drawn at it and runs past its frame,
    // its room as tall as its lowest figure, which a measuring Stage reports as too tall. What the
    // layout reads off the drawn slide (its figures, their frames and gaps, the least width of
    // their words, the room under a heading, the formulas' fit) is screen/drawn-slide.ts's; the
    // search and the state it sets are here. A slide given `turns` (the Overview's tiles,
    // screen/layout-turns.ts) waits on that queue for every layout: the first, and those of a font
    // load, a probe change and an image's load or failure, one that is already waiting not being
    // queued again and one whose slide goes away being dropped. A slide given none lays out at
    // once.
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

    import { flushSync, untrack } from 'svelte';
    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Facts from './parts/project/Facts.svelte';
    import Project from './parts/project/Project.svelte';
    import Section from './parts/Section.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import {
        capTopOf,
        figuresIn,
        fitFormulas,
        frameOf,
        gapOf,
        holderOf,
        leastOf
    } from './screen/drawn-slide';
    import {
        FIT_LEAST,
        FIT_MOST,
        cqw,
        layOut,
        type Box,
        type Figure,
        type Layout,
        type SlidePlace
    } from './screen/slide-layout';
    import type { LayoutTurns } from './screen/layout-turns';
    import { slideFacts, tagToneOf } from '$lib/state/life/present';
    import type { Deck, DeckSlide } from '$lib/state/life/present';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        /** Told each time the slide has been laid out: the print page waits for every slide. */
        onlaid?: () => void;
        /** The queue every layout of this slide waits on, an Overview tile's; none: at once. */
        turns?: LayoutTurns;
    };

    let { row, deck, facts, onlaid, turns }: Props = $props();

    /**
     * How many times, at most, a factor's figures are laid out again with the heights measured
     * under them in the last layout drawn.
     */
    const UNDER_PASSES = 3;

    /** How many times the search halves the span of factors left once both ends are tried. */
    const HALVINGS = 6;

    /**
     * How far a measured height may pass its room and count as fitting, for rounding, as a fraction
     * of the frame's width: one 2560th of it, half of one 720th of the frame's height.
     */
    const SLACK = 1 / 2560;

    /**
     * The least height a Markdown image is held to, so its cap stays above nothing, as a fraction
     * of the frame's width: one 1280th of it.
     */
    const LEAST_ROOM = 1 / 1280;

    /**
     * How far the probe's size, as a fraction of the frame's width, may move, as a part of itself,
     * before the slide is laid out again: a resize of the frame moves it by rounding alone, and a
     * text size, a theme or a font moves it further.
     */
    const PROBE_DRIFT = 0.01;

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
    /**
     * The bottom of the lowest figure's box as drawn, from the room's top, as a fraction of the
     * frame's width; 0 for none.
     */
    let depth = $state(0);
    /**
     * The height a Markdown image may take: the room under the heading, as a fraction of the
     * frame's width, 0 until measured.
     */
    let room = $state(0);
    /** Whether the slide has been laid out once. */
    let laid = $state(false);

    const place: SlidePlace = $derived({ layout, boxes, failed, depth });

    let slide = $state<HTMLElement | null>(null);
    let content = $state<HTMLElement | null>(null);
    let foot = $state<HTMLElement | null>(null);
    let probe = $state<HTMLElement | null>(null);

    /**
     * The frame's drawn width (Stage's frame, or the print page's), the unit every length of the
     * layout is a fraction of; 0 while it is not drawn.
     */
    function frameWidth(): number {
        return slide?.closest('[data-frame]')?.getBoundingClientRect().width ?? 0;
    }

    /**
     * Lay the slide out: measure the room and the figures, then search the largest factor at
     * which the content fits above the foot, drawing each factor it tries. A slide that is not
     * drawn (a hidden tab) is left until it is.
     */
    function layOutSlide(): void {
        const whole = slide;
        const box = content;
        const parent = whole?.parentElement ?? null;
        const across = frameWidth();
        if (whole === null || box === null || parent === null || whole.offsetWidth === 0) return;
        if (across === 0) return;
        /** An element's drawn height, as a fraction of the frame's width. */
        const tall = (element: Element): number => element.getBoundingClientRect().height / across;
        const style = getComputedStyle(parent);
        const sides = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
        const inner = tall(parent) - sides / across;
        const kept = foot === null ? 0 : tall(foot);
        const above = inner - kept;
        /** An element's top from the content's top, as a fraction of the frame's width. */
        const top = (element: Element): number =>
            (element.getBoundingClientRect().top - box.getBoundingClientRect().top) / across;

        const broken = figuresIn(box)
            .filter((one) => one.image.complete && one.image.naturalWidth === 0)
            .map((one) => one.index);
        if (broken.length > 0) failed = [...new Set([...failed, ...broken])];
        room = above;
        flushSync();
        const known = figuresIn(box).filter(
            (one) => one.image.complete && one.image.naturalWidth > 0 && one.image.naturalHeight > 0
        );
        const frames = known.map((one) => frameOf(one.image, across));
        const gap = gapOf(known, across);

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
            const cap = Math.max(0, above - capTopOf(space, top, tall, across));
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
                room = Math.max(LEAST_ROOM, Math.min(room, drawn) - overrun);
                flushSync();
            }
            if (known.length > 0 && space !== null) {
                const size = {
                    width: space.getBoundingClientRect().width / across,
                    height: above - top(space)
                };
                let asked: Figure[] = known.map((one, at) => ({
                    ratio: one.image.naturalWidth / one.image.naturalHeight,
                    frame: frames[at]
                }));
                show(layOut({ room: size, figures: asked, text: least, between: gap }));
                // What is drawn under each figure is measured at the width the layout gave it and
                // the figures laid out again with those heights, until no height grows. A height
                // is kept at the largest measured, so the passes end. The first pass also reads
                // the least width each figure's words need, once its box is drawn, and lays out
                // once more with it.
                for (let pass = 0; pass < UNDER_PASSES; pass += 1) {
                    const under = known.map((one) => tall(holderOf(one.image)) - tall(one.image));
                    const grown = asked.some((one, at) => under[at] > (one.under ?? 0) + SLACK);
                    const words = pass === 0 ? known.map((one) => leastOf(one.image, across)) : [];
                    if (!grown && !words.some((width) => width > 0)) break;
                    asked = asked.map((one, at) => ({
                        ...one,
                        under: Math.max(one.under ?? 0, under[at]),
                        least: words[at] ?? one.least
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

    /** Lay the slide out at once, or at its turn on the queue of a slide given one. */
    function askLayout(): void {
        if (turns === undefined) layOutSlide();
        else turns.ask(layOutSlide);
    }

    /** An image of the slide that loads or fails changes what the slide holds. */
    function imageSettled(event: Event): void {
        if (event.target instanceof HTMLImageElement) askLayout();
    }

    $effect(() => {
        // A slide that goes away while it waits for its turn runs nothing.
        const queue = turns;
        return () => queue?.drop(layOutSlide);
    });

    $effect(() => {
        // What is drawn is read so that a change of the slide or its strip runs the effect again;
        // the layout runs once the effect's flush is done, since it flushes.
        $state.snapshot([row, held]);
        untrack(() => {
            failed = [];
        });
        if (turns !== undefined) {
            turns.ask(layOutSlide);
            return;
        }
        let gone = false;
        queueMicrotask(() => {
            if (!gone) layOutSlide();
        });
        return () => {
            gone = true;
        };
    });

    $effect(() => {
        // The probe is a line of the frame's body type outside the content, two fixed letters that
        // are hidden and never read: its size, as a fraction of the frame's width, changes with the
        // text size, the theme and the slide being shown, and the factor the layout sets is outside
        // it. A resize of the frame changes the probe's drawn size and leaves its fraction of the
        // frame but for rounding, which `PROBE_DRIFT` holds back, so it starts no layout.
        const element = probe;
        if (element === null) return;
        /** The probe's width and height as fractions of the frame's width; null while undrawn. */
        const sizeOf = (): readonly [number, number] | null => {
            const across = frameWidth();
            const box = element.getBoundingClientRect();
            return across === 0 || box.width === 0
                ? null
                : [box.width / across, box.height / across];
        };
        /** Whether a probe's size has moved past the drift from the size last laid out at. */
        const moved = (now: readonly [number, number], then: readonly [number, number]): boolean =>
            now.some((side, at) => Math.abs(side - then[at]) > then[at] * PROBE_DRIFT);
        let seen = sizeOf();
        const observer = new ResizeObserver(() => {
            const now = sizeOf();
            if (now === null) {
                seen = null;
                return;
            }
            if (seen !== null && !moved(now, seen)) return;
            seen = now;
            askLayout();
        });
        observer.observe(element);
        const fonts = document.fonts;
        fonts.addEventListener('loadingdone', askLayout);
        return () => {
            observer.disconnect();
            fonts.removeEventListener('loadingdone', askLayout);
        };
    });
</script>

<div class="slide" data-slide-key={row.key} bind:this={slide}>
    <div
        class="content slide-fit"
        class:waiting={!laid}
        style:--slide-fit={fit}
        style:--slide-room-height={room > 0 ? cqw(room) : undefined}
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
