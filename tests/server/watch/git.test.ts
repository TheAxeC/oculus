// watchGit against repositories created in a temporary directory.
//
// The workspaces come from a `sessions` message published by hand, so this file tests the watcher
// and not the session scan. Every repository is made inside a temporary directory, every write
// asserts its path is inside first, and no git command anywhere here names a path outside it: the
// hub's own repository is never read or written. Every watcher a test opens is closed when it ends.
//
// What was run is read by recording the process module's calls, which is how "only the root that
// changed is re-read" is checked by the thing that would fail if it were false.

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { byKey } from '../../../src/lib/data/guards.ts';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/channels.ts';
import type { Sink } from '../../../src/lib/server/channels.ts';
import { IGNORED, relevant, rootsOf, watchGit } from '../../../src/lib/server/watch/git.ts';
import type { Clock } from '../../../src/lib/server/watch/git.ts';
import type { Watcher } from '../../../src/lib/server/watch/portfolio.ts';
import type {
    FilesPayload,
    GitPayload,
    Message,
    SessionsPayload
} from '../../../src/lib/data/model.ts';
import { noop } from '../../doubles.ts';
import { scratchDir, sweepScratch } from '../../scratch.ts';

afterAll(sweepScratch);

// A watcher test waits on real file events and on git, and the suite runs several files at once, so
// the waits are generous: they are how long a failure takes, not how long a pass takes.
vi.setConfig({ testTimeout: 20000 });

/** How long a publish is waited for before the assertion runs and fails. */
const WAIT = 6000;

/** The untracked file a test writes to prove the watch is delivering events. */
const ARM = 'arming.txt';

const watchers: Watcher[] = [];

let dir = '';
const ran = vi.hoisted(() => [] as string[][]);
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    // Only what a module under src/lib/server runs is recorded; a test's own setup command is not.
    const fromServer = (): boolean => (new Error().stack ?? '').includes('/src/lib/server/');
    return {
        ...actual,
        spawnSync: ((file: string, args: string[], options: unknown) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            return (actual.spawnSync as (...held: unknown[]) => unknown)(file, args, options);
        }) as typeof actual.spawnSync
    };
});

beforeEach(() => {
    dir = scratchDir('oculus-watch-git-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    ran.length = 0;
});

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

/** A git command inside the throwaway directory, and nowhere else. */
function git(root: string, ...args: string[]): void {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Test',
            '-c',
            'commit.gpgsign=false',
            '-C',
            root,
            ...args
        ],
        { encoding: 'utf8', timeout: 30000 }
    );
    expect(done.status).toBe(0);
}

function put(root: string, rel: string, body: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/** One repository with a single commit on branch `work`. */
function repository(name: string): string {
    const root = join(dir, name);
    mkdirSync(root);
    git(root, 'init', '--initial-branch=work');
    put(root, 'kept.txt', 'one\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'first');
    return root;
}

/** How many commands the module ran against one root. */
function reads(root: string): number {
    return ran.filter((args) => args[0] === '-C' && args[1] === root).length;
}

function payloads(got: Message[]): GitPayload[] {
    return got
        .filter((message) => message.channel === 'git')
        .map((message) => message.payload as GitPayload);
}

function latest(got: Message[]): GitPayload {
    const found = payloads(got);
    expect(found.length).toBeGreaterThan(0);
    return found[found.length - 1];
}

function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}

/** Wait until no message has arrived for a short while, so a count taken after it is a whole one. */
async function quiet(client: { got: unknown[] }): Promise<void> {
    let seen = -1;
    let still = 0;
    while (still < 3) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (client.got.length === seen) still += 1;
        else {
            seen = client.got.length;
            still = 0;
        }
    }
}

/**
 * Wait until the watch over a repository is delivering events, by writing an untracked file into it
 * until a publish comes back.
 *
 * A recursive fs.watch on darwin is an FSEvents stream, and a stream registers with the system
 * asynchronously. An event on a directory made moments before the watch opened can be lost while
 * that registration is still in flight, and on a loaded machine that window is seconds long. A test
 * of what an event does therefore establishes first that events arrive at all.
 */
async function armed(root: string, got: Message[]): Promise<void> {
    const deadline = Date.now() + WAIT;
    while (Date.now() < deadline) {
        const before = got.length;
        put(root, ARM, String(Date.now()));
        await until(() => got.length > before, 2500);
        if (got.length > before) return;
    }
}

