// Layer 4, test. The revert check given the tree a change starts from with `--base`: a directive
// whose case, whose file around its cases and whose target the base holds unchanged is left out,
// its line `unchanged`, and every change to one of the three, a directive added, a file or target
// the base lacks, a case name two cases share, a file the parse cannot read, a refused directive
// and a directive the directive reader places in a case it does not sit in, proves it as without a
// base. A case with no directive is listed only where it, or the file around the cases, changed,
// and a `--base` naming no folder, given twice or naming the tree checked answers with the usage.
//
// Each case makes two fixture projects of revert-fixture.ts, the tree and its base, since the check
// reads the one and runs the other.

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, expect, it } from 'vitest';
import { sweepScratch } from '../../fixtures/scratch.ts';
import {
    DIRECTIVE,
    RULE,
    fixture,
    run,
    runArgs,
    runOver,
    sweepFixtures,
    withFile
} from './revert-fixture.ts';

afterAll(sweepScratch);
afterEach(sweepFixtures);

/** The time a case gets whose check starts Vitest over the fixture, once or twice. */
const LONG = { timeout: 60000 };

const FILE = 'tests/rule.test.js';
const REVERT = `${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`;
const HEAD = ["import { expect, it } from 'vitest';", "import { allowed } from '../src/rule.mjs';"];

/** A cases file of the given lines, under the imports every case of it uses. */
const cases = (...lines: string[]): string => [...HEAD, '', ...lines, ''].join('\n');

/** A case of the given name whose body is the given lines, indented. */
const one = (name: string, ...body: string[]): string[] => [
    `it('${name}', () => {`,
    ...body.map((line) => `    ${line}`),
    '});'
];

const UNDER = one('refuses a size under the limit', REVERT, 'expect(allowed(1)).toBe(false);');
const WHERE = `${FILE} :: refuses a size under the limit (revert src/rule.mjs:2)`;

/** The tree and its base, each with the cases file given. */
function pair(root: string, base: string = root): { dir: string; base: string } {
    return { dir: withFile(fixture(), FILE, root), base: withFile(fixture(), FILE, base) };
}

/** The head of the usage line the check prints for arguments it cannot run with. */
const USAGE = 'usage: node bin/revert-check/revert-check.mjs [--root <dir>] [--base <dir>]';

/** The output's lines, the summary last, with no empty line after it. */
const lines = (out: string): string[] => out.split('\n').filter((line) => line !== '');

it('leaves out a directive whose case, file and target the base holds unchanged', LONG, () => {
    // revert: bin/revert-check/revert-check.mjs "if (leftOut(tree, directive, same)) {" => if (false) {
    const green = one(
        'answers a size over the limit with a boolean',
        REVERT,
        'expect(typeof allowed(3)).toBe("boolean");'
    );
    const { dir, base } = pair(cases(...green));
    const where = `${FILE} :: answers a size over the limit with a boolean (revert src/rule.mjs:2)`;
    const without = run(dir, [FILE]);
    expect(lines(without.out)).toEqual([
        `GREEN     ${where}`,
        '1 reverts, 1 unproven, 0 unchecked'
    ]);
    expect(without.status).toBe(1);
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `unchanged ${where}`,
        '1 reverts, 0 unproven, 0 unchecked, 1 unchanged'
    ]);
    expect(over.status).toBe(0);
});

