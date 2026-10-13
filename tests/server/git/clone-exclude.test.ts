// Layer 4, server test. The block of the hub's exclude file that hides the repositories inside the
// hub from the hub's git (server/git/clone/exclude.ts, over the walk of
// server/root/watch/repos/nested.ts): the lines a repository gets, the block rewritten in place
// with the lines around it kept, and what the hub's own `git status --porcelain -uall` lists before
// and after.
//
// Every directory is made under the system temporary directory by tests/fixtures/scratch.ts, and
// the machine's git configuration is replaced by an empty file for the whole file. The repositories
// are real ones, each with a commit, since git treats only a real repository as an embedded one.
// @module-tag slow: its cases run real git in every hub, so npm test leaves it out.

import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect } from 'vitest';
import { syncNested } from '../../../src/lib/server/git/clone/exclude.ts';
import { IGNORED } from '../../../src/lib/server/root/watch/git.ts';
import { nestedRepositories } from '../../../src/lib/server/root/watch/repos/nested.ts';
import { scratchDir, test } from '../../fixtures/scratch.ts';
import { git, isolateGit, put, repositoryAt } from './refs/repo.ts';

isolateGit();

/** The two lines around the block oculus owns, as HELP.md names them. */
const BLOCK_START = '# BEGIN nested-repos';
const BLOCK_END = '# END nested-repos';

/** A repository made at `path` below `root`, with the folders on the way made. */
function nested(root: string, path: string): string {
    const dir = join(root, path);
    put(root, join(path, 'a.txt'), 'a\n');
    repositoryAt(dir);
    return dir;
}

/** A hub that is a repository holding one tracked file, `tracked.txt`. */
function hub(): string {
    const dir = scratchDir('oculus-nested-hub-');
    put(dir, 'tracked.txt', 't\n');
    repositoryAt(dir);
    return dir;
}

/** What the hub's git lists as untracked, folders and files, one entry per line. */
function status(dir: string): string[] {
    return git(dir, 'status', '--porcelain', '-uall', '-z')
        .split('\0')
        .filter((line) => line !== '');
}

/** The block of the hub's exclude file: the lines between its two markers. */
function block(file: string): string[] {
    const lines = readFileSync(file, 'utf8').split('\n');
    return lines.slice(lines.indexOf(BLOCK_START) + 1, lines.indexOf(BLOCK_END));
}

/** The exclude file of a hub's repository, as git names it. */
function excludeOf(dir: string): string {
    return resolve(dir, git(dir, 'rev-parse', '--git-path', 'info/exclude').trim());
}

/** Walk the hub and write the block from what the walk found. */
async function sync(dir: string): Promise<string[]> {
    const repositories = await nestedRepositories(dir, IGNORED);
    return syncNested([{ hub: dir, repositories }]);
}

describe('the block of an exclude file', () => {
    const BLOCK = (...lines: string[]) => [BLOCK_START, ...lines, BLOCK_END].join('\n');
    const ROWS = [
        {
            name: 'a file with no block and lines to hold',
            text: '*.log\n',
            lines: ['/p/'],
            next: `*.log\n${BLOCK('/p/')}\n`
        },
        {
            name: 'a file with no block, without a final newline, and lines to hold',
            text: '*.log',
            lines: ['/p/'],
            next: `*.log\n${BLOCK('/p/')}\n`
        },
        {
            name: 'an empty file and lines to hold',
            text: '',
            lines: ['/p/'],
            next: `${BLOCK('/p/')}\n`
        },
        {
            name: 'a file with no block and nothing to hold',
            text: '*.log\n',
            lines: [],
            next: null
        },
        {
            name: 'a block holding other lines, with the user lines around it',
            text: `above\n  # kept\n${BLOCK('/old/')}\nbelow\n\nlast`,
            lines: ['/new/', '/newer/'],
            next: `above\n  # kept\n${BLOCK('/new/', '/newer/')}\nbelow\n\nlast`
        },
        {
            name: 'a block holding the lines',
            text: `a\n${BLOCK('/p/')}\nb\n`,
            lines: ['/p/'],
            next: null
        },
        {
            name: 'a block with nothing left to hold',
            text: `a\n${BLOCK('/p/')}\nb\n`,
            lines: [],
            next: `a\n${BLOCK()}\nb\n`
        },
        {
            name: 'an opening line with no closing line',
            text: `a\n${BLOCK_START}\nb\n`,
            lines: ['/p/'],
            next: `a\n${BLOCK('/p/')}\nb\n`
        }
    ];

    test.for(ROWS)('is written for $name', async ({ text, lines, next }) => {
        const dir = hub();
        for (const line of lines) nested(dir, line.slice(1, -1));
        const file = excludeOf(dir);
        writeFileSync(file, text);
        expect(await sync(dir)).toEqual(next === null ? [] : [file]);
        expect(readFileSync(file, 'utf8')).toBe(next ?? text);
    });
});

