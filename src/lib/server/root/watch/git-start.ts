// Layer 2, server. How the git watcher and the automatic fetch are built for the running server:
// which roots the watcher is handed, the text catalog and the repository scan depth it reads with
// them, and the re-read the fetch asks of the watcher in force. They are read from the open
// workspace and the configuration at each call, so a folder added to the workspace, a changed depth
// and a changed catalog are in force when the move that follows reaches the watcher.

import { repositoryScanDepth, textCatalog } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import { repositoryRoots } from '../../files/roots.ts';
import type { Workspace } from '../../files/workspace/follow.ts';
import type { AutofetchOptions, AutofetchWatcher } from './autofetch.ts';
import type { GitWatcher, GitWatchOptions } from './git.ts';

/** What the git watcher's start reads from the process: the configuration, as it is now. */
export type GitStart = {
    loadConfig: (engine: string, opts?: { hub?: string }) => { config: Record<string, unknown> };
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchAutofetch: (hub: Hub, options: AutofetchOptions) => AutofetchWatcher;
};

/**
 * Every folder of the open workspace is on the `git` channel, so the Repositories view is over the
 * repositories the reader listed and not only the ones a session is working in.
 */
export function startGit(
    make: GitStart,
    hub: Hub,
    engine: string,
    workspace: Pick<Workspace, 'open' | 'subscribe'>
): GitWatcher {
    const config = (): Record<string, unknown> =>
        make.loadConfig(engine, { hub: workspace.open().primaryDir ?? undefined }).config;
    return make.watchGit(hub, {
        roots: () => repositoryRoots(workspace.open()),
        text: () => textCatalog(config()),
        depth: () => repositoryScanDepth(config()),
        follow: (listener) => workspace.subscribe(listener)
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
