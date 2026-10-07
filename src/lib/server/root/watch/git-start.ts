// Layer 2, server. How the git watcher and the automatic fetch are built for the running server:
// which roots the watcher is handed, the text catalog and the repository scan depth it reads with
// them, and the re-read the fetch asks of the watcher in force. They are read from the
// configuration at each call, so a root added to sources.yml, a changed depth and a changed
// catalog are in force when the config push that follows the save reaches the watcher.

import { repositoryScanDepth, textCatalog } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import { defaultWorkspacesPath } from '../../files/fs.ts';
import { repositoryRoots } from '../../files/roots.ts';
import type { AutofetchOptions, AutofetchWatcher } from './autofetch.ts';
import type { GitWatcher, GitWatchOptions } from './git.ts';

/** What the git watcher's start reads from the process: the configuration, as it is now. */
export type GitStart = {
    loadConfig: (engine: string) => { config: Record<string, unknown> };
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchAutofetch: (hub: Hub, options: AutofetchOptions) => AutofetchWatcher;
};

/** The machine's own file's values the watcher needs: the hub and the saved workspaces file. */
export type GitLocal = { hub: string; workspaces?: string };

/**
 * Every root the file browser serves is on the `git` channel, so the Repositories view is over the
 * repositories the reader configured and not only the ones a session is working in. The hub is
 * watched whether or not a session names it.
 */
export function startGit(make: GitStart, hub: Hub, engine: string, local: GitLocal): GitWatcher {
    const config = (): Record<string, unknown> => make.loadConfig(engine).config;
    return make.watchGit(hub, {
        always: local.hub,
        roots: () => repositoryRoots({ config: config(), engine, local }),
        text: () => textCatalog(config()),
        depth: () => repositoryScanDepth(config()),
        workspacesFile: local.workspaces ?? defaultWorkspacesPath()
    });
}

/**
 * The timer reads the `config` and `git` channels, so it is started after the git watcher has its
 * roots, and re-reads a root's state through the git watcher `current` returns after each fetch.
 */
export function startAutofetch(
    make: GitStart,
    hub: Hub,
    current: () => GitWatcher
): AutofetchWatcher {
    return make.watchAutofetch(hub, { refresh: (root) => current().refresh(root) });
}
