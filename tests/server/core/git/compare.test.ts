// What server/core/git/compare.ts reads for the graph commit's compare items: the files of a
// diff between a ref and a commit, one file's two sides, the ref a branch is compared against
// (Compare with Merge Base), and the refs a picker lists. A ref that could be taken for an option
// is refused before git runs.
//
// What this does NOT cover: the route that answers them and the diff tab the page opens.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    branchBase,
    compareFiles,
    compareSides,
    refNames,
    workspaceSides
} from '../../../../src/lib/server/core/git/compare.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, put, scratchRepo } from '../../git/refs/repo.ts';

isolateGit();

/** A repository with `origin` holding main, and main tracking it. */
function withRemote(): { root: string; remote: string } {
    const root = scratchRepo();
    const remote = scratchDir('oculus-remote-');
    git(remote, 'init', '-q', '--bare');
    git(root, 'remote', 'add', 'origin', remote);
    git(root, 'push', '-q', '-u', 'origin', 'main');
    return { root, remote };
}

describe('compareFiles and compareSides', () => {
    it('lists the files of git diff from to', () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        const second = commitFile(root, 'two.txt', 'two\n', 'Second');
        put(root, 'kept.txt', 'one\nmore\n');
        git(root, 'commit', '-q', '-am', 'Third');
        const third = git(root, 'rev-parse', 'HEAD').trim();
        const listed = compareFiles(root, first, third);
        expect(listed.ok && listed.value.map((file) => `${file.status} ${file.path}`)).toEqual([
            'M kept.txt',
            'A two.txt'
        ]);
        const back = compareFiles(root, third, second);
        expect(back.ok && back.value.map((file) => `${file.status} ${file.path}`)).toEqual([
            'M kept.txt'
        ]);
    });

    it('takes a ref name, a tag and a remote branch for the from side', () => {
        const { root } = withRemote();
        const head = commitFile(root, 'two.txt', 'two\n', 'Second');
        git(root, 'tag', 'v1', 'HEAD~1');
        for (const from of ['v1', 'origin/main', 'main~1']) {
            const listed = compareFiles(root, from, head);
            expect(listed.ok && listed.value.map((file) => file.path), from).toEqual(['two.txt']);
        }
    });

    it('reads the two sides of one file, the from side on the left', () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        put(root, 'kept.txt', 'one\nmore\n');
        git(root, 'commit', '-q', '-am', 'Second');
        const second = git(root, 'rev-parse', 'HEAD').trim();
        const sides = compareSides(root, first, second, 'kept.txt');
        expect(sides.ok && sides.value.map((file) => [file.original, file.modified])).toEqual([
            ['one\n', 'one\nmore\n']
        ]);
    });

    it('reads a renamed file from its old path', () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        git(root, 'mv', 'kept.txt', 'moved.txt');
        git(root, 'commit', '-q', '-am', 'Rename');
        const second = git(root, 'rev-parse', 'HEAD').trim();
        const sides = compareSides(root, first, second, 'moved.txt');
        expect(sides.ok && sides.value.map((file) => [file.oldPath, file.newPath])).toEqual([
            ['kept.txt', 'moved.txt']
        ]);
    });

    it('reads a path literally, so a glob lists nothing', () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        const second = commitFile(root, 'two.txt', 'two\n', 'Second');
        const sides = compareSides(root, first, second, '*.txt');
        expect(sides.ok && sides.value).toEqual([]);
    });

    it('refuses a from side that starts with a dash, running nothing and writing no file', () => {
        const root = scratchRepo();
        const out = join(scratchDir('oculus-out-'), 'x');
        for (const from of [`--output=${out}`, '-p', '--no-index']) {
            expect(compareFiles(root, from, 'HEAD').ok, from).toBe(false);
            expect(compareSides(root, from, 'HEAD', 'kept.txt').ok, from).toBe(false);
        }
        expect(existsSync(out)).toBe(false);
    });

    it('refuses a from side that names no commit and a to side that is not a hash', () => {
        const root = scratchRepo();
        expect(compareFiles(root, 'nothing-here', 'HEAD').ok).toBe(false);
        const head = git(root, 'rev-parse', 'HEAD').trim();
        expect(compareFiles(root, head, 'HEAD').ok).toBe(false);
        expect(compareFiles(root, head, '--output=x').ok).toBe(false);
    });

    it('refuses a path outside the repository', () => {
        const root = scratchRepo();
        const head = git(root, 'rev-parse', 'HEAD').trim();
        mkdirSync(join(root, 'sub'));
        expect(compareSides(root, head, head, '../kept.txt').ok).toBe(false);
    });
});

