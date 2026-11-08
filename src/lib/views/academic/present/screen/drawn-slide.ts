// Layer 3, view helper. What the slide's layout (Slide.svelte) reads off a slide as drawn: the
// figures whose image is drawn and the box each is drawn in, what an image's padding adds to it,
// the gap between two figures of a block, where the room for a Markdown image starts under the
// heading, and every formula fitted to its box. Each is a read of the document the layout calls
// between two of its own draws, at each factor it tries; they live apart from the component so
// the component holds the search and the state, and these the measures. A length is answered as a
// fraction of the frame's width (`across`, the frame's drawn width), the unit the layout works in
// (screen/slide-layout.ts).

import { fitFormula } from './formula';

/** One figure of the drawn slide: its index on the slide and its image. */
type Drawn = { index: number; image: HTMLImageElement };

/** The figures of the slide whose image is drawn, in the order the slide holds them. */
export function figuresIn(within: HTMLElement): Drawn[] {
    return [...within.querySelectorAll<HTMLImageElement>('img[data-figure]')].map((image) => ({
        index: Number(image.dataset.figure),
        image
    }));
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
