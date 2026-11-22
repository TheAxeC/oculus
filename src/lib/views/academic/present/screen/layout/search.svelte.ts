// Layer 3, view helper. The layout of one drawn slide (Slide.svelte): the state the slide draws,
// the search that settles it and the layout kept of the slide, which is put on in place of a search
// when it was made from what the slide is now. It is called while the slide's component is being
// initialised, since it registers its effects there, and reads the component's elements and props
// through the functions it is handed, so it lays out whatever the component draws at the moment.
//
// The search draws the content at one factor after another, each with its figures placed, and
// measures it: the greatest factor first, the least next, then the halves of the span between them.
// It runs from the start each time the slide, the strip, the text size or the theme changes, an
// image of the slide loads or fails, or a font loads; the search's own changes start no search, so
// a slide settles on one factor. A slide given `turns` (LayoutTurns) waits on that queue for every
// layout: the first, and those of a font load, a probe change and an image's load or failure, one
// that is already waiting not being queued again and one whose slide goes away being dropped. A
// slide given none lays out at once. On a queue whose turn is one step, a layout asked for while a
// search runs starts it anew.
//
// What a layout is made from (`LayoutInputs`) is the slide and its strip, the size of a line of the
// slide's body type, the page's theme, text scale, configuration and loaded fonts, and the state of
// each of the slide's images. The same inputs draw the same layout, so a slide that is asked to lay
// itself out with the inputs of the layout kept of it puts that one on and tries no factor. A
// layout is kept when what it was made from holds at its end.

import { flushSync, untrack } from 'svelte';
import type {
    Box,
    Deck,
    DeckSlide,
    Layout,
    LayoutInputs,
    ProjectFact
} from '$lib/state/life/present';
import type { KeptLayouts } from '$lib/state/life/present.svelte';
import { configGeneration } from '$lib/state/shared/words/generation.svelte';
import {
    capTopOf,
    figuresIn,
    fitFormulas,
    frameOf,
    gapOf,
    holderOf,
    imagesOf,
    leastOf
} from './drawn-slide';
import type { LayoutTurns } from './layout-turns';
import { FIT_LEAST, FIT_MOST, layOut, type Figure, type SlidePlace } from './slide-layout';

/**
 * How many times, at most, a factor's figures are laid out again with the heights measured under
 * them in the last layout drawn.
 */
const UNDER_PASSES = 3;

/** How many times the search halves the span of factors left once both ends are tried. */
const HALVINGS = 6;

/**
 * How far a measured height may pass its room and count as fitting, for rounding, as a fraction of
 * the frame's width: one 2560th of it, half of one 720th of the frame's height.
 */
const SLACK = 1 / 2560;

/**
 * The least height a Markdown image is held to, so its cap stays above nothing, as a fraction of
 * the frame's width: one 1280th of it.
 */
const LEAST_ROOM = 1 / 1280;

/**
 * How far the probe's size, as a fraction of the frame's width, may move, as a part of itself,
 * before the slide is laid out again: a resize of the frame moves it by rounding alone, and a text
 * size, a theme or a font moves it further.
 */
const PROBE_DRIFT = 0.01;

/** The size of the probe, its width and height as fractions of the frame's width. */
type ProbeSize = readonly [number, number];

/** Whether a probe's size has moved past the drift from another. */
function moved(now: ProbeSize, then: ProbeSize): boolean {
    return now.some((side, at) => Math.abs(side - then[at]) > then[at] * PROBE_DRIFT);
}

/** Whether a layout made from one set of inputs is the layout of the other. */
function sameInputs(one: LayoutInputs, other: LayoutInputs): boolean {
    return (
        one.slide === other.slide &&
        one.page === other.page &&
        one.images === other.images &&
        !moved(one.probe, other.probe)
    );
}

