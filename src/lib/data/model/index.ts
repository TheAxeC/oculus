// Layer 1, data. Portfolio aggregates and the public facade for every data and wire type.
// Snapshot ownership stays here while leaf concerns remain small and existing imports stay stable.

import type {
    CollectionFile,
    Dataset,
    DocPresence,
    Domain,
    FeedFiles,
    Finding,
    Funding,
    Id,
    Organisation,
    Person,
    Pillar,
    Project,
    RawCollection,
    RawManifest,
    RawPersonal,
    RawRegistry,
    RegistryFiles,
    RegistryName,
    Resource,
    ScanRule,
    SideProject,
    Venue
} from './model-entities.ts';
import type {
    Career,
    Collection,
    FeedData,
    FeedKind,
    Feeds,
    RawFeeds
} from './model-collections.ts';

export type { FeedData, FeedEntry, FeedKind } from './model-collections.ts';

/** A project's own deck as the snapshot carries it: where it is, and the tag classes it uses. */
export type RawDeck = {
    /** The deck's folder relative to the hub. */
    path: string;
    /** The `tag.class` of each of its project slides, each once. */
    tags: string[];
};

export type RawPortfolio = {
    manifests: RawManifest[];
    /** The side projects of the hub's side-projects tier and of the Files roots, unchecked. */
    personal: RawPersonal[];
    registries: Record<RegistryName, RawRegistry>;
    collections: Record<string, RawCollection>;
    /** What the four feed files hold, from sources/feeds.ts. */
    feeds: RawFeeds;
    /** registries/career.yml as it was parsed, and null when the hub holds no such file. */
    career: Record<string, unknown> | null;
    /**
     * Which documents each project folder holds, by project id, from sources/docs.ts. It is here
     * rather than on the manifest record because no manifest key says it: it is read from the
     * folder, and a reader that put it on the record would be adding a key no schema names.
     */
    docs: Record<Id, DocPresence[]>;
    /**
     * The deck each project's `present/` folder holds, by project id, from sources/deck/. It sits
     * beside `docs` for the same reason: no manifest key names it, it is read from the folder. A
     * project with no `present/present.yml` has no entry.
     */
    decks: Record<Id, RawDeck>;
    findings: Finding[];
};

/**
 * The controlled vocabularies validate checks values against, each a list of the allowed words.
 * `statuses` is a collection entry's `status`. `sideStatuses` are the keys of
 * `side_project_status`, the words a side project's `status:` may use; absent when the config
 * holds no such vocabulary, and a side project's status is then a free string and is not checked.
 */
export type Vocabulary = {
    statuses: string[];
    sideStatuses?: string[];
};

/**
 * What validate needs and nothing more: the vocabularies, the text its sentences are read from,
 * and the paths of the two files it names a finding on when the raw record carries none.
 */
export type ValidationRules = {
    vocab: Vocabulary;
    /**
     * Absolute path of the dataset registry, so a finding about the file's own top-level keys names
     * it even when the file lists no dataset.
     */
    datasetsFile?: string;
    /**
     * The manifest fields the generated schema holds to the keys of their `from` sources, all of
     * which were read: the schema reports a value of the wrong shape there, so validate does not.
     */
    listed?: ReadonlySet<string>;
    /** The flat text catalog every finding's sentence is read from, by its `findings.` key. */
    text: Record<string, string>;
};

/** Everything a portfolio build needs: where to read, and what to check what it read against. */
export type PortfolioConfig = {
    scan: ScanRule[];
    registries: RegistryFiles;
    collections: CollectionFile[];
    /** The four generated feed files, hub-relative. */
    feeds: FeedFiles;
    /** The configured interval between LinkedIn posts. */
    linkedinCadenceDays: number;
    /** The career file, hub-relative. */
    career: string;
    /** The merged `manifest_schema`, the form the manifest's JSON Schema is made from. */
    schema: unknown;
    vocab: Vocabulary;
    /**
     * The merged configuration. The schemas of the side projects, the decks, the C++ file and
     * oculus's own files, and the lists a `vocab.<key>` reads, are made from it.
     */
    merged: Record<string, unknown>;
    /** The hub folder of the portfolio deck, `portfolio_deck:` of sources.yml, or null. */
    portfolioDeck: string | null;
    /** The hue each `tag.class` wears, the engine's `defaults.tag_tones`. */
    tagTones: Record<string, string>;
    /** The keys of the `domains:` of vocab.yml, which a project's `domain:` is checked against. */
    domains: string[];
    /**
     * The flat text catalog of the merged config, which the readers and the validation rules word
     * their findings from.
     */
    text: Record<string, string>;
};

