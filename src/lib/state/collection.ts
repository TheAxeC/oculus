// Layer 2, client state. The pure half of the collection view: what a card draws for one entry and
// in what order, the values the status facet offers, and the filter. No rune and no store here, so
// every rule below is checked without a browser, exactly as state/board.ts is for the board.
//
// A collection is drawn from its own file's `schema:` rather than from anything this module knows:
// the order is the schema's order, a field the schema names and the entry lacks is skipped, and a
// field the entry carries that the schema does not name is drawn after them. What differs per field
// is how it is drawn, and that is decided by the field's name first and its type second, since the
// seven hub files agree on the names (`status`, `tags`, `meta`, `note`) and use only six types.

import { marked } from 'marked';
import type { Entry, Project, SchemaField, Subtask } from '../data/model.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the types the view
// names reach it from here, beside the functions that return them.
export type { Collection, Entry, Project, SchemaField, Subtask } from '../data/model.ts';

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

/**
 * What the view holds per instance: the search box, the status values in force, and the statuses
 * the reader has switched off in the facet bar.
 *
 * The two status fields are not one field. `statuses` is a selection: empty means every status, and
 * a value in it means that value alone, which is what the menu of O14d writes. `hidden` is the facet
 * bar of the acceptance list, where every toggle is on until it is clicked and a click hides that
 * status's cards. A card is drawn when the selection admits it and the facet bar has not hidden it.
 */
export type CollectionState = {
    search: string;
    statuses: string[];
    hidden: string[];
};

/** The state of an instance nobody has typed in yet. */
export function emptyCollectionState(): CollectionState {
    return { search: '', statuses: [], hidden: [] };
}

/** The strings of a saved list, and nothing when what was saved is not a list. */
function savedList(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
}

