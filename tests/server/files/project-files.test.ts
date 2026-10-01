// projectFiles over a synthetic folder under the system temporary directory: which extensions are
// listed, what is skipped, the cap, and the order. Nothing outside that directory is read or
// written, and every path written is asserted to be inside it first.

import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { SKIP_DIRS, fileIndex, projectFiles } from '../../../src/lib/server/files/project-files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The config the walk is given unless a case wants another. */
const SETTINGS = { file_index: { enabled: true, max_per_project: 400, ext: ['.md', '.py'] } };

function scratch(): string {
    const dir = scratchDir('oculus-files-');
    return dir;
}

/** Write one file, at the age in days the case wants it to have. */
function write(root: string, rel: string, body = 'x', ageDays = 0): string {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    if (ageDays > 0) {
        const at = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
        utimesSync(full, at, at);
    }
    return full;
}

function paths(root: string, settings: Record<string, unknown> = SETTINGS): string[] {
    return projectFiles(root, settings).rows.map((row) => row.path);
}

describe('projectFiles', () => {
    it('lists only the extensions the config names', () => {
        const root = scratch();
        write(root, 'README.md');
        write(root, 'run.py');
        write(root, 'data.npy');
        write(root, 'notes.tex');

        expect(paths(root).sort()).toEqual(['README.md', 'run.py']);
    });

    it('skips dot files and dot folders', () => {
        const root = scratch();
        write(root, 'README.md');
        write(root, '.hidden.md');
        write(root, '.claude/notes.md');

        expect(paths(root)).toEqual(['README.md']);
    });

    it('never descends into a folder of the skip list', () => {
        const root = scratch();
        write(root, 'README.md');
        for (const skipped of SKIP_DIRS) write(root, `${skipped}/inside.md`);

        expect(paths(root)).toEqual(['README.md']);
    });

    it('walks nested folders and writes the path relative to the project', () => {
        const root = scratch();
        write(root, 'code/run.py');
        write(root, 'manuscript/notes/plan.md');

        expect(paths(root).sort()).toEqual(['code/run.py', 'manuscript/notes/plan.md']);
    });

    it('gives the newest file first', () => {
        const root = scratch();
        write(root, 'old.md', 'x', 10);
        write(root, 'newest.md', 'x', 0);
        write(root, 'middle.md', 'x', 5);

        expect(paths(root)).toEqual(['newest.md', 'middle.md', 'old.md']);
    });

    it('caps the listing and says that it did', () => {
        const root = scratch();
        for (let at = 0; at < 5; at += 1) write(root, `f${at}.md`, 'x', at);
        const capped = { file_index: { max_per_project: 3, ext: ['.md'] } };

        const found = projectFiles(root, capped);
        expect(found.rows.map((row) => row.path)).toEqual(['f0.md', 'f1.md', 'f2.md']);
        expect(found.truncated).toBe(true);
    });

    it('does not say it truncated when the listing fits the cap', () => {
        const root = scratch();
        write(root, 'one.md');

        expect(projectFiles(root, SETTINGS).truncated).toBe(false);
    });

    it('carries the size and the mtime of each row', () => {
        const root = scratch();
        write(root, 'README.md', 'abcdefghij');

        const row = projectFiles(root, SETTINGS).rows[0];
        expect(row.size).toBe(10);
        expect(row.mtime).toBeGreaterThan(0);
    });

    it('lists nothing when the config switches the index off', () => {
        const root = scratch();
        write(root, 'README.md');

        expect(projectFiles(root, { file_index: { enabled: false } })).toEqual({
            rows: [],
            truncated: false
        });
    });

    it('lists nothing for a folder that is not there', () => {
        const root = scratch();

        expect(paths(join(root, 'nowhere'))).toEqual([]);
    });
});

describe('fileIndex', () => {
    it('falls back on its own extensions and cap when the config names none', () => {
        const index = fileIndex({});
        expect(index.enabled).toBe(true);
        expect(index.cap).toBe(400);
        expect(index.ext).toContain('.pdf');
    });

    it('reads the config it is given', () => {
        expect(fileIndex(SETTINGS)).toEqual({
            enabled: true,
            cap: 400,
            ext: ['.md', '.py']
        });
    });
});

describe('fileIndex over a block of the wrong shape', () => {
    const defaults = fileIndex({});

    it('keeps the extensions that are text and the default cap for a cap that is text', () => {
        const index = fileIndex({ file_index: { ext: ['A', 1], max_per_project: '5' } });
        expect(index).toStrictEqual({ enabled: true, ext: ['a'], cap: defaults.cap });
    });

    it('answers the defaults for a block that is a list and the default extensions for a null', () => {
        expect(fileIndex({ file_index: [] })).toStrictEqual(defaults);
        expect(fileIndex({ file_index: { ext: null } }).ext).toStrictEqual(defaults.ext);
    });

    it('keeps a cap of infinity and refuses a cap that is not a number above zero', () => {
        expect(fileIndex({ file_index: { max_per_project: Infinity } }).cap).toBe(Infinity);
        expect(fileIndex({ file_index: { max_per_project: NaN } }).cap).toBe(defaults.cap);
        expect(fileIndex({ file_index: { max_per_project: -3 } }).cap).toBe(defaults.cap);
        expect(fileIndex({ file_index: { max_per_project: 7.9 } }).cap).toBe(7);
    });

    it('lists unless the block says false', () => {
        expect(fileIndex({ file_index: { enabled: false } }).enabled).toBe(false);
        expect(fileIndex({ file_index: { enabled: 0 } }).enabled).toBe(true);
    });
});
