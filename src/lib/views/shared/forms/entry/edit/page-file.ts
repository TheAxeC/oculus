// Layer 3, view helper of the entry page, the person page and the Career panel. The file a page
// entry is written in, which the editor watches for unsaved text in a source tab and the toolbar
// opens as a source tab, and the identity fault that makes a write unable to address the entry.

import type { ClientState } from '$lib/state/client/context';
import { entryById, identityFaults, type IdentityFault } from '$lib/state/boards/collection';
import type { PageEntry } from '$lib/state/forms/page-entry';
import { fileUnder, keyOf } from '$lib/state/shared/page/hubs';
import { feedEntryId } from '$lib/state/shared/page/idents';
import { viewSourceFile, type ViewSource } from '$lib/state/sessions/view-source';

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
        const kind = page.collection === 'leads' ? 'leads' : 'radar';
        if (page.root === primary) return viewSourceFile(kind, configMap(), primary);
        const hubFiles = client.feeds.feed(kind)?.hubFiles ?? {};
        return Object.hasOwn(hubFiles, page.root)
            ? { root: page.root, path: hubFiles[page.root] }
            : null;
    }
    if (page.root === primary)
        return viewSourceFile('collection', configMap(), primary, page.collection);
    const held = collectionsOfKey(page.collection).find((one) => entryById(one, page.key) !== null);
    return held === undefined ? null : fileUnder(held.file, client.fs.roots(), primary);
}

/**
 * Why a write cannot address the entry: its identity is empty or shared with another entry of the
 * file. Undefined when it can.
 */
export function pageFault(client: ClientState, page: PageEntry): IdentityFault | undefined {
    if (page.kind === 'career') return undefined;
    if (page.kind === 'feed') {
        const same = (
            client.feeds.feed(page.collection === 'leads' ? 'leads' : 'radar')?.entries ?? []
        ).filter((one) => feedEntryId(one) === page.writeId);
        return same.length > 1
            ? {
                  kind: 'shared',
                  field: page.schema.at(0)?.field ?? 'title',
                  value: keyOf(page.writeId),
                  own: true
              }
            : undefined;
    }
    const held = client.selectors
        .collectionsOfKey(page.collection)
        .find((one) => entryById(one, page.key) !== null);
    const entry = held === undefined ? null : entryById(held, page.key);
    return held === undefined || entry === null
        ? undefined
        : identityFaults(held.entries, held.schema).get(entry.index);
}
