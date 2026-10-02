// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.
// It is the server's composition root: it imports every other server folder and none imports it,
// which is why server/root is the top of the server's folder order.

import type { IncomingMessage, Server } from 'node:http';
import { createServer as createNetServer, type Server as NetServer } from 'node:net';
import { hostname } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import {
    behaviorFindings,
    calendarSettings,
    iconFindings,
    iconSet,
    type IconMemory,
    languageFindings,
    nestingFindings,
    loadConfig,
    loadLocal,
    localFile,
    mailSettings,
    openSettings,
    slurmSettings,
    textCatalog,
    themeFindings,
    usageTiers,
    type LocalConfig
} from '../../data/sources/config.ts';
import { requirePaintLimit } from '../../data/helpers/editor.ts';
import type { Finding, HostInfo, Snapshot } from '../../data/model/index.ts';
import { mintToken } from '../core/auth.ts';
import { ConnectStates } from '../accounts/connect/oauth.ts';
import { defaultConnectDir, defaultProviderDir } from '../accounts/connect/store.ts';
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
import { Hub } from '../core/channels.ts';
import { requireAutofetch } from '../core/fetch-period.ts';
import { registerFilesChannel } from '../files/files-channel.ts';
import { RateLimiter, type HookTarget } from './hooks.ts';
import type { LogPaths } from '../machine/hpc/actions.ts';
import type { Plan } from '../git/deposit.ts';
import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
import { defaultWorkspacesPath, ignoredCache, type IgnoredCache } from '../files/fs.ts';
import { pickerState, type PickerState } from '../files/fs/picker.ts';
import { fsWrites, type FsWrites } from '../core/json.ts';
import { memoriesMemory, type MemoriesMemory } from '../content/memories.ts';
import { browserRoots, repositoryRoots } from '../files/roots.ts';
import { wallpaperMemory, type WallpaperMemory } from '../content/wallpaper.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from '../machine/hpc/poll.ts';
import { Terminals } from '../machine/pty/channel.ts';
import { projectFolders } from '../sessions/index.ts';
import { HookStore, sessionRecord } from '../sessions/stores/hooks.ts';
import type { ProjectFolder } from '../sessions/group.ts';
import { sessionFolders } from '../sessions/folders.ts';
import {
    requireRefreshSettings,
    watchUsageRefresh,
    type UsageRefreshWatcher
} from '../machine/usage/refresh.ts';
import { watchUsage, type UsageWatcher } from '../machine/usage/watch.ts';
import { liveSettings, type LiveSettings } from './live-settings.ts';
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
import { watchPortfolio, type Watcher } from './watch/portfolio.ts';
import { watchSessions, type SessionsWatcher } from './watch/sessions.ts';

/** The interface the server listens on: the loopback alone, so no other machine reaches it. */
export const LISTEN_HOST = '127.0.0.1';

/** The machine the server runs on, and the address a page on it reaches the server at. */
export function hostInfo(port: number): HostInfo {
    return { name: hostname(), address: `http://${LISTEN_HOST}:${port}` };
}

export type ServerContext = {
    hub: Hub;
    terminals: Terminals;
    hooks: HookTarget;
    git: GitWatcher;
    hpc: HpcWatcher;
    calendar: CalendarWatcher;
    mail: MailWatcher;
    usage: UsageWatcher;
    usageRefresh: UsageRefreshWatcher;
    token: string;
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
    /** The ignored names the file browser's listings asked git for lately. */
    ignoredCache: IgnoredCache;
    /** Whether the folder panel is open, so a second request while it is open is answered busy. */
    folderPicker: PickerState;
    /** The log path found per HPC job id. */
    hpcLogPaths: LogPaths;
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
    loadLocal: typeof loadLocal;
    loadConfig: typeof loadConfig;
    mintToken: typeof mintToken;
    createHub: () => Hub;
    createTerminals: (hub: Hub) => Terminals;
    watchPortfolio: typeof watchPortfolio;
    watchSessions: typeof watchSessions;
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchAutofetch: (hub: Hub, options: AutofetchOptions) => AutofetchWatcher;
    watchBookmarks: (hub: Hub, options: BookmarksWatchOptions) => Watcher;
    watchHpc: (hub: Hub, options: HpcOptions) => HpcWatcher;
    watchCalendar: (hub: Hub, options: CalendarOptions) => CalendarWatcher;
    watchMail: (hub: Hub, options: MailOptions) => MailWatcher;
    watchLocal: (engine: string, changed: () => void) => LocalWatcher;
    watchUsageRefresh: typeof watchUsageRefresh;
    watchUsage: typeof watchUsage;
};

