// Layer 4, test. The revert check over a tree of its own: a case whose named revert turns it red, a
// case that stays green with its revert applied, a case that names no revert at all, the four
// shapes in which a revert proves nothing and must say so rather than call itself red, and the
// port a browser case waits for, with the report that says another run held it. A directive names
// its target line by the line's text: an anchor, an offset below it and a range resolve to their
// lines, and an anchor that matches no line or several, an offset past the end, a target line that
// went, and a directive that names its line by number are unproven, never resolved to a guess.
//
// A unit case is tried in memory before any copy: a case proven red there without a copy, a case
// that reads its target from disk and goes to the copy, one green both ways, one that fails with no
// revert and is never called red, the run's own temporary folder, gone at the end and on a signal,
// and the run's own copy of the tree, which takes what a reverted line writes and is made again
// after it.
//
// The fixture (revert-fixture.ts) is a whole little project, since the check runs the tree it is
// given, in memory or in a copy.

import { existsSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import {
    CASES,
    DIRECTIVE,
    RULE,
    LOCK_IMPORTS,
    LOCK_WRITER,
    STUCK_WRITER,
    UP_WRITER,
    NOTE_WRITER,
    RULE_IMPORT,
    TEMP_WRITER,
    afterWriter,
    caseWith,
    fixture,
    oneCase,
    resolved,
    run,
    stoppedAt,
    sweepAfter,
    sweepFixtures,
    unwritableTemp,
    withFile,
    withLockingCase
} from './revert-fixture.ts';

afterAll(sweepScratch);

/** The time a case gets whose check runs a fixture's files three times over. */
const LONG = { timeout: 180000 };
afterEach(sweepFixtures);

describe('a directive names its target line by the text of the line', () => {
    it('reads an anchor as the one line whose trimmed text equals it', () => {
        // revert: bin/revert-check/directives.mjs "at = one + 1;" => at = one;
        const dir = caseWith('src/rule.mjs "return size > 2;" => return true;');
        expect(resolved(dir, 'tests/rule.test.js')).toEqual([{ first: 2, last: 2, problem: '' }]);
    });

    it('counts an offset down from its anchor', () => {
        // revert: bin/revert-check/directives.mjs "const line = at + anchor.offset;" => const line = at;
        const dir = caseWith('src/rule.mjs "export function allowed(size) {" +1 => return true;');
        expect(resolved(dir, 'tests/rule.test.js')).toEqual([{ first: 2, last: 2, problem: '' }]);
    });

    it('reads a range as its first line and its last', () => {
        // revert: bin/revert-check/directives.mjs "const last = match[4] === undefined ? first : anchorOf(match[4], match[5]);" => const last = first;
        const dir = caseWith('src/rule.mjs "export function allowed(size) {" .. "}" => delete');
        expect(resolved(dir, 'tests/rule.test.js')).toEqual([{ first: 1, last: 3, problem: '' }]);
    });

    it('calls an anchor matching no line or two unproven, with the count it found', () => {
        // revert: bin/revert-check/directives.mjs "if (found !== 1) return { line: 0, why: `which matches ${found} lines` };" => if (found === 0) return { line: 0, why: 'which matches 0 lines' };
        const dir = caseWith(
            'src/rule.mjs "return size > 3;" => return true;',
            'src/twice.mjs "x();" => delete'
        );
        withFile(dir, 'src/twice.mjs', 'x();\nx();\n');
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:2 names src/rule.mjs "return size > 3;", which matches 0 lines'
        );
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:3 names src/twice.mjs "x();", which matches 2 lines'
        );
        expect(held.out).toContain('2 reverts, 2 unproven');
        expect(held.status).toBe(1);
    });

    it('calls an offset that runs past the end of the file unproven', () => {
        // revert: bin/revert-check/directives.mjs "if (line > lines.length) {" => if (false) {
        const dir = caseWith('src/rule.mjs "}" +3 => return true;');
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:2 names src/rule.mjs "}" +3, which runs to line 6 of 4'
        );
        expect(held.status).toBe(1);
    });

    it('calls a directive whose target line went unproven, and never reverts another line', () => {
        // revert: bin/revert-check/directives.mjs "if (lines[one].trim() !== anchor.text) continue;" => if (!lines[one].includes(anchor.text.slice(0, 11))) continue;
        const dir = caseWith('src/rule.mjs "return size > 2;" => return true;');
        withFile(dir, 'src/rule.mjs', RULE.replace('size > 2', 'size >= 3'));
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:2 names src/rule.mjs "return size > 2;", which matches 0 lines'
        );
        expect(held.out).not.toContain('red ');
        expect(held.status).toBe(1);
    });

    it('calls a directive whose quoted text is not a JSON string unproven', () => {
        // revert: bin/revert-check/directives.mjs "return { problem: `names ${match[1]} by a text that is not a JSON string` };" => return null;
        const dir = caseWith('src/rule.mjs "x\\q" => return true;');
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:2 names src/rule.mjs by a text that is not a JSON string'
        );
        expect(held.status).toBe(1);
    });

    it('refuses a directive that names its line by number, and says to convert it', () => {
        // revert: bin/revert-check/directives.mjs "return NUMBERED.test(line) ? { problem: 'names a line number; convert it' } : null;" => return null;
        const dir = caseWith('src/rule.mjs:2 => return true;');
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'unproven  tests/rule.test.js:2 names a line number; convert it'
        );
        expect(held.out).toContain('1 reverts, 1 unproven, 0 unchecked');
        expect(held.status).toBe(1);
    });
});

