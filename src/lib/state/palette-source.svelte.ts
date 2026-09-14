// Layer 2, client state. The reactive values the shell palette indexes when it opens. This adapter
// keeps the pure index in palette.ts free of stores while exposing only the snapshot, socket feeds
// and merged config the overlay needs.

import type { EntitiesStore } from './entities.svelte.ts';
import type { FeedsStore } from './feeds.svelte.ts';
import type { PaletteFeeds } from './palette.ts';
import type { Snapshot } from '../data/model.ts';

export type PaletteSource = {
    snapshot: Snapshot | null;
    feeds: PaletteFeeds;
    config: Record<string, unknown>;
};

/** What one client's palette indexes when it opens. */
export type PaletteSourceStore = {
    paletteSource: () => PaletteSource;
};

export function createPaletteSource(
    entities: EntitiesStore,
    feeds: FeedsStore
): PaletteSourceStore {
    /** A fresh object so a caller's derived reads every store access in this function. */
    function paletteSource(): PaletteSource {
        return {
            snapshot: entities.portfolio(),
            feeds: {
                leads: feeds.feed('leads'),
                radar: feeds.feed('radar'),
                inbox: feeds.feed('inbox'),
                linkedin: feeds.feed('linkedin')
            },
            config: entities.config()?.config ?? {}
        };
    }

    return { paletteSource };
}
