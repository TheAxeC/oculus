// What the writes beside server/git/git-write.ts run: the remote writes of git-remote.ts, the
// index writes of git-index.ts and the stashes and tags of git-refs.ts.
//
// Every repository here is made under the system temporary directory with the real git: a bare
// repository stands for the remote, and the working repository is a clone of it, so pull, fetch,
// sync, publish and the tag push cross a real remote without leaving the temporary tree.
//
// The machine's and the user's git configuration are replaced by an empty file (`isolateGit`),
// so no hook, identity or signing key of the machine runs or is read.
// @module-tag slow: its cases run real git against a bare remote, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { beforeEach, describe, expect } from 'vitest';
import { allowedRoots, commit } from '../../../src/lib/server/git/git-write.ts';
import { fetchAll, publish, pull, pushTags, sync } from '../../../src/lib/server/git/git-remote.ts';
import {
    abortMerge,
    applyHunk,
    acceptDeletion,
    continueRebase,
    discardAll,
    markResolved,
    resolveMerge,
    stageAll,
    unstageAll
} from '../../../src/lib/server/git/git-index.ts';
import { createTag, deleteTag, stash, stashAct } from '../../../src/lib/server/git/git-refs.ts';
import { fileSides } from '../../../src/lib/server/git/git-reads.ts';
import { hunkRows, hunksOf } from '../../../src/lib/state/sources/repositories/diff/diff-hunks.ts';
import { sidesPatch } from '../../../src/lib/state/sources/repositories/diff/diff-patch.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { DELETED, deletionConflicts } from './deletions.ts';
import { isolateGit } from './refs/repo.ts';
import { TEXT } from '../text.ts';

let dir = '';
let remote = '';
let repo = '';
let other = '';
let ROOTS: string[] = [];

/** A git command inside the throwaway directory, and nowhere else, for setting a case up. */
function git(root: string, ...args: string[]): string {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return execFileSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Nobody',
            '-c',
            'commit.gpgsign=false',
            '-C',
            root,
            ...args
        ],
        { encoding: 'utf8' }
    );
}

/** A git command that may fail, answering whether it succeeded. */
function tryGit(root: string, ...args: string[]): boolean {
    try {
        git(root, ...args);
        return true;
    } catch {
        return false;
    }
}

function write(root: string, name: string, body: string): void {
    const full = join(root, name);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    writeFileSync(full, body);
}

function read(root: string, name: string): string {
    return readFileSync(join(root, name), 'utf8');
}

/** The porcelain of a repository, one line per path, untracked paths included. */
function status(root: string = repo): string[] {
    return git(root, 'status', '--porcelain')
        .split('\n')
        .filter((line) => line.trim() !== '');
}

/** A clone of the remote with this suite's identity, which is where a case's own work is made. */
function cloneAs(name: string): string {
    const path = join(dir, name);
    execFileSync('git', ['clone', '-q', remote, path]);
    for (const [key, value] of [
        ['user.email', 'nobody@example.invalid'],
        ['user.name', 'Nobody'],
        ['commit.gpgsign', 'false'],
        ['pull.rebase', 'false']
    ]) {
        git(path, 'config', key, value);
    }
    return path;
}

/** The clones the template holds, each of which a case gets a copy of. */
const CLONES = ['seed', 'repo', 'other'];

/** The remote and its clones, built once; every case starts from a copy of this folder. */
let template = '';

isolateGit();

