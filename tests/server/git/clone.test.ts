// Layer 4, server test. The clone of a project's repository into its clone folder
// (server/git/clone/clone.ts) over scratch repositories and a bare repository standing in for the
// remote: a folder that is missing or holds files, the remote's default branch, a repository that
// tracks a file the folder holds, a remote with no branch, and an address that does not answer.
//
// Every directory is made under the system temporary directory by tests/fixtures/scratch.ts, and
// the machine's git configuration is replaced by an empty file for the whole file.
// @module-tag slow: its cases run real git against a bare remote, so npm test leaves it out.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { cloneRepository } from '../../../src/lib/server/git/clone/clone.ts';
import { cloneGit } from '../../../src/lib/server/git/clone/clone-git.ts';
import { noCredentials } from '../../fixtures/doubles.ts';
import { plantFile, scratchDir, test } from '../../fixtures/scratch.ts';
import { TEXT } from '../text.ts';
import { git, isolateGit, remote } from './refs/repo.ts';

isolateGit();

/** The real git of a clone, with the credentials of a server signed in nowhere. */
const run = cloneGit(noCredentials());

describe('cloning into a clone folder', () => {
    test('makes a missing folder, checks the default branch out and tracks it', async () => {
        const url = remote({ 'a.txt': 'one\n' });
        const parent = scratchDir('oculus-clone-into-');
        const dir = join(parent, 'deep', 'er');
        const done = await cloneRepository({ dir, url, text: TEXT, git: run });
        expect(done).toMatchObject({ ok: true, output: 'main' });
        expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('one\n');
        expect(git(dir, 'rev-parse', '--abbrev-ref', '@{upstream}').trim()).toBe('origin/main');
    });

    test('keeps the files the folder holds when the repository does not track them', async () => {
        const url = remote({ 'a.txt': 'one\n' });
        const dir = scratchDir('oculus-clone-held-');
        plantFile(dir, 'project.yml', 'title: kept\n');
        expect(await cloneRepository({ dir, url, text: TEXT, git: run })).toMatchObject({
            ok: true
        });
        expect(readFileSync(join(dir, 'project.yml'), 'utf8')).toBe('title: kept\n');
        expect(existsSync(join(dir, 'a.txt'))).toBe(true);
    });

    test('follows a default branch that is not main', async () => {
        const url = remote({ 'a.txt': 'one\n' }, 'master');
        const dir = scratchDir('oculus-clone-master-');
        expect(await cloneRepository({ dir, url, text: TEXT, git: run })).toMatchObject({
            ok: true,
            output: 'master'
        });
        expect(git(dir, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('master');
    });

    test('refuses a repository that tracks a file the folder holds, naming it, and leaves the folder', async () => {
        const url = remote({ 'README.md': 'remote\n', 'docs/x.md': 'x\n', 'other.txt': 'o\n' });
        const dir = scratchDir('oculus-clone-clash-');
        plantFile(dir, 'README.md', 'mine\n');
        plantFile(dir, 'docs/x.md', 'mine too\n');
        const done = await cloneRepository({ dir, url, text: TEXT, git: run });
        expect(done.ok).toBe(false);
        expect(done.error).toContain('README.md');
        expect(done.error).toContain('docs/x.md');
        expect(done.error).not.toContain('other.txt');
        expect(existsSync(join(dir, '.git'))).toBe(false);
        expect(readdirSync(dir).sort()).toEqual(['README.md', 'docs']);
        expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('mine\n');
    });

    test('refuses a remote with no branch and leaves nothing behind', async () => {
        const bare = scratchDir('oculus-clone-empty-');
        git(bare, 'init', '-q', '--bare', '-b', 'main');
        const parent = scratchDir('oculus-clone-into-');
        const dir = join(parent, 'new');
        const done = await cloneRepository({ dir, url: bare, text: TEXT, git: run });
        expect(done.ok).toBe(false);
        expect(done.error).toContain(bare);
        expect(existsSync(dir)).toBe(false);
    });

    test('refuses an address that does not answer with the sentence git gave', async () => {
        const parent = scratchDir('oculus-clone-into-');
        const dir = join(parent, 'new');
        const gone = join(parent, 'no-such-remote');
        const done = await cloneRepository({ dir, url: gone, text: TEXT, git: run });
        expect(done.ok).toBe(false);
        expect(done.error).not.toBe('');
        expect(done.error).toMatch(/repository/i);
        expect(existsSync(dir)).toBe(false);
    });

    test('refuses a folder that holds a repository already', async () => {
        const url = remote({ 'a.txt': 'one\n' });
        const dir = scratchDir('oculus-clone-twice-');
        expect(await cloneRepository({ dir, url, text: TEXT, git: run })).toMatchObject({
            ok: true
        });
        const again = await cloneRepository({ dir, url, text: TEXT, git: run });
        expect(again.ok).toBe(false);
        expect(again.error).toContain(dir);
    });
});
