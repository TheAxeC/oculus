// Layer 2, client state. The pure half of the collection view: what a card draws for one entry and
// in what order, the values the status facet offers, the view's saved state, the columns of its
// list, and the words a field's value reads as (`fieldWords`), which the bar and the list both
// read. Its bar, the groups, the slices and what they keep, is bar.ts beside it. No rune and no
// store here, so every rule below is checked without a browser, exactly as state/boards/board/ is
// for the board.
//
// A collection is drawn from its own file's `schema:` rather than from anything this module knows:
// the order is the schema's order, a field the schema names and the entry lacks is skipped, and a
// field the entry carries that the schema does not name is drawn after them. What differs per field
// is how it is drawn, and that is decided by the field's name first and its type second, since the
// seven hub files agree on the names (`status`, `tags`, `meta`, `note`) and use only six types. A
// `records` field whose rows name a person is decided by its schema: it draws the people.
//
// The rows of the Website section feed the website, so a card leaves them out and the entry's page
// draws them as one group after its fields (`websiteGroup`). Search, the list's columns and the
// bar's filters read the entry itself, and this rule does not narrow them.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`.

import { z } from 'zod';
import { ADDRESSED, HOSTED, isHubPath } from '../../../data/places/hub-address.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { bareId, rootOf } from '../../../data/helpers/hub-names.ts';
import {
    anyValueShape,
    fieldItemsShape,
    filledTextShape,
    followups,
    itemsShape,
    listOrOneShape,
    readAs,
    recordItemsShape,
    searchRevealShape,
    subtasks
} from '../../../data/shapes/shapes.ts';
import {
    displayFields,
    primaryKeyOf,
    type Entry,
    type Followup,
    type KeyFault,
    type SchemaField,
    type Subtask
} from '../../../data/model/index.ts';
import { fileBytesUrl } from '../../sources/fs-transport.ts';
import { normalisePath } from '../../sources/fs.ts';
import { dirOf } from '../../sources/repositories/change-tree.ts';
import { entryPageState } from '../../forms/page-entry.ts';
import { t } from '../../shared/words/text.ts';
import type { ListedColumn } from '../../../data/shapes/boards/columns.ts';
import { freshPicks } from '../board/state.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the types the view
// names reach it from here, beside the functions that return them.
export type {
    Collection,
    Entry,
    Followup,
    ListedCollection,
    Project,
    SchemaField,
    Subtask
} from '../../../data/model/index.ts';
export { optionKeys, optionLabel, primaryKeyOf } from '../../../data/model/index.ts';
export { joinedRegistries } from './joined.ts';

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

/** The field the status chip and the status facet read. */
export const STATUS_FIELD = 'status';

/**
 * What a card does with one field. The view has one piece of markup per kind and no more, and for
 * `people` a second one on the entry's page.
 */
export type FieldKind =
    'sub' | 'status' | 'chips' | 'meta' | 'body' | 'link' | 'person' | 'people' | 'pairs' | 'text';

/**
 * One field of one entry, ready to draw: the kind decides the markup, `values` carries the words. A
 * `sub`, `status`, `body`, `link` or `person` field has exactly one value, and so has a `text`
 * field but for a list of records in a page's group, which has one per item; `chips` has one per
 * tag, `meta` one per label-value pair and `pairs` one per key of a map, each already joined, since
 * a Chip takes a label and nothing else, and `people` has one person's key per row.
 */
export type Drawn = {
    field: string;
    /** The file's own words for the field: its schema `label` when it has one, else its name. */
    label: string;
    kind: FieldKind;
    values: string[];
    /** On a `people` field, in step with `values`: the words of each row, which a page draws. */
    details?: string[];
};

/** The fields a page draws under one heading after the entry's own. */
type DrawnGroup = {
    /** The rows' own `section` word. */
    heading: string;
    fields: Drawn[];
};

/** How the view draws its entries: as cards, or as one table. */
export type CollectionMode = 'cards' | 'list';

/**
 * What the view holds per instance: the search box, the picks of its bar's groups and slices, Mine
 * only, how it draws its entries and the list's columns. A picked value keeps the entries that hold
 * it and none picked keeps every entry, as on a project board (state/boards/collection/bar.ts).
 */
