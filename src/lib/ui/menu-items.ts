// Layer 3, primitive. The compact menu's contract and its placement arithmetic: what one choice
// holds, which list a choice with a list of its own puts in place of the menu's, and where the
// fixed-position list sits beside its button or containing rail. Apart from the component so the
// geometry and the level can be read without a viewport.

/** The rectangle fields used to place a compact menu beside its button or containing rail. */
export type MenuRect = { right: number; top: number; height: number; bottom: number };

/** How far the compact list stays from the viewport edge and from the containing rail. */
const EDGE = 8;
const GAP = 4;

/** The fixed-position style for a compact menu, anchored to the rail when one contains it. */
export function menuPlacement(
    button: MenuRect,
    rail: MenuRect | null,
    viewportHeight: number
): string {
    const anchor = rail ?? button;
    const left = `left: ${Math.round(anchor.right + GAP)}px;`;
    if (button.top + button.height / 2 < viewportHeight / 2) {
        const room = viewportHeight - button.top - EDGE;
        return `${left} top: ${Math.round(button.top)}px; max-height: ${Math.round(room)}px;`;
    }
    const room = button.bottom - EDGE;
    const bottom = viewportHeight - button.bottom;
    return `${left} bottom: ${Math.round(bottom)}px; max-height: ${Math.round(room)}px;`;
}

/**
 * One choice in the list. `active` marks the one in force, which the menu shows as checked, and
 * `glyph` is a name in `glyphs:` drawn before the words, for a list whose choices are things
 * that have an icon of their own (the views of a rail group).
 */
export type MenuItem = {
    id: string;
    label: string;
    /** The item's hover words, when they say more than its label. */
    title?: string;
    active?: boolean;
    glyph?: string;
    /** A hue name from state/tones.ts, drawn as a dot before the label. */
    tone?: string;
    /** Live text drawn at the end of the item; an empty string draws no badge. */
    badge?: string;
    /** A glyph name drawn in the badge before its text. */
    badgeGlyph?: string;
    /** A hue name from state/tones.ts; absent uses the accent pair. */
    badgeTone?: string;
    /** The badge's hover words. */
    badgeTitle?: string;
    /**
     * The choices this one stands for. Picking it shows them in place of the list it is in, after a
     * first choice that goes back, and picking one of them is what the caller is told of.
     */
    items?: MenuItem[];
};

/**
 * The list a menu shows while the choice `opened` has its own list open: that choice's items, or
 * null for the menu's own list. A choice that is no longer there, or that holds no list, leaves the
 * menu on its own list, so a caller whose items change under an open menu never strands it.
 */
export function menuLevel(items: readonly MenuItem[], opened: string | null): MenuItem[] | null {
    if (opened === null) return null;
    return items.find((item) => item.id === opened)?.items ?? null;
}
