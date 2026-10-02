// Layer 4, test. What the explorer store (state/sources/explorer/ops.svelte.ts) does for the
// Files view's drag and drop, the undo of a file operation, the folder panel and the clipboard's
// Escape, and what the file store (state/sources/fs.svelte.ts) reads for the Timeline section.
//
// `fetch` is a stub of the case's own, so nothing reaches a server, a disk or a panel.
//
// What this does NOT cover: the server side of any of these (tests/server/files/,
// tests/routes/files/) and the drag events (a browser).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { sourceTabState } from '../../../../../src/lib/state/sessions/source.svelte.ts';
import { tabsOf } from '../../../../../src/lib/state/workbench/layout/instance.ts';
import { noop } from '../../../../fixtures/doubles.ts';
import { createClientState, json, settle, type ClientState } from '../../../../fixtures/client.ts';
import { fakeStorage } from '../../../workbench/layout/layout-fixture.ts';
import type { FsRoot } from '../../../../../src/lib/state/sources/fs.ts';
import type { FileRecord } from '../../../../../src/lib/state/sources/explorer/acts/undo.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

type Body = Record<string, unknown>;

let client: ClientState;
let posted: { url: string; body: Body }[] = [];
let asked: string[] = [];
/** What the folder panel route answers. */
let panel: Body = { ok: true, paths: [] };
/** What /api/write answers. */
let writeAnswer: Body = { ok: true, changed: ['x'], refused: [] };

/** The workspace in force: '' is the default one. */
let current = '';

const WORKSPACE = {
    current: '',
    workspaces: [
        {
            name: '',
            roots: [
                { key: 'hub', dir: '/r/hub', fixed: true },
                { key: 'notes', dir: '/r/notes', fixed: false }
            ]
        }
    ],
    dropped: []
};

const ROOTS: FsRoot[] = WORKSPACE.workspaces[0]?.roots ?? [];

function serve(): void {
    const answer = (url: string, init?: RequestInit): Response => {
        if (init?.method === 'POST') {
            const body = JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Body;
            posted.push({ url, body });
            if (url === '/api/ops') return json({ ok: true, paths: [] });
            if (url === '/api/folders/pick') return json(panel);
            return json(writeAnswer, writeAnswer.ok === false ? 409 : 200);
        }
        asked.push(url);
        if (url.startsWith('/api/history')) {
            return url.includes('id=')
                ? json({ content: 'old text' })
                : json({ saves: [{ id: '20260101T000000000', at: 1, size: 3, kind: 'save' }] });
        }
        if (url.startsWith('/api/git?log=')) {
            return json({
                commits: [{ hash: 'abc', short: 'abc', subject: 'Fix', when: '2026-01-01' }]
            });
        }
        if (url === '/api/fs') return json({ ...WORKSPACE, current });
        return json({ entries: [], bookmarks: [] });
    };
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => Promise.resolve(answer(url, init)));
}

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    client.writes.setToken('token');
    posted = [];
    asked = [];
    panel = { ok: true, paths: [] };
    writeAnswer = { ok: true, changed: ['x'], refused: [] };
    current = '';
    serve();
});

afterEach(() => vi.unstubAllGlobals());

/** Every open tab of every page. */
function allTabs(): { id: string; view: string }[] {
    return client.layout.pages().flatMap((page) => tabsOf(page.workbench.root));
}

const never = (): Promise<boolean> => Promise.resolve(false);
const opsPosts = (): Body[] =>
    posted.filter((one) => one.url === '/api/ops').map((one) => one.body);

describe('a drop', () => {
    const into = { root: 'hub', path: 'd' };
    const item = { root: 'hub', path: 'a.txt' };

    // Revert: have drop paste a copy whatever `copy` says.
    it('posts one paste, a move without Option and a copy with it, and leaves the clipboard alone', async () => {
        client.explorer.copy([{ root: 'hub', path: 'kept.txt' }]);
        await client.explorer.drop([item], into, false, never);
        await client.explorer.drop([item], into, true, never);

        expect(opsPosts()).toEqual([
            { op: 'paste', mode: 'move', items: [item], root: 'hub', path: 'd', replace: false },
            { op: 'paste', mode: 'copy', items: [item], root: 'hub', path: 'd', replace: false }
        ]);
        expect(client.explorer.clipboard()?.items).toEqual([{ root: 'hub', path: 'kept.txt' }]);
    });

    // Revert: split a drop of three rows into three requests.
    it('moves three dragged rows in one request', async () => {
        const rows = [item, { root: 'hub', path: 'b.txt' }, { root: 'hub', path: 'c.txt' }];
        await client.explorer.drop(rows, into, false, never);

        expect(opsPosts().length).toBe(1);
        expect(opsPosts()[0]?.items).toEqual(rows);
    });

    // Revert: copy the source and trash it in two requests.
    it('moves between two roots in one paste, naming the other root for the target', async () => {
        await client.explorer.drop([item], { root: 'notes', path: '' }, false, never);

        expect(opsPosts()).toEqual([
            { op: 'paste', mode: 'move', items: [item], root: 'notes', path: '', replace: false }
        ]);
    });
});

