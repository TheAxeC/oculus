// Every text-on-background pair the tokens declare, under every theme, at 4.5:1 or better.
//
// The pairs are the ones a component can actually produce: a `-txt` colour on the page, the panel
// and the chip; a hue's `-txt` on its own tint; and the on-chip ink on its filled chip. A pair below
// the threshold is printed with its ratio and fails. It is never fixed by loosening the threshold or
// by editing a colour here: a colour is an authored value in tokens.css or themes.css, and a failure
// is a finding about that value or about derive.ts, not something this file repairs.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deriveTokens, ratio } from '../src/lib/themes/derive.ts';
import { parseBlocks, resolveTheme } from '../src/lib/themes/parse.ts';
import { engineDir, loadConfig } from '../src/lib/data/sources/config.ts';
import { setAppearance, themeClass, themes } from '../src/lib/state/appearance.ts';

const THEMES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'themes');
const TOKENS = readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8');
const THEMES = readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8');

const blocks = parseBlocks(`${TOKENS}\n${THEMES}`);
setAppearance(loadConfig(engineDir()).config);

/** The themes the picker offers, each with the class string it puts on the body. */
const NAMES = themes().map((entry) => entry.name);
const MINIMUM = 4.5;

/** The three surfaces any text can land on. */
const SURFACES = ['--bg', '--panel', '--chip'];

type Pair = { fg: string; bg: string; ratio: number };

/** Every pair one theme declares: the token names, and the ratio between their two colours. */
function pairs(name: string): Pair[] {
    const theme = resolveTheme(blocks, themeClass(name));
    const derived = deriveTokens(theme);
    const all: Record<string, string> = { ...theme, ...derived };
    const found: Pair[] = [];

    const measure = (fg: string, bg: string): void => {
        found.push({ fg, bg, ratio: ratio(all[fg], all[bg]) });
    };

    for (const fg of Object.keys(derived)) {
        if (!fg.endsWith('-txt')) continue;
        for (const surface of SURFACES) if (all[surface]) measure(fg, surface);
        const own = `${fg.slice(0, -'-txt'.length)}-bg`;
        if (fg.startsWith('--c-') && all[own]) measure(fg, own);
    }
    for (const fg of Object.keys(derived)) {
        if (!fg.startsWith('--on-c-')) continue;
        const on = `--${fg.slice('--on-'.length)}`;
        if (all[on]) measure(fg, on);
    }
    return found;
}

const measured = new Map(NAMES.map((name) => [name, pairs(name)]));

describe('contrast', () => {
    it('offers fifteen themes', () => {
        expect(NAMES.length).toBe(15);
    });

    for (const name of NAMES) {
        it(`keeps every pair at ${MINIMUM}:1 in the ${name} theme`, () => {
            const found = measured.get(name) ?? [];
            const failures = found
                .filter((pair) => pair.ratio < MINIMUM)
                .map((pair) => `${name}: ${pair.fg} on ${pair.bg} = ${pair.ratio.toFixed(2)}:1`);
            expect(found.length).toBeGreaterThan(0);
            expect(failures).toEqual([]);
        });
    }

    it('measured every pair of every theme', () => {
        const total = [...measured.values()].reduce((sum, found) => sum + found.length, 0);
        console.log(`contrast: ${total} pairs over ${NAMES.length} themes`);
        expect(total).toBeGreaterThan(0);
    });

    it('references only tokens :root defines', () => {
        const root = blocks[':root'];
        const referenced = new Set<string>();
        for (const sheet of [TOKENS, THEMES]) {
            for (const match of sheet.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) referenced.add(match[1]);
        }
        expect([...referenced].filter((token) => !(token in root))).toEqual([]);
    });
});
