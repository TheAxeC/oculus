// Layer 2, server tests. Which repositories the git watch lists below a root: the walk
// (subrepositories) at a number of levels and with no limit, the watcher with a depth of its own
// for a root (a root without one taking the global depth), and the repository cloned for a project,
// which is listed whatever the depth of the folder it lies in. The watcher runs over a real hub and
// real folders under the system temporary directory; a repository is a folder holding a `.git`
// folder, which the watch lists without reading it, and nothing waits on a timer: a case resumes on
// the message of the `git` channel that names the repository.
//
// The last describe is the block of nested repositories in a hub's exclude file: the watcher's own
// rebuild hands on the repositories found below the hub, at the first walk and again when one is
// moved or deleted, and the block is written from that list (server/git/clone/exclude.ts). It and
// the describe of each root's top folder run real git, so they are tagged slow and npm test leaves
// them out.

import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { Hub, type Sink } from '../../../src/lib/server/core/channels.ts';
import type { GitPayload } from '../../../src/lib/data/model/index.ts';
import {
    subrepositories,
    watchGit,
    type GitWatcher
} from '../../../src/lib/server/root/watch/git.ts';
import { syncNested } from '../../../src/lib/server/git/clone/exclude.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { git, isolateGit, repositoryAt } from './refs/repo.ts';

isolateGit();

let watcher: GitWatcher | undefined;

afterEach(() => {
    watcher?.close();
    watcher = undefined;
});

/** A folder made, with a `.git` folder in it when `repository` is set. */
function made(root: string, path: string, repository = true): string {
    const dir = join(root, path);
    mkdirSync(repository ? join(dir, '.git') : dir, { recursive: true });
    return dir;
}

/** A root with a repository at one, two and five levels, one under node_modules and one linked. */
function tree(): { root: string; one: string; two: string; five: string } {
    const root = scratchDir('oculus-git-depth-');
    const one = made(root, 'a');
    const two = made(root, 'b/c');
    const five = made(root, 'd/e/f/g/h');
    made(root, 'node_modules/x');
    const away = scratchDir('oculus-git-depth-away-');
    made(away, 'linked');
    symlinkSync(join(away, 'linked'), join(root, 'link'));
    return { root, one, two, five };
}

describe('subrepositories', () => {
    it.each([
        { depth: Infinity, found: ['one', 'two', 'five'] },
        { depth: 5, found: ['one', 'two', 'five'] },
        { depth: 2, found: ['one', 'two'] },
        { depth: 1, found: ['one'] },
        { depth: 0, found: [] }
    ])('finds $found at a depth of $depth, and no linked folder or ignored folder', (row) => {
        const world = tree();
        const held: Record<string, string> = {
            one: world.one,
            two: world.two,
            five: world.five
        };
        expect(subrepositories(world.root, row.depth)).toEqual(
            row.found.map((key) => held[key]).sort()
        );
    });
});

/** The keys of the `git` channel's payload now. */
function keysOf(hub: Hub): string[] {
    const message = hub.latest('git');
    return message === undefined ? [] : Object.keys(message.payload as Record<string, unknown>);
}

/** Resolve once the `git` channel names every path of `wanted`. */
function until(hub: Hub, wanted: string[]): Promise<void> {
    return new Promise((resolve) => {
        const sink: Sink = {
            send: () => {
                if (wanted.every((one) => keysOf(hub).includes(one))) {
                    hub.remove(sink);
                    resolve();
                }
                return Promise.resolve();
            },
            close: () => undefined
        };
        hub.subscribe(sink, ['git']);
    });
}

/** The watcher over `root`, the global depth `depth` and the depths of its own. */
function watching(hub: Hub, root: string, depth: number, own: [string, number][]): GitWatcher {
    watcher = watchGit(hub, {
        throttle: 0,
        roots: () => [root],
        depth: () => depth,
        rootDepths: () => new Map(own)
    });
    return watcher;
}

describe('the git watch of a root', () => {
    it('puts a repository five levels down on the channel for a root whose depth is -1', async () => {
        const hub = new Hub();
        const world = tree();
        watching(hub, world.root, 1, [[world.root, -1]]);
        await until(hub, [world.one, world.two, world.five]);
        expect(keysOf(hub)).not.toContain(join(world.root, 'link'));
    });

    it('puts the repositories down to its own depth of 2 on the channel, and not the one at five', async () => {
        const hub = new Hub();
        const world = tree();
        watching(hub, world.root, 5, [[world.root, 2]]);
        await until(hub, [world.one, world.two]);
        expect(keysOf(hub)).not.toContain(world.five);
    });

    it('takes the global depth for a root with no depth of its own', async () => {
        const hub = new Hub();
        const world = tree();
        watching(hub, world.root, 1, []);
        await until(hub, [world.one]);
        expect(keysOf(hub)).not.toContain(world.two);
        expect(keysOf(hub)).not.toContain(world.five);
    });

    it('finds a repository initialised five levels down while it runs, for a root whose depth is -1', async () => {
        const hub = new Hub();
        const world = tree();
        watching(hub, world.root, 1, [[world.root, -1]]);
        await until(hub, [world.five]);
        const fresh = made(world.root, 'p/q/r/s/t');
        await until(hub, [fresh]);
        expect(keysOf(hub)).toContain(fresh);
    });
});

