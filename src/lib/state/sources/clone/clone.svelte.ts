// Layer 2, client state. Cloning a repository: a repository of the reader's GitHub account or at a
// typed address into `<folder>/<name>`, and the repository of a project into a folder of its own.
// The server does the work (POST /api/clone); this store asks for the folder, sends it, holds which
// projects are being cloned so a control disables itself, says the outcome to the reader and, once
// a repository is cloned, hands the folder to the question of what to do with it
// (clone-after.svelte.ts).
//
// Both clones ask for the folder with the system's folder panel. A GitHub clone starts the panel at
// the home folder, and the chosen folder is the one the repository's own folder is made in. A
// project's clone starts the panel at the project's folder, and the chosen folder is the clone
// itself. A repository that tracks a file the chosen folder holds is refused by the server before
// anything is written, and the panel opens again. A panel the reader cancels sends nothing and ends
// the clone.

import { z } from 'zod';
import type { GithubListing, GithubRepo } from '../../../data/model/index.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';
import type { NoticeSink, WritesStore } from '../../shared/stores/shapes.ts';
import { pickedOf, pickerLine } from '../explorer/acts/folders.ts';
import type { CloneAfter } from './clone-after.svelte.ts';

/** The route the server clones through. */
const CLONE_PATH = '/api/clone';

/** The route of the system's folder panel. */
const PICK_PATH = '/api/folders/pick';

const repoShape = z.object({
    name: z.string(),
    url: z.string(),
    visibility: z.string().catch(''),
    description: z.string().catch(''),
    homepage: z.string().catch(''),
    topics: z.array(z.string()).catch([]),
    date: z.string().catch('')
});

const listedShape = z.object({ repos: z.array(repoShape) });
const errorShape = z.object({ error: z.string() });
const clonedShape = z.object({ dir: z.string() });
const heldShape = z.object({ held: z.array(z.string()).min(1) });

export type CloneStore = {
    /** Whether the project is being cloned now. */
    cloning: (id: string) => boolean;
    /**
     * Ask for the folder to clone the repository of a project into, starting at `from`, then clone
     * it there. A panel the reader cancels does nothing; a folder holding files the repository
     * tracks is refused and the panel opens again. True when cloned.
     */
    cloneProject: (id: string, title: string, from: string) => Promise<boolean>;
    /** The repositories of the reader's GitHub account. */
    githubRepos: () => Promise<GithubListing>;
    /**
     * Ask for the folder to clone a repository into, then clone it as `<folder>/<name>`. A panel
     * the reader cancels does nothing; a refusal is said to the reader. True when cloned.
     */
    cloneRepo: (repo: Pick<GithubRepo, 'name' | 'url'>) => Promise<boolean>;
    /** What the reader is asked once a repository is cloned. */
    after: CloneAfter;
};

/** What the store reads of the rest of the client. */
export type CloneDeps = {
    /** The account's home folder, where the panel of a GitHub clone starts; empty when unknown. */
    home: () => string;
    after: CloneAfter;
};

export function createClone(
    writes: WritesStore,
    notices: Pick<NoticeSink, 'post'>,
    deps: CloneDeps
): CloneStore {
    let running = $state<string[]>([]);

    /** The sentence a failed post says: the server's own, else the transport's. */
    function refusal(body: Record<string, unknown>, failed: string): string {
        return readAs(errorShape, body)?.error ?? (failed === '' ? t('app.clone.failed') : failed);
    }

    /**
     * The folder the reader picks with the system's panel, starting at `start` when given: its
     * path, null for a panel that was cancelled or did not open (the second is said).
     */
    async function pickFolder(start: string): Promise<string | null> {
        const panel = await writes.postCommand(PICK_PATH, {
            single: true,
            ...(start === '' ? {} : { start })
        });
        const picked = pickedOf(panel.body, panel.failed);
        if (!picked.ok) {
            notices.post(pickerLine(picked.error), { tone: 'error' });
            return null;
        }
        return picked.paths.at(0) ?? null;
    }

    async function cloneProject(id: string, title: string, from: string): Promise<boolean> {
        if (running.includes(id)) return false;
        running = [...running, id];
        try {
            for (;;) {
                const dir = await pickFolder(from);
                if (dir === null) return false;
                const posted = await writes.postCommand(CLONE_PATH, { action: 'clone', id, dir });
                if (posted.ok) {
                    notices.post(t('app.clone.done', title));
                    deps.after.ask(dir);
                    return true;
                }
                notices.post(refusal(posted.body, posted.failed), { tone: 'error' });
                if (readAs(heldShape, posted.body) === null) return false;
            }
        } finally {
            running = running.filter((one) => one !== id);
        }
    }

    async function githubRepos(): Promise<GithubListing> {
        const posted = await writes.postCommand(CLONE_PATH, { action: 'github-repos' });
        const listed = posted.ok ? readAs(listedShape, posted.body) : null;
        if (listed === null) return { ok: false, error: refusal(posted.body, posted.failed) };
        return { ok: true, repos: listed.repos };
    }

    async function cloneRepo(repo: Pick<GithubRepo, 'name' | 'url'>): Promise<boolean> {
        const parent = await pickFolder(deps.home());
        if (parent === null) return false;
        const posted = await writes.postCommand(CLONE_PATH, {
            action: 'github-clone',
            repo: { name: repo.name, url: repo.url },
            parent
        });
        if (!posted.ok) {
            notices.post(refusal(posted.body, posted.failed), { tone: 'error' });
            return false;
        }
        notices.post(t('app.clone.done', repo.name));
        const dir = readAs(clonedShape, posted.body)?.dir;
        if (dir !== undefined) deps.after.ask(dir);
        return true;
    }

    return {
        cloning: (id) => running.includes(id),
        cloneProject,
        githubRepos,
        cloneRepo,
        after: deps.after
    };
}
