// Layer 2, server tests. The automatic fetch: a timer on an injected clock that reads
// `git.autofetch_minutes` from the `config` channel and the repositories from the `git` channel at
// every look, fetches each repository that has a remote one after the other, and runs nothing but
// `git remote` and `git fetch --prune`.
//
// The cases over the timer hand the module doubles for `remotes`, `fetch` and `refresh`, and a
// clock and a `now` the case moves. The cases over real git make a bare repository and clones under
// the system temporary folder and let the module run its own `remotes` and `fetch`. What this does
// NOT cover: a remote that asks for a password over the network, which no throwaway repository can
// be; the unattended environment is read from what the child process saw instead.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { fetchIn } from '../../../src/lib/server/git/git-write.ts';
import {
    TICK,
    unattendedSsh,
    watchAutofetch
} from '../../../src/lib/server/root/watch/autofetch.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { gitText, manual, put } from '../root/watch/repos.ts';

type Answer = Awaited<ReturnType<typeof fetchIn>>;

const MINUTE = 60000;
const LISTED: Answer = { ok: true, output: 'origin\n', error: '' };
const DONE: Answer = { ok: true, output: '', error: '' };
const UNREADABLE = 'git timed out, did not run or exited with an error';
const BAD_VALUE =
    'autofetch: config/behavior.yml git.autofetch_minutes is not a whole number of minutes, 0 or more; nothing is fetched';

/** What a case may replace of the module's three calls. */
type Doubles = {
    remotes?: (root: string) => Promise<Answer>;
    fetch?: (root: string) => Promise<Answer>;
};

