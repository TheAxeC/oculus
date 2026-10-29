// Layer 1, data. Editable collections, generated feeds, the career record, the vocabularies and
// rules validate checks the portfolio's files against, and the words each hub gives its own records
// with the collections it lists. The portfolio aggregate imports these leaf types while
// data/model/index.ts is the facade.

import type { CollectionFile, Id, RawCollection, Rooted } from './model-entities.ts';

/**
 * The words a `collections:` entry's `registry:` names a registry or a feed by: the eight
 * registries, the Literature collection, and the Position Leads and Lit Watch feeds.
 */
export const REGISTRY_WORDS = [
    'datasets',
    'venues',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources',
    'literature',
    'leads',
    'radar'
] as const;

/** One word of `registry:`. */
export type RegistryWord = (typeof REGISTRY_WORDS)[number];

/**
 * The flags a `collections:` entry sets to true, each the feature that reads its file: the Focus
 * band's positions and teaching columns, the Awaiting box, the open count and green badge, where a
 * lead's applied press writes, Disseminated in and the task features.
 */
export const COLLECTION_FLAGS = [
    'band_positions',
    'band_teaching',
    'awaiting',
    'open_badge',
    'lead_applications',
    'dissemination',
    'tasks'
] as const;

/** One flag of a `collections:` entry. */
export type CollectionFlag = (typeof COLLECTION_FLAGS)[number];

/**
 * One entry of one collection, as data/snapshot/normalise.ts fills it from a RawEntry. `id` is the
 * value of its file's primary key, the empty text when the file has none or the entry holds none
 * there, so it is unique inside its collection and nowhere wider. `title` is its display
 * (`entryTitleOf`). `fields` holds every key the YAML had, so a view can render a collection from
 * its file's own `schema` without the model naming each field.
 */
export type Entry = Rooted & {
    id: Id;
    title: string;
    fields: Record<string, unknown>;
    /** Absolute path of the collection file, and the entry's position in its entry list. */
    file: string;
    index: number;
};

/** A value as the text a key is written as: a text, or a number; undefined for anything else. */
function keyText(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
}

/**
 * The field types a primary key cannot be: a field whose value is a list or a map names no one
 * entry.
 */
export const UNKEYED_TYPES: readonly string[] = [
    'tags',
    'metalist',
    'records',
    'chips',
    'lines',
    'keymap'
];

/** The part of a schema field a primary key is read from; a project form field has it too. */
type KeyedField = Pick<SchemaField, 'field' | 'type' | 'primary_key'>;

/**
 * A file's schema as its primary key is read (`keyedSchema`): its fields, undefined when the file
 * carries no `schema:` key, and null when it carries one that does not read.
 */
type KeyedSchema = readonly KeyedField[] | null | undefined;

/**
 * Why a file of entries has no primary key, with the fields a sentence naming the cause shows: its
 * schema flags no field (`none`, with the key its `collections:` entry names when it names one),
 * flags two or more (`two`), flags a field of `UNKEYED_TYPES` (`unkeyed`), its `collections:` entry
 * names a `primary_key:` beside the schema's flag (`beside`), its schema does not read (`unread`),
 * or it has neither a schema nor a named key (`missing`).
 */
export type KeyFault =
    | { cause: 'none'; named?: string }
    | { cause: 'unread' }
    | { cause: 'two'; fields: string[] }
    | { cause: 'unkeyed'; field: string; type: string }
    | { cause: 'beside'; named: string; field: string }
    | { cause: 'missing' };

/**
 * Why the file whose schema is `schema` and whose `collections:` entry names `named` has no
 * primary key, or null when it has one (`primaryKeyOf`). A schema the file carries but that does
 * not read is null here (`keyedSchema`), whatever it flags. Every refusal of a write and every card
 * line about a file with no primary key names the cause this gives.
 */
