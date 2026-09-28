// Layer 1, data. The `/` path rules the page reads a path by: a path's last name, a folder without
// its trailing slashes, a folder joined with a path below it, the path of a target below a folder,
// and the deepest of several folders holding a target.
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
