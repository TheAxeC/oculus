// Layer 2, client state. The pure half of the collection view: what a card draws for one entry and
// in what order, the values the status facet offers, and the filter. No rune and no store here, so
// every rule below is checked without a browser, exactly as state/boards/board/ is for the board.
//
// A collection is drawn from its own file's `schema:` rather than from anything this module knows:
// the order is the schema's order, a field the schema names and the entry lacks is skipped, and a
// field the entry carries that the schema does not name is drawn after them. What differs per field
// is how it is drawn, and that is decided by the field's name first and its type second, since the
// seven hub files agree on the names (`status`, `tags`, `meta`, `note`) and use only six types.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`.

import { z } from 'zod';
import { ADDRESSED, HOSTED, isHubPath } from '../../data/places/hub-address.ts';
import { isMap } from '../../data/helpers/guards.ts';
import { hubId, inHubOf, rootOf } from '../../data/helpers/hub-names.ts';
import {
    anyNumberShape,
    anyValueShape,
    fieldItemsShape,
    filledTextShape,
    itemsShape,
    keyedRowsShape,
    listOrOneShape,
    readAs,
    searchRevealShape
} from '../../data/shapes/shapes.ts';
import {
    FILTERED_TYPES,
    optionLabel,
    type Entry,
    type Project,
    type SchemaField,
    type Subtask
} from '../../data/model/index.ts';
import { fileBytesUrl } from '../sources/fs-transport.ts';
import { normalisePath } from '../sources/fs.ts';
import { dirOf } from '../sources/repositories/change-tree.ts';
import { entryPageState } from '../forms/page-entry.ts';
import { JOINT_WORK } from '../forms/referrers.ts';
import { TITLE_FIELD, identityField } from '../forms/record-fields.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the types the view
// names reach it from here, beside the functions that return them.
export type { Collection, Entry, Project, SchemaField, Subtask } from '../../data/model/index.ts';
export { optionKeys, optionLabel } from '../../data/model/index.ts';

// The address rule lives in the data layer, where the Audit reads it too; a view reaches it from
// here, since the boundary table keeps `views/` out of `data/`.
export { isHubPath };

/** The entry of a collection by its id; null when there is no collection or no such entry. */
export function entryById(
    collection: { entries: readonly Entry[] } | null | undefined,
    id: string
): Entry | null {
    return collection?.entries.find((entry) => entry.id === id) ?? null;
}

// The card's own heading and the field an entry is addressed by are the form's (state/forms), which
// reads the same schema; the card draws the heading and no drawn field repeats it.
export { TITLE_FIELD, identityField };

/** The field the status chip and the status facet read. */
export const STATUS_FIELD = 'status';

/** What a card does with one field. The view has one piece of markup per kind and no more. */
export type FieldKind =
    'sub' | 'status' | 'chips' | 'meta' | 'body' | 'link' | 'person' | 'pairs' | 'text';

/**
 * One field of one entry, ready to draw: the kind decides the markup, `values` carries the words. A
 * `text`, `sub`, `status`, `body`, `link` or `person` field has exactly one value; `chips` has one
 * per tag, `meta` one per label-value pair and `pairs` one per key of a map, each already joined,
 * since a Chip takes a label and nothing else.
 */
export type Drawn = {
    field: string;
    /** The file's own words for the field: its schema `label` when it has one, else its name. */
    label: string;
    kind: FieldKind;
    values: string[];
};

/**
 * What the view holds per instance: the search box, the status values in force, the statuses the
 * reader has switched off in the facet bar, and the schema filters' picks and ranges.
 *
 * The two status fields are not one field. `statuses` is a selection: empty means every status, and
 * a value in it means that value alone. `hidden` is the facet bar of the acceptance list, where
 * every toggle is on until it is clicked and a click hides that status's cards. A card is drawn
 * when the selection admits it and the facet bar has not hidden it.
 */
