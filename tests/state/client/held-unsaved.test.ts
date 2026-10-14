// Layer 2, client-state tests. A write sent from any view, or from an app, over a file that a
// source tab of the page holds unsaved text of is refused before it is sent, and a write over
// another file is sent.
//
// The write store is built with a predicate that holds one file, over a stubbed `fetch` that
// records each POST. The refusal is the sentence of the catalog's `app.file_unsaved`, named after
// the file, and a write from a view reaches the listeners every refused write reaches. An app's
// write is answered to the app, which says it itself.
//
// The rail reorder row runs the whole chain: a source store over a fake server with a dirty tab of
// `hub:tools/oculus/config/layout.yml`, the write store asking that store, and `writeRail` for the
// file `layout.yml` of oculus's config folder under the workspace folder that holds it. Whether
// that file and the tab's are one depends on where the workspace places the config folder, so the
// same reorder is refused when the folder is the hub's own `tools/oculus/config`, sent when it is a
// worktree's, and sent when no workspace folder holds the config folder.
//
// A write made while the roots are not read and a tab holds unsaved text of some file is refused
// with the sentence of `app.folders_loading`, since the tab cannot be told from the write's file;
// the undo of a recorded change, which names its file by absolute path, is refused the same way.
//
// What this does NOT cover: the disabled controls a view draws for the same file, and the source
// store's own answer to which tab holds unsaved text (tests/state/sessions/source.test.ts).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { fileNamed } from '../../../src/lib/data/helpers/hub-names.ts';
import { createWrites } from '../../../src/lib/state/client/writes.svelte.ts';
import { NO_LOOKUPS } from '../../../src/lib/state/sessions/source/write-files.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { server } from '../sessions/source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

type Writes = ReturnType<typeof createWrites>;

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
            (file) => file.root === 'hub' && file.path === 'tasks/tasks.yml',
            { ...NO_LOOKUPS, primary: () => 'hub' }
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

describe('the writes of the entry pages over a file a source tab holds unsaved text of', () => {
    it.each([
        [
            'a career save',
            'registries/career.yml',
            (w: Writes) => w.writeCareer({ milestone: 'Veni' })
        ],
        [
            'an Add to People',
            'registries/people.yml',
            (w: Writes) => w.newEntry('people', { key: 'wim' })
        ],
        ['a Delete of a task', 'tasks/tasks.yml', (w: Writes) => w.deleteEntry('tasks', 'A task')]
    ])('refuses %s and posts nothing', async (_name, path, send) => {
        const posted: unknown[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: [], refused: [] })
            });
        });
        const writes = createWrites(
            () => ({
                collections: [
                    ...CONFIG.collections,
                    { key: 'people', file: 'registries/people.yml' }
                ]
            }),
            (file) => file.root === 'hub' && file.path === path,
            { ...NO_LOOKUPS, primary: () => 'hub' }
        );
        const answer = await send(writes);
        expect(posted).toEqual([]);
        expect(answer.error).toBe(t('app.file_unsaved', path.split('/').at(-1) ?? path));
    });

    it('posts a career save when the tab holds another file', async () => {
        const posted: unknown[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: ['milestone'], refused: [] })
            });
        });
        const writes = createWrites(
            () => CONFIG,
            (file) => file.path === 'tasks/tasks.yml',
            { ...NO_LOOKUPS, primary: () => 'hub' }
        );
        expect((await writes.writeCareer({ milestone: 'Veni' })).ok).toBe(true);
        expect(posted).toEqual([{ kind: 'career', fields: { milestone: 'Veni' } }]);
    });
});

describe('a write to an entry of a hub other than the primary', () => {
    it('is checked against the file of the hub the entry id names, as the server routes it', async () => {
        const posted: Record<string, unknown>[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: ['status'], refused: [] })
            });
        });
        const lab = { root: 'lab', path: 'tasks/tasks.yml' };
        const writes = createWrites(
            () => CONFIG,
            (file) => file.root === lab.root && file.path === lab.path,
            {
                ...NO_LOOKUPS,
                primary: () => 'hub',
                collectionFile: (id) => (id === 'lab:tasks' ? lab : null)
            }
        );
        const refusal = t('app.file_unsaved', 'tasks.yml');
        const held = [
            await writes.writeEntry('tasks', 'lab:Review the draft', { status: 'done' }),
            await writes.reorderEntries('tasks', ['lab:Review the draft', 'lab:Plan'])
        ];
        expect(posted).toEqual([]);
        expect(held.map((one) => one.error)).toEqual([refusal, refusal]);

        const first = await writes.writeEntry('tasks', 'Review the draft', { status: 'done' });
        expect(first.ok).toBe(true);
        expect(posted.map((body) => body.id)).toEqual(['Review the draft']);
    });

    it("checks a Literature save that names a hub against that hub's Literature file", async () => {
        const posted: Record<string, unknown>[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: [], refused: [], id: 'faes2024' })
            });
        });
        const lab = { root: 'lab', path: 'registries/literature.yml' };
        const writes = createWrites(
            () => ({ collections: [{ key: 'literature', file: 'registries/literature.yml' }] }),
            (file) => file.root === lab.root && file.path === lab.path,
            {
                ...NO_LOOKUPS,
                primary: () => 'hub',
                collectionFile: (id) => (id === 'lab:literature' ? lab : null)
            }
        );
        const paper = { doi: '10.1000/one' };
        const held = await writes.saveLiterature('hand', paper, 'lab');
        expect(posted).toEqual([]);
        expect(held.error).toBe(t('app.file_unsaved', 'literature.yml'));

        const own = await writes.saveLiterature('hand', paper);
        expect(own.ok).toBe(true);
        expect(posted).toEqual([{ kind: 'literature-save', source: 'hand', paper }]);
    });
});