describe('the hub status after the block is written', () => {
    test('lists none of the repositories whose names gitignore reads as syntax, each escaped', async () => {
        const dir = hub();
        const names = ['my #dir', '!x', 'a[b]', 't ', 'a*b?c', 'back\\slash', 'u  '];
        for (const name of names) nested(dir, name);
        const before = status(dir);
        for (const name of names) {
            expect(before.some((line) => line.includes(name))).toBe(true);
        }
        expect(await sync(dir)).toEqual([excludeOf(dir)]);
        expect(status(dir)).toEqual([]);
        expect(block(excludeOf(dir))).toEqual([
            '/\\!x/',
            '/a\\*b\\?c/',
            '/a\\[b\\]/',
            '/back\\\\slash/',
            '/my \\#dir/',
            '/t\\ /',
            '/u\\ \\ /'
        ]);
    });

    test('lists none of the repositories of a hub whose .git is a file', async () => {
        const main = hub();
        const linked = join(scratchDir('oculus-nested-worktree-'), 'linked');
        git(main, 'worktree', 'add', '-q', '-b', 'side', linked);
        expect(readFileSync(join(linked, '.git'), 'utf8')).toContain('gitdir:');
        nested(linked, 'p/q');
        expect(status(linked).some((line) => line.includes('p/q'))).toBe(true);
        expect(await sync(linked)).toEqual([excludeOf(linked)]);
        expect(status(linked)).toEqual([]);
        expect(block(excludeOf(linked))).toEqual(['/p/q/']);
    });

    test('writes lines relative to the top of a larger repository that holds the hub', async () => {
        const top = hub();
        const inner = join(top, 'sites', 'hub');
        put(top, 'sites/hub/.oculus/config.yml', 'scan: []\n');
        nested(inner, 'x/y');
        expect(status(top).some((line) => line.includes('x/y'))).toBe(true);
        await sync(inner);
        expect(block(excludeOf(top))).toEqual(['/sites/hub/x/y/']);
        expect(status(top).filter((line) => line.includes('x/y'))).toEqual([]);
        expect(await sync(inner)).toEqual([]);
        expect(block(excludeOf(top))).toEqual(['/sites/hub/x/y/']);
    });

    test('gives a hub that is no repository no file', async () => {
        const dir = scratchDir('oculus-nested-plain-');
        put(dir, 'p/a.txt', 'a\n');
        repositoryAt(join(dir, 'p'));
        expect(await sync(dir)).toEqual([]);
        expect(existsSync(join(dir, '.git'))).toBe(false);
    });

    test('makes the exclude file and its folder when they are missing', async () => {
        const dir = hub();
        nested(dir, 'p');
        const file = excludeOf(dir);
        rmSync(resolve(file, '..'), { recursive: true, force: true });
        expect(existsSync(resolve(file, '..'))).toBe(false);
        expect(await sync(dir)).toEqual([file]);
        expect(block(file)).toEqual(['/p/']);
        expect(status(dir)).toEqual([]);
    });

    test('keeps the lines of the user above and below the block and writes nothing when the lines are the same', async () => {
        const dir = hub();
        nested(dir, 'p');
        const file = excludeOf(dir);
        const above = '# mine\n*.log\n\n';
        const below = '\n!keep.log\nno newline at the end';
        writeFileSync(file, `${above}${BLOCK_START}\n/old/\n${BLOCK_END}${below}`);
        expect(await sync(dir)).toEqual([file]);
        expect(readFileSync(file, 'utf8')).toBe(
            `${above}${BLOCK_START}\n/p/\n${BLOCK_END}${below}`
        );
        const stamp = statSync(file).mtimeMs;
        expect(await sync(dir)).toEqual([]);
        expect(statSync(file).mtimeMs).toBe(stamp);
        nested(dir, 'q');
        await sync(dir);
        expect(readFileSync(file, 'utf8')).toBe(
            `${above}${BLOCK_START}\n/p/\n/q/\n${BLOCK_END}${below}`
        );
    });

    test('keeps a file the hub tracks tracked inside a folder that becomes a repository', async () => {
        const dir = hub();
        put(dir, 'side/p/project.yml', 'title: p\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-q', '-m', 'Add p');
        repositoryAt(join(dir, 'side', 'p'));
        await sync(dir);
        expect(block(excludeOf(dir))).toEqual(['/side/p/']);
        expect(git(dir, 'ls-files', 'side/p/project.yml').trim()).toBe('side/p/project.yml');
        expect(status(dir)).toEqual([]);
        put(dir, 'side/p/project.yml', 'title: changed\n');
        expect(status(dir)).toEqual([' M side/p/project.yml']);
    });
});

describe('the repositories the walk lists for the block', () => {
    test('has a repository five levels down although the scan depth is 1, none inside a repository, and none under a folder the hub ignores', async () => {
        const dir = hub();
        const deep = nested(dir, 'a/b/c/d/e');
        nested(deep, 'inside/more');
        put(dir, '.gitignore', 'worktrees/\n');
        const ignored = nested(dir, 'worktrees/x');
        nested(dir, 'node_modules/y');
        expect(await nestedRepositories(dir, IGNORED)).toEqual([deep, ignored].sort());
        await sync(dir);
        expect(block(excludeOf(dir))).toEqual(['/a/b/c/d/e/']);
        expect(status(dir).filter((line) => !line.includes('node_modules'))).toEqual([
            '?? .gitignore'
        ]);
    });
});
