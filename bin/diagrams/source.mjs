// Layer 4, tool. What the diagram readers of bin/diagrams/ share: the source tree read into memory,
// the text with its comments blanked for the channel and write readers, the layer rows and folder
// order the checks declare, an import specifier resolved to a module, and the pieces of Graphviz
// text every diagram is written with (a quoted id, the header, a cluster, the node of something a
// reader could not follow). A module's imports are read by imports.mjs, the reader the checks call.

import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { moduleAt } from './imports.mjs';

/** The file whose `LAYERS` row list groups the layer diagram, relative to the engine directory. */
export const BOUNDARIES = 'tests/checks/tree/boundaries.test.ts';

/** The file whose `ORDER` lists each layer's folders from the top down, relative to the engine. */
export const ORDERING = 'tests/checks/imports/order.ts';

/** The font every label is set in; one family keeps the text widths Graphviz measures stable. */
const FONT = 'Helvetica,Arial,sans-serif';

/** The dashed group every reader draws what it could not place or follow in, file and line. */
export const UNPLACED = 'not placed';

/** Words a call pattern matches that are syntax rather than a function. */
export const KEYWORDS = new Set(
    'if for while switch catch return function typeof await new import super'.split(' ')
);

/**
 * @typedef {Map<string, string>} Sources Every module's text, keyed by its path relative to src.
 */

// ---- Reading the tree ------------------------------------------------------------------------

/**
 * Every module under src: the TypeScript, JavaScript and Svelte files, keyed by their path
 * relative to src with forward slashes.
 *
 * @param {string} engine The engine directory, the folder that holds src/.
 * @returns {Sources}
 */
export function readSources(engine) {
    /** @type {Sources} */
    const found = new Map();
    const src = join(engine, 'src');
    /** @param {string} rel */
    const walk = (rel) => {
        const entries = readdirSync(join(src, rel), { withFileTypes: true });
        for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
            const path = rel === '' ? entry.name : `${rel}/${entry.name}`;
            if (entry.isDirectory()) walk(path);
            else if (/\.(ts|js|svelte)$/.test(entry.name)) {
                found.set(path, readFileSync(join(src, path), 'utf8'));
            }
        }
    };
    walk('');
    return found;
}

/**
 * The layer rows the boundary test holds the import graph to, read from its `LAYERS` constant.
 * A test that no longer declares one is an error here rather than a diagram with no groups.
 *
 * @param {string} text The boundary test's source.
 * @returns {string[]}
 */
export function readLayers(text) {
    const found = /const LAYERS\s*=\s*\[([^\]]*)\]/.exec(text);
    if (found === null) throw new Error(`${BOUNDARIES} declares no LAYERS list`);
    return [...found[1].matchAll(/'([^']+)'/g)].map((one) => one[1]);
}

/**
 * Each layer's folders from the top down, read from the `ORDER` constant of the order file: one
 * `name: [...]` entry per layer, the folders quoted. A file that declares none is an error here
 * rather than a set of diagrams with no folders.
 *
 * @param {string} text The order file's source.
 * @returns {Map<string, string[]>}
 */
export function readOrder(text) {
    const found = /const ORDER[^=]*=\s*\{([^}]*)\}/.exec(text);
    if (found === null) throw new Error(`${ORDERING} declares no ORDER`);
    const order = new Map();
    for (const entry of found[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g)) {
        order.set(
            entry[1],
            [...entry[2].matchAll(/'([^']+)'/g)].map((one) => one[1])
        );
    }
    return order;
}

/**
 * The text with its comments blanked, so a call named in prose is not read as a call. A `//` after
 * a colon or inside a quote is left, which keeps a URL in a string whole.
 */
export function uncomment(/** @type {string} */ text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
        .replace(/<!--[\s\S]*?-->/g, (block) => block.replace(/[^\n]/g, ' '));
}

/** The src-relative path a specifier of a module under src names, or null for a package. */
export function resolveSpec(/** @type {string} */ from, /** @type {string} */ spec) {
    if (spec.startsWith('$lib/')) return `lib/${spec.slice('$lib/'.length)}`;
    if (!spec.startsWith('.')) return null;
    const joined = posix.normalize(posix.join(posix.dirname(from), spec));
    return joined.startsWith('..') ? null : joined;
}

/**
 * The module file a resolved path is, or null where the source holds none, resolved by
 * imports.mjs's moduleAt() as the checks resolve it.
 */
export function moduleFile(/** @type {Sources} */ sources, /** @type {string} */ path) {
    return moduleAt(path, (one) => sources.has(one));
}

/** The line an index falls on, from 1; uncomment() keeps every line break of the source. */
export function lineOf(/** @type {string} */ text, /** @type {number} */ index) {
    return text.slice(0, index).split('\n').length;
}

/**
 * The node line of something a reader found and could not follow: its own id, and a label naming
 * the file, the line and what is written there, so it is drawn in the group of what is not placed.
 *
 * @param {string} path Relative to src.
 * @param {string} text Uncommented.
 * @param {number} index
 * @param {string} what
 * @returns {{ id: string, line: string }}
 */
export function unfollowed(path, text, index, what) {
    return unfollowedAt(path, lineOf(text, index), what);
}

/**
 * The same node line for something whose line is already known.
 *
 * @param {string} path Relative to src.
 * @param {number} line
 * @param {string} what
 * @returns {{ id: string, line: string }}
 */
export function unfollowedAt(path, line, what) {
    const where = `${path}:${line}`;
    const id = `? ${where}`;
    return { id, line: `${quote(id)} [label=${quote(`${where} ${what.trim()}`)}];` };
}

/** @param {string} text */
export function quote(text) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** The header every diagram shares, around its own layout: no background, one colour, one font. */
export function header(/** @type {string} */ name, /** @type {string} */ layout) {
    return [
        `digraph ${name} {`,
        `    graph [bgcolor="transparent", ${layout}, fontname="${FONT}", fontsize=12, nodesep=0.2, ranksep=0.5];`,
        `    node [shape=box, color="black", fontcolor="black", fontname="${FONT}", fontsize=10, height=0.3, margin="0.12,0.04"];`,
        `    edge [color="black", fontcolor="black", fontname="${FONT}", fontsize=8, arrowsize=0.6];`
    ];
}

/** One group of node lines as a Graphviz cluster, solid or dashed. */
export function cluster(
    /** @type {string} */ id,
    /** @type {string} */ label,
    /** @type {string[]} */ lines,
    style = 'solid'
) {
    return [
        `    subgraph ${quote(`cluster_${id}`)} {`,
        `        label=${quote(label)}; style=${style};`,
        ...lines.map((line) => `        ${line}`),
        '    }'
    ];
}

/** @param {Iterable<string>} values */
export function sorted(values) {
    return [...new Set(values)].sort();
}
