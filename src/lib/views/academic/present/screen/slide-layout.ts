// Layer 3, view helper. Where a slide's figures and its text go in the room under the slide's
// title, every length a fraction of the frame's width. Slide.svelte measures the drawn slide (the
// room, each figure's width over its height, the height of its caption and explanation, the text's
// height at its least size), divides each length by the frame's drawn width and hands the numbers
// here; the parts draw the boxes this answers in container units of the frame, so a box is the
// same part of the slide at any size the slide is drawn at. It is arithmetic alone, with no DOM
// and no import, so the same numbers give the same boxes on every surface, and it can be run as
// it is under Node.
//
// The figures of a slide are placed as one block: one figure alone, or every figure side by side
// (one image height) or stacked (one image width), whichever draws the figures larger in the room.
// A block that the room's full height leaves narrower than the room is tall: a column at the
// room's right, centred in the room's height, the text beside it keeping at least `TEXT_LEAST` of
// the frame's width and the gap. Any other block, and a tall one in a room too narrow to keep the
// text that width, is wide: the room's full width under the text, centred, no taller than the room
// leaves under the text at its least size. A slide with no text gives the block the whole room,
// centred. No box is larger than the room, and a figure may be drawn larger than its pixels. Where
// the text at its least size leaves a wide block no height at all, the block is drawn whole under
// the text, at the size the room's full width and height allow, and the layout is taller than the
// room, so the slide is measured too tall with its figures drawn. A block whose captions and
// explanations are themselves taller than the room is never a column of no width: it is drawn
// under the text, its images as large as the room allows them alone.

/** The least width the text keeps beside a column of figures, a fraction of the frame's width. */
const TEXT_LEAST = 0.28125;

/**
 * The gap between the text and the figures, as a fraction of the frame's width, the gap of a
 * project slide's two columns.
 */
export const TEXT_GAP = 0.0203125;

/** The least factor on the slide type scale the text is drawn at. */
export const FIT_LEAST = 0.75;

/** The greatest factor on the slide type scale the text is drawn at. */
export const FIT_MOST = 1.25;

/**
 * A length of the layout, a fraction of the frame's width, as the CSS length a part draws it at:
 * in container units of the frame (`cqw`, a hundredth of its width).
 */
export function cqw(length: number): string {
    return `${length * 100}cqw`;
}

type Size = { width: number; height: number };

/** A box in the room, its corner from the room's top left. */
export type Box = Size & { x: number; y: number };

/** One figure as the layout takes it. */
export type Figure = {
    /** The image's width over its height. */
    ratio: number;
    /** What the figure's box adds to the image on each axis: its padding. */
    frame?: number;
    /** The height drawn under the figure's box: its caption and its explanation. */
    under?: number;
};

/** How the figures of the block are set against each other. */
type Arrangement = 'one' | 'side' | 'stacked';

/** Where the block sits: a column beside the text, under the text, or alone in the room. */
type Shape = 'tall' | 'wide' | 'alone';

export type Layout = {
    arrangement: Arrangement;
    shape: Shape;
    /** The box of every figure together, captions included. */
    block: Box;
    /** Each figure's box, its image and frame, what is under it left out, in the asked order. */
    figures: Box[];
    /** The box the text has, null on a slide with no text. */
    text: Box | null;
    /**
     * The height the layout takes: the room's, or more when the text at its least size leaves no
     * room under it and the block is drawn under the text, past the room.
     */
    height: number;
};

/** What a slide's part draws its room from, as Slide.svelte hands it on. */
export type SlidePlace = {
    /** The room's layout; null while the slide is measured or holds no figure with a ratio. */
    layout: Layout | null;
    /** Each placed figure's box, by the figure's index on the slide. */
    boxes: Readonly<Record<number, Box>>;
    /** The indexes of the figures whose image failed to load, which are drawn as words. */
    failed: readonly number[];
    /**
     * The bottom of the lowest figure's box as drawn, caption included, from the room's top, when
     * it ends below the layout's height; 0 otherwise. The room is drawn at least this tall.
     */
    depth: number;
};

type LayoutAsk = {
    /** The room under the slide's title and above its foot. */
    room: Size;
    figures: Figure[];
    /** The text's height at its least size across the room's width; null for a slide with none. */
    text: number | null;
    /** The gap between two figures of the block. */
    between?: number;
};

/**
 * The block's width and height at a scale `s`, which is the one image height of figures side by
 * side and the one image width of figures stacked: `a * s + b` wide and `p * s + q` tall.
 */
type Line = { a: number; b: number; p: number; q: number };

function lineOf(figures: Figure[], arrangement: Arrangement, between: number): Line {
    const gaps = between * (figures.length - 1);
    const frames = figures.map((one) => one.frame ?? 0);
    const tall = figures.map((one) => (one.frame ?? 0) + (one.under ?? 0));
    const sum = (values: number[]): number => values.reduce((total, one) => total + one, 0);
    if (arrangement === 'stacked') {
        return {
            a: 1,
            b: Math.max(...frames),
            p: sum(figures.map((one) => 1 / one.ratio)),
            q: sum(tall) + gaps
        };
    }
    return {
        a: sum(figures.map((one) => one.ratio)),
        b: sum(frames) + gaps,
        p: 1,
        q: Math.max(...tall)
    };
}