describe('taking a file operation back', () => {
    const record = (field: string, before: string[], after: string[]): FileRecord => ({
        at: '2026-01-01T00:00:00.000Z',
        kind: 'files',
        undo: 'file',
        field,
        before: before.map((path) => ({ path })),
        after: after.map((path) => ({ path }))
    });

    // Revert: post the undo under another kind.
    it('posts the undo of the record by its time', async () => {
        const answer = await client.explorer.undoFile(record('create', [], ['/r/hub/a.md']), ROOTS);

        expect(answer.ok).toBe(true);
        expect(posted.map((one) => one.body)).toEqual([
            { kind: 'undo', at: '2026-01-01T00:00:00.000Z' }
        ]);
    });

    // Revert: skip the restating of tabs in undoFile.
    it('restates a tab over a renamed file at the path it goes back to', async () => {
        const id = client.layout.openView('source', sourceTabState('hub', 'b.md'));
        client.ui.setInstanceState(id, {
            text: 't',
            saved: 't',
            loaded: true,
            file: 'hub/b.md',
            error: '',
            message: ''
        });
        await client.explorer.undoFile(record('rename', ['/r/hub/a.md'], ['/r/hub/b.md']), ROOTS);

        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'a.md'));
    });

    // Revert: restate the tabs when the endpoint changed nothing.
    it('restates nothing and counts no answer when the endpoint refused', async () => {
        writeAnswer = { ok: false, error: 'moved', changed: [], refused: ['x'] };
        const id = client.layout.openView('source', sourceTabState('hub', 'b.md'));
        const before = client.explorer.answers();
        const answer = await client.explorer.undoFile(
            record('rename', ['/r/hub/a.md'], ['/r/hub/b.md']),
            ROOTS
        );

        expect(answer.ok).toBe(false);
        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'b.md'));
        expect(client.explorer.answers()).toBe(before);
    });

    // Revert: leave answeredCount alone in undoFile.
    it('counts the answer, so the History view reads the log again', async () => {
        const before = client.explorer.answers();
        await client.explorer.undoFile(record('create', [], ['/r/hub/a.md']), ROOTS);

        expect(client.explorer.answers()).toBe(before + 1);
    });
});

