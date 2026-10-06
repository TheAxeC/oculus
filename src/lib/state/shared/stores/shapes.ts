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
    AuditPayload,
    CalendarPayload,
    ConfigPayload,
    FeedsPayload,
    FilesPayload,
    GitPayload,
    HpcPayload,
    InboxPayload,
    Message,
    ProcessesPayload,
    SessionsPayload,
    Snapshot,
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
    processes: ProcessesPayload;
    calendar: CalendarPayload;
    inbox: InboxPayload;
    usage: UsagePayload;
    audit: AuditPayload;
    files: FilesPayload;
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
    processes: () => ProcessesPayload | null;
    calendar: () => CalendarPayload | null;
    inbox: () => InboxPayload | null;
    usage: () => UsagePayload | null;
    audit: () => AuditPayload | null;
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
    connect: (names: string[]) => void;
    disconnect: () => void;
    send: (message: unknown) => boolean;
    subscribe: (names: string[]) => void;
    unsubscribe: (names: string[]) => void;
    listen: (channel: string, fn: (message: Message) => void) => () => void;
    installConfig: (payload: ConfigPayload | null) => void;
    /** Hold the configuration the page was built from until a push above `through` arrives. */
    seedConfig: (payload: ConfigPayload | undefined, through: number) => void;
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
    /** True when the request never reached the server: the fetch itself threw. */
    network?: boolean;
    /** What the endpoint had to say: git's own output, or the suggested commit message. */
    output?: string;
    /** The branch rows of a deposit `branches` action. Absent on every other write. */
    branches?: { name: string; upstream: string; current: boolean }[];
    /**
     * The id the file gives the entry an entry write made or edited. Absent on every other write.
     */
    id?: string;
};

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

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/**
 * What a caller says about one write it sends: `said` when it words a failure itself, and `asked`
 * the codes of the refusals it answers with a question, which are not told as failures.
 */
export type SendOptions = { said?: boolean; asked?: readonly string[] };

/**
 * What went wrong before the endpoint's answer could be read: no answer came, or the answer was not
 * JSON. The empty string when the answer was read.
 */
export type PostFailure = '' | 'unreachable' | 'unreadable';

/** The endpoint's answer: whether it took the command, and the fields of its body. */
export type Posted = { ok: boolean; body: Record<string, unknown>; failed: PostFailure };

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
    postCommand: (path: string, body: unknown) => Promise<Posted>;
    pending: () => boolean;
    lastError: () => string | null;
    writeManifest: (id: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    openFolder: (path: string) => Promise<WriteAnswer>;
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
    writeHost: (name: string, status: string) => Promise<WriteAnswer>;
    reorderEntries: (collection: string, order: string[]) => Promise<WriteAnswer>;
    deleteEntry: (collection: string, id: string) => Promise<WriteAnswer>;
    writeFeedField: (
        feed: string,
        id: string,
        field: string,
        value: string | number | boolean | null
    ) => Promise<WriteAnswer>;
    deleteFeedEntry: (feed: string, id: string) => Promise<WriteAnswer>;
    addLead: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    addRadarEntry: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    addLinkedinIdea: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    markPosted: (file: string) => Promise<WriteAnswer>;
    newEntry: (collection: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    writeDeck: (selection: string[], order: string[]) => Promise<WriteAnswer>;
    /** Rewrite the rail list; `said` when the caller posts the refusal's notification itself. */
    writeRail: (
        rail: { label: string; glyph: string; page: string }[],
        said?: boolean
    ) => Promise<WriteAnswer>;
    /** Set one option of a tracked config file, by its file name and dotted key path. */
    writeConfigKey: (file: string, key: string, value: unknown) => Promise<WriteAnswer>;
    /**
     * Set one list option or family of a tracked config file whole, if the file still holds `base`.
     */
    writeConfigValue: (
        file: string,
        key: string,
        value: unknown,
        base: unknown
    ) => Promise<WriteAnswer>;
    muteFinding: (signature: string, muted: boolean) => Promise<WriteAnswer>;
    addMemory: (name: string, data: string) => Promise<WriteAnswer>;
    newIdea: (fields: {
        id: string;
        title?: string;
        short?: string;
        domain?: string;
        eli5?: string;
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
