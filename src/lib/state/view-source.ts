// Layer 2, client state. Which file of the hub a view is drawn from: one of the four feeds by its
// kind, the people registry, or one collection by its key. All three are read from the merged
// configuration the config channel carries, so every view that offers the file shares one rule and
// one answer.
//
// It reads the configuration and nothing else. A kind the config names no path for is null, which
// is the view drawing no control rather than a control that opens nothing, and a path that names a
// folder rather than a file is answered as it is written: whether a folder can be opened as one
// file is the view's own question, not this rule's.

import { HUB_ROOT } from './collection.ts';
import { isMap } from '../data/guards.ts';
import type { FeedKind } from '../data/model.ts';

/** One file of the hub, addressed the way the source tab addresses it. */
export type ViewSource = { root: string; path: string };

/** What a view is drawn from: one of the four feeds, the people registry, or a collection. */
export type ViewSourceKind = FeedKind | 'collection' | 'people';

/** The configuration key each feed's path is written under. */
const FEED_KEYS: Record<FeedKind, string> = {
    inbox: 'inbox_file',
    leads: 'leads_file',
    radar: 'radar_file',
    linkedin: 'linkedin_dir'
};

/** The configuration key the people registry's path is written under. */
const PEOPLE_KEY = 'people_file';

/** A configured path, and null for a value that is not one. */
function pathOf(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const held = value.trim();
    return held === '' ? null : held;
}

/** The `file:` of the entry of the config's `collections:` list that carries this key. */
function collectionPath(config: Record<string, unknown>, key: string | undefined): string | null {
    if (key === undefined) return null;
    const rows = config.collections;
    if (!Array.isArray(rows)) return null;
    for (const row of rows) {
        if (!isMap(row)) continue;
        if (row.key === key) return pathOf(row.file);
    }
    return null;
}

/** The hub file one view draws, and null when the configuration names none for it. */
export function viewSourceFile(
    kind: ViewSourceKind,
    config: Record<string, unknown>,
    collection?: string
): ViewSource | null {
    const file =
        kind === 'collection'
            ? collectionPath(config, collection)
            : kind === 'people'
              ? pathOf(config[PEOPLE_KEY])
              : pathOf(config[FEED_KEYS[kind]]);
    return file === null ? null : { root: HUB_ROOT, path: file };
}
