// Putting a theme on the document, over the real stylesheets read from disk: the class string that
// lands on the body, the derived tokens that land on the root element, and the wallpaper's three
// custom properties beside them.
//
// The document is a plain object recording what was set, so this runs in the node environment with
// no DOM. What it does NOT cover: that a browser then paints those tokens. The sheets themselves
// are covered by tests/checks/look/contrast.test.ts, which measures every pair under every theme.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
    CRT_CLASS,
    WALL_BLUR,
    WALL_CLASS,
    WALL_PANEL,
    WALL_POPOVER,
    applyTheme,
    applyWallpaper,
    type Themeable
} from '../../src/lib/ui/theme.ts';
import { engineDir, glyphCatalog, loadConfig } from '../../src/lib/data/sources/config.ts';
import {
    setAppearance,
    terminalFontPx,
    themeClass,
    themeLabel,
    themes,
    wallpaperSettings
} from '../../src/lib/state/shared/words/appearance.ts';
import { setGlyphMode, setGlyphs } from '../../src/lib/state/shared/words/text.ts';
import { parseBlocks } from '../../src/lib/themes/parse.ts';

const THEMES_DIR = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'src',
    'lib',
    'themes'
);
const TOKENS = readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8');
const THEMES = readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8');
const APPEARANCE = loadConfig(engineDir()).config;
const GLYPHS = glyphCatalog(APPEARANCE);
setGlyphs(GLYPHS);
setGlyphMode('icon');
setAppearance(APPEARANCE);

afterEach(() => {
    setGlyphMode('icon');
    setAppearance(APPEARANCE);
});

/** A document as applyTheme needs one, with everything it was handed kept. */
function fakeDocument() {
    const set: Record<string, string> = {};
    const document: Themeable = {
        body: { className: 'stale' },
        documentElement: {
            style: {
                setProperty: (name: string, value: string): void => {
                    set[name] = value;
                }
            }
        }
    };
    return { document, set };
}

function apply(name: string, crt = false) {
    const { document, set } = fakeDocument();
    applyTheme(document, themeClass(name), crt, TOKENS, THEMES);
    return { className: document.body.className, set };
}