describe('branchBase', () => {
    it('reads branch.<name>.vscode-merge-base when it names a remote branch', () => {
        const { root } = withRemote();
        git(root, 'config', 'branch.main.vscode-merge-base', 'origin/main');
        expect(branchBase(root)).toBe('origin/main');
    });

    it('ignores a setting that names a branch with no remote', () => {
        const { root } = withRemote();
        git(root, 'remote', 'set-head', 'origin', 'main');
        git(root, 'branch', 'local-only');
        git(root, 'config', 'branch.main.vscode-merge-base', 'local-only');
        expect(branchBase(root)).toBe('origin/main');
    });

    it('takes the upstream of the local branch this one was created from', () => {
        const { root } = withRemote();
        git(root, 'switch', '-q', '-c', 'feature', 'main');
        expect(branchBase(root)).toBe('origin/main');
    });

    it('takes the remote branch this one was created from', () => {
        const { root } = withRemote();
        git(root, 'push', '-q', 'origin', 'main:dev');
        git(root, 'fetch', '-q', 'origin');
        git(root, 'switch', '-q', '-c', 'feature', 'origin/dev');
        expect(branchBase(root)).toBe('origin/dev');
    });

    it('takes the default branch of the remote when nothing else names a base', () => {
        const { root } = withRemote();
        git(root, 'remote', 'set-head', 'origin', 'main');
        git(root, 'switch', '-q', '-c', 'feature');
        git(root, 'reflog', 'expire', '--expire=now', '--all');
        expect(branchBase(root)).toBe('origin/main');
    });

    it('answers nothing for a repository with no remote', () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'feature');
        expect(branchBase(root)).toBe('');
    });
});

describe('refNames', () => {
    it('lists the local branches, the remote branches and the tags, not a remote HEAD', () => {
        const { root } = withRemote();
        git(root, 'remote', 'set-head', 'origin', 'main');
        git(root, 'tag', 'v1');
        git(root, 'branch', 'side');
        const listed = refNames(root);
        expect(listed.ok && listed.value).toEqual([
            { name: 'main', kind: 'branch' },
            { name: 'side', kind: 'branch' },
            { name: 'origin/main', kind: 'remote' },
            { name: 'v1', kind: 'tag' }
        ]);
    });
});

describe('workspaceSides', () => {
    /** The repository and a linked worktree of it, each holding its own `kept.txt`. */
    function linked(): { main: string; tree: string } {
        const main = scratchRepo();
        const tree = join(scratchDir('oculus-linked-'), 'tree');
        git(main, 'worktree', 'add', '-q', '-b', 'tree', tree);
        put(main, 'kept.txt', 'main text\n');
        put(tree, 'kept.txt', 'tree text\n');
        return { main, tree };
    }

    it('reads the main worktree file as the left side and this worktree file as the right', () => {
        const { main, tree } = linked();
        const sides = workspaceSides(tree, 'kept.txt', [main]);
        expect(sides.ok && sides.value).toMatchObject([
            {
                oldPath: 'kept.txt',
                newPath: 'kept.txt',
                original: 'main text\n',
                modified: 'tree text\n',
                binary: false
            }
        ]);
    });

    it('diffs a file the main worktree lacks against the empty text', () => {
        const { main, tree } = linked();
        put(tree, 'only/here.txt', 'new\n');
        const sides = workspaceSides(tree, 'only/here.txt', [main]);
        expect(sides.ok && sides.value[0]).toMatchObject({ original: '', modified: 'new\n' });
    });

    it('diffs a file the worktree lacks against the main worktree file', () => {
        const { main, tree } = linked();
        put(main, 'gone.txt', 'old\n');
        const sides = workspaceSides(tree, 'gone.txt', [main]);
        expect(sides.ok && sides.value[0]).toMatchObject({ original: 'old\n', modified: '' });
    });

    it('refuses a repository that is not a linked worktree', () => {
        const { main } = linked();
        const sides = workspaceSides(main, 'kept.txt', [main]);
        expect(sides.ok).toBe(false);
    });

    it('refuses a path outside the worktree, an empty path and a directory', () => {
        const { main, tree } = linked();
        for (const path of ['../kept.txt', '/etc/hosts', '', '.']) {
            expect(workspaceSides(tree, path, [main]).ok, path).toBe(false);
        }
    });

    it('refuses a path whose real location leaves the worktree', () => {
        const { main, tree } = linked();
        const outside = scratchDir('oculus-outside-');
        put(outside, 'secret.txt', 'secret\n');
        symlinkSync(outside, join(tree, 'out'));
        expect(workspaceSides(tree, 'out/secret.txt', [main]).ok).toBe(false);
    });

    it('refuses a main worktree outside the roots, returning none of its text', () => {
        const { main, tree } = linked();
        const elsewhere = scratchDir('oculus-roots-');
        for (const roots of [[], [elsewhere]]) {
            const sides = workspaceSides(tree, 'kept.txt', roots);
            expect(sides.ok).toBe(false);
            expect(JSON.stringify(sides)).not.toContain('main text');
        }
        expect(workspaceSides(tree, 'kept.txt', [main]).ok).toBe(true);
    });

    it('accepts a root that is a link to the main worktree, both taken by their real paths', () => {
        const { main, tree } = linked();
        const elsewhere = scratchDir('oculus-roots-');
        const gate = join(elsewhere, 'gate');
        symlinkSync(main, gate);
        expect(workspaceSides(tree, 'kept.txt', [gate]).ok).toBe(true);
    });
});
