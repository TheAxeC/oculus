// Layer 1, data. Portfolio aggregates and the public facade for every data and wire type.
// Snapshot ownership stays here while leaf concerns remain small and existing imports stay stable.

import type { AppContributes } from './apps/model-apps.ts';
import type {
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
    RawManifest,
    RawRegistry,
    RegistryFiles,
    RegistryName,
    RepositoryRoot,
    Resource,
    Rooted,
    ScanRule,
    Venue
} from './model-entities.ts';
import type {
    Career,
    Collection,
    CollectionEntry,
    FeedData,
    FeedKind,
    Feeds,
    HubVocabs,
    RawFeeds,
    ReadCollection,
    SchemaField,
    Vocabulary
} from './model-collections.ts';

export type { FeedData, FeedEntry, FeedKind } from './model-collections.ts';
export type { HubVocab, HubVocabs, ListedCollection } from './model-collections.ts';
export type { KeyFault, ValidationRules, Vocabulary } from './model-collections.ts';

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
    collections: Record<string, ReadCollection>;
    /** What the four feed files hold, from sources/documents/feeds.ts. */
    feeds: RawFeeds;
    /** The career file as it was parsed, and null when the hub holds no such file. */
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
    newProjectDir: Partial<Record<string, string>>;
    registries: RegistryFiles;
    /** The hub's `collections:` list minus its feeds, each entry with every field it sets. */
    collections: CollectionEntry[];
    /** The four generated feed files, hub-relative. */
    feeds: FeedFiles;
    /** The configured interval between LinkedIn posts. */
    linkedinCadenceDays: number;
    /** The career file, hub-relative, or null for a hub whose career is not read. */
    career: string | null;
    /**
     * The merged `manifest_schema` with the hub's `manifest_fields` laid into it, the form the
     * manifest's JSON Schema is made from and the manifest write reads.
     */
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
     * engine's defaults: the registries and the YAML feeds (`leads`, `radar`) no entry of its
     * `collections:` list names in `registry:`, whether the list is, and whether `portfolio_deck:`
     * is. A hub reports only what it names, so a file in this list that is missing is no finding,
     * except that a hub naming no list which holds the `.oculus/data/` folder reports a missing
     * file of the list as it reports a named one (the build reads it so, `heldUnnamed` of
     * data/index.ts). Absent for a config read without knowing where each key came from, where
     * every file counts as named.
     */
    unnamed?: {
        registries: RegistryName[];
        feeds: ('leads' | 'radar')[];
        collections: boolean;
        /**
         * Whether its list names no entry of the `literature` registry, so oculus's own entry of it
         * is read.
         */
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
    /**
     * A project and a person its `lead:`, its `collaborators:` or its `supervisors:` names, a
     * person of its team.
     */
    projectPerson: [Id, Id][];
    /** An entry of the joint-work collection and the person its `person:` names. */
    jointWorkPerson: [Id, Id][];
    /** A person and each organisation their `affiliations:` name. */
    personOrganisation: [Id, Id][];
    /** A funding scheme and the organisation its `funder:` names. */
    fundingOrganisation: [Id, Id][];
};

/**
 * What goes over the wire. Flat, JSON-safe and small: no value in it is
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
 * One hub's own snapshot, as normalise builds it from that hub's files: the snapshot the merge of
 * the hubs (snapshot/hubs/merge.ts) joins, whose feeds are that hub's own (`RawFeeds`), so it has
 * no rows of `byHub`. The merge gives the `Snapshot` the socket carries.
 */
export type HubSnapshot = Omit<Snapshot, 'entities'> & {
    entities: Omit<Entities, 'feeds'> & { feeds: RawFeeds };
};

/**
 * One message on the socket. The types of the wire live here with the
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
 * without it reads every channel and writes to none.
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
 * the icon map names, the classes a VS Code code theme may name, the machine the server runs on,
 * what was wrong, and the file each key was read from. The icons ride here rather than being
 * fetched by the page because they are read from the config the same way every other vocabulary is;
 * the classes ride beside the map because a row of `code_themes.vscode` whose class is not among
 * them is no code theme, which the page tells each time it installs the map; the machine rides here
 * because this is the channel every page has from its first message.
 */
