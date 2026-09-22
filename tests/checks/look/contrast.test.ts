// Every text-on-background pair the tokens declare, under every theme, at 4.5:1 or better.
//
// The pairs are the ones a component can actually produce: a `-txt` colour on the page, the panel
// the card and the chip; a hue's `-txt` on its own tint; a hue's `-lane-txt` on its `-lane` and on
// nothing else, since a Focus lane or column header is where it is painted. That every word of
// those headers sits on its own lane surface is proved in the page by
// tests/browser/boards/focus-look.spec.ts; the src/ reading case below only reports a lane text
// token referenced outside the one shape the header uses; `--accent-bg-txt` on the pressed-toggle
// surface `--accent-bg`, and `--on-accent-bg` on it for a selected tree row; and the on-chip ink on
// its filled chip. A pair below the threshold is printed with its ratio and fails. It is never
// fixed by loosening the threshold or by editing a colour here: a colour is an authored value in
// tokens.css or themes.css, and a failure is a finding about that value or about derive.ts, not
// something this file repairs.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SCROLL_THUMB_RATIO, deriveTokens, ratio } from '../../../src/lib/themes/derive.ts';
import { NAMES, THEMES, TOKENS, blocks, themeTokens } from './themes.ts';

const MINIMUM = 4.5;

/** The source tree whose painting of lane text the last case reads. */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

/** A lane header's text token, which is measured on its own lane surface only. */
const LANE_TEXT = /^--c-.+-lane-txt$/;

/** The four surfaces any text can land on. */
const SURFACES = ['--bg', '--panel', '--card', '--chip'];

type Pair = { fg: string; bg: string; ratio: number };

/** Every pair one theme declares: the token names, and the ratio between their two colours. */
function pairs(name: string): Pair[] {
    const { theme, derived } = themeTokens(name);
    const all: Record<string, string> = { ...theme, ...derived };
    const found: Pair[] = [];

    const measure = (fg: string, bg: string): void => {
        found.push({ fg, bg, ratio: ratio(all[fg], all[bg]) });
    };

    for (const fg of Object.keys(derived)) {
        if (!fg.endsWith('-txt')) continue;
        if (!LANE_TEXT.test(fg))
            for (const surface of SURFACES) if (all[surface]) measure(fg, surface);
        const own = `${fg.slice(0, -'-txt'.length)}-bg`;
        if (fg.startsWith('--c-') && all[own]) measure(fg, own);
        const lane = fg.slice(0, -'-txt'.length);
        if (fg.startsWith('--c-') && lane.endsWith('-lane') && all[lane]) measure(fg, lane);
    }
    // The pressed-toggle surface's own text on that surface, the accent mixed into the page.
    if (all['--accent-bg-txt'] && all['--accent-bg']) measure('--accent-bg-txt', '--accent-bg');
    // A selected tree row draws its whole line in `--on-accent-bg` on the tint.
    if (all['--on-accent-bg'] && all['--accent-bg']) measure('--on-accent-bg', '--accent-bg');
    for (const fg of Object.keys(derived)) {
        if (!fg.startsWith('--on-c-')) continue;
        const on = `--${fg.slice('--on-'.length)}`;
        if (all[on]) measure(fg, on);
    }
    return found;
}

const measured = new Map(NAMES.map((name) => [name, pairs(name)]));

/** Every file under a directory, by its path from that directory, with its text. */
function sources(dir: string): [string, string][] {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => join(entry.parentPath, entry.name))
        .map((path) => [relative(dir, path), readFileSync(path, 'utf8')]);
}

