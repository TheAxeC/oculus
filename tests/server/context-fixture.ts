// Layer 2, server test support. Builds a complete inert ServerContext for route tests without
// opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture.

import type { LocalConfig } from '../../src/lib/data/sources/config.ts';
import { Hub } from '../../src/lib/server/channels.ts';
import type { ServerContext } from '../../src/lib/server/context.ts';
import { RateLimiter, notifyConfig } from '../../src/lib/server/hooks.ts';
import { Terminals, type TerminalDriver } from '../../src/lib/server/pty/channel.ts';
import { HookStore, sessionRecord } from '../../src/lib/server/sessions/hooks.ts';
import { fsWrites } from '../../src/lib/server/fs.ts';
import { wallpaperMemory } from '../../src/lib/server/wallpaper.ts';
import { noop } from '../doubles.ts';

export const ROUTE_TOKEN = 'the-write-token-of-this-context';

function terminalDriver(): TerminalDriver {
    return {
        run: () => Promise.resolve(''),
        onOutput: noop,
        onChange: noop,
        attached: noop,
        live: () => false,
        close: noop
    };
}

export function contextFixture(overrides: Partial<ServerContext> = {}): ServerContext {
    const hub = overrides.hub ?? new Hub();
    const local: LocalConfig = overrides.local ?? {
        hub: '/fixture/hub',
        port: 8791,
        claudeBin: 'claude',
        accounts: []
    };
    const config = overrides.config ?? {};
    const terminals =
        overrides.terminals ?? new Terminals(hub, { driver: terminalDriver(), poll: 0 });
    const hooks = overrides.hooks ?? {
        store: new HookStore(),
        hub,
        limiter: new RateLimiter(),
        logged: new Set<string>(),
        config: notifyConfig(config),
        recordFor: (session: string) => sessionRecord(hub, session)
    };
    let closed = false;
    const context: ServerContext = {
        hub,
        terminals,
        hooks,
        git: { refresh: noop, close: noop },
        hpc: { refresh: () => Promise.resolve(), close: noop },
        usage: { refresh: () => Promise.resolve(), close: noop },
        usageRefresh: {
            ready: Promise.resolve(),
            refresh: () => Promise.resolve(true),
            refreshAll: () => Promise.resolve(),
            state: () => ({
                state: 'running',
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            }),
            close: noop
        },
        token: ROUTE_TOKEN,
        local,
        config,
        engine: overrides.engine ?? '/fixture/engine',
        fsWrites: overrides.fsWrites ?? fsWrites(),
        hpcLogPaths: new Map(),
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        close: () => {
            if (closed) return;
            closed = true;
            terminals.close();
        },
        ...overrides
    };
    return context;
}
