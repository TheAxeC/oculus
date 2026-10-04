// Layer 2, client-state tests. The pure rules behind the Data view: the access summary, search and
// recovery command. Nothing here renders or starts a terminal.

import { describe, expect, it } from 'vitest';
import {
    accessSummary,
    datasetSearch,
    recoveryCommand,
    type Dataset,
    datasetUsers
} from '../../../src/lib/state/sources/datasets.ts';

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

describe('the dataset summary', () => {
    it('counts access values most frequent first', () => {
        expect(accessSummary(DATASETS)).toBe(
            '2 open | 1 credentialed | 1 private | 1 public | 1 registration'
        );
    });
});

describe('the dataset search', () => {
    it('searches the five named fields with every supplied word', () => {
        expect(datasetSearch(DATASETS, 'heart time').map((item) => item.id)).toEqual(['open-one']);
        expect(datasetSearch(DATASETS, 'registered registration').map((item) => item.id)).toEqual([
            'registered'
        ]);
        expect(datasetSearch(DATASETS, '')).toEqual(DATASETS);
    });
});

describe('the recovery command', () => {
    it('quotes the dataset key as one shell word', () => {
        expect(recoveryCommand('mimic-iv')).toBe("python3 tools/data/redownload.py 'mimic-iv'");
        expect(recoveryCommand("one'key")).toBe("python3 tools/data/redownload.py 'one'\"'\"'key'");
    });
});

describe('the projects a dataset names as its users', () => {
    it('are joined in the order named, an unknown id left out', () => {
        const projects = [{ id: 'a' }, { id: 'b' }] as unknown as Parameters<
            typeof datasetUsers
        >[1];
        expect(datasetUsers(['b', 'gone', 'a'], projects).map((one) => one.id)).toEqual(['b', 'a']);
    });
});