/** A clock whose window the test closes: nothing the watcher scheduled runs until fire() runs it. */
type Manual = { clock: Clock; fire(): void; pending(): number };

/**
 * The timer pair a watcher is handed instead of the globals. A read scheduled on it waits for the
 * test rather than for the wall clock, so a machine under load cannot end a throttle window between
 * two writes the case makes inside it.
 */
function manual(): Manual {
    const scheduled = new Map<number, () => void>();
    let next = 0;
    return {
        clock: {
            setTimeout: (run: () => void): number => {
                next += 1;
                scheduled.set(next, run);
                return next;
            },
            clearTimeout: (timer) => {
                scheduled.delete(timer as number);
            }
        },
        fire(): void {
            const held = [...scheduled.values()];
            scheduled.clear();
            for (const run of held) run();
        },
        pending(): number {
            return scheduled.size;
        }
    };
}

/**
 * The manual clock's arming: write an untracked file until the watcher schedules a read, which is
 * what says the FSEvents stream of armed() above is registered and delivering.
 */
async function arming(root: string, clock: Manual): Promise<void> {
    const deadline = Date.now() + WAIT;
    while (Date.now() < deadline && clock.pending() === 0) {
        put(root, ARM, String(Date.now()));
        await until(() => clock.pending() > 0, 2500);
    }
    expect(clock.pending()).toBeGreaterThan(0);
}

