// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.
// It is the server's composition root: it imports every other server folder and none imports it,
// which is why server/root is the top of the server's folder order.
//
// The open workspace (server/files/workspace) decides what the server serves: its folders are the
// roots, its primary hub gives the one-per-oculus values, and the context follows a switch of
// workspace and a hand edit of the open file through the workspace's one poll. The machine's values
// are the `.oculus/local.yml` of each hub of the workspace, read again when a file changes or the
// workspace moves.

import type { IncomingMessage } from 'node:http';
import { homedir, hostname } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import {
    calendarSettings,
    closedPaths,
    configDir,
    iconSet,
    type IconMemory,
    loadConfig,
    localFile,
    localSentence,
    mailSettings,
    openSettings,
    processesSettings,
    latexBuild,
    latexFormatting,
    lintSettings,
    readMachine,
    refreshSettings,
    slurmSettings,
    textCatalog,
    usageTiers,
    type LocalConfig
} from '../../data/sources/config.ts';
import { workspaceVocabs } from '../../data/index.ts';
import type { HostInfo, Snapshot } from '../../data/model/index.ts';
import { mintToken } from '../core/auth.ts';
import { words } from '../core/words.ts';
import type { Finding, FilesPayload } from '../../data/model/index.ts';
import { defaultConnectDir } from '../accounts/connect/store.ts';
import { ConnectStates } from '../accounts/connect/oauth.ts';
import {
    watchCalendar,
    type CalendarOptions,
    type CalendarWatcher
} from '../accounts/calendar/poll.ts';
import { watchMail, type MailOptions, type MailWatcher } from '../accounts/mail/poll.ts';
import { addressOpener, macOpenAddress, macOpenPath, type Opener } from '../files/open.ts';
import { LiteratureDesk } from '../content/literature/desk.ts';
import { Hub } from '../core/channels.ts';
import { target } from '../edit/writes.ts';
import { hubDirs } from '../../data/helpers/files/private-folders.ts';
import { registerFilesChannel } from '../files/files-channel.ts';
import { RateLimiter, type HookTarget } from './hooks.ts';
import { defaultApprovalsPath } from '../machine/approvals/approvals.ts';
import { ignoredCache } from '../files/fs.ts';
import { closePicker, pickerState } from '../files/fs/picker.ts';
import { submitState } from '../machine/hpc/submit.ts';
import { fsWrites } from '../core/json.ts';
import { createRunningGit } from '../core/git/running.ts';
import { expandHome } from '../files/workspace/folders.ts';
import { wallpaperMemory } from '../content/wallpaper.ts';
import { hostWordsOf, hpcSettingsOf, latestResources } from '../machine/hpc/host.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from '../machine/hpc/poll.ts';
import { savedPath } from '../machine/runs/commands/saved.ts';
import { markdownExtensions } from '../machine/lsp/adapters/markdown/settings.ts';
import { defaultLspPath } from '../machine/lsp/choices.ts';
import { DebugClient, type DebugOptions } from '../machine/debug/session.ts';
import { debugControl } from '../machine/debug/session/start.ts';
import { repositoryRoots } from '../files/roots.ts';
import { createRelay, type Relay } from '../machine/lsp/relay/relay.ts';
import type { RelayOptions } from '../machine/lsp/relay/relay-options.ts';
import { SchemaFeed } from '../machine/lsp/schema-feed.ts';
import { spawnChild } from '../machine/lsp/held/process.ts';
import { withheldFolders } from '../machine/lsp/library/rules.ts';
import { followRoots } from '../machine/lsp/held/watch.ts';
import { servedRoots } from '../machine/lsp/uris.ts';
import { ownFolder } from '../machine/lsp/servers.ts';
import { StreamTerminalSet } from '../machine/apps/tools/run/stream-terminals.ts';
import { Terminals, type StreamTerminals } from '../machine/pty/channel.ts';
import { stopTerminal } from '../machine/pty/sessions.ts';
import {
    watchProcesses,
    type ProcessesOptions,
    type ProcessesWatcher
} from '../machine/processes/watch.ts';
import { readTable } from '../machine/processes/ps.ts';
import { defaultRecordPath } from '../machine/runs/schedules/record.ts';
import { HeldEslints, type HeldEslintsOptions } from '../machine/runs/lint/eslint.ts';
import { HeldComments } from '../machine/runs/lint/writing/comments.ts';
import { LintRuns } from '../machine/runs/lint/runs.ts';
import { runEntry } from '../machine/runs/schedules/run.ts';
import {
    watchSchedules,
    type SchedulesOptions,
    type SchedulesWatcher
} from '../machine/runs/schedules/watch.ts';
import { projectFolders } from '../sessions/index.ts';
import { HookStore, sessionRecord } from '../sessions/stores/hooks.ts';
import type { ProjectFolder } from '../sessions/group.ts';
import { sessionFolders } from '../sessions/folders.ts';
import { watchUsageRefresh } from '../machine/usage/refresh.ts';
import { watchUsage } from '../machine/usage/watch.ts';
import { createWorkspace } from '../files/workspace/follow.ts';
import type { OpenWorkspace } from '../files/workspace/open.ts';
import { hubOption, perOculus } from '../files/workspace/paths.ts';
import { defaultStateFolder, stateFileOf } from '../files/workspace/state.ts';
import { liveSettings, type LiveSettings } from './live-settings.ts';
import { createConfigCache } from './process/config-cache.ts';
import { createMachine } from './process/context/machine.ts';
import { newWorkspaceFindings, reportFindings, startFindings } from './process/context/findings.ts';
import { createPortMover } from './process/context/port.ts';
import { createRebuild, reasonOf, type Parts } from './process/context/rebuild.ts';
import type { ServerContext } from './process/server-context.ts';
import { LISTEN_HOST, type PortMove } from './mover.ts';
import { appFeed } from './process/context/app-feed.ts';
import { startHosts } from './process/apps-hosts.ts';
import { watchApps, type AppsWatchOptions, type AppsWatcher } from './watch/apps.ts';
import { watchAutofetch, type AutofetchOptions, type AutofetchWatcher } from './watch/autofetch.ts';
import { watchBookmarks, type BookmarksWatchOptions } from './watch/bookmarks.ts';
import { watchGit, type GitWatcher, type GitWatchOptions } from './watch/git.ts';
import { nestedFound, startAutofetch, startGit } from './watch/repos/git-start.ts';
import {
    changedKeys,
    rebuiltBy,
    watchLocal,
    type ChangedKey,
    type LocalWatcher
} from './watch/local.ts';
import { startPollers, usageStarters } from './watch/pollers.ts';
import { watchPortfolio, type PortfolioWatcher, type Watcher } from './watch/portfolio.ts';
import { watchSessions, type SessionsWatcher } from './watch/sessions.ts';

