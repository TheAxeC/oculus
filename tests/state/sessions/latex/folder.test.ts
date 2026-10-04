// Layer 2, client-state tests. The LaTeX store over a folder of a root: how it asks, how its answer
// is read against the root, the problems of the latest build as diagnostics, the outline, the word
// count and the root of a file, and the build that follows a save.
//
// `fetch` is a router stub answering by address; nothing here reaches a server, and the terminals
// the store watches are the ones the case puts in the `sessions` payload.

import { describe, expect, it, vi } from 'vitest';
import { receiveTerminals } from '../../../fixtures/sessions-fixture.ts';
import { json, refused, settle, stubHeld, type ClientState } from '../../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import {
    ASKED_DOCS,
    DOCS,
    configure,
    eachClient,
    folderAnswer,
    router,
    type Requests
} from './latex-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

/** The address `stubHeld` records for the folder DOCS. */
const ASKED_URL = '/api/latex?root=docs&path=proposal';

/** The project folder a project answer names. */
const FOLDER = 'projects/manuscripts/alpha';

eachClient((made) => {
    client = made;
});

const configured = (auto: unknown): void => configure(client, auto);

describe('the LaTeX state of a folder of a root', () => {
    it('asks api/latex with the root and the path once, and reads every path against the root', async () => {
        const seen = router({ '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5)) });

        const { state } = client.latex;
        expect(state(DOCS).loading).toBe(true);
        await settle();
        state(DOCS);

        expect(seen.asked).toEqual(['GET /api/latex?root=docs&path=proposal']);
        const held = state(DOCS);
        expect(held.root).toBe('docs');
        expect(held.dir).toBe('proposal');
        expect(held.mains[0].program).toBe('xelatex');
        expect(held.mains[0].pdfPath).toBe('proposal/main.pdf');
    });

    it('keeps a project and a folder whose names match apart', async () => {
        const seen = router({
            '/api/latex?id=x': () => json({ folder: 'x', mains: [] }),
            '/api/latex?root=x&path=x': () => json({ root: 'x', path: 'x', mains: [] })
        });

        client.latex.state({ id: 'x' });
        client.latex.state({ root: 'x', path: 'x' });
        await settle();

        expect(seen.asked).toEqual(['GET /api/latex?id=x', 'GET /api/latex?root=x&path=x']);
    });

    // Revert: leave the mark out of watch in state/sessions/latex.svelte.ts.
    it('asks again at once for a folder whose build is watched, before any sessions push', async () => {
        const seen = router({ '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5)) });
        const { state, watch } = client.latex;
        state(DOCS);
        await settle();
        expect(seen.asked).toEqual([ASKED_DOCS]);

        watch(DOCS, 'aabbcc-shell');
        state(DOCS);
        await settle();

        expect(seen.asked).toEqual([ASKED_DOCS, ASKED_DOCS]);
    });

    it('changes nothing when the answer lands after the folder was forgotten', async () => {
        const asked: string[] = [];
        const held = stubHeld(asked);
        const { state, invalidate, latexDiagnostics } = client.latex;
        state(DOCS);
        await settle();

        invalidate(DOCS);
        held.land(
            json(folderAnswer(5, [{ file: 'proposal/main.tex', line: 2, message: 'Missing $.' }]))
        );
        await settle();

        expect(latexDiagnostics()).toEqual([]);
        expect(asked).toEqual([ASKED_URL]);
        state(DOCS);
        await settle();
        expect(asked).toEqual([ASKED_URL, ASKED_URL]);
    });

    it("says a folder that is gone in the catalog's sentence, and asks again after Retry", async () => {
        let gone = true;
        const seen = router({
            '/api/latex?root=docs&path=proposal': () =>
                gone ? json({ error: 'missing' }, 404) : json(folderAnswer(5))
        });
        const { state, invalidate } = client.latex;
        state(DOCS);
        await settle();
        expect(state(DOCS).error).toBe(t('files.refused_missing'));

        gone = false;
        invalidate(DOCS);
        state(DOCS);
        await settle();

        expect(seen.asked).toEqual([ASKED_DOCS, ASKED_DOCS]);
        expect(state(DOCS).error).toBe('');
        expect(state(DOCS).mains).toHaveLength(1);
    });
});

describe('the problems of the latest build as diagnostics', () => {
    it('holds an error in an included file and a warning, the file against the root, and none after a clean build', async () => {
        let issues = true;
        router({
            '/api/latex?root=docs&path=proposal': () =>
                json(
                    issues
                        ? folderAnswer(
                              5,
                              [
                                  {
                                      file: 'proposal/sec/b.tex',
                                      line: 12,
                                      message: 'Missing $ inserted.'
                                  }
                              ],
                              [{ file: '', line: null, message: 'LaTeX: x.' }]
                          )
                        : folderAnswer(6)
                )
        });
        const { state, watch, latexDiagnostics } = client.latex;
        state(DOCS);
        await settle();

        expect(latexDiagnostics()).toEqual([
            {
                root: 'docs',
                file: 'proposal/sec/b.tex',
                line: 12,
                severity: 'error',
                message: 'Missing $ inserted.',
                source: 'latex'
            },
            {
                root: 'docs',
                file: 'proposal/main.tex',
                severity: 'warning',
                message: 'LaTeX: x.',
                source: 'latex'
            }
        ]);

        issues = false;
        watch(DOCS, 'aabbcc-shell');
        receiveTerminals(client, 1, []);
        state(DOCS);
        await settle();

        expect(latexDiagnostics()).toEqual([]);
    });

    it('reads a project target in the same form, against the hub', async () => {
        router({
            '/api/latex?id=alpha': () =>
                json({
                    folder: FOLDER,
                    mains: [
                        {
                            main: 'main.tex',
                            pdfPath: 'manuscript/main.pdf',
                            pdf: null,
                            log: 1,
                            errors: [{ file: 'sec/b.tex', line: 4, message: 'Bad.' }],
                            warnings: []
                        }
                    ]
                })
        });
        client.latex.state({ id: 'alpha' });
        await settle();

        expect(client.latex.latexDiagnostics()).toEqual([
            {
                root: 'hub',
                file: `${FOLDER}/manuscript/sec/b.tex`,
                line: 4,
                severity: 'error',
                message: 'Bad.',
                source: 'latex'
            }
        ]);
    });
});

describe('the outline, the word count and the root of a file', () => {
    const OUTLINE = '/api/latex?root=docs&path=proposal&outline=main.tex';
    const COUNT = '/api/latex?root=docs&path=proposal&count=main.tex';

    it('reads the outline as the server answered it, and the reason when it refused', async () => {
        const seen = router({
            [OUTLINE]: () =>
                json({
                    sections: [{ level: 2, title: 'A', file: 'proposal/main.tex', line: 3 }],
                    partial: ['proposal/bad.tex'],
                    unread: ['proposal/big.tex']
                })
        });
        const { outline } = client.latex;
        expect(outline(DOCS, 'main.tex').loading).toBe(true);
        await settle();

        expect(outline(DOCS, 'main.tex')).toEqual({
            sections: [{ level: 2, title: 'A', file: 'proposal/main.tex', line: 3 }],
            partial: ['proposal/bad.tex'],
            unread: ['proposal/big.tex'],
            error: '',
            loading: false
        });
        expect(seen.asked).toEqual([`GET ${OUTLINE}`]);

        client.latex.invalidate(DOCS);
        router({
            [OUTLINE]: () => json({ error: 'not-a-main' }, 404)
        });
        outline(DOCS, 'main.tex');
        await settle();
        expect(outline(DOCS, 'main.tex')).toEqual({
            sections: [],
            partial: [],
            unread: [],
            error: t('latex.refused_not_a_main'),
            loading: false
        });
    });

    // Revert: leave the `builtAgain` call out of `load` in state/sessions/latex.svelte.ts.
    it('asks for the outline again once the main file was built again, and not before', async () => {
        let at = 5;
        let titles = ['A'];
        const seen = router({
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(at)),
            [OUTLINE]: () =>
                json({
                    sections: titles.map((title) => ({
                        level: 2,
                        title,
                        file: 'p/m.tex',
                        line: 1
                    })),
                    partial: [],
                    unread: []
                })
        });
        const { state, outline, watch } = client.latex;
        state(DOCS);
        outline(DOCS, 'main.tex');
        await settle();
        outline(DOCS, 'main.tex');
        expect(outline(DOCS, 'main.tex').sections.map((one) => one.title)).toEqual(['A']);

        at = 9;
        titles = ['B'];
        watch(DOCS, 'aabbcc-shell');
        receiveTerminals(client, 1, ['aabbcc-shell']);
        state(DOCS);
        await settle();
        receiveTerminals(client, 2, []);
        state(DOCS);
        await settle();
        outline(DOCS, 'main.tex');
        await settle();

        expect(outline(DOCS, 'main.tex').sections.map((one) => one.title)).toEqual(['B']);
        expect(seen.asked.filter((one) => one.includes('outline='))).toEqual([
            `GET ${OUTLINE}`,
            `GET ${OUTLINE}`
        ]);
    });

    it('changes nothing when the outline lands after the folder was forgotten', async () => {
        const asked: string[] = [];
        const held = stubHeld(asked);
        const { outline, invalidate } = client.latex;
        outline(DOCS, 'main.tex');
        await settle();
        expect(asked).toEqual([OUTLINE]);

        invalidate(DOCS);
        held.land(json({ sections: [{ level: 1, title: 'late', file: 'f', line: 1 }] }));
        await settle();

        expect(outline(DOCS, 'main.tex').sections).toEqual([]);
        expect(outline(DOCS, 'main.tex').loading).toBe(true);
    });

    it('asks nothing for an empty target', async () => {
        const seen = router({});

        const found = client.latex.outline({ root: '', path: '' }, 'main.tex');
        await settle();

        expect(found.loading).toBe(false);
        expect(seen.asked).toEqual([]);
    });

    it('holds the words in the state until the main file is built again', async () => {
        let at = 5;
        router({
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(at)),
            [COUNT]: () => json({ words: 321 })
        });
        const { state, count, watch } = client.latex;
        state(DOCS);
        await settle();
        expect(await count(DOCS, 'main.tex')).toEqual({ words: 321, error: '' });
        expect(state(DOCS).mains[0].words).toBe(321);

        watch(DOCS, 'aabbcc-shell');
        receiveTerminals(client, 1, []);
        state(DOCS);
        await settle();
        expect(state(DOCS).mains[0].words).toBe(321);

        at = 6;
        watch(DOCS, 'aabbcc-shell');
        receiveTerminals(client, 2, []);
        state(DOCS);
        await settle();
        expect(state(DOCS).mains[0].words).toBeNull();
    });

    it('says the reason a count was refused and holds no words', async () => {
        router({
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5)),
            [COUNT]: () => json({ error: 'count-missing' }, 502)
        });
        client.latex.state(DOCS);
        await settle();

        expect(await client.latex.count(DOCS, 'main.tex')).toEqual({
            words: null,
            error: t('latex.refused_count_missing')
        });
        expect(client.latex.state(DOCS).mains[0].words).toBeNull();
    });

    // Revert: drop the counts check in count() of state/sessions/latex.svelte.ts.
    it('keeps the later count when two are pressed and the first answers last', async () => {
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        let n = 0;
        router({
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5)),
            [COUNT]: () => {
                n += 1;
                return n === 1 ? gate.then(() => json({ words: 100 })) : json({ words: 200 });
            }
        });
        client.latex.state(DOCS);
        await settle();

        const first = client.latex.count(DOCS, 'main.tex');
        const second = client.latex.count(DOCS, 'main.tex');
        await second;
        release();
        await first;

        expect(client.latex.state(DOCS).mains[0].words).toBe(200);
    });

    it('drops a count that lands after the folder was forgotten', async () => {
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        router({
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5)),
            [COUNT]: () => gate.then(() => json({ words: 100 }))
        });
        client.latex.state(DOCS);
        await settle();

        const pressed = client.latex.count(DOCS, 'main.tex');
        client.latex.invalidate(DOCS);
        release();
        await pressed;

        expect(client.latex.latexDiagnostics()).toEqual([]);
        expect(client.latex.state(DOCS)).toMatchObject({ mains: [], loading: true });
    });

    it('asks for the root of a file and answers it, or none for a file that builds through none', async () => {
        router({
            '/api/latex?root=docs&file=proposal%2Fc.tex': () =>
                json({ root: 'docs', path: 'proposal', main: 'main.tex' }),
            '/api/latex?root=docs&file=lone.tex': () => json({ main: null })
        });

        expect(await client.latex.rootOf('docs', 'proposal/c.tex')).toEqual({
            root: 'docs',
            path: 'proposal',
            main: 'main.tex'
        });
        expect(await client.latex.rootOf('docs', 'lone.tex')).toBeNull();
        expect(await client.latex.rootOf('docs', 'gone.tex')).toBeNull();
    });
});

