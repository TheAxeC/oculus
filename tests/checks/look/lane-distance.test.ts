// Focus lane headers that touch, under every theme, at a CIEDE2000 difference of 10 or more.
//
// A lane header fills with `--c-<hue>-lane`, half the hue in the panel (themes/derive.ts), so two
// hues that differ by name can mix to one colour, or to two a reader cannot tell apart, in a theme
// whose palette gives them near values. derive.ts measures contrast as a WCAG ratio, which says
// nothing about two surfaces side by side, so the difference here is CIEDE2000, the standard
// perceptual measure, on CIELAB under sRGB's white, both from culori; 10 is a difference seen at a
// glance.
//
// The headers are read as the Focus view lays them out with every cluster's <details> open and
// every band column drawn; a collapsed cluster or a column hidden for having no rows is not
// modelled, and brings together headers this file does not hold apart.
// views/boards/focus/lanes/Lanes.svelte draws the lanes of `focus_lanes` cluster by cluster in the
// config's order, three to a row (`.lanes`, a grid of three columns), then the Ideas lane in
// `holding_color` alone across the width (`.lanes.one`); views/boards/focus/Band.svelte then draws
// the Funding, Jobs and Teaching columns of `focus_lane_tones` three to a row. Three kinds of pair
// touch:
//
//   next     each header and the next one drawn, which is also the one-column layout under 900px;
//   stacked  a header and the one directly below it in the same column of the three-column layout;
//   ideas    the full-width Ideas lane and every header of the row above and the row below it.
//
// A pair that is two kinds at once is measured once, under the first. A pair below the threshold is
// printed with its theme, its kind, its headers, their hues and its difference, and fails. It is
// repaired by choosing another colour in config/catalogs/vocab.yml, never by lowering the threshold
// here.

import { converter, differenceCiede2000 } from 'culori';
import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { CLUSTERS, holdingTone, lanes } from '../../../src/lib/state/boards/focus.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { NAMES, themeTokens } from './themes.ts';

const { config } = loadConfig(engineDir());
setVocab(vocabCatalog(config));

const MINIMUM = 10;

/** A colour in CIELAB under sRGB's white, as culori takes one: lightness and the two axes. */
type Lab = { mode: 'lab65'; l: number; a: number; b: number };

/** An sRGB hex colour in CIELAB under the white point sRGB is defined with. */
const lab = converter('lab65');

/** CIEDE2000 between two colours, the parametric factors at 1 (Sharma, Wu, Dalal 2005). */
const ciede2000 = differenceCiede2000();

/**
 * The light theme's touching pairs and each one's CIEDE2000 difference on CIELAB under sRGB's
 * white, to four decimals, in the order pairs() finds them: reference values computed apart from
 * culori, so the case that reads them compares the library with a second computation.
 */
const LIGHT: [string, number][] = [
    ['run/push', 37.4689],
    ['push/revise', 36.8379],
    ['revise/review', 23.5726],
    ['review/blocked', 26.5057],
    ['blocked/backburner', 26.895],
    ['backburner/scope', 16.0173],
    ['scope/derisk', 35.3977],
    ['derisk/build', 32.3084],
    ['build/holding', 41.1274],
    ['holding/funding', 26.8271],
    ['funding/jobs', 21.0319],
    ['jobs/teaching', 19.5039],
    ['run/review', 25.7447],
    ['push/blocked', 34.1812],
    ['revise/backburner', 22.8082],
    ['review/scope', 13.0639],
    ['blocked/derisk', 30.1076],
    ['backburner/build', 19.3963],
    ['holding/scope', 36.7857],
    ['holding/derisk', 32.748],
    ['holding/jobs', 16.9652],
    ['holding/teaching', 41.1274]
];

/** A CIELAB colour written as the reference table writes one. */
function point(l: number, a: number, b: number): Lab {
    return { mode: 'lab65', l, a, b };
}

