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
 * `metalist` in the hub's seven files); a type a view does not know is drawn as text.
 */
export type SchemaField = {
    field: string;
    type: string;
    /** The words over the field, when the file gives it words other than its own name. */
    label?: string;
    /** The allowed values of a `select`. */
    options?: string[];
    required?: boolean;
    help?: string;
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
    /**
     * The file's own `schema:`, absent when the file has none and when what it has is not a list
     * of field maps; validate.ts reports the second case as a finding.
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
 * What the four feed files say and nothing more: a count, a run date, the live leads. A feed whose
 * file or folder is not there is null rather than empty, because "nothing to report" and "no feed
 * on this machine" are different answers and the board says so. The feeds are generated, so a
 * missing one is not a finding; a broken one is.
 *
 * `scout` is the position scout's own run date, which lives in the leads file's `meta.log` rather
 * than in a file of its own, so it is null exactly when `leads` is.
 */
export type Feeds = {
    inbox: { run: string | null; actionable: number } | null;
    leads: Lead[] | null;
    radar: { lastRun: string | null } | null;
    scout: { lastRun: string | null } | null;
    linkedin: { lastPost: string | null } | null;
};

/** What sources/feeds.ts returns. It is already JSON-safe, so the snapshot carries it unchanged. */
export type RawFeeds = Feeds;

/**
 * One host of the CAREER.yml pipeline. `scores` holds the file's own scoring keys, every key of
 * the host that is not one of the five named above it, so that `career_score_dims` decides which
 * of them a chip is drawn for and this model names none of them.
 */
export type Host = {
    name: string;
    inst?: string;
    tag?: string;
    status: string;
    scores: Record<string, string>;
    /** The prose under the row, with the `[proposal: ...]` prefix the chips already show removed. */
    note?: string;
};

/** The career strategy of CAREER.yml, as the panel at the foot of the Focus board reads it. */
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

export type RawPortfolio = {
    manifests: RawManifest[];
    registries: Record<RegistryName, RawRegistry>;
    collections: Record<string, RawCollection>;
    /** What the four feed files hold, from sources/feeds.ts. */
    feeds: RawFeeds;
    /** CAREER.yml as it was parsed, and null when the hub holds no such file. */
    career: Record<string, unknown> | null;
    /**
     * Which documents each project folder holds, by project id, from sources/docs.ts. It is here
     * rather than on the manifest record because no manifest key says it: it is read from the
     * folder, and a reader that put it on the record would be adding a key no schema names.
     */
    docs: Record<Id, DocPresence[]>;
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
    /**
     * The keys of `career_host_status`. Absent when the config holds no such vocabulary, and a host
     * status is then a free string and is not checked, which is how `chips` above behaves.
     */
    hostStatuses?: string[];
};

/**
 * What validate needs and nothing more. `schema` is the config's `manifest_schema` value, taken
 * unparsed because its shape is the config's business: validate reads the field names out of it.
 */
export type ValidationRules = {
    schema: unknown;
    vocab: Vocabulary;
    /**
     * Absolute path of the career file, so a finding about a host status can name the file it is
     * in. The raw career record is the parsed map alone and carries no provenance of its own.
     */
    careerFile?: string;
};

/** Everything buildPortfolio needs: where to read, and what to check what it read against. */
export type PortfolioConfig = {
    scan: ScanRule[];
    registries: RegistryFiles;
    collections: CollectionFile[];
    /** The four generated feed files, hub-relative. */
    feeds: FeedFiles;
    /** The career file, hub-relative. */
    career: string;
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
    /** What the generated feeds say, which is a summary rather than a set of entities. */
    feeds: Feeds;
    /** The career strategy, and null when the hub holds no career file. */
    career: Career | null;
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

/**
 * The subscribe message a client sends: the channels it wants, and the write token when the page has
 * one. A socket that carried the token may send terminal input on a `pty:` channel; a socket without
 * it reads every channel and writes to none (DESIGN.md, "Auth").
 */
export type Subscription = {
    type: 'subscribe';
    channels: string[];
    token?: string;
};

/** The payload of the `config` channel: the merged map, the flat catalog, and what was wrong. */
export type ConfigPayload = {
    config: Record<string, unknown>;
    text: Record<string, string>;
    findings: Finding[];
};

// ------------------------------------------------------------------ sessions
// The session record and the tree it is grouped into. They live here with the snapshot because
// they go over the socket the same way, and because the boundary table lets `state/` import
// `data/model` and nothing else of `data/`. Every type below is JSON-safe.

/** Which agent wrote the transcript a record was folded from. */
export type SessionTool = 'claude' | 'codex';

/** One file the session touched, with the tool that last touched it and when. */
export type SessionFile = {
    path: string;
    /** The name of the tool that last touched the path, `Edit` or `FileChange`. */
    tool: string;
    count: number;
    last: string | null;
};

/** One subagent the session dispatched. */
export type SessionAgent = {
    /** The tool-use id on a Claude transcript, the agent's path on a Codex rollout. */
    id: string;
    description: string;
    subagentType: string;
    model: string | null;
    started: string | null;
    ended: string | null;
    /** `running`, `done` or `error`. */
    status: string;
    /** Length of the result the agent came back with, in characters. */
    resultChars: number;
};

/** One thing that happened, for the timeline: `prompt`, `tool`, `edit`, `turn`, `bust`, `compaction`. */
export type SessionEvent = {
    ts: string | null;
    kind: string;
    text: string;
};

/**
 * The call one `tool` turn is about. `id` is the transcript's own `tool_use_id`, which is what pairs
 * the call with its result; the result may be read in a later tail read, so the id travels with the
 * turn rather than being resolved away on the server. `ok` is null while the call is still out.
 */
export type TurnTool = {
    id: string;
    name: string;
    summary: string;
    ok: boolean | null;
};

/**
 * One turn of a session's conversation, as the transcript view draws it. `html` is the rendered
 * Markdown of an assistant turn and the empty string on every other role; `text` is capped and `cut`
 * says the cap applied. A `tool` turn carries `tool` and nothing in `text`.
 */
export type Turn = {
    at: string | null;
    role: 'user' | 'assistant' | 'tool';
    text: string;
    html: string;
    cut: boolean;
    tool: TurnTool | null;
};

/** Lifetime token sums over the whole transcript. Never the context occupancy. */
export type SessionTokens = {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    thinking: number;
};

/** The prompt cache's window: its TTL, when it was last written and read, and how often it broke. */
export type SessionCache = {
    ttl: string | null;
    lastCreation: string | null;
    lastRead: string | null;
    busts: number;
};

/**
 * One event a `Notification` or `Stop` hook posted for a session. `kind` is Claude Code's
 * `notification_type` (`permission_prompt`, `idle_prompt`, ...) and is absent on a Stop event; `at`
 * is when the server received it, not a timestamp Claude Code sent.
 */
export type HookEvent = {
    session: string;
    event: 'notification' | 'stop';
    kind?: string;
    message?: string;
    title?: string;
    cwd?: string;
    at: string;
};

/**
 * One session, folded from one transcript. The live fields (`live`, `liveStatus`, `pid`,
 * `registryName`, `hidden`, and `state` when the registry has an opinion) come from the registry
 * or the process probe, not from the file; a bare read leaves them at the not-live defaults.
 */
export type SessionRecord = {
    id: Id;
    /** Absolute path of the transcript or rollout. */
    path: string;
    /** The store folder the file sits in: the project slug for Claude, the date folder for Codex. */
    slug: string;
    tool: SessionTool;
    cwd: string | null;
    branch: string | null;
    title: string;
    lastPrompt: string;
    model: string | null;
    effort: string | null;
    permissionMode: string | null;
    version: string | null;
    entrypoint: string | null;
    started: string | null;
    lastActivity: string | null;
    /** `working`, `idle`, `ended`, `unknown`, or whatever else the registry reports. */
    state: string;
    live: boolean;
    liveStatus: string | null;
    pid: number | null;
    registryName: string | null;
    hidden: boolean;
    prompts: number;
    messages: number;
    tokens: SessionTokens;
    /** What the model carried on the last turn, which is what a context meter measures. */
    contextTokens: number;
    /**
     * The cache read of that same last turn. The share of the window that came out of the cache is
     * this over contextTokens; the lifetime sum in `tokens.cacheRead` is a different measurement
     * and divides into a percentage in the tens of thousands.
     */
    lastCacheRead: number;
    /** The model's context window when the transcript states it; Codex does, Claude does not. */
    contextWindow: number | null;
    cache: SessionCache;
    /** Tool name to the number of times it was called. */
    tools: Record<string, number>;
    files: SessionFile[];
    agents: SessionAgent[];
    timeline: SessionEvent[];
    /** True when the file was too large for a first read and nothing was folded. */
    truncated: boolean;
    /**
     * The latest Notification or Stop hook this session posted, or null before one arrives or after
     * server/sessions/hooks.ts's HookStore has let it expire. A bare fold (finish() in record.ts)
     * always leaves this null; server/sessions/index.ts's sessions() is what merges the store in.
     */
    hook: HookEvent | null;
};

/** One entry of Claude Code's session registry, for a session whose process is running. */
export type LiveEntry = {
    /** Null for Codex, which keeps no registry and whose liveness comes from a process probe. */
    pid: number | null;
    status: string;
    name: string;
    kind: string;
    entrypoint: string;
    cwd: string;
    startedAt: number;
};

/** One area a session also scored on, below the one it was filed under. */
export type SecondaryArea = {
    key: string;
    short: string;
};

/** A session as grouping files it: the record, plus where it landed and how it got there. */
export type GroupedSession = SessionRecord & {
    /** Absolute path of the workspace, empty for a record with no cwd. */
    workspace: string;
    /** Absolute path of the area, or `<workspace>/(general)` when nothing scored. */
    area: string;
    secondaryAreas: SecondaryArea[];
    /** `attached` when oculus drives the session, `observed` when it only reads its transcript. */
    kind: string;
    /** True when an override pinned the area rather than the score choosing it. */
    pinned: boolean;
};

/** One area inside a workspace: the project the sessions in it are working on. */
export type Area = {
    /** Absolute path of the area. */
    key: string;
    /** The area's path relative to its workspace, which is what a label shows. */
    short: string;
    /** The project's title when the area is a known project folder, the short label otherwise. */
    full: string;
    known: boolean;
    lastActivity: string | null;
    sessions: GroupedSession[];
};

/** One workspace: the checkout the sessions in it are sitting in. */
export type Workspace = {
    /** Absolute path of the workspace, empty for the unknown workspace. */
    key: string;
    name: string;
    lastActivity: string | null;
    areas: Area[];
};

/** The payload of the `sessions` channel: every record, the tree they group into, the terminals. */
export type SessionsPayload = {
    records: SessionRecord[];
    workspaces: Workspace[];
    /** Every tmux session oculus started, so a terminal appears on the page as soon as it exists. */
    terminals: Terminal[];
};

// ------------------------------------------------------------------ terminals
// The tmux side of DESIGN.md's "PTY": one record per tmux session oculus started, and the three
// messages the `pty:<id>` channel carries. JSON-safe like everything above, so the bytes of a pane
// travel as base64 rather than as a string that a lone surrogate could break.

/** What a terminal pane runs (DESIGN.md, decision of 2026-09-10 on the three things it runs). */
export type TerminalKind = 'claude' | 'codex' | 'shell';

/**
 * Which agent session a terminal continues. A terminal started fresh carries none; one started by
 * the resume action carries the tool it was resumed with and that session's own id, which is what
 * `claude --resume <id>` and `codex resume <id>` were given.
 */
export type TerminalResume = {
    tool: 'claude' | 'codex';
    id: string;
};

/** One tmux session oculus started, as `tmux list-sessions` reports it. */
export type Terminal = {
    /** The session name without the `oculus-` prefix; the `pty:<id>` channel is named from it. */
    id: string;
    /** What to call it on the page. The id when the starter named nothing. */
    name: string;
    kind: TerminalKind;
    /** The pane's current directory. */
    cwd: string;
    /** The pane's current command, which is what tmux reports is running right now. */
    command: string;
    /** The pane's process id, for a page that wants to show it. Zero when tmux reported none. */
    pid: number;
    /** When the session was created, as an ISO instant. */
    created: string;
    /** Whether any client (oculus or a terminal window) is attached to the tmux session. */
    attached: boolean;
    /** The session this terminal continues, or null when it continues nothing. */
    resumes: TerminalResume | null;
};

/** The payload of a `pty:<id>` message: a chunk of pane output, or the scrollback, as base64. */
export type PtyPayload = {
    bytes: string;
};

/** Keystrokes from the page, as base64 of the UTF-8 bytes xterm.js produced. */
export type TerminalInput = {
    type: 'input';
    channel: string;
    bytes: string;
};

/** The page's terminal was resized, so the tmux window follows it. */
export type TerminalResize = {
    type: 'resize';
    channel: string;
    cols: number;
    rows: number;
};

// ------------------------------------------------------------------ git
// The read-only git state of a workspace, as server/git.ts produces it and the `git` channel
// carries it. JSON-safe like everything above.

/** One path git reported, with the line counts when the worktree diff has them. */
export type GitEntry = {
    path: string;
    /** git's own letter: `M`, `A`, `D`, `R`, `C`, or `?` for an untracked path. */
    status: string;
    /** Null where git reported a binary file, and 0 where no count applies. */
    added: number | null;
    deleted: number | null;
};

/** One workspace's git state. Every field is filled, `error` saying why when the rest is empty. */
export type GitState = {
    /** The branch name, `HEAD` when nothing is checked out, empty when git said nothing. */
    branch: string;
    ahead: number;
    behind: number;
    detached: boolean;
    staged: GitEntry[];
    unstaged: GitEntry[];
    untracked: GitEntry[];
    error: string | null;
};

/** The payload of the `git` channel: one state per workspace root. */
export type GitPayload = Record<string, GitState>;
