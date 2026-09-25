// Layer 2, client state, types only. The shapes of the client's shared stores that other stores
// are handed: the payload of every channel, the minute clock, the socket, the write endpoint, and
// what a store needs of one view instance's remembered state. The client object
// (state/client/context.ts) builds each store and hands it to the stores that read it; the stores
// in state/client and state/workbench/ui.svelte.ts satisfy these shapes, and a store that is
// handed one names it from here rather than from the module that builds it, so it depends on what
// it reads and not on how that store is made. Nothing here runs, and nothing here reads any module
// but the data model's types.

import type {
    AuditPayload,
    CalendarPayload,
    ConfigPayload,
    FeedsPayload,
    GitPayload,
    HpcPayload,
    InboxPayload,
    Message,
    SessionsPayload,
    Snapshot,
    UsagePayload
} from '../../data/model/index.ts';

/** What every channel of the wire reads as, one instance per client. */
export type EntitiesStore = {
    receive: (message: Message) => void;
    /** A new connection opened: take the next message of every channel whatever its version. */
    reconnected: () => void;
    /** Hear every message kept, after it is kept. */
    afterReceive: (listener: (message: Message) => void) => void;
    message: (channel: string) => Message | null;
    portfolio: () => Snapshot | null;
    config: () => ConfigPayload | null;
    sessions: () => SessionsPayload | null;
    feeds: () => FeedsPayload | null;
    git: () => GitPayload | null;
    hpc: () => HpcPayload | null;
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
    /** True dismisses the session from the rail, false brings it back. */
    hidden?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** A title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/** What a subtask write hangs under: one project by its id, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/** What a caller says about one write it sends: `said` when it words a failure itself. */
export type SendOptions = { said?: boolean };

/** The page's end of the write endpoint, one per client. */
export type WritesStore = {
    setToken: (next: string) => void;
    writeToken: () => string;
    pending: () => boolean;
    lastError: () => string | null;
    writeManifest: (id: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    openFolder: (path: string) => Promise<WriteAnswer>;
    openFile: (root: string, path: string) => Promise<WriteAnswer>;
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
    addLinkedinIdea: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    markPosted: (file: string) => Promise<WriteAnswer>;
    newEntry: (collection: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;
    writeDeck: (selection: string[], order: string[]) => Promise<WriteAnswer>;
    /** Rewrite the rail list; `said` when the caller posts the refusal's notification itself. */
    writeRail: (
        rail: { label: string; glyph: string; page: string }[],
        said?: boolean
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
        fields?: Record<string, unknown>
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
};
