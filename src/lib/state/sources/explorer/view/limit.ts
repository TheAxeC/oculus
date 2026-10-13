// Layer 2, client state, pure. The folder a view tab is limited to. A workbench page gives each tab
// of its left pane the folder it belongs to, in the tab's own instance state: Files rooted at it,
// Search under it, Problems scoped to its root and path, Repositories and the sessions list limited
// to it. Repositories and the sessions list keep it as `folder` (`{ root, path }`), which is what
// this module reads and writes; Files, Search and Problems keep it in the fields they already read.
//
// A folder is a served root's key and a path inside that root, the empty text for the root itself.
// The views that list absolute places (the repositories of the `git` channel, the sessions) compare
// them against the folder's absolute folder, the root's folder joined with the path.

import { z } from 'zod';
import { joinPath, pathUnder } from '../../../../data/helpers/files/paths.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import { readAs } from '../../../../data/shapes/shapes.ts';

/** A folder as a view's instance state holds it: a served root's key and a path inside it. */
export type LimitFolder = { root: string; path: string };

/** A saved folder: a root key that carries something and a path. */
const limitShape = z.object({ root: z.string().min(1), path: z.string() });

/** The folder an instance state is limited to, or null for a tab that is limited to none. */
export function limitOf(state: unknown): LimitFolder | null {
    const found = isMap(state) ? readAs(limitShape, state.folder) : null;
    return found === null ? null : { root: found.root, path: found.path };
}

/** An instance state with its folder set, or taken away when the folder is null. */
export function withLimit(state: unknown, folder: LimitFolder | null): Record<string, unknown> {
    const next: Record<string, unknown> = isMap(state) ? { ...state } : {};
    if (folder === null) delete next.folder;
    else next.folder = { root: folder.root, path: folder.path };
    return next;
}

/**
 * The absolute folder of a limit: the real folder of the root it names joined with its path (the
 * configured folder where a root carries no real one), or null when no served root has that key or
 * the root's folder does not exist. The `git` channel and the sessions name places by real path.
 */
export function limitDir(
    roots: readonly { key: string; dir: string; real?: string }[],
    folder: LimitFolder
): string | null {
    const root = roots.find((one) => one.key === folder.root);
    const base = root === undefined ? '' : (root.real ?? root.dir);
    return base === '' ? null : joinPath(base, folder.path);
}

/**
 * Whether a repository is one a folder's workbench lists: a repository inside the folder, or the
 * one that holds the folder, so a project folder under the hub lists the hub's repository.
 */
function repositoryInLimit(repository: string, folder: string): boolean {
    return pathUnder(folder, repository) !== null || pathUnder(repository, folder) !== null;
}

/**
 * The repositories a tab limited to a folder lists, each as the root that shows it: those of
 * `every` whose top folder lies inside the folder or holds it, none when no served root has the
 * folder's root key, and all of them for a tab limited to no folder. The top is the real path git
 * names, as the folder's is, so a repository is judged by its own folder and not by a root inside
 * it.
 */
export function limitedRepositories(
    every: readonly { top: string; shown: string }[],
    roots: readonly { key: string; dir: string; real?: string }[],
    folder: LimitFolder | null
): string[] {
    if (folder === null) return every.map((one) => one.shown);
    const dir = limitDir(roots, folder);
    if (dir === null) return [];
    return every.filter((one) => repositoryInLimit(one.top, dir)).map((one) => one.shown);
}
