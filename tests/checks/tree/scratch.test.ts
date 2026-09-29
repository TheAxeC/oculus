// Layer 4, test. The scratch helper hands back a directory inside the system temporary directory
// and its fixture sweeps it, no test file makes one any other way, and every file that reaches the
// helper takes its cases from the helper's `it` and `test`, which carry the sweep.
//
// These are what keep a run from leaving directories behind: a file that calls mkdtempSync itself,
// or one that takes a directory from the helper and declares its cases with vitest's own `it`, has
// nothing to remove what it made, and the count over the temporary directory only says so after
// the suite has run, which is minutes. These say so in a second. The sweep has one registration,
// the fixture's, so a file that registers the sweep with afterAll is refused; a file no suite
// imports, run by hand outside vitest, registers the sweep with its own runner. The fixture is set
// up only for a file whose cases or fixture hooks run, so a file that makes a directory while it
// loads, which a run skipping its cases leaves behind, is refused, and so is one that runs vitest's
// own beforeAll or afterAll, whose red run the sweep does not follow.
//
// All of it is read from code and not prose, through the code reader of
// tests/checks/source/code.ts and TypeScript's parse: a comment or a string holding the words of a
// registration or an import is neither.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect } from 'vitest';
import { it, plantScratch, scratchDir, scratchMade, sweepScratch } from '../../fixtures/scratch.ts';
import { parsed } from '../../../utils/diagrams/imports.mjs';
import { fileCode } from '../source/code.ts';
import { treeFiles } from '../walk.ts';

const TESTS = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/** The helper every suite takes its scratch directories from, as a path under tests/. */
const HELPER = 'fixtures/scratch.ts';

/** The files that may call mkdtempSync: the helper, whose sweep removes what it makes. */
const OWN = [HELPER];

/** Every TypeScript file under a tests root, as a path relative to it, in name order. */
function testFiles(root = TESTS): string[] {
    return treeFiles(root).filter((rel) => rel.endsWith('.ts'));
}

/**
 * The calls this looks for, built rather than written out.
 *
 * Written out they would be in this file too, and the scan would name the file doing the scanning.
 * A directory is taken by `mkdtempSync`, by its promise form, or by making one at a path built from
 * the system temporary directory, and all three leave one behind.
 */
const CALLS = [
    ['mkdtempSync', '('].join(''),
    ['mkdtemp', '('].join(''),
    ['mkdirSync', '('].join('')
];

/** What names the system temporary directory, which a path made under it is built from. */
const TEMP = ['tmpdir', '('].join('');

/**
 * A registration of the sweep through vitest's hook, which is the fixture's to make, built rather
 * than written out so that a search of the tree for it finds none.
 */
const HOOK = ['afterAll(', 'sweepScratch', ')'].join('');

/** The same registration as code reads it, spaces inside the brackets allowed. */
const HOOKED = /\bafterAll\(\s*sweepScratch\s*\)/;

/** A registration of the sweep with a runner of its own, for a file run by hand. */
const OWN_RUNNER = /\bprocess\.on\([^)]*sweepScratch/;

/**
 * The relative specifiers one file imports, static or dynamic, read by TypeScript's parse, so an
 * import written in a comment or a string is none.
 */
