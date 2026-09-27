// Layer 4, tool. The diagrams read from imports and channels: the layers and the runtime imports
// that join them, the layers as tests/checks/tree/boundaries.test.ts names its rows; one diagram
// per layer of its folders in the order tests/checks/imports/order.ts declares; and the channels
// from the server module that publishes each to the client modules that read it.

import { posix } from 'node:path';
import { halves, labelledEdge, wordNode } from './labels.mjs';
import { parseReader } from './parsed.mjs';
import {
    UNPLACED,
    cluster,
    header,
    moduleFile,
    quote,
    resolveSpec,
    sorted,
    unfollowed,
    unfollowedAt
} from './source.mjs';

/**
 * @typedef {import('./source.mjs').Sources} Sources
 * @typedef {import('./parsed.mjs').Reader} Reader
 * @typedef {{ channel: string, subscribes: boolean }} Read One channel a client module reads.
 */

// ---- The layer graphs --------------------------------------------------------------------------

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
 * The folder a module sits in for the folder order of tests/checks/imports/order.ts: its layer and
 * first sub-folder under lib, or the layer alone for a file that sits in it; null outside lib.
 */
export function folderOf(/** @type {string} */ path) {
    const parts = path.split('/');
    if (parts[0] !== 'lib' || parts.length < 3) return null;
    return parts.length > 3 ? `${parts[1]}/${parts[2]}` : parts[1];
}

/**
 * @typedef {{ id: string, line: string, from: string | null }} Lost An import no reader can
 *     follow: its node id, its node line naming the file and line, and the end of the module that
 *     makes it (null where `end` draws that module as nothing).
 */

/**
 * @typedef {{ edges: Map<string, number>, lost: Lost[] }} Imports The runtime imports of the
 *     source, counted per pair of ends (`from\nto`, each end what `end` makes of a module), and
 *     every import it could not follow.
 */

/**
 * The folder the Node adapter writes the built app to, as a path from src: the routes compiled into
 * one handler, which the Node entry loads by a URL it builds rather than by a specifier.
 */
const BUILT = '../build/';

/**
 * Every runtime import of the source, one per importing module and module imported, as
 * imports.mjs's importsOf() parses them, the reader the checks call, so a statement opening
 * `import type` or `export type` is no runtime import and a comment holds none. They are counted
 * per pair of ends. A glob counts as one import of the folder its pattern opens with. An
 * `import()` of a name bound to a URL of a literal path is an import of that path, and one of the
 * built app under BUILT an import of the routes it is built from. An import two ends that are one
 * end joins is not counted, and an `import()` whose specifier could not be read is named with its
 * file and line.
 *
 * @param {Sources} sources
 * @param {(path: string) => string | null} end What a module is drawn as, or null for not at all.
 * @param {Reader} [read] The parse of each file, shared with the other diagrams of a generation.
 * @returns {Imports}
 */
export function runtimeImports(sources, end, read = parseReader()) {
    /** @type {Map<string, number>} */
    const edges = new Map();
    /** @type {Lost[]} */
    const lost = [];
    const pairs = new Set();
    /** @param {string} from @param {string} to @param {string} path */
    const count = (from, to, path) => {
        const a = end(from);
        const b = end(to);
        if (a === null || b === null || a === b || pairs.has(`${from}\n${path}`)) return;
        pairs.add(`${from}\n${path}`);
        edges.set(`${a}\n${b}`, (edges.get(`${a}\n${b}`) ?? 0) + 1);
    };
    /** @param {string} path @param {string} spec */
    const follow = (path, spec) => {
        const target = resolveSpec(path, spec);
        if (target !== null) {
            const module = moduleFile(sources, target) ?? target;
            count(path, module, module);
            return true;
        }
        if (!spec.startsWith('.')) return false;
        const joined = posix.normalize(posix.join(posix.dirname(path), spec));
        if (!joined.startsWith(BUILT)) return false;
        count(path, 'routes', joined);
        return true;
    };
    for (const [path, text] of sources) {
        for (const one of read.imports(path, text)) {
            if (one.typeOnly) continue;
            if (one.glob === true && one.spec !== null) {
                const folder = resolveSpec(path, one.spec.replace(/\/[^/]*$/, ''));
                if (folder !== null) count(path, folder, `glob ${folder}`);
            } else if (one.spec !== null) {
                follow(path, one.spec);
            } else {
                const lostOne = unfollowedAt(`src/${path}`, one.line, `import(${one.argument})`);
                lost.push({ ...lostOne, from: end(path) });
            }
        }
    }
    return { edges, lost };
}

