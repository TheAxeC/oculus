// Layer 2, server tests. ServerContext constructs each dependency once, closes each owner once,
// carries its token, and reports a missing raw-request carrier clearly.

import { describe, expect, it, vi } from 'vitest';
import { Hub } from '../../src/lib/server/channels.ts';
import {
    carryServerContext,
    createServerContext,
    serverContext,
    type ContextDependencies,
    type OculusRequest
} from '../../src/lib/server/context.ts';
import { Terminals, type TerminalDriver } from '../../src/lib/server/pty/channel.ts';
import { noop, noopAsync } from '../doubles.ts';

const driver = (close: () => void = noop): TerminalDriver => ({
    run: () => Promise.resolve(''),
    onOutput: noop,
    onChange: noop,
    attached: noop,
    live: () => false,
    close
});

describe('ServerContext', () => {
    it('builds and closes each process-owned object once and carries its token', () => {
        const closes = Array.from({ length: 7 }, () => vi.fn());
        const hub = new Hub();
        const terminals = new Terminals(hub, { driver: driver(closes[6]), poll: 0 });
        const createHub = vi.fn(() => hub);
        const createTerminals = vi.fn(() => terminals);
        const watchPortfolio = vi.fn<ContextDependencies['watchPortfolio']>(() => ({
            close: closes[0]
        }));
        const watchSessions = vi.fn(() => ({ onChange: vi.fn(() => noop), close: closes[1] }));
        const watchGit = vi.fn((_hub: Hub, _root: string) => ({
            refresh: vi.fn(),
            close: closes[2]
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
        const context = createServerContext('/engine', {
            loadLocal: vi.fn(() => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                accounts: []
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
                    usage_tiers: {},
                    usage_refresh_min: 5,
                    usage_refresh_model: 'model',
                    glyphs: { pin: 'P' },
                    icons: { pin: 'pin' }
                },
                findings: []
            })),
            mintToken: vi.fn(() => 'context-token'),
            createHub,
            createTerminals,
            watchPortfolio,
            watchSessions,
            watchGit,
            watchHpc,
            watchUsageRefresh,
            watchUsage
        });

        expect(context.token).toBe('context-token');
        for (const built of [
            createHub,
            createTerminals,
            watchPortfolio,
            watchSessions,
            watchGit,
            watchHpc,
            watchUsageRefresh,
            watchUsage
        ]) {
            expect(built).toHaveBeenCalledTimes(1);
        }
        // The git watcher is given the hub root as well as the channel bus: the hub's own state is
        // on the `git` channel whether or not a session names it, which is what the deposit and the
        // pin controls read.
        expect(watchGit.mock.calls[0][1]).toBe('/hub');
        // One log-path map, two writers: the poller's prewarm fills in what a press has not asked
        // for yet, and the route's log action reads and writes the same object.
        expect(watchHpc.mock.calls[0][1].logPaths).toBe(context.hpcLogPaths);
        // The icon drawings are read once here, from the config this context was built with, and
        // the watcher is handed the same holder, so a config push replaces what a page load reads.
        expect(Object.keys(context.icons.set)).toEqual(['pin']);
        expect(context.icons.set.pin).toContain('<svg');
        expect(watchPortfolio.mock.calls[0][1].icons).toBe(context.icons);

        context.close();
        context.close();
        for (const close of closes) expect(close).toHaveBeenCalledTimes(1);
    });

    it('keeps session rescan signals inside their owning context', () => {
        const rescans: (() => void)[] = [];
        const refreshes = [vi.fn(noopAsync), vi.fn(noopAsync)];
        let usageIndex = 0;
        const replacements: Partial<ContextDependencies> = {
            loadLocal: () => ({
                hub: '/hub',
                port: 8791,
                claudeBin: 'claude',
                accounts: []
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
