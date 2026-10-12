// Layer 2, server. Cloning a repository of the reader's GitHub account, or one at an address the
// reader typed. The list of the account's repositories is read with the GitHub CLI,
//
//     gh repo list --limit 1000 --json name,url,visibility,description,homepageUrl,
//         repositoryTopics,createdAt
//
// and a chosen repository is cloned with
//
//     git -C <parent> clone -- <url> <parent>/<name>
//
// into the folder the reader picked, in a folder named for the repository as GitHub gives it, and
// nothing is written into the folder besides what git clones. `gh` is run through the `GhRun` the
// caller gives, so a test never runs the real one; a `gh` that is not installed or not logged in is
// answered with a sentence naming `gh auth login`, and nothing is written. A target folder that
// holds files is refused by git with its own sentence.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { GithubRepo } from '../../../data/model/index.ts';
import { rowsShape } from '../../../data/shapes/shapes.ts';
import { words } from '../../core/words.ts';
import type { CloneOutcome } from './clone.ts';
import { cloneGit, REMOTE_TIMEOUT_MS } from './clone-git.ts';
import type { GhRun, GitRunner } from '../deposit/deposit-git.ts';

/** The arguments of the list. */
const LIST_ARGS = [
    'repo',
    'list',
    '--limit',
    '1000',
    '--json',
    'name,url,visibility,description,homepageUrl,repositoryTopics,createdAt'
];

/** A topic as `gh` prints it: a name, or an object holding one. */
const topicShape = z.union([
    z.string(),
    z.object({ name: z.string() }).transform((one) => one.name),
    z.object({ topic: z.object({ name: z.string() }) }).transform((one) => one.topic.name)
]);

const rowShape = z.object({
    name: z.string().min(1),
    url: z.string().default(''),
    visibility: z.string().default(''),
    description: z.string().nullish().default(''),
    homepageUrl: z.string().nullish().default(''),
    repositoryTopics: z.array(topicShape).nullish().default([]),
    createdAt: z.string().default('')
});

/** The list `gh` printed as repositories, or null when it is not the list. */
function reposOf(output: string): GithubRepo[] | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(output);
    } catch {
        return null;
    }
    const rows = rowsShape(rowShape).safeParse(parsed);
    if (!rows.success || !Array.isArray(parsed) || rows.data.length !== parsed.length) return null;
    return rows.data.map((row) => ({
        name: row.name,
        url: row.url,
        visibility: row.visibility.toLowerCase(),
        description: row.description ?? '',
        homepage: row.homepageUrl ?? '',
        topics: row.repositoryTopics ?? [],
        date: row.createdAt.slice(0, 10)
    }));
}

/** The repositories of the account, or the sentence that says `gh` cannot list them. */
export async function listRepos(
    gh: GhRun,
    text: Record<string, string>,
    signal?: AbortSignal
): Promise<{ ok: true; repos: GithubRepo[] } | { ok: false; error: string }> {
    const done = await gh(LIST_ARGS, REMOTE_TIMEOUT_MS, signal);
    if (!done.ok)
        return { ok: false, error: words(text, 'server.clone.gh_unavailable', done.error) };
    const repos = reposOf(done.output);
    if (repos === null) return { ok: false, error: words(text, 'server.clone.gh_unreadable') };
    return { ok: true, repos };
}

/** What the clone of one repository needs from the server around it. */
export type GithubClone = {
    /** The repository's name as GitHub gives it, which names the folder the clone is made in. */
    name: string;
    /** The address of the remote. */
    url: string;
    /** The folder the repository's own folder is made in. */
    parent: string;
    text: Record<string, string>;
    git?: GitRunner;
    signal?: AbortSignal;
};

/** Whether a repository name can be the name of one folder: one segment, not `.` or `..`. */
export function isFolderName(name: string): boolean {
    return name !== '' && name !== '.' && name !== '..' && !/[\\/\0]/.test(name);
}

/** The folder a repository is cloned into: `<parent>/<name>`. */
export function cloneTarget(parent: string, name: string): string {
    return join(parent, name);
}

function refused(error: string): CloneOutcome {
    return { ok: false, output: '', error };
}

/**
 * Clone a repository into `<parent>/<name>` with `git clone <url> <folder>`, the way VS Code's
 * Clone does, and write nothing into the folder. On success `output` is the folder. Refused, with
 * nothing written, when the parent is no folder or the name is no folder name; a folder that holds
 * files is refused by git with its own sentence, which is the answer's error.
 */
export async function cloneIntoFolder(request: GithubClone): Promise<CloneOutcome> {
    const { name, url, parent, text } = request;
    if (parent === '') return refused(words(text, 'server.clone.no_parent'));
    let folderExists: boolean;
    try {
        folderExists = statSync(parent).isDirectory();
    } catch {
        folderExists = false;
    }
    if (!folderExists) return refused(words(text, 'server.clone.parent_gone', parent));
    if (!isFolderName(name)) return refused(words(text, 'server.clone.not_a_name', name));
    const dir = cloneTarget(parent, name);
    const git = request.git ?? cloneGit;
    const done = await git(
        ['-C', parent, 'clone', '--', url, dir],
        REMOTE_TIMEOUT_MS,
        request.signal
    );
    return done.ok ? { ok: true, output: dir, error: '' } : done;
}