const dependencies: ContextDependencies = {
    loadLocal,
    loadConfig,
    mintToken,
    createHub: () => new Hub(),
    createTerminals: (hub) => new Terminals(hub),
    watchPortfolio,
    watchSessions,
    watchGit: (hub, options) => watchGit(hub, options),
    watchAutofetch: (hub, options) => watchAutofetch(hub, options),
    watchBookmarks,
    watchHpc,
    watchCalendar,
    watchMail,
    watchLocal: (engine, changed) => watchLocal(engine, changed),
    watchUsageRefresh,
    watchUsage
};

/** The port the cockpit holds, which the server is never moved to. */
const COCKPIT_PORT = 8787;

/** The highest port number. */
const LAST_PORT = 65535;

/**
 * How the process that owns the HTTP server moves it to another port. `announce` is called once
 * the server listens on `port`, so a page told the new address over a socket that stayed open finds
 * the server there. It resolves null when the server listens on `port`, or the reason the server
 * stays where it is, in which case `announce` was not called.
 */
export type PortMove = (port: number, announce: () => void) => Promise<string | null>;

/** What `serverMover` gives the entry that owns the server. */
export type ServerMover = {
    move: PortMove;
    /** Whether a move is stopping and starting the server, whose `close` event is then no stop. */
    moving: () => boolean;
};

/** The reason a probe or a listen gave for failing, in words a log line can carry. */
function listenReason(error: unknown): string {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') return 'the port is in use';
    return error instanceof Error ? error.message : String(error);
}

/** Listen on one port of the loopback and resolve null, or the reason the listen failed. */
function listenOn(server: NetServer, port: number): Promise<string | null> {
    return new Promise((resolve) => {
        const failed = (error: unknown): void => {
            resolve(listenReason(error));
        };
        server.once('error', failed);
        try {
            server.listen(port, LISTEN_HOST, () => {
                server.off('error', failed);
                resolve(null);
            });
        } catch (error) {
            server.off('error', failed);
            failed(error);
        }
    });
}

/** How long a request in flight may take to finish when the server moves, in milliseconds. */
const MOVE_GRACE_MS = 5000;

/** What a mover is given besides the server: the end of the process and the grace period. */
export type MoverOptions = {
    /** Ends the process with a status, which is the one way a server with no listener stops. */
    exit?: (code: number) => void;
    /** How long a request in flight may take before the move ends what remains. */
    graceMs?: number;
};

/**
 * The move of one HTTP server to another port, for the entry that created it. The new port is
 * probed with a server of its own that is closed at once; only a free port goes on. The server then
 * stops listening and ends its idle connections at once, lets a request in flight finish for up to
 * `graceMs`, ends what remains (an upgraded socket stays open, so a page keeps the socket it was
 * told the new address on) and listens on the new port, so the same context, token and sockets
 * serve on; only then are the pages told the new address. Its `close` event queued by the stop is
 * no stop of the process, which `moving` says until the server is listening again. A listen
 * that fails after the stop listens on the old port again, and when that fails too the reasons are
 * logged in one line and the process exits with status 1, since a server with no listener serves
 * nothing.
 */