export type CollectionState = {
    search: string;
    /**
     * The picked values by group id: `role`, `hub`, `field:<field>`, and the status slices under
     * `status` (`NO_FUNDING` among them for the No funding card).
     */
    filters: Record<string, string[]>;
    /** Mine only, on by default; read only where the collection declares a field of a role. */
    mine: boolean;
    mode: CollectionMode;
    /** The list's columns drawn, by field, nothing while they are the default (`entryColumns`). */
    columns?: string[];
    /** The ids of the entries whose long text is drawn whole rather than cut to its clamp. */
    more: string[];
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};

/** The fields of a saved instance, each read apart so a wrong one costs that field alone. */
const collectionStateShape = searchRevealShape.extend({
    filters: z.record(z.string(), fieldItemsShape).catch({}),
    mine: z.boolean().catch(true),
    mode: z.enum(['cards', 'list']).catch('cards'),
    columns: fieldItemsShape.optional(),
    more: recordItemsShape
});

/**
 * The saved state of one instance, with anything that is not the shape above replaced by it, its
 * records and lists built for this call (`freshPicks`).
 */
export function parseCollectionState(raw: unknown): CollectionState {
    const held = readAs(collectionStateShape, raw) ?? collectionStateShape.parse({});
    const { reveal, columns, filters, more, ...state } = held;
    return {
        ...state,
        filters: freshPicks(filters),
        more: [...more],
        ...(columns === undefined ? {} : { columns: [...columns] }),
        ...(reveal === undefined ? {} : { reveal })
    };
}

/**
 * The key of the list's title column. A schema field named `:title` gets no column of its own
 * (`entryColumns`), so the key is the title's alone.
 */
export const TITLE_COLUMN = ':title';

/** The types of field the list draws a column of. */
const COLUMN_TYPES = ['select', 'text', 'tags', 'chips', 'date'];

/** The people fields the list draws by default, by their literal names as the Add asks them. */
const PEOPLE_COLUMNS = ['lead', 'supervisors', 'collaborators'];

/**
 * Every column a collection's list can draw, in the order its Columns menu lists them: the title,
 * always drawn, then one per field of the schemas, each once in the order the files name them, of
 * the types `COLUMN_TYPES`, the primary key, the display field and a field named `TITLE_COLUMN`
 * left out. A column is drawn when the saved choice (`saved`) names it or, with none, when it is
 * the status field, a people field (`lead`, `supervisors`, `collaborators`) or a field marked
 * `filter: true`.
 */
export function entryColumns(
    schemas: readonly (SchemaField[] | undefined)[],
    saved: string[] | undefined
): ListedColumn[] {
    const fields = new Map<string, SchemaField>();
    for (const schema of schemas) {
        const own = schema ?? [];
        const key = primaryKeyOf(own);
        const shown = displayFields(own);
        for (const one of own) {
            const skip =
                one.field === key ||
                one.field === TITLE_COLUMN ||
                shown.includes(one.field) ||
                fields.has(one.field);
            if (!skip && COLUMN_TYPES.includes(one.type)) fields.set(one.field, one);
        }
    }
    const byDefault = (one: SchemaField): boolean =>
        one.field === STATUS_FIELD || PEOPLE_COLUMNS.includes(one.field) || one.filter === true;
    const drawn = saved === undefined ? null : new Set(saved);
    return [
        { key: TITLE_COLUMN, label: t('collection.title_column'), shown: true },
        ...[...fields.values()].map((one) => ({
            key: one.field,
            label: one.label ?? one.field,
            shown: drawn === null ? byDefault(one) : drawn.has(one.field)
        }))
    ];
}

/**
 * The saved choice of a collection's columns after one is shown or hidden: the columns drawn, in
 * the Columns menu's order, or nothing when they are the default, so a schema that changes later
 * draws its new default. The title stays drawn.
 */
export function pickColumn(
    schemas: readonly (SchemaField[] | undefined)[],
    saved: string[] | undefined,
    key: string
): string[] | undefined {
    const drawnKeys = (columns: ListedColumn[]): string[] =>
        columns.filter((one) => one.key !== TITLE_COLUMN && one.shown).map((one) => one.key);
    const next = entryColumns(schemas, saved).map((one) =>
        one.key === key && key !== TITLE_COLUMN ? { ...one, shown: !one.shown } : one
    );
    const own = drawnKeys(entryColumns(schemas, undefined));
    const picked = drawnKeys(next);
    return picked.join('\n') === own.join('\n') ? undefined : picked;
}

/** A string and nothing else, for a value the data layer types as unknown. */
const stringShape = z.string();

