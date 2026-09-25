// Layer 2, server. The parsers over git's own listing output, and the formats that produce it.
//
// They sit apart from both git modules because both need them: server/core/git.ts reads the log,
// the branches and the worktrees for the `git` channel, and server/git/git-write.ts reads the
// branches for the branch menu. One parser with one format beside it is what keeps the two from
// disagreeing about what a row is.
//
// Nothing here runs a process or touches a file: text in, rows out, and nothing thrown for output
// that is not what was asked for.

import type { GitBranch, GitCommit, GitWorktree } from '../../data/model/index.ts';

/** The branch listing's format: the name, its upstream and the marker on the checked-out one. */
export const BRANCH_FORMAT = '--format=%(refname:short)%09%(upstream:short)%09%(HEAD)';

/**
 * The log's format: the hash, the abbreviated hash, the subject and the author date, unit
 * separated.
 */
export const LOG_FORMAT = '--format=%H%x1f%h%x1f%s%x1f%aI';

/** The field separator of LOG_FORMAT, which no field of it can hold. */
const UNIT = '\x1f';

/** The rows of a `branch` listing in BRANCH_FORMAT. */
export function parseBranches(output: string): GitBranch[] {
    const rows: GitBranch[] = [];
    for (const line of output.split('\n')) {
        if (line.trim() === '') continue;
        const parts = line.split('\t');
        const name = parts.at(0);
        if (name === undefined || name === '') continue;
        rows.push({
            name,
            upstream: parts.at(1) ?? '',
            current: (parts.at(2) ?? '').trim() === '*'
        });
    }
    return rows;
}

/** The rows of a `log` in LOG_FORMAT, newest first, as git printed them. */
export function parseLog(output: string): GitCommit[] {
    const rows: GitCommit[] = [];
    for (const line of output.split('\n')) {
        if (line.trim() === '') continue;
        const parts = line.split(UNIT);
        if (parts.length < 4) continue;
        const hash = parts[0].trim();
        if (hash === '') continue;
        rows.push({ hash, short: parts[1], subject: parts[2], when: parts[3].trim() });
    }
    return rows;
}

/**
 * The records of `worktree list --porcelain`: one blank-line separated block per worktree, each
 * opening with its path. The first block is the checkout the others hang off, which is what `main`
 * says; a block with `detached` carries no branch and reports one as empty.
 */
export function parseWorktrees(output: string): GitWorktree[] {
    const rows: GitWorktree[] = [];
    let held: GitWorktree | null = null;
    for (const line of `${output}\n`.split('\n')) {
        const text = line.trim();
        if (text === '') {
            if (held !== null) rows.push(held);
            held = null;
            continue;
        }
        const at = text.indexOf(' ');
        const key = at === -1 ? text : text.slice(0, at);
        const value = at === -1 ? '' : text.slice(at + 1);
        if (key === 'worktree') {
            if (held !== null) rows.push(held);
            held = { path: value, branch: '', head: '', main: rows.length === 0 };
            continue;
        }
        if (held === null) continue;
        if (key === 'HEAD') held.head = value;
        // `branch refs/heads/<name>`; the short name is what every other surface here shows.
        if (key === 'branch') held.branch = value.replace(/^refs\/heads\//, '');
    }
    if (held !== null) rows.push(held);
    return rows.filter((row) => row.path !== '');
}