/** One header the Focus view draws: the words a failure names it by and its hue. */
type Head = { name: string; tone: string };

/** A row of the three-column layout, and whether its one header spans the whole width. */
type Row = { heads: Head[]; full: boolean };

/** How many headers a row of `.lanes` holds in Lanes.svelte and Band.svelte. */
const COLUMNS = 3;

/** The rows the wide layout draws: each cluster three to a row, the Ideas lane, the band. */
function rows(): Row[] {
    const board = lanes(config);
    const columns = (config.focus_lane_tones ?? {}) as Record<string, string>;
    const out: Row[] = [];
    for (const cluster of CLUSTERS) {
        const held = board
            .filter((lane) => lane.cluster === cluster)
            .map((lane) => ({ name: lane.key, tone: lane.tone }));
        for (let at = 0; at < held.length; at += COLUMNS) {
            out.push({ heads: held.slice(at, at + COLUMNS), full: false });
        }
    }
    out.push({ heads: [{ name: 'holding', tone: holdingTone(config) }], full: true });
    out.push({
        heads: ['funding', 'jobs', 'teaching'].map((name) => ({ name, tone: columns[name] })),
        full: false
    });
    return out;
}

/** The kinds of pair that touch, in the words a failure prints. */
const KINDS = {
    next: 'next in drawing order',
    stacked: 'stacked in one column',
    ideas: 'beside the full-width Ideas lane'
};

type Kind = keyof typeof KINDS;

type Pair = { kind: Kind; one: Head; two: Head };

/** Every pair of headers that touch, each once, under the first kind that names it. */
function pairs(): Pair[] {
    const laid = rows();
    const drawn = laid.flatMap((row) => row.heads);
    const found: Pair[] = [];
    const add = (kind: Kind, one: Head, two: Head): void => {
        const seen = found.some(
            (pair) =>
                (pair.one === one && pair.two === two) || (pair.one === two && pair.two === one)
        );
        if (!seen) found.push({ kind, one, two });
    };
    drawn.slice(1).forEach((head, at) => add('next', drawn[at], head));
    laid.slice(1).forEach((below, at) => {
        const above = laid[at];
        if (above.full || below.full) {
            const [wide] = above.full ? above.heads : below.heads;
            for (const other of above.full ? below.heads : above.heads) add('ideas', wide, other);
            return;
        }
        below.heads.forEach((head, column) => {
            const over = above.heads.at(column);
            if (over !== undefined) add('stacked', over, head);
        });
    });
    return found;
}

/** A pair written the way a test reads it: `one/two`. */
function named(pair: Pair): string {
    return `${pair.one.name}/${pair.two.name}`;
}

type Measured = { kind: Kind; pair: string; names: string; difference: number };

/** Every touching pair's difference in one theme, the smallest first. */
function measure(name: string): Measured[] {
    const { derived } = themeTokens(name);
    return pairs()
        .map(({ kind, one, two }) => ({
            kind,
            pair: `${one.name} (${one.tone}) / ${two.name} (${two.tone})`,
            names: named({ kind, one, two }),
            difference: ciede2000(derived[`--c-${one.tone}-lane`], derived[`--c-${two.tone}-lane`])
        }))
        .sort((a, b) => a.difference - b.difference);
}

