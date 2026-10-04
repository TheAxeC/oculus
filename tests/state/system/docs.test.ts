// Layer 2, client-state tests. The documents the views read: one request per project and name, per
// hub path and for the manual, what is held between renders, and which `files` messages ask for a
// document again.
//
// Nothing here touches the network or the real hub: `fetch` is a stub that records the URL and the
// entity tag it was given and answers what the case wants, and a `files` message is handed to the
// client's own entities store, which is where the page's socket hands it. What this does NOT cover:
// the endpoint itself, which is tests/routes/docs/docs.test.ts; the view drawing the HTML, which is
// tests/views/sources/doc.test.ts and tests/views/boards/project.test.ts; and a mounted view
// drawing again when a document is marked, which needs a DOM.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createClientState,
    refused,
    settle,
    unreadable,
    type ClientState
} from '../../fixtures/client.ts';
import { holds } from '../../../src/lib/state/system/docs.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let document: ClientState['docs']['document'];
let hubDocument: ClientState['docs']['hubDocument'];
let manual: ClientState['docs']['manual'];
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ document, hubDocument, manual } = client.docs);
    ({ receive } = client.entities);
});

type Answer = { status: number; body: unknown; tag?: string };

/** The URLs the stub was asked for, in order. */
let asked: string[] = [];

/** The entity tag each request carried, the empty string for none, in the order asked. */
let sent: string[] = [];

/** One answer the stub gives, sent 304 when the request carries the answer's own tag. */
function reply(answer: Answer, tag: string): Response {
    if (answer.tag !== undefined && tag === answer.tag) {
        return new Response(null, { status: 304, headers: { etag: answer.tag } });
    }
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (answer.tag !== undefined) headers.etag = answer.tag;
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers });
}

/** The tag a request carried. */
function tagOf(init: RequestInit | undefined): string {
    const headers = new Headers(init?.headers);
    return headers.get('if-none-match') ?? '';
}

/** Install a fetch that answers every request the same way, and record what it was asked. */
function serving(answer: Answer): void {
    asked = [];
    sent = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        asked.push(url);
        sent.push(tagOf(init));
        return Promise.resolve(reply(answer, tagOf(init)));
    });
}

/**
 * Install a fetch whose answer waits until the case releases it, so a case can look at what the
 * store returns while the request is in flight.
 */
function holding(answer: Answer): () => void {
    asked = [];
    sent = [];
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
        asked.push(url);
        sent.push(tagOf(init));
        await gate;
        return reply(answer, tagOf(init));
    });
    return release;
}

/** The version of the next `files` message a case hands over, one after the last. */
let version = 0;

/** A write under one root, as the git watcher publishes it; the empty root is the bookmarks'. */
function wrote(root: string): void {
    version += 1;
    receive({
        channel: 'files',
        version,
        payload: root === '' ? { root, bookmarks: true } : { root }
    });
}

