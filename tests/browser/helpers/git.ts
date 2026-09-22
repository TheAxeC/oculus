// The one git command a browser spec runs. A spec makes its own repositories under the system
// temporary directory and this is what builds them, so the identity is on the command line and no
// git configuration of the machine is read or written, and the folder is asserted to be a temporary
// one before git is handed it.

import { expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';

/** One git command in a folder a spec made under the temporary directory, which must succeed. */
export function gitIn(dir: string, ...args: string[]): void {
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Browser Spec',
            '-c',
            'commit.gpgsign=false',
            '-C',
            dir,
            ...args
        ],
        { encoding: 'utf8', timeout: 60000 }
    );
    expect(done.status, done.stderr).toBe(0);
}
