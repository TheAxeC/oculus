// Layer 2, client-state tests. What the deposit store holds for a project once GET /api/deposit has
// answered, for an answer of the right shape and for every shape it is not: a state that is no
// mirror, an error that is not a word, a body that is a list, JSON null or no JSON at all, and a
// request that never reached the server.
//
// `fetch` is a stub and `window` an empty object, so the store asks as it does in the browser and
// nothing here opens a socket. What this does not cover: the panel that draws the held state, which
// is tests/views/boards/deposit.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createClientState,
    refused,
    settle,
    unreadable,
    type ClientState
} from '../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

/** The addresses the stub was asked for, in order. */
let asked: string[] = [];

/** Answer every request with this text and status. */
function answering(text: string, status = 200): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return Promise.resolve(new Response(text, { status }));
    });
}

/** The panel's held shape for a project, once the stub has answered. */
async function held(id = 'alpha'): Promise<ReturnType<ClientState['deposit']['mirror']>> {
    client.deposit.mirror(id);
    await settle();
    return client.deposit.mirror(id);
}

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const STATE = {
    id: 'alpha',
    repo: '/hub/alpha',
    mirror: '/mirror/alpha',
    exists: true,
    branch: 'main',
    remote: 'origin',
    ahead: 2,
    plan: null
};

describe('the mirror of a project', () => {
    it('is the state the endpoint answered, with the address of the project', async () => {
        answering(JSON.stringify({ state: STATE }));
        expect(await held('a b')).toStrictEqual({ state: STATE, error: '', loading: false });
        expect(asked).toStrictEqual(['/api/deposit?id=a%20b']);
    });

    it.each([
        ['a body with no state', '{}'],
        ['a state that is null', '{"state":null}'],
        ['a body that is a list', '[]']
    ])('is no state for %s', async (_name, text) => {
        answering(text);
        expect(await held()).toStrictEqual({ state: null, error: '', loading: false });
    });

    it.each([
        ['a number', '3'],
        ['a map with one field', '{"id":"alpha"}'],
        ['a map whose exists is a string', JSON.stringify({ ...STATE, exists: 'yes' })],
        ['a map whose ahead is a string', JSON.stringify({ ...STATE, ahead: '2' })],
        ['a map whose plan is a number', JSON.stringify({ ...STATE, plan: 3 })]
    ])('holds a state that is %s as no state', async (_name, state) => {
        answering(`{"state":${state}}`);
        expect(await held()).toStrictEqual({ state: null, error: '', loading: false });
    });

    it('holds a state whose plan is a plan, and the plan with its lists', async () => {
        const plan = {
            repo: '/hub/alpha',
            mirror: '/mirror/alpha',
            branch: 'main',
            remote: 'origin',
            files: ['a.txt'],
            changes: [{ path: 'a.txt', letters: 'M ' }],
            findings: [{ kind: 'size', path: 'big.bin', mb: 120 }]
        };
        answering(JSON.stringify({ state: { ...STATE, plan } }));
        expect(await held()).toStrictEqual({
            state: { ...STATE, plan },
            error: '',
            loading: false
        });
    });

    it('holds the refusal sentence for a refusal, whatever text it carries', async () => {
        answering('{"error":"no mirror"}', 404);
        expect(await held()).toStrictEqual({ state: null, error: refused(404), loading: false });
    });

    it('holds the refusal sentence and no state when a refusal also names a state', async () => {
        answering(JSON.stringify({ state: STATE, error: 'broken' }), 500);
        expect(await held()).toStrictEqual({ state: null, error: refused(500), loading: false });
    });

    it('holds the sentence of a request that never reached the server', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        expect(await held()).toStrictEqual({
            state: null,
            error: 'Failed to fetch',
            loading: false
        });
    });

    it('holds the text of a rejection that is no error', async () => {
        // A thenable rejects with any value; `Promise.reject` is held to errors by the linter.
        vi.stubGlobal('fetch', () => ({
            then: (_resolve: unknown, reject: (why: unknown) => void) => {
                reject('refused');
            }
        }));
        expect(await held()).toStrictEqual({ state: null, error: 'refused', loading: false });
    });

    it.each([
        { name: 'JSON null', text: 'null', status: 200 },
        { name: 'a page that is no JSON', text: '<html>Bad Gateway</html>', status: 502 }
    ])(
        'holds the unreadable sentence for $name sent with status $status',
        async ({ text, status }) => {
            answering(text, status);
            expect(await held()).toStrictEqual({
                state: null,
                error: unreadable(status),
                loading: false
            });
        }
    );
});
