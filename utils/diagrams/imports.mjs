// Layer 4, tool. The one reader of a module's imports, which the import checks under
// tests/checks/imports/ and the diagrams of utils/diagrams/ both call, so the two cannot read a
// module apart.
//
// A module is read by the parsers the project already builds with, never by a pattern over its
// text: a TypeScript or JavaScript module by the TypeScript compiler's own parse, and a component
// by svelte/compiler's parse, whose instance and module scripts go through the same TypeScript
// walk and whose markup is walked for the `import()` expressions a template may hold. A comment
// is therefore never read as code, an HTML comment holding a script block is no script, and a
// string, a template or a regular expression holding a quote or a `//` hides nothing after it.
//
// It is plain JavaScript so that `npm run diagrams` runs under Node with no TypeScript loader.

import ts from 'typescript';
import { parse } from 'svelte/compiler';

/**
 * @typedef {object} Import One import a module makes.
 * @property {string | null} spec The specifier as written; null for an `import()` whose argument
 *     is no literal and no name bound to a URL of one.
 * @property {number} line The line it is written on, from 1.
 * @property {boolean} typeOnly A statement opening `import type` or `export type`, or an
 *     `import('...')` in a type, which leaves nothing behind in the compiled module.
 * @property {boolean} dynamic An `import()` call.
 * @property {boolean} [viaUrl] The specifier was read off a name bound to
 *     `new URL('<path>', import.meta.url)`, as the Node entry loads the built app.
 * @property {string} [argument] The argument of an `import()` call as written, for one whose
 *     specifier could not be read.
 * @property {Bindings} [bindings] The value names a static import or re-export binds.
 * @property {boolean} [whole] An `export * from` statement, which re-exports every name of the
 *     module it names.
 * @property {boolean} [glob] An `import.meta.glob('<pattern>')` call, its pattern as the spec,
 *     which the bundler turns into one import of each module the pattern matches.
 */

/**
 * @typedef {object} Bindings The value names one statement binds, a type-only name left out.
 * @property {{ local: string, imported: string }[]} names Each name by the name it has here and
 *     the name it has in the module it comes from (`default` for a default import).
 * @property {string | null} namespace The name an `import * as` or `export * as` binds.
 */

/**
 * The value names an import or a re-export statement binds.
 *
 * @param {ts.ImportDeclaration | ts.ExportDeclaration} node
 * @returns {Bindings}
 */
function bindingsOf(node) {
    /** @type {Bindings} */
    const held = { names: [], namespace: null };
    const named = (/** @type {readonly (ts.ImportSpecifier | ts.ExportSpecifier)[]} */ list) => {
        for (const one of list) {
            if (one.isTypeOnly) continue;
            held.names.push({
                local: one.name.text,
                imported: (one.propertyName ?? one.name).text
            });
        }
    };
    if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        if (clause === undefined || clause.isTypeOnly) return held;
        if (clause.name !== undefined)
            held.names.push({ local: clause.name.text, imported: 'default' });
        const bound = clause.namedBindings;
        if (bound !== undefined && ts.isNamespaceImport(bound)) held.namespace = bound.name.text;
        else if (bound !== undefined) named(bound.elements);
        return held;
    }
    const clause = node.exportClause;
    if (clause !== undefined && ts.isNamespaceExport(clause)) held.namespace = clause.name.text;
    else if (clause !== undefined) named(clause.elements);
    return held;
}

/**
 * @typedef {object} Augmentation A `declare module` block or a `/// <reference path>` directive.
 * @property {string} spec The module or path it names, as written.
 * @property {number} line The line it is written on, from 1.
 * @property {boolean} reference A directive, whose path is read beside the file that writes it.
 */

/** The script kind the TypeScript parse reads a file name as. */
function kindOf(/** @type {string} */ name) {
    if (/\.(m|c)?js$/.test(name)) return ts.ScriptKind.JS;
    return ts.ScriptKind.TS;
}

/** A TypeScript parse of a script, with its parent links set so a node can be placed. */
export function parsed(/** @type {string} */ name, /** @type {string} */ code) {
    return ts.createSourceFile(name, code, ts.ScriptTarget.Latest, true, kindOf(name));
}

/** The line of an offset of a text, from 1. */
function lineAt(/** @type {string} */ text, /** @type {number} */ offset) {
    let line = 1;
    for (let at = text.indexOf('\n'); at !== -1 && at < offset; at = text.indexOf('\n', at + 1)) {
        line += 1;
    }
    return line;
}

