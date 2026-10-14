// Layer 2, client state. The theme words of venues and datasets: their labels, read from the
// `venue_themes` or `data_themes` list of a hub's vocabulary (the options of the `themes` field of
// that hub's venues or data registry), the facet row a view draws over them and the filter its
// toggles apply. One helper, one fold and one filter serve both registries, because the two lists
// share the `{ key, label }` row shape and a venue and a dataset both carry `themes: string[]`. The
// Venues and Data views pass the list they draw; the facets show the label and match by the word,
// and the filter holds words alone.
//
// A venue and a dataset are labelled by the lists of their own hub: `themeLabeller` gives the
// labels of the hub a record's `root` names (the primary's for a record with none), and a hub that
// is not among the workspace's hubs labels nothing. A facet row names the theme word once, by the
// labels each hub that holds it gives it.
//
// The result is a Map rather than an object so that a theme word such as `constructor` or
// `__proto__` finds no label it was never given. When two rows name one key the first row wins,
// which is the row a reader of the file meets first.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import type { HubVocabs } from '../../../data/model/index.ts';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';
import { t } from './text.ts';

/** One row of a theme list: a key that is not empty, and its label. */
const themeRowShape = z.object({ key: z.string().min(1), label: z.string() });

/** The rows of a theme list that are rows, in order. */
const themeRowsShape = rowsShape(themeRowShape);

/** Theme word to its label; a word with no row has no entry. */
export type ThemeWordLabels = ReadonlyMap<string, string>;

/** The word-to-label map of one theme list; a row without a string key or label is passed over. */
function themeWordLabels(rows: unknown): ThemeWordLabels {
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

/** The labels of the hub a record's `root` names; a record with no `root` is the primary's. */
export type ThemeLabeller = (root: string | undefined) => ThemeWordLabels;

/** The theme labels of every hub for one list, `venue_themes` or `data_themes`. */
export function themeLabeller(
    hubs: HubVocabs | null,
    list: 'venue_themes' | 'data_themes'
): ThemeLabeller {
    const held = new Map<string, ThemeWordLabels>();
    return (root) => {
        const name = root ?? hubs?.primary ?? '';
        const labels = held.get(name);
        if (labels !== undefined) return labels;
        const made = themeWordLabels(hubs === null ? [] : byKey(hubs.lists, name)?.[list]);
        held.set(name, made);
        return made;
    };
}

/** One facet of a theme row: the word it toggles, its label and how many items carry it. */
export type ThemeFacet = { theme: string; label: string; count: number };

/**
 * The theme words of the items with their labels and counts, most frequent first and lexical inside
 * a tie. A word with no label is drawn as itself. A word the hubs of its items label differently is
 * drawn with each label, once each, joined by the catalog's `hubs.label_separator`.
 */
export function themeFacets(
    items: readonly { themes: readonly string[]; root?: string }[],
    labelOf: ThemeLabeller = () => new Map()
): ThemeFacet[] {
    const counts = new Map<string, number>();
    const labels = new Map<string, Set<string>>();
    for (const item of items) {
        const own = labelOf(item.root);
        for (const theme of item.themes) {
            counts.set(theme, (counts.get(theme) ?? 0) + 1);
            const named = labels.get(theme) ?? new Set<string>();
            named.add(themeWordLabel(own, theme));
            labels.set(theme, named);
        }
    }
    return [...counts]
        .map(([theme, count]) => ({
            theme,
            label: [...(labels.get(theme) ?? [theme])].join(t('hubs.label_separator')),
            count
        }))
        .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

/**
 * The words of `off` after one theme word is switched: taken out when it was off, added when on.
 */
export function toggledThemes(off: readonly string[], theme: string): string[] {
    return off.includes(theme) ? off.filter((item) => item !== theme) : [...off, theme];
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
