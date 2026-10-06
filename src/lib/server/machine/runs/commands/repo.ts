// Layer 2, server. Which folder a request may call a repository: an absolute folder that exists,
// whose real path is a served root or a git repository inside one. Everything else is refused
// before a file under it is read, so a request cannot make the server list or run commands of a
// folder the file browser does not serve.

import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { inside, realPath } from '../../../core/paths.ts';

/** The repository's real path, or the sentence that refuses the folder. */
export function repositoryOf(
    folder: unknown,
    roots: string[]
): { repo: string } | { error: string } {
    if (typeof folder !== 'string' || folder === '' || !isAbsolute(folder)) {
        return { error: 'repo must be an absolute path' };
    }
    const repo = realPath(folder);
    if (repo === null || !statSync(repo).isDirectory()) {
        return { error: 'repo is not a folder that exists' };
    }
    const served = roots.map((root) => realPath(root)).filter((root) => root !== null);
    if (!served.some((root) => inside(repo, root))) {
        return { error: 'repo is not under a root the file browser serves' };
    }
    if (served.includes(repo) || existsSync(join(repo, '.git'))) return { repo };
    return { error: 'repo is not a served root or a git repository' };
}
