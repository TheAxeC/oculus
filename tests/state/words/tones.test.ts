// The config's colours as tones, over a synthetic vocabulary and then over the real
// config/catalogs/vocab.yml.
//
// The synthetic half is where the unknown cases are checked, since the real config has an answer
// for almost everything. The real half is the one that would fail if config/catalogs/vocab.yml
// stopped holding a key the lookups read, which is the only way these functions can break without
// this file changing.

import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import {
    UNKNOWN_TONE,
    chipGlyphName,
    chipKeys,
    chipLabel,
    setVocab,
    statusMarkTone,
    statusTone,
    domainTone,
    toneOf,
    paletteTone,
    typeTone
} from '../../../src/lib/state/words/tones.ts';
import { setGlyphMode, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { chipTone, chipsByTone } from '../../../src/lib/state/words/tones.ts';

const REAL_CONFIG = loadConfig(engineDir()).config;
const GLYPHS = glyphCatalog(REAL_CONFIG);

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
        { key: 'submitted', icon: 'check', label: 'submitted / under review' },
        { key: 'bare', label: 'no icon at all' },
        { icon: 'X', label: 'no key at all' }
    ],
    domains: { heart: { color: '#7c5cff', label: 'Cardiology' }, blank: { label: 'no colour' } }
};

