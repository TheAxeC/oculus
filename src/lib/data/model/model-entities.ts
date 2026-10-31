// Layer 1, data. Raw source records and portfolio entities, with relations held as ids. This
// concern module keeps entity and source shapes together while data/model/index.ts is the facade.

export type Id = string;

/**
 * A record that says which hub it was read from: the name of the workspace folder that holds the
 * hub. Every record of the merged portfolio carries it, the primary hub's included; a record read
 * from one hub before the merge carries none (`rootOf` of data/helpers/hub-names.ts reads that as
 * the empty name). An audit finding uses it for the Files root its file is relative to
 * (`AuditFinding`).
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
 * hub-relative like every other path in the config: the files of the `collections:` entries whose
 * `registry:` is `leads` and `radar`, whatever their key, oculus's entry of each when the list
 * names none, and `linkedin_dir`.
 */
export type FeedFiles = {
    leads: string;
    radar: string;
    linkedin: string;
};

/**
 * One scan rule, the shape of an entry under `scan:` in the layout config. `dir` is walked to any
 * depth: a folder holding a project.yml is a project and its subfolders are not walked.
 */
export type ScanRule = {
    /** Hub-relative directory, `projects/ideas`. */
    dir: string;
    /** True for a directory the hub need not have: absent, it is skipped rather than reported. */
    optional?: boolean;
};

/**
 * A project.yml as it was read, plus provenance. Every key the YAML held is present untouched,
 * `tier` and `stage` included, except that the provenance names below are set by the reader: `id`
 * is the folder's basename (the root's key for a repository) and the manifest's own `id` is kept
 * as `manifestId`. A disagreement of `id` is a finding, never a repair.
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
    /**
     * Folder of the project relative to the hub, `projects/coauthor/active/clinical-hccnet`; for a
     * project of a repository, the repository's absolute path.
     */
    folder: string;
    /** The folder's basename, which is the project's id; for a repository, its root's key. */
    id: Id;
    /** The manifest's own `id` value, exactly as read, whatever its type. */
    manifestId?: unknown;
    /**
     * Set on the project of a repository that is a workspace folder: the name of that folder and
     * its folder, which is where `<dir>/.oculus/project.yml` and the project's documents and deck
     * are read from. A project of a scan folder has none.
     */
    workspaceFolder?: { root: string; dir: string };
    /** Set when the project's folder holds a `code/` folder, which is what the deposit mirrors. */
    codeFolder?: true;
};

/**
 * One entry of one registry as it was read, plus provenance. `key` is the entry's identity, the
 * value of its file's primary key; the original field keeps its own name and value as well.
 */
export type RawRegistryEntry = {
    [key: string]: unknown;
    /**
     * Which registry the entry came from. Not `source`: a dataset entry's own `source` is its URL.
     */
    registry: RegistryName;
    /**
     * The entry's id, or the empty string when the file has no primary key or the entry holds no
     * text or number there.
     */
    key: Id;
    /** Absolute path of the registry file. */
    file: string;
};

/** The top-level keys of a registry file other than its entry list, returned untouched. */
export type RegistryMeta = Record<string, unknown>;

/**
 * One registry as read: its entries in file order, everything else the file held, and the field
 * its entries are keyed by, absent when the file has no primary key.
 */
export type RawRegistry = {
    entries: RawRegistryEntry[];
    meta: RegistryMeta;
    primaryKey?: string;
};

/**
 * One entry of one collection as it was read. Every key the YAML map held is present untouched; the
 * reader adds only `provenance`. The entry's identity, the value of its file's primary key, is left
 * where it was read and is derived by data/snapshot/normalise.ts, not here.
 */
export type RawEntry = {
    [key: string]: unknown;
    /** Absolute path of the collection file, and the entry's position in the file's entry list. */
    provenance: { file: string; index: number };
};

/**
 * One collection as read: the file it came from, its entries in file order, and every top-level key
 * other than its record list untouched as `meta` (`title` and `schema` are the ones the hub's
 * collection files carry). Of the five files carried as both entities and collections, data uses
 * the `datasets:` record list and the other four use `entries:`.
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
    /** Folder-relative path, one of the fixed list in sources/documents/docs.ts. */
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

/** A project chip: a word of the vocabulary's `chips`, given its label and glyph by the view. */
export type Chip = string;