const CHIP_FIELDS = ['tags', 'related'];
const BODY_FIELDS = ['note', 'statement'];
const LINK_FIELDS = ['link', 'url'];

/** What a label-value pair of a `metalist` reads as on one chip. */
const PAIR = ': ';

/** How a list of words reads on one line, where the field is drawn as text rather than as chips. */
const JOIN = ' | ';

/**
 * How one field is drawn. The name decides it where the seven files agree on a name, the registry
 * of the collection the field's values name decides it where the schema names one, and the type
 * decides it otherwise; a type none of them uses falls through to text, which is the widest of the
 * kinds and loses nothing but the shape.
 *
 * A field whose `foreign_key:` is the one collection that carries the people registry (`person`)
 * holds a person's key, so the card draws it as the control that opens that person rather than as
 * the key itself. The rule is the schema's own `foreign_key:` and not the field's name, so a second
 * field of people follows it with no change, whatever the people's collection is keyed.
 */
export function kindOf(field: string, type: string, person = false): FieldKind {
    if (field === 'sub') return 'sub';
    if (field === STATUS_FIELD) return 'status';
    if (person) return 'person';
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
export function listWords(value: unknown): string[] {
    const items = readAs(listOrOneShape, value) ?? [];
    return items.map(textOf).filter((word): word is string => word !== undefined);
}

/**
 * The values one field of an entry holds, as the collection's bar counts them and its list draws
 * them: each item of a list, or its one value, a string or a number as text, trimmed, the empty
 * ones left out.
 */
export function fieldWords(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value];
    return items
        .flatMap((one) =>
            typeof one === 'string' || typeof one === 'number' ? [String(one).trim()] : []
        )
        .filter((one) => one !== '');
}

/** A `{ label, value }` pair of a metalist, over any two values. */
const pairShape = z.object({ label: anyValueShape, value: anyValueShape });

/**
 * One chip per `{ label, value }` pair of a metalist, the two joined; a pair with neither is none.
 */
function pairsOf(value: unknown): string[] {
    const list = readAs(itemsShape, value);
    if (list === null) return listWords(value);
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
    if (kind === 'chips') return listWords(value);
    if (kind === 'meta') return pairsOf(value);
    const word = textOf(value);
    return word === undefined || word === '' ? [] : [word];
}

/**
 * The field of a schema whose value a card's heading shows for the entry `fields`: the filled field
 * of the lowest `display:` rank, as data/model's entryTitleOf picks it, else the primary key the
 * schema flags, and none for a schema with neither.
 */
function headingField(
    fields: Record<string, unknown>,
    schema: SchemaField[] | undefined
): string | null {
    const filled = displayFields(schema).find((field) => (textOf(fields[field]) ?? '').trim());
    return filled ?? (schema === undefined ? null : primaryKeyOf(schema));
}

/** Whether a `foreign_key:` is one target and that target is the people registry's collection. */
function namesOnePerson(field: SchemaField, person: (target: string) => boolean): boolean {
    const keys = field.foreign_key;
    return Array.isArray(keys) && keys.length === 1 && person(keys[0]);
}

/**
 * The sub-field that names the person of each row of a list of records, the first in schema order,
 * and none for any other field.
 */
function personSubField(
    field: SchemaField,
    person: (target: string) => boolean
): SchemaField | undefined {
    if (field.type !== 'records' || field.map === true) return undefined;
    return field.fields?.find((one) => namesOnePerson(one, person));
}

/**
 * The rows a `records` field holds: the items of a list, one map as one row, and with `map:` each
 * value of the map. An item that is no map is left out, and every item of any other value.
 */
function recordRows(field: SchemaField, value: unknown): Record<string, unknown>[] {
    if (field.map === true && isMap(value)) return Object.values(value).filter(isMap);
    return (isMap(value) ? [value] : (readAs(itemsShape, value) ?? [])).filter(isMap);
}

/** The filled fields of a row, the given ones in the given order, as one line of words. */
function rowWords(row: Record<string, unknown>, fields: SchemaField[]): string {
    const words = fields.map((one) => textOf(row[one.field]) ?? '');
    return words.filter((word) => word !== '').join(JOIN);
}

/**
 * The people a list of records names, one key and one line of words per row: the row's other text
 * fields in schema order, joined. One map as the value is one row; a row with no person is left
 * out, and so is every row of a value that is neither a list nor a map.
 */
