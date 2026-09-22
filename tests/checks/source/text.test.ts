// The catalog: flattening on the server, lookup and interpolation on the client. Then the glyph
// vocabulary and the ASCII stand-ins beside it, which are the same shape of thing: read from
// config/catalogs/glyphs.yml on the server, installed on the client, looked up where they render.

import { describe, expect, it } from 'vitest';
import {
    asciiCatalog,
    engineDir,
    flattenText,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import {
    asciiOf,
    glyph,
    lookup,
    setAscii,
    setCatalog,
    setGlyphMode,
    setGlyphs,
    t
} from '../../../src/lib/state/words/text.ts';

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

    it('resolves known glyph placeholders in lookup and t and preserves unknown names', () => {
        setCatalog({
            'radar.head': '{G.litwatch} watch {G.red}',
            'radar.tail': '{0} {G.nonesuch}'
        });
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        setGlyphMode('unicode');
        expect(lookup('radar.head')).toBe(`${GLYPHS.litwatch} watch ${GLYPHS.red}`);
        expect(t('radar.tail', 4)).toBe('4 {G.nonesuch}');
        setGlyphMode('ascii');
        expect(lookup('radar.head')).toBe(`${ASCII[GLYPHS.litwatch]} watch ${ASCII[GLYPHS.red]}`);
    });
});

// The characters themselves are config, so they are read from config/catalogs/glyphs.yml rather
// than written here: this file is ASCII like every other authored file, and the stand-ins are the
// only half of the pair that can be spelled in it.
const { config } = loadConfig(engineDir());
const GLYPHS = glyphCatalog(config);
const ASCII = asciiCatalog(config);

describe('catalog glyph tokens', () => {
    it('resolves the task note, error prefix and running-job mark in both modes', () => {
        setCatalog(textCatalog(config));
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        setGlyphMode('unicode');
        expect(t('app.tasks.note_prefix', 'note')).toBe(`${GLYPHS.info} note`);
        expect(t('ui.common.x_prefix', 'failed')).toBe(`${GLYPHS.cross} failed`);
        expect(t('hpc.pill_running', 2, 's')).toBe(`${GLYPHS.hpc} 2 HPC jobs running`);
        setGlyphMode('ascii');
        expect(t('app.tasks.note_prefix', 'note')).toBe(`${ASCII[GLYPHS.info]} note`);
        expect(t('ui.common.x_prefix', 'failed')).toBe(`${ASCII[GLYPHS.cross]} failed`);
        expect(t('hpc.pill_running', 2, 's')).toBe(`${ASCII[GLYPHS.hpc]} 2 HPC jobs running`);
    });
});

describe('glyph', () => {
    it('draws the character config/catalogs/glyphs.yml names while the mode is unicode', () => {
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        setGlyphMode('unicode');
        expect(glyph('refresh')).toBe(GLYPHS.refresh);
        expect(glyph('check')).toBe(GLYPHS.check);
    });

    it('draws the ASCII stand-in while the mode is ascii', () => {
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        setGlyphMode('ascii');
        expect(glyph('refresh')).toBe('(r)');
        expect(glyph('check')).toBe('+');
    });

    it('holds dedicated glyphs and ASCII stand-ins for the three rail toggles', () => {
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        for (const name of ['crt', 'wallpaper', 'unicode']) {
            expect(GLYPHS[name]).toBeTypeOf('string');
            expect(ASCII[GLYPHS[name]]).toBeTypeOf('string');
        }
    });

    it('draws a character the stand-ins do not hold as it is', () => {
        setGlyphs(GLYPHS);
        setAscii(ASCII);
        setGlyphMode('ascii');
        // The deadline sparkline's ramp is a string of characters rather than one, and `ascii:`
        // holds no entry for it.
        expect(ASCII[GLYPHS.spark_blocks]).toBe(undefined);
        expect(glyph('spark_blocks')).toBe(GLYPHS.spark_blocks);
    });

    it('throws on a name config/catalogs/glyphs.yml does not hold, in either mode', () => {
        setGlyphs(GLYPHS);
        setGlyphMode('ascii');
        expect(() => glyph('nonesuch')).toThrow(/nonesuch/);
        setGlyphMode('unicode');
        expect(() => glyph('nonesuch')).toThrow(/nonesuch/);
    });
});

describe('asciiOf', () => {
    it('swaps a character that came from data rather than from a name', () => {
        setAscii(ASCII);
        setGlyphMode('ascii');
        expect(asciiOf(GLYPHS.venue)).toBe('<>');
        expect(asciiOf(GLYPHS.funding)).toBe('<*>');
    });

    it('leaves a character the stand-ins do not hold, and leaves an empty string', () => {
        setAscii(ASCII);
        setGlyphMode('ascii');
        expect(asciiOf('Z')).toBe('Z');
        expect(asciiOf('')).toBe('');
    });

    it('leaves every character while the mode is unicode', () => {
        setAscii(ASCII);
        setGlyphMode('unicode');
        expect(asciiOf(GLYPHS.venue)).toBe(GLYPHS.venue);
        expect(asciiOf(GLYPHS.funding)).toBe(GLYPHS.funding);
    });
});
