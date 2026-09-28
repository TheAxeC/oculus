// Read-only git state for a workspace (src/lib/server/core/git.ts).
//
// Every repository here is built inside a temporary directory and thrown away, and every write
// asserts its path is inside that directory first. `user.email` and `user.name` are passed on the
// command line, so this machine's git config is neither read nor written, and no git command in
// this file ever names a path outside the temporary directory: the hub's own repository is never
// touched.
//
// Two gates sit at the end. The module's source names no writing subcommand, and the recorder in
// git.ts reports every argument vector the module ran over this whole file, which must use nothing
// but the allowed subcommands, with `branch`, `symbolic-ref` and `worktree` (each of which has
// writing forms) and `rev-parse` held to the exact vectors the module reads with.
//
// The recorder can also stand in for git on one vector, answering as a git that timed out or never
// started would, since neither can be made to happen on demand with a real repository, and it can
// run a case's own work between the module asking for a command and the command running, which is
// how a root that goes away while a read of it is on its way is made to happen on demand.

import {
    chmodSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    LOG_ENTRIES,
    MAX_ENTRIES,
    blameOf,
    commitDiff,
    commitFiles,
    empty,
    graphPage,
    ignoredIn,
    lineMarks,
    mergeSides,
    stashDiff,
    statusFor,
    trackedFiles
} from '../../../src/lib/server/core/git.ts';
import { REFS_FORMAT } from '../../../src/lib/server/core/git-parse.ts';
import {
    pickerRoots,
    shownRoot
} from '../../../src/lib/state/sources/repositories/repositories.ts';
import type { GitEntry, GitState } from '../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { gitText as git } from '../root/watch/repos.ts';

afterAll(sweepScratch);

const MODULE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../src/lib/server/core/git.ts'
);

/** Everything git.ts is allowed to run. The source scan below asserts it holds no other. */
const ALLOWED = [
    'blame',
    'check-ignore',
    'diff',
    'for-each-ref',
    'log',
    'ls-files',
    'remote',
    'rev-list',
    'rev-parse',
    'show',
    'status',
    'symbolic-ref',
    'worktree'
];

/**
 * Every call the module makes, by subcommand, one entry per call site: `rev-parse` is run twice,
 * once to tell a repository from a folder and once for the branch; `diff` twice, the channel's
 * line counts and the on-demand diffs; `log` four times, the channel's log, the stashes' reflog, a
 * page of the graph and the range either side of the upstream.
 */
const CALLS = [...ALLOWED, 'rev-parse', 'diff', 'log', 'log', 'log'].sort();

/**
 * The exact vectors seven subcommands may run as. `symbolic-ref HEAD <ref>` moves HEAD, `worktree
 * add` makes a checkout and `remote add` adds a remote, so each of those is held to its one reading
 * vector; `rev-parse` has no writing form and is held to the module's two reads so a third use is a
 * change this gate sees, `check-ignore` to the one form the file browser reads its ignored entries
 * by, `for-each-ref` to the one ref listing over the branches, the tags and the stash ref, and
 * `ls-files` to the one listing of the tracked paths the Status view's line counts read.
 */
const PINNED: Partial<Record<string, string[][]>> = {
    'check-ignore': [['check-ignore', '--stdin', '-z']],
    'for-each-ref': [['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']],
    'ls-files': [['ls-files', '-z']],
    remote: [['remote']],
    'rev-parse': [
        ['rev-parse', '--git-dir'],
        ['rev-parse', '--abbrev-ref', 'HEAD']
    ],
    'symbolic-ref': [['symbolic-ref', '--short', 'HEAD']],
    worktree: [['worktree', 'list', '--porcelain']]
};

/** The same vectors as the module's source writes them, one list literal per call. */
const PINNED_SOURCE = [
    "['check-ignore', '--stdin', '-z']",
    "['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']",
    "['ls-files', '-z']",
    "['remote']",
    "['rev-parse', '--git-dir']",
    "['rev-parse', '--abbrev-ref', 'HEAD']",
    "['symbolic-ref', '--short', 'HEAD']",
    "['worktree', 'list', '--porcelain']"
];

