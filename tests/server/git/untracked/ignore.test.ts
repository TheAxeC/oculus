// What server/git/git-index.ts's addToGitignore writes to a repository's .gitignore: one line per
// path as VS Code's Add to .gitignore writes it, and the refusals that keep the write inside the
// repository.
//
// What this does NOT cover: the source tab the page then opens on the file.

import { lstatSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { addToGitignore } from '../../../../src/lib/server/git/git-index.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { isolateGit, put, scratchRepo } from '../refs/repo.ts';

isolateGit();

const read = (root: string): string => readFileSync(join(root, '.gitignore'), 'utf8');

describe('addToGitignore', () => {
    it('appends a path relative to the root, made when the file is missing', async () => {
        const root = scratchRepo();
        const answer = await addToGitignore(root, ['a/b.txt'], [root]);
        expect(answer.ok).toBe(true);
        expect(read(root)).toBe('a/b.txt\n');
    });

    it('escapes an opening bracket', async () => {
        const root = scratchRepo();
        await addToGitignore(root, ['x[1].txt'], [root]);
        expect(read(root)).toBe('x\\[1].txt\n');
    });

    it('turns a backslash into a slash', async () => {
        const root = scratchRepo();
        await addToGitignore(root, ['a\\b.txt'], [root]);
        expect(read(root)).toBe('a/b.txt\n');
    });

    it('writes a folder as its name, with no trailing slash', async () => {
        const root = scratchRepo();
        put(root, 'a/x.txt', 'x\n');
        await addToGitignore(root, ['a/'], [root]);
        expect(read(root)).toBe('a\n');
    });

    it('writes the same path twice when asked twice, as VS Code does', async () => {
        const root = scratchRepo();
        await addToGitignore(root, ['a.txt'], [root]);
        await addToGitignore(root, ['a.txt'], [root]);
        expect(read(root)).toBe('a.txt\na.txt\n');
    });

    it('writes one line per path', async () => {
        const root = scratchRepo();
        await addToGitignore(root, ['a.txt', 'b.txt'], [root]);
        expect(read(root)).toBe('a.txt\nb.txt\n');
    });

    it('keeps the file own CRLF line endings', async () => {
        const root = scratchRepo();
        writeFileSync(join(root, '.gitignore'), 'old\r\n');
        await addToGitignore(root, ['a.txt', 'b.txt'], [root]);
        expect(read(root)).toBe('old\r\na.txt\r\nb.txt\r\n');
    });

    it('starts a new line after a file that does not end in one', async () => {
        const root = scratchRepo();
        writeFileSync(join(root, '.gitignore'), 'old');
        await addToGitignore(root, ['a.txt'], [root]);
        expect(read(root)).toBe('old\na.txt\n');
    });

    it('starts a new line after a CRLF file that does not end in one with its own ending', async () => {
        const root = scratchRepo();
        writeFileSync(join(root, '.gitignore'), 'one\r\ntwo');
        await addToGitignore(root, ['a.txt'], [root]);
        expect(read(root)).toBe('one\r\ntwo\r\na.txt\r\n');
    });

    it('refuses a .gitignore that is a symbolic link, writing nothing', async () => {
        const root = scratchRepo();
        const elsewhere = scratchDir('oculus-elsewhere-');
        const target = join(elsewhere, 'ignore');
        writeFileSync(target, 'kept\n');
        symlinkSync(target, join(root, '.gitignore'));
        const answer = await addToGitignore(root, ['a.txt'], [root]);
        expect(answer.ok).toBe(false);
        expect(readFileSync(target, 'utf8')).toBe('kept\n');
        expect(lstatSync(join(root, '.gitignore')).isSymbolicLink()).toBe(true);
    });

    it('refuses a .gitignore that is a folder', async () => {
        const root = scratchRepo();
        mkdirSync(join(root, '.gitignore'));
        expect((await addToGitignore(root, ['a.txt'], [root])).ok).toBe(false);
    });

    it('refuses a path outside the repository, an empty list and a root no workspace names', async () => {
        const root = scratchRepo();
        expect((await addToGitignore(root, ['../a.txt'], [root])).ok).toBe(false);
        expect((await addToGitignore(root, [], [root])).ok).toBe(false);
        expect((await addToGitignore(root, ['a.txt'], ['/nowhere'])).ok).toBe(false);
        expect(() => readFileSync(join(root, '.gitignore'))).toThrow();
    });
});
