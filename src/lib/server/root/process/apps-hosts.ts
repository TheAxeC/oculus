// Layer 2, server. The hosts of the apps joined to what they read: the apps watcher that tells them
// when the apps changed, the stores they write through the write target of the process, the
// keyring, the text catalog and the folders of the open workspace. The composition root builds them
// through this module so `context.ts` holds one call.
//
// Three things the watchers raise reach the hosts here: every full read of the apps is a
// `reconcile` and a look at the settings the hosts hold, a change of a store file is a
// `storeChanged` for the apps it belongs to, and a source tab opening a file is an `onLanguage`
// event for the language of that file.

import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isMap } from '../../../data/helpers/guards.ts';
import { parseSourceChannel } from '../../../data/helpers/files/address.ts';
import { appSettingValues, settingValues } from '../../../data/helpers/files/apps/settings.ts';
import { joinedFor } from '../../../data/helpers/files/apps/tools/languages.ts';
import { languageMap } from '../../../data/helpers/files/languages.ts';
import {
    appsSettings,
    closedPaths,
    configDir,
    textCatalog,
    type LocalConfig
} from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import type { GitCredentials } from '../../core/git/credentials.ts';
import type { FsWrites } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import { updateHostStore } from '../../edit/writes/apps/host-store.ts';
import type { WriteTarget } from '../../edit/writes.ts';
import type { OpenWorkspace } from '../../files/workspace/open.ts';
import { perOculus } from '../../files/workspace/paths.ts';
import { expandHome, type Root } from '../../files/files.ts';
import { createOpenFiles, type OpenFiles } from '../../files/fs/open-files.ts';
import { defaultHistoryDir } from '../../files/fs/history.ts';
import { runOps } from '../../files/fs/ops.ts';
import { approvedApps, defaultApprovalsPath } from '../../machine/approvals/approvals.ts';
import { AppHosts } from '../../machine/apps/host/manager.ts';
import type { StreamTerminalSet } from '../../machine/apps/tools/run/stream-terminals.ts';
import { terminalsEnv } from '../../machine/apps/tools/run/terminals-env.ts';
import type { Terminals } from '../../machine/pty/channel.ts';
import { diskFs } from '../../machine/apps/reach/open.ts';
import { closedToApps } from '../../machine/apps/reach/private.ts';
import { ownFolder } from '../../machine/lsp/servers.ts';
import { readStore } from '../../machine/apps/store/store.ts';
import { createSecrets, nodeKeyring, type AppSecrets } from '../../machine/apps/secrets/secrets.ts';
import type { AppsWatcher } from '../watch/apps.ts';

/** The runner every host is started with, in oculus's own folder. */
const RUNNER = 'src/lib/server/machine/apps/host/runner/host-runner.mjs';

/** What the hosts are made over. */
export type StartHostsOptions = {
    hub: Hub;
    apps: AppsWatcher;
    local: () => LocalConfig;
    config: () => Record<string, unknown>;
    /** The engine's folder, whose configuration is the one in force. */
    engine: string;
    /** The open workspace as it is now. */
    open: () => OpenWorkspace;
    /** Call the listener when the open workspace moves; the answer takes it away. */
    follow?: (listener: () => void) => () => void;
    /** The write target of the process, which a host's store update is written through. */
    target: () => WriteTarget;
    /** The chain the file edits of the hosts wait on, apart from the one the stores wait on. */
    opsWrites: FsWrites;
    /** The terminals the pages list, which the hosts' terminals and tasks start in. */
    terminals: Terminals;
    /** The terminals the hosts hold as streams. */
    streamTerminals: StreamTerminalSet;
    /** The server context's git credentials, which the hosts' tmux terminals carry. */
    credentials: GitCredentials;
    /**
     * Settles when the server this context serves is listening; no host starts before it. A dev
     * reload makes the next server before it closes the old one, and listens on it only after the
     * old one closed and the plugin's `closeServer` hook waited for the old hosts to stop.
     */
    ready?: Promise<void>;
};

/** The hosts and the secrets they and the pages share, and the open files that feed them. */
export type StartedHosts = {
    hosts: AppHosts;
    secrets: AppSecrets;
    openFiles: OpenFiles;
    stop: () => void;
};