export function serverMover(server: Server, options: MoverOptions = {}): ServerMover {
    const exit = options.exit ?? ((code: number): void => process.exit(code));
    const graceMs = options.graceMs ?? MOVE_GRACE_MS;
    let running = false;
    let moving = false;
    let inFlight = 0;
    let drained: (() => void) | null = null;
    server.on('request', (_request, response) => {
        inFlight += 1;
        response.once('close', () => {
            inFlight -= 1;
            if (inFlight === 0) drained?.();
        });
    });

    /** Resolve when no request is in flight, or after the grace period. */
    function finishRequests(): Promise<void> {
        if (inFlight === 0) return Promise.resolve();
        return new Promise((resolve) => {
            const done = (): void => {
                clearTimeout(timer);
                drained = null;
                resolve();
            };
            const timer = setTimeout(done, graceMs);
            drained = done;
        });
    }

    const move: PortMove = async (port, announce) => {
        if (running) return 'a move is in progress';
        const address = server.address();
        if (address === null || typeof address === 'string') return 'the server is not listening';
        running = true;
        try {
            const probe = createNetServer();
            const busy = await listenOn(probe, port);
            if (busy !== null) return busy;
            await new Promise<void>((resolve) => {
                probe.close(() => {
                    resolve();
                });
            });
            moving = true;
            try {
                server.close();
                await finishRequests();
                server.closeAllConnections();
                const refused = await listenOn(server, port);
                if (refused === null) {
                    announce();
                    return null;
                }
                const back = await listenOn(server, address.port);
                if (back !== null) {
                    console.error(
                        `the server could not listen on port ${port} (${refused}) and could not listen on port ${address.port} again (${back}); it stops`
                    );
                    exit(1);
                }
                return refused;
            } finally {
                moving = false;
            }
        } finally {
            running = false;
        }
    };
    return { move, moving: () => moving };
}

