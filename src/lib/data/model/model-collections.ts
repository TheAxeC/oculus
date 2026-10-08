// Layer 1, data. Editable collections, generated feeds and the career record.
// The portfolio aggregate imports these leaf types while data/model/index.ts is the facade.

import type { Id } from './model-entities.ts';

/**
 * One entry of one collection, as data/snapshot/normalise.ts fills it from a RawEntry. `id` is the
 * entry's `key` when the YAML had one and its `title` otherwise, so it is unique inside its
 * collection and nowhere wider. `fields` holds every key the YAML had, `title` and `key` included,
 * so a view can render a collection from its file's own `schema` without the model naming each
 * field.
 */
export type Entry = {
    id: Id;
    title: string;
    fields: Record<string, unknown>;
    /** Absolute path of the collection file, and the entry's position in its entry list. */
    file: string;
    index: number;
};

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
    /** The allowed values of a `select`. */
    options?: string[];
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
    /** The fields of each record of a `records` field. */
    fields?: SchemaField[];
};

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
export type Collection = {
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
export type Lead = {
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

/** What sources/feeds.ts returns. It is already JSON-safe, so the snapshot carries it unchanged. */
export type RawFeeds = Feeds;

/**
 * One host of the registries/career.yml pipeline. `scores` holds the file's own scoring keys,
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

/** The career strategy of registries/career.yml, as the Focus board's foot panel reads it. */
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
};
