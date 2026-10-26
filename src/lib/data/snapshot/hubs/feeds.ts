// Layer 1, data. The `feeds` channel's payload of the hubs of a workspace as one: Position Leads,
// Lit Watch and LinkedIn each hold the entries of every hub in the workspace's folder order, every
// entry marked with its hub's name in `root`, the primary's included, and given its internal id in
// `id`: its hub and its value of the primary key of its hub's file (`FeedData.primary_key`), or for
// a LinkedIn post its file name (`FEED_IDENTITY`), by `hubId`, as every other record of the
// portfolio is. A feed write names its entry by that id. The feed's file, meta and posting cadence
// are the primary hub's, because a view shows one feed; the file of the feed in each hub is
// `hubFiles`, which names the file a write to one of its entries changes, and the schema of that
// file is `hubSchemas`, which the page of one of its entries edits.

import { scalar } from '../../helpers/guards.ts';
import { hubId } from '../../helpers/hub-names.ts';
import type { FeedData, FeedEntry, FeedKind, FeedsPayload } from '../../model/index.ts';

/** One hub's feeds and the name of the hub. */
export type HubFeeds = { key: string; feeds: FeedsPayload };

/** The kinds, in the order the payload lists them. */
const KINDS: FeedKind[] = ['radar', 'leads', 'linkedin'];

/**
 * The field a LinkedIn post is named by inside its hub's folder: its file, since the folder is a
 * set of Markdown files and no schema flags a primary key.
 */
const FEED_IDENTITY = { linkedin: 'file' } as const;

/**
 * The entry `entry` of the feed `kind` of the hub named `hub`, whose file is read as `feed`, marked
 * with the hub and given its internal id. An entry whose value of the primary key is empty, and
 * every entry of a file with no primary key, has no id, since no write can find it.
 */
function rooted(
    kind: FeedKind,
    hub: string,
    feed: Pick<FeedData, 'primary_key'>,
    entry: FeedEntry
): FeedEntry {
    const field = kind === 'linkedin' ? FEED_IDENTITY.linkedin : feed.primary_key;
    const key = field === undefined ? '' : scalar(entry[field]);
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
            one.feeds[kind].entries.map((entry) => rooted(kind, one.key, one.feeds[kind], entry))
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