test.beforeAll(() => {
    dir = scratchDir('oculus-git-ops-template-');
    remote = join(dir, 'remote.git');
    execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
    const seed = cloneAs('seed');
    write(seed, 'kept.txt', 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\n');
    git(seed, 'add', '.');
    git(seed, 'commit', '-q', '-m', 'First');
    git(seed, 'push', '-q', 'origin', 'main');
    cloneAs('repo');
    cloneAs('other');
    template = dir;
});

beforeEach(() => {
    // A copy of the template per case, its clones pointed at the copied remote, so every case
    // starts from a remote and clones no other case has touched.
    dir = scratchDir('oculus-git-ops-');
    cpSync(template, dir, { recursive: true });
    remote = join(dir, 'remote.git');
    for (const name of CLONES) git(join(dir, name), 'remote', 'set-url', 'origin', remote);
    repo = join(dir, 'repo');
    other = join(dir, 'other');
    ROOTS = allowedRoots([repo, other]);
});

test.afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

/** The unstaged diff of kept.txt as the pane reads it, which a patch is cut from. */
function diffOf(root: string, ...flags: string[]): string {
    return git(root, 'diff', ...flags, '--', 'kept.txt');
}

describe('pull, fetch, sync and publish', () => {
    it('fetches the remote branches and takes away the ones the remote dropped', async () => {
        git(other, 'push', '-q', 'origin', 'main:gone-soon');
        expect((await fetchAll(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(git(repo, 'branch', '-r')).toContain('origin/gone-soon');
        git(other, 'push', '-q', 'origin', '--delete', 'gone-soon');
        expect((await fetchAll(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(git(repo, 'branch', '-r')).not.toContain('origin/gone-soon');
    });

    it('syncs: pulls, then pushes what the branch holds', async () => {
        write(other, 'theirs.txt', 'x\n');
        git(other, 'add', '.');
        git(other, 'commit', '-qm', 'Theirs');
        git(other, 'push', '-q');
        write(repo, 'mine.txt', 'y\n');
        git(repo, 'add', '.');
        git(repo, 'commit', '-qm', 'Mine');
        const answer = await sync(repo, TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'theirs.txt')).toBe('x\n');
        const upstream = git(remote, 'log', '--format=%s', 'main');
        expect(upstream).toContain('Mine');
        expect(upstream).toContain('Theirs');
    });

    it("pulls the repository's own way, rebasing where the repository says so", async () => {
        git(repo, 'config', 'pull.rebase', 'true');
        write(other, 'theirs.txt', 'x\n');
        git(other, 'add', '.');
        git(other, 'commit', '-qm', 'Theirs');
        git(other, 'push', '-q');
        write(repo, 'mine.txt', 'y\n');
        git(repo, 'add', '.');
        git(repo, 'commit', '-qm', 'Mine');
        expect((await pull(repo, TEXT, ROOTS)).ok).toBe(true);
        // A rebase leaves no merge commit: the history is one line.
        expect(git(repo, 'log', '--format=%s').trim().split('\n')).toEqual([
            'Mine',
            'Theirs',
            'First'
        ]);
    });

    it('publishes a branch to a remote of its own, and refuses one that has an upstream', async () => {
        git(repo, 'switch', '-qc', 'fresh-work');
        const bad = await publish(repo, 'elsewhere', TEXT, ROOTS);
        expect(bad.ok).toBe(false);
        expect(bad.error).toContain('not a remote');
        const answer = await publish(repo, 'origin', TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', '@{upstream}').trim()).toBe(
            'origin/fresh-work'
        );
        expect(git(remote, 'branch', '--list', 'fresh-work')).toContain('fresh-work');
        const again = await publish(repo, 'origin', TEXT, ROOTS);
        expect(again.ok).toBe(false);
        expect(again.error).toContain('already has the upstream');
    });
});

describe('hunks and lines', () => {
    /** Two changes far enough apart to be two hunks: line two and line seven. */
    function twoChanges(): void {
        write(repo, 'kept.txt', 'one\nTWO\nthree\nfour\nfive\nsix\nSEVEN\neight\n');
    }

    it('stages one hunk of two, and unstages it again', async () => {
        twoChanges();
        const text = diffOf(repo, '-U1');
        const [head, first, second] = text.split(/(?=^@@)/m);
        expect(second).toContain('SEVEN');
        const staged = await applyHunk(repo, `${head}${first}`, 'stage', TEXT, ROOTS);
        expect(staged.ok).toBe(true);
        expect(git(repo, 'diff', '--cached')).toContain('+TWO');
        expect(git(repo, 'diff', '--cached')).not.toContain('SEVEN');
        expect(git(repo, 'diff')).toContain('+SEVEN');

        const back = git(repo, 'diff', '--cached', '--', 'kept.txt');
        const unstaged = await applyHunk(repo, back, 'unstage', TEXT, ROOTS);
        expect(unstaged.ok).toBe(true);
        expect(git(repo, 'diff', '--cached')).toBe('');
        expect(read(repo, 'kept.txt')).toContain('TWO');
    });

    it("reads a file's changes as git's hunks, and stages one block as exactly git's hunk", async () => {
        // On this pair git adds `const C = 3;` and a blank line after line 2 (`@@ -2,0 +3,2 @@`),
        // where Monaco's own diff adds a blank line and `const C = 3;` after line 1. The change of
        // the last line is a second block, far enough below to be a hunk of its own.
        const middle = ['four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
        const before = ['const A = 1;', '', 'const B = 2;', ...middle, 'const Z = 9;'];
        const after = ['const A = 1;', '', 'const C = 3;', '', 'const B = 2;', ...middle];
        write(repo, 'slide.ts', `${before.join('\n')}\n`);
        git(repo, 'add', 'slide.ts');
        git(repo, 'commit', '-qm', 'Slide');
        write(repo, 'slide.ts', `${[...after, 'const Z = 10;'].join('\n')}\n`);
        const read = await fileSides(repo, 'slide.ts', false, TEXT, ROOTS);
        if (!read.ok) throw new Error(read.error);
        const [file] = read.value.files;
        const change = (a: number, b: number, c: number, d: number) => ({
            originalStartLineNumber: a,
            originalEndLineNumber: b,
            modifiedStartLineNumber: c,
            modifiedEndLineNumber: d
        });
        expect(file.changes).toEqual([change(2, 0, 3, 4), change(12, 12, 14, 14)]);
        const blocks = hunksOf(file.changes ?? []);
        expect(blocks).toHaveLength(2);
        const unstaged = git(repo, 'diff', '-U0', '--', 'slide.ts');
        const [hunk] = /^@@[^]*?(?=^@@)/m.exec(unstaged) ?? [];
        const patch = sidesPatch(file, file.changes ?? [], hunkRows(blocks[0]), 'stage');
        expect((await applyHunk(repo, patch, 'stage', TEXT, ROOTS)).ok).toBe(true);
        const staged = git(repo, 'diff', '--cached', '-U0', '--', 'slide.ts');
        expect(staged.slice(staged.indexOf('@@'))).toBe(hunk);
        expect(hunk).toBe('@@ -2,0 +3,2 @@ const A = 1;\n+const C = 3;\n+\n');
    });

    it('reverts one hunk in the worktree and leaves the other', async () => {
        twoChanges();
        const text = diffOf(repo, '-U1');
        const [head, , second] = text.split(/(?=^@@)/m);
        const answer = await applyHunk(repo, `${head}${second}`, 'revert', TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('one\nTWO\nthree\nfour\nfive\nsix\nseven\neight\n');
    });

    it('stages every tracked change, every untracked path, unstages all and discards all', async () => {
        write(repo, 'kept.txt', 'changed\n');
        write(repo, 'loose.txt', 'new\n');
        expect((await stageAll(repo, 'changed', TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['M  kept.txt', '?? loose.txt']);
        expect((await stageAll(repo, 'untracked', TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['M  kept.txt', 'A  loose.txt']);
        expect((await unstageAll(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual([' M kept.txt', '?? loose.txt']);
        expect((await discardAll(repo, TEXT, ROOTS)).ok).toBe(true);
        // The untracked path is left: nothing here deletes a file git never saw.
        expect(status()).toEqual(['?? loose.txt']);
        expect(read(repo, 'kept.txt')).toContain('one');
        const none = await stageAll(repo, 'everything', TEXT, ROOTS);
        expect(none.ok).toBe(false);
    });
});

describe('conflicts', () => {
    /** Two branches that change kept.txt's first line, the second merged into the first. */
    function conflicted(): void {
        git(repo, 'switch', '-qc', 'side');
        write(repo, 'kept.txt', 'side\n');
        git(repo, 'commit', '-qam', 'Side');
        git(repo, 'switch', '-q', 'main');
        write(repo, 'kept.txt', 'main\n');
        git(repo, 'commit', '-qam', 'Main');
        expect(tryGit(repo, 'merge', 'side')).toBe(false);
    }

    it('writes the result over a conflicted path and stages it, and commits the merge', async () => {
        conflicted();
        const answer = await resolveMerge(repo, 'kept.txt', 'main\nside\n', TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('main\nside\n');
        expect(status()).toEqual(['M  kept.txt']);
        const message = read(repo, '.git/MERGE_MSG');
        expect((await commit(repo, message, TEXT, ROOTS)).ok).toBe(true);
        expect(git(repo, 'log', '-1', '--format=%P').trim().split(' ').length).toBe(2);
    });

    it('aborts a merge, and a rebase, and says when neither is in progress', async () => {
        const quiet = await abortMerge(repo, TEXT, ROOTS);
        expect(quiet.ok).toBe(false);
        expect(quiet.error).toContain('No merge is in progress');

        conflicted();
        expect((await abortMerge(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(false);
        expect(read(repo, 'kept.txt')).toBe('main\n');

        expect(tryGit(repo, 'rebase', 'side')).toBe(false);
        expect((await abortMerge(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'rebase-merge'))).toBe(false);
        expect(read(repo, 'kept.txt')).toBe('main\n');
    });

    it('carries a rebase on once its conflict is resolved, and not before', async () => {
        conflicted();
        expect((await abortMerge(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(tryGit(repo, 'rebase', 'side')).toBe(false);
        const early = await continueRebase(repo, TEXT, ROOTS);
        expect(early.ok).toBe(false);
        expect(early.error).toContain('Still in conflict');
        expect((await resolveMerge(repo, 'kept.txt', 'both\n', TEXT, ROOTS)).ok).toBe(true);
        const answer = await continueRebase(repo, TEXT, ROOTS);
        expect(answer.ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'rebase-merge'))).toBe(false);
        expect(git(repo, 'log', '--format=%s').trim().split('\n')).toEqual([
            'Main',
            'Side',
            'First'
        ]);
    });
});

describe('conflicts a deletion made', () => {
    /** The unmerged entries git still holds, which a resolved merge has none of. */
    function unmerged(): string {
        return git(repo, 'ls-files', '-u').trim();
    }

    it('takes the deletion of a DD, a DU and a UD path: gone from the index and the worktree', async () => {
        deletionConflicts(repo, git, 'main');
        expect(status()).toEqual(
            expect.arrayContaining([
                `DD ${DELETED.both}`,
                `DU ${DELETED.ours}`,
                `UD ${DELETED.theirs}`
            ])
        );
        for (const path of Object.values(DELETED)) {
            const answer = await acceptDeletion(repo, path, TEXT, ROOTS);
            expect(answer.ok, answer.error).toBe(true);
            expect(existsSync(join(repo, path))).toBe(false);
            expect(git(repo, 'ls-files', '--', path).trim()).toBe('');
        }
        expect(git(repo, 'ls-files', '-u', '--', ...Object.values(DELETED)).trim()).toBe('');
        // HEAD held theirs.txt, so taking its deletion stages one; HEAD held neither of the others.
        expect(status()).toContain(`D  ${DELETED.theirs}`);
    });

    it('marks each deletion conflict resolved, leaving no unmerged entry, and keeps a held file', async () => {
        deletionConflicts(repo, git, 'main');
        expect(unmerged()).not.toBe('');
        const renamed = status()
            .filter((line) => line.startsWith('AU') || line.startsWith('UA'))
            .map((line) => line.slice(3));
        expect(renamed.sort()).toEqual(['renamed-here.txt', 'renamed-there.txt']);
        for (const path of [...Object.values(DELETED), ...renamed]) {
            const answer = await markResolved(repo, path, TEXT, ROOTS);
            expect(answer.ok, `${path}: ${answer.error}`).toBe(true);
        }
        expect(unmerged()).toBe('');
        expect(existsSync(join(repo, DELETED.both))).toBe(false);
        expect(read(repo, DELETED.ours)).toBe('changed by the other side\n');
        expect(read(repo, DELETED.theirs)).toBe('changed by this side\n');
        // HEAD deleted ours.txt, so keeping it stages an addition; theirs.txt is as HEAD holds it.
        expect(status()).toContain(`A  ${DELETED.ours}`);
        expect(git(repo, 'ls-files', '--', DELETED.theirs).trim()).toBe(DELETED.theirs);
    });
});

describe('stashes', () => {
    it('stashes the tracked changes, every change, or what is staged, each with its message', async () => {
        write(repo, 'kept.txt', 'changed\n');
        write(repo, 'loose.txt', 'new\n');
        expect((await stash(repo, 'tracked', 'just tracked', TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['?? loose.txt']);
        expect(git(repo, 'stash', 'list')).toContain('just tracked');

        expect((await stash(repo, 'untracked', '', TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual([]);

        write(repo, 'kept.txt', 'staged\n');
        git(repo, 'add', 'kept.txt');
        write(repo, 'other.txt', 'loose\n');
        expect((await stash(repo, 'staged', 'only staged', TEXT, ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['?? other.txt']);
        expect(git(repo, 'stash', 'list').split('\n')[0]).toContain('only staged');
    });

    it('applies, pops and drops a stash by its name', async () => {
        write(repo, 'kept.txt', 'first\n');
        await stash(repo, 'tracked', 'one', TEXT, ROOTS);
        write(repo, 'kept.txt', 'second\n');
        await stash(repo, 'tracked', 'two', TEXT, ROOTS);

        expect((await stashAct(repo, 'apply', 'stash@{1}', TEXT, ROOTS)).ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('first\n');
        expect(git(repo, 'stash', 'list').split('\n').filter(Boolean).length).toBe(2);
        git(repo, 'checkout', '--', 'kept.txt');

        expect((await stashAct(repo, 'pop', 'stash@{0}', TEXT, ROOTS)).ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('second\n');
        expect(git(repo, 'stash', 'list')).not.toContain('two');

        expect((await stashAct(repo, 'drop', 'stash@{0}', TEXT, ROOTS)).ok).toBe(true);
        expect(git(repo, 'stash', 'list')).toBe('');
    });
});

describe('tags', () => {
    it('makes a plain tag and an annotated one at HEAD, and deletes one', async () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        expect((await createTag(repo, 'v1', '', TEXT, ROOTS)).ok).toBe(true);
        expect((await createTag(repo, 'v2', 'The second\n\nWith a body', TEXT, ROOTS)).ok).toBe(
            true
        );
        expect(git(repo, 'rev-parse', 'v1^{commit}').trim()).toBe(head);
        expect(git(repo, 'cat-file', '-t', 'v2').trim()).toBe('tag');
        expect(git(repo, 'tag', '-l', '--format=%(contents:subject)', 'v2').trim()).toBe(
            'The second'
        );
        expect((await deleteTag(repo, 'v1', TEXT, ROOTS)).ok).toBe(true);
        expect(git(repo, 'tag', '-l')).not.toContain('v1');
    });

    it('pushes every tag to the remote', async () => {
        await createTag(repo, 'shipped', 'Shipped', TEXT, ROOTS);
        expect((await pushTags(repo, TEXT, ROOTS)).ok).toBe(true);
        expect(git(remote, 'tag', '-l')).toContain('shipped');
    });
});