function escaped(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The text between the braces around an offset: the CSS block a declaration sits in. */
function blockAt(text: string, at: number): string {
    const open = text.lastIndexOf('{', at);
    const close = text.indexOf('}', at);
    return open < 0 || close < 0 ? '' : text.slice(open, close);
}

/** Whether a block or a line fills its background with the given variable. */
function fills(text: string, variable: string): boolean {
    return new RegExp(`background(?:-color)?\\s*:\\s*var\\(\\s*${escaped(variable)}\\s*\\)`).test(
        text
    );
}

/**
 * Every place in one file that paints a lane text token over anything but that hue's lane surface,
 * as `file:line`. A lane text token reaches paint one of two ways, and each is followed:
 *
 *   `--p: var(--c-X-lane-txt)`  a custom property, which the same line must pair with
 *                               `--q: var(--c-X-lane)`, and every block that reads `var(--p)` must
 *                               fill its background with `var(--q)`;
 *   `color: var(--c-X-lane-txt)` a property, whose block or line must fill its background with
 *                               `var(--c-X-lane)`.
 *
 * Any other reference to a lane text token is reported, since nothing says what it lands on.
 */
function offLane(file: string, text: string): { places: number; findings: string[] } {
    const findings: string[] = [];
    let places = 0;
    const lineOf = (at: number): number => text.slice(0, at).split('\n').length;
    const declarations = [...text.matchAll(/([a-z-]+)\s*:\s*var\(\s*--c-([^)]*?)-lane-txt\s*\)/g)];
    const declared = new Set(declarations.map((found) => found.index + found[0].indexOf('var(')));
    for (const read of text.matchAll(/var\(\s*--c-[^)]*?-lane-txt\s*\)/g)) {
        places += 1;
        if (!declared.has(read.index)) {
            findings.push(
                `${file}:${lineOf(read.index)} reads a lane text token outside a declaration`
            );
        }
    }
    for (const found of declarations) {
        const at = found.index;
        const line = text.split('\n')[lineOf(at) - 1];
        const [, property, hue] = found;
        const where = `${file}:${lineOf(at)}`;
        const lane = `--c-${hue}-lane`;
        if (!property.startsWith('--')) {
            if (!fills(blockAt(text, at), lane) && !fills(line, lane)) {
                findings.push(`${where} paints ${hue} lane text off its lane`);
            }
            continue;
        }
        const pairing = new RegExp(`(--[a-z0-9-]+)\\s*:\\s*var\\(\\s*${escaped(lane)}\\s*\\)`).exec(
            line
        );
        if (pairing === null) {
            findings.push(`${where} sets ${property} to ${hue} lane text with no lane beside it`);
            continue;
        }
        for (const use of text.matchAll(new RegExp(`var\\(\\s*${escaped(property)}\\s*\\)`, 'g'))) {
            if (!fills(blockAt(text, use.index), pairing[1])) {
                findings.push(`${file}:${lineOf(use.index)} paints ${property} off ${pairing[1]}`);
            }
        }
    }
    return { places, findings };
}

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
            const { derived } = themeTokens(name);
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
            const hues = Object.keys(themeTokens(name).derived).filter((token) =>
                /^--c-.+-lane$/.test(token)
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

    // What this reading covers, and all it covers: in every file under src/, each
    // `var(--c-X-lane-txt)` must sit in a declaration; a property set to it must share its line
    // with a property set to `var(--c-X-lane)`, and each CSS block reading the first must fill its
    // background with the second; a `color:` set to it must share its block or line with that
    // background. It reads the text of each file on its own, so it finds a lane text token taken
    // into a view the Focus browser case never opens. It does not see a later rule that overrides
    // the header's background, a descendant with a background of its own, the wallpaper rules or a
    // value built in code; the browser case in tests/browser/boards/focus-look.spec.ts covers the
    // Focus headers for those. Revert: paint `--c-green-lane-txt` as `color` in any rule of a
    // component whose background is `--panel`, and that line is printed.
    it('finds lane text painted only over its own lane surface under src/', () => {
        const all = sources(SRC).map(([file, text]) => offLane(file, text));
        expect(all.reduce((sum, one) => sum + one.places, 0)).toBeGreaterThan(0);
        expect(all.flatMap((one) => one.findings)).toEqual([]);
    });

    // The reading itself, over text no component holds: a lane text on a panel, a property holding
    // lane text beside no lane, one read in a block that fills with something else, a lane text read
    // outside any declaration, and the two shapes that are allowed.
    //
    // Revert: in offLane above, drop the `--` branch (a property set to a lane text is then read as
    // a paint), drop the `fills(line, lane)` arm (a token pair written on one line is then a
    // finding), or drop the loop over the reads outside a declaration.
    it('reports every way of painting lane text off its lane', () => {
        const panel = '.x {\n    background: var(--panel);\n    color: var(--c-green-lane-txt);\n}';
        expect(offLane('a.css', panel).findings).toEqual([
            'a.css:3 paints green lane text off its lane'
        ]);
        const lone = 'const style = `--t: var(--c-red-lane-txt)`;';
        expect(offLane('b.svelte', lone).findings).toEqual([
            'b.svelte:1 sets --t to red lane text with no lane beside it'
        ]);
        const elsewhere =
            'const s = `--l: var(--c-red-lane); --t: var(--c-red-lane-txt)`;\n.y {\n    background: var(--panel);\n    color: var(--t);\n}';
        expect(offLane('c.svelte', elsewhere).findings).toEqual(['c.svelte:4 paints --t off --l']);
        const bare = "const token = 'var(--c-red-lane-txt)';";
        expect(offLane('e.ts', bare).findings).toEqual([
            'e.ts:1 reads a lane text token outside a declaration'
        ]);
        const allowed =
            'const s = `--l: var(--c-red-lane); --t: var(--c-red-lane-txt)`;\n.y {\n    background: var(--l);\n    color: var(--t);\n}\n.z {\n    background: var(--c-blue-lane);\n    color: var(--c-blue-lane-txt);\n}';
        expect(offLane('d.svelte', allowed)).toEqual({ places: 2, findings: [] });
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
