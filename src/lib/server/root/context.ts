// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.
// It is the server's composition root: it imports every other server folder and none imports it,
// which is why server/root is the top of the server's folder order.

import type { IncomingMessage } from 'node:http';
import { hostname } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import {
    behaviorFindings,
    calendarSettings,
    closedPaths,
    configDir,
    iconFindings,
    iconSet,
    type IconMemory,
    languageFindings,
    nestingFindings,
    optionFindings,
    loadConfig,
    localFile,
    localFindings,
    localSentence,
    mailSettings,
    openSettings,
    processesSettings,
    latexFormatting,
    readLocal,
    refreshSettings,
    settingFindings,
    slurmSettings,
    textCatalog,
    themeFindings,
    usageTiers,
    type LocalConfig
} from '../../data/sources/config.ts';
import type { Finding, HostInfo, Snapshot } from '../../data/model/index.ts';
import { mintToken } from '../core/auth.ts';
import { defaultConnectDir } from '../accounts/connect/store.ts';
import { ConnectStates } from '../accounts/connect/oauth.ts';
import type { AccountBook } from '../accounts/connect/actions.ts';
import {
    watchCalendar,
    type CalendarOptions,
    type CalendarWatcher
} from '../accounts/calendar/poll.ts';
import { watchMail, type MailOptions, type MailWatcher } from '../accounts/mail/poll.ts';
import {
    addressOpener,
    macOpenAddress,
    macOpenPath,
    type Opener,
    type PathOpener
} from '../files/open.ts';
import { docFindings, layoutFile } from '../content/docs.ts';
import { LiteratureDesk } from '../content/literature/desk.ts';
import { Hub } from '../core/channels.ts';
import { target } from '../edit/writes.ts';
import { expandHome } from '../files/files.ts';
import { registerFilesChannel } from '../files/files-channel.ts';
import { RateLimiter, type HookTarget } from './hooks.ts';
import type { LogPaths } from '../machine/hpc/actions.ts';
import type { Plan } from '../git/deposit.ts';
import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
import { defaultApprovalsPath } from '../machine/approvals/approvals.ts';
import { defaultWorkspacesPath, ignoredCache, type IgnoredCache } from '../files/fs.ts';
import { pickerState, type PickerState } from '../files/fs/picker.ts';
import { submitState, type SubmitState } from '../machine/hpc/submit.ts';
import { fsWrites, type FsWrites } from '../core/json.ts';
import { createRunningGit, type RunningGit } from '../core/git/running.ts';
import { memoriesMemory, type MemoriesMemory } from '../content/memories.ts';
import { browserRoots, repositoryRoots } from '../files/roots.ts';
import { wallpaperMemory, type WallpaperMemory } from '../content/wallpaper.ts';
import { hostWordsOf, hpcSettingsOf, latestResources } from '../machine/hpc/host.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from '../machine/hpc/poll.ts';
import { savedPath } from '../machine/runs/commands/saved.ts';
import { defaultLspPath } from '../machine/lsp/choices.ts';
import { createRelay, type Relay, type RelayOptions } from '../machine/lsp/relay.ts';
import { withheldFolders } from '../machine/lsp/library/rules.ts';
import { followRoots } from '../machine/lsp/held/watch.ts';
import { ownFolder } from '../machine/lsp/servers.ts';
import { Terminals } from '../machine/pty/channel.ts';
import { stopTerminal } from '../machine/pty/sessions.ts';
import {
    watchProcesses,
    type ProcessesOptions,
    type ProcessesWatcher
} from '../machine/processes/watch.ts';
import { readTable } from '../machine/processes/ps.ts';
import { defaultSchedulesPath } from '../machine/runs/schedules/file.ts';
import { defaultRecordPath } from '../machine/runs/schedules/record.ts';
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
import { watchUsageRefresh, type UsageRefreshWatcher } from '../machine/usage/refresh.ts';
import { watchUsage, type UsageWatcher } from '../machine/usage/watch.ts';
import { liveSettings, type LiveSettings } from './live-settings.ts';
import { LISTEN_HOST, type PortMove } from './mover.ts';
import { watchApps, type AppsWatcher, type AppsWatchOptions } from './watch/apps.ts';
import { watchAutofetch, type AutofetchOptions, type AutofetchWatcher } from './watch/autofetch.ts';
import { watchBookmarks, type BookmarksWatchOptions } from './watch/bookmarks.ts';
import { watchGit, type GitWatcher, type GitWatchOptions } from './watch/git.ts';
import {
    WATCHERS,
    changedKeys,
    keysBuilding,
    rebuiltBy,
    watchLocal,
    type LocalWatcher,
    type WatcherName
} from './watch/local.ts';
import { startPollers, usageStarters } from './watch/pollers.ts';
import { watchPortfolio, type Watcher } from './watch/portfolio.ts';
import { watchSessions, type SessionsWatcher } from './watch/sessions.ts';

