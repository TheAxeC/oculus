// Layer 2, server tests. ServerContext constructs each dependency once, closes each owner once,
// carries its token, and reports a missing raw-request carrier clearly.

import { describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import {
    carryServerContext,
    createServerContext,
    serverContext,
    type ContextDependencies,
    type OculusRequest
} from '../../../src/lib/server/core/context.ts';
import { Terminals, type TerminalDriver } from '../../../src/lib/server/machine/pty/channel.ts';
import { noop, noopAsync } from '../../fixtures/doubles.ts';

const driver = (close: () => void = noop): TerminalDriver => ({
    run: () => Promise.resolve(''),
    onOutput: noop,
    onChange: noop,
    attached: noop,
    live: () => false,
    close
});

describe('ServerContext', () => {
    // revert: src/lib/server/core/context.ts:306 => delete
    it('builds and closes each process-owned object once and carries its token', () => {
        const closes = Array.from({ length: 10 }, () => vi.fn());
        const hub = new Hub();
        const merge = vi.spyOn(hub, 'merge');
        const terminals = new Terminals(hub, { driver: driver(closes[6]), poll: 0 });
        const createHub = vi.fn(() => hub);
        const createTerminals = vi.fn(() => terminals);
        const watchPortfolio = vi.fn<ContextDependencies['watchPortfolio']>(() => ({
            close: closes[0]
        }));
        const watchSessions = vi.fn(() => ({ onChange: vi.fn(() => noop), close: closes[1] }));
        const watchGit = vi.fn((_hub: Hub, _options: unknown) => ({
            refresh: vi.fn(),
            close: closes[2]
        }));
        const watchBookmarks = vi.fn<ContextDependencies['watchBookmarks']>(() => ({
            close: closes[9]
        }));
        const watchHpc = vi.fn<ContextDependencies['watchHpc']>(() => ({
            refresh: vi.fn(noopAsync),
            close: closes[3]
        }));
        const watchUsageRefresh = vi.fn(() => ({
            ready: Promise.resolve(),
            refresh: vi.fn(() => Promise.resolve(true)),
            refreshAll: vi.fn(noopAsync),
            state: vi.fn(() => ({
                state: 'running' as const,
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            })),
            close: closes[4]
        }));
        const watchUsage = vi.fn(() => ({ refresh: vi.fn(noopAsync), close: closes[5] }));
        const watchCalendar = vi.fn<ContextDependencies['watchCalendar']>(() => ({
            refresh: vi.fn(noopAsync),
            close: closes[7]
        }));
        const watchMail = vi.fn<ContextDependencies['watchMail']>(() => ({
            refresh: vi.fn(noopAsync),
            republish: noop,
            close: closes[8]
        }));
        const loadConfig = vi.fn(() => ({
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
                open: { program_ext: { '.docx': 'com.microsoft.Word' } },
                mail: { poll_min: 10, per_signal: 25 },
                usage_tiers: {},
                usage_refresh_min: 5,
                usage_refresh_model: 'model',
                glyphs: { pin: 'P' },
                icons: { pin: 'pin' }
            },
            findings: []
        }));
        const context = createServerContext('/engine', {
            loadLocal: vi.fn(() => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                bookmarks: '/machine/.oculus/bookmarks.yml',
                accounts: [],
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
            watchBookmarks,
            watchHpc,
            watchCalendar,
            watchMail,
            watchUsageRefresh,
            watchUsage
        });

        // revert: src/lib/server/core/context.ts:169 => delete
        expect(merge).toHaveBeenCalledWith('files', expect.any(Function));
        expect(context.token).toBe('context-token');
        for (const built of [
            createHub,
            createTerminals,
            watchPortfolio,
            watchSessions,
            watchGit,
            watchBookmarks,
            watchHpc,
            watchCalendar,
            watchMail,
            watchUsageRefresh,
            watchUsage
        ]) {
            expect(built).toHaveBeenCalledTimes(1);
        }
        // The bookmarks watcher is given the file this machine's own local.yml names, so a served
        // test run watches its own folder and never the reader's.
        expect(watchBookmarks.mock.calls[0][1]).toEqual({ file: '/machine/.oculus/bookmarks.yml' });
        // The git watcher is given the hub root as well as the channel bus: the hub's own state is
        // on the `git` channel whether or not a session names it, which is what the deposit and the
        // pin controls read.
        expect(watchGit.mock.calls[0][1]).toMatchObject({ always: '/hub' });
        // The roots the git channel carries are read at the call and not off the copy taken here, so
        // a root added to sources.yml while the server runs is watched when the config push follows.
        const read = loadConfig.mock.calls.length;
        const roots = (watchGit.mock.calls[0][1] as { roots: () => string[] }).roots();
        expect(loadConfig.mock.calls.length).toBeGreaterThan(read);
        expect(roots).toContain('/hub');
        // One log-path map, two writers: the poller's prewarm fills in what a press has not asked
        // for yet, and the route's log action reads and writes the same object.
        expect(watchHpc.mock.calls[0][1].logPaths).toBe(context.hpcLogPaths);
        // The calendar poller reads the credential folder the routes read, so the connect action and
        // the poll are always looking at the same files.
        expect(watchCalendar.mock.calls[0][1].dir).toBe(context.calendarDir);
        // The mail poller reads the credential folder and the triage notes the routes read, for the
        // same reason.
        expect(watchMail.mock.calls[0][1].dir).toBe(context.mailDir);
        // The icon drawings are read once here, from the config this context was built with, and
        // the watcher is handed the same holder, so a config push replaces what a page load reads.
        expect(Object.keys(context.icons.set)).toEqual(['pin']);
        expect(context.icons.set.pin).toContain('<svg');
        expect(watchPortfolio.mock.calls[0][1].icons).toBe(context.icons);

        context.close();
        context.close();
        for (const close of closes) expect(close).toHaveBeenCalledTimes(1);
    });

    // revert: src/lib/server/core/context.ts:217 => onSessionsChange: undefined
    it('keeps session rescan signals inside their owning context', () => {
        const rescans: (() => void)[] = [];
        const refreshes = [vi.fn(noopAsync), vi.fn(noopAsync)];
        let usageIndex = 0;
        const replacements: Partial<ContextDependencies> = {
            loadLocal: () => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                accounts: [],
                calendars: [],
                mail: []
            }),
            loadConfig: () => ({
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
                    open: { program_ext: { '.docx': 'com.microsoft.Word' } },
                    mail: { poll_min: 10, per_signal: 25 },
                    usage_tiers: {},
                    usage_refresh_min: 5,
                    usage_refresh_model: 'model'
                },
                findings: []
            }),
            mintToken: () => 'context-token',
            createHub: () => new Hub(),
            createTerminals: (hub) => new Terminals(hub, { driver: driver(), poll: 0 }),
            watchPortfolio: () => ({ close: noop }),
            watchCalendar: () => ({ refresh: noopAsync, close: noop }),
            watchMail: () => ({ refresh: noopAsync, republish: noop, close: noop }),
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
            watchGit: () => ({ refresh: noopAsync, close: noop }),
            watchBookmarks: () => ({ close: noop }),
            watchHpc: () => ({ refresh: noopAsync, close: noop }),
            watchUsageRefresh: () => ({
                ready: Promise.resolve(),
                refresh: () => Promise.resolve(true),
                refreshAll: noopAsync,
                state: () => ({
                    state: 'running',
                    since: '',
                    reason: '',
                    lastRefresh: '',
                    renewed: true
                }),
                close: noop
            }),
            watchUsage: (_hub, options) => {
                const refresh = refreshes[usageIndex++];
                const off = options.onSessionsChange?.(() => void refresh()) ?? noop;
                return { refresh, close: off };
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
                        usage_refresh_model: 'model'
                    },
                    findings: []
                })),
                createHub
            });

        expect(build).toThrow('open.program_ext');
        expect(createHub).not.toHaveBeenCalled();
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
