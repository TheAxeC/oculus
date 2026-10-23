// Layer 2, client state, types only. The shapes of the client's shared stores that other stores are
// handed: the payload of every channel, the minute clock, the socket, the write endpoint, and what
// a store needs of one view instance's remembered state, and the query helper the fetch-and-hold
// stores are handed. The client object (state/client/context.ts) builds each store and hands it to
// the stores that read it; the stores in state/client (the query helper included) and
// state/workbench/ui.svelte.ts satisfy these shapes, and a store that is handed one names it from
// here rather than from the module that builds it, so it depends on what it reads and not on how
// that store is made. Nothing here runs, and nothing here reads any module but the data model's
// types and the query client's types.

import type { QueryClient, QueryKey } from '@tanstack/query-core';
import type {
    AppsPayload,
    AppHostsPayload,
    AppShellPayload,
    AppToolsPayload,
    AuditPayload,
    CalendarPayload,
    ConfigPayload,
    DebugConsoleAppend,
    DebugPayload,
    FeedsPayload,
    FilesPayload,
    GitPayload,
    HpcPayload,
    InboxPayload,
    Jump,
    ChangesPayload,
    Message,
    ProcessesPayload,
    RecoverLive,
    SchedulePayload,
    SessionsPayload,
    Snapshot,
    StatePayload,
    UsagePayload
} from '../../../data/model/index.ts';

/** The payload each channel the page types carries, by channel. */
export type Payloads = {
    portfolio: Snapshot;
    config: ConfigPayload;
    sessions: SessionsPayload;
    feeds: FeedsPayload;
    git: GitPayload;
    hpc: HpcPayload;
    recover: RecoverLive;
    processes: ProcessesPayload;
    schedule: SchedulePayload;
    calendar: CalendarPayload;
    inbox: InboxPayload;
    usage: UsagePayload;
    audit: AuditPayload;
    files: FilesPayload;
    state: StatePayload;
    apps: AppsPayload;
    debug: DebugPayload;
    'debug-console': DebugConsoleAppend;
    jump: Jump;
    changes: ChangesPayload;
    'app-hosts': AppHostsPayload;
    'app-shell': AppShellPayload;
    'app-tools': AppToolsPayload;
};

/** What every channel of the wire reads as, one instance per client. */
export type EntitiesStore = {
    receive: (message: Message) => void;
    /** A new connection opened: take the next message of every channel whatever its version. */
    reconnected: () => void;
    /** Hear every message kept, after it is kept. */
    afterReceive: (listener: (message: Message) => void) => void;
    message: (channel: string) => Message | null;
    /**
     * The payload of a message typed by its channel, or null when the message is of another
     * channel or its payload does not read as that channel's. A store that hears a message through
     * `afterReceive` reads its payload this way.
     */
    payloadOf: <K extends keyof Payloads>(message: Message, channel: K) => Payloads[K] | null;
    portfolio: () => Snapshot | null;
    config: () => ConfigPayload | null;
    sessions: () => SessionsPayload | null;
    feeds: () => FeedsPayload | null;
    git: () => GitPayload | null;
    hpc: () => HpcPayload | null;
    /** The Recover runs and the login node's sessions, or null before the first push. */
    recover: () => RecoverLive | null;
    processes: () => ProcessesPayload | null;
    schedule: () => SchedulePayload | null;
    calendar: () => CalendarPayload | null;
    inbox: () => InboxPayload | null;
    usage: () => UsagePayload | null;
    audit: () => AuditPayload | null;
    apps: () => AppsPayload | null;
    /** The host of every app that names one, or null before the first message. */
    appHosts: () => AppHostsPayload | null;
    /** What the running hosts registered in the shell and ask the reader, or null before a push. */
    appShell: () => AppShellPayload | null;
    /** What the running hosts registered with the tools, or null before a push. */
    appTools: () => AppToolsPayload | null;
    /** The debug session's state, or null before the server's first message. */
    debug: () => DebugPayload | null;
};

