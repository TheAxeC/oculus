// Layer 2, server. Composes one process's server objects and carries them through each raw request.
// Both the built Node entry and Vite's development plugin call this function, so routes receive the
// same Hub, watchers, terminals, token and configuration as the socket serving that request.

import type { IncomingMessage } from 'node:http';
import {
    iconFindings,
    iconSet,
    type IconMemory,
    loadConfig,
    loadLocal,
    slurmSettings,
    textCatalog,
    usageTiers,
    type LocalConfig
} from '../data/sources/config.ts';
import type { Finding, Snapshot } from '../data/model.ts';
import { mintToken } from './auth.ts';
import { docFindings, layoutFile } from './docs.ts';
import { Hub } from './channels.ts';
import { RateLimiter, notifyConfig, type HookTarget } from './hooks.ts';
import type { LogPaths } from './hpc/actions.ts';
import type { Plan } from './deposit.ts';
import { fsWrites, type FsWrites } from './fs.ts';
import { wallpaperMemory, type WallpaperMemory } from './wallpaper.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from './hpc/poll.ts';
import { Terminals } from './pty/channel.ts';
import { projectFolders } from './sessions/index.ts';
import { HookStore, sessionRecord } from './sessions/hooks.ts';
import type { ProjectFolder } from './sessions/group.ts';
import { watchUsageRefresh, type UsageRefreshWatcher } from './usage/refresh.ts';
import { watchUsage, type UsageWatcher } from './usage/watch.ts';
import { watchGit, type GitWatcher } from './watch/git.ts';
import { watchPortfolio, type Watcher } from './watch/portfolio.ts';
import { watchSessions } from './watch/sessions.ts';

export type ServerContext = {
    hub: Hub;
    terminals: Terminals;
    hooks: HookTarget;
    git: GitWatcher;
    hpc: HpcWatcher;
    usage: UsageWatcher;
    usageRefresh: UsageRefreshWatcher;
    token: string;
    local: LocalConfig;
    config: Record<string, unknown>;
    /** The directory the configuration was read from, so a route names a config file without a walk. */
    engine: string;
    /** The write chain of the workspaces file, so two POSTs cannot lose one another's change. */
    fsWrites: FsWrites;
    /** The log path found per HPC job id. */
    hpcLogPaths: LogPaths;
    /** The last deposit plan per project. */
    depositPlans: Map<string, Plan>;
    /** The wallpaper pick and the refused directories. */
    wallpaper: WallpaperMemory;
    /**
     * The drawing of every icon config/icons.yml names, read once here and again whenever the
     * watcher publishes a config push, so a page load reads what is held rather than the disk.
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
    watchGit: (hub: Hub, root: string) => GitWatcher;
    watchHpc: (hub: Hub, options: HpcOptions) => HpcWatcher;
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
    watchGit: (hub, root) => watchGit(hub, { always: root }),
    watchHpc,
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
    const tiers = usageTiers(config);
    const hub = make.createHub();
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
        ...docFindings(config, local.hub, layoutFile(engine))
    ]);
    const portfolio = make.watchPortfolio(hub, { hub: local.hub, engine, icons });

    const folders = (): ProjectFolder[] => {
        const message = hub.latest('portfolio');
        return message === undefined ? [] : projectFolders(local.hub, message.payload as Snapshot);
    };
    const sessions = make.watchSessions(hub, {
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
    const git = make.watchGit(hub, local.hub);
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

    let closed = false;
    return {
        hub,
        terminals,
        hooks,
        git,
        hpc,
        usage,
        usageRefresh,
        token,
        local,
        config,
        engine,
        fsWrites: fsWrites(),
        hpcLogPaths,
        depositPlans: new Map(),
        wallpaper: wallpaperMemory(),
        icons,
        close(): void {
            if (closed) return;
            closed = true;
            usageRefresh.close();
            hpc.close();
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
