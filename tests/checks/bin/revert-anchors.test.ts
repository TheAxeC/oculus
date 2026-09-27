// Layer 4, test. The converter of revert directives over a scratch tree: a directive naming a
// unique line takes that line's text, one naming a repeated line takes the nearest unique line
// above with an offset, a range takes both ends, a line holding quotes is written as a JSON string,
// and a directive whose new anchor would not name the old line is left as it was and counted as
// refused.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * The word a directive opens with, built here rather than written out, so the fixture's directives
 * are not read as this file's own.
 */
const DIRECTIVE = ['//', 'revert:'].join(' ');

/** The target the fixture's directives name: a unique line, a repeated one and a quoted one. */
const TARGET = [
    'export function go() {',
    '    x();',
    '    x();',
    '}',
    'const said = "a \\"quoted\\" => word";',
    ''
].join('\n');

/** A scratch tree holding the target and one test file with the given lines. */
function tree(lines: string[]): string {
    const dir = scratchDir('oculus-revert-anchors-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    for (const [rel, body] of [
        ['src/b.mjs', TARGET],
        ['tests/a.test.ts', [...lines, ''].join('\n')]
    ]) {
        const full = join(dir, rel);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, body);
    }
    return dir;
}

/** The converter over the tree, with the extra arguments given. */
function convert(dir: string, ...args: string[]): { out: string; status: number | null } {
    const held = spawnSync('node', ['bin/migrations/revert-anchors.mjs', '--root', dir, ...args], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    return { out: held.stdout, status: held.status };
}

/** The test file of the tree, line by line. */
function written(dir: string): string[] {
    return readFileSync(join(dir, 'tests/a.test.ts'), 'utf8').split('\n');
}

describe('the revert anchor converter', () => {
    it('names a unique line by its text, and writes nothing under --check', () => {
        // revert: bin/migrations/revert-anchors.mjs "if (check) continue;" => continue;
        const old = `    ${DIRECTIVE} src/b.mjs:1 => delete`;
        const dir = tree([old]);
        const checked = convert(dir, '--check');
        expect(checked.out).toBe('1 directives converted in 1 files written, 0 refused\n');
        expect(written(dir)[0]).toBe(old);
        const held = convert(dir);
        expect(held.out).toBe('1 directives converted in 1 files written, 0 refused\n');
        expect(held.status).toBe(0);
        expect(written(dir)[0]).toBe(
            `    ${DIRECTIVE} src/b.mjs "export function go() {" => delete`
        );
    });

    it('names a repeated line by the nearest unique line above it and an offset', () => {
        // revert: bin/migrations/revert-anchors.mjs "if (held.get(text) === 1) return { text, offset: number - at };" => if (held.get(text) >= 1) return { text, offset: number - at };
        const dir = tree([`${DIRECTIVE} src/b.mjs:3 => y();`]);
        expect(convert(dir).status).toBe(0);
        expect(written(dir)[0]).toBe(`${DIRECTIVE} src/b.mjs "export function go() {" +2 => y();`);
    });

    it('names a range by its first line and its last', () => {
        // revert: bin/migrations/revert-anchors.mjs "const location = last === first ? spelled(one) : `${spelled(one)} .. ${spelled(other)}`;" => const location = spelled(one);
        const dir = tree([`${DIRECTIVE} src/b.mjs:2-4 => delete`]);
        expect(convert(dir).status).toBe(0);
        expect(written(dir)[0]).toBe(
            `${DIRECTIVE} src/b.mjs "export function go() {" +1 .. "}" => delete`
        );
    });

    it('writes a line holding quotes and an arrow as a JSON string', () => {
        // revert: bin/revert-check.mjs "const text = JSON.stringify(anchor.text);" => const text = `"${anchor.text}"`;
        const dir = tree([`${DIRECTIVE} src/b.mjs:5 => const said = '';`]);
        expect(convert(dir).status).toBe(0);
        expect(written(dir)[0]).toBe(
            String.raw`${DIRECTIVE} src/b.mjs "const said = \"a \\\"quoted\\\" => word\";" => const said = '';`
        );
    });

    it('refuses a target outside the tree, lines past its end and a line with no unique line above', () => {
        // revert: bin/migrations/revert-anchors.mjs "return { ...head, why: 'the target is not in the tree' };" => return { ...head, why: '' };
        // revert: bin/migrations/revert-anchors.mjs "return { ...head, why: `lines ${first}-${last} of ${lines.length}` };" => return { ...head, why: '' };
        // revert: bin/migrations/revert-anchors.mjs "if (one === null || other === null) return { ...head, why: 'no unique line at or above it' };" => delete
        const dir = tree([
            `${DIRECTIVE} src/gone.mjs:1 => delete`,
            `${DIRECTIVE} src/b.mjs:40 => delete`,
            `${DIRECTIVE} src/twice.mjs:2 => delete`
        ]);
        writeFileSync(join(dir, 'src/twice.mjs'), 'x();\nx();\n');
        const held = convert(dir);
        expect(held.out).toContain(
            'refused   tests/a.test.ts:1 names src/gone.mjs:1: the target is not in the tree'
        );
        expect(held.out).toContain(
            'refused   tests/a.test.ts:2 names src/b.mjs:40: lines 40-40 of 6'
        );
        expect(held.out).toContain(
            'refused   tests/a.test.ts:3 names src/twice.mjs:2: no unique line at or above it'
        );
        expect(held.status).toBe(1);
    });

    it('answers a --root without a folder with its usage', () => {
        // revert: bin/migrations/revert-anchors.mjs "process.exitCode = 2;" => process.exitCode = 0;
        const held = spawnSync('node', ['bin/migrations/revert-anchors.mjs', '--root'], {
            cwd: process.cwd(),
            encoding: 'utf8'
        });
        expect(held.stdout).toContain('usage: node bin/migrations/revert-anchors.mjs');
        expect(held.status).toBe(2);
    });

    it('leaves a directive whose new anchor would not name its line as it was, as refused', () => {
        // revert: bin/migrations/revert-anchors.mjs "const why = disproof(root, one, plan);" => const why = '';
        // The second directive names the first, whose text the run rewrites, so its anchor on the
        // first's old text would match nothing once the run is done.
        const lines = [
            `${DIRECTIVE} src/b.mjs:1 => delete`,
            `${DIRECTIVE} tests/a.test.ts:1 => delete`
        ];
        const dir = tree(lines);
        const held = convert(dir);
        expect(held.out).toContain(
            `refused   tests/a.test.ts:2 names tests/a.test.ts:1: "${lines[0]}", which matches 0 lines`
        );
        expect(held.out).toContain('1 directives converted in 1 files written, 1 refused');
        expect(held.status).toBe(1);
        expect(written(dir)[1]).toBe(lines[1]);
    });
});
