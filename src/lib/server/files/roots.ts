// Layer 2, server. The one fold from the configuration and the saved workspaces to the roots the
// file browser serves.
//
// Three callers need the same list and none of them may hold its own copy: the file route serves a
// file under one of them, the git watcher watches each of them, and the git endpoint checks a
// request against them. The fold reads two things, the configured roots of the request's own config
// and the saved workspaces file, and nothing else.

import { portfolioConfigFrom, portfolioConfigOfOther } from '../../data/index.ts';
import { HUB_ROOT } from '../../data/helpers/hub-names.ts';
import type {
    Finding,
    PortfolioConfig,
    RawManifest,
    RepositoryRoot
} from '../../data/model/index.ts';
import { configDir, loadConfig } from '../../data/sources/config.ts';
import { readHubManifests } from '../../data/sources/manifests.ts';
import { realPath } from '../core/paths.ts';
import {
    configuredRootsOf,
    ENGINE_ROOT,
    expandHome,
    hubRoots,
    addedProjectFindings,
    markAddedProjects,
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
 * A root of the workspace that holds a project manifest and cannot be a project is marked
 * `noProject` by the rules that mark a configured one, so the readers of projects treat the two
 * kinds of root alike.
 */
export function browserRoots(target: RootsTarget): Root[] {
    const { fixed, added } = rootsOfTarget(target);
    return [...fixed, ...markAddedProjects(fixed, added, target.local.hub)];
}

/**
 * The findings on the saved workspaces file: one for each folder added to the workspace that holds
 * a project manifest and cannot be a project, which `browserRoots` marks `noProject`.
 */
export function workspaceFindings(target: RootsTarget, catalog: Record<string, string>): Finding[] {
    const { fixed, added, file } = rootsOfTarget(target);
    return addedProjectFindings(fixed, added, target.local.hub, file, catalog);
}

/** The fixed and configured roots of a target, the roots its workspace adds, and the saved file. */
function rootsOfTarget(target: RootsTarget): { fixed: Root[]; added: Root[]; file: string } {
    const fixed = rootsFrom(
        configuredRootsOf(target.config, target.engine, target.local.hub),
        target.local.hub,
        target.engine
    );
    const file = target.local.workspaces ?? defaultWorkspacesPath(target.local.hub);
    const saved = readSaved(
        file,
        fixed.map((one) => one.key)
    );
    return { fixed, added: addedRoots(fixed, saved), file };
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
 * whose directory is not on this machine is kept, for the readers to find nothing in. A root that
 * `readRoots` marked `noProject` is dropped. Whether the repository is a project is decided where
 * its manifest is read (data/sources/manifests.ts, `readHubManifests`): a root with no manifest is
 * none.
 */
function repositoriesOf(
    listed: readonly Root[],
    hub: string,
    engineConfig: string | null
): RepositoryRoot[] {
    const seen = new Set([identityOf(hub)]);
    if (engineConfig !== null) seen.add(identityOf(engineConfig));
    const keys = new Set<string>();
    const roots: RepositoryRoot[] = [];
    for (const root of listed) {
        if (root.hub === true || root.noProject === true) continue;
        if (root.key === HUB_ROOT || root.key === ENGINE_ROOT) continue;
        if (keys.has(root.key)) continue;
        const dir = expandHome(root.dir);
        const identity = identityOf(dir);
        if (seen.has(identity)) continue;
        seen.add(identity);
        keys.add(root.key);
        roots.push({ key: root.key, dir });
    }
    return roots;
}

/**
 * The settings of the first hub with the repositories it reads as projects: the roots in `listed`
 * (what `browserRoots` serves, the configured ones and the workspace's own) that `repositoriesOf`
 * keeps. The build takes its settings through this, and so does `firstHubConfig`.
 */
export function withRepositories(
    portfolio: PortfolioConfig,
    listed: readonly Root[],
    hub: string,
    engineConfig: string | null
): PortfolioConfig {
    return { ...portfolio, repositories: repositoriesOf(listed, hub, engineConfig) };
}

/**
 * The settings of the first hub as a write, a chat's context, a task's seed or a project's files
 * read them: the same settings and the same repositories the build reads, so each of them finds the
 * projects the snapshot holds.
 */
export function firstHubConfig(target: RootsTarget): PortfolioConfig {
    return withRepositories(
        portfolioConfigFrom(target.config),
        browserRoots(target),
        target.local.hub,
        configDir(target.engine)
    );
}

/**
 * Every project manifest of a hub: the scan folders' and the repositories' that its settings name
 * (`PortfolioConfig.repositories`). It is the one reader of a hub's projects after the build, so a
 * reader that holds only the settings finds the projects the snapshot holds.
 */
export function hubManifests(hub: string, config: PortfolioConfig): RawManifest[] {
    return readHubManifests(hub, config.scan, config.repositories, config.text).manifests;
}