/**
 * The overview: one node per layer that imports or is imported (the server's transcripts row drawn
 * with the server), routes as one node and the entry modules directly under src (the Node entry,
 * the hooks) as one node named entry, and one arrow per ordered pair of them that imports,
 * labelled with how many runtime imports it carries. The entry's load of the built app is its
 * arrow to routes. A file outside every layer that is no module (the favicon a page links to) is
 * drawn as a node named by its folder under lib, as `assets`. A module no layer row places is
 * drawn, only when an import joins it, in the dashed group of what is not placed. An import the
 * reader cannot follow is a dashed node naming its file and line, with a dashed arrow from the node
 * of the module that makes it.
 *
 * @param {Sources} sources
 * @param {string[]} layers
 * @param {Reader} [read] The parse of each file, shared with the other diagrams of a generation.
 * @returns {string}
 */
export function layersDot(sources, layers, read = parseReader()) {
    const astrayPrefix = `${UNPLACED}: `;
    const filePrefix = 'files: ';
    /** @param {string} path */
    const end = (path) => {
        const { layer } = placeOf(path, layers);
        if (layer !== UNPLACED) return layer.split('/')[0];
        const folder = path.split('/')[1];
        if (!sources.has(path) && !/\.(ts|js|svelte)$/.test(path)) return `${filePrefix}${folder}`;
        return `${astrayPrefix}${folder}`;
    };
    const { edges, lost: unread } = runtimeImports(sources, end, read);
    const lost = unread.filter((one) => one.from !== null);
    const joined = [...edges.keys()].flatMap((key) => key.split('\n'));
    const nodes = new Set([...joined, ...lost.map((one) => String(one.from))]);
    const lines = header('layers', 'rankdir=TB, newrank=true');
    const order = [...new Set(layers.map((layer) => layer.split('/')[0])), 'routes'];
    for (const node of order.filter((one) => nodes.has(one))) lines.push(`    ${quote(node)};`);
    if (nodes.has('src')) lines.push(`    ${quote('src')} [label=${quote('entry')}];`);
    for (const node of sorted([...nodes].filter((one) => one.startsWith(filePrefix)))) {
        lines.push(`    ${quote(node)} [label=${quote(node.slice(filePrefix.length))}];`);
    }
    const astray = sorted([...nodes].filter((node) => node.startsWith(astrayPrefix)));
    if (astray.length > 0) {
        const label = (/** @type {string} */ node) => quote(node.slice(astrayPrefix.length));
        const held = astray.map((node) => `${quote(node)} [label=${label(node)}];`);
        lines.push(...cluster(UNPLACED, UNPLACED, held, 'dashed'));
    }
    for (const one of sorted(lost.map((held) => held.line))) {
        lines.push(`    ${one.replace(/\];$/, ', style=dashed];')}`);
    }
    for (const key of sorted(edges.keys())) {
        const [from, to] = key.split('\n');
        lines.push(...labelledEdge(from, to, String(edges.get(key))));
    }
    for (const one of [...lost].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
        lines.push(`    ${quote(String(one.from))} -> ${quote(one.id)} [style=dashed];`);
    }
    lines.push('}', '');
    return lines.join('\n');
}

/**
 * One layer's diagram: its folders in the order tests/checks/imports/order.ts declares, top to
 * bottom, the imports between them, and for each folder one arrow to every other layer it reaches,
 * each arrow labelled with how many runtime imports it carries.
 *
 * The count of an arrow between two folders is declared inside the layer's cluster, so the arrow
 * stays inside the layer's box, and stands on the free rank under the folder row halfway between
 * its two ends, so it reads at the middle of its arrow. Each folder takes one rank per arrow it
 * sends out of the layer (at least one), and a free rank below them that only counts use. An arrow
 * into another layer ends at a dashed box of that layer drawn for its folder alone, in a column of
 * that layer's boxes to the right of the layer: the first beside the folder on its rank, each
 * further one a rank lower, its count inside the layer's box beside the folder. No two folders'
 * arrows meet at one box, so no two run along each other into it, and each count stands on its own
 * folder's row.
 *
 * @param {Sources} sources
 * @param {string[]} layers
 * @param {string} layer
 * @param {string[]} order The layer's folders from the top down.
 * @param {Reader} [read] The parse of each file, shared with the other diagrams of a generation.
 * @returns {string}
 */
