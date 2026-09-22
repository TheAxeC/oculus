// The computed-style and box readings the browser specs share: a colour's alpha, in either of the
// two forms a browser returns it in, and where a strip of tabs rests after a scroll.

import type { Locator } from '@playwright/test';

/**
 * The alpha of a computed colour, in either the comma form or the slash form a browser may return.
 */
export function alphaOf(colour: string): number {
    const slash = /\/\s*([\d.]+)(%?)\s*\)/.exec(colour);
    if (slash !== null) {
        return slash[2] === '%' ? Number.parseFloat(slash[1]) / 100 : Number.parseFloat(slash[1]);
    }
    const comma = /rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/.exec(colour);
    return comma === null ? 1 : Number.parseFloat(comma[1]);
}

/**
 * Where a strip of tabs rests: its offset, whether its left edge is a tab's start (or the strip's
 * own start), whether it is scrolled to its end, and whether the shown tab is whole inside it. Each
 * edge is read with a pixel of slack, since a tab's box is fractional and the offset is not.
 */
export async function stripRest(
    list: Locator
): Promise<{ at: number; onStart: boolean; atEnd: boolean; activeWhole: boolean }> {
    return list.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const tabs = [...node.querySelectorAll<HTMLElement>(':scope > .tab')];
        const onStart =
            node.scrollLeft <= 1 ||
            tabs.some((tab) => Math.abs(tab.getBoundingClientRect().left - box.left) <= 1);
        const current = tabs.find((tab) => tab.classList.contains('current'));
        const rect = current?.getBoundingClientRect();
        const activeWhole =
            rect !== undefined && rect.left >= box.left - 1 && rect.right <= box.right + 1;
        const atEnd = node.scrollLeft >= node.scrollWidth - node.clientWidth - 1;
        return { at: node.scrollLeft, onStart, atEnd, activeWhole };
    });
}
