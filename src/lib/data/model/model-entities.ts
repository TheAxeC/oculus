// Layer 1, data. Raw source records and portfolio entities, with relations held as ids. This
// concern module keeps entity and source shapes together while data/model/index.ts is the facade.

export type Id = string;

/**
 * A record that says which hub it was read from: the key of the `roots:` entry marked `hub: true`
 * for a record of a hub other than the first, `hub` for one of the first hub when the portfolio
 * holds more than one hub, and nothing for a record of a portfolio of one hub. Absent is read as
 * `hub` (`rootOf` of data/helpers/hub-names.ts).
 */
export type Rooted = { root?: string };

/** One problem in one file, reported and carried; never thrown, never repaired by a source. */
export type Finding = {
    /** Absolute path of the file the problem is in. */
    file: string;
    /** The key, entry or folder the problem is about; empty when it is about the whole file. */
    key: string;
    message: string;
    /** The line of the file the problem is on, counted from 1, when the check knows it. */
    line?: number;
};

/** The seven scan tiers, the basename of each `dir` in the scan rules. */
export type Tier =
    'ideas' | 'active' | 'manuscripts' | 'software' | 'coauthor' | 'archive' | 'side-projects';

/** The eight registries, one per file readRegistries is given. */
export type RegistryName =
    | 'venues'
    | 'datasets'
    | 'pillars'
    | 'domains'
    | 'funding'
    | 'people'
    | 'organisations'
    | 'resources';

/**
 * The eight hub-relative registry paths, one per registry. Declared here, used by
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
    resources: string;
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
 * the manifest's own `id` is kept as `manifestId`, and `type` on a flat tier comes from the rule
 * while the manifest's own differing `type` is kept as `typeWritten`. A disagreement of `id` is a
 * finding and one of `type` is the Audit's, never a repair.
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
    /** The manifest's own `type` on a flat tier when it differs from the rule's, else absent. */
    typeWritten?: string;
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
 * One run of a document of oculus's own as api/docs answers it: HTML to draw as prose, or one
 * diagram of `docs/diagrams/` by its file name without `.svg`, with the alternative text the
 * document gives it.
 */
export type DocPart =
    { kind: 'html'; html: string } | { kind: 'diagram'; name: string; alt: string };

/**
 * One heading of a rendered Markdown document, in document order: its level (1 to 6), its words as
 * the author wrote them, and the id the render gave it, which a link to the heading names.
 */
export type RenderedHeading = { level: number; text: string; id: string };

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
 * One visual of a slide. `figure` is the file name as the slide wrote it and `src` the address the
 * file route answers it at, which is absent for a figure the deck's root does not hold;
 * `diagramHtml` is inline markup the sanitiser filters.
 */
export type PresentPanel = {
    figure?: string;
    src?: string;
    diagramHtml?: string;
    caption?: string;
    explain?: string;
    /** The named figure is not in the folder, so the view draws the gap and not a dead image. */
    missing?: boolean;
};

/**
 * The rich project slide, read from the front matter of a `kind: project` slide of a deck.
 * `equation` is LaTeX the page typesets; a value that names an image is a finding and is not kept
 * (data/sources/deck/project.ts). `body` is the Markdown under the front matter, which is what a
 * project slide with no rich key draws. `mechanism` and `headline` are what a summary row of
 * another deck reads from it.
 */
export type PresentSlide = {
    tag?: PresentTag;
    title?: string;
    sub?: string;
    hook?: string;
    eli5?: PresentEli5;
    equation?: string;
    specs: PresentSpec[];
    panels: PresentPanel[];
    method: string[];
    results: string[];
    body?: string;
    mechanism?: string;
    headline?: string;
};

/** The kinds a slide of a deck is, from the `kind:` of its front matter or computed by the deck. */
export type SlideKind =
    | 'title'
    | 'section'
    | 'text'
    | 'image'
    | 'columns'
    | 'equation'
    | 'code'
    | 'closing'
    | 'project'
    | 'idea'
    | 'summary'
    | 'grid';

/** One numbered card of a section slide. */
export type DeckCard = {
    n: string;
    title: string;
    body: string;
};

/** One card of the idea grid and the one slide of an `idea` kind. */
export type DeckIdeaCard = {
    name: string;
    desc: string;
    /** The project's `domain:` key, which the card's colour and words are read from. */
    domain?: string;
    /** The status chip of the project that says how far the idea is. */
    maturity?: string;
};

/** One row of a summary table. */
export type DeckSummaryRow = {
    /** The project's `domain:` key; the field is that domain's label. */
    domain?: string;
    project: string;
    mechanism: string;
    headline: string;
};

/**
 * Where a slide is written: the served root and the file under it, the slide's place in that file
 * counted from 0, and `entry`, the place in the shown deck's `order:` of the entry that placed it
 * (a group's entry for a slide of a member deck). For a summary or a grid the file is the deck's
 * `present.yml` and `index` is its entry's place, the same as `entry`. `line` is the 1-based line
 * of the file the slide starts on: the entry's line in `present.yml` for a summary or a grid.
 */