describe('the revert check', () => {
    it(
        'calls a case red when its revert breaks it and GREEN when it does not',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check/copy.mjs "if (run.green) return failed(`GREEN     ${where}`);" => if (run.green) return { ok: true, line: `red       ${where}` };
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
        // revert: bin/revert-check/revert-check.mjs "process.stdout.write(`unchecked ${one.file} :: ${one.caseName}\\n`);" => delete
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

    it('refuses a directive whose file the tree does not hold, or whose range runs backwards', () => {
        // revert: bin/revert-check/directives.mjs "if (first < 1 || last > lines.length || last < first) {" => if (false) {
        const dir = fixture();
        writeFileSync(
            join(dir, 'tests', 'rule.test.js'),
            [
                "it('names a line past the end', () => {",
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" .. "export function allowed(size) {" => return true;`,
                '    expect(1).toBe(1);',
                '});',
                "it('names a file that is not there', () => {",
                `    ${DIRECTIVE} src/gone.mjs "return size > 2;" => return true;`,
                '    expect(1).toBe(1);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'no line   tests/rule.test.js:2 names src/rule.mjs:lines 2-1 of 4'
        );
        expect(held.out).toContain('no file   tests/rule.test.js:6 names src/gone.mjs');
        expect(held.status).toBe(1);
    });

    // A nested vitest start of its own, so the case gets a budget the default five seconds is not.
    it(
        'calls a case whose name holds a bracket by that name, and not by it as a pattern',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check/copy.mjs "const escaped = caseName.replace(/[.*+?^${}()|[\\]\\\\]/g, (one) => `\\\\${one}`);" => const escaped = caseName;
            const dir = fixture();
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('a name with a bracket (like this one', () => {",
                    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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
        // revert: bin/revert-check/copy.mjs "if (built.status !== 0) return { ran: false, why: 'the build refused the revert' };" => if (built.status !== 0) return { ran: true, green: false };
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
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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
            // revert: bin/revert-check/copy.mjs "if (held.length === 0) return { ran: false, why: 'the case did not run' };" => if (held.length === 0) return { ran: true, green: false };
            // A TypeScript module, which node cannot parse on its own, so the run itself is what
            // finds it broken.
            const dir = withFile(
                fixture(),
                'src/rule.ts',
                RULE.replace('(size)', '(size: number)')
            );
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.ts';",
                    '',
                    "it('refuses a size under the limit', () => {",
                    `    ${DIRECTIVE} src/rule.ts "return size > 2;" => return (;`,
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
            // revert: bin/revert-check/copy.mjs "if (SKIPPED.includes(directive.target.split('/')[0])) {" => if (false) {
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
                    `    ${DIRECTIVE} .scratch/plan.md "a plan the copy leaves behind" => changed`,
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    '',
                    "it('refuses a size under the limit', () => {",
                    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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
        // revert: bin/revert-check/copy.mjs "if (held[0] === 'skipped') return { ran: false, why: 'the case was skipped' };" => if (held[0] === 'skipped') return { ran: true, green: false };
        const dir = fixture();
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it.skip('a case skipped by itself', () => {",
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                '',
                "it('a case another case excludes', () => {",
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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
            // revert: bin/revert-check/copy.mjs "if (held.length > 1)" => if (held.length > 99)
            const dir = fixture();
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { expect, it } from 'vitest';",
                    "import { allowed } from '../src/rule.mjs';",
                    '',
                    "it('one name, two cases', () => {",
                    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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
        // revert: bin/revert-check/directives.mjs "if (named.every(inert)) {" => if (false) {
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
                `    ${DIRECTIVE} src/rule.mjs "// the limit a size is held to" => // another comment`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                '',
                "it('names the rule and writes it back', () => {",
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return size > 2;`,
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
        // revert: bin/revert-check/copy.mjs "if (!inside(root, target)) {" => if (false) {
        const dir = fixture();
        const outside = join(dir, '..', `escape-target-${basename(dir)}.txt`);
        writeFileSync(outside, 'the file a directive must not reach\n');
        sweepAfter(outside);
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('names a path outside the tree', () => {",
                `    ${DIRECTIVE} ../escape-target-${basename(dir)}.txt "the file a directive must not reach" => changed`,
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

    // Revert: in real of bin/revert-check/directives.mjs, compare the path as written instead of
    // following the links on it, and a symlink inside the tree carries the edit to the file it
    // names outside.
    it('names a directive whose target is a symlink out of the tree', { timeout: 120000 }, () => {
        // revert: bin/revert-check/directives.mjs "return realpathSync(held);" => return held;
        const dir = fixture();
        const outside = join(dir, '..', `link-target-${basename(dir)}.txt`);
        writeFileSync(outside, 'the file a link must not reach\n');
        sweepAfter(outside);
        symlinkSync(outside, join(dir, 'tests', 'link.txt'));
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('names a symlink that leaves the tree', () => {",
                `    ${DIRECTIVE} tests/link.txt "the file a link must not reach" => changed by the directive`,
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
        // revert: bin/revert-check/directives.mjs "const under = next < lines.length ? caseName(lines, next) : null;" => const under = null;
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
                `${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
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

    it('leaves nothing a case made in the temporary directory', { timeout: 120000 }, () => {
        // revert: bin/revert-check/copy.mjs "const env = { ...process.env, CI: '1', TMPDIR: temp, NODE_DISABLE_COMPILE_CACHE: '1' };" => const env = { ...process.env, CI: '1' };
        const dir = fixture();
        const probe = `oculus-leak-probe-${basename(dir)}-`;
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { mkdtempSync } from 'node:fs';",
                "import { tmpdir } from 'node:os';",
                "import { join } from 'node:path';",
                "import { expect, it } from 'vitest';",
                "import { allowed } from '../src/rule.mjs';",
                '',
                "it('makes a folder it never removes', () => {",
                `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
                `    mkdtempSync(join(tmpdir(), '${probe}'));`,
                '    expect(allowed(1)).toBe(false);',
                '});',
                ''
            ].join('\n')
        );
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'red       tests/rule.test.js :: makes a folder it never removes'
        );
        const left = readdirSync(tmpdir()).filter((name) => name.startsWith(probe));
        for (const name of left) rmSync(join(tmpdir(), name), { recursive: true, force: true });
        expect(left).toEqual([]);
    });

    // A browser case takes the copy path with no in-memory run beside it, so the copy's own
    // handlers are all that stands between a signal and a copy left behind.
    it(
        'removes its copy of the tree when it is stopped by a signal',
        { timeout: 120000 },
        async () => {
            // revert: bin/revert-check/copy.mjs "for (const signal of SIGNALS) process.once(signal, stopped);" => delete
            const dir = fixture();
            const slow = { build: 'node -e "setTimeout(() => {}, 3000)"' };
            writeFileSync(
                join(dir, 'package.json'),
                JSON.stringify({ name: 'fixture', private: true, scripts: slow })
            );
            withFile(
                dir,
                'tests/browser/look.spec.ts',
                [
                    "import { expect, test } from '@playwright/test';",
                    '',
                    "test('a look whose build takes a few seconds', () => {",
                    `    ${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
                    '    expect(1).toBe(1);',
                    '});',
                    ''
                ].join('\n')
            );
            expect(await stoppedAt(dir, 'tests/browser/look.spec.ts', 1)).toEqual([]);
        }
    );

    it(
        'calls a revert that breaks the syntax of a script the case runs unproven, never red',
        {
            timeout: 120000
        },
        () => {
            // revert: bin/revert-check/copy.mjs "if (/\\.(mjs|cjs|js)$/.test(directive.target)) {" => if (false) {
            const dir = fixture();
            withFile(dir, 'src/tool.mjs', "console.log('ran');\n");
            withFile(
                dir,
                'tests/rule.test.js',
                [
                    "import { spawnSync } from 'node:child_process';",
                    "import { expect, it } from 'vitest';",
                    '',
                    "it('runs the tool to its end', () => {",
                    `    ${DIRECTIVE} src/tool.mjs "console.log('ran');" => console.log('ran';`,
                    "    expect(spawnSync('node', ['src/tool.mjs']).status).toBe(0);",
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain('names src/tool.mjs:1, which the revert leaves unparsable');
            expect(held.out).not.toContain('red ');
            expect(held.status).toBe(1);
        }
    );

    it(
        'reads a directive above the prose revert of a case as that case',
        { timeout: 120000 },
        () => {
            // revert: bin/revert-check/directives.mjs "while (next < lines.length && COMMENT.test(lines[next])) next += 1;" => delete
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
                    `${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
                    '// Revert: let every size through in allowed of src/rule.mjs.',
                    "it('the case under the prose', () => {",
                    '    expect(allowed(1)).toBe(false);',
                    '});',
                    ''
                ].join('\n')
            );
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'red       tests/rule.test.js :: the case under the prose (revert src/rule.mjs:2)'
            );
            expect(held.out).toContain('unchecked tests/rule.test.js :: the case above');
        }
    );
});

describe('a unit case, tried in memory before any copy', () => {
    it('proves red in memory a case the copy could not copy', { timeout: 120000 }, () => {
        // revert: bin/revert-check/revert-check.mjs "if (proven) return { ok: true, line: `red       ${whereOf(directive)}` };" => delete
        const dir = fixture();
        oneCase(dir, LOCK_IMPORTS, 'refuses a size under the limit', [
            withLockingCase(dir),
            'expect(allowed(1)).toBe(false);'
        ]);
        const held = run(dir, ['tests/rule.test.js']);
        expect(held.out).toContain(
            'red       tests/rule.test.js :: refuses a size under the limit (revert src/rule.mjs:2)'
        );
        expect(held.out).toContain('1 reverts, 0 unproven, 0 unchecked');
        expect(held.status).toBe(0);
    });

    it(
        'sends a case that reads its target from disk to the copy, which proves it red',
        {
            timeout: 120000
        },
        () => {
            // revert: bin/revert-check/revert-check.mjs "return checkOne(root, directive, parsed);" => return { ok: false, line: 'GREEN' };
            const dir = fixture();
            oneCase(dir, ["import { readFileSync } from 'node:fs';"], 'reads the rule from disk', [
                "const rule = readFileSync(new URL('../src/rule.mjs', import.meta.url), 'utf8');",
                "expect(rule).toContain('size > 2');"
            ]);
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'red       tests/rule.test.js :: reads the rule from disk (revert src/rule.mjs:2)'
            );
            expect(held.out).toContain('1 reverts, 0 unproven, 0 unchecked');
        }
    );

    it(
        'calls a case its revert leaves green in memory and in the copy GREEN',
        {
            timeout: 120000
        },
        () => {
            // revert: bin/revert-check/memory.mjs "if (held === null || held.length !== 1 || held[0] !== 'failed') return false;" => if (held === null || held.length !== 1) return false;
            const dir = fixture();
            oneCase(dir, RULE_IMPORT, 'answers with a boolean', [
                "expect(typeof allowed(3)).toBe('boolean');"
            ]);
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toContain(
                'GREEN     tests/rule.test.js :: answers with a boolean (revert src/rule.mjs:2)'
            );
            expect(held.out).not.toContain('red ');
            expect(held.out).toContain('1 reverts, 1 unproven, 0 unchecked');
        }
    );

    it(
        'never calls red a case that fails with no revert, and leaves it to the copy',
        {
            timeout: 120000
        },
        () => {
            // revert: bin/revert-check/memory.mjs "return base !== null && base.length === 1 && base[0] === 'passed';" => return true;
            const dir = fixture();
            oneCase(dir, LOCK_IMPORTS, 'fails whatever the rule says', [
                withLockingCase(dir),
                'expect(allowed(5)).toBe(false);'
            ]);
            const held = run(dir, ['tests/rule.test.js']);
            expect(held.out).toMatch(
                /^unproven {2}tests\/rule\.test\.js:6 names src\/rule\.mjs: /m
            );
            expect(held.out).not.toContain('red ');
            expect(held.out).toContain('1 reverts, 1 unproven, 0 unchecked');
        }
    );

    it(
        'leaves no folder of its own in the temporary directory it was given',
        {
            timeout: 120000
        },
        () => {
            // revert: bin/revert-check/memory.mjs "await restart();" +2 => delete
            const dir = fixture();
            const temp = scratchDir('oculus-revert-temp-');
            expect(resolve(temp).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            const held = run(dir, ['tests/rule.test.js'], { ...process.env, TMPDIR: temp });
            expect(held.out).toContain(
                'red       tests/rule.test.js :: refuses a size under the limit (revert src/rule.mjs:2)'
            );
            expect(readdirSync(temp)).toEqual([]);
        }
    );

    it('removes its run folder when it is stopped by a signal', { timeout: 120000 }, async () => {
        // revert: bin/revert-check/memory.mjs "for (const signal of SIGNALS) process.on(signal, stop);" => delete
        const dir = fixture();
        oneCase(dir, RULE_IMPORT, 'takes a few seconds', [
            'await new Promise((done) => setTimeout(done, 3000));',
            'expect(allowed(1)).toBe(false);'
        ]);
        expect(await stoppedAt(dir, 'tests/rule.test.js', 1)).toEqual([]);
    });

    it('runs cases on a copy of its own, made again after a case wrote into it', LONG, () => {
        // revert: bin/revert-check/memory.mjs "return await within(env, run.base, async () => {" => return await within(env, root, async () => {
        // revert: bin/revert-check/memory.mjs "if (listing(folder, skipped) !== run.listed) await restart();" => delete
        const { dir } = afterWriter(NOTE_WRITER);
        expect(existsSync(join(dir, 'note.txt'))).toBe(false);
    });

    it('empties the temporary directory before each run in memory', LONG, () => {
        // revert: bin/revert-check/memory.mjs "if (run === null) return null;" +2 => delete
        afterWriter(TEMP_WRITER);
    });

    it('reads a file a case locked as a change to the copy', LONG, () => {
        // revert: bin/revert-check/memory.mjs "lines.push(`${full} ${held.mode}${file}`);" => lines.push(`${full}${file}`);
        afterWriter(LOCK_WRITER);
    });

    it('empties its run folder of what a case wrote beside the copy', LONG, () => {
        // revert: bin/revert-check/memory.mjs "for (const one of readdirSync(folder)) rmSync(join(folder, one), { recursive: true });" => rmSync(tree, { recursive: true, force: true });
        afterWriter(UP_WRITER);
    });

    it('removes what a case left locked in its temporary directory', LONG, () => {
        // revert: bin/revert-check/memory.mjs "const unlock = (path) => spawnSync('chmod', ['-R', 'u+rwx', path]);" => const unlock = () => {};
        // Its own temporary directory, which the sweep unlocks and removes, holds what a run that
        // leaves the locked folder behind leaves there.
        const temp = unwritableTemp();
        const { out } = afterWriter(STUCK_WRITER, { ...process.env, TMPDIR: temp });
        expect(out).not.toContain('kept');
        expect(readdirSync(temp)).toEqual([]);
    });
});

describe("a case's copy, on its way out", () => {
    it('is said and not thrown over when the case left it unremovable', { timeout: 120000 }, () => {
        // revert: bin/revert-check/copy.mjs "for (let pass = 0; pass < 5; pass += 1) {" .. "process.stdout.write(`kept      ${dir}\\n`);" +2 => rmSync(dir, { recursive: true, force: true });
        const dir = fixture();
        withFile(
            dir,
            'tests/rule.test.js',
            [
                "import { chmodSync, readFileSync } from 'node:fs';",
                "import { join } from 'node:path';",
                "import { expect, it } from 'vitest';",
                '',
                `${DIRECTIVE} src/rule.mjs "return size > 2;" => return true;`,
                "it('the case', () => {",
                // The case reads the rule from disk, so it stays green in memory and the copy
                // runs it; there, with the revert in the file, it takes the write bit off a folder
                // of its own copy, which is what a child still writing into the copy does to the
                // removal.
                "    const rule = readFileSync(join(process.cwd(), 'src', 'rule.mjs'), 'utf8');",
                "    if (!rule.includes('size > 2')) chmodSync(join(process.cwd(), 'src'), 0o500);",
                "    expect(rule).toContain('size > 2');",
                '});',
                ''
            ].join('\n')
        );

        const temp = unwritableTemp();
        const held = run(dir, ['tests/rule.test.js'], { ...process.env, TMPDIR: temp });
        expect(held.out).toContain('1 reverts, 0 unproven');
        expect(held.out).toMatch(/^kept {6}\S+:/m);
    });
});

describe('a case the check runs', () => {
    it('runs with the compile cache off, so no child writes into its copy as it exits', () => {
        // revert: bin/revert-check/copy.mjs "const env = { ...process.env, CI: '1', TMPDIR: temp, NODE_DISABLE_COMPILE_CACHE: '1' };" => const env = { ...process.env, CI: '1', TMPDIR: temp };
        const dir = fixture();
        const held = spawnSync(
            process.execPath,
            [
                '--input-type=module',
                '-e',
                "const m = await import('./bin/revert-check/copy.mjs'); process.stdout.write(String(m.caseEnv(process.argv[1]).NODE_DISABLE_COMPILE_CACHE));",
                dir
            ],
            // The flag is out of what the child inherits, so only the line under test sets it.
            {
                cwd: process.cwd(),
                encoding: 'utf8',
                env: Object.fromEntries(
                    Object.entries(process.env).filter(
                        ([name]) => name !== 'NODE_DISABLE_COMPILE_CACHE'
                    )
                )
            }
        );
        expect(held.stdout).toBe('1');
    });
});

describe('a browser case and the port its server takes', () => {
    /** What one function of the check answers for JSON arguments, run in a process of its own. */
    function answer(name: string, ...args: unknown[]): string {
        const call = `const m = await import('./bin/revert-check/copy.mjs'); process.stdout.write(JSON.stringify(m.${name}(...JSON.parse(process.argv[1]))));`;
        const done = spawnSync(
            process.execPath,
            ['--input-type=module', '-e', call, JSON.stringify(args)],
            { cwd: process.cwd(), encoding: 'utf8' }
        );
        expect(done.status, done.stderr).toBe(0);
        return done.stdout;
    }

    // revert: bin/revert-check/copy.mjs "return Number(spawnSync(process.execPath, ['-e', probe], { encoding: 'utf8' }).stdout);" => return 0;
    it('hands each run a port nothing listens on, which a server can then take', () => {
        const port = Number(answer('freePort'));
        expect(Number.isInteger(port) && port > 0 && port < 65536).toBe(true);
        const listen = `require('node:net').createServer().listen(${port}, '127.0.0.1', function () { this.close(); })
            .on('error', () => process.exit(1));`;
        expect(spawnSync(process.execPath, ['-e', listen]).status).toBe(0);
    });

    // revert: bin/revert-check/copy.mjs "return { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: report, OCULUS_BROWSER_PORT: String(port) };" => return { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: report };
    it('names the port to the case run, beside its report file', () => {
        expect(JSON.parse(answer('browserEnv', { KEPT: '1' }, 'report.json', 43121))).toEqual({
            KEPT: '1',
            PLAYWRIGHT_JSON_OUTPUT_NAME: 'report.json',
            OCULUS_BROWSER_PORT: '43121'
        });
    });

    // revert: bin/revert-check/copy.mjs "/is already used|EADDRINUSE/.test(one.message ?? '')" => /EADDRINUSE/.test(one.message ?? '')
    it('tells a run whose server found the port taken from one that ran', () => {
        const taken = {
            errors: [
                {
                    message:
                        'Error: http://127.0.0.1:8792/ is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.'
                }
            ],
            suites: []
        };
        expect(answer('portTaken', taken)).toBe('true');
        expect(answer('portTaken', { errors: [], suites: [{ specs: [] }] })).toBe('false');
        expect(answer('portTaken', null)).toBe('false');
    });
});