/**
 * The names a script binds to `new URL('<path>', import.meta.url)`, with or without `.href`, by
 * name, so an `import(name)` of one names that path.
 */
function urlNames(/** @type {ts.SourceFile} */ source) {
    /** @type {Map<string, string>} */
    const found = new Map();
    const visit = (/** @type {ts.Node} */ node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
            let value = node.initializer;
            if (ts.isPropertyAccessExpression(value) && value.name.text === 'href') {
                value = value.expression;
            }
            const call = ts.isNewExpression(value) ? value : null;
            const args = call?.arguments ?? [];
            const [path, base] = args;
            const url =
                call !== null &&
                ts.isIdentifier(call.expression) &&
                call.expression.text === 'URL' &&
                args.length === 2 &&
                ts.isStringLiteralLike(path) &&
                base.getText(source) === 'import.meta.url';
            if (url) found.set(node.name.text, path.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
}

/**
 * Every import of one script's code, its lines counted in the whole text the code sits in from
 * `offset`.
 *
 * @param {string} name
 * @param {string} code
 * @param {string} text
 * @param {number} offset
 * @returns {Import[]}
 */
function scriptImports(name, code, text, offset) {
    const source = parsed(name, code);
    const urls = urlNames(source);
    /** @type {Import[]} */
    const found = [];
    const at = (/** @type {ts.Node} */ node) => lineAt(text, offset + node.getStart(source));
    const visit = (/** @type {ts.Node} */ node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
            const typeOnly = node.importClause?.isTypeOnly === true;
            const spec = node.moduleSpecifier.text;
            const bindings = bindingsOf(node);
            found.push({ spec, line: at(node), typeOnly, dynamic: false, bindings });
        } else if (
            ts.isExportDeclaration(node) &&
            node.moduleSpecifier !== undefined &&
            ts.isStringLiteralLike(node.moduleSpecifier)
        ) {
            const spec = node.moduleSpecifier.text;
            const bindings = bindingsOf(node);
            const whole = node.exportClause === undefined;
            const typeOnly = node.isTypeOnly;
            found.push({ spec, line: at(node), typeOnly, dynamic: false, bindings, whole });
        } else if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference) &&
            ts.isStringLiteralLike(node.moduleReference.expression)
        ) {
            const spec = node.moduleReference.expression.text;
            found.push({ spec, line: at(node), typeOnly: node.isTypeOnly, dynamic: false });
        } else if (ts.isImportTypeNode(node)) {
            const argument = node.argument;
            if (ts.isLiteralTypeNode(argument) && ts.isStringLiteralLike(argument.literal)) {
                const spec = argument.literal.text;
                found.push({ spec, line: at(node), typeOnly: true, dynamic: true });
            }
        } else if (
            ts.isCallExpression(node) &&
            node.expression.getText(source) === 'import.meta.glob' &&
            node.arguments[0] !== undefined &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            const spec = node.arguments[0].text;
            found.push({ spec, line: at(node), typeOnly: false, dynamic: false, glob: true });
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
        ) {
            const [argument] = node.arguments;
            const line = at(node);
            if (argument !== undefined && ts.isStringLiteralLike(argument)) {
                found.push({ spec: argument.text, line, typeOnly: false, dynamic: true });
            } else if (
                argument !== undefined &&
                ts.isIdentifier(argument) &&
                urls.has(argument.text)
            ) {
                const spec = urls.get(argument.text) ?? '';
                found.push({ spec, line, typeOnly: false, dynamic: true, viaUrl: true });
            } else {
                const written = argument === undefined ? '' : argument.getText(source);
                found.push({ spec: null, line, typeOnly: false, dynamic: true, argument: written });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
}

/** A component's parse, with the offsets of its two scripts' code. */
export function component(/** @type {string} */ text) {
    const tree = parse(text, { modern: true });
    const scripts = [tree.instance, tree.module].filter((one) => one !== null && one !== undefined);
    return { tree, scripts };
}

/**
 * Every `import()` expression in a component's markup: a node of type ImportExpression anywhere
 * in its fragment, whose literal source is its specifier.
 *
 * @param {unknown} node
 * @param {string} text
 * @param {Import[]} found
 */
function markupImports(node, text, found) {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const one of node) markupImports(one, text, found);
        return;
    }
    const held = /** @type {Record<string, unknown>} */ (node);
    if (held.type === 'ImportExpression') {
        const source =
            /** @type {{ type: string, value?: unknown, start: number, end: number }} */ (
                held.source
            );
        const line = lineAt(text, Number(held.start));
        if (source.type === 'Literal' && typeof source.value === 'string') {
            found.push({ spec: source.value, line, typeOnly: false, dynamic: true });
        } else {
            const argument = text.slice(source.start, source.end);
            found.push({ spec: null, line, typeOnly: false, dynamic: true, argument });
        }
    }
    for (const [key, value] of Object.entries(held)) {
        if (key !== 'parent' && key !== 'metadata') markupImports(value, text, found);
    }
}

