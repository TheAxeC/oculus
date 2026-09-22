// The theme label helper over `venue_themes` and `data_themes` rows: a word with a row, a word
// without one, an empty or malformed list, a duplicated key, and words that name a property every
// plain object carries.

import { describe, expect, it } from 'vitest';
import { themeWordLabel, themeWordLabels } from '../../../src/lib/state/words/themes.ts';

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

    it('passes over a row without a string key or label, and an empty key', () => {
        const labels = themeWordLabels([
            'eeg',
            null,
            ['eeg', 'EEG'],
            { key: 7, label: 'Seven' },
            { key: 'ecg' },
            { key: '', label: 'Nothing' },
            { key: 'ecg', label: 'ECG' }
        ]);
        expect([...labels]).toEqual([['ecg', 'ECG']]);
        expect(themeWordLabel(labels, '')).toBe('');
    });

    it('finds no label for a word naming a property of every plain object', () => {
        const labels = themeWordLabels([{ key: 'eeg', label: 'EEG' }]);
        for (const word of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
            expect(themeWordLabel(labels, word)).toBe(word);
        }
        const own = themeWordLabels([{ key: '__proto__', label: 'Proto' }]);
        expect(themeWordLabel(own, '__proto__')).toBe('Proto');
        expect(themeWordLabel(own, 'constructor')).toBe('constructor');
    });
});
