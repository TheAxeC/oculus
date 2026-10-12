// Layer 1, data. The address of the remote a folder's repository was cloned from, read from the
// repository's own config file, and the comparison of two such addresses. Server side only: it
// reads the filesystem and no client module may import it. Nothing here runs git, so a rebuild can
// ask it for every project folder without starting a process.

import { readFileSync, statSync } from 'node:fs';
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