function specifiersOf(source: ts.SourceFile): string[] {
    const found: string[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            const from = node.moduleSpecifier;
            if (from !== undefined && ts.isStringLiteral(from)) found.push(from.text);
        }
        if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length > 0 &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            found.push(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found.filter((one) => one.startsWith('.'));
}

/** The file of the tree a relative specifier of one file names, or undefined for none. */
function resolved(rel: string, spec: string, known: Set<string>): string | undefined {
    const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    const held = normalize(join(folder, spec));
    // A specifier written without its extension names the same file, so the guard follows it
    // rather than losing the chain at a file that imports `../scratch`.
    return [held, `${held}.ts`, normalize(join(held, 'index.ts'))].find((one) => known.has(one));
}

/** Every file of the tree one file imports, by its path under the root. */
function importsIn(rel: string, source: ts.SourceFile, known: Set<string>): string[] {
    return specifiersOf(source).flatMap((spec) => resolved(rel, spec, known) ?? []);
}

/**
 * The names a file imports from vitest, read from its import declarations, so an import spread
 * over lines is read whole and one written in a comment or a string is none; an `x as y` is read as
 * the `x` it imports.
 */
export function vitestNames(source: ts.SourceFile): string[] {
    return source.statements.flatMap((statement) => {
        if (!ts.isImportDeclaration(statement)) return [];
        const from = statement.moduleSpecifier;
        if (!ts.isStringLiteral(from) || from.text !== 'vitest') return [];
        const bound = statement.importClause?.namedBindings;
        if (bound === undefined || !ts.isNamedImports(bound)) return [];
        return bound.elements.map((one) => (one.propertyName ?? one.name).text);
    });
}

/** The helper's functions that make a scratch directory. */
const MAKERS = ['scratchDir', 'plantScratch'];

/** vitest's hooks for a whole file or block, whose red run the fixture's sweep does not follow. */
const HOOKS = ['beforeAll', 'afterAll'];

/** Whether a function is the body of a describe block, which vitest runs as it loads the file. */
function describeBody(fn: ts.Node): boolean {
    const call = fn.parent;
    if (!ts.isCallExpression(call)) return false;
    if (!call.arguments.some((one) => one === fn)) return false;
    let callee: ts.Expression = call.expression;
    while (ts.isCallExpression(callee) || ts.isPropertyAccessExpression(callee)) {
        callee = callee.expression;
    }
    return ts.isIdentifier(callee) && callee.text === 'describe';
}

/**
 * Whether a node runs only when something calls it: inside a function other than a describe body,
 * or inside a class, whose fields are set when an instance is made.
 */
function deferred(node: ts.Node): boolean {
    for (let at = node.parent; !ts.isSourceFile(at); at = at.parent) {
        if (ts.isClassLike(at)) return true;
        if (ts.isFunctionLike(at) && !describeBody(at)) return true;
    }
    return false;
}

/** A call of a function, or the making of an instance of a class. */
type Call = ts.CallExpression | ts.NewExpression;

/**
 * The name a call calls, when it can be read: `f(...)` and `new F(...)`, or `x.f(...)` for a
 * function of the helper reached through a namespace or a dynamic import.
 */
function calleeName(call: Call): string | null {
    if (ts.isIdentifier(call.expression)) return call.expression.text;
    if (ts.isPropertyAccessExpression(call.expression)) {
        const name = call.expression.name.text;
        return MAKERS.includes(name) ? name : null;
    }
    return null;
}

/** Every call of a file, with the name it calls. */
function callsOf(source: ts.SourceFile): { call: Call; name: string }[] {
    const found: { call: Call; name: string }[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
            const name = calleeName(node);
            if (name !== null) found.push({ call: node, name });
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
}

/**
 * The top-level function of a file that runs a call when it is itself called, by its name, or null
 * when the call sits in no such function or in a function nested inside it, which runs later. A
 * class counts as the function its instances are made by, for a call in a field or its constructor.
 */
function callingFunction(call: ts.Node): string | null {
    let at: ts.Node = call;
    while (
        !ts.isSourceFile(at.parent) &&
        !ts.isFunctionLike(at.parent) &&
        !ts.isClassDeclaration(at.parent)
    ) {
        at = at.parent;
    }
    const fn = at.parent;
    if (ts.isSourceFile(fn)) return null;
    const owner = ts.isConstructorDeclaration(fn) ? fn.parent : fn;
    if (ts.isClassDeclaration(owner) && ts.isSourceFile(owner.parent)) {
        return ts.isPropertyDeclaration(at) || owner !== fn ? (owner.name?.text ?? null) : null;
    }
    if (ts.isFunctionDeclaration(fn) && ts.isSourceFile(fn.parent)) return fn.name?.text ?? null;
    if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) return null;
    const declared = fn.parent;
    if (!ts.isVariableDeclaration(declared) || !ts.isIdentifier(declared.name)) return null;
    const statement = declared.parent.parent;
    return ts.isVariableStatement(statement) && ts.isSourceFile(statement.parent)
        ? declared.name.text
        : null;
}

/** The names one file imports from the files of the tree: its own name for each, and where from. */
function bindingsOf(
    rel: string,
    source: ts.SourceFile,
    known: Set<string>
): { local: string; from: string; name: string }[] {
    const found: { local: string; from: string; name: string }[] = [];
    for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement)) continue;
        const bound = statement.importClause?.namedBindings;
        if (bound === undefined || !ts.isNamedImports(bound)) continue;
        const spec = statement.moduleSpecifier;
        if (!ts.isStringLiteral(spec)) continue;
        const from = spec.text.startsWith('.') ? resolved(rel, spec.text, known) : undefined;
        if (from === undefined) continue;
        for (const one of bound.elements) {
            found.push({ local: one.name.text, from, name: (one.propertyName ?? one.name).text });
        }
    }
    return found;
}

