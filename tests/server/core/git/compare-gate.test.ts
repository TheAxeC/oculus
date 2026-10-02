// The gate over server/core/git/compare.ts, the compare reads of the git folder: its source names
// no writing subcommand, git is spawned in run.ts alone, the call sites of compare.ts are the nine
// subcommands listed here, and every argument vector the compare reads ran over this file is one of
// the forms written in the module.
//
// What this does NOT cover: the rest of the folder, which tests/server/core/git/git.test.ts holds
// to the lists of git-gates.ts.

import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, vi } from 'vitest';
import {
    branchBase,
    compareFiles,
    compareSides,
    headFile,
    refNames,
    workspaceSides
} from '../../../../src/lib/server/core/git/compare.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, put, scratchRepo } from '../../git/refs/repo.ts';

const SOURCES = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../src/lib/server/core/git'
);

/** Every argument vector a module under src/lib/server ran, recorded by the mock below. */
const ran = vi.hoisted(() => [] as string[][]);
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    return {
        ...actual,
        spawnSync: ((file: string, args: string[], options: unknown) => {
            if ((new Error().stack ?? '').includes('/src/lib/server/')) ran.push(args);
            return (actual.spawnSync as (...held: unknown[]) => unknown)(file, args, options);
        }) as typeof actual.spawnSync
    };
});

isolateGit();

/** The subcommands compare.ts runs, one entry per call site. */
const CALLS = [
    'cat-file',
    'config',
    'diff',
    'for-each-ref',
    'log',
    'ls-files',
    'rev-parse',
    'show',
    'symbolic-ref'
];

/**
 * The forms the compare reads run, after `-C <root> --no-optional-locks`, as patterns over the
 * words: compare.ts's own, and the two the folder's other modules answer for them, a file's version
 * at a commit (reads.ts's `sidesOf`) and the worktree list (state.ts's `worktrees`).
 */
const FORMS = [
    /^cat-file -t HEAD:[^ ]+$/,
    /^config --get-regexp \^branch\\\..\*\\\.vscode-merge-base\$$/,
    /^diff --name-status -z -M --end-of-options [0-9a-f]{40} [0-9a-f]{4,40}$/,
    /^diff --no-color --no-ext-diff -U0 -M --end-of-options [0-9a-f]{40} [0-9a-f]{4,40} -- [^ ]+( [^ ]+)?$/,
    /^for-each-ref --format=%\(refname\)%00%\(symref\)%00%\(upstream:short\) refs\/heads refs\/remotes refs\/tags$/,
    /^log --walk-reflogs --format=%gs (refs\/heads\/[^ ]+|HEAD) --$/,
    /^ls-files --stage -z -- [^ ]+$/,
    /^rev-parse --verify --quiet [^ ]+\^\{commit\}$/,
    /^show --no-textconv (HEAD|:0):[^ ]+$/,
    /^show --no-textconv [0-9a-f]{40}:[^ ]+$/,
    /^symbolic-ref --short HEAD$/,
    /^worktree list --porcelain$/
];

const source = (name: string): string => readFileSync(join(SOURCES, name), 'utf8');

describe('the sources of the compare reads', () => {
    // `tag` is not in the list: it is also the name of a ref kind in the module's answers, and the
    // call-site test below holds the subcommands to the nine.
    it('name no writing subcommand', () => {
        const forbidden = [
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
            'switch'
        ];
        for (const name of ['compare.ts', 'run.ts']) {
            for (const word of forbidden) {
                expect(source(name), `${name} ${word}`).not.toContain(`'${word}'`);
            }
        }
    });

    it('spawn git in run.ts alone', () => {
        for (const name of ['compare.ts', 'files.ts', 'parse.ts', 'reads.ts', 'state.ts']) {
            expect(source(name), name).not.toContain('spawnSync(');
            expect(source(name), name).not.toContain('node:child_process');
        }
        expect(source('run.ts').match(/spawnSync\(/g)).toHaveLength(1);
    });

    it('call run from the nine sites listed', () => {
        const calls = [...source('compare.ts').matchAll(/\brun\(\s*root\s*,\s*\[\s*'([a-z-]+)'/g)];
        expect(calls.map((call) => call[1]).sort()).toEqual(CALLS);
    });
});

/** Every vector the compare reads ran is one of the forms, run without optional locks. */
function heldToForms(): void {
    expect(ran.length).toBeGreaterThan(0);
    for (const args of ran) {
        expect(args.slice(0, 1)).toEqual(['-C']);
        expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        expect(args[2]).toBe('--no-optional-locks');
        const words = args.slice(3).join(' ');
        expect(
            FORMS.some((form) => form.test(words)),
            words
        ).toBe(true);
    }
}

/** A repository with a remote, two commits, a second branch and a staged change. */
function compareRepo(): { root: string; first: string; second: string } {
    const root = scratchRepo();
    const remote = scratchDir('oculus-remote-');
    git(remote, 'init', '-q', '--bare');
    git(root, 'remote', 'add', 'origin', remote);
    git(root, 'push', '-q', '-u', 'origin', 'main');
    git(root, 'remote', 'set-head', 'origin', 'main');
    const first = git(root, 'rev-parse', 'HEAD').trim();
    const second = commitFile(root, 'two.txt', 'two\n', 'Second');
    git(root, 'switch', '-q', '-c', 'feature');
    git(root, 'switch', '-q', 'main');
    put(root, 'kept.txt', 'staged\n');
    git(root, 'add', 'kept.txt');
    return { root, first, second };
}

// The record is kept over the whole file: each case below adds the commands of its reads, and the
// last asserts that together they ran every listed subcommand.
describe('the commands the compare reads ran', () => {
    it('are the written forms for a file at HEAD, a comparison and the refs', () => {
        const { root, first, second } = compareRepo();
        expect(headFile(root, 'head', 'kept.txt').ok).toBe(true);
        expect(headFile(root, 'index', 'kept.txt').ok).toBe(true);
        expect(compareFiles(root, first, second).ok).toBe(true);
        expect(compareSides(root, first, second, 'two.txt').ok).toBe(true);
        expect(refNames(root).ok).toBe(true);
        heldToForms();
    });

    it('are the written forms for the base a branch is compared against', () => {
        const { root } = compareRepo();
        git(root, 'config', 'branch.main.vscode-merge-base', 'origin/main');
        expect(branchBase(root)).toBe('origin/main');
        git(root, 'config', '--unset', 'branch.main.vscode-merge-base');
        git(root, 'switch', '-q', 'feature');
        expect(branchBase(root)).not.toBe('');
        git(root, 'switch', '-q', '-c', 'later');
        expect(branchBase(root)).not.toBe('');
        heldToForms();
    });

    it('are the written forms for a linked worktree against the main worktree', () => {
        const { root } = compareRepo();
        const tree = join(scratchDir('oculus-linked-'), 'tree');
        git(root, 'worktree', 'add', '-q', '-b', 'tree', tree);
        expect(workspaceSides(tree, 'kept.txt', [root]).ok).toBe(true);
        heldToForms();
    });

    it('ran every listed subcommand over this file', () => {
        const used = new Set(ran.map((args) => args[3]));
        expect([...used].sort()).toEqual([...CALLS, 'worktree'].sort());
    });
});
