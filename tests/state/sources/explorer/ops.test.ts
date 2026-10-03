// Layer 4, test. The explorer's file operations store (state/sources/explorer/ops.svelte.ts): the
// clipboard and the file selected for compare, the calls that post an operation to /api/ops and
// read the answer, the listings re-read after one, and the open tabs and bookmarks that follow a
// rename or a move.
//
// `fetch` is a stub of the case's own: /api/ops answers what the case gives it and records the
// body, the listings answer the entries the case holds, so nothing reaches a server or a disk.
// The questions are a call handed in (`confirm`), so a case answers yes or no for the page.
//
// What this does NOT cover: the questions drawn, the name input and the menu, which are
// tests/views/sources/files/ and are seen at the look; the server's side of any operation, which
// is tests/server/files/ops.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { OpsRequest } from '../../../../src/lib/data/file-ops.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { sourceTabState } from '../../../../src/lib/state/sessions/source.svelte.ts';
import { DIFF_VIEW } from '../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import { diffState } from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { createClientState, json, settle, type ClientState } from '../../../fixtures/client.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

type Body = Record<string, unknown>;

let client: ClientState;

/** Every POST to /api/ops, in order. */
let posted: Body[] = [];

/** Every other POST (the bookmarks' write path), in order. */
let written: Body[] = [];

/** Every address read, in order. */
let asked: string[] = [];

/** The bookmarks the stub answers, as entries of the collection. */
let bookmarks: { id: string; fields: Record<string, unknown> }[] = [];

/** What /api/ops answers to the nth post. */
let answers: ((body: Body, at: number) => Body | Promise<Body>)[] = [];

const ok = (paths: string[]): Body => ({ ok: true, paths });
const refused = (error: string, failed = '', done: string[] = []): Body => ({
    ok: false,
    error,
    done,
    failed
});

/** The stub: ops posts answered from `answers`, listings from what each folder holds. */
function serve(): void {
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
        if (url === '/api/ops') {
            const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as Body;
            posted.push(body);
            const answer = answers[Math.min(posted.length - 1, answers.length - 1)];
            const made = await answer(body, posted.length - 1);
            return json(made, made.ok === true ? 200 : 409);
        }
        asked.push(url);
        if (init?.method === 'POST') {
            written.push(JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Body);
            return json({ ok: true, changed: [], refused: [] });
        }
        if (url.includes('bookmarks=1')) {
            return json({
                entries: bookmarks.map((one, index) => ({
                    id: one.id,
                    title: one.id,
                    fields: { label: one.id, ...one.fields },
                    file: '',
                    index
                })),
                schema: [{ field: 'label', type: 'text' }]
            });
        }
        return json({ entries: [{ name: 'x.txt', kind: 'file', size: 1, mtime: 1 }] });
    });
}

/** Let the scheduled requests run and their answers land. */
/** The listing addresses asked since the last mark, for one folder. */
function listingsOf(root: string, path: string): string[] {
    return asked.filter((url) =>
        url.startsWith(`/api/fs?root=${root}&path=${encodeURIComponent(path)}`)
    );
}

const NOPE = (): Promise<boolean> => Promise.resolve(false);
const YES = (): Promise<boolean> => Promise.resolve(true);

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    client.writes.setToken('token');
    posted = [];
    written = [];
    asked = [];
    bookmarks = [];
    answers = [() => ok([])];
    serve();
});

afterEach(() => vi.unstubAllGlobals());

