// The documents the views read: one request per project and name, per hub path and for the manual,
// what is held between renders, and what a new version on the `files` channel does to it.
//
// Nothing here touches the network or the real hub: `fetch` is a stub that records the URL it was
// given and answers what the case wants. What this does NOT cover: the endpoint itself, which is
// tests/routes/docs/docs.test.ts, and the view drawing the HTML, which is
// tests/views/boards/project.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let document: ClientState['docs']['document'];
let hubDocument: ClientState['docs']['hubDocument'];
let manual: ClientState['docs']['manual'];
let invalidate: ClientState['docs']['invalidate'];
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ document, hubDocument, invalidate, manual } = client.docs);
    ({ receive } = client.entities);
});

type Answer = { status: number; body: unknown };

/** The URLs the stub was asked for, in order. */
let asked: string[] = [];

/** Install a fetch that answers every request the same way, and record what it was asked. */
function serving(answer: Answer): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return Promise.resolve(
            new Response(JSON.stringify(answer.body), {
                status: answer.status,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
}

/** Let the scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('the documents of a project', () => {
    it('asks the endpoint once for a pair and holds the answer', async () => {
        serving({ status: 200, body: { html: '<h1>Alpha</h1>', frontmatter: { stage: 'run' } } });
        receive({ channel: 'files', version: 3, payload: { root: '/hub' } });

        expect(document('alpha', 'README.md').loading).toBe(true);
        await settle();

        const held = document('alpha', 'README.md');
        expect(held.html).toBe('<h1>Alpha</h1>');
        expect(held.frontmatter).toEqual({ stage: 'run' });
        expect(held.loading).toBe(false);
        expect(held.error).toBe('');

        document('alpha', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=alpha&name=README.md']);
    });

    it('holds what the endpoint refused with instead of the document', async () => {
        serving({ status: 404, body: { error: 'document does not exist' } });
        document('bravo', 'code/README.md');
        await settle();
        expect(document('bravo', 'code/README.md').error).toBe('document does not exist');
        expect(document('bravo', 'code/README.md').html).toBe('');
    });

    it('asks again once the files version moved, and shows what came back', async () => {
        serving({ status: 200, body: { html: '<p>one</p>', frontmatter: null } });
        receive({ channel: 'files', version: 4, payload: { root: '/hub' } });
        document('charlie', 'README.md');
        await settle();
        expect(asked).toHaveLength(1);

        serving({ status: 200, body: { html: '<p>two</p>', frontmatter: null } });
        receive({ channel: 'files', version: 5, payload: { root: '/hub' } });
        document('charlie', 'README.md');
        await settle();
        expect(asked).toHaveLength(1);
        expect(document('charlie', 'README.md').html).toBe('<p>two</p>');
    });

    it('forgets one project on demand and nothing of any other', async () => {
        serving({ status: 200, body: { html: '<p>held</p>', frontmatter: null } });
        document('delta', 'README.md');
        document('echo', 'README.md');
        await settle();
        expect(document('delta', 'README.md').html).toBe('<p>held</p>');

        invalidate('delta');
        expect(document('delta', 'README.md').loading).toBe(true);
        expect(document('echo', 'README.md').html).toBe('<p>held</p>');
    });

    it('asks nothing for an empty id or an empty name', async () => {
        serving({ status: 200, body: { html: '', frontmatter: null } });
        expect(document('', 'README.md').loading).toBe(false);
        expect(document('foxtrot', '').loading).toBe(false);
        await settle();
        expect(asked).toEqual([]);
    });
});

describe('the documents that belong to no project', () => {
    it('asks for one hub document by its path and holds the answer', async () => {
        serving({ status: 200, body: { html: '<h1>Approach</h1>', frontmatter: null } });
        receive({ channel: 'files', version: 1, payload: { root: '/hub' } });

        expect(hubDocument('RESEARCH-APPROACH.md').loading).toBe(true);
        await settle();

        expect(hubDocument('RESEARCH-APPROACH.md').html).toBe('<h1>Approach</h1>');
        expect(asked).toEqual(['/api/docs?hub=RESEARCH-APPROACH.md']);
    });

    it("keeps a hub document apart from a project whose id is hub, and survives that project's invalidation", async () => {
        serving({ status: 200, body: { html: '<p>held</p>', frontmatter: null } });
        document('hub', 'README.md');
        hubDocument('README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=hub&name=README.md', '/api/docs?hub=README.md']);

        invalidate('hub');
        expect(document('hub', 'README.md').loading).toBe(true);
        expect(hubDocument('README.md').html).toBe('<p>held</p>');
    });

    it('escapes a path with a separator in it, and asks once for it', async () => {
        serving({ status: 200, body: { html: '<h1>Notes</h1>', frontmatter: null } });
        hubDocument('notes/one.md');
        await settle();
        hubDocument('notes/one.md');
        await settle();

        expect(asked).toEqual(['/api/docs?hub=notes%2Fone.md']);
    });

    it('asks nothing for an empty path', () => {
        serving({ status: 200, body: { html: '', frontmatter: null } });
        expect(hubDocument('').loading).toBe(false);
        expect(asked).toEqual([]);
    });

    it('asks for the manual without a path, and holds it apart from the hub documents', async () => {
        serving({ status: 200, body: { html: '<h1>Oculus</h1>', frontmatter: null } });
        expect(manual().loading).toBe(true);
        await settle();

        expect(manual().html).toBe('<h1>Oculus</h1>');
        expect(asked).toEqual(['/api/docs?manual=1']);
    });

    it('says what a refused read failed with', async () => {
        serving({ status: 404, body: { error: 'document does not exist' } });
        hubDocument('nothing.md');
        await settle();

        const held = hubDocument('nothing.md');
        expect(held.error).toBe('document does not exist');
        expect(held.loading).toBe(false);
    });
});
