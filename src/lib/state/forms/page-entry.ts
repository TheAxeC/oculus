// Layer 2, client state. The thing an entry form edits, whichever kind it is: an entry of a
// collection file, an entry of a generated feed (a lead, a Lit Watch paper) or the career file. The
// page of an entry, the person page and the Career view each hold one, and the form draft judges
// the unsaved edits of all three through it.
//
// A page entry names its schema, its saved values by field, the fields the form never writes and
// the id a write names it by. The three kinds are written by different endpoints (`entry`,
// `feed-field` one field at a time, `career`), which entry-save.ts picks by `kind`.
//
// A page is found again from its name: `<hub>:<collection>:<key>` for an entry of a collection or
// a feed, the hub and the key being the entry's (the key a feed entry has is the identity the feed
// views give it, state/shared/page/idents.ts), and `career` for the career file. That is what lets
// the draft of a tab that is not on screen be judged against the snapshot now. A tab on a page
// names the entry by its hub and its key, two fields of its state (`entryPageState`), and never by
// its internal id.

import {
    addressOfId,
    bareId,
    collectionsOf,
    hubId,
    keyOf,
    rootOf,
    type RegistryWord
} from '../../data/helpers/hub-names.ts';
import type {
    Career,
    Collection,
    Entry,
    FeedData,
    FeedKind,
    FeedsPayload,
    SchemaField,
    Snapshot
} from '../../data/model/index.ts';
import { entryIdOf, entryTitleOf, primaryKeyOf } from '../../data/model/index.ts';
import { feedEntryId, feedIdents, feedRoot } from '../shared/page/idents.ts';
import type { DraftTarget } from './form-draft.ts';
import { fixedFields, formFieldsOf } from './record-fields.ts';
import { fieldDiffers, hasWords } from './record-values.ts';
import type { FormField } from './schema.ts';
import type { SettledStore } from './settled.svelte.ts';

/** The name of the career file's page and of its draft. */
export const CAREER = 'career';

/** The feeds whose entries have a page of their own. */
export const PAGE_FEEDS: FeedKind[] = ['leads', 'radar'];

/** Whether a name is a feed whose entries have a page of their own. */
export function isPageFeed(name: string): name is FeedKind {
    return PAGE_FEEDS.some((kind) => kind === name);
}

export type PageEntry = {
    kind: 'collection' | 'feed' | 'career';
    /** The collection key, the feed kind, or `career`. */
    collection: string;
    /** The entry the page is for: an entry's internal id, a feed entry's identity. */
    key: string;
    /** What the page is for: `<hub>:<collection>:<key>`, and `career` for the career file. */
    name: string;
    /** The id a write names the entry by: its internal id; the empty text for the career file. */
    writeId: string;
    /** The name of the hub the entry is of; the empty text for the career file. */
    root: string;
    title: string;
    schema: SchemaField[];
    /** The saved values by field name. */
    values: Record<string, unknown>;
    /** The fields the form shows and never writes. */
    fixed: string[];
    /** The other entries' values, whose shape a field this entry lacks follows. */
    peers: Record<string, unknown>[];
};

/** The name of the page of the entry of the internal id `id` of `collection`. */
function pageName(collection: string, id: string): string {
    const { hub, key } = addressOfId(id);
    return hubId(hub, `${collection}:${key}`);
}

/**
 * The state an entry's page is opened with, for the entry of the internal id `id`: its collection,
 * its hub and its key. The three are what make one entry one tab (`stateId` of
 * state/workbench/layout/instance.ts): the same entry asked for again activates its tab, another
 * entry of the collection gets its own, and the same key in another collection or another hub is
 * another entry.
 */
export function entryPageState(
    collection: string,
    id: string,
    label: string
): { collection: string; hub: string; key: string; label: string } {
    return { collection, ...addressOfId(id), label };
}

/**
 * The state a collection or feed view is given to reveal the entry of the internal id `id`: the
 * entry by its hub and its key, and the group the entry may sit behind opened where that group
 * folds by a flag of its own (Expired, Dismissed), since a card hidden in a folded group cannot be
 * scrolled to. A group that folds by its key under `folded` (a Lit Watch bucket, a Venues section)
 * is opened by the view itself when it is asked to reveal a card inside it.
 */
export function revealState(collection: string, id: string): Record<string, unknown> {
    const reveal = addressOfId(id);
    if (collection === 'leads') return { reveal, expiredOpen: true };
    if (collection === 'radar') return { reveal, dismissedOpen: true };
    return { reveal };
}

/**
 * The view that is the page of the entry of the internal id `id` and the state it is opened with:
 * the Person view for a person, an entry of the collection whose entry names the `people` registry
 * (`registry`, the registry the collection's entry names), and the `entry` view for every other
 * entry of a collection or a feed. Either state names the entry by its hub and its key.
 */
export function pageView(
    collection: string,
    id: string,
    label: string,
    registry?: RegistryWord
): { view: string; state: Record<string, string> } {
    return registry === 'people'
        ? { view: 'person', state: { ...addressOfId(id), label } }
        : { view: 'entry', state: entryPageState(collection, id, label) };
}