/** The first message a store hears, which it treats as a gap; every case starts past it. */
beforeEach(() => {
    version = 10;
    receive({ channel: 'files', version, payload: { root: '/start' } });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const HUB = '/hub';

const APPROACH = `${HUB}/docs/RESEARCH-APPROACH.md`;

describe('the documents of a project', () => {
    it('asks the endpoint once for a pair and holds the answer', async () => {
        serving({ status: 200, body: { html: '<h1>Alpha</h1>', frontmatter: { stage: 'run' } } });

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

    it('holds the refusal sentence the endpoint earned instead of the document', async () => {
        serving({ status: 404, body: { error: 'document does not exist' } });
        document('bravo', 'code/README.md');
        await settle();
        expect(document('bravo', 'code/README.md').error).toBe(refused(404));
        expect(document('bravo', 'code/README.md').html).toBe('');
    });

    it('asks again after a write under the root holding it, and shows what came back', async () => {
        const file = `${HUB}/projects/charlie/README.md`;
        serving({ status: 200, body: { html: '<p>one</p>', frontmatter: null, file } });
        document('charlie', 'README.md');
        await settle();
        expect(asked).toHaveLength(1);

        serving({ status: 200, body: { html: '<p>two</p>', frontmatter: null, file } });
        wrote(HUB);
        document('charlie', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=charlie&name=README.md']);
        expect(document('charlie', 'README.md').html).toBe('<p>two</p>');
    });

    it('asks nothing again after a write under a root that does not hold it', async () => {
        const file = `${HUB}/projects/delta/README.md`;
        serving({ status: 200, body: { html: '<p>held</p>', frontmatter: null, file } });
        document('delta', 'README.md');
        await settle();

        serving({ status: 200, body: { html: '<p>other</p>', frontmatter: null, file } });
        wrote('/elsewhere');
        // A root whose name only begins like the hub's is another folder.
        wrote(`${HUB}2`);
        document('delta', 'README.md');
        await settle();
        // Neither root holds the file, so the store has nothing to ask.
        expect(asked).toEqual([]);
        expect(document('delta', 'README.md').html).toBe('<p>held</p>');
    });

    it('asks nothing for an empty id or an empty name', async () => {
        serving({ status: 200, body: { html: '', frontmatter: null } });
        expect(document('', 'README.md').loading).toBe(false);
        expect(document('foxtrot', '').loading).toBe(false);
        await settle();
        // Neither call names a document, so nothing was asked.
        expect(asked).toEqual([]);
    });
});

describe('the requests a read makes', () => {
    // Revert: in reading of state/system/docs.svelte.ts, pass enabled: true to the read.
    it('asks nothing where there is no fetch, reads as pending, and asks once a fetch exists', async () => {
        vi.stubGlobal('fetch', undefined);

        expect(document('lima', 'README.md').loading).toBe(true);
        await settle();
        expect(document('lima', 'README.md')).toMatchObject({ loading: true, html: '', error: '' });

        serving({ status: 200, body: { html: '<p>now</p>', frontmatter: null } });
        document('lima', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=lima&name=README.md']);
        expect(document('lima', 'README.md').html).toBe('<p>now</p>');
    });
});

describe('the documents that belong to no project', () => {
    it('asks for one hub document by its path and holds the answer', async () => {
        serving({ status: 200, body: { html: '<h1>Approach</h1>', frontmatter: null } });

        expect(hubDocument('RESEARCH-APPROACH.md').loading).toBe(true);
        await settle();

        expect(hubDocument('RESEARCH-APPROACH.md').html).toBe('<h1>Approach</h1>');
        expect(asked).toEqual(['/api/docs?hub=RESEARCH-APPROACH.md']);
    });

    it('keeps a hub document apart from a project whose id is hub', async () => {
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            const file = url.includes('project=') ? '/work/hub/README.md' : `${HUB}/README.md`;
            const body = { html: `<p>${url}</p>`, frontmatter: null, file };
            return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
        });
        asked = [];
        document('hub', 'README.md');
        hubDocument('README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=hub&name=README.md', '/api/docs?hub=README.md']);

        asked = [];
        wrote('/work');
        document('hub', 'README.md');
        hubDocument('README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=hub&name=README.md']);
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
        // An empty path names no document, so nothing was asked.
        expect(asked).toEqual([]);
    });

    it('asks for the manual without a path, and holds it apart from the hub documents', async () => {
        serving({ status: 200, body: { html: '<h1>Oculus</h1>', frontmatter: null } });
        expect(manual().loading).toBe(true);
        await settle();

        expect(manual().html).toBe('<h1>Oculus</h1>');
        expect(asked).toEqual(['/api/docs?manual=1']);
    });
});

describe('a re-read', () => {
    it('keeps returning what is held while the new answer is in flight', async () => {
        serving({
            status: 200,
            body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH }
        });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const before = hubDocument('docs/RESEARCH-APPROACH.md');

        const release = holding({
            status: 200,
            body: { html: '<h1>Two</h1>', frontmatter: null, file: APPROACH }
        });
        wrote(HUB);
        const during = hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        // Between the write and the answer the view reads what it drew, never the loading state.
        expect(during).toBe(before);
        expect(hubDocument('docs/RESEARCH-APPROACH.md')).toBe(before);
        expect(hubDocument('docs/RESEARCH-APPROACH.md').loading).toBe(false);

        release();
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').html).toBe('<h1>Two</h1>');
    });

    it('sends the held tag, and keeps the held object itself on a 304', async () => {
        serving({
            status: 200,
            body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH },
            tag: '"12-1000"'
        });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const before = hubDocument('docs/RESEARCH-APPROACH.md');
        expect(sent).toEqual(['']);

        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(sent).toEqual(['', '"12-1000"']);
        expect(hubDocument('docs/RESEARCH-APPROACH.md')).toBe(before);

        // The 304 answered the write, so a later call with no write asks nothing.
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(sent).toEqual(['', '"12-1000"']);
    });

    it('keeps the held object itself when the new answer draws the same document', async () => {
        serving({
            status: 200,
            body: { html: '<h1>One</h1>', frontmatter: { stage: 'run' }, file: APPROACH }
        });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const before = hubDocument('docs/RESEARCH-APPROACH.md');

        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toHaveLength(2);
        expect(hubDocument('docs/RESEARCH-APPROACH.md')).toBe(before);
    });

    it('is asked for by no message with the empty root', async () => {
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        manual();
        await settle();
        asked = [];

        wrote('');
        hubDocument('docs/RESEARCH-APPROACH.md');
        manual();
        await settle();
        // The bookmarks file lies under no root that holds a document, so nothing was asked.
        expect(asked).toEqual([]);
    });

    it('leaves the manual as it is when a write re-reads a hub document', async () => {
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            const file = url.includes('manual') ? '/engine/HELP.md' : APPROACH;
            const body = { html: '<h1>Held</h1>', frontmatter: null, file };
            return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
        });
        asked = [];
        manual();
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const before = manual();

        asked = [];
        wrote(HUB);
        const during = manual();
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        expect(during).toBe(before);
        expect(manual()).toBe(before);
    });

    it('asks for every held document when the versions skip one, whose root is unknown', async () => {
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            const file = url.includes('manual') ? '/engine/HELP.md' : APPROACH;
            const body = { html: '<h1>Held</h1>', frontmatter: null, file };
            return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
        });
        asked = [];
        manual();
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        asked = [];
        version += 1;
        wrote('/elsewhere');
        manual();
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?manual=1', '/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
    });

    it('asks again on its own when a write came while the answer was in flight', async () => {
        const release = holding({
            status: 200,
            body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH }
        });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        // The first answer names no file yet, so any rooted write may concern it.
        wrote(HUB);
        serving({ status: 200, body: { html: '<h1>Two</h1>', frontmatter: null, file: APPROACH } });
        release();
        await settle();
        await settle();

        // No reader called in between: the answer that predates the write asked again itself.
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        expect(hubDocument('docs/RESEARCH-APPROACH.md').html).toBe('<h1>Two</h1>');
    });

    it('asks again for an answer that named no file after any write that names a root', async () => {
        serving({ status: 404, body: { error: 'no project with the id golf' } });
        document('golf', 'README.md');
        await settle();

        serving({ status: 404, body: { error: 'no project with the id golf' } });
        wrote('/anywhere');
        document('golf', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=golf&name=README.md']);
    });
});

