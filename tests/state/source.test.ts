// The source tab's pure access and identity rules plus its GET and authenticated POST requests.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    loadSource,
    sourceFileUrl,
    sourceInfoUrl,
    sourceTabState
} from '../../src/lib/state/source.svelte.ts';
import { stateId } from '../../src/lib/state/instance.ts';
import { TEXT_LIMIT } from '../../src/lib/state/fs.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { fields, scalar } from '../../src/lib/data/guards.ts';
import { createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let saveSource: ClientState['source']['saveSource'];
let loadSourceDraft: ClientState['source']['loadSourceDraft'];
let editSourceDraft: ClientState['source']['editSourceDraft'];
let saveSourceDraft: ClientState['source']['saveSourceDraft'];
let sourceDraft: ClientState['source']['sourceDraft'];
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