type DeckSlideSource = {
    root: string;
    path: string;
    index: number;
    entry: number;
    line: number;
};

/** What every slide of a deck carries. */
type SlideBase = {
    /** The slide's key inside its deck, which a pane keeps to stay on the slide. */
    key: string;
    /** Plain words naming the slide in the overview grid. */
    title: string;
    notes?: string;
    /** Absent for a slide the deck does not read from a file. */
    source?: DeckSlideSource;
};

/**
 * The address a slide's Markdown image is given when the deck's folder lacks the file, which the
 * view draws as the gap, with the file's name as the image's alt text.
 */
export const DECK_GAP = '#gap';

/**
 * One slide of a deck as the view draws it. Words are Markdown, with the group counts in them
 * already replaced. A `legend` is the domain keys of the group the slide names.
 */
export type DeckSlide =
    | (SlideBase & {
          kind: 'title' | 'closing';
          kicker?: string;
          heading: string;
          lede: string;
          contact?: string;
          legend: string[];
      })
    | (SlideBase & {
          kind: 'section';
          heading: string;
          lede: string;
          cards: DeckCard[];
          foot: string;
          legend: string[];
      })
    | (SlideBase & { kind: 'text'; body: string })
    | (SlideBase & { kind: 'image'; heading: string; src: string; alt: string })
    | (SlideBase & { kind: 'columns'; heading: string; left: string; right: string })
    | (SlideBase & { kind: 'equation'; heading: string; equation: string; rest: string })
    | (SlideBase & { kind: 'code'; heading: string; code: string })
    | (SlideBase & {
          kind: 'project';
          slide: PresentSlide;
          /** The slide's project type, drawn as its chip. */
          type?: string;
          /** The project's `domain:` key. */
          domain?: string;
      })
    | (SlideBase & { kind: 'idea'; card: DeckIdeaCard })
    | (SlideBase & { kind: 'summary'; heading: string; rows: DeckSummaryRow[]; foot: string })
    | (SlideBase & {
          kind: 'grid';
          heading: string;
          lede: string;
          cards: DeckIdeaCard[];
          foot: string;
          /** The status chips the group looks for, which the maturity legend explains. */
          legend: string[];
      });

/** One deck a group holds or could hold: its name, its words and where it is under its root. */
type DeckMember = {
    name: string;
    title: string;
    /** The deck's folder under the root it was found in. */
    path: string;
    /** Whether the group's `slides:` names it; a member that is not was found by discovery. */
    named: boolean;
};

/** A deck two discovering groups both find and neither names, with the other groups. */
type DeckConflict = {
    name: string;
    path: string;
    others: string[];
};

/** One group of a deck, as the Slides view lists it. */
export type DeckGroup = {
    name: string;
    /** The group's `slides:` as the file holds it, which a write names as its `base`. */
    slides: string[];
    members: DeckMember[];
    /** Found by the group's `find:`, in no member's place. */
    candidates: DeckMember[];
    /** Names in `slides:` that match no deck. */
    missing: string[];
    conflicts: DeckConflict[];
    /** The slides the group holds, which `{{<group>.count}}` is. */
    count: number;
};

/**
 * One entry of a deck's `order:` as the Slides view lists it: its `token`, which a write names it
 * by, what it is (a slide file, a group's slides, a summary or a grid), the file or group it
 * names, and the words that show it (the title of a file's first slide, a summary's own title).
 */
export type DeckOrderEntry = {
    token: string;
    kind: 'file' | 'group' | 'summary' | 'grid';
    name: string;
    title: string;
};

/** Why a deck draws nothing, or `ok` when it draws slides. */
export type DeckState = 'ok' | 'empty' | 'no_file' | 'unreadable' | 'missing';

/**
 * One deck as the deck route answers it: the slides in order, the groups with their members, and
 * what was wrong with the files. `tagTones` is a hue name per `tag.class`, the engine's defaults
 * under the deck's own.
 */
export type Deck = {
    root: string;
    /** The deck's folder under the root. */
    path: string;
    name: string;
    title: string;
    state: DeckState;
    slides: DeckSlide[];
    /** The entries of `order:` the reader knows, in the file's order. */
    order: DeckOrderEntry[];
    groups: DeckGroup[];
    tagTones: Record<string, string>;
    findings: Finding[];
};

/**
 * A project. The relation fields hold ids; data/snapshot/normalise.ts fills them from the
 * manifest's `venue_id`, `funding`, `datasets`, `pillar` and `domain` keys, and leaves them empty
 * when it has none.
 */
