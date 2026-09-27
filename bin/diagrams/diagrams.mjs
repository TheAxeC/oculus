#!/usr/bin/env node
// Layer 4, tool. Draw oculus's diagrams from its source: the layers and the runtime imports that
// join them, one diagram per layer of its folders in their declared order and the imports among
// them and out of the layer, the channels from the server module that publishes each to the client
// modules that read it, and the write chain from the route to the file on disk. Each is written to
// docs/diagrams/ as a Graphviz `.dot` file and the `.svg` rendered from it.
//
// Everything drawn is read from the source, never from a list kept here: the runtime imports and
// globs (parsed by imports.mjs, the reader the import checks call, grouped by the layer rows
// tests/checks/tree/boundaries.test.ts names and the folder order tests/checks/imports/order.ts
// declares), the `publish(` calls and the reads of each channel on the page, and the calls made
// inside the functions the write route reaches. graphs.mjs reads the imports and the channels,
// writes.mjs the write chain, labels.mjs draws an arrow's words and checks where they land, and
// source.mjs holds what they share. A module no layer row places is drawn in a dashed group
// named "not placed"; so is, with its file and line, an import, a publish, a channel read or
// comparison, a re-export of a whole module, or a call the write reader cannot follow (writes.mjs
// says which). The write diagram draws only the modules on a path to the disk or to a call it
// cannot follow. Every count and every call list is a small node of words standing on its arrow
// (labels.mjs), which the router takes every other arrow around.
//
// The render is @viz-js/viz, Graphviz compiled to WebAssembly, so no system install is needed and
// one input gives the same bytes on every machine. The drawing has no background and every line
// and letter is `currentColor`, which is what lets the Help view draw it in the page's own text
// colour under any theme; a `<style>` in the file gives it a grey of its own when it is opened
// outside oculus. tests/checks/diagrams/diagrams.test.ts runs staleFiles() in memory and fails,
// naming every file, when a committed file differs from what the source gives now. Usage:
//
//     npm run diagrams

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { channelsDot, layerDot, layersDot } from './graphs.mjs';
import { BOUNDARIES, ORDERING, readLayers, readOrder, readSources } from './source.mjs';
import { writesDrawn } from './writes.mjs';

export { channelsDot, folderOf, layerDot, layersDot, placeOf } from './graphs.mjs';
export {
    BOUNDARIES,
    ORDERING,
    readLayers,
    readOrder,
    readSources,
    resolveSpec
} from './source.mjs';
export { codeOf } from './code.mjs';
export { arrowsAlong, halves, labelledEdge, labelsAcross } from './labels.mjs';
export { augmentationsOf, importsOf, moduleAt } from './imports.mjs';
export { WRITE_ROUTE, declarations, writesDot, writesDrawn } from './writes.mjs';

/** The layers the folder order names, each drawn as its own diagram after the overview. */
export const LAYER_NAMES = ['data', 'server', 'state', 'ui', 'shell', 'views'];

/** Every diagram, in the order the Help view and DESIGN.md name them. */
export const NAMES = [
    'layers',
    ...LAYER_NAMES.map((layer) => `layer-${layer}`),
    'channels',
    'writes'
];

/** Where the diagrams are written, relative to the engine directory. */
export const OUT = 'docs/diagrams';

/** Its own colours outside oculus: dark grey, or light grey on a dark ground under a dark scheme,
 * since a browser draws an SVG opened on its own on white. */
const STANDALONE =
    'svg { color: #333333; } @media (prefers-color-scheme: dark) { svg { color: #cccccc; background: #1e1e1e; } }';

/** @typedef {{ name: string, dot: string, svg: string }} Diagram One diagram, as written. */

// ---- Rendering ---------------------------------------------------------------------------------

/**
 * Render DOT to SVG, then make the drawing take the colour of the page it sits in: every stroke and
 * fill Graphviz writes black becomes `currentColor`, and every text element is given the same, so
 * there is no colour of its own anywhere and nothing opaque behind it. What Graphviz writes before
 * the `svg` element (the XML declaration, the doctype and a comment carrying its build date) is
 * dropped, so the bytes change only with the drawing and the file is one element a page can hold.
 * The tail port Graphviz writes into an edge's title (`a:se->b`) is dropped from it, so the title
 * names the two modules alone.
 *
 * Two things are added for a reader who meets the file outside oculus or points at an edge:
 *
 * - An edge's tooltip is written by Graphviz as a link wrapper, `<a xlink:title=...>`, which the
 *   Help view's graph filter drops. Its words are moved into the edge's own `<title>`, after the
 *   names of the two ends, and the wrapper is removed, so the words show on hover in the Help view
 *   and in a browser alike.
 * - A `<style>` gives the drawing a grey of its own, dark on a light viewer and light on a dark
 *   one, which `currentColor` takes when the file is opened on its own or drawn as an image. The
 *   Help view's filter drops the style, so there the drawing takes the page's text colour.
 *
 * @param {string} dot
 * @returns {Promise<string>}
 */
