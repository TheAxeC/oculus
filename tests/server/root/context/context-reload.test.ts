// Layer 2, server tests. The machine's own file, config/local.yml, is read again whenever it
// changes: every key is held at once, the watchers built from a changed key are built again, a
// changed port moves the server, and a file that does not read keeps the values in force.
//
// Each case writes a local.yml of its own in a scratch engine and drives the watch's call, so the
// real reader parses the file; the watchers, the pollers and the port mover are recorders. No case
// binds a port.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { describe, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    createServerContext,
    hostInfo,
    type ContextDependencies
} from '../../../../src/lib/server/root/context.ts';
import { type PortMove } from '../../../../src/lib/server/root/mover.ts';
import { LOCAL_KEYS, localDefaults } from '../../../../src/lib/data/sources/config/local.ts';
import { target } from '../../../../src/lib/server/edit/writes.ts';
import { changedKeys } from '../../../../src/lib/server/root/watch/local.ts';
import { noop, noopAsync } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { inertConfig, inertDependencies, inertHpc } from '../context-fixture.ts';

type Name = 'portfolio' | 'sessions' | 'usageRefresh' | 'usage' | 'git' | 'autofetch' | 'bookmarks';
const NAMES: Name[] = [
    'portfolio',
    'sessions',
    'usageRefresh',
    'usage',
    'git',
    'autofetch',
    'bookmarks'
];

/** The port a started case's server listens on, and one it may be asked to move to. */
const OLD = 8791;
const NEW = 8793;

/** The keys of a local.yml a case writes, as the file spells them. */
type Values = Record<string, unknown>;

/**
 * A context over recording watchers and a scratch engine whose local.yml the case rewrites. The
 * recorders keep the options each watcher was built with and one line per start and close, so a
 * case reads which watcher was built again and in what order.
 */
function started(initial: Values, move?: PortMove, docs = false) {
    const engine = scratchDir('oculus-reload-');
    mkdirSync(join(engine, 'config'));
    const file = join(engine, 'config', 'local.yml');
    const events: string[] = [];
    const options: Record<Name, unknown[]> = {
        portfolio: [],
        sessions: [],
        usageRefresh: [],
        usage: [],
        git: [],
        autofetch: [],
        bookmarks: []
    };
    const states: (() => unknown)[] = [];
    const gitRefreshes: ReturnType<typeof vi.fn>[] = [];
    const changed: (() => void)[] = [];
    const localClosed: string[] = [];
    const setters = { hpc: vi.fn() };
    const hub = new Hub();
    /** Which watchers throw the next time they are built, and whether the config read does. */
    const faults = { watchers: new Set<Name>(), config: false };

    const begin = (name: Name, given: unknown): (() => void) => {
        if (faults.watchers.delete(name)) throw new Error(`${name} cannot start`);
        options[name].push(given);
        const index = options[name].length;
        events.push(`start ${name} ${index}`);
        return () => {
            events.push(`close ${name} ${index}`);
        };
    };
    const inert = inertDependencies(setters);
    delete inert.loadLocal;
    const dependencies: Partial<ContextDependencies> = {
        ...inert,
        createHub: () => hub,
        loadConfig: () => {
            if (faults.config) throw new Error('config unreadable');
            return {
                config: {
                    ...inertConfig(),
                    ...(docs
                        ? { docs: [{ label: 'Notes', path: 'notes.md', group: 'research' }] }
                        : {})
                },
                findings: []
            };
        },
        watchPortfolio: (_hub, given) => ({ close: begin('portfolio', given) }),
        watchSessions: (_hub, given) => ({ onChange: () => noop, close: begin('sessions', given) }),
        watchGit: (_hub, given) => {
            const refresh = vi.fn();
            gitRefreshes.push(refresh);
            return { refresh, close: begin('git', given) };
        },
        watchAutofetch: (_hub, given) => ({ close: begin('autofetch', given) }),
        watchBookmarks: (_hub, given) => ({ close: begin('bookmarks', given) }),
        watchUsageRefresh: (given) => {
            const state = () => ({
                state: 'running' as const,
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            });
            states.push(state);
            return {
                ready: Promise.resolve(),
                refresh: () => Promise.resolve(true),
                refreshAll: noopAsync,
                set: noop,
                state,
                close: begin('usageRefresh', given)
            };
        },
        watchUsage: (_hub, given) => ({
            refresh: noopAsync,
            setTiers: noop,
            close: begin('usage', given)
        }),
        watchLocal: (_engine, onChange) => {
            changed.push(onChange);
            return {
                close: () => {
                    localClosed.push('local');
                }
            };
        }
    };

    const write = (values: Values): void => {
        writeFileSync(file, stringify(values));
    };
    write(initial);
    const context = createServerContext(engine, dependencies, move);
    const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const begun = events.length;
    return {
        engine,
        file,
        context,
        events,
        options,
        states,
        gitRefreshes,
        setters,
        hub,
        faults,
        write,
        text: (body: string): void => {
            writeFileSync(file, body);
        },
        /** The watch's call, as a write of the file makes it. */
        reload: (): void => {
            changed[0]();
        },
        /** The events since the start. */
        after: (): string[] => events.slice(begun),
        /** The lines printed since the start. */
        lines: (): string[] => said.mock.calls.map((call) => String(call[0])),
        /** How many times each watcher was built, the start included. */
        built: (): Record<Name, number> =>
            Object.fromEntries(NAMES.map((name) => [name, options[name].length])) as Record<
                Name,
                number
            >,
        /** How many times each watcher was closed. */
        closed: (): Record<Name, number> =>
            Object.fromEntries(
                NAMES.map((name) => [
                    name,
                    events.filter((line) => line.startsWith(`close ${name} `)).length
                ])
            ) as Record<Name, number>,
        last: (name: Name): Record<string, unknown> =>
            options[name].at(-1) as Record<string, unknown>,
        restore: (): void => {
            said.mockRestore();
        }
    };
}