/**
 * The names each file makes a scratch directory through: the helper's own functions, a name a file
 * imports from a file where it makes one, and a top-level function of the file that calls any of
 * them, followed until nothing more is found.
 */
function makersOf(held: Map<string, Held>): Map<string, Set<string>> {
    const makers = new Map<string, Set<string>>();
    for (const rel of held.keys()) makers.set(rel, new Set(rel === HELPER ? MAKERS : []));
    for (let grew = true; grew;) {
        grew = false;
        for (const [rel, one] of held) {
            const own = makers.get(rel) ?? new Set<string>();
            const before = own.size;
            for (const bound of one.bindings) {
                if (makers.get(bound.from)?.has(bound.name)) own.add(bound.local);
            }
            for (const { call, name } of one.calls) {
                const within = callingFunction(call);
                if (within !== null && own.has(name)) own.add(within);
            }
            if (own.size > before) grew = true;
        }
    }
    return makers;
}

/** One file of the tree as the check reads it. */
type Held = {
    imports: string[];
    vitest: string[];
    hooked: boolean;
    ownRunner: boolean;
    bindings: { local: string; from: string; name: string }[];
    calls: { call: Call; name: string }[];
    source: ts.SourceFile;
};

/**
 * Every file under tests/ that reaches the helper and cannot be sure of its sweep, and every file
 * that registers the sweep through vitest's hook.
 *
 * A file reaches the helper when it imports it, or imports a file that does, at any depth. Such a
 * file, a suite or a helper a suite imports, declares its cases with the helper's `it` and `test`,
 * so its vitest import names neither, nor vitest's beforeAll and afterAll, and it makes no
 * directory while it loads, through the helper or through a function or class that makes one. A
 * file that reaches the helper and no suite imports is run by hand, outside vitest, and registers
 * the sweep with its own runner.
 */
export function findUnswept(root = TESTS): string[] {
    const all = testFiles(root);
    const known = new Set(all);
    const held = new Map<string, Held>();
    for (const rel of all) {
        const text = readFileSync(join(root, rel), 'utf8');
        const bare = fileCode(rel, text);
        const source = parsed(rel, text);
        held.set(rel, {
            imports: importsIn(rel, source, known),
            vitest: vitestNames(source),
            hooked: HOOKED.test(bare),
            ownRunner: OWN_RUNNER.test(bare),
            bindings: bindingsOf(rel, source, known),
            calls: callsOf(source),
            source
        });
    }
    const makers = makersOf(held);
    const reaches = new Set([HELPER]);
    for (let grew = true; grew;) {
        grew = false;
        for (const rel of all) {
            if (reaches.has(rel)) continue;
            if ((held.get(rel)?.imports ?? []).some((one) => reaches.has(one))) {
                reaches.add(rel);
                grew = true;
            }
        }
    }
    const imported = new Set<string>();
    for (const rel of all) {
        if (!/\.(test|spec)\.ts$/.test(rel)) continue;
        const walk = (name: string): void => {
            for (const under of held.get(name)?.imports ?? []) {
                if (imported.has(under)) continue;
                imported.add(under);
                walk(under);
            }
        };
        walk(rel);
    }
    const found: string[] = [];
    for (const rel of all) {
        const one = held.get(rel);
        if (one === undefined) continue;
        if (one.hooked) {
            found.push(`tests/${rel} registers ${HOOK}, which the fixture holds`);
        }
        if (rel === HELPER || !reaches.has(rel)) continue;
        const suite = /\.(test|spec)\.ts$/.test(rel);
        if (!suite && !imported.has(rel)) {
            if (!one.ownRunner) {
                found.push(
                    `tests/${rel} takes a scratch directory, no suite imports it, and it sweeps none`
                );
            }
            continue;
        }
        const own = one.vitest.filter((name) => name === 'it' || name === 'test');
        if (own.length > 0) {
            found.push(
                `tests/${rel} takes a scratch directory and declares cases with vitest's ${own.join(' and ')}`
            );
        }
        const hooks = one.vitest.filter((name) => HOOKS.includes(name));
        if (hooks.length > 0) {
            found.push(
                `tests/${rel} takes a scratch directory and runs vitest's ${hooks.join(' and ')}`
            );
        }
        const making = makers.get(rel) ?? new Set<string>();
        for (const { call, name } of one.calls) {
            if (!making.has(name) || deferred(call)) continue;
            const line = one.source.getLineAndCharacterOfPosition(call.getStart(one.source)).line;
            found.push(`tests/${rel}:${line + 1} makes a scratch directory while the file loads`);
        }
    }
    return found;
}