export type CollectionState = {
    search: string;
    statuses: string[];
    hidden: string[];
    /** The ids of the entries whose long text is drawn whole rather than cut to its clamp. */
    more: string[];
    /**
     * The values picked in each chip filter of the bar, by field (fieldFilters): an entry is drawn
     * when it holds one of them. A field with none picked lets every entry through.
     */
    picked: Record<string, string[]>;
    /** The bounds typed in each range filter of the bar, by field, either one empty for none. */
    range: Record<string, Bounds>;
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};

/** The two bounds of a range filter as typed. */
export type Bounds = { from: string; to: string };

/** The state of an instance nobody has typed in yet. */
export function emptyCollectionState(): CollectionState {
    return { search: '', statuses: [], hidden: [], more: [], picked: {}, range: {} };
}

/** The two bounds of a range, each the empty text unless it is text. */
const boundsShape = z.object({ from: z.string().catch(''), to: z.string().catch('') });

/** The fields of a saved instance, each read apart so a wrong one costs that field alone. */
const collectionStateShape = searchRevealShape.extend({
    statuses: fieldItemsShape,
    hidden: fieldItemsShape,
    more: fieldItemsShape,
    picked: z.record(z.string(), fieldItemsShape).catch({}),
    range: z.record(z.string(), boundsShape).catch({})
});

/** The saved state of one instance, with anything that is not the shape above replaced by it. */
export function parseCollectionState(raw: unknown): CollectionState {
    const held = readAs(collectionStateShape, raw);
    if (held === null) return emptyCollectionState();
    const state: CollectionState = {
        search: held.search,
        statuses: held.statuses,
        hidden: held.hidden,
        more: held.more,
        picked: held.picked,
        range: held.range
    };
    if (held.reveal !== undefined) state.reveal = held.reveal;
    return state;
}

/** A string and nothing else, for a value the data layer types as unknown. */
const stringShape = z.string();

/** The `from:` source of a schema field whose value is a key of the people registry. */
export const PEOPLE_OPTIONS = 'people';

const CHIP_FIELDS = ['tags', 'related'];
const BODY_FIELDS = ['note', 'statement'];
const LINK_FIELDS = ['link', 'url'];

/** What a label-value pair of a `metalist` reads as on one chip. */
const PAIR = ': ';

/** How a list of words reads on one line, where the field is drawn as text rather than as chips. */
const JOIN = ' | ';

/**
 * How one field is drawn. The name decides it where the seven files agree on a name, the registry a
 * choice is drawn from decides it where the schema names one, and the type decides it otherwise; a
 * type none of them uses falls through to text, which is the widest of the kinds and loses nothing
 * but the shape.
 *
 * A field whose choices come from the people registry holds a person's key, so the card draws it as
 * the control that opens that person rather than as the key itself. The rule is the schema's own
 * `from:` and not the field's name, so a second field of people follows it with no change.
 */
export function kindOf(field: string, type: string, from?: SchemaField['from']): FieldKind {
    if (field === 'sub') return 'sub';
    if (field === STATUS_FIELD) return 'status';
    if (Array.isArray(from) && from.length === 1 && from[0] === PEOPLE_OPTIONS) return 'person';
    if (CHIP_FIELDS.includes(field) || type === 'tags') return 'chips';
    if (field === 'meta' || type === 'metalist') return 'meta';
    if (BODY_FIELDS.includes(field) || type === 'textarea') return 'body';
    if (LINK_FIELDS.includes(field)) return 'link';
    return 'text';
}

/**
 * A value as one line of words, or undefined when it is a map and has no line to give. Not
 * data/helpers/guards' `text`: a number, a boolean and a list all have a line here, and only a map
 * has none.
 */
function textOf(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        const words = value.map(textOf).filter((word): word is string => word !== undefined);
        return words.length === 0 ? undefined : words.join(JOIN);
    }
    return undefined;
}