describe('a re-read that fails', () => {
    it('keeps a drawn document when the request never reaches the server, and asks again on the next write', async () => {
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const before = hubDocument('docs/RESEARCH-APPROACH.md');

        asked = [];
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return Promise.reject(new TypeError('Failed to fetch'));
        });
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        expect(hubDocument('docs/RESEARCH-APPROACH.md')).toBe(before);

        // The mark the failed request did not consume makes the next call ask again, with no write.
        asked = [];
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);

        serving({ status: 200, body: { html: '<h1>Two</h1>', frontmatter: null, file: APPROACH } });
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        expect(hubDocument('docs/RESEARCH-APPROACH.md').html).toBe('<h1>Two</h1>');
    });

    it('replaces a drawn document with what the endpoint refused, since that is news of the file', async () => {
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        serving({ status: 404, body: { error: 'document does not exist', file: APPROACH } });
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').error).toBe(refused(404));
    });
    // Revert: in unreached of state/system/docs.svelte.ts, fail with an empty file in place of
    // the held one.
    it('keeps the file of an error answer through a network error, so a write elsewhere asks nothing', async () => {
        serving({ status: 500, body: { error: 'broken', file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        asked = [];
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return Promise.reject(new TypeError('Failed to fetch'));
        });
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').error).toBe('Failed to fetch');
        expect(asked).toHaveLength(1);

        asked = [];
        wrote('/other');
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toEqual([]);
    });

    it("replaces a drawn document with the unreadable sentence for an answer whose body is not the endpoint's", async () => {
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502 }))
        );
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').error).toBe(unreadable(502));
    });
});