/** The largest scale at which the block fits a box, 0 when none does. */
function scaleIn(line: Line, width: number, height: number): number {
    return Math.max(0, Math.min((width - line.b) / line.a, (height - line.q) / line.p));
}

/** The block's place and the text's box, with whether the block has room of its own. */
type Placed = {
    shape: Shape;
    scale: number;
    x: number;
    y: number;
    text: Box | null;
    room: boolean;
};

function placeOf(line: Line, bare: Line, room: Size, text: number | null): Placed {
    const size = (s: number): Size => ({ width: line.a * s + line.b, height: line.p * s + line.q });
    if (text === null) {
        const scale =
            scaleIn(line, room.width, room.height) || scaleIn(bare, room.width, room.height);
        const block = size(scale);
        const x = (room.width - block.width) / 2;
        const y = (room.height - block.height) / 2;
        return { shape: 'alone', scale, x, y, text: null, room: true };
    }
    const column = room.width - TEXT_LEAST - TEXT_GAP;
    const full = (room.height - line.q) / line.p;
    if (
        line.a * full + line.b < room.width &&
        column > 0 &&
        scaleIn(line, column, room.height) > 0
    ) {
        const scale = scaleIn(line, column, room.height);
        const block = size(scale);
        const x = room.width - block.width;
        const y = (room.height - block.height) / 2;
        const beside = { x: 0, y: 0, width: x - TEXT_GAP, height: room.height };
        return { shape: 'tall', scale, x, y, text: beside, room: true };
    }
    const under = scaleIn(line, room.width, room.height - text);
    if (under > 0) {
        const block = size(under);
        const y = room.height - block.height;
        const above = { x: 0, y: 0, width: room.width, height: y };
        const x = (room.width - block.width) / 2;
        return { shape: 'wide', scale: under, x, y, text: above, room: true };
    }
    // The text at its least size leaves the block no room: it is drawn under the text whole, as
    // the room's full width and height allow, and the slide runs past its frame. Where what is
    // drawn under the figures is itself taller than the room, the images take the size the room
    // allows them alone and what is under them runs past it.
    const scale = scaleIn(line, room.width, room.height) || scaleIn(bare, room.width, room.height);
    const x = (room.width - size(scale).width) / 2;
    const above = { x: 0, y: 0, width: room.width, height: text };
    return { shape: 'wide', scale, x, y: text, text: above, room: false };
}

function layoutOf(
    figures: Figure[],
    arrangement: Arrangement,
    room: Size,
    text: number | null,
    between: number
): { layout: Layout; area: number } {
    const line = lineOf(figures, arrangement, between);
    const bare = lineOf(
        figures.map((one) => ({ ...one, under: 0 })),
        arrangement,
        between
    );
    const placed = placeOf(line, bare, room, text);
    const s = placed.scale;
    const block = {
        x: placed.x,
        y: placed.y,
        width: line.a * s + line.b,
        height: line.p * s + line.q
    };
    const boxes: Box[] = [];
    let along = 0;
    for (const one of figures) {
        const frame = one.frame ?? 0;
        if (arrangement === 'stacked') {
            const width = s + frame;
            const height = s / one.ratio + frame;
            boxes.push({
                x: block.x + (block.width - width) / 2,
                y: block.y + along,
                width,
                height
            });
            along += height + (one.under ?? 0) + between;
        } else {
            const width = s * one.ratio + frame;
            boxes.push({ x: block.x + along, y: block.y, width, height: s + frame });
            along += width + between;
        }
    }
    // The figures' own area, their frames left out, and none for a block with no room of its own,
    // so a block that has room is chosen over one the text leaves no room.
    const images = figures.map((one) =>
        arrangement === 'stacked' ? (s * s) / one.ratio : s * s * one.ratio
    );
    const area = placed.room ? images.reduce((total, one) => total + one, 0) : 0;
    const height = Math.max(room.height, block.y + block.height);
    const layout = {
        arrangement,
        shape: placed.shape,
        block,
        figures: boxes,
        text: placed.text,
        height
    };
    return { layout, area };
}

/**
 * The layout of a slide's figures and text in its room, or null for a slide with no figure. Every
 * figure's ratio is a number above zero; a figure whose image has not loaded is left out by the
 * caller until it has.
 */
export function layOut(ask: LayoutAsk): Layout | null {
    const { room, figures, text } = ask;
    const between = ask.between ?? 0;
    if (figures.length === 0) return null;
    if (figures.length === 1) return layoutOf(figures, 'one', room, text, between).layout;
    const side = layoutOf(figures, 'side', room, text, between);
    const stacked = layoutOf(figures, 'stacked', room, text, between);
    return stacked.area > side.area ? stacked.layout : side.layout;
}
