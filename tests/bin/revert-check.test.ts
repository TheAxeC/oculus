// Layer 4, test. The revert check over a tree of its own: a case whose named revert turns it red, a
// case that stays green with its revert applied, a case that names no revert at all, and the four
// shapes in which a revert proves nothing and must say so rather than call itself red.
//
// The fixture is a whole little project, since the check copies the tree it is given and runs one
// case inside the copy; the dependencies are reached by a link to this project's node_modules, so a
// case costs one vitest start rather than an install.

import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../scratch.ts';

afterAll(sweepScratch);

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** The rule the fixture's cases are written over, whose second line the reverts name. */
const RULE = ['export function allowed(size) {', '    return size > 2;', '}', ''].join('\n');

/**
 * The word a directive opens with, built here rather than written out.
 *
 * A line of this file that reads as a directive would be read as one by the check itself when it
 * runs over this file, and would name a path only the fixture has.
 */
const DIRECTIVE = ['//', 'revert:'].join(' ');

const CASES = [
    "import { expect, it } from 'vitest';",
    "import { allowed } from '../src/rule.mjs';",
    '',
    "it('refuses a size under the limit', () => {",
    `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
    '    expect(allowed(1)).toBe(false);',
    '});',
    '',
    "it('answers a size over the limit with a boolean', () => {",
    `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
    '    expect(typeof allowed(3)).toBe("boolean");',
    '});',
    '',
    "it('names no revert of its own', () => {",
    '    expect(allowed(5)).toBe(true);',
    '});',
    ''
].join('\n');

/** A project the check can copy and run: the rule, the cases over it, and the dependencies. */
function fixture(): string {
    const dir = scratchDir('oculus-revert-fixture-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'tests'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{ "name": "fixture", "private": true }\n');
    writeFileSync(join(dir, 'src', 'rule.mjs'), RULE);
    writeFileSync(join(dir, 'tests', 'rule.test.js'), CASES);
    symlinkSync(join(process.cwd(), 'node_modules'), join(dir, 'node_modules'), 'dir');
    return dir;
}

/** The fixture with one file written over it, for a case that needs another shape. */
function withFile(dir: string, rel: string, body: string): string {
    const full = join(dir, rel);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return dir;
}

