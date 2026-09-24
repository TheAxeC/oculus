#!/usr/bin/env node
// Layer 4, tool. Draw oculus's three diagrams from its source: the layers and the imports that join
// them, the channels from the server module that publishes each to the client modules that read
// it, and the write chain from the route to the file on disk. Each is written to docs/diagrams/ as
// a Graphviz `.dot` file and the `.svg` rendered from it.
//
// Everything drawn is read from the source text, never from a list kept here: the import
// specifiers and globs (with the pattern tests/checks/tree/boundaries.test.ts reads them with,
// grouped by the layer rows that test names), the `publish(` calls and the reads of each channel on
// the page, and the calls made inside the functions the write route reaches. graphs.mjs reads the
// first two, writes.mjs the third, and source.mjs holds what the three share. A module no layer row
// places is drawn in a dashed group named "not placed"; so is, with its file and line, an import,
// a publish, a channel read or comparison, a re-export of a whole module, or a call the write
// reader cannot follow (writes.mjs says which). A module the write trace reaches that writes
// nothing is drawn in a dashed group of its own.
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
import { channelsDot, layersDot } from './graphs.mjs';
import { BOUNDARIES, readLayers, readSources } from './source.mjs';
import { writesDot } from './writes.mjs';

export { channelsDot, layersDot, placeOf } from './graphs.mjs';
export { BOUNDARIES, readLayers, readSources, resolveSpec, uncomment } from './source.mjs';
export { WRITE_ROUTE, declarations, writesDot } from './writes.mjs';

/** The three diagrams, in the order the Help view and DESIGN.md name them. */
export const NAMES = ['layers', 'channels', 'writes'];

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
    const { instance } = await import('@viz-js/viz');
    const viz = await instance();
    const svg = viz.renderString(dot, { format: 'svg' });
    return svg
        .replace(/^[\s\S]*?(?=<svg)/, '')
        .replace(/^(<svg[^>]*>)/, `$1\n<style>${STANDALONE}</style>`)
        .replace(
            /<title>([^<]*)<\/title>\n<g id="a_[^"]*"><a xlink:title="([^"]*)">\n([\s\S]*?)<\/a>\n<\/g>\n/g,
            (_, ends, words, drawn) =>
                `<title>${ends}: ${words.replace(/&#10;/g, ', ')}</title>\n${drawn}`
        )
        .replace(/(stroke|fill)="black"/g, '$1="currentColor"')
        .replace(/<text /g, '<text fill="currentColor" ');
}

/**
 * The three diagrams as the source gives them now.
 *
 * @param {string} engine The engine directory.
 * @returns {Promise<Diagram[]>}
 */
export async function generate(engine) {
    const sources = readSources(engine);
    const layers = readLayers(readFileSync(join(engine, BOUNDARIES), 'utf8'));
    const dots = {
        layers: layersDot(sources, layers),
        channels: channelsDot(sources),
        writes: writesDot(sources)
    };
    const out = [];
    for (const name of NAMES) {
        const dot = dots[/** @type {keyof typeof dots} */ (name)];
        out.push({ name, dot, svg: await renderSvg(dot) });
    }
    return out;
}

/**
 * Every committed file of docs/diagrams/ that differs from what the source gives now, by its path
 * under the engine directory, so a failure names each one at once.
 *
 * @param {string} engine
 * @returns {Promise<string[]>}
 */
export async function staleFiles(engine) {
    const stale = [];
    for (const one of await generate(engine)) {
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

/** Write the three diagrams under the engine's docs/diagrams/. */
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
