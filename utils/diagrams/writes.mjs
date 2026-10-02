// Layer 4, tool. The write diagram: from the write route to the file on disk, following the calls
// made inside the functions the route reaches.
//
// What the trace follows, function by function: a call by name to a function of the module or to
// an imported one, followed through re-exports; a call of a member of a namespace import or of
// node:fs; a name referred to without a call (a dispatch table, a callback), drawn dotted; a call
// through an alias, a name the text binds to another name or to one member of one (calls.mjs says
// which bindings count); and a function passed by name as an argument to a function, of the same
// module, an imported one or a member of a namespace import, that calls that parameter: by its
// name, through an alias, or by passing it on to another function that does, in any module.
//
// What it cannot follow, and why. A call through a computed member (`HANDLERS[kind]()`) and a call
// of a method of an imported value are drawn in the group of what is not placed, with their file
// and line: which function runs depends on a key or on the value's contents at run time. A name
// that holds a function only by a branch, a second assignment or the answer of a call is left out
// for the same reason, and so is a function passed to a function the reader cannot place, such as
// one reached through a computed member.

import { posix } from 'node:path';
import ts from 'typescript';
import { arrowsAlong, labelledEdge } from './labels.mjs';
import { parseReader } from './parsed.mjs';
import {
    BARE,
    aliasesIn,
    callSites,
    callsIn,
    listAt,
    moduleAlias,
    parametersOf,
    unalias
} from './calls.mjs';
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

/** The route the write chain starts at, relative to src. */
export const WRITE_ROUTE = 'routes/api/write/+server.ts';

/** The node every write that reaches the disk points at. */
const DISK = 'file on disk';

/** The node:fs calls that change a file, which is what makes a module's call a write to disk. */
const FS_WRITE = /^(?:appendFile|copyFile|mkdir|rename|rm|unlink|writeFile)(?:Sync)?$/;

