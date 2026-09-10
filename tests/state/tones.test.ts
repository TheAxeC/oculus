// The config's colours as tones, over a synthetic vocabulary and then over the real config/vocab.yml.
//
// The synthetic half is where the unknown cases are checked, since the real config has an answer for
// almost everything. The real half is the one that would fail if config/vocab.yml stopped holding a
// key the lookups read, which is the only way these functions can break without this file changing.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, vocabCatalog } from '../../src/lib/data/sources/config.ts';
import {
    UNKNOWN_TONE,
    chipGlyph,
    chipKeys,
    chipLabel,
    setVocab,
    statusTone,
    themeTone,
    toneOf,
    typeTone
} from '../../src/lib/state/tones.ts';

/** A vocabulary with one of everything, including the entries the lookups must refuse. */
const SYNTHETIC = {
    palette: {
        '#7c5cff': 'c-violet',
        '#0d9488': 'c-teal',
        '#64748b': 'muted',
        '#123456': 'c-not a hue'
    },
    status_palette: {
        submitted: { color: '#7c5cff' },
        withdrawn: { color: '#ffffff' },
        broken: { note: 'no colour here' }
    },
    type_color: { manuscript: '#0d9488', idea: '#7c5cff' },
    status_legend: [
        { key: 'submitted', icon: 'S', label: 'submitted / under review' },
        { key: 'bare', label: 'no icon at all' },
        { icon: 'X', label: 'no key at all' }
    ],
    themes: { heart: { color: '#7c5cff', label: 'Cardiology' }, blank: { label: 'no colour' } }
};

function synthetic(): void {
    setVocab(SYNTHETIC);
}

describe('toneOf', () => {
    it('gives the hue of a palette token', () => {
        synthetic();
        expect(toneOf('#7c5cff')).toBe('violet');
        expect(toneOf('#0d9488')).toBe('teal');
    });

    it('matches a hex the config wrote in either case', () => {
        synthetic();
        expect(toneOf('#7C5CFF')).toBe('violet');
    });

    it('gives the unknown tone for a hex the palette does not list', () => {
        synthetic();
        expect(toneOf('#abcdef')).toBe(UNKNOWN_TONE);
    });

    it('gives the unknown tone for a token that is not a hue', () => {
        synthetic();
        expect(toneOf('#64748b')).toBe(UNKNOWN_TONE);
    });

    it('gives the unknown tone for a token no custom property could be named after', () => {
        synthetic();
        expect(toneOf('#123456')).toBe(UNKNOWN_TONE);
    });
});

describe('the tone of a status, a type and a theme', () => {
    it('reads each through its own map', () => {
        synthetic();
        expect(statusTone('submitted')).toBe('violet');
        expect(typeTone('manuscript')).toBe('teal');
        expect(themeTone('heart')).toBe('violet');
    });

    it('gives the unknown tone for a name no map holds', () => {
        synthetic();
        expect(statusTone('nonesuch')).toBe(UNKNOWN_TONE);
        expect(typeTone('nonesuch')).toBe(UNKNOWN_TONE);
        expect(themeTone('nonesuch')).toBe(UNKNOWN_TONE);
    });

    it('gives the unknown tone for an entry with no colour, and for a colour off the palette', () => {
        synthetic();
        expect(statusTone('broken')).toBe(UNKNOWN_TONE);
        expect(statusTone('withdrawn')).toBe(UNKNOWN_TONE);
        expect(themeTone('blank')).toBe(UNKNOWN_TONE);
    });
});

describe('the chip legend', () => {
    it('gives a chip its character and its words', () => {
        synthetic();
        expect(chipGlyph('submitted')).toBe('S');
        expect(chipLabel('submitted')).toBe('submitted / under review');
    });

    it('gives an unknown chip the chip word itself and no glyph', () => {
        synthetic();
        expect(chipGlyph('nonesuch')).toBe('');
        expect(chipLabel('nonesuch')).toBe('nonesuch');
    });

    it('gives no glyph to a row that carries none', () => {
        synthetic();
        expect(chipGlyph('bare')).toBe('');
        expect(chipLabel('bare')).toBe('no icon at all');
    });

    it('drops a row with no key and keeps the config order', () => {
        synthetic();
        expect(chipKeys()).toEqual(['submitted', 'bare']);
    });
});

describe('a vocabulary that is missing or wrongly shaped', () => {
    it('answers every lookup with its unknown case rather than throwing', () => {
        setVocab({});
        expect(toneOf('#7c5cff')).toBe(UNKNOWN_TONE);
        expect(statusTone('submitted')).toBe(UNKNOWN_TONE);
        expect(chipKeys()).toEqual([]);
        expect(chipLabel('submitted')).toBe('submitted');
    });

    it('ignores a key of the wrong shape', () => {
        setVocab({ palette: 'not a map', status_legend: 'not a list' });
        expect(toneOf('#7c5cff')).toBe(UNKNOWN_TONE);
        expect(chipKeys()).toEqual([]);
    });
});

describe('the real config/vocab.yml', () => {
    const vocab = vocabCatalog(loadConfig(engineDir()).config);

    it('carries all five keys the lookups read', () => {
        expect(Object.keys(vocab).sort()).toEqual([
            'palette',
            'status_legend',
            'status_palette',
            'themes',
            'type_color'
        ]);
    });

    it('gives a hue to every type the portfolio uses', () => {
        setVocab(vocab);
        expect(typeTone('manuscript')).toBe('teal');
        expect(typeTone('idea')).toBe('violet');
        expect(typeTone('published')).toBe('green');
    });

    it('gives a hue to a status and a research theme', () => {
        setVocab(vocab);
        expect(statusTone('submitted')).toBe('amber');
        expect(themeTone('heart')).toBe('crimson');
    });

    it('gives every chip in the legend a label, and most of them a character', () => {
        setVocab(vocab);
        const keys = chipKeys();
        expect(keys.length).toBeGreaterThan(20);
        expect(keys.filter((key) => chipLabel(key) === '')).toEqual([]);
        expect(keys.filter((key) => chipGlyph(key) === '')).toEqual([]);
    });

    it('leaves every tone it hands out usable as a custom-property name', () => {
        setVocab(vocab);
        const tones = chipKeys().map((key) => statusTone(key));
        expect(tones.filter((tone) => !/^[a-z][a-z0-9-]*$/.test(tone))).toEqual([]);
    });
});
