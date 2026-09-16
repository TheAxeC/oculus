// The LaTeX store: what one project's state reads as, when it is asked for again, and what a build
// that has ended does to the PDF's address.
//
// `fetch` is a stub answering the shape api/latex answers; nothing here reaches a server, and the
// terminals the store watches are the ones the case puts in the `sessions` payload.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { terminal } from '../sessions-fixture.ts';
import type { SessionsPayload } from '../../src/lib/data/model.ts';
import { createClientState, type ClientState } from '../client.ts';

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

/** A sessions payload holding the terminals named, at the version given. */
function sessions(version: number, ids: string[]): void {
    const held: SessionsPayload = {
        records: [],
        workspaces: [],
        terminals: ids.map((id) => terminal(id, { name: `latex build alpha/main.tex` }))
    };
    client.entities.receive({ channel: 'sessions', version, payload: held });
}

/** Let the scheduled fetch and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("one project's LaTeX state", () => {
    it('asks once and holds what came back', async () => {
        const { state } = client.latex;
        expect(state('alpha').loading).toBe(true);
        await settle();

        const held = state('alpha');
        expect(held.folder).toBe('projects/manuscripts/alpha');
        expect(held.mains.map((one) => one.main)).toEqual(['main.tex']);
        expect(held.mains[0].errors).toEqual([
            { file: 'main.tex', line: 3, message: 'Missing $ inserted.' }
        ]);
        state('alpha');
        expect(asks).toBe(1);
    });

    it('asks nothing at all for no project', () => {
        expect(client.latex.state('')).toEqual({
            mains: [],
            folder: '',
            error: '',
            loading: false
        });
        expect(asks).toBe(0);
    });

    it('carries the reason a refused request gave', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'no project with the id ghost' }), {
                    status: 404,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );
        const fresh = createClientState();
        fresh.latex.state('ghost');
        await settle();

        expect(fresh.latex.state('ghost').error).toBe('no project with the id ghost');
    });
});

describe('the build the store is waiting on', () => {
    it('asks again on every sessions push while the terminal runs, and stops when it ends', async () => {
        const { state, watch } = client.latex;
        state('alpha');
        await settle();
        expect(asks).toBe(1);

        watch('alpha', 'aabbcc-shell');
        sessions(1, ['aabbcc-shell']);
        state('alpha');
        await settle();
        expect(asks).toBe(2);

        // A push while it is still running is the panel asking again, which is how a row that says
        // something new mid-build says it.
        sessions(2, ['aabbcc-shell']);
        state('alpha');
        await settle();
        expect(asks).toBe(3);

        // The push that no longer carries it is the build having ended: one last ask, and no more.
        sessions(3, []);
        state('alpha');
        await settle();
        expect(asks).toBe(4);

        sessions(4, []);
        state('alpha');
        await settle();
        expect(asks).toBe(4);
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

        state('alpha');
        await settle();
        expect(count).toBe(1);

        // The press: the ask it makes is held back, so it is still out when the list moves.
        watch('alpha', 'aabbcc-shell');
        hold = true;
        sessions(1, ['aabbcc-shell']);
        state('alpha');
        await settle();
        expect(count).toBe(2);

        // The build ends and writes its PDF while that request is still out. The read it would have
        // asked at is dropped, since a request for this project is in flight.
        built = 1757500000000;
        sessions(2, []);
        state('alpha');
        await settle();
        expect(count).toBe(2);

        release();
        await settle();
        state('alpha');
        await settle();

        expect(count).toBe(3);
        expect(state('alpha').mains[0].pdf).toBe(built);
        expect(client.fs.fileVersion('hub', PDF_PATH)).toBe(1);
        // The answer that settled is the current one, so nothing asks a fourth time.
        state('alpha');
        await settle();
        expect(count).toBe(3);
    });

    it('moves the PDF address when the build wrote a new one', async () => {
        const { state, watch } = client.latex;
        const path = PDF_PATH;
        state('alpha');
        await settle();
        expect(client.fs.fileVersion('hub', path)).toBe(0);

        watch('alpha', 'aabbcc-shell');
        pdf = 1757500000000;
        sessions(1, []);
        state('alpha');
        await settle();

        expect(state('alpha').mains[0].pdf).toBe(pdf);
        expect(client.fs.fileVersion('hub', path)).toBe(1);
    });

    it('leaves the address alone when the build wrote no new PDF', async () => {
        const { state, watch } = client.latex;
        const path = PDF_PATH;
        pdf = 1757500000000;
        state('alpha');
        await settle();

        watch('alpha', 'aabbcc-shell');
        sessions(1, []);
        state('alpha');
        await settle();

        expect(client.fs.fileVersion('hub', path)).toBe(0);
    });
});
