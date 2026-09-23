// Layer 2, client state. The view catalogue: every listed registration and every configured hub
// document under the `nav_groups` heading it belongs to, and the key order the chords count into.
// The Views view on the Views and Settings page draws the sections and the shell's keyboard counts
// the chords over the same sections, so a key and the entry it opens are read from one fold.
//
// The readers of the three `layout.yml` keys the fold is built from are here too, since the page
// hands the shell what they read and the Views view reads them for itself.

import { registrationGlyph, type Registration } from '../../../views/registry.ts';
import { t } from '../../words/text.ts';

/** One configured group. View registrations name its stable id and their own order. */
export type NavGroup = { id: string; label: string; glyph?: string; chord?: string };

/**
 * One entry of the `docs:` list of config/layout.yml: a Markdown document of the hub, listed inside
 * the group it names and opened by the `doc` view over api/docs.
 */
export type DocEntry = { label: string; path: string; group: string };

/**
 * What openView is handed for a document. The `id` is the path, so a second press on one document
 * activates the tab it already has and another document opens a tab of its own beside it.
 */
export function docState(entry: DocEntry): { id: string; path: string; label: string } {
    return { id: entry.path, path: entry.path, label: entry.label };
}

/** What a document is identified by inside a chord's list, told from a view's id. */
export const DOC_PICK = 'doc:';

/** One document's entry in a chord's list: the prefix and its path. */
export function docPick(entry: DocEntry): string {
    return `${DOC_PICK}${entry.path}`;
}

/**
 * The catalogue as it is drawn: a group's registrations and its documents, or the ungrouped ones
 * under no heading. The documents follow the views, since a group is its views first.
 */
export type Section = {
    label: string | null;
    items: Registration[];
    docs: DocEntry[];
    glyph?: string;
    chord?: string;
};

/**
 * The directly reached views in their numbered order, and the lists a one-letter chord counts
 * into. The keyboard reads it, so it is typed here beside the fold that builds it.
 */
export type RailOrder = {
    direct: string[];
    chords: Record<string, string[] | undefined>;
};

/** How many entries a group holds: its views and the documents after them. */
export function sectionSize(section: Section): number {
    return section.items.length + section.docs.length;
}

/**
 * How many entries a group may hold and still be counted under the direct chord. A larger group is
 * reached by the letter it configures and by no other, so a group that crosses this needs a
 * `chord:`. The ungrouped trailing section is always counted under the direct chord.
 */
export const GROUP_MAX = 4;

/**
 * Whether a group is reached by a chord of its own rather than under the direct chord. The
 * ungrouped trailing section has no heading and no letter, so it never is.
 */
export function isChorded(section: Section): boolean {
    return section.label !== null && sectionSize(section) > GROUP_MAX;
}

/**
 * The registrations and the configured documents under their groups, the registrations sorted by
 * their own order and then id and the documents in the order the config lists them. A group with
 * neither is left out; registrations and documents with no configured group trail without a
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
 * The directly reached views in their numbered order, and the lists a one-letter chord counts
 * into. `directChord` is the letter the small groups are reached under; a group that names the same
 * letter takes it, since a group's own configuration is the more specific one. A group's documents
 * follow its views in its chord, as `docPick` entries, so the digit after a group's last view opens
 * its first document; the small groups' documents follow the direct views the same way. `direct`
 * holds views alone.
 */
export function railOrder(
    registrations: Registration[],
    groups: NavGroup[],
    directChord?: string,
    docs: DocEntry[] = []
): RailOrder {
    const sections = arrange(registrations, groups, docs);
    const direct = sections
        .filter((section) => !isChorded(section))
        .flatMap((section) => section.items.map((view) => view.id));
    const chords: Record<string, string[]> = {};
    if (directChord !== undefined && direct.length > 0) {
        const documents = sections
            .filter((section) => !isChorded(section))
            .flatMap((section) => section.docs.map(docPick));
        chords[directChord] = [...direct, ...documents];
    }
    for (const section of sections) {
        if (!isChorded(section) || section.chord === undefined) continue;
        chords[section.chord] = [
            ...section.items.map((view) => view.id),
            ...section.docs.map(docPick)
        ];
    }
    return { direct, chords };
}