export type Project = Rooted & {
    id: Id;
    tier: Tier;
    /** A discovered folder that has no project.yml. */
    ghost: boolean;
    category?: string;
    type?: string;
    /** The manifest's own `type` on a flat tier when it differs from the folder's. */
    typeWritten?: string;
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
    /**
     * The keys of `compute:` that the resources registry holds, in the manifest's order, each key
     * once. A key the registry lacks is a finding and is left out.
     */
    resourceIds: Id[];
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
     * The project's own deck: the path of its `present/` folder relative to the hub, present when
     * `present/present.yml` exists. Absent for a project with no deck, which is most of the hub, so
     * the wire carries the key only where there is something to open.
     */
    deck?: string;
    /**
     * The `tag.class` of every `kind: project` slide of the project's deck, each once, which the
     * Settings view offers as the classes a tag tone can be given to.
     */
    deckTags?: string[];
    /** Folder relative to the hub, and the manifest's absolute path. */
    folder: string;
    file: string;
    /**
     * Where the project's folder is when it is a repository served as a Files root of its own,
     * which only a side project's record is made with (snapshot/as-project.ts): the root's key and
     * the repository's absolute path. A project of a hub folder has none.
     */
    repository?: { root: string; dir: string };
    /** The web addresses or paths a side project's manifest lists; only its record holds them. */
    links?: string[];
};

/** A venue from registries/venues.yml. Its id field in the file is `id`, not `key`. */
export type Venue = Rooted & {
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
export type Dataset = Rooted & {
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
export type Pillar = Rooted & {
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
export type Domain = Rooted & {
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
export type Person = Rooted & {
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
     * Absolute path of the people file of a person of a hub other than the first, which the Person
     * view opens under that hub's root. A person of the first hub has none: the configuration's
     * `people_file` names its file.
     */
    file?: string;
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
export type Organisation = Rooted & {
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
 * One resource, from registries/resources.yml: a cluster, a machine or a storage a project runs on.
 * A manifest's `compute:` and `slurm.resource` of behavior.yml are keys into it. `host` is the ssh
 * alias of a cluster or a remote machine.
 */
export type Resource = Rooted & {
    id: Id;
    name: string;
    kind: 'cluster' | 'machine' | 'storage';
    host?: string;
    /** How it is reached: the network, the VPN, the login rules. */
    access?: string;
    links: string[];
    /** The entry's position among the kept entries of the file, which orders two equal names. */
    order: number;
};

/**
 * A funding scheme from funding/funding.yml. Its `key` is optional in that file by design, where
 * it is the cross-link anchor manifests name; an entry without one has no relations to resolve.
 */
export type Funding = Rooted & {
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
 * Where a side project was read from: a folder of the hub's `side-projects/` tier, or the `.oculus`
 * folder of a Files root. The two never share an id, which is built from this.
 */
export type PersonalSource =
    { kind: 'hub'; folder: string } | { kind: 'root'; key: string; dir: string };

/**
 * A directory the side-project reader looks into: the key a Files root is served under and where it
 * is, as an absolute path. The reader takes the roots it is handed as they come; the server decides
 * which roots of the file browser are handed to it. It has the shape of the file browser's root,
 * which the data layer cannot import.
 */
export type PersonalRoot = { key: string; dir: string };

/** A side project's manifest as it parsed, with where it came from and nothing checked. */
export type RawPersonal = {
    source: PersonalSource;
    /** Absolute path of the project.yml that was read. */
    file: string;
    data: Record<string, unknown>;
    /** Absolute path of the project's folder: its folder of the hub, or the repository. */
    dir: string;
    /** Which of the fixed project documents the folder holds, from sources/docs.ts. */
    docs: DocPresence[];
    /**
     * The path of the folder's `present/` folder against the Files root that holds the project,
     * present when `present/present.yml` is there.
     */
    deck?: string;
};

/**
 * The research keys a side project's manifest takes besides its own five, each named and typed as
 * on `Project`. A key the manifest does not hold is absent from the record.
 */
type SideResearchKeys = Partial<
    Pick<
        Project,
        | 'short'
        | 'pin'
        | 'priority'
        | 'latest'
        | 'deadline'
        | 'waitingOn'
        | 'followups'
        | 'snooze'
        | 'subtasks'
        | 'relatedIds'
        | 'collaborators'
    >
>;

/**
 * One side project of the Personal board and the Focus ticker: a hub folder under `side-projects/`
 * or a repository with a `.oculus/project.yml`. The id is `side:<slug>` for the first and
 * `root:<key>` for the second, and a hub other than the first has its root key in front of either.
 * `status` is a key of `side_project_status`, or `unknown` for any other value. Its `folder` is
 * `side-projects/<slug>` against the hub for a hub folder and the repository's absolute path for a
 * repository; `docs` is which of the fixed project documents the folder holds, and `deck` is the
 * path of its `present/` folder against the Files root that holds the project (the hub for a hub
 * folder, the repository's root for a repository), present when `present/present.yml` is there.
 */
export type SideProject = SideResearchKeys &
    Rooted & {
        id: Id;
        title: string;
        status: string;
        eli5: string;
        next: string;
        links: string[];
        source: PersonalSource;
        /** Absolute path of the manifest. */
        file: string;
        folder: string;
        docs: DocFlag[];
        deck?: string;
    };
