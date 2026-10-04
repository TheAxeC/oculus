// Layer 2, client-state tests. The file browser store over its endpoints: listings and workspaces,
// the rounds that decide when an answer is asked for again, and the guards that stop stale answers
// and duplicate requests.

import { describe, expect, it, vi } from 'vitest';
import { FS_PATH } from '../../../../src/lib/state/sources/fs.svelte.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { answering, deferred, listingOf, settle, storeHooks } from './fs-fixture.ts';

// What the store does with what it is answered: the rounds and the two guards.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoints themselves, which are tests/routes/files/fs.test.ts, and the tree drawing
// any of this, which is tests/views/sources/files/files.test.ts.
describe('the store reading the endpoints', () => {
    const store = storeHooks();

    it('asks for nothing at all when there is no page to ask from', async () => {
        vi.unstubAllGlobals();
        store.serving(() => listingOf(['a.txt']));
        const fresh = createClientState();

        expect(fresh.fs.listing('hub', '').loading).toBe(true);
        expect(fresh.fs.workspaces().loading).toBe(true);
        await settle();

        expect(store.asked).toEqual([]);
        expect(fresh.fs.listing('hub', '').error).toBe('');
    });

    it('holds the first answer for a folder and asks once', async () => {
        store.serving(() => listingOf(['a.txt']));

        expect(store.client.fs.listing('hub', '').loading).toBe(true);
        await settle();

        expect(store.client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
        store.client.fs.entries('hub', '');
        await settle();
        expect(store.asked).toEqual(['/api/fs?root=hub&path=']);
    });

    it('asks for a folder once per pair of toggles, each on its own query, and holds the answers apart', async () => {
        store.serving((url) => listingOf(url.includes('hidden=1') ? ['.env', 'a.txt'] : ['a.txt']));
        const hidden = { hidden: true, ignored: false };

        store.client.fs.listing('hub', '');
        store.client.fs.listing('hub', '', hidden);
        await settle();

        expect(store.asked).toEqual(['/api/fs?root=hub&path=', '/api/fs?root=hub&path=&hidden=1']);
        expect(store.client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
        expect(store.client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual([
            '.env',
            'a.txt'
        ]);
        expect(store.client.fs.heldEntries('hub', '', { hidden: false, ignored: true })).toBeNull();
    });

    it("draws another pair's answer for a folder while its own is on its way", async () => {
        store.serving(() => listingOf(['a.txt']));
        store.client.fs.listing('hub', '');
        await settle();

        const late = deferred();
        store.serving(() => late.promise);
        const ignored = { hidden: false, ignored: true };
        const during = store.client.fs.listing('hub', '', ignored);
        expect(during.entries.map((entry) => entry.name)).toEqual(['a.txt']);
        await settle();
        late.land(listingOf(['a.txt', 'build']));
        await settle();
        expect(store.client.fs.entries('hub', '', ignored).map((entry) => entry.name)).toEqual([
            'a.txt',
            'build'
        ]);
    });

    it('asks again for every folder held under one pair when it is relisted, and for no other pair', async () => {
        store.serving(() => listingOf(['a.txt']));
        const hidden = { hidden: true, ignored: false };
        store.client.fs.listing('hub', '');
        store.client.fs.listing('hub', 'code', hidden);
        store.client.fs.listing('hub', '', hidden);
        await settle();

        store.serving(() => listingOf(['b.txt']));
        store.client.fs.relist(hidden);
        store.client.fs.listing('hub', '');
        store.client.fs.listing('hub', 'code', hidden);
        store.client.fs.listing('hub', '', hidden);
        await settle();

        expect(store.asked).toEqual([
            '/api/fs?root=hub&path=code&hidden=1',
            '/api/fs?root=hub&path=&hidden=1'
        ]);
        expect(store.client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual([
            'b.txt'
        ]);
        expect(store.client.fs.entries('hub', '').map((entry) => entry.name)).toEqual(['a.txt']);
    });

    it('sends no second request for a relist while a read of that pair is in flight, and holds the answer', async () => {
        const late = deferred();
        store.serving(() => late.promise);
        const hidden = { hidden: true, ignored: false };
        store.client.fs.listing('hub', '', hidden);
        await settle();

        store.client.fs.relist(hidden);
        store.client.fs.listing('hub', '', hidden);
        await settle();
        expect(store.asked).toEqual(['/api/fs?root=hub&path=&hidden=1']);

        late.land(listingOf(['.env']));
        await settle();
        expect(store.client.fs.entries('hub', '', hidden).map((entry) => entry.name)).toEqual([
            '.env'
        ]);
    });

    it('keeps the roots it holds drawn while the answer after a write is fetched', async () => {
        store.serving((url) =>
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
        store.client.fs.workspaces();
        await settle();
        expect(store.client.fs.workspaces().workspaces[0].roots).toHaveLength(1);

        store.client.fs.invalidate();

        // Read straight after the write: the roots held before it are still what the tree draws.
        const during = store.client.fs.workspaces();
        expect(during.workspaces[0].roots).toHaveLength(1);
        expect(during.loading).toBe(false);
        await settle();
        expect(store.client.fs.workspaces().workspaces[0].roots).toHaveLength(1);
    });

    it('drops an answer that lands after the round it was asked in has passed', async () => {
        const late = deferred();
        store.serving(() => late.promise);
        store.client.fs.listing('hub', '');
        await settle();

        store.client.fs.invalidate();
        store.serving(() => listingOf(['fresh.txt']));
        // The next render asks again, in the new round; the first request is still in flight.
        store.client.fs.listing('hub', '');
        await settle();
        late.land(listingOf(['stale.txt']));
        await settle();

        expect(store.client.fs.entries('hub', '').map((entry) => entry.name)).toEqual([
            'fresh.txt'
        ]);
    });

    // Revert: in markOne of state/client/queries.svelte.ts, take out the cancel call.
    it("never shows a listing fetched before a removal, and shows the removal's own", async () => {
        const late = deferred();
        store.serving((url) => {
            if (url === FS_PATH) return answering({ ok: true, changed: ['root'], refused: [] });
            return store.asked.length === 1 ? late.promise : listingOf(['after.txt']);
        });
        store.client.fs.listing('hub', '');
        await settle();
        await store.client.fs.removeRoot('extra');
        store.client.fs.listing('hub', '');
        await settle();
        late.land(listingOf(['before.txt']));
        await settle();
        expect(store.client.fs.entries('hub', '').map((entry) => entry.name)).toEqual([
            'after.txt'
        ]);
    });

    it('reads a file again after a write, rather than holding the text it had', async () => {
        let body = 'first';
        store.serving(() => new Response(body, { status: 200 }));

        store.client.fs.fileText('hub', 'a.txt');
        await settle();
        expect(store.client.fs.fileText('hub', 'a.txt').text).toBe('first');

        body = 'second';
        store.client.fs.invalidate();
        store.client.fs.fileText('hub', 'a.txt');
        await settle();
        expect(store.client.fs.fileText('hub', 'a.txt').text).toBe('second');
    });
});
