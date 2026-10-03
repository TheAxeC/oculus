// The source tab's pure access and identity rules plus its GET and authenticated POST requests.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    loadHeadFile,
    loadSource,
    loadSourceReadonly,
    sourceFileUrl,
    sourceInfoUrl,
    sourceTabState
} from '../../../src/lib/state/sessions/source.svelte.ts';
import { headTabState } from '../../../src/lib/state/sources/repositories/file-git.ts';
import { stateId } from '../../../src/lib/state/workbench/layout/instance.ts';
import { TEXT_LIMIT } from '../../../src/lib/state/sources/fs.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { fields, scalar } from '../../../src/lib/data/helpers/guards.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let saveSource: ClientState['source']['saveSource'];
let loadSourceDraft: ClientState['source']['loadSourceDraft'];
let editSourceDraft: ClientState['source']['editSourceDraft'];
let saveSourceDraft: ClientState['source']['saveSourceDraft'];
let sourceDraft: ClientState['source']['sourceDraft'];
let sourceDirty: ClientState['source']['sourceDirty'];
let toggleSourceRendered: ClientState['source']['toggleSourceRendered'];
let setToken: ClientState['writes']['setToken'];
let loadUi: ClientState['ui']['loadUi'];

beforeEach(() => {
    client = createClientState();
    ({
        saveSource,
        loadSourceDraft,
        editSourceDraft,
        saveSourceDraft,
        sourceDraft,
        sourceDirty,
        toggleSourceRendered
    } = client.source);
    ({ setToken } = client.writes);
    ({ loadUi } = client.ui);
});

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));