export function keyFaultOf(schema: KeyedSchema, named?: string): KeyFault | null {
    if (schema === null) return { cause: 'unread' };
    if (schema === undefined) return named === undefined ? { cause: 'missing' } : null;
    const flagged = schema.filter((one) => one.primary_key === true);
    if (flagged.length > 1) return { cause: 'two', fields: flagged.map((one) => one.field) };
    if (flagged.length === 0) {
        return named === undefined ? { cause: 'none' } : { cause: 'none', named };
    }
    const [field] = flagged;
    if (named !== undefined) return { cause: 'beside', named, field: field.field };
    if (UNKEYED_TYPES.includes(field.type)) {
        return { cause: 'unkeyed', field: field.field, type: field.type };
    }
    return null;
}

/** The causes of no primary key that the choice of a field as the key mends. */
export const CHOSEN_KEY_CAUSES: readonly KeyFault['cause'][] = ['none', 'two', 'beside', 'missing'];

/**
 * The fields a file of entries offers as its primary key, in the order its entries first hold
 * them: each field an entry holds whose every value is no list and no map, and in a file with a
 * schema only the ones the schema describes with a type a primary key may be (`UNKEYED_TYPES`).
 */
export function keyChoices(
    schema: KeyedSchema,
    entries: readonly Record<string, unknown>[]
): string[] {
    const held: string[] = [];
    for (const entry of entries) {
        for (const key of Object.keys(entry)) if (!held.includes(key)) held.push(key);
    }
    const scalar = (key: string): boolean =>
        entries.every((entry) => typeof entry[key] !== 'object' || entry[key] === null);
    const described = (key: string): boolean =>
        schema === undefined ||
        (schema?.some((one) => one.field === key && !UNKEYED_TYPES.includes(one.type)) ?? false);
    return held.filter((key) => scalar(key) && described(key));
}

/**
 * The primary key of a file of entries, the field an entry is addressed by in every read and
 * write: the one field of the file's schema flagged `primary_key: true`, and for a file with no
 * schema the field its `collections:` entry names as `primary_key:` (`named`). It is null when the
 * file has none, for the cause `keyFaultOf` gives. A flag on a field of a `records` field is no
 * primary key. The project form's fields (`FormField`) are read by it too, so a manifest schema's
 * flag gives the same key there as everywhere else.
 */
export function primaryKeyOf(schema: KeyedSchema, named?: string): string | null {
    if (keyFaultOf(schema, named) !== null || schema === null) return null;
    if (schema === undefined) return named ?? null;
    return schema.find((one) => one.primary_key === true)?.field ?? null;
}

/** The fields of a schema that carry a `display:` rank, the lowest rank first. */
export function displayFields(schema: readonly SchemaField[] | undefined): string[] {
    const ranked = (schema ?? []).flatMap((one) =>
        one.display === undefined ? [] : [{ field: one.field, rank: one.display }]
    );
    return ranked.sort((left, right) => left.rank - right.rank).map((one) => one.field);
}

/**
 * The id an entry has: the value of its file's primary key as text, and the empty text when the
 * file has no primary key or the entry holds no text or number there. data/snapshot/normalise.ts
 * fills an Entry's `id` by it and the entry page follows a saved entry by it, so the two agree.
 */
export function entryIdOf(fields: Record<string, unknown>, primaryKey: string | null): string {
    return primaryKey === null ? '' : (keyText(fields[primaryKey]) ?? '');
}

/**
 * The words an entry is shown by, its display: the field of the lowest `display:` rank that holds
 * a text or a number with something in it, else the value of its primary key (`entryIdOf`).
 * data/snapshot/normalise.ts fills an Entry's `title` by it, so a card's heading, an entry page's
 * title and a reference to the entry show the same words.
 */