/** A promise the case settles itself, for a fetch still running when the next look comes. */
function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
} {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

/** Lets every promise already settled run its continuation, which is all a double needs. */
function settle(): Promise<void> {
    return new Promise((done) => setImmediate(done));
}

/** One repository's state as the `git` channel carries it: the checkout first in `worktrees`. */
function repo(...worktrees: string[]): unknown {
    return {
        repository: true,
        worktrees: worktrees.map((path, at) => ({
            path,
            branch: 'main',
            head: 'abc1234',
            main: at === 0
        }))
    };
}

/** The watcher over a hub, a clock the case fires, a `now` it moves, and the calls it made. */
function rig(doubles: Doubles | 'real' | 'listed' = {}) {
    const hub = new Hub();
    const clock = manual();
    const calls: string[] = [];
    const lines: string[] = [];
    let now = 0;
    const own = typeof doubles === 'string' ? {} : doubles;
    const watcher = watchAutofetch(hub, {
        clock: clock.clock,
        now: () => now,
        tick: MINUTE,
        refresh: (root) => calls.push(`refresh ${root}`),
        log: (line) => lines.push(line),
        ...(doubles === 'real'
            ? {}
            : {
                  remotes: (root: string) => {
                      calls.push(`remotes ${root}`);
                      return (own.remotes ?? (() => Promise.resolve(LISTED)))(root);
                  },
                  ...(doubles === 'listed'
                      ? {}
                      : {
                            fetch: (root: string) => {
                                calls.push(`fetch ${root}`);
                                return (own.fetch ?? (() => Promise.resolve(DONE)))(root);
                            }
                        })
              })
    });
    return {
        hub,
        clock,
        calls,
        lines,
        watcher,
        /** Moves `now` on by some minutes, fires the look that is due, and lets the round run. */
        async look(minutes = 1): Promise<void> {
            now += minutes * MINUTE;
            clock.fire();
            await settle();
        },
        key(value: unknown): void {
            hub.publish('config', { config: { git: { autofetch_minutes: value } } });
        },
        repos(states: Record<string, unknown>): void {
            hub.publish('git', states);
        },
        count(what: string): number {
            return calls.filter((call) => call === what).length;
        }
    };
}

describe('the period', () => {
    it('does nothing at key 0, the default, over twenty looks', async () => {
        const held = rig();
        held.key(0);
        held.repos({ '/hub': repo('/hub') });
        for (let at = 0; at < 20; at += 1) await held.look();
        expect(held.calls).toEqual([]);
        expect(held.lines).toEqual([]);
    });

    it('waits one tick for the first look and re-arms before it works', () => {
        const delays: number[] = [];
        const hub = new Hub();
        const scheduled: (() => void)[] = [];
        const watcher = watchAutofetch(hub, {
            clock: {
                setTimeout: (run, ms) => {
                    delays.push(ms);
                    scheduled.push(run);
                    return delays.length;
                },
                clearTimeout: () => undefined
            },
            refresh: () => undefined
        });
        expect(TICK).toBe(60000);
        expect(delays).toEqual([TICK]);
        scheduled[0]();
        expect(delays).toEqual([TICK, TICK]);
        watcher.close();
    });

    it('fetches the hub and another repository in order, and again only a period later', async () => {
        const first = deferred<Answer>();
        const held = rig({
            fetch: (root) => (root === '/hub' ? first.promise : Promise.resolve(DONE))
        });
        held.key(5);
        held.repos({ '/hub': repo('/hub'), '/other': repo('/other') });
        expect(held.calls).toEqual([]);
        await held.look();
        // The second repository waits for the first fetch to settle.
        expect(held.calls).toEqual(['remotes /hub', 'fetch /hub']);
        first.resolve(DONE);
        await settle();
        expect(held.calls).toEqual([
            'remotes /hub',
            'fetch /hub',
            'refresh /hub',
            'remotes /other',
            'fetch /other',
            'refresh /other'
        ]);
        const after = held.calls.length;
        for (let minutes = 2; minutes <= 5; minutes += 1) await held.look();
        expect(held.calls.length).toBe(after);
        await held.look();
        expect(held.calls.slice(after)).toEqual([
            'remotes /hub',
            'fetch /hub',
            'refresh /hub',
            'remotes /other',
            'fetch /other',
            'refresh /other'
        ]);
    });

    it('skips a repository with no remote, one whose listing failed, and a root that is none', async () => {
        const held = rig({
            remotes: (root) => {
                if (root === '/empty') return Promise.resolve({ ...LISTED, output: '' });
                if (root === '/broken')
                    return Promise.resolve({ ok: false, output: '', error: 'x' });
                if (root === '/two')
                    return Promise.resolve({ ...LISTED, output: 'origin\nupstream\n' });
                return Promise.resolve(LISTED);
            }
        });
        held.key(1);
        held.repos({
            '/empty': repo('/empty'),
            '/broken': repo('/broken'),
            '/plain': { repository: false },
            '/two': repo('/two')
        });
        await held.look();
        expect(held.count('remotes /empty')).toBe(1);
        expect(held.count('remotes /broken')).toBe(1);
        expect(held.count('remotes /plain')).toBe(0);
        expect(held.calls.filter((call) => call.startsWith('fetch'))).toEqual(['fetch /two']);
        expect(held.calls.filter((call) => call.startsWith('refresh'))).toEqual(['refresh /two']);
    });

    it('starts no second round while a fetch runs, and the next look after it settles starts one', async () => {
        const running = deferred<Answer>();
        const held = rig({ fetch: () => running.promise });
        held.key(1);
        held.repos({ '/a': repo('/a') });
        await held.look();
        // The next look is armed while the round works.
        expect(held.clock.pending()).toBe(1);
        for (let at = 0; at < 3; at += 1) await held.look();
        expect(held.count('remotes /a')).toBe(1);
        expect(held.count('fetch /a')).toBe(1);
        running.resolve(DONE);
        await settle();
        expect(held.count('refresh /a')).toBe(1);
        await held.look();
        expect(held.count('remotes /a')).toBe(2);
    });
});

describe('the key is read at every look', () => {
    it('starts rounds when the key goes from 0 to 2 and stops when it goes back to 0', async () => {
        const held = rig();
        held.repos({ '/a': repo('/a') });
        held.key(0);
        await held.look();
        expect(held.calls).toEqual([]);
        held.key(2);
        await held.look();
        expect(held.count('fetch /a')).toBe(1);
        held.key(0);
        for (let at = 0; at < 10; at += 1) await held.look();
        expect(held.count('fetch /a')).toBe(1);
    });

    it('fetches no further repository once the key goes to 0 between two of them', async () => {
        const first = deferred<Answer>();
        const held = rig({
            fetch: (root) => (root === '/a' ? first.promise : Promise.resolve(DONE))
        });
        held.key(2);
        held.repos({ '/a': repo('/a'), '/b': repo('/b') });
        await held.look();
        held.key(0);
        first.resolve(DONE);
        await settle();
        expect(held.calls).toEqual(['remotes /a', 'fetch /a', 'refresh /a']);
        // The round is over, so a key above 0 again starts a new one once its period has passed.
        held.key(2);
        await held.look(2);
        expect(held.count('fetch /b')).toBe(1);
    });

    it('uses the newest of two messages that came between two looks', async () => {
        const off = rig();
        off.repos({ '/a': repo('/a') });
        off.key(3);
        off.key(0);
        await off.look();
        expect(off.calls).toEqual([]);
        const on = rig();
        on.repos({ '/a': repo('/a') });
        on.key(0);
        on.key(3);
        await on.look();
        expect(on.count('fetch /a')).toBe(1);
    });
});

describe('a value that is not a number of minutes', () => {
    const WRONG: [string, (held: ReturnType<typeof rig>) => void][] = [
        ['-1', (held) => held.key(-1)],
        ['1.5', (held) => held.key(1.5)],
        ['"5"', (held) => held.key('5')],
        ['null', (held) => held.key(null)],
        ['a missing key', (held) => held.hub.publish('config', { config: { git: {} } })],
        ['git as a list', (held) => held.hub.publish('config', { config: { git: [] } })],
        ['a config that is a list', (held) => held.hub.publish('config', { config: [] })],
        ['a config that is text', (held) => held.hub.publish('config', { config: 'x' })],
        ['a config that is missing', (held) => held.hub.publish('config', {})],
        ['a payload that is text', (held) => held.hub.publish('config', 'x')]
    ];

    for (const [what, publish] of WRONG) {
        it(`fetches nothing, says so once across several looks, and resumes at 3: ${what}`, async () => {
            const held = rig();
            held.repos({ '/a': repo('/a') });
            publish(held);
            for (let at = 0; at < 4; at += 1) await held.look();
            expect(held.calls).toEqual([]);
            expect(held.lines).toEqual([BAD_VALUE]);
            held.key(3);
            await held.look();
            expect(held.count('fetch /a')).toBe(1);
            expect(held.lines).toEqual([BAD_VALUE]);
            // Seen readable once, a wrong value is said again.
            publish(held);
            await held.look();
            await held.look();
            expect(held.lines).toEqual([BAD_VALUE, BAD_VALUE]);
        });
    }

    it('ends a round and says so when the key turns wrong between two repositories', async () => {
        const first = deferred<Answer>();
        const held = rig({
            fetch: (root) => (root === '/a' ? first.promise : Promise.resolve(DONE))
        });
        held.key(2);
        held.repos({ '/a': repo('/a'), '/b': repo('/b') });
        await held.look();
        held.key(-1);
        first.resolve(DONE);
        await settle();
        expect(held.count('remotes /b')).toBe(0);
        expect(held.lines).toEqual([BAD_VALUE]);
    });
});

describe('a call that fails', () => {
    it('logs a fetch that answers not ok, fetches the next repository, and tries the first again', async () => {
        let failing = true;
        const held = rig({
            fetch: (root) =>
                root === '/a' && failing
                    ? Promise.resolve({ ok: false, output: '', error: 'could not resolve host' })
                    : Promise.resolve(DONE)
        });
        held.key(1);
        held.repos({ '/a': repo('/a'), '/b': repo('/b') });
        await held.look();
        expect(held.lines).toEqual(['autofetch: /a: could not resolve host']);
        expect(held.count('fetch /b')).toBe(1);
        failing = false;
        await held.look();
        expect(held.count('fetch /a')).toBe(2);
        expect(held.lines).toHaveLength(1);
    });

    it('logs a fetch that rejects, fetches the next repository, and clears the running mark', async () => {
        const held = rig({
            fetch: (root) =>
                root === '/a' ? Promise.reject(new Error('boom')) : Promise.resolve(DONE)
        });
        held.key(1);
        held.repos({ '/a': repo('/a'), '/b': repo('/b') });
        await held.look();
        expect(held.lines).toEqual(['autofetch: /a: boom']);
        expect(held.count('fetch /b')).toBe(1);
        await held.look();
        expect(held.count('fetch /a')).toBe(2);
    });

    it('logs a listing that answers not ok or rejects, and goes on to the next repository', async () => {
        const held = rig({
            remotes: (root) => {
                if (root === '/a')
                    return Promise.resolve({ ok: false, output: '', error: 'no git' });
                if (root === '/b') return Promise.reject(new Error('gone'));
                return Promise.resolve(LISTED);
            }
        });
        held.key(1);
        held.repos({ '/a': repo('/a'), '/b': repo('/b'), '/c': repo('/c') });
        await held.look();
        expect(held.lines).toEqual(['autofetch: /a: no git', 'autofetch: /b: gone']);
        expect(held.calls.filter((call) => call.startsWith('fetch'))).toEqual(['fetch /c']);
    });

    it('logs a refresh that throws and goes on to the next repository', async () => {
        const hub = new Hub();
        const clock = manual();
        const lines: string[] = [];
        const fetched: string[] = [];
        let now = 0;
        const watcher = watchAutofetch(hub, {
            clock: clock.clock,
            now: () => now,
            tick: MINUTE,
            refresh: (root) => {
                if (root === '/a') throw new Error('refused');
            },
            remotes: () => Promise.resolve(LISTED),
            fetch: (root) => {
                fetched.push(root);
                return Promise.resolve(DONE);
            },
            log: (line) => lines.push(line)
        });
        hub.publish('config', { config: { git: { autofetch_minutes: 1 } } });
        hub.publish('git', { '/a': repo('/a'), '/b': repo('/b') });
        now += MINUTE;
        clock.fire();
        await settle();
        expect(lines).toEqual(['autofetch: /a: refused']);
        expect(fetched).toEqual(['/a', '/b']);
        watcher.close();
    });

    it('refreshes a repository after each of its fetches and never one it skipped', async () => {
        const held = rig({
            remotes: (root) =>
                Promise.resolve(root === '/none' ? { ...LISTED, output: '' } : LISTED)
        });
        held.key(1);
        held.repos({ '/a': repo('/a'), '/none': repo('/none'), '/b': repo('/b') });
        await held.look();
        expect(held.calls.filter((call) => call.startsWith('refresh'))).toEqual([
            'refresh /a',
            'refresh /b'
        ]);
    });
});

describe('close', () => {
    it('leaves no timer when called before the first look, and twice', async () => {
        const held = rig();
        held.key(1);
        held.repos({ '/a': repo('/a') });
        held.watcher.close();
        held.watcher.close();
        expect(held.clock.pending()).toBe(0);
        await held.look();
        expect(held.calls).toEqual([]);
    });

    it('starts no remotes, fetch or refresh after it, and leaves no timer, with a fetch never settling', async () => {
        const never = deferred<Answer>();
        const held = rig({ fetch: () => never.promise });
        held.key(1);
        held.repos({ '/a': repo('/a'), '/b': repo('/b') });
        await held.look();
        expect(held.calls).toEqual(['remotes /a', 'fetch /a']);
        held.watcher.close();
        expect(held.clock.pending()).toBe(0);
        never.resolve(DONE);
        await settle();
        await held.look(5);
        expect(held.calls).toEqual(['remotes /a', 'fetch /a']);
    });

    it('starts no fetch after it when the listing settles after the close', async () => {
        const listing = deferred<Answer>();
        const held = rig({ remotes: () => listing.promise });
        held.key(1);
        held.repos({ '/a': repo('/a') });
        await held.look();
        held.watcher.close();
        listing.resolve(LISTED);
        await settle();
        expect(held.calls).toEqual(['remotes /a']);
    });
});

describe('what the channels hold', () => {
    it('makes no round, and does not throw, before a config or a git message has come', async () => {
        const noConfig = rig();
        noConfig.repos({ '/a': repo('/a') });
        await noConfig.look();
        const noGit = rig();
        noGit.key(1);
        await noGit.look();
        const neither = rig();
        await neither.look();
        for (const held of [noConfig, noGit, neither]) expect(held.calls).toEqual([]);
        // An absent config is not a wrong value, so it is not said.
        expect(noConfig.lines).toEqual([]);
    });

    it('makes no round for a payload that is not a map or a state that is not a repository', async () => {
        const shapes: unknown[] = [
            'x',
            5,
            null,
            ['/a'],
            { '/a': 'x' },
            { '/a': {} },
            { '/a': { repository: 'yes' } },
            { '/a': { repository: false } }
        ];
        for (const shape of shapes) {
            const held = rig();
            held.key(1);
            held.hub.publish('git', shape);
            await held.look();
            expect(held.calls).toEqual([]);
            expect(held.lines).toEqual([]);
        }
    });

    it('still fetches a repository whose neighbour state is malformed', async () => {
        const held = rig();
        held.key(1);
        held.repos({ '/bad': { repository: 'yes' }, '/a': repo('/a') });
        await held.look();
        expect(held.calls).toEqual(['remotes /a', 'fetch /a', 'refresh /a']);
    });

    it('fetches a repository once for the checkout, a worktree of it, and a folder inside it', async () => {
        const held = rig();
        held.key(1);
        held.repos({
            '/repo': repo('/repo'),
            '/repo/.agents/worktrees/x': repo('/repo', '/repo/.agents/worktrees/x'),
            '/repo/src': repo('/repo'),
            '/other': repo('/other'),
            '/lone': { repository: true, worktrees: [] }
        });
        await held.look();
        expect(held.calls.filter((call) => call.startsWith('fetch'))).toEqual([
            'fetch /repo',
            'fetch /other',
            'fetch /lone'
        ]);
    });

    it('uses the first root of a group in the payload order', async () => {
        const held = rig();
        held.key(1);
        held.repos({
            '/repo/.agents/worktrees/x': repo('/repo', '/repo/.agents/worktrees/x'),
            '/repo': repo('/repo')
        });
        await held.look();
        expect(held.calls.filter((call) => call.startsWith('fetch'))).toEqual([
            'fetch /repo/.agents/worktrees/x'
        ]);
    });

    it('says its lines on standard error when no log is handed in', async () => {
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const hub = new Hub();
        const clock = manual();
        const watcher = watchAutofetch(hub, { clock: clock.clock, refresh: () => undefined });
        hub.publish('config', { config: { git: { autofetch_minutes: -1 } } });
        clock.fire();
        await settle();
        expect(said).toHaveBeenCalledWith(BAD_VALUE);
        watcher.close();
        said.mockRestore();
    });
});

/** A bare repository, a clone to fetch into, and a second clone that writes to the bare one. */
function remoteWithClones(): {
    dir: string;
    bare: string;
    clone: string;
    writer: string;
    push: (name: string, body: string) => string;
} {
    const dir = scratchDir('oculus-autofetch-');
    const bare = join(dir, 'bare.git');
    mkdirSync(bare);
    gitText(bare, 'init', '--bare', '--initial-branch=main');
    gitText(dir, 'clone', bare, 'writer');
    const writer = join(dir, 'writer');
    gitText(writer, 'checkout', '-B', 'main');
    const push = (name: string, body: string): string => {
        put(writer, name, body);
        gitText(writer, 'add', '.');
        gitText(writer, 'commit', '-m', `write ${name}`);
        gitText(writer, 'push', 'origin', 'main');
        return gitText(writer, 'rev-parse', 'HEAD').trim();
    };
    push('first.txt', 'one\n');
    gitText(writer, 'push', 'origin', 'main:refs/heads/gone');
    gitText(dir, 'clone', bare, 'clone');
    return { dir, bare, clone: join(dir, 'clone'), writer, push };
}

describe('a real fetch through the module', () => {
    it('moves origin/main and prunes a branch deleted on the remote', async () => {
        const held = remoteWithClones();
        const before = gitText(held.clone, 'rev-parse', 'origin/main').trim();
        const newest = held.push('second.txt', 'two\n');
        gitText(held.writer, 'push', 'origin', ':gone');
        expect(newest).not.toBe(before);
        expect(gitText(held.clone, 'branch', '-r')).toContain('origin/gone');

        const rigged = rig('real');
        rigged.key(1);
        rigged.repos({ [held.clone]: repo(held.clone) });
        await rigged.look();
        await vi.waitFor(() => expect(rigged.calls).toContain(`refresh ${held.clone}`), {
            timeout: 20000
        });
        expect(gitText(held.clone, 'rev-parse', 'origin/main').trim()).toBe(newest);
        expect(gitText(held.clone, 'branch', '-r')).not.toContain('origin/gone');
        expect(rigged.lines).toEqual([]);
        rigged.watcher.close();
    });

    it('fetches a clone whose path holds a space', async () => {
        const held = remoteWithClones();
        gitText(held.dir, 'clone', held.bare, 'a clone with a space');
        const spaced = join(held.dir, 'a clone with a space');
        const newest = held.push('third.txt', 'three\n');

        const rigged = rig('real');
        rigged.key(1);
        rigged.repos({ [spaced]: repo(spaced) });
        await rigged.look();
        await vi.waitFor(() => expect(rigged.calls).toContain(`refresh ${spaced}`), {
            timeout: 20000
        });
        expect(gitText(spaced, 'rev-parse', 'origin/main').trim()).toBe(newest);
        expect(rigged.lines).toEqual([]);
        rigged.watcher.close();
    });
});

describe('the ssh command of an unattended fetch', () => {
    const BATCH = '-o BatchMode=yes';

    it('keeps the environment command, else the repository command, else ssh, and appends BatchMode', () => {
        expect(unattendedSsh({ GIT_SSH_COMMAND: 'ssh -p 2222' }, 'ssh -i k')).toBe(
            `ssh -p 2222 ${BATCH}`
        );
        expect(unattendedSsh({}, 'ssh -i k')).toBe(`ssh -i k ${BATCH}`);
        expect(unattendedSsh({}, '')).toBe(`ssh ${BATCH}`);
        expect(unattendedSsh({ GIT_SSH_COMMAND: '' }, '')).toBe(`ssh ${BATCH}`);
    });

    it('adds nothing for ssh when only the older GIT_SSH program names it', () => {
        expect(unattendedSsh({ GIT_SSH: '/bin/jump' }, '')).toBeUndefined();
        // git reads the configured command before GIT_SSH, so a configured command still gets it.
        expect(unattendedSsh({ GIT_SSH: '/bin/jump' }, 'ssh -i k')).toBe(`ssh -i k ${BATCH}`);
    });
});

describe('the environment of an unattended fetch', () => {
    const NAMES = [
        'GIT_TERMINAL_PROMPT',
        'GIT_SSH_COMMAND',
        'GIT_SSH',
        'GIT_CONFIG_GLOBAL',
        'GIT_CONFIG_NOSYSTEM'
    ] as const;
    /** The machine's own git configuration is left out, so only the repository names a command. */
    const ALONE = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };

    /** Runs `during` with exactly the given variables of git's among the process environment. */
    async function withEnv(
        env: Partial<Record<(typeof NAMES)[number], string>>,
        during: () => Promise<unknown>
    ): Promise<void> {
        const saved = NAMES.map((name) => process.env[name]);
        for (const name of NAMES) Reflect.deleteProperty(process.env, name);
        Object.assign(process.env, ALONE, env);
        try {
            await during();
        } finally {
            NAMES.forEach((name, at) => {
                const value = saved[at];
                if (value === undefined) Reflect.deleteProperty(process.env, name);
                else process.env[name] = value;
            });
        }
    }

    /**
     * A clone and a program that records what git gave it and fails: the variables it saw and the
     * arguments it was called with. The program is named ssh so git speaks OpenSSH's options to it.
     */
    function recorder(): { clone: string; program: string; seen: () => string } {
        const held = remoteWithClones();
        const out = join(held.dir, 'seen.txt');
        const program = join(held.dir, 'ssh');
        writeFileSync(
            program,
            `#!/bin/sh\nprintf 'prompt=%s\nssh=%s\nargs=%s\n' "$GIT_TERMINAL_PROMPT" "$GIT_SSH_COMMAND" "$*" > '${out}'\nexit 1\n`,
            { mode: 0o755 }
        );
        gitText(held.clone, 'remote', 'set-url', 'origin', 'ssh://nohost.invalid/repo.git');
        return { clone: held.clone, program, seen: () => readFileSync(out, 'utf8') };
    }

    /** One round of the module over a clone, through its own remotes, fetch and ssh command. */
    async function round(clone: string): Promise<void> {
        const rigged = rig('real');
        rigged.key(1);
        rigged.repos({ [clone]: repo(clone) });
        await rigged.look();
        await vi.waitFor(() => expect(rigged.calls).toContain(`refresh ${clone}`), {
            timeout: 20000
        });
        rigged.watcher.close();
    }

    it('appends BatchMode to the repository command and asks for no password', async () => {
        const held = recorder();
        gitText(held.clone, 'config', 'core.sshCommand', `${held.program} -i /some/key`);
        await withEnv({}, () => round(held.clone));
        const text = held.seen();
        expect(text).toContain('prompt=0\n');
        expect(text).toMatch(/\nargs=-i \/some\/key -o BatchMode=yes /);
    });

    it('appends BatchMode to the command the environment names', async () => {
        const held = recorder();
        await withEnv({ GIT_SSH_COMMAND: held.program }, () => round(held.clone));
        const text = held.seen();
        expect(text).toContain('prompt=0\n');
        expect(text).toMatch(/\nargs=-o BatchMode=yes /);
    });

    it('sets ssh -o BatchMode=yes when neither names a command', async () => {
        const held = remoteWithClones();
        const out = join(held.dir, 'seen.txt');
        const program = join(held.dir, 'upload.sh');
        writeFileSync(
            program,
            `#!/bin/sh\nprintf 'prompt=%s\nssh=%s\n' "$GIT_TERMINAL_PROMPT" "$GIT_SSH_COMMAND" > '${out}'\nexit 1\n`,
            { mode: 0o755 }
        );
        gitText(held.clone, 'config', 'remote.origin.uploadpack', program);
        await withEnv({}, () => round(held.clone));
        expect(readFileSync(out, 'utf8')).toBe('prompt=0\nssh=ssh -o BatchMode=yes\n');
    });

    it('skips a repository whose core.sshCommand cannot be read, says so, and tries again next period', async () => {
        const held = remoteWithClones();
        const away = `${held.clone}-away`;
        renameSync(held.clone, away);
        await withEnv({}, async () => {
            const rigged = rig('listed');
            rigged.key(1);
            rigged.repos({ [held.clone]: repo(held.clone) });
            await rigged.look();
            expect(rigged.lines).toEqual([
                `autofetch: ${held.clone}: core.sshCommand could not be read: ${UNREADABLE}`
            ]);
            expect(rigged.calls).toEqual([`remotes ${held.clone}`]);
            renameSync(away, held.clone);
            await rigged.look();
            await vi.waitFor(() => expect(rigged.calls).toContain(`refresh ${held.clone}`), {
                timeout: 20000
            });
            expect(rigged.lines).toHaveLength(1);
            rigged.watcher.close();
        });
    });

    it('does not read core.sshCommand when the environment names the command', async () => {
        const held = remoteWithClones();
        renameSync(held.clone, `${held.clone}-away`);
        await withEnv({ GIT_SSH_COMMAND: 'ssh' }, async () => {
            const rigged = rig('listed');
            rigged.key(1);
            rigged.repos({ [held.clone]: repo(held.clone) });
            await rigged.look();
            await vi.waitFor(() => expect(rigged.calls).toContain(`refresh ${held.clone}`), {
                timeout: 20000
            });
            expect(rigged.lines.join('\n')).not.toContain('could not be read');
            rigged.watcher.close();
        });
    });

    it('runs a pressed Fetch with the repository command as it is', async () => {
        const held = recorder();
        gitText(held.clone, 'config', 'core.sshCommand', `${held.program} -i /some/key`);
        await withEnv({}, () => fetchIn(held.clone));
        const text = held.seen();
        expect(text).toContain('prompt=\n');
        expect(text).toContain('ssh=\n');
        expect(text).toMatch(/\nargs=-i \/some\/key /);
        expect(text).not.toContain('BatchMode');
    });
});