/**
 * A row of a manifest's `code_availability.anonymize`: a word the Zenodo review copy replaces, and
 * what it is replaced by, `Anonymous` when `as` is absent. A row with no term keeps an empty one,
 * which the review press refuses by its row.
 */
export type AnonymizeRow = { term: string; as?: string };

/**
 * A project's code deposit, the `code_availability` map of a manifest. `status` is the word the
 * card's badge reads (`deposited`, `review-anon`, `none`) and, with `date`, `url` and `repo`, is
 * the GitHub repository's; `doi`, `reviewLink` (the review copy's share link), `zenodoStatus` and
 * `zenodoDate` are the Zenodo deposit's, and `anonymize` the words its review copy replaces. The
 * manifest's remaining keys under that map (the repo's description, homepage, topics and
 * visibility) are the deposit tool's and no view reads them, so they are not carried.
 */
export type CodeAvailability = {
    status?: string;
    date?: string;
    url?: string;
    doi?: string;
    repo?: string;
    anonymize?: AnonymizeRow[];
    reviewLink?: string;
    zenodoStatus?: string;
    zenodoDate?: string;
};

/** A named address: a link of a publication record, printed with its name as the link's words. */
export type NamedLink = { name: string; url: string };

/**
 * One address of a person on the web, a row of `links:` of the people file: its name, the full
 * address, and the account name a CV prints in place of the address where it prints one.
 */
export type PersonLink = NamedLink & { handle?: string };

/**
 * A manifest's `publication:` record, the entry the website's publications list the project's paper
 * with. Each field is held when the manifest writes it, an empty text included, and is written
 * through as held; the title, the date, the section, the place among the authors, the words around
 * the venue and the code link are generated from the rest of the manifest
 * (server/content/audit/website/papers.ts).
 */
export type Publication = {
    /** The authors as the website prints them, one text. */
    authors?: string;
    /** The venue as the website prints it. */
    book?: string;
    /** The website's research lines the paper belongs to, keys of `programs:` of its own file. */
    program?: string[];
    url?: string;
    /** The paper's other links, in the order the website prints them, the code link left out. */
    links?: NamedLink[];
    abstract?: string;
    /** A mark printed after the authors, such as an award of the paper. */
    pub_last?: string;
    hide?: boolean;
    /** The place of the entry in its website section, lowest first. */
    rank?: number;
};

/**
 * A manifest's `cv:` record, the row the CV's projects list the project with. Each field is held
 * when the manifest writes it and is written through as held; `title` stands for the manifest's own
 * title where the CV prints another.
 */
export type ProjectCv = {
    title?: string;
    url?: string;
    /** The period as the CV prints it, a year written as a number kept a number. */
    duration?: string | number;
    about?: string;
    role?: string;
    hide?: boolean;
    /** The place of the row in the CV's projects, lowest first. */
    rank?: number;
};

/**
 * The deposit mirror of a project's `code/` folder as GET and POST /api/deposit answer it, one
 * declaration for the server that sends it (server/git/deposit/) and the page that reads it
 * (state/system/deposit.svelte.ts). A finding is what the scan objected to: a credential, a file
 * too big for a public repository, a missing README.
 */
export type DepositFinding = { kind: 'secret' | 'large' | 'readme'; path: string; mb: number };

/** One path `git status --porcelain=v1 -z` reported in the mirror, with git's own two letters. */
export type DepositChange = { path: string; letters: string };

/** What a `plan` answers: what would ship, what moved, and what the scan objected to. */
export type DepositPlan = {
    repo: string;
    mirror: string;
    branch: string;
    /** origin's URL, or the empty string when the mirror has no remote yet. */
    remote: string;
    files: string[];
    changes: DepositChange[];
    findings: DepositFinding[];
};

/** The mirror's branch against `origin/main`. */
export type MainComparison = {
    /** Whether `origin/main` and a commit of the mirror both exist to compare. */
    known: boolean;
    ahead: number;
    behind: number;
    /** The paths the mirror's commits and `origin/main` differ in, sorted. */
    differ: string[];
};

/** Where the mirror is and what state it is in. */
export type MirrorState = {
    id: string;
    repo: string;
    mirror: string;
    exists: boolean;
    branch: string;
    remote: string;
    /** The current branch's upstream as git names it, or the empty name without one. */
    upstream: string;
    /** Commits the current branch is ahead of its upstream; 0 without an upstream. */
    ahead: number;
    /** The current branch against `origin/main`; nothing known until the mirror has fetched. */
    main: MainComparison;
    /** The last plan made for this project in this process, or null when none was. */
    plan: DepositPlan | null;
};

