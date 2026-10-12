// Layer 2, server. The repositories that lie inside a hub, found by a walk of the whole hub, and
// the lists the git watcher hands on when they change. A hub holds repositories of its own below it
// (the clone of a project, the folder of a project that is a repository), and git lists each as one
// untracked folder and records it as an embedded repository on `git add -A`. The block of the hub's
// exclude file that keeps them out of both is written from the list this walk makes
// (server/git/clone/exclude.ts); the same list tells the portfolio which folders are clones of
// which projects (data/sources/clones.ts).
//
// The walk goes to any depth, whatever `repository_scan_depth` says, because a repository five
// folders down is as much an embedded repository as one at the top. It skips links and the folders
// the git watcher ignores, and it does not enter a repository it finds: a repository inside one is
// hidden with the one that holds it. It reads the folders with the asynchronous calls, so the event
// loop serves requests while a hub of fourteen thousand folders is walked.

import { lstat, readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import type { HubRepositories } from '../../../git/clone/exclude.ts';

/** What the git watcher hands on: each hub's own list, and every repository to look at, listed. */
export type NestedFound = {
    hubs: HubRepositories[];
    /**
     * The repositories of the workspace in the order the Repositories view lists them: for each
     * folder of the workspace the folder itself when it is a repository, then the repositories
     * found below it. A folder is listed once.
     */
    repositories: string[];
};

/** Whether a folder holds a `.git`, a folder or a file. */
async function isRepository(dir: string): Promise<boolean> {
    try {
        await lstat(join(dir, '.git'));
        return true;
    } catch {
        return false;
    }
}

/**
 * Every repository below `hub`, at any depth, by path in name order. The walk skips links, `.git`
 * and the folders named in `ignored`, and does not enter a repository it found. A folder that
 * cannot be listed is skipped and the rest of the walk goes on.
 */
export async function nestedRepositories(
    hub: string,
    ignored: readonly string[]
): Promise<string[]> {
    const found: string[] = [];
    const walk = async (dir: string): Promise<void> => {
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }
        const below = entries.filter(
            (entry) => entry.isDirectory() && entry.name !== '.git' && !ignored.includes(entry.name)
        );
        await Promise.all(
            below.map(async (entry) => {
                const path = join(dir, entry.name);
                if (await isRepository(path)) found.push(path);
                else await walk(path);
            })
        );
    };
    await walk(hub);
    return found.sort();
}

/**
 * Whether a `rename` event at `path` under a hub may have made, moved or removed a repository below
 * it: the `.git` of a folder, a folder that is there now, or a path that is gone and is, or holds,
 * a repository the last walk listed. A path inside a `.git` folder is no such event: a commit
 * renames files there all the time. `isFolder` is `undefined` for a path that is gone.
 */
export function mayChangeNested(
    hub: string,
    path: string,
    isFolder: boolean | undefined,
    known: readonly string[]
): boolean {
    const parts = path.split(/[/\\]/).filter((part) => part !== '');
    if (parts.length === 0 || parts.slice(0, -1).includes('.git')) return false;
    if (parts[parts.length - 1] === '.git') return true;
    if (isFolder !== undefined) return isFolder;
    const gone = join(hub, ...parts);
    return known.some((repository) => repository === gone || repository.startsWith(gone + sep));
}

/**
 * The repositories to look at, in listing order: for each folder, the folder itself when it is a
 * repository, then the repositories `below` gives for it together with its list among `hubs`. A
 * folder is listed once, where it first appears.
 */
export async function composeFound(
    folders: readonly string[],
    below: (folder: string) => readonly string[],
    hubs: readonly HubRepositories[]
): Promise<NestedFound> {
    const listed: string[] = [];
    const add = (dir: string): void => {
        if (!listed.includes(dir)) listed.push(dir);
    };
    const own = new Map(hubs.map((one) => [one.hub, one.repositories]));
    for (const folder of folders) {
        if (await isRepository(folder)) add(folder);
        const all = [...below(folder), ...(own.get(folder) ?? [])].sort();
        for (const dir of all) add(dir);
    }
    return { hubs: [...hubs], repositories: listed };
}