/**
 * The key that opens one catalogue entry, a letter and a digit, or the empty string for an entry no
 * chord reaches: one past the ninth of its list, or one whose group names no letter. `pick` is a
 * view's id or a document's `docPick`.
 */
export function keyOf(order: RailOrder, pick: string): string {
    for (const [letter, list] of Object.entries(order.chords)) {
        const at = list?.indexOf(pick) ?? -1;
        if (at >= 0 && at < 9) return `${letter}${at + 1}`;
    }
    return '';
}

/**
 * The glyph a group's heading carries: the group's own, or its first view's when it has none. A
 * group holding documents alone carries the document glyph.
 */
export function groupGlyph(section: Section): string {
    if (section.glyph !== undefined) return section.glyph;
    if (section.items.length === 0) return t('views.doc_glyph');
    return registrationGlyph(section.items[0]);
}

/** A map of a parsed value, or null for anything that is not one. */
function mapOf(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

/** The `nav_groups` map of config/layout.yml in order. Registrations name each group by id. */
export function readGroups(raw: unknown): NavGroup[] {
    const held = mapOf(raw);
    if (held === null) return [];
    const found: NavGroup[] = [];
    for (const [id, entry] of Object.entries(held)) {
        const group = mapOf(entry);
        if (group === null || typeof group.label !== 'string') continue;
        const read: NavGroup = { id, label: group.label };
        if (typeof group.glyph === 'string') read.glyph = group.glyph;
        if (typeof group.chord === 'string' && /^[a-z]$/.test(group.chord)) {
            read.chord = group.chord;
        }
        found.push(read);
    }
    return found;
}

/**
 * The `direct_chord` of config/layout.yml: the one letter a digit after it counts into the small
 * groups' views. Anything but a single lowercase letter leaves the chord unset.
 */
export function readChord(raw: unknown): string | undefined {
    return typeof raw === 'string' && /^[a-z]$/.test(raw) ? raw : undefined;
}

/**
 * The `docs` list of config/layout.yml, in order: one Markdown document of the hub per entry,
 * listed in the group it names. An entry that is not three non-empty strings is dropped rather
 * than drawn half-formed; the server reports it as a finding.
 */
export function readDocs(raw: unknown): DocEntry[] {
    if (!Array.isArray(raw)) return [];
    const found: DocEntry[] = [];
    for (const entry of raw) {
        const doc = mapOf(entry);
        if (doc === null) continue;
        if (typeof doc.label !== 'string' || doc.label === '') continue;
        if (typeof doc.path !== 'string' || doc.path === '') continue;
        if (typeof doc.group !== 'string' || doc.group === '') continue;
        found.push({ label: doc.label, path: doc.path, group: doc.group });
    }
    return found;
}

/**
 * Whether an arrangement's tree holds the view anywhere: a pane naming it alone or among its tabs,
 * or a split with such a pane under it. The node is `layout.yml`'s own shape, read as it came: an
 * arrangement carries its tree under `root`.
 */
export function nodeHolds(node: unknown, view: string): boolean {
    const held = mapOf(node);
    if (held === null) return false;
    if (held.root !== undefined) return nodeHolds(held.root, view);
    if (held.kind === 'pane') {
        return Array.isArray(held.view) ? held.view.includes(view) : held.view === view;
    }
    return Array.isArray(held.children) && held.children.some((child) => nodeHolds(child, view));
}

/**
 * Whether the catalogue sits on the Views and Settings page: the page on screen is a rail page
 * whose arrangement holds the catalogue. A press there opens on the page the reader came from; a
 * press from a catalogue the reader moved onto a page of their own opens on that page.
 */
export function onCataloguePage(
    rail: string | undefined,
    pages: readonly { page: string; node: unknown }[],
    catalogue: string
): boolean {
    const entry = pages.find((one) => one.page === rail);
    return entry !== undefined && nodeHolds(entry.node, catalogue);
}
