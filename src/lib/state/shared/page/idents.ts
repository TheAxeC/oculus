// Layer 2, client state. The identity of a feed entry over the whole feed: the id a feed view's
// cursor holds, the one the palette opens an entry by and the one an entry's page is opened with,
// which is the entry's internal id the feeds payload gives it (data/snapshot/hubs/feeds.ts), made
// unique over the feed. What makes an entry unique is a fact about the feed, and the feed views,
// the palette and the form drafts all ask it, so it sits with the page addresses every layer of
// state shares. Every card of a feed asks it over the same list of entries, so a reader that holds
// its client's memo of reads (state/shared/stores/read-memo.ts) passes it, and the identities of a
// list are then built once for that list and shared by every reader of it (`feedIndex`).

import type { FeedKind } from '../../../data/model/index.ts';
import { filledTextShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';
import type { ReadMemo } from '../stores/shapes.ts';

/** Every string nested in a value, in property order. */
export function nestedStrings(value: unknown): string[] {
    if (typeof value === 'string') return value === '' ? [] : [value];
    if (Array.isArray(value)) return value.flatMap(nestedStrings);
    if (typeof value !== 'object' || value === null) return [];
    return Object.values(value).flatMap(nestedStrings);
}

/** The name of the hub a feed entry is of: its `root`, and the empty text for an entry of none. */
export function feedRoot(entry: object): string {
    return readAs(filledTextShape, readAs(mapShape, entry)?.root) ?? '';
}

/**
 * The internal id of a feed entry, `<hub>:<key>`, which a write names it by, and the empty text for
 * an entry the payload gave none, which no write can find.
 */
export function feedEntryId(entry: object): string {
    return readAs(filledTextShape, readAs(mapShape, entry)?.id) ?? '';
}

/**
 * The identity one entry carries on its own, before the feed is asked whether it is unique: its
 * internal id, else the first text of its own fields, else the feed's kind.
 */
function feedIdentity(kind: FeedKind, entry: object): string {
    const id = feedEntryId(entry);
    if (id !== '') return id;
    const { root: _hub, ...own } = readAs(mapShape, entry) ?? {};
    return nestedStrings(own)[0] ?? kind;
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
    const owns = entries.map(base);
    const seen = new Map<string, number>();
    for (const own of owns) seen.set(own, (seen.get(own) ?? 0) + 1);
    const ids = new Map<T, string>();
    entries.forEach((entry, at) => {
        const own = owns[at];
        const shared = (seen.get(own) ?? 0) > 1;
        ids.set(entry, own === '' || own === fallback || shared ? `${own || fallback}#${at}` : own);
    });
    return (entry) => ids.get(entry) ?? base(entry);
}

/**
 * What one list of a feed's entries answers about them: the identity of each entry, the entry of
 * each identity, and how many entries carry each internal id.
 */
type FeedIndex = {
    identOf: FeedIdent;
    entryOf: ReadonlyMap<string, object>;
    idCount: ReadonlyMap<string, number>;
};

/**
 * The index of one list of a feed's entries. Every card of a feed asks for its own page over the
 * same list, so with the client's memo (`reads`) the index is built on the first question about
 * the list, by the list and the feed's kind, and not once per card: a feed message brings a new
 * list, which is indexed afresh, and a list the client no longer holds is let go with its index.
 * Without a memo it is built for this question alone.
 */
function feedIndex(kind: FeedKind, entries: readonly object[], reads?: ReadMemo): FeedIndex {
    if (reads === undefined) return indexOf(kind, entries);
    return reads.held(entries, `feed index ${kind}`, () => indexOf(kind, entries));
}

/** The index of one list of a feed's entries, built afresh. */
function indexOf(kind: FeedKind, entries: readonly object[]): FeedIndex {
    const identOf = uniqueIdents(entries, (entry) => feedIdentity(kind, entry), kind);
    const entryOf = new Map<string, object>();
    const idCount = new Map<string, number>();
    for (const entry of entries) {
        const ident = identOf(entry);
        if (!entryOf.has(ident)) entryOf.set(ident, entry);
        const id = feedEntryId(entry);
        idCount.set(id, (idCount.get(id) ?? 0) + 1);
    }
    return { identOf, entryOf, idCount };
}

/**
 * The stable identity the feed view and the palette use for the same entry, over the whole feed;
 * `reads` is the client's memo, which shares the identities of a list among its readers.
 */
export function feedIdents(
    kind: FeedKind,
    entries: readonly object[],
    reads?: ReadMemo
): FeedIdent {
    return feedIndex(kind, entries, reads).identOf;
}

/** The entry of `entries` whose identity over the list is `ident`; undefined when none has it. */
export function feedEntryOf<T extends object>(
    kind: FeedKind,
    entries: readonly T[],
    ident: string,
    reads?: ReadMemo
): T | undefined {
    // The index maps each identity to an entry of this very list, so it is one of `entries`.
    return feedIndex(kind, entries, reads).entryOf.get(ident) as T | undefined;
}

/** How many entries of `entries` carry the internal id `id`. */
export function feedIdCount(
    kind: FeedKind,
    entries: readonly object[],
    id: string,
    reads?: ReadMemo
): number {
    return feedIndex(kind, entries, reads).idCount.get(id) ?? 0;
}

/**
 * The words an entry is shown by: its display, else, for an entry with neither a display nor a key,
 * its first filled text, the empty text when it holds none.
 */
export function entryWords(entry: { title: string; fields: Record<string, unknown> }): string {
    return entry.title || (nestedStrings(entry.fields).find((text) => text.trim() !== '') ?? '');
}
