// Layer 3, shell. What the activity rail is made of apart from its markup: the fades of its
// scrolled list, where an arrow key takes its stop, the one badge a page button draws (the sum of
// the parts its page's views give it, with their hover words and the most urgent of their tones),
// a page button's right-click menu, and the `rail:` list a drag or a Hide on a page button writes.
// Apart from the components so each can be read without a rendering.

import { nextStop } from '$lib/ui/tree/roving';
import type { MenuItem } from '$lib/ui/menu/menu-items';
import type { RailEntry } from '$lib/state/workbench/navigation/rail';
import type { Registration, RegistrationBadge } from '$lib/state/workbench/navigation/registry';
import { t } from '$lib/state/shared/words/text';

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
export const RAIL_RESET = 'reset';
export const RAIL_SETTINGS = 'settings';

/**
 * A page button's right-click menu: Hide, then Reset to its arrangement while a saved page is tied
 * to the button (a button never pressed has no page to reset, since its page is made from the
 * arrangement on the first press), then Settings.
 */
export function railMenu(made: boolean): MenuItem[] {
    return [
        { id: RAIL_HIDE, label: t('ui.rail_hide') },
        ...(made ? [{ id: RAIL_RESET, label: t('ui.rail_reset') }] : []),
        { id: RAIL_SETTINGS, label: t('ui.rail_settings') }
    ];
}

/**
 * One view of a rail page as its button reads it: its name as drawn, the part it gives the rail
 * (null for a view that gives none) and the badge its tab draws.
 */
export type RailView = {
    label: string;
    part: ReturnType<NonNullable<Registration['countPart']>> | null;
    badge: Pick<RegistrationBadge, 'text' | 'glyph' | 'tone' | 'title'>;
};

/** The badge a page button draws: its words, the glyph of a mark, its tone and its hover words. */
export type RailBadge = { text: string; glyph: string; tone?: string; title: string };

/**
 * The tones that say a count means "act", most urgent first (the comment of `counts` in
 * config/defaults/layout.yml); any other tone ranks after them.
 */
const URGENT_TONES: readonly string[] = ['red', 'amber', 'green'];

/** The most urgent of the tones by URGENT_TONES, else the first of them; none for no tone. */
function urgentTone(tones: readonly (string | undefined)[]): string | undefined {
    const toned = tones.filter((tone): tone is string => tone !== undefined && tone !== '');
    return URGENT_TONES.find((tone) => toned.includes(tone)) ?? toned.at(0);
}

/**
 * The one badge a page button draws, from the views of its page in the order of its tabs, or of
 * its arrangement before the page is made, each view once: the sum of the parts the views give the
 * rail, its hover words each part above zero as the view's name and its count, and the most urgent
 * tone among those parts. A sum of 0 draws no number; then the first view whose badge is a mark and
 * no count gives its mark, with its own hover words and tone. None for a page with neither. The
 * tabs keep their own counts, and a view that gives the rail no part adds nothing to the sum.
 */
export function railBadge(views: readonly RailView[]): RailBadge | null {
    const counted = views.flatMap((view) =>
        view.part !== null && view.part.count > 0 ? [{ label: view.label, part: view.part }] : []
    );
    const sum = counted.reduce((total, one) => total + one.part.count, 0);
    if (sum > 0) {
        const tone = urgentTone(counted.map((one) => one.part.tone));
        return {
            text: String(sum),
            glyph: '',
            ...(tone === undefined ? {} : { tone }),
            title: counted
                .map((one) => t('views.badge_title', one.label, one.part.count))
                .join(t('ui.page_badge_separator'))
        };
    }
    const mark = views.find((view) => view.badge.text === '' && view.badge.glyph !== '')?.badge;
    if (mark === undefined) return null;
    return {
        text: '',
        glyph: mark.glyph,
        ...(mark.tone === undefined ? {} : { tone: mark.tone }),
        title: mark.title
    };
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
