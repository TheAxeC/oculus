// Layer 3, primitive helper. How many of a toolbar's controls are drawn in its one line, and
// whether the overflow opener is drawn after them; and whether a press inside the popover of the
// clipped controls closes it. Pure functions of widths and of the pressed node, so the toolbar's
// arithmetic and its closing rule are tested without a layout.

/** The controls drawn in the line, and whether the opener for the rest is drawn after them. */
export type Fit = { shown: number; opener: boolean };

/** A width as the arithmetic reads it: a finite non-negative number, and zero for anything else. */
function measure(width: number): number {
    return Number.isFinite(width) && width > 0 ? width : 0;
}

/**
 * The controls of `widths` in order while they fit in `room`. When all of them fit, all are shown
 * and no opener is drawn. When one is left over, the opener is drawn, and the controls shown are
 * the most that fit together with it, with `gap` between each control and before the opener.
 */
export function fit(widths: number[], room: number, opener: number, gap: number): Fit {
    const space = measure(room);
    const sizes = widths.map(measure);
    if (sizes.length === 0) return { shown: 0, opener: false };
    const all = sizes.reduce((sum, width) => sum + width, 0) + gap * (sizes.length - 1);
    if (all <= space) return { shown: sizes.length, opener: false };
    let used = measure(opener);
    let shown = 0;
    for (const width of sizes) {
        used += width + gap;
        if (used > space) break;
        shown += 1;
    }
    return { shown, opener: true };
}

/** What `closesPopover` asks of a node: the nearest ancestor-or-self matching a selector. */
export type Pressable = { closest(selector: string): Pressable | null };

/**
 * Whether a press on `target` closes the popover once the control has acted. A button or a link
 * closes it, except one that opens a menu (`aria-haspopup`, which bits-ui sets on a dropdown
 * trigger): the menu opens on the press, and closing the popover would unmount the menu with it.
 */
export function closesPopover(target: Pressable): boolean {
    const control = target.closest('button, a');
    return control !== null && control.closest('[aria-haspopup]') === null;
}

/**
 * Whether a press on `target` picks an item of a menu, which is how a menu opened from the popover
 * ends its control's action: the popover then closes as it does after any other control.
 */
export function picksMenuItem(target: Pressable): boolean {
    return (
        target.closest('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]') !==
        null
    );
}
