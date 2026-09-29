// Whether the diagrams of docs/diagrams/ can be read: a count stands where it reads as its own
// arrow's, and no two arrows run along each other.
//
// The layer cases render a small source of their own and read the drawing Graphviz gives: a count
// between two folders of one layer lies inside the layer's box with its arrow, and each folder's
// arrow into another layer ends at a box of its own, its count on the folder's row; a count of an
// arrow across several folders stands halfway along it. The measure cases hand arrowsAlong()
// drawings made by hand, and the last cases run it over every drawing the source gives and every
// committed one. The reader cases show that the channel and write readers read code alone: a
// comment is blanked by the parse, a JSDoc at the end of a file and a style block included, and a
// string, a regular expression and the markup of a component are kept. The last case shows that a
// tail port the write diagram gives an arrow stays out of its title.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    LAYER_NAMES,
    arrowsAlong,
    channelsDot,
    codeOf,
    generate,
    layerDot,
    renderSvg,
    writesDot,
    writesDrawn
} from '../../../utils/diagrams/diagrams.mjs';

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The layer rows the synthetic sources are placed by, the shape of the boundary test's own. */
const LAYERS = ['data', 'server', 'state', 'ui', 'views'];

/** A box as its two corners. */
type Box = { x0: number; x1: number; y0: number; y1: number };