describe('source tab state', () => {
    it('identifies a tab by root and path and labels it with the file name', () => {
        expect(sourceTabState('hub', 'feeds/literature-radar.yml')).toEqual({
            root: 'hub',
            path: 'feeds/literature-radar.yml',
            label: 'literature-radar.yml'
        });
        expect(sourceFileUrl('hub', 'folder/a b.md')).toBe('/api/file/hub/folder/a%20b.md');
        expect(sourceInfoUrl('hub', 'folder/a b.md')).toBe(
            '/api/source?root=hub&path=folder%2Fa%20b.md'
        );
        expect(stateId(sourceTabState('hub', 'feeds/literature-radar.yml'))).toBe(
            JSON.stringify(['hub', 'feeds/literature-radar.yml'])
        );
    });

    it('carries the line a caller opened the file at, and none when no caller named one', () => {
        expect(sourceTabState('hub', 'src/a.ts', 12)).toEqual({
            root: 'hub',
            path: 'src/a.ts',
            label: 'a.ts',
            line: 12
        });
        expect('line' in sourceTabState('hub', 'src/a.ts')).toBe(false);
    });

    it('distinguishes roots, paths, and delimiters in file identities', () => {
        const pairs = [
            ['a', 'c'],
            ['b', 'c'],
            ['a', 'd'],
            ['a:b', 'c'],
            ['a', 'b:c']
        ];
        const ids = pairs.map(([root, path]) => stateId(sourceTabState(root, path)));
        expect(new Set(ids).size).toBe(pairs.length);
        for (let at = 0; at < pairs.length; at++) {
            expect(ids[at]).toBe(JSON.stringify(pairs[at]));
        }
    });

    it('acknowledges the sent copy when typing continues during a pending save', async () => {
        const post = Promise.withResolvers<Response>();
        const fetcher = vi.fn((_url: string, init?: RequestInit) =>
            init === undefined ? Promise.resolve(new Response('on disk')) : post.promise
        );
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await loadSourceDraft('one', 'hub', 'notes.md');
        editSourceDraft('one', 'sent copy');
        const saving = saveSourceDraft('one', 'hub', 'notes.md');
        editSourceDraft('one', 'typed while saving');
        expect(sourceDraft('one').saved).toBe('on disk');
        const sent = fetcher.mock.calls.find((call) => call[1] !== undefined);
        expect(fields(JSON.parse(scalar(sent?.[1]?.body))).content).toBe('sent copy');
        post.resolve(new Response(JSON.stringify({ ok: true })));
        await saving;
        expect(sourceDraft('one')).toMatchObject({
            text: 'typed while saving',
            saved: 'sent copy'
        });
    });

    it('shares a pending initial read across remounts', async () => {
        const read = Promise.withResolvers<Response>();
        const fetcher = vi.fn(() => read.promise);
        vi.stubGlobal('fetch', fetcher);
        const first = loadSourceDraft('one', 'hub', 'notes.md');
        const second = loadSourceDraft('one', 'hub', 'notes.md');
        // One read of the text and one of the file's own facts; the second mount asks for neither.
        expect(fetcher).toHaveBeenCalledTimes(2);
        read.resolve(new Response('disk'));
        await Promise.all([first, second]);
        editSourceDraft('one', 'unsaved');
        await loadSourceDraft('one', 'hub', 'notes.md');
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(sourceDraft('one').text).toBe('unsaved');
    });

    it('holds what the route says about the file, and locks the tab when it is read-only', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    url.startsWith('/api/source')
                        ? new Response(JSON.stringify({ ok: true, readonly: true }), {
                              headers: { 'content-type': 'application/json' }
                          })
                        : new Response('locked text\n')
                )
            )
        );
        await loadSourceDraft('one', 'hub', 'script.py');

        expect(sourceDraft('one')).toMatchObject({
            text: 'locked text\n',
            readonly: true,
            truncated: false
        });
    });

    it('sends no save at all for a file the route called read-only, and says why', async () => {
        const fetcher = vi.fn((url: string) =>
            Promise.resolve(
                url.startsWith('/api/source')
                    ? new Response(JSON.stringify({ ok: true, readonly: true }), {
                          headers: { 'content-type': 'application/json' }
                      })
                    : new Response('locked text\n')
            )
        );
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await loadSourceDraft('one', 'hub', 'script.py');
        const before = fetcher.mock.calls.length;
        await saveSourceDraft('one', 'hub', 'script.py');

        expect(fetcher.mock.calls.length).toBe(before);
        expect(sourceDraft('one').message).toBe(catalog['source.readonly']);
    });

    it('locks the tab when a save is refused because the mode changed under it', async () => {
        const fetcher = vi.fn((url: string, init?: RequestInit) => {
            if (init !== undefined) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            ok: false,
                            error: 'readonly',
                            refused: [{ field: 'path', reason: 'readonly' }]
                        }),
                        { status: 403 }
                    )
                );
            }
            return Promise.resolve(
                url.startsWith('/api/source')
                    ? new Response(JSON.stringify({ ok: true, readonly: false }), {
                          headers: { 'content-type': 'application/json' }
                      })
                    : new Response('before\n')
            );
        });
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await loadSourceDraft('one', 'hub', 'notes.md');
        editSourceDraft('one', 'after\n');
        await saveSourceDraft('one', 'hub', 'notes.md');

        expect(sourceDraft('one')).toMatchObject({
            readonly: true,
            message: catalog['source.readonly'],
            text: 'after\n'
        });
    });

    it('sends no save for a file the read had to cut, which would take the rest off the disk', async () => {
        const body = 'x'.repeat(TEXT_LIMIT + 10);
        const fetcher = vi.fn((url: string) =>
            Promise.resolve(
                url.startsWith('/api/source')
                    ? new Response(JSON.stringify({ ok: true, readonly: false }), {
                          headers: { 'content-type': 'application/json' }
                      })
                    : new Response(body)
            )
        );
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await loadSourceDraft('one', 'hub', 'big.log');
        const before = fetcher.mock.calls.length;
        await saveSourceDraft('one', 'hub', 'big.log');

        expect(sourceDraft('one').truncated).toBe(true);
        expect(sourceDraft('one').text.length).toBe(TEXT_LIMIT);
        expect(fetcher.mock.calls.length).toBe(before);
        expect(sourceDraft('one').message).toBe(catalog['source.truncated']);
    });

    it('returns a path refusal without retrying it as a stale token', async () => {
        const refused = [{ field: 'path', reason: 'readonly' }];
        const fetcher = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ ok: false, error: refused[0].reason, refused }), {
                    status: 403
                })
            )
        );
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await expect(saveSource('hub', 'script.py', 'replacement')).resolves.toMatchObject({
            ok: false,
            refused
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('keeps the rendered half per instance, on until the toggle says otherwise', () => {
        expect(sourceDraft('one').rendered).toBe(true);

        toggleSourceRendered('one');
        expect(sourceDraft('one').rendered).toBe(false);
        // The other tab knows nothing of it, which is what per instance means.
        expect(sourceDraft('two').rendered).toBe(true);

        // Typing and reverting are the draft's other writes, and neither touches the toggle.
        editSourceDraft('one', 'typed');
        expect(sourceDraft('one')).toMatchObject({ text: 'typed', rendered: false });

        toggleSourceRendered('one');
        expect(sourceDraft('one').rendered).toBe(true);
    });

    it('keeps the blame per instance, off until the toggle turns it on', () => {
        expect(sourceDraft('one').blame).toBe(false);
        client.source.toggleSourceBlame('one');
        expect(sourceDraft('one').blame).toBe(true);
        expect(sourceDraft('two').blame).toBe(false);
        editSourceDraft('one', 'typed');
        expect(sourceDraft('one')).toMatchObject({ text: 'typed', blame: true });
        client.source.toggleSourceBlame('one');
        expect(sourceDraft('one').blame).toBe(false);
    });

    it('keeps the language and the indentation chosen from the status bar per instance, and drops them for another file', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('text\n')));
        expect(sourceDraft('one')).toMatchObject({ language: '', indent: null });
        client.source.setSourceLanguage('one', 'python');
        client.source.setSourceIndent('one', { tabs: true, size: 8 });
        expect(sourceDraft('one')).toMatchObject({
            language: 'python',
            indent: { tabs: true, size: 8 }
        });
        expect(sourceDraft('two')).toMatchObject({ language: '', indent: null });
        await loadSourceDraft('one', 'hub', 'a.txt');
        client.source.setSourceLanguage('one', 'yaml');
        // The same file asked for again keeps the choice; a tab pointed at another file drops it.
        await loadSourceDraft('one', 'hub', 'a.txt');
        expect(sourceDraft('one').language).toBe('yaml');
        await loadSourceDraft('one', 'hub', 'b.txt');
        expect(sourceDraft('one')).toMatchObject({ language: '', indent: null });
        // An indentation kept wrongly in storage is read as none.
        client.ui.setInstanceState('three', { indent: { tabs: 'no', size: 4 } });
        expect(sourceDraft('three').indent).toBe(null);
        client.ui.setInstanceState('three', { indent: { tabs: false, size: 99 } });
        expect(sourceDraft('three').indent).toBe(null);
    });

    it('loads complete text through the existing file route', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response('body\n')))
        );
        await expect(loadSource('hub', 'notes/read me.md')).resolves.toEqual({
            ok: true,
            content: 'body\n',
            truncated: false
        });
        expect(fetch).toHaveBeenCalledWith('/api/file/hub/notes/read%20me.md');
    });

    it('saves complete text through the authenticated source route', async () => {
        const requests: { url: string; init: RequestInit }[] = [];
        vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
            requests.push({ url, init });
            return Promise.resolve(new Response(JSON.stringify({ ok: true })));
        });
        setToken('source-token');
        await expect(saveSource('hub', 'notes/a.md', 'replacement\n')).resolves.toMatchObject({
            ok: true
        });
        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('/api/source');
        expect(requests[0].init.headers).toEqual({
            'content-type': 'application/json',
            'x-oculus-token': 'source-token'
        });
        expect(JSON.parse(scalar(requests[0].init.body))).toEqual({
            root: 'hub',
            path: 'notes/a.md',
            content: 'replacement\n'
        });
    });
});

