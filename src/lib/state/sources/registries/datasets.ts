// Layer 2, client state. Pure dataset summaries, search, tones, the words of a source Recover does
// not run, and saved state. The Data view receives records ready to draw and keeps its search
// words and disabled facets.

import { dataAccessTone } from '../../shared/words/tones.ts';
import { t } from '../../shared/words/text.ts';
import type { Dataset, Project, RecoverSource } from '../../../data/model/index.ts';
import { bareId } from '../../../data/helpers/hub-names.ts';
import { fieldItemsShape, readAs, searchRevealShape } from '../../../data/shapes/shapes.ts';

export type DataState = { search: string; off: string[]; reveal?: string };

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

/**
 * The configured tone of an access value under the words of the dataset's hub `hub`, with an
 * unknown value in grey.
 */
export function accessTone(access: string | undefined, hub?: string): string {
    return dataAccessTone(access ?? '', hub);
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

/** The fields a Data instance keeps, each read as absent when wrong. */
const dataStateShape = searchRevealShape.extend({ off: fieldItemsShape });

/** Saved state of one Data instance, with defaults for malformed or absent fields. */
export function parseDataState(raw: unknown): DataState {
    const held = readAs(dataStateShape, raw);
    const state: DataState = {
        search: held?.search ?? '',
        off: held?.off ?? []
    };
    if (held?.reveal !== undefined) state.reveal = held.reveal;
    return state;
}

/** The projects a dataset names as its users, in the order named, an unknown id left out. */
export function datasetUsers(ids: string[], projects: Project[]): Project[] {
    return ids
        .map((id) => projects.find((project) => project.id === id))
        .filter((project) => project !== undefined);
}

/**
 * Whether a source is one the card states instead of Recover running it: a library call, a contact
 * to ask, or the sets the dataset is built from.
 */
export function statedSource(source: RecoverSource): boolean {
    return source.kind === 'library' || source.kind === 'request' || source.kind === 'derived';
}

/** What the card says of a source that Recover does not run, '' for a download. */
export function statedWords(source: RecoverSource): string {
    if (source.kind === 'library') return t('data.stated_library', source.call);
    if (source.kind === 'request') return t('data.stated_request', source.contact);
    if (source.kind === 'derived') {
        return t('data.stated_derived', source.from.join(', '), source.script);
    }
    return '';
}

/** The key a dataset's Recover view opens under: its id as its own hub's files write it. */
export function recoverKey(dataset: Dataset): string {
    return bareId(dataset);
}

export type { Dataset } from '../../../data/model/index.ts';