function synthetic(): void {
    setGlyphs(GLYPHS);
    setGlyphMode('icon');
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

describe('paletteTone', () => {
    it('resolves palette hues with case and whitespace normalization', () => {
        synthetic();
        expect(paletteTone('  #7C5CFF  ')).toBe('violet');
        expect(paletteTone('#0d9488')).toBe('teal');
    });

    it('leaves absent hexes and unusable tokens without a tone', () => {
        synthetic();
        expect(paletteTone('#abcdef')).toBeUndefined();
        expect(paletteTone('#64748b')).toBeUndefined();
        expect(paletteTone('#123456')).toBeUndefined();
        expect(paletteTone('')).toBeUndefined();
    });

    it('preserves an explicitly configured grey hue', () => {
        setVocab({ palette: { '#123456': 'c-grey' } });
        expect(paletteTone('#123456')).toBe('grey');
    });
});

describe('the tone of a status, a type and a research domain', () => {
    it('reads each through its own map', () => {
        synthetic();
        expect(statusTone('submitted')).toBe('violet');
        expect(typeTone('manuscript')).toBe('teal');
        expect(domainTone('heart')).toBe('violet');
    });

    it('gives the unknown tone for a name no map holds', () => {
        synthetic();
        expect(statusTone('nonesuch')).toBe(UNKNOWN_TONE);
        expect(typeTone('nonesuch')).toBe(UNKNOWN_TONE);
        expect(domainTone('nonesuch')).toBe(UNKNOWN_TONE);
    });

    it('gives the unknown tone for an entry with no colour, and for a colour off the palette', () => {
        synthetic();
        expect(statusTone('broken')).toBe(UNKNOWN_TONE);
        expect(statusTone('withdrawn')).toBe(UNKNOWN_TONE);
        expect(domainTone('blank')).toBe(UNKNOWN_TONE);
    });
});

describe('the hue of a status mark', () => {
    it('takes the palette tone where the palette names the status, and the icon colour elsewhere', () => {
        setVocab(vocabCatalog(REAL_CONFIG));
        // The palette names these, so the mark wears the chip's own tone.
        expect(statusMarkTone('submitted')).toBe(statusTone('submitted'));
        expect(statusMarkTone('revision')).toBe(statusTone('revision'));
        // The palette does not name these; their legend icons are named by their colour.
        expect(statusTone('blocked')).toBe(UNKNOWN_TONE);
        expect(statusMarkTone('blocked')).toBe('purple');
        expect(statusMarkTone('ai-tells')).toBe('red');
        expect(statusMarkTone('submit-ready')).toBe('green');
        expect(statusMarkTone('numbers-pending')).toBe('blue');
        expect(statusMarkTone('admin-prep')).toBe('gold');
        expect(statusMarkTone('parked')).toBe('slate');
        expect(statusMarkTone('results-positive')).toBe('grey');
        // A legend icon that is a shape rather than a colour carries no hue of its own.
        expect(statusMarkTone('lead')).toBe(UNKNOWN_TONE);
        expect(statusMarkTone('nonesuch')).toBe(UNKNOWN_TONE);
    });

    it('gives every coloured legend icon a hue, so no two colour names collapse by accident', () => {
        setVocab(vocabCatalog(REAL_CONFIG));
        const coloured = ['ai-tells', 'blocked', 'submit-ready', 'numbers-pending', 'exploring'];
        const hues = coloured.map((chip) => statusMarkTone(chip));
        expect(hues).not.toContain(UNKNOWN_TONE);
        expect(new Set(hues).size).toBe(hues.length);
    });
});

describe('the chip legend', () => {
    // revert: src/lib/state/words/tones.ts:162 => return '';
    it('resolves a chip glyph name and gives the chip its words', () => {
        synthetic();
        expect(chipGlyphName('submitted')).toBe('check');
        expect(chipLabel('submitted')).toBe('submitted / under review');
    });

    // revert: src/lib/state/words/tones.ts:162 => return legend[chip]?.icon || 'x';
    it('gives an unknown chip the chip word itself and no glyph', () => {
        synthetic();
        expect(chipGlyphName('nonesuch')).toBe('');
        expect(chipLabel('nonesuch')).toBe('nonesuch');
    });

    // revert: src/lib/state/words/tones.ts:162 => return legend[chip]?.icon || 'x';
    it('gives no glyph to a row that carries none', () => {
        synthetic();
        expect(chipGlyphName('bare')).toBe('');
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

describe('the real config/catalogs/vocab.yml', () => {
    const vocab = vocabCatalog(REAL_CONFIG);

    it('carries all ten keys the client state reads at first load', () => {
        expect(Object.keys(vocab).sort()).toEqual([
            'crt',
            'data_access',
            'domains',
            'palette',
            'status_legend',
            'status_palette',
            'terminal',
            'themes',
            'type_color',
            'wallpaper'
        ]);
        expect(vocab.terminal).toEqual({ font_px: 12.5 });
    });

    it('gives a hue to every type the portfolio uses', () => {
        setVocab(vocab);
        expect(typeTone('manuscript')).toBe('teal');
        expect(typeTone('idea')).toBe('violet');
        expect(typeTone('published')).toBe('green');
    });

    it('gives a hue to a status and a research domain', () => {
        setVocab(vocab);
        expect(statusTone('submitted')).toBe('amber');
        expect(domainTone('heart')).toBe('crimson');
    });

    // revert: src/lib/state/words/tones.ts:162 => return '';
    it('gives every chip in the legend a label and a glyph name', () => {
        setGlyphs(GLYPHS);
        setGlyphMode('icon');
        setVocab(vocab);
        const keys = chipKeys();
        expect(keys.length).toBeGreaterThan(20);
        expect(keys.filter((key) => chipLabel(key) === '')).toEqual([]);
        expect(keys.filter((key) => chipGlyphName(key) === '')).toEqual([]);
    });

    it('names a glyph held by config/catalogs/glyphs.yml in every status legend row', () => {
        const rows = vocab.status_legend as { key: string; icon: string }[];
        expect(rows.filter((row) => !(row.icon in GLYPHS)).map((row) => row.key)).toEqual([]);
    });

    it('leaves every tone it hands out usable as a custom-property name', () => {
        setVocab(vocab);
        const tones = chipKeys().map((key) => statusTone(key));
        expect(tones.filter((tone) => !/^[a-z][a-z0-9-]*$/.test(tone))).toEqual([]);
    });
});

describe('the hues the chips of the vocabulary wear', () => {
    // revert: src/lib/state/words/tones.ts:214 => return type;
    it('is the project type hue, else the status hue', () => {
        synthetic();
        expect(chipTone('manuscript')).toBe('teal');
        expect(chipTone('submitted')).toBe('violet');
        expect(chipTone('nothing')).toBe('grey');
    });

    // revert: src/lib/state/words/tones.ts:229 => else held.count = 1;
    it('groups the chips by hue in the order hues first occur, each with its first chip and count', () => {
        synthetic();
        expect(chipsByTone(['manuscript', 'idea', 'submitted', 'nothing'])).toEqual([
            { tone: 'teal', key: 'manuscript', count: 1 },
            { tone: 'violet', key: 'idea', count: 2 },
            { tone: 'grey', key: 'nothing', count: 1 }
        ]);
    });
});
