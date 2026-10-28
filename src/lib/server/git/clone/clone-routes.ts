// Layer 2, server. The /api/clone endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(git)/clone/+server.ts is the few lines
// that join them, the pattern deposit/deposit-routes.ts holds.
//
// A POST carries the write token and one of three actions:
//
//     clone         { id, dir }          clone the repository of project `id` into the folder `dir`
//     github-repos  {}                   list the repositories of the reader's GitHub account
//     github-clone  { repo, parent }     clone a repository into `<parent>/<its name>`
//
// There is no confirm: a clone adds files to a folder and refuses to overwrite one. The project a
// `clone` names must be in the last published portfolio and have a repository `url`; the folder is
// the reader's to choose and is where the repository goes, made when missing. A clone from GitHub
// writes nothing into its folder besides the repository. Neither clone changes the workspace or
// writes a `project.yml`: the page asks the reader what to do with the folder once it is cloned.
// The answer of a clone that went through is `{ ok: true, dir }`; one refused because the folder
// holds files the repository tracks is `{ error, held }`, the files in `held`, which is how the
// page asks for another folder.
//
// git is the option the route builds from the server context's credentials and every other
// operation is an option with a real default, so tests/routes/git/clone.test.ts drives the whole
// endpoint without running git or `gh` at all.

import { isAbsolute } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { GhRun, GitRunner } from '../deposit/deposit-git.ts';
import { failureLine } from '../../core/git/failure.ts';
import { words } from '../../core/words.ts';
import type { RepositoryBlock } from '../../../data/model/index.ts';
import { cloneRepository, type CloneOutcome } from './clone.ts';
import { cloneGh } from './clone-git.ts';
import { cloneTarget, cloneIntoFolder, isFolderName, listRepos } from './github.ts';
import { shapedBody } from '../git-routes.ts';

/** Every action POST /api/clone knows. */
const ACTIONS = ['clone', 'github-repos', 'github-clone'] as const;

/** What the endpoint needs to know of a project in the portfolio. */
type CloneProject = { repository?: Pick<RepositoryBlock, 'url'> };

export type CloneOptions = {
    /** The text catalog the sentences are worded from. */
    text: Record<string, string>;
    /** How git is run: clone-git.ts's `cloneGit` with the server context's credentials. */
    git: GitRunner;
    /** How `gh` is run; the real one when absent. */
    gh?: GhRun;
    /** The project `id` of the last published portfolio, or null. */
    project: (id: string) => CloneProject | null;
    /** Read the portfolio again. */
    rescan: () => void;
    /** The folders being cloned into now, so a second press on one is refused. */
    busy?: Set<string>;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

const textShape = z.string().catch('');

const repoShape = z.object({ name: textShape, url: textShape });

/** The body of POST /api/clone: the action among ACTIONS and the fields an action reads. */
const bodyShape = z.looseObject({
    action: z.enum(ACTIONS),
    id: textShape,
    dir: textShape,
    parent: textShape,
    repo: repoShape.catch({ name: '', url: '' })
});

function refused(error: string, status = 400): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/** The answer of an operation that did not go through. */
function failed(outcome: CloneOutcome, text: Record<string, string>): Response {
    const error =
        outcome.failure === undefined ? outcome.error : failureLine(outcome.failure, text);
    return json(
        { error, ...(outcome.held === undefined ? {} : { held: outcome.held }) },
        { status: 400, headers: NO_STORE }
    );
}

/** Run `work` unless a clone into `dir` is running, and hold the folder for as long as it runs. */
async function exclusive(
    options: CloneOptions,
    dir: string,
    work: () => Promise<Response>
): Promise<Response> {
    const busy = options.busy ?? new Set<string>();
    if (busy.has(dir)) return refused(words(options.text, 'server.clone.busy', dir));
    busy.add(dir);
    try {
        return await work();
    } finally {
        busy.delete(dir);
    }
}

/** What a clone that went through answers, and the read of the portfolio it asks for. */
function cloned(dir: string, options: CloneOptions): Response {
    options.rescan();
    return json({ ok: true, dir }, { headers: NO_STORE });
}

async function cloneProject(id: string, dir: string, options: CloneOptions, signal?: AbortSignal) {
    const { text } = options;
    const found = options.project(id);
    if (found === null) return refused(words(text, 'server.clone.no_such_project'), 404);
    const url = found.repository?.url;
    if (url === undefined) return refused(words(text, 'server.clone.no_url'));
    if (dir === '' || !isAbsolute(dir)) return refused(words(text, 'server.clone.no_parent'));
    return exclusive(options, dir, async () => {
        const done = await cloneRepository({ dir, url, text, git: options.git, signal });
        return done.ok ? cloned(dir, options) : failed(done, text);
    });
}

async function cloneGithub(
    repo: { name: string; url: string },
    parent: string,
    options: CloneOptions,
    signal?: AbortSignal
) {
    const { text } = options;
    if (parent === '' || !isAbsolute(parent)) return refused(words(text, 'server.clone.no_parent'));
    if (!isFolderName(repo.name)) return refused(words(text, 'server.clone.not_a_name', repo.name));
    return exclusive(options, cloneTarget(parent, repo.name), async () => {
        const done = await cloneIntoFolder({
            name: repo.name,
            url: repo.url,
            parent,
            text,
            git: options.git,
            signal
        });
        return done.ok ? cloned(done.output, options) : failed(done, text);
    });
}

/**
 * POST /api/clone: one action. The order is the order of the refusals: the token, the body, the
 * action, and only then git or `gh`.
 */
export async function handleClone(
    request: Request,
    token: string,
    options: CloneOptions
): Promise<Response> {
    const { text } = options;
    const shaped = await shapedBody(request, token, bodyShape, text, () =>
        refused(words(text, 'server.deposit.not_an_action'))
    );
    if (shaped instanceof Response) return shaped;
    const { action, id, dir, parent, repo } = shaped.read;
    if (action === 'clone') return cloneProject(id, dir, options);
    if (action === 'github-repos') {
        const listed = await listRepos(options.gh ?? cloneGh, text);
        return listed.ok
            ? json({ ok: true, repos: listed.repos }, { headers: NO_STORE })
            : refused(listed.error);
    }
    if (repo.name === '' || repo.url === '')
        return refused(words(text, 'server.clone.no_repository'));
    return cloneGithub(repo, parent, options);
}