describe('a save tells the LaTeX store which file was written', () => {
    // Revert: drop the `saved(root, path)` call after `answer.ok` in saveSource of
    // state/sessions/source.svelte.ts.
    it('does so once the write succeeded, with the root and the path', async () => {
        const saved = vi.spyOn(client.latex, 'onSaved').mockResolvedValue(undefined);
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ ok: true }))));
        setToken('source-token');

        await saveSource('docs', 'proposal/c.tex', 'text');

        expect(saved).toHaveBeenCalledExactlyOnceWith('docs', 'proposal/c.tex');
    });

    it('does not when the write was refused', async () => {
        const saved = vi.spyOn(client.latex, 'onSaved').mockResolvedValue(undefined);
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ ok: false, error: 'readonly' }), { status: 403 })
            )
        );
        setToken('source-token');

        await saveSource('docs', 'proposal/c.tex', 'text');

        expect(saved).not.toHaveBeenCalled();
    });
});

describe('the unsaved-text rule a close asks', () => {
    it('answers no for an instance with no draft and for a draft nothing has edited', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('on disk\n')));
        expect(sourceDirty('never-opened')).toBe(false);
        await loadSourceDraft('tab', 'hub', 'notes.md');
        expect(sourceDraft('tab').text).toBe('on disk\n');
        expect(sourceDirty('tab')).toBe(false);
    });

    it('answers yes once the working text differs from the saved text, and no again after a save', async () => {
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
            Promise.resolve(
                new Response(init === undefined ? 'on disk\n' : JSON.stringify({ ok: true }))
            )
        );
        setToken('source-token');
        await loadSourceDraft('tab', 'hub', 'notes.md');
        editSourceDraft('tab', 'typed over it\n');
        expect(sourceDirty('tab')).toBe(true);
        await saveSourceDraft('tab', 'hub', 'notes.md');
        expect(sourceDirty('tab')).toBe(false);
    });

    it('is what the ui store answers for an instance id, which is what the pane asks', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('on disk\n')));
        await loadSourceDraft('tab', 'hub', 'notes.md');
        expect(client.ui.unsaved('tab')).toBe(false);
        editSourceDraft('tab', 'typed over it\n');
        expect(client.ui.unsaved('tab')).toBe(true);
        expect(client.ui.unsaved('another-view')).toBe(false);
    });
});

