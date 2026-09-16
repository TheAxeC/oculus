// Layer 3, shell. What the activity rail is made of and how it is grouped: a configured group, a
// docs bookmark and a configured hub document with the state that opens each, and the two folds that
// put the registrations and the documents under their groups and turn them into key order. Apart
// from the component so the grouping can be read without a rendering.

import type { Registration } from '$lib/views/registry';
import type { RailOrder } from './keys';

/** One configured rail group. View registrations name its stable id and their own order. */
export type NavGroup = { id: string; label: string; glyph?: string; chord?: string };

/**
 * One entry of the rail's Docs section: a local file under one of the roots of sources.yml, either
 * from `bookmarks` in the config or from the reader's own file.
 *
 * `view` is which view opens it. A page is a document of its own so that its stylesheets and
 * relative assets resolve, and anything else is the file view; which is which is a question about a
 * file name, which the state layer answers, so the page decides it and the rail is told. A bookmark
 * that does not say is a document, which is what every configured one is.
 */
export type Bookmark = {
    label: string;
    root: string;
    path: string;
    view?: 'document' | 'file';
};

/**
 * What openView is handed for a bookmark. It is state/instance.ts's, since the file browser opens a
 * bookmark as well and the same document opened from the two places is one tab; the rail re-exports
 * it under the name its own readers know it by.
 */
export { documentState } from '$lib/state/layout';

/**
 * One entry of the `docs:` list of config/layout.yml: a Markdown document of the hub, drawn inside
 * the group it names and opened by the `doc` view over api/docs.
 */
export type DocEntry = { label: string; path: string; group: string };

/**
 * What openView is handed for a document. The `id` is the path, so a second click on one document
 * activates the tab it already has and another document opens a tab of its own beside it.
 */
export function docState(entry: DocEntry): { id: string; path: string; label: string } {
    return { id: entry.path, path: entry.path, label: entry.label };
}

/** What a document is identified by inside a group's list or a chord, told from a view's id. */
export const DOC_PICK = 'doc:';

/** One document's entry in a group's list or a chord: the prefix and its path. */
export function docPick(entry: DocEntry): string {
    return `${DOC_PICK}${entry.path}`;
}

/**
 * The rail as it is drawn: a group's registrations and its documents, or the ungrouped ones under no
 * heading. The documents follow the views, since a group is its views first.
 */
export type Section = {
    label: string | null;
    items: Registration[];
    docs: DocEntry[];
    glyph?: string;
    chord?: string;
};

/** How many entries a group draws: its views and the documents after them. */
export function sectionSize(section: Section): number {
    return section.items.length + section.docs.length;
}

/**
 * Whether a group is drawn as one button with a list beside it rather than as a heading over one
 * button per entry. The ungrouped trailing section has no heading to name such a button and stays as
 * buttons however many it holds.
 */
export function isFlyout(section: Section): boolean {
    return section.label !== null && sectionSize(section) > GROUP_MAX;
}

/**
 * How many entries a group may hold and still be drawn as a heading over one button per entry. Its
 * views and its documents both count. A larger group is drawn as one button with a list beside it,
 * which is reached by the letter the group configures and by no other, so a group that crosses this
 * needs a `chord:`. The ungrouped trailing section has no heading to name such a button and stays as
 * buttons however many it holds.
 */
export const GROUP_MAX = 4;

/**
 * The registrations and the configured documents under their groups, the registrations sorted by
 * their own order and then id and the documents in the order the config lists them. A group with
 * neither is not drawn; registrations and documents with no configured group trail without a
 * heading.
 */
export function arrange(
    registrations: Registration[],
    groups: NavGroup[],
    docs: DocEntry[] = []
): Section[] {
    const sections: Section[] = [];
    const ranked = (items: Registration[]): Registration[] =>
        [...items].sort(
            (left, right) => left.order - right.order || left.id.localeCompare(right.id)
        );
    const configured = new Set(groups.map((group) => group.id));
    for (const group of groups) {
        const items = ranked(registrations.filter((view) => view.group === group.id));
        const inside = docs.filter((entry) => entry.group === group.id);
        if (items.length === 0 && inside.length === 0) continue;
        const section: Section = { label: group.label, items, docs: inside };
        if (group.glyph !== undefined) section.glyph = group.glyph;
        if (group.chord !== undefined) section.chord = group.chord;
        sections.push(section);
    }
    const rest = ranked(registrations.filter((view) => !configured.has(view.group)));
    const loose = docs.filter((entry) => !configured.has(entry.group));
    if (rest.length > 0 || loose.length > 0) {
        sections.push({ label: null, items: rest, docs: loose });
    }
    return sections;
}

/**
 * The rail's directly drawn views in their numbered order, and the lists a one-letter chord counts
 * into. `directChord` is the letter the directly drawn views are reached under; a group that names
 * the same letter takes it, since a group's own configuration is the more specific one. A group's
 * documents follow its views in its chord, as `docPick` entries, so the digit after a group's last
 * view opens its first document; the directly drawn groups' documents follow the direct views the
 * same way. `direct` holds views alone.
 */
export function railOrder(
    registrations: Registration[],
    groups: NavGroup[],
    directChord?: string,
    docs: DocEntry[] = []
): RailOrder {
    const sections = arrange(registrations, groups, docs);
    const direct = sections
        .filter((section) => !isFlyout(section))
        .flatMap((section) => section.items.map((view) => view.id));
    const chords: Record<string, string[]> = {};
    if (directChord !== undefined && direct.length > 0) {
        const documents = sections
            .filter((section) => !isFlyout(section))
            .flatMap((section) => section.docs.map(docPick));
        chords[directChord] = [...direct, ...documents];
    }
    for (const section of sections) {
        if (!isFlyout(section) || section.chord === undefined) continue;
        chords[section.chord] = [
            ...section.items.map((view) => view.id),
            ...section.docs.map(docPick)
        ];
    }
    return { direct, chords };
}
