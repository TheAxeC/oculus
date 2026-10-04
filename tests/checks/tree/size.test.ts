// Layer 4, tree check. A file over the size line is on the list with the count it was recorded at,
// and it may not grow past that count.
//
// The rule is the spec's: one source file under 1000 lines and a component under about 600, checked
// at 900 and 540 so a file is caught while it still has room to be split. Every source file the
// tree holds is measured, a script under utils/ as much as a module under src/. Membership of the
// list is not a pass: an entry carries a number, the file may not pass it, a file that falls back
// under the line comes off the list, and an entry naming a file the tree no longer holds fails too.
//
// utils/size-allow.txt is read by this and by utils/size-check.sh, which holds the same rule in
// awk. The verification list runs no size command, so this test is what runs the script: its last
// case runs it over the tree and checks that it reports nothing where this reports nothing.
//
// The folder rule is utils/folder-check.sh's: a folder under src, tests, utils or config holds at
// most ten items, and the last block runs it over the tree and over trees of its own.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { treeFiles } from '../walk.ts';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const ALLOW = join(ROOT, 'utils', 'size-allow.txt');

/** The line count a file may not pass, by the kind of file it is. */
const LINES = 900;
const COMPONENT = 540;

/** What a file of the allow list may not grow past, by path, with the lines that carry no count. */
function parseAllow(text: string): { cap: Record<string, number>; bad: string[] } {
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
    return treeFiles(join(root, prefix))
        .filter((rel) => /\.(ts|svelte|mjs|js|sh)$/.test(rel))
        .map((rel) => `${prefix}/${rel}`);
}

/** Every file the size rule refuses, and every allow line that is no longer right. */
function findOversize(root: string, allowText: string, roots = ['src', 'tests', 'utils']) {
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
        expect(findOversize(ROOT, readFileSync(ALLOW, 'utf8'))).toEqual([]);
    });

    it('fails when a listed file grows past the count it was recorded at', () => {
        const dir = planted('src/one.ts', 958);
        expect(findOversize(dir, 'src/one.ts 957\n', ['src'])).toEqual([
            'src/one.ts is 958 lines, over the 957 it was recorded at'
        ]);
        expect(findOversize(dir, 'src/one.ts 958\n', ['src'])).toEqual([]);
    });

    it('fails on an allow line that carries no count', () => {
        const dir = planted('src/one.ts', 958);
        expect(findOversize(dir, 'src/one.ts\n', ['src'])).toEqual([
            'no count on the allow line: src/one.ts',
            'src/one.ts is 958 lines, over the line and not on the list'
        ]);
    });

    it('fails on a listed file that is back under the line, and on one the tree has not', () => {
        const dir = planted('src/one.ts', 400);
        expect(findOversize(dir, 'src/one.ts 957\nsrc/gone.ts 950\n', ['src'])).toEqual([
            'src/one.ts is 400 lines, back under the line, so it comes off the list',
            'the list names src/gone.ts, which the tree does not hold'
        ]);
    });

    it('fails on a component over the component line and on a file over the file line', () => {
        const big = planted('src/Big.svelte', 541);
        expect(findOversize(big, '', ['src'])).toEqual([
            'src/Big.svelte is 541 lines, over the line and not on the list'
        ]);
        const small = planted('src/Small.svelte', 539);
        expect(findOversize(small, '', ['src'])).toEqual([]);
    });

    it('runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands', () => {
        const held = spawnSync('sh', [join(ROOT, 'utils', 'size-check.sh')], {
            cwd: ROOT,
            encoding: 'utf8'
        });
        expect(held.stdout).toBe('');
        expect(held.status).toBe(0);
    });
});

/** A tree of its own holding the folder check and, unless asked not to, a git repository. */
function folderTree(files: string[], ignored: string[] = [], git = true): string {
    const dir = scratchDir('oculus-folders-');
    mkdirSync(join(dir, 'utils'), { recursive: true });
    copyFileSync(join(ROOT, 'utils', 'folder-check.sh'), join(dir, 'utils', 'folder-check.sh'));
    for (const rel of files) {
        const full = join(dir, rel);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, '', 'utf8');
    }
    writeFileSync(join(dir, '.gitignore'), ignored.join('\n'), 'utf8');
    if (git) expect(spawnSync('git', ['init', '-q'], { cwd: dir }).status).toBe(0);
    return dir;
}

/** What the folder check says over a tree, and whether it passed. */
function folders(dir: string): { out: string; status: number | null } {
    const held = spawnSync('sh', [join(dir, 'utils', 'folder-check.sh')], {
        cwd: dir,
        encoding: 'utf8'
    });
    return { out: held.stdout, status: held.status };
}

/** Eleven names in one folder, as paths under it. */
function eleven(folder: string): string[] {
    return Array.from({ length: 11 }, (_, at) => `${folder}/file-${String(at)}.ts`);
}

describe('a folder over ten items', () => {
    it('holds under the tree as it stands', () => {
        expect(folders(ROOT)).toEqual({ out: '', status: 0 });
    });

    it('refuses a folder of eleven, and a folder counts as one item of its parent', () => {
        const over = folderTree(eleven('src/lib'));
        expect(folders(over)).toEqual({
            out: 'src/lib holds 11 items, over the ten a folder may hold\n',
            status: 1
        });
        const nested = folderTree([...eleven('tests/a').slice(0, 10), 'tests/b/one.ts']);
        expect(folders(nested)).toEqual({ out: '', status: 0 });
    });

    it('does not count a file the repository ignores, nor a folder outside the four it reads', () => {
        const ignored = folderTree(eleven('config'), ['config/file-10.ts']);
        expect(folders(ignored)).toEqual({ out: '', status: 0 });
        const outside = folderTree(eleven('assets'));
        expect(folders(outside)).toEqual({ out: '', status: 0 });
    });

    it('counts a copy that is no git checkout by the files it holds', () => {
        const copy = folderTree(eleven('src/lib'), [], false);
        expect(folders(copy)).toEqual({
            out: 'src/lib holds 11 items, over the ten a folder may hold\n',
            status: 1
        });
    });
});