describe('the folder panel', () => {
    async function withRoots(): Promise<void> {
        client.fs.workspaces();
        await settle();
    }

    // Revert: add the folder already a root.
    it('adds each folder returned that is not a root, through the roots write, and skips the others', async () => {
        await withRoots();
        panel = { ok: true, paths: ['/r/notes', '/r/new'] };
        const answer = await client.explorer.addFolders();

        expect(answer).toEqual({ ok: true, added: 1, skipped: ['/r/notes'], refused: '' });
        expect(posted.filter((one) => one.url === '/api/write').map((one) => one.body)).toEqual([
            { kind: 'roots', action: 'add', dir: '/r/new' }
        ]);
    });

    // Revert: send the add through the roots write whatever workspace is in force.
    it('adds a folder to a named workspace through the workspaces file, not the roots write', async () => {
        current = 'thesis';
        await withRoots();
        panel = { ok: true, paths: ['/r/new'] };
        await client.explorer.addFolders();

        expect(posted.filter((one) => one.body.kind === 'roots')).toEqual([]);
        expect(posted.filter((one) => one.body.action === 'add-root')).toHaveLength(1);
        expect(posted.find((one) => one.body.action === 'add-root')).toMatchObject({
            url: '/api/fs',
            body: { action: 'add-root', dir: '/r/new' }
        });
    });

    // Revert: send the remove through the workspaces file whatever workspace is in force.
    it('removes a folder of the default workspace through the roots write', async () => {
        await withRoots();
        await client.fs.removeRoot('notes');

        expect(posted.filter((one) => one.url === '/api/write').map((one) => one.body)).toEqual([
            { kind: 'roots', action: 'remove', key: 'notes' }
        ]);
    });

    // Revert: write after a cancelled panel.
    it('adds nothing when the panel is cancelled and says why when it did not open', async () => {
        await withRoots();
        expect(await client.explorer.addFolders()).toEqual({
            ok: true,
            added: 0,
            skipped: [],
            refused: ''
        });
        panel = { error: 'unsupported' };

        expect(await client.explorer.addFolders()).toEqual({ ok: false, picker: 'unsupported' });
        expect(posted.some((one) => one.url === '/api/write')).toBe(false);
    });

    // Revert: keep adding after the first refusal is lost.
    it('reports the first refusal of the writes', async () => {
        await withRoots();
        writeAnswer = { ok: false, error: 'root-held', changed: [], refused: [] };
        panel = { ok: true, paths: ['/r/a', '/r/b'] };

        expect(await client.explorer.addFolders()).toMatchObject({
            added: 0,
            refused: 'root-held'
        });
    });

    // Revert: open a Files tab for a folder outside every root.
    it('opens a Files tab rooted at a folder a root holds', async () => {
        await withRoots();
        panel = { ok: true, paths: ['/r/hub/projects/x'] };
        const opened = await client.explorer.openFolder();

        expect(opened).toEqual({
            ok: true,
            choice: { kind: 'inside', root: 'hub', path: 'projects/x' }
        });
        const files = allTabs().filter((one) => one.view === 'files');
        expect(files.length).toBe(1);
        expect(client.ui.instanceState(files[0]?.id ?? '')).toMatchObject({
            top: { root: 'hub', path: 'projects/x' }
        });
    });

    // Revert: write `outside` for a folder a root holds.
    it("says a folder outside every root on the page's Files tab and adds none", async () => {
        await withRoots();
        panel = { ok: true, paths: ['/elsewhere/x'] };
        const opened = await client.explorer.openFolder();

        expect(opened).toEqual({ ok: true, choice: { kind: 'outside', dir: '/elsewhere/x' } });
        const files = allTabs().filter((one) => one.view === 'files');
        expect(client.ui.instanceState(files[0]?.id ?? '')).toMatchObject({
            outside: '/elsewhere/x'
        });
        expect(posted.some((one) => one.url === '/api/write')).toBe(false);
    });

    // Revert: open a tab for a cancelled panel.
    it('does nothing for a cancelled panel', async () => {
        await withRoots();
        const before = allTabs().length;

        expect(await client.explorer.openFolder()).toEqual({ ok: true, choice: { kind: 'none' } });
        expect(allTabs().length).toBe(before);
    });
});

describe('the clipboard', () => {
    // Revert: keep the clipboard in clearClipboard.
    it('is emptied by clearClipboard, which is what Escape does to a Cut', () => {
        client.explorer.cut([{ root: 'hub', path: 'a.txt' }]);
        client.explorer.clearClipboard();

        expect(client.explorer.clipboard()).toBeNull();
    });
});

describe('the reads behind the Timeline', () => {
    // Revert: read the copies from the commits address.
    it('reads the copies of a file and the text of one', async () => {
        const read = client.fs.copies('hub', 'a.md');
        expect(read.loading).toBe(true);
        await settle();

        expect(client.fs.copies('hub', 'a.md')).toMatchObject({
            loading: false,
            copies: [{ id: '20260101T000000000', kind: 'save' }]
        });
        expect(await client.fs.copyText('hub', 'a.md', '20260101T000000000')).toBe('old text');
        expect(asked).toContain('/api/history?root=hub&path=a.md');
    });

    // Revert: read the commits for an empty repository.
    it('reads the commits of a file of a repository, and nothing for none', async () => {
        client.fs.commits('/r/hub', 'a.md', 'hub', 'a.md');
        await settle();

        expect(client.fs.commits('/r/hub', 'a.md', 'hub', 'a.md').commits[0]).toMatchObject({
            subject: 'Fix'
        });
        expect(client.fs.commits('', 'a.md', 'hub', 'a.md')).toEqual({
            commits: [],
            error: '',
            loading: false
        });
    });

    // Revert: serve a copy read for the file it is no longer asked for.
    it('reads again once the file was written', async () => {
        client.fs.copies('hub', 'a.md');
        await settle();
        const first = asked.filter((url) => url.startsWith('/api/history')).length;
        client.fs.bump('hub', 'a.md');
        client.fs.copies('hub', 'a.md');
        await settle();

        expect(asked.filter((url) => url.startsWith('/api/history')).length).toBe(first + 1);
    });
});
