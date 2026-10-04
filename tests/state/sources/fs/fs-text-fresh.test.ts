// Layer 2, client-state tests. A file text read again is read from the server and never from the
// browser's cached copy of the address, so the Settings editors' draft ends after a save however
// soon the view had read the file before; and a file saved in a source tab is marked, so every
// reader of its text reads it again.
//
// `fetch` stands in for a browser with an HTTP cache: a read that does not ask to revalidate is
// answered with the copy it took the first time, as the file route's `max-age=60` lets a browser
// do. What this does NOT cover: the Settings view drawing the draft's end (its unsaved mark going
// is seen at the look) and the route's own headers.

import { describe, expect, it, vi } from 'vitest';
import { ENGINE_ROOT } from '../../../../src/lib/state/sources/fs.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { applyEdit, draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import { settle, storeHooks } from './fs-fixture.ts';

const shipped = catalogOf(loadConfig(engineDir()).config);

/** A browser: the files on disk, and the copy its HTTP cache took of each address. */
function browser(disk: Record<string, string>) {
    const cache = new Map<string, string>();
    const asked: { url: string; cache: string | undefined }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        asked.push({ url, cache: init?.cache });
        const body = url.startsWith('/api/file/') ? url.slice('/api/file/'.length) : url;
        const revalidates = init?.cache === 'no-cache' || init?.cache === 'reload';
        const held = cache.get(url);
        if (held !== undefined && !revalidates) return Promise.resolve(new Response(held));
        const fresh = disk[body] ?? '';
        cache.set(url, fresh);
        return Promise.resolve(new Response(fresh));
    });
    return { asked, disk };
}

describe('a Settings save within a minute of the view s last read of the file', () => {
    const store = storeHooks();

    // The push after the save re-reads the file from the server, never the browser's cached copy
    // of the address, so the draft ends; red when the read takes the cached copy.
    it('ends the draft of a list with an item removed', async () => {
        const key = 'waiting_status';
        const before = 'waiting_status: [one, two, three]\n';
        const written = (value: unknown): string =>
            `waiting_status: [${(value as string[]).join(', ')}]\n`;
        const value = ['two', 'three'];
        const seen = browser({ 'engine/behavior.yml': before });
        const rowNow = (): ConfigRow => {
            const found = fileRows(
                'behavior.yml',
                shipped['behavior.yml'],
                store.client.fs.fileText(ENGINE_ROOT, 'behavior.yml')
            ).rows.find((one) => one.key === key);
            if (found === undefined) throw new Error(`no ${key} row`);
            return found;
        };
        store.client.fs.fileText(ENGINE_ROOT, 'behavior.yml');
        await settle();

        const ended: string[] = [];
        const writer = createEditorWriter(
            (_file, _key, sent) => {
                seen.disk['engine/behavior.yml'] = written(sent);
                return Promise.resolve({ ok: true, changed: [`behavior.yml:${key}`], refused: [] });
            },
            { changed: () => undefined, ended: (row) => ended.push(row.id), held: () => true }
        );
        const row = rowNow();
        let draft = draftOf(row);
        if (draft === null) throw new Error('no draft');
        draft = applyEdit(draft, { do: 'remove', index: 0 });
        await writer.save(row, draft);

        // The watcher's push moves the config channel; the Settings view, drawing the row, reads
        // the file again.
        store.client.fs.refresh(ENGINE_ROOT, 2);
        rowNow();
        await settle();
        writer.pushed(rowNow());

        expect(rowNow().value).toEqual(value);
        expect(ended).toEqual([row.id]);
    });
});

describe('a file saved in a source tab', () => {
    const store = storeHooks();

    /** The server's answer to a save, and a file route that holds what was saved. */
    function server(disk: Record<string, string>) {
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            if (url === '/api/source') {
                const body = JSON.parse(typeof init?.body === 'string' ? init.body : '') as {
                    root: string;
                    path: string;
                    content: string;
                };
                disk[`${body.root}/${body.path}`] = body.content;
                return Promise.resolve(new Response(JSON.stringify({ ok: true })));
            }
            return Promise.resolve(new Response(disk[url.slice('/api/file/'.length)] ?? ''));
        });
    }

    it('is read again by every reader of its text', async () => {
        const disk = { 'hub/.oculus/settings.yml': 'languages: { python: { tab_size: 2 } }\n' };
        server(disk);
        store.client.writes.setToken('token');
        store.client.fs.fileText('hub', '.oculus/settings.yml');
        await settle();
        expect(store.client.fs.fileText('hub', '.oculus/settings.yml').text).toContain(
            'tab_size: 2'
        );

        await store.client.source.saveSource(
            'hub',
            '.oculus/settings.yml',
            'languages: { python: { tab_size: 5 } }\n'
        );
        store.client.fs.fileText('hub', '.oculus/settings.yml');
        await settle();

        expect(store.client.fs.fileText('hub', '.oculus/settings.yml').text).toContain(
            'tab_size: 5'
        );
    });
});
