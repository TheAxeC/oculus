// The LaTeX store over a project: what one project's state reads as, when it is asked for again,
// and what a build that has ended does to the PDF's address.
//
// `fetch` is a stub answering the shape api/latex answers; nothing here reaches a server, and the
// terminals the store watches are the ones the case puts in the `sessions` payload.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { receiveTerminals } from '../../../fixtures/sessions-fixture.ts';
import type { LatexState } from '../../../../src/lib/state/sessions/latex.svelte.ts';
import {
    createClientState,
    refused,
    settle,
    unreadable,
    type ClientState
} from '../../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

/** How many times the stub was asked, which is what says whether a push asked again. */
let asks = 0;

/** What the next answer carries, so a case can move a PDF's time between two asks. */
let pdf: number | null = null;

/** The project folder every answer names, and the PDF path a bump is asserted on. */
const FOLDER = 'projects/manuscripts/alpha';
const PDF_PATH = `${FOLDER}/manuscript/main.pdf`;

/** What the endpoint answers, with the PDF built at the moment given or never built at all. */
function answer(at: number | null): Response {
    return new Response(
        JSON.stringify({
            folder: FOLDER,
            mains: [
                {
                    main: 'main.tex',
                    pdfPath: 'manuscript/main.pdf',
                    pdf: at,
                    log: at,
                    errors: [{ file: 'main.tex', line: 3, message: 'Missing $ inserted.' }],
                    warnings: []
                }
            ]
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
    );
}

beforeEach(() => {
    asks = 0;
    pdf = null;
    vi.stubGlobal('fetch', (url: string) => {
        asks += 1;
        expect(url).toContain('/api/latex?id=');
        return Promise.resolve(answer(pdf));
    });
    client = createClientState();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("one project's LaTeX state", () => {
    it('asks once and holds what came back', async () => {
        const { state } = client.latex;
        expect(state({ id: 'alpha' }).loading).toBe(true);
        await settle();

        const held = state({ id: 'alpha' });
        expect(held.root).toBe('hub');
        expect(held.dir).toBe(`${FOLDER}/manuscript`);
        expect(held.mains.map((one) => one.main)).toEqual(['main.tex']);
        expect(held.mains[0].errors).toEqual([
            { file: `${FOLDER}/manuscript/main.tex`, line: 3, message: 'Missing $ inserted.' }
        ]);
        state({ id: 'alpha' });
        expect(asks).toBe(1);
    });

    it('asks nothing at all for no project', () => {
        expect(client.latex.state({ id: '' })).toEqual({
            root: '',
            dir: '',
            mains: [],
            error: '',
            loading: false
        });
        expect(asks).toBe(0);
    });

    it('carries the refusal sentence for a refused request, not the text it gave', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'no project with the id ghost' }), {
                    status: 404,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );
        const fresh = createClientState();
        fresh.latex.state({ id: 'ghost' });
        await settle();

        expect(fresh.latex.state({ id: 'ghost' }).error).toBe(refused(404));
    });
});

describe('the build the store is waiting on', () => {
    it('asks again on every sessions push while the terminal runs, and stops when it ends', async () => {
        const { state, watch } = client.latex;
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(1);

        watch({ id: 'alpha' }, 'aabbcc-shell');
        receiveTerminals(client, 1, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(2);

        // A push while it is still running is the panel asking again, which is how a row that says
        // something new mid-build says it.
        receiveTerminals(client, 2, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(3);

        // The push that no longer carries it is the build having ended: one last ask, and no more.
        receiveTerminals(client, 3, []);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(4);

        receiveTerminals(client, 4, []);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(4);
    });

    // Revert: in the sessions listener of state/sessions/latex.svelte.ts, take out the test of the
    // version heard.
    it('asks once for two sessions messages at one version', async () => {
        const { state, watch } = client.latex;
        state({ id: 'alpha' });
        await settle();
        watch({ id: 'alpha' }, 'aabbcc-shell');
        receiveTerminals(client, 1, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(2);

        receiveTerminals(client, 2, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(3);

        receiveTerminals(client, 2, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(asks).toBe(3);
    });

    it('asks again when the terminals list moved while a request was out', async () => {
        const { state, watch } = client.latex;
        let count = 0;
        let built: number | null = null;
        let hold = false;
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        // The answer is built when the request is made, so a request held back carries the state as
        // it was then, which is what a request still out when the build ends would carry.
        vi.stubGlobal('fetch', () => {
            count += 1;
            const body = answer(built);
            if (!hold) return Promise.resolve(body);
            hold = false;
            return gate.then(() => body);
        });

        state({ id: 'alpha' });
        await settle();
        expect(count).toBe(1);

        // The press: the ask it makes is held back, so it is still out when the list moves.
        watch({ id: 'alpha' }, 'aabbcc-shell');
        hold = true;
        receiveTerminals(client, 1, ['aabbcc-shell']);
        state({ id: 'alpha' });
        await settle();
        expect(count).toBe(2);

        // The build ends and writes its PDF while that request is still out. The read it would have
        // asked at is dropped, since a request for this project is in flight.
        built = 1757500000000;
        receiveTerminals(client, 2, []);
        state({ id: 'alpha' });
        await settle();
        expect(count).toBe(2);

        release();
        await settle();
        state({ id: 'alpha' });
        await settle();

        expect(count).toBe(3);
        expect(state({ id: 'alpha' }).mains[0].pdf).toBe(built);
        expect(client.fs.fileVersion('hub', PDF_PATH)).toBe(1);
        // The answer that settled is the current one, so nothing asks a fourth time.
        state({ id: 'alpha' });
        await settle();
        expect(count).toBe(3);
    });

    it('moves the PDF address when the build wrote a new one', async () => {
        const { state, watch } = client.latex;
        const path = PDF_PATH;
        state({ id: 'alpha' });
        await settle();
        expect(client.fs.fileVersion('hub', path)).toBe(0);

        watch({ id: 'alpha' }, 'aabbcc-shell');
        pdf = 1757500000000;
        receiveTerminals(client, 1, []);
        state({ id: 'alpha' });
        await settle();

        expect(state({ id: 'alpha' }).mains[0].pdf).toBe(pdf);
        expect(client.fs.fileVersion('hub', path)).toBe(1);
    });

    it('leaves the address alone when the build wrote no new PDF', async () => {
        const { state, watch } = client.latex;
        const path = PDF_PATH;
        pdf = 1757500000000;
        state({ id: 'alpha' });
        await settle();

        watch({ id: 'alpha' }, 'aabbcc-shell');
        receiveTerminals(client, 1, []);
        state({ id: 'alpha' });
        await settle();

        expect(client.fs.fileVersion('hub', path)).toBe(0);
    });
});

describe('an answer whose fields are of the wrong type', () => {
    /** What a refused or unread request leaves: no root, no folder and no mains. */
    const NOTHING_HELD: LatexState = { root: '', dir: '', mains: [], error: '', loading: false };

    /** What an answer that holds no usable mains leaves for a project: the hub, and no mains. */
    const NO_MAINS: LatexState = { ...NOTHING_HELD, root: 'hub' };

    /** The state a fresh store holds for an id once the endpoint answered `text` with `status`. */
    async function answeredWith(text: string, status = 200): Promise<LatexState> {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        const fresh = createClientState();
        fresh.latex.state({ id: 'p' });
        await settle();
        return fresh.latex.state({ id: 'p' });
    }

    it('keeps the mains that carry a name and the issues that carry a message, each field as typed or at its fallback', async () => {
        const body = {
            folder: 'f',
            mains: [
                { main: '' },
                { main: 'm', pdf: '1' },
                {
                    main: 'a',
                    pdf: 5,
                    log: 7,
                    pdfPath: 'p.pdf',
                    errors: [{ message: 'x', line: 3, file: 'f.tex' }]
                },
                {
                    main: 'b',
                    pdfPath: 3,
                    log: 'x',
                    errors: [
                        { message: 'x', line: '3' },
                        null,
                        { message: '' },
                        { message: 'ok', file: 3, line: 4 },
                        3,
                        []
                    ],
                    warnings: {}
                },
                null,
                3,
                'x',
                [],
                { main: 3 }
            ]
        };
        expect(await answeredWith(JSON.stringify(body))).toStrictEqual({
            root: 'hub',
            dir: '',
            mains: [
                {
                    main: 'm',
                    program: 'pdflatex',
                    pdfPath: '',
                    pdf: null,
                    log: null,
                    errors: [],
                    warnings: [],
                    words: null,
                    building: false
                },
                {
                    main: 'a',
                    program: 'pdflatex',
                    pdfPath: 'f/p.pdf',
                    pdf: 5,
                    log: 7,
                    errors: [{ file: 'f/f.tex', line: 3, message: 'x' }],
                    warnings: [],
                    words: null,
                    building: false
                },
                {
                    main: 'b',
                    program: 'pdflatex',
                    pdfPath: '',
                    pdf: null,
                    log: null,
                    errors: [
                        { file: '', line: null, message: 'x' },
                        { file: '', line: 4, message: 'ok' }
                    ],
                    warnings: [],
                    words: null,
                    building: false
                }
            ],
            error: '',
            loading: false
        });
    });

    it('keeps a time or a line that is infinite, since a number is a number', async () => {
        const text =
            '{"folder":"f","mains":[{"main":"m","pdf":1e999,"log":-1e999,"errors":[{"message":"x","line":1e999}]}]}';
        expect(await answeredWith(text)).toStrictEqual({
            root: 'hub',
            dir: '',
            mains: [
                {
                    main: 'm',
                    program: 'pdflatex',
                    pdfPath: '',
                    pdf: Infinity,
                    log: -Infinity,
                    errors: [{ file: '', line: Infinity, message: 'x' }],
                    warnings: [],
                    words: null,
                    building: false
                }
            ],
            error: '',
            loading: false
        });
    });

    it.each([
        [
            'a folder that is a number and mains that are a map',
            '{"folder":3,"mains":{}}',
            200,
            NO_MAINS
        ],
        ['mains that are a string', '{"folder":"f","mains":"x"}', 200, { ...NO_MAINS, dir: 'f' }],
        ['a list as the body', '[]', 200, NO_MAINS],
        ['an empty map as the body', '{}', 200, NO_MAINS],
        ['an error that is a number on a 200', '{"error":3}', 200, NO_MAINS],
        ['a list as the body of a refusal', '[]', 500, { ...NOTHING_HELD, error: refused(500) }],
        [
            'a refusal with a text of its own',
            '{"error":"boom"}',
            500,
            { ...NOTHING_HELD, error: refused(500) }
        ],
        [
            'a refusal with an empty text',
            '{"error":""}',
            500,
            { ...NOTHING_HELD, error: refused(500) }
        ]
    ])('answers %s as the state it names', async (_name, text, status, expected) => {
        expect(await answeredWith(text, status)).toStrictEqual(expected);
    });

    it('answers the refusal sentence for a refusal whose error is a number', async () => {
        expect(await answeredWith('{"error":3}', 500)).toStrictEqual({
            ...NOTHING_HELD,
            error: refused(500)
        });
    });

    it.each([
        ['null', 'null', 200, { ...NOTHING_HELD, error: unreadable(200) }],
        ['text that is not JSON', 'nope', 200, { ...NOTHING_HELD, error: unreadable(200) }],
        ['null on a refusal', 'null', 500, { ...NOTHING_HELD, error: unreadable(500) }],
        [
            'text that is not JSON on a refusal',
            'nope',
            500,
            { ...NOTHING_HELD, error: unreadable(500) }
        ]
    ])(
        'answers a body that is %s as the unreadable sentence with its status',
        async (_name, text, status, expected) => {
            expect(await answeredWith(text, status)).toStrictEqual(expected);
        }
    );
});

/** The folder every folder answer below names, against the root `docs`. */
