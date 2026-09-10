// Putting a theme on the document, over the real stylesheets read from disk: the class string that
// lands on the body, the derived tokens that land on the root element, and the wallpaper's three
// custom properties beside them.
//
// The document is a plain object recording what was set, so this runs in the node environment with
// no DOM. What it does NOT cover: that a browser then paints those tokens. The sheets themselves are
// covered by tests/contrast.test.ts, which measures every pair under every theme.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { setAppearance, themeClass, wallpaperSettings } from '../../src/lib/state/appearance.ts';

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
setAppearance(loadConfig(engineDir()).config);

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
    /** The three numbers a wallpaper is drawn through, as state/appearance.ts resolves them. */
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
