// Layer 3, shell. What the activity rail is made of and how it is grouped: a configured group, a
// docs bookmark and the state that opens one, and the two folds that put the registrations under
// their groups and turn them into key order. Apart from the component so the grouping can be read
// without a rendering.

import type { Registration } from '$lib/views/registry';
import type { RailOrder } from './keys';

/** One configured rail group. View registrations name its stable id and their own order. */
export type NavGroup = { id: string; label: string; glyph?: string; chord?: string };

/**
 * One entry of the rail's Docs section, as `bookmarks` in the config: a local file under one of
 * the roots of sources.yml, which the `document` view opens as a tab of its own.
 */
export type Bookmark = { label: string; root: string; path: string };

/**
 * What openView is handed for a bookmark. The `id` is what makes two bookmarks two tabs: a state
 * carrying one names which instance is wanted, so a second click on the same bookmark activates
 * the tab it already has and a click on the other one opens a second tab beside it.
 */
export function documentState(mark: Bookmark): {
    id: string;
    root: string;
    path: string;
    label: string;
} {
    return {
        id: `${mark.root}/${mark.path}`,
        root: mark.root,
        path: mark.path,
        label: mark.label
    };
}

/** The rail as it is drawn: a group's registrations, or the ungrouped ones under no heading. */
export type Section = {
    label: string | null;
    items: Registration[];
    glyph?: string;
    chord?: string;
};

/**
 * How many views a group may hold and still be drawn as a heading over one button per view. A
 * larger group is drawn as one button with a list beside it. The ungrouped trailing section has
 * no heading to name such a button and stays as buttons however many it holds.
 */
export const GROUP_MAX = 4;

/**
 * The registrations under their configured groups, sorted by their own order and then id. A
 * group with no matching registration is not drawn; registrations with no configured group
 * trail without a heading.
 */
export function arrange(registrations: Registration[], groups: NavGroup[]): Section[] {
    const sections: Section[] = [];
    const ranked = (items: Registration[]): Registration[] =>
        [...items].sort(
            (left, right) => left.order - right.order || left.id.localeCompare(right.id)
        );
    const configured = new Set(groups.map((group) => group.id));
    for (const group of groups) {
        const items = ranked(registrations.filter((view) => view.group === group.id));
        if (items.length === 0) continue;
        const section: Section = { label: group.label, items };
        if (group.glyph !== undefined) section.glyph = group.glyph;
        if (group.chord !== undefined) section.chord = group.chord;
        sections.push(section);
    }
    const rest = ranked(registrations.filter((view) => !configured.has(view.group)));
    if (rest.length > 0) sections.push({ label: null, items: rest });
    return sections;
}

/**
 * The rail's directly drawn views in their numbered order, every view in display order, and the
 * lists a one-letter chord counts into. `directChord` is the letter the directly drawn views are
 * reached under; a group that names the same letter takes it, since a group's own configuration is
 * the more specific one.
 */
export function railOrder(
    registrations: Registration[],
    groups: NavGroup[],
    directChord?: string
): RailOrder {
    const sections = arrange(registrations, groups);
    const direct = sections
        .filter((section) => section.label === null || section.items.length <= GROUP_MAX)
        .flatMap((section) => section.items.map((view) => view.id));
    const all = sections.flatMap((section) => section.items.map((view) => view.id));
    const chords: Record<string, string[]> = {};
    if (directChord !== undefined && direct.length > 0) chords[directChord] = direct;
    for (const section of sections) {
        if (section.items.length <= GROUP_MAX || section.chord === undefined) continue;
        chords[section.chord] = section.items.map((view) => view.id);
    }
    return { direct, all, chords };
}