/**
 * @typedef {import('./source.mjs').Sources} Sources
 * @typedef {import('./parsed.mjs').Reader} Reader
 * @typedef {{ from: string, name: string }} Origin Where an imported name comes from.
 * @typedef {{ names: Map<string, Origin>, spaces: Map<string, string>, fs: Set<string> }} Imports
 *     A module's value imports by local name, its namespace imports, and its node:fs names.
 * @typedef {{ text: string, decls: Map<string, string>, aliases: Map<string, string>,
 *     imports: Imports }} Module One module as the trace reads it: its text as codeOf() gives
 *     it, its top-level declarations, the ones of them that are aliases, and its imports.
 */

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
    /** @type {string} */ text,
    /** @type {Reader} */ read
) {
    const names = new Map();
    const spaces = new Map();
    const fs = new Set();
    for (const one of read.imports(path, text)) {
        if (one.typeOnly || one.bindings === undefined || one.spec === null) continue;
        const { spec, bindings } = one;
        if (spec === 'node:fs' || spec === 'node:fs/promises') {
            // A namespace or a default import of node:fs is the module itself, written `<name>=*`.
            if (bindings.namespace !== null) fs.add(`${bindings.namespace}=*`);
            for (const { local, imported } of bindings.names) {
                fs.add(`${local}=${imported === 'default' ? '*' : imported}`);
            }
            continue;
        }
        const resolved = resolveSpec(path, spec);
        const file = resolved === null ? null : moduleFile(sources, resolved);
        if (file === null) continue;
        if (bindings.namespace !== null) spaces.set(bindings.namespace, file);
        for (const { local, imported } of bindings.names) {
            names.set(local, { from: file, name: imported });
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

/** The text from an opening bracket at `at` to its matching close, the brackets left out. */
function bracketed(/** @type {string} */ text, /** @type {number} */ at) {
    let depth = 1;
    let end = at + 1;
    while (end < text.length && depth > 0) {
        if (text[end] === '(') depth += 1;
        else if (text[end] === ')') depth -= 1;
        end += 1;
    }
    return text.slice(at + 1, end - 1);
}

/** What follows the first comma of an argument list that no bracket holds, or nothing. */
function secondArgument(/** @type {string} */ args) {
    let depth = 0;
    for (let at = 0; at < args.length; at += 1) {
        if ('([{'.includes(args[at])) depth += 1;
        else if (')]}'.includes(args[at])) depth -= 1;
        else if (args[at] === ',' && depth === 0) return args.slice(at + 1);
    }
    return '';
}

/**
 * The calls a refusal of a body makes, as the text they are written in: the condition of every
 * `if` followed by a 4xx answer (`return json(body, { status: 4xx })`), and the call whose answer
 * is handed back when it is a Response (`const read = await tokenedBody(...)` then `if (read
 * instanceof Response) return read`), since that call is the check that refused.
 */
function refusals(/** @type {string} */ body) {
    const found = [];
    for (const match of body.matchAll(/\bif\s*\(/g)) {
        const condition = bracketed(body, match.index + match[0].length - 1);
        const after = body.slice(match.index + match[0].length + condition.length + 1);
        const answer = /^\s*\{?\s*return\s+json\(/.exec(after);
        if (answer !== null) {
            const options = secondArgument(bracketed(after, answer[0].length - 1));
            if (/\bstatus:\s*4\d\d\b/.test(options)) found.push(condition);
            continue;
        }
        const handed = /^\s*([\w$]+)\s+instanceof\s+Response\s*$/.exec(condition);
        if (
            handed === null ||
            !new RegExp(`^\\s*\\{?\\s*return\\s+${handed[1]}\\s*;`).test(after)
        ) {
            continue;
        }
        const made = new RegExp(
            `(?:const|let)\\s+${handed[1]}\\s*=\\s*(?:await\\s+)?([\\w$.]+\\s*\\()`
        ).exec(body);
        if (made !== null) {
            const open = made.index + made[0].length - 1;
            found.push(`${made[1]}${bracketed(body, open)})`);
        }
    }
    return found;
}

/** An import or re-export statement, however many lines it spans. */
const STATEMENT = /(?:^|\n)\s*(?:import|export)\s[^;]*?\sfrom\s*'[^']*';?/g;

/**
 * The names a body declares for itself: each variable, destructured one included, each parameter,
 * and each function and class it names, read from the body's syntax tree.
 *
 * @param {string} body
 * @returns {Set<string>}
 */
function localsOf(body) {
    const names = new Set();
    /** @param {ts.BindingName} name */
    const bind = (name) => {
        if (ts.isIdentifier(name)) names.add(name.text);
        else
            for (const element of name.elements)
                if (!ts.isOmittedExpression(element)) bind(element.name);
    };
    /** @param {ts.Node} node */
    const walk = (node) => {
        if (ts.isVariableDeclaration(node) || ts.isParameter(node)) bind(node.name);
        else if (
            (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
            node.name !== undefined
        )
            names.add(node.name.text);
        ts.forEachChild(node, walk);
    };
    walk(ts.createSourceFile('body.ts', body, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS));
    return names;
}

/** A call the reader cannot follow: through a computed member, or a method of an imported value. */
const COMPUTED = /(?<![\w$.])([\w$]+(?:\.[\w$]+)*\[[^\]\n]*\])\s*\(/g;
const METHOD = /(?<![\w$.])([\w$]+)\.([\w$]+)\s*\(/g;

/**
 * The write diagram: from the write route, every call that leaves a module, followed function by
 * function to the node:fs calls that change a file; a name referred to without a call (a dispatch
 * table, a callback) is followed too, drawn dotted. A module on a path to the disk, or to a call
 * the reader cannot follow (which may write), is drawn, grouped by folder, and so is a module a
 * refusal of one of them calls; a module the trace reaches that is none of these is left out, with
 * its edges. A call in a condition that answers 4xx is a refusal, drawn dashed; an edge to the disk
 * is labelled with its node:fs calls; every other edge's tooltip, which renderSvg() makes its
 * title, names the functions it calls. A plain arrow `ports` names (`from->to`) carries the port
 * attribute given, a `tailport=` or a `headport=`, which writesDrawn() chooses.
 *
 * @param {Sources} sources
 * @param {string} [route]
 * @param {Map<string, string>} [ports]
 * @param {Reader} [read] The parse of each file, shared with the other diagrams of a generation.
 * @returns {string}
 */
export function writesDot(sources, route = WRITE_ROUTE, ports = new Map(), read = parseReader()) {
    if (!sources.has(route)) throw new Error(`the write route ${route} is not in the source`);
    /** @type {Map<string, Module>} */
    const modules = new Map();
    const load = (/** @type {string} */ path) => {
        let held = modules.get(path);
        if (held === undefined) {
            const text = read.code(path, sources.get(path) ?? '');
            const decls = declarations(text);
            const aliases = new Map();
            for (const [name, declaration] of decls) {
                const target = moduleAlias(name, declaration);
                if (target !== undefined) aliases.set(name, target);
            }
            const raw = sources.get(path) ?? '';
            held = { text, decls, aliases, imports: importsOf(sources, path, raw, read) };
            modules.set(path, held);
            for (const whole of read.imports(path, raw)) {
                if (whole.whole !== true || whole.typeOnly) continue;
                const what = `export * from '${whole.spec ?? ''}'`;
                const one = unfollowedAt(`src/${path}`, whole.line, what);
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
            const held = load(path);
            if (held.decls.has(name)) return { path, name };
            const via = held.imports.names.get(name);
            if (via === undefined) return { path, name };
            ({ from: path, name } = via);
        }
        return { path, name };
    };
    /**
     * Where the function a module calls by a name is declared: in the module, through an import
     * followed through re-exports, or as a member of a namespace import; null when it is none.
     *
     * @param {string} path
     * @param {string} name
     * @returns {{ path: string, name: string } | null}
     */
    const declaredAt = (path, name) => {
        const held = load(path);
        const dot = name.indexOf('.');
        if (dot > 0) {
            const space = held.imports.spaces.get(name.slice(0, dot));
            const member = name.slice(dot + 1);
            return space !== undefined && load(space).decls.has(member)
                ? { path: space, name: member }
                : null;
        }
        if (held.decls.has(name)) return { path, name };
        if (!held.imports.names.has(name)) return null;
        const target = origin(path, name);
        return load(target.path).decls.has(target.name) ? target : null;
    };
    /**
     * Every call a text makes whose callee is a bare name or a member of a name (`lock.run(`), each
     * with the name as written and where its opening parenthesis is.
     *
     * @param {string} text
     * @returns {{ name: string, at: number, open: number }[]}
     */
    const sitesOf = (text) => [
        ...callSites(text),
        ...[...text.matchAll(METHOD)].map((match) => ({
            name: `${match[1]}.${match[2]}`,
            at: match.index,
            open: match.index + match[0].length - 1
        }))
    ];
    /**
     * Whether the function `fn` of a module calls its parameter at `index`: by its name, through an
     * alias of it, or by passing it on to a function, of this module or another, that does.
     *
     * @param {string} path
     * @param {string} fn
     * @param {number} index
     * @returns {boolean}
     */
    const callsParameter = (path, fn, index, seen = new Set()) => {
        const key = `${path}#${fn}#${index}`;
        if (seen.has(key)) return false;
        seen.add(key);
        const held = load(path);
        const text = held.decls.get(fn) ?? '';
        const parameter = parametersOf(text, fn).at(index) ?? '';
        if (parameter === '') return false;
        const aliases = new Map([...held.aliases, ...aliasesIn(text)]);
        for (const site of sitesOf(text)) {
            if (site.name === fn) continue;
            const callee = unalias(site.name, aliases);
            if (callee === parameter) return true;
            const target = declaredAt(path, callee);
            if (target === null) continue;
            for (const [at, argument] of listAt(text, site.open).entries()) {
                if (unalias(argument, aliases) !== parameter) continue;
                if (callsParameter(target.path, target.name, at, seen)) return true;
            }
        }
        return false;
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
        const held = load(path);
        const whole = held.text.replace(STATEMENT, (statement) => statement.replace(/[^\n]/g, ' '));
        const body = fn === null ? whole : (held.decls.get(fn) ?? '');
        const offset = fn === null ? 0 : held.text.indexOf(body);
        const aliases = new Map([...held.aliases, ...aliasesIn(body)]);
        // A name the body declares for itself is that local, so it is no call or reference of an
        // import of the same name.
        const locals = localsOf(body);
        const named = (/** @type {string} */ name) => unalias(name, aliases);
        const refused = new Set(
            refusals(body).flatMap((condition) => [...callsIn(condition)].map(named))
        );
        /** @type {Map<string, { at: number, written: string }>} What runs, by the name it has. */
        const called = new Map();
        const call = (/** @type {string} */ name, /** @type {number} */ at, written = '') => {
            if (!called.has(name)) called.set(name, { at, written });
        };
        for (const site of sitesOf(body)) {
            if (site.name === fn) continue;
            const callee = named(site.name);
            if (!site.name.includes('.')) call(callee, site.at, `${site.name}(`);
            const target = declaredAt(path, callee);
            if (target === null) continue;
            // A name passed to a function that calls that parameter is called here.
            for (const [at, argument] of listAt(body, site.open).entries()) {
                if (!BARE.test(argument) || !callsParameter(target.path, target.name, at)) continue;
                call(named(argument), site.at, `${site.name}(`);
            }
        }
        // A module-level alias reached by its name runs what it names.
        const aliased = fn === null ? undefined : held.aliases.get(fn);
        if (aliased !== undefined) call(unalias(aliased, held.aliases), 0);
        const follow = (/** @type {string} */ name, /** @type {string} */ kind) => {
            const target = origin(path, name);
            if (target.path === path) return;
            edge(path, target.path, target.name, kind);
            queue.push([target.path, target.name]);
        };
        /** A call of one member of a name, `fs.writeFileSync(` or `store.save(`. */
        const member = (
            /** @type {string} */ owner,
            /** @type {string} */ name,
            /** @type {number} */ at,
            /** @type {string} */ written
        ) => {
            if (held.imports.fs.has(`${owner}=*`) || held.imports.fs.has(`${owner}=${owner}`)) {
                if (FS_WRITE.test(name)) edge(path, DISK, name);
                return;
            }
            const space = held.imports.spaces.get(owner);
            if (space !== undefined) {
                edge(path, space, name);
                queue.push([space, name]);
            } else if (held.imports.names.has(owner)) {
                const one = unfollowed(`src/${path}`, held.text, offset + at, written);
                lost.push(one.line);
                edges.set(`${path}\n${one.id}\nlost`, new Set());
            }
        };
        for (const [name, { at, written }] of called) {
            if (held.decls.has(name)) {
                queue.push([path, name]);
                continue;
            }
            const dot = name.indexOf('.');
            if (dot > 0) {
                member(name.slice(0, dot), name.slice(dot + 1), at, written);
                continue;
            }
            const fsCall = [...held.imports.fs].find((pair) => pair.startsWith(`${name}=`));
            if (fsCall !== undefined) {
                const real = fsCall.split('=')[1];
                if (FS_WRITE.test(real)) edge(path, DISK, real);
                continue;
            }
            if (held.imports.names.has(name) && !locals.has(name)) {
                follow(name, refused.has(name) ? 'refuses' : 'calls');
            }
        }
        for (const match of body.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*\()/g)) {
            const name = match[1];
            if (name === fn || called.has(name)) continue;
            if (held.decls.has(name)) queue.push([path, name]);
            else if (held.imports.names.has(name) && !locals.has(name)) follow(name, 'refers');
        }
        for (const match of body.matchAll(METHOD)) {
            member(match[1], match[2], match.index, match[0]);
        }
        for (const match of body.matchAll(COMPUTED)) {
            const one = unfollowed(`src/${path}`, held.text, offset + match.index, match[0]);
            lost.push(one.line);
            edges.set(`${path}\n${one.id}\nlost`, new Set());
        }
    }
    const writing = reachesDisk(edges);
    // A check a refusal calls writes nothing and is drawn all the same: the refusals are how a
    // write is turned away before it reaches the disk.
    for (const key of edges.keys()) {
        const [from, to, kind] = key.split('\n');
        if (kind === 'refuses' && writing.has(from)) writing.add(to);
    }
    /** @type {Map<string, string[]>} */
    const folders = new Map();
    for (const path of touched) {
        if (path === DISK || path.startsWith('? ') || !writing.has(path)) continue;
        const folder = posix.dirname(path);
        folders.set(folder, [...(folders.get(folder) ?? []), path]);
    }
    const lines = header('writes', 'rankdir=LR', RANKSEP);
    for (const folder of sorted(folders.keys())) {
        const nodes = sorted(folders.get(folder) ?? []).map(
            (path) => `${quote(path)} [label=${quote(posix.basename(path))}];`
        );
        lines.push(...cluster(folder, folder, nodes));
    }
    const kept = lost.filter((line) => writing.has(/^"((?:[^"\\]|\\.)*)"/.exec(line)?.[1] ?? ''));
    if (kept.length > 0) lines.push(...cluster('lost', UNPLACED, sorted(kept), 'dashed'));
    lines.push(`    ${quote(DISK)} [shape=cylinder];`);
    for (const key of sorted(edges.keys())) {
        const [from, to, kind] = key.split('\n');
        if (!writing.has(from) || !writing.has(to)) continue;
        const names = wrap(sorted(edges.get(key) ?? []));
        const shown = kind === 'refuses' || to === DISK;
        const style = { calls: '', refuses: 'style=dashed', refers: 'style=dotted' }[kind] ?? '';
        if (kind === 'lost') {
            lines.push(`    ${quote(from)} -> ${quote(to)} [style=dashed];`);
        } else if (shown) {
            lines.push(...labelledEdge(from, to, names, style, kind));
        } else {
            const attrs = [
                ports.get(`${from}->${to}`) ?? '',
                `tooltip=${quote(names)}`,
                style
            ].filter((one) => one !== '');
            lines.push(`    ${quote(from)} -> ${quote(to)} [${attrs.join(', ')}];`);
        }
    }
    lines.push('}', '');
    return lines.join('\n');
}

/**
 * The rank separation of the write diagram, in inches: wider than the other diagrams' 0.5, so the
 * calls from one module into a folder several ranks on have room to part before they reach it.
 */
const RANKSEP = 0.8;

/**
 * The port attributes writesDrawn() tries, in order, for a plain arrow that runs along another
 * arrow: first the tail ports beside the east side a left-to-right arrow leaves by, then the head
 * ports beside the west side it arrives by, which part the arrows that reach one module together.
 */
export const PORTS = [
    'tailport=se',
    'tailport=s',
    'tailport=ne',
    'tailport=n',
    'headport=nw',
    'headport=sw'
];

/**
 * The write diagram drawn, with no two arrows running along each other where a port can part
 * them: while arrowsAlong() names a pair, the later plain arrow of the pair (by name) is given the
 * next port of PORTS and the diagram is drawn again. A plain arrow joins two modules directly;
 * an arrow drawn through its words or its calls is not one, so a pair of a plain arrow and another
 * kind is parted by the plain one. The pair may leave one module or reach one: two arrows from one
 * module leave it at one point and two arrows into one module reach it at one point, and when their
 * heads lie in one direction the router lays them together for as long as they head that way,
 * which a tail port parts at the module they leave and a head port at the module they reach. It
 * stops when no pair is left whose plain arrow has a port it has not tried, so what it cannot part
 * stays for the check to name.
 *
 * @param {Sources} sources
 * @param {(dot: string) => string} draw The renderer, DOT to SVG.
 * @param {string} [route]
 * @param {Reader} [read] The parse of each file, read by every round of the search.
 * @returns {{ dot: string, svg: string }}
 */
export function writesDrawn(sources, draw, route = WRITE_ROUTE, read = parseReader()) {
    /** @type {Map<string, string>} */
    const ports = new Map();
    /** The index in PORTS of the port the arrow takes next; PORTS.length when it has tried all. */
    const nextPort = (/** @type {string} */ arrow) => PORTS.indexOf(ports.get(arrow) ?? '') + 1;
    for (;;) {
        const dot = writesDot(sources, route, ports, read);
        const svg = draw(dot);
        const arrow = arrowsAlong(svg)
            .map((line) => /^(.*) along (.*) for \d+$/.exec(line)?.slice(1) ?? [])
            .map((pair) => pair.reverse().find((one) => !one.includes(' to ')))
            .find((one) => one !== undefined && nextPort(one) < PORTS.length);
        if (arrow === undefined) return { dot, svg };
        ports.set(arrow, PORTS[nextPort(arrow)]);
    }
}

/**
 * The disk, every call the reader could not follow, and every module some chain of edges leads from
 * to either: a call that could not be followed may be a write, so the module making it is drawn.
 *
 * @param {Map<string, Set<string>>} edges Keyed `from\nto\nkind`.
 * @returns {Set<string>}
 */
function reachesDisk(edges) {
    const pairs = [...edges.keys()].map((key) => key.split('\n'));
    const writing = new Set([
        DISK,
        ...pairs.filter((pair) => pair[2] === 'lost').map((pair) => pair[1])
    ]);
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
