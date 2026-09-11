// What server/git-write.ts runs, and what it refuses to run.
//
// Every repository here is made under the system temporary directory with the real git, and the
// allowed roots come from a fake hub bound onto the hook bridge exactly as src/server.ts binds the
// real one, so nothing reaches the hub's own checkout. The last describe is the module's gate, the
// mirror image of the one over git.ts: git.ts may name no writing subcommand at all, and this may
// name only the enumerated ones, each at one call site, and `--force` nowhere.
//
// What this does NOT cover: `claude` is never run. suggestMessage is exercised with the diff and the
// subprocess both handed in, which is what its options exist for.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { defaultMirrorsDir } from '../../src/lib/server/deposit-git.ts';
import {
    allowedRoots,
    branches,
    commit,
    createBranch,
    discard,
    parseBranches,
    permitted,
    push,
    record,
    stage,
    stagedDiff,
    switchBranch,
    unstage
} from '../../src/lib/server/git-write.ts';
import { suggestMessage } from '../../src/lib/server/git-message.ts';
import { bindHookHub } from '../../src/lib/server/sessions/hooks.ts';

const MODULE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'src',
    'lib',
    'server',
    'git-write.ts'
);

/** Everything git-write.ts is allowed to run. The source scan below asserts it holds no other. */
const ALLOWED = [
    'add',
    'branch',
    'check-ref-format',
    'commit',
    'diff',
    'push',
    'restore',
    'rev-parse',
    'status',
    'switch'
];

/** Every argument vector the module ran, over the whole file. Asserted by the last gate. */
const ran: string[][] = [];
record((args) => ran.push(args));

let dir = '';
let repo = '';
let remote = '';
let outside = '';

/** A git command inside the throwaway directory, and nowhere else, for setting a case up. */
function git(root: string, ...args: string[]): string {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

function write(root: string, name: string, body: string): void {
    const full = join(root, name);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    writeFileSync(full, body);
}

beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'oculus-git-write-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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

    // The allowed roots are the keys of the last published `git` payload, which src/server.ts feeds
    // from the real watcher. Binding a hub of the test's own is what keeps every write in this file
    // inside the temporary directory: no other root is permitted.
    bindHookHub({
        latest: (channel: string) => (channel === 'git' ? { payload: { [repo]: {} } } : undefined),
        publish: () => 0
    });
});