/** The entities of one snapshot, each kind keyed by its own id. */
export type Entities = {
    projects: Record<Id, Project>;
    venues: Record<Id, Venue>;
    datasets: Record<Id, Dataset>;
    pillars: Record<Id, Pillar>;
    domains: Record<Id, Domain>;
    funding: Record<Id, Funding>;
    people: Record<Id, Person>;
    organisations: Record<Id, Organisation>;
    resources: Record<Id, Resource>;
    collections: Record<Id, Collection>;
    /** The side projects of the Personal board, by their `side:` or `root:` id. */
    personal: Record<Id, SideProject>;
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
    projectPillar: [Id, Id][];
    projectDomain: [Id, Id][];
    projectRelated: [Id, Id][];
    fundingPillar: [Id, Id][];
    /** A project and a person its `collaborators:` names. */
    projectPerson: [Id, Id][];
    /** An entry of the joint-work collection and the person its `person:` names. */
    jointWorkPerson: [Id, Id][];
    /** A person and each organisation their `affiliations:` name. */
    personOrganisation: [Id, Id][];
    /** A funding scheme and the organisation its `funder:` names. */
    fundingOrganisation: [Id, Id][];
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
 * The source line a PDF window asks one main page of oculus to open: the `jump` message a page
 * that carried the write token sends, and the payload of the Hub's `jump` channel it becomes. The
 * `owner` is the id of the main page that opened the window, and only that page acts on the jump.
 */
export type Jump = {
    owner: string;
    root: string;
    file: string;
    line: number;
    column?: number;
};

/** The message a page sends to ask for a jump. */
export type JumpMessage = { type: 'jump' } & Jump;

/**
 * The subscribe message a client sends: the channels it wants, and the write token when the page
 * has one. A socket that carried the token may send terminal input on a `pty:` channel; a socket
 * without it reads every channel and writes to none (DESIGN.md, "Auth").
 */
export type Subscription = {
    type: 'subscribe';
    channels: string[];
    token?: string;
};

/**
 * The message a page sends to drop channels from its subscription. The server acts on the
 * `source:` channels of it, whose publisher stops when no socket holds the channel; every other
 * channel stays subscribed until the socket closes.
 */
export type Unsubscription = {
    type: 'unsubscribe';
    channels: string[];
};

/**
 * The machine the server runs on: its name, as the operating system gives it, and the address the
 * server listens at. The status bar's first item draws the one and says the other.
 */
export type HostInfo = { name: string; address: string };

/**
 * The payload of the `config` channel: the merged map, the flat catalog, the drawing of every glyph
 * the icon map names, the machine the server runs on, and what was wrong. The icons ride here
 * rather than being fetched by the page because they are read from the config the same way every
 * other vocabulary is; the machine rides here because this is the channel every page has from its
 * first message.
 */
export type ConfigPayload = {
    config: Record<string, unknown>;
    text: Record<string, string>;
    icons: Record<string, string>;
    host: HostInfo;
    findings: Finding[];
};

/**
 * One app the apps watcher found: a folder of web files with an `app.yml`, in the machine's apps
 * folder (`root` empty) or in the `.oculus/apps/` folder of a root the file browser shows. The row
 * holds what the page draws and what the server serves by: `hash` is the content hash, `approved`
 * whether the approvals file holds it or the app is kept approved, and `key` the address key the
 * app's files are served under, empty unless the app is approved. The store's size and version ride
 * in the row and its value does not, since a publish sends the whole payload to every page.
 */
export type AppRow = {
    name: string;
    root: string;
    title: string;
    description: string;
    glyph: string;
    folder: string;
    entry: string;
    reads: string[];
    writes: string[];
    connects: string[];
    files: number;
    bytes: number;
    hash: string;
    approved: boolean;
    kept: boolean;
    key: string;
    storeBytes: number;
    storeVersion: string;
    storeFile: string;
};

/**
 * The payload of the `apps` channel: the apps found, what was wrong with the folders and manifests
 * read, and the real path of every apps folder the watcher holds.
 */
export type AppsPayload = { rows: AppRow[]; findings: Finding[]; folders: string[] };

/**
 * Which section of the audit a finding belongs to: an open marker left in a document, a manifest
 * field a live project has not filled in, a folder the tier standard does not name, a status the
 * project's own tier and type contradict, a field that has stopped being a glance, and the public
 * website's list against the portfolio.
 */
export type AuditKind = 'todo' | 'data' | 'conform' | 'manifest' | 'readability' | 'publink';

/**
 * One thing the hub is missing. `scope` is the project folder, the collection key or the website,
 * `where` the file, field or entry it is about, `file` the hub-relative path of the file it is
 * about (the empty text when there is none, which the signature does not read), and `signature`
 * the twelve hex characters the mute list in config/behavior.yml holds.
 */
export type AuditFinding = {
    scope: string;
    where: string;
    /** The hub-relative path of an existing file below the hub, else the empty text. */
    file: string;
    kind: AuditKind;
    message: string;
    signature: string;
};

/** The payload of the `audit` channel: what the scan found, and what the reader has parked. */
export type AuditPayload = {
    findings: AuditFinding[];
    /** The signatures of config/behavior.yml's `audit_ignore:`. */
    muted: string[];
};

/**
 * One picture of the Memories wall as GET /api/memories answers it: the file's name, and its width
 * and height in pixels as the browser draws it, both null when its header gave no size.
 */
export type Picture = { name: string; width: number | null; height: number | null };

/** The lines of a set of files as cloc splits them, with how many of their lines carry a TODO. */
export type LineTally = {
    files: number;
    blank: number;
    comment: number;
    code: number;
    todo: number;
};

/** One language inside a folder of the line count. */
export type LanguageLines = LineTally & { language: string };

/**
 * One folder of the line count, its languages in descending code lines. The top level, the files
 * no folder holds, is the empty folder name.
 */
export type FolderLines = LineTally & { folder: string; languages: LanguageLines[] };

/**
 * What GET /api/lines answers: oculus's own tracked files by folder in path order, the sum of
 * every folder, and the ISO time the count finished.
 */
export type LineCount = { rows: FolderLines[]; total: LineTally; counted: string };

/** The four complete feed states carried together on the `feeds` channel. */
export type FeedsPayload = Record<
    FeedKind,
    FeedData & {
        ok: true;
        kind: FeedKind;
        file: string;
        missing?: boolean;
        error?: string;
    }
>;

export type {
    Chip,
    CodeAvailability,
    CollectionFile,
    Dataset,
    Deck,
    DeckCard,
    DeckGroup,
    DeckIdeaCard,
    DeckOrderEntry,
    DeckSlide,
    DeckState,
    DeckSummaryRow,
    DocFlag,
    DocPresence,
    Domain,
    FeedFiles,
    Finding,
    Followup,
    Funding,
    Id,
    DocPart,
    RenderedHeading,
    Organisation,
    Person,
    PresentEli5,
    PresentPanel,
    PresentSlide,
    PresentSpec,
    PresentTag,
    Pillar,
    PersonalRoot,
    PersonalSource,
    Project,
    RawCollection,
    RawEntry,
    RawManifest,
    RawPersonal,
    RawRegistry,
    RawRegistryEntry,
    RegistryFiles,
    RegistryMeta,
    RegistryName,
    Reproduced,
    Resource,
    ScanRule,
    SideProject,
    SlideKind,
    Subtask,
    Tier,
    Venue
} from './model-entities.ts';

export type {
    Career,
    Collection,
    Entry,
    Feeds,
    FromPicked,
    Host,
    Lead,
    RawFeeds,
    SchemaField,
    When
} from './model-collections.ts';

export type {
    AccountProvider,
    AccountRow,
    ConnectAccountConfig,
    ConnectAccountStatus,
    ConnectKind,
    ConnectProvider,
    ConnectSetup,
    ConnectStatus
} from './model-connect.ts';

export type {
    InboxKind,
    InboxPayload,
    InboxThread,
    InboxTriage,
    MailAccount,
    MailAccountConfig,
    MailAccountStatus,
    MailProvider,
    MailStatus,
    TriageFile,
    TriageNote
} from './model-mail.ts';

export type {
    CalendarAccount,
    CalendarAccountConfig,
    CalendarAccountStatus,
    CalendarEvent,
    CalendarEventStatus,
    CalendarListEntry,
    CalendarPayload,
    CalendarProvider,
    CalendarStatus
} from './model-calendar.ts';

export type {
    Area,
    DiffAttributes,
    DiffSides,
    FilesPayload,
    GitBranch,
    GitCommit,
    GitBlameLine,
    GitCommitFile,
    GitEntry,
    GitFileCommit,
    GitFilePage,
    GitGraphCommit,
    GitGraphPage,
    GitLineMark,
    GitMergeDeleted,
    GitMergeSides,
    GitPayload,
    GitSequence,
    GitStash,
    GitState,
    GitTag,
    GitWorktree,
    GroupedSession,
    HookEvent,
    HpcJob,
    HpcPartition,
    HpcPayload,
    HpcQuotaItem,
    HpcRecent,
    HpcStatus,
    SubmitPlan,
    UsageAccount,
    UsageAccountConfig,
    UsageDay,
    UsageLiveSession,
    UsagePayload,
    UsageRefresher,
    UsageTool,
    UsageWindow,
    LiveEntry,
    OpenFileMessage,
    SecondaryArea,
    SessionAgent,
    SessionCache,
    SessionEvent,
    SessionFile,
    SessionRecord,
    SessionsPayload,
    SessionTokens,
    SessionTool,
    Turn,
    TurnTool,
    Workspace
} from './model-sessions.ts';
export { BRANCH_NOT_MERGED } from './model-sessions.ts';

export { DECK_GAP } from './model-entities.ts';
export { confirmValues } from './model-agents.ts';
export type {
    AgentAccount,
    AgentChoice,
    AgentChoiceList,
    AgentChoices,
    AgentChoicesFinding,
    AgentChoicesWhy,
    AgentId,
    AgentsAnswer,
    ComposeStart,
    CustomizationFinding,
    CustomizationItem,
    CustomizationKind,
    CustomizationRow,
    CustomizationsAnswer,
    ListedSession,
    SizedAgent,
    TaskRef
} from './model-agents.ts';

export type {
    DocType,
    HitType,
    LiteratureHit,
    LiteratureRefusal,
    LiteratureSource,
    SearchAnswer,
    SearchFailure,
    SearchFile,
    SearchHit,
    SourceAnswer,
    SourceHits,
    SourceInfo,
    SourceNotOk,
    SourceState
} from './model-search.ts';
export {
    DOC_TYPES,
    FIELD_MAX,
    LITERATURE_REFUSALS,
    LITERATURE_SOURCES,
    QUERY_MAX,
    SOURCE_STATES
} from './model-search.ts';
export {
    BUILD_OUTCOMES,
    CHKTEX_FIXABLE,
    DEBUG_CONSOLE_KINDS,
    DEBUG_CONSOLE_MAX,
    DEBUG_STATUSES,
    LINT_IDS,
    lintersOf,
    SCHEDULE_WORDS,
    STEER_CONTROL,
    SCROLLBACK_LINES,
    STEER_MAX,
    TERMINAL_COLORS,
    TERMINAL_REFUSALS,
    UPDATE_TASKS
} from './model-machine.ts';
export type {
    BuildOutcome,
    DebugBreakpoint,
    DebugConfiguration,
    DebugConsole,
    DebugConsoleAppend,
    DebugConsoleKind,
    DebugConsoleLine,
    DebugFileBreakpoints,
    DebugFrame,
    DebugFunctionBreakpoint,
    DebugLaunches,
    DebugPayload,
    DebugScope,
    DebugSession,
    DebugStatus,
    DebugWatch,
    LintAnswer,
    LintConfig,
    LintEdit,
    LintFix,
    LintFolderAnswer,
    LintFolderFile,
    LintId,
    LintRow,
    LintState,
    LspApproval,
    LspCode,
    LspConfig,
    LspDatabase,
    LspInterpreter,
    LspPlace,
    LspReadRefusal,
    LspRefusal,
    LspRpc,
    LspState,
    LspToPage,
    LspToServer,
    ProcessesPayload,
    ProcessRow,
    PtyPayload,
    ScheduleEntry,
    SchedulePayload,
    ScheduleProblem,
    ScheduleRow,
    ScheduleRun,
    ScheduleWord,
    Terminal,
    TerminalColor,
    TerminalInput,
    TerminalJob,
    LatexApproval,
    LatexJobTarget,
    TerminalKind,
    TerminalRefusal,
    TerminalResize,
    TerminalResume,
    UnchosenKey,
    UpdateTask
} from './model-machine.ts';
export type {
    ChainLine,
    CommandContext,
    CommandDefault,
    CommandDiagnostic,
    CommandFinding,
    CommandSeverity,
    CommandSource,
    CommandsAnswer,
    ProjectCommand
} from './model-sessions.ts';
