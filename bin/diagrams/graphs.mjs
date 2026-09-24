// Layer 4, tool. The two diagrams read from imports and channels: the layers and the imports that
// join them, grouped by the layer rows tests/checks/tree/boundaries.test.ts names, and the channels
// from the server module that publishes each to the client modules that read it.

import {
    IMPORT,
    UNPLACED,
    cluster,
    header,
    quote,
    resolveSpec,
    sorted,
    uncomment,
    unfollowed
} from './source.mjs';

/**
 * @typedef {import('./source.mjs').Sources} Sources
 * @typedef {{ channel: string, subscribes: boolean }} Read One channel a client module reads.
 */

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