describe('the clipboard and the compare selection', () => {
    it('holds what was cut or copied, replacing the clipboard each time', () => {
        expect(client.explorer.clipboard()).toBeNull();
        client.explorer.copy([{ root: 'hub', path: 'a.md' }]);
        expect(client.explorer.clipboard()).toEqual({
            mode: 'copy',
            items: [{ root: 'hub', path: 'a.md' }]
        });
        client.explorer.cut([{ root: 'hub', path: 'b.md' }]);
        expect(client.explorer.clipboard()).toEqual({
            mode: 'cut',
            items: [{ root: 'hub', path: 'b.md' }]
        });
    });

    it('holds the file selected for compare, and gives it up when told', () => {
        expect(client.explorer.compareFile()).toBeNull();
        client.explorer.selectForCompare({ root: 'hub', path: 'a.md' });
        expect(client.explorer.compareFile()).toEqual({ root: 'hub', path: 'a.md' });
        client.explorer.selectForCompare(null);
        expect(client.explorer.compareFile()).toBeNull();
    });

    it("is the page's own: a second client holds none of it", () => {
        client.explorer.copy([{ root: 'hub', path: 'a.md' }]);
        expect(createClientState().explorer.clipboard()).toBeNull();
    });
});

describe('a paste', () => {
    const into = { root: 'hub', path: 'sub' };
    const item = { root: 'hub', path: 'a.md' };

    it('posts a cut as a move and a copy as a copy, into the folder, without replacing', async () => {
        client.explorer.cut([item]);
        await client.explorer.paste(into, NOPE);
        client.explorer.copy([item]);
        await client.explorer.paste(into, NOPE);
        expect(posted).toEqual([
            { op: 'paste', mode: 'move', items: [item], root: 'hub', path: 'sub', replace: false },
            { op: 'paste', mode: 'copy', items: [item], root: 'hub', path: 'sub', replace: false }
        ]);
    });

    // Revert: keep the clipboard after a cut paste that was answered ok.
    it('empties the clipboard after a cut paste answered ok', async () => {
        answers = [() => ok(['sub/a.md'])];
        client.explorer.cut([item]);
        const outcome = await client.explorer.paste(into, NOPE);
        expect(outcome).toEqual({ ok: true, paths: ['sub/a.md'] });
        expect(client.explorer.clipboard()).toBeNull();
    });

    // Revert: empty the clipboard only when the paste was answered ok.
    it('empties the clipboard after a cut paste answered missing, as VS Code does in a finally', async () => {
        answers = [() => refused('missing', 'a.md')];
        client.explorer.cut([item]);
        const outcome = await client.explorer.paste(into, NOPE);
        expect(outcome).toMatchObject({ ok: false, error: 'missing', failed: 'a.md' });
        expect(client.explorer.clipboard()).toBeNull();
    });

    // Revert: empty the clipboard after a copy paste.
    it('keeps the clipboard after a copy, however many pastes', async () => {
        answers = [() => ok(['sub/a copy.md'])];
        client.explorer.copy([item]);
        await client.explorer.paste(into, NOPE);
        await client.explorer.paste(into, NOPE);
        expect(posted).toHaveLength(2);
        expect(client.explorer.clipboard()).toEqual({ mode: 'copy', items: [item] });
    });

    it('pastes nothing when the clipboard is empty', async () => {
        const outcome = await client.explorer.paste(into, NOPE);
        expect(outcome.ok).toBe(true);
        expect(posted).toEqual([]);
    });

    // Revert: empty the clipboard when the replace question is cancelled.
    it('keeps a cut clipboard when the replace question is cancelled, and sends nothing more', async () => {
        answers = [() => refused('exists', 'a.md')];
        const confirm = vi.fn(NOPE);
        client.explorer.cut([item]);
        const outcome = await client.explorer.paste(into, confirm);
        expect(confirm).toHaveBeenCalledExactlyOnceWith({ kind: 'replace', name: 'a.md' });
        expect(posted).toHaveLength(1);
        expect(outcome.ok).toBe(false);
        expect(client.explorer.clipboard()).toEqual({ mode: 'cut', items: [item] });
    });

    // Revert: empty the clipboard when the paste answers network.
    it('keeps a cut clipboard when the request never reached the server, so the Cut can be pasted again', async () => {
        const confirm = vi.fn(YES);
        client.explorer.cut([item]);
        vi.stubGlobal('fetch', () => Promise.reject(new Error('down')));
        const outcome = await client.explorer.paste(into, confirm);
        expect(outcome).toMatchObject({ ok: false, error: 'network' });
        expect(confirm).not.toHaveBeenCalled();
        expect(client.explorer.clipboard()).toEqual({ mode: 'cut', items: [item] });
        serve();
        answers = [() => ok(['sub/a.md'])];
        expect(await client.explorer.paste(into, confirm)).toEqual({
            ok: true,
            paths: ['sub/a.md']
        });
        expect(client.explorer.clipboard()).toBeNull();
    });

    // Revert: send the second request without `replace: true`.
    it('opens the replace question on exists, and Replace resends with replace: true', async () => {
        answers = [(_body, at) => (at === 0 ? refused('exists', 'a.md') : ok(['sub/a.md']))];
        const confirm = vi.fn(YES);
        client.explorer.cut([item]);
        const outcome = await client.explorer.paste(into, confirm);
        expect(confirm).toHaveBeenCalledExactlyOnceWith({ kind: 'replace', name: 'a.md' });
        expect(posted.map((body) => body.replace)).toEqual([false, true]);
        expect(outcome).toEqual({ ok: true, paths: ['sub/a.md'] });
        expect(client.explorer.clipboard()).toBeNull();
    });

    it('does not ask the replace question for a refusal that is not exists', async () => {
        answers = [() => refused('into_itself', 'a')];
        const confirm = vi.fn(YES);
        client.explorer.copy([item]);
        const outcome = await client.explorer.paste(into, confirm);
        expect(confirm).not.toHaveBeenCalled();
        expect(outcome).toMatchObject({ ok: false, error: 'into_itself' });
    });
});

