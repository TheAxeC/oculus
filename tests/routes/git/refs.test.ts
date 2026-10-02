// What /api/git does for the actions and reads on commits and refs: cherryPick, checkoutDetached
// and deleteBranch behind the token and the confirm, a name that starts with a dash refused before
// git runs, a start point for a branch and a tag, and the reads head=, compare=, refs= and
// workspace=, each over a real scratch repository and each refused for a root no workspace names.
//
// What this does NOT cover: the page's use of the answers, which tests/state/sources/repositories
// holds.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    ACTIONS,
    CONFIRMED,
    handleGit,
    handleGitGet,
    type GitOptions
} from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { HOST, gitPost } from './request.ts';
import { commitFile, git, isolateGit, put, scratchRepo } from '../../server/git/refs/repo.ts';

isolateGit();

const TOKEN = mintToken();

function post(body: unknown, headers: Record<string, string> = {}): Request {
    return gitPost(TOKEN, body, headers);
}

function get(query: string): Request {
    return new Request(`http://${HOST}/api/git?${query}`, {
        headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
    });
}

function over(...roots: string[]): GitOptions {
    return { config: loadConfig(engineDir()).config, rootsFor: () => roots };
}

describe('the actions on commits and branches', () => {
    it('names the five new actions', () => {
        for (const action of ['trashUntracked', 'ignore', 'cherryPick', 'checkoutDetached']) {
            expect(ACTIONS, action).toContain(action);
        }
        expect(ACTIONS).toContain('deleteBranch');
        expect(ACTIONS).toContain('deleteBranchAnyway');
    });

    it('lists the five that lose work or move a branch among the confirmed', () => {
        for (const action of [
            'trashUntracked',
            'cherryPick',
            'checkoutDetached',
            'deleteBranch',
            'deleteBranchAnyway'
        ]) {
            expect(CONFIRMED, action).toContain(action);
        }
        expect(CONFIRMED).not.toContain('ignore');
    });

    it('refuses each without the token and each unconfirmed', async () => {
        const root = scratchRepo();
        const hash = git(root, 'rev-parse', 'HEAD').trim();
        const fields = { ref: hash, name: 'x', paths: ['u.txt'] };
        for (const action of [
            'cherryPick',
            'checkoutDetached',
            'deleteBranch',
            'deleteBranchAnyway'
        ]) {
            const noToken = await handleGit(
                post({ action, root, ...fields, confirm: true }, { 'x-oculus-token': '' }),
                TOKEN,
                over(root)
            );
            expect(noToken.status, action).toBe(403);
            const noConfirm = await handleGit(post({ action, root, ...fields }), TOKEN, over(root));
            expect(noConfirm.status, action).toBe(400);
            expect(await noConfirm.json()).toEqual({
                error: 'this action needs the page to confirm it'
            });
        }
    });

    it('detaches HEAD at a confirmed hash', async () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        commitFile(root, 'two.txt', 'two\n', 'Second');
        const response = await handleGit(
            post({ action: 'checkoutDetached', root, ref: first, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(response.status).toBe(200);
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(first);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('HEAD');
    });

    it('makes a branch and a tag at the start point the body names', async () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        commitFile(root, 'two.txt', 'two\n', 'Second');
        const branch = await handleGit(
            post({ action: 'createBranch', root, name: 'x', start: first, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(branch.status).toBe(200);
        expect(git(root, 'rev-parse', 'x').trim()).toBe(first);
        git(root, 'switch', '-q', 'main');
        const tag = await handleGit(
            post({ action: 'createTag', root, name: 'v1', start: first }),
            TOKEN,
            over(root)
        );
        expect(tag.status).toBe(200);
        expect(git(root, 'rev-list', '-n', '1', 'v1').trim()).toBe(first);
    });

    it('refuses a name or a start point that starts with a dash before git runs', async () => {
        const root = scratchRepo();
        const head = git(root, 'rev-parse', 'HEAD').trim();
        const bodies = [
            { action: 'createBranch', name: '-x', confirm: true },
            { action: 'createBranch', name: 'ok', start: '-x', confirm: true },
            { action: 'createTag', name: '-x' },
            { action: 'createTag', name: 'ok', start: '--force' },
            { action: 'deleteBranch', name: '-D', confirm: true },
            { action: 'deleteBranchAnyway', name: '-D', confirm: true },
            { action: 'checkoutDetached', ref: '--orphan', confirm: true },
            { action: 'cherryPick', ref: '--abort', confirm: true }
        ];
        for (const body of bodies) {
            const response = await handleGit(post({ root, ...body }), TOKEN, over(root));
            expect(response.status, JSON.stringify(body)).toBe(400);
        }
        expect(git(root, 'branch', '--list').trim()).toBe('* main');
        expect(git(root, 'tag', '--list').trim()).toBe('');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(head);
    });

    it('cherry-picks a confirmed commit and deletes a confirmed merged branch', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'other');
        const pick = commitFile(root, 'o.txt', 'o\n', 'Other file');
        git(root, 'switch', '-q', 'main');
        const picked = await handleGit(
            post({ action: 'cherryPick', root, ref: pick, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(picked.status).toBe(200);
        git(root, 'branch', 'merged');
        const deleted = await handleGit(
            post({ action: 'deleteBranch', root, name: 'merged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(deleted.status).toBe(200);
        expect(git(root, 'branch', '--list', 'merged').trim()).toBe('');
    });

    it('answers a branch git calls unmerged with the code not-merged, and deletes it on Delete Anyway', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'unmerged');
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const refused = await handleGit(
            post({ action: 'deleteBranch', root, name: 'unmerged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(refused.status).toBe(400);
        expect(await refused.json()).toMatchObject({ code: 'not-merged' });
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('unmerged');
        const unconfirmed = await handleGit(
            post({ action: 'deleteBranchAnyway', root, name: 'unmerged' }),
            TOKEN,
            over(root)
        );
        expect(unconfirmed.status).toBe(400);
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('unmerged');
        const gone = await handleGit(
            post({ action: 'deleteBranchAnyway', root, name: 'unmerged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(gone.status).toBe(200);
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('');
    });

    it('answers the checked-out branch with no code', async () => {
        const root = scratchRepo();
        const refused = await handleGit(
            post({ action: 'deleteBranch', root, name: 'main', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(refused.status).toBe(400);
        expect(Object.keys((await refused.json()) as object)).toEqual(['error']);
    });
});

describe('the reads head=, compare=, refs= and workspace=', () => {
    it('answers the text HEAD holds, missing and binary', async () => {
        const root = scratchRepo();
        put(root, 'new.txt', 'loose\n');
        put(root, 'blob.bin', Buffer.from([0, 1, 2, 0, 255]));
        git(root, 'add', 'blob.bin');
        git(root, 'commit', '-q', '-m', 'Binary');
        const read = async (path: string, stage = 'head') => {
            const response = await handleGitGet(
                get(
                    `head=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}&stage=${stage}`
                ),
                over(root)
            );
            return { status: response.status, body: (await response.json()) as unknown };
        };
        expect(await read('kept.txt')).toEqual({ status: 200, body: { ok: true, text: 'one\n' } });
        expect(await read('new.txt')).toEqual({ status: 200, body: { ok: true, missing: true } });
        expect(await read('*.txt')).toEqual({ status: 200, body: { ok: true, missing: true } });
        expect(await read('blob.bin')).toEqual({ status: 200, body: { ok: true, binary: true } });
        expect((await read('.')).status).toBe(400);
        expect((await read('kept.txt', 'nonsense')).status).toBe(400);
    });

    it('refuses a root no workspace names for each of the three reads', async () => {
        const root = scratchRepo();
        const other = scratchRepo();
        for (const query of [
            `head=${encodeURIComponent(other)}&path=kept.txt&stage=head`,
            `compare=${encodeURIComponent(other)}&from=main&to=${'a'.repeat(7)}`,
            `refs=${encodeURIComponent(other)}`,
            `workspace=${encodeURIComponent(other)}&path=kept.txt`
        ]) {
            const response = await handleGitGet(get(query), over(root));
            expect(response.status, query).toBe(400);
        }
    });

    it('answers the files of a compare and one file two sides', async () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        const second = commitFile(root, 'two.txt', 'two\n', 'Second');
        const files = await handleGitGet(
            get(`compare=${encodeURIComponent(root)}&from=${first}&to=${second}`),
            over(root)
        );
        expect(files.status).toBe(200);
        const body = (await files.json()) as { ok: boolean; files: { path: string }[] };
        expect(body.files.map((file) => file.path)).toEqual(['two.txt']);
        const one = await handleGitGet(
            get(`compare=${encodeURIComponent(root)}&from=${first}&to=${second}&path=two.txt`),
            over(root)
        );
        const sides = (await one.json()) as { files: { original: string; modified: string }[] };
        expect(sides.files.map((file) => [file.original, file.modified])).toEqual([['', 'two\n']]);
    });

    it('refuses a from side that could be taken for an option and writes no file', async () => {
        const root = scratchRepo();
        const head = git(root, 'rev-parse', 'HEAD').trim();
        const out = join(scratchDir('oculus-out-'), 'x');
        const response = await handleGitGet(
            get(
                `compare=${encodeURIComponent(root)}&from=${encodeURIComponent(`--output=${out}`)}&to=${head}`
            ),
            over(root)
        );
        expect(response.status).toBe(400);
        expect(existsSync(out)).toBe(false);
    });

    it('lists the refs a picker offers', async () => {
        const root = scratchRepo();
        git(root, 'tag', 'v1');
        git(root, 'branch', 'side');
        const response = await handleGitGet(get(`refs=${encodeURIComponent(root)}`), over(root));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            refs: [
                { name: 'main', kind: 'branch' },
                { name: 'side', kind: 'branch' },
                { name: 'v1', kind: 'tag' }
            ]
        });
    });

    it('answers the main worktree file against this worktree file for workspace=', async () => {
        const main = scratchRepo();
        const tree = join(scratchDir('oculus-linked-'), 'tree');
        git(main, 'worktree', 'add', '-q', '-b', 'tree', tree);
        put(main, 'kept.txt', 'main text\n');
        put(tree, 'kept.txt', 'tree text\n');
        const response = await handleGitGet(
            get(`workspace=${encodeURIComponent(tree)}&path=kept.txt`),
            over(tree, main)
        );
        expect(response.status).toBe(200);
        const body = (await response.json()) as { files: { original: string; modified: string }[] };
        expect(body.files.map((file) => [file.original, file.modified])).toEqual([
            ['main text\n', 'tree text\n']
        ]);
        const refused = await handleGitGet(
            get(`workspace=${encodeURIComponent(main)}&path=kept.txt`),
            over(main)
        );
        expect(refused.status).toBe(400);
        const unlisted = await handleGitGet(
            get(`workspace=${encodeURIComponent(tree)}&path=kept.txt`),
            over(tree)
        );
        expect(unlisted.status).toBe(400);
        expect(JSON.stringify(await unlisted.json())).not.toContain('main text');
    });

    it('adds the base of the checked-out branch to the first page of the graph', async () => {
        const root = scratchRepo();
        const remote = scratchDir('oculus-remote-');
        git(remote, 'init', '-q', '--bare');
        git(root, 'remote', 'add', 'origin', remote);
        git(root, 'push', '-q', '-u', 'origin', 'main');
        git(root, 'switch', '-q', '-c', 'feature', 'main');
        const first = await handleGitGet(
            get(`graph=${encodeURIComponent(root)}&skip=0`),
            over(root)
        );
        expect(((await first.json()) as { page: { base: string } }).page.base).toBe('origin/main');
    });
});
