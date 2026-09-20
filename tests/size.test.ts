// Layer 4, test. A file over the size line is on the list with the count it was recorded at, and it
// may not grow past that count.
//
// The rule is the spec's: one source file under 1000 lines and a component under about 600, checked
// at 900 and 540 so a file is caught while it still has room to be split. Every source file the tree
// holds is measured, a script under bin/ as much as a module under src/. Membership of the list is
// not a pass: an entry carries a number, the file may not pass it, a file that falls back under the
// line comes off the list, and an entry naming a file the tree no longer holds fails too.
//
// bin/size-allow.txt is read by this and by the one-line command of the verification list, which
// holds the same rule in awk; the two are checked against each other by the case at the end.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from './scratch.ts';

afterAll(sweepScratch);

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const ALLOW = join(ROOT, 'bin', 'size-allow.txt');

/** The line count a file may not pass, by the kind of file it is. */
const LINES = 900;
const COMPONENT = 540;

/** What a file of the allow list may not grow past, by path, with the lines that carry no count. */
export function parseAllow(text: string): { cap: Record<string, number>; bad: string[] } {
    const cap: Record<string, number> = {};
    const bad: string[] = [];
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const part = line.trim().split(/\s+/);
        if (part.length !== 2 || !/^\d+$/.test(part[1])) {
            bad.push(`no count on the allow line: ${line}`);
            continue;
        }
        cap[part[0]] = Number(part[1]);
    }
    return { cap, bad };
}

/** Every source file under the roots, as a path relative to the tree. */
function sourceFiles(root: string, prefix: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...sourceFiles(root, rel));
        else if (/\.(ts|svelte|mjs|js|sh)$/.test(entry.name)) found.push(rel);
    }
    return found;
}

/** Every file the size rule refuses, and every allow line that is no longer right. */
export function findOversize(root: string, allowText: string, roots = ['src', 'tests', 'bin']) {
    const { cap, bad } = parseAllow(allowText);
    const found = [...bad];
    const left = new Set(Object.keys(cap));
    for (const prefix of roots) {
        for (const rel of sourceFiles(root, prefix)) {
            const count = readFileSync(join(root, rel), 'utf8').split('\n').length - 1;
            const line = rel.endsWith('.svelte') ? COMPONENT : LINES;
            if (rel in cap) {
                left.delete(rel);
                if (count > cap[rel]) {
                    found.push(`${rel} is ${count} lines, over the ${cap[rel]} it was recorded at`);
                } else if (count <= line) {
                    found.push(
                        `${rel} is ${count} lines, back under the line, so it comes off the list`
                    );
                }
                continue;
            }
            if (count > line)
                found.push(`${rel} is ${count} lines, over the line and not on the list`);
        }
    }
    for (const rel of [...left].sort()) {
        found.push(`the list names ${rel}, which the tree does not hold`);
    }
    return found.sort();
}

/** A tree of one file, with an allow list of its own, for a case to plant a violation in. */
function planted(rel: string, lines: number): string {
    const dir = scratchDir('oculus-size-');
    const full = join(dir, rel);
    expect(resolve(full).startsWith(resolve(dir) + '/')).toBe(true);
    const folder = full.slice(0, full.lastIndexOf('/'));
    spawnSync('mkdir', ['-p', folder]);
    writeFileSync(full, 'const held = 1;\n'.repeat(lines));
    return dir;
}

describe('a file over the size line', () => {
    it('is on the list with a count it has not passed', () => {
        // revert: bin/size-allow.txt:5 => tests/views/collection.test.ts 900
        expect(findOversize(ROOT, readFileSync(ALLOW, 'utf8'))).toEqual([]);
    });

    it('fails when a listed file grows past the count it was recorded at', () => {
        // revert: tests/size.test.ts:67 => if (false) {
        const dir = planted('src/one.ts', 958);
        expect(findOversize(dir, 'src/one.ts 957\n', ['src'])).toEqual([
            'src/one.ts is 958 lines, over the 957 it was recorded at'
        ]);
        expect(findOversize(dir, 'src/one.ts 958\n', ['src'])).toEqual([]);
    });

    it('fails on an allow line that carries no count', () => {
        // revert: tests/size.test.ts:36 => if (false) {
        const dir = planted('src/one.ts', 958);
        expect(findOversize(dir, 'src/one.ts\n', ['src'])).toEqual([
            'no count on the allow line: src/one.ts',
            'src/one.ts is 958 lines, over the line and not on the list'
        ]);
    });

    it('fails on a listed file that is back under the line, and on one the tree has not', () => {
        // revert: tests/size.test.ts:69 => } else if (false) {
        const dir = planted('src/one.ts', 400);
        expect(findOversize(dir, 'src/one.ts 957\nsrc/gone.ts 950\n', ['src'])).toEqual([
            'src/one.ts is 400 lines, back under the line, so it comes off the list',
            'the list names src/gone.ts, which the tree does not hold'
        ]);
    });

    it('fails on a component over the component line and on a file over the file line', () => {
        // revert: tests/size.test.ts:64 => const line = LINES;
        const big = planted('src/Big.svelte', 541);
        expect(findOversize(big, '', ['src'])).toEqual([
            'src/Big.svelte is 541 lines, over the line and not on the list'
        ]);
        const small = planted('src/Small.svelte', 539);
        expect(findOversize(small, '', ['src'])).toEqual([]);
    });

    it('audits the awk of the verification list against this rule, over the tree as it stands', () => {
        // revert: bin/size-check.sh:51 => exit 1
        const command = readFileSync(join(ROOT, 'bin', 'size-check.sh'), 'utf8');
        const held = spawnSync('sh', [join(ROOT, 'bin', 'size-check.sh')], {
            cwd: ROOT,
            encoding: 'utf8'
        });
        expect(command).toContain('size-allow.txt');
        expect(held.stdout).toBe('');
        expect(held.status).toBe(0);
    });
});