describe('a delete', () => {
    const items = [{ root: 'hub', path: 'a.md' }];

    it('posts the trash for the paths of a root', async () => {
        answers = [() => ok(['a.md'])];
        const outcome = await client.explorer.trash(items, NOPE);
        expect(posted).toEqual([{ op: 'trash', root: 'hub', paths: ['a.md'] }]);
        expect(outcome.ok).toBe(true);
    });

    // Revert: skip the permanent-delete question on trash_failed.
    it('opens the permanent-delete question on trash_failed, and yes sends delete with the failed path', async () => {
        answers = [(_body, at) => (at === 0 ? refused('trash_failed', 'a.md') : ok(['a.md']))];
        const confirm = vi.fn(YES);
        const outcome = await client.explorer.trash(items, confirm);
        expect(confirm).toHaveBeenCalledExactlyOnceWith({ kind: 'permanent', name: 'a.md' });
        expect(posted).toEqual([
            { op: 'trash', root: 'hub', paths: ['a.md'] },
            { op: 'delete', root: 'hub', paths: ['a.md'] }
        ]);
        expect(outcome.ok).toBe(true);
    });

    it('sends no delete when the permanent-delete question is answered no', async () => {
        answers = [() => refused('trash_failed', 'a.md')];
        const outcome = await client.explorer.trash(items, NOPE);
        expect(posted).toHaveLength(1);
        expect(outcome).toMatchObject({ ok: false, error: 'trash_failed' });
    });

    it('does not offer a permanent delete for any other refusal', async () => {
        answers = [() => refused('denied', 'a.md')];
        const confirm = vi.fn(YES);
        await client.explorer.trash(items, confirm);
        expect(confirm).not.toHaveBeenCalled();
        expect(posted).toHaveLength(1);
    });
});

