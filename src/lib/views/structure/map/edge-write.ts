// Layer 3, Map support. The edge writer turns the endpoint answer into the map's status text,
// apart from the partial so the refusal wording can be read without a rendering.

import { t as catalogText } from '$lib/state/shared/words/text';
import type { WriteAnswer } from '$lib/state/client/writes.svelte';

type ManifestWriter = (id: string, fields: Record<string, unknown>) => Promise<WriteAnswer>;

/** Write one related list and return no status on success or the catalogued refusal on failure. */
export async function writeRelated(
    id: string,
    related: string[],
    write: ManifestWriter
): Promise<string> {
    const answer = await write(id, { related });
    if (answer.ok && answer.refused.length === 0) return '';
    const reason =
        answer.error ?? answer.refused.map((item) => `${item.field}: ${item.reason}`).join('; ');
    return catalogText('map.edge_failed', reason);
}