/** The machine the server runs on, and the address a page on it reaches the server at. */
export function hostInfo(port: number): HostInfo {
    return { name: hostname(), address: `http://${LISTEN_HOST}:${port}` };
}

export type { ServerContext };

/** The Node request type used as the context carrier by both server entry points. */
export type OculusRequest = IncomingMessage & { oculus?: ServerContext };

export type ContextDependencies = {
    readMachine: typeof readMachine;
    loadConfig: typeof loadConfig;
    mintToken: typeof mintToken;
    /**
     * The folder `workspace.json` lives in, which the open workspace and the recent list are read
     * from.
     */
    stateFolder: () => string;
    createWorkspace: typeof createWorkspace;
    createHub: () => Hub;
    createTerminals: (hub: Hub, streams: StreamTerminals) => Terminals;
    createRelay: (options: RelayOptions) => Relay;
    createDebug: (options: DebugOptions) => DebugClient;
    createEslints: (options: HeldEslintsOptions) => HeldEslints;
    watchPortfolio: typeof watchPortfolio;
    watchSessions: typeof watchSessions;
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchAutofetch: (hub: Hub, options: AutofetchOptions) => AutofetchWatcher;
    watchBookmarks: (hub: Hub, options: BookmarksWatchOptions) => Watcher;
    watchSchedules: (hub: Hub, options: SchedulesOptions) => SchedulesWatcher;
    watchHpc: (hub: Hub, options: HpcOptions) => HpcWatcher;
    watchProcesses: (hub: Hub, options: ProcessesOptions) => ProcessesWatcher;
    watchCalendar: (hub: Hub, options: CalendarOptions) => CalendarWatcher;
    watchMail: (hub: Hub, options: MailOptions) => MailWatcher;
    watchLocal: (hubs: string[], changed: () => void) => LocalWatcher;
    watchApps: (hub: Hub, options: AppsWatchOptions) => AppsWatcher;
    startHosts: typeof startHosts;
    watchUsageRefresh: typeof watchUsageRefresh;
    watchUsage: typeof watchUsage;
};

