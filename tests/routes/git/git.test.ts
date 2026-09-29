// What the /api/git route answers. The route itself is two lines handing the request to
// lib/server/git/git-routes.ts with the token ServerContext minted, which is what this calls, and
// the confirm refusal that module shares with /api/deposit.
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
    messagePrompt,
    unconfirmed
} from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import type { DiffAttributes, DiffSides } from '../../../src/lib/data/model/index.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';

const SERVER = contextFixture({ token: mintToken() });
const TOKEN = SERVER.token;
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/git`;

/** The one root every case is allowed to name. It is a name: nothing opens it. */
const ROOT = '/hub';

/** One file of a diff answer, as the reads answer it. */
function sidesFor(path: string): DiffSides {
    return {
        oldPath: path,
        newPath: path,
        head: [`diff --git a/${path} b/${path}`],
        binary: false,
        encoded: true,
        original: 'old\n',
        modified: 'new\n'
    };
}

/** What git's attributes say of a file git converts nothing in. */
const PLAIN: DiffAttributes = {
    filter: 'unspecified',
    text: 'unspecified',
    eol: 'unspecified',
    workingTreeEncoding: 'unspecified',
    ident: 'unspecified',
    autocrlf: ''
};

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
        config: loadConfig(engineDir()).config,
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
                return Promise.resolve({
                    ok: true as const,
                    value: { files: [sidesFor('a.txt')], attributes: PLAIN, conflicted: false }
                });
            }
        });
        const response = await handleGitGet(
            get(`diff=${encodeURIComponent(ROOT)}&path=a.txt&staged=1`),
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            files: [sidesFor('a.txt')],
            attributes: PLAIN,
            conflicted: false
        });
        expect(seen).toEqual([{ root: ROOT, path: 'a.txt', staged: true }]);

        await handleGitGet(get(`diff=${encodeURIComponent(ROOT)}&path=a.txt&staged=0`), into);
        expect(seen[1].staged).toBe(false);
    });

    it('refuses a diff of a root it was not given', async () => {
        const refused = await handleGitGet(get('diff=/somewhere/else&path=a.txt'), options());
        expect(refused.status).toBe(400);
    });

    it("answers a worktree's diff, the repository named beside the worktree", async () => {
        const path = '/hub/.agents/worktrees/package-one';
        const seen: { root: string; path: string }[] = [];
        const response = await handleGitGet(
            get(`worktree=${encodeURIComponent(path)}&root=${encodeURIComponent(ROOT)}`),
            options({
                worktree: (root, asked) => {
                    seen.push({ root, path: asked });
                    return Promise.resolve({ ok: true as const, value: [sidesFor('w.txt')] });
                }
            })
        );
        expect(response.status).toBe(200);
        expect(seen).toEqual([{ root: ROOT, path }]);
        // The answer is the files alone: the pane draws a diff and reads no state.
        expect(await response.json()).toEqual({ ok: true, files: [sidesFor('w.txt')] });
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
        ['pushTags', {}]
    ];

    /** Every action a reader takes back in one press, which asks nothing. */
    const PLAIN: [string, Record<string, unknown>][] = [
        ['stagePatch', { patch: 'diff --git a/a b/a\n' }],
        ['unstagePatch', { patch: 'diff --git a/a b/a\n' }],
        ['stageAll', { group: 'changed' }],
        ['unstageAll', {}],
        ['fetch', {}],
        ['resolve', { path: 'a.txt', content: 'both\n' }],
        ['markResolved', { path: 'a.txt' }],
        ['stash', { mode: 'untracked', message: 'aside' }],
        ['stashApply', { ref: 'stash@{1}' }],
        ['stashPop', { ref: 'stash@{0}' }],
        ['createTag', { name: 'v1', message: '' }]
    ];

    it('refuses each asking action unconfirmed, and takes it confirmed with its fields', async () => {
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
    });

    it('takes each plain action with no confirm', async () => {
        for (const [action, fields] of PLAIN) {
            const into = options();
            const response = await handleGit(
                request({ action, root: ROOT, ...fields }),
                TOKEN,
                into
            );
            expect(response.status, action).toBe(200);
            expect(ran.map((one) => one.action)).toEqual([action]);
            expect(ran[0].fields).toMatchObject(fields);
        }
    });

    it('reads the root again after a write git refused, since a stopped merge moved it', async () => {
        const read: string[] = [];
        const response = await handleGit(
            request({ action: 'pull', root: ROOT, confirm: true }),
            TOKEN,
            options({
                run: () =>
                    Promise.resolve({
                        ok: false,
                        output: '',
                        error: 'the pull stopped on conflicts'
                    }),
                refresh: (root) => read.push(root)
            })
        );
        expect(response.status).toBe(400);
        expect(read).toEqual([ROOT]);
    });
});

describe('the reads on demand', () => {
    function get(query: string): Request {
        return new Request(`${URL_}?${query}`, {
            headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
        });
    }
    const root = encodeURIComponent(ROOT);
    const asked: unknown[][] = [];
    const reads = {
        graph: (...args: unknown[]) => {
            asked.push(['graph', ...args]);
            return {
                ok: true as const,
                value: { commits: [], more: false, incoming: [], outgoing: [] }
            };
        },
        files: (...args: unknown[]) => {
            asked.push(['files', ...args]);
            return { ok: true as const, value: [{ status: 'M', path: 'a.txt', from: '' }] };
        },
        commit: (...args: unknown[]) => {
            asked.push(['commit', ...args]);
            return { ok: true as const, value: [sidesFor('a.txt')] };
        },
        stash: (...args: unknown[]) => {
            asked.push(['stash', ...args]);
            return { ok: true as const, value: [sidesFor('b')] };
        },
        blame: (...args: unknown[]) => {
            asked.push(['blame', ...args]);
            return { ok: true as const, value: [] };
        },
        marks: (...args: unknown[]) => {
            asked.push(['marks', ...args]);
            return { ok: true as const, value: [{ kind: 'added', line: 2, count: 1 }] };
        },
        sides: (...args: unknown[]) => {
            asked.push(['sides', ...args]);
            return { ok: false as const, error: 'a.txt is not in conflict' };
        }
    };

    it('answers each read under its own key, with what the request named', async () => {
        const into = options({ reads: reads as never });
        asked.length = 0;
        const cases: [string, string, unknown][] = [
            [
                `graph=${root}&skip=50`,
                'page',
                { commits: [], more: false, incoming: [], outgoing: [] }
            ],
            [`commit=abc123&root=${root}`, 'files', [{ status: 'M', path: 'a.txt', from: '' }]],
            [`commit=abc123&root=${root}&path=a.txt`, 'files', [sidesFor('a.txt')]],
            [`stash=${encodeURIComponent('stash@{0}')}&root=${root}`, 'files', [sidesFor('b')]],
            [`blame=${root}&path=a.txt`, 'lines', []],
            [`marks=${root}&path=a.txt`, 'marks', [{ kind: 'added', line: 2, count: 1 }]]
        ];
        for (const [query, key, value] of cases) {
            const response = await handleGitGet(get(query), into);
            expect(response.status, query).toBe(200);
            expect(await response.json()).toEqual({ ok: true, [key]: value });
        }
        expect(asked).toEqual([
            ['graph', ROOT, 50],
            ['files', ROOT, 'abc123'],
            ['commit', ROOT, 'abc123', 'a.txt'],
            ['stash', ROOT, 'stash@{0}'],
            ['blame', ROOT, 'a.txt'],
            ['marks', ROOT, 'a.txt']
        ]);
    });

    it('answers a refused read with its reason, and reads a page from 0 when skip is not a number', async () => {
        const into = options({ reads: reads as never });
        asked.length = 0;
        const refused = await handleGitGet(get(`sides=${root}&path=a.txt`), into);
        expect(refused.status).toBe(400);
        expect(await refused.json()).toEqual({ error: 'a.txt is not in conflict' });
        await handleGitGet(get(`graph=${root}&skip=many`), into);
        expect(asked.at(-1)).toEqual(['graph', ROOT, 0]);
    });

    it('refuses every read of a root it was not given, before reading', async () => {
        const into = options({ reads: reads as never });
        asked.length = 0;
        for (const query of [
            'graph=/elsewhere',
            'commit=abc&root=/elsewhere',
            'stash=stash@%7B0%7D&root=/elsewhere',
            'blame=/elsewhere&path=a',
            'marks=/elsewhere&path=a',
            'sides=/elsewhere&path=a'
        ]) {
            const response = await handleGitGet(get(query), into);
            expect(response.status, query).toBe(400);
        }
        expect(asked).toEqual([]);
    });
});

describe('unconfirmed', () => {
    const CONFIRMED = ['push'];

    it('refuses a confirmed action without confirm: true, and passes one with it', async () => {
        for (const fields of [{}, { confirm: 'true' }, { confirm: 1 }]) {
            const refused = unconfirmed(CONFIRMED, 'push', fields);
            expect(refused?.status).toBe(400);
            expect(refused?.headers.get('cache-control')).toBe('no-store');
            expect(await refused?.json()).toEqual({
                error: 'this action needs the page to confirm it'
            });
        }
        expect(unconfirmed(CONFIRMED, 'push', { confirm: true })).toBeNull();
    });

    it('passes an action that needs no confirm, the empty one among them', () => {
        expect(unconfirmed(CONFIRMED, 'fetch', {})).toBeNull();
        expect(unconfirmed(CONFIRMED, '', {})).toBeNull();
        expect(unconfirmed([], 'push', {})).toBeNull();
    });
});
