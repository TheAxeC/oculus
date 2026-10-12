// Layer 1, data. The `feeds` channel's payload of several hubs as one: Position Leads, Lit Watch
// and LinkedIn each hold the entries of every hub, the primary hub's first and then each other
// hub's in the workspace's folder order, every entry of a hub other than the primary marked with
// that hub's key in `root`. The feed's file, meta and posting cadence are the primary hub's,
// because a view shows one feed and a write to a feed field names the entry, which names its hub
// through `root`; the file of the feed in each other hub is `hubFiles`, which names the file a
// write to one of its entries changes.

import type { FeedKind, FeedsPayload } from '../../model/index.ts';

/** One hub's feeds and the key of the hub. */
export type HubFeeds = { key: string; feeds: FeedsPayload };

/** The kinds, in the order the payload lists them. */
const KINDS: FeedKind[] = ['radar', 'leads', 'linkedin'];

/** The payload of the primary hub with the entries of the other hubs added after its own. */
export function mergedFeeds(first: FeedsPayload, others: readonly HubFeeds[]): FeedsPayload {
    if (others.length === 0) return first;
    const out = { ...first };
    for (const kind of KINDS) {
        const own = first[kind];
        const added = others.flatMap((one) =>
            one.feeds[kind].entries.map((entry) => ({ ...entry, root: one.key }))
        );
        const every = [own, ...others.map((one) => one.feeds[kind])];
        const hubFiles = Object.fromEntries(others.map((one) => [one.key, one.feeds[kind].file]));
        const merged = { ...own, hubFiles, entries: [...own.entries, ...added] };
        delete merged.missing;
        delete merged.error;
        if (every.every((one) => one.missing === true)) merged.missing = true;
        const failed = every.find((one) => one.error !== undefined);
        if (failed?.error !== undefined) merged.error = failed.error;
        out[kind] = merged;
    }
    return out;
}