/** Every file that makes a temporary directory without the helper that sweeps it. */
export function findOwnScratch(allow: string[] = OWN, root = TESTS): string[] {
    const found: string[] = [];
    for (const rel of testFiles(root)) {
        if (allow.includes(rel)) continue;
        const bare = fileCode(rel, readFileSync(join(root, rel), 'utf8'));
        // `mkdtempSync` names a scratch directory wherever it is written. The other two name one
        // only where the path is built from the system temporary directory on that same line: a
        // `mkdirSync` under a directory the helper already swept is not a directory of its own.
        const takes =
            bare.includes(CALLS[0]) ||
            bare
                .split('\n')
                .some(
                    (line) =>
                        (line.includes(CALLS[1]) || line.includes(CALLS[2])) && line.includes(TEMP)
                );
        if (!takes) continue;
        found.push(`tests/${rel} makes a temporary directory of its own`);
    }
    return found.sort();
}

/** A planted tree with a helper of its own, and the files given beside it. */
function planted(files: Record<string, string>): string {
    return plantScratch('oculus-scratch-rule-', {
        [HELPER]: 'export function scratchDir() {}\nexport function plantScratch() {}\n',
        ...files
    });
}

describe('a scratch directory', () => {
    it('is made inside the temporary directory and swept away again', () => {
        const dir = scratchDir('oculus-scratch-case-');
        expect(scratchMade()).toContain(dir);
        sweepScratch();
        expect(existsSync(dir)).toBe(false);
        expect(scratchMade()).toEqual([]);
    });

    it('is planted with the files given, and refuses one whose path leaves it', () => {
        const dir = plantScratch('oculus-scratch-plant-', { 'a/b.txt': 'held' });
        expect(readFileSync(join(dir, 'a', 'b.txt'), 'utf8')).toBe('held');
        // The refused file is named after this run's own directory, so a file another program
        // left in the system temporary directory is never taken for one this plant wrote.
        const outside = `${basename(dir)}-out.txt`;
        expect(() => plantScratch('oculus-scratch-plant-', { [`../${outside}`]: 'x' })).toThrow(
            /outside its scratch directory/
        );
        expect(existsSync(join(dir, '..', outside))).toBe(false);
        sweepScratch();
    });

    // Revert: in scratchDir of tests/fixtures/scratch.ts, make the directory before checking where
    // it is, and a prefix that climbs out leaves one in the parent of the temporary directory.
    it('refuses a prefix that leaves the temporary directory and makes nothing outside it', () => {
        const parent = dirname(resolve(tmpdir()));
        const escaped = () =>
            readdirSync(parent).filter((name) => name.startsWith('oculus-escape-'));
        const before = escaped();
        expect(() => scratchDir('../oculus-escape-')).toThrow(/outside the temporary directory/);
        expect(escaped()).toEqual(before);
    });

    // Red when sweepScratch() leaves the fixture in tests/fixtures/scratch.ts, and the planted
    // files' directories are still there after their run; red too when the fixture's
    // test.afterAll stops sweeping on its hook's error, and the red after hook's two stay.
    it('is swept after a file that takes its cases from the fixture, whatever made it', () => {
        const dir = scratchDir('oculus-sweep-run-');
        const record = join(dir, 'made.txt');
        writeFileSync(record, '');
        const helper = join(TESTS, HELPER);
        const note = `(one: string) => appendFileSync(${JSON.stringify(record)}, one + '\\n')`;
        writeFileSync(
            join(dir, 'planted.test.ts'),
            [
                "import { appendFileSync } from 'node:fs';",
                `import { it, plantScratch, scratchDir, test } from ${JSON.stringify(helper)};`,
                `const note = ${note};`,
                "note(scratchDir('oculus-sweep-module-'));",
                "test.beforeAll(() => note(scratchDir('oculus-sweep-hook-')));",
                "it('makes one in a case', () => {",
                "    note(plantScratch('oculus-sweep-case-', { 'a.txt': 'a' }));",
                '});',
                ''
            ].join('\n')
        );
        // A red hook of the fixture's own: the file's cases never run, and the sweep still does.
        writeFileSync(
            join(dir, 'red.test.ts'),
            [
                "import { appendFileSync } from 'node:fs';",
                `import { it, scratchDir, test } from ${JSON.stringify(helper)};`,
                `const note = ${note};`,
                'test.beforeAll(() => {',
                "    note(scratchDir('oculus-sweep-red-'));",
                "    throw new Error('a red hook');",
                '});',
                "it('never runs', () => {});",
                ''
            ].join('\n')
        );
        // A red afterAll of the fixture's own: vitest skips the fixture's teardown after it, and
        // the hook sweeps before its error goes on.
        writeFileSync(
            join(dir, 'red-after.test.ts'),
            [
                "import { appendFileSync } from 'node:fs';",
                `import { it, scratchDir, test } from ${JSON.stringify(helper)};`,
                `const note = ${note};`,
                "test.beforeAll(() => note(scratchDir('oculus-sweep-before-')));",
                "it('runs', () => {});",
                'test.afterAll(() => {',
                "    note(scratchDir('oculus-sweep-after-'));",
                "    throw new Error('a red after hook');",
                '});',
                ''
            ].join('\n')
        );
        const vitest = join(TESTS, '..', 'node_modules', 'vitest', 'vitest.mjs');
        const run = spawnSync(process.execPath, [vitest, 'run', '--root', dir], {
            cwd: dir,
            encoding: 'utf8'
        });
        expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(1);
        expect(`${run.stdout}${run.stderr}`).toContain('a red hook');
        expect(`${run.stdout}${run.stderr}`).toContain('a red after hook');
        const made = readFileSync(record, 'utf8').trim().split('\n');
        expect(made).toHaveLength(6);
        expect(made.filter((one) => existsSync(one))).toEqual([]);
    }, 60000);

    it('is the only way a test file makes one', () => {
        expect(findOwnScratch()).toEqual([]);
    });

    it('is swept by every file under tests that takes one', () => {
        expect(findUnswept()).toEqual([]);
    });

    it('catches a file that makes one of its own', () => {
        expect(findOwnScratch([])).toEqual([
            'tests/fixtures/scratch.ts makes a temporary directory of its own'
        ]);
    });

    // Revert: in findOwnScratch of tests/checks/tree/scratch.test.ts, look for the one call written
    // by name, and a file that takes its directory the promise way, or by making one at a path it
    // builds from the system temporary directory, is not seen at all.
    it('catches a directory taken the promise way and one made at a path built by hand', () => {
        const dir = plantScratch('oculus-scratch-shapes-', {
            'views/promise.test.ts': [
                "import { mkdtemp } from 'node:fs/promises';",
                "import { tmpdir } from 'node:os';",
                "import { join } from 'node:path';",
                '',
                "it('takes one', async () => {",
                "    await mkdtemp(join(tmpdir(), 'oculus-planted-'));",
                '});',
                ''
            ].join('\n'),
            'views/byhand.test.ts': [
                "import { mkdirSync } from 'node:fs';",
                "import { tmpdir } from 'node:os';",
                "import { join } from 'node:path';",
                '',
                "it('takes one', () => {",
                "    mkdirSync(join(tmpdir(), 'oculus-planted-by-hand'), { recursive: true });",
                '});',
                ''
            ].join('\n'),
            // A directory made under a folder the helper already swept is not one of the file's
            // own.
            'views/inside.test.ts': [
                "import { mkdirSync } from 'node:fs';",
                "import { join } from 'node:path';",
                "import { scratchDir } from '../fixtures/scratch.ts';",
                '',
                "it('makes a folder inside the one it was given', () => {",
                "    mkdirSync(join(scratchDir('oculus-inside-'), 'under'), { recursive: true });",
                '});',
                ''
            ].join('\n')
        });
        expect(findOwnScratch([], dir)).toEqual([
            'tests/views/byhand.test.ts makes a temporary directory of its own',
            'tests/views/promise.test.ts makes a temporary directory of its own'
        ]);
    });
});

