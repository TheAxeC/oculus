// Layer 2, client-state tests. The theme label helper over `venue_themes` and `data_themes` rows: a
// word with a row, a word without one, an empty or malformed list, a duplicated key, and words that
// name a property every plain object carries.

import { describe, expect, it } from 'vitest';
import { themeWordLabel, themeWordLabels } from '../../../../src/lib/state/shared/words/themes.ts';

describe('themeWordLabels and themeWordLabel', () => {
    it('gives a word its row label and a word with no row the word itself', () => {
        const labels = themeWordLabels([
            { key: 'core-ml', label: 'Core ML' },
            { key: 'bci-ecog', label: 'BCI / ECoG' }
        ]);
        expect(themeWordLabel(labels, 'core-ml')).toBe('Core ML');
        expect(themeWordLabel(labels, 'bci-ecog')).toBe('BCI / ECoG');
        expect(themeWordLabel(labels, 'theory')).toBe('theory');
    });

    it('reads an empty, absent or non-list value as no labels', () => {
        for (const rows of [[], undefined, null, 'core-ml', { key: 'core-ml', label: 'Core ML' }]) {
            const labels = themeWordLabels(rows);
            expect(labels.size).toBe(0);
            expect(themeWordLabel(labels, 'core-ml')).toBe('core-ml');
        }
    });

    it('keeps the first row of a duplicated key', () => {
        const labels = themeWordLabels([
            { key: 'eeg', label: 'EEG' },
            { key: 'eeg', label: 'Electroencephalography' }
        ]);
        expect(labels.size).toBe(1);
        expect(themeWordLabel(labels, 'eeg')).toBe('EEG');
    });

    it('finds no label for the empty word nor for a word naming a property of every plain object', () => {
        const labels = themeWordLabels([{ key: 'eeg', label: 'EEG' }]);
        for (const word of ['', 'constructor', '__proto__', 'toString', 'hasOwnProperty']) {
            expect(themeWordLabel(labels, word)).toBe(word);
        }
        const own = themeWordLabels([{ key: '__proto__', label: 'Proto' }]);
        expect(themeWordLabel(own, '__proto__')).toBe('Proto');
        expect(themeWordLabel(own, 'constructor')).toBe('constructor');
    });
});

describe('themeWordLabels over rows of the wrong type', () => {
    it('keeps a row whose label is empty, and draws the word with that empty label', () => {
        const labels = themeWordLabels([{ key: 'eeg', label: '' }]);
        expect([...labels]).toStrictEqual([['eeg', '']]);
        expect(themeWordLabel(labels, 'eeg')).toBe('');
    });

    it('passes over a row with a label of the wrong type and takes the first valid row of the key', () => {
        const labels = themeWordLabels([
            { key: 'eeg', label: 3 },
            { key: 'eeg', label: 'EEG' },
            { key: 'eeg', label: 'Later' }
        ]);
        expect([...labels]).toStrictEqual([['eeg', 'EEG']]);
    });

    it.each([
        ['a key that is a number', { key: 7, label: 'Seven' }],
        ['an empty key', { key: '', label: 'EEG' }],
        ['no label', { key: 'eeg' }],
        ['a row that is a list', ['eeg', 'EEG']],
        ['a row that is null', null]
    ])('passes over a row with %s', (_name, row) => {
        expect([...themeWordLabels([row])]).toStrictEqual([]);
    });

    it('keeps the rows that pass, in order, and ignores the keys a row holds beyond the two', () => {
        const labels = themeWordLabels([
            { key: 'b', label: 'B', extra: 1 },
            null,
            { key: 'a', label: 'A' }
        ]);
        expect([...labels]).toStrictEqual([
            ['b', 'B'],
            ['a', 'A']
        ]);
    });
});
