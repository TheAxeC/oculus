// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.

import type { IncomingMessage } from 'node:http';
import {
    behaviorFindings,
    calendarSettings,
    iconFindings,
    iconSet,
    type IconMemory,
    loadConfig,
    loadLocal,
    mailSettings,
    openSettings,
    slurmSettings,
    textCatalog,
    usageTiers,
    type LocalConfig
} from '../../data/sources/config.ts';
import { requirePaintLimit } from '../../data/helpers/editor.ts';
import type { Finding, Snapshot } from '../../data/model.ts';
import { mintToken } from './auth.ts';
import { ConnectStates } from '../accounts/connect/oauth.ts';
import { defaultConnectDir } from '../accounts/connect/store.ts';
import {
    watchCalendar,
    type CalendarOptions,
    type CalendarWatcher
} from '../accounts/calendar/poll.ts';
import { watchMail, type MailOptions, type MailWatcher } from '../accounts/mail/poll.ts';
import { macOpenAddress, macOpenPath, type Opener, type PathOpener } from '../files/open.ts';
import { docFindings, layoutFile } from '../content/docs.ts';
import { Hub } from './channels.ts';
import { registerFilesChannel } from '../files/files-channel.ts';
import { RateLimiter, notifyConfig, type HookTarget } from './hooks.ts';
import type { LogPaths } from '../machine/hpc/actions.ts';
import type { Plan } from '../git/deposit.ts';
import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
import { defaultWorkspacesPath, fsWrites, type FsWrites } from '../files/fs.ts';
import { memoriesMemory, type MemoriesMemory } from '../content/memories.ts';
import { repositoryRoots } from '../files/roots.ts';
import { wallpaperMemory, type WallpaperMemory } from '../content/wallpaper.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from '../machine/hpc/poll.ts';
import { Terminals } from '../machine/pty/channel.ts';
import { projectFolders } from '../sessions/index.ts';
import { HookStore, sessionRecord } from '../sessions/stores/hooks.ts';
import type { ProjectFolder } from '../sessions/group.ts';
import { sessionFolders } from '../sessions/folders.ts';
import { watchUsageRefresh, type UsageRefreshWatcher } from '../machine/usage/refresh.ts';
import { watchUsage, type UsageWatcher } from '../machine/usage/watch.ts';
import { watchBookmarks, type BookmarksWatchOptions } from '../watch/bookmarks.ts';
import { watchGit, type GitWatcher, type GitWatchOptions } from '../watch/git.ts';
import { watchPortfolio, type Watcher } from '../watch/portfolio.ts';
import { watchSessions } from '../watch/sessions.ts';

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
    local: LocalConfig;
    config: Record<string, unknown>;
    /**
     * The directory the configuration was read from, so a route names a config file without a walk.
     */
    engine: string;
    /** The write chain of the workspaces file, so two POSTs cannot lose one another's change. */
    fsWrites: FsWrites;
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
        paths: { hub: string; engine: string; icons: IconMemory }
    ) => Watcher;
    watchSessions: typeof watchSessions;
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchBookmarks: (hub: Hub, options: BookmarksWatchOptions) => Watcher;
    watchHpc: (hub: Hub, options: HpcOptions) => HpcWatcher;
    watchCalendar: (hub: Hub, options: CalendarOptions) => CalendarWatcher;
    watchMail: (hub: Hub, options: MailOptions) => MailWatcher;
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
    reportFindings([
        ...iconFindings(engine, config),
        ...behaviorFindings(engine, config),
        ...docFindings(config, local.hub, layoutFile(engine))
    ]);
    const portfolio = make.watchPortfolio(hub, { hub: local.hub, engine, icons });

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
    const usageRefresh = make.watchUsageRefresh({
        accounts: local.accounts,
        hub: local.hub,
        claudeBin: local.claudeBin,
        model: config.usage_refresh_model as string,
        refreshMin: config.usage_refresh_min as number,
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
    // a served test run is pointed at a directory of its own and never at the reader's.
    const calendarDir = local.calendarDir ?? defaultConnectDir('calendar');
    const calendar = make.watchCalendar(hub, {
        accounts: local.calendars,
        dir: calendarDir,
        pollMin: calendarConfig.pollMin,
        daysBack: calendarConfig.daysBack,
        daysAhead: calendarConfig.daysAhead
    });

    // The mail poller reads the credential files and the triage notes of the folder the machine's
    // own file names, for the same reason: a served test run is pointed at a directory of its own.
    const mailDir = local.mailDir ?? defaultConnectDir('mail');
    const mail = make.watchMail(hub, {
        accounts: local.mail,
        dir: mailDir,
        pollMin: mailConfig.pollMin,
        perSignal: mailConfig.perSignal
    });

    let closed = false;
    return {
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
        local,
        config,
        engine,
        fsWrites: fsWrites(),
        hpcLogPaths,
        calendarConnects: new ConnectStates(),
        calendarDir,
        mailConnects: new ConnectStates(),
        mailDir,
        opener: macOpenAddress,
        openPath: macOpenPath,
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        memories: memoriesMemory(),
        icons,
        close(): void {
            if (closed) return;
            closed = true;
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