describe('the fixture rule', () => {
    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, leave out the vitest names,
    // and a file whose cases never run the fixture passes.
    it('refuses a file that takes a directory and imports it from vitest', () => {
        const dir = planted({
            'a.test.ts': [
                "import { it } from 'vitest';",
                "import { scratchDir } from './fixtures/scratch.ts';",
                "it('x', () => { scratchDir('x-'); });",
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([
            "tests/a.test.ts takes a scratch directory and declares cases with vitest's it"
        ]);
    });

    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, drop the HOOKED test, and a file
    // that registers a second sweep passes.
    it('refuses a file that registers the sweep with afterAll', () => {
        const dir = planted({
            'b.test.ts': [
                "import { it, scratchDir, sweepScratch } from './fixtures/scratch.ts';",
                `${HOOK};`,
                "it('x', () => { scratchDir('x-'); });",
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([
            `tests/b.test.ts registers ${HOOK}, which the fixture holds`
        ]);
    });

    // Audit: a rule that refuses every file reaching the helper turns it red; no revert of the
    // shipped rule does, since passing a clean file is what the rule does by doing nothing.
    it('passes a file that plants a directory and takes it from the fixture', () => {
        const dir = planted({
            'c.test.ts': [
                "import { it, plantScratch } from './fixtures/scratch.ts';",
                "it('x', () => { plantScratch('x-', {}); });",
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([]);
    });

    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, test HOOKED against the raw
    // text rather than fileCode's, and the comment and the string below are taken for a
    // registration. The spread import is an audit of vitestNames: a reader of one line at a time
    // turns it red.
    it('reads a registration from code alone and an import however it is spread', () => {
        const prose = planted({
            'd.test.ts': [
                "import { it, scratchDir } from './fixtures/scratch.ts';",
                `// ${HOOK} is the fixture work now`,
                `const held = '${HOOK}';`,
                "it('x', () => { scratchDir('x-'); });",
                ''
            ].join('\n')
        });
        const spread = planted({
            'e.test.ts': [
                'import {',
                '    describe,',
                '    it',
                "} from 'vitest';",
                "import { scratchDir } from './fixtures/scratch.ts';",
                "describe('x', () => { it('y', () => { scratchDir('x-'); }); });",
                ''
            ].join('\n')
        });
        expect(findUnswept(prose)).toEqual([]);
        expect(findUnswept(spread)).toEqual([
            "tests/e.test.ts takes a scratch directory and declares cases with vitest's it"
        ]);
    });

    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, check only suites, and a helper
    // whose cases never run the fixture, and a hand-run file that sweeps nothing, both pass.
    it('follows the helper through a dynamic import and a helper, and reads a hand-run file', () => {
        const dir = planted({
            'dynamic.test.ts': [
                "import { test } from 'vitest';",
                "const helper = await import('./fixtures/scratch.ts');",
                "test('x', () => { helper.scratchDir('x-'); });",
                ''
            ].join('\n'),
            'shared.ts': [
                "import { it } from 'vitest';",
                "import { scratchDir } from './fixtures/scratch.ts';",
                "export const cases = () => it('x', () => { scratchDir('x-'); });",
                ''
            ].join('\n'),
            'user.test.ts': "import { cases } from './shared';\ncases();\n",
            'probe.ts': 'import { scratchDir } from "./fixtures/scratch.ts";\nscratchDir("x-");\n',
            'swept.ts': [
                "import { scratchDir, sweepScratch } from './fixtures/scratch.ts';",
                "process.on('exit', sweepScratch);",
                "scratchDir('x-');",
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([
            "tests/dynamic.test.ts takes a scratch directory and declares cases with vitest's test",
            'tests/probe.ts takes a scratch directory, no suite imports it, and it sweeps none',
            "tests/shared.ts takes a scratch directory and declares cases with vitest's it"
        ]);
    });

    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, leave out the HOOKS names, and a
    // file whose red beforeAll leaves its directories behind passes.
    it("refuses a file that takes a directory and runs vitest's beforeAll or afterAll", () => {
        const dir = planted({
            'f.test.ts': [
                "import { afterAll, beforeAll } from 'vitest';",
                "import { it, scratchDir } from './fixtures/scratch.ts';",
                "let held = '';",
                "beforeAll(() => { held = scratchDir('x-'); });",
                'afterAll(() => {});',
                "it('x', () => { held.length; });",
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([
            "tests/f.test.ts takes a scratch directory and runs vitest's afterAll and beforeAll"
        ]);
    });

    // Revert: in findUnswept of tests/checks/tree/scratch.test.ts, drop the loop over the calls
    // made while the file loads, and every file below passes. Take describeBody out of deferred,
    // and the call in a describe block passes; seed makersOf with the helper alone, and the
    // wrapper, the imported wrapper and the class pass.
    it('refuses a directory made while the file loads, however it is reached', () => {
        const dir = planted({
            'wrap.ts': [
                "import { scratchDir } from './fixtures/scratch.ts';",
                "export function made(): string { return scratchDir('x-'); }",
                ''
            ].join('\n'),
            'g.test.ts': [
                "import { describe } from 'vitest';",
                "import { it, plantScratch, scratchDir, test } from './fixtures/scratch.ts';",
                "import { made as mine } from './wrap.ts';",
                "const top = scratchDir('x-');",
                "const local = () => plantScratch('x-', {});",
                'class Home {',
                "    root = scratchDir('x-');",
                '}',
                "describe('d', () => {",
                '    const inner = local();',
                '    const imported = mine();',
                '    const home = new Home();',
                "    let later = '';",
                "    test.beforeAll(() => { later = scratchDir('x-'); });",
                "    it('x', () => { scratchDir('x-'); [top, inner, imported, home, later]; });",
                '});',
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([
            'tests/g.test.ts:4 makes a scratch directory while the file loads',
            'tests/g.test.ts:10 makes a scratch directory while the file loads',
            'tests/g.test.ts:11 makes a scratch directory while the file loads',
            'tests/g.test.ts:12 makes a scratch directory while the file loads'
        ]);
    });

    // Audit: a rule that counts every function calling a maker as one turns it red, since the
    // function below only declares a case that makes one.
    it('passes a function called while the file loads that only declares a case making one', () => {
        const dir = planted({
            'h.test.ts': [
                "import { it, scratchDir } from './fixtures/scratch.ts';",
                "function cases(): void { it('x', () => { scratchDir('x-'); }); }",
                'cases();',
                ''
            ].join('\n')
        });
        expect(findUnswept(dir)).toEqual([]);
    });

    // Revert: in vitestNames of tests/checks/tree/scratch.test.ts, read `one.name` alone, and a
    // renamed `it` is read as its new name.
    it('reads the names of a vitest import, renamed and typed ones included', () => {
        expect(
            vitestNames(parsed('a.ts', "import { describe, it as each, type Mock } from 'vitest';"))
        ).toEqual(['describe', 'it', 'Mock']);
        expect(vitestNames(parsed('a.ts', "// import { it } from 'vitest';\n"))).toEqual([]);
        expect(
            vitestNames(parsed('a.ts', 'const x = "import { it } from \'vitest\';";\n'))
        ).toEqual([]);
    });
});