/** One chip per key of a map, the key and its line joined; a key with no line is no chip. */
function mapPairs(value: unknown): string[] {
    if (!isMap(value)) return [];
    const chips: string[] = [];
    for (const [key, held] of Object.entries(value)) {
        const words = textOf(held);
        if (words !== undefined && words !== '') chips.push(`${key}${PAIR}${words}`);
    }
    return chips;
}

/** The words of a list value; a lone string is one word and a map is none. */
function wordsOf(value: unknown): string[] {
    const items = readAs(listOrOneShape, value) ?? [];
    return items.map(textOf).filter((word): word is string => word !== undefined);
}

/** A `{ label, value }` pair of a metalist, over any two values. */
const pairShape = z.object({ label: anyValueShape, value: anyValueShape });

/**
 * One chip per `{ label, value }` pair of a metalist, the two joined; a pair with neither is none.
 */
function pairsOf(value: unknown): string[] {
    const list = readAs(itemsShape, value);
    if (list === null) return wordsOf(value);
    const chips: string[] = [];
    for (const item of list) {
        const pair = readAs(pairShape, item);
        if (pair === null) {
            const word = textOf(item);
            if (word !== undefined) chips.push(word);
            continue;
        }
        const label = textOf(pair.label);
        const words = textOf(pair.value);
        if (label !== undefined && words !== undefined) chips.push(`${label}${PAIR}${words}`);
        else if (words !== undefined) chips.push(words);
        else if (label !== undefined) chips.push(label);
    }
    return chips;
}

/** The values one field draws as, by its kind. A field with none is not drawn at all. */
function valuesOf(kind: FieldKind, value: unknown): string[] {
    if (kind === 'chips') return wordsOf(value);
    if (kind === 'meta') return pairsOf(value);
    const word = textOf(value);
    return word === undefined || word === '' ? [] : [word];
}

/**
 * The fields of one entry in the order a card draws them: the schema's own order first, with a
 * field the entry does not carry left out, and then every field the entry carries that the schema
 * does not name, in the entry's own order, as text. The title is neither, since the card's heading
 * is what draws it. A collection whose file has no schema draws every field of the entry as text,
 * which is what the last half does on its own.
 */
export function drawnFields(entry: Entry, schema: SchemaField[] | undefined): Drawn[] {
    const drawn: Drawn[] = [];
    const named = new Set<string>([TITLE_FIELD]);
    for (const field of schema ?? []) {
        named.add(field.field);
        if (field.field === TITLE_FIELD) continue;
        const held = entry.fields[field.field];
        const kind = kindOf(field.field, field.type, field.from);
        const values = valuesOf(kind, held);
        if (values.length > 0) {
            drawn.push({ field: field.field, label: field.label ?? field.field, kind, values });
            continue;
        }
        // A map has no line of its own, so it draws its keys and their values rather than nothing.
        const pairs = mapPairs(held);
        if (pairs.length === 0) continue;
        drawn.push({
            field: field.field,
            label: field.label ?? field.field,
            kind: 'pairs',
            values: pairs
        });
    }
    for (const [field, value] of Object.entries(entry.fields)) {
        if (named.has(field)) continue;
        const values = valuesOf('text', value);
        if (values.length > 0) {
            drawn.push({ field, label: field, kind: 'text', values });
            continue;
        }
        const pairs = mapPairs(value);
        if (pairs.length === 0) continue;
        drawn.push({ field, label: field, kind: 'pairs', values: pairs });
    }
    return drawn;
}

/** The scheme put in front of a web address written without one. */
const HOSTED_SCHEME = 'https://';

/**
 * Where a `link` or `url` field goes. A value with a scheme (`https:`, `mailto:`) or a leading
 * slash is an address and is kept; one whose first segment is a host is the same address written
 * without its scheme and gets one; anything else is a path inside the hub, which the seven files
 * write as `network/<event>/deck.html` and the like, and is served through api/file under the
 * folder `root` names (the folder of the hub the record is of), so a click opens the file rather
 * than a 404 under the page's own address.
 */
