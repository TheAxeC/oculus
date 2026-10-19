// Layer 2, client state. The view catalogue: every listed registration and every configured hub
// document under the heading of the group it belongs to, which is the rail page it sits on (headed
// by the page's rail button), the Help page's included, or the float of `nav_groups`, and the key
// order the chords count into. A document of
// oculus's own folder that a rail page's arrangement shows is listed in that page's group too.
// The Views view on the System page draws the sections and the shell's keyboard counts
// the chords over the same sections, so a key and the entry it opens are read from one fold.
//
// The readers of the three `layout.yml` keys the fold is built from are here too, since the page
// hands the shell what they read and the Views view reads them for itself.
//
// The paths of a document of oculus's own folder are here as well, since the doc view, the prose
// links and the tab rules all read them: the state of an engine document tab (`engineDocState`),
// whether the engine read serves a path (`engineServes`, never through a dot folder or
// `node_modules`), and a path moved between the engine folder's space and the hub's at the
// folder's place in the hub (`engineRelative`, `engineHubPath`).

import { z } from 'zod';
import { registrationGlyph, type Registration } from './registry.ts';
import { chordShape } from '../../../data/helpers/keys/oculus/rail-letters.ts';
import { arrangementKeys, glyphNames, readRail } from '../../../data/sources/config/rail.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { hasHiddenSegment, joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { optionalTextShape, readAs, rowsShape } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';

/** One configured group. View registrations name its stable id and their own order. */
export type NavGroup = { id: string; label: string; glyph?: string; chord?: string };

/**
 * One entry of the `docs:` list of config/layout.yml: a Markdown document of the hub, listed inside
 * the group it names and opened by the `doc` view over api/docs. An entry with `engine` is a
 * document of oculus's own folder that a rail page's arrangement shows as a tab, listed in that
 * page's group (arrangement.ts `arrangedDocs`), its path relative to the engine folder.
 */
export type DocEntry = { label: string; path: string; group: string; engine?: true };

/**
 * What openView is handed for a document. The `id` is the path, so a second press on one document
 * activates the tab it already has and another document opens a tab of its own beside it; for an
 * entry with `engine`, it is the engine document tab's state (`engineDocState`).
 */
export function docState(entry: DocEntry): {
    id: string;
    path: string;
    label: string;
    engine?: true;
} {
    if (entry.engine === true) return { ...engineDocState(entry.path), label: entry.label };
    return { id: entry.path, path: entry.path, label: entry.label };
}

/** What the id of a tab over a document of oculus's own folder starts with, then its path. */
const ENGINE_ID = 'engine:';

/**
 * What openView is handed for a document of oculus's own folder, which the page reads wherever that
 * folder sits and which no `docs:` entry lists; a rail page's arrangement that shows one has it
 * listed in the page's group (`DocEntry.engine`). The `path` is relative to the engine folder, and
 * the `id` is that path under a prefix a hub path never carries, so one document is one tab
 * whether the Help page, a link or an arrangement opened it. A tab with no label is named by its
 * path's last name.
 */
export function engineDocState(
    path: string,
    label = ''
): { id: string; path: string; engine: true; label?: string } {
    const state = { id: `${ENGINE_ID}${path}`, path, engine: true as const };
    return label === '' ? state : { ...state, label };
}

/**
 * What openView is handed for a document row whose document some page or float already shows: the
 * state of that tab, which is the one over the entry's hub path or, for a path inside oculus's own
 * folder at `engineAt`, the engine document tab. Null when no tab (`holds` says which ids are held)
 * shows it.
 */
export function heldDocState(
    entry: DocEntry,
    engineAt: string,
    holds: (id: string) => boolean
): ReturnType<typeof docState> | ReturnType<typeof engineDocState> | null {
    const own = docState(entry);
    if (holds(own.id)) return own;
    if (entry.engine === true) return null;
    const inside = engineRelative(entry.path, engineAt);
    if (inside === null) return null;
    const engine = engineDocState(inside, entry.label);
    return holds(engine.id) ? engine : null;
}

/**
 * Whether the engine read serves a path relative to the engine folder: not one that runs through a
 * dot folder or `node_modules`, which stays a document of the hub where the folder lies in it.
 */
export function engineServes(path: string): boolean {
    return !hasHiddenSegment(path);
}

/**
 * A hub path as the path relative to the engine folder, for a document of oculus's own that the
 * folder holds at `engineAt` in the hub; null for a path outside it, the folder itself, a hub
 * whose engine folder lies elsewhere (the empty `engineAt`) and a path the engine read never
 * serves.
 */
export function engineRelative(hubPath: string, engineAt: string): string | null {
    if (engineAt === '') return null;
    const inner = pathUnder(engineAt, hubPath);
    return inner === null || inner === '' || !engineServes(inner) ? null : inner;
}

/** The hub path of a file of the engine folder, or the empty string where the hub lacks it. */
export function engineHubPath(path: string, engineAt: string): string {
    return engineAt === '' ? '' : joinPath(engineAt, path);
}

/**
 * Which entry of the `docs:` list a document tab shows: the one at the path it holds, or, when
 * that path has left the list, the one entry carrying its label, which is what a moved file keeps.
 * `moved` says the tab's saved path is no longer the entry's, so the tab is to be restated. No
 * entry is found for a path the list does not hold and a label no entry or several entries carry.
 */