/** What a case holds still: every watcher built once. */
const ONCE: Record<Name, number> = {
    portfolio: 1,
    sessions: 1,
    usageRefresh: 1,
    usage: 1,
    git: 1,
    autofetch: 1,
    bookmarks: 1
};

/** Run a case over a started context, closed and its stderr spy restored after it. */
async function inRun(
    initial: Values,
    body: (run: ReturnType<typeof started>) => void | Promise<void>,
    move?: PortMove,
    docs = false
): Promise<void> {
    const run = started(initial, move, docs);
    try {
        await body(run);
    } finally {
        run.context.close();
        run.restore();
    }
}

/** A base local.yml: hub, port, one Claude account. */
function base(scratch: string, extra: Values = {}): Values {
    return {
        hub: join(scratch, 'hub-a'),
        port: OLD,
        accounts: [{ tool: 'claude', dir: join(scratch, 'claude-a'), label: 'claude' }],
        ...extra
    };
}

/** A hub folder holding the one document the configuration names, so it raises no finding. */
function hubWithNotes(scratch: string, name: string): string {
    const folder = join(scratch, name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'notes.md'), '# Notes\n');
    return folder;
}

/** The position of a line among the events, which a case reads for the order of two starts. */
function at(events: string[], line: string): number {
    const found = events.indexOf(line);
    expect(found, `${line} in ${events.join(' | ')}`).toBeGreaterThanOrEqual(0);
    return found;
}

