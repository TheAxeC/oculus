// Layer 2, client state. The theme words of venues and datasets: their labels, read from a
// `venue_themes` or `data_themes` list of config/catalogs/vocab.yml, the facet row a view draws
// over them and the filter its toggles apply. One helper, one fold and one filter serve both
// registries, because the two lists share the `{ key, label }` row shape and a venue and a dataset
// both carry `themes: string[]`. The Venues and Data views pass the list they draw; the facets show
// the label and match by the word, and the filter holds words alone.
//
// The result is a Map rather than an object so that a theme word such as `constructor` or
// `__proto__` finds no label it was never given. When two rows name one key the first row wins,
// which is the row a reader of the file meets first.

import { z } from 'zod';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';

/** One row of a theme list: a key that is not empty, and its label. */
const themeRowShape = z.object({ key: z.string().min(1), label: z.string() });

/** The rows of a theme list that are rows, in order. */
const themeRowsShape = rowsShape(themeRowShape);

/** Theme word to its label; a word with no row has no entry. */
export type ThemeWordLabels = ReadonlyMap<string, string>;

/** The word-to-label map of one theme list; a row without a string key or label is passed over. */
export function themeWordLabels(rows: unknown): ThemeWordLabels {
    const labels = new Map<string, string>();
    for (const { key, label } of readAs(themeRowsShape, rows) ?? []) {
        if (!labels.has(key)) labels.set(key, label);
    }
    return labels;
}

/** The label a theme word is drawn with: its row's label, or the word itself when it has none. */
export function themeWordLabel(labels: ThemeWordLabels, word: string): string {
    return labels.get(word) ?? word;
}

/** One facet of a theme row: the word it toggles, its label and how many items carry it. */
export type ThemeFacet = { theme: string; label: string; count: number };

/**
 * The theme words of the items with their labels and counts, most frequent first and lexical inside
 * a tie. A word with no label is drawn as itself.
 */
export function themeFacets(
    items: readonly { themes: readonly string[] }[],
    labels: ThemeWordLabels = new Map()
): ThemeFacet[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        for (const theme of item.themes) counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
    return [...counts]
        .map(([theme, count]) => ({ theme, label: themeWordLabel(labels, theme), count }))
        .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

/**
 * The items with at least one theme word whose toggle remains on. `off` holds words, never labels,
 * and an empty `off` keeps every item, those with no theme at all included.
 */
export function applyThemeFacets<T extends { themes: readonly string[] }>(
    items: T[],
    off: readonly string[]
): T[] {
    if (off.length === 0) return items;
    return items.filter((item) => item.themes.some((theme) => !off.includes(theme)));
}