/** No writing subcommand may be named in the module at all, quoted as an argument would be. */
const FORBIDDEN = [
    'add',
    'am',
    'apply',
    'branch -',
    'checkout',
    'cherry-pick',
    'clean',
    'commit',
    'fetch',
    'gc',
    'merge',
    'mv',
    'prune',
    'pull',
    'push',
    'rebase',
    'reset',
    'restore',
    'revert',
    'rm',
    'stash',
    'switch',
    'tag'
];

/** Every argument vector the module ran, over the whole file. Asserted by the last gate. */
const ran = vi.hoisted(() => [] as string[][]);

/**
 * A vector the recorder answers for git instead of running it: the argument it matches on and the
 * error code a git that did not answer carries (`ETIMEDOUT` for a timeout, `ENOENT` for a git that
 * could not start). Null runs every command for real.
 */
const unanswered = vi.hoisted(() => ({ on: null as { arg: string; code: string } | null }));

/**
 * What runs between the module deciding to spawn a command and the command running, so a case can
 * make the tree change under a read that is already on its way. It fires once, on the first command
 * carrying the argument it names, and the command then runs for real against the changed tree.
 */
const between = vi.hoisted(() => ({ on: null as { arg: string; act: () => void } | null }));
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    // Only what a module under src/lib/server runs is recorded; a test's own setup command is not.
    const fromServer = (): boolean => (new Error().stack ?? '').includes('/src/lib/server/');
    return {
        ...actual,
        spawnSync: ((file: string, args: string[], options: unknown) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            const meanwhile = between.on;
            if (fromServer() && meanwhile !== null && args.includes(meanwhile.arg)) {
                between.on = null;
                meanwhile.act();
            }
            const held = unanswered.on;
            if (fromServer() && held !== null && args.includes(held.arg)) {
                // What node hands back for a child that timed out or never started: no status.
                const error = Object.assign(new Error(`spawnSync ${file} ${held.code}`), {
                    code: held.code
                });
                return {
                    pid: 0,
                    output: [],
                    stdout: '',
                    stderr: '',
                    status: null,
                    signal: null,
                    error
                };
            }
            return (actual.spawnSync as (...held: unknown[]) => unknown)(file, args, options);
        }) as typeof actual.spawnSync,
        execFile: ((file: string, args: string[], ...rest: unknown[]) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            return (actual.execFile as (...held: unknown[]) => unknown)(file, args, ...rest);
        }) as typeof actual.execFile
    };
});

let dir = '';
let repo = '';

