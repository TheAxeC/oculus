// Layer 2, server. How the git watcher and the automatic fetch are built for the running server:
// which roots the watcher is handed (the folders of the workspace and the folders the projects are
// cloned into), the hubs whose nested repositories it lists, the text catalog and the repository
// scan depths it reads with them (the global one and the folders' own), and the re-read the fetch
// asks of the watcher in force. They are read from the open workspace and the configuration at each
// call, so a folder added to the workspace, a changed depth and a changed catalog are in force when
// the move that follows reaches the watcher.

import { repositoryScanDepth, textCatalog } from '../../../../data/sources/config.ts';
import type { Hub } from '../../../core/channels.ts';
import { project, projectIds } from '../../../sessions/stores/hooks.ts';
import { hubFolders, repositoryDepths, repositoryRoots } from '../../../files/roots.ts';
import type { Workspace } from '../../../files/workspace/follow.ts';
import type { AutofetchOptions, AutofetchWatcher } from '../autofetch.ts';
import { syncNested } from '../../../git/clone/exclude.ts';
import type { GitWatcher, GitWatchOptions } from '../git.ts';
import type { NestedFound } from './nested.ts';

/** What the git watcher's start reads from the process: the configuration, as it is now. */
export type GitStart = {
    loadConfig: (engine: string, opts?: { hub?: string }) => { config: Record<string, unknown> };
    watchGit: (hub: Hub, options: GitWatchOptions) => GitWatcher;
    watchAutofetch: (hub: Hub, options: AutofetchOptions) => AutofetchWatcher;
};

/**
 * The folders that hold a clone of a project of the last published portfolio, whatever their depth,
 * so a clone at the bottom of a hub is on the channel.
 */
function clonedFolders(hub: Hub): string[] {
    return projectIds(hub).flatMap((id) => project(hub, id)?.repository?.clones ?? []);
}

/**
 * What the git watcher's lists of nested repositories leave with the server: the repositories of
 * the workspace, which the portfolio reads to tell a project's clones, and the write of the exclude
 * blocks in flight, which the next write waits for.
 */
export type NestedHold = { repositories: readonly string[]; write: Promise<void> };

/**
 * The `found` option of the git watcher: hold the repositories of the workspace, write the block of
 * nested repositories into the exclude file of each hub's repository, one write at a time, and ask
 * for the portfolio to be read again, since the clones of its projects are among them.
 */
export function nestedFound(hold: NestedHold, rescan: () => void): (found: NestedFound) => void {
    return (found) => {
        hold.repositories = found.repositories;
        hold.write = hold.write
            .then(() => syncNested(found.hubs))
            .then(() => undefined)
            .catch((error: unknown) => {
                const said = error instanceof Error ? error.message : String(error);
                console.error(`nested repositories: the exclude was not written: ${said}`);
            });
        rescan();
    };
}

/**
 * Every folder of the open workspace is on the `git` channel, so the Repositories view is over the
 * repositories the reader listed and not only the ones a session is working in.
 */
export function startGit(
    make: GitStart,
    hub: Hub,
    engine: string,
    workspace: Pick<Workspace, 'open' | 'subscribe'>,
    found: (found: NestedFound) => void
): GitWatcher {
    const config = (): Record<string, unknown> =>
        make.loadConfig(engine, { hub: workspace.open().primaryDir ?? undefined }).config;
    return make.watchGit(hub, {
        roots: () => repositoryRoots(workspace.open()),
        text: () => textCatalog(config()),
        depth: () => repositoryScanDepth(config()),
        rootDepths: () => repositoryDepths(workspace.open()),
        cloned: () => clonedFolders(hub),
        hubs: () => hubFolders(workspace.open()),
        found,
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