/** The machine the server runs on, and the address a page on it reaches the server at. */
export function hostInfo(port: number): HostInfo {
    return { name: hostname(), address: `http://${LISTEN_HOST}:${port}` };
}

export type ServerContext = {
    hub: Hub;
    terminals: Terminals;
    /** The language servers behind the `lsp:` channels of the socket. */
    relay: Relay;
    hooks: HookTarget;
    git: GitWatcher;
    hpc: HpcWatcher;
    calendar: CalendarWatcher;
    mail: MailWatcher;
    usage: UsageWatcher;
    usageRefresh: UsageRefreshWatcher;
    /**
     * The schedule watcher, each call handed to the one in force, so a route reaches the watcher
     * built again after a change of local.yml's `schedules` or `schedule_record`.
     */
    schedules: SchedulesWatcher;
    /** The apps found in the machine's folder and in the roots, and the keeping of an app. */
    apps: AppsWatcher;
    token: string;
    /**
     * The second secret of the process, which the address key of every approved app is made with
     * and no page is sent.
     */
    appsSecret: string;
    /**
     * The machine the server runs on and the address a page reaches it at, replaced when the port
     * moves.
     */
    host: HostInfo;
    local: LocalConfig;
    /**
     * The directory the configuration was read from, so a route names a config file without a walk.
     */
    engine: string;
    /** The write chain of the workspaces file, so two POSTs cannot lose one another's change. */
    fsWrites: FsWrites;
    /**
     * The write chain of the file operations under the served roots, apart from `fsWrites` so a
     * long copy holds up another file operation and not the workspace, bookmark and note writes.
     */
    opsWrites: FsWrites;
    /** The git and deposit writes in flight, so Cancel ends the one a root or a deposit runs. */
    gitRunning: RunningGit;
    /** The ignored names the file browser's listings asked git for lately. */
    ignoredCache: IgnoredCache;
    /** Whether the folder panel is open, so a second request while it is open is answered busy. */
    folderPicker: PickerState;
    /** The log path found per HPC job id. */
    hpcLogPaths: LogPaths;
    /** The Submit runs in flight, whose children the server's close ends. */
    hpcSubmits: SubmitState;
    /** The calendar consents in flight, minted by the connect action and taken by the callback. */
    calendarConnects: ConnectStates;
    /**
     * The folder the calendar credential files live in, resolved once for the poller and the
     * routes.
     */
    calendarDir: string;
    /** The mail consents in flight, minted by the connect action and taken by the callback. */
    mailConnects: ConnectStates;
    /** The folder the mail credential files and the triage notes live in, resolved once. */
    mailDir: string;
    /** The pacing of the literature sources and the answers kept for a repeated search. */
    literature: LiteratureDesk;
    /** The folder the one client half per provider lives in, resolved once. */
    providerDir: string;
    /**
     * The machine's own file, the chain an account write waits on, and the re-read after one: the
     * whole file is read again, `local` and the fields above take its values, and what is built
     * from a key that changed is handed it or built again, so a row added or removed holds without
     * a restart.
     */
    accounts: AccountBook;
    /**
     * How an `https` address reaches the operating system, so the one process that opens anything
     * is this one and a test is handed a context that opens nothing.
     */
    opener: Opener;
    /**
     * How the open endpoint hands a file or a folder to the operating system, injectable the same
     * way.
     */
    openPath: PathOpener;
    /** The last deposit plan per project. */
    depositPlans: Map<string, Plan>;
    /** The wallpaper pick and the refused directories. */
    wallpaper: WallpaperMemory;
    /** The Memories wall's refused directories, so a bad setting is reported once. */
    memories: MemoriesMemory;
    /**
     * The drawing of every icon config/catalogs/icons.yml names, read once here and again whenever
     * the watcher publishes a config push, so a page load reads what is held rather than the disk.
     */
    icons: IconMemory;
    close(): void;
};