/** The minute clock of one client. */
export type ClockStore = {
    minuteNow: () => number;
    startMinuteClock: () => () => void;
};

/** Whether the one WebSocket is being opened, is open, or is shut. */
export type Status = 'connecting' | 'open' | 'closed';

/** One client's end of the one WebSocket. */
export type SocketStore = {
    status: () => Status;
    /**
     * Whether the open socket's subscription carries the token the server holds. After a reconnect
     * it is false until the page has renewed its token, since a frame written before is refused.
     */
    admitted: () => boolean;
    /** Hear every change of the status or the admission; the call it returns stops hearing. */
    onLink: (fn: () => void) => () => void;
    connect: (names: string[]) => void;
    disconnect: () => void;
    send: (message: unknown) => boolean;
    /** Add channels; `again` asks the server for listed ones as well, as a load asks for them. */
    subscribe: (names: string[], again?: boolean) => void;
    unsubscribe: (names: string[]) => void;
    listen: (channel: string, fn: (message: Message) => void) => () => void;
    installConfig: (payload: ConfigPayload | null) => void;
    /** Hold the configuration the page was built from until a push above `through` arrives. */
    seedConfig: (payload: ConfigPayload | undefined, through: number) => void;
    /** Hold the apps the page was built from until a push above `through` arrives. */
    seedApps: (payload: AppsPayload, through: number) => void;
};

/** What the endpoint answers with when it wrote, or refused what it was asked to write. */
export type WriteAnswer = {
    ok: boolean;
    changed: string[];
    refused: { field: string; reason: string }[];
    /**
     * Set when the request itself was refused, rather than a field of it, and when the write was
     * given up for want of an answer, which says so in the words of `app.write_timed_out`.
     */
    error?: string;
    /**
     * Set with `error` when the server names the refusal by a code the page acts on, so the page
     * never reads the refusal's words.
     */
    code?: string;
    /** Set with `error` when the server says why it refused, such as the text a parser gave. */
    reason?: string;
    /** True when the request never reached the server: the fetch itself threw. */
    network?: boolean;
    /** The status of a refused request, which a write from an app's frame reports by number. */
    status?: number;
    /** What the endpoint had to say: git's own output, or the suggested commit message. */
    output?: string;
    /** The branch rows of a deposit `branches` action. Absent on every other write. */
    branches?: { name: string; upstream: string; current: boolean }[];
    /**
     * The id the file gives the entry an entry write made or edited. Absent on every other write.
     */
    id?: string;
    /** The SHA-256, in lower-case hex, of the bytes a source save wrote. */
    hash?: string;
    /**
     * The workspace file a Save As or a New made, with every link resolved. Absent on every other
     * write.
     */
    file?: string;
};

/**
 * One act on the files of a deck, as the deck write takes it (server/edit/writes/bodies.ts): `base`
 * is the text of the slide's file as the page read it.
 */
export type DeckEditAct =
    | { act: 'new'; root: string; path: string; after?: string }
    | { act: 'duplicate' | 'delete'; root: string; path: string; slide: string; base: string }
    | {
          act: 'image';
          root: string;
          path: string;
          slide: string;
          base: string;
          name: string;
          data: string;
      }
    | { act: 'create'; root: string; folder: string; title: string }
    | { act: 'outline'; root: string; file: string };