describe('a create and a rename', () => {
    it('posts a create with the folder, the name and whether it is a folder, and answers the path', async () => {
        answers = [() => ({ ok: true, path: 'dir/a.md' })];
        const outcome = await client.explorer.create({ root: 'hub', path: 'dir' }, 'a.md', false);
        expect(posted).toEqual([
            { op: 'create', root: 'hub', path: 'dir', name: 'a.md', folder: false }
        ]);
        expect(outcome).toEqual({ ok: true, paths: ['dir/a.md'] });
    });

    it('posts a rename and answers the new path', async () => {
        answers = [() => ({ ok: true, path: 'dir/b.md' })];
        const outcome = await client.explorer.rename({ root: 'hub', path: 'dir/a.md' }, 'b.md');
        expect(posted).toEqual([{ op: 'rename', root: 'hub', path: 'dir/a.md', name: 'b.md' }]);
        expect(outcome).toEqual({ ok: true, paths: ['dir/b.md'] });
    });

    it('answers a refusal with its word, and an unreachable server as network', async () => {
        answers = [() => refused('exists')];
        expect(await client.explorer.rename({ root: 'hub', path: 'a.md' }, 'b.md')).toMatchObject({
            ok: false,
            error: 'exists'
        });
        vi.stubGlobal('fetch', () => Promise.reject(new Error('down')));
        expect(await client.explorer.rename({ root: 'hub', path: 'a.md' }, 'b.md')).toMatchObject({
            ok: false,
            error: 'network'
        });
    });
});

