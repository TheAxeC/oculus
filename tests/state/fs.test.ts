// The pure half of the file browser: what a name says a file is, and the rows the tree draws.
//
// What this does NOT cover: state/fs.svelte.ts's fetching, which is a store over three endpoints and
// is exercised through the views and the browser layer; and the highlighter's own output, which is
// the dependency's.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    childPath,
    expandedOf,
    extensionOf,
    languages,
    nameOf,
    toggleExpanded,
    treeKey,
    treeRows,
    typeOfFile,
    TEXT_LIMIT,
    type FsEntry,
    type FsRoot
} from '../../src/lib/state/fs.ts';
import { fileBytesUrl, listingUrl } from '../../src/lib/state/fs.svelte.ts';
import { registered } from '../../src/lib/views/file/languages.ts';
import { createClientState, type ClientState } from '../client.ts';

/** One file entry, since only the name and the kind matter to these cases. */
function file(name: string, size = 10): FsEntry {
    return { name, kind: 'file', size, mtime: 1 };
}

function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

function root(key: string, fixed = true): FsRoot {
    return { key, dir: `/tmp/${key}`, fixed };
}

describe('what a name says a file is', () => {
    it('sends an HTML file to the document view and a PDF and an image to their own', () => {
        expect(typeOfFile('manual.html').kind).toBe('html');
        expect(typeOfFile('read me.HTM').kind).toBe('html');
        expect(typeOfFile('paper.pdf').kind).toBe('pdf');
        for (const name of ['a.png', 'a.jpg', 'a.jpeg', 'a.gif', 'a.svg', 'a.webp']) {
            expect(typeOfFile(name).kind).toBe('image');
        }
    });

    it('names the language of a code file and plain text for the rest of the text ones', () => {
        expect(typeOfFile('run.ts')).toEqual({ kind: 'text', language: 'typescript' });
        expect(typeOfFile('run.py')).toEqual({ kind: 'text', language: 'python' });
        expect(typeOfFile('config/sources.yml')).toEqual({ kind: 'text', language: 'yaml' });
        expect(typeOfFile('main.tex')).toEqual({ kind: 'text', language: 'latex' });
        expect(typeOfFile('job.slurm')).toEqual({ kind: 'text', language: 'bash' });
        expect(typeOfFile('View.svelte')).toEqual({ kind: 'text', language: 'xml' });
        expect(typeOfFile('notes.txt')).toEqual({ kind: 'text', language: 'plaintext' });
    });

    it('leaves anything else as a name, a size and a link', () => {
        expect(typeOfFile('archive.tar.gz').kind).toBe('other');
        expect(typeOfFile('Makefile').kind).toBe('other');
        expect(typeOfFile('data.npz').kind).toBe('other');
    });

    it('names only languages the code window has registered', () => {
        expect(languages().filter((one) => !registered().includes(one))).toEqual([]);
    });

    it('reads an extension and a name off a path', () => {
        expect(extensionOf('a/b/run.PY')).toBe('.py');
        expect(extensionOf('a/b/Makefile')).toBe('');
        expect(extensionOf('.gitignore')).toBe('');
        expect(nameOf('a/b/run.py')).toBe('run.py');
        expect(nameOf('run.py')).toBe('run.py');
        expect(childPath('', 'a')).toBe('a');
        expect(childPath('a/b', 'c')).toBe('a/b/c');
    });

    it('holds the window limit at two megabytes', () => {
        expect(TEXT_LIMIT).toBe(2 * 1024 * 1024);
    });
});

describe('the addresses the store reads', () => {
    it('escapes each segment on its own, so a separator stays a separator', () => {
        expect(fileBytesUrl('game engine', 'docs/a b/read#me.md')).toBe(
            '/api/file/game%20engine/docs/a%20b/read%23me.md'
        );
        expect(fileBytesUrl('hub', 'a/100%25.txt')).toBe('/api/file/hub/a/100%2525.txt');
    });

    it('escapes the root and the path of a listing', () => {
        expect(listingUrl('game engine', 'a b/c#d')).toBe(
            '/api/fs?root=game%20engine&path=a%20b%2Fc%23d'
        );
        expect(listingUrl('hub', '100%')).toBe('/api/fs?root=hub&path=100%25');
    });
});

describe('the open folders an instance remembers', () => {
    it('reads the set out of the instance state, and nothing out of anything else', () => {
        expect(expandedOf({ expanded: ['hub:', 'hub:code', 7] })).toEqual(['hub:', 'hub:code']);
        expect(expandedOf({ expanded: 'hub:' })).toEqual([]);
        expect(expandedOf(null)).toEqual([]);
        expect(expandedOf(['hub:'])).toEqual([]);
    });

    it('opens a closed folder and closes an open one', () => {
        expect(toggleExpanded([], 'hub:')).toEqual(['hub:']);
        expect(toggleExpanded(['hub:', 'hub:code'], 'hub:')).toEqual(['hub:code']);
        expect(treeKey('hub', 'code/run.py')).toBe('hub:code/run.py');
    });
});

