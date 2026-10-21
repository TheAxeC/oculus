// Layer 1, data. Raw source records and portfolio entities, with relations held as ids. This
// concern module keeps entity and source shapes together while data/model/index.ts is the facade.

export type Id = string;

/**
 * A record that says which hub it was read from: the name of the workspace folder that holds the
 * hub, for a record of a hub other than the primary, and nothing for a record of the primary.
 * Absent is read as the primary's name (`rootOf` of data/helpers/hub-names.ts). An audit finding
 * uses it for the Files root its file is relative to (`AuditFinding`).
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

/**
 * The five tiers a manifest's `tier` names. A tier says which board a project is on: Projects,
 * Coauthor, Archive, Personal or Software.
 */
export type Tier = 'projects' | 'coauthor' | 'archive' | 'personal' | 'software';

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
 * hub-relative like every other path in the config: the files of the `collections:` entries keyed
 * `leads` and `radar`, and `linkedin_dir`.
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
 * `tier` and `type` included, except that the provenance names below are set by the reader: `id` is
 * the folder's basename (the root's key for a repository) and the manifest's own `id` is kept as
 * `manifestId`. A disagreement of `id` is a finding, never a repair.
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
    /**
     * The first folder under the scan folder when the project lies deeper than one level, and
     * absent otherwise: `published`, `nogo`.
     */
    category?: string;
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
 * One standing "do this later" note, a line of the `followup:` list of a manifest or a collection
 * entry. `key` is what the note is addressed by: its position in the list, or its own key in a map
 * of notes. `after` is an ISO date the note is hidden until; a note without one is always due.
 */
