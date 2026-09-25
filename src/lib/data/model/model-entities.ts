// Layer 1, data. Raw source records and portfolio entities, with relations held as ids. This
// concern module keeps entity and source shapes together while data/model/index.ts is the facade.

export type Id = string;

/** One problem in one file, reported and carried; never thrown, never repaired by a source. */
export type Finding = {
    /** Absolute path of the file the problem is in. */
    file: string;
    /** The key, entry or folder the problem is about; empty when it is about the whole file. */
    key: string;
    message: string;
};

/** The six scan tiers, the basename of each `dir` in the scan rules. */
export type Tier = 'ideas' | 'active' | 'manuscripts' | 'software' | 'coauthor' | 'archive';

/** The seven registries, one per file readRegistries is given. */
export type RegistryName =
    'venues' | 'datasets' | 'pillars' | 'domains' | 'funding' | 'people' | 'organisations';

/**
 * The seven hub-relative registry paths, one per registry. Declared here, used by
 * sources/registries.
 */
export type RegistryFiles = {
    venues: string;
    datasets: string;
    pillars: string;
    domains: string;
    funding: string;
    people: string;
    organisations: string;
};

/** One entry of the `collections:` list in the layout config: a key and a hub-relative path. */
export type CollectionFile = {
    key: string;
    file: string;
};

/**
 * The three generated feed files the command center reads a count and a run date out of. They are
 * hub-relative like every other path in the config: `leads_file`, `radar_file` and `linkedin_dir`.
 */