describe('the rows of the tree', () => {
    const listings: Record<string, FsEntry[]> = {
        'hub:': [dir('code'), file('README.md')],
        'hub:code': [file('run.py')],
        'notes:': [file('a.md')]
    };
    const entriesOf = (key: string, path: string): FsEntry[] => listings[treeKey(key, path)] ?? [];

    it('draws one line per root and nothing under a root that is closed', () => {
        const rows = treeRows([root('hub'), root('notes', false)], entriesOf, []);

        expect(rows.map((row) => `${row.root}:${row.path}`)).toEqual(['hub:', 'notes:']);
        expect(rows.every((row) => row.kind === 'dir' && row.depth === 0 && !row.open)).toBe(true);
    });

    it('draws the entries of an open root one level in, folders before files', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:']);

        expect(rows.map((row) => `${row.depth}:${row.name}`)).toEqual([
            '0:hub',
            '1:code',
            '1:README.md'
        ]);
        expect(rows[1].open).toBe(false);
    });

    it('draws the entries of an open folder one level further in', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:', 'hub:code']);

        expect(rows.map((row) => `${row.depth}:${row.path}`)).toEqual([
            '0:',
            '1:code',
            '2:code/run.py',
            '1:README.md'
        ]);
        expect(rows[1].open).toBe(true);
    });

    it('draws a folder that is open but whose listing has not landed as its own line alone', () => {
        const rows = treeRows([root('hub')], () => [], ['hub:']);

        expect(rows).toHaveLength(1);
        expect(rows[0].open).toBe(true);
    });

    it('carries a file its size, and a folder none', () => {
        const rows = treeRows([root('hub')], entriesOf, ['hub:']);

        expect(rows.map((row) => row.size)).toEqual([0, 0, 10]);
    });
});

