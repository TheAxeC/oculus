// Layer 4, test. watchGit over the saved workspaces file: the file is polled on the watcher's
// clock, and a tick that finds its signature moved reads the roots again.
//
// Every case but the first runs on a clock the case holds, so a tick runs when the case fires it
// and at no other moment, and nothing the machine's file events do can read the roots instead. The
// first case runs on the wall clock, as the server does. Every repository, workspaces file and
// folder here is made inside a temporary directory, and every watcher a case opens is closed.

import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { byKey } from '../../../src/lib/data/helpers/guards.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { watchGit } from '../../../src/lib/server/watch/git.ts';
import type { Watcher } from '../../../src/lib/server/watch/portfolio.ts';
import type { Message } from '../../../src/lib/data/model.ts';
import { recording, until } from './probe.ts';
import { announce, latest, manual, payloads, repositoryIn } from './repos.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

// A case waits on git, and the suite runs several files at once, so the waits are generous: they
// are how long a failure takes, not how long a pass takes.
vi.setConfig({ testTimeout: 20000 });

/** How long a publish is waited for before the assertion runs and fails. */
const WAIT = 6000;

const watchers: Watcher[] = [];
let dir = '';

beforeEach(() => {
    dir = scratchDir('oculus-watch-workspaces-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
});

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

function repository(name: string): string {
    return repositoryIn(dir, name);
}

/** Write the workspaces file with one workspace of the given name, or none. */
function save(file: string, name = ''): void {
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    const workspaces = name === '' ? [] : [{ name, roots: [] }];
    writeFileSync(file, JSON.stringify({ current: '', workspaces }));
}

/** A roots option that counts how often the watcher asks it. */
function counted(roots: () => string[]): { roots: () => string[]; asked: () => number } {
    let asked = 0;
    return {
        roots: () => {
            asked += 1;
            return roots();
        },
        asked: () => asked
    };
}

/** Wait until a payload on the channel names the root, so the hub's delivery has run. */
async function named(got: Message[], root: string): Promise<void> {
    await until(() => payloads(got).some((one) => byKey(one, root) !== undefined), WAIT);
}

describe('watchGit over the workspaces file', () => {
    // revert: src/lib/server/watch/git.ts:410 => delete
    it('reads a root added to the workspaces file while it is running', async () => {
        const always = repository('hub');
        const added = repository('added');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let roots = [always];
        watchers.push(
            watchGit(hub, { always, throttle: 300, roots: () => roots, workspacesFile: file })
        );
        await until(() => byKey(latest(client.got), always) !== undefined, WAIT);
        expect(byKey(latest(client.got), added)).toBe(undefined);

        // The page's write is what the watcher is waiting for: the file changes, the list is asked
        // for again, and the root it now names is watched from the next tick.
        roots = [always, added];
        save(file, 'a');
        await until(() => byKey(latest(client.got), added) !== undefined, WAIT);
        expect(latest(client.got)[added].branch).toBe('work');
    });

    // A case cannot make FSEvents drop an event; what it can say is that the watcher does not need
    // one. The write lands right after the watcher starts, the tick is the case's, and the count is
    // taken in the same turn as the tick, so no file event can be what read the roots: a write made
    // while no file event is delivered is still read, at the next tick.
    // revert: src/lib/server/watch/git.ts:410 => delete
    it('reads a write no file event announced, at the next tick', async () => {
        const always = repository('hub');
        const added = repository('added');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let roots = [always];
        const asking = counted(() => roots);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        watchers.push(watchGit(hub, options));
        roots = [always, added];
        save(file, 'a');
        clock.fire();
        expect(asking.asked()).toBe(2);

        await named(client.got, added);
        expect(latest(client.got)[added].branch).toBe('work');
    });

    // revert: src/lib/server/watch/git.ts:294 => delete
    it('reads the roots once per change of the workspaces file, not once per tick', () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        watchers.push(watchGit(hub, options));
        expect(asking.asked()).toBe(1);

        // Reading the roots parses the configuration, so a tick over an unchanged file reads
        // nothing, and two writes inside one tick are one read.
        clock.fire();
        clock.fire();
        expect(asking.asked()).toBe(1);
        save(file, 'a');
        save(file, 'b');
        clock.fire();
        expect(asking.asked()).toBe(2);
        clock.fire();
        expect(asking.asked()).toBe(2);
    });

    // A config push reads the roots, and the signature with them, so the tick after it finds the
    // file as that read left it and reads nothing more.
    // revert: src/lib/server/watch/git.ts:294 => delete
    it('reads nothing at a tick a config push has already read the file for', async () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        watchers.push(watchGit(hub, options));

        save(file, 'a');
        // The hub hands the push to the watcher's sink after this turn, so its read is waited for.
        hub.publish('config', { config: {}, text: {}, findings: [] });
        await until(() => asking.asked() === 2, WAIT);
        expect(asking.asked()).toBe(2);
        clock.fire();
        expect(asking.asked()).toBe(2);
    });

    // revert: src/lib/server/watch/git.ts:410 => if (workspacesFile !== undefined && existsSync(join(workspacesFile, '..'))) pollWorkspaces(workspacesFile);
    it('sees the first save into a folder that did not exist when it started', async () => {
        const always = repository('hub');
        const added = repository('added');
        const file = join(dir, 'machine', 'workspaces.json');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let roots = [always];
        const asking = counted(() => roots);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        watchers.push(watchGit(hub, options));
        clock.fire();
        expect(asking.asked()).toBe(1);

        roots = [always, added];
        mkdirSync(dirname(file));
        save(file);
        clock.fire();
        expect(asking.asked()).toBe(2);
        await named(client.got, added);
        expect(latest(client.got)[added].branch).toBe('work');
    });

    // Deleting the file takes the workspaces' own roots with it, so a file that went is a change.
    // revert: src/lib/server/watch/git.ts:370 => if (existsSync(file) && signature(file) !== seen) {
    it('reads the roots again when the workspaces file is deleted', () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file, 'a');
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        watchers.push(watchGit(hub, options));
        expect(asking.asked()).toBe(1);

        rmSync(file);
        clock.fire();
        expect(asking.asked()).toBe(2);
        clock.fire();
        expect(asking.asked()).toBe(2);
    });

    // A folder nothing may enter makes the stat throw EACCES, which is a signature and not a
    // failure: the watcher starts, a tick over the same refusal reads nothing, and the tick after
    // the folder is opened again reads the roots again.
    // revert: src/lib/server/watch/git.ts:149 => throw error;
    // revert: src/lib/server/watch/git.ts:374 => delete
    it('keeps polling through a stat that throws, and reads once the path is repaired', () => {
        const always = repository('hub');
        const folder = join(dir, 'machine');
        mkdirSync(folder);
        const file = join(folder, 'workspaces.json');
        save(file, 'a');
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        chmodSync(folder, 0o000);
        try {
            watchers.push(watchGit(hub, options));
            clock.fire();
            expect(asking.asked()).toBe(1);
            expect(clock.pending()).toBe(1);
        } finally {
            chmodSync(folder, 0o755);
        }
        clock.fire();
        expect(asking.asked()).toBe(2);
    });

    // revert: src/lib/server/watch/git.ts:420 => delete
    it('stops polling the workspaces file once it is closed', () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: clock.clock, roots: asking.roots, workspacesFile: file };
        const watcher = watchGit(hub, options);
        expect(clock.pending()).toBe(1);

        watcher.close();
        expect(clock.pending()).toBe(0);
        save(file, 'a');
        clock.fire();
        expect(asking.asked()).toBe(1);
    });

    // A timer already taken off the queue runs although close cleared it, which a clock that
    // cannot cancel stands for here: that tick reads nothing and schedules nothing.
    // revert: src/lib/server/watch/git.ts:369 => delete
    it('reads nothing at a tick that runs after close', () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const clock = manual();
        const uncancelled = {
            setTimeout: (run: () => void, ms: number) => clock.clock.setTimeout(run, ms),
            clearTimeout: () => undefined
        };
        announce(hub, []);
        const asking = counted(() => [always]);
        const options = { always, clock: uncancelled, roots: asking.roots, workspacesFile: file };
        const watcher = watchGit(hub, options);

        watcher.close();
        expect(clock.pending()).toBe(1);
        save(file, 'a');
        clock.fire();
        expect(asking.asked()).toBe(1);
        expect(clock.pending()).toBe(0);
    });

    // The roots option can close the watcher while a tick is reading them, as a caller shutting
    // down on what it read would: that tick schedules no next one.
    // revert: src/lib/server/watch/git.ts:366 => delete
    it('schedules no next tick when the watcher is closed during one', () => {
        const always = repository('hub');
        const file = join(dir, 'workspaces.json');
        save(file);
        const hub = new Hub();
        const clock = manual();
        announce(hub, []);
        let closing = false;
        const holder: { watcher: Watcher | null } = { watcher: null };
        const roots = (): string[] => {
            if (closing) holder.watcher?.close();
            return [always];
        };
        holder.watcher = watchGit(hub, { always, clock: clock.clock, roots, workspacesFile: file });
        watchers.push(holder.watcher);

        closing = true;
        save(file, 'a');
        clock.fire();
        expect(clock.pending()).toBe(0);
    });
});
