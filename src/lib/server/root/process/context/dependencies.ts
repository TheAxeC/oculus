// Layer 2, server. The constructors and watchers the server's composition root
// (server/root/context.ts, `createServerContext`) builds one process's server objects from: the
// ones a running process uses, gathered in one record so a test can replace any of them with a
// recorder and leave the rest as they run.

import { loadConfig, readMachine } from '../../../../data/sources/config.ts';
import { mintToken } from '../../../core/auth.ts';
import { Hub } from '../../../core/channels.ts';
import {
    watchCalendar,
    type CalendarOptions,
    type CalendarWatcher
} from '../../../accounts/calendar/poll.ts';
import { watchMail, type MailOptions, type MailWatcher } from '../../../accounts/mail/poll.ts';
import { watchHpc, type HpcOptions, type HpcWatcher } from '../../../machine/hpc/poll.ts';
import { DebugClient, type DebugOptions } from '../../../machine/debug/session.ts';
import { createRelay, type Relay } from '../../../machine/lsp/relay/relay.ts';
import type { RelayOptions } from '../../../machine/lsp/relay/relay-options.ts';
import { Terminals, type StreamTerminals } from '../../../machine/pty/channel.ts';
import {
    watchProcesses,
    type ProcessesOptions,
    type ProcessesWatcher
} from '../../../machine/processes/watch.ts';
import { HeldEslints, type HeldEslintsOptions } from '../../../machine/runs/lint/eslint.ts';
import {
    watchSchedules,
    type SchedulesOptions,
    type SchedulesWatcher
} from '../../../machine/runs/schedules/watch.ts';
import { watchUsageRefresh } from '../../../machine/usage/refresh.ts';
import { watchUsage } from '../../../machine/usage/watch.ts';
import { createWorkspace } from '../../../files/workspace/follow.ts';
import { defaultStateFolder } from '../../../files/workspace/state.ts';
import { startHosts } from '../apps-hosts.ts';
import { watchApps, type AppsWatchOptions, type AppsWatcher } from '../../watch/apps.ts';
import {
    watchAutofetch,
    type AutofetchOptions,
    type AutofetchWatcher
} from '../../watch/autofetch.ts';
import { watchBookmarks, type BookmarksWatchOptions } from '../../watch/bookmarks.ts';
import { watchGit, type GitWatcher, type GitWatchOptions } from '../../watch/git.ts';
import { watchLocal, type LocalWatcher } from '../../watch/local.ts';
import { watchPortfolio, type Watcher } from '../../watch/portfolio.ts';
import { watchSessions } from '../../watch/sessions.ts';

/**
 * The constructors and watchers a server context is built from, which a test replaces with
 * recorders (`createServerContext`).
 */
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
    createTerminals: (
        hub: Hub,
        streams: StreamTerminals,
        text: () => Record<string, string>
    ) => Terminals;
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

/** The constructors and watchers a server context is built from in a running process. */
export const contextDependencies: ContextDependencies = {
    readMachine,
    loadConfig,
    mintToken,
    stateFolder: defaultStateFolder,
    createWorkspace,
    createHub: () => new Hub(),
    createTerminals: (hub, streams, text) => new Terminals(hub, { streams, text }),
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
