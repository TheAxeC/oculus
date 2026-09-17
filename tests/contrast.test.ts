// Every text-on-background pair the tokens declare, under every theme, at 4.5:1 or better.
//
// The pairs are the ones a component can actually produce: a `-txt` colour on the page, the panel
// the card and the chip; a hue's `-txt` on its own tint; a hue's `-lane-txt` on its `-lane`, the
// surface a Focus lane header is drawn on; `--accent-bg-txt` on the pressed-toggle
// surface `--accent-bg`; and the on-chip ink on its filled chip. A pair below
// the threshold is printed with its ratio and fails. It is never fixed by loosening the threshold or
// by editing a colour here: a colour is an authored value in tokens.css or themes.css, and a failure
// is a finding about that value or about derive.ts, not something this file repairs.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SCROLL_THUMB_RATIO, deriveTokens, ratio } from '../src/lib/themes/derive.ts';
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

/** The four surfaces any text can land on. */
const SURFACES = ['--bg', '--panel', '--card', '--chip'];

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
        const lane = fg.slice(0, -'-txt'.length);
        if (fg.startsWith('--c-') && lane.endsWith('-lane') && all[lane]) measure(fg, lane);
    }
    // The pressed-toggle surface's own text on that surface, the accent mixed into the page.
    if (all['--accent-bg-txt'] && all['--accent-bg']) measure('--accent-bg-txt', '--accent-bg');
    for (const fg of Object.keys(derived)) {
        if (!fg.startsWith('--on-c-')) continue;
        const on = `--${fg.slice('--on-'.length)}`;
        if (all[on]) measure(fg, on);
    }
    return found;
}

const measured = new Map(NAMES.map((name) => [name, pairs(name)]));

describe('contrast', () => {
    it('offers seventeen themes', () => {
        expect(NAMES.length).toBe(17);
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

    it(`keeps the scrollbar thumb at ${SCROLL_THUMB_RATIO}:1 on its track in every theme`, () => {
        const failures = NAMES.flatMap((name) => {
            const derived = deriveTokens(resolveTheme(blocks, themeClass(name)));
            const found = ratio(derived['--scroll-thumb'], derived['--scroll-track']);
            return found < SCROLL_THUMB_RATIO ? [`${name}: ${found.toFixed(2)}:1`] : [];
        });
        expect(failures).toEqual([]);
    });

    it('measured every pair of every theme', () => {
        const total = [...measured.values()].reduce((sum, found) => sum + found.length, 0);
        console.log(`contrast: ${total} pairs over ${NAMES.length} themes`);
        expect(total).toBeGreaterThan(0);
    });

    // Revert: take `readable(text, lane)` out of derive.ts, so `--c-<hue>-lane-txt` is the hue's
    // plain `-txt`, and the lane pairs under the threshold are printed by the theme cases above;
    // stop minting the lane surface and this case finds no lane pair.
    it('measures a lane header pair for every hue of every theme', () => {
        for (const name of NAMES) {
            const found = measured.get(name) ?? [];
            const lanes = found.filter((pair) => pair.bg.endsWith('-lane'));
            const hues = Object.keys(deriveTokens(resolveTheme(blocks, themeClass(name)))).filter(
                (token) => /^--c-.+-lane$/.test(token)
            );
            expect(lanes.length).toBeGreaterThan(0);
            expect(lanes.map((pair) => pair.bg).sort()).toEqual(hues.sort());
            expect(lanes.every((pair) => pair.fg === `${pair.bg}-txt`)).toBe(true);
        }
    });

    // A theme that authors a token ending in `-lane` gets no lane of that token and keeps its own
    // lane surface for the hue; a theme with neither a panel nor a page gets no lane while its hues
    // keep their text colours. Revert: drop the `-lane` skip in derive.ts, or mint a lane with no
    // panel.
    it('mints a lane only from a hue and only over a panel', () => {
        const authored = deriveTokens({
            '--bg': '#ffffff',
            '--panel': '#ffffff',
            '--c-red': '#dc2626',
            '--c-red-lane': '#fee2e2'
        });
        expect(authored['--c-red-lane']).not.toBe('#fee2e2');
        expect(authored['--c-red-lane-lane']).toBeUndefined();
        expect(
            ratio(authored['--c-red-lane-txt'], authored['--c-red-lane'])
        ).toBeGreaterThanOrEqual(MINIMUM);
        const bare = deriveTokens({ '--chip': '#ffffff', '--c-red': '#dc2626' });
        expect(bare['--c-red-lane']).toBeUndefined();
        expect(bare['--c-red-lane-txt']).toBeUndefined();
        expect(bare['--c-red-txt']).toBeDefined();
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
