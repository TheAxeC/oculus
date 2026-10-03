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
} from '../../../../src/lib/data/sources/config.ts';
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
    typeTone,
    dataAccessTone,
    domainLabel,
    namedTone
} from '../../../../src/lib/state/shared/words/tones.ts';
import { setGlyphMode, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { chipTone, chipsByTone } from '../../../../src/lib/state/shared/words/tones.ts';

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
    it('resolves a chip glyph name and gives the chip its words', () => {
        synthetic();
        expect(chipGlyphName('submitted')).toBe('check');
        expect(chipLabel('submitted')).toBe('submitted / under review');
    });

    it('gives an unknown chip the chip word itself and no glyph', () => {
        synthetic();
        expect(chipGlyphName('nonesuch')).toBe('');
        expect(chipLabel('nonesuch')).toBe('nonesuch');
    });

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

    // Revert: remove 'code_theme', 'show_tabs' or 'wrap_tabs' from VOCAB_KEYS in
    // data/sources/config/catalogs.ts; the first frame then lacks the key.
    it('carries all fourteen keys the client state reads at first load', () => {
        expect(Object.keys(vocab).sort()).toEqual([
            'code_theme',
            'crt',
            'data_access',
            'domains',
            'editor_actions',
            'palette',
            'show_tabs',
            'status_legend',
            'status_palette',
            'terminal',
            'themes',
            'type_color',
            'wallpaper',
            'wrap_tabs'
        ]);
        expect(vocab.terminal).toEqual({
            font_px: 12.5,
            mac_option_is_meta: false,
            copy_on_selection: false,
            cursor_style: 'block',
            cursor_blinking: false
        });
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
    it('is the project type hue, else the status hue', () => {
        synthetic();
        expect(chipTone('manuscript')).toBe('teal');
        expect(chipTone('submitted')).toBe('violet');
        expect(chipTone('nothing')).toBe('grey');
    });

    it('groups the chips by hue in the order hues first occur, each with its first chip and count', () => {
        synthetic();
        expect(chipsByTone(['manuscript', 'idea', 'submitted', 'nothing'])).toEqual([
            { tone: 'teal', key: 'manuscript', count: 1 },
            { tone: 'violet', key: 'idea', count: 2 },
            { tone: 'grey', key: 'nothing', count: 1 }
        ]);
    });
});

describe('a vocabulary whose rows are of the wrong type', () => {
    const MESSY = {
        palette: {
            '#AAA111': 'c-red',
            '#bbb222': 3,
            '#ccc333': null,
            '#ddd444': ['c-blue'],
            '#EEE555': 'c-blue',
            '#eee555': 'c-green'
        },
        status_palette: {
            ok: { color: '#aaa111' },
            str: '#aaa111',
            num: { color: 3 },
            list: [{ color: '#aaa111' }],
            nul: null,
            UP: { color: '#AAA111' },
            7: { color: '#aaa111' },
            true: { color: '#eee555' }
        },
        type_color: { manuscript: '#aaa111', idea: { color: '#aaa111' }, n: 3, Mixed: '#EEE555' },
        domains: {
            heart: { color: '#aaa111', label: 'Heart' },
            lung: { color: 3, label: '' },
            liver: 'x',
            Brain: { label: 'Brain', color: '#eee555' },
            empty: {}
        },
        data_access: { open: '#aaa111', closed: { color: '#aaa111' }, odd: 3 },
        status_legend: [
            'x',
            null,
            [],
            { key: 3, label: 'three' },
            { key: '', label: 'empty' },
            { key: 'dup', icon: 'check', label: 'First' },
            { key: 'dup', icon: 3, label: 4 },
            { key: 'bare', icon: 5, label: '' },
            { icon: 'check', label: 'no key' }
        ]
    };

    it('reads a palette entry that is not a string as no entry, and the later of two cases', () => {
        setVocab(MESSY);
        expect(toneOf('#aaa111')).toBe('red');
        expect(toneOf('#AAA111')).toBe('red');
        expect(toneOf('#bbb222')).toBe(UNKNOWN_TONE);
        expect(toneOf('#ccc333')).toBe(UNKNOWN_TONE);
        expect(toneOf('#ddd444')).toBe(UNKNOWN_TONE);
        expect(toneOf('#eee555')).toBe('green');
    });

    it.each([
        ['ok', 'red'],
        ['UP', 'red'],
        ['up', 'red'],
        ['str', UNKNOWN_TONE],
        ['num', UNKNOWN_TONE],
        ['list', UNKNOWN_TONE],
        ['nul', UNKNOWN_TONE],
        [7, 'red'],
        [true, 'green'],
        [null, UNKNOWN_TONE],
        [undefined, UNKNOWN_TONE],
        [['ok'], UNKNOWN_TONE],
        [{ ok: 1 }, UNKNOWN_TONE]
    ])('gives the status %j the tone %s', (status, expected) => {
        setVocab(MESSY);
        expect(statusTone(status)).toBe(expected);
    });

    it.each([
        ['manuscript', 'red'],
        ['MANUSCRIPT', 'red'],
        ['idea', UNKNOWN_TONE],
        ['n', UNKNOWN_TONE],
        ['mixed', 'green'],
        [3, UNKNOWN_TONE],
        [null, UNKNOWN_TONE]
    ])('gives the type %j the tone %s', (type, expected) => {
        setVocab(MESSY);
        expect(typeTone(type)).toBe(expected);
    });

    it.each([
        ['heart', 'red', 'Heart'],
        ['lung', UNKNOWN_TONE, ''],
        ['liver', UNKNOWN_TONE, 'liver'],
        ['Brain', 'green', 'Brain'],
        ['brain', 'green', 'Brain'],
        ['empty', UNKNOWN_TONE, 'empty'],
        [7, UNKNOWN_TONE, '7'],
        [null, UNKNOWN_TONE, ''],
        [{}, UNKNOWN_TONE, '']
    ])('gives the domain %j the tone %s and the words %j', (domain, tone, words) => {
        setVocab(MESSY);
        expect(domainTone(domain)).toBe(tone);
        expect(domainLabel(domain)).toBe(words);
    });

    it.each([
        ['open', 'red'],
        ['OPEN', 'red'],
        ['closed', UNKNOWN_TONE],
        ['odd', UNKNOWN_TONE],
        [3, UNKNOWN_TONE],
        [null, UNKNOWN_TONE]
    ])('gives the data access %j the tone %s', (access, expected) => {
        setVocab(MESSY);
        expect(dataAccessTone(access)).toBe(expected);
    });

    it.each([
        ['red', 'red'],
        [' red ', 'red'],
        ['Red', UNKNOWN_TONE],
        ['blue', UNKNOWN_TONE],
        ['green', 'green'],
        ['r e d', UNKNOWN_TONE],
        ['', UNKNOWN_TONE],
        [3, UNKNOWN_TONE],
        [true, UNKNOWN_TONE],
        [null, UNKNOWN_TONE],
        [['red'], UNKNOWN_TONE],
        [undefined, UNKNOWN_TONE]
    ])('names the hue %j as the tone %s', (name, expected) => {
        setVocab(MESSY);
        expect(namedTone(name)).toBe(expected);
    });

    it.each([
        ['#aaa111', 'red'],
        [' #AAA111 ', 'red'],
        [3, undefined],
        [null, undefined],
        [['#aaa111'], undefined],
        [undefined, undefined]
    ])('gives the hex %j the palette tone %s', (hex, expected) => {
        setVocab(MESSY);
        expect(paletteTone(hex)).toBe(expected);
    });

    it('reads a legend row with a key, a later row of one key replacing the earlier', () => {
        setVocab(MESSY);
        expect(chipKeys()).toStrictEqual(['', 'dup', 'bare']);
        expect(chipLabel('dup')).toBe('dup');
        expect(chipGlyphName('dup')).toBe('');
        expect(chipLabel('bare')).toBe('');
        expect(chipGlyphName('bare')).toBe('');
        expect(chipLabel('')).toBe('empty');
        expect(chipLabel('no key')).toBe('no key');
    });

    it.each([
        ['palette', { palette: [] }, () => toneOf('#aaa111'), UNKNOWN_TONE],
        ['status_palette', { status_palette: 'x' }, () => statusTone('ok'), UNKNOWN_TONE],
        ['type_color', { type_color: ['manuscript'] }, () => typeTone('manuscript'), UNKNOWN_TONE],
        ['domains', { domains: null }, () => domainTone('heart'), UNKNOWN_TONE],
        ['data_access', { data_access: 3 }, () => dataAccessTone('open'), UNKNOWN_TONE],
        ['status_legend', { status_legend: { key: 'a' } }, () => chipKeys(), []]
    ])('reads a %s that is no map or list as empty', (_name, config, read, expected) => {
        setVocab({ ...MESSY, ...config });
        expect(read()).toStrictEqual(expected);
    });
});

describe('a legend row named __proto__', () => {
    it('is left out, and its name reads as no chip', () => {
        setVocab({
            status_legend: [
                { key: '__proto__', icon: 'check', label: 'Proto' },
                { key: 'a', icon: 'check', label: 'A' }
            ]
        });
        expect(chipKeys()).toStrictEqual(['a']);
        expect(chipLabel('__proto__')).toBe('__proto__');
        expect(chipGlyphName('__proto__')).toBe('');
    });
});

describe('a name that is a property of every object', () => {
    const NAMES = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'];

    it.each(NAMES)('is no hex, status, type, domain or chip when asked for as %s', (name) => {
        setVocab({
            palette: { '#aaa111': 'c-red' },
            status_palette: { ok: { color: '#aaa111' } },
            type_color: { manuscript: '#aaa111' },
            domains: { heart: { color: '#aaa111', label: 'Heart' } },
            data_access: { open: '#aaa111' },
            status_legend: [{ key: 'a', icon: 'check', label: 'A' }]
        });
        expect(toneOf(name)).toBe(UNKNOWN_TONE);
        expect(paletteTone(name)).toBeUndefined();
        expect(statusTone(name)).toBe(UNKNOWN_TONE);
        expect(typeTone(name)).toBe(UNKNOWN_TONE);
        expect(domainTone(name)).toBe(UNKNOWN_TONE);
        expect(dataAccessTone(name)).toBe(UNKNOWN_TONE);
        expect(domainLabel(name)).toBe(name);
        expect(chipLabel(name)).toBe(name);
        expect(chipGlyphName(name)).toBe('');
        expect(statusMarkTone(name)).toBe(UNKNOWN_TONE);
        expect(namedTone(name)).toBe(UNKNOWN_TONE);
    });
});

describe('a vocabulary key whose lower-cased form is __proto__', () => {
    it.each(['palette', 'status_palette', 'type_color', 'domains', 'data_access'])(
        'holds no entry for the key __PROTO__ of %s',
        (key) => {
            const row = key === 'domains' ? { color: '#aaa111', label: 'Hidden' } : '#aaa111';
            setVocab({
                palette: { '#aaa111': 'c-red' },
                status_palette: key === 'status_palette' ? { __PROTO__: { color: '#aaa111' } } : {},
                type_color: key === 'type_color' ? { __PROTO__: row } : {},
                domains: key === 'domains' ? { __PROTO__: row } : {},
                data_access: key === 'data_access' ? { __PROTO__: row } : {},
                ...(key === 'palette' ? { palette: { __PROTO__: 'c-red' } } : {})
            });
            expect(toneOf('__proto__')).toBe(UNKNOWN_TONE);
            expect(paletteTone('__proto__')).toBeUndefined();
            expect(statusTone('__proto__')).toBe(UNKNOWN_TONE);
            expect(typeTone('__proto__')).toBe(UNKNOWN_TONE);
            expect(domainTone('__proto__')).toBe(UNKNOWN_TONE);
            expect(dataAccessTone('__proto__')).toBe(UNKNOWN_TONE);
            expect(domainLabel('__proto__')).toBe('__proto__');
        }
    );
});