/** Let the mover's promise and the context's continuation after it run. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
}

describe('local.yml read again whenever it changes', () => {
    it('builds the portfolio, the git watcher, the auto fetch and the usage refresh again over a hub written again, and says the documents again', () => {
        const scratch = scratchDir('oculus-reload-hubs-');
        const first = hubWithNotes(scratch, 'hub-a');
        const second = join(scratch, 'hub-b');
        mkdirSync(second);
        return inRun(
            base(scratch, { hub: first }),
            (run) => {
                const held = run.context.local;
                run.write(base(scratch, { hub: second }));
                run.reload();

                expect(run.built()).toEqual({
                    ...ONCE,
                    portfolio: 2,
                    usageRefresh: 2,
                    usage: 2,
                    git: 2,
                    autofetch: 2
                });
                expect(run.closed()).toEqual({
                    ...{ portfolio: 1, sessions: 0, usageRefresh: 1, usage: 1 },
                    ...{ git: 1, autofetch: 1, bookmarks: 0 }
                });
                expect(run.last('portfolio').hub).toBe(second);
                expect(run.last('git').always).toBe(second);
                expect(run.last('usageRefresh').hub).toBe(second);
                // The old one is closed before the new one starts, and a watcher is built from the
                // ones it is built from.
                const events = run.after();
                expect(at(events, 'close portfolio 1')).toBeLessThan(
                    at(events, 'start portfolio 2')
                );
                expect(at(events, 'close git 1')).toBeLessThan(at(events, 'start git 2'));
                expect(at(events, 'start git 2')).toBeLessThan(at(events, 'start autofetch 2'));
                expect(at(events, 'start usageRefresh 2')).toBeLessThan(
                    at(events, 'start usage 2')
                );
                // The routes read the context's own object, held in place with the new values, and
                // a write and a terminal start take the hub from it.
                expect(run.context.local).toBe(held);
                expect(run.context.local.hub).toBe(second);
                expect(target(run.engine, inertConfig()).hub).toBe(second);
                expect(run.lines()).toEqual([
                    expect.stringContaining(`no file at ${join(second, 'notes.md')}`)
                ]);
            },
            undefined,
            true
        );
    });

    it('reads the new accounts for the sessions, and builds the usage refresh and the usage watcher again with them', () => {
        const scratch = scratchDir('oculus-reload-accounts-');
        return inRun(base(scratch), (run) => {
            const dir = join(scratch, 'claude-b');
            run.write(base(scratch, { accounts: [{ tool: 'claude', dir, label: 'second' }] }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, sessions: 2, usageRefresh: 2, usage: 2 });
            expect(run.closed()).toEqual({
                ...{ portfolio: 0, sessions: 1, usageRefresh: 1, usage: 1 },
                ...{ git: 0, autofetch: 0, bookmarks: 0 }
            });
            expect(run.last('sessions').stores).toEqual([join(dir, 'projects')]);
            expect(run.last('usageRefresh').accounts).toEqual([
                { tool: 'claude', dir, label: 'second' }
            ]);
            expect(run.last('usage').accounts).toEqual([{ tool: 'claude', dir, label: 'second' }]);
            const events = run.after();
            expect(at(events, 'start sessions 2')).toBeLessThan(at(events, 'start usage 2'));
            expect(at(events, 'start usageRefresh 2')).toBeLessThan(at(events, 'start usage 2'));
        });
    });

    it('builds the sessions watcher again over a sessions_overrides file written again, and the usage watcher with it, and no other', () => {
        const scratch = scratchDir('oculus-reload-overrides-');
        return inRun(base(scratch), (run) => {
            const overrides = join(scratch, 'sessions.json');
            const cache = join(scratch, 'cache.json');
            run.write(base(scratch, { sessions_overrides: overrides }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, sessions: 2, usage: 2 });
            expect(run.last('sessions').overrides).toBe(overrides);

            run.write(base(scratch, { sessions_overrides: overrides, sessions_cache: cache }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, sessions: 3, usage: 3 });
            expect(run.last('sessions').cache).toBe(cache);
        });
    });

    it('builds the git watcher and the auto fetch again over a workspaces file written again', () => {
        const scratch = scratchDir('oculus-reload-workspaces-');
        return inRun(base(scratch), (run) => {
            const workspaces = join(scratch, 'workspaces.json');
            run.write(base(scratch, { workspaces }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, git: 2, autofetch: 2 });
            expect(run.last('git').workspacesFile).toBe(workspaces);
            expect(run.context.local.workspaces).toBe(workspaces);
            // The timer asks the git watcher now in force to look again, not the one closed.
            const refresh = run.last('autofetch').refresh as (root: string) => void;
            refresh('/some/root');
            expect(run.gitRefreshes[1]).toHaveBeenCalledExactlyOnceWith('/some/root');
            expect(run.gitRefreshes[0]).not.toHaveBeenCalled();
            run.context.git.refresh('/via/context');
            expect(run.gitRefreshes[1]).toHaveBeenLastCalledWith('/via/context');
        });
    });

    it('builds the bookmarks watcher again over a bookmarks file written again, and no other', () => {
        const scratch = scratchDir('oculus-reload-bookmarks-');
        return inRun(base(scratch), (run) => {
            const bookmarks = join(scratch, 'bookmarks.yml');
            run.write(base(scratch, { bookmarks }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, bookmarks: 2 });
            expect(run.closed().bookmarks).toBe(1);
            expect(run.last('bookmarks').file).toBe(bookmarks);
        });
    });

    it('builds the usage refresh and the usage watcher again with a claude_bin written again, the watcher holding the new refresh', () => {
        const scratch = scratchDir('oculus-reload-claude-');
        return inRun(base(scratch), (run) => {
            run.write(base(scratch, { claude_bin: '/opt/claude-next' }));
            run.reload();

            expect(run.built()).toEqual({ ...ONCE, usageRefresh: 2, usage: 2 });
            expect(run.last('usageRefresh').claudeBin).toBe('/opt/claude-next');
            expect(run.last('usage').refresherFor).toBe(run.states[1]);
            expect(run.context.local.claudeBin).toBe('/opt/claude-next');
        });
    });

    it('hands the next https address to the program an open_bin written again names', async () => {
        const scratch = scratchDir('oculus-reload-open-');
        const recorded = join(scratch, 'opened.txt');
        const recorder = join(scratch, 'recorder');
        writeFileSync(recorder, `#!/bin/sh\nprintf '%s' "$1" > ${JSON.stringify(recorded)}\n`, {
            mode: 0o755
        });
        await inRun(base(scratch), async (run) => {
            const before = run.context.opener;
            run.write(base(scratch, { open_bin: recorder }));
            run.reload();

            expect(run.context.opener).not.toBe(before);
            expect(run.built()).toEqual(ONCE);
            await run.context.opener('https://accounts.example.invalid/consent?state=two');
            expect(readFileSync(recorded, 'utf8')).toBe(
                'https://accounts.example.invalid/consent?state=two'
            );
        });
    });

    it('hands the poller the host an hpc_host written names, and the sentence for no host when it is removed', () => {
        const scratch = scratchDir('oculus-reload-hpc-');
        return inRun(base(scratch), (run) => {
            run.write(base(scratch, { hpc_host: 'login-two' }));
            run.reload();
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(inertHpc('login-two'));
            expect(run.built()).toEqual(ONCE);

            run.write(base(scratch));
            run.reload();
            expect(run.setters.hpc).toHaveBeenCalledTimes(2);
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ host: '', missing: 'not read yet' })
            );
        });
    });

    it('reads a notes and a changes path written again at the next request and builds nothing again', () => {
        const scratch = scratchDir('oculus-reload-paths-');
        return inRun(base(scratch), (run) => {
            run.write(
                base(scratch, {
                    notes: join(scratch, 'notes'),
                    changes: join(scratch, 'changes.jsonl')
                })
            );
            run.reload();

            expect(run.context.local.notes).toBe(join(scratch, 'notes'));
            expect(run.context.local.changes).toBe(join(scratch, 'changes.jsonl'));
            expect(run.built()).toEqual(ONCE);
            expect(run.after()).toEqual([]);
        });
    });

    it('keeps every value in force and says why once for a file that does not read, and takes a file that reads again', () => {
        const scratch = scratchDir('oculus-reload-bad-');
        return inRun(base(scratch), (run) => {
            const held = { ...run.context.local };
            run.text('port: eight\n');
            run.reload();
            run.reload();

            expect(run.context.local).toEqual(held);
            expect(run.built()).toEqual(ONCE);
            expect(run.lines()).toEqual([
                `the machine's own configuration is not read again: ${run.file}: port must be an integer`
            ]);

            // The same fault again says nothing; a file that reads clears what was said.
            const next = join(scratch, 'hub-b');
            run.write(base(scratch, { hub: next }));
            run.reload();
            expect(run.context.local.hub).toBe(next);
            expect(run.built().portfolio).toBe(2);

            run.text('port: eight\n');
            run.reload();
            expect(run.lines()).toHaveLength(2);
            expect(run.context.local.hub).toBe(next);
        });
    });

    it('builds each watcher once for one edit that changes the hub and the accounts', () => {
        const scratch = scratchDir('oculus-reload-both-');
        return inRun(base(scratch), (run) => {
            run.write(
                base(scratch, {
                    hub: join(scratch, 'hub-b'),
                    accounts: [{ tool: 'claude', dir: join(scratch, 'claude-b'), label: 'b' }]
                })
            );
            run.reload();

            expect(run.built()).toEqual({
                ...ONCE,
                portfolio: 2,
                sessions: 2,
                usageRefresh: 2,
                usage: 2,
                git: 2,
                autofetch: 2
            });
            expect(run.closed()).toEqual({
                ...{ portfolio: 1, sessions: 1, usageRefresh: 1, usage: 1 },
                ...{ git: 1, autofetch: 1, bookmarks: 0 }
            });
        });
    });

    it('builds nothing and says nothing for an edit after the context is closed', async () => {
        const scratch = scratchDir('oculus-reload-closed-');
        await inRun(base(scratch), (run) => {
            run.context.close();
            const events = run.events.length;
            const lines = run.lines().length;
            run.write(base(scratch, { hub: join(scratch, 'hub-b'), port: NEW }));
            run.reload();
            run.text('port: eight\n');
            run.reload();

            expect(run.events).toHaveLength(events);
            expect(run.lines()).toHaveLength(lines);
            expect(run.context.local.hub).toBe(join(scratch, 'hub-a'));
        });
    });

    it('builds nothing again for a file whose values equal the ones in force (an audit)', () => {
        const scratch = scratchDir('oculus-reload-equal-');
        return inRun(base(scratch), (run) => {
            run.reload();
            run.write(base(scratch));
            run.reload();

            expect(run.built()).toEqual(ONCE);
            expect(run.after()).toEqual([]);
            expect(run.setters.hpc).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([]);
        });
    });
});

describe('local.yml port written again', () => {
    /** A mover whose answer the case settles, and what it was asked. */
    function mover(answer: string | null = null) {
        const asked: number[] = [];
        const move = vi.fn<PortMove>((port, announce) => {
            asked.push(port);
            announce();
            return Promise.resolve(answer);
        });
        return { move, asked };
    }

    it('publishes the new address once the server listens on it, and holds the same context and token', async () => {
        const scratch = scratchDir('oculus-reload-port-');
        const { move, asked } = mover();
        await inRun(
            base(scratch),
            async (run) => {
                const token = run.context.token;
                run.write(base(scratch, { port: NEW }));
                run.reload();
                await settle();

                expect(asked).toEqual([NEW]);
                expect(run.context.host).toEqual(hostInfo(NEW));
                expect(run.context.local.port).toBe(NEW);
                expect(run.context.token).toBe(token);
                expect(run.built().portfolio).toBe(2);
                expect(run.last('portfolio').host).toBe(run.context.host);
                // The portfolio carries the new address when the mover announces it, which it does
                // once the server listens on the new port, over the sockets that stayed open.
                expect(run.after()).toEqual(['close portfolio 1', 'start portfolio 2']);
                expect(run.lines()).toEqual([]);
            },
            move
        );
    });

    it('keeps the server and says why once for a port in use, and tries again when the file is written again', async () => {
        const scratch = scratchDir('oculus-reload-port-busy-');
        const asked: number[] = [];
        let answer: string | null = 'address already in use';
        const move = vi.fn<PortMove>((port, announce) => {
            asked.push(port);
            if (answer === null) announce();
            return Promise.resolve(answer);
        });
        await inRun(
            base(scratch),
            async (run) => {
                run.write(base(scratch, { port: NEW }));
                run.reload();
                await settle();
                run.reload();
                await settle();

                const sentence = `local.yml: port ${NEW} cannot be used (address already in use); the server stays on ${OLD}`;
                expect(run.lines()).toEqual([sentence]);
                expect(run.context.host).toEqual(hostInfo(OLD));
                expect(run.context.local.port).toBe(OLD);
                expect(run.built()).toEqual(ONCE);
                expect(asked).toEqual([NEW, NEW]);

                answer = null;
                run.reload();
                await settle();
                expect(run.context.local.port).toBe(NEW);
                expect(run.context.host).toEqual(hostInfo(NEW));
            },
            move
        );
    });

    it('refuses 8787 and a port outside 1 to 65535 without asking the mover', async () => {
        const scratch = scratchDir('oculus-reload-port-reserved-');
        const { move } = mover();
        await inRun(
            base(scratch),
            async (run) => {
                for (const port of [8787, 0, 65536, -1]) {
                    run.write(base(scratch, { port }));
                    run.reload();
                    await settle();
                }

                expect(move).not.toHaveBeenCalled();
                expect(run.lines()).toEqual([
                    `local.yml: port 8787 cannot be used (it belongs to the cockpit); the server stays on ${OLD}`,
                    `local.yml: port 0 cannot be used (a port is a whole number from 1 to 65535); the server stays on ${OLD}`,
                    `local.yml: port 65536 cannot be used (a port is a whole number from 1 to 65535); the server stays on ${OLD}`,
                    `local.yml: port -1 cannot be used (a port is a whole number from 1 to 65535); the server stays on ${OLD}`
                ]);
                expect(run.context.host).toEqual(hostInfo(OLD));
                expect(run.built()).toEqual(ONCE);
            },
            move
        );
    });

    it('takes the later port when a second edit arrives while the first move is in flight', async () => {
        const scratch = scratchDir('oculus-reload-port-later-');
        const pending: { port: number; done: () => void }[] = [];
        const move = vi.fn<PortMove>(
            (port, announce) =>
                new Promise<string | null>((resolve) => {
                    pending.push({
                        port,
                        done: () => {
                            announce();
                            resolve(null);
                        }
                    });
                })
        );
        await inRun(
            base(scratch),
            async (run) => {
                run.write(base(scratch, { port: NEW }));
                run.reload();
                run.write(base(scratch, { port: NEW + 1 }));
                run.reload();
                await settle();
                // One move at a time: the second port is asked only after the first settled.
                expect(pending.map((one) => one.port)).toEqual([NEW]);

                pending[0].done();
                await settle();
                expect(pending.map((one) => one.port)).toEqual([NEW, NEW + 1]);

                pending[1].done();
                await settle();
                expect(run.context.local.port).toBe(NEW + 1);
                expect(run.context.host).toEqual(hostInfo(NEW + 1));
                expect(run.lines()).toEqual([]);
            },
            move
        );
    });

    it('changes nothing and says nothing when the context is closed while the move is in flight', async () => {
        const scratch = scratchDir('oculus-reload-port-after-close-');
        let finish: () => void = noop;
        let told = 0;
        const move = vi.fn<PortMove>(
            (_port, announce) =>
                new Promise<string | null>((resolve) => {
                    finish = () => {
                        announce();
                        told += 1;
                        resolve(null);
                    };
                })
        );
        await inRun(
            base(scratch),
            async (run) => {
                run.write(base(scratch, { port: NEW }));
                run.reload();
                await settle();
                run.context.close();
                const events = run.events.length;
                finish();
                await settle();

                expect(told).toBe(1);
                expect(run.events).toHaveLength(events);
                expect(run.context.host).toEqual(hostInfo(OLD));
                expect(run.lines()).toEqual([]);
            },
            move
        );
    });

    it('keeps the server and says so once when this process cannot move its port', async () => {
        const scratch = scratchDir('oculus-reload-port-unmovable-');
        await inRun(base(scratch), async (run) => {
            run.write(base(scratch, { port: NEW }));
            run.reload();
            run.reload();
            await settle();

            expect(run.context.local.port).toBe(OLD);
            expect(run.context.host).toEqual(hostInfo(OLD));
            expect(run.lines()).toHaveLength(1);
            expect(run.lines()[0]).toContain(`port ${NEW} cannot be used`);
        });
    });
});