/** One finding on stderr, in the one format every config finding is said in. */
export function reportFindings(findings: Finding[]): void {
    for (const finding of findings) {
        console.error(`config: ${finding.file} [${finding.key}] ${finding.message}`);
    }
}

/** The Node request type used as the context carrier by both server entry points. */
export type OculusRequest = IncomingMessage & { oculus?: ServerContext };

export type ContextDependencies = {
    readLocal: typeof readLocal;
    loadConfig: typeof loadConfig;
    mintToken: typeof mintToken;
    createHub: () => Hub;
    createTerminals: (hub: Hub) => Terminals;
    createRelay: (options: RelayOptions) => Relay;
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
    watchLocal: (engine: string, changed: () => void) => LocalWatcher;
    watchApps: (hub: Hub, options: AppsWatchOptions) => AppsWatcher;
    watchUsageRefresh: typeof watchUsageRefresh;
    watchUsage: typeof watchUsage;
};

const dependencies: ContextDependencies = {
    readLocal,
    loadConfig,
    mintToken,
    createHub: () => new Hub(),
    createTerminals: (hub) => new Terminals(hub),
    createRelay,
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
    watchLocal: (engine, changed) => watchLocal(engine, changed),
    watchApps: (hub, options) => watchApps(hub, options),
    watchUsageRefresh,
    watchUsage
};

/** The port the cockpit holds, which the server is never moved to. */
const COCKPIT_PORT = 8787;

/** The highest port number. */
const LAST_PORT = 65535;

/** What the context holds of the watchers that a changed key of local.yml builds again. */
type Parts = {
    portfolio: Watcher;
    sessions: SessionsWatcher;
    usageRefresh: UsageRefreshWatcher;
    usage: UsageWatcher;
    git: GitWatcher;
    autofetch: AutofetchWatcher;
    bookmarks: Watcher;
    schedules: SchedulesWatcher;
};

/** How an `https` address reaches the operating system for these machine values. */
function openerOf(local: LocalConfig): Opener {
    return local.openBin === undefined ? macOpenAddress : addressOpener(local.openBin);
}

/**
 * Build every process-owned server object once. `portMove` is how the process that owns the HTTP
 * server moves it when local.yml names another port; a context given none keeps its port.
 * Tests may replace constructors with recorders.
 */