export function followDoc(
    docs: DocEntry[],
    path: string,
    label: string
): { entry: DocEntry | null; moved: boolean } {
    const listed = docs.find((one) => one.path === path);
    if (listed !== undefined) return { entry: listed, moved: false };
    const named = label === '' ? [] : docs.filter((one) => one.label === label);
    if (named.length !== 1) return { entry: null, moved: false };
    return { entry: named[0], moved: true };
}

/** What a document is identified by inside a chord's list, told from a view's id. */
export const DOC_PICK = 'doc:';

/**
 * One document's entry in a chord's list: the prefix and the id of the document's tab, which is
 * the path of a hub document and the engine id of a document of oculus's own folder.
 */
export function docPick(entry: DocEntry): string {
    return `${DOC_PICK}${docState(entry).id}`;
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

/**
 * Whether a group is reached by a chord of its own rather than under the direct chord: a group that
 * names a letter is, whatever its size, so no group grows its entries into the direct chord's
 * count. The ungrouped trailing section has no heading and no letter, so it never is.
 */
export function isChorded(section: Section): boolean {
    return section.label !== null && section.chord !== undefined;
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
 * into. `directChord` is the letter the groups that name none are reached under; a group that names
 * the same letter takes it, since a group's own configuration is the more specific one. A group's
 * documents follow its views in its chord, as `docPick` entries, so the digit after a group's last
 * view opens its first document; the unlettered groups' documents follow the direct views the same
 * way. `direct` holds views alone.
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

/** One group of `nav_groups`: a label, and a glyph and a chord when they are readable. */
const navGroupShape = z.object({
    label: z.string(),
    glyph: optionalTextShape,
    chord: chordShape.optional().catch(undefined)
});

/**
 * The view catalogue's groups of a merged config, in the order the Views view lists them: one per
 * rail page the rail rule keeps, in rail order, keyed by the page, headed by the button's label and
 * carrying the entry's `chord` and `group_glyph`, then each group of `nav_groups` of
 * config/layout.yml (the float), which is no rail page. Registrations name each group by id.
 */
export function readGroups(config: Record<string, unknown> | undefined): NavGroup[] {
    if (config === undefined) return [];
    const rail = readRail(config.rail, arrangementKeys(config.arrangements), glyphNames(config));
    const found: NavGroup[] = rail.entries.map((entry) => ({
        id: entry.page,
        label: entry.label,
        ...(entry.group_glyph === '' ? {} : { glyph: entry.group_glyph }),
        ...(entry.chord === '' ? {} : { chord: entry.chord })
    }));
    const raw = config.nav_groups;
    if (!isMap(raw)) return found;
    for (const [id, entry] of Object.entries(raw)) {
        const group = readAs(navGroupShape, entry);
        if (group === null || found.some((one) => one.id === id)) continue;
        const read: NavGroup = { id, label: group.label };
        if (group.glyph !== undefined) read.glyph = group.glyph;
        if (group.chord !== undefined) read.chord = group.chord;
        found.push(read);
    }
    return found;
}

/**
 * The `direct_chord` of config/layout.yml: the one letter a digit after it counts into the views
 * of the groups that name no chord and the views no group holds. Anything but a single lowercase
 * letter leaves the chord unset.
 */
export function readChord(raw: unknown): string | undefined {
    return readAs(chordShape, raw) ?? undefined;
}

/** One document of `docs`: a label, a path and a group, each a string that carries something. */
const docEntryShape = z.object({
    label: z.string().min(1),
    path: z.string().min(1),
    group: z.string().min(1)
}) satisfies z.ZodType<DocEntry>;

/** The `docs` list: the entries that are documents, and none when the value is not a list. */
const docsShape = rowsShape(docEntryShape);

/**
 * The `docs` list of config/layout.yml, in order: one Markdown document of the hub per entry,
 * listed in the group it names. An entry that is not three non-empty strings is dropped rather
 * than drawn half-formed; the server reports it as a finding.
 */
export function readDocs(raw: unknown): DocEntry[] {
    return readAs(docsShape, raw) ?? [];
}

/**
 * The fields of an arrangement's node that say which views it holds: `root` where the node is an
 * arrangement, `kind` and `view` where it is a pane, `children` where it is a split. A `view` that
 * is not a list is read as a list of that one value.
 */
const nodeHoldsShape = z.object({
    root: z.unknown().optional(),
    kind: z.unknown().optional(),
    view: z.union([
        z.array(z.unknown()),
        z
            .unknown()
            .optional()
            .transform((one) => [one])
    ]),
    children: z.array(z.unknown()).catch([])
});

/**
 * Whether an arrangement's tree holds the view anywhere: a pane naming it alone or among its tabs,
 * as a view id or as a tab's `view`, or a split with such a pane under it. The node is
 * `layout.yml`'s own shape, read as it came: an arrangement carries its tree under `root`.
 */
export function nodeHolds(node: unknown, view: string): boolean {
    const held = readAs(nodeHoldsShape, node);
    if (held === null) return false;
    if (held.root !== undefined) return nodeHolds(held.root, view);
    if (held.kind === 'pane') {
        return held.view.some((tab) => tab === view || (isMap(tab) && tab.view === view));
    }
    return held.children.some((child) => nodeHolds(child, view));
}

/**
 * Whether the catalogue sits on the System page: the page on screen is a rail page
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

/** The registrations the view catalogue lists: every one that does not say it is unlisted. */
export function listedViews(views: Registration[]): Registration[] {
    return views.filter((view) => view.listed !== false);
}
