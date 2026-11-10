// Layer 2, server tests. The names Quick Open matches (server/files/search/search.ts `runNames`,
// over the real ripgrep and git): a workspace folder that is a repository holding a repository of
// its own lists the inner repository's tracked and untracked files under the inner repository's
// own ignore file, once each, when the outer repository's exclude file names the inner one by its
// own path, as a hub's does; an inner repository under a folder the outer repository ignores
// (`.agents/worktrees/w` under an ignored `.agents/`) lists no file.
//
// The machine's and the user's git configuration are replaced by an empty file (`isolateGit`),
// so no hook, identity or signing key of the machine runs or is read.
//
// It does not cover the palette's rows as drawn, which the look does.
// @module-tag slow: every row starts git and ripgrep.

import { execFileSync } from 'node:child_process';
import { describe, expect } from 'vitest';
import { runNames } from '../../../src/lib/server/files/search/search.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { isolateGit } from '../git/refs/repo.ts';

isolateGit();

const git = (dir: string, ...args: string[]): void => {
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir });
};

/** A hub repository whose exclude file names its inner repository `site`. */
function hubWithSite(): string {
    const dir = plantScratch('oculus-nested-', {
        'a.md': 'a\n',
        'site/run.sh': 'echo\n',
        'site/new.txt': 'new\n',
        'site/build.log': 'log\n',
        'site/.gitignore': '*.log\n'
    });
    git(dir, 'init', '-q', '-b', 'main');
    git(`${dir}/site`, 'init', '-q', '-b', 'main');
    git(`${dir}/site`, 'add', 'run.sh', '.gitignore');
    git(`${dir}/site`, 'commit', '-q', '-m', 'one');
    execFileSync('sh', ['-c', 'printf "site/\\n" >> .git/info/exclude'], { cwd: dir });
    return dir;
}

/**
 * A repository whose ignore file ignores what `.agents/` holds, with a repository of its own at
 * `.agents/worktrees/w`, as a worktree of a plan lies there.
 */
function repoWithIgnoredWorktree(): string {
    const dir = plantScratch('oculus-nested-', {
        'a.md': 'a\n',
        '.gitignore': '.agents/*\n',
        '.agents/worktrees/w/a.txt': 'a\n'
    });
    git(dir, 'init', '-q', '-b', 'main');
    git(`${dir}/.agents/worktrees/w`, 'init', '-q', '-b', 'main');
    return dir;
}

/** A hub repository whose exclude file names its inner repository `projects/p` by its path. */
function hubWithProject(): string {
    const dir = plantScratch('oculus-nested-', { 'a.md': 'a\n', 'projects/p/b.txt': 'b\n' });
    git(dir, 'init', '-q', '-b', 'main');
    git(`${dir}/projects/p`, 'init', '-q', '-b', 'main');
    execFileSync('sh', ['-c', 'printf "projects/p/\\n" >> .git/info/exclude'], { cwd: dir });
    return dir;
}

/** One workspace folder, the inner repository the watcher found in it, and the names listed. */
type Row = { plant: () => string; inner: string; listed: string[] };

const ROWS: Row[] = [
    {
        plant: hubWithSite,
        inner: 'site',
        listed: ['a.md', 'site/.gitignore', 'site/new.txt', 'site/run.sh']
    },
    {
        plant: repoWithIgnoredWorktree,
        inner: '.agents/worktrees/w',
        listed: ['.gitignore', 'a.md']
    },
    { plant: hubWithProject, inner: 'projects/p', listed: ['a.md', 'projects/p/b.txt'] }
];

describe('the names of a workspace folder holding a repository', () => {
    it('list the inner repository by its own ignore file, each file once', async () => {
        const outcomes: Row[] = [];
        for (const row of ROWS) {
            const dir = row.plant();
            const outcome = await runNames([{ key: 'hub', dir }], 'all', {
                timeout: 10000,
                max: 100,
                skipFolders: ['node_modules', '.git'],
                withheld: [],
                repositories: [dir, `${dir}/${row.inner}`]
            });
            if (!outcome.ok) throw new Error('refused');
            outcomes.push({ ...row, listed: outcome.answer.roots[0].paths.toSorted() });
        }
        expect(outcomes).toEqual(ROWS);
    });
});
