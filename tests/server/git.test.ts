// Read-only git state for a workspace (src/lib/server/git.ts).
//
// Every repository here is built inside a temporary directory and thrown away, and every write
// asserts its path is inside that directory first. `user.email` and `user.name` are passed on the
// command line, so this machine's git config is neither read nor written, and no git command in this
// file ever names a path outside the temporary directory: the hub's own repository is never touched.
//
// Two gates sit at the end. The module's source names no writing subcommand, and the recorder in
// git.ts reports every argument vector the module ran over this whole file, which must be nothing
// but the four read-only commands.

import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOG_ENTRIES, MAX_ENTRIES, capped, empty, statusFor } from '../../src/lib/server/git.ts';
import type { GitEntry, GitState } from '../../src/lib/data/model.ts';

const MODULE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'src',
    'lib',
    'server',
    'git.ts'
);

/** Everything git.ts is allowed to run. The source scan below asserts it holds no other. */
const ALLOWED = ['branch', 'diff', 'log', 'rev-list', 'rev-parse', 'status', 'worktree'];

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
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    // Only what a module under src/lib/server runs is recorded; a test's own setup command is not.
    const fromServer = (): boolean => (new Error().stack ?? '').includes('/src/lib/server/');
    return {
        ...actual,
        spawnSync: ((file: string, args: string[], options: unknown) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
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

/** A git command inside the throwaway directory, and nowhere else. */
function git(root: string, ...args: string[]): string {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Test',
            '-c',
            'commit.gpgsign=false',
            '-c',
            'protocol.file.allow=always',
            '-C',
            root,
            ...args
        ],
        { encoding: 'utf8', timeout: 30000 }
    );
    expect(done.status).toBe(0);
    return done.stdout;
}

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
    dir = mkdtempSync(join(tmpdir(), 'oculus-git-'));
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
    it('carries the newest commits, newest first, capped at the constant', () => {
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
    });

    it('says nothing about the log of a repository with no commit in it', () => {
        const fresh = join(dir, 'fresh');
        mkdirSync(fresh);
        git(fresh, 'init', '--initial-branch=work');
        // A repository with no commit has no HEAD to resolve, which is the empty shape with the
        // reason on it; the log is empty there like every other list.
        const found = state(fresh);
        expect(found.log).toEqual([]);
        expect(found.branches).toEqual([]);
        expect(found.error).toBeTruthy();
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

    it('cuts every list it publishes at the cap, and takes both new lists through it', () => {
        expect(capped(Array.from({ length: MAX_ENTRIES + 5 }, (_, at) => at)).length).toBe(
            MAX_ENTRIES
        );
        expect(capped([1, 2, 3])).toEqual([1, 2, 3]);
        // Making two hundred worktrees would cost minutes of git, so the worktree list is held to
        // the same cut by the source: two calls, the branch listing's and the worktree listing's,
        // which is how this file gates its commands too.
        const source = readFileSync(MODULE, 'utf8');
        expect(source.match(/\bcapped\(parse/g)?.length).toBe(2);
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
    it('does not take a plain directory for a repository', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const found = state(plain);
        expect(found.error).toBeTruthy();
        expect(found.branch).toBe('');
        expect([found.staged, found.unstaged, found.untracked]).toEqual([[], [], []]);
    });

    it('comes back empty for a path that does not exist', () => {
        const found = state(join(dir, 'gone'));
        expect(found.error).toBe('no such directory');
        expect(found.ahead).toBe(0);
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

describe('read only', () => {
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

    it('holds only the read-only commands at its one call site, worktree as a listing', () => {
        const source = readFileSync(MODULE, 'utf8');
        const calls = [...source.matchAll(/\brun\(\s*root\s*,\s*\[\s*'([a-z-]+)'/g)];
        expect(calls.length).toBe(ALLOWED.length);
        expect([...new Set(calls.map((call) => call[1]))].sort()).toEqual(ALLOWED);
        // `worktree` is the one allowed subcommand with writing forms of its own, so the module's
        // single use of it is pinned to the listing.
        expect(source).toContain("['worktree', 'list', '--porcelain']");
    });

    it('ran every command without optional locks, so a read writes no index lock', () => {
        expect(ran.length).toBeGreaterThan(0);
        for (const args of ran) {
            expect(args, args.join(' ')).toContain('--no-optional-locks');
        }
    });

    it('ran nothing but those commands over this whole file', () => {
        expect(ran.length).toBeGreaterThan(0);
        const used = new Set<string>();
        for (const args of ran) {
            // Every vector is `-C <root> --no-optional-locks <subcommand> ...`, and no root leaves
            // the temporary tree.
            expect(args[0]).toBe('-C');
            expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            expect(args[2]).toBe('--no-optional-locks');
            used.add(args[3]);
        }
        expect([...used].sort()).toEqual(ALLOWED);
    });
});
