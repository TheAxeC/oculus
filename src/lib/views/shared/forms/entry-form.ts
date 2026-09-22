// Layer 3, shared view support. The add-write choice a form makes, apart from the partial so a
// server-rendered form test exercises the same branch the save control uses without a browser DOM.

import type { WritesStore, WriteAnswer as AddWriteAnswer } from '$lib/state/client/writes.svelte';

/** Use a file-specific add write when supplied, and the collection write otherwise. */
export function addFromForm(
    writes: WritesStore,
    collection: string,
    fields: Record<string, unknown>,
    onadd?: (fields: Record<string, unknown>) => Promise<AddWriteAnswer>
): Promise<AddWriteAnswer> {
    return onadd === undefined ? writes.newEntry(collection, fields) : onadd(fields);
}
