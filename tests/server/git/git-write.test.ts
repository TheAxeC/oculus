// What server/git/git-write.ts runs, and what it refuses to run.
//
// Every repository here is made under the system temporary directory with the real git, and the
// allowed root comes from local.yml inside that directory, so nothing reaches the hub's own
// checkout. The last describe is the module's gate, the
// mirror image of the one over git.ts: git.ts may name no writing subcommand at all, and this may
// name only the enumerated ones, each at one call site, and `--force` nowhere.
//
// What this does NOT cover: `claude` is never run. suggestMessage is exercised with the diff and
// the subprocess both handed in, which is what its options exist for.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, vi } from 'vitest';
import { defaultMirrorsDir } from '../../../src/lib/server/git/deposit-git.ts';
import {
    allowedRoots,
    branches,
    commit,
    createBranch,
    createWorktree,
    discard,
    fileDiff,
    merge,
    parseBranches,
    permitted,
    push,
    removeWorktree,
    stage,
    stagedDiff,
    switchBranch,
    unstage,
    worktreeDiff
} from '../../../src/lib/server/git/git-write.ts';
import { worktreePath } from '../../../src/lib/data/helpers/worktrees.ts';
import { suggestMessage } from '../../../src/lib/server/git/git-message.ts';
import { abortMerge } from '../../../src/lib/server/git/git-index.ts';
import { ALLOWED } from './allowed.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

const MODULE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../src/lib/server/git/git-write.ts'
);