// A save's answer belongs to the draft it was sent from: a tab closed while the save was out, and a
// preview tab pointed at another file while it was out, take no write from it when it lands.
describe('a save whose draft went while it was out', () => {
    /** A fetch that reads every file as its own path and holds every save until it is released. */
    function heldSaves(): (answer: Response) => void {
        const post = Promise.withResolvers<Response>();
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) =>
            init === undefined ? Promise.resolve(new Response(`on disk at ${url}`)) : post.promise
        );
        setToken('source-token');
        return post.resolve;
    }

    it('writes nothing under a tab its pane closed', async () => {
        // Revert: drop the whole guard after the save's await in saveSourceDraft. Either half holds
        // this case alone: the record is gone, and the draft left names no file.
        const release = heldSaves();
        client.layout.apply({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    {
                        kind: 'pane',
                        tabs: [{ id: 'one', view: 'source', state: null }],
                        active: 'one'
                    },
                    {
                        kind: 'pane',
                        tabs: [{ id: 'two', view: 'status', state: null }],
                        active: 'two'
                    }
                ]
            }
        });
        await loadSourceDraft('one', 'hub', 'notes.md');
        editSourceDraft('one', 'sent copy');
        const saving = saveSourceDraft('one', 'hub', 'notes.md');

        client.layout.closePane([0]);
        expect(client.ui.instanceState('one')).toBeUndefined();
        release(new Response(JSON.stringify({ ok: true })));
        await saving;

        expect(client.ui.instanceState('one')).toBeUndefined();
    });

    it('writes nothing under a closed tab whose draft was never read, so names no file', async () => {
        // Revert: drop `ui.instanceState(id) === undefined ||` from saveSourceDraft's guard.
        const release = heldSaves();
        client.layout.apply({
            root: {
                kind: 'pane',
                tabs: [{ id: 'one', view: 'source', state: null }],
                active: 'one'
            }
        });
        editSourceDraft('one', 'typed before any read');
        const saving = saveSourceDraft('one', 'hub', 'notes.md');

        client.layout.closeInstance('one');
        expect(client.ui.instanceState('one')).toBeUndefined();
        release(new Response(JSON.stringify({ ok: true })));
        await saving;

        expect(client.ui.instanceState('one')).toBeUndefined();
    });

    it("leaves the next file's draft alone in a preview tab pointed at it", async () => {
        // Revert: drop `|| sourceDraft(id).file !== draft.file` from saveSourceDraft's guard.
        const release = heldSaves();
        const state = (path: string) => ({ root: 'hub', path, label: path });
        const tab = client.layout.openView('source', state('a.md'), undefined, { preview: true });
        await loadSourceDraft(tab, 'hub', 'a.md');
        editSourceDraft(tab, 'typed into a.md');
        const saving = saveSourceDraft(tab, 'hub', 'a.md');

        expect(client.layout.openView('source', state('b.md'), undefined, { preview: true })).toBe(
            tab
        );
        await loadSourceDraft(tab, 'hub', 'b.md');
        release(new Response(JSON.stringify({ ok: true })));
        await saving;

        expect(sourceDraft(tab)).toMatchObject({
            file: 'hub/b.md',
            text: 'on disk at /api/file/hub/b.md',
            saved: 'on disk at /api/file/hub/b.md',
            message: ''
        });
        expect(sourceDirty(tab)).toBe(false);
    });
});