/**
 * Every import of one module's text, in the order its lines give: the static statements, the
 * `import()` calls and the `import('...')` types; for a component, those of its instance and
 * module scripts and the `import()` expressions of its markup.
 *
 * @param {string} name The file's path, whose ending says how it is parsed.
 * @param {string} text
 * @returns {Import[]}
 */
export function importsOf(name, text) {
    if (!name.endsWith('.svelte')) return scriptImports(name, text, text, 0);
    const { tree, scripts } = component(text);
    /** @type {Import[]} */
    const found = [];
    for (const script of scripts) {
        const { start, end } = /** @type {{ start: number, end: number }} */ (
            /** @type {unknown} */ (script.content)
        );
        const lang = /\blang\s*=\s*["']ts["']/.test(text.slice(script.start, start)) ? 'ts' : 'js';
        found.push(...scriptImports(`script.${lang}`, text.slice(start, end), text, start));
    }
    markupImports(tree.fragment, text, found);
    return found.sort((a, b) => a.line - b.line);
}

/**
 * Every `declare module '<name>'` block of one module's code and every `/// <reference path>`
 * directive the compiler honours at its head, whatever attributes the directive carries beside
 * its path, each with the name as written and its line.
 *
 * @param {string} name
 * @param {string} text
 * @returns {Augmentation[]}
 */
export function augmentationsOf(name, text) {
    /** @type {Augmentation[]} */
    const found = [];
    /** @type {{ code: string, offset: number, file: string }[]} */
    const scripts = [];
    if (name.endsWith('.svelte')) {
        for (const script of component(text).scripts) {
            const { start, end } = /** @type {{ start: number, end: number }} */ (
                /** @type {unknown} */ (script.content)
            );
            scripts.push({ code: text.slice(start, end), offset: start, file: 'script.ts' });
        }
    } else {
        scripts.push({ code: text, offset: 0, file: name });
    }
    for (const { code, offset, file } of scripts) {
        const source = parsed(file, code);
        for (const reference of source.referencedFiles) {
            const line = lineAt(text, offset + reference.pos);
            found.push({ spec: reference.fileName, line, reference: true });
        }
        const visit = (/** @type {ts.Node} */ node) => {
            if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
                const line = lineAt(text, offset + node.getStart(source));
                found.push({ spec: node.name.text, line, reference: false });
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
    }
    return found.sort((a, b) => a.line - b.line);
}

/**
 * The endings tried, in order, for a specifier written with none: the file as written, then
 * Vite's default `resolve.extensions` (`.mjs`, `.js`, `.mts`, `.ts`, `.jsx`, `.tsx`, `.json`),
 * then the index file of a folder under each of them, as Vite resolves a module.
 */
export const TAILS = [
    '',
    ...['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    ...['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'].map((one) => `/index${one}`)
];

/**
 * The file a module path names, or null where none answers: a path written with `.js` is that
 * file where it exists and otherwise the `.ts` file of that name, as Vite resolves a TypeScript
 * module naming a sibling by the file it compiles to; a path written with `.ts` is that file; any
 * other is tried with each of TAILS. `isFile` answers whether a path is a file.
 *
 * @param {string} path
 * @param {(path: string) => boolean} isFile
 * @returns {string | null}
 */
export function moduleAt(path, isFile) {
    if (/\.js$/.test(path)) {
        if (isFile(path)) return path;
        const compiled = path.replace(/\.js$/, '.ts');
        return isFile(compiled) ? compiled : null;
    }
    if (/\.ts$/.test(path)) return isFile(path) ? path : null;
    for (const tail of TAILS) if (isFile(path + tail)) return path + tail;
    return null;
}
