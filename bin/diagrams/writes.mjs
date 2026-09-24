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
    uncomment,
    unfollowed
} from './source.mjs';

/** The route the write chain starts at, relative to src. */
export const WRITE_ROUTE = 'routes/api/write/+server.ts';

/** The node every write that reaches the disk points at. */
const DISK = 'file on disk';

/** The node:fs calls that change a file, which is what makes a module's call a write to disk. */
const FS_WRITE = /^(?:appendFile|copyFile|mkdir|rename|rm|unlink|writeFile)(?:Sync)?$/;

/**
 * @typedef {import('./source.mjs').Sources} Sources
 * @typedef {{ from: string, name: string }} Origin Where an imported name comes from.
 * @typedef {{ names: Map<string, Origin>, spaces: Map<string, string>, fs: Set<string> }} Imports
 *     A module's value imports by local name, its namespace imports, and its node:fs names.
 * @typedef {{ text: string, decls: Map<string, string>, aliases: Map<string, string>,
 *     imports: Imports }} Module One module as the trace reads it: its uncommented text, its
 *     top-level declarations, the ones of them that are aliases, and its imports.
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
    /** @type {Map<string, Module>} */
    const modules = new Map();
    const read = (/** @type {string} */ path) => {
        let held = modules.get(path);
        if (held === undefined) {
            const text = uncomment(sources.get(path) ?? '');
            const decls = declarations(text);
            const aliases = new Map();
            for (const [name, declaration] of decls) {
                const target = moduleAlias(name, declaration);
                if (target !== undefined) aliases.set(name, target);
            }
            held = { text, decls, aliases, imports: importsOf(sources, path, text) };
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
    /**
     * Where the function a module calls by a name is declared: in the module, through an import
     * followed through re-exports, or as a member of a namespace import; null when it is none.
     *
     * @param {string} path
     * @param {string} name
     * @returns {{ path: string, name: string } | null}
     */
    const declaredAt = (path, name) => {
        const held = read(path);
        const dot = name.indexOf('.');
        if (dot > 0) {
            const space = held.imports.spaces.get(name.slice(0, dot));
            const member = name.slice(dot + 1);
            return space !== undefined && read(space).decls.has(member)
                ? { path: space, name: member }
                : null;
        }
        if (held.decls.has(name)) return { path, name };
        if (!held.imports.names.has(name)) return null;
        const target = origin(path, name);
        return read(target.path).decls.has(target.name) ? target : null;
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
        const held = read(path);
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
        const held = read(path);
        const whole = held.text.replace(STATEMENT, (statement) => statement.replace(/[^\n]/g, ' '));
        const body = fn === null ? whole : (held.decls.get(fn) ?? '');
        const offset = fn === null ? 0 : held.text.indexOf(body);
        const aliases = new Map([...held.aliases, ...aliasesIn(body)]);
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
            if (held.imports.names.has(name)) follow(name, refused.has(name) ? 'refuses' : 'calls');
        }
        for (const match of body.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*\()/g)) {
            const name = match[1];
            if (name === fn || called.has(name)) continue;
            if (held.decls.has(name)) queue.push([path, name]);
            else if (held.imports.names.has(name)) follow(name, 'refers');
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