describe('a draft read from an instance state of the wrong shape', () => {
    const NO_DRAFT = {
        text: '',
        saved: '',
        loaded: false,
        readIn: undefined,
        error: '',
        message: '',
        failed: false,
        rendered: true,
        blame: false,
        readonly: false,
        truncated: false,
        file: '',
        language: '',
        indent: null,
        wrap: null
    };

    it.each([
        [
            'a text that is a number, a read-in that is null, a rendered flag that is a string',
            { text: 3, readIn: null, rendered: 'no', language: 3 },
            NO_DRAFT
        ],
        [
            'flags that are truthy and not true',
            { loaded: 1, failed: 'true', blame: 1, readonly: 'x', truncated: 1, rendered: 0 },
            NO_DRAFT
        ],
        ['a list', [], NO_DRAFT],
        ['a string', 'x', NO_DRAFT],
        ['null', null, NO_DRAFT],
        ['nothing held', undefined, NO_DRAFT],
        [
            'every field of its type',
            {
                text: 't',
                saved: 's',
                loaded: true,
                readIn: 'r',
                error: 'e',
                message: 'm',
                failed: true,
                rendered: false,
                blame: true,
                readonly: true,
                truncated: true,
                file: 'f',
                language: 'l',
                indent: { tabs: false, size: 2 }
            },
            {
                text: 't',
                saved: 's',
                loaded: true,
                readIn: 'r',
                error: 'e',
                message: 'm',
                failed: true,
                rendered: false,
                blame: true,
                readonly: true,
                truncated: true,
                file: 'f',
                language: 'l',
                indent: { tabs: false, size: 2 },
                wrap: null
            }
        ]
    ])('answers %s as the draft it names, with every key present', (_name, held, expected) => {
        client.ui.setInstanceState('one', held);
        const draft = sourceDraft('one');
        expect(draft).toStrictEqual(expected);
        expect(Object.keys(draft).toSorted()).toStrictEqual(Object.keys(NO_DRAFT).toSorted());
    });

    it.each([
        ['tabs and a size of 4', { tabs: true, size: 4 }, { tabs: true, size: 4 }],
        ['no tabs and a size of 1', { tabs: false, size: 1 }, { tabs: false, size: 1 }],
        ['tabs and a size of 8', { tabs: true, size: 8 }, { tabs: true, size: 8 }],
        ['a key beyond the two', { tabs: true, size: 4, extra: 1 }, { tabs: true, size: 4 }],
        ['tabs that are a string', { tabs: 'yes', size: 4 }, null],
        ['a size of 9', { tabs: true, size: 9 }, null],
        ['a size of 0', { tabs: false, size: 0 }, null],
        ['a size that is not whole', { tabs: true, size: 1.5 }, null],
        ['a size that is NaN', { tabs: true, size: Number.NaN }, null],
        ['a size that is infinite', { tabs: true, size: Infinity }, null],
        ['a size that is a string', { tabs: true, size: '4' }, null],
        ['a list', [], null],
        ['null', null, null]
    ])('reads an indentation of %s', (_name, indent, expected) => {
        client.ui.setInstanceState('one', { indent });
        expect(sourceDraft('one').indent).toStrictEqual(expected);
    });
});

