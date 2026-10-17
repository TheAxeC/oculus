// Layer 1, data. Portfolio aggregates and the public facade for every data and wire type.
// Snapshot ownership stays here while leaf concerns remain small and existing imports stay stable.

import type { AppContributes } from './apps/model-apps.ts';
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
    RawRegistry,
    RegistryFiles,
    RegistryName,
    RepositoryRoot,
    Resource,
    Rooted,
    ScanRule,
    Tier,
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

export type { FeedData, FeedEntry, FeedItem, FeedKind } from './model-collections.ts';

/** A project's own deck as the snapshot carries it: where it is, and the tag classes it uses. */
export type RawDeck = {
    /**
     * The deck's folder relative to the Files root that holds the project: the hub, or the
     * project's repository.
     */
    path: string;
    /** The `tag.class` of each of its project slides, each once. */
    tags: string[];
};

export type RawPortfolio = {
    manifests: RawManifest[];
    registries: Record<RegistryName, RawRegistry>;
    collections: Record<string, RawCollection>;
    /** What the four feed files hold, from sources/documents/feeds.ts. */
    feeds: RawFeeds;
    /** registries/career.yml as it was parsed, and null when the hub holds no such file. */
    career: Record<string, unknown> | null;
    /**
     * Which documents each project folder holds, by project id, from sources/documents/docs.ts. It
     * is here rather than on the manifest record because no manifest key says it: it is read from
     * the folder, and a reader that put it on the record would be adding a key no schema names.
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
 * `statuses` is a collection entry's `status`.
 */
export type Vocabulary = {
    statuses: string[];
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
    /**
     * The workspace folders this hub reads as projects, one `project.yml` or `.oculus/project.yml`
     * each: the folders of the workspace that can be projects. The server sets them for the primary
     * hub (server/files/roots.ts, `primaryConfig`); a hub built without them, a second hub among
     * them, reads none.
     */
    repositories: RepositoryRoot[];
    /** The folder a new project of each tier is made in, `new_project_dir:` of sources.yml. */
    newProjectDir: Partial<Record<Tier, string>>;
    registries: RegistryFiles;
    collections: CollectionFile[];
    /** The four generated feed files, hub-relative. */
    feeds: FeedFiles;
    /** The configured interval between LinkedIn posts. */
    linkedinCadenceDays: number;
    /**
     * The hub's `recover_command` when it holds `{key}`, so its datasets have a Recover control;
     * null when it is empty, absent or names no `{key}`.
     */
    recoverCommand: string | null;
    /** The career file, hub-relative, or null for a hub whose career is not read. */
    career: string | null;
    /** The merged `manifest_schema`, the form the manifest's JSON Schema is made from. */
    schema: unknown;
    vocab: Vocabulary;
    /**
     * The merged configuration. The schemas of the decks, the C++ file and
     * oculus's own files, and the lists a `vocab.<key>` reads, are made from it.
     */
    merged: Record<string, unknown>;
    /** The hub folder of the portfolio deck, `portfolio_deck:` of sources.yml, or null. */
    portfolioDeck: string | null;
    /** The hue each `tag.class` wears, the engine's `defaults.tag_tones`. */
    tagTones: Record<string, string>;
    /**
     * What the hub's own `.oculus/config.yml` does not name, so that its value came from the
     * engine's defaults: the registries and the YAML feeds (`leads`, `radar`) whose key is absent
     * from its `collections:` list, whether the list is, and whether `portfolio_deck:` is. A hub
     * reports only what it names, so a file in this list that is missing is no finding. Absent for
     * a config read without knowing where each key came from, where every file counts as named.
     */
    unnamed?: {
        registries: RegistryName[];
        feeds: ('leads' | 'radar')[];
        collections: boolean;
        /** Whether its list names no Literature file, so the engine's path of it is read. */
        literature: boolean;
        deck: boolean;
    };
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

/**
 * The payload of the `changes` channel: the moment of the newest record the change log holds,
 * published after each append, so a page holding the log reads it again.
 */
export type ChangesPayload = { at: string };

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
    /** The vocabulary of each hub of the workspace, for the records of that hub alone. */
    hubs: HubVocabs;
    text: Record<string, string>;
    icons: Record<string, string>;
    host: HostInfo;
    findings: Finding[];
};

/**
 * The words one hub gives its own records, read from its own files: the research `domains` (each
 * key of its domains registry to the entry's colour and title as `label`; a colour not written
 * `#rrggbb` is left out), and `venue_themes` and `data_themes`, the `{ key, label }` options of the
 * `themes` field of its venue and dataset registries (a plain word is its own label), and the
 * `collections` it lists: the keys its own `collections:` names, or, when its settings name no
 * list, the keys of the engine's list whose file the hub holds at the engine's path.
 */
export type HubVocab = {
    domains: Record<string, { color?: string; label: string }>;
    venue_themes: { key: string; label: string }[];
    data_themes: { key: string; label: string }[];
    collections: string[];
};

/**
 * The vocabulary of every hub the workspace holds, by the hub's name, and the name of the primary
 * hub (null in a workspace with none), whose records carry no hub name in their ids.
 */
export type HubVocabs = { primary: string | null; lists: Record<string, HubVocab> };

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
    /** The app's host file, a path under its folder, or the empty string for an app with none. */
    host: string;
    /**
     * The folders the app's page may read, as the manifest's `files` lists them (the manifest key
     * is `files`; `files` below is the count of recorded files). Always empty for a root app.
     */
    readFolders: string[];
    /** Whether the manifest asked for the keyring. */
    secrets: boolean;
    /** The activation events of the host, `[onTab]` when the manifest names none. */
    activation: string[];
    /** The names of the machine apps this app's host needs started first. */
    depends: string[];
    /** What the app adds to the shell, as the manifest's `contributes` key declares it. */
    contributes: AppContributes;
    /** Whether the app is disabled in the current workspace, by either list that decides it. */
    disabled: boolean;
    /** Whether the machine-wide list disables the app. */
    machineDisabled: boolean;
    /**
     * What the current workspace's lists say of the app: `disabled` or `enabled` when one of them
     * holds its view id, else the empty string.
     */
    workspaceState: '' | 'disabled' | 'enabled';
    files: number;
    bytes: number;
    hash: string;
    approved: boolean;
    /** Whether the approvals file holds this hash, which a kept app's current files may not. */
    hashApproved: boolean;
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
 * One thing a hub is missing. `scope` is the project folder (the key of its root for a project read
 * from a repository), the collection key or the website, `where` the file, field or entry it is
 * about, `file` the path of the file it is about relative to the folder its `root` names (the empty
 * text when there is none, which the signature does not read), and `signature` the twelve hex
 * characters the mute list in config/behavior.yml holds. A finding of a hub other than the primary
 * has its root key in front of its `scope`, so its signature differs from a primary-hub finding of
 * the same place. `root` is the Files root `file` is relative to: a hub's as for any record, and
 * the repository's key for a finding that names a file of a project read from a repository; such a
 * finding with no file carries no `root`.
 */
export type AuditFinding = Rooted & {
    scope: string;
    where: string;
    /** The path of an existing file below the folder the `root` names, else the empty text. */
    file: string;
    kind: AuditKind;
    message: string;
    signature: string;
};

/** The payload of the `audit` channel: what the scan found, and what the reader has parked. */
export type AuditPayload = {
    findings: AuditFinding[];
    /** The signatures of config/behavior.yml's `audit_ignore:`, the primary hub's mute list. */
    muted: string[];
};

/**
 * One picture of the Memories wall as GET /api/memories answers it: the file's name, and its width
 * and height in pixels as the browser draws it, both null when its header gave no size.
 */
export type Picture = {
    /** The name of the hub whose photo wall holds the picture. */
    hub: string;
    name: string;
    width: number | null;
    height: number | null;
};

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
        /**
         * The file of this feed in each hub other than the primary, relative to that hub, by the
         * hub's root key. Absent while the portfolio is one hub.
         */
        hubFiles?: Record<string, string>;
        missing?: boolean;
        error?: string;
    }
