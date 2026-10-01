// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.
// It is the server's composition root: it imports every other server folder and none imports it,
// which is why server/root is the top of the server's folder order.

import type { IncomingMessage } from 'node:http';
import { hostname } from 'node:os';
import {
    behaviorFindings,
    calendarSettings,
    iconFindings,
    iconSet,
    type IconMemory,
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
import { registerFilesChannel } from '../files/files-channel.ts';
import { RateLimiter, notifyConfig, type HookTarget } from './hooks.ts';
import type { LogPaths } from '../machine/hpc/actions.ts';
import type { Plan } from '../git/deposit.ts';
import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
import { defaultWorkspacesPath, ignoredCache, type IgnoredCache } from '../files/fs.ts';
import { fsWrites, type FsWrites } from '../core/json.ts';
import { memoriesMemory, type MemoriesMemory } from '../content/memories.ts';
import { repositoryRoots } from '../files/roots.ts';
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
import { watchBookmarks, type BookmarksWatchOptions } from './watch/bookmarks.ts';
import { watchGit, type GitWatcher, type GitWatchOptions } from './watch/git.ts';
import { watchLocal, type LocalWatcher } from './watch/local.ts';
import { watchPortfolio, type Watcher } from './watch/portfolio.ts';
import { watchSessions } from './watch/sessions.ts';

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
    /** The machine the server runs on and the address a page reaches it at, built once here. */
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
     * account lists and their folders are read again, the fields above and `local` take them, and
     * the two pollers are handed them, so a row added or removed holds without a restart.
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
    watchPortfolio: (
        hub: Hub,
        paths: { hub: string; engine: string; icons: IconMemory; host: HostInfo }
    ) => Watcher;
    watchSessions: typeof watchSessions;
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
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
    watchBookmarks,
    watchHpc,
    watchCalendar,
    watchMail,
    watchLocal: (engine, changed) => watchLocal(engine, changed),
    watchUsageRefresh,
    watchUsage
};