const dependencies: ContextDependencies = {
    readMachine,
    loadConfig,
    mintToken,
    stateFolder: defaultStateFolder,
    createWorkspace,
    createHub: () => new Hub(),
    createTerminals: (hub, streams) => new Terminals(hub, { streams }),
    createRelay,
    createDebug: (options) => new DebugClient(options),
    createEslints: (options) => new HeldEslints(options),
    watchPortfolio,
    watchSessions,
    watchGit: (hub, options) => watchGit(hub, options),
    watchAutofetch: (hub, options) => watchAutofetch(hub, options),
    watchBookmarks,
    watchSchedules,
    watchHpc,
    watchProcesses,
    watchCalendar,
    watchMail,
    watchLocal: (hubs, changed) => watchLocal(hubs, changed),
    watchApps: (hub, options) => watchApps(hub, options),
    startHosts,
    watchUsageRefresh,
    watchUsage
};

/** How an `https` address reaches the operating system for these machine values. */
function openerOf(local: LocalConfig): Opener {
    return local.openBin === undefined ? macOpenAddress : addressOpener(local.openBin);
}

/**
 * Build every process-owned server object once. `portMove` is how the process that owns the HTTP
 * server moves it when the primary hub's local.yml names another port (none keeps the port); no app
 * host starts before `ready` settles, the server listening. Tests may replace constructors with
 * recorders.
 */