/**
 * A project's repository, the `repository:` map of a manifest: where the code lives on the remote
 * and where it is cloned to. `url` is the remote's address. `clones` are the absolute folders of
 * the repositories of the workspace whose `origin` is that address, in the order the repositories
 * are listed; the build fills them, so a snapshot read from a manifest alone holds none. A project
 * is cloned when it has one.
 */
export type RepositoryBlock = {
    url?: string;
    visibility?: string;
    description?: string;
    homepage?: string;
    topics?: string[];
    date?: string;
    clones: string[];
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
 * The people a dated line names, by person key, in the three fields the roles of `roles:` read
 * (config/catalogs/vocab.yml). A field the line leaves out, or names nobody in, is absent; a key
 * written as one string reads as a list of one.
 */
export type LinePeople = {
    lead?: string[];
    supervisors?: string[];
    collaborators?: string[];
};

/**
 * One standing "do this later" note, a line of the `followup:` list of a manifest or a collection
 * entry. `key` is what the note is addressed by: its position in the list, or its own key in a map
 * of notes. `after` is an ISO date the note is hidden until; a note without one is always due. A
 * note marked `done` stays in the list, struck through, until it is deleted.
 */
export type Followup = LinePeople & {
    key: string;
    do: string;
    after?: string;
    done: boolean;
};

/**
 * One line of a checklist, the `subtasks:` of a manifest or of a collection entry. `key` is what
 * the line is addressed by: the key of the map the manifest writes, or the position in the list
 * for a manifest that writes a list.
 */
export type Subtask = LinePeople & {
    key: string;
    do: string;
    deadline?: string;
    done: boolean;
    snooze?: string;
};

/**
 * A project. The relation fields hold ids; data/snapshot/normalise.ts fills them from the
 * manifest's `venue`, `funding`, `datasets`, `pillars`, `domain`, `lead`, `collaborators` and
 * `supervisors` keys, and leaves them empty when it has none.
 */
export type Project = Rooted & {
    id: Id;
    /**
     * The manifest's `tier`, the kind of project, a word of the vocabulary's `tiers`; absent when
     * it names none, and the project is then on no board that names a tier.
     */
    tier?: string;
    /** The manifest's `stage`, a key of the vocabulary's `stages`. */
    stage?: string;
    /** The manifest's `form`, the form of the output, a key of the vocabulary's `forms`. */
    form?: string;
    title: string;
    short?: string;
    year?: number;
    /** `pin: true` floats the card to the top of its board. False and absent are both no pin. */
    pin?: boolean;
    /**
     * Whole days the newest of the project's documents is ahead of its own project.yml, so the
     * manifest is behind what the folder says. Absent when the manifest is the newer of the two,
     * which is a project with nothing to report. The threshold a badge is drawn at is
     * `stale_lag_days` under `focus:` of config/defaults/behavior.yml and is applied by the board.
     */
    staleDays?: number;
    chips: Chip[];
    statusLine?: string;
    eli5?: string;
    next?: string;
    latest?: string;
    results: string[];
    ideas: string[];
    deadline?: string;
    /**
     * What the project waits for before it moves, the manifest's `waiting-on:`, each value read
     * trimmed and once, an empty one left out. An entry is the internal id of the person or the
     * project it names, or its words as written when it names neither, which validate reports;
     * the Focus strip draws each by the name it resolves to.
     */
    waitingOn: Id[];
    /**
     * The `followup:` notes, a list of `{ do, after, done }` maps with the people each names, done
     * notes included; a done note is off the Focus board.
     */
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
    /** The entry the website's publications list the paper with, absent when it lists none. */
    publication?: Publication;
    /** The row the CV's projects list the project with, absent when it lists none. */
    cv?: ProjectCv;
    repository?: RepositoryBlock;
    reproduced?: Reproduced;
    /** Ids of other projects this one is related to. */
    relatedIds: Id[];
    venueId?: Id;
    fundingIds: Id[];
    datasetIds: Id[];
    pillarIds: Id[];
    domainIds: Id[];
    /**
     * The people who lead the project, the manifest's `lead:`, several for co-first authors: ids of
     * the people registry in the manifest's order, each once. A key the registry lacks is a finding
     * and is left out. The `projectPerson` table holds the same pairs from the other side, with the
     * collaborators'.
     */
    lead: Id[];
    /**
     * Ids of the people registry, the manifest's `collaborators:`; the `projectPerson` table holds
     * the same pairs from the other side. With `lead` and `supervisors` they are the project's
     * team.
     */
    collaborators: Id[];
    /**
     * Ids of the people registry, the manifest's `supervisors:`, the people who supervise the
     * work; the `projectPerson` table holds the same pairs from the other side.
     */
    supervisors: Id[];
    /**
     * The four fixed project documents, in the order sources/documents/docs.ts lists them, presence
     * only.
     */
    docs: DocFlag[];
    /**
     * The project's own deck: the path of its `present/` folder relative to the Files root that
     * holds the project (the hub, or the repository's root), present when `present/present.yml`
     * exists. Absent for a project with no deck, which is most of the hub, so the wire carries the
     * key only where there is something to open.
     */
    deck?: string;
    /**
     * Set when the project's folder holds a `code/` folder. With a `code_availability` that names a
     * `repo` or a `url`, it is what gives the project a deposit.
     */
    codeFolder?: true;
    /**
     * The `tag.class` of every `kind: project` slide of the project's deck, each once, which the
     * Settings view offers as the classes a tag tone can be given to.
     */
    deckTags?: string[];
    /**
     * Folder relative to the hub, except for a project of a repository, whose folder is the
     * repository's absolute path; and the manifest's absolute path.
     */
    folder: string;
    file: string;
    /**
     * Where the project's folder is when it is a repository served as a Files root of its own: the
     * root's key and the repository's absolute path: a project read from a repository that is a
     * workspace folder. A project of a hub folder has none.
     */
    workspaceFolder?: { root: string; dir: string };
    /** The web addresses or paths the manifest's `links:` lists. */
    links?: string[];
    /** The words the manifest's `tags:` lists, which the board search reads. */
    tags?: string[];
};

/** A venue from the venues registry. Its id field in the file is `id`, not `key`. */
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
    /** The venue's ISSNs, print and electronic, in the order the entry lists them. */
    issn?: string[];
    /** The article fee as the journal browser words it, read from the browser into the entry. */
    fee?: string;
    /** The open-access status as the journal browser words it, read as `fee` is. */
    openAccess?: string;
    /** True when the venue's hub names a journal browser (`venues.browser`) that asks by ISSN. */
    browsable?: true;
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

/** The kinds of a dataset's sources the card states, which no row of `recover.sources` reads. */
const STATED_KINDS = ['library', 'request', 'derived'] as const;

/** Whether a kind is one the card states. */
export function statedKind(kind: string): boolean {
    return (STATED_KINDS as readonly string[]).includes(kind);
}

/**
 * Where a source's files land and what follows their check: `into` a folder below the dataset's
 * folder (the folder itself when absent), `unpack` its archives after the check into the archive's
 * folder, taking only the contents of `folder` when the source names one, a folder inside each
 * archive, and dropping `strip` leading folders of every path, counted below `folder`.
 */
type SourcePlace = { into?: string; unpack?: true; strip?: number; folder?: string };

/**
 * One source of a dataset's `retrieval` list: its `kind`, the place its files land, and its other
 * fields as the registry writes them. A fetched kind is the `key` of a row of its hub's
 * `recover.sources`, whose holes the fields fill: a word, a list of words, a list of maps of words
 * (a `url` source's files) or a flag. A stated kind holds its own fields: `library` a `call`,
 * `request` a `contact`, `derived` the sets it is built `from` and its `script`.
 */
export type RecoverSource = SourcePlace & { kind: string; [field: string]: unknown };

/** A dataset from the dataset registry, whose entry list is under `datasets`. */
export type Dataset = Rooted & {
    id: Id;
    name: string;
    modality?: string;
    description?: string;
    size?: string;
    access?: string;
    source?: string;
    /** How the dataset comes back: its sources, each parsed by its kind, in the file's order. */
    retrieval: RecoverSource[];
    /** The dataset's folder, the same on this Mac and on the cluster (`~/data/<folder>`). */
    path?: string;
    /** Free text about where the set lives and how it is used, the entry's `notes:`. */
    notes?: string;
    /**
     * True when the set has sources and every one is of a kind a row of its hub's
     * `recover.sources` reads, which gives its card the Recover control.
     */
    recover: boolean;
    /**
     * The kinds of its sources that are neither stated nor read by a row of its hub's
     * `recover.sources`, each once in the file's order; absent when there are none.
     */
    unread?: string[];
    /** The dataset registry's own theme words (`ecg`, `single-cell`), which are not domain keys. */
    themes: string[];
    /**
     * Projects that name this dataset; data/snapshot/normalise.ts fills it from the other side of
     * the relation.
     */
    projectIds: Id[];
};

/** A pillar from the pillars registry. */
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

/** How a domain's `color` is written: `#` and six hexadecimal digits. */
const DOMAIN_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * The colour a domains registry entry is drawn in: its `color` when it is written `#rrggbb`, and
 * undefined for any other value, which draws the domain in the neutral tone. The snapshot's domain
 * records, each hub's vocabulary and the finding on a bad colour (snapshot/validate.ts) read it.
 */
export function domainColorOf(entry: Record<string, unknown>): string | undefined {
    return typeof entry.color === 'string' && DOMAIN_COLOR.test(entry.color)
        ? entry.color
        : undefined;
}

/** A domain from the domains registry. */
export type Domain = Rooted & {
    id: Id;
    title: string;
    blurb?: string;
    /** The entry's `color` written `#rrggbb`, which a project card of the domain wears. */
    color?: string;
    /** The entry's `expects_datasets: true`: an active project of the domain lists a dataset. */
    expectsDatasets?: boolean;
    projectIds: Id[];
};

/**
 * One human, from the people registry. It is the entity a manifest's `lead:`, `collaborators:` and
 * `supervisors:` and a `waiting-on:` value name, so a person's name is written once and every
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
    /** The family name, the end of `name`. */
    family?: string;
    /** Keys of organisations.yml entries, the primary first, and empty for a person with none. */
    affiliations: Id[];
    /** What the person is to this hub in its own words: co-supervisor, co-author, student. */
    role?: string;
    orcid?: string;
    email?: string;
    /** The person's addresses on the web, in the file's order. */
    links: PersonLink[];
    /** A student's supervision folder, hub-relative, whose files the Person view lists. */
    folder?: string;
    /**
     * True on the user, the person the key `self` of the primary hub's `local.yml` names
     * (data/snapshot/hubs/self.ts); absent on every other.
     */
    self?: boolean;
    /**
     * Absolute path of the people file of the hub the person was read from, set by the merge of the
     * hubs. The Person view opens it under that hub's root for a person of a hub other than the
     * primary, and the file of the configuration's `collections:` entry whose `registry:` is
     * `people` for a person of the primary.
     */
    file?: string;
    /**
     * Projects whose `lead:`, `collaborators:` or `supervisors:` name this person, the projects of
     * whose team the person is; filled from the other side of the relation.
     */
    projectIds: Id[];
};

