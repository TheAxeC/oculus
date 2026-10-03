// The git reads beside the changes (src/lib/server/core/git/): the tags, the stashes, the
// remotes and a merge or a rebase in progress on the `git` channel, and the reads on demand behind
// GET /api/git, a page of the graph, a commit's files and diff, a stash's diff, the blame, the
// gutter marks and the three versions of a conflicted path; and the diff answer those reads give
// the diff pane through the endpoint, both versions of each file with git's head lines for it.
//
// Every repository is built inside a temporary directory and thrown away, through the git watcher's
// own helpers, which confine every git command to that directory and pass the author on the command
// line, so this machine's git config is neither read nor written. The gates over what the module
// runs are tests/server/core/git/git.test.ts's, whose last cases run each of these reads once.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
    stashDiff
} from '../../../../src/lib/server/core/git/reads.ts';
import { pathInside, type Read } from '../../../../src/lib/server/core/git/run.ts';
import { statusFor } from '../../../../src/lib/server/core/git/state.ts';
import { handleGitGet } from '../../../../src/lib/server/git/git-reads.ts';
import type { DiffSides, GitState } from '../../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { DELETED, deletionConflicts } from '../../git/deletions.ts';
import { gitText as git, put, repositoryIn, tryGit } from '../../root/watch/repos.ts';

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
        expect(value(stashDiff(repo, 'stash@{1}'))[0].modified).toBe('one\nstashed\nthree\n');
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
        // Both versions come whole, so the pane's diff editor draws every unchanged line.
        const [file] = value(commitDiff(repo, hash, 'kept.txt'));
        expect(file.original).toBe('one\ntwo\nthree\n');
        expect(file.modified).toBe('one\n2\nthree\n');
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

/** What GET /api/git answered: its status and its body. */
type Answer = {
    status: number;
    body: {
        ok?: boolean;
        files?: DiffSides[];
        attributes?: unknown;
        conflicted?: boolean;
        error?: string;
    };
};

/** One GET of the endpoint over the real reads, with the roots it may name. */
async function ask(query: string, roots: string[] = [repo]): Promise<Answer> {
    const response = await handleGitGet(new Request(`http://localhost/api/git?${query}`), {
        rootsFor: () => roots
    });
    return { status: response.status, body: (await response.json()) as Answer['body'] };
}

/** The files a diff read answered, which must have answered. */
async function filesOf(query: string, roots: string[] = [repo]): Promise<DiffSides[]> {
    const answer = await ask(query, roots);
    expect(answer.status, JSON.stringify(answer.body)).toBe(200);
    expect(Array.isArray(answer.body.files), JSON.stringify(answer.body)).toBe(true);
    return answer.body.files ?? [];
}

/** A file's own diff read, staged or as the worktree has it. */
function fileQuery(path: string, staged = false): string {
    return `diff=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&staged=${staged ? 1 : 0}`;
}

