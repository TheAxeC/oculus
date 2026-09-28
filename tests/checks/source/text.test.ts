// The catalog: flattening on the server, lookup and interpolation on the client. Then the glyph
// vocabulary, each name with its ASCII stand-in: read from config/catalogs/glyphs.yml on the
// server, installed on the client, and answered by glyph() as the stand-in whatever the mode, since
// the stand-in is the only form of a glyph that may go into text.

import { describe, expect, it } from 'vitest';
import {
    engineDir,
    flattenText,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import {
    bracketedGlyph,
    glyph,
    lookup,
    setCatalog,
    setGlyphMode,
    setGlyphs,
    t
} from '../../../src/lib/state/shared/words/text.ts';

describe('flattenText', () => {
    it('turns a nested map into dotted keys', () => {
        expect(flattenText({ app: { title: 'oculus', tabs: { focus: 'Focus' } } })).toEqual({
            'app.title': 'oculus',
            'app.tabs.focus': 'Focus'
        });
    });
});

describe('textCatalog', () => {
    it('flattens the text key of the merged config', () => {
        expect(textCatalog({ text: { app: { title: 'oculus' } }, palette: ['teal'] })).toEqual({
            'app.title': 'oculus'
        });
    });

    it('is empty when the config holds no text', () => {
        expect(textCatalog({})).toEqual({});
    });

    it('reads the catalog out of the real config directory', () => {
        expect(textCatalog(loadConfig(engineDir()).config)['app.title']).toBe('oculus');
    });
});

describe('t', () => {
    it('interpolates by position', () => {
        setCatalog({ 'audit.count': '{0} findings in {1}' });
        expect(t('audit.count', 3, 'venues.yml')).toBe('3 findings in venues.yml');
    });

    it('leaves a placeholder with no argument as it is written', () => {
        setCatalog({ 'audit.count': '{0} findings in {1}' });
        expect(t('audit.count', 3)).toBe('3 findings in {1}');
        expect(t('audit.count')).toBe('{0} findings in {1}');
    });

    it('throws on a key that is not in the catalog', () => {
        setCatalog({});
        expect(() => t('app.missing')).toThrow(/app\.missing/);
    });

    it('draws a catalog line as written, with nothing filled into a glyph-shaped token', () => {
        setCatalog({ 'radar.head': '{G.litwatch} watch' });
        setGlyphs(GLYPHS);
        setGlyphMode('icon');
        expect(lookup('radar.head')).toBe('{G.litwatch} watch');
        setGlyphMode('ascii');
        expect(t('radar.head')).toBe('{G.litwatch} watch');
    });
});

const { config } = loadConfig(engineDir());
const GLYPHS = glyphCatalog(config);

describe('the catalog', () => {
    it('carries no glyph token in any line, since every glyph is drawn beside the words', () => {
        const lines = Object.entries(textCatalog(config));
        expect(lines.filter(([, line]) => line.includes('{G.')).map(([key]) => key)).toEqual([]);
    });
});

describe('glyph', () => {
    it('answers the stand-in config/catalogs/glyphs.yml gives a name, in either mode', () => {
        setGlyphs(GLYPHS);
        setGlyphMode('icon');
        expect(glyph('refresh')).toBe('(r)');
        expect(glyph('check')).toBe('+');
        setGlyphMode('ascii');
        expect(glyph('refresh')).toBe('(r)');
        expect(glyph('check')).toBe('+');
    });

    it('holds a dedicated glyph with a stand-in for the three appearance toggles', () => {
        for (const name of ['crt', 'wallpaper', 'icons']) {
            expect(GLYPHS[name]).toMatch(/^[\x20-\x7E]+$/);
        }
    });

    it('throws on a name config/catalogs/glyphs.yml does not hold, in either mode', () => {
        setGlyphs(GLYPHS);
        setGlyphMode('ascii');
        expect(() => glyph('nonesuch')).toThrow(/nonesuch/);
        setGlyphMode('icon');
        expect(() => glyph('nonesuch')).toThrow(/nonesuch/);
    });
});

describe('bracketedGlyph', () => {
    it('reads a bracketed stand-in as a tag only while the stand-ins are drawn', () => {
        setGlyphs(GLYPHS);
        setGlyphMode('ascii');
        expect(bracketedGlyph('expand')).toBe(true);
        expect(bracketedGlyph('refresh')).toBe(false);
        setGlyphMode('icon');
        expect(bracketedGlyph('expand')).toBe(false);
    });
});