>;

export type {
    Chip,
    CodeAvailability,
    CollectionFile,
    Dataset,
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
    Pillar,
    Project,
    RawCollection,
    RawEntry,
    RawManifest,
    RawRegistry,
    RawRegistryEntry,
    RegistryFiles,
    RegistryMeta,
    RegistryName,
    RepositoryBlock,
    RepositoryRoot,
    Reproduced,
    Resource,
    Rooted,
    ScanRule,
    Subtask,
    Tier,
    Venue,
    DepositChange,
    DepositFinding,
    DepositPlan,
    MainComparison,
    MirrorState
} from './model-entities.ts';

export type {
    Deck,
    DeckCard,
    DeckGroup,
    DeckIdeaCard,
    DeckOrderEntry,
    DeckSlide,
    DeckState,
    DeckSummaryRow,
    PresentEli5,
    PresentPanel,
    PresentSlide,
    PresentSpec,
    PresentTag,
    SlideKind
} from './model-deck.ts';

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
    SchemaOption,
    When
} from './model-collections.ts';

export type { GithubListing, GithubRepo } from './accounts/model-github.ts';

export type {
    AccountProvider,
    AccountRow,
    ConnectAccountConfig,
    ConnectAccountStatus,
    ConnectKind,
    ConnectProvider,
    ConnectSetup,
    ConnectStatus
} from './accounts/model-connect.ts';

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
} from './accounts/model-mail.ts';

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
} from './accounts/model-calendar.ts';

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
    GitGraphRange,
    GitLineChange,
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
    HubNotes,
    NoteEntry,
    NoteLinkRow,
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