describe('lane distance', () => {
    // The published test pairs of Sharma, Wu and Dalal (2005), table 1 rows 1, 7, 9, 17 to 21 and
    // 25, which exercise the hue wrap, the neutral axis and the blue rotation term, read through
    // culori's measure; the table gives four decimals, so a pair agrees to half the last of them.
    it('measures CIEDE2000 as the reference pairs publish it', () => {
        const rows: [Lab, Lab, number][] = [
            [point(50, 2.6772, -79.7751), point(50, 0, -82.7485), 2.0425],
            [point(50, 0, 0), point(50, -1, 2), 2.3669],
            [point(50, 2.49, -0.001), point(50, -2.49, 0.0009), 7.1792],
            [point(50, 2.5, 0), point(73, 25, -18), 27.1492],
            [point(50, 2.5, 0), point(61, -5, 29), 22.8977],
            [point(50, 2.5, 0), point(56, -27, -3), 31.903],
            [point(50, 2.5, 0), point(58, 24, 15), 19.4535],
            [point(50, 2.5, 0), point(50, 3.1736, 0.5854), 1],
            [point(60.2574, -34.0099, 36.2677), point(60.4626, -34.1751, 39.4387), 1.2644]
        ];
        for (const [one, two, expected] of rows) {
            expect(ciede2000(one, two)).toBeCloseTo(expected, 4);
            expect(ciede2000(two, one)).toBeCloseTo(expected, 4);
        }
        const rounded = (hex: string): number[] => {
            const { l, a, b } = lab(hex) ?? point(Number.NaN, Number.NaN, Number.NaN);
            return [l, a, b].map((value) => Math.round(value * 100) / 100 + 0);
        };
        expect(rounded('#ffffff')).toEqual([100, 0, 0]);
        expect(rounded('#ff0000')).toEqual([53.24, 80.09, 67.2]);
    });

    // The light theme's 22 pairs, each within 0.01 of its reference difference in LIGHT: culori's
    // sRGB to CIELAB differs from the reference computation in the third decimal at most, and no
    // pair moves across the threshold.
    it('measures the light theme within 0.01 of the reference differences', () => {
        const light = measure('light');
        const at = (pair: string): number =>
            light.find((one) => one.names === pair)?.difference ?? Number.NaN;
        expect(light).toHaveLength(LIGHT.length);
        for (const [pair, captured] of LIGHT) {
            expect(Math.abs(at(pair) - captured), pair).toBeLessThanOrEqual(0.01);
        }
    });

    // Revert: draw the Ideas lane in `rows` as a row of three like the others, and the four pairs
    // beside it become stacked pairs and the count of each kind changes.
    it('pairs the headers that touch in the layout the view draws', () => {
        const found = pairs();
        expect(rows().flatMap((row) => row.heads.map((head) => head.name))).toEqual([
            'run',
            'push',
            'revise',
            'review',
            'blocked',
            'backburner',
            'scope',
            'derisk',
            'build',
            'holding',
            'funding',
            'jobs',
            'teaching'
        ]);
        const of = (kind: Kind): string[] =>
            found.filter((pair) => pair.kind === kind).map((pair) => named(pair));
        expect(of('next')).toHaveLength(12);
        expect(of('stacked')).toEqual([
            'run/review',
            'push/blocked',
            'revise/backburner',
            'review/scope',
            'blocked/derisk',
            'backburner/build'
        ]);
        expect(of('ideas')).toEqual([
            'holding/scope',
            'holding/derisk',
            'holding/jobs',
            'holding/teaching'
        ]);
        expect(found).toHaveLength(22);
        for (const pair of found) expect(pair.one.tone).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    // Revert: give Review the hue of Run, the lane stacked above it, and every theme whose two
    // surfaces are then one colour prints "stacked in one column run (...) / review (...) = 0.00".
    for (const name of NAMES) {
        it(`keeps every touching pair of lane headers ${MINIMUM} apart in the ${name} theme`, () => {
            const found = measure(name);
            const failures = found
                .filter((one) => one.difference < MINIMUM)
                .map(
                    (one) =>
                        `${name}: ${KINDS[one.kind]} ${one.pair} = ${one.difference.toFixed(2)}`
                );
            // The closest pair is printed whether it passes or not, since how much room is left is
            // what the next colour change is judged against.
            const [closest] = found;
            console.log(
                `lane distance: ${name} ${KINDS[closest.kind]} ${closest.pair} = ${closest.difference.toFixed(2)}`
            );
            expect(found).toHaveLength(22);
            expect(failures).toEqual([]);
        });
    }
});
