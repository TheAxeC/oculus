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
    /** Which registry the entry came from. */
    source: RegistryName;
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
    authors?: string;
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
    jif?: number;
    quartile?: string;
    wos?: boolean;
    scopus?: boolean;
    free?: boolean;
    format?: string;
    wants?: string;
    link?: string;
    domainIds: Id[];
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
    retrieval?: string;
    hpcPath?: string;
    domainIds: Id[];
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
