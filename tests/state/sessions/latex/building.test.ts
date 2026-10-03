// The building mark of a main file in the LaTeX store: true from the request for a build until
// its terminal has left the terminals list, the same for a project and a folder, and one build at
// a time per main file however many saves and Build presses came. A terminal the list has never
// named ends only once the server's own list lacks it too.
//
// `fetch` is a router stub answering by address; the terminals the store watches are the ones the
// case puts in the `sessions` payload.

import { describe, expect, it, vi } from 'vitest';
import { receiveTerminals } from '../../../fixtures/sessions-fixture.ts';
import { json, settle, type ClientState } from '../../../fixtures/client.ts';
import { DOCS, configure, eachClient, folderAnswer, gated, router } from './latex-fixture.ts';

let client: ClientState;
eachClient((made) => {
    client = made;
});

const configured = (auto: unknown): void => configure(client, auto);

describe('a main file is building from the request to the end of its terminal', () => {
    const ROOT_OF = '/api/latex?root=docs&file=proposal%2Fc.tex';
    const MAIN = { root: 'docs', path: 'proposal', main: 'main.tex' };
    const started = (): Response => json({ ok: true, terminal: { id: 't1' } });

    /** The routes of a folder whose main file c.tex builds through. */
    function routes(): Record<string, () => Response> {
        return {
            [ROOT_OF]: () => json(MAIN),
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5))
        };
    }

    const building = (): boolean => client.latex.state(DOCS).mains[0].building;

    // Revert: leave the `building` mark out of run() in state/sessions/latex.svelte.ts.
    it('is true while the request is out and while the terminal is listed, and false once it left', async () => {
        configured('on_save');
        const seen = gated(routes());
        client.latex.state(DOCS);
        await settle();
        expect(building()).toBe(false);

        const saved = client.latex.onSaved('docs', 'proposal/c.tex');
        await settle();
        expect(seen.posts).toHaveLength(1);
        expect(building()).toBe(true);

        seen.posts[0].answer(started());
        await saved;
        expect(building()).toBe(true);

        receiveTerminals(client, 1, ['t1']);
        expect(building()).toBe(true);

        receiveTerminals(client, 2, []);
        await settle();
        expect(building()).toBe(false);
    });

    // Revert: leave the release on a refusal out of run() in state/sessions/latex.svelte.ts.
    it('is false again after a request the server refused', async () => {
        configured('on_save');
        const seen = gated(routes());
        client.latex.state(DOCS);
        await settle();

        const saved = client.latex.onSaved('docs', 'proposal/c.tex');
        await settle();
        expect(building()).toBe(true);
        seen.posts[0].answer(json({ error: 'main is not a main file of this folder' }, 400));
        await saved;

        expect(building()).toBe(false);
    });

    it('is false again after a request that never reached the server', async () => {
        configured('on_save');
        let reached = false;
        vi.stubGlobal('fetch', (url: string) => {
            if (url === '/api/terminal') {
                reached = true;
                return Promise.reject(new Error('offline'));
            }
            const route = routes()[url] as (() => Response) | undefined;
            return Promise.resolve(route === undefined ? json({}, 404) : route());
        });
        client.latex.state(DOCS);
        await settle();

        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(reached).toBe(true);
        expect(building()).toBe(false);
    });

    // Revert: key the building mark by the target's form in state/sessions/latex.svelte.ts.
    it('is the same main file whichever form of target reads it, a project or a folder', async () => {
        const seen = gated({
            ...routes(),
            '/api/latex?id=alpha': () =>
                json({
                    folder: 'proposal-owner',
                    mains: [
                        {
                            main: 'main.tex',
                            program: 'pdflatex',
                            pdfPath: 'manuscript/main.pdf',
                            pdf: null,
                            log: null,
                            errors: [],
                            warnings: []
                        }
                    ]
                })
        });
        client.latex.state({ id: 'alpha' });
        await settle();
        const project = (): boolean => client.latex.state({ id: 'alpha' }).mains[0].building;
        expect(project()).toBe(false);

        const run = client.latex.run(
            { root: 'hub', path: 'proposal-owner/manuscript' },
            'main.tex',
            'build'
        );
        await settle();

        expect(seen.posts).toHaveLength(1);
        expect(project()).toBe(true);
        seen.posts[0].answer(started());
        await run;
    });

    it('is marked for a build and not for a clean', async () => {
        const seen = gated(routes());
        client.latex.state(DOCS);
        await settle();

        const clean = client.latex.run(DOCS, 'main.tex', 'clean');
        await settle();
        expect(building()).toBe(false);
        seen.posts[0].answer(started());
        expect(await clean).toMatchObject({ ok: true, id: 't1' });

        const build = client.latex.run(DOCS, 'main.tex', 'build');
        await settle();
        expect(building()).toBe(true);
        seen.posts[1].answer(json({ ok: true, terminal: { id: 't2' } }));
        await build;
    });
});