export function hrefOf(value: string, root: string): string {
    if (ADDRESSED.test(value)) return value;
    if (HOSTED.test(value)) return `${HOSTED_SCHEME}${value}`;
    return fileBytesUrl(root, value);
}

/** The fields of an entry that hold a path of the hub when their value is not an address. */
const PATH_FIELDS = ['link', 'url', 'folder'];

/**
 * The fields whose value is a path of the hub whatever its first segment looks like. A `folder`
 * names a folder and never a web address, and this hub has a folder whose name is host-shaped
 * (`theaxec.github.io`), which the address rule would otherwise read as a site.
 */
const HUB_ONLY_FIELDS = ['folder'];

/**
 * The hub paths an entry's fields name, each once, in field order, which is what a card offers to
 * show in the Files view. A `link` or a `url` counts when isHubPath says it is not an address; a
 * `folder` counts unless it carries a scheme or a leading slash, since it names a folder either
 * way. Then, by its segments, it must name something under the hub: not the hub itself and nothing
 * above it. Whether anything is there is decided when the file browser opens it.
 */
export function hubPathsOf(fields: Record<string, unknown>): string[] {
    const found: string[] = [];
    for (const field of PATH_FIELDS) {
        const value = readAs(stringShape, fields[field]);
        if (value === null) continue;
        const held = value.trim();
        const path = HUB_ONLY_FIELDS.includes(field)
            ? held !== '' && !ADDRESSED.test(held)
                ? normalisePath(held)
                : ''
            : isHubPath(held)
              ? normalisePath(held)
              : '';
        if (path === '' || path === '..' || path.startsWith('../')) continue;
        if (!found.includes(path)) found.push(path);
    }
    return found;
}

/** The entries of one folder of the hub, as the file store lists it: a name and what it is. */
type FolderListing = (folder: string) => readonly { name: string; kind: string }[];

/**
 * Whether a hub path names a folder, by the listing of the folder that holds it. The listing is
 * the file store's own, held and listed again when something in the folder changes, so a folder
 * made or removed after the caller drew gives or takes the answer with no reload. A path whose
 * parent has not been listed yet, or is not there, names no folder.
 */
export function listsAsFolder(path: string, listed: FolderListing): boolean {
    if (path === '') return false;
    const name = path.slice(path.lastIndexOf('/') + 1);
    return listed(dirOf(path)).some((one) => one.name === name && one.kind === 'dir');
}

/**
 * The hub folder an entry's `link` names, which is the folder its page is about, or undefined when
 * the link is no path of the hub or names a file, an address, a folder that is not there or one
 * the listing leaves out.
 */
export function pageFolder(
    fields: Record<string, unknown>,
    listed: FolderListing
): string | undefined {
    const path = hubPathsOf({ link: fields.link }).at(0);
    return path !== undefined && listsAsFolder(path, listed) ? path : undefined;
}

/** The state an entry's page is opened with (state/forms/page-entry.ts). */
export function pageState(
    collection: string,
    entry: Entry
): { id: string; collection: string; key: string; label: string } {
    return entryPageState(collection, entry.id, entry.title === '' ? entry.id : entry.title);
}

/** The entry's status, when it has one as a word. */
export function entryStatus(entry: Entry): string | undefined {
    return readAs(filledTextShape, entry.fields[STATUS_FIELD]) ?? undefined;
}

/** Whether the file's schema names a status field, which is what decides the facet is offered. */
export function hasStatusField(schema: SchemaField[] | undefined): boolean {
    return (schema ?? []).some((field) => field.field === STATUS_FIELD);
}

/**
 * Every status the entries carry, in the order they first occur, with a count each. Fewer than two
 * is none: one value splits nothing, which is the rule state/boards/board/ facets by.
 */
