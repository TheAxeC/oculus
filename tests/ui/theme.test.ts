// Putting a theme on the document, over the real stylesheets read from disk: the class string that
// lands on the body, and the derived tokens that land on the root element.
//
// The document is a plain object recording what was set, so this runs in the node environment with
// no DOM. What it does NOT cover: that a browser then paints those tokens. The sheets themselves are
// covered by tests/contrast.test.ts, which measures every pair under every theme.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CRT_CLASS, applyTheme, type Themeable } from '../../src/lib/ui/theme.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { setAppearance, themeClass } from '../../src/lib/state/appearance.ts';

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
});