describe('the tabs and bookmarks that follow a rename or a move', () => {
    /** Open a source tab over a file, with a draft the reader has not saved. */
    function sourceTab(path: string, text = 'edited'): string {
        const id = client.layout.openView('source', sourceTabState('hub', path));
        client.ui.setInstanceState(id, {
            text,
            saved: 'orig',
            loaded: true,
            file: `hub/${path}`,
            error: '',
            message: ''
        });
        return id;
    }

    // Revert: restate the tab without keeping its draft, or without the draft's file.
    it('restates a source tab on dir/a.md to dir2/a.md and keeps its unsaved draft', async () => {
        const id = sourceTab('dir/a.md');
        answers = [() => ({ ok: true, path: 'dir2' })];
        await client.explorer.rename({ root: 'hub', path: 'dir' }, 'dir2');
        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'dir2/a.md'));
        expect(client.source.sourceDraft(id)).toMatchObject({
            text: 'edited',
            saved: 'orig',
            file: 'hub/dir2/a.md'
        });
        expect(client.source.sourceDirty(id)).toBe(true);
    });

    it('follows a path under a renamed folder at any depth, and leaves a sibling with the same prefix alone', async () => {
        const deep = sourceTab('dir/sub/d.md');
        const sibling = sourceTab('dirx/e.md');
        const other = sourceTab('other/c.md');
        answers = [() => ({ ok: true, path: 'dir2' })];
        await client.explorer.rename({ root: 'hub', path: 'dir' }, 'dir2');
        expect(client.layout.instanceLayoutState(deep)).toEqual(
            sourceTabState('hub', 'dir2/sub/d.md')
        );
        expect(client.layout.instanceLayoutState(sibling)).toEqual(
            sourceTabState('hub', 'dirx/e.md')
        );
        expect(client.layout.instanceLayoutState(other)).toEqual(
            sourceTabState('hub', 'other/c.md')
        );
    });

    it('relabels a tab on the renamed file, and keeps the label a bookmark gave a file tab', async () => {
        const source = sourceTab('dir/a.md');
        const marked = client.layout.openView('file', {
            root: 'hub',
            path: 'dir/a.md',
            label: 'My bookmark'
        });
        answers = [() => ({ ok: true, path: 'dir/b.md' })];
        await client.explorer.rename({ root: 'hub', path: 'dir/a.md' }, 'b.md');
        expect(client.layout.instanceLayoutState(source)).toEqual(
            sourceTabState('hub', 'dir/b.md')
        );
        expect(client.layout.instanceLayoutState(marked)).toEqual({
            root: 'hub',
            path: 'dir/b.md',
            label: 'My bookmark'
        });
    });

    // Revert: leave the against of a diff pane at the old path.
    it('follows a diff pane over two files, in its path and in its against', async () => {
        const state = diffState(
            {
                root: 'hub',
                path: 'x.md',
                staged: false,
                worktree: false,
                against: { root: 'hub', path: 'dir/b.md' }
            },
            'x.md vs b.md'
        );
        const id = client.layout.openView(DIFF_VIEW, state);
        answers = [() => ({ ok: true, path: 'dir2' })];
        await client.explorer.rename({ root: 'hub', path: 'dir' }, 'dir2');
        const held = client.layout.instanceLayoutState(id) as Record<string, unknown>;
        expect(held.against).toEqual({ root: 'hub', path: 'dir2/b.md' });
        expect(held.path).toBe('x.md');
        expect(held.id).toBe(
            diffState(
                {
                    root: 'hub',
                    path: 'x.md',
                    staged: false,
                    worktree: false,
                    against: { root: 'hub', path: 'dir2/b.md' }
                },
                ''
            ).id
        );
    });

    // Revert: leave the reader's bookmark at the old path.
    it("rewrites the reader's bookmark over the renamed file", async () => {
        bookmarks = [{ id: 'notes', fields: { root: 'hub', path: 'dir/a.md' } }];
        client.fs.bookmarks();
        await settle();
        answers = [() => ({ ok: true, path: 'dir2' })];
        await client.explorer.rename({ root: 'hub', path: 'dir' }, 'dir2');
        await settle();
        expect(written).toEqual([
            {
                kind: 'entry',
                collection: 'bookmarks',
                id: 'notes',
                fields: { root: 'hub', path: 'dir2/a.md' }
            }
        ]);
    });

    // Revert: leave the tree records of a tab out of `followTabs` in
    // state/sources/explorer/ops.svelte.ts.
    it('restates the open folders, the selection and the anchor of a card tree under a renamed folder', async () => {
        const tab = sourceTab('other/c.md');
        const key = `${tab}#files:alpha`;
        client.ui.setInstanceState(key, {
            expanded: [
                'hub:projects/alpha',
                'hub:projects/alpha/code',
                'hub:projects/alpha/code/sub',
                'hub:projects/alpha/codex'
            ],
            selected: { root: 'hub', path: 'projects/alpha/code/a.py' },
            selection: [
                { root: 'hub', path: 'projects/alpha/code/a.py' },
                { root: 'hub', path: 'projects/alpha/notes.md' }
            ],
            anchor: { root: 'hub', path: 'projects/alpha/code/a.py' },
            filter: ''
        });
        answers = [() => ({ ok: true, path: 'projects/alpha/src' })];

        await client.explorer.rename({ root: 'hub', path: 'projects/alpha/code' }, 'src');

        expect(client.ui.instanceState(key)).toMatchObject({
            expanded: [
                'hub:projects/alpha',
                'hub:projects/alpha/src',
                'hub:projects/alpha/src/sub',
                'hub:projects/alpha/codex'
            ],
            selected: { root: 'hub', path: 'projects/alpha/src/a.py' },
            selection: [
                { root: 'hub', path: 'projects/alpha/src/a.py' },
                { root: 'hub', path: 'projects/alpha/notes.md' }
            ],
            anchor: { root: 'hub', path: 'projects/alpha/src/a.py' }
        });
    });

    it('restates the card tree records of every project of a tab, and leaves a record of no tab', async () => {
        const tab = sourceTab('other/c.md');
        const mine = `${tab}#files:alpha`;
        const second = `${tab}#files:beta`;
        const orphan = 'gone-tab#files:alpha';
        for (const key of [mine, second, orphan]) {
            client.ui.setInstanceState(key, { expanded: ['hub:projects/alpha/code'] });
        }
        answers = [() => ({ ok: true, path: 'projects/alpha/src' })];

        await client.explorer.rename({ root: 'hub', path: 'projects/alpha/code' }, 'src');

        for (const key of [mine, second]) {
            expect(client.ui.instanceState(key)).toMatchObject({
                expanded: ['hub:projects/alpha/src']
            });
        }
        expect(client.ui.instanceState(orphan)).toEqual({ expanded: ['hub:projects/alpha/code'] });
    });

    it('follows a move by a cut paste, to the path the server answered', async () => {
        const id = sourceTab('a.md');
        answers = [() => ok(['sub/a.md'])];
        client.explorer.cut([{ root: 'hub', path: 'a.md' }]);
        await client.explorer.paste({ root: 'hub', path: 'sub' }, NOPE);
        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'sub/a.md'));
    });

    it('leaves a tab alone after a copy, and after a refusal', async () => {
        const id = sourceTab('a.md');
        answers = [() => ok(['sub/a.md'])];
        client.explorer.copy([{ root: 'hub', path: 'a.md' }]);
        await client.explorer.paste({ root: 'hub', path: 'sub' }, NOPE);
        answers = [() => refused('exists')];
        await client.explorer.rename({ root: 'hub', path: 'a.md' }, 'b.md');
        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'a.md'));
    });

    it('leaves a tab over a trashed file open on its file', async () => {
        const id = sourceTab('a.md');
        answers = [() => ok(['a.md'])];
        await client.explorer.trash([{ root: 'hub', path: 'a.md' }], NOPE);
        expect(client.layout.instanceLayoutState(id)).toEqual(sourceTabState('hub', 'a.md'));
    });
});

