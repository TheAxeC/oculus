// The git commands a browser spec runs. A spec makes its own repositories under the system
// temporary directory and this is what builds and reads them, so the identity is on the command
// line and no git configuration of the machine is read or written, and the folder is asserted to
// be a temporary one before git is handed it.
//
// Every command runs without git's optional locks: a spec reads a repository back while the
// server may be writing to it, and a `git status` that refreshed the index would take
// .git/index.lock and make the server's write fail on it.

import { expect } from '@playwright/test';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';

/** One git command in a folder a spec made under the temporary directory, whatever it answers. */
function run(dir: string, args: string[]): SpawnSyncReturns<string> {
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Browser Spec',
            '-c',
            'commit.gpgsign=false',
            '--no-optional-locks',
            '-C',
            dir,
            ...args
        ],
        { encoding: 'utf8', timeout: 60000 }
    );
}

/** One git command in a folder a spec made under the temporary directory, which must succeed. */
export function gitIn(dir: string, ...args: string[]): void {
    const done = run(dir, args);
    expect(done.status, done.stderr).toBe(0);
}

/** What one git command that must succeed printed, for a spec that reads a repository back. */
export function gitOut(dir: string, ...args: string[]): string {
    const done = run(dir, args);
    expect(done.status, done.stderr).toBe(0);
    return done.stdout;
}

/** The exit status of one git command that may fail, such as a merge that stops on a conflict. */
export function gitTry(dir: string, ...args: string[]): number | null {
    return run(dir, args).status;
}