/** What one session write may set. A field left out is left as the overrides file has it. */
export type SessionFields = {
    /** True archives the session, false brings it back. */
    hidden?: boolean;
    /** True pins the session to the top of its group in the sessions list, false unpins it. */
    top?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** A title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/** What a subtask write hangs under: one project by its id, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** What one subtask button does to its line: `do` and `deadline` set that field to the value. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete' | 'do' | 'deadline';

/**
 * What one follow-up button does to its note: `done` takes it out, `do` and `after` set that field.
 */
export type FollowupAction = 'done' | 'do' | 'after';

/**
 * What a caller says about one write it sends: `said` when it words a failure itself, `asked` the
 * codes of the refusals it answers with a question, which are not told as failures, and `words`
 * the sentence of a refusal for an endpoint whose answer names it by a code (the file browser's),
 * so a refusal told for the caller is told in words, never as its code.
 */
export type SendOptions = {
    said?: boolean;
    asked?: readonly string[];
    words?: (code: string, reason?: string) => string;
};

/**
 * What went wrong before the endpoint's answer could be read: no answer came, or the answer was not
 * JSON. The empty string when the answer was read.
 */
export type PostFailure = '' | 'unreachable' | 'unreadable';

/**
 * The endpoint's answer: whether it took the command, the HTTP status it came with (0 when no
 * answer came), and the fields of its body.
 */
export type Posted = {
    ok: boolean;
    status: number;
    body: Record<string, unknown>;
    failed: PostFailure;
};

/**
 * The part of the notices store that the stores below the workbench are handed: say something to
 * the reader, change it in place, and take it out without telling whoever posted it.
 */
export type NoticeSink = {
    post: (
        message: string,
        options?: {
            tone?: 'info' | 'warning' | 'error';
            actions?: { label: string; run: () => void }[];
            progress?: { percent: number | null; cancel: (() => void) | null };
            /** Called when the reader clears the notification. */
            cleared?: () => void;
        }
    ) => number;
    update: (id: number, next: { message?: string; percent?: number | null }) => void;
    remove: (id: number) => void;
};

/** The page's end of the write endpoint, one per client. */
export type WritesStore = {
    setToken: (next: string) => void;
    onToken: (listener: () => void) => void;
    writeToken: () => string;
    /**
     * Run the page's load again and wait until the page holds the token it handed over: a server
     * that restarted minted a new one, and the page that was open holds the old one.
     */
    renewToken: () => Promise<void>;
    /** Post one command to an endpoint of its own with the write token, and read its answer. */
    postCommand: (
        path: string,
        body: unknown,
        headers?: Record<string, string>,
        keepalive?: boolean
    ) => Promise<Posted>;
    pending: () => boolean;
    lastError: () => string | null;
    writeManifest: (id: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    openFolder: (path: string, root?: string) => Promise<WriteAnswer>;
    openFile: (root: string, path: string) => Promise<WriteAnswer>;
    revealPath: (root: string, path: string) => Promise<WriteAnswer>;
    writeSession: (id: string, fields: SessionFields) => Promise<WriteAnswer>;
    writeEntry: (
        collection: string,
        id: string,
        fields: Record<string, unknown>
    ) => Promise<WriteAnswer>;
    writeSubtask: (
        target: SubtaskTarget,
        key: string,
        action: SubtaskAction,
        value?: string
    ) => Promise<WriteAnswer>;
    addSubtask: (
        target: SubtaskTarget,
        fields: { do: string; deadline?: string }
    ) => Promise<WriteAnswer>;
    writeFollowup: (
        target: SubtaskTarget,
        key: string,
        action: FollowupAction,
        value?: string
    ) => Promise<WriteAnswer>;
    addFollowup: (
        target: SubtaskTarget,
        fields: { do: string; after?: string }
    ) => Promise<WriteAnswer>;
    writeHost: (name: string, status: string) => Promise<WriteAnswer>;
    /** Set the changed sections of the career file, a section cleared by null. */
    writeCareer: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /**
     * Add one entry to a collection of the hub `root` names, the primary (else the first) when it
     * is absent; the answer's `id` is the new entry's id in the portfolio.
     */
    newEntry: (
        collection: string,
        fields: Record<string, unknown>,
        root?: string
    ) => Promise<WriteAnswer>;
    /** Remove one entry from a collection, in the hub the entry's id names. */
    deleteEntry: (collection: string, id: string) => Promise<WriteAnswer>;
    /** Add one position lead to the leads feed of the primary hub. */
    addLead: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    reorderEntries: (collection: string, order: string[]) => Promise<WriteAnswer>;
    /** Set one field of a feed entry, named by its internal id. */
    writeFeedField: (
        feed: string,
        id: string,
        field: string,
        value: string | number | boolean | null
    ) => Promise<WriteAnswer>;
    /** Delete one feed entry, named by its internal id. */
    deleteFeedEntry: (feed: string, id: string) => Promise<WriteAnswer>;
    addRadarEntry: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /**
     * Save one paper to the Literature collection of the hub `root` names, else of the primary when
     * it names the collection, else of the first hub that does; the answer's `id` is the paper's id
     * in the portfolio, the key the server made under the name of the hub it was saved in.
     */
    saveLiterature: (
        source: 'search' | 'lit-watch' | 'hand',
        paper: Record<string, unknown>,
        root?: string
    ) => Promise<WriteAnswer>;
    addLinkedinIdea: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /** Promote one LinkedIn idea, named by its internal id, to the next numbered post. */
    markPosted: (id: string) => Promise<WriteAnswer>;
    writeDeckSlides: (
        deck: { root: string; path: string },
        groups: { group: string; base: string[]; slides: string[] }[],
        order?: { base: string[]; entries: string[] }
    ) => Promise<WriteAnswer>;
    /** One act on the files of a deck; the answer's `id` is what to show next. */
    writeDeckEdit: (act: DeckEditAct, said?: boolean) => Promise<WriteAnswer>;
    /** Rewrite the rail list; `said` when the caller posts the refusal's notification itself. */
    writeRail: (
        rail: { label: string; glyph: string; page: string; chord: string; group_glyph: string }[],
        said?: boolean
    ) => Promise<WriteAnswer>;
    /**
     * Set one option of a defaults file, by the file's name and the dotted key path, in the file
     * the user's value of it lives in; `copy` adds the key even when the value is the one in force.
     */
    writeConfigKey: (
        file: string,
        key: string,
        value: unknown,
        copy?: boolean
    ) => Promise<WriteAnswer>;
    /** Set one setting an app declares, by its whole key. */
    writeAppSetting: (key: string, value: unknown) => Promise<WriteAnswer>;
    /**
     * Set one list option or family of a defaults file whole, if `base` is still the value in
     * force.
     */
    writeConfigValue: (
        file: string,
        key: string,
        value: unknown,
        base: unknown,
        copy?: boolean
    ) => Promise<WriteAnswer>;
    /** Take one option out of the file the user's value of it lives in, back to oculus's value. */
    resetConfig: (file: string, key: string) => Promise<WriteAnswer>;
    muteFinding: (signature: string, muted: boolean) => Promise<WriteAnswer>;
    addMemory: (name: string, data: string) => Promise<WriteAnswer>;
    newIdea: (fields: {
        id: string;
        title?: string;
        short?: string;
        domain?: string;
        eli5?: string;
        tier?: string;
        folder?: string;
    }) => Promise<WriteAnswer>;
    /** Take one recorded change back, by the moment the change log stamped it. */
    undoWrite: (at: string) => Promise<WriteAnswer>;
    writeGit: (
        action: string,
        root: string,
        fields?: Record<string, unknown>,
        options?: SendOptions
    ) => Promise<WriteAnswer>;
    writeDeposit: (
        action: string,
        id: string,
        fields?: Record<string, unknown>
    ) => Promise<WriteAnswer>;
    send: (request: unknown, path?: string, options?: SendOptions) => Promise<WriteAnswer>;
    /**
     * One write from an app's frame to /api/write: the token, `x-oculus-app` with the view id (the
     * root key percent-encoded) and `x-oculus-write-kind` with the kind the app named. A refusal
     * is the app's to word, so it is not told to the notifications.
     */
    sendFromApp: (request: unknown, app: string, kind: string) => Promise<WriteAnswer>;
    /**
     * Hear every write that does not land, unless its caller says it: the words the server gave,
     * or the error of a write that got no answer, with whether the server answered.
     */
    onUnwritten: (listener: (reason: string, refused: boolean) => void) => void;
};

/**
 * What a store needs of one view instance's remembered state: read it, write it, forget it. The
 * ui store (state/workbench/ui.svelte.ts) holds it and satisfies this shape.
 */
export type InstanceStates = {
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
    clearInstanceState: (id: string) => void;
    /** The ids of the instance records whose id starts with a prefix. */
    instanceKeys: (prefix: string) => string[];
};

/**
 * What a query function is handed beside the answer held: the signal that says its fetch was
 * cancelled, and a way to leave the key stale once the fetch has landed without waking a reader,
 * for an answer that says nothing about the key's data.
 */
export type Fetching = { signal: AbortSignal; leaveStale: () => void };

/**
 * The function that asks an endpoint for a key. It answers the store's held shape and never
 * throws.
 */
export type Fetcher<T> = (held: T | undefined, fetching: Fetching) => Promise<T>;

/**
 * What a mark or a reload does to a fetch already in flight. `drop` leaves it alone, `wait` marks
 * the key again once it lands so that the next read asks, `again` marks it again and asks at once,
 * and `replace` cancels it so its answer is never held.
 */
export type WhileFetching = 'drop' | 'wait' | 'again' | 'replace';

/** What a read answers: the answer held, and whether it is being asked for again. */
export type Read<T> = { data: T | undefined; refreshing: boolean };

/** What is held under a key without asking: the answer, and whether a mark has made it stale. */
export type Peek<T> = { data: T | undefined; stale: boolean };

/** One query of the cache: its key and the answer it holds, or undefined before the first. */
export type Entry<T> = { key: readonly unknown[]; data: T | undefined };

/** The query client of a client state, and what the fetch-and-hold stores ask of it. */
export type Queries = {
    /** The query client, for a test to look into the cache. */
    client: QueryClient;
    /**
     * Run a call for a tab. While `shown` answers false, a read asks nothing and answers what is
     * held, and a refetch marks the key and asks nothing, so the tab asks once when it is shown.
     * Scopes nest, and the one before is restored when the call returns or throws.
     */
    scoped: <T>(shown: () => boolean, run: () => T) => T;
    /**
     * The answer held for a key. It asks, on a microtask, when nothing is held or the held answer
     * was marked, and only when `enabled` says there is something to ask with and the tab it is
     * read for is not hidden.
     */
    read: <T>(key: QueryKey, fetcher: Fetcher<T>, options: { enabled: boolean }) => Read<T>;
    /** The answer held for a key, and whether it is stale, asking for nothing. */
    peek: <T>(key: QueryKey) => Peek<T>;
    /**
     * The answer of a key as an awaited call: what is held when it is fresh, else the answer of
     * the request made or joined, even when that request is cancelled meanwhile and so not held.
     */
    fetch: <T>(key: QueryKey, fetcher: Fetcher<T>) => Promise<T>;
    /**
     * Ask for a key at once, on a microtask, and not when a reader next reads it. A request already
     * out is dealt with as `whileFetching` says. For a hidden tab it asks nothing and marks the
     * key, and the tab asks once when it is shown.
     */
    refetch: <T>(key: QueryKey, fetcher: Fetcher<T>, whileFetching: WhileFetching) => void;
    /** Put an answer in as though it had been fetched; a mark on the key stays. */
    hold: (key: QueryKey, data: unknown) => void;
    /** Mark every query whose key opens with this one, as `whileFetching` says. */
    mark: (key: QueryKey, whileFetching: WhileFetching) => void;
    /** Drop the queries whose key opens with this one, so each reads as never asked. */
    forget: (key: QueryKey) => void;
    /** The queries whose key opens with this one, with what each holds. */
    entries: <T>(key: QueryKey) => Entry<T>[];
};
