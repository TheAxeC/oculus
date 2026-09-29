// The git reads beside the changes (src/lib/server/core/git.ts): the tags, the stashes, the
// remotes and a merge or a rebase in progress on the `git` channel, and the reads on demand behind
// GET /api/git, a page of the graph, a commit's files and diff, a stash's diff, the blame, the
// gutter marks and the three versions of a conflicted path.
//
// Every repository is built inside a temporary directory and thrown away, through the git watcher's
// own helpers, which confine every git command to that directory and pass the author on the command
// line, so this machine's git config is neither read nor written. The gates over what the module
// runs are tests/server/core/git.test.ts's, whose last cases run each of these reads once.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect } from 'vitest';
import {
    GRAPH_PAGE,
    blameOf,
    commitDiff,
    commitFiles,
    graphPage,
    lineMarks,
    mergeSides,
    pathInside,
    stashDiff,
    statusFor,
    type Read
} from '../../../src/lib/server/core/git.ts';
import type { GitState } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { DELETED, deletionConflicts } from '../git/deletions.ts';
import { gitText as git, put, repositoryIn, tryGit } from '../root/watch/repos.ts';

let dir = '';
let repo = '';

/** Write one file of the repository. */
function write(name: string, body: string): void {
    put(repo, name, body);
}

function state(root: string = repo): GitState {
    return statusFor([root])[root];
}

beforeEach(() => {
    dir = scratchDir('oculus-git-reads-');
    repo = repositoryIn(dir, 'repo');
    // The one commit holds three lines, so a case can change the middle one.
    write('kept.txt', 'one\ntwo\nthree\n');
    git(repo, 'commit', '--amend', '-qam', 'first');
});

/** The value of a read that must have answered. */
function value<T>(read: Read<T>): T {
    if (!read.ok) throw new Error(read.error);
    return read.value;
}

/** Two branches that change the same line of kept.txt, merged so the merge stops on it. */
function conflict(): void {
    git(repo, 'switch', '-c', 'other');
    write('kept.txt', 'one\nTWO FROM OTHER\nthree\n');
    git(repo, 'commit', '-am', 'other side');
    git(repo, 'switch', 'work');
    write('kept.txt', 'one\nTWO FROM WORK\nthree\n');
    git(repo, 'commit', '-am', 'work side');
    expect(tryGit(repo, 'merge', 'other')).not.toBe(0);
}

describe('the state beside the changes', () => {
    it('lists each tag with the commit it points at, and whether it is annotated', () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        git(repo, 'tag', 'light');
        git(repo, 'tag', '-a', 'heavy', '-m', 'A release');
        const tags = Object.fromEntries(state().tags.map((tag) => [tag.name, tag]));
        expect(tags.light).toEqual({ name: 'light', commit: head, annotated: false, subject: '' });
        expect(tags.heavy).toEqual({
            name: 'heavy',
            commit: head,
            annotated: true,
            subject: 'A release'
        });
    });

    it('lists each stash newest first by the name git gives it', () => {
        write('kept.txt', 'one\nstashed\nthree\n');
        git(repo, 'stash', 'push', '--message=first stash');
        write('kept.txt', 'one\nstashed again\nthree\n');
        git(repo, 'stash', 'push', '--message=second stash');
        const stashes = state().stashes;
        expect(stashes.map((one) => one.ref)).toEqual(['stash@{0}', 'stash@{1}']);
        expect(stashes[0].message).toContain('second stash');
        expect(stashes[1].message).toContain('first stash');
        expect(value(stashDiff(repo, 'stash@{1}'))).toContain('+stashed');
    });

    it('names the remotes of the repository', () => {
        git(repo, 'remote', 'add', 'origin', join(dir, 'nowhere.git'));
        expect(state().remotes).toEqual(['origin']);
    });

    it('puts an unmerged path in its own list with its pair, and says a merge is in progress', () => {
        conflict();
        const held = state();
        expect(held.conflicted).toEqual([{ path: 'kept.txt', status: 'UU', added: 0, deleted: 0 }]);
        expect(held.staged).toEqual([]);
        expect(held.unstaged).toEqual([]);
        expect(held.sequence).toBe('merging');
        expect(held.mergeMessage).toContain("Merge branch 'other'");
        expect(held.mergeMessage).not.toContain('#');
    });

    it('says a rebase that stopped is in progress', () => {
        git(repo, 'switch', '-c', 'other');
        write('kept.txt', 'one\nTWO FROM OTHER\nthree\n');
        git(repo, 'commit', '-am', 'other side');
        git(repo, 'switch', 'work');
        write('kept.txt', 'one\nTWO FROM WORK\nthree\n');
        git(repo, 'commit', '-am', 'work side');
        expect(tryGit(repo, 'rebase', 'other')).not.toBe(0);
        const held = state();
        expect(held.sequence).toBe('rebasing');
        expect(held.conflicted.map((one) => one.path)).toEqual(['kept.txt']);
    });

    it('says nothing is in progress in a quiet repository', () => {
        expect(state().sequence).toBe('');
        expect(state().conflicted).toEqual([]);
    });
});