function write(name: string, body: string): string {
    const full = join(repo, name);
    expect(resolve(full).startsWith(resolve(repo) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
}

function state(root: string = repo): GitState {
    return statusFor([root])[root];
}

function paths(entries: GitEntry[]): string[] {
    return entries.map((entry) => entry.path);
}

function byPath(entries: GitEntry[]): Record<string, GitEntry> {
    return Object.fromEntries(entries.map((entry) => [entry.path, entry]));
}

beforeEach(() => {
    dir = scratchDir('oculus-git-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    repo = join(dir, 'repo');
    mkdirSync(repo);
    git(repo, 'init', '--initial-branch=work');
    write('kept.txt', 'one\ntwo\nthree\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-m', 'first');
});

describe('the shape', () => {
    it('reports the branch of a clean repository and nothing else', () => {
        const found = state();
        expect(found.branch).toBe('work');
        expect(found.detached).toBe(false);
        expect([found.ahead, found.behind]).toEqual([0, 0]);
        expect([found.staged, found.unstaged, found.untracked]).toEqual([[], [], []]);
        expect(found.repository).toBe(true);
        expect(found.error).toBe(null);
    });

    it('puts staged, changed and untracked paths in their own lists', () => {
        write('staged.txt', 'new\n');
        git(repo, 'add', 'staged.txt');
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        write('loose.txt', 'nothing tracks me\n');
        const found = state();
        expect(paths(found.staged)).toEqual(['staged.txt']);
        expect(found.staged[0].status).toBe('A');
        expect(paths(found.unstaged)).toEqual(['kept.txt']);
        expect(found.unstaged[0].status).toBe('M');
        expect(paths(found.untracked)).toEqual(['loose.txt']);
        expect(found.untracked[0].status).toBe('?');
    });

    it('carries the line counts of a changed file', () => {
        write('kept.txt', 'one\nTWO\nthree\nfour\n');
        const entry = state().unstaged[0];
        expect([entry.added, entry.deleted]).toEqual([2, 1]);
    });

    it('reports no line counts for a file in the index', () => {
        // `diff --numstat` describes the worktree, so it says nothing about the index.
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        git(repo, 'add', 'kept.txt');
        const entry = state().staged[0];
        expect([entry.added, entry.deleted]).toEqual([0, 0]);
    });

    it('reports null rather than a count for a binary file', () => {
        writeFileSync(join(repo, 'blob.bin'), Buffer.from([0, 1, 2, 3]));
        git(repo, 'add', 'blob.bin');
        git(repo, 'commit', '-m', 'binary');
        writeFileSync(join(repo, 'blob.bin'), Buffer.from([0, 1, 2, 3, 4, 5]));
        const entry = state().unstaged[0];
        expect(entry.path).toBe('blob.bin');
        expect(entry.added).toBe(null);
        expect(entry.deleted).toBe(null);
    });

    it("keeps git's letter for a deleted file", () => {
        rmSync(join(repo, 'kept.txt'));
        const entry = state().unstaged[0];
        expect([entry.path, entry.status]).toEqual(['kept.txt', 'D']);
    });

    it('reports the new path of a rename once', () => {
        renameSync(join(repo, 'kept.txt'), join(repo, 'moved.txt'));
        git(repo, 'add', '-A');
        const found = state();
        expect(paths(found.staged)).toEqual(['moved.txt']);
        expect(found.staged[0].status).toBe('R');
        expect(found.unstaged).toEqual([]);
    });

    it('survives the NUL parsing with a path holding a space', () => {
        write('sub dir/deep file.txt', 'a\n');
        git(repo, 'add', '.');
        git(repo, 'commit', '-m', 'spaces');
        write('sub dir/deep file.txt', 'a\nb\n');
        write('two words.txt', 'x\n');
        const found = state();
        expect(paths(found.unstaged)).toEqual(['sub dir/deep file.txt']);
        expect(paths(found.untracked)).toEqual(['two words.txt']);
    });

    it('lists one file that is both staged and changed in both lists', () => {
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        git(repo, 'add', 'kept.txt');
        write('kept.txt', 'one\ntwo\nthree\nfour\nfive\n');
        const found = state();
        expect(paths(found.staged)).toEqual(['kept.txt']);
        expect(paths(found.unstaged)).toEqual(['kept.txt']);
        expect(byPath(found.unstaged)['kept.txt'].added).toBe(1);
    });

    it('caps each list', () => {
        for (let i = 0; i < MAX_ENTRIES + 12; i += 1) {
            write(`loose${String(i).padStart(3, '0')}.txt`, 'x\n');
        }
        expect(state().untracked.length).toBe(MAX_ENTRIES);
    });

    it('counts the commits the upstream has not seen', () => {
        // The upstream is a clone of the temporary repository, so no network is involved and every
        // git command still names a path inside the temporary directory.
        const clone = join(dir, 'clone');
        const done = spawnSync('git', ['clone', '--quiet', repo, clone], {
            encoding: 'utf8',
            timeout: 30000
        });
        expect(done.status).toBe(0);
        for (let i = 0; i < 2; i += 1) {
            const full = join(clone, `later${i}.txt`);
            expect(resolve(full).startsWith(resolve(clone) + sep)).toBe(true);
            writeFileSync(full, 'x\n');
            git(clone, 'add', '.');
            git(clone, 'commit', '-m', `later${i}`);
        }
        const found = state(clone);
        expect([found.ahead, found.behind]).toEqual([2, 0]);
        expect(found.upstream).toBe(true);
        expect(found.error).toBe(null);
    });

    it('says the branch tracks nothing, and says nothing is known before a read', () => {
        // The repository was made here and was never cloned or pushed, so `work` tracks nothing.
        // The page reads this rather than waiting for the branch listing to answer.
        expect(state().upstream).toBe(false);
        expect(empty().upstream).toBe(null);
    });

    it('says HEAD and detached when nothing is checked out', () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        git(repo, 'checkout', '--quiet', head);
        const found = state();
        expect(found.branch).toBe('HEAD');
        expect(found.detached).toBe(true);
        expect(found.error).toBe(null);
    });
});

describe('the log, the branches and the worktrees', () => {
    // LOG_ENTRIES commits, each one a git process of its own, so the case gets a budget of its own:
    // under the load of a second worktree running its suite it passes five seconds without it.
    it(
        'carries the newest commits, newest first, capped at the constant',
        { timeout: 60000 },
        () => {
            for (let i = 0; i < LOG_ENTRIES; i += 1) {
                write(`later${String(i).padStart(3, '0')}.txt`, 'x\n');
                git(repo, 'add', '.');
                git(repo, 'commit', '-m', `later ${i}`);
            }
            const found = state();
            expect(found.log.length).toBe(LOG_ENTRIES);
            expect(found.log[0].subject).toBe(`later ${LOG_ENTRIES - 1}`);
            expect(found.log[0].hash).toMatch(/^[0-9a-f]{40}$/);
            expect(found.log[0].short.length).toBeGreaterThan(3);
            expect(found.log[0].when).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
    );

    // Revert: drop the `symbolic-ref --short HEAD` read from state() in server/core/git.ts, so a
    // HEAD that does not resolve is an error again.
    it('reads a repository with no commit in it, its branch and its files, as no error', () => {
        const fresh = join(dir, 'fresh');
        mkdirSync(fresh);
        git(fresh, 'init', '--initial-branch=work');
        const loose = join(fresh, 'loose.txt');
        const staged = join(fresh, 'staged.txt');
        for (const full of [loose, staged]) {
            expect(resolve(full).startsWith(resolve(fresh) + sep)).toBe(true);
            writeFileSync(full, 'x\n');
        }
        git(fresh, 'add', 'staged.txt');
        const found = state(fresh);
        expect(found.repository).toBe(true);
        expect(found.error).toBe(null);
        expect(found.branch).toBe('work');
        expect(found.detached).toBe(false);
        expect(paths(found.untracked)).toEqual(['loose.txt']);
        expect(paths(found.staged)).toEqual(['staged.txt']);
        expect(found.staged[0].status).toBe('A');
        expect(found.unstaged).toEqual([]);
        // No commit is there to list or to count from, and no branch is made before the first one.
        expect(found.log).toEqual([]);
        expect(found.branches).toEqual([]);
        expect([found.ahead, found.behind]).toEqual([0, 0]);
        expect(found.upstream).toBe(false);
    });

    it('lists every branch with its upstream and which one is checked out', () => {
        git(repo, 'branch', 'side');
        const found = state();
        expect(found.branches.map((one) => one.name).sort()).toEqual(['side', 'work']);
        expect(found.branches.find((one) => one.name === 'work')?.current).toBe(true);
        expect(found.branches.find((one) => one.name === 'side')?.upstream).toBe('');
    });

    it('lists the checkout first and every worktree after it', () => {
        const side = join(repo, '.agents', 'worktrees', 'side');
        git(repo, 'worktree', 'add', '-b', 'side', side);
        const found = state();
        expect(found.worktrees.length).toBe(2);
        expect(found.worktrees[0]).toMatchObject({ path: repo, branch: 'work', main: true });
        // git answers with real paths; the module puts them back under the root it was asked about,
        // which is the name every other surface uses.
        expect(found.worktrees[1]).toMatchObject({ path: side, branch: 'side', main: false });
        expect(found.worktrees[1].head).toMatch(/^[0-9a-f]{40}$/);
        // The worktree is a repository of its own to read, and says which branch it is on.
        expect(state(side).branch).toBe('side');
    });

    it('reads a detached worktree without a branch', () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        const loose = join(repo, '.agents', 'worktrees', 'loose');
        git(repo, 'worktree', 'add', '--detach', loose, head);
        const found = state().worktrees.find((one) => one.path === loose);
        expect(found).toMatchObject({ branch: '', head, main: false });
    });

    it('caps the branch list', () => {
        // The cap is the change lists', so one repository with a thousand branches cannot become
        // the payload. Three past it is enough to see the cut. The branches are made by one git
        // process reading its refs from stdin, since one process per branch is what costs the time.
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        const refs = Array.from(
            { length: MAX_ENTRIES + 2 },
            (_, i) => `create refs/heads/side-${String(i).padStart(3, '0')} ${head}\n`
        ).join('');
        const done = spawnSync('git', ['-C', repo, 'update-ref', '--stdin'], {
            encoding: 'utf8',
            input: refs,
            timeout: 30000
        });
        expect(done.status).toBe(0);
        expect(state().branches.length).toBe(MAX_ENTRIES);
    });

    it('cuts every list it publishes at the cap', { tags: ['slow'] }, () => {
        // Past the cap in every list, each made by writing what git reads rather than by a git
        // process per entry: the branches and the tags by one update-ref, the stashes as the stash
        // reflog's lines, the worktrees as their administrative folders and the remotes in the
        // repository's config. The branch tracks nothing, so the remotes are read.
        const past = MAX_ENTRIES + 3;
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        const numbered = (at: number): string => String(at).padStart(3, '0');
        const refs = Array.from(
            { length: past },
            (_, at) =>
                `create refs/heads/side-${numbered(at)} ${head}\n` +
                `create refs/tags/tag-${numbered(at)} ${head}\n`
        ).join('');
        const made = spawnSync('git', ['-C', repo, 'update-ref', '--stdin'], {
            encoding: 'utf8',
            input: refs,
            timeout: 30000
        });
        expect(made.status).toBe(0);
        const zero = '0'.repeat(40);
        const reflog = Array.from(
            { length: past },
            (_, at) =>
                `${at === 0 ? zero : head} ${head} Oculus Test <nobody@example.invalid> ` +
                `${1_700_000_000 + at} +0000\tOn work: stash ${at}\n`
        ).join('');
        write('.git/logs/refs/stash', reflog);
        write('.git/refs/stash', `${head}\n`);
        for (let at = 0; at < past; at += 1) {
            const name = `tree-${numbered(at)}`;
            write(`.git/worktrees/${name}/gitdir`, `${join(dir, 'gone', name, '.git')}\n`);
            write(`.git/worktrees/${name}/HEAD`, `${head}\n`);
            write(`.git/worktrees/${name}/commondir`, '../..\n');
        }
        const remotes = Array.from(
            { length: past },
            (_, at) => `[remote "far-${numbered(at)}"]\n\turl = ${join(dir, 'far')}\n`
        ).join('');
        write('.git/config', readFileSync(join(repo, '.git', 'config'), 'utf8') + remotes);

        const found = state();
        expect(found.branches.length).toBe(MAX_ENTRIES);
        expect(found.tags.length).toBe(MAX_ENTRIES);
        expect(found.stashes.length).toBe(MAX_ENTRIES);
        expect(found.worktrees.length).toBe(MAX_ENTRIES);
        expect(found.remotes.length).toBe(MAX_ENTRIES);
    });

    it('says whether the repository keeps its worktrees folder out of its history', () => {
        expect(state().ignoresWorktrees).toBe(false);
        write('.gitignore', 'build/\n/.agents/worktrees/\n');
        expect(state().ignoresWorktrees).toBe(true);
        write('.gitignore', '# /.agents/worktrees/\n');
        expect(state().ignoresWorktrees).toBe(false);
    });
});

describe('failure', () => {
    // Revert: set `repository` to true in state() before the `rev-parse --git-dir` read answers.
    it('does not take a plain directory for a repository', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const found = state(plain);
        expect(found.repository).toBe(false);
        expect(found.error).toBeTruthy();
        expect(found.branch).toBe('');
        expect([found.staged, found.unstaged, found.untracked]).toEqual([[], [], []]);
    });

    it('comes back empty for a path that does not exist', () => {
        const found = state(join(dir, 'gone'));
        expect(found.repository).toBe(false);
        expect(found.error).toBe('no such directory');
        expect(found.ahead).toBe(0);
    });

    // Revert: set `gone.present = true` in state() of server/core/git.ts where nothing is at the
    // path.
    it('says which of a path that is not there and a folder that is no repository a root is', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);

        const away = state(join(dir, 'gone'));
        expect([away.present, away.repository, away.error]).toEqual([
            false,
            false,
            'no such directory'
        ]);

        // A folder git answered is no repository is there to read, so only `repository` is false.
        const folder = state(plain);
        expect([folder.present, folder.repository]).toEqual([true, false]);
        expect(folder.error).toBeTruthy();

        const found = state();
        expect([found.present, found.repository, found.error]).toEqual([true, true, null]);
        // Nothing read yet says nothing about the root, so it is not taken for one that is gone.
        expect(empty().present).toBe(true);
    });

    it('keeps a repository whose config git cannot parse a repository, and says why', () => {
        const broken = join(dir, 'broken');
        mkdirSync(broken);
        git(broken, 'init', '--initial-branch=work');
        writeFileSync(join(broken, '.git', 'config'), '[core\nthis is not ini\n');

        // git refuses the read, but the repository is there, so the reader is told the read failed.
        const failed = state(broken);
        expect([failed.present, failed.repository]).toEqual([true, true]);
        expect(failed.error).toContain('config');

        // The one refusal that does name a missing repository still answers no repository.
        const plain = join(dir, 'nothing-here');
        mkdirSync(plain);
        expect(state(plain).repository).toBe(false);
    });

    // Revert: drop `'ENAMETOOLONG'` from the codes exists() answers false for in
    // server/core/git.ts; a name the system will not carry then reads as a root that is there and
    // no repository.
    it('says a path too long to be a name is not there', () => {
        const long = join(dir, 'x'.repeat(4096));
        const found = state(long);
        expect([found.present, found.repository, found.error]).toEqual([
            false,
            false,
            'no such directory'
        ]);
    });

    // Revert: return the gone shape from state() in server/core/git.ts whenever `directory(root)`
    // is false, without the `exists(root)` clause; each of the three then reads as a path with
    // nothing at it, and none of them carries git's reason.
    it('keeps a path that is there but is no folder to enter, with git own reason', () => {
        const file = join(dir, 'a-file');
        writeFileSync(file, 'x\n');

        // A link whose target was never made: the name is there, and nothing can be entered at it.
        const dangling = join(dir, 'dangling');
        symlinkSync(join(dir, 'never-made'), dangling);

        // A folder under a parent nothing may enter: the read cannot tell whether it is there.
        const walled = join(dir, 'walled');
        const behind = join(walled, 'repo');
        mkdirSync(behind, { recursive: true });
        chmodSync(walled, 0o000);

        try {
            for (const path of [file, dangling, behind]) {
                const found = state(path);
                expect(found.present, path).toBe(true);
                expect(found.repository, path).toBe(false);
                expect(found.error, path).toBeTruthy();
                expect(found.error, path).not.toBe('no such directory');
            }
        } finally {
            chmodSync(walled, 0o700);
        }
    });

    // Revert: set `refused.present = true` where git answers that a root is no repository in
    // server/core/git.ts; the root that went away while the read ran then reads as a folder that is
    // no repository, which is the race the second read of the path is there to close.
    it('says a root that went away between the two reads is not there, not that it is no repository', () => {
        const away = join(dir, 'away');
        mkdirSync(away);
        git(away, 'init', '--initial-branch=work');
        between.on = {
            arg: '--git-dir',
            act: () => {
                expect(resolve(away).startsWith(resolve(tmpdir()) + sep)).toBe(true);
                rmSync(away, { recursive: true, force: true });
            }
        };
        try {
            const found = state(away);
            // git ran against a path that had gone, so it answered and refused the root.
            expect(found.repository).toBe(false);
            expect(found.error).toBeTruthy();
            expect(found.present).toBe(false);
        } finally {
            between.on = null;
        }
    });

    // Revert: return `empty(reason)` from state() when `git status` fails, as the directory that is
    // no repository returns.
    it('keeps a repository whose status cannot be read a repository, with the reason', () => {
        // An index git cannot parse fails `git status` and nothing that reads only the refs, so the
        // repository is told apart and its branch read before the status fails.
        const index = join(repo, '.git', 'index');
        expect(resolve(index).startsWith(resolve(repo) + sep)).toBe(true);
        writeFileSync(index, 'not an index\n');
        const found = state();
        expect(found.repository).toBe(true);
        expect(found.error).toBeTruthy();
        expect(found.branch).toBe('work');
    });

    // Revert: set `found.repository = false` in checkedOut() in server/core/git.ts where both HEAD
    // reads have failed.
    it('keeps a repository git names no branch for a repository, with the reason', () => {
        // A HEAD that is a symbolic ref to a name git refuses: the repository is found, and neither
        // the branch read nor the read of HEAD itself answers.
        const head = join(repo, '.git', 'HEAD');
        expect(resolve(head).startsWith(resolve(repo) + sep)).toBe(true);
        writeFileSync(head, 'ref: refs/heads/../bad\n');
        const found = state();
        expect(found.repository).toBe(true);
        expect(found.error).toBeTruthy();
        expect(found.branch).toBe('');
    });

    // Reverts: return `empty(reason)` from state() in server/core/git.ts on any `rev-parse
    // --git-dir` failure, timed out or not; or count a git that cannot start as not answered.
    it('keeps a root whose repository check timed out, and the view on it, and no root git cannot start', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        unanswered.on = { arg: '--git-dir', code: 'ETIMEDOUT' };
        try {
            const states = statusFor([repo, plain]);
            for (const root of [repo, plain]) {
                expect(states[root].repository, root).toBe(true);
                expect(states[root].error).toBe('git timed out');
            }
            // The picker keeps both, and a view kept on the repository stays on it.
            const offered = pickerRoots([repo, plain], (root) => states[root] ?? null);
            expect(offered).toEqual([repo, plain]);
            expect(shownRoot(offered, repo)).toBe(repo);
        } finally {
            unanswered.on = null;
        }
        // A git that cannot start is taken at its word: no root becomes a repository through it.
        unanswered.on = { arg: '--git-dir', code: 'ENOENT' };
        try {
            const states = statusFor([repo, plain]);
            for (const root of [repo, plain]) {
                expect(states[root].repository, root).toBe(false);
                expect(states[root].error).toBe('spawnSync git ENOENT');
            }
        } finally {
            unanswered.on = null;
        }
        // Once git answers, the folder is told apart again.
        expect(state(plain).repository).toBe(false);
        expect(state().repository).toBe(true);
    });

    it('yields nothing and raises nothing on rubbish input', () => {
        expect(statusFor(null as unknown as string[])).toEqual({});
        expect(statusFor([null, '', 17] as unknown as string[])).toEqual({});
        expect(Object.keys(statusFor([repo, repo]))).toEqual([repo]);
    });

    it('returns the empty shape every root returns', () => {
        expect(Object.keys(empty()).sort()).toEqual(Object.keys(state()).sort());
    });

    it('falls back on a timeout of zero rather than failing every root', () => {
        expect(statusFor([repo], 0)[repo].branch).toBe('work');
    });
});

