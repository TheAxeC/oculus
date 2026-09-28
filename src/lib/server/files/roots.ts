// Layer 2, server. The one fold from the configuration and the saved workspaces to the roots the
// file browser serves.
//
// Three callers need the same list and none of them may hold its own copy: the file route serves a
// file under one of them, the git watcher watches each of them, and the git endpoint checks a
// request against them. The fold reads two things, the configured roots of the request's own config
// and the saved workspaces file, and nothing else.

import { configuredRootsOf, ENGINE_ROOT, expandHome, rootsFrom, type Root } from './files.ts';
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
        configuredRootsOf(target.config, target.engine),
        target.local.hub,
        target.engine
    );
    const saved = readSaved(
        target.local.workspaces ?? defaultWorkspacesPath(),
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