export { DECK_GAP } from './model-deck.ts';
export { confirmValues } from './model-agents.ts';
export { domainColorOf } from './model-entities.ts';
export {
    FILTERED_TYPES,
    entryIdOf,
    entryTitleOf,
    optionKey,
    optionKeys,
    optionLabel
} from './model-collections.ts';
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
    NamesAnswer,
    NamesRoot,
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
    isTerminalId,
    LINT_IDS,
    lintersOf,
    SCHEDULE_WORDS,
    STEER_CONTROL,
    SCROLLBACK_LINES,
    STEER_MAX,
    TERMINAL_COLORS,
    TERMINAL_ID,
    TERMINAL_REFUSALS,
    UPDATE_TASKS
} from './machine/model-machine.ts';
export { DEBUG_CONSOLE_KINDS, DEBUG_CONSOLE_MAX, DEBUG_STATUSES } from './machine/model-debug.ts';
export type {
    AppHostRow,
    AppHostsPayload,
    AppMessage,
    AppMessagesPayload,
    BuildOutcome,
    LinksFailure,
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
    StartKind,
    TerminalKind,
    TerminalRefusal,
    TerminalResize,
    TerminalResume,
    UnchosenKey,
    UpdateTask
} from './machine/model-machine.ts';
export type {
    DebugAdapterInfo,
    DebugBreakpoint,
    DebugBreakpointSpec,
    DebugCapabilities,
    DebugExceptionFilter,
    DebugLoadedSource,
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
    DebugWatch
} from './machine/model-debug.ts';
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
export type {
    AppCommand,
    AppContainer,
    AppContainerKind,
    AppContributes,
    AppCustomEditor,
    AppKeybinding,
    AppMenuEntry,
    AppMessageRequest,
    AppPanelRequest,
    AppPanelState,
    AppPickItem,
    AppProgressRequest,
    AppRequest,
    AppRequestBody,
    AppSetting,
    AppSettingType,
    AppShellHost,
    AppShellPayload,
    AppStatusItem,
    AppTreeState,
    AppViewEntry,
    ContextValue
} from './apps/model-apps.ts';
export type {
    AppDebugger,
    AppDecoration,
    AppTaskDescription,
    AppTaskRef,
    AppDecorationChanges,
    AppLanguage,
    AppProblemMatcher,
    AppProblemPattern,
    AppEditorGrammar,
    AppEditorSnippet,
    AppEditorSnippets,
    AppLanguageKit,
    AppScmGroup,
    AppScmResource,
    AppScmState,
    AppSemanticModifier,
    AppSemanticScopes,
    AppSemanticType,
    AppToolsHost,
    AppToolsPayload,
    AppToolsServer
} from './apps/model-apps-tools.ts';
