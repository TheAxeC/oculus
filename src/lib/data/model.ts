// Layer 1, data. The types and nothing else: no imports, no logic, no defaults.
// Two families live here. The Raw* records are what a source returns: the YAML as it was read,
// plus provenance saying which file it came from. The entities are what O4's normalise step
// produces from them, and they carry the ids of their relations, never resolved objects, so a
// project pointing at its funding and the funding pointing back cannot make a cycle in JSON.

/** Every entity is identified by a string. A project's is its folder name, a registry's its key. */
export type Id = string;

/** One problem in one file, reported and carried; never thrown, never repaired by a source. */
export type Finding = {
    /** Absolute path of the file the problem is in. */
    file: string;
    /** The key, entry or folder the problem is about; empty when it is about the whole file. */
    key: string;
    message: string;
};

/** The five scan tiers, the basename of each `dir` in the scan rules. */
export type Tier = 'ideas' | 'active' | 'manuscripts' | 'coauthor' | 'archive';

/** The five registries, one per file readRegistries is given. */
export type RegistryName = 'venues' | 'datasets' | 'programs' | 'domains' | 'funding';

/** The five hub-relative registry paths, one per registry. Declared here, used by sources/registries. */
export type RegistryFiles = {
    venues: string;
    datasets: string;
    programs: string;
    domains: string;
    funding: string;
};

/** One entry of the `collections:` list in the layout config: a key and a hub-relative path. */
export type CollectionFile = {
    key: string;
    file: string;
};

/**
 * One scan rule, the shape of an entry under `scan:` in the layout config.
 * A flat rule (no `nested`) reads `<hub>/<dir>/<name>/project.yml` and gives every manifest the
 * rule's `type`. A nested rule walks `<hub>/<dir>` to any depth and takes `type` from the manifest.
 */
export type ScanRule = {
    /** Hub-relative directory, `projects/ideas`. */
    dir: string;
    /** The type every manifest under a flat rule gets. Absent on a nested rule. */
    type?: string;
    /** True for the tiers whose projects sit under free-form filing folders. */
    nested?: boolean;
};

/**
 * A project.yml as it was read, plus provenance. Every key the YAML held is present untouched,
 * except that the provenance names below are set by the reader: `id` is the folder's basename and
 * the manifest's own `id` is kept as `manifestId`, and `type` on a flat tier comes from the rule.
 * A disagreement between either pair is a finding, never a repair.
 */
export interface RawManifest {
    [key: string]: unknown;
    /** Absolute path of the project.yml. */
    file: string;
    /** Folder of the project relative to the hub, `projects/coauthor/active/clinical-hccnet`. */
    folder: string;
    /** The folder's basename, which is the project's id. */
    id: Id;
    tier: Tier;
    /** The first folder under the tier directory, on nested rules only: `published`, `nogo`. */
    category?: string;
    /** From the scan rule on a flat tier, from the manifest itself on a nested one. */
    type?: string;
    /** The manifest's own `id` value, exactly as read, whatever its type. */
    manifestId?: unknown;
}

/**
 * One entry of one registry as it was read, plus provenance. `key` is the entry's identity, taken
 * from the field that registry uses for it (`id` in venues, `key` in the other four); the original
 * field keeps its own name and value as well.
 */
export interface RawRegistryEntry {
    [key: string]: unknown;
    /** Which registry the entry came from. Not `source`: a dataset entry's own `source` is its URL. */
    registry: RegistryName;
    /** The entry's id, or the empty string when the registry's id field was missing or not a string. */
    key: Id;
    /** Absolute path of the registry file. */
    file: string;
}

/** The top-level keys of a registry file other than its entry list, returned untouched. */
export type RegistryMeta = Record<string, unknown>;

/** One registry as read: its entries in file order, and everything else the file held. */
export type RawRegistry = {
    entries: RawRegistryEntry[];
    meta: RegistryMeta;
};

/**
 * One entry of one collection as it was read. Every key the YAML map held is present untouched;
 * the reader adds only `source`. The entry's identity, its `key` when it has one and its `title`
 * otherwise, is left where it was read and is derived by O4, not here.
 */
