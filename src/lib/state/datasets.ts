// Layer 2, client state. Pure dataset summaries, filters, facets, tones and recovery command.
// The Data view receives records ready to draw and keeps only search words and disabled facets.

import { dataAccessTone } from './tones.ts';
import type { Dataset } from '../data/model.ts';

export type ThemeFacet = { theme: string; label: string; count: number };
export type DataState = { search: string; off: string[] };

function strings(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
}

/** Counts by access value, most frequent first and lexical inside a tie. */
export function accessSummary(datasets: Dataset[]): string {
    const counts = new Map<string, number>();
    for (const dataset of datasets) {
        const access = dataset.access?.trim() ?? '';
        if (access !== '') counts.set(access, (counts.get(access) ?? 0) + 1);
    }
    return [...counts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([access, count]) => `${count} ${access}`)
        .join(' | ');
}

/** The configured tone of an access value, with an unknown value in grey. */
export function accessTone(access: string | undefined): string {
    return dataAccessTone(access ?? '');
}

/** Theme words with display labels and counts, most frequent first and lexical inside a tie. */
export function themeFacets(
    datasets: Dataset[],
    labels: Record<string, string> = {}
): ThemeFacet[] {
    const counts = new Map<string, number>();
    for (const dataset of datasets) {
        for (const theme of dataset.themes) counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
    return [...counts]
        .map(([theme, count]) => ({ theme, label: labels[theme] ?? theme, count }))
        .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

/** Datasets with at least one theme whose toggle remains on. */
export function applyThemeFacets(datasets: Dataset[], off: string[]): Dataset[] {
    if (off.length === 0) return datasets;
    return datasets.filter((dataset) => dataset.themes.some((theme) => !off.includes(theme)));
}

/** Search key, name, description, modality and access using every supplied word. */
export function datasetSearch(datasets: Dataset[], words: string | string[]): Dataset[] {
    const needles = (Array.isArray(words) ? words : words.split(/\s+/))
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word !== '');
    if (needles.length === 0) return datasets;
    return datasets.filter((dataset) => {
        const haystack = [
            dataset.id,
            dataset.name,
            dataset.description ?? '',
            dataset.modality ?? '',
            dataset.access ?? ''
        ]
            .join(' ')
            .toLowerCase();
        return needles.every((word) => haystack.includes(word));
    });
}

/** The shell command the server gives tmux, with the dataset key as one quoted word. */
export function recoveryCommand(key: string): string {
    const quoted = `'${key.replaceAll("'", `'"'"'`)}'`;
    return `python3 tools/data/redownload.py ${quoted}`;
}

/** Saved state of one Data instance, with defaults for malformed or absent fields. */
export function parseDataState(raw: unknown): DataState {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { search: '', off: [] };
    }
    const held = raw as Record<string, unknown>;
    return {
        search: typeof held.search === 'string' ? held.search : '',
        off: strings(held.off)
    };
}

export type { Dataset } from '../data/model.ts';
