// Layer 2, server. The wiring of the pollers the context builds: the Live HPC watchers, one per
// cluster of `slurm.resource` (whose batch carries Recover's section of that cluster), the
// Processes watcher, the calendar and mail pollers, and the two usage watchers a changed key of
// local.yml builds again. The context composes the server's objects and hands this module the
// settings each poller starts with, so what a poller is given is written here once and the
// composition root stays a list of what exists.

import type {
    CalendarSettings,
    LocalConfig,
    MailSettings,
    ProcessesSettings
} from '../../../data/sources/config.ts';
import { textCatalog } from '../../../data/sources/config.ts';
import type {
    CalendarOptions,
    CalendarWatcher,
    CalendarWords
} from '../../accounts/calendar/poll.ts';
import { signInRows } from '../../../data/sources/config.ts';
import { signInWords } from '../../accounts/connect/providers.ts';
import { defaultConnectDir, defaultProviderDir } from '../../accounts/connect/store.ts';
import type { MailOptions, MailWatcher, MailWords } from '../../accounts/mail/poll.ts';
import type { Hub } from '../../core/channels.ts';
import { logPathsOf, type ClusterLogPaths } from '../../machine/hpc/actions.ts';
import {
    watchClusters,
    type ClusterResolve,
    type HpcClusters
} from '../../machine/hpc/clusters/watch.ts';
import type {
    ClusterOut,
    HpcOptions,
    HpcSection,
    HpcSettings,
    HpcWatcher
} from '../../machine/hpc/poll.ts';
import { liveDeps } from '../../machine/processes/live.ts';
import type { ProcessesOptions, ProcessesWatcher } from '../../machine/processes/watch.ts';
import type { UsageRefreshWatcher, watchUsageRefresh } from '../../machine/usage/refresh.ts';
import type { UsageWatcher, watchUsage } from '../../machine/usage/watch.ts';
import type { ProjectFolder } from '../../sessions/group.ts';
import type { LiveSettings } from '../live-settings.ts';
import type { SessionsWatcher } from './sessions.ts';

/** How each poller is built; the context's dependencies carry these, and a test replaces them. */
type PollerBuilders = {
    watchHpc: (out: ClusterOut, options: HpcOptions) => HpcWatcher;
    resolveConnection: ClusterResolve;
    watchProcesses: (hub: Hub, options: ProcessesOptions) => ProcessesWatcher;
    watchCalendar: (hub: Hub, options: CalendarOptions) => CalendarWatcher;
    watchMail: (hub: Hub, options: MailOptions) => MailWatcher;
    watchUsageRefresh: typeof watchUsageRefresh;
    watchUsage: typeof watchUsage;
};

/** The settings of the configuration read at start, which the pollers are built with. */
type PollerSettings = {
    /**
     * The settings of each cluster of `slurm.resource`, resolved by the context, in order, and the
     * sentence for a hub that names none.
     */
    hpc: { clusters: HpcSettings[]; hint: string };
    /** Recover's section of the Live HPC batch of a cluster (runs/recover/live/batch.ts). */
    recover: (resource: string) => HpcSection;
    calendar: CalendarSettings;
    mail: MailSettings;
    processes: ProcessesSettings;
    /** The merged configuration, which the words the pollers carry are read from. */
    config: Record<string, unknown>;
};

/** What the pollers started once hold, for the context to carry and close. */
type Pollers = {
    hpc: HpcClusters;
    hpcLogPaths: ClusterLogPaths;
    processes: ProcessesWatcher;
    calendar: CalendarWatcher;
    calendarDir: string;
    calendarWords: CalendarWords;
    mail: MailWatcher;
    mailDir: string;
    mailWords: MailWords;
    providerDir: string;
};

/**
 * Start the pollers no key of local.yml builds again. `folders` gives the project folders at the
 * time of a read, so a project added while the server runs is counted.
 */