describe('an answer that lands late', () => {
    // Revert: restate the instances found before the request was sent.
    it('changes no state of a tab that was closed while the rename was out', async () => {
        const id = client.layout.openView('source', sourceTabState('hub', 'dir/a.md'));
        client.ui.setInstanceState(id, {
            text: 't',
            saved: 't',
            loaded: true,
            file: 'hub/dir/a.md'
        });
        const kept = client.layout.openView('source', sourceTabState('hub', 'dir/b.md'));
        client.ui.setInstanceState(kept, {
            text: 'k',
            saved: 'k',
            loaded: true,
            file: 'hub/dir/b.md'
        });
        let land: (answer: Body) => void = () => undefined;
        answers = [
            () =>
                new Promise<Body>((done) => {
                    land = done;
                })
        ];
        const pending = client.explorer.rename({ root: 'hub', path: 'dir' }, 'dir2');
        await settle();
        client.layout.closeInstance(id);
        land({ ok: true, path: 'dir2' });
        await pending;
        expect(client.layout.instanceLayoutState(id)).toBeUndefined();
        expect(client.ui.instanceState(id)).toBeUndefined();
        expect(client.layout.instanceLayoutState(kept)).toEqual(sourceTabState('hub', 'dir2/b.md'));
        expect(client.source.sourceDraft(kept).file).toBe('hub/dir2/b.md');
    });
});

