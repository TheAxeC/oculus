// Layer 2, route tests. What the /api/git route answers. The route itself is two lines handing the
// request to lib/server/git/git-routes.ts with the token ServerContext minted, which is what this
// calls, and the confirm refusal that module shares with /api/deposit.
//
// Nothing here runs git: the handler takes the operations as options, and every case hands it a
// stub the test owns, so the roots are names rather than repositories and no file is written
// anywhere. What git actually does with a request is tests/server/git/git-write.test.ts, which
// also holds the cases of a body of the wrong shape that reach the real operations.
//
// What this does NOT cover: the token reaching the page and Kit putting it on the event.
//
// A case that starts git, or takes 100 ms or more in a run of its own, is tagged slow; the others
// run in npm test.

import { describe, expect, it } from 'vitest';
import { handleGit } from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
import { gitPost } from './request.ts';

const SERVER = contextFixture({ token: mintToken() });
const TOKEN = SERVER.token;

/** The one root every case is allowed to name. It is a name: nothing opens it. */
const ROOT = '/hub';

/** What ran, so a case can assert that a refusal refused before the operation. */
let ran: { action: string; root: string; fields: Record<string, unknown> }[] = [];

function options(extra: Partial<GitOptions> = {}): GitOptions {
    ran = [];
    return {
        config: loadConfig(engineDir()).config,
        rootsFor: () => [ROOT],
        run: (action, root, fields) => {
            ran.push({ action, root, fields });
            return Promise.resolve({ ok: true, output: 'done', error: '' });
        },
        refresh: (root) => SERVER.git.refresh(root),
        ...extra
    };
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
function request(body: unknown, headers: Record<string, string> = {}): Request {
    return gitPost(TOKEN, body, headers);
}

describe('the git endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = options();
        const response = await handleGit(
            request({ action: 'stage', root: ROOT, paths: ['a.txt'] }, { 'x-oculus-token': '' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the write token is missing or stale' });
        expect(ran).toEqual([]);
    });

    it('refuses a commit that the page did not confirm', async () => {
        const response = await handleGit(
            request({ action: 'commit', root: ROOT, message: 'Add a thing' }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'this action needs the page to confirm it'
        });
        expect(ran).toEqual([]);
    });

    it('says the merge a cancelled run left in progress', async () => {
        const left = { code: 'cancelled', detail: '', program: 'git', left: 'merge' } as const;
        const response = await handleGit(
            request({ action: 'merge', root: ROOT, branch: 'other', confirm: true }),
            TOKEN,
            options({
                run: () => Promise.resolve({ ok: false, output: '', error: 'x', failure: left })
            })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'Git was stopped by Cancel; the merge is left in progress'
        });
    });
});

describe('the Source Control actions', () => {
    /** Every action that asks the page first, with the fields it takes. */
    const ASKING: [string, Record<string, unknown>][] = [
        ['pull', {}],
        ['sync', {}],
        ['publish', { remote: 'origin' }],
        ['revertPatch', { patch: 'diff --git a/a b/a\n' }],
        ['discardAll', {}],
        ['abortMerge', {}],
        ['continueRebase', {}],
        ['acceptDeletion', { path: 'a.txt' }],
        ['stashDrop', { ref: 'stash@{0}' }],
        ['deleteTag', { name: 'v1' }],
        ['pushTags', {}],
        ['createWorktree', { name: 'package-one' }],
        ['removeWorktree', { path: '/hub/.agents/worktrees/package-one' }],
        ['merge', { branch: 'package-one' }],
        ['cherryPick', { ref: 'abc1234' }],
        ['checkoutDetached', { ref: 'abc1234' }],
        ['deleteBranch', { name: 'old' }],
        ['deleteBranchAnyway', { name: 'old' }]
    ];

    it(
        'refuses each asking action unconfirmed, and takes it confirmed with its fields',
        { tags: ['slow'] },
        async () => {
            for (const [action, fields] of ASKING) {
                const into = options();
                const unconfirmed = await handleGit(
                    request({ action, root: ROOT, ...fields }),
                    TOKEN,
                    into
                );
                expect(unconfirmed.status, action).toBe(400);
                expect(ran, action).toEqual([]);
                const confirmed = await handleGit(
                    request({ action, root: ROOT, ...fields, confirm: true }),
                    TOKEN,
                    into
                );
                expect(confirmed.status, action).toBe(200);
                expect(ran.map((one) => one.action)).toEqual([action]);
                expect(ran[0].fields).toMatchObject(fields);
            }
        }
    );
});

describe('a body of the wrong shape', () => {
    it('asks for the confirm of an action whose confirm is not the boolean true', async () => {
        const response = await handleGit(
            request({ action: 'push', root: ROOT, confirm: 'true' }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'this action needs the page to confirm it'
        });
        expect(ran).toEqual([]);
    });
});