describe('the answer of the route that says whether a file is locked', () => {
    async function lockedBy(text: string, status = 200): Promise<boolean> {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        return loadSourceReadonly('hub', 'a.md');
    }

    it.each([
        ['readonly true', '{"readonly":true}', 200, true],
        ['readonly the string true', '{"readonly":"true"}', 200, false],
        ['readonly absent', '{}', 200, false],
        ['a list', '[]', 200, false],
        ['null', 'null', 200, false],
        ['text that is not JSON', 'nope', 200, false],
        ['a refusal that says readonly true', '{"readonly":true}', 500, false]
    ])('is the answer of %s', async (_name, text, status, expected) => {
        expect(await lockedBy(text, status)).toBe(expected);
    });
});

describe('a source tab over the file at HEAD or in the index', () => {
    const answer = (body: unknown, status = 200): Response =>
        new Response(JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' }
        });

    // Revert: build the tab id without the stage.
    it('is a tab of its own for each stage of one file, named for the stage', () => {
        const head = headTabState('/hub', 'src/a.ts', 'head');
        const index = headTabState('/hub', 'src/a.ts', 'index');
        expect(head).toEqual({
            id: 'head:head:/hub:src/a.ts',
            root: '/hub',
            path: 'src/a.ts',
            label: 'a.ts (HEAD)',
            head: 'head'
        });
        expect(index.label).toBe('a.ts (Index)');
        expect(stateId(head)).not.toBe(stateId(index));
        expect(stateId(head)).not.toBe(stateId(sourceTabState('/hub', 'src/a.ts')));
    });

    // Revert: read the working copy from the file route.
    it('reads the text from the head read of the git endpoint', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(answer({ ok: true, text: 'old\n' })))
        );
        await expect(loadHeadFile('/hub', 'a b.ts', 'index')).resolves.toEqual({
            ok: true,
            content: 'old\n',
            truncated: false
        });
        expect(fetch).toHaveBeenCalledWith('/api/git?head=%2Fhub&path=a+b.ts&stage=index');
    });

    it('says a file the stage lacks is missing and a binary one is binary', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    url.includes('missing.txt')
                        ? answer({ ok: true, missing: true })
                        : answer({ ok: true, binary: true })
                )
            )
        );
        const missing = await loadHeadFile('/hub', 'missing.txt', 'head');
        const binary = await loadHeadFile('/hub', 'blob.bin', 'head');
        expect(missing).toEqual({ ok: false, error: catalog['source.head_missing'] });
        expect(binary).toEqual({ ok: false, error: catalog['source.head_binary'] });
    });

    // Revert: let the draft of a head tab be saved.
    it('holds a draft that is read-only, and never reads the file route or the mode route', async () => {
        const fetcher = vi.fn(() => Promise.resolve(answer({ ok: true, text: 'old\n' })));
        vi.stubGlobal('fetch', fetcher);
        await loadSourceDraft('head-one', '/hub', 'a.ts', 'head');
        expect(sourceDraft('head-one')).toMatchObject({
            text: 'old\n',
            saved: 'old\n',
            readonly: true,
            loaded: true
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
        const calls = fetcher.mock.calls as unknown as string[][];
        expect(calls[0][0].startsWith('/api/git?head=')).toBe(true);
    });
});

describe('a file the route refuses', () => {
    it('is a failed read that says the refused sentence with the status, and not the status alone', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('gone', { status: 404 })));
        expect(await loadSource('hub', 'a.md')).toEqual({
            ok: false,
            error: t('ui.answer_refused', 404)
        });
    });

    it('is a tab that says it cannot open the file, with the refused sentence', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('no', { status: 503 })));
        await loadSourceDraft('one', 'hub', 'a.md');
        expect(sourceDraft('one').error).toBe(t('source.cannot_open', t('ui.answer_refused', 503)));
    });
});

