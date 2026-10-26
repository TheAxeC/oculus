// Layer 2, server test fixture. The part of the config cache's dependencies (`ConfigCacheDeps` of
// src/lib/server/root/process/config-cache.ts) that a test of one engine and no hub gives alike:
// no primary hub, no other hub, no folder, and empty vocabularies read from no file.

import type { ConfigCacheDeps } from '../../../../src/lib/server/root/process/config-cache.ts';

/** No primary hub, no other hub, no folder, and empty vocabularies read from no file. */
export const NO_HUBS: Readonly<Pick<ConfigCacheDeps, 'primary' | 'others' | 'folders' | 'vocabs'>> =
    Object.freeze({
        primary: () => null,
        others: () => [],
        folders: () => [],
        vocabs: () => ({
            vocabs: { primary: null, lists: {}, order: [], own: {}, ownCollections: [] },
            files: []
        })
    });