/** What the layout reads of the slide's component. */
type Reads = {
    row: () => DeckSlide;
    deck: () => Deck;
    /** The facts the slide's strip draws, null for a slide that has no strip. */
    facts: () => ProjectFact[] | null;
    slide: () => HTMLElement | null;
    content: () => HTMLElement | null;
    foot: () => HTMLElement | null;
    /** A line of the frame's body type outside the content. */
    probe: () => HTMLElement | null;
    /** The queue every layout waits on; none: at once. */
    turns: () => LayoutTurns | undefined;
    /** The layouts kept of the page's slides; none: every layout is searched and none kept. */
    kept: () => KeptLayouts | undefined;
    /** Told each time the slide has been laid out. */
    onlaid: () => void;
};

/** The layout a slide draws. */
export type SlideLayout = {
    /** The factor on the slide type scale the content is drawn at. */
    readonly fit: number;
    /**
     * The height a Markdown image may take: the room under the heading, as a fraction of the
     * frame's width, 0 until measured.
     */
    readonly room: number;
    /** Where the slide's part draws its figures and its text. */
    readonly place: SlidePlace;
    /** Whether the slide has been laid out once. */
    readonly laid: boolean;
    /** An image of the slide that loads or fails changes what the slide holds. */
    readonly imageSettled: (event: Event) => void;
};

