// Layer 2, client state. What the socket delivered, by channel, and nothing derived from it: the
// joins are state/client/selectors.svelte.ts's and read this. One message is held per channel, the
// latest, which is the same rule the server sends by.
//
// A message whose version is below the one held is dropped. Versions arrive in order on one
// connection, but a reconnect subscribes again and the server sends the current message of every
// channel, so the page can be handed a message it already has; the check makes that harmless.
//
// The messages belong to one client rather than to the module: createEntities() is called once by
// state/client/context.ts, so two pages, or two test cases, share nothing.

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
} from '../../data/model.ts';

/** What every channel of the wire reads as, one instance per client. */
export type EntitiesStore = {
    receive: (message: Message) => void;
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

export function createEntities(): EntitiesStore {
    const messages: Record<string, Message | undefined> = $state({});

    /** Store a message unless the channel already holds a newer one. */
    function receive(message: Message): void {
        const held = messages[message.channel];
        if (held !== undefined && message.version < held.version) return;
        messages[message.channel] = message;
    }

    /** The current message of a channel, or null when none has arrived. */
    function message(channel: string): Message | null {
        return messages[channel] ?? null;
    }

    /** The payload of one channel, or undefined before its first message; each reader names it. */
    function payload(channel: string): unknown {
        return messages[channel]?.payload;
    }

    return {
        receive,
        message,
        /** The portfolio snapshot, or null before the first one arrives. */
        portfolio: () => (payload('portfolio') as Snapshot | undefined) ?? null,
        /** The config payload: the merged map, the flat catalog and the config findings. */
        config: () => (payload('config') as ConfigPayload | undefined) ?? null,
        /** Every session record and the workspace tree they group into, or null before the scan. */
        sessions: () => (payload('sessions') as SessionsPayload | undefined) ?? null,
        /** All four feed states, or null before the starting `feeds` message arrives. */
        feeds: () => (payload('feeds') as FeedsPayload | undefined) ?? null,
        /** The git state of every workspace the sessions payload names, keyed by root. */
        git: () => (payload('git') as GitPayload | undefined) ?? null,
        /** The latest Live HPC state, or null before the server's starting message. */
        hpc: () => (payload('hpc') as HpcPayload | undefined) ?? null,
        /** The latest calendar agenda, or null before the server's first message. */
        calendar: () => (payload('calendar') as CalendarPayload | undefined) ?? null,
        /** The latest inbox plate and its triage notes, or null before the server's first message. */
        inbox: () => (payload('inbox') as InboxPayload | undefined) ?? null,
        /** The Claude and Codex subscription windows and seven-day token totals. */
        usage: () => (payload('usage') as UsagePayload | undefined) ?? null,
        /** What the audit scan found and what the reader has parked, or null before the first scan. */
        audit: () => (payload('audit') as AuditPayload | undefined) ?? null
    };
}
