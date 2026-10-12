// Layer 2, route tests. What /api/clone does (lib/server/git/clone/clone-routes.ts, which the route
// joins to the token and the server): cloning the repository of a project into the folder the
// reader chose, listing the repositories of a GitHub account and cloning one of them into
// `<folder>/<name>`. Git runs for real over scratch repositories and a bare repository stands in
// for the remote; `gh` is the test's own runner, so nothing reaches GitHub and nothing is written
// outside the system temporary directory.
// @module-tag slow: its cases run real git against scratch repositories, so npm test leaves it out.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { cloneGit } from '../../../src/lib/server/git/clone/clone-git.ts';
import { handleClone, type CloneOptions } from '../../../src/lib/server/git/clone/clone-routes.ts';
import { syncNested } from '../../../src/lib/server/git/clone/exclude.ts';
import type { GhRun, GitRunner } from '../../../src/lib/server/git/deposit/deposit-git.ts';
import { IGNORED } from '../../../src/lib/server/root/watch/git.ts';
import { nestedRepositories } from '../../../src/lib/server/root/watch/repos/nested.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { git, isolateGit, put } from '../../server/git/refs/repo.ts';

isolateGit();

const TOKEN = mintToken();
const TEXT = textCatalog(loadConfig(engineDir()).config);
const HOST = '127.0.0.1:8791';

/** A bare repository on `main` holding these files in one commit. */
function remote(files: Record<string, string>): string {
    const work = scratchDir('oculus-clone-route-work-');
    git(work, 'init', '-q', '-b', 'main');
    git(work, 'config', 'user.email', 'nobody@example.invalid');
    git(work, 'config', 'user.name', 'Nobody');
    git(work, 'config', 'commit.gpgsign', 'false');
    for (const [path, body] of Object.entries(files)) put(work, path, body);
    git(work, 'add', '-A');
    git(work, 'commit', '-q', '-m', 'First');
    const bare = scratchDir('oculus-clone-route-bare-');
    git(bare, 'clone', '-q', '--bare', work, '.');
    return bare;
}

/** A hub that is a repository, tracking `side-projects/p/project.yml`. */
function hub(): string {
    const dir = scratchDir('oculus-clone-route-hub-');
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'config', 'user.email', 'nobody@example.invalid');
    git(dir, 'config', 'user.name', 'Nobody');
    git(dir, 'config', 'commit.gpgsign', 'false');
    put(dir, 'side-projects/p/project.yml', 'title: p\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'First');
    return dir;
}

type Seen = { rescans: number };

/** The options of a case: a project `p` with this url, and the doubles of `gh` and the rescan. */
function optionsFor(
    url: string | null,
    over: Partial<CloneOptions> = {},
    seen: Seen = { rescans: 0 }
): CloneOptions {
    return {
        text: TEXT,
        project: (id) => (id === 'p' ? { repository: url === null ? {} : { url } } : null),
        rescan: () => {
            seen.rescans += 1;
        },
        ...over
    };
}