function peopleRows(
    value: unknown,
    who: SchemaField,
    field: SchemaField
): Pick<Drawn, 'values' | 'details'> {
    const others = (field.fields ?? []).filter((one) => one !== who && one.type === 'text');
    const values: string[] = [];
    const details: string[] = [];
    for (const row of recordRows(field, value)) {
        const key = valuesOf('person', row[who.field]).at(0);
        if (key === undefined) continue;
        values.push(key);
        details.push(rowWords(row, others));
    }
    return { values, details };
}

/**
 * One schema row of an entry as it draws, or null when it holds nothing to draw. A list of records
 * that names a person draws the people and nothing else, so a value that gives no person draws
 * nothing. `person` answers whether a `foreign_key:` target names the collection that carries the
 * people registry.
 */
function drawnRow(
    field: SchemaField,
    held: unknown,
    person: (target: string) => boolean
): Drawn | null {
    const label = field.label ?? field.field;
    const who = personSubField(field, person);
    if (who !== undefined) {
        const rows = peopleRows(held, who, field);
        if (rows.values.length === 0) return null;
        return { field: field.field, label, kind: 'people', ...rows };
    }
    const kind = kindOf(field.field, field.type, namesOnePerson(field, person));
    const values = valuesOf(kind, held);
    if (values.length > 0) return { field: field.field, label, kind, values };
    // A map has no line of its own, so it draws its keys and their values rather than nothing.
    const pairs = mapPairs(held);
    if (pairs.length === 0) return null;
    return { field: field.field, label, kind: 'pairs', values: pairs };
}

/**
 * The section whose rows feed the website. It selects the rows; the group a page draws them in is
 * headed by the rows' own word.
 */
const WEBSITE_SECTION = 'Website';

/**
 * The fields of one entry in the order a card draws them: the schema's own order first, with a
 * field the entry does not carry left out, and then every field the entry carries that the schema
 * does not name, in the entry's own order, as text. The field the card's heading shows is neither
 * (`headingField`), and neither is a row of the Website section (`websiteGroup`). A collection
 * whose file has no schema draws every field of the entry as text, which is what the last half does
 * on its own. `person` answers whether a `foreign_key:` target names the collection that carries
 * the people registry.
 */
