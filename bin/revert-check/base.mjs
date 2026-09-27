// Layer 4, test. Whether a revert directive, or a case with none, is the same in the tree a change
// starts from, the folder bin/revert-check/revert-check.mjs is given by `--base`, so the check
// proves only what the change added or changed: a directive the base holds as it is was proven when
// the base was.
//
// What decides a directive's run is its case, the file around the file's cases and its target, so
// all three are compared as text. A case is a whole call statement that opens with `it(` or
// `test(`, modifiers such as `it.each(...)` or `test.skip` included, found by the TypeScript parse
// rather than by counting braces, since a case holds strings, templates and regular expressions a
// count misreads; its text is the statement's full text, its leading comments with it, so a
// directive written above the case and every directive inside it are part of it. A file the
// compiler reports a syntax error in, a case the parse does not find and a name two cases share
// answer no, so the caller proves the directive as it would without a base. The base is read and
// never written, and a parse is kept only for the one run that asked for it.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { parsed } from '../diagrams/imports.mjs';

/** The callees a case statement opens with. */
const CALLERS = new Set(['it', 'test']);

/** The text of a file under a folder, or null where the folder holds no such file. */
function textIn(dir, rel) {
    const full = join(dir, rel);
    try {
        if (!statSync(full).isFile()) return null;
        return readFileSync(full, 'utf8');
    } catch {
        return null;
    }
}

/** The identifier a callee is built on: `it` for `it.skip`, `it.each(rows)` and it.each`rows`. */
function rootOf(node) {
    let held = node;
    for (;;) {
        if (ts.isIdentifier(held)) return held.text;
        if (ts.isPropertyAccessExpression(held) || ts.isCallExpression(held))
            held = held.expression;
        else if (ts.isTaggedTemplateExpression(held)) held = held.tag;
        else return null;
    }
}

/**
 * The name a case statement gives, as it is written between its quotes, which is how the directive
 * reader spells it; null where the statement opens no case or names it by no plain literal.
 */
function caseOf(statement) {
    if (!ts.isExpressionStatement(statement)) return null;
    const call = statement.expression;
    if (!ts.isCallExpression(call) || !CALLERS.has(rootOf(call.expression))) return null;
    const name = call.arguments[0];
    if (name === undefined) return null;
    if (!ts.isStringLiteral(name) && !ts.isNoSubstitutionTemplateLiteral(name)) return null;
    return name.getText().slice(1, -1);
}

/**
 * A test file's cases, each with its name, its full extent and its text, and the file's text with
 * every case taken out; null where the compiler reports a syntax error. A case is not walked into,
 * so a call inside one is part of its text rather than a case of its own.
 */
function casesOf(file, text) {
    const options = { fileName: file, reportDiagnostics: true, compilerOptions: {} };
    if (ts.transpileModule(text, options).diagnostics.length > 0) return null;
    const source = parsed(file, text);
    const cases = [];
    const visit = (node) => {
        const name = caseOf(node);
        if (name === null) {
            ts.forEachChild(node, visit);
            return;
        }
        cases.push({
            name,
            start: node.getFullStart(),
            end: node.getEnd(),
            text: node.getFullText()
        });
    };
    ts.forEachChild(source, visit);
    let outside = '';
    let from = 0;
    for (const one of cases) {
        outside += text.slice(from, one.start);
        from = one.end;
    }
    outside += text.slice(from);
    return { cases, outside };
}

/**
 * The comparison of a tree with the base it starts from. Each test file is read and parsed once
 * per folder for the run that made the comparison.
 */
export function baseline(root, base) {
    const held = new Map();
    const read = (dir, file) => {
        const key = `${dir}\0${file}`;
        if (!held.has(key)) {
            const text = textIn(dir, file);
            held.set(key, text === null ? null : { text, cases: casesOf(file, text) });
        }
        return held.get(key);
    };

    /** The root's case of a name where the base holds it and the file around it unchanged. */
    const sameCase = (file, name) => {
        const here = read(root, file);
        const there = read(base, file);
        if (here === null || there === null) return null;
        if (here.cases === null || there.cases === null) return null;
        if (here.cases.outside !== there.cases.outside) return null;
        const mine = here.cases.cases.filter((one) => one.name === name);
        const theirs = there.cases.cases.filter((one) => one.name === name);
        if (mine.length !== 1 || theirs.length !== 1) return null;
        if (mine[0].text !== theirs[0].text) return null;
        return { found: mine[0], text: here.text };
    };

    return {
        /** Whether a case with no directive is unchanged from the base. */
        caseUnchanged: (file, name) => sameCase(file, name) !== null,

        /**
         * Whether a directive is unchanged from the base: its case and the file around the cases
         * the same, the directive's own line inside that case, and its target the same text.
         */
        directiveUnchanged: (directive) => {
            if (directive.caseName === null) return false;
            const same = sameCase(directive.file, directive.caseName);
            if (same === null) return false;
            const above = same.text.split('\n').slice(0, directive.line - 1);
            const at = above.reduce((sum, one) => sum + one.length + 1, 0);
            if (at < same.found.start || at >= same.found.end) return false;
            const target = textIn(root, directive.target);
            return target !== null && target === textIn(base, directive.target);
        }
    };
}
