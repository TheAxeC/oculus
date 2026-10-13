// Layer 2, client state. The identity of a feed entry over the whole feed: the id a feed view's
// cursor holds, the one the palette opens an entry by, the one an entry's page is opened with, and
// the lead view's own ids. What makes an entry unique is a fact about the feed, and the feed views,
// the palette and the form drafts all ask it, so it sits with the page addresses every layer of
// state shares.

import { hubId } from '../../../data/helpers/hub-names.ts';
import type { FeedKind } from '../../../data/model/index.ts';
import { filledTextShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';

/** Every string nested in a value, in property order. */
export function nestedStrings(value: unknown): string[] {
    if (typeof value === 'string') return value === '' ? [] : [value];
    if (Array.isArray(value)) return value.flatMap(nestedStrings);
    if (typeof value !== 'object' || value === null) return [];
    return Object.values(value).flatMap(nestedStrings);
}

/** The name of the hub a feed entry is of: its `root`, and the empty string for the primary's. */
export function feedRoot(entry: object): string {
    return readAs(filledTextShape, readAs(mapShape, entry)?.root) ?? '';
}

/**
 * The id a feed view's cursor holds for an entry: the entry's own name, with the key of its hub and
 * a colon in front of it when the entry is of a hub other than the primary, so two hubs' entries of
 * one name are two cursors. A write names the entry by its own name and its hub in `root`.
 */
export function feedCursorId(entry: object, name: string): string {
    return hubId(feedRoot(entry), name, null);
}

/** The identity one entry carries on its own, before the feed is asked whether it is unique. */
function feedIdentity(kind: FeedKind, entry: object): string {
    const key = kind === 'linkedin' ? 'file' : 'title';
    const named = readAs(filledTextShape, readAs(mapShape, entry)?.[key]);
    if (named !== undefined && named !== null) return feedCursorId(entry, named);
    return nestedStrings(entry)[0] ?? kind;
}

/** What a caller asks for the identity of one entry of the list it was built over. */
export type FeedIdent = (entry: object) => string;

/**
 * One distinct non-empty id per entry of a list. An entry whose own fields give an empty id, and
 * each of two entries whose fields give the same id, carries its position in the list as a suffix;
 * every other entry keeps the id its own fields give, so the ids stay readable and stable.
 */
export function uniqueIdents<T extends object>(
    entries: readonly T[],
    base: (entry: T) => string,
    fallback: string
): (entry: T) => string {
    const seen = new Map<string, number>();
    for (const entry of entries) seen.set(base(entry), (seen.get(base(entry)) ?? 0) + 1);
    const ids = new Map<T, string>();
    entries.forEach((entry, at) => {
        const own = base(entry);
        const shared = (seen.get(own) ?? 0) > 1;
        ids.set(entry, own === '' || own === fallback || shared ? `${own || fallback}#${at}` : own);
    });
    return (entry) => ids.get(entry) ?? base(entry);
}

/**
 * The stable identity the feed view and the palette use for the same entry, over the whole feed.
 */
export function feedIdents(kind: FeedKind, entries: readonly object[]): FeedIdent {
    return uniqueIdents(entries, (entry) => feedIdentity(kind, entry), kind);
}
