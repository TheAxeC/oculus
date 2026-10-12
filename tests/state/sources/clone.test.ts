// Layer 4, test. The clone store: the folder panel a project's clone and a repository's clone ask
// for (the project's starts at the project's folder, a repository's at the home folder), the
// request each sends, the panel that opens again when the server holds files back, which controls
// the store disables while a clone runs, what it says of a refusal, that a cancelled panel sends
// nothing, and that a clone that worked hands its folder to the question of what to do with it.

import { describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createClone } from '../../../src/lib/state/sources/clone/clone.svelte.ts';
import type { CloneAfter } from '../../../src/lib/state/sources/clone/clone-after.svelte.ts';
import type { GithubRepo } from '../../../src/lib/data/model/index.ts';
import type { Posted, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

type Sent = { path: string; body: Record<string, unknown> };

const REPO: GithubRepo = {
    name: 'Tool',
    url: 'https://github.com/me/Tool',
    visibility: 'PUBLIC',
    description: 'A tool',
    homepage: '',
    topics: ['a'],
    date: '2024-01-02'
};

const PICK = '/api/folders/pick';

/** A store over a fake endpoint: `answer` makes the reply to each post, `sent` records them. */
function setup(
    answer: (path: string, body: Record<string, unknown>) => Promise<Posted> | Posted,
    home = ''
) {
    const sent: Sent[] = [];
    const said: { message: string; tone?: string }[] = [];
    const asked: string[] = [];
    const writes = {
        postCommand: async (path: string, body: unknown) => {
            const request = body as Record<string, unknown>;
            sent.push({ path, body: request });
            return answer(path, request);
        }
    } as unknown as WritesStore;
    const after = { ask: (dir: string) => asked.push(dir) } as unknown as CloneAfter;
    const store = createClone(
        writes,
        {
            post: (message, options) => {
                said.push({
                    message,
                    ...(options?.tone === undefined ? {} : { tone: options.tone })
                });
                return 0;
            }
        },
        { home: () => home, after }
    );
    return { store, sent, said, asked };
}

const ok = (body: Record<string, unknown>): Posted => ({ ok: true, status: 200, body, failed: '' });
const refused = (error: string, extra: Record<string, unknown> = {}): Posted => ({
    ok: false,
    status: 400,
    body: { error, ...extra },
    failed: ''
});
const picked = (...paths: string[]): Posted => ok({ ok: true, paths });

describe('cloning the repository of a project', () => {
    it('opens the panel at the folder of the project, clones into the pick and asks what to do', async () => {
        const { store, sent, said, asked } = setup((path) =>
            path === PICK ? picked('/work/hub/side-projects/p') : ok({ ok: true })
        );
        expect(await store.cloneProject('p1', 'Tool', '/work/hub/side-projects/p')).toBe(true);
        expect(sent).toEqual([
            { path: PICK, body: { single: true, start: '/work/hub/side-projects/p' } },
            {
                path: '/api/clone',
                body: { action: 'clone', id: 'p1', dir: '/work/hub/side-projects/p' }
            }
        ]);
        expect(said).toEqual([{ message: 'Cloned Tool' }]);
        expect(asked).toEqual(['/work/hub/side-projects/p']);
    });

    it('sends nothing when the reader cancels the panel, and is free again', async () => {
        const { store, sent, said, asked } = setup(() => picked());
        expect(await store.cloneProject('p1', 'Tool', '/work/p')).toBe(false);
        expect(sent.map((one) => one.path)).toEqual([PICK]);
        expect(said).toEqual([]);
        expect(asked).toEqual([]);
        expect(store.cloning('p1')).toBe(false);
    });

    it('opens the panel again when the server holds files back, naming them, and clones into the next pick', async () => {
        let picks = 0;
        const { store, sent, said, asked } = setup((path) => {
            if (path === PICK) return picked(picks++ === 0 ? '/work/one' : '/work/two');
            return picks === 1
                ? refused('The folder holds README.md, which the repository tracks.', {
                      held: ['README.md']
                  })
                : ok({ ok: true });
        });
        expect(await store.cloneProject('p1', 'Tool', '/work/p')).toBe(true);
        expect(sent.map((one) => [one.path, one.body.dir ?? one.body.start])).toEqual([
            [PICK, '/work/p'],
            ['/api/clone', '/work/one'],
            [PICK, '/work/p'],
            ['/api/clone', '/work/two']
        ]);
        expect(said).toEqual([
            { message: 'The folder holds README.md, which the repository tracks.', tone: 'error' },
            { message: 'Cloned Tool' }
        ]);
        expect(asked).toEqual(['/work/two']);
    });

    it("says the server's sentence when it refuses for another reason, ends and is free again", async () => {
        const { store, sent, said, asked } = setup((path) =>
            path === PICK ? picked('/work/p') : refused('The remote has no commits.')
        );
        expect(await store.cloneProject('p1', 'Tool', '/work/p')).toBe(false);
        expect(sent.map((one) => one.path)).toEqual([PICK, '/api/clone']);
        expect(said).toEqual([{ message: 'The remote has no commits.', tone: 'error' }]);
        expect(asked).toEqual([]);
        expect(store.cloning('p1')).toBe(false);
    });

    it('holds the project as cloning until the server answers and sends it once', async () => {
        let release: (posted: Posted) => void = () => undefined;
        const { store, sent } = setup((path) =>
            path === PICK ? picked('/work/p') : new Promise<Posted>((done) => (release = done))
        );
        const first = store.cloneProject('p1', 'Tool', '/work/p');
        expect(store.cloning('p1')).toBe(true);
        expect(store.cloning('p2')).toBe(false);
        expect(await store.cloneProject('p1', 'Tool', '/work/p')).toBe(false);
        await vi.waitFor(() => expect(sent.map((one) => one.path)).toEqual([PICK, '/api/clone']));
        release(ok({ ok: true }));
        expect(await first).toBe(true);
        expect(store.cloning('p1')).toBe(false);
        expect(sent).toHaveLength(2);
    });
});

describe('listing the repositories of the account', () => {
    it('reads the repositories the server lists', async () => {
        const { store } = setup(() => ok({ repos: [REPO] }));
        expect(await store.githubRepos()).toEqual({ ok: true, repos: [REPO] });
    });

    it('carries the sentence of a listing the server refused', async () => {
        const { store } = setup(() => refused('Run gh auth login first.'));
        expect(await store.githubRepos()).toEqual({ ok: false, error: 'Run gh auth login first.' });
    });
});

describe('cloning a repository of the account', () => {
    it('opens the panel at the home folder, clones into the pick and asks what to do', async () => {
        const { store, sent, said, asked } = setup(
            (path) =>
                path === PICK ? picked('/work/code') : ok({ ok: true, dir: '/work/code/Tool' }),
            '/home/me'
        );
        expect(await store.cloneRepo(REPO)).toBe(true);
        expect(sent).toEqual([
            { path: PICK, body: { single: true, start: '/home/me' } },
            {
                path: '/api/clone',
                body: {
                    action: 'github-clone',
                    repo: { name: 'Tool', url: 'https://github.com/me/Tool' },
                    parent: '/work/code'
                }
            }
        ]);
        expect(said).toEqual([{ message: 'Cloned Tool' }]);
        expect(asked).toEqual(['/work/code/Tool']);
    });

    it('asks the panel for no start folder when the home folder is not known', async () => {
        const { store, sent } = setup(() => picked());
        await store.cloneRepo(REPO);
        expect(sent[0]?.body).toEqual({ single: true });
    });

    it('says why the folder panel gave no answer and sends nothing', async () => {
        const { store, sent, said } = setup(() => refused('unsupported'));
        expect(await store.cloneRepo(REPO)).toBe(false);
        expect(sent.map((one) => one.path)).toEqual([PICK]);
        expect(said).toEqual([{ message: t('files.picker_unsupported'), tone: 'error' }]);
    });

    it('sends nothing when the reader cancels the panel', async () => {
        const { store, sent, said, asked } = setup(() => picked());
        expect(await store.cloneRepo(REPO)).toBe(false);
        expect(sent.map((one) => one.path)).toEqual([PICK]);
        expect(said).toEqual([]);
        expect(asked).toEqual([]);
    });

    it("says git's sentence of a refused clone and asks nothing", async () => {
        const { store, said, asked } = setup((path) =>
            path === PICK
                ? picked('/work/code')
                : refused("destination path 'Tool' already exists and is not an empty directory.")
        );
        expect(await store.cloneRepo(REPO)).toBe(false);
        expect(said).toEqual([
            {
                message: "destination path 'Tool' already exists and is not an empty directory.",
                tone: 'error'
            }
        ]);
        expect(asked).toEqual([]);
    });
});
