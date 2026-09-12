// Layer 2, client state. The reactive values the shell palette indexes when it opens. This adapter
// keeps the pure index in palette.ts free of stores while exposing only the snapshot, fetched feeds
// and merged config the overlay needs.

import { config, portfolio } from './entities.svelte.ts';
import { peekFeed } from './feeds.svelte.ts';
import type { PaletteFeeds } from './palette.ts';
import type { Snapshot } from '../data/model.ts';

export type PaletteSource = {
    snapshot: Snapshot | null;
    feeds: PaletteFeeds;
    config: Record<string, unknown>;
};

/** A fresh object so a caller's derived reads every store access in this function. */
export function paletteSource(): PaletteSource {
    return {
        snapshot: portfolio(),
        feeds: {
            leads: peekFeed('leads'),
            radar: peekFeed('radar'),
            inbox: peekFeed('inbox'),
            linkedin: peekFeed('linkedin')
        },
        config: config()?.config ?? {}
    };
}