describe('a build after a save', () => {
    const ROOT_OF = '/api/latex?root=docs&file=proposal%2Fc.tex';
    const MAIN = { root: 'docs', path: 'proposal', main: 'main.tex' };

    /** A router answering the root of c.tex, and every folder read with the main built. */
    function saving(): Requests {
        return router({
            [ROOT_OF]: () => json(MAIN),
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5))
        });
    }

    it('starts one build, not shown, of the main file the saved file builds through', async () => {
        configured('on_save');
        const seen = saving();
        const shown = vi.spyOn(client.terminals, 'showTerminal');

        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(seen.built).toEqual([
            {
                action: 'latex',
                root: 'docs',
                path: 'proposal',
                main: 'main.tex',
                step: 'build',
                cols: expect.any(Number) as number,
                rows: expect.any(Number) as number
            }
        ]);
        expect(shown).not.toHaveBeenCalled();
    });

    it.each([
        ['never', 0],
        ['', 1],
        ['sometimes', 1],
        ['on_save', 1]
    ])('with auto_build %j starts %i build', async (auto, builds) => {
        configured(auto);
        const seen = saving();

        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(seen.built).toHaveLength(builds);
    });

    it('builds when the configuration holds no latex key at all', async () => {
        client.entities.receive({
            channel: 'config',
            version: 1,
            payload: { config: {}, text: {}, findings: [] }
        });
        const seen = saving();

        await client.latex.onSaved('docs', 'proposal/c.tex');

        expect(seen.built).toHaveLength(1);
    });

    it('starts nothing for a file that is not a .tex file, and nothing for a file with no main', async () => {
        configured('on_save');
        const seen = router({ '/api/latex?root=docs&file=lone.tex': () => json({ main: null }) });

        await client.latex.onSaved('docs', 'notes.md');
        await client.latex.onSaved('docs', 'lone.tex');

        expect(seen.built).toEqual([]);
        expect(seen.asked).toEqual(['GET /api/latex?root=docs&file=lone.tex']);
    });

    // Revert: take the newest-save check out of onSaved in state/sessions/latex.svelte.ts.
    it('starts one build for two saves made while the root is still being asked', async () => {
        configured('on_save');
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const seen = router({
            [ROOT_OF]: () => gate.then(() => json(MAIN)),
            '/api/latex?root=docs&path=proposal': () => json(folderAnswer(5))
        });

        const first = client.latex.onSaved('docs', 'proposal/c.tex');
        const second = client.latex.onSaved('docs', 'proposal/c.tex');
        release();
        await Promise.all([first, second]);

        expect(seen.built).toHaveLength(1);
    });

    // Revert: take the running-terminal check out of build() in state/sessions/latex.svelte.ts.
    it('builds once more after a build that is still running, however many saves came', async () => {
        configured('on_save');
        const seen = saving();
        await client.latex.onSaved('docs', 'proposal/c.tex');
        receiveTerminals(client, 1, ['t1']);

        await client.latex.onSaved('docs', 'proposal/c.tex');
        await client.latex.onSaved('docs', 'proposal/c.tex');
        expect(seen.built).toHaveLength(1);

        receiveTerminals(client, 2, []);
        await settle();

        expect(seen.built).toHaveLength(2);
    });

    it('reads the folder again when the build ends, so its problems reach the editor', async () => {
        configured('on_save');
        let issue = false;
        const seen = router({
            [ROOT_OF]: () => json(MAIN),
            '/api/latex?root=docs&path=proposal': () =>
                json(
                    folderAnswer(
                        5,
                        issue ? [{ file: 'proposal/c.tex', line: 2, message: 'Bad.' }] : []
                    )
                )
        });
        client.latex.state(DOCS);
        await settle();
        await client.latex.onSaved('docs', 'proposal/c.tex');
        receiveTerminals(client, 1, ['t1']);
        issue = true;
        receiveTerminals(client, 2, []);
        await settle();

        expect(seen.asked.filter((one) => one.includes('path=proposal'))).toEqual([
            ASKED_DOCS,
            ASKED_DOCS
        ]);
        expect(client.latex.latexDiagnostics().map((one) => one.message)).toEqual(['Bad.']);
    });
});