/** A title as the SVG writes it, its entities read back. */
function unescape(text: string): string {
    return text.replace(/&#45;/g, '-').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
}

/** Every group of one class of a drawing, by its title. */
function groups(svg: string, kind: 'node' | 'edge' | 'cluster'): Map<string, string> {
    const found = new Map<string, string>();
    const pattern = new RegExp(
        `<g id="\\w+\\d+" class="${kind}">\\n<title>([^<]*)</title>([\\s\\S]*?)\\n</g>`,
        'g'
    );
    for (const one of svg.matchAll(pattern)) found.set(unescape(one[1]), one[2]);
    return found;
}

/** The points of every number pair of the first attribute the pattern finds in a group. */
function points(body: string, attribute: 'points' | 'd'): number[][] {
    const text = new RegExp(`${attribute}="([^"]+)"`).exec(body)?.[1] ?? '';
    const numbers = (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const found: number[][] = [];
    for (let at = 0; at + 1 < numbers.length; at += 2) found.push([numbers[at], numbers[at + 1]]);
    return found;
}

/** The box that holds a set of points. */
function boxOf(held: number[][]): Box {
    const xs = held.map((one) => one[0]);
    const ys = held.map((one) => one[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Whether every point lies inside the box. */
function within(held: number[][], box: Box): boolean {
    return held.every(([x, y]) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1);
}

/** A source map from path and text pairs, the shape readSources gives. */
function sources(files: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(files));
}

/** Two folders of views, each importing two other layers, the first importing the second. */
const VIEWS = sources({
    'lib/views/a/A.ts':
        "import { s } from '$lib/state/s';\nimport { u } from '$lib/ui/u';\nimport { b } from '../b/B';\n",
    'lib/views/b/B.ts': "import { s } from '$lib/state/s';\nimport { u } from '$lib/ui/u';\n",
    'lib/state/s.ts': 'export const s = 1;\n',
    'lib/ui/u.ts': 'export const u = 1;\n'
});

describe('a layer diagram', () => {
    it('draws a count between two folders, and its arrow, inside the layer box', async () => {
        const svg = await renderSvg(layerDot(VIEWS, LAYERS, 'views', ['views/a', 'views/b']));
        const layer = boxOf(points(groups(svg, 'cluster').get('cluster_views') ?? '', 'points'));
        const word = 'folder views/a to folder views/b';
        const nodes = groups(svg, 'node');
        expect(within(points(nodes.get(word) ?? '', 'points'), layer)).toBe(true);
        const edges = groups(svg, 'edge');
        for (const half of [`folder views/a->${word}`, `${word}->folder views/b`]) {
            const drawn = points(edges.get(half) ?? '', 'd');
            expect(drawn.length).toBeGreaterThan(0);
            expect(within(drawn, layer)).toBe(true);
        }
    }, 30_000);

    it('ends each folder arrow into another layer at a box of its own, the count on its row', async () => {
        const svg = await renderSvg(layerDot(VIEWS, LAYERS, 'views', ['views/a', 'views/b']));
        const nodes = groups(svg, 'node');
        const edges = [...groups(svg, 'edge').keys()];
        for (const folder of ['views/a', 'views/b']) {
            for (const other of ['state', 'ui']) {
                const box = `layer ${other} from folder ${folder}`;
                expect(nodes.has(box)).toBe(true);
                // One arrow reaches the box, so none of another folder runs into it.
                expect(edges.filter((edge) => edge.endsWith(`->${box}`))).toHaveLength(1);
            }
            const row = boxOf(points(nodes.get(`folder ${folder}`) ?? '', 'points'));
            const count = boxOf(
                points(nodes.get(`folder ${folder} to layer state`) ?? '', 'points')
            );
            expect((count.y0 + count.y1) / 2).toBeCloseTo((row.y0 + row.y1) / 2, 0);
        }
        // Each box stands for one folder's arrow, so no two arrows gather on their way into it.
        expect(arrowsAlong(svg)).toEqual([]);
    }, 30_000);
});

describe('a count between two folders further apart', () => {
    it('stands halfway along its arrow, under the folder row between its ends', async () => {
        const four = sources({
            'lib/views/a/A.ts': "import { d } from '../d/D';\n",
            'lib/views/b/B.ts': 'export const b = 1;\n',
            'lib/views/c/C.ts': 'export const c = 1;\n',
            'lib/views/d/D.ts': 'export const d = 1;\n'
        });
        const order = ['views/a', 'views/b', 'views/c', 'views/d'];
        const svg = await renderSvg(layerDot(four, LAYERS, 'views', order));
        const nodes = groups(svg, 'node');
        const middle = (title: string) => {
            const box = boxOf(points(nodes.get(title) ?? '', 'points'));
            return (box.y0 + box.y1) / 2;
        };
        // SVG y grows downward: the count of a to d lies between the two middle folders.
        const count = middle('folder views/a to folder views/d');
        expect(count).toBeGreaterThan(middle('folder views/b'));
        expect(count).toBeLessThan(middle('folder views/c'));
    }, 30_000);
});

describe('the measure of arrows that run along each other', () => {
    /** One edge group of a drawing, its curve a straight run from (x0, y) to (x1, y). */
    const edge = (title: string, x0: number, x1: number, y: number) =>
        `<g id="edge${Math.round(x0 + y)}" class="edge">\n<title>${title}</title>\n<path d="M${x0},${y}C${x0},${y} ${x1},${y} ${x1},${y}"/>\n</g>`;
    const node = (title: string) =>
        `<g id="node${title.length}" class="node">\n<title>${title}</title>\n<polygon points="0,0 1,0 1,1 0,1 0,0"/>\n</g>`;

    it('names two arrows that run within 1.5 pt of each other for more than 40 pt', () => {
        const svg = (length: number) =>
            [
                '<svg>',
                edge('a&#45;&gt;b', 0, length, 0),
                edge('c&#45;&gt;d', 0, length, 1),
                '</svg>'
            ].join('\n');
        expect(arrowsAlong(svg(60))).toEqual(['a->b along c->d for 60']);
        // Thirty points together is under the 40 the measure allows.
        expect(arrowsAlong(svg(30))).toEqual([]);
    });

    it('takes the two halves through a node of words as one arrow', () => {
        const svg = [
            '<svg>',
            node('x to y'),
            edge('x&#45;&gt;x to y', 0, 25, 0),
            edge('x to y&#45;&gt;y', 30, 55, 0),
            edge('c&#45;&gt;d', 0, 55, 1),
            '</svg>'
        ].join('\n');
        // The gap of five points between the halves lies within 1.5 pt of their ends for three.
        expect(arrowsAlong(svg)).toEqual(['c->d along x to y for 52']);
    });
});

describe('the drawings the source gives', () => {
    const NAMES = ['layers', ...LAYER_NAMES.map((layer) => `layer-${layer}`)];

    // The engine's drawings take seconds to generate, so the cases over them share one generation,
    // made by the first of them that runs; a case that reads no engine drawing never waits for it.
    // The generation keeps its parses in a cache of this file's own.
    const parses: Parameters<typeof generate>[1] = new Map();
    let engineGenerated: ReturnType<typeof generate> | null = null;
    function engineDrawn(): ReturnType<typeof generate> {
        engineGenerated ??= generate(ENGINE, parses);
        return engineGenerated;
    }

    it('have no two arrows running along each other in the overview and the layer diagrams', async () => {
        const drawn = (await engineDrawn()).filter((one) => NAMES.includes(one.name));
        expect(drawn.map((one) => one.name)).toEqual(NAMES);
        const along = drawn.flatMap((one) =>
            arrowsAlong(one.svg).map((line) => `${one.name}: ${line}`)
        );
        // Every arrow into another layer has a box of its own, and inner counts sit in the layer.
        expect(along).toEqual([]);
        const committed = NAMES.flatMap((name) =>
            arrowsAlong(readFileSync(resolve(ENGINE, 'docs/diagrams', `${name}.svg`), 'utf8')).map(
                (line) => `${name}: ${line}`
            )
        );
        // The committed files are the drawings the source gives, which the first case holds.
        expect(committed).toEqual([]);
    }, 60_000);

    // Two arrows of one module drawn by hand: they leave together and share 64 pt of line.
    const PAIR = [
        '<svg>',
        `<g id="edge1" class="edge">
<title>m&#45;&gt;a</title>
<path fill="none" stroke="currentColor" d="M0,0C20,0 40,0 60,0C70,0 80,0 90,0"/>
</g>`,
        `<g id="edge2" class="edge">
<title>m&#45;&gt;b</title>
<path fill="none" stroke="currentColor" d="M0,0.5C20,0.5 40,0.5 60,0.5C70,0.5 80,20 90,40"/>
</g>`,
        '</svg>'
    ].join('\n');
    const ROUTE_ONLY = new Map([['routes/api/write/+server.ts', 'export const POST = () => 1;\n']]);

    it('draws the write diagram again with a tail port while two arrows of one module run together', () => {
        let draws = 0;
        const drawn = writesDrawn(ROUTE_ONLY, () => {
            draws += 1;
            return draws === 1 ? PAIR : '<svg>\n</svg>';
        });
        // The first drawing names the pair, so the arrow takes a port and the next drawing is kept.
        expect(draws).toBe(2);
        expect(arrowsAlong(drawn.svg)).toEqual([]);
    });

    it('stops once the arrow has tried every port, and leaves the pair for the check to name', () => {
        let draws = 0;
        const drawn = writesDrawn(ROUTE_ONLY, () => {
            draws += 1;
            return PAIR;
        });
        // One drawing with no port, then one per port of the four, and the pair still named.
        expect(draws).toBe(5);
        expect(arrowsAlong(drawn.svg)).toEqual(['m->a along m->b for 64']);
    });

    it('have no two arrows running along each other in the write diagram', async () => {
        const drawn = (await engineDrawn()).find((one) => one.name === 'writes');
        const committed = readFileSync(resolve(ENGINE, 'docs/diagrams/writes.svg'), 'utf8');
        // The write chain draws every call once; two calls leaving one module stay apart.
        expect(arrowsAlong(drawn?.svg ?? '')).toEqual([]);
        // The committed file is the drawing the source gives, which the first case holds.
        expect(arrowsAlong(committed)).toEqual([]);
    }, 60_000);
});

describe('the channel and write readers', () => {
    it('read a call between two strings that hold the marks of a comment', () => {
        const dot = channelsDot(
            sources({
                'lib/server/watch/w.ts': "const s = '/*'; hub.publish('a', x); const t = '*/';\n"
            })
        );
        expect(dot).toContain('"server/watch/w" -> "ch a";');
    });

    it('read a call after a regular expression that holds two slashes', () => {
        const dot = writesDot(
            sources({
                'routes/api/write/+server.ts':
                    "import { save } from '$lib/server/edit/writes';\nexport const POST = () => save();\n",
                'lib/server/edit/writes.ts':
                    "import { writeFileSync } from 'node:fs';\nexport function save() {\n    const r = /[//]/; writeFileSync('x', 'y');\n}\n"
            })
        );
        expect(dot).toContain(
            '"lib/server/edit/writes.ts" -> "lib/server/edit/writes.ts to file on disk (calls)"'
        );
    });

    it('blank the comments of a component and keep its markup', () => {
        const text = [
            '<script>',
            "// message('in the script')",
            "const a = '//';",
            '</script>',
            "<!-- message('in the markup') -->",
            "<p title={/* message('in an expression') */ a}>{message('kept')}</p>",
            ''
        ].join('\n');
        const code = codeOf('lib/ui/A.svelte', text);
        expect(code).toHaveLength(text.length);
        expect(code.split('\n')).toHaveLength(text.split('\n').length);
        expect(code).toContain("const a = '//';");
        expect(code).toContain("{message('kept')}");
        // Each comment is blanked where it stands, so no reader reads the call it names.
        expect(code).not.toMatch(/in the (script|markup)|in an expression/);
    });

    it('blank a JSDoc that ends a script', () => {
        const text = "const a = 1;\n/** hub.publish('x', y) */\n";
        expect(codeOf('lib/data/a.ts', text)).toBe(`const a = 1;\n${' '.repeat(26)}\n`);
    });

    it('read no trivia inside a JSDoc, so the code after it on its line is kept', () => {
        const text = "/** @param x // */ hub.publish('a', 1);\n";
        expect(codeOf('lib/server/a.ts', text)).toBe(`${' '.repeat(19)}hub.publish('a', 1);\n`);
    });

    it('blank the style block of a component', () => {
        const text = '<p>x</p>\n<style>p::after { content: "message(\'s\')"; }</style>\n';
        const code = codeOf('lib/ui/A.svelte', text);
        // No reader looks for a call in CSS, so a call written in a style block is none.
        expect(code).not.toContain('message');
        expect(code).toContain('<p>x</p>');
    });

    it('blank the comments of a script and keep its strings and regular expressions', () => {
        const text = "/* a */ const s = '/*'; // b\nconst r = /[//]/; const t = `*/`;\n";
        const code = codeOf('lib/state/a.ts', text);
        expect(code).toBe("        const s = '/*';     \nconst r = /[//]/; const t = `*/`;\n");
    });
});

describe('the title of an arrow that leaves by a port', () => {
    it('names the two modules alone', async () => {
        const svg = await renderSvg('digraph g {\n    "a" -> "b" [tailport=se];\n}\n');
        expect(svg).toContain('<title>a&#45;&gt;b</title>');
    }, 30_000);
});
