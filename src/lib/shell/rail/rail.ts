// Layer 3, shell. What the activity rail is made of apart from its markup: a bookmark with the
// state that opens it and the Bookmarks menu's choices, the fades of its scrolled list, where an
// arrow key takes its stop, the one badge a page button draws, and the `rail:` list a drag or a
// Hide on a page button writes. Apart from the components so each can be read without a rendering.

import { nextStop } from '$lib/ui/tree/roving';
import type { MenuItem } from '$lib/ui/menu/menu-items';
import type { RailEntry } from '$lib/state/workbench/navigation/rail';
import { t } from '$lib/state/words/text';

/**
 * One choice of the rail's Bookmarks menu: a file under one of the roots of sources.yml, from the
 * reader's own bookmarks file, which the Files view edits.
 *
 * `view` is which view opens it. A page is a document of its own so that its stylesheets and
 * relative assets resolve, and anything else is the file view; which is which is a question about a
 * file name, which the state layer answers, so the page decides it and the rail is told.
 */
export type Bookmark = {
    label: string;
    root: string;
    path: string;
    view: 'document' | 'file';
};

/** The prefix of a bookmark's choice in the Bookmarks menu, before its place in the file. */
const MARK = 'mark:';

/**
 * The Bookmarks menu's choices: one per bookmark in the order the file holds them, by its label,
 * with the file it names as the hover words so two bookmarks under one label are told apart. With
 * no bookmark, one choice that says so and opens nothing.
 */
export function bookmarkChoices(saved: readonly Bookmark[]): MenuItem[] {
    if (saved.length === 0) {
        return [{ id: 'none', label: t('ui.bookmarks_none'), title: t('ui.bookmarks_none_tip') }];
    }
    return saved.map((mark, at) => ({
        id: `${MARK}${at}`,
        label: mark.label,
        title: `${mark.root}/${mark.path}`
    }));
}

/** The bookmark a choice of the Bookmarks menu names, or null for the choice that says none. */
export function bookmarkPicked(saved: readonly Bookmark[], id: string): Bookmark | null {
    if (!id.startsWith(MARK)) return null;
    return saved.at(Number(id.slice(MARK.length))) ?? null;
}

/**
 * What openView is handed for a bookmark. It is state/client/instance.ts's, since the file browser
 * opens a bookmark as well and the same document opened from the two places is one tab; the rail
 * re-exports it under the name its own readers know it by.
 */
export { documentState } from '$lib/state/workbench/layout';

/**
 * Which edges of the rail's list have more entries past them, each drawn as a fade at that edge.
 */
export type ListFade = { above: boolean; below: boolean };

/**
 * How far past an edge the list must reach before that edge fades. A browser reports a fractional
 * scroll position at a zoom or a text scale, so a list resting at its end may be a pixel short of
 * it.
 */
const FADE_SLACK = 1;

/**
 * The fades a scrolled list draws, from the three numbers its element reports: whether anything is
 * above what is shown and whether anything is below it. A list that fits draws neither, and a list
 * at either end draws no fade at that end.
 */
export function listFade(scrollTop: number, scrollHeight: number, clientHeight: number): ListFade {
    return {
        above: scrollTop > FADE_SLACK,
        below: scrollTop + clientHeight < scrollHeight - FADE_SLACK
    };
}

/**
 * Where an arrow key takes the rail's stop, given the ring of controls in drawn order: up and down
 * move along the ring and wrap at either end, Home and End go to the first and last control. Null
 * is a key the rail does not answer, the left and right arrows among them.
 */
export function railStop(key: string, current: string, ring: readonly string[]): string | null {
    const next = nextStop(key, ring.indexOf(current), ring.length, 'column');
    return next === null ? null : ring[next];
}

/** The choices of a page button's right-click menu, drawn by RailPages and answered by the rail. */
export const RAIL_HIDE = 'hide';
export const RAIL_SETTINGS = 'settings';

/**
 * The one badge a page button draws: the first of its page's badges, which are in the order of the
 * page's tabs, or of its arrangement before the page is made. The page's other counts stay on
 * their tabs. None for a page whose views count nothing.
 */
export function firstBadge<Badge>(badges: readonly Badge[]): Badge | null {
    return badges.at(0) ?? null;
}

/**
 * Where a page button dragged along the rail would land: the place among the drawn buttons, from 0
 * before the first to the count after the last, for the pointer's height and each button's top and
 * height. A button is passed once the pointer is below its middle.
 */
export function railInsertAt(
    y: number,
    buttons: readonly { top: number; height: number }[]
): number {
    return buttons.filter((box) => y > box.top + box.height / 2).length;
}

/**
 * The `rail:` list with the entry of one page moved to stand before the entry of another, or at
 * the end when `before` is null. Every other entry keeps its place, the ones the rule refuses and
 * the rail therefore does not draw among them, so a move writes only the move. A page the list does
 * not hold, or a move onto its own place, answers the list unchanged.
 */
export function railMoved(
    rail: readonly RailEntry[],
    page: string,
    before: string | null
): RailEntry[] {
    const from = rail.findIndex((entry) => entry.page === page);
    if (from < 0 || before === page) return [...rail];
    const rest = rail.filter((_, at) => at !== from);
    const to = before === null ? rest.length : rest.findIndex((entry) => entry.page === before);
    if (to < 0) return [...rail];
    return [...rest.slice(0, to), rail[from], ...rest.slice(to)];
}

/** The `rail:` list without the entry of one page, which is what Hide on its button writes. */
export function railHidden(rail: readonly RailEntry[], page: string): RailEntry[] {
    const at = rail.findIndex((entry) => entry.page === page);
    return at < 0 ? [...rail] : rail.filter((_, index) => index !== at);
}