/** The check over the fixture, as the verification list runs it. */
function run(dir: string, files: string[]): { out: string; status: number | null } {
    const held = spawnSync('node', ['bin/revert-check.mjs', '--root', dir, ...files], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    return { out: held.stdout, status: held.status };
}

describe('the revert check', () => {
    it(
        'calls a case red when its revert breaks it and GREEN when it does not',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check.mjs:388 => if (run.green) return { ok: true, line: `red       ${where}` };
            const dir = fixture();
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'red       tests/rule.test.js :: refuses a size under the limit (revert src/rule.mjs:2)'
            );
            expect(held.out).toContain(
                'GREEN     tests/rule.test.js :: answers a size over the limit with a boolean (revert src/rule.mjs:2)'
            );
            expect(held.out).toContain('2 reverts, 1 unproven');
            expect(held.status).toBe(1);
        }
    );

    it('lists a case with no machine-readable revert as unchecked, never as passed', () => {
        // revert: bin/revert-check.mjs:422 => delete
        const dir = fixture();
        writeFileSync(
            join(dir, 'tests', 'rule.test.js'),
            CASES.split('\n')
                .filter((line) => !line.includes('// revert:'))
                .join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unchecked tests/rule.test.js :: refuses a size under the limit'
        );
        expect(held.out).toContain('unchecked tests/rule.test.js :: names no revert of its own');
        expect(held.out).toContain('0 reverts, 0 unproven, 3 unchecked');
        expect(held.out).not.toContain('red ');
        expect(held.status).toBe(1);
    });

    it('refuses a directive whose file or line the tree does not hold', () => {
        // revert: bin/revert-check.mjs:171 => if (false) {
        const dir = fixture();
        writeFileSync(
            join(dir, 'tests', 'rule.test.js'),
            [
                "it('names a line past the end', () => {",
                `    ${DIRECTIVE} src/rule.mjs:99 => return true;`,
                '    expect(1).toBe(1);',
                '});',
                "it('names a file that is not there', () => {",
                `    ${DIRECTIVE} src/gone.mjs:1 => return true;`,
                '    expect(1).toBe(1);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain('no line   tests/rule.test.js:2 names src/rule.mjs:lines 99-99');
        expect(held.out).toContain('no file   tests/rule.test.js:6 names src/gone.mjs');
        expect(held.status).toBe(1);
    });

    // A nested vitest start of its own, so the case gets a budget the default five seconds is not.
    it(
        'calls a case whose name holds a bracket by that name, and not by it as a pattern',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check.mjs:229 => const escaped = caseName;
            const dir = fixture();
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('a name with a bracket (like this one', () => {",
                    `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                    '    expect(allowed(5)).toBe(true);',
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'GREEN     tests/rule.test.js :: a name with a bracket (like this one'
            );
            expect(held.out).toContain('1 reverts, 1 unproven');
            expect(held.status).toBe(1);
        }
    );

    it('calls a revert the build refused unproven, never red', { timeout: 60000 }, () => {
        // revert: bin/revert-check.mjs:300 => if (built.status !== 0) return { ran: true, green: false };
        const dir = fixture();
        writeFileSync(
            join(dir, 'package.json'),
            '{ "name": "fixture", "private": true, "scripts": { "build": "exit 1" } }\n'
        );
        withFile(
            dir,
            'tests/browser/look.spec.ts',
            [
                "import { expect, test } from '@playwright/test';",
                '',
                "test('a look the build has to serve', () => {",
                `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                '    expect(1).toBe(1);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/browser/look.spec.ts']);
        expect(held.out).toContain(
            'unproven  tests/browser/look.spec.ts :: a look the build has to serve'
        );
        expect(held.out).toContain('[the build refused the revert]');
        expect(held.out).not.toContain('red ');
        expect(held.out).toContain('1 reverts, 1 unproven');
        expect(held.status).toBe(1);
    });

    it(
        'calls a replacement that leaves the file unparsable unproven, never red',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check.mjs:281 => if (held.length === 0) return { ran: true, green: false };
            const dir = fixture();
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('refuses a size under the limit', () => {",
                    `    ${DIRECTIVE} src/rule.mjs:2 => return (;`,
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'unproven  tests/rule.test.js :: refuses a size under the limit'
            );
            expect(held.out).toContain('[the case did not run]');
            expect(held.out).not.toContain('red ');
            expect(held.status).toBe(1);
        }
    );

    it(
        'names a directive whose target a copy leaves behind, and runs the ones after it',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check.mjs:351 => if (false) {
            const dir = fixture();
            withFile(dir, '.scratch/plan.md', 'a plan the copy leaves behind\n');
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('names a target the copy leaves behind', () => {",
                    `    ${DIRECTIVE} .scratch/plan.md:1 => changed`,
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    '',
                    "it('refuses a size under the limit', () => {",
                    `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain('.scratch/plan.md, which a copy of the tree leaves behind');
            expect(held.out).toContain(
                'red       tests/rule.test.js :: refuses a size under the limit'
            );
            expect(held.out).toContain('2 reverts, 1 unproven');
            expect(held.status).toBe(1);
        }
    );

    it('calls a skipped case unproven, and one another case excludes', { timeout: 120000 }, () => {
        // revert: bin/revert-check.mjs:284 => if (held[0] === 'skipped') return { ran: true, green: false };
        const dir = fixture();
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it.skip('a case skipped by itself', () => {",
                `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                '',
                "it('a case another case excludes', () => {",
                `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                '',
                "it.only('the case that excludes it', () => {",
                '    expect(allowed(5)).toBe(true);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js :: a case skipped by itself (revert src/rule.mjs:2) [the case was skipped]'
        );
        expect(held.out).toContain(
            'unproven  tests/rule.test.js :: a case another case excludes (revert src/rule.mjs:2) [the case was skipped]'
        );
        expect(held.out).not.toContain('red ');
        expect(held.out).toContain('2 reverts, 2 unproven');
        expect(held.status).toBe(1);
    });

    it(
        'calls a title two cases share unproven, however the siblings ran',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check.mjs:282 => if (held.length > 99)
            const dir = fixture();
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('one name, two cases', () => {",
                    `    ${DIRECTIVE} src/rule.mjs:2 => return true;`,
                    '    expect(allowed(5)).toBe(true);',
                    '});',
                    '',
                    "it('one name, two cases', () => {",
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain('[the file holds 2 cases of that name]');
            expect(held.out).not.toContain('red ');
            expect(held.status).toBe(1);
        }
    );

    it('calls a revert that changes nothing unproven', () => {
        // revert: bin/revert-check.mjs:155 => if (false) {
        const dir = fixture();
        withFile(
            dir,
            'src/rule.mjs',
            [
                '// the limit a size is held to',
                'export function allowed(size) {',
                '    return size > 2;',
                '}',
                ''
            ].join('\n')
        );
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('names the comment above the rule', () => {",
                `    ${DIRECTIVE} src/rule.mjs:1 => // another comment`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                '',
                "it('names the rule and writes it back', () => {",
                `    ${DIRECTIVE} src/rule.mjs:3 => return size > 2;`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain('where the line it names is blank or a comment');
        expect(held.out).toContain('where the replacement is the line it replaces');
        expect(held.out).not.toContain('red ');
        expect(held.out).toContain('2 reverts, 2 unproven');
        expect(held.status).toBe(1);
    });

    it('refuses a target that escapes the tree, and writes nothing outside the copy', () => {
        // revert: bin/revert-check.mjs:339 => if (false) {
        const dir = fixture();
        const outside = join(dir, '..', `escape-target-${basename(dir)}.txt`);
        writeFileSync(outside, 'the file a directive must not reach\n');
        made.push(outside);
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('names a path outside the tree', () => {",
                `    ${DIRECTIVE} ../escape-target-${basename(dir)}.txt:1 => changed`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain('which is outside the tree');
        expect(held.out).not.toContain('red ');
        expect(readFileSync(outside, 'utf8')).toBe('the file a directive must not reach\n');
        expect(held.status).toBe(1);
    });

    // Revert: in real of bin/revert-check.mjs, compare the path as written instead of following the
    // links on it, and a symlink inside the tree carries the edit to the file it names outside.
    it('names a directive whose target is a symlink out of the tree', { timeout: 120000 }, () => {
        // revert: bin/revert-check.mjs:116 => const held = resolve(path);
        const dir = fixture();
        const outside = join(dir, '..', `link-target-${basename(dir)}.txt`);
        writeFileSync(outside, 'the file a link must not reach\n');
        made.push(outside);
        symlinkSync(outside, join(dir, 'tests', 'link.txt'));
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('names a symlink that leaves the tree', () => {",
                `    ${DIRECTIVE} tests/link.txt:1 => changed by the directive`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain('which is outside the tree');
        expect(held.out).not.toContain('red ');
        expect(readFileSync(outside, 'utf8')).toBe('the file a link must not reach\n');
        expect(held.status).toBe(1);
    });

    it('reads a directive on the line above a case as that case', { timeout: 120000 }, () => {
        // revert: bin/revert-check.mjs:115 => const under = null;
        const dir = fixture();
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('the case above', () => {",
                '    expect(allowed(5)).toBe(true);',
                '});',
                '',
                `${DIRECTIVE} src/rule.mjs:2 => return true;`,
                "it('the case the directive opens', () => {",
                '    expect(allowed(1)).toBe(false);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'red       tests/rule.test.js :: the case the directive opens (revert src/rule.mjs:2)'
        );
        expect(held.out).toContain('unchecked tests/rule.test.js :: the case above');
        expect(held.status).toBe(1);
    });
});
