// Layer 4, test. The file browser store over its endpoints: bounded reads, rounds, retries, notes
// and the guards that stop stale answers and duplicate requests.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENGINE_ROOT, TEXT_LIMIT } from '../../../src/lib/state/sources/fs.ts';
import { FS_PATH, NOTE_GONE } from '../../../src/lib/state/sources/fs.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';

// A case that opens a tab reads the view's own label out of the catalog, as the page does.
setCatalog(textCatalog(loadConfig(engineDir()).config));

// What the store does with what it is answered: the byte limit, the rounds, and the two guards.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoints themselves, which are tests/routes/files/fs.test.ts, and the tree drawing
// any of this, which is tests/views/sources/files/files.test.ts.
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

    // revert: src/lib/state/sources/fs-transport.ts:154 => return key;
    it('asks for a folder once per pair of toggles, each on its own query, and holds the answers apart', async () => {
        serving((url) => listingOf(url.includes('hidden=1') ? ['.env', 'a.txt'] : ['a.txt']));
        const hidden = { hidden: true, ignored: false };

        client.fs.listing('hub', '');
        client.fs.listing('hub', '', hidden);
        await settle();

        expect(asked).toEqual(['/api/fs?root=hub&path=', '/api/fs?root=hub&path=&hidden=1']);
        expect(client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
        expect(client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual([
            '.env',
            'a.txt'
        ]);
        expect(client.fs.heldEntries('hub', '', { hidden: false, ignored: true })).toBeNull();
    });

    // revert: src/lib/state/sources/fs.svelte.ts:403 => return found ?? NO_LISTING;
    it("draws another pair's answer for a folder while its own is on its way", async () => {
        serving(() => listingOf(['a.txt']));
        client.fs.listing('hub', '');
        await settle();

        const late = deferred();
        serving(() => late.promise);
        const ignored = { hidden: false, ignored: true };
        const during = client.fs.listing('hub', '', ignored);
        expect(during.entries.map((entry) => entry.name)).toEqual(['a.txt']);
        await settle();
        late.land(listingOf(['a.txt', 'build']));
        await settle();
        expect(client.fs.entries('hub', '', ignored).map((entry) => entry.name)).toEqual([
            'a.txt',
            'build'
        ]);
    });

    // revert: src/lib/state/sources/fs.svelte.ts:418 => delete
    it('asks again for every folder held under one pair when it is relisted, and for no other pair', async () => {
        serving(() => listingOf(['a.txt']));
        const hidden = { hidden: true, ignored: false };
        client.fs.listing('hub', '');
        client.fs.listing('hub', 'code', hidden);
        client.fs.listing('hub', '', hidden);
        await settle();

        serving(() => listingOf(['b.txt']));
        client.fs.relist(hidden);
        client.fs.listing('hub', '');
        client.fs.listing('hub', 'code', hidden);
        client.fs.listing('hub', '', hidden);
        await settle();

        expect(asked).toEqual([
            '/api/fs?root=hub&path=code&hidden=1',
            '/api/fs?root=hub&path=&hidden=1'
        ]);
        expect(client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual(['b.txt']);
        expect(client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
    });

    it('audits that a relist while a read of that pair is in flight sends no second request and holds the answer', async () => {
        const late = deferred();
        serving(() => late.promise);
        const hidden = { hidden: true, ignored: false };
        client.fs.listing('hub', '', hidden);
        await settle();

        client.fs.relist(hidden);
        client.fs.listing('hub', '', hidden);
        await settle();
        expect(asked).toEqual(['/api/fs?root=hub&path=&hidden=1']);

        late.land(listingOf(['.env']));
        await settle();
        expect(client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual(['.env']);
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
        // Every character is two bytes, so a window of the limit's bytes holds half as many of
        // them.
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

    it('asks again for one root alone when a version says that root changed', async () => {
        let body = 'before\n';
        serving((url) =>
            url.startsWith('/api/fs')
                ? listingOf(['layout.yml'])
                : new Response(body, { status: 200 })
        );

        client.fs.listing(ENGINE_ROOT, '');
        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        client.fs.fileText('hub', 'README.md');
        await settle();
        expect(client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('before\n');
        const before = asked.length;

        // The watcher's push moves the config channel's version; the Config view hands it on.
        body = 'after\n';
        client.fs.refresh(ENGINE_ROOT, 7);
        client.fs.listing(ENGINE_ROOT, '');
        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        client.fs.fileText('hub', 'README.md');
        await settle();

        expect(client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('after\n');
        expect(asked.slice(before)).toEqual([
            '/api/fs?root=engine&path=',
            '/api/file/engine/layout.yml'
        ]);
    });

    it('asks for nothing again at a version it has already refreshed at', async () => {
        serving(() => new Response('one\n', { status: 200 }));

        client.fs.refresh(ENGINE_ROOT, 4);
        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();
        const before = asked.length;

        client.fs.refresh(ENGINE_ROOT, 4);
        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();

        expect(asked.length).toBe(before);
    });

    it('keeps the held text drawn until the fresh one lands', async () => {
        const late = deferred();
        let first = true;
        serving(() => {
            if (!first) return late.promise;
            first = false;
            return new Response('before\n', { status: 200 });
        });

        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();
        client.fs.refresh(ENGINE_ROOT, 2);
        client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();

        expect(client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('before\n');
        late.land(new Response('after\n', { status: 200 }));
        await settle();
        expect(client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('after\n');
    });

    /** What the endpoint answers a read it refuses, which is what a failure sentence says. */
    function refusedRead(error: string): Response {
        return new Response(JSON.stringify({ error }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
        });
    }

    /** How many times the bookmarks were asked for since the stub was last served. */
    function bookmarkReads(): number {
        return asked.filter((url) => url.includes('bookmarks=1')).length;
    }

    /** One JSON answer, which is what every read but a file's bytes comes back as. */
    function answering(body: unknown): Response {
        return new Response(JSON.stringify(body), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    }

    it("asks once a round for the reader's own bookmarks and holds what came back", async () => {
        serving(() =>
            answering({
                entries: [
                    {
                        id: 'manual',
                        title: 'manual',
                        fields: { label: 'manual' },
                        file: '',
                        index: 0
                    }
                ],
                schema: [{ field: 'label', type: 'text' }]
            })
        );

        expect(client.fs.bookmarks().loading).toBe(true);
        await settle();

        const held = client.fs.bookmarks();
        expect(held.entries.map((one) => one.id)).toEqual(['manual']);
        expect(held.schema.map((one) => one.field)).toEqual(['label']);
        expect(held.loading).toBe(false);
        expect(asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(1);

        // A second read of the same round reads what is held rather than asking again.
        client.fs.bookmarks();
        await settle();
        expect(asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(1);
    });

    it('asks again for the bookmarks once a write has moved the round on', async () => {
        serving(() => answering({ entries: [], schema: [] }));
        client.fs.bookmarks();
        await settle();

        client.fs.invalidate();
        client.fs.bookmarks();
        await settle();

        expect(asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(2);
    });

    // Revert: in loadBookmarks of state/sources/fs.svelte.ts, sweep the forms on the branch that
    // answers a read the server refused, by putting the call back on the line above its return.
    // revert: src/lib/state/sources/fs.svelte.ts:651 => closeGoneForms(held.bookmarks); return;
    it('closes no bookmark form over a read the server refused, whatever it said', async () => {
        client.layout.loadLayout(fakeStorage());
        const own = client.layout.openView('files');
        client.ui.setInstanceState(own, { form: 'bookmark', editing: 'manual' });
        // A refusal with nothing to say: the sweep would read it as a file holding no bookmark.
        serving(
            () =>
                new Response(JSON.stringify({ error: '' }), {
                    status: 500,
                    headers: { 'content-type': 'application/json' }
                })
        );

        client.fs.bookmarks();
        await settle();

        expect(client.ui.instanceState(own)).toMatchObject({
            form: 'bookmark',
            editing: 'manual'
        });
    });

    // Revert: in loadBookmarks of state/sources/fs.svelte.ts, let the catch branch fall through to
    // the tail sweep by taking out its return.
    // revert: src/lib/state/sources/fs.svelte.ts:664 => delete
    it('closes no bookmark form over a read that never answered at all', async () => {
        client.layout.loadLayout(fakeStorage());
        const own = client.layout.openView('files');
        client.ui.setInstanceState(own, { form: 'bookmark', editing: 'manual' });
        // A throw with nothing to say: the reason reads empty, as a refusal with no text does.
        serving(() => {
            throw new Error('');
        });

        client.fs.bookmarks();
        await settle();

        expect(client.ui.instanceState(own)).toMatchObject({
            form: 'bookmark',
            editing: 'manual'
        });
    });

    it('keeps the bookmarks drawn and says why when the server refuses the read', async () => {
        serving(
            () =>
                new Response(JSON.stringify({ error: 'origin' }), {
                    status: 403,
                    headers: { 'content-type': 'application/json' }
                })
        );

        client.fs.bookmarks();
        await settle();

        expect(client.fs.bookmarks()).toMatchObject({
            entries: [],
            error: 'origin',
            loading: false
        });
    });

    // A read that failed and a read that is asked again, for the three answers the view draws a
    // failure sentence for. Each case names the line of state/sources/fs.svelte.ts that turns it
    // red.
    // revert: src/lib/state/sources/fs.svelte.ts:645 => answered(BOOKMARKS, at);
    it('asks the bookmarks again when the reader asks, without a write to move the round', async () => {
        serving(() => refusedRead('origin'));
        client.fs.bookmarks();
        await settle();
        expect(client.fs.bookmarks().error).toBe('origin');
        expect(bookmarkReads()).toBe(1);

        serving(() => answering({ entries: [], schema: [] }));
        client.fs.retryBookmarks();
        client.fs.bookmarks();
        await settle();

        // the record was cleared by the second serving: the read that failed held no round, so
        // the ask the control cleared is made again over the endpoint that now answers
        expect(bookmarkReads()).toBe(1);
        expect(client.fs.bookmarks()).toMatchObject({ error: '', loading: false });
    });

    // revert: src/lib/state/sources/fs.svelte.ts:698 => answered(NOTES, at);
    it('asks the notes again when the reader asks, and the line goes when the read lands', async () => {
        serving(() => refusedRead('origin'));
        client.fs.notes();
        await settle();
        expect(client.fs.notes().error).toBe('origin');

        serving(() => answering({ notes: [{ id: 'n1', title: 'a title', modified: 5 }] }));
        client.fs.retryNotes();
        client.fs.notes();
        await settle();

        expect(client.fs.notes()).toMatchObject({ error: '', loading: false });
        expect(client.fs.notes().notes.map((one) => one.title)).toEqual(['a title']);
    });

    // revert: src/lib/state/sources/fs.svelte.ts:504 => answered(WORKSPACES, at);
    it('asks the workspaces again when the reader asks, and the line goes when the read lands', async () => {
        serving(() => refusedRead('origin'));
        client.fs.workspaces();
        await settle();
        expect(client.fs.workspaces().error).toBe('origin');

        serving(() =>
            answering({ current: '', workspaces: [{ name: '', roots: [] }], dropped: [] })
        );
        client.fs.retryWorkspaces();
        client.fs.workspaces();
        await settle();

        expect(client.fs.workspaces()).toMatchObject({ error: '', loading: false });
        expect(client.fs.workspaces().workspaces.map((one) => one.name)).toEqual(['']);
    });

    // revert: src/lib/state/sources/fs.svelte.ts:337 => delete
    it('asks once for the round a read failed in, however many times the view draws it', async () => {
        serving(() => refusedRead('origin'));
        client.fs.bookmarks();
        await settle();

        client.fs.bookmarks();
        client.fs.bookmarks();
        await settle();

        // a page whose endpoint is down asks once a round and not once a render
        expect(bookmarkReads()).toBe(1);
    });

    // revert: src/lib/state/sources/fs.svelte.ts:373 => return clock.round;
    it('asks the bookmarks again when the watcher says the file changed, and for no other write', async () => {
        serving(() => answering({ entries: [], schema: [] }));
        client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(1);

        // a write under a watched root says nothing about the reader's own bookmarks file
        client.entities.receive({ channel: 'files', version: 1, payload: { root: '/hub' } });
        client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(1);

        client.entities.receive({
            channel: 'files',
            version: 2,
            payload: { root: '', bookmarks: true }
        });
        client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(2);

        // the message after it names a root, which must not take the bookmarks round back
        client.entities.receive({ channel: 'files', version: 3, payload: { root: '/hub' } });
        client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(2);
    });

    it('holds the notes and one note, each asked for once a round', async () => {
        serving((url) =>
            url.includes('notes=1')
                ? answering({ notes: [{ id: 'n1', title: 'a title', modified: 5 }] })
                : answering({ id: 'n1', title: 'a title', body: 'the body', modified: 5 })
        );

        client.fs.notes();
        client.fs.note('n1');
        await settle();

        expect(client.fs.notes().notes.map((one) => one.title)).toEqual(['a title']);
        expect(client.fs.note('n1')).toMatchObject({ title: 'a title', body: 'the body' });
        expect(asked.filter((url) => url.includes('note=n1'))).toHaveLength(1);
    });

    it('asks for no note at all when the instance names none', () => {
        serving(() => answering({}));

        expect(client.fs.note('')).toMatchObject({ id: '', loading: false });
        expect(asked).toEqual([]);
    });

    it('sends nothing when a note this page deleted is saved again', async () => {
        serving(() => answering({ ok: true, changed: ['note'], refused: [] }));
        await client.fs.deleteNote('n1');
        const sent = asked.length;

        const answer = await client.fs.saveNote('n1', 'back again', 'body');

        expect(answer.ok).toBe(false);
        expect(answer.error).toBe(NOTE_GONE);
        expect(client.fs.noteDeleted('n1')).toBe(true);
        expect(asked.length).toBe(sent);
    });

    it('asks for a deleted note no more, whatever moves the round on', async () => {
        serving(() => answering({ ok: true, changed: ['note'], refused: [] }));
        await client.fs.deleteNote('n1');
        asked.length = 0;

        client.fs.note('n1');
        client.fs.invalidate();
        client.fs.note('n1');
        await settle();

        expect(asked.filter((url) => url.includes('note=n1'))).toEqual([]);
    });

    it('holds what a save just wrote, before the re-read of the note lands', async () => {
        serving((url) =>
            url.includes('note=n1')
                ? answering({ id: 'n1', title: 'old', body: 'old body', modified: 5 })
                : answering({ ok: true, changed: ['note'], refused: [] })
        );
        client.fs.note('n1');
        await settle();
        expect(client.fs.note('n1').body).toBe('old body');

        await client.fs.saveNote('n1', 'new', 'new body');

        expect(client.fs.note('n1')).toMatchObject({ title: 'new', body: 'new body' });
    });

    it('asks the notes again after a note write, and every other held answer not at all', async () => {
        // The POST of the write goes to the same address the workspaces are read from, so this
        // case records the method as well and counts the reads alone.
        const reads: string[] = [];
        vi.stubGlobal('fetch', (url: string, init?: { method?: string }) => {
            if (init?.method !== 'POST') reads.push(url);
            if (url.startsWith('/api/file/')) return Promise.resolve(new Response('one line\n'));
            return Promise.resolve(
                answering({ ok: true, changed: ['note'], refused: [], notes: [], entries: [] })
            );
        });
        const held = (): void => {
            client.fs.listing('hub', '');
            client.fs.fileText('hub', 'a.txt');
            client.fs.workspaces();
            client.fs.bookmarks();
            client.fs.notes();
        };
        held();
        await settle();
        reads.length = 0;

        await client.fs.saveNote('n1', 'a title', 'body');
        held();
        await settle();

        expect(reads.filter((url) => url.includes('notes=1'))).toHaveLength(1);
        expect(reads.filter((url) => url.includes('root=hub'))).toEqual([]);
        expect(reads.filter((url) => url.startsWith('/api/file/'))).toEqual([]);
        expect(reads.filter((url) => url.includes('bookmarks=1'))).toEqual([]);
        expect(reads.filter((url) => url === FS_PATH)).toEqual([]);
    });
    // What a file opens as, through the one caller the file browser and the file view both use.
    describe('what a file opens as', () => {
        /** A response of one file's bytes, which is all a kind read asks for. */
        function bytesOf(body: Uint8Array): Response {
            return new Response(body.buffer as ArrayBuffer, { status: 200 });
        }

        it('reads the head once a round and answers the asks after it from what it holds', async () => {
            serving(() => bytesOf(new TextEncoder().encode('print("one")\n')));

            const first = client.fs.readFileKind('hub', 'code/run.py');
            const second = client.fs.readFileKind('hub', 'code/run.py');
            expect(await first).toEqual({ kind: 'text', language: 'python' });
            expect(await second).toEqual({ kind: 'text', language: 'python' });
            // The three asks a double click makes, and the file view's own, share one request.
            expect(await client.fs.readFileKind('hub', 'code/run.py')).toEqual({
                kind: 'text',
                language: 'python'
            });
            expect(asked).toEqual(['/api/file/hub/code/run.py']);
            expect(client.fs.heldFileKind('hub', 'code/run.py')).toEqual({
                kind: 'text',
                language: 'python'
            });
        });

        it('holds a head the read failed on as the download, so the view stops reading', async () => {
            serving(() => {
                throw new Error('stream broke');
            });
            const kind = { kind: 'other', language: 'plaintext' };
            expect(await client.fs.readFileKind('hub', 'code/broken.dat')).toEqual(kind);
            expect(client.fs.heldFileKind('hub', 'code/broken.dat')).toEqual(kind);
            expect(asked).toEqual(['/api/file/hub/code/broken.dat']);
        });

        it('asks again after a write has moved the round on', async () => {
            serving(() => bytesOf(new TextEncoder().encode('one\n')));
            await client.fs.readFileKind('hub', 'notes.txt');
            expect(asked).toHaveLength(1);

            client.fs.invalidate();
            expect(client.fs.heldFileKind('hub', 'notes.txt')).toBeNull();
            await client.fs.readFileKind('hub', 'notes.txt');
            expect(asked).toHaveLength(2);
        });

        it('answers a name the browser draws itself without asking at all', async () => {
            serving(() => bytesOf(new Uint8Array(0)));

            expect(await client.fs.readFileKind('hub', 'docs/plot.png')).toEqual({
                kind: 'image',
                language: 'plaintext'
            });
            expect(client.fs.heldFileKind('hub', 'paper.pdf')).toEqual({
                kind: 'pdf',
                language: 'plaintext'
            });
            expect(asked).toEqual([]);
        });

        it('reads a file whose character straddles the end of the window as text', async () => {
            // The window is 8192 bytes and the read is one more, so the two bytes of the accented
            // letter fall on either side of it: the cut is the window's and not the file's.
            const body = new TextEncoder().encode(
                'a'.repeat(8191) + '\u00e9' + 'more text after it\n'
            );
            serving(() => bytesOf(body));

            expect(await client.fs.readFileKind('hub', 'long.csv')).toEqual({
                kind: 'text',
                language: 'plaintext'
            });
        });

        it('reads a file whose bytes are not text as a download, whatever its name says', async () => {
            serving(() =>
                bytesOf(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02, 0x03]))
            );

            expect(await client.fs.readFileKind('hub', 'data.txt')).toEqual({
                kind: 'other',
                language: 'plaintext'
            });
        });

        it('answers a download for a file the route refused, and holds it for the round', async () => {
            serving(() => new Response('no', { status: 403 }));

            expect(await client.fs.readFileKind('hub', 'secret.txt')).toEqual({
                kind: 'other',
                language: 'plaintext'
            });
            expect(client.fs.heldFileKind('hub', 'secret.txt')).toEqual({
                kind: 'other',
                language: 'plaintext'
            });
        });
    });
});
