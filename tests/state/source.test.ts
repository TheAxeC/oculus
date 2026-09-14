// The source tab's pure access and identity rules plus its GET and authenticated POST requests.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    loadSource,
    saveSource,
    sourceAccess,
    sourceFileUrl,
    sourceTabState,
    loadSourceDraft,
    editSourceDraft,
    saveSourceDraft,
    sourceDraft
} from '../../src/lib/state/source.svelte.ts';
import { setToken } from '../../src/lib/state/writes.svelte.ts';
import { stateId } from '../../src/lib/state/instance.ts';
import { loadUi } from '../../src/lib/state/ui.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { fields, scalar } from '../../src/lib/data/guards.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const CONFIG = {
    editable_extensions: ['.md', '.yml'],
    viewable_extensions: ['.md', '.yml', '.py']
};

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));

describe('source tab state', () => {
    it('uses configured editable and viewable extensions and blocks everything else', () => {
        expect(sourceAccess('README.MD', CONFIG)).toBe('editable');
        expect(sourceAccess('program.py', CONFIG)).toBe('read-only');
        expect(sourceAccess('archive.zip', CONFIG)).toBe('blocked');
    });

    it('identifies a tab by root and path and labels it with the file name', () => {
        expect(sourceTabState('hub', 'feeds/literature-radar.yml')).toEqual({
            root: 'hub',
            path: 'feeds/literature-radar.yml',
            label: 'literature-radar.yml'
        });
        expect(sourceFileUrl('hub', 'folder/a b.md')).toBe('/api/file/hub/folder/a%20b.md');
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
        expect(fields(JSON.parse(scalar(fetcher.mock.calls[1][1]?.body))).content).toBe(
            'sent copy'
        );
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
        expect(fetcher).toHaveBeenCalledTimes(1);
        read.resolve(new Response('disk'));
        await Promise.all([first, second]);
        editSourceDraft('one', 'unsaved');
        await loadSourceDraft('one', 'hub', 'notes.md');
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(sourceDraft('one').text).toBe('unsaved');
    });

    it('returns a path refusal without retrying it as a stale token', async () => {
        const refused = [{ field: 'path', reason: 'the extension is not editable' }];
        const fetcher = vi.fn(() =>
            Promise.resolve(
                new Response(JSON.stringify({ ok: false, error: refused[0].reason, refused }), {
                    status: 403
                })
            )
        );
        vi.stubGlobal('fetch', fetcher);
        setToken('source-token');
        await expect(saveSource('hub', 'program.py', 'replacement')).resolves.toMatchObject({
            ok: false,
            refused
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('loads complete text through the existing file route', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response('body\n')))
        );
        await expect(loadSource('hub', 'notes/read me.md')).resolves.toEqual({
            ok: true,
            content: 'body\n'
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
