// Layer 1, data. The `feeds` channel's payload of the hubs of a workspace as one: Position Leads,
// Lit Watch and LinkedIn each hold the entries of every hub in the workspace's folder order, every
// entry marked with its hub's name in `root`, the primary's included, and given its internal id in
// `id`: its hub and the field its file names it by (`FEED_IDENTITY`), by `hubId`, as every other
// record of the portfolio is. A feed write names its entry by that id. The feed's file, meta and
// posting cadence are the primary hub's, because a view shows one feed; the file of the feed in
// each hub is `hubFiles`, which names the file a write to one of its entries changes, and the
// schema of that file is `hubSchemas`, which the page of one of its entries edits.

import { scalar } from '../../helpers/guards.ts';
import { hubId } from '../../helpers/hub-names.ts';
import type { FeedEntry, FeedKind, FeedsPayload } from '../../model/index.ts';

/** One hub's feeds and the name of the hub. */
export type HubFeeds = { key: string; feeds: FeedsPayload };

/** The kinds, in the order the payload lists them. */
const KINDS: FeedKind[] = ['radar', 'leads', 'linkedin'];

/**
 * The field of each feed's entries that names one inside its hub's file, which a write finds the
 * entry by: the title of a lead and of a Lit Watch paper, the file of a LinkedIn post.
 */
export const FEED_IDENTITY: Record<FeedKind, string> = {
    radar: 'title',
    leads: 'title',
    linkedin: 'file'
};

/**
 * The entry `entry` of the feed `kind` of the hub named `hub`, marked with the hub and given its
 * internal id. An entry whose identity field is empty has no id, since no write can find it.
 */
function rooted(kind: FeedKind, hub: string, entry: FeedEntry): FeedEntry {
    const key = scalar(entry[FEED_IDENTITY[kind]]);
    return key === '' ? { ...entry, root: hub } : { ...entry, root: hub, id: hubId(hub, key) };
}

/**
 * The payload of the hubs `hubs`, in the workspace's folder order, over the payload `first` whose
 * file, meta and cadence the feed shows: the primary hub's, or the empty payload of a workspace
 * with no primary.
 */
export function mergedFeeds(first: FeedsPayload, hubs: readonly HubFeeds[]): FeedsPayload {
    const out = { ...first };
    for (const kind of KINDS) {
        const own = first[kind];
        const entries = hubs.flatMap((one) =>
            one.feeds[kind].entries.map((entry) => rooted(kind, one.key, entry))
        );
        const every = hubs.length === 0 ? [own] : hubs.map((one) => one.feeds[kind]);
        const hubFiles = Object.fromEntries(hubs.map((one) => [one.key, one.feeds[kind].file]));
        const hubSchemas = Object.fromEntries(
            hubs.flatMap((one) => {
                const schema = one.feeds[kind].schema;
                return schema === undefined ? [] : [[one.key, schema]];
            })
        );
        const merged = { ...own, hubFiles, hubSchemas, entries };
        delete merged.missing;
        delete merged.error;
        if (every.every((one) => one.missing === true)) merged.missing = true;
        const failed = every.find((one) => one.error !== undefined);
        if (failed?.error !== undefined) merged.error = failed.error;
        out[kind] = merged;
    }
    return out;
}
