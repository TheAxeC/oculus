// Layer 1, data. Where a worktree of a repository lives, what its name may be, and whether the
// repository's own .gitignore keeps the folder out of its history.
//
// The rule has two readers: the write that makes a worktree (server/git/git-write.ts) and the view
// that names the path before the worktree is made (views/sources/repositories/), so it lives here
// once rather than twice. Every root uses the one folder, one worktree per name inside it.
//
// Pure: no I/O, no path module, and `/` as the separator, which is what git answers with and what
// the page draws.

/** The folder under a repository that holds its worktrees, relative to the repository. */
export const WORKTREES_DIR = '.agents/worktrees';

/** The line a repository's .gitignore needs so its worktrees are not its own tracked content. */
export const IGNORE_RULE = `/${WORKTREES_DIR}/`;

/** A root with any trailing separators taken off, so two joins never differ by a slash. */
function trimmed(root: string): string {
    let end = root.length;
    while (end > 1 && (root[end - 1] === '/' || root[end - 1] === '\\')) end -= 1;
    return root.slice(0, end);
}

/** The worktrees folder of one repository, absolute when the root is. */
export function worktreesDir(root: string): string {
    return `${trimmed(root)}/${WORKTREES_DIR}`;
}

/** Where the worktree of this name goes. The name is checked by `validName` before this is used. */
export function worktreePath(root: string, name: string): string {
    return `${worktreesDir(root)}/${name}`;
}

/**
 * Whether a name may be a worktree: one path segment, so the folder it makes is directly under the
 * worktrees folder, and not one git would read as an option. Whether it is a branch name git accepts
 * is git's own answer, asked by the write.
 */
export function validName(name: string): boolean {
    if (typeof name !== 'string' || name === '' || name.startsWith('-')) return false;
    if (name === '.' || name === '..') return false;
    return !/[/\\]/.test(name);
}

/**
 * Whether a path is a worktree this tool made under the root: the worktrees folder, then one name
 * `validName` accepts and nothing after it.
 *
 * Both arguments must already be resolved. A prefix test over a path holding `..` would take
 * `<root>/.agents/worktrees/../../elsewhere` for a worktree, so the caller resolves first and this
 * then compares whole segments: the callers on the server are `worktreeUnder` in
 * server/git/git-write.ts.
 */
export function isWorktreePath(root: string, resolved: string): boolean {
    if (typeof resolved !== 'string' || resolved === '') return false;
    const folder = `${worktreesDir(root)}/`;
    return resolved.startsWith(folder) && validName(resolved.slice(folder.length));
}

/**
 * Whether a .gitignore keeps the worktrees folder out of the repository. The rule is matched as
 * written, with or without its trailing slash, since both forms ignore the folder; a commented line
 * says nothing.
 */
export function ignoresWorktrees(gitignore: string): boolean {
    if (typeof gitignore !== 'string') return false;
    for (const raw of gitignore.split('\n')) {
        const line = raw.trim();
        if (line === '' || line.startsWith('#')) continue;
        const rule = line.endsWith('/') ? line : `${line}/`;
        if (rule === IGNORE_RULE || rule === `${WORKTREES_DIR}/`) return true;
    }
    return false;
}