/**
 * One organisation, from the organisations registry. A person's `affiliations:` and a funding
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
 * One resource, from the resources registry: a cluster, a machine or a storage a project runs on.
 * A manifest's `compute:` and the list `slurm.resource` of behavior.yml are keys into it. `host` is
 * what ssh connects to for a cluster or a remote machine: an ssh alias, a DNS name or an address.
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
 * A funding scheme from the funding registry. Its `key` is optional in that file by design, where
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
    /** The funder's number of the award, which a Zenodo deposit names with the scheme's title. */
    award?: string;
    link?: string;
    url?: string;
    /** An ISO date the scheme's own deadline is hidden from the Focus ticker until. */
    snooze?: string;
    /** The `followup:` notes of the scheme's entry, in the list a manifest writes them in. */
    followups: Followup[];
    /** The `subtasks:` checklist of the scheme's entry. */
    subtasks: Subtask[];
    tags: string[];
    projectIds: Id[];
    pillarIds: Id[];
};

/**
 * A directory a repository's manifest is read from: the key a Files root is served under and where
 * it is as an absolute path. The readers take the roots they are handed as they come; the server
 * decides which roots of the file browser are handed to them. It has the shape of the file
 * browser's root, which the data layer cannot import.
 */
export type RepositoryRoot = { key: string; dir: string };
