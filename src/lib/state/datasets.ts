// Layer 2, client state. Pure dataset summaries, search, tones, saved state and recovery command.
// The Data view receives records ready to draw and keeps its search words, disabled facets and open
// entry forms.

import { dataAccessTone } from './tones.ts';
import type { Dataset } from '../data/model.ts';
import { parseOpenForms, type OpenForms } from './open-forms.ts';

export type DataState = OpenForms & { search: string; off: string[]; reveal?: string };

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
        return { search: '', off: [], ...parseOpenForms(raw) };
    }
    const held = raw as Record<string, unknown>;
    const state: DataState = {
        search: typeof held.search === 'string' ? held.search : '',
        off: strings(held.off),
        ...parseOpenForms(raw)
    };
    if (typeof held.reveal === 'string' && held.reveal !== '') state.reveal = held.reveal;
    return state;
}

export type { Dataset } from '../data/model.ts';
