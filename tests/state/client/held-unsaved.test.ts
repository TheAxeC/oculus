// Layer 2, client-state tests. A write sent from any view, or from an app, over a file that a
// source tab of the page holds unsaved text of is refused before it is sent, and a write over
// another file is sent.
//
// The write store is built with a predicate that holds one file, over a stubbed `fetch` that
// records each POST. The refusal is the sentence of the catalog's `app.file_unsaved`, named after
// the file, and a write from a view reaches the listeners every refused write reaches. An app's
// write is answered to the app, which says it itself.
//
// The Settings rows run the whole chain: a source store over a fake server with a dirty tab of a
// file of the hub, the write store asking that store, and a Settings write for the file the server
// places it in. The rail, the audit's mute list and every option outside the hub list land in the
// open workspace file, under the workspace folder that holds it, so they are refused when the tab
// holds that file and sent when it holds another or no folder holds the workspace file; a key of
// the hub list lands in the primary hub's `.oculus/config.yml`.
//
// A write made while the roots are not read and a tab holds unsaved text of some file is refused
// with the sentence of `app.folders_loading`, since the tab cannot be told from the write's file;
// the undo of a recorded change, which names its file by absolute path, is refused the same way.
//
// What this does NOT cover: the disabled controls a view draws for the same file, and the source
// store's own answer to which tab holds unsaved text (tests/state/sessions/source/source.test.ts).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { fileNamed } from '../../../src/lib/data/helpers/hub-names.ts';
import { createWrites } from '../../../src/lib/state/client/writes.svelte.ts';
import { NO_LOOKUPS } from '../../../src/lib/state/sessions/source/write-files.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { server } from '../sessions/source/source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

type Writes = ReturnType<typeof createWrites>;

/** The merged configuration as the page receives it: the collection files and the career file. */
const CONFIG = {
    career_file: '.oculus/data/academic/career.yml',
    collections: [
        { key: 'tasks', file: '.oculus/data/academic/tasks.yml' },
        { key: 'events', file: '.oculus/data/academic/events.yml' }
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
            (file) => file.root === 'hub' && file.path === '.oculus/data/academic/tasks.yml',
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
            '.oculus/data/academic/career.yml',
            (w: Writes) => w.writeCareer({ milestone: 'Veni' })
        ],
        [
            'an Add to People',
            '.oculus/data/people/people.yml',
            (w: Writes) => w.newEntry('people', { key: 'wim' })
        ],
        [
            'a Delete of a task',
            '.oculus/data/academic/tasks.yml',
            (w: Writes) => w.deleteEntry('tasks', 'A task')
        ]
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
                ...CONFIG,
                collections: [
                    ...CONFIG.collections,
                    { key: 'people', file: '.oculus/data/people/people.yml' }
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
            (file) => file.path === '.oculus/data/academic/tasks.yml',
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
        const lab = { root: 'lab', path: '.oculus/data/academic/tasks.yml' };
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
        const lab = { root: 'lab', path: '.oculus/data/literature/literature.yml' };
        const writes = createWrites(
            () => ({
                collections: [{ key: 'literature', file: '.oculus/data/literature/literature.yml' }]
            }),
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

describe('a Settings write over a file a source tab holds unsaved text of', () => {
    const WORKSPACE = '.oculus/workspaces/main.yml';
    const HUB = '/work/hub';
    const RAIL = [{ label: 'Files', glyph: 'files', page: 'files', chord: '', group_glyph: '' }];

    /**
     * A dirty tab of `held` in the hub, the open workspace file at `open` (null when no workspace
     * folder holds it), and one Settings write sent after it.
     */
    async function settingsWrite(
        held: string,
        open: { root: string; path: string } | null,
        write: (writes: Writes) => Promise<{ error?: string }>
    ): Promise<{ posted: unknown[]; error?: string }> {
        const env = server({ roots: () => [{ key: 'hub', dir: HUB, real: HUB }] });
        env.files.set(`hub/${held}`, 'settings: {}\n');
        await env.source.loadSourceDraft('one', 'hub', held);
        env.source.editSourceDraft('one', 'settings: { code_theme: x }\n');
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
            { ...NO_LOOKUPS, primary: () => 'hub', workspaceFile: () => open }
        );
        const answer = await write(writes);
        return { posted, error: answer.error };
    }

    const OPEN = { root: 'hub', path: WORKSPACE };

    it.each([
        ['a rail reorder', (w: Writes) => w.writeRail(RAIL)],
        ['a park of an audit finding', (w: Writes) => w.muteFinding('sig', true)],
        [
            'a write of the code theme',
            (w: Writes) => w.writeConfigKey('appearance.yml', 'code_theme', 'x')
        ],
        ['a Reset of the code theme', (w: Writes) => w.resetConfig('appearance.yml', 'code_theme')]
    ])(
        'refuses %s and posts nothing when the tab holds the open workspace file',
        async (_, write) => {
            const out = await settingsWrite(WORKSPACE, OPEN, write);
            expect(out.posted).toEqual([]);
            expect(out.error).toBe(t('app.file_unsaved', 'main.yml'));
        }
    );

    it('sends a rail reorder when the tab holds another workspace file', async () => {
        const out = await settingsWrite('.oculus/workspaces/other.yml', OPEN, (w) =>
            w.writeRail(RAIL)
        );
        expect(out.posted).toHaveLength(1);
        expect(out.error).toBeUndefined();
    });

    it('sends a rail reorder when no workspace folder holds the open workspace file', async () => {
        const out = await settingsWrite(WORKSPACE, null, (w) => w.writeRail(RAIL));
        expect(out.posted).toHaveLength(1);
        expect(out.error).toBeUndefined();
    });

    it("refuses a write of a key of the hub list when the tab holds the hub's settings file", async () => {
        const out = await settingsWrite('.oculus/config.yml', OPEN, (w) =>
            w.writeConfigKey('appearance.yml', 'wallpaper.image', 'x.jpg')
        );
        expect(out.posted).toEqual([]);
        expect(out.error).toBe(t('app.file_unsaved', 'config.yml'));
        const other = await settingsWrite('.oculus/config.yml', OPEN, (w) =>
            w.writeConfigKey('appearance.yml', 'code_theme', 'x')
        );
        expect(other.posted).toHaveLength(1);
    });
});

describe('a write while the roots are not read and a source tab holds unsaved text', () => {
    it('is refused with the folders-loading sentence and posts nothing, and goes out once the roots are read', async () => {
        let roots = [{ key: 'hub', dir: '/work/hub', real: '/work/hub' }];
        const env = server({ roots: () => roots });
        env.files.set('hub/tools/oculus/config/defaults/layout.yml', 'rail: []\n');
        await env.source.loadSourceDraft('one', 'hub', 'tools/oculus/config/defaults/layout.yml');
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
        env.files.set('hub/.oculus/data/academic/tasks.yml', 'a: 1\n');
        await env.source.loadSourceDraft('one', 'hub', '.oculus/data/academic/tasks.yml');
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
                changeFile: () =>
                    fileNamed('/work/hub/.oculus/data/academic/tasks.yml', roots, 'hub'),
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