export function entryTitleOf(
    fields: Record<string, unknown>,
    schema: readonly SchemaField[] | undefined,
    primaryKey: string | null
): string {
    for (const field of displayFields(schema)) {
        const held = keyText(fields[field]);
        if (held !== undefined && held.trim() !== '') return held;
    }
    return entryIdOf(fields, primaryKey);
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
     * What the field's values name, each the primary key of one entry of it: a key of the hub's
     * `collections:` list, `projects` for the project manifests, or a vocabulary list as
     * `vocab.<key>` or `vocab.<key>.<field>`; several of these offered together, or the target
     * another field of the record picks. A `select` is held to the target's keys; a `text` is
     * completed from them and held to nothing.
     */
    foreign_key?: string[] | KeyPicked;
    /** The field is its file's primary key: an entry is addressed by the value it holds there. */
    primary_key?: true;
    /**
     * The rank, a whole number from 1, of the field among those an entry is shown by: a reference
     * to the entry shows the first of them that is filled.
     */
    display?: number;
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

/** A `foreign_key` whose target is the one another field of the record picks by its word. */
export type KeyPicked = { field: string; sources: Record<string, string> };

/**
 * A condition: each key is a field of the record and holds a value or a list of values, all of
 * which must hold. The key `path` is the file's path from the hub, matched as a glob.
 */
export type When = Record<string, string | string[]>;

/** Where the ticker reads an entry's lines from: the category its lines carry. */
type TickerSource = {
    /** A word of `ticker_categories`. */
    category: string;
    /** Set when an undated entry of the collection is open work, a task line. */
    undated?: true;
};

/**
 * What a `collections:` entry says its file is, beside its key and path: the registry it is
 * (`registry:`), the features that read it (a flag of `COLLECTION_FLAGS` set to true), the entries
 * Disseminated in leaves out of it (`dissemination_skip:`), the ticker's reading of it (`ticker:`)
 * and the field a file with no schema is addressed by (`primary_key:`). A field the entry does not
 * set, or sets to something no reader takes, is absent.
 */
export type CollectionTraits = {
    registry?: RegistryWord;
    dissemination_skip?: When;
    ticker?: TickerSource;
    primary_key?: string;
} & Partial<Record<CollectionFlag, true>>;

/**
 * Where a collection's own view sits in the view catalogue and what it is called: its group (a rail
 * page or a `nav_groups` key) and its order there, and the dotted keys of the text-catalog words of
 * its label, its glyph and its line in Make Folder a Hub.
 */
type CollectionPlace = {
    group?: string;
    order?: number;
    label?: string;
    glyph?: string;
    about?: string;
};

/** One entry of a `collections:` list with every field it sets. */
export type CollectionEntry = CollectionFile & CollectionTraits & CollectionPlace;

/**
 * The words one hub gives its own records, read from its own files: the research `domains` (each
 * key of its domains registry to the entry's colour and title as `label`; a colour not written
 * `#rrggbb` is left out), and `venue_themes` and `data_themes`, the `{ key, label }` options of the
 * `themes` field of its venue and dataset registries (a plain word is its own label), and the
 * `collections` it lists: the entries its own `collections:` names, or, when its settings name no
 * list, the entries of the engine's list whose file the hub holds at the engine's path, each with
 * every field it sets and, when its `label:` names no word of the catalog, its file's `title:`
 * (`ListedCollection`). `list` is that `collections:` list as written and the file it was read
 * from, by which the page names the place of an entry whose key a view of oculus's holds. `words`
 * is the merged value of each key of config/catalogs/vocab.yml a hub sets and of
 * `manifest_fields`, under this hub's own settings: oculus's value with the hub's
 * `.oculus/config.yml` laid over it.
 */
export type HubVocab = {
    domains: Record<string, { color?: string; label: string }>;
    venue_themes: { key: string; label: string }[];
    data_themes: { key: string; label: string }[];
    collections: ListedCollection[];
    list: { file: string; value: unknown };
    words: Record<string, unknown>;
};

/**
 * One entry of a hub's `collections:` list as the page reads it: the entry's fields, and the
 * `title:` of its file when its entry names no label word, which the view catalogue names its view
 * by then.
 */
export type ListedCollection = CollectionEntry & { title?: string };

/**
 * The vocabulary of every hub the workspace holds, by the hub's name, and the name of the primary
 * hub (null in a workspace with none). `order` is every name a record's hub can carry, in the order
 * a list drawn over several hubs reads them: the primary, then the other hubs in the workspace's
 * order, and in a workspace with no primary each folder that is no hub at its place among them.
 * `own` is oculus's own words (the same keys as `words`), which the records of a folder that is no
 * hub are read under, and `ownCollections` oculus's own `collections:` list
 * (config/defaults/sources.yml), whose entry of a registry a hub's list that names none is read by.
 */
export type HubVocabs = {
    primary: string | null;
    lists: Record<string, HubVocab>;
    order: string[];
    own: Record<string, unknown>;
    ownCollections: CollectionEntry[];
};

/**
 * A collection file as data/sources/collections.ts read it: the raw file, the traits its entry
 * gives it, and the entry's position in its hub's list, which orders the collections of one hub
 * that carry the same flag.
 */
export type ReadCollection = RawCollection & CollectionTraits & { index: number };

/**
 * One collection: a hub file of like records the reader edits through the file's own schema. Its
 * entries are held inline rather than by id, since an entry belongs to exactly one collection and
 * no relation runs the other way, so no cycle can form. The files whose entry names a registry of
 * venues, pillars, domains, funding, datasets, people, organisations or resources are carried as
 * entities too, the collection being what their entries are edited as. The datasets registry's
 * file lists its records under `datasets:`; the others use `entries:`. It carries its entry's
 * traits and its position in its hub's list; its `primary_key` is the one `primaryKeyOf` gives the
 * file, absent when the file has none, so its entries are drawn and not written.
 */
export type Collection = Rooted &
    CollectionTraits & {
        /** The key from the `collections:` list, `funding` or `events`. */
        id: Id;
        title: string;
        /** Absolute path of the collection file. */
        file: string;
        /**
         * The file's own `schema:`, absent when the file has none and when what it has is not a
         * list of field maps; the schema check (data/snapshot/schema/run.ts) reports the second
         * case as a finding.
         */
        schema?: SchemaField[];
        entries: Entry[];
        /**
         * Why the file has no primary key (`keyFaultOf`), absent when it has one. A card of the
         * collection names this cause on the line that says why its writes are off.
         */
        key_fault?: KeyFault;
        /**
         * The position of the collection's entry in its hub's `collections:` list, which orders the
         * collections of one hub that carry the same flag; the read of a hub always sets it.
         */
        index?: number;
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
 *
 * This is one hub's feeds as sources/documents/feeds.ts reads them; the summary the snapshot
 * carries (`Feeds`) adds each hub's run dates.
 */
export type RawFeeds = {
    leads: Lead[] | null;
    radar: { lastRun: string | null } | null;
    scout: { lastRun: string | null } | null;
    linkedin: { lastPost: string | null } | null;
};

/** One hub's own run dates: its name, and its radar, scout and LinkedIn as its feeds give them. */
type HubRuns = { hub: string } & Pick<RawFeeds, 'radar' | 'scout' | 'linkedin'>;

/**
 * The feeds summary of the snapshot: the hubs' live leads together and the latest run date of each
 * feed over the hubs, with `byHub`, one row per hub of the merge in the merge's order holding that
 * hub's own run dates, which the update tray and the Focus board read for a task of one hub. A
 * hub's own snapshot (`HubSnapshot`) carries its `RawFeeds`, with no `byHub`; the merge of the hubs
 * (snapshot/hubs/merge.ts) gives the rows, and a project folder that is no hub gives none.
 */
export type Feeds = RawFeeds & { byHub: HubRuns[] };

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
    /** The field an entry is addressed by (`primaryKeyOf`), absent when the file has none. */
    primary_key?: string;
    /** Why the file has no primary key (`keyFaultOf`), absent when it has one. */
    key_fault?: KeyFault;
};

/**
 * The career strategy of the career file (`career_file`): its title, the goal it works toward, the
 * next milestone with its day, the situation, the order of work and its note. The Focus board's
 * Career banner draws all of them but the title.
 */
export type Career = {
    title: string;
    /** The one text of `goal:`, absent when the file gives none or an empty one. */
    goal?: string;
    /** The next milestone, the text of `milestone:`, absent when the file gives none. */
    milestone?: string;
    /**
     * The day of the next milestone, `milestone_date:` when it is a day written YYYY-MM-DD; absent
     * when it is not, and whenever the milestone is.
     */
    milestoneDate?: string;
    situation: { label: string; value: string }[];
    order: { task: string; when?: string; note?: string }[];
    orderNote?: string;
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
};