// What the store does with what it is answered: the byte limit, the rounds, and the two guards.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoints themselves, which are tests/routes/fs.test.ts, and the tree drawing any of
// this, which is tests/views/files.test.ts.
describe('the store reading the endpoints', () => {
    let client: ClientState;

    /** The addresses the stub was asked for, in order. */
    let asked: string[] = [];

    /** Let the scheduled request run and its answer land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    /** A promise a case resolves by hand, so one answer can be made to land late. */
    function deferred(): { promise: Promise<Response>; land: (answer: Response) => void } {
        let settle: (answer: Response) => void = () => undefined;
        const promise = new Promise<Response>((done) => {
            settle = done;
        });
        return {
            promise,
            land: (answer: Response) => {
                settle(answer);
            }
        };
    }

    /** A page's fetch: the stub records the address and answers what `answer` gives back. */
    function serving(answer: (url: string) => Response | Promise<Response>): void {
        asked = [];
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return Promise.resolve(answer(url));
        });
    }

    function listingOf(names: string[]): Response {
        const entries = names.map((name) => ({ name, kind: 'file', size: 1, mtime: 1 }));
        return new Response(JSON.stringify({ entries }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    }

    beforeEach(() => {
        // The store asks for nothing where there is no page; a case that wants a request has one.
        vi.stubGlobal('window', {});
        client = createClientState();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('asks for nothing at all when there is no page to ask from', async () => {
        vi.unstubAllGlobals();
        serving(() => listingOf(['a.txt']));
        const fresh = createClientState();

        expect(fresh.fs.listing('hub', '').loading).toBe(true);
        expect(fresh.fs.workspaces().loading).toBe(true);
        await settle();

        expect(asked).toEqual([]);
        expect(fresh.fs.listing('hub', '').error).toBe('');
    });

    it('holds the first answer for a folder and asks once', async () => {
        serving(() => listingOf(['a.txt']));

        expect(client.fs.listing('hub', '').loading).toBe(true);
        await settle();

        expect(client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
        client.fs.entries('hub', '');
        await settle();
        expect(asked).toEqual(['/api/fs?root=hub&path=']);
    });

    it('holds what a refused read said, rather than an empty folder', async () => {
        serving(
            () =>
                new Response(JSON.stringify({ error: 'outside' }), {
                    status: 404,
                    headers: { 'content-type': 'application/json' }
                })
        );

        client.fs.listing('hub', 'gone');
        await settle();

        const held = client.fs.listing('hub', 'gone');
        expect(held.error).toBe('outside');
        expect(held.loading).toBe(false);
        expect(held.entries).toEqual([]);
    });

    it('holds what a refused workspaces read said', async () => {
        serving(
            () =>
                new Response(JSON.stringify({ error: 'origin' }), {
                    status: 403,
                    headers: { 'content-type': 'application/json' }
                })
        );

        client.fs.workspaces();
        await settle();

        expect(client.fs.workspaces().error).toBe('origin');
        expect(client.fs.workspaces().loading).toBe(false);
    });

    it('keeps the roots it holds drawn while the answer after a write is fetched', async () => {
        serving((url) =>
            url === '/api/fs'
                ? new Response(
                      JSON.stringify({
                          current: '',
                          workspaces: [
                              { name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }
                          ],
                          dropped: []
                      }),
                      { status: 200, headers: { 'content-type': 'application/json' } }
                  )
                : listingOf(['a.txt'])
        );
        client.fs.workspaces();
        await settle();
        expect(client.fs.workspaces().workspaces[0].roots).toHaveLength(1);

        client.fs.invalidate();

        // Read straight after the write: the roots held before it are still what the tree draws.
        const during = client.fs.workspaces();
        expect(during.workspaces[0].roots).toHaveLength(1);
        expect(during.loading).toBe(false);
        await settle();
        expect(client.fs.workspaces().workspaces[0].roots).toHaveLength(1);
    });

    it('drops an answer that lands after the round it was asked in has passed', async () => {
        const late = deferred();
        serving(() => late.promise);
        client.fs.listing('hub', '');
        await settle();

        client.fs.invalidate();
        serving(() => listingOf(['fresh.txt']));
        // The next render asks again, in the new round; the first request is still in flight.
        client.fs.listing('hub', '');
        await settle();
        late.land(listingOf(['stale.txt']));
        await settle();

        expect(client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['fresh.txt']);
    });

    it('reads a file again after a write, rather than holding the text it had', async () => {
        let body = 'first';
        serving(() => new Response(body, { status: 200 }));

        client.fs.fileText('hub', 'a.txt');
        await settle();
        expect(client.fs.fileText('hub', 'a.txt').text).toBe('first');

        body = 'second';
        client.fs.invalidate();
        client.fs.fileText('hub', 'a.txt');
        await settle();
        expect(client.fs.fileText('hub', 'a.txt').text).toBe('second');
    });

    it('cuts a file at two megabytes of bytes and stops the transfer there', async () => {
        const chunk = new Uint8Array(64 * 1024).fill(0x61);
        let sent = 0;
        let cancelled = false;
        serving(
            () =>
                new Response(
                    new ReadableStream<Uint8Array>({
                        pull(controller) {
                            // Twice the window's limit, so the cut is what ends the read.
                            if (sent >= 64) {
                                controller.close();
                                return;
                            }
                            sent += 1;
                            controller.enqueue(chunk);
                        },
                        cancel() {
                            cancelled = true;
                        }
                    }),
                    { status: 200 }
                )
        );

        client.fs.fileText('hub', 'big.txt');
        await settle();

        const held = client.fs.fileText('hub', 'big.txt');
        expect(held.text.length).toBe(TEXT_LIMIT);
        expect(held.truncated).toBe(true);
        expect(cancelled).toBe(true);
        // The transfer stopped at the limit rather than reading the whole four megabytes.
        expect(sent * chunk.byteLength).toBeLessThan(64 * chunk.byteLength);
    });

    it('counts the limit in bytes, so a two-byte character fills it twice as fast', async () => {
        // Every character is two bytes, so a window of the limit's bytes holds half as many of them.
        const pair = new TextEncoder().encode('\u00e9');
        const chunk = new Uint8Array(64 * 1024);
        for (let at = 0; at < chunk.length; at += 2) chunk.set(pair, at);
        let sent = 0;
        serving(
            () =>
                new Response(
                    new ReadableStream<Uint8Array>({
                        pull(controller) {
                            if (sent >= 64) {
                                controller.close();
                                return;
                            }
                            sent += 1;
                            controller.enqueue(chunk);
                        }
                    }),
                    { status: 200 }
                )
        );

        client.fs.fileText('hub', 'wide.txt');
        await settle();

        const held = client.fs.fileText('hub', 'wide.txt');
        expect(held.truncated).toBe(true);
        expect(held.text.length).toBe(TEXT_LIMIT / 2);
        expect(held.text.startsWith('\u00e9\u00e9')).toBe(true);
    });

    it('holds a file shorter than the limit whole, and says it was not cut', async () => {
        serving(() => new Response('one line\n', { status: 200 }));

        client.fs.fileText('hub', 'a.txt');
        await settle();

        expect(client.fs.fileText('hub', 'a.txt')).toMatchObject({
            text: 'one line\n',
            truncated: false,
            error: ''
        });
    });
});