/**
 * The page of the entry `id` written into one of `collections`: `pageView` under the key and the
 * registry of the collection of the entry's hub, and under no key when none of them is of that hub.
 */
export function writtenPage(
    collections: readonly Collection[],
    id: string,
    label: string
): { view: string; state: Record<string, string> } {
    const home = collections.find((one) => rootOf(one) === addressOfId(id).hub);
    return pageView(home === undefined ? '' : bareId(home), id, label, home?.registry);
}

/** The key a page of an entry of a collection is held under in the settled writes. */
function entryKey(collection: string, id: string): string {
    return `page:${collection}:${id}`;
}

/**
 * The page of an entry of a collection file whose primary key is `primaryKey` (null for a file
 * with none), over `values`: the entry's fields with the writes the server took and the snapshot
 * has not shown yet put over them. A write that changed the entry's key gives the page the key the
 * entry has now.
 */
function collectionPage(
    key: string,
    schema: SchemaField[],
    primaryKey: string | null,
    entry: Entry,
    others: readonly Entry[],
    values: Record<string, unknown>
): PageEntry {
    const own = values === entry.fields;
    const id = own ? entry.id : hubId(rootOf(entry), entryIdOf(values, primaryKey));
    const title = own ? entry.title : entryTitleOf(values, schema, primaryKey);
    return {
        kind: 'collection',
        collection: key,
        key: id,
        name: pageName(key, id),
        writeId: id,
        root: rootOf(entry),
        title: title === '' ? keyOf(id) : title,
        schema,
        values,
        fixed: fixedFields(primaryKey),
        peers: others.filter((one) => one !== entry).map((one) => one.fields)
    };
}

/**
 * The page of a feed entry, `ident` being the identity the feed views give it, over the schema of
 * the file of the entry's hub: the schema the merged feed holds for that hub, or, in a feed not
 * merged across hubs, the one file's. The page shows the field that schema flags as the primary
 * key and never writes it, and its title is the entry's display, else its value of that key.
 */
function feedPage(
    kind: FeedKind,
    feed: Pick<FeedData, 'entries' | 'schema'> & { hubSchemas?: Record<string, SchemaField[]> },
    ident: string,
    settled: SettledStore
): PageEntry | null {
    const identOf = feedIdents(kind, feed.entries);
    const found = feed.entries.find((one) => identOf(one) === ident);
    const entry = found ?? (settled.pending(entryKey(kind, ident)) ? {} : undefined);
    const root = found === undefined ? addressOfId(ident).hub : feedRoot(found);
    const schema = feed.hubSchemas === undefined ? feed.schema : feed.hubSchemas[root];
    if (entry === undefined || schema === undefined) return null;
    const values = settled.overlay(entryKey(kind, ident), entry);
    const primaryKey = primaryKeyOf(schema);
    const title = entryTitleOf(values, schema, primaryKey);
    return {
        kind: 'feed',
        collection: kind,
        key: ident,
        name: pageName(kind, ident),
        writeId: feedEntryId(entry),
        root,
        title: title === '' ? keyOf(ident) : title,
        schema,
        values,
        fixed: fixedFields(primaryKey),
        peers: feed.entries.filter((one) => one !== found)
    };
}

/** The page of the career file; null while the hub holds none or the file has no schema. */
function careerPage(career: Career | null, settled: SettledStore): PageEntry | null {
    if (career?.schema === undefined) return null;
    return {
        kind: 'career',
        collection: CAREER,
        key: CAREER,
        name: CAREER,
        writeId: '',
        root: '',
        title: career.title,
        schema: career.schema,
        values: settled.overlay(CAREER, career.sections),
        fixed: [],
        peers: []
    };
}

/** The form fields of a page, for the values it has now (a field's choices may depend on them). */
export function pageFields(page: PageEntry): FormField[] {
    return formFieldsOf(page.schema, page.values);
}

/** The first value of a field among the other entries, which decides a `records` shape. */
export function sampleOf(page: PageEntry, field: string): unknown {
    return page.peers.map((one) => one[field]).find((one) => one !== undefined && one !== null);
}

/** Where pages are found: the snapshot and the feeds as they stand now. */
export type PageSources = {
    snapshot: () => Snapshot | null;
    feeds: () => FeedsPayload | null;
};

/**
 * What a write the server took tells the pages, so they show it before the snapshot does: the
 * sink the page's writes are handed. `begin` stamps a write when it is sent; the others hold what
 * its answer said was written, by the number `begin` gave.
 */
export type Settle = {
    begin: () => number;
    /** Fields set on an entry of a collection file; a changed key moves the page to the new one. */
    entry: (collection: string, id: string, saved: Record<string, unknown>, seq: number) => void;
    /** An entry added to a collection file. */
    added: (collection: string, id: string, saved: Record<string, unknown>, seq: number) => void;
    /** Fields set on an entry of a feed, found by its internal id. */
    feed: (kind: FeedKind, id: string, saved: Record<string, unknown>, seq: number) => void;
    /** Sections set on the career file. */
    career: (saved: Record<string, unknown>, seq: number) => void;
};