describe('the listings an operation changed', () => {
    /** Read the folders once, so each is held and a later read asks only if it was marked. */
    async function hold(...folders: [string, string][]): Promise<void> {
        for (const [root, path] of folders) await client.fs.readListing(root, path);
        asked = [];
    }

    // Revert: re-read no listing after an answer.
    it('reads again the folder a create was made in, and no other', async () => {
        await hold(['hub', 'dir'], ['hub', 'other']);
        answers = [() => ({ ok: true, path: 'dir/a.md' })];
        await client.explorer.create({ root: 'hub', path: 'dir' }, 'a.md', false);
        await client.fs.readListing('hub', 'dir');
        await client.fs.readListing('hub', 'other');
        expect(listingsOf('hub', 'dir')).toHaveLength(1);
        expect(listingsOf('hub', 'other')).toHaveLength(0);
    });

    it('reads again every toggle form of the folder', async () => {
        const forms = [
            { hidden: false, ignored: false },
            { hidden: true, ignored: false },
            { hidden: false, ignored: true },
            { hidden: true, ignored: true }
        ];
        for (const form of forms) await client.fs.readListing('hub', 'dir', form);
        asked = [];
        answers = [() => ({ ok: true, path: 'dir/a.md' })];
        await client.explorer.create({ root: 'hub', path: 'dir' }, 'a.md', false);
        for (const form of forms) await client.fs.readListing('hub', 'dir', form);
        expect(listingsOf('hub', 'dir')).toHaveLength(4);
    });

    it('reads again the folders a rename and a move touched: the one it left and the one it entered', async () => {
        await hold(['hub', 'a'], ['hub', 'b'], ['hub', 'c']);
        answers = [() => ok(['b/x.md'])];
        client.explorer.cut([{ root: 'hub', path: 'a/x.md' }]);
        await client.explorer.paste({ root: 'hub', path: 'b' }, NOPE);
        for (const folder of ['a', 'b', 'c']) await client.fs.readListing('hub', folder);
        expect(listingsOf('hub', 'a')).toHaveLength(1);
        expect(listingsOf('hub', 'b')).toHaveLength(1);
        expect(listingsOf('hub', 'c')).toHaveLength(0);
    });

    // Revert: share one re-read list between two operations in flight.
    it('has each of two pastes in flight re-read its own folders', async () => {
        await hold(['hub', 'a'], ['hub', 'b'], ['hub', 'c']);
        const landing: ((answer: Body) => void)[] = [];
        answers = [
            () =>
                new Promise<Body>((done) => {
                    landing.push(done);
                })
        ];
        client.explorer.copy([{ root: 'hub', path: 'src.md' }]);
        const first = client.explorer.paste({ root: 'hub', path: 'a' }, NOPE);
        const second = client.explorer.paste({ root: 'hub', path: 'b' }, NOPE);
        await settle();
        expect(posted).toHaveLength(2);
        landing[1](ok(['b/src.md']));
        await second;
        for (const folder of ['a', 'b', 'c']) await client.fs.readListing('hub', folder);
        expect(listingsOf('hub', 'b')).toHaveLength(1);
        expect(listingsOf('hub', 'a')).toHaveLength(0);
        landing[0](ok(['a/src.md']));
        await first;
        for (const folder of ['a', 'b', 'c']) await client.fs.readListing('hub', folder);
        expect(listingsOf('hub', 'a')).toHaveLength(1);
        expect(listingsOf('hub', 'b')).toHaveLength(1);
        expect(listingsOf('hub', 'c')).toHaveLength(0);
    });

    it('sends a second paste while one is in flight, and does not hold it back', async () => {
        const landing: ((answer: Body) => void)[] = [];
        answers = [
            () =>
                new Promise<Body>((done) => {
                    landing.push(done);
                })
        ];
        client.explorer.copy([{ root: 'hub', path: 'src.md' }]);
        const first = client.explorer.paste({ root: 'hub', path: 'a' }, NOPE);
        const second = client.explorer.paste({ root: 'hub', path: 'a' }, NOPE);
        await settle();
        expect(posted).toHaveLength(2);
        landing.forEach((done) => done(ok(['a/src.md'])));
        await Promise.all([first, second]);
    });
});

describe('whether a delete would lose text', () => {
    /** Open a source tab over a file whose draft differs from what is saved. */
    function dirtyTab(path: string, dirty = true): string {
        const id = client.layout.openView('source', sourceTabState('hub', path));
        client.ui.setInstanceState(id, {
            text: dirty ? 'edited' : 'orig',
            saved: 'orig',
            loaded: true,
            file: `hub/${path}`
        });
        return id;
    }

    // Revert: answer false whatever the open tabs hold.
    it('is true for a file with an unsaved draft and false for a file whose draft is saved', () => {
        dirtyTab('dir/a.md');
        dirtyTab('dir/b.md', false);
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir/a.md' }, false)).toBe(true);
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir/b.md' }, false)).toBe(false);
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir/c.md' }, false)).toBe(false);
    });

    // Revert: match a folder by string prefix without the separator, or not at all.
    it('is true for a folder holding a file with an unsaved draft, and not for a sibling with its prefix', () => {
        dirtyTab('dir/sub/a.md');
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir' }, true)).toBe(true);
        expect(client.explorer.unsaved({ root: 'hub', path: 'di' }, true)).toBe(false);
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir/sub/a.md' }, true)).toBe(true);
        expect(client.explorer.unsaved({ root: 'hub', path: 'dir' }, false)).toBe(false);
        expect(client.explorer.unsaved({ root: 'other', path: 'dir' }, true)).toBe(false);
    });
});

