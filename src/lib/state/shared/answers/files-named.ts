// Layer 2, client state. The test every follower of the `files` channel applies to a message: which
// files and folders a message names. A message is `{ root, folders? }`: `root` is the watched
// folder, and `folders`, when present, lists the folders of that root the writes landed in, each
// relative to the root and `''` for the root's own top. A message that names no folders concerns
// the whole root, and one whose list is empty concerns nothing. Each function here is one question
// a follower asks of one path it depends on.

/**
 * A path's segments with every doubled separator, `.` and `..` resolved, as a string operation: the
 * watcher's root is not normalised on the way to the page, and the server's file path is.
 */
function segments(path: string): string[] {
    const kept: string[] = [];
    for (const part of path.split(/[/\\]/)) {
        if (part === '' || part === '.') continue;
        if (part === '..') kept.pop();
        else kept.push(part);
    }
    return kept;
}

/** Whether a file lies under a root: the root itself, or a path below it. */
function holds(root: string, file: string): boolean {
    if (root === '' || file === '') return false;
    const base = segments(root);
    const inner = segments(file);
    if (inner.length < base.length) return false;
    return base.every((part, at) => inner[at] === part);
}

/** A path as its resolved segments joined, so two spellings of one folder compare equal. */
function resolved(path: string): string {
    return segments(path).join('/');
}

/** The folder one path sits in, as a path, or the empty text for a path with no folder. */
function folderOf(path: string): string {
    const parts = segments(path);
    parts.pop();
    return parts.join('/');
}

/**
 * The folders a `files` message names, as the resolved paths they are at: the message's `folders`
 * are relative to its `root`, and `''` is the root's own top. Null when the message names none,
 * which means the whole root; an empty list names nothing.
 */
function namedFolders(root: string, folders: string[] | undefined): string[] | null {
    if (folders === undefined) return null;
    return folders.map((one) => resolved(one === '' ? root : `${root}/${one}`));
}

/**
 * Whether a `files` message concerns one file: the message's root holds it, and the message names
 * the folder that holds the file or names no folders at all (the whole root).
 */
export function filesNamed(root: string, folders: string[] | undefined, file: string): boolean {
    if (!holds(root, file)) return false;
    const named = namedFolders(root, folders);
    return named === null || named.includes(folderOf(file));
}

/**
 * Whether a `files` message concerns what one folder lists: the message's root holds the folder
 * and the message names the folder itself or names no folders at all.
 */
export function folderNamed(root: string, folders: string[] | undefined, folder: string): boolean {
    if (!holds(root, folder)) return false;
    const named = namedFolders(root, folders);
    return named === null || named.includes(resolved(folder));
}

/**
 * Whether a `files` message concerns anything at or below one folder: a folder it names is that
 * folder or lies under it, or it names none and its root holds the folder or lies under it.
 */
export function foldersNamedUnder(
    root: string,
    folders: string[] | undefined,
    folder: string
): boolean {
    const named = namedFolders(root, folders);
    if (named === null) return holds(root, folder) || holds(folder, root);
    return named.some((one) => holds(folder, `/${one}`));
}