describe('a rail reorder over a layout file a source tab holds unsaved text of', () => {
    const TAB = 'hub/tools/oculus/config/layout.yml';
    const HUB = '/work/hub';
    const RAIL = [{ label: 'Files', glyph: 'files', page: 'files' }];

    /** A dirty tab over the hub name of the layout file, and a rail reorder sent after it. */
    async function reorder(
        engine: { root: string; path: string } | null
    ): Promise<{ posted: unknown[]; error?: string }> {
        const env = server({ roots: () => [{ key: 'hub', dir: HUB, real: HUB }] });
        env.files.set(TAB, 'rail: []\n');
        await env.source.loadSourceDraft('one', 'hub', 'tools/oculus/config/layout.yml');
        env.source.editSourceDraft('one', 'rail: [x]\n');
        await env.settled();
        const posted: unknown[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: [], refused: [] })
            });
        });
        const writes = createWrites(
            () => ({}),
            (file) => env.source.unsavedFile(file.root, file.path),
            { ...NO_LOOKUPS, primary: () => 'hub', engine: () => engine }
        );
        const answer = await writes.writeRail(RAIL);
        return { posted, error: answer.error };
    }

    it('sends the write when the config folder lies in the hub as a worktree config folder', async () => {
        const out = await reorder({
            root: 'hub',
            path: '.agents/worktrees/feature/tools/oculus/config'
        });
        expect(out.posted).toHaveLength(1);
        expect(out.error).toBeUndefined();
    });

    it('sends the write when no workspace folder holds the config folder', async () => {
        const out = await reorder(null);
        expect(out.posted).toHaveLength(1);
        expect(out.error).toBeUndefined();
    });

    it('refuses the write and posts nothing when the config folder is the hub own tools/oculus/config', async () => {
        const out = await reorder({ root: 'hub', path: 'tools/oculus/config' });
        expect(out.posted).toEqual([]);
        expect(out.error).toBe(t('app.file_unsaved', 'layout.yml'));
    });
});

describe('a write while the roots are not read and a source tab holds unsaved text', () => {
    it('is refused with the folders-loading sentence and posts nothing, and goes out once the roots are read', async () => {
        let roots = [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }];
        const env = server({ roots: () => roots });
        env.files.set('hub/tools/oculus/config/layout.yml', 'rail: []\n');
        await env.source.loadSourceDraft('one', 'hub', 'tools/oculus/config/layout.yml');
        env.source.editSourceDraft('one', 'rail: [x]\n');
        await env.settled();
        const posted: unknown[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: [], refused: [] })
            });
        });
        const writes = createWrites(
            () => CONFIG,
            (file) => env.source.unsavedFile(file.root, file.path),
            {
                ...NO_LOOKUPS,
                primary: () => 'hub',
                unsavedUnknown: (file) => env.source.unsavedUnknown(file.root, file.path)
            }
        );

        roots = [];
        const loading = await writes.writeEntry('tasks', 'A task', { status: 'done' });
        expect(posted).toEqual([]);
        expect(loading.error).toBe(t('app.folders_loading', 'tasks.yml'));

        roots = [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }];
        const read = await writes.writeEntry('tasks', 'A task', { status: 'done' });
        expect(read.ok).toBe(true);
        expect(posted).toHaveLength(1);
    });

    it('refuses an undo of a recorded change while the roots are not read, and once they are read refuses it for the tab that holds unsaved text', async () => {
        let roots = [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }];
        const env = server({ roots: () => roots });
        env.files.set('hub/tasks/tasks.yml', 'a: 1\n');
        await env.source.loadSourceDraft('one', 'hub', 'tasks/tasks.yml');
        env.source.editSourceDraft('one', 'a: 2\n');
        await env.settled();
        const posted: unknown[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            posted.push(JSON.parse(String(init?.body)));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, changed: [], refused: [] })
            });
        });
        const writes = createWrites(
            () => CONFIG,
            (file) => env.source.unsavedFile(file.root, file.path),
            {
                ...NO_LOOKUPS,
                primary: () => 'hub',
                changeFile: () => fileNamed('/work/hub/tasks/tasks.yml', roots, 'hub'),
                unsavedUnknown: (file) => env.source.unsavedUnknown(file.root, file.path)
            }
        );

        roots = [];
        const loading = await writes.undoWrite('2026-01-01T00:00:00Z');
        expect(posted).toEqual([]);
        expect(loading.error).toBe(t('app.folders_loading', 'tasks.yml'));

        roots = [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }];
        const held = await writes.undoWrite('2026-01-01T00:00:00Z');
        expect(held.error).toBe(t('app.file_unsaved', 'tasks.yml'));
        expect(posted).toEqual([]);
    });
});