export function createServerContext(
    engine: string,
    replacements: Partial<ContextDependencies> = {},
    portMove?: PortMove,
    ready?: Promise<void>
): ServerContext {
    const make = { ...dependencies, ...replacements };
    const workspace = make.createWorkspace(make.stateFolder());
    const open = (): OpenWorkspace => workspace.open();
    // The machine's values at start: the watchers and the pollers are built from them before any
    // request arrives, every config push hands the pollers the settings read again through
    // live-settings.ts, and every write of a local.yml is read again by `reloadLocal` below. A
    // request parses the folder again through `locals.config` once a file of it was written, so a
    // route never answers from this copy. A value the options catalog's rule refuses is the entry's
    // default and a finding, so a typo costs one setting and the server starts; only a catalog with
    // no rule for a key stops it here, naming the key. The settings are the engine's with the
    // primary hub's own settings file over them, taken at each call from the workspace the server
    // holds, so a move of the primary hub moves the next read to the new hub's file.
    const first = open();
    const initial = make.readMachine(first.hubs, first.primary, true);
    const local = initial.config;
    const machine = createMachine({
        read: (hubs, primary, warn) => make.readMachine(hubs, primary, warn),
        open,
        local,
        initial
    });
    // The findings the keys held at their running value are said in: a restart takes the new value.
    // Each is against the primary's `local.yml`, or with no primary against the open workspace file
    // (the state file while the workspace is unsaved), and names the key, never a value of a file.
    const heldFindings = (): Finding[] => {
        const now = open();
        const text = textCatalog(configCache.read().config);
        const file =
            now.primaryDir !== null
                ? localFile(now.primaryDir)
                : (now.file ?? stateFileOf(make.stateFolder()));
        return machine.heldBack().map((one) => ({
            file,
            key: one.file,
            message: words(text, 'server.workspace.restart_key', one.file)
        }));
    };
    const heardHeld = new Set<() => void>();
    const followWorkspace = (listener: () => void): (() => void) => {
        const unsubscribe = workspace.subscribe(() => listener());
        heardHeld.add(listener);
        return () => {
            unsubscribe();
            heardHeld.delete(listener);
        };
    };
    const load = (): ReturnType<typeof loadConfig> =>
        make.loadConfig(engine, hubOption(open().primaryDir));
    // The parse the start, a request, a finding or a move of the workspace takes while neither
    // config folder changed, so the folders are parsed once for all of them until a file changes.
    const configCache = createConfigCache({
        engine,
        hub: () => open().primaryDir,
        load,
        report: reportFindings,
        primary: () => open().primary,
        others: () =>
            open()
                .hubs.filter((one) => one.name !== open().primary)
                .map((one) => ({ key: one.name, dir: one.dir })),
        vocabs: (read, others) =>
            workspaceVocabs(engine, { name: open().primary, dir: open().primaryDir }, read, others)
    });
    const { config, from } = configCache.read();
    const slurm = slurmSettings(config);
    const calendarConfig = calendarSettings(config);
    const mailConfig = mailSettings(config);
    const tiers = usageTiers(config);
    const refresh = refreshSettings(config);
    // The open and LaTeX endpoints read their keys again at every request, so a key the catalog
    // holds no rule for stops the server here rather than reaching a tab.
    for (const read of [openSettings, latexFormatting, latexBuild, lintSettings]) read(config);
    const processesConfig = processesSettings(config);
    const hub = make.createHub();
    registerFilesChannel(hub);
    const streamTerminals = new StreamTerminalSet();
    const terminals = make.createTerminals(hub, streamTerminals);
    const schemas = new SchemaFeed();
    const held = (): { open: ReturnType<typeof open>; local: LocalConfig } => ({
        open: open(),
        local: machine.values()
    });
    const appServers = appFeed();
    const relay = make.createRelay({
        schemas,
        appServers: appServers.feed,
        oculus: ownFolder(),
        node: process.execPath,
        roots: () => open().roots,
        lspFolder: () => expandHome(local.lsp ?? defaultLspPath()),
        approvals: () => local.approvals ?? defaultApprovalsPath(),
        latex: () => latexBuild(load().config),
        markdown: () => markdownExtensions(load().config),
        catalog: () => textCatalog(load().config),
        changes: () => target(engine, load().config, held(), context).changes,
        library: () => ({
            closed: closedPaths(load().config).folders,
            withheld: withheldFolders(configDir(engine), hubDirs(open().roots))
        })
    });
    const debug = make.createDebug({
        hub,
        spawn: spawnChild,
        adapter: () => local.riteDapBin,
        catalog: () => textCatalog(load().config)
    });
    const lintRuns = new LintRuns();
    const comments = new HeldComments();
    const eslint = make.createEslints({
        roots: () => servedRoots(open().roots).map((root) => root.real)
    });
    // The relay and the held ESLint children hear a change of the served roots together: a config
    // push and a move of the open workspace.
    const rootsFollowers = {
        reconcile: (): void => {
            relay.reconcile();
            eslint.reconcile();
        }
    };
    const followed = followRoots(rootsFollowers, hub, (listener) =>
        workspace.subscribe(() => listener())
    );
    const token = make.mintToken();
    const appsSecret = make.mintToken();
    const store = new HookStore();
    const hooks: HookTarget = {
        store,
        hub,
        limiter: new RateLimiter(),
        logged: new Set<string>(),
        recordFor: (session) => sessionRecord(hub, session)
    };
    // The icon map is read once here and by the watcher on every config push; a page load takes
    // what is held. The drift between the map and the glyph vocabulary is a fact about this
    // install, so it is said once at startup rather than once per request.
    const icons: IconMemory = { set: iconSet(config) };
    let host = hostInfo(local.port);
    reportFindings(
        startFindings({ engine, config, from, open: first, problems: initial.problems })
    );
    // The watchers `reloadLocal` builds again. Each start function reads the machine's values and
    // the settings in force when it is called, so the same code builds a watcher at start and again
    // after a key it is built from changed.
    const built: { parts?: Parts; live?: LiveSettings } = {};
    const owned = (): Parts => {
        if (built.parts === undefined) throw new Error('the watchers are not built yet');
        return built.parts;
    };
    // The workspace is taken from the holder at the call, as the git watcher's roots are, so a
    // folder added to the open file while the server runs is served when the next rebuild asks. The
    // repositories of the workspace as the git watcher last listed them, which the portfolio reads
    // to tell a project's clones, and the write of the exclude blocks in flight, so two writes
    // never overlap.
    const nested: { repositories: readonly string[]; write: Promise<void> } = {
        repositories: [],
        write: Promise.resolve()
    };
    const startPortfolio = (): PortfolioWatcher =>
        make.watchPortfolio(
            hub,
            {
                engine,
                icons,
                host,
                open,
                held: heldFindings,
                problems: () => machine.held().problems,
                follow: followWorkspace
            },
            {
                built: () => {
                    built.live?.hostChanged();
                    relay.settingsChanged();
                    if (!lintSettings(load().config).on.eslint) eslint.endAll();
                },
                schemas: (set, references) => schemas.publish(set, references),
                repositories: () => nested.repositories
            }
        );
    const folders = (): ProjectFolder[] => {
        const message = hub.latest('portfolio');
        if (message === undefined) return [];
        const now = open();
        const dirs: Record<string, string> = Object.fromEntries(
            now.hubs.map((one) => [one.name, one.dir])
        );
        return projectFolders(dirs, message.payload as Snapshot, now.primary);
    };
    // The stores are every account's folders, so a session of a second Claude account is read from
    // that account's registry and transcripts as the first one's are.
    const startSessions = (): SessionsWatcher =>
        make.watchSessions(hub, {
            ...sessionFolders(local.accounts),
            cache: local.sessionsCache,
            overrides: local.sessionsOverrides,
            projectFolders: folders,
            terminals,
            hooks: store
        });
    const startGitWatcher = (): GitWatcher =>
        startGit(
            make,
            hub,
            engine,
            workspace,
            nestedFound(nested, () => owned().portfolio.rescan())
        );
    const startAutofetchWatcher = (): AutofetchWatcher =>
        startAutofetch(make, hub, () => owned().git);
    const paths = () => perOculus(open().primaryDir, local);
    // The reader's own bookmarks lie under no root, so the git watcher's handles say nothing about
    // them: this one carries a bookmark written outside oculus to every open page.
    const startBookmarks = (): Watcher => make.watchBookmarks(hub, { file: paths().bookmarks });

    // The files are read from the keys at the call that builds the watcher, which a change of
    // either key builds again. The hub, the roots and the claude program are read at each call, as
    // the git watcher's roots are, so a root or a setting changed meanwhile is read at the next
    // start of a run.
    const startSchedules = (): SchedulesWatcher => {
        const files = {
            schedules: paths().schedules,
            record: local.scheduleRecord ?? defaultRecordPath(),
            commands: savedPath()
        };
        const rootsFor = (): string[] => open().roots.map((root) => expandHome(root.dir));
        return make.watchSchedules(hub, {
            files,
            rootsFor,
            hub: () => open().primaryDir,
            run: (entry, size) =>
                runEntry(entry, size, {
                    hub: open().primaryDir,
                    claudeBin: local.claudeBin,
                    rootsFor,
                    commands: files.commands,
                    approvalsFor: () => local.approvals ?? defaultApprovalsPath()
                }),
            stop: (terminal) => stopTerminal(terminal),
            table: () => readTable(),
            refresh: () => terminals.refresh()
        });
    };
    // The apps are read from the primary hub's apps folder and the workspace's folders, and the
    // paths that name them are read from `local` at each read, so a key of local.yml that changed
    // is followed by `follow()` below and no watcher is built again.
    const apps = make.watchApps(hub, {
        engine,
        secret: appsSecret,
        local: () => local,
        config: () => load().config,
        open,
        follow: (listener) => workspace.subscribe(() => listener())
    });

    const portfolio = startPortfolio();
    const sessions = startSessions();
    const { startUsageRefresh, startUsage } = usageStarters(
        make,
        hub,
        local,
        { refresh, tiers },
        built,
        () => open().primaryDir ?? homedir()
    );
    const usageRefresh = startUsageRefresh();
    const usage = startUsage({ sessions, usageRefresh });
    const git = startGitWatcher();
    const opsWrites = fsWrites();
    const hosts = make.startHosts({
        hub,
        apps,
        local: () => local,
        config: () => load().config,
        engine,
        opsWrites,
        terminals,
        streamTerminals,
        open,
        follow: (listener) => workspace.subscribe(() => listener()),
        target: () => target(engine, load().config, held(), context),
        ready
    });
    appServers.attach(hosts.hosts.tools, schemas);
    debug.attachApps(hosts.hosts.tools.debugPort());
    hosts.hosts.tools.attachDebug(
        debugControl({
            rootsFor: () => repositoryRoots(open()),
            approvalsFor: () => local.approvals ?? defaultApprovalsPath(),
            catalog: () => textCatalog(load().config),
            client: debug,
            port: () => debug.port()
        })
    );
    const { openFiles } = hosts;
    const autofetch = startAutofetchWatcher();
    const bookmarks = startBookmarks();
    const schedules = startSchedules();
    const hostWords = hostWordsOf(config);
    const polled = startPollers(
        make,
        hub,
        local,
        {
            hpc: hpcSettingsOf(slurm, local.hpcHost, latestResources(hub), hostWords),
            calendar: calendarConfig,
            mail: mailConfig,
            processes: processesConfig,
            config
        },
        folders
    );

    built.parts = {
        portfolio,
        sessions,
        usageRefresh,
        usage,
        git,
        autofetch,
        bookmarks,
        schedules
    };
    // The hand-off of every later config push, after the pollers it hands to. The two watchers a
    // key of local.yml builds again are reached through `owned()`, so a push goes to the one in
    // force.
    built.live = liveSettings(
        hub,
        {
            hpcHost: () => local.hpcHost,
            resources: () => latestResources(hub),
            hostWords,
            slurm,
            calendar: calendarConfig,
            mail: mailConfig,
            refresh,
            tiers,
            processes: processesConfig,
            processesText: textCatalog(config),
            calendarWords: polled.calendarWords,
            mailWords: polled.mailWords
        },
        {
            hpc: polled.hpc,
            calendar: polled.calendar,
            mail: polled.mail,
            processes: polled.processes,
            usageRefresh: { set: (settings) => owned().usageRefresh.set(settings) },
            usage: { setTiers: (labels) => owned().usage.setTiers(labels) }
        }
    );

    let closed = false;
    const writes = fsWrites();
    const hpcSubmits = submitState();
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
        get git() {
            return owned().git;
        },
        hpc: polled.hpc,
        calendar: polled.calendar,
        mail: polled.mail,
        openFiles,
        get usage() {
            return owned().usage;
        },
        get usageRefresh() {
            return owned().usageRefresh;
        },
        schedules: {
            reload: () => owned().schedules.reload(),
            runNow: (name) => owned().schedules.runNow(name),
            close: () => owned().schedules.close()
        },
        apps,
        hosts: hosts.hosts,
        secrets: hosts.secrets,
        token,
        appsSecret,
        host,
        local,
        machine: machine.values,
        machineSet: () => machine.held().set,
        machineLists: () => machine.held().lists,
        engine,
        configCache,
        fsWrites: writes,
        opsWrites,
        gitRunning: createRunningGit(),
        cloning: new Set<string>(),
        ignoredCache: ignoredCache(),
        folderPicker: pickerState(),
        hpcLogPaths: polled.hpcLogPaths,
        hpcSubmits,
        calendarConnects: new ConnectStates(),
        calendarDir: polled.calendarDir,
        mailConnects: new ConnectStates(),
        mailDir: polled.mailDir,
        literature: new LiteratureDesk(),
        providerDir: polled.providerDir,
        accounts: {
            file: () => {
                const primary = open().primaryDir;
                return primary === null ? null : localFile(primary);
            },
            fileOf: (name) => {
                const dir = open().hubs.find((one) => one.name === name)?.dir;
                return dir === undefined ? null : localFile(dir);
            },
            noPrimary: () =>
                words(textCatalog(configCache.read().config), 'server.workspace.no_primary'),
            writes,
            reload: () => reloadLocal()
        },
        opener: openerOf(local),
        openPath: macOpenPath,
        depositPlans: new Map(),
        rescan: () => owned().portfolio.rescan(),
        wallpaper: wallpaperMemory(),
        icons,
        close(): void {
            if (closed) return;
            closed = true;
            built.live?.close();
            localWatch.close();
            unfollowWorkspace();
            openFiles.close();
            hosts.stop();
            apps.close();
            const current = owned();
            current.usageRefresh.close();
            polled.mail.close();
            polled.calendar.close();
            polled.hpc.close();
            hpcSubmits.close();
            polled.processes.close();
            current.schedules.close();
            current.bookmarks.close();
            current.autofetch.close();
            current.git.close();
            current.usage.close();
            current.sessions.close();
            current.portfolio.close();
            terminals.close();
            followed.close();
            workspace.close();
            debug.close();
            lintRuns.close();
            eslint.close();
            comments.close();
            closePicker(context.folderPicker);
            void relay.close();
        }
    };

    /** How each watcher is built and put into the set the context holds. */
    const rebuild = createRebuild({
        owned,
        local,
        starters: {
            portfolio: (current) => {
                current.portfolio = startPortfolio();
            },
            sessions: (current) => {
                current.sessions = startSessions();
            },
            usageRefresh: (current) => {
                current.usageRefresh = startUsageRefresh();
            },
            usage: (current) => {
                current.usage = startUsage(current);
            },
            git: (current) => {
                current.git = startGitWatcher();
            },
            autofetch: (current) => {
                current.autofetch = startAutofetchWatcher();
            },
            bookmarks: (current) => {
                current.bookmarks = startBookmarks();
            },
            schedules: (current) => {
                current.schedules = startSchedules();
            }
        }
    });

    /** Hold a port the server listens on now: the address every page is sent, and the portfolio. */
    function listeningOn(port: number): void {
        local.port = port;
        host = hostInfo(port);
        context.host = host;
        rebuild({ ...rebuiltBy([]), portfolio: true });
    }

    const mover = createPortMover({
        local,
        portMove,
        isClosed: () => closed,
        listeningOn
    });

    /** The sentence the last read that failed said, so the same fault is said once. */
    let unread: string | undefined;

    /**
     * Read the machine's files again and hold every key at once: the values of the context's
     * `local` are replaced in place, so a route that reads them follows with its next request, and
     * each object made from a key that changed is handed the new value or built again. A file that
     * does not read keeps every value in force and says why once; a file that reads hands on the
     * values it read, the default of a key whose value is wrong included, so a wrong key costs that
     * key alone; a key whose value equals the one in force hands nothing on. `switched` is a read
     * made because the workspace moved: the port and the state paths stay as the server was started
     * with and a finding names each key that a restart would change.
     */
    function reloadLocal(switched = false): void {
        if (closed) return;
        const heldBefore = machine.heldBack().map((one) => one.file);
        const setBefore = machine.held().set;
        const problemsBefore = machine.held().problems;
        const read = machine.refresh(true);
        if (read.unread !== null) {
            const reason = localSentence(read.unread.problem, read.unread.file);
            if (reason !== unread) {
                console.error(`the machine's own configuration is not read again: ${reason}`);
            }
            unread = reason;
            return;
        }
        unread = undefined;
        let next = read.config;
        if (switched) {
            const back = machine.holdOnSwitch(next);
            next = { ...next };
            for (const one of back) {
                if (local[one.key] === undefined) Reflect.deleteProperty(next, one.key);
                else Reflect.set(next, one.key, local[one.key]);
            }
        }
        try {
            apply(next, switched ? ['workspace'] : []);
        } catch (error) {
            console.error(`local.yml: a change could not be applied (${reasonOf(error)})`);
        }
        // A key held at its running value is a finding of the Findings view, and so is a key that
        // agrees again: the portfolio watcher builds the config payload over it once more. The
        // Settings view shows which keys the primary's file sets, so a page is told to read the
        // workspaces again when that list moved.
        if (!isDeepStrictEqual(setBefore, machine.held().set)) {
            hub.publish('files', { root: '', workspaces: true } satisfies FilesPayload);
        }
        const heldNow = machine.heldBack().map((one) => one.file);
        if (!isDeepStrictEqual(heldBefore, heldNow)) {
            reportFindings(heldFindings().filter((one) => !heldBefore.includes(one.key)));
        }
        if (
            !isDeepStrictEqual(heldBefore, heldNow) ||
            !isDeepStrictEqual(problemsBefore, machine.held().problems)
        ) {
            for (const listener of [...heardHeld]) listener();
        }
    }

    /** Hold the values of `next` and hand each object built from a key that changed its value. */
    function apply(next: LocalConfig, moved: ChangedKey[]): void {
        const changed: ChangedKey[] = [
            ...changedKeys(local, next).filter((key) => key !== 'port'),
            ...moved
        ];
        const previous = { ...local };
        const kept = local.port;
        for (const key of Object.keys(local)) Reflect.deleteProperty(local, key);
        Object.assign(local, next, { port: kept });
        rebuild(rebuiltBy(changed), previous);
        if (changed.includes('lsp')) relay.reload();
        if (changed.includes('openBin')) context.opener = openerOf(local);
        if (changed.includes('hpcHost')) built.live?.hostChanged();
        if (changed.includes('calendars') || changed.includes('calendarDir')) {
            context.calendarDir = local.calendarDir ?? defaultConnectDir('calendar');
            polled.calendar.setAccounts(local.calendars, context.calendarDir);
        }
        if (changed.includes('mail') || changed.includes('mailDir')) {
            context.mailDir = local.mailDir ?? defaultConnectDir('mail');
            polled.mail.setAccounts(local.mail, context.mailDir);
        }
        if (
            changed.some((key) => key === 'appsDir' || key === 'approvals' || key === 'workspace')
        ) {
            apps.follow();
        }
        mover.want(next.port);
    }

    // The watch on the hubs' local.yml files, for a key written by hand; a row written from the
    // page is read again by the route that wrote it, and the watch's call after it is then no
    // change. A move of the workspace builds it again over the new hubs.
    const hubFolders = (): string[] => open().hubs.map((one) => one.dir);
    let localWatch = make.watchLocal(hubFolders(), () => reloadLocal());

    // A move of the open workspace: the files of the machine's values are those of the new hubs,
    // the findings the new file raised are said, and what is built from the primary hub is built
    // again when the primary moved. The roots, the portfolio, the git watch, the app hosts and the
    // open-files poll follow the workspace through their own subscriptions.
    const unfollowWorkspace = workspace.subscribe((now, before) => {
        if (closed) return;
        localWatch.close();
        localWatch = make.watchLocal(hubFolders(), () => reloadLocal());
        reportFindings(newWorkspaceFindings(now, before, configCache.read().config));
        const moved = now.primaryDir !== before.primaryDir || now.primary !== before.primary;
        const hubsMoved = !isDeepStrictEqual(now.hubs, before.hubs);
        if (moved || hubsMoved) reloadLocal(moved);
    });
    return context;
}

/** Put a context on the raw request before Kit handles it. */
export function carryServerContext(request: IncomingMessage, context: ServerContext): void {
    (request as OculusRequest).oculus = context;
}

/** The built handler wrapped so every request carries the context before Kit sees it. */
export function carryingHandler<Response>(
    handler: (request: IncomingMessage, response: Response) => void,
    context: ServerContext
): (request: IncomingMessage, response: Response) => void {
    return (request, response) => {
        carryServerContext(request, context);
        handler(request, response);
    };
}

/** Read the context from Kit's platform request, with one clear startup error when it is absent. */
export function serverContext(platform: { req?: OculusRequest } | undefined): ServerContext {
    const context = platform?.req?.oculus;
    if (context === undefined) {
        throw new Error('oculus server context is absent from event.platform.req');
    }
    return context;
}