/** One commit's diff of one path. */
function commitQuery(hash: string, path: string): string {
    return `commit=${hash}&root=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
}

/** A stash's diff. */
function stashQuery(ref: string): string {
    return `stash=${encodeURIComponent(ref)}&root=${encodeURIComponent(repo)}`;
}

/** What a file of the repository's worktree holds. */
function onDisk(name: string): string {
    return readFileSync(join(repo, name), 'utf8');
}

describe('the diff answer: both versions of each file', () => {
    it("answers a file's changes as the index's text against the worktree's", async () => {
        const lines = Array.from({ length: 12 }, (_, at) => `line ${at + 1}\n`).join('');
        write('a.txt', lines);
        git(repo, 'add', 'a.txt');
        git(repo, 'commit', '-m', 'twelve');
        write('a.txt', lines.replace('line 10\n', 'line ten\n'));
        const [file, ...rest] = await filesOf(fileQuery('a.txt'));
        expect(rest).toEqual([]);
        expect(file.oldPath).toBe('a.txt');
        expect(file.newPath).toBe('a.txt');
        expect(file.head[0]).toBe('diff --git a/a.txt b/a.txt');
        expect(file.head.at(-1)).toBe('+++ b/a.txt');
        expect(file.binary).toBe(false);
        expect(file.original).toBe(git(repo, 'show', ':a.txt'));
        expect(file.modified).toBe(onDisk('a.txt'));
    });

    it('answers a staged new file from nothing, and a staged deletion to nothing', async () => {
        write('n.txt', 'new\n');
        git(repo, 'add', 'n.txt');
        const [created] = await filesOf(fileQuery('n.txt', true));
        expect(created.original).toBe('');
        expect(created.modified).toBe('new\n');
        expect(created.head).toContain('new file mode 100644');
        git(repo, 'rm', '-q', 'kept.txt');
        const [deleted] = await filesOf(fileQuery('kept.txt', true));
        expect(deleted.original).toBe('one\ntwo\nthree\n');
        expect(deleted.modified).toBe('');
    });

    it("answers a root commit's file from nothing, and a renamed file from its old path", async () => {
        const first = git(repo, 'rev-parse', 'HEAD').trim();
        const [root] = await filesOf(commitQuery(first, 'kept.txt'));
        expect(root.original).toBe('');
        expect(root.modified).toBe('one\ntwo\nthree\n');
        const body = 'alpha\nbeta\ngamma\ndelta\nepsilon\nzeta\n';
        write('x.txt', body);
        git(repo, 'add', 'x.txt');
        git(repo, 'commit', '-m', 'x');
        git(repo, 'mv', 'x.txt', 'y.txt');
        write('y.txt', body.replace('gamma', 'GAMMA'));
        git(repo, 'commit', '-am', 'x to y');
        const hash = git(repo, 'rev-parse', 'HEAD').trim();
        const [renamed] = await filesOf(commitQuery(hash, 'y.txt'));
        expect(renamed.oldPath).toBe('x.txt');
        expect(renamed.newPath).toBe('y.txt');
        expect(renamed.original).toBe(body);
        expect(renamed.modified).toBe(body.replace('gamma', 'GAMMA'));
        expect(renamed.head).toContain('rename from x.txt');
        expect(renamed.head).toContain('rename to y.txt');
    });

    it('answers a rename with no change of content as two equal texts', async () => {
        git(repo, 'mv', 'kept.txt', 'moved.txt');
        git(repo, 'commit', '-m', 'moved');
        const hash = git(repo, 'rev-parse', 'HEAD').trim();
        const [moved] = await filesOf(commitQuery(hash, 'moved.txt'));
        expect(moved.oldPath).toBe('kept.txt');
        expect(moved.original).toBe('one\ntwo\nthree\n');
        expect(moved.modified).toBe('one\ntwo\nthree\n');
        expect(moved.head).toContain('rename from kept.txt');
        expect(moved.head).toContain('rename to moved.txt');
    });

    it('answers every file of a stash in git order, an untracked one from nothing', async () => {
        write('b.txt', 'bee\n');
        git(repo, 'add', 'b.txt');
        git(repo, 'commit', '-m', 'bee');
        write('b.txt', 'BEE\n');
        write('kept.txt', 'one\nTWO\nthree\n');
        write('loose.txt', 'loose\n');
        git(repo, 'stash', 'push', '--include-untracked');
        const files = await filesOf(stashQuery('stash@{0}'));
        expect(files.map((one) => one.newPath)).toEqual(['b.txt', 'kept.txt', 'loose.txt']);
        expect(files[0]).toMatchObject({ original: 'bee\n', modified: 'BEE\n' });
        expect(files[1]).toMatchObject({
            original: 'one\ntwo\nthree\n',
            modified: 'one\nTWO\nthree\n'
        });
        expect(files[2]).toMatchObject({ original: '', modified: 'loose\n' });
    });

    it("answers every file of a worktree from the merge base to the worktree's HEAD", async () => {
        const path = join(repo, '.agents', 'worktrees', 'wt');
        git(repo, 'worktree', 'add', '-q', '-b', 'wt', path);
        put(path, 'kept.txt', 'one\ntwo\nthree in the worktree\n');
        put(path, 'w.txt', 'made there\n');
        git(path, 'add', '.');
        git(path, 'commit', '-m', 'worktree work');
        // The branch moves on after the worktree left it: the base is where they parted.
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        git(repo, 'commit', '-am', 'branch work');
        const query = `worktree=${encodeURIComponent(path)}&root=${encodeURIComponent(repo)}`;
        const files = await filesOf(query);
        expect(files.map((one) => one.newPath)).toEqual(['kept.txt', 'w.txt']);
        expect(files[0]).toMatchObject({
            original: 'one\ntwo\nthree\n',
            modified: 'one\ntwo\nthree in the worktree\n'
        });
        expect(files[1]).toMatchObject({ original: '', modified: 'made there\n' });
    });

    it("answers a binary file as git's call, both texts empty", async () => {
        writeFileSync(join(repo, 'p.bin'), Buffer.from([0, 1, 2, 3]));
        git(repo, 'add', 'p.bin');
        git(repo, 'commit', '-m', 'binary');
        writeFileSync(join(repo, 'p.bin'), Buffer.from([0, 1, 2, 4]));
        const [file] = await filesOf(fileQuery('p.bin'));
        expect(file.binary).toBe(true);
        expect(file.original).toBe('');
        expect(file.modified).toBe('');
        expect(file.head.some((line) => line.startsWith('Binary files'))).toBe(true);
    });

    it('refuses what it refused before: a root, a path, a commit and a stash it may not read', async () => {
        const root = await ask('diff=/somewhere/else&path=a.txt&staged=0');
        expect(root.status).toBe(400);
        expect(root.body.error).toBe('that directory is not a workspace oculus knows');
        const outside = await ask(fileQuery('../x'));
        expect(outside.body.error).toBe('the path ../x is not inside the workspace');
        const commit = await ask(commitQuery('HEAD~1', 'kept.txt'));
        expect(commit.body.error).toBe('that is not a commit');
        const stash = await ask(stashQuery('HEAD'));
        expect(stash.body.error).toBe('that is not a stash');
    });

    it('answers a last line with no newline as git stores it', async () => {
        write('kept.txt', 'one\ntwo\nthree');
        const [file] = await filesOf(fileQuery('kept.txt'));
        expect(file.original).toBe('one\ntwo\nthree\n');
        expect(file.modified).toBe('one\ntwo\nthree');
    });

    it('answers a deletion in the worktree to nothing, and a new empty file as two empty texts', async () => {
        rmSync(join(repo, 'kept.txt'));
        const [deleted] = await filesOf(fileQuery('kept.txt'));
        expect(deleted.modified).toBe('');
        expect(deleted.original).toBe('one\ntwo\nthree\n');
        expect(deleted.head).toContain('deleted file mode 100644');
        write('empty.txt', '');
        git(repo, 'add', 'empty.txt');
        const [empty] = await filesOf(fileQuery('empty.txt', true));
        expect(empty.original).toBe('');
        expect(empty.modified).toBe('');
        expect(empty.head).toContain('new file mode 100644');
    });

    it("answers a path in conflict as Current's version against the worktree", async () => {
        conflict();
        const [file, ...rest] = await filesOf(fileQuery('kept.txt'));
        expect(rest).toEqual([]);
        expect(file.original).toBe('one\nTWO FROM WORK\nthree\n');
        expect(file.modified).toBe(onDisk('kept.txt'));
        expect(file.modified).toContain('<<<<<<<');
    });

    it('answers no file for a path with no change', async () => {
        expect(await filesOf(fileQuery('kept.txt'))).toEqual([]);
        expect(await filesOf(fileQuery('kept.txt', true))).toEqual([]);
    });

    it("answers a symbolic link's target and a submodule's commit as git shows them", async () => {
        symlinkSync('kept.txt', join(repo, 'link'));
        git(repo, 'add', 'link');
        git(repo, 'commit', '-m', 'link');
        rmSync(join(repo, 'link'));
        symlinkSync('other.txt', join(repo, 'link'));
        const [link] = await filesOf(fileQuery('link'));
        expect(link.original).toBe('kept.txt');
        expect(link.modified).toBe('other.txt');

        const library = repositoryIn(dir, 'library');
        git(repo, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', library, 'sub');
        git(repo, 'commit', '-m', 'sub');
        const before = git(join(repo, 'sub'), 'rev-parse', 'HEAD').trim();
        put(join(repo, 'sub'), 'kept.txt', 'moved on\n');
        git(join(repo, 'sub'), 'commit', '-am', 'moved on');
        const after = git(join(repo, 'sub'), 'rev-parse', 'HEAD').trim();
        const [sub] = await filesOf(fileQuery('sub'));
        expect(sub.original).toBe(`Subproject commit ${before}\n`);
        expect(sub.modified).toBe(`Subproject commit ${after}\n`);
    });

    it('answers both versions of a file larger than a mebibyte whole', async () => {
        const large = 'x'.repeat(99) + '\n';
        write('kept.txt', large.repeat(20000));
        git(repo, 'commit', '-qam', 'large');
        write('kept.txt', large.repeat(20000) + 'end\n');
        const read = await ask(fileQuery('kept.txt'));
        expect(read.body.files?.[0]?.original).toBe(large.repeat(20000));
        git(repo, 'add', 'kept.txt');
        const staged = await ask(fileQuery('kept.txt', true));
        expect(staged.body.files?.[0]?.original).toBe(large.repeat(20000));
        expect(staged.body.files?.[0]?.modified).toBe(large.repeat(20000) + 'end\n');
    });

    it("answers what git's attributes say of a file's conversion beside its diff", async () => {
        write('kept.txt', 'one\nTWO\nthree\n');
        const plain = await ask(fileQuery('kept.txt'));
        expect(plain.body.attributes).toMatchObject({
            filter: 'unspecified',
            text: 'unspecified',
            eol: 'unspecified'
        });
        write('.gitattributes', '*.txt text eol=lf\n');
        const converted = await ask(fileQuery('kept.txt'));
        expect(converted.body.attributes).toMatchObject({
            filter: 'unspecified',
            text: 'set',
            eol: 'lf'
        });
        git(repo, 'config', 'core.autocrlf', 'input');
        expect((await ask(fileQuery('kept.txt'))).body.attributes).toMatchObject({
            autocrlf: 'input'
        });
        write('.gitattributes', '*.txt ident working-tree-encoding=ISO-8859-1\n');
        expect((await ask(fileQuery('kept.txt'))).body.attributes).toMatchObject({
            workingTreeEncoding: 'ISO-8859-1',
            ident: 'set'
        });
    });

    it("says whether the path of a file's own diff is in conflict", async () => {
        write('kept.txt', 'one\nTWO\nthree\n');
        expect((await ask(fileQuery('kept.txt'))).body.conflicted).toBe(false);
        git(repo, 'checkout', '--', 'kept.txt');
        conflict();
        const read = await ask(fileQuery('kept.txt'));
        expect(read.status).toBe(200);
        expect(read.body.conflicted).toBe(true);
    });

    it('answers whether both versions of a file are UTF-8, a Latin-1 side on either as not', async () => {
        const latin = (text: string): Buffer => Buffer.from(text, 'latin1');
        writeFileSync(join(repo, 'l.txt'), 'plain\n');
        git(repo, 'add', 'l.txt');
        git(repo, 'commit', '-qm', 'plain');
        writeFileSync(join(repo, 'l.txt'), latin('caf\u00e9\n'));
        expect((await filesOf(fileQuery('l.txt')))[0].encoded).toBe(false);
        git(repo, 'commit', '-qam', 'latin');
        writeFileSync(join(repo, 'l.txt'), 'caf\u00e9\n');
        expect((await filesOf(fileQuery('l.txt')))[0].encoded).toBe(false);
        git(repo, 'commit', '-qam', 'utf-8');
        writeFileSync(join(repo, 'l.txt'), 'caf\u00e9s\n');
        expect((await filesOf(fileQuery('l.txt')))[0].encoded).toBe(true);
    });

    it("reads a symlink's target as bytes, a Latin-1 target as not UTF-8", async () => {
        symlinkSync('old', join(repo, 's'));
        git(repo, 'add', 's');
        git(repo, 'commit', '-qm', 'link');
        rmSync(join(repo, 's'));
        symlinkSync(Buffer.from('caf\u00e9', 'latin1'), join(repo, 's'));
        expect((await filesOf(fileQuery('s')))[0].encoded).toBe(false);
    });
});
