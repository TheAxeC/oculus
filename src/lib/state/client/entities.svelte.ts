// Layer 2, client state. What the socket delivered, by channel, and nothing derived from it: the
// joins are state/client/selectors.svelte.ts's and read this. One message is held per channel, the
// latest, which is the same rule the server sends by.
//
// A message whose version is below the one held is dropped. Versions arrive in order on one
// connection, but a reconnect subscribes again and the server sends the current message of every
// channel, so the page can be handed a message it already has; the check makes that harmless. A
// reconnect may also reach a restarted server, whose hub numbers every channel from the start
// again, so after a reconnect the first message of each channel is taken whatever its version: it
// is that server's current message.
//
// The messages belong to one client rather than to the module: createEntities() is called once by
// state/client/context.ts, so two pages, or two test cases, share nothing.
//
// A store that acts on a change of a channel, rather than drawing what it holds, registers to hear
// every message this keeps, after it is kept: the notifications posted for a session that starts
// waiting, a job that leaves the queue and an update that lands are told apart from the message
// before on the same channel, so they are heard here once per message and not once per redraw.

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

export function createEntities(): EntitiesStore {
    const messages: Record<string, Message | undefined> = $state({});

    /** What registered to hear every message kept. */
    const listeners: ((message: Message) => void)[] = [];

    /** The channels whose next message is taken whatever its version, after a reconnect. */
    let fresh = new Set<string>();

    /** Store a message unless the channel already holds a newer one, and tell every listener. */
    function receive(message: Message): void {
        const held = messages[message.channel];
        const first = fresh.delete(message.channel);
        if (!first && held !== undefined && message.version < held.version) return;
        messages[message.channel] = message;
        for (const listener of listeners) listener(message);
    }

    function afterReceive(listener: (message: Message) => void): void {
        listeners.push(listener);
    }

    /** The current message of a channel, or null when none has arrived. */
    function message(channel: string): Message | null {
        return messages[channel] ?? null;
    }

    /** The payload of one channel, or undefined before its first message; each reader names it. */
    function payload(channel: string): unknown {
        return messages[channel]?.payload;
    }

    function reconnected(): void {
        fresh = new Set(Object.keys(messages));
    }

    return {
        receive,
        reconnected,
        afterReceive,
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
        /**
         * The latest inbox plate and its triage notes, or null before the server's first message.
         */
        inbox: () => (payload('inbox') as InboxPayload | undefined) ?? null,
        /** The Claude and Codex subscription windows and seven-day token totals. */
        usage: () => (payload('usage') as UsagePayload | undefined) ?? null,
        /**
         * What the audit scan found and what the reader has parked, or null before the first scan.
         */
        audit: () => (payload('audit') as AuditPayload | undefined) ?? null
    };
}
