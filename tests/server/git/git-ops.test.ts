// What the writes beside server/git/git-write.ts run: the amend, the remote writes of
// git-remote.ts, the index writes of git-index.ts and the stashes and tags of git-refs.ts.
//
// Every repository here is made under the system temporary directory with the real git: a bare
// repository stands for the remote, and the working repository is a clone of it, so pull, fetch,
// sync, publish and the tag push cross a real remote without leaving the temporary tree. The last
// describe is this file's gate, the same as git-write.test.ts's: every command the modules ran is
// one of the writing half's own subcommands, from a root in the temporary tree, never forced.

import { execFileSync } from 'node:child_process';
import {
    chmodSync,
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { allowedRoots, commit } from '../../../src/lib/server/git/git-write.ts';
import { fetchAll, publish, pull, pushTags, sync } from '../../../src/lib/server/git/git-remote.ts';
import {
    abortMerge,
    applyHunk,
    acceptDeletion,
    continueRebase,
    discardAll,
    markResolved,
    patchPaths,
    resolveMerge,
    stageAll,
    unstageAll
} from '../../../src/lib/server/git/git-index.ts';
import { createTag, deleteTag, stash, stashAct } from '../../../src/lib/server/git/git-refs.ts';
import { handleGit } from '../../../src/lib/server/git/git-routes.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { ALLOWED } from './allowed.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { pageRequest } from './page.ts';
import { DELETED, deletionConflicts } from './deletions.ts';

afterAll(sweepScratch);

/** Every argument vector the modules ran, over the whole file. Asserted by the last gate. */
const ran = vi.hoisted(() => [] as string[][]);
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    // Only what a module under src/lib/server runs is recorded; a test's own setup command is not.
    const fromServer = (): boolean => (new Error().stack ?? '').includes('/src/lib/server/');
    return {
        ...actual,
        execFile: ((file: string, args: string[], ...rest: unknown[]) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            return (actual.execFile as (...held: unknown[]) => unknown)(file, args, ...rest);
        }) as typeof actual.execFile
    };
});

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

