// Layer 3, view helper. What a slide's search (search.svelte.ts) reads off a slide as drawn: the
// figures whose image is drawn and the box each is drawn in, the state of each of its images, what
// an image's padding adds to it, the least width of a figure's box its words need, the gap between
// two figures of a block, where the room for a Markdown image starts under the heading, and every
// formula fitted to its box. Each is a read of the document the search calls between two of its own
// draws, at each factor it tries; they live apart from the search so that it holds the state and
// these the measures. A length is answered as a fraction of the frame's width (`across`, the
// frame's drawn width), the unit the layout works in (slide-layout.ts).

import type { LayoutInputs } from '$lib/state/life/present';
import { fitFormula } from '../formula';

/** One figure of the drawn slide: its index on the slide and its image. */
type Drawn = { index: number; image: HTMLImageElement };

/** The figures of the slide whose image is drawn, in the order the slide holds them. */
export function figuresIn(within: HTMLElement): Drawn[] {
    return [...within.querySelectorAll<HTMLImageElement>('img[data-figure]')].map((image) => ({
        index: Number(image.dataset.figure),
        image
    }));
}

/**
 * The images of a slide as a layout is made from them: the indexes of the figures that are drawn as
 * words because their image failed, and each drawn image by its natural size, or that it failed or
 * has not loaded.
 */
export function imagesOf(
    within: HTMLElement,
    failed: readonly number[]
): Pick<LayoutInputs, 'images' | 'loaded'> {
    const states = [...within.querySelectorAll('img')].map((image) => {
        if (!image.complete) return 'waiting';
        return image.naturalWidth === 0 ? 'failed' : `${image.naturalWidth} ${image.naturalHeight}`;
    });
    const broken = failed.length > 0 || states.includes('failed');
    return {
        images: JSON.stringify([failed.toSorted((one, other) => one - other), states]),
        loaded: states.includes('waiting') ? 'waiting' : broken ? 'failed' : 'all'
    };
}

/** The box a figure is drawn in: its panel with the caption and explanation, or its image. */
export function holderOf(image: HTMLImageElement): Element {
    return image.closest('[data-figure-box]') ?? image;
}

/**
 * What the drawn image's padding adds to it, as a fraction of the frame's width (`across`): the
 * larger of its two axes, the left and right sides on the width and the top and bottom on the
 * height, since the layout takes one frame for both.
 */
export function frameOf(image: HTMLImageElement, across: number): number {
    const style = getComputedStyle(image);
    const sum = (...sides: string[]): number =>
        sides.reduce((total, side) => total + (parseFloat(side) || 0), 0);
    const wide = sum(style.paddingLeft, style.paddingRight);
    const high = sum(style.paddingTop, style.paddingBottom);
    return Math.max(wide, high) / across;
}

/**
 * The least width a figure's box may have, as a fraction of the frame's width (`across`): the
 * widest unbreakable run of its caption and explanation with the explanation's padding, 0 for a
 * figure with neither. The box is read at `min-content`, to which the image's percentage width adds
 * nothing, and its width is restored in the same read, so nothing is drawn between.
 */
export function leastOf(image: HTMLImageElement, across: number): number {
    const holder = holderOf(image);
    if (holder === image || holder.children.length < 2) return 0;
    if (!(holder instanceof HTMLElement)) return 0;
    const width = holder.style.width;
    holder.style.width = 'min-content';
    const least = holder.getBoundingClientRect().width / across;
    holder.style.width = width;
    return least;
}

/**
 * The gap between two figures of a block, as a fraction of the frame's width (`across`): the
 * bottom margin of the first figure's box.
 */
export function gapOf(drawn: Drawn[], across: number): number {
    if (drawn.length === 0) return 0;
    return (parseFloat(getComputedStyle(holderOf(drawn[0].image)).marginBottom) || 0) / across;
}

/**
 * Where the room for a Markdown image starts, from the content's top: the top of the part's
 * room (`data-room`), or, when the room is one Markdown field that opens with a heading (a
 * text slide's), under that heading, its bottom margin included; the content's top when the
 * part marks no room. `top` and `tall` answer in fractions of the frame's width, and the margin
 * is divided by the frame's drawn width (`across`) to match.
 */
export function capTopOf(
    space: Element | null,
    top: (element: Element) => number,
    tall: (element: Element) => number,
    across: number
): number {
    if (space === null) return 0;
    const opening = space.querySelector(':scope > .block')?.firstElementChild ?? null;
    if (opening !== null && /^H[1-6]$/.test(opening.tagName)) {
        const margin = parseFloat(getComputedStyle(opening).marginBottom) || 0;
        return top(opening) + tall(opening) + margin / across;
    }
    return top(space);
}

/** Fit every formula of the slide to the box it is drawn in now. */
export function fitFormulas(within: HTMLElement): void {
    for (const card of within.querySelectorAll<HTMLElement>('[data-formula]')) {
        fitFormula(card);
    }
}