export interface RawEntry {
    [key: string]: unknown;
    /** Absolute path of the collection file, and the entry's position in the file's entry list. */
    source: { file: string; index: number };
}

/**
 * One collection as read: the file it came from, its entries in file order, and every top-level
 * key other than `entries` untouched as `meta` (`title`, `intro` and `schema` are the ones the
 * hub's eight collection files carry).
 */
export type RawCollection = {
    /** The key the caller asked for the file under, from the `collections:` list. */
    key: string;
    /** Absolute path of the collection file. */
    file: string;
    meta: Record<string, unknown>;
    entries: RawEntry[];
};

/** Whether one of the fixed project documents is on disk, by existence only; nothing is read. */
export type DocPresence = {
    /** Folder-relative path, one of the fixed list in sources/docs.ts. */
    name: string;
    /** Absolute path the document would sit at, whether or not it is there. */
    path: string;
    present: boolean;
};

/** A status chip: a word from the vocabulary, resolved to colour and glyph by the view. */
export type Chip = string;

/**
 * A project. The relation fields hold ids; O4 fills them from the manifest's `venue_id`,
 * `funding`, `datasets`, `program` and `domain` keys, and leaves them empty when it has none.
 */
export type Project = {
    id: Id;
    tier: Tier;
    category?: string;
    type?: string;
    title: string;
    short?: string;
    lead?: string;
    /** A list of names in most manifests and one free-text line in seven of them; both are kept. */
    authors?: string | string[];
    year?: number;
    chips: Chip[];
    statusLine?: string;
    focus?: string;
    eli5?: string;
    next?: string;
    latest?: string;
    results: string[];
    ideas: string[];
    deadline?: string;
    doi?: string;
    outcome?: string;
    /** Ids of other projects this one is related to. */
    relatedIds: Id[];
    venueId?: Id;
    fundingIds: Id[];
    datasetIds: Id[];
    programIds: Id[];
    domainIds: Id[];
    /** Folder relative to the hub, and the manifest's absolute path. */
    folder: string;
    file: string;
};

/** A venue from registries/venues.yml. Its id field in the file is `id`, not `key`. */
export type Venue = {
    id: Id;
    name: string;
    short?: string;
    tier?: string;
    category?: string;
    /** Text, not a number: the registry writes "5.9" and "~1.8" alike. */
    jif?: string;
    quartile?: string;
    /** Indexing and cost are prose in the registry ("free (subscription)"), never flags. */
    wos?: string;
    scopus?: string;
    free?: string;
    format?: string;
    wants?: string;
    link?: string;
    /** The venue registry's own theme words (`core-ml`, `clinical`), which are not domain keys. */
    themes: string[];
};

/** A dataset from registries/data.yml, whose entry list is under `datasets`. */
export type Dataset = {
    id: Id;
    name: string;
    modality?: string;
    description?: string;
    size?: string;
    access?: string;
    source?: string;
    /** How the dataset is fetched: a map of `method`, `notes` and per-dataset keys, carried as read. */
    retrieval?: Record<string, unknown>;
    hpcPath?: string;
    /** The dataset registry's own theme words (`ecg`, `single-cell`), which are not domain keys. */
    themes: string[];
    /** Projects that name this dataset; filled by O4 from the other side of the relation. */
    projectIds: Id[];
};

/** A research line from registries/programs.yml. */
export type Program = {
    id: Id;
    title: string;
    kind?: string;
    goal?: string;
    blurb?: string;
    /** Funding schemes reached through the projects on this line; programs.yml holds no funding key. */
    fundingIds: Id[];
    projectIds: Id[];
};

/** A domain from registries/domains.yml. */
export type Domain = {
    id: Id;
    title: string;
    blurb?: string;
    projectIds: Id[];
};

/**
 * A funding scheme from funding/funding.yml. Its `key` is optional in that file by design, where
 * it is the cross-link anchor manifests name; an entry without one has no relations to resolve.
 */
export type Funding = {
    id: Id;
    title: string;
    sub?: string;
    status?: string;
    date?: string;
    deadline?: string;
    note?: string;
    /** The verbatim funder acknowledgment a manuscript pastes. */
    statement?: string;
    link?: string;
    url?: string;
    tags: string[];
    projectIds: Id[];
    programIds: Id[];
};