export function createSlideLayout(reads: Reads): SlideLayout {
    let fit = $state(1);
    /** The room's layout, null while it is measured or the slide holds no placed figure. */
    let layout = $state.raw<Layout | null>(null);
    /** Each placed figure's box, by the figure's index on the slide. */
    let boxes = $state.raw<Readonly<Record<number, Box>>>({});
    /** The indexes of the figures whose image failed to load. */
    let failed = $state.raw<readonly number[]>([]);
    /**
     * The bottom of the lowest figure's box as drawn, from the room's top, as a fraction of the
     * frame's width; 0 for none.
     */
    let depth = $state(0);
    let room = $state(0);
    let laid = $state(false);

    const place: SlidePlace = $derived({ layout, boxes, failed, depth });

    /** The search that runs, one step of which is a turn of a stepped queue; null for none. */
    let running: Generator<void, void> | null = null;

    /**
     * The frame's drawn width (Stage's frame, or the print page's), the unit every length of the
     * layout is a fraction of; 0 while it is not drawn.
     */
    function frameWidth(): number {
        return reads.slide()?.closest('[data-frame]')?.getBoundingClientRect().width ?? 0;
    }

    /** The probe's width and height as fractions of the frame's width; null while undrawn. */
    function probeSize(): ProbeSize | null {
        const across = frameWidth();
        const box = reads.probe()?.getBoundingClientRect();
        return box === undefined || across === 0 || box.width === 0
            ? null
            : [box.width / across, box.height / across];
    }

    /** What a layout of the slide as it is drawn now is made from; null while it is not drawn. */
    function inputs(box: HTMLElement, kept: KeptLayouts): LayoutInputs | null {
        const probe = probeSize();
        if (probe === null) return null;
        const scale = getComputedStyle(document.documentElement).getPropertyValue('--text-scale');
        return {
            slide: JSON.stringify([reads.row(), reads.facts(), reads.deck().hub]),
            probe,
            page: JSON.stringify([
                document.body.className,
                scale,
                configGeneration(),
                kept.fontLoads()
            ]),
            ...imagesOf(box, failed)
        };
    }

    /** The slide has been laid out. */
    function settle(): void {
        laid = true;
        flushSync();
        reads.onlaid();
    }

    /** Put on the layout kept of the slide when it was made from what the slide is now. */
    function putOn(box: HTMLElement, now: LayoutInputs | null): boolean {
        const held = reads.kept()?.of(reads.deck(), reads.row().key);
        if (now === null || held === undefined || !sameInputs(now, held.from)) return false;
        ({ fit, room, layout, boxes, failed, depth } = held);
        flushSync();
        // The search leaves each formula's size on the element it fitted it to.
        fitFormulas(box);
        settle();
        return true;
    }

    /** Keep the layout the slide settled on, made from `from`, when that holds. */
    function keep(box: HTMLElement, from: LayoutInputs | null): void {
        const kept = reads.kept();
        if (kept === undefined || from === null) return;
        const now = inputs(box, kept);
        if (now === null || !sameInputs(from, now)) return;
        const settled = { from, fit, room, layout, boxes, failed, depth };
        kept.keep(reads.deck(), reads.row().key, settled);
    }

    /**
     * Lay the slide out: put on the layout kept of it, or measure the room and the figures, then
     * search the largest factor at which the content fits above the foot, drawing each factor it
     * tries, a step at each. A slide that is not drawn (a hidden tab) is left until it is.
     */
    function* layOutSlide(): Generator<void, void> {
        const whole = reads.slide();
        const box = reads.content();
        const foot = reads.foot();
        const parent = whole?.parentElement ?? null;
        const across = frameWidth();
        if (whole === null || box === null || parent === null || whole.offsetWidth === 0) return;
        if (across === 0) return;
        const broken = figuresIn(box)
            .filter((one) => one.image.complete && one.image.naturalWidth === 0)
            .map((one) => one.index);
        if (broken.length > 0) {
            failed = [...new Set([...failed, ...broken])];
            flushSync();
        }
        const kept = reads.kept();
        const from = kept === undefined ? null : inputs(box, kept);
        if (putOn(box, from)) return;

        /** An element's drawn height, as a fraction of the frame's width. */
        const tall = (element: Element): number => element.getBoundingClientRect().height / across;
        const style = getComputedStyle(parent);
        const sides = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
        const inner = tall(parent) - sides / across;
        const above = inner - (foot === null ? 0 : tall(foot));
        /** An element's top from the content's top, as a fraction of the frame's width. */
        const top = (element: Element): number =>
            (element.getBoundingClientRect().top - box.getBoundingClientRect().top) / across;

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
            yield;
            if (fits(FIT_LEAST)) {
                let low = FIT_LEAST;
                let high = FIT_MOST;
                for (let step = 0; step < HALVINGS; step += 1) {
                    yield;
                    const middle = (low + high) / 2;
                    if (fits(middle)) low = middle;
                    else high = middle;
                }
                best = low;
            } else {
                best = FIT_LEAST;
            }
        }
        if (fit !== best) {
            yield;
            draw(best);
        }
        // A frame resized between two steps was measured at two sizes.
        if (reads.turns()?.stepped === true && frameWidth() !== across) {
            ask();
            return;
        }
        keep(box, from);
        settle();
    }

    /** One turn of the slide's layout: a step of it on a stepped queue, the whole of it else. */
    function turn(): void {
        const queue = reads.turns();
        const search = running ?? layOutSlide();
        running = search;
        const stepped = queue?.stepped === true;
        let done = search.next().done;
        while (!stepped && done !== true) done = search.next().done;
        if (running !== search) return;
        if (done === true) running = null;
        else queue?.ask(turn);
    }

    /** Lay the slide out at once, or at its turn on the queue of a slide given one. */
    function ask(): void {
        running = null;
        const queue = reads.turns();
        if (queue === undefined) turn();
        else queue.ask(turn);
    }

    $effect(() => {
        // A slide that goes away while it waits for its turn runs nothing.
        const queue = reads.turns();
        return () => queue?.drop(turn);
    });

    $effect(() => {
        // What is drawn is read so that a change of the slide or its strip runs the effect again;
        // the layout runs once the effect's flush is done, since it flushes.
        $state.snapshot([reads.row(), reads.facts()]);
        untrack(() => {
            failed = [];
        });
        if (reads.turns() !== undefined) {
            ask();
            return;
        }
        let gone = false;
        queueMicrotask(() => {
            if (!gone) ask();
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
        const element = reads.probe();
        if (element === null) return;
        let seen = probeSize();
        const observer = new ResizeObserver(() => {
            const now = probeSize();
            if (now === null) {
                seen = null;
                return;
            }
            if (seen !== null && !moved(now, seen)) return;
            seen = now;
            ask();
        });
        observer.observe(element);
        const fonts = document.fonts;
        fonts.addEventListener('loadingdone', ask);
        return () => {
            observer.disconnect();
            fonts.removeEventListener('loadingdone', ask);
        };
    });

    return {
        get fit() {
            return fit;
        },
        get room() {
            return room;
        },
        get place() {
            return place;
        },
        get laid() {
            return laid;
        },
        imageSettled(event) {
            if (event.target instanceof HTMLImageElement) ask();
        }
    };
}
