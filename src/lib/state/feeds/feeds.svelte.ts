// Layer 2, client state. Reads one kind from the complete feed payload delivered by the socket.

import type { EntitiesStore } from '../stores/shapes.ts';
import type { FeedKind, FeedsPayload } from '../../data/model/index.ts';

export type FeedState = FeedsPayload[FeedKind];

/** One client's reader of the four generated feeds. */
export type FeedsStore = {
    feed: (kind: FeedKind) => FeedState | null;
};

export function createFeeds(entities: EntitiesStore): FeedsStore {
    /** One feed state, or null before the starting `feeds` message arrives. */
    function feed(kind: FeedKind): FeedState | null {
        return entities.feeds()?.[kind] ?? null;
    }

    return { feed };
}
