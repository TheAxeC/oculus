// Layer 2, client state. Reads one kind from the complete feed payload delivered by the socket.

import { feeds } from './entities.svelte.ts';
import type { FeedKind, FeedsPayload } from '../data/model.ts';

export type FeedState = FeedsPayload[FeedKind];

/** One feed state, or null before the starting `feeds` message arrives. */
export function feed(kind: FeedKind): FeedState | null {
    return feeds()?.[kind] ?? null;
}
