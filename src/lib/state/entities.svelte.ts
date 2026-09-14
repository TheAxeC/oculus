// Layer 2, client state. What the socket delivered, by channel, and nothing derived from it: the
// joins are state/selectors.svelte.ts's and read this. One message is held per channel, the latest,
// which is the same rule the server sends by.
//
// A message whose version is below the one held is dropped. Versions arrive in order on one
// connection, but a reconnect subscribes again and the server sends the current message of every
// channel, so the page can be handed a message it already has; the check makes that harmless.

import type {
    ConfigPayload,
    FeedsPayload,
    GitPayload,
    HpcPayload,
    Message,
    SessionsPayload,
    Snapshot,
    UsagePayload
} from '../data/model.ts';

const messages: Record<string, Message | undefined> = $state({});

/** Store a message unless the channel already holds a newer one. */
export function receive(message: Message): void {
    const held = messages[message.channel];
    if (held !== undefined && message.version < held.version) return;
    messages[message.channel] = message;
}

/** The current message of a channel, or null when none has arrived. */
export function message(channel: string): Message | null {
    return messages[channel] ?? null;
}

/** The portfolio snapshot, or null before the first one arrives. */
export function portfolio(): Snapshot | null {
    const held = messages.portfolio;
    return held === undefined ? null : (held.payload as Snapshot);
}

/** The config payload: the merged map, the flat catalog and the config findings. */
export function config(): ConfigPayload | null {
    const held = messages.config;
    return held === undefined ? null : (held.payload as ConfigPayload);
}

/** Every session record and the workspace tree they group into, or null before the first scan. */
export function sessions(): SessionsPayload | null {
    const held = messages.sessions;
    return held === undefined ? null : (held.payload as SessionsPayload);
}

/** All four feed states, or null before the starting `feeds` message arrives. */
export function feeds(): FeedsPayload | null {
    const held = messages.feeds;
    return held === undefined ? null : (held.payload as FeedsPayload);
}

/** The git state of every workspace the sessions payload names, keyed by root. */
export function git(): GitPayload | null {
    const held = messages.git;
    return held === undefined ? null : (held.payload as GitPayload);
}

/** The latest Live HPC state, or null before the server's starting message. */
export function hpc(): HpcPayload | null {
    const held = messages.hpc;
    return held === undefined ? null : (held.payload as HpcPayload);
}

/** The Claude and Codex subscription windows and seven-day token totals. */
export function usage(): UsagePayload | null {
    const held = messages.usage;
    return held === undefined ? null : (held.payload as UsagePayload);
}
