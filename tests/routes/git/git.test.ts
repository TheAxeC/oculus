// What the /api/git route answers. The route itself is two lines handing the request to
// lib/server/git/git-routes.ts with the token ServerContext minted, which is what this calls.
//
// Nothing here runs git: the handler takes the operations as options, and every case hands it a
// stub the test owns, so the roots are names rather than repositories and no file is written
// anywhere. What git actually does with a well-formed request is
// tests/server/git/git-write.test.ts.
//
// What this does NOT cover: the token reaching the page and Kit putting it on the event, which is
// exercised by the curl in the package's verification.

import { describe, expect, it } from 'vitest';
import {
    handleGit,
    handleGitBranches,
    handleGitGet,
    messagePrompt
} from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import type { GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';

const SERVER = contextFixture({ token: mintToken() });
const TOKEN = SERVER.token;
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/git`;

/** The one root every case is allowed to name. It is a name: nothing opens it. */
const ROOT = '/hub';

describe('the commit-message instruction', () => {
    it('reads the required catalog key and reports it clearly when absent', () => {
        expect(messagePrompt({ text: { git: { message_prompt: 'Write it' } } })).toBe('Write it');
        expect(() => messagePrompt({ text: {} })).toThrow(
            'text key not in the text catalog (config/text/): git.message_prompt'
        );
    });
});

/** What ran, so a case can assert that a refusal refused before the operation. */
let ran: { action: string; root: string; fields: Record<string, unknown> }[] = [];

function options(extra: Partial<GitOptions> = {}): GitOptions {
    ran = [];
    return {
        engine: engineDir(),
        rootsFor: () => [ROOT],
        run: (action, root, fields) => {
            ran.push({ action, root, fields });
            return Promise.resolve({ ok: true, output: 'done', error: '' });
        },
        suggest: () => Promise.resolve({ ok: true, output: 'Add a thing', error: '' }),
        refresh: (root) => SERVER.git.refresh(root),
        ...extra
    };
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
function request(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
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

    it('refuses a request from another origin', async () => {
        const response = await handleGit(
            request(
                { action: 'stage', root: ROOT, paths: ['a.txt'] },
                { origin: 'http://example.invalid', 'sec-fetch-site': 'cross-site' }
            ),
            TOKEN,
            options()
        );
        expect(response.status).toBe(403);
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

    it('takes a commit that the page confirmed', async () => {
        const into = options();
        const response = await handleGit(
            request({ action: 'commit', root: ROOT, message: 'Add a thing', confirm: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(ran).toHaveLength(1);
        expect(ran[0].action).toBe('commit');
        expect(ran[0].fields.message).toBe('Add a thing');
    });

    it('takes a stage, which needs no confirm', async () => {
        const into = options();
        const response = await handleGit(
            request({ action: 'stage', root: ROOT, paths: ['a.txt'] }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, output: 'done' });
        const anything: unknown = expect.anything();
        expect(ran).toEqual([{ action: 'stage', root: ROOT, fields: anything }]);
    });

    it('refuses a root it was not given', async () => {
        const response = await handleGit(
            request({ action: 'stage', root: '/somewhere/else', paths: ['a.txt'] }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'that directory is not a workspace oculus knows'
        });
        expect(ran).toEqual([]);
    });

    it('refuses an action it does not know, and a body that is not JSON', async () => {
        const unknown = await handleGit(request({ action: 'clean', root: ROOT }), TOKEN, options());
        expect(unknown.status).toBe(400);
        const broken = await handleGit(request('{not json'), TOKEN, options());
        expect(broken.status).toBe(400);
        expect(ran).toEqual([]);
    });

    it('answers a suggested message without running anything else', async () => {
        const into = options();
        const response = await handleGit(request({ action: 'suggest', root: ROOT }), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, output: 'Add a thing' });
        expect(ran).toEqual([]);
    });

    it('suggests from a published workspace outside the hub', async () => {
        const published = '/published/workspace';
        const response = await handleGit(
            request({ action: 'suggest', root: published }),
            TOKEN,
            options({
                rootsFor: () => [published],
                suggest: undefined,
                message: {
                    diff: (root, roots) => {
                        expect(root).toBe(published);
                        expect(roots).toEqual([published]);
                        return Promise.resolve({
                            ok: true,
                            output: 'diff --git a/a.txt b/a.txt',
                            error: ''
                        });
                    },
                    ask: () =>
                        Promise.resolve({
                            ok: true,
                            output: 'Describe the published change',
                            error: ''
                        })
                }
            })
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            output: 'Describe the published change'
        });
        expect(ran).toEqual([]);
    });

    it('answers a refusal from git with its own reason', async () => {
        const response = await handleGit(
            request({ action: 'stage', root: ROOT, paths: ['a.txt'] }),
            TOKEN,
            options({ run: () => Promise.resolve({ ok: false, output: '', error: 'git said no' }) })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'git said no' });
    });
});

describe('the three worktree actions', () => {
    it('refuses each of them unconfirmed, and takes each one confirmed', async () => {
        for (const [action, fields] of [
            ['createWorktree', { name: 'package-one' }],
            ['removeWorktree', { path: '/hub/.agents/worktrees/package-one' }],
            ['merge', { branch: 'package-one' }]
        ] as [string, Record<string, unknown>][]) {
            const into = options();
            const unconfirmed = await handleGit(
                request({ action, root: ROOT, ...fields }),
                TOKEN,
                into
            );
            expect(unconfirmed.status, action).toBe(400);
            expect(await unconfirmed.json()).toEqual({
                error: 'this action needs the page to confirm it'
            });
            expect(ran, action).toEqual([]);

            const confirmed = await handleGit(
                request({ action, root: ROOT, ...fields, confirm: true }),
                TOKEN,
                into
            );
            expect(confirmed.status, action).toBe(200);
            expect(ran.map((one) => one.action)).toEqual([action]);
        }
    });

    it('refuses a worktree action on a root it was not given', async () => {
        const response = await handleGit(
            request({
                action: 'createWorktree',
                root: '/somewhere/else',
                name: 'one',
                confirm: true
            }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect(ran).toEqual([]);
    });

    it('answers a refusal from the worktree write with its own reason', async () => {
        const response = await handleGit(
            request({
                action: 'removeWorktree',
                root: ROOT,
                path: '/hub/elsewhere',
                confirm: true
            }),
            TOKEN,
            options({
                run: () =>
                    Promise.resolve({ ok: false, output: '', error: 'that path is not a worktree' })
            })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'that path is not a worktree' });
    });
});

describe('the diff reads', () => {
    /** A GET as the page makes it, same-origin and with no token. */
    function get(query: string): Request {
        return new Request(`${URL_}?${query}`, {
            headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
        });
    }

    it("answers one file's diff, and says which side it was asked for", async () => {
        const seen: { root: string; path: string; staged: boolean }[] = [];
        const into = options({
            diff: (root, path, staged) => {
                seen.push({ root, path, staged });
                return Promise.resolve({ ok: true, output: 'diff --git a b\n', error: '' });
            }
        });
        const response = await handleGitGet(
            get(`diff=${encodeURIComponent(ROOT)}&path=a.txt&staged=1`),
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, output: 'diff --git a b\n' });
        expect(seen).toEqual([{ root: ROOT, path: 'a.txt', staged: true }]);

        await handleGitGet(get(`diff=${encodeURIComponent(ROOT)}&path=a.txt&staged=0`), into);
        expect(seen[1].staged).toBe(false);
    });

    it('refuses a diff of a root it was not given, and one from another origin', async () => {
        const refused = await handleGitGet(get('diff=/somewhere/else&path=a.txt'), options());
        expect(refused.status).toBe(400);
        const elsewhere = await handleGitGet(
            new Request(`${URL_}?diff=${encodeURIComponent(ROOT)}&path=a.txt`, {
                headers: {
                    host: HOST,
                    origin: 'http://example.invalid',
                    'sec-fetch-site': 'cross-site'
                }
            }),
            options()
        );
        expect(elsewhere.status).toBe(403);
    });

    it("answers a worktree's diff, the repository named beside the worktree", async () => {
        const path = '/hub/.agents/worktrees/package-one';
        const seen: { root: string; path: string }[] = [];
        const response = await handleGitGet(
            get(`worktree=${encodeURIComponent(path)}&root=${encodeURIComponent(ROOT)}`),
            options({
                worktree: (root, asked) => {
                    seen.push({ root, path: asked });
                    return Promise.resolve({ ok: true, output: 'diff --git a b\n', error: '' });
                }
            })
        );
        expect(response.status).toBe(200);
        expect(seen).toEqual([{ root: ROOT, path }]);
        // The answer is the text alone: the pane draws a diff and reads no state.
        expect(await response.json()).toEqual({ ok: true, output: 'diff --git a b\n' });
    });

    it('checks the repository it was given and never the worktree it names', async () => {
        // A worktree of the hub is a workspace on the `git` channel and therefore a root of its
        // own; the request is still refused when the repository it names is not one.
        const path = '/hub/.agents/worktrees/package-one';
        const response = await handleGitGet(
            get(`worktree=${encodeURIComponent(path)}&root=/somewhere/else`),
            options({ rootsFor: () => [ROOT, path] })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'that directory is not a workspace oculus knows'
        });
    });

    it('refuses a worktree request naming no repository', async () => {
        const response = await handleGitGet(get('worktree=/elsewhere/tree'), options());
        expect(response.status).toBe(400);
    });

    it('answers the branch listing when it is asked for no diff', async () => {
        const response = await handleGitGet(get('root=/somewhere/else'), options());
        expect(response.status).toBe(400);
    });
});

describe('the branch listing', () => {
    it('refuses a root it was not given', async () => {
        const response = await handleGitBranches(
            new Request(`${URL_}?root=/somewhere/else`, {
                headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
            }),
            options()
        );
        expect(response.status).toBe(400);
    });

    it('refuses a request from another origin', async () => {
        const response = await handleGitBranches(
            new Request(`${URL_}?root=${encodeURIComponent(ROOT)}`, {
                headers: {
                    host: HOST,
                    origin: 'http://example.invalid',
                    'sec-fetch-site': 'cross-site'
                }
            }),
            options()
        );
        expect(response.status).toBe(403);
    });
});
