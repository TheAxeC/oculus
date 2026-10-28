// Layer 4, test helper. The scratch repositories the cases over the git writes and reads of
// commits, branches, tags and untracked files share, the git command that sets them up, and a
// root as the writes take it.
//
// Every repository is made under the system temporary directory by tests/fixtures/scratch.ts. The
// machine's and the user's git configuration are replaced by an empty file for the whole file that
// calls `isolateGit`, so no case reads or writes an identity, a hook path or a signing key from the
// machine it runs on.

import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type { GitAt } from '../../../../src/lib/server/git/git-write.ts';
import { noCredentials } from '../../../fixtures/doubles.ts';
import { plantFile, scratchDir, test } from '../../../fixtures/scratch.ts';

/** The variables that take git's global and system configuration away from a command. */
const ISOLATED = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };

/**
 * Replace the machine's git configuration by an empty file around every case of the calling file.
 * The operations under test read `process.env`, so the variables are set there.
 */
export function isolateGit(): void {
    const held = { ...ISOLATED };
    test.beforeAll(() => {
        for (const [key, value] of Object.entries(ISOLATED)) {
            held[key as keyof typeof held] = process.env[key] ?? '';
            process.env[key] = value;
        }
    });
    test.afterAll(() => {
        for (const [key, value] of Object.entries(held)) {
            if (value === '') Reflect.deleteProperty(process.env, key);
            else process.env[key] = value;
        }
    });
}

/** A git command inside a scratch directory, with the configuration isolated; what it printed. */
export function git(root: string, ...args: string[]): string {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return execFileSync('git', ['-C', root, ...args], {
        encoding: 'utf8',
        env: { ...process.env, ...ISOLATED },
        timeout: 30000
    });
}

/** A file written at a path relative to the root, with the folders on the way made. */
export const put = plantFile;

/** A root as a git write takes it, with the git credentials of a server signed in nowhere. */
export function gitAt(root: string): GitAt {
    return { root, credentials: noCredentials() };
}

/** A repository on `main` with an identity of its own and one commit holding `a.txt`, at `dir`. */
export function repositoryAt(dir: string): void {
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'config', 'user.email', 'nobody@example.invalid');
    git(dir, 'config', 'user.name', 'Nobody');
    git(dir, 'config', 'commit.gpgsign', 'false');
    put(dir, 'a.txt', 'a\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'First');
}

/** A repository on `main` with an identity of its own and one commit holding `kept.txt`. */
export function scratchRepo(prefix = 'oculus-refs-'): string {
    const root = scratchDir(prefix);
    git(root, 'init', '-q', '-b', 'main');
    git(root, 'config', 'user.email', 'nobody@example.invalid');
    git(root, 'config', 'user.name', 'Nobody');
    git(root, 'config', 'commit.gpgsign', 'false');
    put(root, 'kept.txt', 'one\n');
    git(root, 'add', 'kept.txt');
    git(root, 'commit', '-q', '-m', 'First');
    return root;
}

/** A commit of one file on the checked-out branch; the new commit's hash. */
export function commitFile(root: string, rel: string, body: string, message: string): string {
    put(root, rel, body);
    git(root, 'add', rel);
    git(root, 'commit', '-q', '-m', message);
    return git(root, 'rev-parse', 'HEAD').trim();
}

/** A bare repository on `branch` holding these files in one commit, made from a work repository. */
export function remote(files: Record<string, string>, branch = 'main'): string {
    const work = scratchDir('oculus-clone-work-');
    git(work, 'init', '-q', '-b', branch);
    git(work, 'config', 'user.email', 'nobody@example.invalid');
    git(work, 'config', 'user.name', 'Nobody');
    git(work, 'config', 'commit.gpgsign', 'false');
    for (const [path, body] of Object.entries(files)) put(work, path, body);
    git(work, 'add', '-A');
    git(work, 'commit', '-q', '-m', 'First');
    const bare = scratchDir('oculus-clone-bare-');
    git(bare, 'clone', '-q', '--bare', work, '.');
    return bare;
}