export function drawnFields(
    entry: Entry,
    schema: SchemaField[] | undefined,
    person: (target: string) => boolean = () => false
): Drawn[] {
    const drawn: Drawn[] = [];
    const heading = headingField(entry.fields, schema);
    const named = new Set<string>(heading === null ? [] : [heading]);
    for (const field of schema ?? []) {
        named.add(field.field);
        if (field.field === heading || field.section === WEBSITE_SECTION) continue;
        const row = drawnRow(field, entry.fields[field.field], person);
        if (row !== null) drawn.push(row);
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

/** The kinds that keep their markup in a page's group, each with a place for the label. */
const LABELLED: readonly FieldKind[] = ['body', 'people', 'person', 'pairs', 'text'];

/**
 * One Website row of an entry as its page draws it: its label, then its value, so a kind whose
 * markup carries no label reads as one line of text. A checkbox the entry holds reads as its word
 * in both states. A list of records that gives no people reads as one line per item, its filled
 * sub-fields joined.
 */
function groupRow(
    field: SchemaField,
    held: unknown,
    person: (target: string) => boolean
): Drawn | null {
    if (field.type === 'checkbox' && typeof held === 'boolean') {
        const word = held ? t('collection.tick_yes') : t('collection.tick_no');
        return {
            field: field.field,
            label: field.label ?? field.field,
            kind: 'text',
            values: [word]
        };
    }
    const row = drawnRow(field, held, person);
    if (field.type === 'records' && personSubField(field, person) === undefined) {
        const items = recordRows(field, held).map((one) => rowWords(one, field.fields ?? []));
        const values = items.filter((words) => words !== '');
        if (values.length > 0) {
            return { field: field.field, label: field.label ?? field.field, kind: 'text', values };
        }
    }
    if (row === null || LABELLED.includes(row.kind)) return row;
    return { ...row, kind: 'text', values: [row.values.join(JOIN)] };
}

/**
 * The group an entry's page draws after its fields: each filled field of the Website section in
 * schema order, under the rows' own word, and null for an entry that fills none of them.
 */
export function websiteGroup(
    entry: Entry,
    schema: SchemaField[] | undefined,
    person: (target: string) => boolean
): DrawnGroup | null {
    const fields: Drawn[] = [];
    let heading = '';
    for (const field of schema ?? []) {
        if (field.section !== WEBSITE_SECTION) continue;
        const row = groupRow(field, entry.fields[field.field], person);
        if (row === null) continue;
        heading = field.section;
        fields.push(row);
    }
    return fields.length === 0 ? null : { heading, fields };
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
export function pageState(collection: string, entry: Entry): ReturnType<typeof entryPageState> {
    return entryPageState(collection, entry.id, entry.title === '' ? bareId(entry) : entry.title);
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

/** The facet value of the synthetic card the Funding view draws for the projects with no scheme. */
export const NO_FUNDING = 'no-funding';

/**
 * The value a write addresses one entry by: its internal id, which is its hub and its value of its
 * file's primary key (`entryIdOf`), and the empty text for an entry that holds no such value or is
 * of a file with no primary key.
 */
export function identityValue(entry: Entry): string {
    const root = rootOf(entry);
    const key = root === '' ? entry.id : entry.id.slice(root.length + 1);
    return key === '' ? '' : entry.id;
}

/**
 * Why the controls that write an entry are disabled: the file has no primary key (`unkeyed`), the
 * entry's value of the primary key is empty, or two entries hold one value of it, which the server
 * refuses every write over. `own` is whether the entry is itself one of those; `value` is the
 * shared value, and '' for an empty one and an unkeyed file. An unkeyed file's fault carries why
 * the file has no primary key (`cause`, `Collection.key_fault`).
 */
export type IdentityFault = {
    kind: 'empty' | 'shared' | 'unkeyed';
    field: string;
    value: string;
    own: boolean;
    cause?: KeyFault;
};

/**
 * The faults of one file's entries, by `entry.index`, for the file's primary key `primaryKey`
 * (`Collection.primary_key`, null when it has none) and the cause `cause` of its having none
 * (`Collection.key_fault`). Every entry of a file with no primary key has the `unkeyed` fault
 * with that cause. An entry with an empty value of the primary key has its own fault, and so
 * has an entry that holds a value another entry holds, with that value. Every other entry of a
 * file that holds a shared value has the file's fault, the first shared value, which is not its
 * own. An entry the faults do not touch is not in the map.
 */
export function identityFaults(
    entries: Entry[],
    primaryKey: string | null,
    cause?: KeyFault
): Map<number, IdentityFault> {
    const faults = new Map<number, IdentityFault>();
    if (primaryKey === null) {
        const unkeyed = { kind: 'unkeyed', field: '', value: '', own: true } as const;
        for (const entry of entries) {
            faults.set(entry.index, { ...unkeyed, ...(cause === undefined ? {} : { cause }) });
        }
        return faults;
    }
    const field = primaryKey;
    const values = entries.map(identityValue);
    const held = (value: string): boolean =>
        value !== '' && values.indexOf(value) !== values.lastIndexOf(value);
    const shared = values.find(held);
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

/** The value a write addresses every entry the file holds by, in the order the file holds them. */
export function fileOrder(entries: Entry[]): string[] {
    return entries.map(identityValue);
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

/** One status the entries carry, and how many carry it. */
export type StatusFacet = { value: string; count: number };

/**
 * Every status the entries carry, in the order they first occur, with a count each. Unlike
 * statusValues, which offers a menu and so needs two values to be worth offering, one value counts:
 * it is the file saying what its one lifecycle value is, which `offeredStatuses` offers a file with
 * no schema.
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

/**
 * The `subtasks:` of one entry as the block and the Focus board draw them, read by the one reader
 * the snapshot uses (data/shapes/shapes.ts): a list is keyed by position and a map by its own
 * keys, which is what the write path addresses a line by, and a line whose `do` is no text is no
 * line.
 */
export function entrySubtasks(entry: Pick<Entry, 'fields'>): Subtask[] {
    return subtasks(entry.fields.subtasks);
}

/**
 * The `followup:` notes of one entry as the card and the Focus board read them, read by the one
 * reader the snapshot uses (data/shapes/shapes.ts), so the note a card shows and
 * the note a write addresses are keyed alike.
 */
export function entryFollowups(entry: Pick<Entry, 'fields'>): Followup[] {
    return followups(entry.fields.followup);
}

/** How many of the subtasks are not done yet. */
export function openSubtaskCount(subtasks: readonly { done: boolean }[]): number {
    return subtasks.filter((one) => !one.done).length;
}
