// Layer 4, test helper. Every theme the picker offers, read out of the stylesheets (tokens.css,
// themes.css, the rice palettes of rice/ and the generated vscode.css) and derived the way
// ui/theme/theme.ts derives it in the browser. A picker row with a class word that no block of the
// sheets holds is refused by name, so no row is measured as another theme.

import { readFileSync, readdirSync } from 'node:fs';
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

/**
 * The stylesheets' text: the default tokens, the hand-written theme blocks of themes.css and of the
 * rice palettes, in the order of their file names as ui/theme/theme.ts reads them, and the VS Code
 * blocks.
 */
export const TOKENS = readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8');
export const THEMES = [
    readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8'),
    ...readdirSync(join(THEMES_DIR, 'rice'))
        .filter((name) => name.endsWith('.css'))
        .sort()
        .map((name) => readFileSync(join(THEMES_DIR, 'rice', name), 'utf8'))
].join('\n');
export const VSCODE = readFileSync(join(THEMES_DIR, 'vscode.css'), 'utf8');

/** Every `:root` and `body.<class>` block of the sheets. */
export const blocks = parseBlocks(`${TOKENS}\n${THEMES}\n${VSCODE}`);

/**
 * The custom properties tokens.css declares on a bare `body`, where a token built from a theme's
 * colours is declared so that the theme's class is taken. parseBlocks reads no such block, since it
 * is no theme; a theme block sets its own value over it.
 */
export const BODY_TOKENS: Record<string, string> = Object.fromEntries(
    [...TOKENS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|\n)body \{([^}]*)\}/g)].flatMap(
        (block) =>
            [...block[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(
                (one): [string, string] => [one[1], one[2].trim()]
            )
    )
);

/**
 * A declared value with its `var()` references resolved against a theme's tokens: `var(--a, b)`
 * is the theme's `--a`, else `b` resolved in turn. Undefined when nothing resolves.
 */
export function resolveValue(
    value: string | undefined,
    tokens: Record<string, string>
): string | undefined {
    if (value === undefined) return undefined;
    const reference = /^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*(.+))?\)$/.exec(value.trim());
    if (reference === null) return value;
    return tokens[reference[1]] ?? resolveValue(reference[2], tokens);
}

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