export function statusValues(entries: Entry[]): { value: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const entry of entries) {
        const status = entryStatus(entry);
        if (status === undefined) continue;
        counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    if (counts.size < 2) return [];
    return [...counts].map(([value, count]) => ({ value, count }));
}

/** Every word an entry holds, so the search box reaches a value wherever in the record it sits. */
function haystack(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(haystack).join(' ');
    if (isMap(value)) return Object.values(value).map(haystack).join(' ');
    return '';
}

/**
 * The entries a card list shows: every selected status is an alternative, and the search is a
 * substring of every word the entry holds, case insensitive. An empty search matches everything and
 * so does an empty status selection, which is what an instance nobody has touched shows.
 */
export function applyCollectionFilters(
    entries: Entry[],
    state: Pick<CollectionState, 'search' | 'statuses' | 'hidden'> &
        Partial<Pick<CollectionState, 'picked' | 'range'>>
): Entry[] {
    const needle = state.search.trim().toLowerCase();
    return entries.filter((entry) => {
        const status = entryStatus(entry);
        if (state.statuses.length > 0) {
            if (status === undefined || !state.statuses.includes(status)) return false;
        }
        if (status !== undefined && state.hidden.includes(status)) return false;
        if (!passesFields(entry, state.picked ?? {}, state.range ?? {})) return false;
        if (needle === '') return true;
        return haystack(entry.fields).toLowerCase().includes(needle);
    });
}

/** The words one field of an entry holds: each item of a list, or its one value, as text. */
function fieldWords(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value];
    return items
        .flatMap((one) =>
            typeof one === 'string' || typeof one === 'number' ? [String(one).trim()] : []
        )
        .filter((one) => one !== '');
}

/** A whole number written in digits, or null for any other text. */
function wholeOf(text: string): number | null {
    return /^\d{1,9}$/.test(text.trim()) ? Number(text.trim()) : null;
}

/** Whether an entry holds one picked value of every chip filter and lies in every range. */
function passesFields(
    entry: Entry,
    picked: Record<string, string[]>,
    range: Record<string, Bounds>
): boolean {
    for (const [field, values] of Object.entries(picked)) {
        if (values.length === 0) continue;
        if (!fieldWords(entry.fields[field]).some((one) => values.includes(one))) return false;
    }
    for (const [field, bounds] of Object.entries(range)) {
        const from = wholeOf(bounds.from);
        const to = wholeOf(bounds.to);
        if (from === null && to === null) continue;
        const held = wholeOf(fieldWords(entry.fields[field]).at(0) ?? '');
        if (held === null) return false;
        if ((from !== null && held < from) || (to !== null && held > to)) return false;
    }
    return true;
}

/** One chip of a chip filter: its value, the words it is drawn with, how many entries hold it. */
type FilterChip = { value: string; label: string; count: number };

/**
 * One filter of the bar, for a schema field marked `filter: true`: the chips of the values the
 * entries hold, or, for a text field whose values are all whole numbers, a range from the least to
 * the greatest of them.
 */
export type FieldFilter =
    | { field: string; label: string; kind: 'chips'; chips: FilterChip[] }
    | { field: string; label: string; kind: 'range'; least: number; most: number };

/** The most values a chip filter draws as chips; one with more draws as a list to search. */
export const FILTER_CHIPS_MOST = 12;

/**
 * The picks of a chip filter after its list control answered `next`: each value whose press
 * changed, which the view presses or releases one at a time.
 */
export function changedPicks(held: readonly string[], next: readonly string[]): string[] {
    return [
        ...held.filter((value) => !next.includes(value)),
        ...next.filter((value) => !held.includes(value))
    ];
}

/**
 * The filters of a collection view, one per field marked `filter: true` in the schema of any of its
 * files, in the order the files name them, over every entry the view holds. A select or tags field
 * is drawn as chips labelled by its options; a text field as a range when every value it holds is a
 * whole number, else as chips. A field no entry holds a value of draws nothing.
 */
