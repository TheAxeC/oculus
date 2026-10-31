// Layer 3, view helper of the entry page, the person page, the feed cards and the editor view. The
// file a page entry is written in, which the editor watches for unsaved text in a source tab and
// the toolbar opens as a source tab, and the fault of its primary key that makes a write unable to
// address the entry.

import type { ClientState } from '$lib/state/client/context';
import { entryById, identityFaults, type IdentityFault } from '$lib/state/boards/collection';
import { feedSchemaOf, isPageFeed, type PageEntry } from '$lib/state/forms/page-entry';
import { fileUnder, keyOf } from '$lib/state/shared/page/hubs';
import { feedEntryId } from '$lib/state/shared/page/idents';
import { viewSourceFile, type ViewSource } from '$lib/state/sessions/view-source';

/** The file of the feed `kind` in the hub `root`, the primary hub's named by the configuration. */
function feedFile(client: ClientState, kind: 'leads' | 'radar', root: string): ViewSource | null {
    const primary = client.fs.primary();
    if (root === primary) return viewSourceFile(kind, client.selectors.configMap(), primary);
    const hubFiles = client.feeds.feed(kind)?.hubFiles ?? {};
    return Object.hasOwn(hubFiles, root) ? { root, path: hubFiles[root] } : null;
}

/**
 * The file of a feed entry with no key, which has no page to read it from, and why a write cannot
 * address the entry: its file has no primary key, or its value of that key is empty. `schema` says
 * whether that file has a schema, which decides whether the entry has an Edit row at all.
 */
export function keylessFeedEntry(
    client: ClientState,
    kind: 'leads' | 'radar',
    root: string
): { file: ViewSource | null; fault: IdentityFault; schema: boolean } {
    const feed = client.feeds.feed(kind);
    const keys = feed?.hubPrimaryKeys ?? {};
    const field = Object.hasOwn(keys, root) ? keys[root] : '';
    return {
        file: feedFile(client, kind, root),
        fault: { kind: field === '' ? 'unkeyed' : 'empty', field, value: '', own: true },
        schema: feed !== null && feedSchemaOf(feed, root) !== undefined
    };
}

/**
 * The file the page's entry is in: the career file, the feed file of the entry's hub, or the file
 * of the collection in the hub the entry is of, the primary hub's named by the configuration. Null
 * while the configuration names none.
 */
export function pageFile(client: ClientState, page: PageEntry): ViewSource | null {
    const { configMap, collectionsOfKey } = client.selectors;
    const primary = client.fs.primary();
    if (page.kind === 'career') return viewSourceFile('career', configMap(), primary);
    if (page.kind === 'feed') {
        return isPageFeed(page.collection) ? feedFile(client, page.collection, page.root) : null;
    }
    if (page.root === primary)
        return viewSourceFile('collection', configMap(), primary, page.collection);
    const held = collectionsOfKey(page.collection).find((one) => entryById(one, page.key) !== null);
    return held === undefined ? null : fileUnder(held.file, client.fs.roots(), primary);
}

/**
 * Why a write cannot address the entry: its file has no primary key, or its value of the primary
 * key is empty or shared with another entry of the file. Undefined when it can. A feed entry's
 * primary key is the one field the page shows and never writes (`PageEntry.fixed`).
 */
export function pageFault(client: ClientState, page: PageEntry): IdentityFault | undefined {
    if (page.kind === 'career') return undefined;
    if (page.kind === 'feed') {
        const field = page.fixed.at(0);
        if (field === undefined) return { kind: 'unkeyed', field: '', value: '', own: true };
        const feed = isPageFeed(page.collection) ? client.feeds.feed(page.collection) : null;
        const same = (feed?.entries ?? []).filter((one) => feedEntryId(one) === page.writeId);
        return same.length > 1
            ? { kind: 'shared', field, value: keyOf(page.writeId), own: true }
            : undefined;
    }
    const held = client.selectors
        .collectionsOfKey(page.collection)
        .find((one) => entryById(one, page.key) !== null);
    const entry = held === undefined ? null : entryById(held, page.key);
    return held === undefined || entry === null
        ? undefined
        : identityFaults(held.entries, held.primary_key ?? null, held.key_fault).get(entry.index);
}