export async function renderSvg(dot) {
    return (await drawer())(dot);
}

/**
 * The renderer renderSvg() draws with, as a function over one Graphviz instance, so a diagram laid
 * out at several spacings loads the WebAssembly once.
 *
 * @returns {Promise<(dot: string) => string>}
 */
async function drawer() {
    const { instance } = await import('@viz-js/viz');
    const viz = await instance();
    return (dot) =>
        viz
            .renderString(dot, { format: 'svg' })
            .replace(/^[\s\S]*?(?=<svg)/, '')
            .replace(/^(<svg[^>]*>)/, `$1\n<style>${STANDALONE}</style>`)
            .replace(
                /<title>([^<]*)<\/title>\n<g id="a_[^"]*"><a xlink:title="([^"]*)">\n([\s\S]*?)<\/a>\n<\/g>\n/g,
                (_, ends, words, drawn) =>
                    `<title>${ends}: ${words.replace(/&#10;/g, ', ')}</title>\n${drawn}`
            )
            .replace(/(<title>[^<]*?):(?:n|ne|e|se|s|sw|w|nw)(?=&#45;&gt;)/g, '$1')
            .replace(/(stroke|fill)="black"/g, '$1="currentColor"')
            .replace(/<text /g, '<text fill="currentColor" ');
}

/**
 * Every diagram as the source gives it now, the write diagram drawn by writesDrawn(), which parts
 * the arrows of one module that would run along each other. A layer of LAYER_NAMES the order file
 * does not list is an error, since its diagram would have no folders to draw.
 *
 * @param {string} engine The engine directory.
 * @returns {Promise<Diagram[]>}
 */
export async function generate(engine) {
    const sources = readSources(engine);
    const layers = readLayers(readFileSync(join(engine, BOUNDARIES), 'utf8'));
    const order = readOrder(readFileSync(join(engine, ORDERING), 'utf8'));
    /** @type {Map<string, string>} */
    const dots = new Map([['layers', layersDot(sources, layers)]]);
    for (const layer of LAYER_NAMES) {
        const folders = order.get(layer);
        if (folders === undefined) throw new Error(`${ORDERING} gives no order for ${layer}`);
        dots.set(`layer-${layer}`, layerDot(sources, layers, layer, folders));
    }
    dots.set('channels', channelsDot(sources));
    const draw = await drawer();
    const writes = writesDrawn(sources, draw);
    return NAMES.map((name) => {
        if (name === 'writes') return { name, ...writes };
        const dot = dots.get(name) ?? '';
        return { name, dot, svg: draw(dot) };
    });
}

/**
 * Every committed file of docs/diagrams/ that differs from what the source gives now, by its path
 * under the engine directory, so a failure names each one at once.
 *
 * @param {string} engine
 * @param {Diagram[]} [drawn] The drawings generate(engine) gave, when the caller has them already.
 * @returns {Promise<string[]>}
 */
export async function staleFiles(engine, drawn) {
    const stale = [];
    for (const one of drawn ?? (await generate(engine))) {
        for (const [kind, text] of [
            ['dot', one.dot],
            ['svg', one.svg]
        ]) {
            const file = `${OUT}/${one.name}.${kind}`;
            const path = join(engine, file);
            if (!existsSync(path) || readFileSync(path, 'utf8') !== text) stale.push(file);
        }
    }
    return stale;
}

/** Write every diagram under the engine's docs/diagrams/. */
async function main() {
    const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const folder = join(engine, OUT);
    if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
    for (const one of await generate(engine)) {
        writeFileSync(join(folder, `${one.name}.dot`), one.dot);
        writeFileSync(join(folder, `${one.name}.svg`), one.svg);
        process.stdout.write(`${OUT}/${one.name}.dot\n${OUT}/${one.name}.svg\n`);
    }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
