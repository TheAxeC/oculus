// Layer 2, server tests. ServerContext constructs each dependency once, closes each owner once,
// carries its token, and reports a missing raw-request carrier clearly.

import { readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { textCatalog, type LocalConfig } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    carryServerContext,
    createServerContext,
    serverContext,
    type ContextDependencies,
    type OculusRequest
} from '../../../../src/lib/server/root/context.ts';
import { Terminals } from '../../../../src/lib/server/machine/pty/channel.ts';
import { macOpenAddress } from '../../../../src/lib/server/files/open.ts';
import { watchAutofetch as builtAutofetch } from '../../../../src/lib/server/root/watch/autofetch.ts';
import { noop, noopAsync } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { driver, inertConfig, inertDependencies } from '../context-fixture.ts';

// The module as it is, except that its calls are recorded, so a case can read which constructor a
// context uses when it is handed none.
vi.mock('../../../../src/lib/server/root/watch/autofetch.ts', async (original) => {
    const actual =
        await original<typeof import('../../../../src/lib/server/root/watch/autofetch.ts')>();
    return { ...actual, watchAutofetch: vi.fn(actual.watchAutofetch) };
});

describe('ServerContext', () => {
    it('builds and closes each process-owned object once and carries its token', () => {
        const closes = Array.from({ length: 13 }, () => vi.fn());
        const hub = new Hub();
        const merge = vi.spyOn(hub, 'merge');
        const terminals = new Terminals(hub, { driver: driver(closes[6]), poll: 0 });
        const createHub = vi.fn(() => hub);
        const createTerminals = vi.fn(() => terminals);
        const watchPortfolio = vi.fn<ContextDependencies['watchPortfolio']>(() => ({
            close: closes[0]
        }));
        const watchSessions = vi.fn((_hub: Hub, _options: unknown) => ({
            onChange: vi.fn(() => noop),
            close: closes[1]
        }));
        const watchGit = vi.fn((_hub: Hub, _options: unknown) => ({
            refresh: vi.fn(),
            close: closes[2]
        }));
        const watchAutofetch = vi.fn<ContextDependencies['watchAutofetch']>(() => ({
            close: closes[11]
        }));
        const watchBookmarks = vi.fn<ContextDependencies['watchBookmarks']>(() => ({
            close: closes[9]
        }));
        const watchHpc = vi.fn<ContextDependencies['watchHpc']>(() => ({
            refresh: vi.fn(noopAsync),
            set: noop,
            close: closes[3]
        }));
        const watchProcesses = vi.fn<ContextDependencies['watchProcesses']>(() => ({
            set: noop,
            setText: noop,
            close: closes[12]
        }));
        const watchUsageRefresh = vi.fn(() => ({
            ready: Promise.resolve(),
            refresh: vi.fn(() => Promise.resolve(true)),
            refreshAll: vi.fn(noopAsync),
            set: noop,
            state: vi.fn(() => ({
                state: 'running' as const,
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            })),
            close: closes[4]
        }));
        const watchUsage = vi.fn(() => ({
            refresh: vi.fn(noopAsync),
            setTiers: noop,
            close: closes[5]
        }));
        const watchCalendar = vi.fn<ContextDependencies['watchCalendar']>(() => ({
            refresh: vi.fn(noopAsync),
            setAccounts: noop,
            setSettings: noop,
            setWords: noop,
            close: closes[7]
        }));
        const watchMail = vi.fn<ContextDependencies['watchMail']>(() => ({
            refresh: vi.fn(noopAsync),
            republish: noop,
            setAccounts: noop,
            setSettings: noop,
            setWords: noop,
            close: closes[8]
        }));
        const watchLocal = vi.fn<ContextDependencies['watchLocal']>(() => ({ close: closes[10] }));
        const loadConfig = vi.fn(() => ({
            config: { ...inertConfig(), glyphs: { pin: 'P' }, icons: { pin: 'pin' } },
            findings: []
        }));
        const context = createServerContext('/engine', {
            loadLocal: vi.fn(() => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                bookmarks: '/machine/.oculus/bookmarks.yml',
                accounts: [
                    { tool: 'claude' as const, dir: '/machine/.claude', label: 'claude' },
                    { tool: 'claude' as const, dir: '/machine/.claude-work', label: 'work' },
                    { tool: 'codex' as const, dir: '/machine/.codex', label: 'codex' }
                ],
                calendars: [],
                mail: []
            })),
            loadConfig,
            mintToken: vi.fn(() => 'context-token'),
            createHub,
            createTerminals,
            watchPortfolio,
            watchSessions,
            watchGit,
            watchAutofetch,
            watchBookmarks,
            watchHpc,
            watchProcesses,
            watchCalendar,
            watchMail,
            watchLocal,
            watchUsageRefresh,
            watchUsage
        });

        expect(merge).toHaveBeenCalledWith('files', expect.any(Function));
        expect(context.token).toBe('context-token');
        for (const built of [
            createHub,
            createTerminals,
            watchPortfolio,
            watchSessions,
            watchGit,
            watchAutofetch,
            watchBookmarks,
            watchHpc,
            watchProcesses,
            watchCalendar,
            watchMail,
            watchLocal,
            watchUsageRefresh,
            watchUsage
        ]) {
            expect(built).toHaveBeenCalledTimes(1);
        }
        // The sessions watcher reads every account local.yml names, so a session of the second
        // Claude account is read from that account's own registry and transcripts.
        expect(watchSessions.mock.calls[0][1]).toMatchObject({
            stores: ['/machine/.claude/projects', '/machine/.claude-work/projects'],
            registries: ['/machine/.claude/sessions', '/machine/.claude-work/sessions'],
            codexStores: ['/machine/.codex/sessions']
        });
        // The bookmarks watcher is given the file this machine's own local.yml names, so a served
        // test run watches its own folder and never the reader's.
        expect(watchBookmarks.mock.calls[0][1]).toEqual({ file: '/machine/.oculus/bookmarks.yml' });
        // The git watcher is given the hub root as well as the channel bus: the hub's own state is
        // on the `git` channel whether or not a session names it, which is what the deposit and the
        // pin controls read.
        expect(watchGit.mock.calls[0][1]).toMatchObject({ always: '/hub' });
        // The roots the git channel carries are read at the call and not off the copy taken here,
        // so a root added to sources.yml while the server runs is watched when the config push
        // follows.
        const read = loadConfig.mock.calls.length;
        const roots = (watchGit.mock.calls[0][1] as { roots: () => string[] }).roots();
        expect(loadConfig.mock.calls.length).toBeGreaterThan(read);
        expect(roots).toContain('/hub');
        // The portfolio watcher is handed the same fold, read at the call as well, and the same
        // workspaces file the git watcher polls; it drops the two fixed keys itself.
        const paths = watchPortfolio.mock.calls[0][1];
        const readBeforePortfolio = loadConfig.mock.calls.length;
        expect(paths.roots().map((one) => one.key)).toEqual(
            expect.arrayContaining(['hub', 'engine'])
        );
        expect(loadConfig.mock.calls.length).toBeGreaterThan(readBeforePortfolio);
        expect(paths.workspacesFile).toBe(
            (watchGit.mock.calls[0][1] as { workspacesFile: string }).workspacesFile
        );
        // One log-path map, two writers: the poller's prewarm fills in what a press has not asked
        // for yet, and the route's log action reads and writes the same object.
        expect(watchHpc.mock.calls[0][1].logPaths).toBe(context.hpcLogPaths);
        // The Processes watcher starts with the pattern list the configuration holds, and counts
        // the projects of the portfolio the hub holds when it reads, not the ones held at start.
        expect(watchProcesses.mock.calls[0][1].patterns).toEqual(['node']);
        expect(watchProcesses.mock.calls[0][1].text).toEqual(textCatalog(inertConfig()));
        const projects = watchProcesses.mock.calls[0][1].deps.projects;
        expect(projects()).toEqual([]);
        hub.publish('portfolio', {
            entities: { projects: { a: { folder: 'projects/active/alpha', title: 'Alpha' } } }
        });
        expect(projects()).toEqual(['/hub/projects/active/alpha']);
        // The calendar poller reads the credential folder the routes read, so the connect action
        // and the poll are always looking at the same files.
        expect(watchCalendar.mock.calls[0][1].dir).toBe(context.calendarDir);
        // The mail poller reads the credential folder and the triage notes the routes read, for the
        // same reason.
        expect(watchMail.mock.calls[0][1].dir).toBe(context.mailDir);
        // The icon drawings are read once here, from the config this context was built with, and
        // the watcher is handed the same holder, so a config push replaces what a page load reads.
        expect(Object.keys(context.icons.set)).toEqual(['pin']);
        expect(context.icons.set.pin).toContain('<svg');
        expect(watchPortfolio.mock.calls[0][1].icons).toBe(context.icons);
        // The machine every config push carries: its own name, and the address it listens at. The
        // context holds the same object, which is what the page load reads off `locals.server`.
        expect(context.host).toEqual({
            name: hostname(),
            address: `http://127.0.0.1:${context.local.port}`
        });
        expect(watchPortfolio.mock.calls[0][1].host).toBe(context.host);

        context.close();
        context.close();
        for (const close of closes) expect(close).toHaveBeenCalledTimes(1);
    });

    it('keeps session rescan signals inside their owning context', () => {
        const rescans: (() => void)[] = [];
        const refreshes = [vi.fn(noopAsync), vi.fn(noopAsync)];
        let usageIndex = 0;
        const replacements: Partial<ContextDependencies> = {
            ...inertDependencies(),
            watchSessions: () => {
                const listeners = new Set<() => void>();
                rescans.push(() => {
                    for (const listener of listeners) listener();
                });
                return {
                    onChange(listener): () => void {
                        listeners.add(listener);
                        return () => {
                            listeners.delete(listener);
                        };
                    },
                    close(): void {
                        listeners.clear();
                    }
                };
            },
            watchUsage: (_hub, options) => {
                const refresh = refreshes[usageIndex++];
                const off = options.onSessionsChange?.(() => void refresh()) ?? noop;
                return { refresh, setTiers: noop, close: off };
            }
        };

        const first = createServerContext('/engine-a', replacements);
        const second = createServerContext('/engine-b', replacements);

        rescans[0]();
        expect(refreshes[0]).toHaveBeenCalledOnce();
        expect(refreshes[1]).not.toHaveBeenCalled();
        expect(first.hpcLogPaths).not.toBe(second.hpcLogPaths);
        expect(first.depositPlans).not.toBe(second.depositPlans);
        expect(first.wallpaper).not.toBe(second.wallpaper);

        first.close();
        second.close();
    });

    it('hands the account lists of a local.yml written again to both pollers and the routes', () => {
        let rows: LocalConfig['mail'] = [];
        const changed: (() => void)[] = [];
        const calendarSet = vi.fn();
        const mailSet = vi.fn();
        const context = createServerContext('/engine', {
            ...inertDependencies(),
            loadLocal: () => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                accounts: [],
                calendars: rows,
                mail: rows,
                mailDir: '/machine/mail'
            }),
            watchCalendar: () => ({
                refresh: noopAsync,
                setAccounts: calendarSet,
                setSettings: noop,
                setWords: noop,
                close: noop
            }),
            watchMail: () => ({
                refresh: noopAsync,
                republish: noop,
                setAccounts: mailSet,
                setSettings: noop,
                setWords: noop,
                close: noop
            }),
            watchLocal: (_engine, onChange) => {
                changed.push(onChange);
                return { close: noop };
            }
        });

        rows = [{ provider: 'google', label: 'work' }];
        changed[0]();

        expect(context.local.calendars).toEqual(rows);
        expect(context.local.mail).toEqual(rows);
        expect(calendarSet).toHaveBeenCalledWith(rows, context.calendarDir);
        expect(mailSet).toHaveBeenCalledWith(rows, '/machine/mail');
        expect(context.mailDir).toBe('/machine/mail');
        context.close();
    });

    it('hands an address to the program open_bin names, and to macOS open when it names none', async () => {
        const dir = scratchDir('oculus-open-bin-');
        const recorded = join(dir, 'opened.txt');
        const recorder = join(dir, 'recorder');
        writeFileSync(recorder, `#!/bin/sh\nprintf '%s' "$1" > ${JSON.stringify(recorded)}\n`, {
            mode: 0o755
        });
        const machine = (openBin?: string): LocalConfig => ({
            hub: '/hub',
            port: 8791,
            claudeBin: 'claude',
            accounts: [],
            calendars: [],
            mail: [],
            ...(openBin === undefined ? {} : { openBin })
        });

        const plain = createServerContext('/engine', {
            ...inertDependencies(),
            loadLocal: () => machine()
        });
        expect(plain.opener).toBe(macOpenAddress);
        plain.close();

        const named = createServerContext('/engine', {
            ...inertDependencies(),
            loadLocal: () => machine(recorder)
        });
        await named.opener('https://accounts.example.invalid/consent?state=one');
        expect(readFileSync(recorded, 'utf8')).toBe(
            'https://accounts.example.invalid/consent?state=one'
        );
        named.close();
    });

    it('stops before building anything when open.program_ext is missing, naming the key', () => {
        const createHub = vi.fn(() => new Hub());
        const build = (): unknown =>
            createServerContext('/engine', {
                loadLocal: vi.fn(() => ({
                    hub: '/hub',
                    port: 8791,
                    claudeBin: 'claude',
                    accounts: [],
                    calendars: [],
                    mail: []
                })),
                loadConfig: vi.fn(() => ({
                    config: {
                        slurm: {
                            resource: 'cluster',
                            days: 2,
                            poll_min: 1,
                            quota_min: 5,
                            prewarm: false
                        },
                        calendar: { poll_min: 15, days_back: 1, days_ahead: 14 },
                        editor: { paint_limit_kb: 64 },
                        mail: { poll_min: 10, per_signal: 25 },
                        usage_tiers: {},
                        usage_refresh_min: 5,
                        usage_refresh_model: 'model',
                        git: { message_model: '', autofetch_minutes: 0 }
                    },
                    findings: []
                })),
                createHub
            });

        expect(build).toThrow('open.program_ext');
        expect(createHub).not.toHaveBeenCalled();
    });

    it('stops before building anything when git.autofetch_minutes is not a whole number', () => {
        const sentence =
            'config/behavior.yml: git.autofetch_minutes must be a whole number of minutes, 0 or more';
        for (const git of [
            { autofetch_minutes: -1 },
            { autofetch_minutes: 1.5 },
            { autofetch_minutes: '5' },
            { autofetch_minutes: null },
            { message_model: '' },
            []
        ]) {
            const createHub = vi.fn(() => new Hub());
            const build = (): unknown =>
                createServerContext('/engine', {
                    ...inertDependencies(),
                    loadConfig: () => ({ config: inertConfig(git), findings: [] }),
                    createHub
                });
            expect(build).toThrow(new Error(sentence));
            expect(createHub).not.toHaveBeenCalled();
        }
    });

    // Revert: leave the `latexFormatting` read out of createServerContext (server/root/context.ts).
    it('stops before building anything when latex.formatter is not a formatter, naming the key', () => {
        const createHub = vi.fn(() => new Hub());
        const config = inertConfig();
        const latex = { ...(config.latex as object), formatter: 'prettier' };
        const build = (): unknown =>
            createServerContext('/engine', {
                ...inertDependencies(),
                loadConfig: () => ({ config: { ...config, latex }, findings: [] }),
                createHub
            });

        expect(build).toThrow(
            new Error(
                'config/behavior.yml: latex.formatter must be one of none, latexindent, tex-fmt, badness'
            )
        );
        expect(createHub).not.toHaveBeenCalled();
    });

    it('starts the auto fetch after the git watcher, hands it the hub and the git refresh, and closes it first', () => {
        const order: string[] = [];
        const refresh = vi.fn();
        const hub = new Hub();
        const autofetch = vi.fn<ContextDependencies['watchAutofetch']>(() => {
            order.push('start autofetch');
            return {
                close: () => {
                    order.push('close autofetch');
                }
            };
        });
        const context = createServerContext('/engine', {
            ...inertDependencies(),
            createHub: () => hub,
            watchGit: () => {
                order.push('start git');
                return {
                    refresh,
                    close: () => {
                        order.push('close git');
                    }
                };
            },
            watchAutofetch: autofetch
        });

        expect(autofetch).toHaveBeenCalledOnce();
        expect(autofetch.mock.calls[0][0]).toBe(hub);
        autofetch.mock.calls[0][1].refresh('/some/root');
        expect(refresh).toHaveBeenCalledExactlyOnceWith('/some/root');
        context.close();
        context.close();
        expect(order).toEqual(['start git', 'start autofetch', 'close autofetch', 'close git']);
    });

    it('builds the auto fetch of server/root/watch/autofetch.ts when it is handed none', () => {
        const inert = inertDependencies();
        delete inert.watchAutofetch;
        const hub = new Hub();
        vi.mocked(builtAutofetch).mockClear();

        const context = createServerContext('/engine', { ...inert, createHub: () => hub });

        expect(builtAutofetch).toHaveBeenCalledOnce();
        expect(vi.mocked(builtAutofetch).mock.calls[0][0]).toBe(hub);
        expect(vi.mocked(builtAutofetch).mock.calls[0][1].refresh).toEqual(expect.any(Function));
        context.close();
    });

    it('reads a carried context and names event.platform.req when it is absent', () => {
        const request = {} as OculusRequest;
        const fixture = { token: 'held' } as unknown as ReturnType<typeof createServerContext>;
        carryServerContext(request, fixture);

        expect(serverContext({ req: request })).toBe(fixture);
        expect(() => serverContext(undefined)).toThrow(
            'oculus server context is absent from event.platform.req'
        );
    });
});