describe('the source rule', () => {
    const SOURCE = resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../../src/lib/server/root/watch/autofetch.ts'
    );

    it('audits the source: no process of its own, only fetchIn and remoteNames from the git folder, only sshCommand from the core git module', () => {
        const source = readFileSync(SOURCE, 'utf8');
        expect(source).not.toContain('node:child_process');
        expect(source).not.toMatch(/\brun\(/);
        expect(source).not.toContain('execFile');
        expect(source).not.toContain('spawn');
        const gitImports = [...source.matchAll(/from '([^']*\/git\/[^']*)'/g)].map(
            (found) => found[1]
        );
        expect(gitImports.length).toBeGreaterThan(0);
        for (const path of gitImports) expect(path).toMatch(/\/git-write\.ts$/);
        const names = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*git-write\.ts'/g)]
            .flatMap((found) => found[1].split(','))
            .map((name) => name.trim())
            .filter((name) => name !== '');
        expect(names.sort()).toEqual(['fetchIn', 'remoteNames']);
        // Every import of core/git.ts, a type, namespace or default import among them, is the one
        // named read.
        const coreImports = [
            ...source.matchAll(/import\s+([^;]*?)\s*from\s*'[^']*core\/git\.ts'/g)
        ].map((found) => found[1].replace(/\s+/g, ' ').trim());
        expect(coreImports).toEqual(['{ sshCommand }']);
    });
});
