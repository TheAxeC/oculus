// What server/git/git-write.ts runs, and what it refuses to run.
//
// Every repository here is made under the system temporary directory with the real git, and the
// allowed root comes from local.yml inside that directory, so nothing reaches the hub's own
// checkout.
//
// What this does NOT cover: `claude` is never run.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    allowedRoots,
    commit,
    createBranch,
    createWorktree,
    discard,
    merge,
    push,
    removeWorktree,
    stage,
    switchBranch,
    unstage
} from '../../../src/lib/server/git/git-write.ts';
import { worktreePath } from '../../../src/lib/data/helpers/worktrees.ts';
import { abortMerge } from '../../../src/lib/server/git/git-index.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

let dir = '';
let repo = '';
let remote = '';
/**
 * The roots every operation of this suite runs under. In production the route names them from the
 * published workspaces and the machine's hub it holds; here the hub is the repository below.
 */
let ROOTS: string[] = [];

/** A git command inside the throwaway directory, and nowhere else, for setting a case up. */
function git(root: string, ...args: string[]): string {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

function write(root: string, name: string, body: string): void {
    const full = join(root, name);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    writeFileSync(full, body);
}

test.beforeAll(() => {
    dir = scratchDir('oculus-git-write-');
    repo = join(dir, 'repo');
    remote = join(dir, 'remote.git');
    execFileSync('git', ['init', '-q', '-b', 'main', repo]);
    execFileSync('git', ['init', '-q', '--bare', remote]);
    for (const root of [repo]) {
        git(root, 'config', 'user.email', 'nobody@example.invalid');
        git(root, 'config', 'user.name', 'Nobody');
        git(root, 'config', 'commit.gpgsign', 'false');
    }
    write(repo, 'kept.txt', 'one\n');
    git(repo, 'add', 'kept.txt');
    git(repo, 'commit', '-q', '-m', 'First');

    ROOTS = allowedRoots([], repo);
});

test.afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

/** The porcelain of the repository, as the setup reads it back. */
function status(): string {
    return git(repo, 'status', '--porcelain');
}

describe('staging', () => {
    it('stages a path, takes it back out, and leaves the worktree alone', async () => {
        write(repo, 'kept.txt', 'two\n');
        expect(status()).toContain(' M kept.txt');

        const staged = await stage(repo, ['kept.txt'], ROOTS);
        expect(staged.ok).toBe(true);
        expect(status()).toContain('M  kept.txt');

        const back = await unstage(repo, ['kept.txt'], ROOTS);
        expect(back.ok).toBe(true);
        expect(status()).toContain(' M kept.txt');
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('two\n');
    });

    it('discards a tracked change', async () => {
        const answer = await discard(repo, ['kept.txt'], ROOTS);
        expect(answer.ok).toBe(true);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('one\n');
    });
});

describe('committing', () => {
    it('commits a multi-line message holding quotes and backticks', async () => {
        write(repo, 'kept.txt', 'three\n');
        await stage(repo, ['kept.txt'], ROOTS);
        const message = 'Add the "thing"\n\n- Keep `one` and $two\n- Do not break \'quoting\'\n';
        const answer = await commit(repo, message, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain('Add the "thing"');
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain("- Do not break 'quoting'");
    });
});

describe('pushing', () => {
    it('pushes to the upstream once there is one', async () => {
        git(repo, 'remote', 'add', 'origin', remote);
        git(repo, 'push', '-q', '-u', 'origin', 'main');
        write(repo, 'kept.txt', 'five\n');
        await stage(repo, ['kept.txt'], ROOTS);
        await commit(repo, 'Set it to five\n', ROOTS);
        const answer = await push(repo, ROOTS);
        expect(answer.ok).toBe(true);
        // The bare repository's own HEAD is whatever git init made it; the branch that was pushed
        // is the one to read.
        const there = execFileSync('git', ['-C', remote, 'log', '-1', '--pretty=%s', 'main'], {
            encoding: 'utf8'
        });
        expect(there.trim()).toBe('Set it to five');
    });
});

describe('branches', () => {
    it('creates one and checks it out', async () => {
        const answer = await createBranch(repo, 'work/one', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('work/one');
    });

    it('switches to another branch', async () => {
        const answer = await switchBranch(repo, 'main', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
    });
});

describe('worktrees', () => {
    const name = 'package-one';
    /** The worktree's path. It is read in each case, since the repository is made in beforeAll. */
    const where = (): string => worktreePath(repo, name);

    it('makes one under the repository worktrees folder, on a branch of its name', async () => {
        const path = where();
        const answer = await createWorktree(repo, name, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(path, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe(name);
        expect(path.endsWith(`.agents/worktrees/${name}`)).toBe(true);
    });
});

describe('the merge back', () => {
    const name = 'package-one';

    it('leaves a conflicted merge in progress and names what conflicted', async () => {
        git(repo, 'branch', 'other');
        git(repo, 'switch', '-q', 'other');
        write(repo, 'kept.txt', 'from the other branch\n');
        git(repo, 'add', 'kept.txt');
        git(repo, 'commit', '-q', '-m', 'Other');
        git(repo, 'switch', '-q', 'main');
        write(repo, 'kept.txt', 'from main\n');
        git(repo, 'add', 'kept.txt');
        git(repo, 'commit', '-q', '-m', 'Main');

        const answer = await merge(repo, 'other', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('kept.txt');
        expect(answer.error).toContain('Merge Changes');
        // The merge is left in progress for the merge editor: the path is unmerged, MERGE_HEAD is
        // there, and the file holds git's conflict markers. The worktrees folder is untracked
        // here, which is what the repository's .gitignore is for.
        expect(
            status()
                .split('\n')
                .filter((line) => line.trim() !== '' && !line.startsWith('??'))
        ).toEqual(['UU kept.txt']);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(true);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toContain('<<<<<<<');

        // Abort Merge takes it back to main's side, which the cases after this one start from.
        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(false);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('from main\n');
    });

    it('removes a worktree that is clean, and its branch with it', async () => {
        const path = worktreePath(repo, name);
        const answer = await removeWorktree(repo, path, ROOTS);
        expect(answer.ok).toBe(true);
        expect(existsSync(path)).toBe(false);
        expect(git(repo, 'branch', '--list', name).trim()).toBe('');
    });
});
