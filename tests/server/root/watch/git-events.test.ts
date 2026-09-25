// Layer 4, test. Which file events the git watcher takes as news. The watch is replaced by one that
// only records its listener, so each case hands the watcher the event it is about at the moment it
// chooses: an FSEvents stream that is behind delivers the writes made before it opened, and no case
// can make fseventsd fall behind on purpose, so the late event is handed in by the case instead.
//
// Every repository is made inside a temporary directory, every watcher a case opens is closed, and
// the reads and the throttle run on a clock the case holds.

import { mkdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchGit } from '../../../../src/lib/server/root/watch/git.ts';
import type { Watcher } from '../../../../src/lib/server/root/watch/portfolio.ts';
import { recording, until } from './probe.ts';
import { announce, manual, put, repositoryIn } from './repos.ts';
import type { Manual } from './repos.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

/** What a watch hands each event to: the kind of event, and the path under what it watches. */
type Listener = (event: string, name: string | null) => void;

/** Every watch the watcher opened, by the path it watches, as the listener it handed in. */
const listeners = vi.hoisted(() => new Map<string, Listener>());

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        watch: ((target: string, _options: unknown, listener: Listener) => {
            listeners.set(target, listener);
            return { close: () => listeners.delete(target) };
        }) as unknown as typeof actual.watch
    };
});

afterAll(sweepScratch);

vi.setConfig({ testTimeout: 20000 });

/** How long a publish is waited for before the assertion runs and fails. */
const WAIT = 6000;

const watchers: Watcher[] = [];
let dir = '';

beforeEach(() => {
    dir = scratchDir('oculus-watch-events-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    listeners.clear();
});

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

/** Every path the making of a repository changes last, which a read has to begin after. */
const MADE = ['', '.git', '.git/index', '.git/refs/heads/work', '.git/logs/HEAD', 'kept.txt'];

/**
 * Wait until the wall clock has passed the change time of every path given, so a read begun after
 * this begins after those changes and a case never rests on two moments in one millisecond.
 */
async function past(root: string, paths: string[]): Promise<void> {
    const changed = Math.max(...paths.map((path) => statSync(join(root, path)).ctimeMs));
    await until(() => Date.now() > changed, WAIT);
    expect(Date.now()).toBeGreaterThan(changed);
}

/**
 * A repository under one watcher on a clock the case holds, once its watches are open. What `made`
 * does to the repository happens before the watch opens, as the making of the repository does.
 */
async function watched(
    made?: (root: string) => string[]
): Promise<{ root: string; clock: Manual }> {
    const root = repositoryIn(dir, 'one');
    const touched = made?.(root) ?? [];
    await past(root, [...MADE, ...touched]);
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['git']);
    const clock = manual();
    announce(hub, [root]);
    watchers.push(watchGit(hub, { throttle: 300, clock: clock.clock }));
    await until(() => client.got.length >= 1 && listeners.size === 2, WAIT);
    expect(listeners.size).toBe(2);
    return { root, clock };
}

/** Hand the watcher one event under the root, as the recursive watch would. */
function event(root: string, name: string): void {
    listeners.get(root)?.('change', name);
}

/** Hand the watcher one event inside `.git`, as the watch over that folder would. */
function gitEvent(root: string, name: string): void {
    listeners.get(join(root, '.git'))?.('change', name);
}

describe('the events the git watcher reads a root for', () => {
    it('drops a late event for a write made before the watch opened', async () => {
        // revert: src/lib/server/root/watch/git.ts:272 => delete
        // revert: src/lib/server/root/watch/git.ts:383 => delete
        const { root, clock } = await watched();
        // The repository's own making, delivered late: its first read already saw every one.
        event(root, 'kept.txt');
        gitEvent(root, 'index');
        gitEvent(root, 'COMMIT_EDITMSG');
        event(root, '.git/refs/heads/work');
        expect(clock.pending()).toBe(0);

        // A write after the watch opened is news, and schedules the read.
        put(root, 'loose.txt', 'x\n');
        event(root, 'loose.txt');
        expect(clock.pending()).toBe(1);
    });

    it('drops an event for a write the newest read saw, not only the first read', async () => {
        // revert: src/lib/server/root/watch/git.ts:211 => delete
        const { root, clock } = await watched();
        put(root, 'loose.txt', 'x\n');
        event(root, 'loose.txt');
        expect(clock.pending()).toBe(1);
        await past(root, ['loose.txt']);
        clock.fire();
        expect(clock.pending()).toBe(0);

        // The same write, announced again after the read that took it in.
        event(root, 'loose.txt');
        expect(clock.pending()).toBe(0);
    });

    it('drops a late event for a path made and taken away before the watch opened', async () => {
        // revert: src/lib/server/root/watch/git.ts:264 => return false;
        // git init probes the folder with files it takes away again, and the stream can name them
        // after the watch opened, when there is nothing left at the path to stat.
        const { root, clock } = await watched((made) => {
            writeFileSync(join(made, '.git', 'tProbe'), '');
            rmSync(join(made, '.git', 'tProbe'));
            return ['.git'];
        });
        gitEvent(root, 'tProbe');
        expect(clock.pending()).toBe(0);
    });

    it('keeps an event for a path taken away after the watch opened, by its folder', async () => {
        // revert: src/lib/server/root/watch/git.ts:263 => const up = root;
        const { root, clock } = await watched((made) => {
            mkdirSync(join(made, 'deep'));
            return ['deep'];
        });
        put(root, 'deep/gone.txt', 'x\n');
        rmSync(join(root, 'deep', 'gone.txt'));
        event(root, 'deep/gone.txt');
        expect(clock.pending()).toBe(1);
    });

    it('dates an event the .git watch gives about the folder itself by that folder', async () => {
        // revert: src/lib/server/root/watch/git.ts:264 => return false;
        const { root, clock } = await watched();
        // The folder's own event names it by its own name, and it changed before the watch opened.
        gitEvent(root, '.git');
        expect(clock.pending()).toBe(0);

        // The same event after the folder changed is news.
        const now = new Date();
        utimesSync(join(root, '.git'), now, now);
        gitEvent(root, '.git');
        expect(clock.pending()).toBe(1);
    });

    it('keeps a late event after a read that failed, since that read saw nothing', async () => {
        // revert: src/lib/server/root/watch/git.ts:227 => delete
        const { root, clock } = await watched();
        put(root, 'loose.txt', 'x\n');
        event(root, 'loose.txt');
        expect(clock.pending()).toBe(1);
        // The read the event scheduled fails: git cannot read the repository's HEAD.
        writeFileSync(join(root, '.git', 'HEAD'), 'not a ref\n');
        await past(root, ['loose.txt', '.git/HEAD']);
        clock.fire();
        expect(clock.pending()).toBe(0);

        // The write the failed read did not see, announced late, is still read for.
        event(root, 'loose.txt');
        expect(clock.pending()).toBe(1);
    });
});