describe('the source tabs a replace and its undo read again', () => {
    /** The text each file holds on disk now, which a tab reads when it reads again. */
    let disk: Record<string, string> = {};

    /** The stub of `serve`, with the file route answering `disk` and an undo that changed files. */
    function serveFiles(): void {
        const base = fetch;
        vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
            if (url.startsWith('/api/file/')) {
                return new Response(disk[decodeURIComponent(url.slice('/api/file/'.length))] ?? '');
            }
            if (url === '/api/write' && (init?.body as string).includes('"undo"')) {
                return json({ ok: true, changed: ['a.md'], refused: [] });
            }
            return base(url, init);
        });
    }

    /** Open a source tab over `hub/<path>` holding `text`, saved as `saved`. */
    function tab(path: string, text: string, saved = 'old'): string {
        const id = client.layout.openView('source', sourceTabState('hub', path));
        client.ui.setInstanceState(id, { text, saved, loaded: true, file: `hub/${path}` });
        return id;
    }

    const request: Extract<OpsRequest, { op: 'replace' }> = {
        op: 'replace',
        query: { q: 'old', word: false, case: false, regex: false, under: '' },
        replace: 'new',
        preserveCase: false,
        items: [{ root: 'hub', path: 'a.md', hits: [{ line: 1, at: 0, match: 'old' }] }]
    };

    beforeEach(() => {
        disk = { 'hub/a.md': 'new', 'hub/b.md': 'new' };
        serveFiles();
    });

    it('shows the replaced text in a clean tab, and keeps the text typed in a tab with unsaved text', async () => {
        const clean = tab('a.md', 'old');
        const typed = tab('b.md', 'typed in the tab');
        answers = [() => ok(['hub/a.md', 'hub/b.md'])];
        await client.explorer.replace(request);
        await settle();
        expect(client.source.sourceDraft(clean)).toMatchObject({ text: 'new', saved: 'new' });
        expect(client.source.sourceDraft(typed)).toMatchObject({
            text: 'typed in the tab',
            saved: 'old'
        });
    });

    it('reads again the files a refused replace wrote before it stopped, and none it did not', async () => {
        const done = tab('a.md', 'old');
        const left = tab('c.md', 'old');
        disk['hub/c.md'] = 'untouched on disk';
        answers = [() => refused('changed', 'hub/c.md', ['hub/a.md'])];
        await client.explorer.replace(request);
        await settle();
        expect(client.source.sourceDraft(done).text).toBe('new');
        expect(client.source.sourceDraft(left).text).toBe('old');
    });

    it('shows the old text in a clean tab after the undo of a replace, and keeps typed text', async () => {
        const clean = tab('a.md', 'new', 'new');
        const typed = tab('b.md', 'typed in the tab', 'new');
        disk = { 'hub/a.md': 'old', 'hub/b.md': 'old' };
        const stamp = (path: string) => ({ path: `/r/hub/${path}` });
        await client.explorer.undoFile(
            {
                at: '1',
                kind: 'files',
                undo: 'file',
                field: 'replace',
                before: ['a.md', 'b.md'].map(stamp),
                after: ['a.md', 'b.md'].map(stamp)
            },
            [{ key: 'hub', dir: '/r/hub', fixed: true }]
        );
        await settle();
        expect(client.source.sourceDraft(clean)).toMatchObject({ text: 'old', saved: 'old' });
        expect(client.source.sourceDraft(typed)).toMatchObject({ text: 'typed in the tab' });
    });
});