describe('whether a root holds a file', () => {
    it.each([
        ['a doubled and a trailing separator as one', '/a//b/', '/a/b/x.md', true],
        ['a dot segment as the folder it is in', '/a/./b', '/a/b/x.md', true],
        ['a dot-dot segment as the folder above', '/a/c/../b', '/a/b/x.md', true],
        ['a folder named like the start of its own as another folder', '/a/bc', '/a/b/x.md', false],
        [
            'a file in a folder named like the start of the root as outside it',
            '/a/b',
            '/a/bc/x.md',
            false
        ],
        ['a backslash as a separator', 'C:\\a\\b', 'C:\\a\\b\\x.md', true],
        ['every file as under the top of the file system', '/', '/a/x.md', true]
    ])('reads %s', (_name, root, file, expected) => {
        expect(holds(root, file)).toBe(expected);
    });
});

describe('an answer of the wrong shape', () => {
    /** The document the store holds for a project pair once the stub has answered. */
    async function read(answer: Answer): Promise<ReturnType<typeof document>> {
        serving(answer);
        document('alpha', 'README.md');
        await settle();
        return document('alpha', 'README.md');
    }

    it.each([
        ['an html that is a number', { html: 3 }, ''],
        ['an html', { html: '<p>x</p>' }, '<p>x</p>']
    ])('holds %s', async (_name, body, html) => {
        expect(await read({ status: 200, body })).toStrictEqual({
            html,
            frontmatter: null,
            error: '',
            loading: false,
            parts: []
        });
    });

    it.each([
        ['a list', ['a'], null],
        ['null', null, null],
        ['a map', { stage: 'run', tags: ['a'] }, { stage: 'run', tags: ['a'] }]
    ])('holds frontmatter that is %s', async (_name, frontmatter, expected) => {
        const held = await read({ status: 200, body: { html: 'h', frontmatter } });
        expect(held.frontmatter).toStrictEqual(expected);
    });

    it('holds the keys of a frontmatter map as they came, an own __proto__ key included', async () => {
        const text = '{"html":"h","frontmatter":{"b":1,"__proto__":{"x":1},"a":2}}';
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status: 200 })));
        document('alpha', 'README.md');
        await settle();
        const held = document('alpha', 'README.md').frontmatter;
        expect(Object.keys(held ?? {})).toStrictEqual(['b', '__proto__', 'a']);
    });

    it.each([
        ['a list', []],
        ['a string', 'x']
    ])('holds an empty document for a body that is %s', async (_name, body) => {
        expect(await read({ status: 200, body })).toStrictEqual({
            html: '',
            frontmatter: null,
            error: '',
            loading: false,
            parts: []
        });
    });

    it.each([
        ['an html run', { kind: 'html', html: '<p>x</p>' }, { kind: 'html', html: '<p>x</p>' }],
        ['an empty html run', { kind: 'html', html: '' }, { kind: 'html', html: '' }],
        [
            'an html run with a key more',
            { kind: 'html', html: 'x', extra: 1 },
            { kind: 'html', html: 'x' }
        ],
        [
            'a diagram run',
            { kind: 'diagram', name: 'n', alt: 'a' },
            { kind: 'diagram', name: 'n', alt: 'a' }
        ],
        [
            'a diagram run with a key more',
            { kind: 'diagram', name: 'n', alt: 'a', extra: 1 },
            { kind: 'diagram', name: 'n', alt: 'a' }
        ],
        ['an html run whose html is a number', { kind: 'html', html: 3 }, undefined],
        ['a diagram run without alt', { kind: 'diagram', name: 'n' }, undefined],
        ['a diagram run without a name', { kind: 'diagram', alt: 'a' }, undefined],
        ['an image run', { kind: 'image', name: 'n', alt: 'a' }, undefined],
        ['a run that is null', null, undefined]
    ])('reads the manual run %s', async (_name, run, expected) => {
        const held = await read({ status: 200, body: { html: 'h', parts: [run] } });
        expect(held.parts).toStrictEqual(expected === undefined ? [] : [expected]);
    });

    it('keeps the runs that pass, in order, beside the ones that do not', async () => {
        const parts = [
            { kind: 'html', html: 'one' },
            { kind: 'html', html: 3 },
            { kind: 'diagram', name: 'n', alt: 'a' },
            null,
            { kind: 'html', html: 'two' }
        ];
        const held = await read({ status: 200, body: { html: 'h', parts } });
        expect(held.parts).toStrictEqual([
            { kind: 'html', html: 'one' },
            { kind: 'diagram', name: 'n', alt: 'a' },
            { kind: 'html', html: 'two' }
        ]);
    });

    it.each([
        ['a map', { 0: { kind: 'html', html: 'x' } }],
        ['null', null]
    ])('reads runs that are %s as none', async (_name, parts) => {
        const held = await read({ status: 200, body: { html: 'h', parts } });
        expect(held.parts).toStrictEqual([]);
    });

    it('treats a file that is not a string as no file, which any write under a root asks again', async () => {
        serving({ status: 200, body: { html: 'one', file: 3 } });
        document('alpha', 'README.md');
        await settle();
        asked = [];
        wrote('/anywhere/else');
        document('alpha', 'README.md');
        await settle();
        expect(asked).toStrictEqual(['/api/docs?project=alpha&name=README.md']);
    });

    it.each([
        ['a list', []],
        ['a map without a root', { bookmarks: true }],
        ['a map whose root is a number', { root: 3 }],
        ['a map whose root is empty', { root: '' }]
    ])('asks nothing again for a files message whose payload is %s', async (_name, payload) => {
        serving({ status: 200, body: { html: 'one', file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        document('alpha', 'README.md');
        await settle();
        asked = [];
        version += 1;
        receive({ channel: 'files', version, payload });
        hubDocument('docs/RESEARCH-APPROACH.md');
        document('alpha', 'README.md');
        await settle();
        expect(asked).toStrictEqual([]);
        // The message was heard: the next one is the version after it, so it is no gap.
        serving({ status: 200, body: { html: 'two', file: APPROACH } });
        wrote('/elsewhere');
        document('alpha', 'README.md');
        await settle();
        expect(asked).toStrictEqual([]);
    });
});

describe('an answer that is no JSON map', () => {
    it.each([
        { name: 'JSON null', text: 'null', status: 200 },
        { name: 'a page that is no JSON', text: '<html>Bad Gateway</html>', status: 502 }
    ])(
        'holds the unreadable sentence for $name sent with status $status',
        async ({ text, status }) => {
            vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
            document('alpha', 'README.md');
            await settle();
            expect(document('alpha', 'README.md')).toStrictEqual({
                html: '',
                frontmatter: null,
                error: unreadable(status),
                loading: false,
                parts: []
            });
        }
    );
});

describe('a 200 answer whose body is no JSON map, for a document already drawn', () => {
    it('keeps the drawn document and asks again on the next write for a page that is no JSON', async () => {
        const text = '<html>Proxy</html>';
        serving({ status: 200, body: { html: '<h1>One</h1>', file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status: 200 })));
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        const held = hubDocument('docs/RESEARCH-APPROACH.md');
        expect(held.html).toBe('<h1>One</h1>');
        expect(held.error).toBe('');

        serving({ status: 200, body: { html: '<h1>Two</h1>', file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(asked).toStrictEqual(['/api/docs?hub=docs%2FRESEARCH-APPROACH.md']);
        expect(hubDocument('docs/RESEARCH-APPROACH.md').html).toBe('<h1>Two</h1>');
    });
});
