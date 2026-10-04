// Layer 4, test helper. Every theme the picker offers, read out of the two stylesheets and derived
// the way ui/theme.ts derives it in the browser.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveTokens } from '../../../src/lib/themes/derive.ts';
import { parseBlocks, resolveTheme } from '../../../src/lib/themes/parse.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    setAppearance,
    themeClass,
    themes
} from '../../../src/lib/state/shared/words/appearance.ts';

const THEMES_DIR = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'src',
    'lib',
    'themes'
);

/** The two stylesheets' text: the default tokens and the theme blocks. */
export const TOKENS = readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8');
export const THEMES = readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8');

/** Every `:root` and `body.<class>` block of both sheets. */
export const blocks = parseBlocks(`${TOKENS}\n${THEMES}`);

setAppearance(loadConfig(engineDir()).config);

/** The themes the picker offers, by name, in the picker's order. */
export const NAMES = themes().map((entry) => entry.name);

/** One theme's authored tokens and the tokens derive.ts computes from them. */
export function themeTokens(name: string): {
    theme: Record<string, string>;
    derived: Record<string, string>;
} {
    const theme = resolveTheme(blocks, themeClass(name));
    return { theme, derived: deriveTokens(theme) };
}
