// The documents the views read: one request per project and name, per hub path and for the manual,
// what is held between renders, and which `files` messages ask for a document again.
//
// Nothing here touches the network or the real hub: `fetch` is a stub that records the URL and the
// entity tag it was given and answers what the case wants, and a `files` message is handed to the
// client's own entities store, which is where the page's socket hands it. What this does NOT cover:
// the endpoint itself, which is tests/routes/docs/docs.test.ts; the view drawing the HTML, which is
// tests/views/sources/doc.test.ts and tests/views/boards/project.test.ts; and a mounted view
// drawing again when a document is marked, which needs a DOM and is
// tests/browser/workbench/system.spec.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { holds } from '../../../src/lib/state/system/docs.svelte.ts';

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

/** Let the scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
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
        // revert: src/lib/state/system/docs.svelte.ts:170 => request(key, url);
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

    it('holds what the endpoint refused with instead of the document', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:247 => error: '',
        serving({ status: 404, body: { error: 'document does not exist' } });
        document('bravo', 'code/README.md');
        await settle();
        expect(document('bravo', 'code/README.md').error).toBe('document does not exist');
        expect(document('bravo', 'code/README.md').html).toBe('');
    });

    it('asks again after a write under the root holding it, and shows what came back', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:195 => delete
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
        // revert: src/lib/state/system/docs.svelte.ts:183 => return true;
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
        // revert: src/lib/state/system/docs.svelte.ts:149 => delete
        serving({ status: 200, body: { html: '', frontmatter: null } });
        expect(document('', 'README.md').loading).toBe(false);
        expect(document('foxtrot', '').loading).toBe(false);
        await settle();
        // Neither call names a document, so nothing was asked.
        expect(asked).toEqual([]);
    });
});

describe('the documents that belong to no project', () => {
    it('asks for one hub document by its path and holds the answer', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:171 => return doc ?? NOTHING;
        serving({ status: 200, body: { html: '<h1>Approach</h1>', frontmatter: null } });

        expect(hubDocument('RESEARCH-APPROACH.md').loading).toBe(true);
        await settle();

        expect(hubDocument('RESEARCH-APPROACH.md').html).toBe('<h1>Approach</h1>');
        expect(asked).toEqual(['/api/docs?hub=RESEARCH-APPROACH.md']);
    });

    it('keeps a hub document apart from a project whose id is hub', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:183 => return true;
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
        // revert: src/lib/state/system/docs.svelte.ts:159 => return reading(ownKey(HUB, path), `${DOCS}?hub=${path}`);
        serving({ status: 200, body: { html: '<h1>Notes</h1>', frontmatter: null } });
        hubDocument('notes/one.md');
        await settle();
        hubDocument('notes/one.md');
        await settle();

        expect(asked).toEqual(['/api/docs?hub=notes%2Fone.md']);
    });

    it('asks nothing for an empty path', () => {
        // revert: src/lib/state/system/docs.svelte.ts:158 => delete
        serving({ status: 200, body: { html: '', frontmatter: null } });
        expect(hubDocument('').loading).toBe(false);
        // An empty path names no document, so nothing was asked.
        expect(asked).toEqual([]);
    });

    it('asks for the manual without a path, and holds it apart from the hub documents', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:164 => return reading(ownKey(MANUAL, MANUAL), `${DOCS}?${MANUAL}`);
        serving({ status: 200, body: { html: '<h1>Oculus</h1>', frontmatter: null } });
        expect(manual().loading).toBe(true);
        await settle();

        expect(manual().html).toBe('<h1>Oculus</h1>');
        expect(asked).toEqual(['/api/docs?manual=1']);
    });

    it('says what a refused read failed with', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:248 => loading: true
        serving({ status: 404, body: { error: 'document does not exist' } });
        hubDocument('nothing.md');
        await settle();

        const held = hubDocument('nothing.md');
        expect(held.error).toBe('document does not exist');
        expect(held.loading).toBe(false);
    });
});

describe('a re-read', () => {
    it('keeps returning what is held while the new answer is in flight', async () => {
        // revert: src/lib/state/system/docs.svelte.ts:171 => return askedAt[key] !== (marks[key] ?? 0) ? PENDING : (doc ?? PENDING);
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
        // revert: src/lib/state/system/docs.svelte.ts:228 => undefined
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
        // revert: src/lib/state/system/docs.svelte.ts:211 => delete
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
        // revert: src/lib/state/system/docs.svelte.ts:180 => if (root === '') return true;
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
        // revert: src/lib/state/system/docs.svelte.ts:183 => return true;
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
        // revert: src/lib/state/system/docs.svelte.ts:189 => const gap = false;
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
        // revert: src/lib/state/system/docs.svelte.ts:273 => delete
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
        // revert: src/lib/state/system/docs.svelte.ts:182 => if (file === undefined || file === '') return false;
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
        // revert: src/lib/state/system/docs.svelte.ts:263 => delete
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
        // revert: src/lib/state/system/docs.svelte.ts:263 => if (before?.error === '' && !before.loading) { askedAt[key] = mark; return; }
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
        // revert: src/lib/state/system/docs.svelte.ts:247 => error: '',
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        serving({ status: 404, body: { error: 'document does not exist', file: APPROACH } });
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').error).toBe('document does not exist');
    });
    it("replaces a drawn document with the status of an answer whose body is not the endpoint's", async () => {
        // revert: src/lib/state/system/docs.svelte.ts:282 => throw error;
        serving({ status: 200, body: { html: '<h1>One</h1>', frontmatter: null, file: APPROACH } });
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();

        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502 }))
        );
        wrote(HUB);
        hubDocument('docs/RESEARCH-APPROACH.md');
        await settle();
        expect(hubDocument('docs/RESEARCH-APPROACH.md').error).toBe('502');
    });
});

describe('whether a root holds a file', () => {
    it('reads a doubled separator and a trailing one as one', () => {
        // revert: src/lib/state/system/docs.svelte.ts:74 => if (part === '.') continue;
        expect(holds('/a//b/', '/a/b/x.md')).toBe(true);
    });

    it('reads a dot segment as the folder it is in', () => {
        // revert: src/lib/state/system/docs.svelte.ts:74 => if (part === '') continue;
        expect(holds('/a/./b', '/a/b/x.md')).toBe(true);
    });

    it('reads a dot-dot segment as the folder above', () => {
        // revert: src/lib/state/system/docs.svelte.ts:75 => if (part === '..') continue;
        expect(holds('/a/c/../b', '/a/b/x.md')).toBe(true);
    });

    it('holds nothing in a folder whose name only begins like its own', () => {
        // revert: src/lib/state/system/docs.svelte.ts:87 => return inner.join('/').startsWith(base.join('/'));
        expect(holds('/a/bc', '/a/b/x.md')).toBe(false);
        expect(holds('/a/b', '/a/bc/x.md')).toBe(false);
        expect(holds('/a/b', '/a/b/x.md')).toBe(true);
    });

    it('reads a backslash as a separator, as a Windows path writes it', () => {
        // revert: src/lib/state/system/docs.svelte.ts:73 => for (const part of path.split('/')) {
        expect(holds('C:\\a\\b', 'C:\\a\\b\\x.md')).toBe(true);
    });

    it('holds every file under the top of the file system', () => {
        // revert: src/lib/state/system/docs.svelte.ts:87 => return base.length > 0 && base.every((part, at) => inner[at] === part);
        expect(holds('/', '/a/x.md')).toBe(true);
    });
});
