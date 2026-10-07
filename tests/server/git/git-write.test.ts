// What server/git/git-write.ts runs, and what it refuses to run.
//
// Every repository here is made under the system temporary directory with the real git, and the
// allowed root comes from local.yml inside that directory, so nothing reaches the hub's own
// checkout.
//
// What this does NOT cover: `claude` is never run.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    allowedRoots,
    commit,
    createBranch,
    createWorktree,
    discard,
    push,
    removeWorktree,
    stage,
    switchBranch,
    unstage
} from '../../../src/lib/server/git/git-write.ts';
import { worktreePath } from '../../../src/lib/data/helpers/worktrees.ts';
import { abortMerge, merge, stoppedOn } from '../../../src/lib/server/git/git-index.ts';
import { pull } from '../../../src/lib/server/git/git-remote.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { TEXT } from '../text.ts';

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

        const staged = await stage(repo, ['kept.txt'], TEXT, ROOTS);
        expect(staged.ok).toBe(true);
        expect(status()).toContain('M  kept.txt');

        const back = await unstage(repo, ['kept.txt'], TEXT, ROOTS);
        expect(back.ok).toBe(true);
        expect(status()).toContain(' M kept.txt');
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('two\n');
    });

    it('discards a tracked change', async () => {
        const answer = await discard(repo, ['kept.txt'], TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('one\n');
    });
});

describe('committing', () => {
    it('commits a multi-line message holding quotes and backticks', async () => {
        write(repo, 'kept.txt', 'three\n');
        await stage(repo, ['kept.txt'], TEXT, ROOTS);
        const message = 'Add the "thing"\n\n- Keep `one` and $two\n- Do not break \'quoting\'\n';
        const answer = await commit(repo, message, TEXT, ROOTS);
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
        await stage(repo, ['kept.txt'], TEXT, ROOTS);
        await commit(repo, 'Set it to five\n', TEXT, ROOTS);
        const answer = await push(repo, TEXT, ROOTS);
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
        const answer = await createBranch(repo, 'work/one', TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('work/one');
    });

    /**
     * The tree a switch starts from and the branch it goes to: a clean tree, an untracked file
     * only, which git carries across, and a change to a tracked file, which the switch refuses with
     * the catalog's sentence. Each row starts from the branch it names.
     */
    const SWITCHES: [string, string | null, string, string, string | null][] = [
        ['a clean tree', null, 'work/one', 'main', null],
        ['an untracked file only', 'untracked.txt', 'work/one', 'main', null],
        [
            'a modified tracked file',
            'kept.txt',
            'main',
            'work/one',
            'The working tree is dirty, so switching would carry the changes across'
        ]
    ];

    it('switches to another branch', async () => {
        for (const [row, file, from, to, refusal] of SWITCHES) {
            git(repo, 'switch', '-q', from);
            if (file !== null) write(repo, file, 'carried\n');
            const answer = await switchBranch(repo, to, TEXT, ROOTS);
            expect(answer.ok, row).toBe(refusal === null);
            expect(answer.error, row).toBe(refusal ?? '');
            expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), row).toBe(
                refusal === null ? to : from
            );
            if (file === null) continue;
            expect(readFileSync(join(repo, file), 'utf8'), row).toBe('carried\n');
            if (refusal === null) rmSync(join(repo, file));
            else git(repo, 'checkout', '--', file);
        }
    });
});

describe('worktrees', () => {
    const name = 'package-one';
    /** The worktree's path. It is read in each case, since the repository is made in beforeAll. */
    const where = (): string => worktreePath(repo, name);

    it('makes one under the repository worktrees folder, on a branch of its name', async () => {
        const path = where();
        const answer = await createWorktree(repo, name, TEXT, ROOTS);
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

        const answer = await merge(repo, 'other', TEXT, ROOTS);
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
        expect((await abortMerge(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(false);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('from main\n');
    });

    // A Cancel while the merge's pre-merge-commit hook runs: git has the merge's result in the
    // index by then and writes MERGE_HEAD only once the hook has failed, so the answer must come
    // from a git that ran that path to its end. One row merges directly, one through a pull,
    // whose own git starts the merging git.
    it.each(['merge', 'pull'] as const)(
        'names the merge a cancelled %s left in progress, and Abort Merge takes it back',
        async (how) => {
            const at = scratchDir('oculus-git-cancel-');
            const up = join(at, 'up');
            const here = join(at, 'here');
            execFileSync('git', ['init', '-q', '-b', 'main', up]);
            git(up, 'config', 'user.email', 'nobody@example.invalid');
            git(up, 'config', 'user.name', 'Nobody');
            write(up, 'kept.txt', 'one\n');
            git(up, 'add', 'kept.txt');
            git(up, 'commit', '-q', '-m', 'First');
            execFileSync('git', ['clone', '-q', up, here]);
            git(here, 'config', 'user.email', 'nobody@example.invalid');
            git(here, 'config', 'user.name', 'Nobody');
            git(here, 'config', 'commit.gpgsign', 'false');
            git(here, 'config', 'pull.rebase', 'false');
            write(up, 'theirs.txt', 'theirs\n');
            git(up, 'add', 'theirs.txt');
            git(up, 'commit', '-q', '-m', 'Theirs');
            git(here, 'fetch', '-q');
            git(here, 'branch', 'other', 'origin/main');
            write(here, 'ours.txt', 'ours\n');
            git(here, 'add', 'ours.txt');
            git(here, 'commit', '-q', '-m', 'Ours');
            const before = git(here, 'rev-parse', 'HEAD');
            const started = join(at, 'hook-started');
            const hook = join(here, '.git', 'hooks', 'pre-merge-commit');
            writeFileSync(hook, `#!/bin/sh\ntouch '${started}'\nexec sleep 600\n`);
            chmodSync(hook, 0o755);
            const roots = allowedRoots([], here);

            const run = new AbortController();
            const answer =
                how === 'merge'
                    ? merge(here, 'other', TEXT, roots, run.signal)
                    : pull(here, TEXT, roots, run.signal);
            await vi.waitUntil(() => existsSync(started), { timeout: 10000, interval: 20 });
            run.abort();
            const done = await answer;

            expect(done.failure?.code).toBe('cancelled');
            expect(done.failure?.left).toBe('merge');
            expect(git(here, 'rev-parse', '--verify', '--quiet', 'MERGE_HEAD').trim()).toBe(
                git(here, 'rev-parse', 'other').trim()
            );
            expect((await abortMerge(here, TEXT, roots)).ok).toBe(true);
            const stopped = {
                ...done,
                failure: { code: 'cancelled' as const, detail: '', program: 'git' }
            };
            expect((await stoppedOn(here, stopped, TEXT, 'merge')).failure?.left).toBeUndefined();
            expect(git(here, 'rev-parse', 'HEAD')).toBe(before);
            expect(git(here, 'status', '--porcelain', '--untracked-files=no')).toBe('');
        }
    );

    it('removes a worktree that is clean, and its branch with it', async () => {
        const path = worktreePath(repo, name);
        const answer = await removeWorktree(repo, path, TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(existsSync(path)).toBe(false);
        expect(git(repo, 'branch', '--list', name).trim()).toBe('');
    });
});
