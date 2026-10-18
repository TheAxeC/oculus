// Layer 4, tree check. Every text-on-background pair the tokens declare, under every theme, at
// 4.5:1 or better.
//
// The pairs are the ones a component can actually produce: a `-txt` colour on the page, the panel
// the card and the chip, whether derive.ts mints it or a theme authors it, and a tab label's
// `--tab-*-txt` on the strip and the shown tab only; `--ink-txt` and the six `--c-code-*-txt` on
// the three Source Control tints the diff and merge editors draw code over; a hue's `-txt` on its
// own tint; a hue's `-lane-txt` on its `-lane` and on nothing else, since a Focus lane or column
// header is where it is painted. That every word of those headers sits on its own lane surface in
// the page needs a DOM and is not run here; the src/ reading case below only reports a lane text
// token referenced outside the one shape the header uses. Then the window's title bar strip's
// words on its surface and on nothing else, read from the `.titlebar` rule of
// shell/titlebar/TitleBar.svelte and resolved in the theme: the block's own `--titlebar-txt` and
// `--titlebar-bg`, else tokens.css's defaults on `body`, else the fallbacks the rule names;
// `--on-accent-bg` on the selected tree row's surface `--accent-bg`; the on-chip ink on its filled
// chip; and the ink of the orange debugging status bar on the fill its hovered and open items
// take. A pair below the threshold is printed with its ratio and fails. It is never fixed by
// loosening the threshold or by editing a colour here: a colour is an authored value in tokens.css,
// themes.css or rice/, or a generated one in vscode.css. A failure of an authored value is a
// finding about that value or about derive.ts, and a failure of a generated value is a finding
// about the mapping in utils/migrations/convert-vscode-themes.ts, not something this file repairs.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SCROLL_THUMB_RATIO, deriveTokens, ratio } from '../../../src/lib/themes/derive.ts';
import {
    BODY_TOKENS,
    NAMES,
    THEMES,
    TOKENS,
    VSCODE,
    blocks,
    resolveValue,
    themeTokens
} from './themes.ts';
import { treeFiles } from '../walk.ts';

const MINIMUM = 4.5;

/** The source tree whose painting of lane text the last case reads. */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

/** A lane header's text token, which is measured on its own lane surface only. */
const LANE_TEXT = /^--c-.+-lane-txt$/;

/** The four surfaces any text can land on. */
const SURFACES = ['--bg', '--panel', '--card', '--chip'];

/** The ink and the code hues, which the diff and merge editors also draw over the three tints. */
const CODE_TEXT = /^(?:--ink|--c-code-[a-z]+)-txt$/;
const TINTS = ['--c-scm-added-bg', '--c-scm-deleted-bg', '--c-scm-conflict-bg'];

/** A tab label's text token, which lands on the strip (`--bg`) or on the shown tab (`--panel`). */
const TAB_TEXT = /^--tab-.+-txt$/;
const TAB_SURFACES = ['--bg', '--panel'];

/** The title bar strip's words, which land on the strip's own surface and on nothing else. */
const STRIP_TEXT = '--titlebar-txt';
const STRIP_SURFACE = '--titlebar-bg';

type Pair = { fg: string; bg: string; ratio: number };

/** The `.titlebar` rule of the strip's component, whose colours are measured as it paints them. */
const STRIP_RULE = /\n\s*\.titlebar \{([^}]*)\}/.exec(
    readFileSync(join(SRC, 'lib', 'shell', 'titlebar', 'TitleBar.svelte'), 'utf8')
)?.[1];

/** The value the strip's rule gives a property, or undefined. */
function stripDeclaration(property: string): string | undefined {
    return new RegExp(`(?:^|\\n)\\s*${property}\\s*:\\s*([^;]+);`).exec(STRIP_RULE ?? '')?.[1];
}

/**
 * The strip's surface and words in one theme, as the strip's rule resolves them: the theme block's
 * own title bar tokens, else tokens.css's defaults on `body` resolved in the theme, else the
 * fallbacks the rule names.
 */
function stripOf(
    theme: Record<string, string>,
    all: Record<string, string>
): Record<string, string> {
    const scope = { ...all };
    for (const [token, value] of Object.entries(BODY_TOKENS)) {
        const resolved = resolveValue(value, all);
        if (!(token in theme) && resolved !== undefined) scope[token] = resolved;
    }
    const found: Record<string, string> = {};
    const words = resolveValue(stripDeclaration('color'), scope);
    const surface = resolveValue(stripDeclaration('background'), scope);
    if (words !== undefined) found[STRIP_TEXT] = words;
    if (surface !== undefined) found[STRIP_SURFACE] = surface;
    return found;
}