export type FeedFiles = {
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
    /** True for a directory the hub need not have: absent, it is skipped rather than reported. */
    optional?: boolean;
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
    /** True only when the scan found a flat-tier folder with no project.yml. */
    ghost: boolean;
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
    /**
     * Which registry the entry came from. Not `source`: a dataset entry's own `source` is its URL.
     */
    registry: RegistryName;
    /**
     * The entry's id, or the empty string when the registry's id field was missing or not a string.
     */
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
 * One entry of one collection as it was read. Every key the YAML map held is present untouched; the
 * reader adds only `provenance`. The entry's identity, its `key` when it has one and its `title`
 * otherwise, is left where it was read and is derived by data/snapshot/normalise.ts, not here.
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
    /** The label the document control draws, distinct from its file name. */
    label: string;
    /** Absolute path the document would sit at, whether or not it is there. */
    path: string;
    present: boolean;
    /** A NOTES or DIARY document reserved for human edits. */
    human: boolean;
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
    label: string;
    present: boolean;
    human: boolean;
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

/** The status chip of a slide: the class its colour comes from, and the word it wears. */
export type PresentTag = {
    class?: string;
    text?: string;
};

/** One chip of a slide's spec strip. */
export type PresentSpec = {
    label: string;
    value: string;
};

/** The plain-language callout of a slide: what the work is for, and what it does in plain words. */
export type PresentEli5 = {
    purpose?: string;
    plain?: string;
};

/**
 * One visual of a slide. `figure` is a bare file name under the project's own `present/` folder and
 * the view resolves it through the file route; `diagramHtml` is inline markup the sanitiser
 * filters.
 */
export type PresentPanel = {
    figure?: string;
    diagramHtml?: string;
    caption?: string;
    explain?: string;
    /** The named figure is not in the folder, so the view draws the gap and not a dead image. */
    missing?: boolean;
};

/**
 * One slide a project owns, read from its PRESENT.md. `id` is the project's id for the front
 * matter's own `present:` slide and `<project>/<slug>` for an entry of its `slides:` list, which is
 * what the deck's `order`, `selection` and `slide_order` name a slide by.
 *
 * `equation` is either LaTeX the page typesets or the name of a rendered image; which one it is is
 * the value's own suffix, and data/sources/present.ts holds that rule. That reader resolves an
 * image against the disk, so the view draws `equationImage` and never chooses a folder. `body` is
 * the markdown under the front matter, which is the slide a project with no front matter draws.
 */
export type PresentSlide = {
    id: Id;
    /** The project the slide belongs to, which is what themes it and resolves its figures. */
    projectId: Id;
    tag?: PresentTag;
    title?: string;
    sub?: string;
    hook?: string;
    eli5?: PresentEli5;
    equation?: string;
    /**
     * Hub-relative path of the rendered equation image, when `equation` names one that is there.
     */
    equationImage?: string;
    /** The named equation image is in neither place it could be, so the view draws the gap. */
    equationMissing?: boolean;
    specs: PresentSpec[];
    panels: PresentPanel[];
    method: string[];
    results: string[];
    body?: string;
};

/**
 * The six kinds of slide the deck is made of; five are the deck's own, `project` is a project's.
 */
export type DeckKind = 'title' | 'framing' | 'project' | 'summary' | 'ideas' | 'closing';

/** One entry of the deck's `order:`. A `project` entry's `ref` is a PresentSlide id. */
export type DeckEntry = {
    slide: DeckKind;
    ref?: string;
};

/** One chip of a legend row: the words and the palette hue behind them. */
export type DeckChip = {
    label: string;
    /** A hue name from state/words/tones.ts, resolved from the colour the deck wrote. */
    tone: string;
};

/** The deck's own words: the opening slide, the closing slide and the legend between them. */
export type DeckMeta = {
    kicker?: string;
    titleHtml?: string;
    lede?: string;
    legend: DeckChip[];
    hint?: string;
    closingKicker?: string;
    closingTitleHtml?: string;
    closingLede?: string;
    contact?: string;
};

/** A research domain's hue and the words a slide of that domain wears. */
export type DeckTheme = {
    /** A hue name from state/words/tones.ts, resolved from the colour the deck wrote. */
    tone: string;
    label: string;
};

/** One numbered card of a framing slide. */
export type DeckCard = {
    n?: string;
    title?: string;
    body?: string;
};

/** A framing slide: a heading, a lede, up to three cards, a legend and a hint. */
export type DeckFraming = {
    title?: string;
    lede?: string;
    cards: DeckCard[];
    legend: DeckChip[];
    hint?: string;
};

/** One row of a summary table. */
export type DeckSummaryRow = {
    field?: string;
    /** A hue name from state/words/tones.ts, for the dot beside the field. */
    tone?: string;
    project?: string;
    mechanism?: string;
    headline?: string;
};

/** A cross-project summary slide. */
export type DeckSummary = {
    title?: string;
    rows: DeckSummaryRow[];
    foot?: string;
};

/** One card of the idea grid. */
export type DeckIdea = {
    title?: string;
    desc?: string;
    /** A hue name from state/words/tones.ts, for the dot on the head of the card. */
    tone?: string;
    maturity?: string;
};

/** The idea-grid slide. */
export type DeckIdeas = {
    title?: string;
    lede?: string;
    items: DeckIdea[];
    hint?: string;
};

/**
 * The deck of config/present.yml: the deck-level slides, the order they and the project slides are
 * shown in, and the two lists a saved arrangement writes. `selection` null means nothing has been
 * saved and every slide the order places is shown; `slideOrder` null means the order alone places
 * them.
 */
export type Deck = {
    meta: DeckMeta;
    themes: Record<string, DeckTheme>;
    order: DeckEntry[];
    framing: Record<string, DeckFraming>;
    summaries: Record<string, DeckSummary>;
    ideas: DeckIdeas | null;
    selection: string[] | null;
    slideOrder: string[] | null;
    /** Hub-relative folder the rendered equation images live in, for a slide naming one. */
    equationsDir: string;
    /** A hue name per `tag.class` a slide may wear, from the deck's `tag_tones`. */
    tagTones: Record<string, string>;
};

/**
 * One slide of the assembled deck: what kind it is, what it draws, and the key the saved selection
 * and order name it by. A `project` slide's key is its PresentSlide id; every other kind's is its
 * kind and its ref, so two framing slides are told apart.
 */
export type DeckSlide = {
    key: string;
    kind: DeckKind;
    ref?: string;
    /** Plain words naming the slide in the overview grid; the pane's title is the view's name. */
    title: string;
    /** The hue the slide is drawn in, from the deck's `themes` by the project's domain. */
    tone?: string;
};

/**
 * A project. The relation fields hold ids; data/snapshot/normalise.ts fills them from the
 * manifest's `venue_id`, `funding`, `datasets`, `pillar` and `domain` keys, and leaves them empty
 * when it has none.
 */
export type Project = {
    id: Id;
    tier: Tier;
    /** A discovered folder that has no project.yml. */
    ghost: boolean;
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
    /**
     * The flame badge of the Focus card: `high`, `med` or `low`, the `priority_levels` of
     * vocab.yml.
     */
    priority?: string;
    eli5?: string;
    next?: string;
    latest?: string;
    results: string[];
    ideas: string[];
    deadline?: string;
    /**
     * What the project waits for before it moves, the manifest's `waiting-on:`. An entry is a key
     * of the people registry or the id of another project, and nothing else; validate
     * reports a value that is neither, and the Focus strip draws each by the name it resolves to.
     */
    waitingOn: Id[];
    /** The `followup:` notes. One note, a map, or a list of either all reach here as a list. */
    followups: Followup[];
    /** An ISO date the project's own dates are hidden from the Focus ticker until. */
    snooze?: string;
    /**
     * The `subtasks:` checklist, done lines included; what is still open is the board's question.
     */
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
    pillarIds: Id[];
    domainIds: Id[];
    /**
     * Keys of the people registry; the `projectPerson` table holds the same pairs from the other
     * side.
     */
    collaborators: Id[];
    /**
     * The free-text venue prose, for a manifest that names no `venue_id`. The manifest schema does
     * not name a `venue` key today, so a manifest carrying one is a finding and this is unset on
     * every project of the hub; it is here for the model to hold what the field means.
     */
    venue?: string;
    /** The four fixed project documents, in the order sources/docs.ts lists them, presence only. */
    docs: DocFlag[];
    /**
     * The slides of the project's PRESENT.md, in the order the file declares them. Absent for a
     * project that has no PRESENT.md, which is most of the hub, so the wire carries the key only
     * where there is something to draw.
     */
    present?: PresentSlide[];
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
    /**
     * Indexing and cost are prose in the registry ("free (subscription)"), never flags. An indexing
     * field that opens with a check or a cross mark carries the rest of its words here and the mark
     * as `wosMark` or `scopusMark`, read by data/snapshot/indexing.ts.
     */
    wos?: string;
    wosMark?: 'yes' | 'no';
    scopus?: string;
    scopusMark?: 'yes' | 'no';
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
    /**
     * How the dataset is fetched: a map of `method`, `notes` and per-dataset keys, carried as read.
     */
    retrieval?: Record<string, unknown>;
    hpcPath?: string;
    /** The dataset registry's own theme words (`ecg`, `single-cell`), which are not domain keys. */
    themes: string[];
    /**
     * Projects that name this dataset; data/snapshot/normalise.ts fills it from the other side of
     * the relation.
     */
    projectIds: Id[];
};

/** A pillar from registries/pillars.yml. */
export type Pillar = {
    id: Id;
    title: string;
    color?: string;
    kind?: string;
    goal?: string;
    blurb?: string;
    /**
     * Funding schemes reached through the projects on this line; pillars.yml holds no funding key.
     */
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
 * One human, from registries/people.yml. It is the entity a manifest's `collaborators:`, a joint
 * work's `person:` and a `waiting-on:` value name, so a person's name is written once and every
 * surface that draws one reads it here.
 *
 * `affiliations` are keys of the organisation registry rather than the organisations themselves,
 * which is what keeps the pair JSON-safe: a person points at organisations and an organisation
 * lists its people, and neither holds the other resolved. A person holds more than one because a
 * clinician belongs to the university and to the hospital alike, and the first is the one a single
 * line draws.
 */
export type Person = {
    id: Id;
    name: string;
    /** Keys of organisations.yml entries, the primary first, and empty for a person with none. */
    affiliations: Id[];
    /** What the person is to this hub in its own words: co-supervisor, co-author, student. */
    role?: string;
    orcid?: string;
    email?: string;
    links: string[];
    /** A student's supervision folder, hub-relative, whose files the Person view lists. */
    folder?: string;
    /** True on the one entry that is the hub's owner; absent on every other. */
    self?: boolean;
    /**
     * Projects whose `collaborators:` name this person; filled from the other side of the relation.
     */
    projectIds: Id[];
    /** Entries of the joint-work collection whose `person:` is this key, by entry id. */
    jointWorkIds: Id[];
};

/**
 * One organisation, from registries/organisations.yml. A person's `affiliations:` and a funding
 * scheme's `funder:` are keys into it, so a university, a hospital or a funder is named once and
 * spelled the same way wherever it is drawn.
 */
export type Organisation = {
    id: Id;
    name: string;
    /** One of `university`, `hospital`, `funder`, `company` and `other`; validate checks it. */
    kind?: string;
    country?: string;
    links: string[];
    /** People whose `affiliations:` name this key. */
    personIds: Id[];
    /** Funding schemes whose `funder:` is this key. */
    fundingIds: Id[];
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
    /** Key of an organisations.yml entry: who funds the scheme. */
    funder?: Id;
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
    pillarIds: Id[];
};

/**
 * One entry of one collection, as data/snapshot/normalise.ts fills it from a RawEntry. `id` is the
 * entry's `key` when the YAML had one and its `title` otherwise, so it is unique inside its
 * collection and nowhere wider. `fields` holds every key the YAML had, `title` and `key` included,
 * so a view can render a collection from its file's own `schema` without the model naming each
 * field.
 */
