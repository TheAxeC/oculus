// Layer 1, data, pure. The words of `tiers:` in config/catalogs/vocab.yml: each tier's key, its
// label and whether a Focus lane card leaves it off its tags. The Focus view's Tier checklist and
// lane tags (state/boards/focus.ts) and the project boards' Tier facet
// (state/boards/board/facets.ts) read the tiers through this module, so a tier is labelled and
// ordered by one rule.

import { vocabKeys } from '../vocab-keys.ts';
import { mapShape, readAs } from '../shapes.ts';

/**
 * One word of `tiers:`: its key, its words (the key itself for a row that names no label), and
 * whether a Focus lane card leaves it off its tags (`unmarked: true`).
 */
export type TierWord = { key: string; label: string; unmarked?: true };

/** The words of `tiers:` of a hub's words, in the order the map lists them. */
export function tierWords(words: Record<string, unknown>): TierWord[] {
    const rows = readAs(mapShape, words.tiers) ?? {};
    return vocabKeys(words.tiers).map((key) => {
        const row = readAs(mapShape, rows[key]);
        const label = typeof row?.label === 'string' && row.label !== '' ? row.label : key;
        return row?.unmarked === true ? { key, label, unmarked: true } : { key, label };
    });
}