export function layerDot(sources, layers, layer, order, read = parseReader()) {
    /** @param {string} path */
    const end = (path) => {
        const folder = folderOf(path);
        if (folder !== null && folder.split('/')[0] === layer) return `folder ${folder}`;
        const { layer: row } = placeOf(path, layers);
        return row === UNPLACED ? null : `layer ${row.split('/')[0]}`;
    };
    const { edges } = runtimeImports(sources, end, read);
    const place = (/** @type {string} */ key) => order.indexOf(key.split('\n')[0].slice(7));
    const keys = sorted(edges.keys())
        .filter((key) => key.startsWith('folder '))
        .sort((a, b) => place(a) - place(b));
    /** @type {Map<string, string[]>} Each folder's arrows into other layers, in drawing order. */
    const outs = new Map();
    for (const key of keys.filter((one) => one.split('\n')[1].startsWith('layer '))) {
        const [from] = key.split('\n');
        outs.set(from, [...(outs.get(from) ?? []), key]);
    }
    const rows = (/** @type {string} */ folder) => Math.max(1, outs.get(folder)?.length ?? 0);
    /** @type {Map<string, number>} The rank each folder's row starts on, from the top. */
    const starts = new Map();
    for (let at = 0, rank = 0; at < order.length; at += 1) {
        const folder = `folder ${order[at]}`;
        starts.set(folder, rank);
        rank += rows(folder) + 1;
    }
    /**
     * How many ranks below its folder the count of an arrow between two folders stands: on the
     * free rank under the middle folder row of the rows the arrow spans, the upper of the two where
     * two are as near the middle, so the count sits halfway along its arrow; an arrow the order
     * does not run downward keeps it under its own folder.
     */
    const drop = (/** @type {string} */ from, /** @type {string} */ to) => {
        const [first, last] = [from, to].map((one) => order.indexOf(one.slice('folder '.length)));
        const middle = `folder ${order[first + Math.floor((last - 1 - first) / 2)]}`;
        const below = last > first ? middle : from;
        return (starts.get(below) ?? 0) + rows(below) - (starts.get(from) ?? 0);
    };
    const inside = order.map((folder) => `${quote(`folder ${folder}`)} [label=${quote(folder)}];`);
    const boxes = [];
    const arrows = [];
    for (const key of keys) {
        const [from, to] = key.split('\n');
        const node = wordNode(from, to, String(edges.get(key)));
        inside.push(node.line);
        if (!to.startsWith('layer ')) {
            arrows.push(...halves(from, node.id, to, '', `minlen=${drop(from, to)}, weight=10`));
            continue;
        }
        const row = (outs.get(from) ?? []).indexOf(key);
        const box = `${to} from ${from}`;
        boxes.push(`    ${quote(box)} [label=${quote(to.slice('layer '.length))}, style=dashed];`);
        const first = row === 0 ? '' : `minlen=${row}, weight=10`;
        arrows.push(...halves(from, node.id, box, 'style=dashed', first));
        const same = row === 0 ? [from, node.id, box] : [node.id, box];
        arrows.push(`    { rank=same; ${same.map(quote).join('; ')}; }`);
    }
    const lines = header(`layer_${layer}`, 'rankdir=TB, newrank=true');
    lines.push(...cluster(layer, layer, inside), ...boxes);
    for (let at = 1; at < order.length; at += 1) {
        const [above, below] = [order[at - 1], order[at]].map((one) => `folder ${one}`);
        const gap = rows(above) + 1;
        lines.push(
            `    ${quote(above)} -> ${quote(below)} [style=invis, weight=10, minlen=${gap}];`
        );
    }
    lines.push(...arrows, '}', '');
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
 * @param {Reader} [read] The parse of each file, shared with the other diagrams of a generation.
 * @returns {string}
 */
export function channelsDot(sources, read = parseReader()) {
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
        const text = read.code(path, raw);
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