/** The saved state of one instance, with anything that is not the shape above replaced by it. */
export function parseCollectionState(raw: unknown): CollectionState {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return emptyCollectionState();
    const held = raw as { search?: unknown; statuses?: unknown; hidden?: unknown };
    return {
        search: typeof held.search === 'string' ? held.search : '',
        statuses: savedList(held.statuses),
        hidden: savedList(held.hidden)
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

/**
 * A value as one line of words, or undefined when it is a map and has no line to give. Not
 * data/guards' `text`: a number, a boolean and a list all have a line here, and only a map has none.
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
        const status = entryStatus(entry);
        if (state.statuses.length > 0) {
            if (status === undefined || !state.statuses.includes(status)) return false;
        }
        if (status !== undefined && state.hidden.includes(status)) return false;
        if (needle === '') return true;
        return haystack(entry.fields).toLowerCase().includes(needle);
    });
}

/**
 * One field of Markdown as the HTML a card draws it with. The intro, the note and the funding
 * statement are Markdown in the hub's files, written by the owner of the hub and read by nobody
 * else, which is why the view draws this with {@html} unsanitised, exactly as views/Project.svelte
 * draws a README. It is the inline renderer: these fields are one paragraph and a link or two, so a
 * block renderer would only wrap each of them in a `<p>` the card's own markup already gives them.
 */
export function inlineMarkdown(text: string): string {
    return marked.parseInline(text, { async: false });
}

/** The facet value of the synthetic card the Funding view draws for the projects with no scheme. */
export const NO_FUNDING = 'no-funding';

/** The collection key whose entries the manifests' `funding:` tags name. */
export const FUNDING = 'funding';

/** The collection key whose entries the manifests' `collaborators:` tags name. */
export const COLLABORATIONS = 'collaborations';

/** The field an entry is addressed by: the file's own schema's first field, `title` without one. */
export function identityField(schema: SchemaField[] | undefined): string {
    const first = (schema ?? [])[0];
    return first === undefined ? TITLE_FIELD : first.field;
}

/**
 * The value a write addresses one entry by. It is not the id: funding.yml's schema opens with
 * `title` while three of its entries carry a `key`, and the id the reader made is that key, so a
 * write names the identity field's own value and the server finds the entry by it.
 */
export function identityValue(entry: Entry, schema: SchemaField[] | undefined): string {
    const held = entry.fields[identityField(schema)];
    if (typeof held === 'string' || typeof held === 'number') return String(held);
    return entry.title === '' ? entry.id : entry.title;
}

/** Whether the file floats this entry to the top of its list: `pin: true` and nothing else. */
export function isPinned(entry: Entry): boolean {
    return entry.fields.pin === true;
}

/** The entries a card list draws: the pinned ones first, everything in file order inside that. */
export function pinnedFirst(entries: Entry[]): Entry[] {
    return [...entries.filter(isPinned), ...entries.filter((entry) => !isPinned(entry))];
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
 * The `subtasks:` of one entry as the block draws them. A list is keyed by position and a map by
 * its own keys, which is what the write path addresses a line by; a line with no `do` is no line.
 */
export function entrySubtasks(entry: Entry): Subtask[] {
    const held = entry.fields.subtasks;
    const rows: [string, unknown][] = Array.isArray(held)
        ? held.map((item, at) => [String(at), item])
        : typeof held === 'object' && held !== null
          ? Object.entries(held as Record<string, unknown>)
          : [];
    const lines: Subtask[] = [];
    for (const [key, item] of rows) {
        const map = typeof item === 'object' && item !== null && !Array.isArray(item);
        const record = map ? (item as Record<string, unknown>) : {};
        const text = typeof item === 'string' ? item : textOf(record.do);
        if (text === undefined || text.trim() === '') continue;
        const line: Subtask = { key, do: text, done: record.done === true };
        const deadline = textOf(record.deadline);
        const snooze = textOf(record.snooze);
        if (deadline !== undefined) line.deadline = deadline;
        if (snooze !== undefined) line.snooze = snooze;
        lines.push(line);
    }
    return lines;
}

/** One group of the cross-links: the projects of one type, with the words each of them opens as. */
export type CrossGroup = { type: string; count: number; members: { id: string; label: string }[] };

/** The type a cross-link group is keyed by: the project's own `type:`, or its tier without one. */
function typeOf(project: Project): string {
    return project.type ?? project.tier;
}

/**
 * The projects that name one entry, grouped by type with a count each.
 *
 * Which projects those are is the collection's own question and has three answers: funding is the
 * manifests' `funding:` tags, collaborations is their `collaborators:` tags, and every other
 * collection has no project-side inverse, so it is the entry's own `related:` list of project ids.
 * A related id no project of the snapshot holds is left out rather than drawn as a dead link.
 */
export function crossLinks(entry: Entry, collectionKey: string, projects: Project[]): CrossGroup[] {
    let named: Project[];
    if (collectionKey === FUNDING) {
        named = projects.filter((project) => project.fundingIds.includes(entry.id));
    } else if (collectionKey === COLLABORATIONS) {
        named = projects.filter((project) => project.collaborators.includes(entry.id));
    } else {
        const ids = wordsOf(entry.fields.related);
        named = ids
            .map((id) => projects.find((project) => project.id === id))
            .filter((project): project is Project => project !== undefined);
    }
    return groupProjects(named);
}

/** Projects by type, the types in the order they first occur and the members in the order given. */
export function groupProjects(projects: Project[]): CrossGroup[] {
    const groups: CrossGroup[] = [];
    for (const project of projects) {
        const type = typeOf(project);
        const held = groups.find((group) => group.type === type);
        // An empty short name is no name: the graph and the cards fall back to the title alike.
        const short = project.short?.trim() ?? '';
        const member = { id: project.id, label: short === '' ? project.title : short };
        if (held === undefined) groups.push({ type, count: 1, members: [member] });
        else {
            held.count += 1;
            held.members.push(member);
        }
    }
    return groups;
}

/** What the entry form draws for one field. A type no control is written for is drawn as text. */
export type FormKind = 'text' | 'textarea' | 'select' | 'tags' | 'date' | 'metalist' | 'checkbox';

/** One control of the entry form, over one field of the file's own schema. */
export type FormField = {
    field: string;
    label: string;
    kind: FormKind;
    options: string[];
    required: boolean;
    help?: string;
};

const KINDS: FormKind[] = ['text', 'textarea', 'select', 'tags', 'date', 'metalist', 'checkbox'];

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
        kind: KINDS.includes(field.type as FormKind) ? (field.type as FormKind) : 'text',
        options: field.options ?? optionsFrom(config[field.optionsFrom ?? '']),
        required: field.required === true,
        ...(field.help === undefined ? {} : { help: field.help })
    }));
}

/** Select choices read from one merged-config value: strings, or assignable keyed rows. */
function optionsFrom(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const options: string[] = [];
    for (const item of value) {
        if (typeof item === 'string') {
            options.push(item);
            continue;
        }
        if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
        const row = item as { key?: unknown; assignable?: unknown };
        if (typeof row.key === 'string' && row.assignable !== false) options.push(row.key);
    }
    return options;
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
export function coverage(projects: Project[]): CoverageGroup[] {
    const groups: CoverageGroup[] = COVERAGE_GROUPS.map((group) => ({
        group,
        count: 0,
        members: []
    }));
    for (const project of projects) {
        if (project.type === 'idea') continue;
        const status = project.codeAvailability?.status ?? '';
        const held = groups.find((group) => group.group === status) ?? groups[2];
        held.count += 1;
        held.members.push({ id: project.id, label: project.short ?? project.title });
    }
    return groups;
}
