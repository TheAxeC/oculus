// Layer 2, server test support. Builds a complete inert ServerContext for route tests without
// opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture.

import type { LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { ConnectStates } from '../../../src/lib/server/accounts/connect/oauth.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { noApps } from '../../../src/lib/server/machine/apps/held.ts';
import { hostInfo, type ServerContext } from '../../../src/lib/server/root/context.ts';
import { RateLimiter } from '../../../src/lib/server/root/hooks.ts';
import { DebugClient } from '../../../src/lib/server/machine/debug/session.ts';
import { createRelay } from '../../../src/lib/server/machine/lsp/relay.ts';
import { Terminals, type TerminalDriver } from '../../../src/lib/server/machine/pty/channel.ts';
import { HookStore, sessionRecord } from '../../../src/lib/server/sessions/stores/hooks.ts';
import { ignoredCache } from '../../../src/lib/server/files/fs.ts';
import { pickerState } from '../../../src/lib/server/files/fs/picker.ts';
import { submitState } from '../../../src/lib/server/machine/hpc/submit.ts';
import { createRunningGit } from '../../../src/lib/server/core/git/running.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { LiteratureDesk } from '../../../src/lib/server/content/literature/desk.ts';
import { wallpaperMemory } from '../../../src/lib/server/content/wallpaper.ts';
import { noop } from '../../fixtures/doubles.ts';

const ROUTE_TOKEN = 'the-write-token-of-this-context';

function terminalDriver(): TerminalDriver {
    return {
        run: () => Promise.resolve(''),
        onOutput: noop,
        onChange: noop,
        attached: noop,
        live: () => false,
        serverRuns: () => Promise.resolve(false),
        close: noop
    };
}

export function contextFixture(overrides: Partial<ServerContext> = {}): ServerContext {
    const hub = overrides.hub ?? new Hub();
    const local: LocalConfig = overrides.local ?? {
        hub: '/fixture/hub',
        port: 8791,
        claudeBin: 'claude',
        riteDapBin: 'rite_dap',
        accounts: [],
        calendars: [],
        mail: []
    };
    const terminals =
        overrides.terminals ?? new Terminals(hub, { driver: terminalDriver(), poll: 0 });
    const relay =
        overrides.relay ??
        createRelay({
            oculus: '/fixture/oculus',
            node: process.execPath,
            roots: () => [],
            lspFolder: () => '/fixture/lsp',
            approvals: () => '/fixture/approvals.json'
        });
    const debug =
        overrides.debug ??
        new DebugClient({
            hub,
            spawn: () => {
                throw new Error('the fixture context starts no debug adapter');
            },
            adapter: () => local.riteDapBin,
            catalog: () => ({})
        });
    const hooks = overrides.hooks ?? {
        store: new HookStore(),
        hub,
        limiter: new RateLimiter(),
        logged: new Set<string>(),
        recordFor: (session: string) => sessionRecord(hub, session)
    };
    let closed = false;
    const context: ServerContext = {
        hub,
        memories: { refused: new Set<string>() },
        terminals,
        relay,
        debug,
        hooks,
        git: { refresh: noop, close: noop },
        hpc: { refresh: () => Promise.resolve(), set: noop, close: noop },
        calendar: {
            refresh: () => Promise.resolve(),
            setAccounts: noop,
            setSettings: noop,
            setWords: noop,
            close: noop
        },
        mail: {
            refresh: () => Promise.resolve(),
            republish: noop,
            setAccounts: noop,
            setSettings: noop,
            setWords: noop,
            close: noop
        },
        usage: { refresh: () => Promise.resolve(), setTiers: noop, close: noop },
        usageRefresh: {
            ready: Promise.resolve(),
            refresh: () => Promise.resolve(true),
            refreshAll: () => Promise.resolve(),
            set: noop,
            state: () => ({
                state: 'running',
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            }),
            close: noop
        },
        apps: {
            held: noApps,
            reread: noop,
            rereadStores: noop,
            follow: noop,
            keep: noop,
            unkeep: noop,
            close: noop
        },
        token: ROUTE_TOKEN,
        schedules: {
            reload: noop,
            runNow: () => Promise.resolve({ refused: 'record-unread', names: [] }),
            close: noop
        },
        appsSecret: 'the-apps-secret-of-this-context',
        host: hostInfo(local.port),
        local,
        engine: overrides.engine ?? '/fixture/engine',
        fsWrites: overrides.fsWrites ?? fsWrites(),
        opsWrites: overrides.opsWrites ?? fsWrites(),
        gitRunning: overrides.gitRunning ?? createRunningGit(),
        ignoredCache: overrides.ignoredCache ?? ignoredCache(),
        folderPicker: overrides.folderPicker ?? pickerState(),
        hpcLogPaths: new Map(),
        hpcSubmits: submitState(),
        calendarConnects: new ConnectStates(),
        calendarDir: overrides.calendarDir ?? '/fixture/calendar',
        mailConnects: new ConnectStates(),
        literature: new LiteratureDesk(),
        mailDir: overrides.mailDir ?? '/fixture/mail',
        providerDir: overrides.providerDir ?? '/fixture/connect',
        accounts: overrides.accounts ?? {
            file: '/fixture/engine/config/local.yml',
            writes: overrides.fsWrites ?? fsWrites(),
            reload: noop
        },
        opener: noop,
        openPath: noop,
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        icons: { set: {} },
        close: () => {
            if (closed) return;
            closed = true;
            terminals.close();
            debug.close();
            void relay.close();
        },
        ...overrides
    };
    return context;
}