describe('a tab with no unsaved text read again after its file was written', () => {
    /** A fetch that answers every read with what `disk.text` holds when it is asked. */
    function reading(disk: { text: string }): ReturnType<typeof vi.fn> {
        const fetcher = vi.fn(() => Promise.resolve(new Response(disk.text)));
        vi.stubGlobal('fetch', fetcher);
        return fetcher;
    }

    it('shows the text the disk holds now, as the saved text too', async () => {
        // Revert: leave the draft as it is in reloadSource.
        const disk = { text: 'old' };
        reading(disk);
        await loadSourceDraft('one', 'hub', 'notes.md');
        disk.text = 'new';
        await client.source.reloadSource('one');
        expect(sourceDraft('one')).toMatchObject({ text: 'new', saved: 'new' });
        expect(sourceDirty('one')).toBe(false);
    });

    it('asks nothing for a tab holding text the reader typed, and keeps it', async () => {
        // Revert: drop the `draft.text !== draft.saved` return of reloadSource.
        const disk = { text: 'old' };
        const fetcher = reading(disk);
        await loadSourceDraft('one', 'hub', 'notes.md');
        editSourceDraft('one', 'typed');
        const asked = fetcher.mock.calls.length;
        disk.text = 'new';
        await client.source.reloadSource('one');
        expect(fetcher.mock.calls).toHaveLength(asked);
        expect(sourceDraft('one')).toMatchObject({ text: 'typed', saved: 'old' });
    });

    it('keeps the text typed while the read was out, and moves the saved text to the disk', async () => {
        // Revert: write `answer.content` as the text without the `edited` check.
        const disk = { text: 'old' };
        reading(disk);
        await loadSourceDraft('one', 'hub', 'notes.md');
        const read = Promise.withResolvers<Response>();
        vi.stubGlobal('fetch', () => read.promise);
        const reloading = client.source.reloadSource('one');
        editSourceDraft('one', 'typed while reading');
        read.resolve(new Response('new'));
        await reloading;
        expect(sourceDraft('one')).toMatchObject({ text: 'typed while reading', saved: 'new' });
    });

    it('writes nothing under a tab its pane closed while the read was out', async () => {
        // Revert: drop both `ui.instanceState(id) === undefined` and the file comparison after the
        // read in reloadSource; either one holds this case alone.
        client.layout.apply({
            root: {
                kind: 'pane',
                tabs: [{ id: 'one', view: 'source', state: null }],
                active: 'one'
            }
        });
        const disk = { text: 'old' };
        reading(disk);
        await loadSourceDraft('one', 'hub', 'notes.md');
        const read = Promise.withResolvers<Response>();
        vi.stubGlobal('fetch', () => read.promise);
        const reloading = client.source.reloadSource('one');
        client.layout.closeInstance('one');
        expect(client.ui.instanceState('one')).toBeUndefined();
        read.resolve(new Response('new'));
        await reloading;
        expect(client.ui.instanceState('one')).toBeUndefined();
    });

    it("leaves the next file's draft alone in a preview tab pointed at it", async () => {
        // Revert: drop `if (held.file !== draft.file) return;` from reloadSource.
        const state = (path: string) => ({ root: 'hub', path, label: path });
        const tab = client.layout.openView('source', state('a.md'), undefined, { preview: true });
        const disk = { text: 'a on disk' };
        reading(disk);
        await loadSourceDraft(tab, 'hub', 'a.md');
        const read = Promise.withResolvers<Response>();
        vi.stubGlobal('fetch', () => read.promise);
        const reloading = client.source.reloadSource(tab);
        client.layout.openView('source', state('b.md'), undefined, { preview: true });
        disk.text = 'b on disk';
        reading(disk);
        await loadSourceDraft(tab, 'hub', 'b.md');
        read.resolve(new Response('a replaced'));
        await reloading;
        expect(sourceDraft(tab)).toMatchObject({ file: 'hub/b.md', text: 'b on disk' });
    });
});
