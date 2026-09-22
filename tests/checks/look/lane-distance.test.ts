// Focus lane headers that touch, under every theme, at a CIEDE2000 difference of 10 or more.
//
// A lane header fills with `--c-<hue>-lane`, half the hue in the panel (themes/derive.ts), so two
// hues that differ by name can mix to one colour, or to two a reader cannot tell apart, in a theme
// whose palette gives them near values. derive.ts measures contrast as a WCAG ratio, which says
// nothing about two surfaces side by side, so the difference here is CIEDE2000, the standard
// perceptual measure, on CIELAB under sRGB's white; 10 is a difference seen at a glance.
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

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { CLUSTERS, holdingTone, lanes } from '../../../src/lib/state/boards/focus.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import { NAMES, themeTokens } from './themes.ts';

const { config } = loadConfig(engineDir());
setVocab(vocabCatalog(config));

const MINIMUM = 10;

type Lab = [number, number, number];

/** sRGB hex to CIELAB, under the white point sRGB is defined with. */
function lab(hex: string): Lab {
    const linear = [1, 3, 5].map((at) => {
        const value = parseInt(hex.slice(at, at + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [r, g, b] = linear;
    const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
    const f = (t: number): number =>
        t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const DEGREE = Math.PI / 180;

/** The hue angle of a CIELAB point in degrees, 0 to 360, and 0 for a neutral. */
function hueAngle(a: number, b: number): number {
    if (a === 0 && b === 0) return 0;
    const angle = Math.atan2(b, a) / DEGREE;
    return angle < 0 ? angle + 360 : angle;
}

/** CIEDE2000 between two CIELAB colours, the parametric factors at 1 (Sharma, Wu, Dalal 2005). */
function ciede2000([l1, a1, b1]: Lab, [l2, a2, b2]: Lab): number {
    const chromaMean = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
    const g = 0.5 * (1 - Math.sqrt(chromaMean ** 7 / (chromaMean ** 7 + 25 ** 7)));
    const ap1 = (1 + g) * a1;
    const ap2 = (1 + g) * a2;
    const c1 = Math.hypot(ap1, b1);
    const c2 = Math.hypot(ap2, b2);
    const h1 = hueAngle(ap1, b1);
    const h2 = hueAngle(ap2, b2);

    let hueStep = 0;
    if (c1 * c2 !== 0) {
        hueStep = h2 - h1;
        if (hueStep > 180) hueStep -= 360;
        else if (hueStep < -180) hueStep += 360;
    }
    const deltaL = l2 - l1;
    const deltaC = c2 - c1;
    const deltaH = 2 * Math.sqrt(c1 * c2) * Math.sin((hueStep / 2) * DEGREE);

    const lMean = (l1 + l2) / 2;
    const cMean = (c1 + c2) / 2;
    let hMean = h1 + h2;
    if (c1 * c2 !== 0) {
        if (Math.abs(h1 - h2) <= 180) hMean = (h1 + h2) / 2;
        else hMean = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
    }
    const t =
        1 -
        0.17 * Math.cos((hMean - 30) * DEGREE) +
        0.24 * Math.cos(2 * hMean * DEGREE) +
        0.32 * Math.cos((3 * hMean + 6) * DEGREE) -
        0.2 * Math.cos((4 * hMean - 63) * DEGREE);
    const rotation = 30 * Math.exp(-(((hMean - 275) / 25) ** 2));
    const rc = 2 * Math.sqrt(cMean ** 7 / (cMean ** 7 + 25 ** 7));
    const sl = 1 + (0.015 * (lMean - 50) ** 2) / Math.sqrt(20 + (lMean - 50) ** 2);
    const sc = 1 + 0.045 * cMean;
    const sh = 1 + 0.015 * cMean * t;
    const rt = -Math.sin(2 * rotation * DEGREE) * rc;
    const lightness = deltaL / sl;
    const chroma = deltaC / sc;
    const hue = deltaH / sh;
    return Math.sqrt(lightness ** 2 + chroma ** 2 + hue ** 2 + rt * chroma * hue);
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

type Measured = { kind: Kind; pair: string; difference: number };

/** Every touching pair's difference in one theme, the smallest first. */
function measure(name: string): Measured[] {
    const { derived } = themeTokens(name);
    return pairs()
        .map(({ kind, one, two }) => ({
            kind,
            pair: `${one.name} (${one.tone}) / ${two.name} (${two.tone})`,
            difference: ciede2000(
                lab(derived[`--c-${one.tone}-lane`]),
                lab(derived[`--c-${two.tone}-lane`])
            )
        }))
        .sort((a, b) => a.difference - b.difference);
}

describe('lane distance', () => {
    // The published test pairs of Sharma, Wu and Dalal (2005), table 1 rows 1, 7, 9, 17 to 21 and
    // 25, which exercise the hue wrap, the neutral axis and the blue rotation term. Revert: drop
    // the `rt` term from ciede2000 and row 1 comes out at 1.608 against 2.0425.
    it('computes CIEDE2000 as the reference pairs publish it', () => {
        const rows: [Lab, Lab, number][] = [
            [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
            [[50, 0, 0], [50, -1, 2], 2.3669],
            [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
            [[50, 2.5, 0], [73, 25, -18], 27.1492],
            [[50, 2.5, 0], [61, -5, 29], 22.8977],
            [[50, 2.5, 0], [56, -27, -3], 31.903],
            [[50, 2.5, 0], [58, 24, 15], 19.4535],
            [[50, 2.5, 0], [50, 3.1736, 0.5854], 1],
            [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644]
        ];
        for (const [one, two, expected] of rows) {
            expect(ciede2000(one, two)).toBeCloseTo(expected, 4);
            expect(ciede2000(two, one)).toBeCloseTo(expected, 4);
        }
        expect(lab('#ffffff').map((value) => Math.round(value * 100) / 100 + 0)).toEqual([
            100, 0, 0
        ]);
        expect(lab('#ff0000').map((value) => Math.round(value * 100) / 100 + 0)).toEqual([
            53.24, 80.09, 67.2
        ]);
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
