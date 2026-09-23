#!/usr/bin/env node
// Layer 4, tool. Draw oculus's three diagrams from its source: the layers and the imports that join
// them, the channels from the server module that publishes each to the client modules that read
// it, and the write chain from the route to the file on disk. Each is written to docs/diagrams/ as
// a Graphviz `.dot` file and the `.svg` rendered from it.
//
// Everything drawn is read from the source text, never from a list kept here: the import
// specifiers and globs (with the pattern tests/checks/tree/boundaries.test.ts reads them with,
// grouped by the layer rows that test names), the `publish(` calls and the reads of each channel on
// the page, and the calls made inside the functions the write route reaches. A module no layer row
// places is drawn in a dashed group named "not placed"; so is, with its file and line, an import,
// a publish, a channel read or comparison, a re-export of a whole module, or a call through a
// computed member or a method of an imported value, whose target is not written out. A call through
// a parameter or a local alias is not followed. A module the write trace reaches that writes
// nothing is drawn in a dashed group of its own.
//
// The render is @viz-js/viz, Graphviz compiled to WebAssembly, so no system install is needed and
// one input gives the same bytes on every machine. The drawing has no background and every line
// and letter is `currentColor`, which is what lets the Help view draw it in the page's own text
// colour under any theme; a `<style>` in the file gives it a grey of its own when it is opened
// outside oculus. tests/checks/diagrams/diagrams.test.ts runs staleFiles() in memory and fails,
// naming every file, when a committed file differs from what the source gives now. Usage:
//
//     node bin/diagrams.mjs

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The three diagrams, in the order the Help view and DESIGN.md name them. */
export const NAMES = ['layers', 'channels', 'writes'];

/** Where the diagrams are written, relative to the engine directory. */
export const OUT = 'docs/diagrams';

/** The route the write chain starts at, relative to src. */
export const WRITE_ROUTE = 'routes/api/write/+server.ts';

/** The file whose `LAYERS` row list groups the layer diagram, relative to the engine directory. */
export const BOUNDARIES = 'tests/checks/tree/boundaries.test.ts';

/** The font every label is set in; one family keeps the text widths Graphviz measures stable. */
const FONT = 'Helvetica,Arial,sans-serif';

/** The dashed group every reader draws what it could not place or follow in, file and line. */
const UNPLACED = 'not placed';

/** Its own colours outside oculus: dark grey, or light grey on a dark ground under a dark scheme,
 * since a browser draws an SVG opened on its own on white. */
const STANDALONE =
    'svg { color: #333333; } @media (prefers-color-scheme: dark) { svg { color: #cccccc; background: #1e1e1e; } }';

/** The node every write that reaches the disk points at. */
const DISK = 'file on disk';

/** The node:fs calls that change a file, which is what makes a module's call a write to disk. */
const FS_WRITE = /^(?:appendFile|copyFile|mkdir|rename|rm|unlink|writeFile)(?:Sync)?$/;

/** Words a call pattern matches that are syntax rather than a function. */
const KEYWORDS = new Set(
    'if for while switch catch return function typeof await new import super'.split(' ')
);

/** The import pattern of tests/checks/tree/boundaries.test.ts, so both read the same edges. */
const IMPORT = /(?:^|[\s;])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

/**
 * @typedef {Map<string, string>} Sources Every module's text, keyed by its path relative to src.
 * @typedef {{ name: string, dot: string, svg: string }} Diagram One diagram, as written.
 * @typedef {{ from: string, name: string }} Origin Where an imported name comes from.
 * @typedef {{ channel: string, subscribes: boolean }} Read One channel a client module reads.
 * @typedef {{ names: Map<string, Origin>, spaces: Map<string, string>, fs: Set<string> }} Imports
 *     A module's value imports by local name, its namespace imports, and its node:fs names.
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
function moduleFile(/** @type {Sources} */ sources, /** @type {string} */ path) {
    for (const tail of ['', '.ts', '.js', '.svelte', '.svelte.ts', '/index.ts']) {
        if (sources.has(path + tail)) return path + tail;
    }
    return null;
}