beforeAll(() => {
    dir = scratchDir('oculus-git-ops-template-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    cpSync(template, dir, { recursive: true });
    remote = join(dir, 'remote.git');
    for (const name of CLONES) git(join(dir, name), 'remote', 'set-url', 'origin', remote);
    repo = join(dir, 'repo');
    other = join(dir, 'other');
    ROOTS = allowedRoots([repo, other]);
});

afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

/** The unstaged diff of kept.txt as the pane reads it, which a patch is cut from. */
function diffOf(root: string, ...flags: string[]): string {
    return git(root, 'diff', ...flags, '--', 'kept.txt');
}

describe('the amend', () => {
    it('replaces the last commit, and keeps its message when the box is empty', async () => {
        write(repo, 'kept.txt', 'one\n');
        git(repo, 'commit', '-qam', 'Local work');
        write(repo, 'kept.txt', 'one more\n');
        git(repo, 'add', 'kept.txt');
        const kept = await commit(repo, '', ROOTS, true);
        expect(kept.ok).toBe(true);
        expect(git(repo, 'log', '-1', '--format=%s').trim()).toBe('Local work');
        expect(git(repo, 'show', 'HEAD:kept.txt')).toBe('one more\n');
        const renamed = await commit(repo, 'Better words', ROOTS, true);
        expect(renamed.ok).toBe(true);
        expect(git(repo, 'log', '--format=%s').trim().split('\n')).toEqual([
            'Better words',
            'First'
        ]);
    });

    it('refuses a commit the upstream already holds, since that would need a forced push', async () => {
        const head = git(repo, 'rev-parse', 'HEAD');
        const answer = await commit(repo, 'Rewrite history', ROOTS, true);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('forced push');
        expect(git(repo, 'rev-parse', 'HEAD')).toBe(head);
    });

    it('still refuses a plain commit with no message', async () => {
        const answer = await commit(repo, '  ', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('needs a message');
    });
});

describe('pull, fetch, sync and publish', () => {
    it('pulls what the upstream holds', async () => {
        write(other, 'theirs.txt', 'x\n');
        git(other, 'add', '.');
        git(other, 'commit', '-qm', 'Theirs');
        git(other, 'push', '-q');
        const answer = await pull(repo, ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'theirs.txt')).toBe('x\n');
    });

    it('fetches the remote branches and takes away the ones the remote dropped', async () => {
        git(other, 'push', '-q', 'origin', 'main:gone-soon');
        expect((await fetchAll(repo, ROOTS)).ok).toBe(true);
        expect(git(repo, 'branch', '-r')).toContain('origin/gone-soon');
        git(other, 'push', '-q', 'origin', '--delete', 'gone-soon');
        expect((await fetchAll(repo, ROOTS)).ok).toBe(true);
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
        const answer = await sync(repo, ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'theirs.txt')).toBe('x\n');
        const upstream = git(remote, 'log', '--format=%s', 'main');
        expect(upstream).toContain('Mine');
        expect(upstream).toContain('Theirs');
    });

    it('leaves a pull that stops on conflicts in progress, and says where they are', async () => {
        write(other, 'kept.txt', 'theirs\n');
        git(other, 'commit', '-qam', 'Theirs');
        git(other, 'push', '-q');
        write(repo, 'kept.txt', 'mine\n');
        git(repo, 'commit', '-qam', 'Mine');
        const answer = await sync(repo, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('kept.txt');
        expect(answer.error).toContain('Merge Changes');
        expect(status()).toEqual(['UU kept.txt']);
        // Nothing was pushed while the pull was unsettled.
        expect(git(remote, 'log', '--format=%s', 'main')).not.toContain('Mine');
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
        expect((await pull(repo, ROOTS)).ok).toBe(true);
        // A rebase leaves no merge commit: the history is one line.
        expect(git(repo, 'log', '--format=%s').trim().split('\n')).toEqual([
            'Mine',
            'Theirs',
            'First'
        ]);
    });

    it('refuses a pull on a branch with no upstream', async () => {
        git(repo, 'switch', '-qc', 'lonely');
        const answer = await pull(repo, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('no upstream');
    });

    it('publishes a branch to a remote of its own, and refuses one that has an upstream', async () => {
        git(repo, 'switch', '-qc', 'fresh-work');
        const bad = await publish(repo, 'elsewhere', ROOTS);
        expect(bad.ok).toBe(false);
        expect(bad.error).toContain('not a remote');
        const answer = await publish(repo, 'origin', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', '@{upstream}').trim()).toBe(
            'origin/fresh-work'
        );
        expect(git(remote, 'branch', '--list', 'fresh-work')).toContain('fresh-work');
        const again = await publish(repo, 'origin', ROOTS);
        expect(again.ok).toBe(false);
        expect(again.error).toContain('already has the upstream');
    });

    it('refuses a root the page does not know', async () => {
        const stranger = join(dir, 'stranger');
        for (const answer of [
            await pull(stranger, ROOTS),
            await fetchAll(stranger, ROOTS),
            await sync(stranger, ROOTS),
            await publish(stranger, 'origin', ROOTS),
            await pushTags(stranger, ROOTS)
        ]) {
            expect(answer.ok).toBe(false);
            expect(answer.error).toContain('not a workspace');
        }
    });
});

describe('hunks and lines', () => {
    /** Two changes far enough apart to be two hunks: line two and line seven. */
    function twoChanges(): void {
        write(repo, 'kept.txt', 'one\nTWO\nthree\nfour\nfive\nsix\nSEVEN\neight\n');
    }

    it('names the paths a patch heads carry, quoted or not, and leaves /dev/null out', () => {
        const patch = [
            'diff --git a/x b/x',
            '--- a/x',
            '+++ b/x',
            'diff --git "a/sp ace" "b/sp ace"',
            '--- /dev/null',
            '+++ "b/sp ace"',
            'rename from old',
            'rename to new'
        ].join('\n');
        expect(patchPaths(patch)).toEqual(['x', 'x', 'sp ace', 'old', 'new']);
    });

    it('stages one hunk of two, and unstages it again', async () => {
        twoChanges();
        const text = diffOf(repo, '-U1');
        const [head, first, second] = text.split(/(?=^@@)/m);
        expect(second).toContain('SEVEN');
        const staged = await applyHunk(repo, `${head}${first}`, 'stage', ROOTS);
        expect(staged.ok).toBe(true);
        expect(git(repo, 'diff', '--cached')).toContain('+TWO');
        expect(git(repo, 'diff', '--cached')).not.toContain('SEVEN');
        expect(git(repo, 'diff')).toContain('+SEVEN');

        const back = git(repo, 'diff', '--cached', '--', 'kept.txt');
        const unstaged = await applyHunk(repo, back, 'unstage', ROOTS);
        expect(unstaged.ok).toBe(true);
        expect(git(repo, 'diff', '--cached')).toBe('');
        expect(read(repo, 'kept.txt')).toContain('TWO');
    });

    it('stages chosen lines only, git counting the cut hunk itself', async () => {
        write(repo, 'kept.txt', 'one\nA\nB\ntwo\nthree\nfour\nfive\nsix\nseven\neight\n');
        // The hunk adds A and B; the patch keeps A and drops B, with the counts left as they were.
        const text = diffOf(repo);
        const cut = text
            .split('\n')
            .filter((line) => line !== '+B')
            .join('\n');
        const answer = await applyHunk(repo, cut, 'stage', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(
            'one\nA\ntwo\nthree\nfour\nfive\nsix\nseven\neight\n'
        );
        expect(read(repo, 'kept.txt')).toContain('B\n');
    });

    it('reverts one hunk in the worktree and leaves the other', async () => {
        twoChanges();
        const text = diffOf(repo, '-U1');
        const [head, , second] = text.split(/(?=^@@)/m);
        const answer = await applyHunk(repo, `${head}${second}`, 'revert', ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('one\nTWO\nthree\nfour\nfive\nsix\nseven\neight\n');
    });

    it("answers a patch git refuses with git's own line, and refuses one that leaves the repository", async () => {
        const stale = [
            'diff --git a/kept.txt b/kept.txt',
            '--- a/kept.txt',
            '+++ b/kept.txt',
            '@@ -1,1 +1,1 @@',
            '-not what the file holds',
            '+anything',
            ''
        ].join('\n');
        const refused = await applyHunk(repo, stale, 'stage', ROOTS);
        expect(refused.ok).toBe(false);
        expect(refused.error).toMatch(/patch/);

        const outside = stale.replaceAll('kept.txt', '../outside.txt');
        const escape = await applyHunk(repo, outside, 'stage', ROOTS);
        expect(escape.ok).toBe(false);
        expect(escape.error).toContain('not inside the workspace');
        const nothing = await applyHunk(repo, 'rm -rf /', 'stage', ROOTS);
        expect(nothing.ok).toBe(false);
        expect(nothing.error).toContain('not a patch');
    });

    it('stages every tracked change, every untracked path, unstages all and discards all', async () => {
        write(repo, 'kept.txt', 'changed\n');
        write(repo, 'loose.txt', 'new\n');
        expect((await stageAll(repo, 'changed', ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['M  kept.txt', '?? loose.txt']);
        expect((await stageAll(repo, 'untracked', ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['M  kept.txt', 'A  loose.txt']);
        expect((await unstageAll(repo, ROOTS)).ok).toBe(true);
        expect(status()).toEqual([' M kept.txt', '?? loose.txt']);
        expect((await discardAll(repo, ROOTS)).ok).toBe(true);
        // The untracked path is left: nothing here deletes a file git never saw.
        expect(status()).toEqual(['?? loose.txt']);
        expect(read(repo, 'kept.txt')).toContain('one');
        const none = await stageAll(repo, 'everything', ROOTS);
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
        const answer = await resolveMerge(repo, 'kept.txt', 'main\nside\n', ROOTS);
        expect(answer.ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('main\nside\n');
        expect(status()).toEqual(['M  kept.txt']);
        const message = read(repo, '.git/MERGE_MSG');
        expect((await commit(repo, message, ROOTS)).ok).toBe(true);
        expect(git(repo, 'log', '-1', '--format=%P').trim().split(' ').length).toBe(2);
    });

    it('refuses to write over a path that is not in conflict', async () => {
        const answer = await resolveMerge(repo, 'kept.txt', 'lost\n', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not in conflict');
        expect(read(repo, 'kept.txt')).toContain('one');
    });

    it('aborts a merge, and a rebase, and says when neither is in progress', async () => {
        const quiet = await abortMerge(repo, ROOTS);
        expect(quiet.ok).toBe(false);
        expect(quiet.error).toContain('no merge is in progress');

        conflicted();
        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(false);
        expect(read(repo, 'kept.txt')).toBe('main\n');

        expect(tryGit(repo, 'rebase', 'side')).toBe(false);
        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'rebase-merge'))).toBe(false);
        expect(read(repo, 'kept.txt')).toBe('main\n');
    });

    it('carries a rebase on once its conflict is resolved, and not before', async () => {
        conflicted();
        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
        expect(tryGit(repo, 'rebase', 'side')).toBe(false);
        const early = await continueRebase(repo, ROOTS);
        expect(early.ok).toBe(false);
        expect(early.error).toContain('still conflicted');
        expect((await resolveMerge(repo, 'kept.txt', 'both\n', ROOTS)).ok).toBe(true);
        const answer = await continueRebase(repo, ROOTS);
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
            const answer = await acceptDeletion(repo, path, ROOTS);
            expect(answer.ok, answer.error).toBe(true);
            expect(existsSync(join(repo, path))).toBe(false);
            expect(git(repo, 'ls-files', '--', path).trim()).toBe('');
        }
        expect(git(repo, 'ls-files', '-u', '--', ...Object.values(DELETED)).trim()).toBe('');
        // HEAD held theirs.txt, so taking its deletion stages one; HEAD held neither of the others.
        expect(status()).toContain(`D  ${DELETED.theirs}`);
    });

    it('refuses to take a deletion on a path both sides changed, or one not in conflict', async () => {
        git(repo, 'switch', '-qc', 'side');
        write(repo, 'kept.txt', 'side\n');
        git(repo, 'commit', '-qam', 'Side');
        git(repo, 'switch', '-q', 'main');
        write(repo, 'kept.txt', 'main\n');
        git(repo, 'commit', '-qam', 'Main');
        expect(tryGit(repo, 'merge', 'side')).toBe(false);
        const answer = await acceptDeletion(repo, 'kept.txt', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('no deletion to take');
        expect(read(repo, 'kept.txt')).toContain('main');
        expect(status()).toEqual(['UU kept.txt']);
    });

    it('marks each deletion conflict resolved, leaving no unmerged entry, and keeps a held file', async () => {
        deletionConflicts(repo, git, 'main');
        expect(unmerged()).not.toBe('');
        const renamed = status()
            .filter((line) => line.startsWith('AU') || line.startsWith('UA'))
            .map((line) => line.slice(3));
        expect(renamed.sort()).toEqual(['renamed-here.txt', 'renamed-there.txt']);
        for (const path of [...Object.values(DELETED), ...renamed]) {
            const answer = await markResolved(repo, path, ROOTS);
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

    it('refuses to mark resolved a path that is not in conflict', async () => {
        write(repo, 'kept.txt', 'changed\n');
        const answer = await markResolved(repo, 'kept.txt', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('nothing to resolve');
        expect(status()).toEqual([' M kept.txt']);
    });
});

describe('stashes', () => {
    it('stashes the tracked changes, every change, or what is staged, each with its message', async () => {
        write(repo, 'kept.txt', 'changed\n');
        write(repo, 'loose.txt', 'new\n');
        expect((await stash(repo, 'tracked', 'just tracked', ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['?? loose.txt']);
        expect(git(repo, 'stash', 'list')).toContain('just tracked');

        expect((await stash(repo, 'untracked', '', ROOTS)).ok).toBe(true);
        expect(status()).toEqual([]);

        write(repo, 'kept.txt', 'staged\n');
        git(repo, 'add', 'kept.txt');
        write(repo, 'other.txt', 'loose\n');
        expect((await stash(repo, 'staged', 'only staged', ROOTS)).ok).toBe(true);
        expect(status()).toEqual(['?? other.txt']);
        expect(git(repo, 'stash', 'list').split('\n')[0]).toContain('only staged');
    });

    it('says a git older than 2.35 cannot stash only what is staged', async () => {
        // A git of its own on the path, which answers --staged as git 2.34 does and hands every
        // other command to the real git.
        const bin = join(dir, 'old-git');
        mkdirSync(bin);
        const real = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
        const shim = join(bin, 'git');
        writeFileSync(
            shim,
            [
                '#!/bin/sh',
                'for arg in "$@"; do',
                '  if [ "$arg" = "--staged" ]; then',
                '    echo "error: unknown option \\`staged\'" >&2',
                '    exit 129',
                '  fi',
                'done',
                `exec '${real}' "$@"`,
                ''
            ].join('\n')
        );
        chmodSync(shim, 0o755);
        write(repo, 'kept.txt', 'staged\n');
        git(repo, 'add', 'kept.txt');
        const path = process.env.PATH;
        process.env.PATH = `${bin}:${path ?? ''}`;
        try {
            const answer = await stash(repo, 'staged', '', ROOTS);
            expect(answer.ok).toBe(false);
            expect(answer.error).toContain('older than 2.35');
        } finally {
            process.env.PATH = path;
        }
        expect(git(repo, 'stash', 'list')).toBe('');
    });

    it('refuses a stash of nothing, and a mode or a name it does not know', async () => {
        const empty = await stash(repo, 'tracked', '', ROOTS);
        expect(empty.ok).toBe(false);
        expect(empty.error).toContain('nothing here');
        write(repo, 'kept.txt', 'changed\n');
        const unknown = await stash(repo, 'everything' as 'tracked', '', ROOTS);
        expect(unknown.ok).toBe(false);
        expect(unknown.error).toContain('not a way to stash');
        for (const ref of ['HEAD', 'stash@{x}', '--all', 'stash@{0}; rm']) {
            const answer = await stashAct(repo, 'pop', ref, ROOTS);
            expect(answer.ok).toBe(false);
            expect(answer.error).toContain('not a stash');
        }
    });

    it('applies, pops and drops a stash by its name', async () => {
        write(repo, 'kept.txt', 'first\n');
        await stash(repo, 'tracked', 'one', ROOTS);
        write(repo, 'kept.txt', 'second\n');
        await stash(repo, 'tracked', 'two', ROOTS);

        expect((await stashAct(repo, 'apply', 'stash@{1}', ROOTS)).ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('first\n');
        expect(git(repo, 'stash', 'list').split('\n').filter(Boolean).length).toBe(2);
        git(repo, 'checkout', '--', 'kept.txt');

        expect((await stashAct(repo, 'pop', 'stash@{0}', ROOTS)).ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe('second\n');
        expect(git(repo, 'stash', 'list')).not.toContain('two');

        expect((await stashAct(repo, 'drop', 'stash@{0}', ROOTS)).ok).toBe(true);
        expect(git(repo, 'stash', 'list')).toBe('');
    });

    it('leaves the conflicts of a pop in the index and keeps the stash', async () => {
        write(repo, 'kept.txt', 'stashed\n');
        await stash(repo, 'tracked', 'kept', ROOTS);
        write(repo, 'kept.txt', 'committed\n');
        git(repo, 'commit', '-qam', 'Moved on');
        const answer = await stashAct(repo, 'pop', 'stash@{0}', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('Merge Changes');
        expect(status()).toEqual(['UU kept.txt']);
        expect(git(repo, 'stash', 'list')).toContain('kept');
    });
});

describe('tags', () => {
    it('makes a plain tag and an annotated one at HEAD, and deletes one', async () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        expect((await createTag(repo, 'v1', '', ROOTS)).ok).toBe(true);
        expect((await createTag(repo, 'v2', 'The second\n\nWith a body', ROOTS)).ok).toBe(true);
        expect(git(repo, 'rev-parse', 'v1^{commit}').trim()).toBe(head);
        expect(git(repo, 'cat-file', '-t', 'v2').trim()).toBe('tag');
        expect(git(repo, 'tag', '-l', '--format=%(contents:subject)', 'v2').trim()).toBe(
            'The second'
        );
        expect((await deleteTag(repo, 'v1', ROOTS)).ok).toBe(true);
        expect(git(repo, 'tag', '-l')).not.toContain('v1');
    });

    it('refuses a name git would not take for a tag', async () => {
        for (const name of ['', '-d', 'two words', 'a..b', 'end.']) {
            const answer = await createTag(repo, name, '', ROOTS);
            expect(answer.ok, name).toBe(false);
        }
        expect(git(repo, 'tag', '-l')).toBe('');
    });

    it('pushes every tag to the remote', async () => {
        await createTag(repo, 'shipped', 'Shipped', ROOTS);
        expect((await pushTags(repo, ROOTS)).ok).toBe(true);
        expect(git(remote, 'tag', '-l')).toContain('shipped');
    });
});

describe('through the endpoint, with the real operations', () => {
    const TOKEN = 'a-token-for-this-file-only';
    const HOST = '127.0.0.1:8791';

    /** POST one action as the page does, answered by git-routes.ts's own operations. */
    async function post(body: Record<string, unknown>): Promise<{ status: number; body: unknown }> {
        const response = await handleGit(
            pageRequest(`http://${HOST}/api/git`, TOKEN, { root: repo, ...body }),
            TOKEN,
            { engine: engineDir(), rootsFor: () => ROOTS }
        );
        return { status: response.status, body: await response.json() };
    }

    it('routes each action to its own operation with its own fields', async () => {
        write(repo, 'kept.txt', 'one\nTWO\nthree\nfour\nfive\nsix\nseven\neight\n');
        expect((await post({ action: 'stagePatch', patch: diffOf(repo) })).status).toBe(200);
        expect(status()).toEqual(['M  kept.txt']);
        const staged = git(repo, 'diff', '--cached', '--', 'kept.txt');
        expect((await post({ action: 'unstagePatch', patch: staged })).status).toBe(200);
        expect(status()).toEqual([' M kept.txt']);
        expect((await post({ action: 'stageAll', group: 'changed' })).status).toBe(200);
        expect((await post({ action: 'unstageAll' })).status).toBe(200);
        expect(status()).toEqual([' M kept.txt']);

        expect((await post({ action: 'stash', mode: 'tracked', message: 'aside' })).status).toBe(
            200
        );
        expect(git(repo, 'stash', 'list')).toContain('aside');
        expect((await post({ action: 'stashApply', ref: 'stash@{0}' })).status).toBe(200);
        expect(status()).toEqual([' M kept.txt']);
        expect((await post({ action: 'discardAll', confirm: true })).status).toBe(200);
        expect((await post({ action: 'stashPop', ref: 'stash@{0}' })).status).toBe(200);
        expect(git(repo, 'stash', 'list')).toBe('');
        expect(
            (await post({ action: 'revertPatch', patch: diffOf(repo), confirm: true })).status
        ).toBe(200);
        expect(status()).toEqual([]);

        expect((await post({ action: 'createTag', name: 'v9', message: 'Nine' })).status).toBe(200);
        expect((await post({ action: 'pushTags', confirm: true })).status).toBe(200);
        expect(git(remote, 'tag', '-l')).toContain('v9');
        expect((await post({ action: 'deleteTag', name: 'v9', confirm: true })).status).toBe(200);
        expect(git(repo, 'tag', '-l')).toBe('');

        write(repo, 'kept.txt', 'amended\n');
        git(repo, 'commit', '-qam', 'Local');
        write(repo, 'kept.txt', 'amended again\n');
        git(repo, 'add', 'kept.txt');
        expect(
            (await post({ action: 'commit', message: '', amend: true, confirm: true })).status
        ).toBe(200);
        expect(git(repo, 'log', '-1', '--format=%s').trim()).toBe('Local');
        expect((await post({ action: 'sync', confirm: true })).status).toBe(200);
        expect(git(remote, 'log', '-1', '--format=%s', 'main').trim()).toBe('Local');
        expect((await post({ action: 'fetch' })).status).toBe(200);
        expect((await post({ action: 'pull', confirm: true })).status).toBe(200);
        git(repo, 'switch', '-qc', 'fresh');
        expect((await post({ action: 'publish', remote: 'origin', confirm: true })).status).toBe(
            200
        );
        expect(git(remote, 'branch', '--list', 'fresh')).toContain('fresh');
    });

    it('routes the conflict actions: resolve, abort and continue', async () => {
        git(repo, 'switch', '-qc', 'side');
        write(repo, 'kept.txt', 'side\n');
        git(repo, 'commit', '-qam', 'Side');
        git(repo, 'switch', '-q', 'main');
        write(repo, 'kept.txt', 'main\n');
        git(repo, 'commit', '-qam', 'Main');
        expect(tryGit(repo, 'merge', 'side')).toBe(false);
        expect((await post({ action: 'abortMerge', confirm: true })).status).toBe(200);
        expect(status()).toEqual([]);
        expect(tryGit(repo, 'rebase', 'side')).toBe(false);
        const answer = await post({ action: 'resolve', path: 'kept.txt', content: 'both\n' });
        expect(answer.status).toBe(200);
        expect((await post({ action: 'continueRebase', confirm: true })).status).toBe(200);
        expect(read(repo, 'kept.txt')).toBe('both\n');
    });

    it('routes the deletion actions: take the deletion, and mark resolved', async () => {
        deletionConflicts(repo, git, 'main');
        const taken = await post({ action: 'acceptDeletion', path: DELETED.ours, confirm: true });
        expect(taken.status).toBe(200);
        expect(existsSync(join(repo, DELETED.ours))).toBe(false);
        const marked = await post({ action: 'markResolved', path: DELETED.theirs });
        expect(marked.status).toBe(200);
        expect(git(repo, 'ls-files', '-u', '--', DELETED.ours, DELETED.theirs).trim()).toBe('');
        expect(read(repo, DELETED.theirs)).toBe('changed by this side\n');
    });
});

describe('the gate over what these writes ran', () => {
    it('ran nothing but the writing half of git, in the temporary tree, never forced', async () => {
        // A sync of a commit of its own runs here, so the case has a push to judge when it runs
        // alone as well as after the rest of the file.
        write(repo, 'mine.txt', 'y\n');
        git(repo, 'add', '.');
        git(repo, 'commit', '-qm', 'Mine');
        expect((await sync(repo, ROOTS)).ok).toBe(true);
        expect(ran.length).toBeGreaterThan(0);
        for (const args of ran) {
            expect(args[0]).toBe('-C');
            expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            expect(args).not.toContain('--force');
            expect(ALLOWED, args.join(' ')).toContain(args[2]);
        }
    });
});