/** Every pair one theme declares: the token names, and the ratio between their two colours. */
function pairs(name: string): Pair[] {
    const { theme, derived } = themeTokens(name);
    const all: Record<string, string> = { ...theme, ...derived };
    Object.assign(all, stripOf(theme, all));
    const found: Pair[] = [];

    const measure = (fg: string, bg: string): void => {
        found.push({ fg, bg, ratio: ratio(all[fg], all[bg]) });
    };

    // A `-txt` token the theme authors by hand is measured as one derive.ts mints.
    for (const fg of Object.keys(all)) {
        if (!fg.endsWith('-txt')) continue;
        const grounds =
            fg === STRIP_TEXT ? [STRIP_SURFACE] : TAB_TEXT.test(fg) ? TAB_SURFACES : SURFACES;
        if (!LANE_TEXT.test(fg))
            for (const surface of grounds) if (all[surface]) measure(fg, surface);
        if (CODE_TEXT.test(fg)) for (const tint of TINTS) if (all[tint]) measure(fg, tint);
        const own = `${fg.slice(0, -'-txt'.length)}-bg`;
        if (fg.startsWith('--c-') && all[own]) measure(fg, own);
        const lane = fg.slice(0, -'-txt'.length);
        if (fg.startsWith('--c-') && lane.endsWith('-lane') && all[lane]) measure(fg, lane);
    }
    // A selected tree row draws its whole line in `--on-accent-bg` on the tint.
    if (all['--on-accent-bg'] && all['--accent-bg']) measure('--on-accent-bg', '--accent-bg');
    for (const fg of Object.keys(derived)) {
        if (!fg.startsWith('--on-c-')) continue;
        const on = `--${fg.slice('--on-'.length)}`;
        if (all[on]) measure(fg, on);
    }
    // The status bar a debug session paints orange draws its hovered and open items on this fill.
    measure('--on-c-orange', '--c-orange-hover');
    return found;
}

const measured = new Map(NAMES.map((name) => [name, pairs(name)]));

/** Every file under a directory, by its path from that directory, with its text. */
function sources(dir: string): [string, string][] {
    return treeFiles(dir).map((rel) => [rel, readFileSync(join(dir, rel), 'utf8')]);
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
    it.each(NAMES)(`keeps every pair at ${MINIMUM}:1 in the %s theme`, (name) => {
        const found = measured.get(name) ?? [];
        const failures = found
            .filter((pair) => pair.ratio < MINIMUM)
            .map((pair) => `${name}: ${pair.fg} on ${pair.bg} = ${pair.ratio.toFixed(2)}:1`);
        expect(found.length).toBeGreaterThan(0);
        expect(failures).toEqual([]);
    });

    it(`keeps the scrollbar thumb at ${SCROLL_THUMB_RATIO}:1 on its track in every theme`, () => {
        const failures = NAMES.flatMap((name) => {
            const { derived } = themeTokens(name);
            const found = ratio(derived['--scroll-thumb'], derived['--scroll-track']);
            return found < SCROLL_THUMB_RATIO ? [`${name}: ${found.toFixed(2)}:1`] : [];
        });
        expect(failures).toEqual([]);
    });

    it("measures the title bar strip's words on the strip in every theme", () => {
        const missing = NAMES.filter(
            (name) =>
                !(measured.get(name) ?? []).some(
                    (pair) => pair.fg === STRIP_TEXT && pair.bg === STRIP_SURFACE
                )
        );
        expect(missing).toEqual([]);
        for (const name of NAMES) {
            const { theme, derived } = themeTokens(name);
            const strip = stripOf(theme, { ...theme, ...derived });
            expect(strip[STRIP_TEXT]).toMatch(/^#[0-9a-f]{3,6}$/i);
            expect(strip[STRIP_SURFACE]).toMatch(/^#[0-9a-f]{3,6}$/i);
        }
    });

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
    // keep their text colours.
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
    // into any view. It does not see a later rule that overrides the header's background, a
    // descendant with a background of its own, the wallpaper rules or a value built in code, and no
    // case here covers the Focus headers for those.
    it('finds lane text painted only over its own lane surface under src/', () => {
        const all = sources(SRC).map(([file, text]) => offLane(file, text));
        expect(all.reduce((sum, one) => sum + one.places, 0)).toBeGreaterThan(0);
        expect(all.flatMap((one) => one.findings)).toEqual([]);
    });

    // The reading itself, over text no component holds: a lane text on a panel, a property holding
    // lane text beside no lane, one read in a block that fills with something else, a lane text
    // read outside any declaration, and the two shapes that are allowed.
    //
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
        for (const sheet of [TOKENS, THEMES, VSCODE]) {
            for (const match of sheet.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) referenced.add(match[1]);
        }
        expect([...referenced].filter((token) => !(token in root))).toEqual([]);
    });
});
