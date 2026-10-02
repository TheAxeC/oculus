// Layer 2, server tests. ServerContext constructs each dependency once, closes each owner once,
// carries its token, and reports a missing raw-request carrier clearly.

import { readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import {
    carryServerContext,
    createServerContext,
    serverContext,
    type ContextDependencies,
    type OculusRequest
} from '../../../src/lib/server/root/context.ts';
import { Terminals } from '../../../src/lib/server/machine/pty/channel.ts';
import { macOpenAddress } from '../../../src/lib/server/files/open.ts';
import { watchAutofetch as builtAutofetch } from '../../../src/lib/server/root/watch/autofetch.ts';
import { noop, noopAsync } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { driver, inertConfig, inertDependencies } from './context-fixture.ts';

// The module as it is, except that its calls are recorded, so a case can read which constructor a
// context uses when it is handed none.
vi.mock('../../../src/lib/server/root/watch/autofetch.ts', async (original) => {
    const actual =
        await original<typeof import('../../../src/lib/server/root/watch/autofetch.ts')>();
    return { ...actual, watchAutofetch: vi.fn(actual.watchAutofetch) };
});

describe('ServerContext', () => {
    it('builds and closes each process-owned object once and carries its token', () => {
        const closes = Array.from({ length: 12 }, () => vi.fn());
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
                            host: 'cluster',
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

describe('ServerContext on a configuration push', () => {
    const KEPT = 'the settings in force are kept';
    const FILE = 'config/behavior.yml';

    /** Run a case over a started context, closed and its stderr spy restored after it. */
    async function inRun(
        body: (run: ReturnType<typeof started>) => void | Promise<void>,
        hpcHost?: string
    ): Promise<void> {
        const run = started(hpcHost);
        try {
            await body(run);
        } finally {
            run.context.close();
            run.said.mockRestore();
        }
    }

    /** The inert configuration with the top-level blocks `changes` names replaced whole. */
    function configWith(changes: Record<string, unknown>): Record<string, unknown> {
        return { ...inertConfig(), ...changes };
    }

    /** A block of the inert configuration with the keys `changes` names set. */
    function blockWith(name: string, changes: Record<string, unknown>): Record<string, unknown> {
        return { ...(inertConfig()[name] as Record<string, unknown>), ...changes };
    }

    /**
     * A context over recording watchers on a hub of the case's own, and what it printed on stderr
     * under the `config:` prefix since it was built.
     */
    function started(hpcHost?: string) {
        const hub = new Hub();
        const setters = {
            hpc: vi.fn(),
            calendar: vi.fn(),
            calendarWords: vi.fn(),
            mail: vi.fn(),
            mailWords: vi.fn(),
            refresh: vi.fn(),
            tiers: vi.fn()
        };
        const context = createServerContext('/engine', {
            ...inertDependencies(setters),
            createHub: () => hub,
            loadLocal: () => ({
                ...{ hub: '/hub', port: 8791, claudeBin: 'claude', accounts: [], calendars: [] },
                ...{ mail: [], ...(hpcHost === undefined ? {} : { hpcHost }) }
            })
        });
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const lines = (): string[] =>
            said.mock.calls
                .map((call) => String(call[0]))
                .filter((line) => line.startsWith('config:'));
        /** Publish a configuration and let the hub deliver what it held back behind the send. */
        const push = async (config: unknown): Promise<void> => {
            hub.publish('config', { config, findings: [] });
            for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
        };
        return { hub, context, setters, push, lines, said };
    }

    it('hands each group the settings its reader gives the pushed configuration', () =>
        inRun(async (run) => {
            await run.push(
                configWith({
                    slurm: blockWith('slurm', {
                        days: 14,
                        poll_min: 5,
                        quota_min: 30,
                        prewarm: true
                    }),
                    calendar: blockWith('calendar', { poll_min: 5, days_back: 7, days_ahead: 30 }),
                    mail: blockWith('mail', { poll_min: 4, per_signal: 10 }),
                    usage_refresh_min: 3,
                    usage_refresh_model: 'sonnet',
                    usage_tiers: { max: 'Max' }
                })
            );

            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith({
                host: 'cluster',
                days: 14,
                pollMin: 5,
                quotaMin: 30,
                prewarm: true
            });
            expect(run.setters.calendar).toHaveBeenCalledExactlyOnceWith({
                pollMin: 5,
                daysBack: 7,
                daysAhead: 30
            });
            expect(run.setters.mail).toHaveBeenCalledExactlyOnceWith({ pollMin: 4, perSignal: 10 });
            expect(run.setters.refresh).toHaveBeenCalledExactlyOnceWith({
                refreshMin: 3,
                model: 'sonnet'
            });
            expect(run.setters.tiers).toHaveBeenCalledExactlyOnceWith({ max: 'Max' });
            expect(run.lines()).toEqual([]);
        }));

    it('keeps the host the machine names, so a pushed slurm.host reaches the poller only without one', async () => {
        await inRun(async (run) => {
            await run.push(configWith({ slurm: blockWith('slurm', { host: 'other' }) }));
            // A pushed host that the machine's own host overrides changes nothing: no poll starts.
            expect(run.setters.hpc).not.toHaveBeenCalled();
            await run.push(configWith({ slurm: blockWith('slurm', { host: 'other', days: 14 }) }));
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ host: 'machine-host', days: 14 })
            );
        }, 'machine-host');
        await inRun(async (run) => {
            await run.push(configWith({ slurm: blockWith('slurm', { host: 'other' }) }));
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ host: 'other' })
            );
        });
    });

    it('hands the three sentences, each kept when the push lacks it, and says the lack once', () =>
        inRun(async (run) => {
            await run.push(
                configWith({
                    text: {
                        calendar: { ics_no_link: 'new link', ics_failed: 'new failed {0}' },
                        accounts: { timed_out: 'new timed out {0}' }
                    }
                })
            );
            expect(run.setters.calendarWords).toHaveBeenCalledExactlyOnceWith({
                icsNoLink: 'new link',
                icsFailed: 'new failed {0}',
                timedOut: 'new timed out {0}'
            });
            expect(run.setters.mailWords).toHaveBeenCalledExactlyOnceWith({
                timedOut: 'new timed out {0}'
            });

            const text = {
                calendar: { ics_no_link: 'newer link' },
                accounts: { timed_out: 'new timed out {0}' }
            };
            await run.push(configWith({ text }));
            await run.push(configWith({ text }));

            expect(run.setters.calendarWords).toHaveBeenLastCalledWith({
                icsNoLink: 'newer link',
                icsFailed: 'new failed {0}',
                timedOut: 'new timed out {0}'
            });
            expect(run.lines()).toEqual([
                `config: text catalog: calendar.ics_failed must be a string; ${KEPT}`
            ]);
        }));

    it('keeps a refused group and logs it once, again after a read that took, and clears on a push back', () =>
        inRun(async (run) => {
            const refused = `config: ${FILE}: slurm.poll_min must be a number from 1 to 35791; ${KEPT}`;
            const zero = configWith({ slurm: blockWith('slurm', { poll_min: 0 }) });
            await run.push(zero);
            await run.push(zero);
            expect(run.setters.hpc).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([refused]);

            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 15 }) }));
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ pollMin: 15 })
            );

            await run.push(zero);
            expect(run.lines()).toEqual([refused, refused]);

            // A push back to the value in force reads without a throw, so the next refusal is new.
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 15 }) }));
            await run.push(zero);
            expect(run.lines()).toEqual([refused, refused, refused]);

            // A different message on the same group logs its own line.
            await run.push(configWith({ slurm: blockWith('slurm', { days: -1 }) }));
            expect(run.lines()).toHaveLength(4);
        }));

    it('refuses each group on its own, with its reader message, and lets the others take theirs', () =>
        inRun(async (run) => {
            const first = { slurm: blockWith('slurm', { poll_min: 0 }) };
            await run.push(
                configWith({ ...first, calendar: blockWith('calendar', { poll_min: 5 }) })
            );
            expect(run.setters.hpc).not.toHaveBeenCalled();
            expect(run.setters.calendar).toHaveBeenCalledExactlyOnceWith({
                pollMin: 5,
                daysBack: 1,
                daysAhead: 14
            });

            await run.push(
                configWith({
                    calendar: blockWith('calendar', { poll_min: 0 }),
                    mail: blockWith('mail', { per_signal: 0 }),
                    usage_refresh_min: 0,
                    usage_tiers: { a: 5 }
                })
            );
            expect(run.lines().slice(1)).toEqual([
                `config: ${FILE}: calendar.poll_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: mail.per_signal must be a whole number from 1 to 500; ${KEPT}`,
                `config: ${FILE}: usage_refresh_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: usage_tiers.a must be a string; ${KEPT}`
            ]);
            expect(run.setters.refresh).not.toHaveBeenCalled();
            expect(run.setters.tiers).not.toHaveBeenCalled();
        }));

    it('hands nothing on for a push whose values equal the ones in force (an audit)', () =>
        inRun(async (run) => {
            await run.push(inertConfig());
            await run.push(inertConfig());
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([]);
        }));

    it('keeps every group and says so once for a push whose configuration is not a map', () =>
        inRun(async (run) => {
            for (const config of ['text', 3, null, [], undefined]) await run.push(config);
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([`config: the pushed configuration is not a map; ${KEPT}`]);
        }));

    it('keeps the five groups, each logged once, when behavior.yml was saved unparseable', () =>
        inRun(async (run) => {
            const unreadable = { text: inertConfig().text };
            await run.push(unreadable);
            await run.push(unreadable);

            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([
                `config: ${FILE}: slurm must be a map; ${KEPT}`,
                `config: ${FILE}: calendar must be a map; ${KEPT}`,
                `config: ${FILE}: mail must be a map; ${KEPT}`,
                `config: ${FILE}: usage_refresh_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: usage_tiers must be a map; ${KEPT}`
            ]);
        }));

    it('holds the settings of the last of two pushes made in quick succession', () =>
        inRun(async (run) => {
            // The second publish lands while the hub is still sending the first, so it is held and
            // delivered after it.
            for (const pollMin of [5, 7, 7]) {
                const config = configWith({ slurm: blockWith('slurm', { poll_min: pollMin }) });
                run.hub.publish('config', { config, findings: [] });
            }
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 7 }) }));

            expect(
                run.setters.hpc.mock.calls.map((call) => (call[0] as { pollMin: number }).pollMin)
            ).toEqual([5, 7]);
        }));

    it('takes the sink off the hub on close, after which a push changes nothing and logs nothing', () =>
        inRun(async (run) => {
            const during = run.hub.size;
            run.context.close();
            expect(run.hub.size).toBe(during - 1);
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 0, days: 14 }) }));
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([]);
        }));

    it('builds a hook target without the notification settings, which the hook route reads at each request', () =>
        inRun((run) => {
            const keys = Object.keys(run.context.hooks).sort();
            expect(keys).toEqual(['hub', 'limiter', 'logged', 'recordFor', 'store']);
        }));

    it('logs a setter that throws once as its group failing, and the next push still reaches the others', () =>
        inRun(async (run) => {
            run.setters.hpc.mockImplementation(() => {
                throw new Error('the poller broke');
            });
            const subscribed = run.hub.size;

            await run.push(
                configWith({
                    slurm: blockWith('slurm', { poll_min: 5 }),
                    calendar: blockWith('calendar', { poll_min: 5 })
                })
            );
            await run.push(
                configWith({
                    slurm: blockWith('slurm', { poll_min: 5 }),
                    calendar: blockWith('calendar', { poll_min: 7 })
                })
            );

            expect(run.lines()).toEqual([`config: the poller broke; ${KEPT}`]);
            expect(run.setters.hpc).toHaveBeenCalledTimes(2);
            expect(run.setters.calendar).toHaveBeenCalledTimes(2);
            expect(run.hub.size).toBe(subscribed);
        }));

    it('logs each other group whose setter throws, and the next push still reaches the poller', async () => {
        const text = inertConfig().text as Record<string, Record<string, unknown>>;
        const pushes: [keyof ReturnType<typeof started>['setters'], Record<string, unknown>][] = [
            ['calendar', { calendar: blockWith('calendar', { poll_min: 5 }) }],
            ['mail', { mail: blockWith('mail', { poll_min: 4 }) }],
            ['refresh', { usage_refresh_min: 3 }],
            ['tiers', { usage_tiers: { max: 'Max' } }],
            [
                'calendarWords',
                { text: { ...text, calendar: { ...text.calendar, ics_no_link: 'new link' } } }
            ],
            [
                'mailWords',
                {
                    text: {
                        ...text,
                        accounts: { ...text.accounts, timed_out: 'new timed out {0}' }
                    }
                }
            ]
        ];
        for (const [group, changes] of pushes) {
            await inRun(async (run) => {
                run.setters[group].mockImplementation(() => {
                    throw new Error(`the ${group} setter broke`);
                });
                const subscribed = run.hub.size;

                await run.push(
                    configWith({ ...changes, slurm: blockWith('slurm', { poll_min: 5 }) })
                );
                await run.push(
                    configWith({ ...changes, slurm: blockWith('slurm', { poll_min: 7 }) })
                );

                expect(run.setters[group]).toHaveBeenCalled();
                expect(
                    run
                        .lines()
                        .filter((line) => line === `config: the ${group} setter broke; ${KEPT}`)
                ).toHaveLength(1);
                expect(run.setters.hpc).toHaveBeenCalledTimes(2);
                expect(run.hub.size).toBe(subscribed);
            });
        }
    });

    it('stops at start-up naming the key for a cadence of 0, a day window of -1 and a count of 501', () => {
        const cases: [string, string, number, string][] = [
            ['slurm', 'poll_min', 0, 'a number from 1 to 35791'],
            ['slurm', 'days', -1, 'a whole number from 0 to 3650'],
            ['mail', 'per_signal', 501, 'a whole number from 1 to 500']
        ];
        for (const [block, key, value, words] of cases) {
            expect(() =>
                createServerContext('/engine', {
                    ...inertDependencies(),
                    loadConfig: () => ({
                        config: configWith({ [block]: blockWith(block, { [key]: value }) }),
                        findings: []
                    })
                })
            ).toThrow(`${block}.${key} must be ${words}`);
        }
    });
});
