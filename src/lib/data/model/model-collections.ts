// Layer 1, data. Editable collections, generated feeds, the career record, and the vocabularies and
// rules validate checks the portfolio's files against.
// The portfolio aggregate imports these leaf types while data/model/index.ts is the facade.

import type { Id, Rooted } from './model-entities.ts';

/**
 * One entry of one collection, as data/snapshot/normalise.ts fills it from a RawEntry. `id` is the
 * entry's `key` when the YAML had one and its `title` otherwise, so it is unique inside its
 * collection and nowhere wider. `fields` holds every key the YAML had, `title` and `key` included,
 * so a view can render a collection from its file's own `schema` without the model naming each
 * field.
 */
export type Entry = Rooted & {
    id: Id;
    title: string;
    fields: Record<string, unknown>;
    /** Absolute path of the collection file, and the entry's position in its entry list. */
    file: string;
    index: number;
};

/** A field's value when it is text. */
function textOf(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/**
 * The words an entry is known by: its `title`, else its `name`, else the value of the identity
 * field of its file, else nothing. data/snapshot/normalise.ts fills an Entry's `title` by it and
 * the entry page words a saved entry by it, so the two agree.
 */
export function entryTitleOf(fields: Record<string, unknown>, ident = 'title'): string {
    return textOf(fields.title) ?? textOf(fields.name) ?? textOf(fields[ident]) ?? '';
}

/**
 * The id an entry has: its `id`, else its `key`, else the value of the identity field of its file,
 * else its title. data/snapshot/normalise.ts fills an Entry's `id` by it and the entry page follows
 * a saved entry by it, so the two agree.
 */
export function entryIdOf(fields: Record<string, unknown>, ident = 'title'): string {
    const id = textOf(fields.id);
    if (id !== undefined && id.length > 0) return id;
    const key = textOf(fields.key);
    if (key !== undefined && key.length > 0) return key;
    return textOf(fields[ident]) ?? entryTitleOf(fields, ident);
}

/**
 * One field of a collection file's own `schema:` list, as the file writes it. It is the order and
 * the vocabulary a collection is drawn by: the view walks the list and renders each field of an
 * entry in this order, so the file decides what its records look like and the model names no field
 * of any collection. `type` is the file's word (`text`, `select`, `tags`, `textarea`, `date`,
 * `metalist` in the hub's files); a type a view does not know is drawn as text.
 */
export type SchemaField = {
    field: string;
    type: string;
    /** The words over the field, when the file gives it words other than its own name. */
    label?: string;
    /**
     * The allowed values of a `select` or a `tags` field, each a plain word or a `{ key, label }`
     * row whose label is drawn in place of the key.
     */
    options?: SchemaOption[];
    /**
     * Where the field's keys come from: registry names, `projects` or `vocab.<key>` offered
     * together, or the source another field of the record picks. A `select` is held to them; a
     * `text` is completed from them and held to nothing.
     */
    from?: string[] | FromPicked;
    /** Whether the field must be present, always or while its `when` map holds. */
    required?: boolean | { when: When };
    /** The field's meaning in one plain sentence. */
    help?: string;
    /** The condition under which the field is allowed in a record. */
    when?: When;
    /** The field takes keys it does not declare. */
    open?: boolean;
    /** On a `records` field: the value is a map from a name to one record, not a list of them. */
    map?: boolean;
    /** The fields of each record of a `records` field. */
    fields?: SchemaField[];
    /** The collection view draws a filter of the field's values beside its search. */
    filter?: boolean;
};

/** One allowed value of a field: a plain word, or a key with the label it is drawn with. */
export type SchemaOption = string | { key: string; label: string };

/**
 * The types a field's `filter: true` draws a filter for. The schema run gives a finding for
 * `filter: true` on any other type, and the collection board draws no filter for it.
 */
export const FILTERED_TYPES: readonly string[] = ['select', 'tags', 'text'];

/** The key of one option: the word itself, or the row's key. */
export function optionKey(option: SchemaOption): string {
    return typeof option === 'string' ? option : option.key;
}

/** The keys a field's options allow, in the order the file writes them. */
export function optionKeys(field: Pick<SchemaField, 'options'> | undefined): string[] {
    return (field?.options ?? []).map(optionKey);
}

/** The label a field's options give a value: the row's label, else the value itself. */
export function optionLabel(
    field: Pick<SchemaField, 'options'> | undefined,
    value: string
): string {
    const row = field?.options?.find((one) => optionKey(one) === value);
    return row === undefined || typeof row === 'string' ? value : row.label;
}

/** A `from` whose source is the one another field of the record picks by its word. */
export type FromPicked = { field: string; sources: Record<string, string> };

/**
 * A condition: each key is a field of the record and holds a value or a list of values, all of
 * which must hold. The key `path` is the file's path from the hub, matched as a glob.
 */
export type When = Record<string, string | string[]>;

/**
 * One collection: a hub file of like records the reader edits through the file's own schema. Its
 * entries are held inline rather than by id, since an entry belongs to exactly one collection and
 * no relation runs the other way, so no cycle can form. Five files are carried as entities too
 * (venues, pillars, domains, funding and data), the collection being what their entries are
 * edited as. The data file lists its records under `datasets:`; the others use `entries:`.
 */
export type Collection = Rooted & {
    /** The key from the `collections:` list, `funding` or `events`. */
    id: Id;
    title: string;
    intro?: string;
    /** Absolute path of the collection file. */
    file: string;
    /**
     * The file's own `schema:`, absent when the file has none and when what it has is not a list
     * of field maps; the schema check (data/snapshot/schema/run.ts) reports the second case as a
     * finding.
     */
    schema?: SchemaField[];
    entries: Entry[];
};

/**
 * Everything the sources read, before anything is validated or resolved. This is what validate
 * reads and what normalise turns into the snapshot; the findings are the ones the sources
 * themselves reported, carried so that validate can pass them through rather than re-derive them.
 */
/** One live lead of the position scout's feed, as the command center counts it down. */
export type Lead = Rooted & {
    title: string;
    /** The ISO date inside the feed's own `deadline:` text, and null when it holds none. */
    deadline: string | null;
    status: string;
    fit: string | null;
};

/**
 * What the three feed files say and nothing more: a run date, the live leads. A feed whose file or
 * folder is not there is null rather than empty, because "nothing to report" and "no feed on this
 * machine" are different answers and the board says so. The feeds are generated, so a missing one
 * is not a finding; a broken one is.
 *
 * `scout` is the position scout's own run date, which lives in the leads file's `meta.log` rather
 * than in a file of its own, so it is null exactly when `leads` is.
 */
export type Feeds = {
    leads: Lead[] | null;
    radar: { lastRun: string | null } | null;
    scout: { lastRun: string | null } | null;
    linkedin: { lastPost: string | null } | null;
};

/** The generated YAML and Markdown feeds delivered together on the feeds channel. */
export type FeedKind = 'radar' | 'leads' | 'linkedin';
export type FeedEntry = Record<string, unknown>;
export type FeedData = {
    meta: Record<string, unknown>;
    entries: FeedEntry[];
    /** The configured posting interval, present on the LinkedIn folder feed. */
    cadenceDays?: number;
    /** The file's own ordered entry schema, when it carries one. */
    schema?: SchemaField[];
};

/**
 * What sources/documents/feeds.ts returns. It is already JSON-safe, so the snapshot carries it
 * unchanged.
 */
export type RawFeeds = Feeds;

/**
 * One host of the career file's pipeline. `scores` holds the file's own scoring keys,
 * every key of the host that is not one of the five named above it, so that `career_score_dims`
 * decides which of them a chip is drawn for and this model names none of them.
 */
export type Host = {
    name: string;
    inst?: string;
    tag?: string;
    status: string;
    scores: Record<string, string | undefined>;
    /**
     * The prose under the row, with the `[proposal: ...]` prefix the chips already show removed.
     */
    note?: string;
};

/** The career strategy of the career file (`career_file`), which the Focus board's foot reads. */
export type Career = {
    title: string;
    milestone?: string;
    situation: { label: string; value: string }[];
    order: { task: string; when?: string; note?: string }[];
    orderNote?: string;
    hosts: Host[];
    hostCriteria: string[];
    notHosts: { who: string; why?: string }[];
    eligibility: { rule: string[]; shots: string[]; caveat?: string } | null;
    dropped: { what: string; why?: string }[];
    /** Every section of the file as it holds it, its `schema:` left out: what the editor edits. */
    sections: Record<string, unknown>;
    /** The file's own `schema:`, one field per section, absent when the file has none. */
    schema?: SchemaField[];
};

/**
 * The controlled vocabularies validate checks values against, each a list of words. `statuses` is
 * the statuses a collection entry's `status` may take (the words of `statuses` with a colour),
 * `acknowledged` the funding statuses a manuscript acknowledges (the words carrying the flag), and
 * `stages` and `forms` the words of those lists, which a project writes in `stage:` and `form:`
 * and never as a chip.
 */
export type Vocabulary = {
    statuses: string[];
    acknowledged: string[];
    stages: string[];
    forms: string[];
};

/**
 * What validate needs and nothing more: the vocabularies, the manifest fields the schema checks,
 * and the text its sentences are read from.
 */
export type ValidationRules = {
    vocab: Vocabulary;
    /**
     * The manifest fields the generated schema holds to the keys of their `from` sources, all of
     * which were read: the schema reports a value of the wrong shape there, so validate does not.
     */
    listed?: ReadonlySet<string>;
    /** The flat text catalog every finding's sentence is read from, by its `findings.` key. */
    text: Record<string, string>;
    /** The person the setting `self` names, checked against the people file; none checks none. */
    self?: SelfCheck;
};

/**
 * The person key the workspace setting `self` names (empty for none), the people file it is
 * looked up in and whether that file read.
 */
export type SelfCheck = { key: string; file: string; read: boolean };