describe('a main file is never built twice at once', () => {
    const ROOT_OF = '/api/latex?root=docs&file=proposal%2Fc.tex';
    const ROOT_OF_D = '/api/latex?root=docs&file=proposal%2Fd.tex';
    const MAIN = { root: 'docs', path: 'proposal', main: 'main.tex' };
    const routes = (): Record<string, () => Response> => ({
        [ROOT_OF]: () => json(MAIN),
        [ROOT_OF_D]: () => json(MAIN),
        '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5))
    });

    // Revert: leave the terminal's listing out of build() so a build waits on a push to be seen.
    it('starts one build for two saves of chapters of one main before any sessions push', async () => {
        configured('on_save');
        const seen = router(routes());

        await client.latex.onSaved('docs', 'proposal/c.tex');
        await client.latex.onSaved('docs', 'proposal/d.tex');

        expect(seen.built).toHaveLength(1);
    });

    // Revert: set the in-flight mark after the request in run() of state/sessions/latex.svelte.ts.
    it('starts one build for a second save made while the first build request is still out', async () => {
        configured('on_save');
        const seen = gated(routes());

        const first = client.latex.onSaved('docs', 'proposal/c.tex');
        await settle();
        const second = client.latex.onSaved('docs', 'proposal/d.tex');
        await settle();
        expect(seen.posts).toHaveLength(1);
        seen.posts[0].answer(json({ ok: true, terminal: { id: 't1' } }));
        await Promise.all([first, second]);

        expect(seen.posts).toHaveLength(1);
    });

    it('builds once more after the first ends, for the saves that came while it was out', async () => {
        configured('on_save');
        const seen = gated(routes());

        const first = client.latex.onSaved('docs', 'proposal/c.tex');
        await settle();
        await client.latex.onSaved('docs', 'proposal/d.tex');
        seen.posts[0].answer(json({ ok: true, terminal: { id: 't1' } }));
        await first;
        receiveTerminals(client, 1, ['t1']);
        receiveTerminals(client, 2, []);
        await settle();

        expect(seen.posts).toHaveLength(2);
    });

    // Revert: end a never-listed terminal at the second push without reading the server's list.
    it('keeps one build across pushes that lack its terminal while the server still holds it', async () => {
        configured('on_save');
        const seen = router({
            ...routes(),
            '/api/terminal': () => json({ terminals: [{ id: 't1' }] })
        });
        await client.latex.onSaved('docs', 'proposal/c.tex');

        receiveTerminals(client, 1, []);
        await settle();
        receiveTerminals(client, 2, []);
        await settle();
        receiveTerminals(client, 3, []);
        await settle();
        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(seen.built).toHaveLength(1);
        expect(seen.asked.filter((one) => one === 'GET /api/terminal')).toHaveLength(3);
    });

    // Revert: end a never-listed terminal at a push, the server's list unread, in latex.svelte.ts.
    it('ends a build whose terminal the list never named once the server does not hold it', async () => {
        configured('on_save');
        const seen = router({ ...routes(), '/api/terminal': () => json({ terminals: [] }) });
        await client.latex.onSaved('docs', 'proposal/c.tex');

        receiveTerminals(client, 1, []);
        await settle();
        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(seen.built).toHaveLength(2);
    });

    it('keeps the build when the read of the server list fails, and ends it at a later read', async () => {
        configured('on_save');
        let held: () => Response = () => json({}, 500);
        const seen = router({ ...routes(), '/api/terminal': () => held() });
        await client.latex.onSaved('docs', 'proposal/c.tex');

        receiveTerminals(client, 1, []);
        await settle();
        await client.latex.onSaved('docs', 'proposal/c.tex');
        expect(seen.built).toHaveLength(1);

        held = () => json({ terminals: [] });
        receiveTerminals(client, 2, []);
        await settle();

        expect(seen.built).toHaveLength(2);
    });
});

describe('a Build press while a build of the main file is under way', () => {
    const ROOT_OF = '/api/latex?root=docs&file=proposal%2Fc.tex';
    const MAIN = { root: 'docs', path: 'proposal', main: 'main.tex' };
    const routes = (): Record<string, () => Response> => ({
        [ROOT_OF]: () => json(MAIN),
        '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5))
    });

    // Revert: leave the under-way check out of run() in state/sessions/latex.svelte.ts.
    it("starts none while the save's request is out, answers its terminal, and builds once after", async () => {
        configured('on_save');
        const seen = gated(routes());
        const saved = client.latex.onSaved('docs', 'proposal/c.tex');
        await settle();

        const pressed = client.latex.run(DOCS, 'main.tex', 'build');
        await settle();
        expect(seen.posts).toHaveLength(1);
        seen.posts[0].answer(json({ ok: true, terminal: { id: 't1' } }));
        await saved;

        expect(await pressed).toMatchObject({ ok: true, id: 't1' });
        receiveTerminals(client, 1, ['t1']);
        receiveTerminals(client, 2, []);
        await settle();
        expect(seen.posts).toHaveLength(2);
    });

    it("starts none while the save's terminal runs, answers its terminal, and builds once after", async () => {
        configured('on_save');
        const seen = router(routes());
        await client.latex.onSaved('docs', 'proposal/c.tex');
        receiveTerminals(client, 1, ['t1']);

        expect(await client.latex.run(DOCS, 'main.tex', 'build')).toEqual({
            ok: true,
            id: 't1',
            error: ''
        });
        expect(seen.built).toHaveLength(1);

        receiveTerminals(client, 2, []);
        await settle();
        expect(seen.built).toHaveLength(2);
    });
});
