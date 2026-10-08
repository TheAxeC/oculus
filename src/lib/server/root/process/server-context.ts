// Layer 2, server. The type of the server context: every process-owned object the server's
// composition root builds once and carries through each request (context.ts builds it and
// re-exports this type, so every importer reads it from there). It holds the hub, the terminals,
// the language server relay, the debug session, the watchers and the machine's own values, each
// with what owns it and what closes it.

import type { LocalConfig } from '../../../data/sources/config.ts';
import type { HostInfo } from '../../../data/model/index.ts';
import type { AccountBook } from '../../accounts/connect/actions.ts';
import type { CalendarWatcher } from '../../accounts/calendar/poll.ts';
import type { ConnectStates } from '../../accounts/connect/oauth.ts';
import type { MailWatcher } from '../../accounts/mail/poll.ts';
import type { IconMemory } from '../../../data/sources/config.ts';
import type { LiteratureDesk } from '../../content/literature/desk.ts';
import type { MemoriesMemory } from '../../content/memories.ts';
import type { WallpaperMemory } from '../../content/wallpaper.ts';
import type { Hub } from '../../core/channels.ts';
import type { RunningGit } from '../../core/git/running.ts';
import type { FsWrites } from '../../core/json.ts';
import type { IgnoredCache } from '../../files/fs.ts';
import type { OpenFiles } from '../../files/fs/open-files.ts';
import type { PickerState } from '../../files/fs/picker.ts';
import type { Opener, PathOpener } from '../../files/open.ts';
import type { Plan } from '../../git/deposit.ts';
import type { DebugClient } from '../../machine/debug/session.ts';
import type { LogPaths } from '../../machine/hpc/actions.ts';
import type { HpcWatcher } from '../../machine/hpc/poll.ts';
import type { SubmitState } from '../../machine/hpc/submit.ts';
import type { Relay } from '../../machine/lsp/relay.ts';
import type { Terminals } from '../../machine/pty/channel.ts';
import type { HeldEslints } from '../../machine/runs/lint/eslint.ts';
import type { LintRuns } from '../../machine/runs/lint/runs.ts';
import type { SchedulesWatcher } from '../../machine/runs/schedules/watch.ts';
import type { UsageRefreshWatcher } from '../../machine/usage/refresh.ts';
import type { UsageWatcher } from '../../machine/usage/watch.ts';
import type { HookTarget } from '../hooks.ts';
import type { ConfigCache } from './config-cache.ts';
import type { AppsWatcher } from '../watch/apps.ts';
import type { GitWatcher } from '../watch/git.ts';

export type ServerContext = {
    hub: Hub;
    terminals: Terminals;
    /** The language servers behind the `lsp:` channels of the socket. */
    relay: Relay;
    /** The one debug session of the server, whose adapter process `close` ends. */
    debug: DebugClient;
    /** The linter runs in flight, which `close` stops. */
    lintRuns: LintRuns;
    /** The ESLint children held per repository, which `close` ends. */
    eslint: HeldEslints;
    hooks: HookTarget;
    git: GitWatcher;
    /** The files open in source tabs, polled for a change on disk behind the `source:` channels. */
    openFiles: OpenFiles;
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
    /**
     * The parse of the config folder, kept between requests while no file of the folder changes;
     * a request reads it once through `locals.config`.
     */
    configCache: ConfigCache;
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
    /**
     * The folder panel open now, as the controller that ends it, so a second request while it is
     * open is answered busy and `close` ends it.
     */
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
