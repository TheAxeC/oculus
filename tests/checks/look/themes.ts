// Layer 4, test helper. Every theme the picker offers, read out of the three stylesheets
// (tokens.css, themes.css and the generated vscode.css) and derived the way ui/theme/theme.ts
// derives it in the browser. A picker row with a class word that no block of the sheets holds is
// refused by name, so no row is measured as another theme.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveTokens } from '../../../src/lib/themes/derive.ts';
import { parseBlocks, resolveTheme } from '../../../src/lib/themes/parse.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { NO_OFFERS } from '../../../src/lib/data/helpers/files/apps/choices.ts';
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

/** The stylesheets' text: the default tokens, the ported theme blocks and the VS Code blocks. */
export const TOKENS = readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8');
export const THEMES = readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8');
export const VSCODE = readFileSync(join(THEMES_DIR, 'vscode.css'), 'utf8');

/** Every `:root` and `body.<class>` block of the sheets. */
export const blocks = parseBlocks(`${TOKENS}\n${THEMES}\n${VSCODE}`);

setAppearance(loadConfig(engineDir()).config);

/** The themes the picker offers, by name, in the picker's order. */
export const NAMES = themes(NO_OFFERS).map((entry) => entry.name);

/** One theme's authored tokens and the tokens derive.ts computes from them. */
export function themeTokens(name: string): {
    theme: Record<string, string>;
    derived: Record<string, string>;
} {
    const classes = themeClass(name, NO_OFFERS);
    for (const word of classes.split(/\s+/).filter((one) => one !== '')) {
        if (!(word in blocks)) {
            throw new Error(
                `appearance.yml theme ${name}: class ${word} has no block in the sheets`
            );
        }
    }
    const theme = resolveTheme(blocks, classes);
    return { theme, derived: deriveTokens(theme) };
}
