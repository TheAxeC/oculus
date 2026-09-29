// Layer 4, test. The citation check over a report of its own: a line that is there, a range, a
// list, a number past the end of the file, and a path the tree does not hold.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { readArgs } from '../../../utils/cited-lines.mjs';

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A tree of one file, with the report that cites it, inside the temporary directory. */
function fixture(report: string, more: Record<string, string> = {}): { dir: string; path: string } {
    const dir = scratchDir('oculus-cited-lines-');
    made.push(dir);
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
        join(dir, 'src', 'rule.ts'),
        ['const first = 1;', 'const second = 2;', 'const third = 3;', ''].join('\n')
    );
    for (const [rel, body] of Object.entries(more)) {
        const full = join(dir, rel);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, body);
    }
    const path = join(dir, 'report.md');
    writeFileSync(path, report);
    return { dir, path };
}

/** The check over a report, as the verification list runs it. */
function run(dir: string, report: string): { out: string; status: number | null } {
    const held = spawnSync('node', ['utils/cited-lines.mjs', '--root', dir, report], {
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    return { out: held.stdout, status: held.status };
}

describe('the citation check', () => {
    it('prints the line the tree holds at every citation', () => {
        const held = fixture('The rule is at `src/rule.ts:2`, and the block at src/rule.ts:1-3.\n');
        const found = run(held.dir, held.path);
        expect(found.out).toContain('src/rule.ts:2 | const second = 2;');
        expect(found.out).toContain('src/rule.ts:1 | const first = 1;');
        expect(found.out).toContain('src/rule.ts:3 | const third = 3;');
        expect(found.out).toContain('4 cited lines, 0 missing');
        expect(found.status).toBe(0);
    });

    it('reads a list of lines, and prints each one once', () => {
        const held = fixture('Three of them: src/rule.ts:1,3 and again src/rule.ts:1,3.\n');
        const found = run(held.dir, held.path);
        expect(found.out.split('\n').filter((line) => line.startsWith('src/rule.ts:1'))).toEqual([
            'src/rule.ts:1 | const first = 1;'
        ]);
        expect(found.out).toContain('2 cited lines, 0 missing');
        expect(found.status).toBe(0);
    });

    it('calls a line past the end, and a file the tree has not, MISSING and fails', () => {
        const held = fixture('Wrong: src/rule.ts:99, and gone: src/other.ts:4.\n');
        const found = run(held.dir, held.path);
        expect(found.out).toContain('MISSING src/rule.ts:99 the file has 4 lines');
        expect(found.out).toContain('MISSING src/other.ts:4 no such file');
        expect(found.out).toContain('2 cited lines, 2 missing');
        expect(found.status).toBe(1);
    });

    it('calls a citation that lands on a blank line MISSING', () => {
        const held = fixture('The rule is at src/rule.ts:4, which is the line after the last.\n');
        const found = run(held.dir, held.path);
        expect(found.out).toContain('MISSING src/rule.ts:4 the line is blank');
        expect(found.out).toContain('1 cited lines, 1 missing');
        expect(found.status).toBe(1);
    });

    it('refuses a range that runs backwards, one wider than a screenful, and a number below one', () => {
        const held = fixture(
            'Wide: src/rule.ts:1-9999. Back: src/rule.ts:3-1. Under: src/rule.ts:-5.\n'
        );
        const found = run(held.dir, held.path);
        expect(found.out).toContain(
            'MISSING src/rule.ts:1-9999 the range 1-9999 is 9999 lines wide'
        );
        expect(found.out).toContain('MISSING src/rule.ts:3-1 the range 3-1 runs backwards');
        expect(found.out).toContain('MISSING src/rule.ts:-5 -5 is no line number');
        expect(found.out).toContain('3 cited lines, 3 missing');
        expect(found.status).toBe(1);
    });

    it('calls a citation landing on a line of punctuation MISSING', () => {
        const held = fixture('The brace is at src/braces.ts:2.\n', {
            'src/braces.ts': ['const one = {', '};', 'const two = 2;', ''].join('\n')
        });
        const found = run(held.dir, held.path);
        expect(found.out).toContain('MISSING src/braces.ts:2 the line holds only punctuation');
        expect(found.out).toContain('1 cited lines, 1 missing');
        expect(found.status).toBe(1);
    });

    it('calls a citation that climbs out of the tree MISSING, and reads nothing there', () => {
        // Revert: in under of utils/cited-lines.mjs, let every path pass, and a report citing a
        // file above the tree is read and counted among the lines that are there.
        // The tree sits one folder down in a scratch directory, so the file above it is written
        // inside that directory and swept with it, never beside the temporary directory's others.
        const outer = scratchDir('oculus-cited-lines-outer-');
        const tree = join(outer, 'tree');
        mkdirSync(tree);
        writeFileSync(join(outer, 'outside.md'), 'a line outside the tree\n');
        const report = join(tree, 'report.md');
        writeFileSync(report, 'The secret is at ../outside.md:1.\n');
        const found = run(tree, report);
        expect(found.out).toContain('MISSING ../outside.md:1 the path leaves the tree');
        expect(found.out).not.toContain('a line outside the tree');
        expect(found.status).toBe(1);
    });

    it('refuses a report the tree does not hold', () => {
        const held = fixture('nothing cited\n');
        const found = run(held.dir, join(held.dir, 'gone.md'));
        expect(found.out).toContain('no such report');
        expect(found.status).toBe(2);
    });
});

describe('the command line', () => {
    it('reads the root and the report, the last --root winning', () => {
        expect(readArgs(['--root', '/r', 'a.md'])).toEqual({ root: '/r', report: 'a.md' });
        expect(readArgs(['--root=/r', '--root', '/s', 'a.md'])).toEqual({
            root: '/s',
            report: 'a.md'
        });
        expect(readArgs(['a.md'])).toEqual({ root: null, report: 'a.md' });
        expect(readArgs([])).toEqual({ root: null, report: null });
    });

    it('names no report for a line that does not read, so the usage is printed', () => {
        expect(readArgs(['--root'])).toEqual({ root: null, report: null });
        expect(readArgs(['--bogus', 'a.md'])).toEqual({ root: null, report: null });
        const held = spawnSync('node', ['utils/cited-lines.mjs', '--bogus'], { encoding: 'utf8' });
        expect(held.stdout).toContain('usage: node utils/cited-lines.mjs');
        expect(held.status).toBe(2);
    });
});