/** Build every process-owned server object once. Tests may replace constructors with recorders. */
export function createServerContext(
    engine: string,
    replacements: Partial<ContextDependencies> = {}
): ServerContext {
    const make = { ...dependencies, ...replacements };
    const local = make.loadLocal(engine);
    // The one read outside a request: the watchers, the pollers and the hook target are built from
    // it once here, before any request arrives. A request reads the disk again through
    // `locals.config`, so a route never answers from this copy.
    const config = make.loadConfig(engine).config;
    const slurm = slurmSettings(config);
    const calendarConfig = calendarSettings(config);
    const mailConfig = mailSettings(config);
    const tiers = usageTiers(config);
    // Read for their check alone: each value is in the merged configuration the page is sent, and
    // the open endpoint reads `open.program_ext` again at every request, so a missing or mistyped
    // key stops the server here with the key named rather than reaching a tab.
    requirePaintLimit(config);
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
        config: notifyConfig(config),
        stopMessage: textCatalog(config)['notify.stop'],
        recordFor: (session) => sessionRecord(hub, session)
    };
    // The icon map is read once here and by the watcher on every config push; a page load takes
    // what is held. The drift between the map and the glyph vocabulary is a fact about this
    // install, so it is said once at startup rather than once per request.
    const icons: IconMemory = { set: iconSet(config) };
    const host = hostInfo(local.port);
    reportFindings([
        ...iconFindings(engine, config),
        ...behaviorFindings(engine, config),
        ...themeFindings(engine, config),
        ...docFindings(config, local.hub, layoutFile(engine))
    ]);
    const portfolio = make.watchPortfolio(hub, {
        hub: local.hub,
        engine,
        icons,
        host
    });

    const folders = (): ProjectFolder[] => {
        const message = hub.latest('portfolio');
        return message === undefined ? [] : projectFolders(local.hub, message.payload as Snapshot);
    };
    // The stores are every account's folders, so a session of a second Claude account is read from
    // that account's registry and transcripts as the first one's are.
    const sessions = make.watchSessions(hub, {
        ...sessionFolders(local.accounts),
        cache: local.sessionsCache,
        overrides: local.sessionsOverrides,
        projectFolders: folders,
        terminals,
        hooks: store
    });
    let usage: UsageWatcher | null = null;
    const refresh = requireRefreshSettings({
        refreshMin: config.usage_refresh_min,
        model: config.usage_refresh_model
    });
    const usageRefresh = make.watchUsageRefresh({
        accounts: local.accounts,
        hub: local.hub,
        claudeBin: local.claudeBin,
        model: refresh.model,
        refreshMin: refresh.refreshMin,
        onChange: () => void usage?.refresh()
    });
    usage = make.watchUsage(hub, {
        accounts: local.accounts,
        tiers,
        refresherFor: usageRefresh.state,
        onSessionsChange: sessions.onChange
    });
    // Every root the file browser serves is on the `git` channel, so the Repositories view is over
    // the repositories the reader configured and not only the ones a session is working in. The
    // configuration is read at the call and not taken from the copy above, so a root added to
    // sources.yml while the server runs is watched when the config push follows the save.
    const workspacesFile = local.workspaces ?? defaultWorkspacesPath();
    const git = make.watchGit(hub, {
        always: local.hub,
        roots: () => repositoryRoots({ config: make.loadConfig(engine).config, engine, local }),
        workspacesFile
    });
    // The reader's own bookmarks lie under no root, so the git watcher's handles say nothing about
    // them: this one carries a bookmark written outside oculus to every open page.
    const bookmarks = make.watchBookmarks(hub, {
        file: local.bookmarks ?? defaultBookmarksPath()
    });
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
    const calendar = make.watchCalendar(hub, {
        accounts: local.calendars,
        dir: calendarDir,
        providerDir,
        pollMin: calendarConfig.pollMin,
        daysBack: calendarConfig.daysBack,
        daysAhead: calendarConfig.daysAhead,
        words: {
            icsNoLink: textCatalog(config)['calendar.ics_no_link'],
            icsFailed: textCatalog(config)['calendar.ics_failed'],
            timedOut: textCatalog(config)['accounts.timed_out']
        }
    });

    // The mail poller reads the credential files and the triage notes of the folder the machine's
    // own file names, for the same reason: a served test run is pointed at a directory of its own.
    const mailDir = local.mailDir ?? defaultConnectDir('mail');
    const mail = make.watchMail(hub, {
        accounts: local.mail,
        dir: mailDir,
        providerDir,
        pollMin: mailConfig.pollMin,
        perSignal: mailConfig.perSignal,
        words: { timedOut: textCatalog(config)['accounts.timed_out'] }
    });

    let closed = false;
    const writes = fsWrites();
    const context: ServerContext = {
        hub,
        terminals,
        hooks,
        git,
        hpc,
        calendar,
        mail,
        usage,
        usageRefresh,
        token,
        host,
        local,
        engine,
        fsWrites: writes,
        opsWrites: fsWrites(),
        ignoredCache: ignoredCache(),
        hpcLogPaths,
        calendarConnects: new ConnectStates(),
        calendarDir,
        mailConnects: new ConnectStates(),
        mailDir,
        providerDir,
        accounts: { file: localFile(engine), writes, reload: () => reloadAccounts() },
        opener: local.openBin === undefined ? macOpenAddress : addressOpener(local.openBin),
        openPath: macOpenPath,
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        memories: memoriesMemory(),
        icons,
        close(): void {
            if (closed) return;
            closed = true;
            localWatch.close();
            usageRefresh.close();
            mail.close();
            calendar.close();
            hpc.close();
            bookmarks.close();
            git.close();
            usage.close();
            sessions.close();
            portfolio.close();
            terminals.close();
        }
    };

    /**
     * Read the machine's own file again and hand its account lists and their folders to the routes
     * and the pollers. A file that no longer reads keeps what is held, and says why once on stderr,
     * as a start over it would; the pollers take a list equal to the one they hold as no change.
     */
    function reloadAccounts(): void {
        if (closed) return;
        let next: LocalConfig;
        try {
            next = make.loadLocal(engine);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.error(`the machine's own configuration is not read again: ${reason}`);
            return;
        }
        local.calendars = next.calendars;
        local.calendarDir = next.calendarDir;
        local.mail = next.mail;
        local.mailDir = next.mailDir;
        context.calendarDir = next.calendarDir ?? defaultConnectDir('calendar');
        context.mailDir = next.mailDir ?? defaultConnectDir('mail');
        calendar.setAccounts(local.calendars, context.calendarDir);
        mail.setAccounts(local.mail, context.mailDir);
    }

    // The watch on local.yml, for a row written by hand; a row written from the page is read again
    // by the route that wrote it, and the watch's call after it is then no change.
    const localWatch = make.watchLocal(engine, reloadAccounts);
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