afterAll(() => {
    record(null);
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

/** The porcelain of the repository, as the setup reads it back. */
function status(): string {
    return git(repo, 'status', '--porcelain');
}

describe('the roots a write may name', () => {
    it('takes the published workspace and refuses anything else', () => {
        expect(permitted(repo)).toBe(true);
        expect(permitted(join(repo, 'inner'))).toBe(true);
        expect(permitted(outside)).toBe(false);
        expect(permitted('')).toBe(false);
        expect(permitted('relative/path')).toBe(false);
    });

    it('takes the deposit mirrors folder, for the suggested message of the deposit panel', () => {
        // O21's mirrors live under ~/.oculus/deposits and are not a published workspace, so
        // allowedRoots names that folder as a third source; nothing else here reaches it.
        const mirrors = defaultMirrorsDir();
        expect(allowedRoots()).toContain(mirrors);
        expect(permitted(join(mirrors, 'a-repo'))).toBe(true);
    });

    it('refuses an operation on a root outside the set before running anything', async () => {
        const before = ran.length;
        const answer = await stage(outside, ['kept.txt']);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not a workspace');
        expect(ran.length).toBe(before);
    });

    it('refuses a path that leaves the workspace', async () => {
        const answer = await stage(repo, ['../outside/kept.txt']);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not inside the workspace');
    });
});

describe('staging', () => {
    it('stages a path, takes it back out, and leaves the worktree alone', async () => {
        write(repo, 'kept.txt', 'two\n');
        expect(status()).toContain(' M kept.txt');

        const staged = await stage(repo, ['kept.txt']);
        expect(staged.ok).toBe(true);
        expect(status()).toContain('M  kept.txt');

        const back = await unstage(repo, ['kept.txt']);
        expect(back.ok).toBe(true);
        expect(status()).toContain(' M kept.txt');
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('two\n');
    });

    it('discards a tracked change', async () => {
        const answer = await discard(repo, ['kept.txt']);
        expect(answer.ok).toBe(true);
        expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('one\n');
    });

    it('refuses to discard an untracked path, and leaves it on disk', async () => {
        write(repo, 'loose.txt', 'untracked\n');
        const answer = await discard(repo, ['loose.txt']);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('does not track');
        expect(readFileSync(join(repo, 'loose.txt'), 'utf8')).toBe('untracked\n');
        rmSync(join(repo, 'loose.txt'));
    });
});

describe('committing', () => {
    it('commits a multi-line message holding quotes and backticks', async () => {
        write(repo, 'kept.txt', 'three\n');
        await stage(repo, ['kept.txt']);
        const message = 'Add the "thing"\n\n- Keep `one` and $two\n- Do not break \'quoting\'\n';
        const answer = await commit(repo, message);
        expect(answer.ok).toBe(true);
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain('Add the "thing"');
        expect(git(repo, 'log', '-1', '--pretty=%B')).toContain("- Do not break 'quoting'");
    });

    it('refuses an empty or whitespace-only message', async () => {
        const empty = await commit(repo, '');
        expect(empty.ok).toBe(false);
        expect(empty.error).toContain('needs a message');
        const blank = await commit(repo, '  \n\t');
        expect(blank.ok).toBe(false);
    });

    it('reads what is staged, which is what the suggested message is written from', async () => {
        write(repo, 'kept.txt', 'four\n');
        await stage(repo, ['kept.txt']);
        const diff = await stagedDiff(repo);
        expect(diff.ok).toBe(true);
        expect(diff.output).toContain('+four');
        await commit(repo, 'Set it to four\n');
    });
});

describe('pushing', () => {
    it('refuses a branch with no upstream', async () => {
        const answer = await push(repo);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('no upstream');
    });

    it('pushes to the upstream once there is one', async () => {
        git(repo, 'remote', 'add', 'origin', remote);
        git(repo, 'push', '-q', '-u', 'origin', 'main');
        write(repo, 'kept.txt', 'five\n');
        await stage(repo, ['kept.txt']);
        await commit(repo, 'Set it to five\n');
        const answer = await push(repo);
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
        const answer = await branches(repo);
        expect(answer.ok).toBe(true);
        const rows = parseBranches(answer.output);
        const main = rows.find((one) => one.name === 'main');
        expect(main?.current).toBe(true);
        expect(main?.upstream).toBe('origin/main');
    });

    it('creates one and checks it out', async () => {
        const answer = await createBranch(repo, 'work/one');
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('work/one');
    });

    it('refuses a name git does not accept', async () => {
        const answer = await createBranch(repo, 'a branch');
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not a branch name');
    });

    it('switches to another branch', async () => {
        const answer = await switchBranch(repo, 'main');
        expect(answer.ok).toBe(true);
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
    });

    it('refuses a switch over a dirty tree, and stays where it is', async () => {
        write(repo, 'kept.txt', 'dirty\n');
        const answer = await switchBranch(repo, 'work/one');
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('dirty');
        expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
        await discard(repo, ['kept.txt']);
    });
});

describe('the suggested message', () => {
    it('asks once, with the staged diff on stdin, and answers the text', async () => {
        const seen: { prompt: string; model: string; input: string }[] = [];
        const answer = await suggestMessage(repo, 'the instruction', {
            diff: () => Promise.resolve({ ok: true, output: 'diff --git a b\n', error: '' }),
            ask: (prompt, model, input) => {
                seen.push({ prompt, model, input });
                return Promise.resolve({ ok: true, output: 'Add a thing\n', error: '' });
            },
            model: 'a-model'
        });
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
        const answer = await suggestMessage(repo, 'the instruction', {
            diff: () => Promise.resolve({ ok: true, output: '   \n', error: '' }),
            ask: () => {
                asked += 1;
                return Promise.resolve({ ok: true, output: 'never', error: '' });
            }
        });
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('nothing is staged');
        expect(asked).toBe(0);
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

    it('never names --force', () => {
        expect(readFileSync(MODULE, 'utf8')).not.toContain('--force');
    });

    it('ran nothing but those subcommands over this whole file', () => {
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