/** The modules that write through git-write.ts's call sites. */
const SIBLINGS = ['git-remote.ts', 'git-index.ts', 'git-refs.ts'].map((name) =>
    resolve(dirname(MODULE), name)
);

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
let remote = '';
let outside = '';
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
    outside = join(dir, 'outside');
    execFileSync('git', ['init', '-q', '-b', 'main', repo]);
    execFileSync('git', ['init', '-q', '--bare', remote]);
    execFileSync('git', ['init', '-q', outside]);
    for (const root of [repo, outside]) {
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

describe('the roots a write may name', () => {
    it('takes the published workspace and refuses anything else', () => {
        expect(permitted(repo, ROOTS)).toBe(true);
        expect(permitted(join(repo, 'inner'), ROOTS)).toBe(true);
        expect(permitted(outside, ROOTS)).toBe(false);
        expect(permitted('', ROOTS)).toBe(false);
        expect(permitted('relative/path', ROOTS)).toBe(false);
    });

    it('takes the deposit mirrors folder, for the suggested message of the deposit panel', () => {
        // The deposit mirrors live under ~/.oculus/deposits and are not a published workspace, so
        // allowedRoots names that folder as a third source; nothing else here reaches it.
        const mirrors = defaultMirrorsDir();
        expect(allowedRoots()).toContain(mirrors);
        expect(permitted(join(mirrors, 'a-repo'), allowedRoots())).toBe(true);
    });

    it('refuses an operation on a root outside the set before running anything', async () => {
        const before = ran.length;
        const answer = await stage(outside, ['kept.txt'], ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not a workspace');
        expect(ran.length).toBe(before);
    });

    it('refuses a path that leaves the workspace', async () => {
        const answer = await stage(repo, ['../outside/kept.txt'], ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not inside the workspace');
    });

    it('refuses a path element that is not a string', async () => {
        const answer = await stage(repo, [{ path: 'kept.txt' } as unknown as string], ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toBe('the path  is not inside the workspace');
    });
});

describe('staging', () => {
    it('stages a path, takes it back out, and leaves the worktree alone', async () => {
        write(repo, 'kept.txt', 'two\n');
        expect(status()).toContain(' M kept.txt');

        const staged = await stage(repo, ['kept.txt'], ROOTS);
        expect(staged.ok).toBe(true);
        expect(status()).toContain('M  kept.txt');

        const back = await unstage(repo, ['kept.txt'], ROOTS);
        expect(back.ok).toBe(true);
        expect(status()).toContain(' M kept.txt');
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('two\n');
    });

    it('discards a tracked change', async () => {
        const answer = await discard(repo, ['kept.txt'], ROOTS);
        expect(answer.ok).toBe(true);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('one\n');
    });

    it('refuses to discard an untracked path, and leaves it on disk', async () => {
        write(repo, 'loose.txt', 'untracked\n');
        const answer = await discard(repo, ['loose.txt'], ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('does not track');
        expect(readFileSync(join(repo, 'loose.txt'), 'utf8')).toBe('untracked\n');
        rmSync(join(repo, 'loose.txt'));
    });
});

describe('committing', () => {
    it('commits a multi-line message holding quotes and backticks', async () => {
        write(repo, 'kept.txt', 'three\n');
        await stage(repo, ['kept.txt'], ROOTS);
        const message = 'Add the "thing"\n\n- Keep `one` and $two\n- Do not break \'quoting\'\n';
        const answer = await commit(repo, message, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain('Add the "thing"');
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain("- Do not break 'quoting'");
    });

    it('refuses an empty or whitespace-only message', async () => {
        const empty = await commit(repo, '', ROOTS);
        expect(empty.ok).toBe(false);
        expect(empty.error).toContain('needs a message');
        const blank = await commit(repo, '  \n\t', ROOTS);
        expect(blank.ok).toBe(false);
    });

    it('reads what is staged, which is what the suggested message is written from', async () => {
        write(repo, 'kept.txt', 'four\n');
        await stage(repo, ['kept.txt'], ROOTS);
        const diff = await stagedDiff(repo, ROOTS);
        expect(diff.ok).toBe(true);
        expect(diff.output).toContain('+four');
        await commit(repo, 'Set it to four\n', ROOTS);
    });
});

describe('pushing', () => {
    it('refuses a branch with no upstream', async () => {
        const answer = await push(repo, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('no upstream');
    });

    it('pushes to the upstream once there is one', async () => {
        git(repo, 'remote', 'add', 'origin', remote);
        git(repo, 'push', '-q', '-u', 'origin', 'main');
        write(repo, 'kept.txt', 'five\n');
        await stage(repo, ['kept.txt'], ROOTS);
        await commit(repo, 'Set it to five\n', ROOTS);
        const answer = await push(repo, ROOTS);
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
    it('lists them with their upstream and which one is checked out', async () => {
        const answer = await branches(repo, ROOTS);
        expect(answer.ok).toBe(true);
        const rows = parseBranches(answer.output);
        const main = rows.find((one) => one.name === 'main');
        expect(main?.current).toBe(true);
        expect(main?.upstream).toBe('origin/main');
    });

    it('creates one and checks it out', async () => {
        const answer = await createBranch(repo, 'work/one', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('work/one');
    });

    it('refuses a name git does not accept', async () => {
        const answer = await createBranch(repo, 'a branch', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not a branch name');
    });

    it('switches to another branch', async () => {
        const answer = await switchBranch(repo, 'main', ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
    });

    it('refuses a switch over a dirty tree, and stays where it is', async () => {
        write(repo, 'kept.txt', 'dirty\n');
        const answer = await switchBranch(repo, 'work/one', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('dirty');
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
        await discard(repo, ['kept.txt'], ROOTS);
    });
});

describe('the suggested message', () => {
    it('asks once, with the staged diff on stdin, and answers the text', async () => {
        const seen: { prompt: string; model: string; input: string }[] = [];
        const answer = await suggestMessage(
            repo,
            'the instruction',
            {
                diff: () => Promise.resolve({ ok: true, output: 'diff --git a b\n', error: '' }),
                ask: (prompt, model, input) => {
                    seen.push({ prompt, model, input });
                    return Promise.resolve({ ok: true, output: 'Add a thing\n', error: '' });
                },
                model: 'a-model'
            },
            ROOTS
        );
        expect(answer.ok).toBe(true);
        expect(answer.output).toBe('Add a thing');
        expect(seen).toHaveLength(1);
        expect(seen[0]).toEqual({
            prompt: 'the instruction',
            model: 'a-model',
            input: 'diff --git a b\n'
        });
    });

    it('refuses an empty staged diff without asking anything', async () => {
        let asked = 0;
        const answer = await suggestMessage(
            repo,
            'the instruction',
            {
                diff: () => Promise.resolve({ ok: true, output: '   \n', error: '' }),
                ask: () => {
                    asked += 1;
                    return Promise.resolve({ ok: true, output: 'never', error: '' });
                }
            },
            ROOTS
        );
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('nothing is staged');
        expect(asked).toBe(0);
    });
});

describe('one file, and one worktree, read as a diff', () => {
    it('answers one path, staged and as the worktree has it, and refuses one outside', async () => {
        write(repo, 'kept.txt', 'six\n');
        const changed = await fileDiff(repo, 'kept.txt', false, ROOTS);
        expect(changed.ok).toBe(true);
        expect(changed.output).toContain('+six');
        await stage(repo, ['kept.txt'], ROOTS);
        const staged = await fileDiff(repo, 'kept.txt', true, ROOTS);
        expect(staged.ok).toBe(true);
        expect(staged.output).toContain('+six');
        const outside_ = await fileDiff(repo, '../outside/kept.txt', false, ROOTS);
        expect(outside_.ok).toBe(false);
        expect(outside_.error).toContain('not inside the workspace');
        await commit(repo, 'Set it to six\n', ROOTS);
    });
});

describe('worktrees', () => {
    const name = 'package-one';
    /** The worktree's path. It is read in each case, since the repository is made in beforeAll. */
    const where = (): string => worktreePath(repo, name);

    it('makes one under the repository worktrees folder, on a branch of its name', async () => {
        const path = where();
        const answer = await createWorktree(repo, name, ROOTS);
        expect(answer.ok).toBe(true);
        expect(git(path, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe(name);
        expect(path.endsWith(`.agents/worktrees/${name}`)).toBe(true);
    });

    it('refuses a name that is not one folder, and one git does not accept', async () => {
        const nested = await createWorktree(repo, 'a/b', ROOTS);
        expect(nested.ok).toBe(false);
        const bad = await createWorktree(repo, 'a name', ROOTS);
        expect(bad.ok).toBe(false);
        expect(bad.error).toContain('not a branch name');
    });

    it('refuses to make one where there is already something', async () => {
        const answer = await createWorktree(repo, name, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('already');
    });

    it('answers what the worktree holds that the repository branch does not', async () => {
        const path = where();
        write(path, 'inside.txt', 'made in the worktree\n');
        git(path, 'add', 'inside.txt');
        git(path, 'commit', '-q', '-m', 'Add inside');
        const answer = await worktreeDiff(repo, path, ROOTS);
        expect(answer.ok).toBe(true);
        expect(answer.output).toContain('inside.txt');
        expect(answer.output).toContain('+made in the worktree');
    });

    it('answers for a worktree that is itself one of the allowed roots', async () => {
        // An agent worktree of this hub is a session's workspace, so the `git` channel names it and
        // it is an allowed root of its own. The repository is the one the request names, so the
        // diff is still taken against the repository's branch and not against the worktree's.
        const path = where();
        const answer = await worktreeDiff(repo, path, [repo, path]);
        expect(answer.ok).toBe(true);
        expect(answer.output).toContain('inside.txt');
    });

    it('refuses a path that is not a worktree of the root', async () => {
        const answer = await removeWorktree(repo, join(repo, 'kept.txt'), ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not a worktree');
        const read = await worktreeDiff(repo, join(repo, 'kept.txt'), ROOTS);
        expect(read.ok).toBe(false);
    });

    it('refuses a path that climbs back out of the worktrees folder', async () => {
        // The folder prefix is there, and the path leaves it again; a prefix test would take it.
        const climb = join(where(), '..', '..', '..', 'outside');
        const removal = await removeWorktree(repo, climb, ROOTS);
        expect(removal.ok).toBe(false);
        expect(removal.error).toContain('not a worktree');
        const read = await worktreeDiff(repo, climb, [repo, outside]);
        expect(read.ok).toBe(false);
        expect(read.error).toContain('not a worktree');
        // A second name under the folder is refused for the same reason: one segment, no more.
        const deeper = await removeWorktree(repo, join(where(), 'inner'), ROOTS);
        expect(deeper.ok).toBe(false);
        expect(deeper.error).toContain('not a worktree');
    });

    it('refuses a symbolic link under the worktrees folder that points at another repository', async () => {
        // The name is valid and the path sits under the folder; what it resolves to is elsewhere,
        // and the diff of elsewhere is not this repository's to show.
        mkdirSync(dirname(where()), { recursive: true });
        const link = join(dirname(where()), 'elsewhere');
        symlinkSync(outside, link);
        const read = await worktreeDiff(repo, link, [repo, outside]);
        expect(read.ok).toBe(false);
        expect(read.error).toContain('not a worktree');
        const removal = await removeWorktree(repo, link, ROOTS);
        expect(removal.ok).toBe(false);
        expect(removal.error).toContain('not a worktree');
        rmSync(link);
    });

    it('refuses to remove one that holds uncommitted work, and leaves it there', async () => {
        const path = where();
        write(path, 'inside.txt', 'edited\n');
        const answer = await removeWorktree(repo, path, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('uncommitted changes or untracked files');
        expect(readFileSync(join(path, 'inside.txt'), 'utf8')).toBe('edited\n');
        git(path, 'checkout', '--', 'inside.txt');
    });

    it('refuses to remove one holding an untracked file, which the removal would take with it', async () => {
        const path = where();
        write(path, 'loose.txt', 'nothing tracks me\n');
        const answer = await removeWorktree(repo, path, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('untracked files');
        expect(readFileSync(join(path, 'loose.txt'), 'utf8')).toBe('nothing tracks me\n');
        rmSync(join(path, 'loose.txt'));
    });
});

describe('the merge back', () => {
    const name = 'package-one';

    it('refuses the branch that is checked out', async () => {
        const answer = await merge(repo, 'main', ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('checked out');
    });

    it('refuses a repository with changes of its own', async () => {
        write(repo, 'kept.txt', 'dirty\n');
        const answer = await merge(repo, name, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('changes of its own');
        await discard(repo, ['kept.txt'], ROOTS);
    });

    it('refuses a name that is not one of the branches of this repository', async () => {
        git(repo, 'tag', 'a-tag');
        const tag = await merge(repo, 'a-tag', ROOTS);
        expect(tag.ok).toBe(false);
        expect(tag.error).toContain('not a branch of this repository');
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        const sha = await merge(repo, head, ROOTS);
        expect(sha.ok).toBe(false);
        expect(sha.error).toContain('not a branch of this repository');
        const absent = await merge(repo, 'never-made', ROOTS);
        expect(absent.ok).toBe(false);
        expect(absent.error).toContain('not a branch of this repository');
    });

    it('refuses a repository with no branch checked out', async () => {
        const head = git(repo, 'rev-parse', 'HEAD').trim();
        git(repo, 'checkout', '--quiet', head);
        const answer = await merge(repo, name, ROOTS);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('no branch checked out');
        git(repo, 'switch', '-q', 'main');
    });

    it('takes the worktree branch into the checked-out branch', async () => {
        const answer = await merge(repo, name, ROOTS);
        expect(answer.ok).toBe(true);
        expect(readFileSync(join(repo, 'inside.txt'), 'utf8')).toBe('made in the worktree\n');
    });

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

        const answer = await merge(repo, 'other', ROOTS);
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
        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
        expect(existsSync(join(repo, '.git', 'MERGE_HEAD'))).toBe(false);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('from main\n');
    });

    it('removes a worktree that is clean, and its branch with it', async () => {
        const path = worktreePath(repo, name);
        const answer = await removeWorktree(repo, path, ROOTS);
        expect(answer.ok).toBe(true);
        expect(existsSync(path)).toBe(false);
        expect(git(repo, 'branch', '--list', name).trim()).toBe('');
    });

    it('keeps a branch no other branch holds, and says so', async () => {
        const kept = 'kept-work';
        expect((await createWorktree(repo, kept, ROOTS)).ok).toBe(true);
        const path = worktreePath(repo, kept);
        write(path, 'only-here.txt', 'work that is nowhere else\n');
        git(path, 'add', 'only-here.txt');
        git(path, 'commit', '-q', '-m', 'Only here');

        const answer = await removeWorktree(repo, path, ROOTS);
        expect(answer.ok).toBe(true);
        expect(existsSync(path)).toBe(false);
        expect(answer.output).toContain(`the branch ${kept} was kept`);
        expect(git(repo, 'branch', '--list', kept)).toContain(kept);
        git(repo, 'branch', '-D', kept);
    });
});

describe('the gate over what this module can run', () => {
    it('names each allowed subcommand at exactly one call site', () => {
        const source = readFileSync(MODULE, 'utf8');
        const calls = [...source.matchAll(/\brun\(\s*root\s*,\s*\[\s*'([a-z-]+)'/g)].map(
            (call) => call[1]
        );
        expect(calls.sort()).toEqual([...ALLOWED].sort());
    });

    it('never names --force, here or in a module beside it', () => {
        for (const file of [MODULE, ...SIBLINGS]) {
            expect(readFileSync(file, 'utf8'), file).not.toContain('--force');
        }
    });

    // The modules beside git-write.ts reach git through its call sites and never run a process of
    // their own, so the call-site count above is the whole of what they can run.
    it('leaves the modules beside it no subprocess of their own', () => {
        for (const file of SIBLINGS) {
            const source = readFileSync(file, 'utf8');
            expect(source, file).not.toContain('node:child_process');
            expect(source, file).not.toMatch(/\brun\(/);
        }
    });

    it('ran nothing but those subcommands over this whole file', async () => {
        // A stage runs here, so the case has a command to judge when it runs alone as well as
        // after the rest of the file.
        write(repo, 'gate.txt', 'staged by the gate\n');
        expect((await stage(repo, ['gate.txt'], ROOTS)).ok).toBe(true);
        expect(ran.length).toBeGreaterThan(0);
        const used = new Set<string>();
        for (const args of ran) {
            // Every vector is `-C <root> <subcommand> ...`, and no root leaves the temporary tree.
            expect(args[0]).toBe('-C');
            expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            expect(args).not.toContain('--force');
            used.add(args[2]);
        }
        expect([...used].every((one) => ALLOWED.includes(one))).toBe(true);
    });
});
