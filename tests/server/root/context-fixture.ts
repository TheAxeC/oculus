// Layer 2, server test support. Builds a complete inert ServerContext for route tests without
// opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture.

import { engineDir, loadConfig, type LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { latexBuild } from '../../../src/lib/data/sources/config/settings.ts';
import { ConnectStates } from '../../../src/lib/server/accounts/connect/oauth.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { noApps } from '../../../src/lib/server/machine/apps/read/held.ts';
import { hostInfo, type ServerContext } from '../../../src/lib/server/root/context.ts';
import { createConfigCache } from '../../../src/lib/server/root/process/config-cache.ts';
import { RateLimiter } from '../../../src/lib/server/root/hooks.ts';
import { DebugClient } from '../../../src/lib/server/machine/debug/session.ts';
import { createRelay } from '../../../src/lib/server/machine/lsp/relay/relay.ts';
import { HeldEslints } from '../../../src/lib/server/machine/runs/lint/eslint.ts';
import { HeldComments } from '../../../src/lib/server/machine/runs/lint/writing/comments.ts';
import { LintRuns } from '../../../src/lib/server/machine/runs/lint/runs.ts';
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
import { hubOption } from '../../../src/lib/server/files/workspace/paths.ts';
import { workspaceWith } from '../../fixtures/hubs/workspace.ts';
import { hostsFixture } from '../machine/apps/world/hosts-fixture.ts';

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
            approvals: () => '/fixture/approvals.json',
            latex: () => latexBuild(loadConfig(engineDir()).config)
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
    const engine = overrides.engine ?? '/fixture/engine';
    const lintRuns = new LintRuns();
    const eslint = new HeldEslints({ roots: () => [] });
    const comments = new HeldComments();
    let closed = false;
    const workspace = overrides.workspace ?? workspaceWith([]);
    const context: ServerContext = {
        hub,
        workspace,
        terminals,
        relay,
        debug,
        lintRuns,
        eslint,
        comments,
        hooks,
        git: { refresh: () => Promise.resolve(), close: noop },
        openFiles: { subscribed: () => [], unsubscribed: noop, remove: noop, close: noop },
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
            storeQueue: () => fsWrites(),
            stateFile: () => '/fixture/apps.json',
            folder: () => '/fixture/apps',
            workspace: () => 'default',
            onRead: () => noop,
            onStores: () => noop,
            close: noop
        },
        ...hostsFixture(hub),
        token: ROUTE_TOKEN,
        schedules: {
            reload: noop,
            runNow: () => Promise.resolve({ refused: 'record-unread', names: [] }),
            close: noop
        },
        appsSecret: 'the-apps-secret-of-this-context',
        host: hostInfo(local.port),
        local,
        machine: () => local,
        machineSet: () => [],
        machineLists: () => ({}),
        engine,
        configCache:
            overrides.configCache ??
            createConfigCache({
                engine,
                hub: () => workspace.open().primaryDir,
                load: () => loadConfig(engine, hubOption(workspace.open().primaryDir)),
                report: () => undefined
            }),
        fsWrites: overrides.fsWrites ?? fsWrites(),
        opsWrites: overrides.opsWrites ?? fsWrites(),
        gitRunning: overrides.gitRunning ?? createRunningGit(),
        cloning: overrides.cloning ?? new Set<string>(),
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
            file: () => '/fixture/hub/.oculus/local.yml',
            fileOf: () => '/fixture/hub/.oculus/local.yml',
            noPrimary: () => 'the workspace has no primary hub',
            writes: overrides.fsWrites ?? fsWrites(),
            reload: noop
        },
        opener: noop,
        openPath: noop,
        depositPlans: new Map(),
        rescan: noop,
        wallpaper: wallpaperMemory(),
        icons: { set: {} },
        close: () => {
            if (closed) return;
            closed = true;
            terminals.close();
            debug.close();
            lintRuns.close();
            eslint.close();
            comments.close();
            void relay.close();
        },
        ...overrides
    };
    return context;
}
