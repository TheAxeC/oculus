// Layer 2, server tests. The names Quick Open matches (server/files/search/search.ts `runNames`,
// over the real ripgrep): a workspace folder that is a repository holding a repository of its own,
// which the outer repository's exclude file names as a hub's does, lists the inner repository's
// tracked and untracked files under the inner repository's own ignore file, once each.
//
// The machine's and the user's git configuration are replaced by an empty file (`isolateGit`),
// so no hook, identity or signing key of the machine runs or is read.
//
// It does not cover the palette's rows as drawn, which the look does.

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

describe('the names of a workspace folder holding a repository', () => {
    it('list the inner repository by its own ignore file, each file once', async () => {
        const dir = hubWithSite();
        const outcome = await runNames([{ key: 'hub', dir }], 'all', {
            timeout: 10000,
            max: 100,
            withheld: [],
            repositories: [dir, `${dir}/site`]
        });
        if (!outcome.ok) throw new Error('refused');
        const paths = outcome.answer.roots[0].paths.toSorted();
        expect(paths).toEqual(['a.md', 'site/.gitignore', 'site/new.txt', 'site/run.sh']);
    });
});
