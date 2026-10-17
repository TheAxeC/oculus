// Layer 2, server. The folds from the open workspace (server/files/workspace) to the lists the
// readers of the hubs and of the project folders need.
//
// Three callers need the same lists and none of them may hold its own copy: the portfolio build
// reads the project folders of the workspace as projects of the primary hub, a write reads the
// primary's settings and the settings of every other hub, and the git watch opens each folder. The
// roots the file route, the listing, the search and the language servers serve are the workspace's
// folders (`OpenWorkspace.roots`), read from the workspace and never from here.
//
// The settings of a hub other than the primary are never parsed here: a caller hands the reader of
// them (`HubSettings`), which the server answers from the parse its config cache keeps for each hub
// (server/root/process/config-cache.ts), so a request that lists the hubs parses no config folder
// while no file of it changed.

import { portfolioConfigFrom, type HubSettings } from '../../data/index.ts';
import type { PortfolioConfig, RawManifest, RepositoryRoot } from '../../data/model/index.ts';
import { readHubManifests } from '../../data/sources/manifests.ts';
import type { OpenWorkspace } from './workspace/open.ts';
import { expandHome } from './workspace/folders.ts';

/** A hub other than the primary as a reader or a write needs it: its name, folder and settings. */
export type HubTarget = { key: string; hub: string; config: PortfolioConfig };

/**
 * The folders of the workspace as directories, for the git watch and the terminal: a hub, a project
 * folder and a plain folder alike. A leading `~` is expanded, since what a watcher opens and what a
 * write is checked against is a real directory.
 */
export function repositoryRoots(open: OpenWorkspace): string[] {
    return open.roots.map((one) => expandHome(one.dir));
}

/** The folders of the workspace that are hubs, by the directory the git watch opens them at. */
export function hubFolders(open: OpenWorkspace): string[] {
    return open.hubs.map((one) => expandHome(one.dir));
}

/**
 * The scan depth of each folder of the workspace that has its own `repository_scan_depth`, by the
 * directory the git watch opens it at; a folder without one is not in the map.
 */
export function repositoryDepths(open: OpenWorkspace): Map<string, number> {
    const depths = new Map<string, number>();
    for (const one of open.roots) {
        if (one.scanDepth !== undefined) depths.set(expandHome(one.dir), one.scanDepth);
    }
    return depths;
}

/**
 * The hubs of the workspace other than the primary, each with its settings (the engine's defaults
 * under the hub's own `.oculus/config.yml`) as `settings` gives them. A hub's project folders are
 * the primary's alone, so a hub other than the primary reads none.
 */
export function hubTargets(open: OpenWorkspace, settings: HubSettings): HubTarget[] {
    return open.hubs
        .filter((one) => one.name !== open.primary)
        .map((one) => {
            const loaded = settings(one.dir);
            return {
                key: one.name,
                hub: one.dir,
                config: portfolioConfigFrom(loaded.config, loaded.from)
            };
        });
}

/**
 * Every hub of the workspace with its settings, in the folders' order: the primary's from the
 * merged config the request read, every other hub's from its own layer as `settings` gives it. The
 * readers of a thing each hub keeps (the photo walls, the wallpaper folders) go over this list.
 */
export function allHubs(
    merged: Record<string, unknown>,
    open: OpenWorkspace,
    settings: HubSettings
): HubTarget[] {
    const others = hubTargets(open, settings);
    return open.hubs.flatMap((one) => {
        if (one.name === open.primary) {
            return [{ key: one.name, hub: one.dir, config: primaryConfig(merged, open) }];
        }
        return others.filter((held) => held.key === one.name);
    });
}

/**
 * The folders the project readers are handed: every folder of the workspace that is no hub, is not
 * marked `noProject` and holds a `project.yml` or a `.oculus/project.yml`, which `readHubManifests`
 * decides. A folder is listed once whatever it is called, since the workspace reader leaves out a
 * second entry over one real path.
 */
export function repositoriesOf(open: OpenWorkspace): RepositoryRoot[] {
    return open.roots
        .filter((one) => one.hub !== true && one.noProject !== true)
        .map((one) => ({ key: one.key, dir: expandHome(one.dir) }));
}

/**
 * The settings of the primary hub as a write, a chat's context, a task's seed or a project's files
 * read them, with the project folders of the workspace as its repositories: the same settings and
 * the same repositories the build reads, so each of them finds the projects the snapshot holds. The
 * build passes `from`, which file of the config each key came from, so the hub reports only the
 * files its own settings file names.
 */
export function primaryConfig(
    merged: Record<string, unknown>,
    open: OpenWorkspace,
    from?: Readonly<Partial<Record<string, string>>>
): PortfolioConfig {
    return { ...portfolioConfigFrom(merged, from), repositories: repositoriesOf(open) };
}

/**
 * Every project manifest of a hub: the scan folders' and the repositories' that its settings name
 * (`PortfolioConfig.repositories`). It is the one reader of a hub's projects after the build, so a
 * reader that holds only the settings finds the projects the snapshot holds.
 */
export function hubManifests(hub: string, config: PortfolioConfig): RawManifest[] {
    return readHubManifests(hub, config.scan, config.repositories, config.text).manifests;
}