/** The line an index falls on, from 1; uncomment() keeps every line break of the source. */
function lineOf(/** @type {string} */ text, /** @type {number} */ index) {
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
function unfollowed(path, text, index, what) {
    const where = `${path}:${lineOf(text, index)}`;
    const id = `? ${where}`;
    return { id, line: `${quote(id)} [label=${quote(`${where} ${what.trim()}`)}];` };
}

/** @param {string} text */
function quote(text) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** The header every diagram shares, around its own layout: no background, one colour, one font. */
function header(/** @type {string} */ name, /** @type {string} */ layout) {
    return [
        `digraph ${name} {`,
        `    graph [bgcolor="transparent", ${layout}, fontname="${FONT}", fontsize=12, nodesep=0.2, ranksep=0.5];`,
        `    node [shape=box, color="black", fontcolor="black", fontname="${FONT}", fontsize=10, height=0.3, margin="0.12,0.04"];`,
        `    edge [color="black", fontcolor="black", fontname="${FONT}", fontsize=8, arrowsize=0.6];`
    ];
}

/** One group of node lines as a Graphviz cluster, solid or dashed. */
function cluster(
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
function sorted(values) {
    return [...new Set(values)].sort();
}

// ---- The layer graph ---------------------------------------------------------------------------

/**
 * The layer row a module belongs to, the node it is drawn as, and whether a rule placed it.
 *
 * Under lib, the layer is the longest row of the boundary test the path opens with, as the test's
 * own `layerOf` decides for `server/transcripts`, and the node is the layer's folder one level
 * down, or the layer itself for a file that sits in it. A route is drawn by its group under api/
 * (`routes/api/(docs)`), the root of routes by itself, and a module directly under src (the server
 * entry and the hooks) in a group named src. Anything else under lib has no row and is drawn in the
 * group of what no rule placed.
 *
 * @param {string} path Relative to src.
 * @param {string[]} layers
 * @returns {{ layer: string, node: string }}
 */
export function placeOf(path, layers) {
    const parts = path.split('/');
    if (parts[0] === 'routes') {
        const folders = parts.slice(1, -1);
        const node = ['routes', ...folders.slice(0, 2)].join('/');
        return { layer: 'routes', node };
    }
    if (parts[0] !== 'lib') return { layer: 'src', node: 'src' };
    const rel = parts.slice(1).join('/');
    const layer = layers
        .filter((row) => rel === row || rel.startsWith(`${row}/`))
        .sort((a, b) => b.length - a.length)[0];
    if (layer === undefined) return { layer: UNPLACED, node: parts[1] };
    const rest = rel.slice(layer.length + 1).split('/');
    const node = rest.length > 1 ? `${layer}/${rest[0]}` : layer;
    return { layer, node };
}

/**
 * The layer diagram: one cluster per layer row (plus routes, src and what no row placed), one node
 * per folder, and one edge for each pair of folders some import joins.
 *
 * @param {Sources} sources
 * @param {string[]} layers
 * @returns {string}
 */
export function layersDot(sources, layers) {
    /** @type {Map<string, Set<string>>} */
    const members = new Map();
    const edges = new Set();
    /** @param {{ layer: string, node: string }} at */
    const add = (at) => {
        const held = members.get(at.layer) ?? new Set();
        held.add(at.node);
        members.set(at.layer, held);
    };
    /** @type {string[]} */
    const lost = [];
    for (const [path, text] of sources) {
        const from = placeOf(path, layers);
        add(from);
        const plain = uncomment(text);
        for (const match of plain.matchAll(/(?<![\w$.])import\s*\(\s*(?!['"])([^)]*)\)/g)) {
            const one = unfollowed(`src/${path}`, plain, match.index, `import(${match[1]})`);
            lost.push(one.line);
            edges.add(`${quote(from.node)} -> ${quote(one.id)} [style=dashed];`);
        }
        // A glob imports every module under the folder its pattern starts with.
        for (const match of text.matchAll(/import\.meta\.glob\(\s*['"]([^'"*]*)/g)) {
            const target = resolveSpec(path, match[1].replace(/\/[^/]*$/, ''));
            const to = target === null ? null : placeOf(target, layers);
            if (to !== null && to.node !== from.node)
                edges.add(`${quote(from.node)} -> ${quote(to.node)};`);
        }
        for (const match of text.matchAll(IMPORT)) {
            const target = resolveSpec(path, match[1]);
            if (target === null) continue;
            const to = placeOf(target, layers);
            add(to);
            if (to.node !== from.node) edges.add(`${quote(from.node)} -> ${quote(to.node)};`);
        }
    }
    if (lost.length > 0 && !members.has(UNPLACED)) members.set(UNPLACED, new Set());
    const order = [...layers, 'routes', 'src', UNPLACED].filter((layer) => members.has(layer));
    const lines = header('layers', 'rankdir=TB, concentrate=true, newrank=true');
    for (const layer of order) {
        const nodes = sorted(members.get(layer) ?? []).map((node) => `${quote(node)};`);
        if (layer === UNPLACED) nodes.push(...sorted(lost));
        lines.push(...cluster(layer, layer, nodes, layer === UNPLACED ? 'dashed' : 'solid'));
    }
    for (const edge of sorted(edges)) lines.push(`    ${edge}`);
    lines.push('}', '');
    return lines.join('\n');
}

// ---- The channel graph -------------------------------------------------------------------------

/** The string constants a module declares, by name, so a channel built from one can be read. */
function constants(/** @type {string} */ text) {
    const found = new Map();
    for (const match of text.matchAll(/\bconst\s+(\w+)\s*(?::\s*string\s*)?=\s*'([^']*)'/g)) {
        found.set(match[1], match[2]);
    }
    return found;
}

/**
 * The channel-naming functions a module declares: a function returning a template, read as the
 * channel it names with every constant filled in and every other part written `*`.
 */
function namers(/** @type {string} */ text) {
    const held = constants(text);
    const found = new Map();
    const pattern =
        /function\s+(\w+)\s*\([^)]*\)\s*:\s*string\s*\{\s*return\s*`([^`]*)`\s*;?\s*\}/g;
    for (const match of text.matchAll(pattern)) {
        found.set(
            match[1],
            match[2].replace(/\$\{(\w+)\}/g, (_, name) => held.get(name) ?? '*')
        );
    }
    return found;
}

/**
 * What a channel argument names: a literal as it is written, a call to a channel-naming function as
 * the channel it builds, and null for anything else, which the caller names as not placed.
 */
function channelOf(/** @type {string} */ argument, /** @type {Map<string, string>} */ named) {
    const literal = /^'([^']+)'$/.exec(argument.trim());
    if (literal !== null) return literal[1];
    const call = /^(\w+)\(/.exec(argument.trim());
    return (call === null ? undefined : named.get(call[1])) ?? null;
}

/**
 * The node a client module is drawn as: a view by its own folder (a view and its partials are one
 * view), anything else by its path under lib without the extension.
 */
function readerNode(/** @type {string} */ path) {
    const parts = path.replace(/(\.svelte)?\.(ts|js)$|\.svelte$/, '').split('/');
    if (parts[0] === 'lib' && parts[1] === 'views' && parts.length > 4) {
        return parts.slice(1, 4).join('/');
    }
    return parts[0] === 'lib' ? parts.slice(1).join('/') : parts.join('/');
}

/** The client layers under lib, in the order their groups are drawn; routes follow them. */
const CLIENT = ['state', 'views', 'shell', 'ui'];

/**
 * The group a page-side module is drawn in: its client layer under lib, or routes. Null for a
 * module the page does not run (the server, and the data layer both sides share), which is not
 * read for channel reads.
 */
function readerGroup(/** @type {string} */ path) {
    const parts = path.split('/');
    if (parts[0] === 'routes') return 'routes';
    if (parts[0] === 'lib' && CLIENT.includes(parts[1])) return parts[1];
    return null;
}

/**
 * Every channel read on the page, by the module that reads it: `message('x')`, `channel === 'x'`
 * or `case 'x':` under `switch (channel)`, a store accessor (`name: () => payload('x')` read as
 * `entities.name` or out of `entities: { name }`), a channel a naming function builds where the
 * module listens or subscribes, and the page's connect list, a subscription. Each of these whose
 * channel is not a literal, and a listen or subscribe with no naming function, comes back as
 * `lost`, by its index in the text.
 *
 * @param {string} text Uncommented.
 * @param {Map<string, string>} accessors Accessor name to channel.
 * @param {Map<string, string>} named Every channel-naming function of the client.
 * @returns {{ found: Read[], lost: { at: number, what: string }[] }}
 */
function readsOf(text, accessors, named) {
    /** @type {Read[]} */
    const found = [];
    /** @type {{ at: number, what: string }[]} */
    const lost = [];
    const read = (/** @type {string} */ channel) => found.push({ channel, subscribes: false });
    for (const match of text.matchAll(/(?<!function\s+)\bmessage\(\s*([^)]*)\)/g)) {
        const literal = /^'([^']+)'$/.exec(match[1].trim());
        if (literal !== null) read(literal[1]);
        else lost.push({ at: match.index, what: match[0] });
    }
    for (const match of text.matchAll(/\bchannel\s*===\s*(?:'([^']+)'|[\w$.]+)/g)) {
        if (match[1] !== undefined) read(match[1]);
        else lost.push({ at: match.index, what: match[0] });
    }
    for (const match of text.matchAll(/\bswitch\s*\(\s*channel\s*\)\s*\{([^}]*)\}/g)) {
        for (const one of match[1].matchAll(/\bcase\s+([^:]+):/g)) {
            const literal = /^'([^']+)'$/.exec(one[1].trim());
            if (literal !== null) read(literal[1]);
            else lost.push({ at: match.index, what: `case ${one[1].trim()}` });
        }
    }
    const used = new Set();
    for (const match of text.matchAll(/(?<![\w$.])entities\.(\w+)/g)) used.add(match[1]);
    for (const match of text.matchAll(/(?<![\w$.])entities\s*:\s*\{([^}]*)\}/g)) {
        for (const part of match[1].split(',')) used.add(part.split(':')[0].trim());
    }
    for (const name of used) {
        const channel = accessors.get(name);
        if (channel !== undefined) read(channel);
    }
    const builds = [...named].filter(([name]) => new RegExp(`(?<![\\w$.])${name}\\(`).test(text));
    for (const match of text.matchAll(/\.(?:listen|subscribe)\([^)\n]*\)?/g)) {
        if (builds.length === 0) lost.push({ at: match.index, what: match[0] });
    }
    if (/\b(?:listen|subscribe)\(/.test(text)) for (const [, channel] of builds) read(channel);
    for (const match of text.matchAll(/\bconnect\(\s*\[([^\]]*)\]/g)) {
        for (const part of match[1].split(',')) {
            const literal = /^'([^']+)'$/.exec(part.trim());
            if (literal !== null) found.push({ channel: literal[1], subscribes: true });
            else if (part.trim() !== '')
                lost.push({ at: match.index, what: `connect(${part.trim()})` });
        }
    }
    return { found, lost };
}

/**
 * The channel diagram: every module that publishes, grouped by its folder under server; every
 * channel it publishes; and every client module that reads the channel, grouped by layer. A dashed
 * edge is the page's subscription, a solid one a read.
 *
 * @param {Sources} sources
 * @returns {string}
 */
export function channelsDot(sources) {
    /** @type {Map<string, Set<string>>} */
    const groups = new Map();
    const edges = new Set();
    const channels = new Map();
    /** @param {string} group @param {string} node */
    const place = (group, node) => {
        const held = groups.get(group) ?? new Set();
        held.add(node);
        groups.set(group, held);
    };
    /** @type {Map<string, string>} */
    const accessors = new Map();
    /** @type {Map<string, string>} */
    const clientNamed = new Map();
    /** @type {[string, string][]} */
    const client = [];
    /** @type {string[]} */
    const lost = [];
    for (const [path, raw] of sources) {
        const text = uncomment(raw);
        if (path.startsWith('lib/server/')) {
            const named = namers(text);
            for (const match of text.matchAll(/\.publish\(\s*('[^']*'|\w+\([^)]*\)|[^,)]+)/g)) {
                const channel = channelOf(match[1], named);
                const node = path.slice('lib/'.length).replace(/\.ts$/, '');
                const folder = node.split('/').slice(0, 2).join('/');
                place(`publish ${folder}`, node);
                if (channel !== null) {
                    channels.set(channel, true);
                    edges.add(`${quote(node)} -> ${quote(`ch ${channel}`)};`);
                    continue;
                }
                const one = unfollowed(`src/${path}`, text, match.index, `publish(${match[1]})`);
                lost.push(one.line);
                edges.add(`${quote(node)} -> ${quote(one.id)};`);
            }
            continue;
        }
        if (readerGroup(path) === null || path.endsWith('+server.ts')) continue;
        client.push([path, text]);
        for (const match of text.matchAll(/(\w+)\s*:\s*\(\)\s*=>\s*\(?\s*payload\(\s*'([^']+)'/g)) {
            accessors.set(match[1], match[2]);
        }
        for (const [name, channel] of namers(text)) clientNamed.set(name, channel);
    }
    for (const [path, text] of client) {
        const reads = readsOf(text, accessors, clientNamed);
        const node = readerNode(path);
        for (const { channel, subscribes } of reads.found) {
            place(readerGroup(path) ?? '', node);
            channels.set(channel, true);
            const style = subscribes ? ' [style=dashed]' : '';
            edges.add(`${quote(`ch ${channel}`)} -> ${quote(node)}${style};`);
        }
        for (const miss of reads.lost) {
            place(readerGroup(path) ?? '', node);
            const one = unfollowed(`src/${path}`, text, miss.at, miss.what);
            lost.push(one.line);
            edges.add(`${quote(one.id)} -> ${quote(node)};`);
        }
    }
    const lines = header('channels', 'rankdir=LR');
    const publishers = sorted([...groups.keys()].filter((key) => key.startsWith('publish ')));
    for (const group of publishers) {
        const nodes = sorted(groups.get(group) ?? []).map((node) => `${quote(node)};`);
        lines.push(...cluster(group, group.slice('publish '.length), nodes));
    }
    const channelNode = (/** @type {string} */ channel) =>
        `${quote(`ch ${channel}`)} [label=${quote(channel)}, shape=ellipse];`;
    lines.push(...cluster('channels', 'channels', sorted(channels.keys()).map(channelNode)));
    if (lost.length > 0) lines.push(...cluster('lost', UNPLACED, sorted(lost), 'dashed'));
    for (const group of [...CLIENT, 'routes']) {
        const nodes = sorted(groups.get(group) ?? []).map((node) => `${quote(node)};`);
        if (nodes.length > 0) lines.push(...cluster(`read ${group}`, group, nodes));
    }
    for (const edge of sorted(edges)) lines.push(`    ${edge}`);
    lines.push('}', '');
    return lines.join('\n');
}

// ---- The write chain ---------------------------------------------------------------------------

/**
 * The value names a module imports or re-exports, each with the module it comes from and the name
 * it has there. A type-only import is left out: nothing is called through it.
 *
 * @returns {Imports}
 */
function importsOf(
    /** @type {Sources} */ sources,
    /** @type {string} */ path,
    /** @type {string} */ text
) {
    const names = new Map();
    const spaces = new Map();
    const fs = new Set();
    const pattern =
        /(?:^|\n)\s*(import|export)\s+(type\s+)?(\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+'([^']+)'/g;
    for (const match of text.matchAll(pattern)) {
        if (match[2] !== undefined) continue;
        const spec = match[4];
        if (spec === 'node:fs' || spec === 'node:fs/promises') {
            for (const part of match[3].replace(/[{}]/g, '').split(',')) {
                const [name, alias] = part.trim().split(/\s+as\s+/);
                if (name !== '' && !name.startsWith('type ')) fs.add(`${alias ?? name}=${name}`);
            }
            continue;
        }
        const resolved = resolveSpec(path, spec);
        const file = resolved === null ? null : moduleFile(sources, resolved);
        if (file === null) continue;
        const space = /^\*\s+as\s+(\w+)$/.exec(match[3]);
        if (space !== null) {
            spaces.set(space[1], file);
            continue;
        }
        if (!match[3].startsWith('{')) {
            names.set(match[3], { from: file, name: 'default' });
            continue;
        }
        for (const part of match[3].slice(1, -1).split(',')) {
            const trimmed = part.trim();
            if (trimmed === '' || trimmed.startsWith('type ')) continue;
            const [name, alias] = trimmed.split(/\s+as\s+/);
            names.set(alias ?? name, { from: file, name });
        }
    }
    return { names, spaces, fs };
}

/**
 * A module's top-level declarations by name, each with its text. A declaration runs from its line,
 * which the formatter starts at column 0, to the next line that starts another one.
 */
export function declarations(/** @type {string} */ text) {
    const found = new Map();
    let name = '';
    let body = [];
    for (const line of text.split('\n')) {
        const starts =
            /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s*\*?|const|let|class)\s+(\w+)/.exec(
                line
            );
        if (starts !== null || /^[A-Za-z]/.test(line)) {
            if (name !== '') found.set(name, body.join('\n'));
            name = starts === null ? '' : starts[1];
            body = [];
        }
        body.push(line);
    }
    if (name !== '') found.set(name, body.join('\n'));
    return found;
}

/** The condition of every `if` of a body followed by a 4xx answer: how a refusal is written. */
function refusals(/** @type {string} */ body) {
    const found = [];
    for (const match of body.matchAll(/\bif\s*\(/g)) {
        let depth = 1;
        let at = match.index + match[0].length;
        while (at < body.length && depth > 0) {
            if (body[at] === '(') depth += 1;
            else if (body[at] === ')') depth -= 1;
            at += 1;
        }
        if (/^\s*\{?\s*return\s+json\(\s*4\d\d/.test(body.slice(at))) {
            found.push(body.slice(match.index + match[0].length, at - 1));
        }
    }
    return found;
}

/** The function names a text calls, a property call left out. */
function callsIn(/** @type {string} */ text) {
    const found = new Set();
    for (const match of text.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
        if (!KEYWORDS.has(match[1])) found.add(match[1]);
    }
    return found;
}

/** An import or re-export statement, however many lines it spans. */
const STATEMENT = /(?:^|\n)\s*(?:import|export)\s[^;]*?\sfrom\s*'[^']*';?/g;

/** A call the reader cannot follow: through a computed member, or a method of an imported value. */
const COMPUTED = /(?<![\w$.])([\w$]+(?:\.[\w$]+)*\[[^\]\n]*\])\s*\(/g;
const METHOD = /(?<![\w$.])([\w$]+)\.([\w$]+)\s*\(/g;

/** The group a module the trace reaches, and no path from which reaches the disk, is drawn in. */
const IDLE = 'reached, writes nothing';

/**
 * The write diagram: from the write route, every call that leaves a module, followed function by
 * function to the node:fs calls that change a file; a name referred to without a call (a dispatch
 * table, a callback) is followed too, drawn dotted. Modules on a path to the disk are grouped by
 * folder and every other module reached is in the dashed group IDLE. A call in a condition that
 * answers 4xx is a refusal, drawn dashed; an edge to the disk is labelled with its node:fs calls;
 * every other edge's tooltip, which renderSvg() makes its title, names the functions it calls.
 *
 * @param {Sources} sources
 * @param {string} [route]
 * @returns {string}
 */
export function writesDot(sources, route = WRITE_ROUTE) {
    if (!sources.has(route)) throw new Error(`the write route ${route} is not in the source`);
    /** @type {Map<string, { text: string, decls: Map<string, string>, imports: Imports }>} */
    const modules = new Map();
    const read = (/** @type {string} */ path) => {
        let held = modules.get(path);
        if (held === undefined) {
            const text = uncomment(sources.get(path) ?? '');
            held = { text, decls: declarations(text), imports: importsOf(sources, path, text) };
            modules.set(path, held);
            for (const match of text.matchAll(/(?:^|\n)\s*export\s+\*\s+from\s+'[^']+'/g)) {
                const one = unfollowed(`src/${path}`, text, match.index, match[0]);
                lost.push(one.line);
                edges.set(`${path}\n${one.id}\nlost`, new Set());
            }
        }
        return held;
    };
    /**
     * Where a name a module imports is declared, followed through re-exports.
     *
     * @param {string} path
     * @param {string} name
     * @returns {{ path: string, name: string }}
     */
    const origin = (path, name) => {
        for (let hop = 0; hop < 8; hop += 1) {
            const held = read(path);
            if (held.decls.has(name)) return { path, name };
            const via = held.imports.names.get(name);
            if (via === undefined) return { path, name };
            ({ from: path, name } = via);
        }
        return { path, name };
    };
    /** @type {Map<string, Set<string>>} Keyed `from\nto\nkind`: calls, refuses, refers or lost. */
    const edges = new Map();
    const touched = new Set([route]);
    /** @type {string[]} */
    const lost = [];
    const edge = (
        /** @type {string} */ from,
        /** @type {string} */ to,
        /** @type {string} */ name,
        kind = 'calls'
    ) => {
        const key = `${from}\n${to}\n${kind}`;
        edges.set(key, (edges.get(key) ?? new Set()).add(name));
        touched.add(to);
    };
    const seen = new Set();
    /** @type {[string, string | null][]} */
    const queue = [[route, null]];
    while (queue.length > 0) {
        const [path, fn] = /** @type {[string, string | null]} */ (queue.shift());
        const key = `${path}#${fn ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const held = read(path);
        const whole = held.text.replace(STATEMENT, (statement) => statement.replace(/[^\n]/g, ' '));
        const body = fn === null ? whole : (held.decls.get(fn) ?? '');
        const offset = fn === null ? 0 : held.text.indexOf(body);
        const refused = new Set(refusals(body).flatMap((condition) => [...callsIn(condition)]));
        const called = callsIn(body);
        const follow = (/** @type {string} */ name, /** @type {string} */ kind) => {
            const target = origin(path, name);
            if (target.path === path) return;
            edge(path, target.path, target.name, kind);
            queue.push([target.path, target.name]);
        };
        for (const name of called) {
            if (name === fn) continue;
            if (held.decls.has(name)) {
                queue.push([path, name]);
                continue;
            }
            const fsCall = [...held.imports.fs].find((pair) => pair.startsWith(`${name}=`));
            if (fsCall !== undefined) {
                const real = fsCall.split('=')[1];
                if (FS_WRITE.test(real)) edge(path, DISK, real);
                continue;
            }
            if (held.imports.names.has(name)) follow(name, refused.has(name) ? 'refuses' : 'calls');
        }
        for (const match of body.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*\()/g)) {
            const name = match[1];
            if (name === fn || called.has(name)) continue;
            if (held.decls.has(name)) queue.push([path, name]);
            else if (held.imports.names.has(name)) follow(name, 'refers');
        }
        for (const match of body.matchAll(METHOD)) {
            if (
                held.imports.fs.has(`${match[1]}=*`) ||
                held.imports.fs.has(`${match[1]}=${match[1]}`)
            ) {
                if (FS_WRITE.test(match[2])) edge(path, DISK, match[2]);
                continue;
            }
            const space = held.imports.spaces.get(match[1]);
            if (space !== undefined) {
                edge(path, space, match[2]);
                queue.push([space, match[2]]);
            } else if (held.imports.names.has(match[1])) {
                const one = unfollowed(`src/${path}`, held.text, offset + match.index, match[0]);
                lost.push(one.line);
                edges.set(`${path}\n${one.id}\nlost`, new Set());
            }
        }
        for (const match of body.matchAll(COMPUTED)) {
            const one = unfollowed(`src/${path}`, held.text, offset + match.index, match[0]);
            lost.push(one.line);
            edges.set(`${path}\n${one.id}\nlost`, new Set());
        }
    }
    const writing = reachesDisk(edges);
    /** @type {Map<string, string[]>} */
    const folders = new Map();
    for (const path of touched) {
        if (path === DISK || path.startsWith('? ')) continue;
        const folder = writing.has(path) ? posix.dirname(path) : IDLE;
        folders.set(folder, [...(folders.get(folder) ?? []), path]);
    }
    const lines = header('writes', 'rankdir=LR');
    for (const folder of sorted(folders.keys())) {
        const nodes = sorted(folders.get(folder) ?? []).map((path) => {
            const label = folder === IDLE ? path.replace(/^lib\//, '') : posix.basename(path);
            return `${quote(path)} [label=${quote(label)}];`;
        });
        lines.push(...cluster(folder, folder, nodes, folder === IDLE ? 'dashed' : 'solid'));
    }
    if (lost.length > 0) lines.push(...cluster('lost', UNPLACED, sorted(lost), 'dashed'));
    lines.push(`    ${quote(DISK)} [shape=cylinder];`);
    for (const key of sorted(edges.keys())) {
        const [from, to, kind] = key.split('\n');
        const names = wrap(sorted(edges.get(key) ?? []));
        const shown = kind === 'refuses' || to === DISK;
        const attrs = shown ? `label=${quote(names)}` : `tooltip=${quote(names)}`;
        const style = { calls: '', refuses: ', style=dashed', refers: ', style=dotted' }[kind];
        const line = kind === 'lost' ? '[style=dashed]' : `[${attrs}${style ?? ''}]`;
        lines.push(`    ${quote(from)} -> ${quote(to)} ${line};`);
    }
    lines.push('}', '');
    return lines.join('\n');
}

/**
 * Every module some chain of edges leads from to the disk.
 *
 * @param {Map<string, Set<string>>} edges Keyed `from\nto\nkind`.
 * @returns {Set<string>}
 */
function reachesDisk(edges) {
    const writing = new Set([DISK]);
    const pairs = [...edges.keys()].map((key) => key.split('\n'));
    for (let grew = true; grew;) {
        grew = false;
        for (const [from, to] of pairs) {
            if (writing.has(to) && !writing.has(from)) {
                writing.add(from);
                grew = true;
            }
        }
    }
    return writing;
}

/** Function names as a label, three to a line, so a busy edge stays narrow. */
function wrap(/** @type {string[]} */ names) {
    const rows = [];
    for (let at = 0; at < names.length; at += 3) rows.push(names.slice(at, at + 3).join(', '));
    return rows.join('\n');
}

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
    const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