export function fieldFilters(
    schemas: (SchemaField[] | undefined)[],
    entries: Entry[]
): FieldFilter[] {
    const fields = new Map<string, SchemaField>();
    for (const one of schemas.flatMap((schema) => schema ?? [])) {
        if (one.filter === true && FILTERED_TYPES.includes(one.type) && !fields.has(one.field)) {
            fields.set(one.field, one);
        }
    }
    const filters: FieldFilter[] = [];
    for (const field of fields.values()) {
        const held = entries.flatMap((entry) => fieldWords(entry.fields[field.field]));
        if (held.length === 0) continue;
        const label = field.label ?? field.field;
        const numbers = held.map(wholeOf);
        if (field.type === 'text' && numbers.every((one) => one !== null)) {
            filters.push({
                field: field.field,
                label,
                kind: 'range',
                least: Math.min(...numbers),
                most: Math.max(...numbers)
            });
            continue;
        }
        const counts = new Map<string, number>();
        for (const value of held) counts.set(value, (counts.get(value) ?? 0) + 1);
        const chips = [...counts].map(([value, count]) => ({
            value,
            label: optionLabel(field, value),
            count
        }));
        filters.push({ field: field.field, label, kind: 'chips', chips });
    }
    return filters;
}

/** The facet value of the synthetic card the Funding view draws for the projects with no scheme. */
export const NO_FUNDING = 'no-funding';

/** The collection key whose entries the manifests' `funding:` tags name. */
export const FUNDING = 'funding';

export { JOINT_WORK };

/** An identity a file writes as a string or a number, answered as text. */
const identityShape = z.union([z.string(), anyNumberShape.transform(String)]);

/**
 * The value a write addresses one entry by. It is not always the id: a file whose schema opens with
 * one field while its entries carry another of `id`, `key` and `title` has the other as its id, so
 * a write names the identity field's own value and the server finds the entry by it.
 */
export function identityValue(entry: Entry, schema: SchemaField[] | undefined): string {
    const held = readAs(identityShape, entry.fields[identityField(schema)]);
    if (held !== null) return held === '' ? '' : hubId(rootOf(entry, null), held, null);
    return entry.title === '' ? entry.id : hubId(rootOf(entry, null), entry.title, null);
}

/**
 * Why the controls that write an entry are disabled: the entry's identity field is empty, or two
 * entries hold one value of it, which the server refuses every write over. `own` is whether the
 * entry is itself one of those; `value` is the shared value, and '' for an empty one.
 */
export type IdentityFault = {
    kind: 'empty' | 'shared';
    field: string;
    value: string;
    own: boolean;
};

/**
 * The faults of one file's entries, by `entry.index`. An entry with an empty identity has its own
 * fault, and so has an entry that holds a value another entry holds, with that value. Every other
 * entry of a file that holds a shared value has the file's fault, the first shared value, which is
 * not its own. An entry the faults do not touch is not in the map.
 */
export function identityFaults(
    entries: Entry[],
    schema: SchemaField[] | undefined
): Map<number, IdentityFault> {
    const field = identityField(schema);
    const values = entries.map((entry) => {
        const own = readAs(identityShape, entry.fields[field]);
        return own === null || own === '' ? '' : hubId(rootOf(entry, null), own, null);
    });
    const held = (value: string): boolean =>
        value !== '' && values.indexOf(value) !== values.lastIndexOf(value);
    const shared = values.find(held);
    const faults = new Map<number, IdentityFault>();
    entries.forEach((entry, at) => {
        const value = values[at];
        if (value === '') {
            faults.set(entry.index, { kind: 'empty', field, value: '', own: true });
        } else if (held(value)) {
            faults.set(entry.index, { kind: 'shared', field, value, own: true });
        } else if (shared !== undefined) {
            faults.set(entry.index, { kind: 'shared', field, value: shared, own: false });
        }
    });
    return faults;
}