export type ConfigPayload = {
    config: Record<string, unknown>;
    /** The vocabulary of each hub of the workspace, for the records of that hub alone. */
    hubs: HubVocabs;
    text: Record<string, string>;
    icons: Record<string, string>;
    /** The keys of the checkout's TextMate rules (data/places/code-rules.ts, `vscodeRuleIds`). */
    codeThemeClasses: string[];
    host: HostInfo;
    findings: Finding[];
    /**
     * The file each top-level key of the merged map was read from, by its path, so a finding the
     * page makes about a key names that file.
     */
    from: Record<string, string>;
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
 * Which section of the audit a finding belongs to: an open marker left in a document (`todo`); a
 * manifest field a live project has not filled in, a gap in a collection's entries, or a heading a
 * `required_sections` row of the hub's `audit:` asks for (`data`); a file a `required_files` row
 * asks for, or a part of `audit:` that is not of its shape (`conform`); a manifest naming no lead,
 * a project no board takes, a done project carrying a Focus lane's chip, or a project at a stage
 * outside the folders a `stage_folders` row names (`manifest`); a field that has stopped being a
 * glance (`readability`); and the hub's own website feed, which `audit.website` names, against its
 * projects (`publink`).
 */
export type AuditKind = 'todo' | 'data' | 'conform' | 'manifest' | 'readability' | 'publink';

/**
 * One thing a hub is missing. `hub` is the name of the hub it is of, which the Audit view draws as
 * the chip beside the scope. `scope` is the project folder (the key of its root for a project read
 * from a repository), the collection key or the website, with no hub in it, `where` the file, field
 * or entry it is about, `file` the path of the file it is about relative to the folder its `root`
 * names (the empty text when there is none, which the signature does not read), and `signature`
 * the twelve hex characters the mute list `audit_ignore:` holds, read with the hub's name in front
 * of the scope for a hub other than the primary, so the same place in two hubs has two signatures.
 * `root` is the Files root `file` is relative to: the hub's, and the repository's key for a finding
 * that names a file of a project read from a repository.
 */
export type AuditFinding = Rooted & {
    hub: string;
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
    /** The signatures of the merged config's `audit_ignore:`, the mute list in force. */
    muted: string[];
};

/**
 * One picture of the Memories wall as GET /api/memories answers it: the file's path in the wall's
 * folder (`/` between the folders under the wall and the file name), and its width and height in
 * pixels as the browser draws it, both null when its header gave no size.
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
         * The file of this feed in each hub of the workspace, relative to that hub, by the hub's
         * name. Absent before the hubs are merged.
         */
        hubFiles?: Record<string, string>;
        /**
         * The schema of this feed's file in each hub of the workspace that carries one, by the
         * hub's name: the fields a page of one of its entries edits. Absent before the hubs are
         * merged.
         */
        hubSchemas?: Record<string, SchemaField[]>;
        missing?: boolean;
        error?: string;
    }
>;

export type {
    Chip,
    CodeAvailability,
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
    RecoverSource,
    Reproduced,
    Resource,
    Rooted,
    ScanRule,
    Subtask,
    Venue,
    DepositChange,
    DepositFinding,
    DepositPlan,
    MainComparison,
    MirrorState
} from './model-entities.ts';

export type * from './machine/model-recover.ts';

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
    CollectionEntry,
    CollectionFlag,
    CollectionTraits,
    Entry,
    Feeds,
    KeyPicked,
    Lead,
    RawFeeds,
    ReadCollection,
    RegistryWord,
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
export { BRANCH_NOT_MERGED, queueIsCurrent } from './model-sessions.ts';

export { DECK_GAP } from './model-deck.ts';
export { confirmValues } from './model-agents.ts';
export { domainColorOf } from './model-entities.ts';
export { COLLECTION_FLAGS, FILTERED_TYPES, REGISTRY_WORDS } from './model-collections.ts';
export { displayFields, entryIdOf, entryTitleOf, primaryKeyOf } from './model-collections.ts';
export { optionKey, optionKeys, optionLabel } from './model-collections.ts';
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
export { profileWords, TERMINAL_PROFILES, type TerminalProfile } from './machine/terminal-kinds.ts';
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
    HubTask,
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
    HeldLayout,
    LayoutWrite,
    PageState,
    PageStateAnswer,
    PageStateRead,
    PageStateWrite,
    StatePayload
} from './machine/model-page-state.ts';
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