describe('the reads on demand', () => {
    it('reads a page of the graph with each commit, its parents, its names and the head', () => {
        git(repo, 'tag', 'first-tag');
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        git(repo, 'commit', '-am', 'second', '-m', 'A body line.\n\nAnd a second paragraph.');
        const page = value(graphPage(repo, 0));
        expect(page.more).toBe(false);
        expect(page.commits.map((one) => one.subject)).toEqual(['second', 'first']);
        const [top, bottom] = page.commits;
        expect(top.parents).toEqual([bottom.hash]);
        expect(bottom.parents).toEqual([]);
        expect(top.head).toBe(true);
        expect(top.refs).toEqual(['work']);
        expect(bottom.tags).toEqual(['first-tag']);
        expect(bottom.head).toBe(false);
        expect(top.author).toBe('Oculus Test');
        // The whole message rides with the commit, several lines of it, for Copy Message.
        expect(top.message).toBe('second\n\nA body line.\n\nAnd a second paragraph.');
        expect(bottom.message).toBe('first');
        expect(page.incoming).toEqual([]);
        expect(page.outgoing).toEqual([]);
    });

    it('reads the graph a page at a time, saying where more follow', () => {
        // The page and one more empty commit, made in one fast-import run, not a process each.
        const branch = git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim();
        const from = git(repo, 'rev-parse', 'HEAD').trim();
        const stream = Array.from({ length: GRAPH_PAGE + 1 }, (_, at) => {
            const message = `empty ${at}`;
            return [
                `commit refs/heads/${branch}`,
                `committer Oculus Test <nobody@example.invalid> ${1_700_000_000 + at} +0000`,
                `data ${message.length}`,
                message,
                ...(at === 0 ? [`from ${from}`] : []),
                ''
            ].join('\n');
        }).join('');
        const made = spawnSync('git', ['-C', repo, 'fast-import', '--quiet'], { input: stream });
        expect(made.status).toBe(0);
        const first = value(graphPage(repo, 0));
        expect(first.commits.length).toBe(GRAPH_PAGE);
        expect(first.more).toBe(true);
        const second = value(graphPage(repo, GRAPH_PAGE));
        expect(second.commits.map((one) => one.subject)).toEqual(['empty 0', 'first']);
        expect(second.more).toBe(false);
    });

    it('reads what the upstream holds that HEAD does not, and the other way round', () => {
        const origin = join(dir, 'origin');
        const done = spawnSync('git', ['clone', '--quiet', repo, origin], { encoding: 'utf8' });
        expect(done.status).toBe(0);
        const clone = join(dir, 'clone');
        expect(spawnSync('git', ['clone', '--quiet', origin, clone]).status).toBe(0);
        writeFileSync(join(origin, 'theirs.txt'), 'x\n');
        git(origin, 'add', '.');
        git(origin, 'commit', '-m', 'from upstream');
        git(clone, 'fetch', '--quiet');
        writeFileSync(join(clone, 'mine.txt'), 'y\n');
        git(clone, 'add', '.');
        git(clone, 'commit', '-m', 'from here');
        const page = value(graphPage(clone, 0));
        expect(page.incoming.map((one) => one.subject)).toEqual(['from upstream']);
        expect(page.outgoing.map((one) => one.subject)).toEqual(['from here']);
    });

    it("reads one commit's files and its diff of one of them", () => {
        write('added.txt', 'new\n');
        write('kept.txt', 'one\n2\nthree\n');
        git(repo, 'add', '.');
        git(repo, 'commit', '-m', 'both');
        const hash = git(repo, 'rev-parse', 'HEAD').trim();
        expect(value(commitFiles(repo, hash))).toEqual([
            { status: 'A', path: 'added.txt', from: '' },
            { status: 'M', path: 'kept.txt', from: '' }
        ]);
        const text = value(commitDiff(repo, hash, 'kept.txt'));
        expect(text).toContain('-two');
        expect(text).toContain('+2');
        // Every unchanged line comes with the diff, so the pane can open a folded run.
        expect(text).toContain(' one');
        expect(text).toContain(' three');
    });

    it('refuses a commit that is not a hash and a path outside the repository', () => {
        expect(commitFiles(repo, 'HEAD~1').ok).toBe(false);
        expect(commitFiles(repo, '--all').ok).toBe(false);
        expect(commitDiff(repo, 'abcdef1', '../elsewhere').ok).toBe(false);
        expect(blameOf(repo, '/etc/hosts').ok).toBe(false);
        expect(blameOf(repo, '-x').ok).toBe(false);
        expect(lineMarks(repo, '../x').ok).toBe(false);
        expect(mergeSides(repo, '../x').ok).toBe(false);
        expect(stashDiff(repo, 'HEAD').ok).toBe(false);
        // The rule itself, which the reads above meet before git would refuse the path on its own.
        expect(pathInside(repo, '../x')).toBe(false);
        expect(pathInside(repo, 'sub/../../x')).toBe(false);
        expect(pathInside(repo, 'sub/../kept.txt')).toBe(true);
    });

    it('blames each line on its commit, and a line no commit holds on nobody yet', () => {
        write('kept.txt', 'one\nchanged here\nthree\n');
        const lines = value(blameOf(repo, 'kept.txt'));
        expect(lines.map((one) => one.line)).toEqual([1, 2, 3]);
        expect(lines[0].uncommitted).toBe(false);
        expect(lines[0].author).toBe('Oculus Test');
        expect(lines[0].subject).toBe('first');
        expect(lines[0].short).toBe(lines[0].hash.slice(0, 7));
        expect(lines[1].uncommitted).toBe(true);
    });

    it('marks the lines the worktree added, changed and took out against the index', () => {
        write('kept.txt', 'one\ntwo\nthree\nfour\nfive\nsix\nseven\n');
        git(repo, 'commit', '-am', 'seven');
        write('kept.txt', 'zero\none\nTWO\nthree\nfour\nsix\nseven\n');
        expect(value(lineMarks(repo, 'kept.txt'))).toEqual([
            { kind: 'added', line: 1, count: 1 },
            { kind: 'modified', line: 3, count: 1 },
            { kind: 'deleted', line: 6, count: 0 }
        ]);
        // What is staged is the side the marks are drawn against.
        git(repo, 'add', 'kept.txt');
        expect(value(lineMarks(repo, 'kept.txt'))).toEqual([]);
    });

    it('reads the base, ours and theirs of a conflicted path', () => {
        conflict();
        const sides = value(mergeSides(repo, 'kept.txt'));
        expect(sides.base).toBe('one\ntwo\nthree\n');
        expect(sides.ours).toBe('one\nTWO FROM WORK\nthree\n');
        expect(sides.theirs).toBe('one\nTWO FROM OTHER\nthree\n');
        expect(sides.deleted).toBe('');
    });

    it('says which side deleted a path in conflict: both, ours or theirs', () => {
        deletionConflicts(repo, git, 'work');
        const both = value(mergeSides(repo, DELETED.both));
        expect(both.deleted).toBe('both');
        const ours = value(mergeSides(repo, DELETED.ours));
        expect(ours.deleted).toBe('ours');
        expect(ours.ours).toBe('');
        expect(ours.theirs).toBe('changed by the other side\n');
        const theirs = value(mergeSides(repo, DELETED.theirs));
        expect(theirs.deleted).toBe('theirs');
        expect(theirs.ours).toBe('changed by this side\n');
        expect(theirs.theirs).toBe('');
    });

    it('reads no deletion on a path one side added, which has no base (git AU and UA)', () => {
        deletionConflicts(repo, git, 'work');
        const here = value(mergeSides(repo, 'renamed-here.txt'));
        expect(here.deleted).toBe('');
        expect(here.base).toBe('');
        expect(here.ours).toBe('the same lines on both sides\nof the rename\n');
        expect(here.theirs).toBe('');
        const there = value(mergeSides(repo, 'renamed-there.txt'));
        expect(there.deleted).toBe('');
        expect(there.ours).toBe('');
        expect(there.theirs).toBe('the same lines on both sides\nof the rename\n');
    });

    it('refuses the sides of a path in no conflict', () => {
        const read = mergeSides(repo, 'kept.txt');
        expect(read.ok).toBe(false);
        expect(read.ok ? '' : read.error).toContain('not in conflict');
    });
});