/** A same-origin POST carrying the token. */
async function post(options: CloneOptions, body: unknown) {
    const response = await handleClone(
        new Request(`http://${HOST}/api/clone`, {
            method: 'POST',
            headers: {
                host: HOST,
                origin: `http://${HOST}`,
                'sec-fetch-site': 'same-origin',
                'content-type': 'application/json',
                'x-oculus-token': TOKEN
            },
            body: JSON.stringify(body)
        }),
        TOKEN,
        options
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** A `gh` that prints this and exits with this code. */
const printing =
    (output: string, ok = true, error = ''): GhRun =>
    () =>
        Promise.resolve({ ok, output, error });

describe('cloning the repository of a project into the folder the reader chose', () => {
    it('clones into the project folder of a hub, leaves its project.yml, and the hub git then shows nothing of the clone', async () => {
        const dir = hub();
        const clone = join(dir, 'side-projects', 'p');
        const seen: Seen = { rescans: 0 };
        const options = optionsFor(remote({ 'a.txt': 'one\n', 'src/b.txt': 'two\n' }), {}, seen);
        const answer = await post(options, { action: 'clone', id: 'p', dir: clone });
        expect(answer).toMatchObject({ status: 200, body: { ok: true, dir: clone } });
        expect(existsSync(join(clone, '.git'))).toBe(true);
        expect(git(clone, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
        expect(readFileSync(join(clone, 'project.yml'), 'utf8')).toBe('title: p\n');
        expect(readFileSync(join(clone, 'src', 'b.txt'), 'utf8')).toBe('two\n');
        expect(seen.rescans).toBe(1);
        expect(existsSync(join(dir, '.gitignore'))).toBe(false);

        await syncNested([{ hub: dir, repositories: await nestedRepositories(dir, IGNORED) }]);
        const exclude = readFileSync(join(dir, '.git', 'info', 'exclude'), 'utf8');
        expect(exclude).toContain('/side-projects/p/\n');
        expect(git(dir, 'status', '--porcelain', '-uall')).toBe('');
        expect(git(dir, 'ls-files', 'side-projects/p/project.yml').trim()).toBe(
            'side-projects/p/project.yml'
        );
    });

    it('makes a folder that is missing', async () => {
        const parent = scratchDir('oculus-clone-route-parent-');
        const clone = join(parent, 'a', 'b');
        const answer = await post(optionsFor(remote({ 'a.txt': 'one\n' })), {
            action: 'clone',
            id: 'p',
            dir: clone
        });
        expect(answer.status).toBe(200);
        expect(readFileSync(join(clone, 'a.txt'), 'utf8')).toBe('one\n');
    });

    const TRACKED = [
        { name: 'its project.yml', file: 'project.yml' },
        { name: 'its README.md', file: 'README.md' }
    ];

    it.for(TRACKED)(
        'refuses a repository that tracks $name while the folder holds one, names the file and leaves the folder as it was',
        async ({ file }) => {
            const clone = scratchDir('oculus-clone-route-held-');
            put(clone, file, 'mine\n');
            put(clone, 'other.txt', 'mine too\n');
            const seen: Seen = { rescans: 0 };
            const answer = await post(
                optionsFor(remote({ [file]: 'theirs\n', 'a.txt': 'one\n' }), {}, seen),
                { action: 'clone', id: 'p', dir: clone }
            );
            expect(answer.status).toBe(400);
            expect(String(answer.body.error)).toContain(file);
            expect(answer.body.held).toEqual([file]);
            expect(existsSync(join(clone, '.git'))).toBe(false);
            expect(readdirSync(clone).sort()).toEqual([file, 'other.txt'].sort());
            expect(readFileSync(join(clone, file), 'utf8')).toBe('mine\n');
            expect(seen.rescans).toBe(0);
        }
    );

    const REFUSED = [
        {
            name: 'a project the portfolio does not hold',
            body: { action: 'clone', id: 'zz', dir: '/x' },
            status: 404,
            says: 'not in the portfolio'
        },
        {
            name: 'a project with no repository url',
            body: { action: 'clone', id: 'p', dir: '/x' },
            url: null,
            status: 400,
            says: 'no repository url'
        },
        {
            name: 'no folder',
            body: { action: 'clone', id: 'p', dir: '' },
            status: 400,
            says: 'Choose the folder'
        },
        {
            name: 'a folder that is not absolute',
            body: { action: 'clone', id: 'p', dir: 'side-projects/p' },
            status: 400,
            says: 'Choose the folder'
        }
    ];

    it.for(REFUSED)('refuses $name and reads nothing again', async (row) => {
        const seen: Seen = { rescans: 0 };
        const url = 'url' in row ? null : 'https://example.invalid/r.git';
        const answer = await post(optionsFor(url, {}, seen), row.body);
        expect(answer.status).toBe(row.status);
        expect(String(answer.body.error)).toContain(row.says);
        expect(seen.rescans).toBe(0);
    });

    it('refuses a folder that already holds a repository', async () => {
        const clone = scratchDir('oculus-clone-route-again-');
        const options = optionsFor(remote({ 'a.txt': 'one\n' }));
        expect((await post(options, { action: 'clone', id: 'p', dir: clone })).status).toBe(200);
        const again = await post(options, { action: 'clone', id: 'p', dir: clone });
        expect(again.status).toBe(400);
        expect(String(again.body.error)).toContain('already holds a repository');
    });

    it('refuses an address that does not answer with the sentence git gave and leaves no folder', async () => {
        const parent = scratchDir('oculus-clone-route-bad-');
        const clone = join(parent, 'p');
        const answer = await post(optionsFor(join(parent, 'no-such-remote')), {
            action: 'clone',
            id: 'p',
            dir: clone
        });
        expect(answer.status).toBe(400);
        expect(String(answer.body.error)).toMatch(/repository/i);
        expect(existsSync(clone)).toBe(false);
    });
});

describe('the folder a clone is running in', () => {
    /** A runner that holds its first command until `release` is called, then runs the real git. */
    function held(): { run: GitRunner; started: Promise<void>; release: () => void } {
        let release: () => void = () => undefined;
        let started: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const begun = new Promise<void>((resolve) => {
            started = resolve;
        });
        let first = true;
        const run: GitRunner = async (args, timeout, signal) => {
            if (first) {
                first = false;
                started();
                await gate;
            }
            return cloneGit(args, timeout, signal);
        };
        return { run, started: begun, release };
    }

    it('is held, so a second clone into it is refused while the first runs, and a clone into another folder is not', async () => {
        const url = remote({ 'a.txt': 'one\n' });
        const clone = scratchDir('oculus-clone-route-busy-');
        const other = scratchDir('oculus-clone-route-other-');
        const gate = held();
        const options = optionsFor(url, { git: gate.run, busy: new Set<string>() });
        const first = post(options, { action: 'clone', id: 'p', dir: clone });
        await gate.started;
        const second = await post(options, { action: 'clone', id: 'p', dir: clone });
        expect(second.status).toBe(400);
        expect(String(second.body.error)).toContain('is being cloned into');
        const third = await post(
            { ...options, git: undefined },
            { action: 'clone', id: 'p', dir: other }
        );
        expect(third.status).toBe(200);
        gate.release();
        expect((await first).status).toBe(200);
    });

    it('is the folder made for a repository of the account, so two presses on one repository are one clone', async () => {
        const url = remote({ 'a.txt': 'one\n' });
        const parent = scratchDir('oculus-clone-route-account-');
        const gate = held();
        const options = optionsFor(url, { git: gate.run, busy: new Set<string>() });
        const body = { action: 'github-clone', repo: { name: 'r', url }, parent };
        const first = post(options, body);
        await gate.started;
        const second = await post(options, body);
        expect(second.status).toBe(400);
        expect(String(second.body.error)).toContain(join(parent, 'r'));
        gate.release();
        expect((await first).status).toBe(200);
    });
});

describe('the repositories of the account', () => {
    it('lists them as the manifest block holds them', async () => {
        const listing = JSON.stringify([
            {
                name: 'one',
                url: 'https://github.com/me/one',
                visibility: 'PUBLIC',
                description: 'First',
                homepageUrl: 'https://one.example.invalid',
                repositoryTopics: [{ name: 'python' }],
                createdAt: '2023-01-02T03:04:05Z'
            },
            {
                name: 'two',
                url: 'https://github.com/me/two',
                visibility: 'PRIVATE',
                description: null,
                homepageUrl: '',
                repositoryTopics: null,
                createdAt: '2024-05-06T00:00:00Z'
            }
        ]);
        const answer = await post(optionsFor(null, { gh: printing(listing) }), {
            action: 'github-repos'
        });
        expect(answer.body.repos).toEqual([
            {
                name: 'one',
                url: 'https://github.com/me/one',
                visibility: 'public',
                description: 'First',
                homepage: 'https://one.example.invalid',
                topics: ['python'],
                date: '2023-01-02'
            },
            {
                name: 'two',
                url: 'https://github.com/me/two',
                visibility: 'private',
                description: '',
                homepage: '',
                topics: [],
                date: '2024-05-06'
            }
        ]);
    });

    it.for([
        { name: 'gh is not installed', run: printing('', false, 'spawn gh ENOENT') },
        {
            name: 'gh is not logged in',
            run: printing('', false, 'To get started with GitHub CLI, please run: gh auth login')
        },
        { name: 'gh printed no list', run: printing('not json') }
    ])('names gh auth login when $name', async ({ run }) => {
        const answer = await post(optionsFor(null, { gh: run }), { action: 'github-repos' });
        expect(answer.status).toBe(400);
        expect(String(answer.body.error)).toContain('gh auth login');
    });
});

describe('cloning a repository of the account into a folder the reader chose', () => {
    it('clones into <folder>/<name as GitHub gives it>, writes nothing else into it and reads the portfolio again', async () => {
        const parent = scratchDir('oculus-clone-route-folder-');
        const url = remote({ 'a.txt': 'one\n' });
        const seen: Seen = { rescans: 0 };
        const answer = await post(optionsFor(null, {}, seen), {
            action: 'github-clone',
            repo: { name: 'My_Repo.Name', url },
            parent
        });
        const dir = join(parent, 'My_Repo.Name');
        expect(answer).toMatchObject({ status: 200, body: { ok: true, dir } });
        expect(readdirSync(dir).sort()).toEqual(['.git', 'a.txt']);
        expect(readdirSync(parent)).toEqual(['My_Repo.Name']);
        expect(seen.rescans).toBe(1);
    });

    it('refuses a target that exists and holds files with the sentence git gave, and writes nothing', async () => {
        const parent = scratchDir('oculus-clone-route-exists-');
        put(parent, 'r/mine.txt', 'mine\n');
        const seen: Seen = { rescans: 0 };
        const answer = await post(optionsFor(null, {}, seen), {
            action: 'github-clone',
            repo: { name: 'r', url: remote({ 'a.txt': 'one\n' }) },
            parent
        });
        expect(answer.status).toBe(400);
        expect(String(answer.body.error)).toContain('already exists and is not an empty directory');
        expect(readdirSync(join(parent, 'r'))).toEqual(['mine.txt']);
        expect(seen.rescans).toBe(0);
    });

    const WRITES_NOTHING = [
        { name: 'a name that gives no folder name', repo: { name: '..' }, says: 'gives no folder' },
        { name: 'a name with a slash', repo: { name: 'a/b' }, says: 'gives no folder' }
    ];

    it.for(WRITES_NOTHING)('writes nothing for $name', async (row) => {
        const parent = scratchDir('oculus-clone-route-name-');
        const answer = await post(optionsFor(null), {
            action: 'github-clone',
            repo: { ...row.repo, url: remote({ 'a.txt': 'one\n' }) },
            parent
        });
        expect(answer.status).toBe(400);
        expect(String(answer.body.error)).toContain(row.says);
        expect(readdirSync(parent)).toEqual([]);
    });

    it('writes nothing when no folder was chosen or the chosen one is gone', async () => {
        const parent = scratchDir('oculus-clone-route-gone-');
        for (const chosen of ['', 'relative', join(parent, 'no-such-folder')]) {
            const answer = await post(optionsFor(null), {
                action: 'github-clone',
                repo: { name: 'x', url: remote({ 'a.txt': 'one\n' }) },
                parent: chosen
            });
            expect(answer.status).toBe(400);
        }
        expect(readdirSync(parent)).toEqual([]);
    });

    it('leaves no folder when the clone fails', async () => {
        const parent = scratchDir('oculus-clone-route-fail-');
        const answer = await post(optionsFor(null), {
            action: 'github-clone',
            repo: { name: 'broken', url: join(parent, 'no-such-remote') },
            parent
        });
        expect(answer.status).toBe(400);
        expect(readdirSync(parent)).toEqual([]);
    });

    it('refuses a repository that is not named', async () => {
        const answer = await post(optionsFor(null), {
            action: 'github-clone',
            repo: { name: '', url: '' },
            parent: '/tmp'
        });
        expect(answer.status).toBe(400);
        expect(String(answer.body.error)).toContain('not named');
    });
});
