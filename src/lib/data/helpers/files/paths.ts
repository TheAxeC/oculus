// Layer 1, data. The `/` path rules the page reads a path by: a path's last name, a folder without
// its trailing slashes, a folder joined with a path below it, the way from one folder to a target,
// the path of a target below a folder, whether a path runs through a hidden or dependency folder,
// and the deepest of several folders holding a target. The server reads real paths by the last of
// these too: the Processes view's project of a process (server/machine/processes/read.ts) and the
// project Submit plans for (server/machine/hpc/submit.ts), so a change made here for the page's
// sake changes those two answers as well.
//
// The page holds paths as the server wrote them, always with `/`, so these are string rules over
// that separator and import nothing from node; `state/` and the views may import them beside
// data/helpers/guards.ts. A folder may arrive written with a trailing slash (a configured root) or
// without one (a repository key of the `git` channel), and both spellings name the same folder
// here, which is what lets the file browser, the source tab and the status bar agree on which root
// or repository holds a file. The folder holds the rules over what a file's path and name say,
// with text-kind.ts and opens-in-program.ts beside it.

/** The last non-empty segment of a path, which is what a tab or a row is labelled with. */
export function nameOf(path: string): string {
    return (
        path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? path
    );
}

/** A folder without its trailing slashes, the root `/` kept as it is. */
export function trimSlash(dir: string): string {
    return dir.replace(/(.)\/+$/, '$1');
}

/**
 * A folder joined with a path below it by one `/`: the folder itself for an empty path, and no
 * doubled slash when the folder is the root `/`.
 */
export function joinPath(dir: string, path: string): string {
    const base = trimSlash(dir);
    if (path === '') return base;
    return base === '/' ? `/${path}` : `${base}/${path}`;
}

/**
 * The path of a target below a folder: `''` for the folder itself, the path under it for anything
 * below it, and null outside it, a sibling whose name starts with the folder's name included. An
 * empty folder holds nothing.
 */
export function pathUnder(folder: string, target: string): string | null {
    const base = trimSlash(folder);
    if (base === '') return null;
    const path = trimSlash(target);
    if (path === base) return '';
    const prefix = base.endsWith('/') ? base : `${base}/`;
    return path.startsWith(prefix) ? path.slice(prefix.length) : null;
}

/**
 * The item whose folder holds a target most deeply, with the target's path under that folder, or
 * null when no item's folder holds it. Of two items with one folder, the first wins.
 */
export function deepestHolding<T>(
    items: readonly T[],
    dirOf: (item: T) => string,
    target: string
): { item: T; path: string } | null {
    let best: { item: T; path: string; depth: number } | null = null;
    for (const item of items) {
        const dir = dirOf(item);
        const path = pathUnder(dir, target);
        if (path === null) continue;
        const depth = trimSlash(dir).length;
        if (best === null || depth > best.depth) best = { item, path, depth };
    }
    return best === null ? null : { item: best.item, path: best.path };
}

/**
 * Whether a repository's folder is a served root's folder or inside one, the test the server's
 * `repositoryOf` applies first. The repository is written as a real path, so each root is read as
 * its `real` folder; a root that carries none is read as its configured `dir`, and a root whose
 * `real` is empty (a folder that does not exist) holds nothing.
 */
export function underServedRoot(
    roots: readonly { dir: string; real?: string }[],
    repository: string
): boolean {
    return roots.some((root) => pathUnder(root.real ?? root.dir, repository) !== null);
}

/**
 * The path that leads from a folder to a target, both against the same base: `main.tex` from the
 * folder itself, `../main.tex` from a folder below it, `sub/a.tex` from a folder above it.
 */
export function relativePath(from: string, target: string): string {
    const down = from.split('/').filter((part) => part !== '');
    const goal = target.split('/').filter((part) => part !== '');
    let shared = 0;
    while (shared < down.length && shared < goal.length - 1 && down[shared] === goal[shared]) {
        shared += 1;
    }
    return [...down.slice(shared).map(() => '..'), ...goal.slice(shared)].join('/');
}

/**
 * Whether a `/` path has a segment named `node_modules` or starting with a dot, a folder or the
 * file's own name: the places a document is never read from by name.
 */
export function hasHiddenSegment(path: string): boolean {
    return path.split('/').some((part) => part === 'node_modules' || part.startsWith('.'));
}