/** The identity of every entry the file holds, in the order the file holds them. */
export function fileOrder(entries: Entry[], schema: SchemaField[] | undefined): string[] {
    return entries.map((entry) => identityValue(entry, schema));
}

/** Whether the file floats this entry to the top of its list: `pin: true` and nothing else. */
export function isPinned(entry: Entry): boolean {
    return entry.fields.pin === true;
}

/** The entries a card list draws: the pinned ones first, everything in file order inside that. */
export function pinnedFirst(entries: Entry[]): Entry[] {
    return [...entries.filter(isPinned), ...entries.filter((entry) => !isPinned(entry))];
}

/**
 * One identity taken out of an order and put back at another place, or null when either place is
 * not in it. The order handed in is the file's own, never the pinned-first one the cards are drawn
 * in, so a move made while an entry is pinned writes the file's order with one entry moved and
 * leaves the pinned entry where the file has it.
 */
export function movedOrder(order: readonly string[], at: number, to: number): string[] | null {
    if (at < 0 || to < 0 || at >= order.length || to >= order.length || at === to) return null;
    const moved = [...order];
    const [held] = moved.splice(at, 1);
    moved.splice(to, 0, held);
    return moved;
}

/** One toggle of the facet bar: the status, how many entries carry it. */
export type StatusFacet = { value: string; count: number };

/**
 * Every status the entries carry, in the order they first occur, with a count each. Unlike
 * statusValues, which offers a menu and so needs two values to be worth offering, one value is a
 * facet bar of one toggle and is drawn: it is the file saying what its one lifecycle value is.
 */