/** What the context holds of the watchers that a changed key of local.yml builds again. */
type Parts = {
    portfolio: Watcher;
    sessions: SessionsWatcher;
    usageRefresh: UsageRefreshWatcher;
    usage: UsageWatcher;
    git: GitWatcher;
    autofetch: AutofetchWatcher;
    bookmarks: Watcher;
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
    const local = make.loadLocal(engine);
    // The read at start: the watchers and the pollers are built from it before any request
    // arrives, every config push hands the pollers the settings read again through
    // live-settings.ts, and every write of local.yml is read again by `reloadLocal` below. A
    // request reads the disk again through `locals.config`, so a route never answers from this
    // copy.
    const config = make.loadConfig(engine).config;
    const slurm = slurmSettings(config);
    const calendarConfig = calendarSettings(config);
    const mailConfig = mailSettings(config);
    const tiers = usageTiers(config);
    // Read for their check alone: each value is in the merged configuration the page is sent, and
    // the open endpoint reads `open.program_ext` again at every request, so a missing or mistyped
    // key stops the server here with the key named rather than reaching a tab.
    requirePaintLimit(config);
    requireAutofetch(config);
    openSettings(config);
    const hub = make.createHub();
    registerFilesChannel(hub);
    const terminals = make.createTerminals(hub);
    const token = make.mintToken();
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
        ...languageFindings(engine, config),
        ...nestingFindings(engine, config),
        ...themeFindings(engine, config),
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
        make.watchPortfolio(hub, {
            hub: local.hub,
            engine,
            icons,
            host,
            roots: () => browserRoots({ config: make.loadConfig(engine).config, engine, local }),
            workspacesFile: local.workspaces ?? defaultWorkspacesPath()
        });
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
    const startUsageRefresh = (): UsageRefreshWatcher =>
        make.watchUsageRefresh({
            accounts: local.accounts,
            hub: local.hub,
            claudeBin: local.claudeBin,
            ...(built.live?.held().refresh ?? refresh),
            onChange: () => void built.parts?.usage.refresh()
        });
    const startUsage = (from: Pick<Parts, 'sessions' | 'usageRefresh'>): UsageWatcher =>
        make.watchUsage(hub, {
            accounts: local.accounts,
            tiers: built.live?.held().tiers ?? tiers,
            refresherFor: from.usageRefresh.state,
            onSessionsChange: from.sessions.onChange
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

    const portfolio = startPortfolio();
    const sessions = startSessions();
    const refresh = requireRefreshSettings({
        refreshMin: config.usage_refresh_min,
        model: config.usage_refresh_model
    });
    const usageRefresh = startUsageRefresh();
    const usage = startUsage({ sessions, usageRefresh });
    const git = startGit();
    const autofetch = startAutofetch();
    const bookmarks = startBookmarks();
    // One map, two writers: the log action writes what a press resolved, the watcher's prewarm what
    // it resolved behind the page, and neither replaces the other's answer.
    const hpcLogPaths: LogPaths = new Map();
    const hpc = make.watchHpc(hub, {
        host: local.hpcHost ?? slurm.host,
        days: slurm.days,
        pollMin: slurm.pollMin,
        quotaMin: slurm.quotaMin,
        prewarm: slurm.prewarm,
        logPaths: hpcLogPaths
    });

    // The calendar poller reads the credential files of the folder the machine's own file names, so
    // a served test run is pointed at a directory of its own and never at the reader's. The client
    // halves are the provider folder's under this process's HOME, which a served run makes its own.
    // The sentences an account's row may carry are the catalog's, as the callback's are.
    const calendarDir = local.calendarDir ?? defaultConnectDir('calendar');
    const providerDir = defaultProviderDir();
    const calendarWords = {
        icsNoLink: textCatalog(config)['calendar.ics_no_link'],
        icsFailed: textCatalog(config)['calendar.ics_failed'],
        timedOut: textCatalog(config)['accounts.timed_out']
    };
    const calendar = make.watchCalendar(hub, {
        accounts: local.calendars,
        dir: calendarDir,
        providerDir,
        pollMin: calendarConfig.pollMin,
        daysBack: calendarConfig.daysBack,
        daysAhead: calendarConfig.daysAhead,
        words: calendarWords
    });

    // The mail poller reads the credential files and the triage notes of the folder the machine's
    // own file names, for the same reason: a served test run is pointed at a directory of its own.
    const mailDir = local.mailDir ?? defaultConnectDir('mail');
    const mailWords = { timedOut: textCatalog(config)['accounts.timed_out'] };
    const mail = make.watchMail(hub, {
        accounts: local.mail,
        dir: mailDir,
        providerDir,
        pollMin: mailConfig.pollMin,
        perSignal: mailConfig.perSignal,
        words: mailWords
    });

    built.parts = { portfolio, sessions, usageRefresh, usage, git, autofetch, bookmarks };
    // The hand-off of every later config push, after the pollers it hands to. The two watchers a
    // key of local.yml builds again are reached through `owned()`, so a push goes to the one in
    // force.
    built.live = liveSettings(
        hub,
        {
            hpcHost: () => local.hpcHost,
            slurm,
            calendar: calendarConfig,
            mail: mailConfig,
            refresh,
            tiers,
            calendarWords,
            mailWords
        },
        {
            hpc,
            calendar,
            mail,
            usageRefresh: { set: (settings) => owned().usageRefresh.set(settings) },
            usage: { setTiers: (labels) => owned().usage.setTiers(labels) }
        }
    );

    let closed = false;
    const writes = fsWrites();
    const context: ServerContext = {
        hub,
        terminals,
        hooks,
        get git() {
            return owned().git;
        },
        hpc,
        calendar,
        mail,
        get usage() {
            return owned().usage;
        },
        get usageRefresh() {
            return owned().usageRefresh;
        },
        token,
        host,
        local,
        engine,
        fsWrites: writes,
        opsWrites: fsWrites(),
        ignoredCache: ignoredCache(),
        folderPicker: pickerState(),
        hpcLogPaths,
        calendarConnects: new ConnectStates(),
        calendarDir,
        mailConnects: new ConnectStates(),
        mailDir,
        providerDir,
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
            const held = owned();
            held.usageRefresh.close();
            mail.close();
            calendar.close();
            hpc.close();
            held.bookmarks.close();
            held.autofetch.close();
            held.git.close();
            held.usage.close();
            held.sessions.close();
            held.portfolio.close();
            terminals.close();
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
     * does not read keeps every value in force and says why once, as a start over it would; a key
     * whose value equals the one in force hands nothing on.
     */
    function reloadLocal(): void {
        if (closed) return;
        let next: LocalConfig;
        try {
            next = make.loadLocal(engine);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            if (reason !== unread) {
                console.error(`the machine's own configuration is not read again: ${reason}`);
            }
            unread = reason;
            return;
        }
        unread = undefined;
        try {
            apply(next);
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
        if (changed.includes('openBin')) context.opener = openerOf(local);
        if (changed.includes('hpcHost')) built.live?.hostChanged();
        if (changed.includes('calendars') || changed.includes('calendarDir')) {
            context.calendarDir = local.calendarDir ?? defaultConnectDir('calendar');
            calendar.setAccounts(local.calendars, context.calendarDir);
        }
        if (changed.includes('mail') || changed.includes('mailDir')) {
            context.mailDir = local.mailDir ?? defaultConnectDir('mail');
            mail.setAccounts(local.mail, context.mailDir);
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