export function createServerContext(
    engine: string,
    replacements: Partial<ContextDependencies> = {},
    portMove?: PortMove
): ServerContext {
    const make = { ...dependencies, ...replacements };
    const initial = make.readLocal(engine, true);
    const local = initial.config;
    // The read at start: the watchers and the pollers are built from it before any request
    // arrives, every config push hands the pollers the settings read again through
    // live-settings.ts, and every write of local.yml is read again by `reloadLocal` below. A
    // request reads the disk again through `locals.config`, so a route never answers from this
    // copy. A value the options catalog's rule refuses is the entry's default and a finding, so a
    // typo costs one setting and the server starts; only a catalog with no rule for a key stops
    // it here, naming the key.
    const { config } = make.loadConfig(engine);
    const slurm = slurmSettings(config);
    const calendarConfig = calendarSettings(config);
    const mailConfig = mailSettings(config);
    const tiers = usageTiers(config);
    const refresh = refreshSettings(config);
    // The open and LaTeX endpoints read their keys again at every request, so a key the catalog
    // holds no rule for stops the server here rather than reaching a tab.
    openSettings(config);
    latexFormatting(config);
    const processesConfig = processesSettings(config);
    const hub = make.createHub();
    registerFilesChannel(hub);
    const terminals = make.createTerminals(hub);
    const relay = make.createRelay({
        oculus: ownFolder(),
        node: process.execPath,
        roots: () => browserRoots({ config: make.loadConfig(engine).config, engine, local }),
        lspFolder: () => expandHome(local.lsp ?? defaultLspPath()),
        approvals: () => local.approvals ?? defaultApprovalsPath(),
        changes: () => target(engine, make.loadConfig(engine).config, context).changes,
        library: () => ({
            closed: closedPaths(make.loadConfig(engine).config).folders,
            withheld: withheldFolders(configDir(engine), local.hub)
        })
    });
    let followed = followRoots(relay, hub, local.workspaces ?? defaultWorkspacesPath());
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
    reportFindings([
        ...iconFindings(engine, config),
        ...behaviorFindings(engine, config),
        ...settingFindings(engine, config),
        ...languageFindings(engine, config),
        ...nestingFindings(engine, config),
        ...optionFindings(engine, config),
        ...themeFindings(engine, config),
        ...localFindings(engine, config, initial.problems),
        ...docFindings(config, local.hub, layoutFile(engine))
    ]);
    // The watchers `reloadLocal` builds again. Each start function reads the machine's values and
    // the settings in force when it is called, so the same code builds a watcher at start and again
    // after a key it is built from changed.
    const built: { parts?: Parts; live?: LiveSettings } = {};
    const owned = (): Parts => {
        if (built.parts === undefined) throw new Error('the watchers are not built yet');
        return built.parts;
    };
    // The roots are read at the call, as the git watcher's are, so a root added to sources.yml or
    // a workspace saved while the server runs is read when the next rebuild asks.
    const startPortfolio = (): Watcher =>
        make.watchPortfolio(
            hub,
            {
                hub: local.hub,
                engine,
                icons,
                host,
                roots: () =>
                    browserRoots({ config: make.loadConfig(engine).config, engine, local }),
                workspacesFile: local.workspaces ?? defaultWorkspacesPath()
            },
            { built: () => built.live?.hostChanged() }
        );
    const folders = (): ProjectFolder[] => {
        const message = hub.latest('portfolio');
        return message === undefined ? [] : projectFolders(local.hub, message.payload as Snapshot);
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
    // Every root the file browser serves is on the `git` channel, so the Repositories view is over
    // the repositories the reader configured and not only the ones a session is working in. The
    // configuration is read at the call and not taken from the copy above, so a root added to
    // sources.yml while the server runs is watched when the config push follows the save.
    const startGit = (): GitWatcher =>
        make.watchGit(hub, {
            always: local.hub,
            roots: () => repositoryRoots({ config: make.loadConfig(engine).config, engine, local }),
            workspacesFile: local.workspaces ?? defaultWorkspacesPath()
        });
    // The timer reads the `config` and `git` channels, so it is started after the git watcher has
    // its roots, and re-reads a root's state through the git watcher in force after each fetch.
    const startAutofetch = (): AutofetchWatcher =>
        make.watchAutofetch(hub, { refresh: (root) => owned().git.refresh(root) });
    // The reader's own bookmarks lie under no root, so the git watcher's handles say nothing about
    // them: this one carries a bookmark written outside oculus to every open page.
    const startBookmarks = (): Watcher =>
        make.watchBookmarks(hub, { file: local.bookmarks ?? defaultBookmarksPath() });

    // The files are read from the keys at the call that builds the watcher, which a change of
    // either key builds again. The hub, the roots and the claude program are read at each call, as
    // the git watcher's roots are, so a root or a setting changed meanwhile is read at the next
    // start of a run.
    const startSchedules = (): SchedulesWatcher => {
        const files = {
            schedules: local.schedules ?? defaultSchedulesPath(),
            record: local.scheduleRecord ?? defaultRecordPath(),
            commands: savedPath()
        };
        const rootsFor = (): string[] =>
            repositoryRoots({ config: make.loadConfig(engine).config, engine, local });
        return make.watchSchedules(hub, {
            files,
            rootsFor,
            local: () => local,
            run: (entry, size) =>
                runEntry(entry, size, {
                    hub: local.hub,
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
    // The apps are read from the machine's apps folder and the roots, and the paths that name them
    // are read from `local` at each read, so a key of local.yml that changed is followed by
    // `follow()` below and no watcher is built again.
    const apps = make.watchApps(hub, {
        engine,
        secret: appsSecret,
        local: () => local,
        config: () => make.loadConfig(engine).config,
        roots: () => browserRoots({ config: make.loadConfig(engine).config, engine, local })
    });

    const portfolio = startPortfolio();
    const sessions = startSessions();
    const { startUsageRefresh, startUsage } = usageStarters(
        make,
        hub,
        local,
        { refresh, tiers },
        built
    );
    const usageRefresh = startUsageRefresh();
    const usage = startUsage({ sessions, usageRefresh });
    const git = startGit();
    const autofetch = startAutofetch();
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
        terminals,
        relay,
        hooks,
        get git() {
            return owned().git;
        },
        hpc: polled.hpc,
        calendar: polled.calendar,
        mail: polled.mail,
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
        token,
        appsSecret,
        host,
        local,
        engine,
        fsWrites: writes,
        opsWrites: fsWrites(),
        gitRunning: createRunningGit(),
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
        accounts: { file: localFile(engine), writes, reload: () => reloadLocal() },
        opener: openerOf(local),
        openPath: macOpenPath,
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        memories: memoriesMemory(),
        icons,
        close(): void {
            if (closed) return;
            closed = true;
            built.live?.close();
            localWatch.close();
            apps.close();
            const held = owned();
            held.usageRefresh.close();
            polled.mail.close();
            polled.calendar.close();
            polled.hpc.close();
            hpcSubmits.close();
            polled.processes.close();
            held.schedules.close();
            held.bookmarks.close();
            held.autofetch.close();
            held.git.close();
            held.usage.close();
            held.sessions.close();
            held.portfolio.close();
            terminals.close();
            followed.close();
            void relay.close();
        }
    };

    /** How each watcher is built and put into the set the context holds. */
    const starters: Record<WatcherName, (held: Parts) => void> = {
        portfolio: (held) => {
            held.portfolio = startPortfolio();
        },
        sessions: (held) => {
            held.sessions = startSessions();
        },
        usageRefresh: (held) => {
            held.usageRefresh = startUsageRefresh();
        },
        usage: (held) => {
            held.usage = startUsage(held);
        },
        git: (held) => {
            held.git = startGit();
        },
        autofetch: (held) => {
            held.autofetch = startAutofetch();
        },
        bookmarks: (held) => {
            held.bookmarks = startBookmarks();
        },
        schedules: (held) => {
            held.schedules = startSchedules();
        }
    };

    /** The words a thrown value gives a log line. */
    const reasonOf = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);

    /** Build one watcher; the reason it could not be built, or null after it was. */
    function tryStart(name: WatcherName): string | null {
        try {
            starters[name](owned());
            return null;
        } catch (error) {
            return reasonOf(error);
        }
    }

    /**
     * Build again the watchers `plan` names, each old one closed before its new one starts.
     * `previous` is the values the keys held before the change. A watcher that cannot be built from
     * the new value of a key says so once, naming the key, and the key goes back to the value in
     * force: every watcher built from it is built again from that value, and the watchers of the
     * other keys go on.
     */
    function rebuild(plan: Record<WatcherName, boolean>, previous?: LocalConfig): void {
        const held = owned();
        const closeAll = (names: Record<WatcherName, boolean>): void => {
            if (names.autofetch) held.autofetch.close();
            if (names.git) held.git.close();
            if (names.usage) held.usage.close();
            if (names.usageRefresh) held.usageRefresh.close();
            if (names.sessions) held.sessions.close();
            if (names.portfolio) held.portfolio.close();
            if (names.bookmarks) held.bookmarks.close();
            if (names.schedules) held.schedules.close();
        };
        closeAll(plan);
        const kept = new Set<keyof LocalConfig>();
        for (const name of WATCHERS) {
            if (!plan[name]) continue;
            const reason = tryStart(name);
            if (reason === null) continue;
            const keys = keysBuilding(name).filter(
                (key) => previous !== undefined && !isDeepStrictEqual(local[key], previous[key])
            );
            console.error(
                `local.yml: ${keys.join(', ') || name} cannot be applied, the ${name} watcher cannot be built from it (${reason}); the value in force stays`
            );
            for (const key of keys) kept.add(key);
        }
        if (previous === undefined || kept.size === 0) return;
        for (const key of kept) {
            if (previous[key] === undefined) Reflect.deleteProperty(local, key);
            else Reflect.set(local, key, previous[key]);
        }
        const again = rebuiltBy([...kept]);
        closeAll(again);
        for (const name of WATCHERS) {
            if (!again[name]) continue;
            const reason = tryStart(name);
            if (reason !== null) {
                console.error(`local.yml: the ${name} watcher cannot be built (${reason})`);
            }
        }
    }

    /** Hold a port the server listens on now: the address every page is sent, and the portfolio. */
    function listeningOn(port: number): void {
        local.port = port;
        host = hostInfo(port);
        context.host = host;
        rebuild({ ...rebuiltBy([]), portfolio: true });
    }

    const isClosed = (): boolean => closed;

    /** The port local.yml names now, which `settlePort` moves the server to one move at a time. */
    let wantedPort = local.port;
    let moveRunning = false;
    let lastRefusal: string | undefined;

    /** The reason the server cannot be moved to `port`, or null after it was moved. */
    async function moveTo(port: number): Promise<string | null> {
        if (port === COCKPIT_PORT) return 'it belongs to the cockpit';
        if (!Number.isInteger(port) || port < 1 || port > LAST_PORT) {
            return `a port is a whole number from 1 to ${LAST_PORT}`;
        }
        if (portMove === undefined) return 'this process cannot move its server';
        const told = { announced: false };
        const refusal = await portMove(port, () => {
            if (isClosed()) return;
            told.announced = true;
            listeningOn(port);
        });
        if (isClosed()) return null;
        if (refusal === null && !told.announced) listeningOn(port);
        return refusal;
    }

    /**
     * Move the server to the port local.yml names, and to the one it names later when the file is
     * written again meanwhile. A port that cannot be used is said once, and said again only when
     * the sentence changes.
     */
    async function settlePort(): Promise<void> {
        if (moveRunning) return;
        moveRunning = true;
        try {
            while (!isClosed() && wantedPort !== local.port) {
                const port = wantedPort;
                const refusal = await moveTo(port);
                if (isClosed()) return;
                if (refusal === null) {
                    lastRefusal = undefined;
                    continue;
                }
                const sentence = `local.yml: port ${port} cannot be used (${refusal}); the server stays on ${local.port}`;
                if (sentence !== lastRefusal) console.error(sentence);
                lastRefusal = sentence;
                if (wantedPort === port) return;
            }
        } catch (error) {
            console.error(
                `local.yml: port ${wantedPort} was not applied (${reasonOf(error)}); the server stays on ${local.port}`
            );
        } finally {
            moveRunning = false;
        }
    }

    /** The sentence the last read that failed said, so the same fault is said once. */
    let unread: string | undefined;

    /**
     * Read the machine's own file again and hold every key at once: the values of the context's
     * `local` are replaced in place, so a route that reads them follows with its next request, and
     * each object made from a key that changed is handed the new value or built again. A file that
     * does not read keeps every value in force and says why once; a file that reads hands on the
     * values it read, the default of a key whose value is wrong included, so a wrong key costs that
     * key alone; a key whose value equals the one in force hands nothing on.
     */
    function reloadLocal(): void {
        if (closed) return;
        const read = make.readLocal(engine, true);
        if (read.unread) {
            const reason = localSentence(read.problems[0], localFile(engine));
            if (reason !== unread) {
                console.error(`the machine's own configuration is not read again: ${reason}`);
            }
            unread = reason;
            return;
        }
        unread = undefined;
        try {
            apply(read.config);
        } catch (error) {
            console.error(`local.yml: a change could not be applied (${reasonOf(error)})`);
        }
    }

    /** Hold the values of `next` and hand each object built from a key that changed its value. */
    function apply(next: LocalConfig): void {
        const changed = changedKeys(local, next).filter((key) => key !== 'port');
        const previous = { ...local };
        const kept = local.port;
        for (const key of Object.keys(local)) Reflect.deleteProperty(local, key);
        Object.assign(local, next, { port: kept });

        if (changed.includes('hub')) {
            reportFindings(
                docFindings(make.loadConfig(engine).config, local.hub, layoutFile(engine))
            );
        }
        rebuild(rebuiltBy(changed), previous);
        if (changed.includes('lsp')) relay.reload();
        if (changed.includes('workspaces')) {
            followed.close();
            followed = followRoots(relay, hub, local.workspaces ?? defaultWorkspacesPath());
            relay.reconcile();
        }
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
            changed.some((key) => key === 'appsDir' || key === 'approvals' || key === 'workspaces')
        ) {
            apps.follow();
        }
        wantedPort = next.port;
        if (wantedPort === local.port) lastRefusal = undefined;
        else void settlePort();
    }

    // The watch on local.yml, for a key written by hand; a row written from the page is read again
    // by the route that wrote it, and the watch's call after it is then no change.
    const localWatch = make.watchLocal(engine, reloadLocal);
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