describe('the tracked files', () => {
    it('lists the tracked paths relative to the folder asked, untracked ones left out', () => {
        write('sub/deep/one.ts', 'one\n');
        write('sub/two.md', 'two\n');
        write('sub/loose.txt', 'loose\n');
        write('odd name.txt', 'odd\n');
        git(repo, 'add', '--', 'sub/deep/one.ts', 'sub/two.md', 'odd name.txt');
        const whole = trackedFiles(repo);
        expect(whole).toEqual({
            ok: true,
            value: ['kept.txt', 'odd name.txt', 'sub/deep/one.ts', 'sub/two.md']
        });
        expect(trackedFiles(join(repo, 'sub'))).toEqual({
            ok: true,
            value: ['deep/one.ts', 'two.md']
        });
    });

    it('refuses a folder that is no repository, saying why', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const read = trackedFiles(plain);
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error).toContain('not a git repository');
    });
});

describe('read only', () => {
    /**
     * Runs every read of the module once, so each gate below holds when it runs alone: the status
     * of a repository with an upstream and of one with no commit yet, and the ignored names of a
     * folder. What the cases before it ran stays in the record and is checked with it.
     */
    function everyRead(): void {
        const clone = join(dir, 'clone');
        const done = spawnSync('git', ['clone', '--quiet', repo, clone], {
            encoding: 'utf8',
            timeout: 30000
        });
        expect(done.status).toBe(0);
        const unborn = join(dir, 'unborn');
        mkdirSync(unborn);
        git(unborn, 'init', '--initial-branch=fresh');
        write('.gitignore', '*.log\n');
        write('a.log', 'ignored\n');
        const states = statusFor([clone, unborn]);
        expect(states[clone].upstream).toBe(true);
        expect(states[unborn].branch).toBe('fresh');
        expect([...ignoredIn(repo, ['a.log', 'kept.txt'])]).toEqual(['a.log']);
        const tracked = trackedFiles(repo);
        expect(tracked.ok && tracked.value.includes('kept.txt')).toBe(true);
        // The reads on demand, each once, so the gates below see their commands too.
        const hash = git(repo, 'rev-parse', 'HEAD').trim();
        expect(graphPage(clone, 0).ok).toBe(true);
        expect(commitFiles(repo, hash).ok).toBe(true);
        expect(commitDiff(repo, hash, 'kept.txt').ok).toBe(true);
        expect(blameOf(repo, 'kept.txt').ok).toBe(true);
        expect(lineMarks(repo, 'kept.txt').ok).toBe(true);
        // kept.txt is in no conflict, which the read says after asking git for each stage.
        expect(mergeSides(repo, 'kept.txt').ok).toBe(false);
        write('kept.txt', 'stashed\n');
        git(repo, 'stash', 'push');
        expect(stashDiff(repo, 'stash@{0}').ok).toBe(true);
        // A repository that keeps a stash has its reflog walked, which the channel read does only
        // then.
        expect(state().stashes.length).toBe(1);
    }

    it('names the entries the repository ignores, and leaves it as it was', () => {
        write('.gitignore', '*.log\n');
        write('a.log', 'ignored\n');
        write('keep.txt', 'kept\n');
        const before = git(repo, 'status', '--porcelain=v1', '--ignored');
        expect([...ignoredIn(repo, ['a.log', 'keep.txt', '.gitignore'])]).toEqual(['a.log']);
        expect(git(repo, 'status', '--porcelain=v1', '--ignored')).toBe(before);
    });

    it('leaves a repository exactly as it was', () => {
        write('kept.txt', 'one\ntwo\nthree\nfour\n');
        write('loose.txt', 'x\n');
        git(repo, 'add', 'kept.txt');
        const before = git(repo, 'status', '--porcelain=v1');
        const head = git(repo, 'rev-parse', 'HEAD');
        state();
        expect(git(repo, 'status', '--porcelain=v1')).toBe(before);
        expect(git(repo, 'rev-parse', 'HEAD')).toBe(head);
    });

    it('names no writing subcommand in its source', () => {
        const source = readFileSync(MODULE, 'utf8');
        for (const word of FORBIDDEN) {
            expect(source).not.toContain(`'${word}'`);
            expect(source).not.toContain(`"${word}"`);
        }
    });

    // Revert: write the `symbolic-ref` call in server/core/git.ts as `['symbolic-ref', 'HEAD']`.
    it('holds only the allowed subcommands at its call site, the pinned seven as their exact vectors', () => {
        const source = readFileSync(MODULE, 'utf8');
        const calls = [...source.matchAll(/\brun\(\s*root\s*,\s*\[\s*'([a-z-]+)'/g)];
        expect(calls.map((call) => call[1]).sort()).toEqual(CALLS);
        expect([...new Set(calls.map((call) => call[1]))].sort()).toEqual(ALLOWED);
        // Every pinned call is written out in the source as the whole list it runs.
        for (const form of PINNED_SOURCE) expect(source).toContain(form);
    });

    it('ran every command without optional locks, so a read writes no index lock', () => {
        everyRead();
        expect(ran.length).toBeGreaterThan(0);
        for (const args of ran) {
            expect(args, args.join(' ')).toContain('--no-optional-locks');
        }
    });

    it('ran nothing but those commands over this file, the pinned seven as their vectors', () => {
        everyRead();
        expect(ran.length).toBeGreaterThan(0);
        const used = new Set<string>();
        for (const args of ran) {
            // Every vector is `-C <root> --no-optional-locks <subcommand> ...`, and no root leaves
            // the temporary tree.
            expect(args[0]).toBe('-C');
            expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            expect(args[2]).toBe('--no-optional-locks');
            used.add(args[3]);
            // A pinned subcommand ran as one of its vectors and never with another word.
            const forms = PINNED[args[3]];
            if (forms !== undefined) {
                expect(forms, args.join(' ')).toContainEqual(args.slice(3));
            }
        }
        expect([...used].sort()).toEqual(ALLOWED);
    });
});