/**
 * One entry of one collection, as O4 fills it from a RawEntry. `id` is the entry's `key` when the
 * YAML had one and its `title` otherwise, so it is unique inside its collection and nowhere wider.
 * `fields` holds every key the YAML had, `title` and `key` included, so a view can render a
 * collection from its file's own `schema` without the model naming each field.
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
 * One collection: a hub file of like records that are not entities and that nothing else points
 * at. Its entries are held inline rather than by id, since an entry belongs to exactly one
 * collection and no relation runs the other way, so no cycle can form.
 */
export type Collection = {
    /** The key from the `collections:` list, `funding` or `events`. */
    id: Id;
    title: string;
    intro?: string;
    /** Absolute path of the collection file. */
    file: string;
    entries: Entry[];
};

/**
 * Everything the sources read, before anything is validated or resolved. This is what validate
 * reads and what normalise turns into the snapshot; the findings are the ones the sources
 * themselves reported, carried so that validate can pass them through rather than re-derive them.
 */
export type RawPortfolio = {
    manifests: RawManifest[];
    registries: Record<RegistryName, RawRegistry>;
    collections: Record<string, RawCollection>;
    findings: Finding[];
};

/**
 * The controlled vocabularies validate checks values against, each a list of the allowed words.
 * `types` is a manifest's `type`, `statuses` a collection entry's `status`. `chips` is absent when
 * the config holds no chip vocabulary, and chips are then free strings and are not checked.
 */
export type Vocabulary = {
    types: string[];
    statuses: string[];
    chips?: string[];
};

/**
 * What validate needs and nothing more. `schema` is the config's `manifest_schema` value, taken
 * unparsed because its shape is the config's business: validate reads the field names out of it.
 */
export type ValidationRules = {
    schema: unknown;
    vocab: Vocabulary;
};

/** Everything buildPortfolio needs: where to read, and what to check what it read against. */
export type PortfolioConfig = {
    scan: ScanRule[];
    registries: RegistryFiles;
    collections: CollectionFile[];
    schema: unknown;
    vocab: Vocabulary;
};

/** The entities of one snapshot, each kind keyed by its own id. */
export type Entities = {
    projects: Record<Id, Project>;
    venues: Record<Id, Venue>;
    datasets: Record<Id, Dataset>;
    programs: Record<Id, Program>;
    domains: Record<Id, Domain>;
    funding: Record<Id, Funding>;
    collections: Record<Id, Collection>;
};

/**
 * The relation tables, each a list of `[from, to]` id pairs sorted by the pair. They hold what the
 * entities' own id fields hold, from the other side: a table is what a join reads, an entity's id
 * list is what a card reads, and both come from the same pass so they cannot disagree.
 */
export type Relations = {
    projectVenue: [Id, Id][];
    projectFunding: [Id, Id][];
    projectDataset: [Id, Id][];
    projectProgram: [Id, Id][];
    projectDomain: [Id, Id][];
    projectRelated: [Id, Id][];
    fundingProgram: [Id, Id][];
};

/**
 * What goes over the wire (DESIGN.md, "Normalise"). Flat, JSON-safe and small: no value in it is
 * anything but a string, a number, a boolean, null, a list or a plain object, so it survives
 * JSON.stringify and JSON.parse unchanged. `version` increments on every rebuild.
 */
export type Snapshot = {
    version: number;
    entities: Entities;
    relations: Relations;
    findings: Finding[];
};

/**
 * One message on the socket (DESIGN.md, "The socket"). The types of the wire live here with the
 * snapshot because both halves of layer 2 need them and the boundary table lets `state/` import
 * `data/model` and nothing else of `data/`.
 */
export type Message = {
    channel: string;
    /** The channel's version, 1 on the first publish and one higher on each later one. */
    version: number;
    payload: unknown;
};

/** The one message a client sends: the channels it wants. */
export type Subscription = {
    type: 'subscribe';
    channels: string[];
};

/** The payload of the `config` channel: the merged map, the flat catalog, and what was wrong. */
export type ConfigPayload = {
    config: Record<string, unknown>;
    text: Record<string, string>;
    findings: Finding[];
};
