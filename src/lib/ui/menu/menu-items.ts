// Layer 3, primitive. The menu's contract: what one choice holds, and which list a choice with a
// list of its own puts in place of the menu's. Apart from the component so the level can be read
// without a viewport.

/**
 * One choice in the list. `active` marks the one in force, which the menu shows as checked, and
 * `glyph` is a name in `glyphs:` drawn before the words, for a list whose choices are things
 * that have an icon of their own.
 */
export type MenuItem = {
    id: string;
    label: string;
    /** The item's hover words, when they say more than its label. */
    title?: string;
    active?: boolean;
    glyph?: string;
    /** A hue name from state/shared/words/tones.ts, drawn as a dot before the label. */
    tone?: string;
    /** Live text drawn at the end of the item; an empty string draws no badge. */
    badge?: string;
    /** A glyph name drawn in the badge before its text. */
    badgeGlyph?: string;
    /** A hue name from state/shared/words/tones.ts; absent uses the accent pair. */
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
 * One headed run of choices, for a list whose choices fall under several headings (the board's one
 * filter control, a heading per facet). Two groups may hold choices of the same id, so a pick names
 * the group it came from.
 */
export type MenuGroup = { id: string; heading: string; items: MenuItem[] };

/**
 * The list a menu shows while the choice `opened` has its own list open: that choice's items, or
 * null for the menu's own list. A choice that is no longer there, or that holds no list, leaves the
 * menu on its own list, so a caller whose items change under an open menu never strands it.
 */
export function menuLevel(items: readonly MenuItem[], opened: string | null): MenuItem[] | null {
    if (opened === null) return null;
    return items.find((item) => item.id === opened)?.items ?? null;
}