/** Start the hosts: they judge every app once and again after every read. */
export function startHosts(options: StartHostsOptions): StartedHosts {
    const text = (): Record<string, string> => textCatalog(options.config());
    const secrets = createSecrets({
        keyring: nodeKeyring(),
        unavailable: () => words(text(), 'server.apps.secrets_unavailable')
    });
    const roots = (): Root[] => options.open().roots;
    const hosts = new AppHosts({
        hub: options.hub,
        apps: options.apps,
        settings: () => appsSettings(options.config()),
        roots: () => roots().map((root) => ({ ...root, dir: expandHome(root.dir) })),
        languages: () =>
            joinedFor(
                languageMap(options.config()),
                options.apps.held().apps.map((one) => one.row)
            ),
        tools: {
            context: () => ({
                roots: roots().map((root) => ({ ...root, dir: expandHome(root.dir) })),
                configDir: configDir(options.engine),
                closedPaths: closedPaths(options.config()).folders,
                privateReal: closedToApps({
                    home: homedir(),
                    local: options.local(),
                    perOculus: perOculus(options.open().primaryDir, options.config()),
                    roots: roots()
                }),
                fs: diskFs
            }),
            maxBytes: () => appsSettings(options.config()).maxMb * 1024 * 1024,
            scanEntries: () => appsSettings(options.config()).scanEntries,
            languages: () =>
                joinedFor(
                    languageMap(options.config()),
                    options.apps.held().apps.map((one) => one.row)
                ),
            terminals: terminalsEnv({
                terminals: options.terminals,
                streams: options.streamTerminals,
                shell: () => process.env.SHELL ?? '/bin/sh',
                credentials: options.credentials
            }),
            ops: (operation, app) =>
                runOps(
                    {
                        roots: roots().map((root) => ({ ...root, dir: expandHome(root.dir) })),
                        writes: options.opsWrites,
                        changes: options.target().changes,
                        history: options.local().history ?? defaultHistoryDir()
                    },
                    operation,
                    { trashReplaced: false, app }
                )
        },
        approved: () => approvedApps(options.local().approvals ?? defaultApprovalsPath()),
        store: {
            get: (app) => {
                const read = readStore(
                    app.row.storeFile,
                    appsSettings(options.config()).storeMaxKb
                );
                return isMap(read.value) ? read.value : {};
            },
            update: (app, key, value) => updateHostStore(options.target(), app, key, value)
        },
        secrets,
        text,
        values: (app) =>
            settingValues(
                app.row.contributes.configuration?.properties ?? [],
                appSettingValues(options.config())
            ),
        after: options.ready,
        node: process.execPath,
        runner: join(ownFolder(), RUNNER),
        jsonrpc: createRequire(join(ownFolder(), 'package.json')).resolve('vscode-jsonrpc/node')
    });
    // The roots are read again after a configuration push or a move of the open workspace, as the
    // git watcher's are, so a folder added to the workspace while the server runs is followed by
    // the next tick of each open file.
    const openFiles = createOpenFiles({
        hub: options.hub,
        roots: () => roots(),
        follow: options.follow
    });
    const offRead = options.apps.onRead(() => {
        hosts.reconcile();
        hosts.settingsChanged();
    });
    const offStores = options.apps.onStores((ids) => hosts.storeChanged(ids));
    hosts.reconcile();
    return {
        hosts,
        secrets,
        openFiles: trackLanguages(openFiles, hosts),
        stop: () => {
            offRead();
            offStores();
            void hosts.close();
        }
    };
}

/** The open files, each source tab that opens a file raising the language event for it. */
function trackLanguages(openFiles: OpenFiles, hosts: AppHosts): OpenFiles {
    return {
        ...openFiles,
        subscribed(sink, channels) {
            const refused = openFiles.subscribed(sink, channels);
            for (const channel of channels) {
                const named = refused.includes(channel) ? null : parseSourceChannel(channel);
                if (named !== null) hosts.opened(named.path);
            }
            return refused;
        }
    };
}
