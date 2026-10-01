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
import { ADDRESSED, HOSTED, isHubPath } from '../../data/hub-address.ts';
import { isMap } from '../../data/helpers/guards.ts';
import {
    anyNumberShape,
    anyValueShape,
    fieldItemsShape,
    filledTextShape,
    itemsShape,
    keyedRowsShape,
    listOrOneShape,
    readAs,
    rowsShape,
    searchRevealShape
} from '../../data/shapes/shapes.ts';
import type { Entry, Project, SchemaField, Subtask } from '../../data/model/index.ts';
import { parseOpenForms, type OpenForms } from '../forms/open-forms.ts';
import { HUB_ROOT, normalisePath } from '../sources/fs.ts';
import { realProjects } from '../sources/venues.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the types the view
// names reach it from here, beside the functions that return them.
export type { Collection, Entry, Project, SchemaField, Subtask } from '../../data/model/index.ts';

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

/** The field that is the card's own heading; the Card draws it and no drawn field repeats it. */
export const TITLE_FIELD = 'title';

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
 * reader has switched off in the facet bar, and which of its entry forms are open.
 *
 * The two status fields are not one field. `statuses` is a selection: empty means every status, and
 * a value in it means that value alone. `hidden` is the facet bar of the acceptance list, where
 * every toggle is on until it is clicked and a click hides that status's cards. A card is drawn
 * when the selection admits it and the facet bar has not hidden it.
 */
export type CollectionState = OpenForms & {
    search: string;
    statuses: string[];
    hidden: string[];
    /** The ids of the entries whose long text is drawn whole rather than cut to its clamp. */
    more: string[];
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
    /**
     * The title of the position lead the add form was filled from, whose status the view sets to
     * `applied` once the form's entry is written, and forgets when the form closes.
     */
    lead?: string;
};

/** The state of an instance nobody has typed in yet. */
export function emptyCollectionState(): CollectionState {
    return { search: '', statuses: [], hidden: [], more: [], ...parseOpenForms(undefined) };
}

/** The fields of a saved instance, each read apart so a wrong one costs that field alone. */
const collectionStateShape = searchRevealShape.extend({
    statuses: fieldItemsShape,
    hidden: fieldItemsShape,
    more: fieldItemsShape,
    lead: z
        .string()
        .refine((lead) => lead.trim() !== '')
        .optional()
        .catch(undefined)
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
        ...parseOpenForms(raw)
    };
    if (held.reveal !== undefined) state.reveal = held.reveal;
    if (held.lead !== undefined) state.lead = held.lead;
    return state;
}

/** A string and nothing else, for a value the data layer types as unknown. */
const stringShape = z.string();

/** The `options_from:` value of a schema field whose value is a key of the people registry. */
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
 * `options_from:` and not the field's name, so a second field of people follows it with no change.
 */