export function startPollers(
    make: PollerBuilders,
    hub: Hub,
    local: LocalConfig,
    settings: PollerSettings,
    folders: () => ProjectFolder[]
): Pollers {
    const { hpc: hpcSettings, recover, calendar, mail, processes, config } = settings;
    const text = textCatalog(config);
    // One map per cluster, two writers each: the log action writes what a press resolved, the
    // cluster's watcher's prewarm what it resolved behind the page, and neither replaces the
    // other's answer.
    const hpcLogPaths: ClusterLogPaths = new Map();
    const hpc = watchClusters(
        hub,
        {
            start: (one, out) =>
                make.watchHpc(out, {
                    ...one,
                    logPaths: logPathsOf(hpcLogPaths, one.resource),
                    recover: recover(one.resource)
                }),
            resolve: make.resolveConnection
        },
        hpcSettings.clusters,
        hpcSettings.hint
    );
    const watchedProcesses = make.watchProcesses(hub, {
        patterns: processes.patterns,
        deps: liveDeps(() => folders().map((one) => (typeof one === 'string' ? one : one[0]))),
        text
    });
    // The calendar poller reads the credential files of the folder the machine's own file names, so
    // a served test run is pointed at a directory of its own and never at the reader's. The client
    // halves are the provider folder's under this process's HOME, which a served run makes its own.
    // The sentences an account's row may carry are the catalog's, as the callback's are.
    const calendarDir = local.calendarDir ?? defaultConnectDir('calendar');
    const providerDir = defaultProviderDir();
    // Both pollers sign in through the hub's `sign_in` rows, which the live settings hand them
    // again when the hub's file changes.
    const providers = signInRows(config);
    const signIn = signInWords(config);
    const calendarWords: CalendarWords = {
        icsNoLink: text['calendar.ics_no_link'],
        icsFailed: text['calendar.ics_failed'],
        timedOut: text['accounts.timed_out'],
        signIn
    };
    const watchedCalendar = make.watchCalendar(hub, {
        accounts: local.calendars,
        dir: calendarDir,
        providerDir,
        providers,
        pollMin: calendar.pollMin,
        daysBack: calendar.daysBack,
        daysAhead: calendar.daysAhead,
        words: calendarWords
    });
    // The mail poller reads the credential files and the triage notes of the folder the machine's
    // own file names, for the same reason: a served test run is pointed at a directory of its own.
    const mailDir = local.mailDir ?? defaultConnectDir('mail');
    const mailWords: MailWords = { timedOut: text['accounts.timed_out'], signIn };
    const watchedMail = make.watchMail(hub, {
        accounts: local.mail,
        dir: mailDir,
        providerDir,
        providers,
        pollMin: mail.pollMin,
        perSignal: mail.perSignal,
        words: mailWords
    });
    return {
        hpc,
        hpcLogPaths,
        processes: watchedProcesses,
        calendar: watchedCalendar,
        calendarDir,
        calendarWords,
        mail: watchedMail,
        mailDir,
        mailWords,
        providerDir
    };
}

/** What the usage starters read of the context's late-bound holder. */
type UsageHolder = {
    live?: Pick<LiveSettings, 'held'>;
    parts?: { usage: Pick<UsageWatcher, 'refresh'> };
};

/**
 * The two usage watchers a changed `accounts` or `claudeBin` key of local.yml builds again. Each
 * reads the usage settings in force through `holder` when it is called, so the same code builds a
 * watcher at start and again after a rebuild.
 */
export function usageStarters(
    make: Pick<PollerBuilders, 'watchUsageRefresh' | 'watchUsage'>,
    hub: Hub,
    local: LocalConfig,
    start: { refresh: { refreshMin: number; model: string }; tiers: Record<string, string> },
    holder: UsageHolder,
    cwd: () => string
): {
    startUsageRefresh: () => UsageRefreshWatcher;
    startUsage: (from: {
        sessions: Pick<SessionsWatcher, 'onChange'>;
        usageRefresh: Pick<UsageRefreshWatcher, 'state'>;
    }) => UsageWatcher;
} {
    return {
        startUsageRefresh: () =>
            make.watchUsageRefresh({
                accounts: local.accounts,
                hub: cwd(),
                claudeBin: local.claudeBin,
                ...(holder.live?.held().refresh ?? start.refresh),
                onChange: () => void holder.parts?.usage.refresh()
            }),
        startUsage: (from) =>
            make.watchUsage(hub, {
                accounts: local.accounts,
                tiers: holder.live?.held().tiers ?? start.tiers,
                refresherFor: from.usageRefresh.state,
                onSessionsChange: from.sessions.onChange
            })
    };
}
