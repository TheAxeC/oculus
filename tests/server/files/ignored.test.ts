// Layer 4, server test. What server/core/git.ts's ignoredIn answers about the entries git ignores
// in one folder, and what a listing request of server/files/fs.ts comes to with and without
// `ignored=1`. The vector the run is held to is tests/server/core/git.test.ts's gate.
//
// Every folder here is synthetic, under the system temporary directory, and is asserted to be
// inside it before anything is written. The repository cases make their own repository there with
// `git init` and `git add`, each naming the folder and giving the identity on the command line, so
// no repository of the machine's own is read or written. The case over a git that cannot start and
// the case over one that never answers put a PATH of their own in front for the length of the case.

import { spawnSync } from 'node:child_process';
import {
    chmodSync,
    existsSync,
    mkdirSync,
    realpathSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { ignoredIn } from '../../../src/lib/server/core/git.ts';
import {
    cachedIgnored,
    ignoredCache,
    listShown,
    shownOf,
    type Shown
} from '../../../src/lib/server/files/fs.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const path = process.env.PATH;
afterEach(() => {
    process.env.PATH = path;
});

/** A folder of the case's own with the files and folders named, asserted inside the temp dir. */
function folder(files: Record<string, string>, dirs: string[] = []): string {
    const dir = realpathSync(scratchDir('oculus-ignored-'));
    expect(resolve(dir).startsWith(resolve(realpathSync(tmpdir())) + sep)).toBe(true);
    for (const name of dirs) mkdirSync(join(dir, name), { recursive: true });
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
}

/** One git command over a folder of the case's own, which must succeed. */
function git(dir: string, ...args: string[]): void {
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Test',
            '-C',
            dir,
            ...args
        ],
        { encoding: 'utf8', timeout: 20000 }
    );
    expect(done.status, done.stderr).toBe(0);
}

/**
 * A repository with a .gitignore naming a folder pattern and a file pattern, one file those match
 * that git tracks all the same, and one plain file.
 */
function repository(): string {
    const dir = folder(
        {
            '.gitignore': 'build/\n*.log\nlinked/\n',
            'a.log': 'ignored\n',
            'kept.log': 'tracked though it matches\n',
            'keep.txt': 'plain\n',
            'build/out.txt': 'built\n'
        },
        ['build', 'src']
    );
    writeFileSync(join(dir, 'src', 'x.ts'), 'export {};\n');
    git(dir, 'init', '--quiet');
    git(dir, 'add', '--force', 'kept.log');
    return dir;
}

/** The names a listing request answers for a root holding one folder, or its error. */
function listed(dir: string, shown: Shown): string[] {
    const found = listShown([{ key: 'one', dir }], 'one', '', shown);
    return 'entries' in found ? found.entries.map((entry) => entry.name) : [`error:${found.error}`];
}

/** A PATH whose `git` is the script given, in a folder of the case's own. */
function fakeGit(script: string): void {
    const bin = folder({});
    writeFileSync(join(bin, 'git'), `#!/bin/sh\n${script}\n`);
    chmodSync(join(bin, 'git'), 0o755);
    process.env.PATH = `${bin}:/usr/bin:/bin`;
}

describe('the entries git ignores in one folder', () => {
    it('names a folder a folder pattern matches and a file a file pattern matches, beside a linked folder', () => {
        const dir = repository();
        // A link to a folder is a file to git; a name asked with a trailing slash over it would
        // make git refuse the whole run, and nothing in the folder would be left out.
        symlinkSync(join(dir, 'src'), join(dir, 'linked'));
        const ignored = ignoredIn(dir, ['build', 'linked', 'src', 'a.log', 'kept.log', 'keep.txt']);
        expect([...ignored].sort()).toEqual(['a.log', 'build']);
    });

    it('leaves what git ignores out of a listing unless ignored files are asked for', () => {
        const dir = repository();
        expect(listed(dir, { hidden: false, ignored: false })).toEqual([
            'src',
            'keep.txt',
            'kept.log'
        ]);
        expect(listed(dir, { hidden: false, ignored: true })).toEqual([
            'build',
            'src',
            'a.log',
            'keep.txt',
            'kept.log'
        ]);
        // hidden files are the other toggle: the .gitignore and .git are dotfiles, which git does
        // not ignore, so asking for hidden files alone shows them and still leaves out the ignored
        expect(listed(dir, { hidden: true, ignored: false })).toEqual([
            '.git',
            'src',
            '.gitignore',
            'keep.txt',
            'kept.log'
        ]);
    });

    it('audits that a folder in no repository leaves out nothing for being ignored', () => {
        const dir = folder({ '.gitignore': '*.log\n', 'a.log': 'x\n', 'b.txt': 'y\n' });
        expect(listed(dir, { hidden: false, ignored: false })).toEqual(['a.log', 'b.txt']);
    });

    it('audits that it leaves out nothing when git cannot be started', () => {
        const dir = repository();
        process.env.PATH = join(dir, 'no-such-bin');
        expect(ignoredIn(dir, ['a.log']).size).toBe(0);
    });

    it('leaves out nothing when git does not answer in time, and answers at the timeout', () => {
        const dir = repository();
        fakeGit('exec sleep 6');
        const started = Date.now();
        expect(ignoredIn(dir, ['a.log'], 200).size).toBe(0);
        expect(Date.now() - started).toBeLessThan(3000);
    }, 15000);

    it('takes no name from a git that failed, whatever it printed', () => {
        const dir = repository();
        // a git that fails says why on its error output, which is what the run keeps of it
        fakeGit("printf 'a.log\\0' >&2; exit 1");
        expect(ignoredIn(dir, ['a.log']).size).toBe(0);
    });

    it('asks git nothing for an empty folder', () => {
        const dir = folder({});
        const ran = join(dir, 'ran');
        fakeGit(`touch ${JSON.stringify(ran)}; exit 1`);
        expect(ignoredIn(dir, []).size).toBe(0);
        expect(existsSync(ran)).toBe(false);
    });
});

describe('the two toggles on a listing request', () => {
    it('reads hidden=1 and ignored=1, each alone, and nothing else as asking', () => {
        expect(shownOf(new URLSearchParams('root=hub&path='))).toEqual({
            hidden: false,
            ignored: false
        });
        expect(shownOf(new URLSearchParams('hidden=1'))).toEqual({ hidden: true, ignored: false });
        expect(shownOf(new URLSearchParams('ignored=1'))).toEqual({ hidden: false, ignored: true });
        expect(shownOf(new URLSearchParams('hidden=0&ignored=true'))).toEqual({
            hidden: false,
            ignored: false
        });
    });
});

describe('the ignored names a listing reuses', () => {
    it('asks once for one folder listed twice in a moment, and again once the moment has passed', () => {
        const cache = ignoredCache();
        let asked = 0;
        const ask = (): Set<string> => {
            asked += 1;
            return new Set(['tmp']);
        };
        expect(cachedIgnored(cache, '/hub', ['notes.md', 'tmp'], ask, 1000)).toEqual(
            new Set(['tmp'])
        );
        // A second Files tab lists the same folder in the same write's burst.
        expect(cachedIgnored(cache, '/hub', ['notes.md', 'tmp'], ask, 2500)).toEqual(
            new Set(['tmp'])
        );
        expect(asked).toBe(1);
        cachedIgnored(cache, '/hub', ['notes.md', 'tmp'], ask, 3100);
        expect(asked).toBe(2);
        // An entry added since is a listing of its own, so it is asked for rather than reused.
        cachedIgnored(cache, '/hub', ['build', 'notes.md', 'tmp'], ask, 3200);
        expect(asked).toBe(3);
    });
});
