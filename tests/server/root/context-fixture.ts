// Layer 2, server test support. Builds a complete inert ServerContext for route tests without
// opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture,
// and the inert configuration and dependencies that `createServerContext`'s own tests build from.

import type { LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { ConnectStates } from '../../../src/lib/server/accounts/connect/oauth.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import {
    hostInfo,
    type ContextDependencies,
    type ServerContext
} from '../../../src/lib/server/root/context.ts';
import { RateLimiter } from '../../../src/lib/server/root/hooks.ts';
import { Terminals, type TerminalDriver } from '../../../src/lib/server/machine/pty/channel.ts';
import { HookStore, sessionRecord } from '../../../src/lib/server/sessions/stores/hooks.ts';
import { ignoredCache } from '../../../src/lib/server/files/fs.ts';
import { pickerState } from '../../../src/lib/server/files/fs/picker.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { wallpaperMemory } from '../../../src/lib/server/content/wallpaper.ts';
import { noop, noopAsync } from '../../fixtures/doubles.ts';

export const ROUTE_TOKEN = 'the-write-token-of-this-context';

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
        accounts: [],
        calendars: [],
        mail: []
    };
    const terminals =
        overrides.terminals ?? new Terminals(hub, { driver: terminalDriver(), poll: 0 });
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
        token: ROUTE_TOKEN,
        host: hostInfo(local.port),
        local,
        engine: overrides.engine ?? '/fixture/engine',
        fsWrites: overrides.fsWrites ?? fsWrites(),
        opsWrites: overrides.opsWrites ?? fsWrites(),
        ignoredCache: overrides.ignoredCache ?? ignoredCache(),
        folderPicker: overrides.folderPicker ?? pickerState(),
        hpcLogPaths: new Map(),
        calendarConnects: new ConnectStates(),
        calendarDir: overrides.calendarDir ?? '/fixture/calendar',
        mailConnects: new ConnectStates(),
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
        },
        ...overrides
    };
    return context;
}

export const driver = (close: () => void = noop): TerminalDriver => ({
    run: () => Promise.resolve(''),
    onOutput: noop,
    onChange: noop,
    attached: noop,
    live: () => false,
    serverRuns: () => Promise.resolve(false),
    close
});

/** The configuration an inert context reads, with the `git` block as a case sets it. */
export function inertConfig(
    git: unknown = { message_model: '', autofetch_minutes: 0 }
): Record<string, unknown> {
    return {
        slurm: { host: 'cluster', days: 2, poll_min: 1, quota_min: 5, prewarm: false },
        calendar: { poll_min: 15, days_back: 1, days_ahead: 14 },
        editor: { paint_limit_kb: 64 },
        open: { program_ext: { '.docx': 'com.microsoft.Word' } },
        mail: { poll_min: 10, per_signal: 25 },
        usage_tiers: {},
        usage_refresh_min: 5,
        usage_refresh_model: 'model',
        text: {
            calendar: { ics_no_link: 'no link', ics_failed: 'failed {0}' },
            accounts: { timed_out: 'timed out {0}' }
        },
        git
    };
}

/**
 * Every dependency of a context as an inert double, so a case builds a whole context without a
 * watcher, a terminal or a file of the machine; a case replaces the ones it watches.
 */
export function inertDependencies(
    set: Partial<
        Record<
            'hpc' | 'calendar' | 'calendarWords' | 'mail' | 'mailWords' | 'refresh' | 'tiers',
            () => void
        >
    > = {}
): Partial<ContextDependencies> {
    return {
        loadLocal: () => ({
            hub: '/hub',
            port: 8791,
            claudeBin: 'claude',
            accounts: [],
            calendars: [],
            mail: []
        }),
        loadConfig: () => ({ config: inertConfig(), findings: [] }),
        mintToken: () => 'context-token',
        createHub: () => new Hub(),
        createTerminals: (hub) => new Terminals(hub, { driver: driver(), poll: 0 }),
        watchPortfolio: () => ({ close: noop }),
        watchCalendar: () => ({
            refresh: noopAsync,
            setAccounts: noop,
            setSettings: set.calendar ?? noop,
            setWords: set.calendarWords ?? noop,
            close: noop
        }),
        watchMail: () => ({
            refresh: noopAsync,
            republish: noop,
            setAccounts: noop,
            setSettings: set.mail ?? noop,
            setWords: set.mailWords ?? noop,
            close: noop
        }),
        watchLocal: () => ({ close: noop }),
        watchGit: () => ({ refresh: noopAsync, close: noop }),
        watchAutofetch: () => ({ close: noop }),
        watchBookmarks: () => ({ close: noop }),
        watchHpc: () => ({ refresh: noopAsync, set: set.hpc ?? noop, close: noop }),
        watchUsageRefresh: () => ({
            ready: Promise.resolve(),
            refresh: () => Promise.resolve(true),
            refreshAll: noopAsync,
            set: set.refresh ?? noop,
            state: () => ({
                state: 'running',
                since: '',
                reason: '',
                lastRefresh: '',
                renewed: true
            }),
            close: noop
        }),
        watchSessions: () => ({ onChange: () => noop, close: noop }),
        watchUsage: () => ({ refresh: noopAsync, setTiers: set.tiers ?? noop, close: noop })
    };
}
