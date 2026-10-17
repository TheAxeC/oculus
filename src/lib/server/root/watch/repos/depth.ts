// Layer 2, server. Which events the git watcher (../git.ts) walks a root again for: a `rename`
// that may have made or removed a repository the walk down to `repository_scan_depth` levels finds
// (`subrepositories`).

/**
 * Whether a `rename` event at `path` may have made or removed a repository below a root: a path of
 * at most `depth` segments names a folder the walk lists, and a path ending in `/.git` of at most
 * `depth + 1` segments is the repository mark of a folder the walk lists. A path inside a `.git`
 * folder is no such event: a commit renames files there all the time.
 */
export function mayChangeRepositories(
    path: string,
    depth: number,
    folderOrGone: () => boolean
): boolean {
    const parts = path.split(/[/\\]/).filter((part) => part !== '');
    if (parts.length === 0 || parts.slice(0, -1).includes('.git')) return false;
    if (depth === Infinity) return parts[parts.length - 1] === '.git' || folderOrGone();
    if (parts.length <= depth) return true;
    return parts[parts.length - 1] === '.git' && parts.length <= depth + 1;
}
