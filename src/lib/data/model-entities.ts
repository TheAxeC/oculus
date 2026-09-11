// Layer 1, data. Raw source records and portfolio entities, with relations held as ids.
// This concern module keeps entity and source shapes together while model.ts remains the public facade.

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
 * The four generated feed files the command center reads a count and a run date out of. They are
 * hub-relative like every other path in the config: the inbox entry of `docs:`, `leads_file`,
 * `radar_file` and `linkedin_dir`.
 */
export type FeedFiles = {
    inbox: string;
    leads: string;
    radar: string;
    linkedin: string;
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
export type RawManifest = {
    [key: string]: unknown;
    /** Absolute path of the project.yml. */
    file: string;
    /**
     * Last write of the project.yml in milliseconds, and absent when it could not be stat'ed. It
     * is `fileMtime` rather than `mtime` because the record spreads the manifest's own keys and a
     * key called `mtime` in a project.yml would then be read as provenance.
     */
    fileMtime?: number;
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
};

/**
 * One entry of one registry as it was read, plus provenance. `key` is the entry's identity, taken
 * from the field that registry uses for it (`id` in venues, `key` in the other four); the original
 * field keeps its own name and value as well.
 */
export type RawRegistryEntry = {
    [key: string]: unknown;
    /** Which registry the entry came from. Not `source`: a dataset entry's own `source` is its URL. */
    registry: RegistryName;
    /** The entry's id, or the empty string when the registry's id field was missing or not a string. */
    key: Id;
    /** Absolute path of the registry file. */
    file: string;
};

/** The top-level keys of a registry file other than its entry list, returned untouched. */
export type RegistryMeta = Record<string, unknown>;

/** One registry as read: its entries in file order, and everything else the file held. */
export type RawRegistry = {
    entries: RawRegistryEntry[];
    meta: RegistryMeta;
};

/**
 * One entry of one collection as it was read. Every key the YAML map held is present untouched;
 * the reader adds only `provenance`. The entry's identity, its `key` when it has one and its `title`
 * otherwise, is left where it was read and is derived by O4, not here.
 */
export type RawEntry = {
    [key: string]: unknown;
    /** Absolute path of the collection file, and the entry's position in the file's entry list. */
    provenance: { file: string; index: number };
};

/**
 * One collection as read: the file it came from, its entries in file order, and every top-level
 * key other than its record list untouched as `meta` (`title`, `intro` and `schema` are the ones
 * the hub's collection files carry). Of the five files carried as both entities and collections,
 * data uses the `datasets:` record list and the other four use `entries:`.
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
    /** Last write of the file in milliseconds, and 0 for a document that is not there. */
    mtime: number;
};

/** A status chip: a word from the vocabulary, resolved to colour and glyph by the view. */
export type Chip = string;

/**
 * A project's code deposit, the `code_availability` map of a manifest. `status` is the word the
 * card's badge reads (`deposited`, `review-anon`, `none`); the rest is where the deposit lives.
 * The manifest's remaining keys under that map (the repo's description, homepage, topics and
 * visibility) are the deposit tool's and no view reads them, so they are not carried.
 */
export type CodeAvailability = {
    status?: string;
    date?: string;
    url?: string;
    doi?: string;
    repo?: string;
};

/** When the pipeline was last re-run to regenerate the committed numbers, and what that covered. */
export type Reproduced = {
    date?: string;
    note?: string;
};

/**
 * One of the fixed project documents, by presence only. The absolute path of DocPresence is not
 * carried: a view shows which documents a project has and asks the server for one by name.
 */
export type DocFlag = {
    name: string;
    present: boolean;
    /** Last write of the file in milliseconds, absent for a document that is not there. */
    mtime?: number;
};

/**
 * One standing "do this later" note, the manifest's `followup:` (manifest-schema.yml's
 * `followup.do` and `followup.after`). `after` is an ISO date the note is hidden until; a note
 * without one is always due.
 */
export type Followup = {
    do: string;
    after?: string;
};

/**
 * One line of a checklist, the `subtasks:` of a manifest or of a collection entry. `key` is what
 * the line is addressed by: the key of the map the manifest writes, or the position in the list
 * for a manifest that writes a list.
 */
export type Subtask = {
    key: string;
    do: string;
    deadline?: string;
    done: boolean;
    snooze?: string;
};

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
    /** `pin: true` floats the card to the top of its board. False and absent are both no pin. */
    pin?: boolean;
    /**
     * Whole days the newest of the project's documents is ahead of its own project.yml, so the
     * manifest is behind what the folder says. Absent when the manifest is the newer of the two,
     * which is a project with nothing to report. The threshold a badge is drawn at is
     * `stale_lag_days` of config/behavior.yml and is applied by the board, not here.
     */
    staleDays?: number;
    chips: Chip[];
    statusLine?: string;
    focus?: string;
    /** The flame badge of the Focus card: `high`, `med` or `low`, the `priority_levels` of vocab.yml. */
    priority?: string;
    eli5?: string;
    next?: string;
    latest?: string;
    results: string[];
    ideas: string[];
    deadline?: string;
    /**
     * Who the project is blocked on before it moves, the manifest's `waiting-on:`. An entry is a
     * key of the collaborations collection or a free name for somebody with no entry, and the two
     * are not told apart here: the Focus strip resolves what it can and shows the rest as written.
     */
    waitingOn: Id[];
    /** The `followup:` notes. One note, a map, or a list of either all reach here as a list. */
    followups: Followup[];
    /** An ISO date the project's own dates are hidden from the Focus ticker until. */
    snooze?: string;
    /** The `subtasks:` checklist, done lines included; what is still open is the board's question. */
    subtasks: Subtask[];
    doi?: string;
    outcome?: string;
    /** Where the headline results are produced: `hpc` or `local`. */
    compute?: string;
    codeAvailability?: CodeAvailability;
    reproduced?: Reproduced;
    /** Ids of other projects this one is related to. */
    relatedIds: Id[];
    venueId?: Id;
    fundingIds: Id[];
    datasetIds: Id[];
    programIds: Id[];
    domainIds: Id[];
    /** Keys of the `collaborations` collection. Not a relation table: the entries are not entities. */
    collaborators: Id[];
    /**
     * The free-text venue prose, for a manifest that names no `venue_id`. The manifest schema does
     * not name a `venue` key today, so a manifest carrying one is a finding and this is unset on
     * every project of the hub; it is here for the model to hold what the field means.
     */
    venue?: string;
    /** The six fixed project documents, in the order sources/docs.ts lists them, presence only. */
    docs: DocFlag[];
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
    /** A conference's next call, as an ISO date; a journal carries none. */
    deadline?: string;
    /** A conference's usual deadline month ("Sep"), for a call whose exact date is not out yet. */
    deadlineMonth?: string;
    /** A conference's usual event month ("Sep"). */
    heldMonth?: string;
    /** Free text describing the submission and event timing. */
    timing?: string;
    /** The current call-for-papers URL. */
    call?: string;
    /** The venue's contact address. */
    email?: string;
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
    /** An ISO date the scheme's own deadline is hidden from the Focus ticker until. */
    snooze?: string;
    /** The `followup:` notes of the scheme's entry, the same three shapes a manifest writes. */
    followups: Followup[];
    /** The `subtasks:` checklist of the scheme's entry. */
    subtasks: Subtask[];
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
