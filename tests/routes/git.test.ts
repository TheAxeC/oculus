// What the /api/git route answers. The route itself is two lines handing the request to
// lib/server/git-routes.ts with the token ServerContext minted, which is what this calls.
//
// Nothing here runs git: the handler takes the operations as options, and every case hands it a
// stub the test owns, so the roots are names rather than repositories and no file is written
// anywhere. What git actually does with a well-formed request is tests/server/git-write.test.ts.
//
// What this does NOT cover: the token reaching the page and Kit putting it on the event, which is
// exercised by the curl in the package's verification.

import { describe, expect, it } from 'vitest';
import { handleGit, handleGitBranches, messagePrompt } from '../../src/lib/server/git-routes.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import type { GitOptions } from '../../src/lib/server/git-routes.ts';
import { contextFixture } from '../server/context-fixture.ts';

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

function options(extra: GitOptions = {}): GitOptions {
    ran = [];
    return {
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
        expect(ran).toEqual([{ action: 'stage', root: ROOT, fields: expect.anything() }]);
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
                    diff: async (root, roots) => {
                        expect(root).toBe(published);
                        expect(roots).toEqual([published]);
                        return { ok: true, output: 'diff --git a/a.txt b/a.txt', error: '' };
                    },
                    ask: async () => ({
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