export function kindOf(field: string, type: string, optionsFrom?: string): FieldKind {
    if (field === 'sub') return 'sub';
    if (field === STATUS_FIELD) return 'status';
    if (optionsFrom === PEOPLE_OPTIONS) return 'person';
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
        const kind = kindOf(field.field, field.type, field.optionsFrom);
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
 * write as `network/<event>/deck.html` and the like, and is served through api/file's hub root so
 * a click opens the file rather than a 404 under the page's own address.
 */
export function hrefOf(value: string): string {
    if (ADDRESSED.test(value)) return value;
    if (HOSTED.test(value)) return `${HOSTED_SCHEME}${value}`;
    const parts = value
        .split('/')
        .filter((one) => one !== '')
        .map((one) => encodeURIComponent(one));
    return `/api/file/${HUB_ROOT}/${parts.join('/')}`;
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
    state: Pick<CollectionState, 'search' | 'statuses' | 'hidden'>
): Entry[] {
    const needle = state.search.trim().toLowerCase();
    return entries.filter((entry) => {
        const status = entryStatus(entry);
        if (state.statuses.length > 0) {
            if (status === undefined || !state.statuses.includes(status)) return false;
        }
        if (status !== undefined && state.hidden.includes(status)) return false;
        if (needle === '') return true;
        return haystack(entry.fields).toLowerCase().includes(needle);
    });
}

/** The facet value of the synthetic card the Funding view draws for the projects with no scheme. */
export const NO_FUNDING = 'no-funding';

/** The collection key whose entries the manifests' `funding:` tags name. */
export const FUNDING = 'funding';

/** The collection key of the joint work, whose entries each name one person. */
export const JOINT_WORK = 'joint-work';

/** The field an entry is addressed by: the file's own schema's first field, `title` without one. */
export function identityField(schema: SchemaField[] | undefined): string {
    const first = (schema ?? []).at(0);
    return first === undefined ? TITLE_FIELD : first.field;
}

/** An identity a file writes as a string or a number, answered as text. */
const identityShape = z.union([z.string(), anyNumberShape.transform(String)]);

/**
 * The value a write addresses one entry by. It is not the id: funding.yml's schema opens with
 * `title` while three of its entries carry a `key`, and the id the reader made is that key, so a
 * write names the identity field's own value and the server finds the entry by it.
 */
export function identityValue(entry: Entry, schema: SchemaField[] | undefined): string {
    const held = readAs(identityShape, entry.fields[identityField(schema)]);
    return held ?? (entry.title === '' ? entry.id : entry.title);
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

/** The type a cross-link group is keyed by: the project's own `type:`, or its tier without one. */
function typeOf(project: Project): string {
    return project.type ?? project.tier;
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
        const person = readAs(stringShape, entry.fields.person) ?? entry.id;
        named = projects.filter((project) => project.collaborators.includes(person));
    } else {
        const ids = wordsOf(entry.fields.related);
        named = ids
            .map((id) => projects.find((project) => project.id === id))
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

/** What the entry form draws for one field. A type no control is written for is drawn as text. */
export type FormKind =
    'text' | 'textarea' | 'select' | 'tags' | 'date' | 'metalist' | 'checkbox' | 'raw';

/** One control of the entry form, over one field of the file's own schema. */
export type FormField = {
    field: string;
    label: string;
    kind: FormKind;
    options: string[];
    required: boolean;
    help?: string;
};

/** The kind a schema field's type names, and text for a word no control is written for. */
const kindShape = z
    .enum(['text', 'textarea', 'select', 'tags', 'date', 'metalist', 'checkbox', 'raw'])
    .catch('text') satisfies z.ZodType<FormKind>;

/**
 * The controls the add and edit form draws, in the file's own field order. The type is the file's
 * word: the hub's schemas use text, tags, textarea, select, metalist and date, and a word none of
 * them uses is drawn as one line of text rather than left out, so a field is never uneditable.
 */
export function formFields(
    schema: SchemaField[] | undefined,
    config: Record<string, unknown> = {}
): FormField[] {
    return (schema ?? []).map((field) => ({
        field: field.field,
        label: field.label ?? field.field,
        kind: readAs(kindShape, field.type) ?? 'text',
        options: field.options ?? optionsFrom(config[field.optionsFrom ?? '']),
        required: field.required === true,
        ...(field.help === undefined ? {} : { help: field.help })
    }));
}

/**
 * The map-valued fields one entry carries that its schema does not name. They are offered as raw
 * controls, so a nested block such as a dataset's `retrieval:` is edited rather than left unedited
 * because the file's schema never listed it.
 */
export function extraRawFields(
    entry: Entry | null,
    schema: SchemaField[] | undefined
): FormField[] {
    if (entry === null) return [];
    const named = new Set((schema ?? []).map((field) => field.field));
    const found: FormField[] = [];
    for (const [field, value] of Object.entries(entry.fields)) {
        if (named.has(field) || field === TITLE_FIELD) continue;
        if (!isMap(value)) continue;
        found.push({ field, label: field, kind: 'raw', options: [], required: false });
    }
    return found;
}

/**
 * What an emptied control saves as. A control the reader cleared on an entry that exists writes the
 * empty string, which is the reader saying the field has no words; a control nobody touched, and
 * every control of a form that adds an entry, writes nothing, so a new entry carries no key for
 * what was never filled in.
 */
export function clearedValue(touched: boolean, editing: boolean): string | null {
    return touched && editing ? '' : null;
}

/**
 * The first control whose value does not fit the kind the schema gave its field, or null when
 * every value fits. A select writes one of its own options and a date writes an ISO day; the form
 * refuses anything else before it is sent rather than leaving the file to take it.
 */
export function refusedField(
    fields: FormField[],
    valueOf: (field: string) => unknown
): string | null {
    for (const field of fields) {
        const value = valueOf(field.field);
        const text = readAs(stringShape, value)?.trim() ?? '';
        if (text === '') continue;
        if (field.kind === 'select' && !field.options.includes(text)) return field.field;
        if (field.kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) return field.field;
    }
    return null;
}

/** One select choice: a string, or the key of a keyed row that is not marked unassignable. */
const optionShape = z.union([
    z.string(),
    z
        .object({ key: z.string(), assignable: anyValueShape })
        .refine((row) => row.assignable !== false)
        .transform((row) => row.key)
]);

const optionsShape = rowsShape(optionShape);

/** Select choices read from one merged-config value: strings, or assignable keyed rows. */
function optionsFrom(value: unknown): string[] {
    return readAs(optionsShape, value) ?? [];
}

/** The project types the Funding view's synthetic card counts: the work that is still running. */
const LIVE_TYPES = ['active', 'manuscript'];

/**
 * The active and manuscript projects no funding scheme of the file covers, which is the Funding
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

/** One row of the Code view's software list: the project, what it is, and the papers it names. */
export type SoftwareRow = {
    id: string;
    label: string;
    /** The project's own `type:`, which on this tier is `software`. */
    type: string;
    /** The `code_availability:` status, or the empty string when the manifest names none. */
    code: string;
    /** The projects the manifest's `related:` names, each drawn as a cross-link. */
    papers: { id: string; label: string }[];
};

/**
 * The software projects, by title, each with the papers its `related:` names.
 *
 * The tier is the whole of what makes a project software here, so a manifest filed under
 * `projects/software/` is listed whether or not any paper points back at it, and a related id the
 * portfolio does not hold is left out rather than drawn as a dead link.
 */
export function softwareRows(projects: Project[]): SoftwareRow[] {
    const rows: SoftwareRow[] = [];
    for (const project of projects) {
        if (project.tier !== 'software') continue;
        const papers: { id: string; label: string }[] = [];
        for (const id of project.relatedIds) {
            const found = projects.find((one) => one.id === id);
            if (found === undefined) continue;
            const short = found.short?.trim() ?? '';
            papers.push({ id, label: short === '' ? found.title : short });
        }
        rows.push({
            id: project.id,
            label: project.title,
            type: project.type ?? '',
            code: project.codeAvailability?.status ?? '',
            papers
        });
    }
    return rows.sort((left, right) => left.label.localeCompare(right.label));
}

/** The three code-availability groups of the Code view, in the order the sections are drawn. */
export const COVERAGE_GROUPS = ['deposited', 'review-anon', 'none'];

/** One coverage section: which group, and the projects in it. */
export type CoverageGroup = {
    group: string;
    count: number;
    members: { id: string; label: string }[];
};

/**
 * The projects grouped by what their manifest says about their code: `deposited`, `review-anon`,
 * and `none` for both the ones that say so and the ones that say nothing, which is the gap the
 * section is drawn to show. An idea has no code to deposit and is not counted.
 */
export function coverage(projects: Project[], dead: string[] = []): CoverageGroup[] {
    const groups: CoverageGroup[] = COVERAGE_GROUPS.map((group) => ({
        group,
        count: 0,
        members: []
    }));
    for (const project of realProjects(projects, dead)) {
        if (project.type === 'idea') continue;
        const status = project.codeAvailability?.status ?? '';
        const held = groups.find((group) => group.group === status) ?? groups[2];
        held.count += 1;
        held.members.push({ id: project.id, label: project.short ?? project.title });
    }
    return groups;
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