describe('applyTheme', () => {
    // revert: src/lib/state/shared/words/appearance.ts:131 => glyph: '',
    it('gives each theme its glyph name apart from words that carry none, in either mode', () => {
        const light = themes().find((entry) => entry.name === 'light');
        const mocha = themes().find((entry) => entry.name === 'mocha');
        expect(light).toMatchObject({ glyph: 'theme_base', label: 'light' });
        expect(mocha).toMatchObject({ glyph: 'theme_rice', label: 'mocha' });
        for (const entry of themes()) {
            expect(entry.glyph in GLYPHS, entry.name).toBe(true);
            expect(entry.label, entry.name).toMatch(/^[a-z0-9 '()-]+$/);
        }
        setGlyphMode('ascii');
        expect(themeLabel('light')).toBe('light');
        expect(themeLabel('mocha')).toBe('mocha');
    });

    // revert: src/lib/state/shared/words/appearance.ts:146 => return list.map((theme) => ({ ...theme }));
    it('offers a row whose glyph is empty, missing or unknown with its words alone', () => {
        setAppearance({
            themes: [
                { name: 'a', glyph: '', label: 'A' },
                { name: 'b', label: 'B' },
                { name: 'c', glyph: 'nonesuch', label: 'C' },
                { name: 'd', glyph: 'constructor', label: 'D' },
                { name: 'e', glyph: 'theme_base', label: 'E' }
            ]
        });
        expect(themes().map((entry) => `${entry.name}:${entry.glyph}`)).toEqual([
            'a:',
            'b:',
            'c:',
            'd:',
            'e:theme_base'
        ]);
    });

    // revert: src/lib/state/shared/words/appearance.ts:127 => if (name === undefined || name.length === 0) continue;
    it('offers a theme named twice once, as its first row gives it', () => {
        setAppearance({
            themes: [
                { name: 'a', class: 'one', glyph: 'theme_base', label: 'first' },
                { name: 'constructor', class: '', glyph: 'theme_rice', label: 'odd' },
                { name: 'a', class: 'two', glyph: 'theme_rice', label: 'second' }
            ]
        });
        expect(themes().map((entry) => `${entry.name}:${entry.label}`)).toEqual([
            'a:first',
            'constructor:odd'
        ]);
        expect(themeClass('a')).toBe('one');
        expect(themeLabel('a')).toBe('first');
    });

    it('puts the theme class string on the body', () => {
        expect(apply('mocha').className).toBe('rice mocha');
        expect(apply('dark').className).toBe('dark');
    });

    it('leaves the body with no class at all on the light theme', () => {
        expect(apply('light').className).toBe('');
    });

    it('adds the CRT class beside the theme, and to the bare light theme too', () => {
        expect(apply('mocha', true).className).toBe(`rice mocha ${CRT_CLASS}`);
        expect(apply('light', true).className).toBe(CRT_CLASS);
    });

    it('sets the derived tokens on the root element', () => {
        const { set } = apply('mocha');
        expect(set['--ink-txt']).toMatch(/^#[0-9a-f]{6}$/);
        expect(set['--on-c-teal']).toMatch(/^#(?:000000|ffffff)$/);
        expect(set['--accent-txt']).toMatch(/^#[0-9a-f]{6}$/);
        expect(set['--muted-txt']).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('derives from the theme in force, so two themes do not agree on every token', () => {
        const mocha = apply('mocha').set;
        const light = apply('light').set;
        expect(mocha['--ink-txt']).not.toBe(light['--ink-txt']);
    });

    it('carries the wallpaper class beside the theme when the shell adds it', () => {
        const { document } = fakeDocument();
        applyTheme(document, `${themeClass('mocha')} ${WALL_CLASS}`, false, TOKENS, THEMES);
        expect(document.body.className).toBe(`rice mocha ${WALL_CLASS}`);
    });
});

describe('applyWallpaper', () => {
    /**
     * The three numbers a wallpaper is drawn through, as state/shared/words/appearance.ts resolves
     * them.
     */
    const CONFIG = { panel: 76, popover: 97, panelBlur: 2 };

    it('sets the three custom properties from the config', () => {
        const { document, set } = fakeDocument();
        applyWallpaper(document, CONFIG, true);
        expect(set[WALL_PANEL]).toBe('76%');
        expect(set[WALL_POPOVER]).toBe('97%');
        expect(set[WALL_BLUR]).toBe('2px');
    });

    it('clears all three when it is off, and when nothing is configured', () => {
        const off = fakeDocument();
        applyWallpaper(off.document, CONFIG, false);
        expect(off.set).toEqual({ [WALL_PANEL]: '', [WALL_POPOVER]: '', [WALL_BLUR]: '' });

        const none = fakeDocument();
        applyWallpaper(none.document, null, true);
        expect(none.set).toEqual({ [WALL_PANEL]: '', [WALL_POPOVER]: '', [WALL_BLUR]: '' });
    });

    it('takes config/appearance.yml as it stands, whose numbers are percentages', () => {
        const settings = wallpaperSettings();
        expect(settings).not.toBe(null);
        const { document, set } = fakeDocument();
        applyWallpaper(document, settings, true);
        expect(set[WALL_PANEL]).toBe(`${settings?.panel}%`);
        expect(set[WALL_PANEL]).toMatch(/^\d+%$/);
        expect(set[WALL_BLUR]).toMatch(/^\d+(?:\.\d+)?px$/);
    });
});

describe('terminalFontPx', () => {
    it('reads and bounds the configured CSS pixel size, and is null when its key is absent', () => {
        setAppearance({ terminal: { font_px: 13 } });
        expect(terminalFontPx()).toBe(13);
        setAppearance({ terminal: { font_px: 99 } });
        expect(terminalFontPx()).toBe(40);
        setAppearance({ terminal: { font_px: 1 } });
        expect(terminalFontPx()).toBe(6);
        setAppearance({ terminal: { font_px: 'large' } });
        expect(terminalFontPx()).toBeNull();
        setAppearance({ terminal: {} });
        expect(terminalFontPx()).toBeNull();
    });
});

describe('the derived chrome tokens', () => {
    it('are given on :root the values the default theme derives, for the first paint', () => {
        // revert: src/lib/themes/tokens.css:22 => --accent-bg: #000000;
        const root = parseBlocks(TOKENS)[':root'];
        const derived = apply('light').set;
        for (const name of ['--scroll-thumb', '--scroll-track', '--accent-bg']) {
            expect(root[name], name).toBe(derived[name]);
        }
    });

    it('gives every theme a thumb and a track of its own, the track the panel', () => {
        for (const entry of themes()) {
            const set = apply(entry.name).set;
            expect(set['--scroll-thumb'], entry.name).toMatch(/^#[0-9a-f]{6}$/);
            expect(set['--scroll-track'], entry.name).toMatch(/^#[0-9a-f]{3,6}$/i);
            expect(set['--scroll-thumb'], entry.name).not.toBe(set['--scroll-track']);
        }
    });

    it('draws a dark track on a dark theme and a light one on the light theme', () => {
        const dark = apply('dark').set['--scroll-track'];
        const light = apply('light').set['--scroll-track'];
        const level = (hex: string): number =>
            Number.parseInt(hex.slice(1, 3), 16) +
            Number.parseInt(hex.slice(3, 5), 16) +
            Number.parseInt(hex.slice(5, 7), 16);
        expect(
            level(dark.length === 4 ? dark.replace(/[0-9a-f]/gi, (c) => c + c) : dark)
        ).toBeLessThan(3 * 96);
        expect(
            level(light.length === 4 ? light.replace(/[0-9a-f]/gi, (c) => c + c) : light)
        ).toBeGreaterThan(3 * 160);
    });
});
