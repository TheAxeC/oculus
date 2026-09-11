// Layer 2, client state. The pure half of the collection view: what a card draws for one entry and
// in what order, the values the status facet offers, and the filter. No rune and no store here, so
// every rule below is checked without a browser, exactly as state/board.ts is for the board.
//
// A collection is drawn from its own file's `schema:` rather than from anything this module knows:
// the order is the schema's order, a field the schema names and the entry lacks is skipped, and a
// field the entry carries that the schema does not name is drawn after them. What differs per field
// is how it is drawn, and that is decided by the field's name first and its type second, since the
// seven hub files agree on the names (`status`, `tags`, `meta`, `note`) and use only six types.

import type { Entry, SchemaField } from '../data/model.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the three types the
// view names reach it from here, beside the functions that return them.
export type { Collection, Entry, SchemaField } from '../data/model.ts';

/** The field that is the card's own heading; the Card draws it and no drawn field repeats it. */
export const TITLE_FIELD = 'title';

/** The field the status chip and the status facet read. */
export const STATUS_FIELD = 'status';

/** What a card does with one field. The view has one piece of markup per kind and no more. */
export type FieldKind = 'sub' | 'status' | 'chips' | 'meta' | 'body' | 'link' | 'text';

/**
 * One field of one entry, ready to draw: the kind decides the markup, `values` carries the words.
 * A `text`, `sub`, `status`, `body` or `link` field has exactly one value; `chips` has one per tag
 * and `meta` one per label-value pair, already joined, since a Chip takes a label and nothing else.
 */
export type Drawn = {
    field: string;
    /** The file's own words for the field: its schema `label` when it has one, else its name. */
    label: string;
    kind: FieldKind;
    values: string[];
};

/** What the view holds per instance: the search box and the status values in force. */
export type CollectionState = {
    search: string;
    statuses: string[];
};

/** The state of an instance nobody has typed in yet. */
export function emptyCollectionState(): CollectionState {
    return { search: '', statuses: [] };
}

/** The saved state of one instance, with anything that is not the shape above replaced by it. */
export function parseCollectionState(raw: unknown): CollectionState {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return emptyCollectionState();
    const held = raw as { search?: unknown; statuses?: unknown };
    return {
        search: typeof held.search === 'string' ? held.search : '',
        statuses: Array.isArray(held.statuses)
            ? held.statuses.filter((value): value is string => typeof value === 'string')
            : []
    };
}

const CHIP_FIELDS = ['tags', 'related'];
const BODY_FIELDS = ['note', 'statement'];
const LINK_FIELDS = ['link', 'url'];

/** What a label-value pair of a `metalist` reads as on one chip. */
const PAIR = ': ';

/** How a list of words reads on one line, where the field is drawn as text rather than as chips. */
const JOIN = ' | ';

/**
 * How one field is drawn. The name decides it where the seven files agree on a name, and the type
 * decides it otherwise; a type none of them uses falls through to text, which is the widest of the
 * kinds and loses nothing but the shape.
 */
export function kindOf(field: string, type: string): FieldKind {
    if (field === 'sub') return 'sub';
    if (field === STATUS_FIELD) return 'status';
    if (CHIP_FIELDS.includes(field) || type === 'tags') return 'chips';
    if (field === 'meta' || type === 'metalist') return 'meta';
    if (BODY_FIELDS.includes(field) || type === 'textarea') return 'body';
    if (LINK_FIELDS.includes(field)) return 'link';
    return 'text';
}

/** A value as one line of words, or undefined when it is a map and has no line to give. */
function textOf(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        const words = value.map(textOf).filter((word): word is string => word !== undefined);
        return words.length === 0 ? undefined : words.join(JOIN);
    }
    return undefined;
}

/** The words of a list value; a lone string is one word and a map is none. */
function wordsOf(value: unknown): string[] {
    const items = Array.isArray(value) ? value : [value];
    return items.map(textOf).filter((word): word is string => word !== undefined);
}

/** One chip per `{ label, value }` pair of a metalist, the two joined; a pair with neither is none. */
function pairsOf(value: unknown): string[] {
    if (!Array.isArray(value)) return wordsOf(value);
    const chips: string[] = [];
    for (const item of value) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            const word = textOf(item);
            if (word !== undefined) chips.push(word);
            continue;
        }
        const pair = item as { label?: unknown; value?: unknown };
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
        const kind = kindOf(field.field, field.type);
        const values = valuesOf(kind, entry.fields[field.field]);
        if (values.length === 0) continue;
        drawn.push({ field: field.field, label: field.label ?? field.field, kind, values });
    }
    for (const [field, value] of Object.entries(entry.fields)) {
        if (named.has(field)) continue;
        const values = valuesOf('text', value);
        if (values.length === 0) continue;
        drawn.push({ field, label: field, kind: 'text', values });
    }
    return drawn;
}

/** The root api/file serves the hub itself under, for a link that is a path inside the hub. */
export const HUB_ROOT = 'hub';

/** A value that already names where it goes: a scheme, or an absolute path of the page's own. */
const ADDRESSED = /^([a-z][a-z0-9+.-]*:|\/)/i;

/**
 * Where a `link` or `url` field goes. A value with a scheme (`https:`, `mailto:`) or a leading
 * slash is an address and is kept; anything else is a path inside the hub, which the seven files
 * write as `network/<event>/deck.html` and the like, and is served through api/file's hub root so
 * a click opens the file rather than a 404 under the page's own address.
 */
export function hrefOf(value: string): string {
    if (ADDRESSED.test(value)) return value;
    const parts = value
        .split('/')
        .filter((one) => one !== '')
        .map((one) => encodeURIComponent(one));
    return `/api/file/${HUB_ROOT}/${parts.join('/')}`;
}

/** The entry's status, when it has one as a word. */
export function entryStatus(entry: Entry): string | undefined {
    const status = entry.fields[STATUS_FIELD];
    return typeof status === 'string' && status !== '' ? status : undefined;
}

/** Whether the file's schema names a status field, which is what decides the facet is offered. */
export function hasStatusField(schema: SchemaField[] | undefined): boolean {
    return (schema ?? []).some((field) => field.field === STATUS_FIELD);
}

/**
 * Every status the entries carry, in the order they first occur, with a count each. Fewer than two
 * is none: one value splits nothing, which is the rule state/board.ts facets by.
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
    if (typeof value === 'object' && value !== null) {
        return Object.values(value as Record<string, unknown>)
            .map(haystack)
            .join(' ');
    }
    return '';
}

/**
 * The entries a card list shows: every selected status is an alternative, and the search is a
 * substring of every word the entry holds, case insensitive. An empty search matches everything and
 * so does an empty status selection, which is what an instance nobody has touched shows.
 */
export function applyCollectionFilters(entries: Entry[], state: CollectionState): Entry[] {
    const needle = state.search.trim().toLowerCase();
    return entries.filter((entry) => {
        if (state.statuses.length > 0) {
            const status = entryStatus(entry);
            if (status === undefined || !state.statuses.includes(status)) return false;
        }
        if (needle === '') return true;
        return haystack(entry.fields).toLowerCase().includes(needle);
    });
}
