// Layer 2, client-state tests. A write sent from any view, or from an app, over a file that a
// source tab of the page holds unsaved text of is refused before it is sent, and a write over
// another file is sent.
//
// The write store is built with a predicate that holds one file, over a stubbed `fetch` that
// records each POST. The refusal is the sentence of the catalog's `app.file_unsaved`, named after
// the file, and a write from a view reaches the listeners every refused write reaches. An app's
// write is answered to the app, which says it itself.
//
// What this does NOT cover: the disabled controls a view draws for the same file, and the source
// store's own answer to which tab holds unsaved text (tests/state/sessions/source.test.ts).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { createWrites } from '../../../src/lib/state/client/writes.svelte.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const CONFIG = {
    collections: [
        { key: 'tasks', file: 'tasks/tasks.yml' },
        { key: 'events', file: 'registries/events.yml' }
    ]
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('a write over a file a source tab holds unsaved text of', () => {
    it('posts nothing and answers the refusal, and a write over another file posts', async () => {
        const posted: Record<string, unknown>[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: ['status'], refused: [] })
            });
        });
        const writes = createWrites(
            () => CONFIG,
            (file) => file.root === 'hub' && file.path === 'tasks/tasks.yml'
        );
        const told: string[] = [];
        writes.onUnwritten((reason) => told.push(reason));

        const held = await writes.writeEntry('tasks', 'A task', { status: 'done' });
        const refusal = t('app.file_unsaved', 'tasks.yml');
        expect(posted).toEqual([]);
        expect(held.ok).toBe(false);
        expect(held.error).toBe(refusal);
        expect(told).toEqual([refusal]);

        const fromApp = await writes.sendFromApp(
            { kind: 'entry', collection: 'tasks', id: 'A task', fields: { status: 'done' } },
            'hub:apps/notes',
            'entry'
        );
        expect(posted).toEqual([]);
        expect(fromApp.ok).toBe(false);
        expect(fromApp.error).toBe(refusal);
        expect(told).toEqual([refusal]);

        const free = await writes.writeEntry('events', 'An event', { status: 'done' });
        expect(posted.map((body) => body.collection)).toEqual(['events']);
        expect(free.ok).toBe(true);
    });
});
