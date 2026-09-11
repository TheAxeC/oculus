// The pure rules behind the Data view: summaries, tones, facets, search, saved state and recovery.
// Nothing here renders or starts a terminal.

import { beforeAll, describe, expect, it } from 'vitest';
import {
    accessSummary,
    accessTone,
    applyThemeFacets,
    datasetSearch,
    parseDataState,
    recoveryCommand,
    themeFacets,
    type Dataset
} from '../../src/lib/state/datasets.ts';
import { engineDir, loadConfig, vocabCatalog } from '../../src/lib/data/sources/config.ts';
import { setVocab } from '../../src/lib/state/tones.ts';

function dataset(id: string, over: Partial<Dataset> = {}): Dataset {
    return {
        id,
        name: id,
        themes: [],
        projectIds: [],
        ...over
    };
}

const DATASETS = [
    dataset('open-one', {
        name: 'Open ECG',
        description: 'Heart signals',
        modality: 'time series',
        access: 'open',
        themes: ['ecg', 'signals']
    }),
    dataset('open-two', { access: 'open', themes: ['ecg'] }),
    dataset('registered', { access: 'registration', themes: ['signals'] }),
    dataset('private', { access: 'private', themes: ['private-theme'] }),
    dataset('credentialed', { access: 'credentialed', themes: ['ecg'] }),
    dataset('public', { access: 'public', themes: ['signals'] })
];

beforeAll(() => {
    const { config } = loadConfig(engineDir());
    setVocab(vocabCatalog(config));
});

describe('dataset summaries and tones', () => {
    it('counts access values most frequent first', () => {
        expect(accessSummary(DATASETS)).toBe(
            '2 open | 1 credentialed | 1 private | 1 public | 1 registration'
        );
    });

    it('produces the hub access summary in descending count order', () => {
        const counts = [
            ['open', 34],
            ['registration', 7],
            ['private', 4],
            ['credentialed', 3],
            ['public', 1]
        ] as const;
        const datasets = counts.flatMap(([access, count]) =>
            Array.from({ length: count }, (_, at) => dataset(`${access}-${at}`, { access }))
        );
        expect(accessSummary(datasets)).toBe(
            '34 open | 7 registration | 4 private | 3 credentialed | 1 public'
        );
    });

    it('uses data_access through the palette and leaves an unnamed value grey', () => {
        expect(accessTone('open')).toBe('green');
        expect(accessTone('registration')).toBe('amber');
        expect(accessTone('credentialed')).toBe('red');
        expect(accessTone('private')).toBe('slate');
        expect(accessTone('public')).toBe('grey');
    });
});

describe('dataset facets and search', () => {
    it('counts themes by frequency and applies configured labels', () => {
        expect(themeFacets(DATASETS, { ecg: 'ECG' })).toEqual([
            { theme: 'ecg', label: 'ECG', count: 3 },
            { theme: 'signals', label: 'signals', count: 3 },
            { theme: 'private-theme', label: 'private-theme', count: 1 }
        ]);
    });

    it('keeps a dataset when any one of its themes remains on', () => {
        expect(applyThemeFacets(DATASETS, ['ecg']).map((item) => item.id)).toEqual([
            'open-one',
            'registered',
            'private',
            'public'
        ]);
        expect(applyThemeFacets(DATASETS, []).length).toBe(DATASETS.length);
    });

    it('searches the five named fields with every supplied word', () => {
        expect(datasetSearch(DATASETS, 'heart time').map((item) => item.id)).toEqual(['open-one']);
        expect(datasetSearch(DATASETS, 'registered registration').map((item) => item.id)).toEqual([
            'registered'
        ]);
        expect(datasetSearch(DATASETS, '')).toEqual(DATASETS);
    });
});

describe('dataset instance state and recovery command', () => {
    it('parses search and string facet keys and defaults malformed state', () => {
        expect(parseDataState({ search: 'ecg', off: ['private-theme', 7] })).toEqual({
            search: 'ecg',
            off: ['private-theme']
        });
        expect(parseDataState(undefined)).toEqual({ search: '', off: [] });
        expect(parseDataState({ search: 7, off: 'ecg' })).toEqual({ search: '', off: [] });
    });

    it('quotes the dataset key as one shell word', () => {
        expect(recoveryCommand('mimic-iv')).toBe("python3 tools/data/redownload.py 'mimic-iv'");
        expect(recoveryCommand("one'key")).toBe("python3 tools/data/redownload.py 'one'\"'\"'key'");
    });
});