function recording(): { sink: Sink; got: Message[] } {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

/** A sessions payload naming the given roots, which is all of one this watcher reads. */
function announce(hub: Hub, roots: string[]): void {
    const payload: SessionsPayload = {
        records: [],
        terminals: [],
        workspaces: roots.map((root) => ({
            key: root,
            name: root.split(sep).pop() ?? root,
            lastActivity: null,
            areas: []
        }))
    };
    hub.publish('sessions', payload);
}

describe('relevant', () => {
    it('drops the git object store and every ignored folder', () => {
        expect(relevant('src/lib/server/git.ts')).toBe(true);
        expect(relevant('.git/index')).toBe(true);
        expect(relevant('.git/refs/heads/main')).toBe(true);
        expect(relevant('.git/objects/ab/cdef')).toBe(false);
        for (const folder of IGNORED) expect(relevant(`${folder}/thing.js`)).toBe(false);
        expect(relevant('tools/oculus/node_modules/ws/index.js')).toBe(false);
        expect(relevant(null)).toBe(false);
        expect(relevant('')).toBe(false);
    });

    it("drops git's own lock files and keeps a tracked file that ends in .lock", () => {
        // Every run of `git status` takes .git/index.lock, so counting it as a change would make
        // the watcher trigger itself for as long as the server runs.
        expect(relevant('.git/index.lock')).toBe(false);
        expect(relevant('.git/refs/heads/main.lock')).toBe(false);
        expect(relevant('Cargo.lock')).toBe(true);
        expect(relevant('code/poetry.lock')).toBe(true);
    });
});

describe('rootsOf', () => {
    it('names every workspace once and leaves out the unknown one', () => {
        const workspace = (key: string) => ({ key, name: key, lastActivity: null, areas: [] });
        const payload = {
            records: [],
            workspaces: [workspace('/a'), workspace(''), workspace('/b'), workspace('/a')]
        } as unknown as SessionsPayload;
        expect(rootsOf(payload)).toEqual(['/a', '/b']);
        expect(rootsOf({ records: [], workspaces: [], terminals: [] })).toEqual([]);
    });
});

describe('watchGit', () => {
    it('publishes the state of every workspace the sessions payload names', async () => {
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [first, second]);
        watchers.push(watchGit(hub));

        await until(() => client.got.length >= 1, WAIT);
        const payload = latest(client.got);
        expect(Object.keys(payload).sort()).toEqual([first, second].sort());
        expect(payload[first].branch).toBe('work');
        expect(payload[first].error).toBe(null);
        expect(payload[second].untracked).toEqual([]);
    });

    it('publishes the state of the edited root within three seconds, on the real throttle', async () => {
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [first, second]);
        // No throttle given, so this is DESIGN.md's "no more often than every two seconds".
        watchers.push(watchGit(hub));
        await until(() => client.got.length >= 1, WAIT);
        await armed(first, client.got);

        put(first, 'loose.txt', 'x\n');
        // Three seconds, on a throttle of two: one read lands inside the window.
        await until(() => latest(client.got)[first].untracked.length === 2, 3000);

        const payload = latest(client.got);
        expect(payload[first].untracked.map((entry) => entry.path).sort()).toEqual([
            ARM,
            'loose.txt'
        ]);
        expect(payload[second].untracked).toEqual([]);
    });

    it('re-reads only the root that changed, once for a burst inside the window', async () => {
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [first, second]);
        watchers.push(watchGit(hub, { throttle: 300, clock: clock.clock }));
        await until(() => client.got.length >= 1, WAIT);
        // The window is this test's: a read runs when fire() runs it and at no other moment, so the
        // three writes below are inside one window whatever the machine is doing.
        await arming(first, clock);
        clock.fire();

        const before = { first: reads(first), second: reads(second) };
        put(first, 'loose.txt', 'x\n');
        put(first, 'more.txt', 'y\n');
        put(first, 'third.txt', 'z\n');
        await until(() => clock.pending() > 0, WAIT);
        clock.fire();

        const payload = latest(client.got);
        expect(payload[first].untracked.map((entry) => entry.path).sort()).toEqual([
            ARM,
            'loose.txt',
            'more.txt',
            'third.txt'
        ]);
        expect(payload[second].untracked).toEqual([]);
        // Revert: drop the `rev-parse --git-dir` read from state() in server/git.ts. Eight commands
        // make one read of the first root (the repository check, the status four, the log, the
        // branch listing and the worktree listing), and the second root was not read at all.
        expect(reads(first) - before.first).toBe(8);
        expect(reads(second) - before.second).toBe(0);
    });

    it('publishes one files message naming the root a write landed under, and reads that root alone', async () => {
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git', 'files']);
        announce(hub, [first, second]);
        watchers.push(watchGit(hub, { throttle: 300, clock: clock.clock }));
        await until(() => client.got.length >= 1, WAIT);
        await arming(first, clock);
        clock.fire();
        await until(() => client.got.some((message) => message.channel === 'files'), WAIT);
        // The read that fire() opened publishes on two channels, and under load the second lands
        // after the first; the count below is taken once nothing more is arriving.
        await quiet(client);

        const before = { got: client.got.length, first: reads(first), second: reads(second) };
        put(first, 'loose.txt', 'x\n');
        await until(() => clock.pending() > 0, WAIT);
        // The window is this test's: nothing is published for the write until fire() closes it.
        expect(client.got.length).toBe(before.got);
        clock.fire();
        await until(() => client.got.length > before.got, WAIT);

        const since = client.got.slice(before.got);
        const named = since.filter((message) => message.channel === 'files');
        expect(named.map((message) => (message.payload as FilesPayload).root)).toEqual([first]);
        // Revert: drop the `rev-parse --git-dir` read from state() in server/git.ts. The cost of
        // one write under one watched root: eight git commands, none for the other root.
        expect(reads(first) - before.first).toBe(8);
        expect(reads(second) - before.second).toBe(0);
    });

    it('publishes files for a write git reports nothing about, since a listing is stale either way', async () => {
        const root = repository('one');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git', 'files']);
        announce(hub, [root]);
        watchers.push(watchGit(hub, { throttle: 300, clock: clock.clock }));
        await until(() => client.got.length >= 1, WAIT);
        await arming(root, clock);
        clock.fire();
        await until(() => client.got.some((message) => message.channel === 'files'), WAIT);

        // Writing the same bytes over an untracked file git has already reported leaves its answer
        // exactly as it was, so the `git` channel says nothing and the `files` channel still does.
        const held = latest(client.got)[root];
        const before = client.got.length;
        put(root, ARM, 'fixed\n');
        put(root, ARM, 'fixed\n');
        await until(() => clock.pending() > 0, WAIT);
        clock.fire();
        await until(() => client.got.length > before, WAIT);

        const since = client.got.slice(before);
        expect(since.filter((message) => message.channel === 'git')).toEqual([]);
        expect(since.map((message) => message.channel)).toEqual(['files']);
        expect((since[0].payload as FilesPayload).root).toBe(root);
        expect(latest(client.got)[root]).toEqual(held);
    });

    it('publishes files when a caller refreshes a root by hand, which follows a write too', async () => {
        const root = repository('one');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git', 'files']);
        announce(hub, [root]);
        const watcher = watchGit(hub);
        watchers.push(watcher);
        await until(() => byKey(latest(client.got), root) !== undefined, WAIT);

        const before = client.got.length;
        watcher.refresh(root);
        await until(() => client.got.length > before, WAIT);
        const named = client.got.slice(before).filter((message) => message.channel === 'files');
        expect(named.map((message) => (message.payload as FilesPayload).root)).toEqual([root]);
    });

    it('drops a root the sessions payload no longer names', async () => {
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [first, second]);
        watchers.push(watchGit(hub, { clock: clock.clock }));
        await until(() => Object.keys(latest(client.got)).length === 2, WAIT);

        announce(hub, [first]);
        await until(() => Object.keys(latest(client.got)).length === 1, WAIT);
        expect(Object.keys(latest(client.got))).toEqual([first]);

        // The dropped root is no longer watched: a write in it schedules nothing, and closing the
        // window by hand publishes nothing for it.
        const before = client.got.length;
        put(second, 'loose.txt', 'x\n');
        await sleep(500);
        expect(clock.pending()).toBe(0);
        clock.fire();
        expect(client.got.length).toBe(before);
        expect(latest(client.got)[second]).toBe(undefined);
    });

    it('gives a directory that is not a repository the empty shape with a reason', async () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [plain]);
        watchers.push(watchGit(hub));

        await until(() => client.got.length >= 1, WAIT);
        const state = latest(client.got)[plain];
        expect(state.error).toBeTruthy();
        expect(state.branch).toBe('');
    });

    it('watches nothing and logs nothing for a root that no longer exists', async () => {
        // A session's workspace that was deleted after the session ran: the payload still names
        // it, and the watcher used to log two ENOENT errors for it on every rescan.
        const gone = join(dir, 'gone');
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const hub = new Hub();
            const client = recording();
            hub.subscribe(client.sink, ['git']);
            announce(hub, [gone]);
            watchers.push(watchGit(hub));

            await until(() => client.got.length >= 1, WAIT);
            const state = latest(client.got)[gone];
            expect(state.error).toBeTruthy();
            expect(quiet).not.toHaveBeenCalled();
        } finally {
            quiet.mockRestore();
        }
    });

    it('says nothing on stderr for a workspace root that is not there at all', async () => {
        const gone = join(dir, 'gone');
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const hub = new Hub();
            const client = recording();
            hub.subscribe(client.sink, ['git']);
            announce(hub, [gone]);
            watchers.push(watchGit(hub));

            await until(() => client.got.length >= 1, WAIT);
            expect(latest(client.got)[gone].error).toBeTruthy();
            expect(quiet).not.toHaveBeenCalled();
        } finally {
            quiet.mockRestore();
        }
    });

    it('says nothing on stderr for a workspace directory that holds no .git', async () => {
        const plain = join(dir, 'notrepo');
        mkdirSync(plain);
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const hub = new Hub();
            const client = recording();
            hub.subscribe(client.sink, ['git']);
            announce(hub, [plain]);
            watchers.push(watchGit(hub));

            await until(() => client.got.length >= 1, WAIT);
            expect(latest(client.got)[plain].error).toBeTruthy();
            expect(quiet).not.toHaveBeenCalled();
        } finally {
            quiet.mockRestore();
        }
    });

    it('watches the always root when the payload names no workspace at all', async () => {
        const always = repository('hub');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        watchers.push(watchGit(hub, { always, throttle: 300 }));

        await until(() => byKey(latest(client.got), always) !== undefined, WAIT);
        expect(latest(client.got)[always].branch).toBe('work');

        const before = latest(client.got)[always].untracked.length;
        put(always, ARM, 'x\n');
        await until(() => latest(client.got)[always].untracked.length > before, WAIT);
        expect(latest(client.got)[always].untracked.map((one) => one.path)).toContain(ARM);
    });

    it('watches the file browser roots as well, in the order it lists them', async () => {
        const always = repository('hub');
        const first = repository('configured-one');
        const second = repository('configured-two');
        const session = repository('session');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [session]);
        watchers.push(
            watchGit(hub, { always, throttle: 300, roots: () => [always, first, second] })
        );

        await until(() => Object.keys(latest(client.got)).length >= 4, WAIT);
        // The always root, then the file browser's, then the sessions' workspaces, each once.
        expect(Object.keys(latest(client.got))).toEqual([always, first, second, session]);
        expect(latest(client.got)[second].branch).toBe('work');
    });

    it('keeps the roots it can name when the root reader throws', async () => {
        const always = repository('hub');
        const hub = new Hub();
        const client = recording();
        const quiet = vi.spyOn(console, 'error').mockImplementation(noop);
        try {
            hub.subscribe(client.sink, ['git']);
            announce(hub, []);
            watchers.push(
                watchGit(hub, {
                    always,
                    throttle: 300,
                    roots: () => {
                        throw new Error('sources.yml is unreadable');
                    }
                })
            );
            await until(() => byKey(latest(client.got), always) !== undefined, WAIT);
            expect(Object.keys(latest(client.got))).toEqual([always]);
            expect(quiet).toHaveBeenCalled();
        } finally {
            quiet.mockRestore();
        }
    });

    it('reads the roots again when a config push says the configuration moved', async () => {
        const always = repository('hub');
        const added = repository('configured-later');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let roots = [always];
        watchers.push(watchGit(hub, { always, throttle: 300, roots: () => roots }));
        await until(() => byKey(latest(client.got), always) !== undefined, WAIT);
        expect(byKey(latest(client.got), added)).toBe(undefined);

        // A root added to sources.yml reaches this watcher as the config watcher's push: the roots
        // option reads the configuration as it is now, so following again is the whole work.
        roots = [always, added];
        hub.publish('config', { config: {}, text: {}, findings: [] });
        await until(() => byKey(latest(client.got), added) !== undefined, WAIT);
        expect(latest(client.got)[added].branch).toBe('work');
    });

    it('keeps its copy of the configured roots across a sessions push', async () => {
        const always = repository('hub');
        const named = repository('named');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let reads = 0;
        const roots = (): string[] => {
            reads += 1;
            return [always];
        };
        watchers.push(watchGit(hub, { always, throttle: 300, roots }));
        await until(() => byKey(latest(client.got), always) !== undefined, WAIT);
        expect(reads).toBe(1);

        // Reading the roots parses the configuration, and a sessions push says nothing about it,
        // so the list is composed from the copy; a config push is what reads it again.
        announce(hub, [named]);
        await until(() => byKey(latest(client.got), named) !== undefined, WAIT);
        expect(reads).toBe(1);
        hub.publish('config', { config: {}, text: {}, findings: [] });
        await until(() => reads === 2, WAIT);
        expect(reads).toBe(2);
    });

    it('publishes again when the same roots come back in another order', async () => {
        const always = repository('hub');
        const first = repository('one');
        const second = repository('two');
        const hub = new Hub();
        const client = recording();
        hub.subscribe(client.sink, ['git']);
        announce(hub, []);
        let roots = [always, first, second];
        watchers.push(watchGit(hub, { always, throttle: 300, roots: () => roots }));
        await until(() => Object.keys(latest(client.got)).length >= 3, WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, first, second]);

        // The view draws its sections in the order of the keys, so an order that moved is a publish
        // even though the set and every state in it are the same.
        const before = client.got.length;
        roots = [always, second, first];
        hub.publish('config', { config: {}, text: {}, findings: [] });
        await until(() => client.got.length > before, WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, second, first]);
    });

    it('reads a root added to the workspaces file while it is running', async () => {
        const always = repository('hub');
        const added = repository('added');
        const file = join(dir, 'workspaces.json');
        writeFileSync(file, JSON.stringify({ current: '', workspaces: [] }));
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
        // for again, and the root it now names is watched from that moment.
        roots = [always, added];
        writeFileSync(
            file,
            JSON.stringify({ current: '', workspaces: [{ name: 'a', roots: [] }] })
        );
        await until(() => byKey(latest(client.got), added) !== undefined, WAIT);
        expect(latest(client.got)[added].branch).toBe('work');
    });

    it('reads nothing more once it is closed', async () => {
        const first = repository('one');
        const hub = new Hub();
        const client = recording();
        const clock = manual();
        hub.subscribe(client.sink, ['git']);
        announce(hub, [first]);
        watchers.push(watchGit(hub, { clock: clock.clock }));
        await until(() => client.got.length >= 1, WAIT);

        watchers.pop()?.close();
        const before = { messages: client.got.length, commands: reads(first) };
        put(first, 'loose.txt', 'x\n');
        announce(hub, [first]);
        await sleep(500);
        expect(clock.pending()).toBe(0);
        clock.fire();

        expect(client.got.length).toBe(before.messages);
        expect(reads(first)).toBe(before.commands);
    });
});
