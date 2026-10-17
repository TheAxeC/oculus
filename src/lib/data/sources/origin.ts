// Layer 1, data. The address of the remote a folder's repository was cloned from, read from the
// repository's own config file, the comparison of two such addresses, and the git folder a folder's
// repository keeps its history in, which a linked worktree shares with the main checkout it was
// made from, so the folders of one repository can be told apart from two clones. Server side only:
// it reads the filesystem and no client module may import it. Nothing here runs git, so a rebuild
// can ask it for every project folder without starting a process.

import { readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

/** The text of a file, or null when it cannot be read. */
function textOf(file: string): string | null {
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return null;
    }
}

/**
 * The folder that holds a repository's config file. `.git` is a folder in a clone and a file
 * (`gitdir: <path>`) in a worktree or a submodule; the config of those lives in the common folder
 * the git folder names in `commondir`. Null when `dir` holds no `.git`.
 */
function gitConfigDir(dir: string): string | null {
    const dot = join(dir, '.git');
    let stat;
    try {
        stat = statSync(dot);
    } catch {
        return null;
    }
    let gitDir = dot;
    if (stat.isFile()) {
        const named = /^gitdir:\s*(.+?)\s*$/m.exec(textOf(dot) ?? '')?.[1];
        if (named === undefined) return null;
        gitDir = isAbsolute(named) ? named : resolve(dir, named);
        const common = textOf(join(gitDir, 'commondir'))?.trim();
        if (common !== undefined && common !== '') {
            gitDir = isAbsolute(common) ? common : resolve(gitDir, common);
        }
    }
    return gitDir;
}

/**
 * The git folder of a folder's repository by its real path, and whether the folder is its main
 * checkout: the folder whose `.git` is that git folder itself.
 */
export type GitFolder = { real: string; main: boolean };

/**
 * The git folder the repository at `dir` keeps its history and config in: a clone's own `.git`,
 * and for a linked worktree the main checkout's `.git` its `commondir` leads to. It is named by its
 * real path, every link resolved, so two spellings of one folder are one. A submodule's `.git` file
 * names a git folder of its own with no `commondir`, so a submodule shares its git folder with no
 * other folder. Null when `dir` holds no `.git` or the git folder it names is gone.
 */
export function gitFolderOf(dir: string): GitFolder | null {
    const gitDir = gitConfigDir(dir);
    if (gitDir === null) return null;
    try {
        return { real: realpathSync(gitDir), main: gitDir === join(dir, '.git') };
    } catch {
        return null;
    }
}

/**
 * For each folder of a list, by its git folder, the place in the list of the folder that stands
 * for its repository: of the folders that share one git folder (a main checkout and its linked
 * worktrees, or linked worktrees alone), the main checkout when the list holds it, and otherwise
 * the first of them in the list's order. A folder with no git folder stands for itself.
 */
export function repositoryStandIns(folders: readonly (GitFolder | null)[]): number[] {
    return folders.map((own, at) => {
        if (own === null) return at;
        const shared = folders.flatMap((one, index) => (one?.real === own.real ? [index] : []));
        return shared.find((index) => folders[index]?.main === true) ?? shared[0];
    });
}

/**
 * The `url` of the `origin` remote of the repository at `dir`, or null when the folder is no
 * repository, has no `origin` or its `origin` holds no url.
 */
export function originOf(dir: string): string | null {
    const gitDir = gitConfigDir(dir);
    const text = gitDir === null ? null : textOf(join(gitDir, 'config'));
    if (text === null) return null;
    let inOrigin = false;
    for (const line of text.split('\n')) {
        const section = /^\s*\[(.*)\]\s*$/.exec(line);
        if (section !== null) {
            inOrigin = /^remote\s+"origin"$/.test(section[1].trim());
            continue;
        }
        const url = inOrigin ? /^\s*url\s*=\s*(.*?)\s*$/.exec(line)?.[1] : undefined;
        if (url !== undefined && url !== '') return url;
    }
    return null;
}

/**
 * The host and path of a remote address, which is what makes two addresses one: `https://h/o/r`,
 * `https://h/o/r.git`, `git@h:o/r.git` and `ssh://git@h/o/r` all read `h/o/r`. The host is compared
 * without case, and on `github.com` the path is too. Null for a text that is no address.
 */
function addressKey(address: string): string | null {
    const text = address.trim();
    const url = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/:]+)(?::\d+)?\/(.+)$/i.exec(text);
    const scp = /^(?:[^@/\s]+@)?([^/:\s]+):(?!\/\/)(.+)$/.exec(text);
    const found = url ?? scp;
    if (found === null) return null;
    const host = found[1].toLowerCase();
    let path = found[2].replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
    if (path === '') return null;
    if (host === 'github.com') path = path.toLowerCase();
    return `${host}/${path}`;
}

/** Whether two remote addresses name the same repository. */
export function sameAddress(a: string, b: string): boolean {
    const left = addressKey(a);
    return left !== null && left === addressKey(b);
}
