// Layer 2, server. The one fold from the configuration and the saved workspaces to the roots the
// file browser serves.
//
// Three callers need the same list and none of them may hold its own copy: the file route serves a
// file under one of them, the git watcher watches each of them, and the git endpoint checks a
// request against them. The fold reads two things, the configured roots of the request's own config
// and the saved workspaces file, and nothing else.

import { portfolioConfigOfOther } from '../../data/index.ts';
import { HUB_ROOT } from '../../data/helpers/hub-names.ts';
import type { PortfolioConfig, RawManifest, RepositoryRoot } from '../../data/model/index.ts';
import { loadConfig } from '../../data/sources/config.ts';
import { readHubManifests } from '../../data/sources/manifests.ts';
import { realPath } from '../core/paths.ts';
import {
    configuredRootsOf,
    ENGINE_ROOT,
    expandHome,
    hubRoots,
    readRoots,
    rootsFrom,
    type Root
} from './files.ts';
import { addedRoots, defaultWorkspacesPath, readSaved } from './fs.ts';

/**
 * What the fold needs: the configuration a route read from `locals.config()` at its request, and
 * the engine and the machine's own file off the request's ServerContext.
 */
export type RootsTarget = {
    config: Record<string, unknown>;
    engine: string;
    local: { hub: string; workspaces?: string };
};

/**
 * The roots the file browser serves: the fixed two, the configured ones, then the workspace's own.
 */
export function browserRoots(target: RootsTarget): Root[] {
    const fixed = rootsFrom(
        configuredRootsOf(target.config, target.engine, target.local.hub),
        target.local.hub,
        target.engine
    );
    const saved = readSaved(
        target.local.workspaces ?? defaultWorkspacesPath(target.local.hub),
        fixed.map((one) => one.key)
    );
    return [...fixed, ...addedRoots(fixed, saved)];
}

/**
 * The same list as directories, for the git channel. The engine's own config folder is left out: it
 * is a folder of this tool's checkout and not a repository of its own, so a git surface over it
 * would report the engine's repository under a second name. A root saved with a `~` in it is
 * expanded here, since what a watcher opens and what a write is checked against is a real
 * directory.
 */
export function repositoryRoots(target: RootsTarget): string[] {
    return browserRoots(target)
        .filter((one) => one.key !== ENGINE_ROOT)
        .map((one) => expandHome(one.dir));
}

/** A hub other than the first as a reader or a write needs it: its key, folder and own settings. */
export type HubTarget = { key: string; hub: string; config: PortfolioConfig };

/** The hubs other than the first that the roots in force name, each with its settings. */
export function hubTargets(target: RootsTarget): HubTarget[] {
    return hubRoots(browserRoots(target)).map((root) => ({
        key: root.key,
        hub: root.dir,
        config: portfolioConfigOfOther(loadConfig(target.engine, { hub: root.dir }).config)
    }));
}

/** A path as its real path when it is there, else as it is, so a link and its target match. */
function identityOf(path: string): string {
    return realPath(path, true) ?? path;
}

/**
 * The roots the project readers are handed, and the one place that decides which roots of the file
 * browser are repositories of their own. A root marked `hub: true` is built as a hub of its own and
 * a root keyed `hub` or `engine` is a fixed one, so each is dropped. A leading `~` is expanded, and
 * a root is dropped whose real path is the hub's, the engine's config folder's (when it is given)
 * or an earlier root's, so a second key, a second spelling or a link to a directory read already
 * draws no second card, and a root added from a workspace never shadows a configured one. A root
 * whose directory is not on this machine is kept, for the readers to find nothing in. The `tier` of
 * an entry travels with it; whether the repository is a research project or a side project is
 * decided where its manifest is read (data/sources/manifests.ts, `readHubManifests`).
 */
export function repositoriesOf(
    listed: readonly Root[],
    hub: string,
    engineConfig: string | null
): RepositoryRoot[] {
    const seen = new Set([identityOf(hub)]);
    if (engineConfig !== null) seen.add(identityOf(engineConfig));
    const keys = new Set<string>();
    const roots: RepositoryRoot[] = [];
    for (const root of listed) {
        if (root.hub === true || root.key === HUB_ROOT || root.key === ENGINE_ROOT) continue;
        if (keys.has(root.key)) continue;
        const dir = expandHome(root.dir);
        const identity = identityOf(dir);
        if (seen.has(identity)) continue;
        seen.add(identity);
        keys.add(root.key);
        roots.push({ key: root.key, dir, ...(root.tier === undefined ? {} : { tier: root.tier }) });
    }
    return roots;
}

/**
 * Every research manifest of the first hub the configuration reads: the scan folders' and the
 * repositories' that its `roots:` entries name with a research `tier`. The build reads the same
 * set from the roots it is handed, so a reader that holds only the merged configuration (a write,
 * a chat's context, a project's files) finds the projects the snapshot holds.
 */
export function hubManifests(hub: string, config: PortfolioConfig): RawManifest[] {
    const listed = readRoots(config.merged, 'sources.yml', hub).roots;
    return readHubManifests(hub, config.scan, repositoriesOf(listed, hub, null), config.text)
        .manifests;
}