/** The pages, found by name or by collection and key. */
export type Pages = {
    pageOf: (collection: string, key: string) => PageEntry | null;
    pageNamed: (name: string) => PageEntry | null;
    settle: Settle;
};

/**
 * The pages of one client, over the snapshot and the feeds and the writes `settled` holds. A page
 * of an entry the snapshot does not hold yet but a write added is made from the write's fields.
 */
export function createPages(sources: PageSources, settled: SettledStore): Pages {
    /** The collection file that holds the entry, with the entry; the files of the key in order. */
    function find(
        snapshot: Snapshot,
        collection: string,
        ids: readonly (string | undefined)[]
    ): { held: Collection; entry: Entry } | null {
        for (const held of collectionsOf(snapshot.entities.collections, collection)) {
            for (const id of ids) {
                const entry = held.entries.find((one) => one.id === id);
                if (entry !== undefined) return { held, entry };
            }
        }
        return null;
    }

    function pageOf(collection: string, key: string): PageEntry | null {
        const feed = PAGE_FEEDS.find((kind) => kind === collection);
        if (feed !== undefined) {
            const held = sources.feeds()?.[feed];
            return held === undefined ? null : feedPage(feed, held, key, settled);
        }
        const snapshot = sources.snapshot();
        if (snapshot === null) return null;
        const prefix = entryKey(collection, '');
        const found = find(snapshot, collection, [key, settled.renamedFrom(prefix, key)]);
        const schema = found?.held.schema;
        if (found !== null && schema !== undefined) {
            const { held, entry } = found;
            const values = settled.overlay(entryKey(collection, entry.id), entry.fields);
            const primaryKey = held.primary_key ?? null;
            return collectionPage(collection, schema, primaryKey, entry, held.entries, values);
        }
        if (!settled.pending(entryKey(collection, key))) return null;
        // An entry a write added is of the hub its id names, whose file the write went to.
        const { hub } = addressOfId(key);
        const home = collectionsOf(snapshot.entities.collections, collection).find(
            (one) => one.schema !== undefined && rootOf(one) === hub
        );
        if (home?.schema === undefined) return null;
        const values = settled.overlay(entryKey(collection, key), {});
        const primaryKey = home.primary_key ?? null;
        const added: Entry = {
            id: key,
            title: entryTitleOf(values, home.schema, primaryKey),
            fields: values,
            file: home.file,
            index: home.entries.length,
            root: hub
        };
        return collectionPage(collection, home.schema, primaryKey, added, home.entries, values);
    }

    function pageNamed(name: string): PageEntry | null {
        if (name === CAREER) {
            return careerPage(sources.snapshot()?.entities.career ?? null, settled);
        }
        const { hub, key: rest } = addressOfId(name);
        const at = rest.indexOf(':');
        return at < 1 ? null : pageOf(rest.slice(0, at), hubId(hub, rest.slice(at + 1)));
    }

    const settle: Settle = {
        begin: settled.begin,
        entry(collection, id, saved, seq) {
            const snapshot = sources.snapshot();
            const found = snapshot === null ? null : find(snapshot, collection, [id]);
            if (found === null) return;
            const primaryKey = found.held.primary_key ?? null;
            const now = hubId(
                rootOf(found.entry),
                entryIdOf({ ...found.entry.fields, ...saved }, primaryKey)
            );
            settled.record(
                entryKey(collection, found.entry.id),
                saved,
                found.entry.fields,
                seq,
                now === found.entry.id ? {} : { to: now }
            );
        },
        added(collection, id, saved, seq) {
            settled.record(entryKey(collection, id), saved, null, seq, { created: true });
        },
        feed(kind, id, saved, seq) {
            const entries = sources.feeds()?.[kind].entries ?? [];
            const entry = entries.find((one) => feedEntryId(one) === id);
            if (entry === undefined) return;
            settled.record(entryKey(kind, feedIdents(kind, entries)(entry)), saved, entry, seq);
        },
        career(saved, seq) {
            const career = sources.snapshot()?.entities.career ?? null;
            if (career !== null) settled.record(CAREER, saved, career.sections, seq);
        }
    };

    return { pageOf, pageNamed, settle };
}

/**
 * What the draft of an entry form is judged by: the page's saved values now, the payload rule of
 * the field's type (record-values.ts), and the fields the form writes. A page the snapshot no
 * longer holds is compared with nothing, so any edit with words in it is unsaved.
 */
export function pageDraftTarget(pages: Pages): DraftTarget {
    return {
        values: (name) => pages.pageNamed(name)?.values ?? null,
        differs: (name, field, edit, value) => {
            const page = pages.pageNamed(name);
            const form =
                page === null ? undefined : pageFields(page).find((one) => one.field === field);
            if (page === null || form === undefined) return hasWords(edit);
            return fieldDiffers(form, edit, value, sampleOf(page, field));
        },
        writable: (name, field) => !(pages.pageNamed(name)?.fixed ?? []).includes(field),
        current: (name) => pages.pageNamed(name)?.name ?? name
    };
}