it('proves a directive whose target changed', LONG, () => {
    // revert: bin/revert-check/base.mjs "return target !== null && target === textIn(base, directive.target);" => return true;
    const { dir, base } = pair(cases(...UNDER));
    withFile(dir, 'src/rule.mjs', `${RULE}// the limit a size must pass\n`);
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${WHERE}`,
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
    expect(over.status).toBe(0);
});

it('proves a directive whose case body changed', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (mine[0].text !== theirs[0].text) return null;" => delete
    const changed = one(
        'refuses a size under the limit',
        REVERT,
        'expect(allowed(1)).toBe(false);',
        'expect(allowed(0)).toBe(false);'
    );
    const { dir, base } = pair(cases(...changed), cases(...UNDER));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${WHERE}`,
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves every directive of a file whose text outside its cases changed', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (here.cases.outside !== there.cases.outside) return null;" => delete
    const two = [
        ...UNDER,
        '',
        ...one('refuses a size at the limit', REVERT, 'expect(allowed(2)).toBe(false);')
    ];
    const { dir, base } = pair(cases('const limit = 2;', '', ...two), cases(...two));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${WHERE}`,
        `red       ${FILE} :: refuses a size at the limit (revert src/rule.mjs:2)`,
        '2 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves a directive added to a case the base holds without it', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (mine[0].text !== theirs[0].text) return null;" => delete
    const bare = one('refuses a size under the limit', 'expect(allowed(1)).toBe(false);');
    const { dir, base } = pair(cases(...UNDER), cases(...bare));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${WHERE}`,
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves a directive whose test file the base does not hold', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (here === null || there === null) return null;" => if (here === null) return null;
    const { dir, base } = pair(cases(...UNDER));
    withFile(dir, 'tests/new.test.js', cases(...UNDER));
    const over = runOver(dir, base, ['tests/new.test.js']);
    expect(lines(over.out)).toEqual([
        'red       tests/new.test.js :: refuses a size under the limit (revert src/rule.mjs:2)',
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves a directive whose target the base does not hold', LONG, () => {
    // revert: bin/revert-check/base.mjs "return target !== null && target === textIn(base, directive.target);" => return target !== null;
    const moved = `${DIRECTIVE} src/moved.mjs "return size > 2;" => return true;`;
    const body = [
        "import { expect, it } from 'vitest';",
        "import { allowed } from '../src/moved.mjs';",
        '',
        ...one('refuses a size under the limit', moved, 'expect(allowed(1)).toBe(false);'),
        ''
    ].join('\n');
    const { dir, base } = pair(body);
    withFile(dir, 'src/moved.mjs', RULE);
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${FILE} :: refuses a size under the limit (revert src/moved.mjs:2)`,
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves the directives of two cases that share a name', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (mine.length !== 1 || theirs.length !== 1) return null;" => delete
    const twice = cases(
        ...UNDER,
        '',
        ...one('refuses a size under the limit', REVERT, 'expect(allowed(0)).toBe(false);')
    );
    const { dir, base } = pair(twice);
    const without = lines(run(dir, [FILE]).out);
    const over = lines(runOver(dir, base, [FILE]).out);
    expect(over.slice(0, -1)).toEqual(without.slice(0, -1));
    expect(over.filter((line) => line.startsWith('unchanged'))).toEqual([]);
    expect(over.at(-1)).toBe(`${without.at(-1)}, 0 unchanged`);
});

it('lists a new case with no directive and leaves an unchanged one unlisted', () => {
    // revert: bin/revert-check/revert-check.mjs "if (same !== null && same.caseUnchanged(one.file, one.caseName)) continue;" => delete
    const kept = [
        ...UNDER,
        '',
        ...one('answers a size over the limit', 'expect(allowed(5)).toBe(true);')
    ];
    const added = one('answers a size far over the limit', 'expect(allowed(50)).toBe(true);');
    const { dir, base } = pair(cases(...kept, '', ...added), cases(...kept));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `unchanged ${WHERE}`,
        `unchecked ${FILE} :: answers a size far over the limit`,
        '1 reverts, 0 unproven, 1 unchecked, 1 unchanged'
    ]);
    expect(over.status).toBe(1);
});

it('answers a --base with no folder after it, or naming a file, with the usage', () => {
    // revert: bin/revert-check/revert-check.mjs "if (files.length === 0 || badBase(tree, bases)) {" => if (files.length === 0) {
    const { dir } = pair(cases(...UNDER));
    for (const tail of [['--base'], ['--base', `${dir}/src/rule.mjs`]]) {
        const held = runArgs(['--root', dir, FILE, ...tail]);
        expect(held.out).toContain(USAGE);
        expect(held.status).toBe(2);
    }
});

it('proves a directive of a file the parse cannot read as without a base', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (ts.transpileModule(text, options).diagnostics.length > 0) return null;" => delete
    const { dir, base } = pair(`${cases(...UNDER)})\n`);
    const without = lines(run(dir, [FILE]).out);
    const over = lines(runOver(dir, base, [FILE]).out);
    expect(over.slice(0, -1)).toEqual(without.slice(0, -1));
    expect(over.filter((line) => line.startsWith('unchanged'))).toEqual([]);
    expect(over.at(-1)).toBe(`${without.at(-1)}, 0 unchanged`);
});

it('reports a refused directive the base holds unchanged as it is refused', () => {
    // revert: bin/revert-check/revert-check.mjs "return same !== null && refusal(tree, directive) === null && same.directiveUnchanged(directive);" => return same !== null && same.directiveUnchanged(directive);
    const missing = `${DIRECTIVE} src/rule.mjs "return size > 3;" => return true;`;
    const { dir, base } = pair(
        cases(...one('refuses a size under the limit', missing, 'expect(allowed(1)).toBe(false);'))
    );
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `unproven  ${FILE}:5 names src/rule.mjs "return size > 3;", which matches 0 lines`,
        '1 reverts, 1 unproven, 0 unchecked, 0 unchanged'
    ]);
});

it('proves a directive the reader places in a case other than the one it sits in', LONG, () => {
    // revert: bin/revert-check/base.mjs "if (at < same.found.start || at >= same.found.end) return false;" => delete
    const skipped = (...body: string[]): string[] => [
        "it.skip.each([1])('skips a size', () => {",
        ...body.map((line) => `    ${line}`),
        '});'
    ];
    const under = one('refuses a size under the limit', 'expect(allowed(1)).toBe(false);');
    const { dir, base } = pair(
        cases(...under, '', ...skipped(REVERT, 'expect(true).toBe(true);')),
        cases(...under, '', ...skipped('expect(true).toBe(true);'))
    );
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([
        `red       ${FILE} :: refuses a size under the limit (revert src/rule.mjs:2)`,
        '1 reverts, 0 unproven, 0 unchecked, 0 unchanged'
    ]);
});

/** A case with no directive, in the shape the unchecked listing names. */
const BARE = one('answers a size over the limit', 'expect(allowed(5)).toBe(true);');
const BARE_LINE = `unchecked ${FILE} :: answers a size over the limit`;

it('lists a case with no directive whose body changed', () => {
    // revert: bin/revert-check/base.mjs "caseUnchanged: (file, name) => sameCase(file, name) !== null," => caseUnchanged: () => true,
    const changed = one(
        'answers a size over the limit',
        'expect(allowed(5)).toBe(true);',
        'expect(allowed(6)).toBe(true);'
    );
    const { dir, base } = pair(cases(...changed), cases(...BARE));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([BARE_LINE, '0 reverts, 0 unproven, 1 unchecked, 0 unchanged']);
    expect(over.status).toBe(1);
});

it('lists a case with no directive in a file whose text outside its cases changed', () => {
    // revert: bin/revert-check/revert-check.mjs "if (same !== null && same.caseUnchanged(one.file, one.caseName)) continue;" => if (same !== null) continue;
    const { dir, base } = pair(cases('const limit = 2;', '', ...BARE), cases(...BARE));
    const over = runOver(dir, base, [FILE]);
    expect(lines(over.out)).toEqual([BARE_LINE, '0 reverts, 0 unproven, 1 unchecked, 0 unchanged']);
    expect(over.status).toBe(1);
});

it('answers a --base given twice with the usage', () => {
    // revert: bin/revert-check/revert-check.mjs "if (bases.length > 1) return true;" => delete
    const { dir, base } = pair(cases(...UNDER));
    const held = runArgs(['--root', dir, '--base', base, '--base', base, FILE]);
    expect(held.out).toContain(USAGE);
    expect(held.status).toBe(2);
});

it('answers a --base naming the tree checked, by its path or through a link, with the usage', () => {
    // revert: bin/revert-check/revert-check.mjs "return real(bases[0]) === real(tree);" => return false;
    const { dir, base } = pair(cases(...UNDER));
    const link = join(base, 'tree');
    symlinkSync(dir, link, 'dir');
    for (const named of [dir, link]) {
        const held = runArgs(['--root', dir, '--base', named, FILE]);
        expect(held.out).toContain(USAGE);
        expect(held.status).toBe(2);
    }
});
