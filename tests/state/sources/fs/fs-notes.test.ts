// Layer 4, test. The file browser store reading the reader's bookmarks, notes and workspaces: what
// is asked once a round, what a refused or unanswered read leaves drawn, and the reads a watcher or
// a reader asks for again.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoints themselves, which are tests/routes/files/fs.test.ts, and the tree drawing
// any of this, which is tests/views/sources/files/files.test.ts.

import { describe, expect, it, vi } from 'vitest';
import { FS_PATH, NOTE_GONE } from '../../../../src/lib/state/sources/fs.svelte.ts';
import { refused } from '../../../fixtures/client.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { answering, settle, storeHooks } from './fs-fixture.ts';

describe('the store reading bookmarks, notes and workspaces', () => {
    const store = storeHooks();

    /** What the endpoint answers a read it refuses, which is what a failure sentence says. */
    function refusedRead(error: string): Response {
        return new Response(JSON.stringify({ error }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
        });
    }

    /** How many times the bookmarks were asked for since the stub was last served. */
    function bookmarkReads(): number {
        return store.asked.filter((url) => url.includes('bookmarks=1')).length;
    }

    it("asks once a round for the reader's own bookmarks and holds what came back", async () => {
        store.serving(() =>
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

        expect(store.client.fs.bookmarks().loading).toBe(true);
        await settle();

        const held = store.client.fs.bookmarks();
        expect(held.entries.map((one) => one.id)).toEqual(['manual']);
        expect(held.schema.map((one) => one.field)).toEqual(['label']);
        expect(held.loading).toBe(false);
        expect(store.asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(1);

        // A second read of the same round reads what is held rather than asking again.
        store.client.fs.bookmarks();
        await settle();
        expect(store.asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(1);
    });

    it('asks again for the bookmarks once a write has moved the round on', async () => {
        store.serving(() => answering({ entries: [], schema: [] }));
        store.client.fs.bookmarks();
        await settle();

        store.client.fs.invalidate();
        store.client.fs.bookmarks();
        await settle();

        expect(store.asked.filter((url) => url.includes('bookmarks=1'))).toHaveLength(2);
    });

    // Revert: in readBookmarks of state/sources/fs.svelte.ts, sweep the forms on a refused read.
    it('closes no bookmark form over a read the server refused, whatever it said', async () => {
        store.client.layout.loadLayout(fakeStorage());
        const own = store.client.layout.openView('files');
        store.client.ui.setInstanceState(own, { form: 'bookmark', editing: 'manual' });
        // A refusal with nothing to say: the sweep would read it as a file holding no bookmark.
        store.serving(
            () =>
                new Response(JSON.stringify({ error: '' }), {
                    status: 500,
                    headers: { 'content-type': 'application/json' }
                })
        );

        store.client.fs.bookmarks();
        await settle();

        expect(store.client.ui.instanceState(own)).toMatchObject({
            form: 'bookmark',
            editing: 'manual'
        });
    });

    // Revert: in readBookmarks of state/sources/fs.svelte.ts, sweep the forms with an empty answer
    // in the catch branch.
    it('closes no bookmark form over a read that never answered at all', async () => {
        store.client.layout.loadLayout(fakeStorage());
        const own = store.client.layout.openView('files');
        store.client.ui.setInstanceState(own, { form: 'bookmark', editing: 'manual' });
        // A throw with nothing to say: the reason reads empty, as a refusal with no text does.
        store.serving(() => {
            throw new Error('');
        });

        store.client.fs.bookmarks();
        await settle();

        expect(store.client.ui.instanceState(own)).toMatchObject({
            form: 'bookmark',
            editing: 'manual'
        });
    });

    it('keeps the bookmarks drawn and says why when the server refuses the read', async () => {
        store.serving(
            () =>
                new Response(JSON.stringify({ error: 'origin' }), {
                    status: 403,
                    headers: { 'content-type': 'application/json' }
                })
        );

        store.client.fs.bookmarks();
        await settle();

        expect(store.client.fs.bookmarks()).toMatchObject({
            entries: [],
            error: refused(403),
            loading: false
        });
    });

    // A read that failed and a read that is asked again, for the three answers the view draws a
    // failure sentence for.
    it('asks the bookmarks again when the reader asks, without a write to move the round', async () => {
        store.serving(() => refusedRead('origin'));
        store.client.fs.bookmarks();
        await settle();
        expect(store.client.fs.bookmarks().error).toBe(refused(403));
        expect(bookmarkReads()).toBe(1);

        store.serving(() => answering({ entries: [], schema: [] }));
        store.client.fs.retryBookmarks();
        store.client.fs.bookmarks();
        await settle();

        // the record was cleared by the second serving: the read that failed held no round, so
        // the ask the control cleared is made again over the endpoint that now answers
        expect(bookmarkReads()).toBe(1);
        expect(store.client.fs.bookmarks()).toMatchObject({ error: '', loading: false });
    });

    it('asks the notes again when the reader asks, and the line goes when the read lands', async () => {
        store.serving(() => refusedRead('origin'));
        store.client.fs.notes();
        await settle();
        expect(store.client.fs.notes().error).toBe(refused(403));

        store.serving(() => answering({ notes: [{ id: 'n1', title: 'a title', modified: 5 }] }));
        store.client.fs.retryNotes();
        store.client.fs.notes();
        await settle();

        expect(store.client.fs.notes()).toMatchObject({ error: '', loading: false });
        expect(store.client.fs.notes().notes.map((one) => one.title)).toEqual(['a title']);
    });

    it('asks the workspaces again when the reader asks, and the line goes when the read lands', async () => {
        store.serving(() => refusedRead('origin'));
        store.client.fs.workspaces();
        await settle();
        expect(store.client.fs.workspaces().error).toBe(refused(403));

        store.serving(() =>
            answering({ current: '', workspaces: [{ name: '', roots: [] }], dropped: [] })
        );
        store.client.fs.retryWorkspaces();
        store.client.fs.workspaces();
        await settle();

        expect(store.client.fs.workspaces()).toMatchObject({ error: '', loading: false });
        expect(store.client.fs.workspaces().workspaces.map((one) => one.name)).toEqual(['']);
    });

    it('asks once for the round a read failed in, however many times the view draws it', async () => {
        store.serving(() => refusedRead('origin'));
        store.client.fs.bookmarks();
        await settle();

        store.client.fs.bookmarks();
        store.client.fs.bookmarks();
        await settle();

        // a page whose endpoint is down asks once a round and not once a render
        expect(bookmarkReads()).toBe(1);
    });

    it('asks the bookmarks again when the watcher says the file changed, and for no other write', async () => {
        store.serving(() => answering({ entries: [], schema: [] }));
        store.client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(1);

        // a write under a watched root says nothing about the reader's own bookmarks file
        store.client.entities.receive({ channel: 'files', version: 1, payload: { root: '/hub' } });
        store.client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(1);

        store.client.entities.receive({
            channel: 'files',
            version: 2,
            payload: { root: '', bookmarks: true }
        });
        store.client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(2);

        // the message after it names a root, which must not take the bookmarks round back
        store.client.entities.receive({ channel: 'files', version: 3, payload: { root: '/hub' } });
        store.client.fs.bookmarks();
        await settle();
        expect(bookmarkReads()).toBe(2);
    });

    it('holds the notes and one note, each asked for once a round', async () => {
        store.serving((url) =>
            url.includes('notes=1')
                ? answering({ notes: [{ id: 'n1', title: 'a title', modified: 5 }] })
                : answering({ id: 'n1', title: 'a title', body: 'the body', modified: 5 })
        );

        store.client.fs.notes();
        store.client.fs.note('n1');
        await settle();

        expect(store.client.fs.notes().notes.map((one) => one.title)).toEqual(['a title']);
        expect(store.client.fs.note('n1')).toMatchObject({ title: 'a title', body: 'the body' });
        expect(store.asked.filter((url) => url.includes('note=n1'))).toHaveLength(1);
    });

    it('asks for no note at all when the instance names none', () => {
        store.serving(() => answering({}));

        expect(store.client.fs.note('')).toMatchObject({ id: '', loading: false });
        expect(store.asked).toEqual([]);
    });

    it('sends nothing when a note this page deleted is saved again', async () => {
        store.serving(() => answering({ ok: true, changed: ['note'], refused: [] }));
        await store.client.fs.deleteNote('n1');
        const sent = store.asked.length;

        const answer = await store.client.fs.saveNote('n1', 'back again', 'body');

        expect(answer.ok).toBe(false);
        expect(answer.error).toBe(NOTE_GONE);
        expect(store.client.fs.noteDeleted('n1')).toBe(true);
        expect(store.asked.length).toBe(sent);
    });

    it('asks for a deleted note no more, whatever moves the round on', async () => {
        store.serving(() => answering({ ok: true, changed: ['note'], refused: [] }));
        await store.client.fs.deleteNote('n1');
        store.asked.length = 0;

        store.client.fs.note('n1');
        store.client.fs.invalidate();
        store.client.fs.note('n1');
        await settle();

        expect(store.asked.filter((url) => url.includes('note=n1'))).toEqual([]);
    });

    it('holds what a save just wrote, before the re-read of the note lands', async () => {
        store.serving((url) =>
            url.includes('note=n1')
                ? answering({ id: 'n1', title: 'old', body: 'old body', modified: 5 })
                : answering({ ok: true, changed: ['note'], refused: [] })
        );
        store.client.fs.note('n1');
        await settle();
        expect(store.client.fs.note('n1').body).toBe('old body');

        await store.client.fs.saveNote('n1', 'new', 'new body');

        expect(store.client.fs.note('n1')).toMatchObject({ title: 'new', body: 'new body' });
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
            store.client.fs.listing('hub', '');
            store.client.fs.fileText('hub', 'a.txt');
            store.client.fs.workspaces();
            store.client.fs.bookmarks();
            store.client.fs.notes();
        };
        held();
        await settle();
        reads.length = 0;

        await store.client.fs.saveNote('n1', 'a title', 'body');
        held();
        await settle();

        expect(reads.filter((url) => url.includes('notes=1'))).toHaveLength(1);
        expect(reads.filter((url) => url.includes('root=hub'))).toEqual([]);
        expect(reads.filter((url) => url.startsWith('/api/file/'))).toEqual([]);
        expect(reads.filter((url) => url.includes('bookmarks=1'))).toEqual([]);
        expect(reads.filter((url) => url === FS_PATH)).toEqual([]);
    });
});