describe('Format Document through the server', () => {
    /** The requests the stub saw, as the address, the token and the body of each. */
    function formatting(answer: () => Response | Promise<Response>) {
        const seen: { url: string; token: string; body: unknown }[] = [];
        vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
            const headers = init.headers as Record<string, string>;
            seen.push({
                url,
                token: headers['x-oculus-token'],
                body: JSON.parse(init.body as string)
            });
            return Promise.resolve(answer());
        });
        return seen;
    }

    // Revert: leave the `x-oculus-token` header out of format in state/sessions/latex.svelte.ts.
    it('posts the text with the write token and answers the formatted text', async () => {
        client.writes.setToken('the-token');
        const seen = formatting(() => json({ text: '  a\n' }));

        const done = await client.latex.format('a\n', 'proposal/main.tex');

        expect(done).toEqual({ text: '  a\n', error: '' });
        expect(seen).toEqual([
            {
                url: '/api/latex',
                token: 'the-token',
                body: { action: 'format', text: 'a\n', file: 'proposal/main.tex' }
            }
        ]);
    });

    it("answers no text and the catalog's sentence for the word a formatter was refused with", async () => {
        formatting(() => json({ error: 'tex-fmt-missing' }, 502));

        expect(await client.latex.format('a\n', 'main.tex')).toEqual({
            text: null,
            error: t('latex.refused_tex_fmt_missing')
        });
    });

    it('answers no text and the refusal with its status for a body that carries no word', async () => {
        formatting(() => json({ error: 'error: x' }, 502));

        expect(await client.latex.format('a\n', 'main.tex')).toEqual({
            text: null,
            error: refused(502)
        });
    });

    it('answers no text and the reason the request threw', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));

        expect(await client.latex.format('a\n', 'main.tex')).toEqual({
            text: null,
            error: 'offline'
        });
    });
});