export function statusFacets(entries: Entry[]): StatusFacet[] {
    const counts = new Map<string, number>();
    for (const entry of entries) {
        const status = entryStatus(entry);
        if (status === undefined) continue;
        counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return [...counts].map(([value, count]) => ({ value, count }));
}

/**
 * The statuses a file with no schema offers as buttons: the ones its own entries use. A file with a
 * schema offers its schema's, so it gets none from here.
 */
export function offeredStatuses(
    schema: SchemaField[] | undefined,
    facets: StatusFacet[]
): string[] {
    return schema === undefined ? facets.map((facet) => facet.value) : [];
}

/** The fields of a subtask written as a map: `done` is true only when it is the boolean true. */
const subtaskFieldsShape = z.object({
    do: anyValueShape,
    done: z.boolean().catch(false),
    deadline: anyValueShape,
    snooze: anyValueShape
});

/**
 * The `subtasks:` of one entry as the block draws them. A list is keyed by position and a map by
 * its own keys, which is what the write path addresses a line by; a line with no `do` is no line.
 */
export function entrySubtasks(entry: Entry): Subtask[] {
    const lines: Subtask[] = [];
    for (const [key, item] of readAs(keyedRowsShape, entry.fields.subtasks) ?? []) {
        const record = readAs(subtaskFieldsShape, item);
        const text = readAs(stringShape, item) ?? textOf(record?.do);
        if (text === undefined || text.trim() === '') continue;
        const line: Subtask = { key, do: text, done: record?.done ?? false };
        const deadline = textOf(record?.deadline);
        const snooze = textOf(record?.snooze);
        if (deadline !== undefined) line.deadline = deadline;
        if (snooze !== undefined) line.snooze = snooze;
        lines.push(line);
    }
    return lines;
}

/** One member of a cross-link group. Its project type remains visible inside the broader group. */
export type CrossMember = { id: string; label: string; type: string };

/** One of the three cross-link groups the portfolio uses everywhere. */
export type CrossGroup = {
    type: 'work' | 'published' | 'ideas';
    count: number;
    members: CrossMember[];
    warn: boolean;
};

/**
 * The type a cross-link group is keyed by: the project's own `type:`, its tier without one, and an
 * empty word for a project that names neither, which is left out of every group.
 */
function typeOf(project: Project): string {
    return project.type ?? project.tier ?? '';
}

/**
 * The projects that name one entry, grouped by type with a count each.
 *
 * Which projects those are is the collection's own question and has three answers: funding is the
 * manifests' `funding:` tags, a joint work is the `collaborators:` tags naming its person, and
 * every other collection has no project-side inverse, so it is the entry's own `related:` list of
 * ids. A related id no project of the snapshot holds is left out rather than drawn as a dead link.
 */
export function crossLinks(
    entry: Entry,
    collectionKey: string,
    projects: Project[],
    archiveDead: string[]
): CrossGroup[] {
    let named: Project[];
    if (collectionKey === FUNDING) {
        named = projects.filter((project) => project.fundingIds.includes(entry.id));
    } else if (collectionKey === JOINT_WORK) {
        const own = readAs(stringShape, entry.fields.person);
        const person = own === null ? entry.id : inHubOf(entry, own, null);
        named = projects.filter((project) => project.collaborators.includes(person));
    } else {
        named = wordsOf(entry.fields.related)
            .map((id) => projects.find((project) => project.id === inHubOf(entry, id, null)))
            .filter((project): project is Project => project !== undefined);
    }
    return groupProjects(named, archiveDead);
}

/** Projects in work, published and ideas groups, in that order and by project id within each. */
export function groupProjects(projects: Project[], archiveDead: string[]): CrossGroup[] {
    const grouped: Record<CrossGroup['type'], CrossMember[]> = {
        work: [],
        published: [],
        ideas: []
    };
    for (const project of [...projects].sort((a, b) => a.id.localeCompare(b.id))) {
        const type = typeOf(project);
        if (
            (project.tier === 'archive' || project.tier === 'coauthor') &&
            archiveDead.includes(type)
        ) {
            continue;
        }
        const group =
            project.tier === 'archive' || project.tier === 'coauthor'
                ? 'published'
                : type === 'idea'
                  ? 'ideas'
                  : type === ''
                    ? null
                    : 'work';
        if (group === null) continue;
        const short = project.short?.trim() ?? '';
        grouped[group].push({
            id: project.id,
            label: short === '' ? project.title : short,
            type
        });
    }
    return (['work', 'published', 'ideas'] as const)
        .filter((type) => grouped[type].length > 0)
        .map((type) => ({
            type,
            count: grouped[type].length,
            members: grouped[type],
            warn:
                type === 'work' &&
                projects.some(
                    (project) =>
                        grouped.work.some((member) => member.id === project.id) &&
                        project.chips.includes('blocked')
                )
        }));
}

/** The project types the Funding view's synthetic card counts: the work that is still running. */
const LIVE_TYPES = ['active'];

/**
 * The active projects no funding scheme of the file covers, which is the Funding
 * tab's one synthetic card. A project naming a scheme the file does not hold is not covered by it,
 * so the schemes are the file's own keys rather than whatever a manifest happens to name.
 */
export function noFunding(projects: Project[], schemes: string[]): Project[] {
    return projects.filter(
        (project) =>
            LIVE_TYPES.includes(project.type ?? '') &&
            !project.fundingIds.some((id) => schemes.includes(id))
    );
}

/** The live projects no entry of the funding file covers, the file's entries handed in whole. */
export function unfundedBy(projects: Project[], entries: readonly Entry[]): Project[] {
    return noFunding(
        projects,
        entries.map((entry) => entry.id)
    );
}

/** How many of the subtasks are not done yet. */
export function openSubtaskCount(subtasks: readonly { done: boolean }[]): number {
    return subtasks.filter((one) => !one.done).length;
}

/** One cross-link group's members by their own project type, in the order the members are in. */
export function membersByType(
    group: CrossGroup
): { type: string; members: CrossGroup['members'] }[] {
    const held = new Map<string, CrossGroup['members']>();
    for (const member of group.members) {
        const found = held.get(member.type);
        if (found === undefined) held.set(member.type, [member]);
        else found.push(member);
    }
    return [...held].map(([type, members]) => ({ type, members }));
}