describe('a change that cannot be applied', () => {
    it('says which keys and which watcher once, keeps the value in force, and builds the other watchers', () => {
        const scratch = scratchDir('oculus-reload-throw-');
        const first = join(scratch, 'hub-a');
        const second = join(scratch, 'hub-b');
        const moved = join(scratch, 'bookmarks-b.json');
        return inRun(base(scratch, { hub: first }), (run) => {
            run.faults.watchers.add('usageRefresh');
            run.write(base(scratch, { hub: second, bookmarks: moved }));

            expect(() => run.reload()).not.toThrow();

            const said = run.lines();
            expect(said).toHaveLength(1);
            expect(said[0]).toContain('hub cannot be applied');
            expect(said[0]).toContain('the usageRefresh watcher');
            expect(said[0]).toContain('usageRefresh cannot start');
            expect(run.context.local.hub).toBe(first);
            expect(run.last('portfolio').hub).toBe(first);
            expect(run.last('usageRefresh').hub).toBe(first);
            expect(run.last('git').always).toBe(first);
            expect(run.context.local.bookmarks).toBe(moved);
            expect(run.last('bookmarks').file).toBe(moved);
        });
    });

    it('keeps answering and says why once when the read of the configuration throws', () => {
        const scratch = scratchDir('oculus-reload-throw-config-');
        return inRun(base(scratch, { hub: hubWithNotes(scratch, 'hub-a') }), (run) => {
            run.faults.config = true;
            run.write(base(scratch, { hub: join(scratch, 'hub-b') }));

            expect(() => run.reload()).not.toThrow();

            expect(run.lines()).toEqual([
                'local.yml: a change could not be applied (config unreadable)'
            ]);
        });
    });

    it('says why once and moves again for a later port when the move throws', async () => {
        const scratch = scratchDir('oculus-reload-throw-move-');
        const move = vi.fn<PortMove>((port, announce) => {
            if (port === NEW) return Promise.reject(new Error('listen exploded'));
            announce();
            return Promise.resolve(null);
        });
        await inRun(
            base(scratch),
            async (run) => {
                run.write(base(scratch, { port: NEW }));
                run.reload();
                await settle();

                expect(run.lines()).toEqual([
                    `local.yml: port ${NEW} was not applied (listen exploded); the server stays on ${OLD}`
                ]);
                expect(run.context.local.port).toBe(OLD);

                run.write(base(scratch, { port: NEW + 1 }));
                run.reload();
                await settle();

                expect(run.context.local.port).toBe(NEW + 1);
                expect(run.lines()).toHaveLength(1);
            },
            move
        );
    });
});