export type Followup = {
    key: string;
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
 * A project. The relation fields hold ids; data/snapshot/normalise.ts fills them from the
 * manifest's `venue_id`, `funding`, `datasets`, `pillar` and `domain` keys, and leaves them empty
 * when it has none.
 */
export type Project = Rooted & {
    id: Id;
    /**
     * The manifest's `tier`; absent when it names none of the five, and the project is then on no
     * board.
     */
    tier?: Tier;
    category?: string;
    /** The manifest's `type`, a key of the vocabulary's `types`. */
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
     * `stale_lag_days` under `focus:` of config/defaults/behavior.yml and is applied by the board.
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
    /** The `followup:` notes, a list of `{ do, after }` maps. */
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

/** The kinds of a dataset's sources whose files Recover lists, fetches, checks and unpacks. */
export const FETCHED_KINDS = [
    'physionet',
    'zenodo',
    'figshare',
    'dandi',
    'huggingface',
    'stanford',
    'geo',
    'kaggle',
    'tcia',
    'synapse',
    'url'
] as const;

/**
 * Where a source's files land and what follows their check: `into` a folder below the dataset's
 * folder (the folder itself when absent), `unpack` its archives after the check into the archive's
 * folder, taking only the contents of `folder` when the source names one, a folder inside each
 * archive, and dropping `strip` leading folders of every path, counted below `folder`.
 */
type SourcePlace = { into?: string; unpack?: true; strip?: number; folder?: string };

/**
 * One file of a `url` source: its address, the sha256 or the md5 the entry gives for it when it
 * gives one (never both), and the name the file is saved under when the address's last part is not
 * that name.
 */
type SourceUrl = { url: string; sha256?: string; md5?: string; name?: string };

/**
 * One source of a dataset's `retrieval` list: the kind and the fields that kind needs, as the
 * registry's schema states them.
 */
export type RecoverSource = SourcePlace &
    (
        | {
              kind: 'physionet';
              project: string;
              version: string;
              files?: string[];
              archive?: true;
              /** The rate curl's `--limit-rate` holds the download to, such as `2M`. */
              throttle?: string;
          }
        | { kind: 'zenodo'; record: string; files?: string[] }
        | { kind: 'figshare'; collection?: string; article?: string; files?: string[] }
        | { kind: 'dandi'; dandiset: string; version: string; assets?: string[] }
        | { kind: 'huggingface'; repo: string; patterns?: string[] }
        | { kind: 'stanford'; druid: string; files?: string[] }
        | { kind: 'geo'; accession: string; files: string[] }
        | { kind: 'kaggle'; dataset: string }
        | { kind: 'tcia'; collection: string; series?: string[] }
        | { kind: 'synapse'; ids: string[] }
        | { kind: 'url'; urls: SourceUrl[] }
        | { kind: 'library'; call: string }
        | { kind: 'request'; contact: string }
        | { kind: 'derived'; from: string[]; script: string }
    );

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
     * True when the set has sources and every one is of a kind Recover runs (`FETCHED_KINDS`),
     * which gives its card the Recover control.
     */
    recover: boolean;
    /** The dataset registry's own theme words (`ecg`, `single-cell`), which are not domain keys. */
    themes: string[];
    /**
     * Projects that name this dataset; data/snapshot/normalise.ts fills it from the other side of
     * the relation.
     */
    projectIds: Id[];
};

// The shapes GET /api/recover answers (server/machine/runs/recover/routes.ts) and the Recover
// view's store reads (state/system/machine/recover.svelte.ts), declared once here.

/** The checksum a source publishes for a file. */
export type RecoverChecksum = { kind: 'sha256' | 'md5' | 'sha1'; value: string };

/** The service whose `downloads` row a source needs. */
export type RecoverService = 'physionet' | 'kaggle' | 'synapse';

/** One file as a source lists it, named below the dataset's folder. */
export type RecoverFile = {
    name: string;
    /** Bytes, or null when the source states no size. */
    size: number | null;
    checksum: RecoverChecksum | null;
    url: string;
    /** The position of its source in the entry's `retrieval` list. */
    source: number;
    service?: RecoverService;
    /**
     * Set when its source unpacks: the folder inside the archive whose contents alone are placed,
     * when the source names one, and how many leading folders each path below it loses.
     */
    unpack?: { strip: number; folder?: string };
    throttle?: string;
};

/** What a file of the plan is on the target. */
export type RecoverFileState = 'verified' | 'present' | 'partial' | 'different' | 'missing';

/** One row of a plan: the file, its state and the bytes the target holds of it. */
export type RecoverRow = RecoverFile & { state: RecoverFileState; have: number };

/** A plan's totals: files, their bytes, the bytes a Fetch needs, and the free space. */
export type RecoverTotals = {
    files: number;
    bytes: number;
    /** Bytes a Fetch of every missing, partial and different file still needs, where known. */
    missing: number;
    /** Files of those whose size the source does not state. */
    unsized: number;
    /** Bytes free on the target's disk, or null when it could not be read. */
    free: number | null;
};

/** The access of one service a dataset's sources need. */
export type RecoverAccess = {
    service: RecoverService;
    /** `ok` with a row the service accepts, `missing` without one, `unreachable` with no answer. */
    state: 'ok' | 'missing' | 'unreachable';
    /** Whether the primary hub's `local.yml` holds a row of the service. */
    row: boolean;
    status?: number;
};

/**
 * Why a source gives no file list: `access` (401 or 403), `status` (another answer that is no
 * success), `answer` (a body that is not the kind's answer), `name` (a file name that is absolute,
 * climbs out or is given twice), `missing` (a file the entry names that the source does not hold),
 * `network` (no answer).
 */
export type RecoverRefusal = {
    refused: 'access' | 'status' | 'answer' | 'name' | 'missing' | 'network';
    /** The kind of the source, or for a `url` source its host. */
    source: string;
    status?: number;
    name?: string;
};

/** A dataset's run: what it does and, where it is counted, how far it is. */
export type RecoverRun = {
    action: 'fetch' | 'verify' | 'unpack';
    done?: number;
    total?: number;
    /** The cluster's job id of a check or an unpack. */
    job?: string;
};

/** One dataset on one target, as the Recover view is told it. */
export type RecoverState = {
    target: 'mac' | 'cluster';
    /** The dataset's folder as `path:` names it. */
    folder: string;
    access: RecoverAccess[];
    /** Whether every service the sources need accepts its row, so Fetch may start. */
    granted: boolean;
    plan: { rows: RecoverRow[]; totals: RecoverTotals } | null;
    refusal: RecoverRefusal | null;
    run: RecoverRun | null;
    log: string[];
    /** The `recover` channel's version when this was answered: a run row pushed later is newer. */
    live: number;
};

/**
 * One of oculus's sessions on the cluster's socket `oculus-recover`, as Live HPC lists it: the
 * bytes of its dataset's folder, the bytes the kept listing names, and the bytes per second
 * between the last two Live HPC answers.
 */
export type RecoverSession = {
    hub: string;
    key: string;
    done: number;
    total: number | null;
    rate: number | null;
};

/** One dataset's run as the `recover` channel pushes it. */
export type RecoverLiveRun = {
    hub: string;
    key: string;
    target: 'mac' | 'cluster';
    /** `running` while the run goes, `ended` from the push after it stopped. */
    state: 'running' | 'ended';
    /** What the run does; null once it has ended. */
    run: RecoverRun | null;
    /** The bytes the folder holds: of the listed files on this Mac, in all on the cluster. */
    bytes: number;
    /** The bytes the kept listing names, or null when none is kept. */
    size: number | null;
    /** Bytes per second between the last two readings, or null after the first. */
    rate: number | null;
    /** On this Mac, the listed files whose bytes changed since the reading before, with rates. */
    growing: { name: string; have: number; rate: number }[];
    log: string[];
    /** The channel's version of the push that last read this run. */
    version: number;
};

/** The payload of the `recover` channel. */
export type RecoverLive = {
    runs: RecoverLiveRun[];
    /** The login node's sessions as the last Live HPC answer read them, or null before one. */
    sessions: RecoverSession[] | null;
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
 * One human, from the people registry. It is the entity a manifest's `collaborators:`, a joint
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
     * Absolute path of the people file of a person of a hub other than the primary, which the
     * Person view opens under that hub's root. A person of the primary hub has none: the
     * configuration's `collections:` entry keyed `people` names its file.
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
