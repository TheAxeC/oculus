// Layer 4, test. The file browser store reading a file: the byte limit, a file held whole, the
// version that asks a root again, the text held while a fresh one lands, and what a file opens as.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoints themselves, which are tests/routes/files/fs.test.ts, and the tree drawing
// any of this, which is tests/views/sources/files/files.test.ts.

import { describe, expect, it } from 'vitest';
import { ENGINE_ROOT, TEXT_LIMIT } from '../../../../src/lib/state/sources/fs.ts';
import { refused } from '../../../fixtures/client.ts';
import { listingOf } from './fs-fixture.ts';
import { deferred, settle, storeHooks } from './fs-fixture.ts';

describe('the store reading a file', () => {
    const store = storeHooks();

    it('cuts a file at two megabytes of bytes and stops the transfer there', async () => {
        const chunk = new Uint8Array(64 * 1024).fill(0x61);
        let sent = 0;
        let cancelled = false;
        store.serving(
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

        store.client.fs.fileText('hub', 'big.txt');
        await settle();

        const held = store.client.fs.fileText('hub', 'big.txt');
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
        store.serving(
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

        store.client.fs.fileText('hub', 'wide.txt');
        await settle();

        const held = store.client.fs.fileText('hub', 'wide.txt');
        expect(held.truncated).toBe(true);
        expect(held.text.length).toBe(TEXT_LIMIT / 2);
        expect(held.text.startsWith('\u00e9\u00e9')).toBe(true);
    });

    it('holds a file shorter than the limit whole, and says it was not cut', async () => {
        store.serving(() => new Response('one line\n', { status: 200 }));

        store.client.fs.fileText('hub', 'a.txt');
        await settle();

        expect(store.client.fs.fileText('hub', 'a.txt')).toMatchObject({
            text: 'one line\n',
            truncated: false,
            error: ''
        });
    });

    it('holds the refused sentence with the status for a file the route refuses', async () => {
        store.serving(() => new Response('no', { status: 404 }));

        store.client.fs.fileText('hub', 'gone.txt');
        await settle();

        expect(store.client.fs.fileText('hub', 'gone.txt')).toMatchObject({
            text: '',
            error: refused(404),
            loading: false
        });
    });

    it('asks again for one root alone when a version says that root changed', async () => {
        let body = 'before\n';
        store.serving((url) =>
            url.startsWith('/api/fs')
                ? listingOf(['layout.yml'])
                : new Response(body, { status: 200 })
        );

        store.client.fs.listing(ENGINE_ROOT, '');
        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        store.client.fs.fileText('hub', 'README.md');
        await settle();
        expect(store.client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('before\n');
        const before = store.asked.length;

        // The watcher's push moves the config channel's version; the Settings view hands it on.
        body = 'after\n';
        store.client.fs.refresh(ENGINE_ROOT, 7);
        store.client.fs.listing(ENGINE_ROOT, '');
        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        store.client.fs.fileText('hub', 'README.md');
        await settle();

        expect(store.client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('after\n');
        expect(store.asked.slice(before)).toEqual([
            '/api/fs?root=engine&path=',
            '/api/file/engine/layout.yml'
        ]);
    });

    it('asks for nothing again at a version it has already refreshed at', async () => {
        store.serving(() => new Response('one\n', { status: 200 }));

        store.client.fs.refresh(ENGINE_ROOT, 4);
        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();
        const before = store.asked.length;

        store.client.fs.refresh(ENGINE_ROOT, 4);
        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();

        expect(store.asked.length).toBe(before);
    });

    it('keeps the held text drawn until the fresh one lands', async () => {
        const late = deferred();
        let first = true;
        store.serving(() => {
            if (!first) return late.promise;
            first = false;
            return new Response('before\n', { status: 200 });
        });

        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();
        store.client.fs.refresh(ENGINE_ROOT, 2);
        store.client.fs.fileText(ENGINE_ROOT, 'layout.yml');
        await settle();

        expect(store.client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('before\n');
        late.land(new Response('after\n', { status: 200 }));
        await settle();
        expect(store.client.fs.fileText(ENGINE_ROOT, 'layout.yml').text).toBe('after\n');
    });

    // What a file opens as, through the one caller the file browser and the file view both use.
    describe('what a file opens as', () => {
        /** A response of one file's bytes, which is all a kind read asks for. */
        function bytesOf(body: Uint8Array): Response {
            return new Response(body.buffer as ArrayBuffer, { status: 200 });
        }

        it('reads the head once a round and answers the asks after it from what it holds', async () => {
            store.serving(() => bytesOf(new TextEncoder().encode('print("one")\n')));

            const first = store.client.fs.readFileKind('hub', 'code/run.py');
            const second = store.client.fs.readFileKind('hub', 'code/run.py');
            expect(await first).toEqual({ kind: 'text' });
            expect(await second).toEqual({ kind: 'text' });
            // The three asks a double click makes, and the file view's own, share one request.
            expect(await store.client.fs.readFileKind('hub', 'code/run.py')).toEqual({
                kind: 'text'
            });
            expect(store.asked).toEqual(['/api/file/hub/code/run.py']);
            expect(store.client.fs.heldFileKind('hub', 'code/run.py')).toEqual({ kind: 'text' });
        });

        it('holds a head the read failed on as the download, so the view stops reading', async () => {
            store.serving(() => {
                throw new Error('stream broke');
            });
            const kind = { kind: 'other' };
            expect(await store.client.fs.readFileKind('hub', 'code/broken.dat')).toEqual(kind);
            expect(store.client.fs.heldFileKind('hub', 'code/broken.dat')).toEqual(kind);
            expect(store.asked).toEqual(['/api/file/hub/code/broken.dat']);
        });

        it('asks again after a write has moved the round on', async () => {
            store.serving(() => bytesOf(new TextEncoder().encode('one\n')));
            await store.client.fs.readFileKind('hub', 'notes.txt');
            expect(store.asked).toHaveLength(1);

            store.client.fs.invalidate();
            expect(store.client.fs.heldFileKind('hub', 'notes.txt')).toBeNull();
            await store.client.fs.readFileKind('hub', 'notes.txt');
            expect(store.asked).toHaveLength(2);
        });

        it('answers a name the browser draws itself without asking at all', async () => {
            store.serving(() => bytesOf(new Uint8Array(0)));

            expect(await store.client.fs.readFileKind('hub', 'docs/plot.png')).toEqual({
                kind: 'image'
            });
            expect(store.client.fs.heldFileKind('hub', 'paper.pdf')).toEqual({ kind: 'pdf' });
            expect(store.asked).toEqual([]);
        });

        it('reads a file whose character straddles the end of the window as text', async () => {
            // The window is 8192 bytes and the read is one more, so the two bytes of the accented
            // letter fall on either side of it: the cut is the window's and not the file's.
            const body = new TextEncoder().encode(
                'a'.repeat(8191) + '\u00e9' + 'more text after it\n'
            );
            store.serving(() => bytesOf(body));

            expect(await store.client.fs.readFileKind('hub', 'long.csv')).toEqual({ kind: 'text' });
        });

        it('reads a file whose bytes are not text as a download, whatever its name says', async () => {
            store.serving(() =>
                bytesOf(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02, 0x03]))
            );

            expect(await store.client.fs.readFileKind('hub', 'data.txt')).toEqual({
                kind: 'other'
            });
        });

        it('answers a download for a file the route refused, and holds it for the round', async () => {
            store.serving(() => new Response('no', { status: 403 }));

            expect(await store.client.fs.readFileKind('hub', 'secret.txt')).toEqual({
                kind: 'other'
            });
            expect(store.client.fs.heldFileKind('hub', 'secret.txt')).toEqual({ kind: 'other' });
        });
    });
});