describe('the keys local.yml may carry', () => {
    it.each(LOCAL_KEYS)('reports %s when its value changes', (key) => {
        const field = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
        const held = localDefaults('/engine');
        const next = { ...held, [field]: 'another value' };

        expect(changedKeys(held, next)).toEqual([field]);
    });
});

// A refresh cadence outside 1 to 35791 stops the context at start-up, with the sentence naming the
// key, after the portfolio and the sessions watchers began and before the refresher or the usage
// watcher is built.
describe('ServerContext with a refresh cadence outside 1 to 35791', () => {
    const sentence = 'config/behavior.yml: usage_refresh_min must be a number from 1 to 35791';

    /**
     * The inert dependencies with the refresh cadence 0 and counting watchers, and the stub that
     * stands in for the refresher when the case does not run the real one.
     */
    function replaced(realRefresher: boolean) {
        const portfolio = vi.fn(() => ({ close: noop }));
        const sessions = vi.fn(() => ({ onChange: () => noop, close: noop }));
        const usage = vi.fn(() => ({ refresh: noopAsync, setTiers: noop, close: noop }));
        const { watchUsageRefresh, loadConfig, ...inert } = inertDependencies();
        const refresher = vi.fn(watchUsageRefresh);
        const dependencies: Partial<ContextDependencies> = {
            ...inert,
            loadConfig: (engine) => {
                if (loadConfig === undefined) throw new Error('no loadConfig to wrap');
                const held = loadConfig(engine);
                return { ...held, config: { ...held.config, usage_refresh_min: 0 } };
            },
            watchPortfolio: portfolio,
            watchSessions: sessions,
            watchUsage: usage,
            ...(realRefresher ? {} : { watchUsageRefresh: refresher })
        };
        return { dependencies, portfolio, sessions, usage, refresher };
    }

    it('throws the cadence sentence at start-up, after the portfolio and the sessions watch', () => {
        const held = replaced(true);
        expect(() => createServerContext('/engine', held.dependencies)).toThrow(sentence);
        expect(held.portfolio).toHaveBeenCalledTimes(1);
        expect(held.sessions).toHaveBeenCalledTimes(1);
        expect(held.usage).not.toHaveBeenCalled();
    });

    it('throws the same sentence before a replaced refresher is started', () => {
        const held = replaced(false);
        expect(() => createServerContext('/engine', held.dependencies)).toThrow(sentence);
        expect(held.refresher).not.toHaveBeenCalled();
    });
});