describe('the top folder and the workspace mark of each root', { tags: ['slow'] }, () => {
    it('names the top folder of a repository, of a folder inside one and of one found below a root, and marks a root only a session names as outside the workspace', async () => {
        const hub = new Hub();
        const root = scratchDir('oculus-git-top-');
        repositoryAt(root);
        const inner = join(root, 'inner');
        mkdirSync(inner);
        const nested = join(root, 'nested');
        mkdirSync(nested);
        repositoryAt(nested);
        const away = scratchDir('oculus-git-top-away-');
        repositoryAt(away);
        hub.publish('sessions', { workspaces: [{ key: away }] });
        watcher = watchGit(hub, {
            throttle: 0,
            roots: () => [root, inner],
            depth: () => 1
        });
        await until(hub, [root, inner, nested, away]);
        const payload = hub.latest('git')?.payload as GitPayload;
        const seen = Object.fromEntries(
            Object.entries(payload).map(([key, state]) => [key, [state.top, state.inWorkspace]])
        );
        expect(seen).toEqual({
            [root]: [realpathSync(root), true],
            [inner]: [realpathSync(root), true],
            [nested]: [realpathSync(nested), true],
            [away]: [realpathSync(away), false]
        });
    });
});

describe('the repositories cloned for projects', () => {
    it('are on the channel once the portfolio names them, at a depth the scan does not reach, and a folder not named adds none', async () => {
        const hub = new Hub();
        const root = scratchDir('oculus-git-cloned-');
        const deep = join(root, 'a', 'b', 'c', 'd');
        mkdirSync(join(deep, '.git'), { recursive: true });
        const notCloned = join(root, 'e', 'f', 'g');
        mkdirSync(notCloned, { recursive: true });
        let listed: string[] = [];
        watcher = watchGit(hub, {
            throttle: 0,
            roots: () => [root],
            depth: () => 1,
            cloned: () => listed
        });
        await until(hub, [root]);
        expect(keysOf(hub)).not.toContain(deep);
        listed = [deep];
        hub.publish('portfolio', {});
        await until(hub, [deep]);
        expect(keysOf(hub)).not.toContain(notCloned);
    });
});

/** The two lines around the block oculus owns, as docs/HELP.md names them. */
const BLOCK_START = '# BEGIN nested-repos';
const BLOCK_END = '# END nested-repos';

/** The lines of the hub's block, or null while its exclude file holds none. */
function blockOf(dir: string): string[] | null {
    let lines: string[];
    try {
        const file = resolve(dir, git(dir, 'rev-parse', '--git-path', 'info/exclude').trim());
        lines = readFileSync(file, 'utf8').split('\n');
    } catch {
        return null;
    }
    const start = lines.indexOf(BLOCK_START);
    return start < 0 ? null : lines.slice(start + 1, lines.indexOf(BLOCK_END));
}

describe('the block of nested repositories of a hub', { tags: ['slow'] }, () => {
    /**
     * The watcher over a hub, writing the block of what it hands on, as the server does. Answers a
     * wait that resumes when a write of the block leaves it holding the lines asked for.
     */
    function watchingHub(hub: Hub, dir: string): (lines: string[]) => Promise<void> {
        let writing: Promise<unknown> = Promise.resolve();
        let waiting: { lines: string; resume: () => void }[] = [];
        watcher = watchGit(hub, {
            throttle: 0,
            roots: () => [dir],
            hubs: () => [dir],
            found: (found) => {
                writing = writing.then(async () => {
                    await syncNested(found.hubs);
                    const now = JSON.stringify(blockOf(dir));
                    const met = waiting.filter((one) => one.lines === now);
                    waiting = waiting.filter((one) => one.lines !== now);
                    for (const one of met) one.resume();
                });
            }
        });
        return (lines) =>
            new Promise((resume) => waiting.push({ lines: JSON.stringify(lines), resume }));
    }

    it('is written at the start from the repositories on disk, follows a repository moved with mv, and loses the line of one deleted', async () => {
        const dir = scratchDir('oculus-git-block-');
        repositoryAt(dir);
        mkdirSync(join(dir, 'side', 'p'), { recursive: true });
        repositoryAt(join(dir, 'side', 'p'));
        const written = watchingHub(new Hub(), dir);
        await written(['/side/p/']);

        const moved = written(['/side/q/']);
        renameSync(join(dir, 'side', 'p'), join(dir, 'side', 'q'));
        await moved;
        expect(git(dir, 'status', '--porcelain', '-uall')).toBe('');

        const deleted = written([]);
        rmSync(join(dir, 'side', 'q'), { recursive: true });
        await deleted;
    });
});
