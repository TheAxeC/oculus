// Layer 4, tool. What the three diagram readers of bin/diagrams/ share: the source tree read into
// memory, the text with its comments blanked, an import specifier resolved to a module, and the
// pieces of Graphviz text every diagram is written with (a quoted id, the header, a cluster, the
// node of something a reader could not follow).

import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

/** The file whose `LAYERS` row list groups the layer diagram, relative to the engine directory. */
export const BOUNDARIES = 'tests/checks/tree/boundaries.test.ts';

/** The font every label is set in; one family keeps the text widths Graphviz measures stable. */
const FONT = 'Helvetica,Arial,sans-serif';

/** The dashed group every reader draws what it could not place or follow in, file and line. */
export const UNPLACED = 'not placed';

/** Words a call pattern matches that are syntax rather than a function. */
export const KEYWORDS = new Set(
    'if for while switch catch return function typeof await new import super'.split(' ')
);

/** The import pattern of tests/checks/tree/boundaries.test.ts, so both read the same edges. */
export const IMPORT = /(?:^|[\s;])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

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

/** The module file a resolved path is, trying the extensions an import leaves off. */
export function moduleFile(/** @type {Sources} */ sources, /** @type {string} */ path) {
    for (const tail of ['', '.ts', '.js', '.svelte', '.svelte.ts', '/index.ts']) {
        if (sources.has(path + tail)) return path + tail;
    }
    return null;
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
    const where = `${path}:${lineOf(text, index)}`;
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
