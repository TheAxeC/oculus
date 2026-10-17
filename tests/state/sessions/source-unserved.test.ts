// Layer 2, client-state tests. A source tab whose folder is removed from the workspace
// (state/sessions/source/disk.svelte.ts) over the fake server of source-server.ts: the file's
// channel says null with its root no longer served, which the server's poll can say before the
// page has read the workspace again, so the tab is unserved and never says its file was deleted;
// a null over a root still served is a file deleted on disk. A Save of an unserved tab writes
// nothing and adds no line of its own, since the disk line under the editor says already that the
// folder is not served, so the note is drawn once and nothing of it is kept in the draft.
//
// It does not cover the tree dropping the root, which the workspace read after the removal does
// (state/sources/fs.svelte.ts, rootsWrite), or the note drawn, which the look does.

import { afterEach, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { server } from './source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

const KEY = 'fixture/a.md';

/** A tab over fixture/a.md while the page still lists the root as served, after the message. */
async function after(said: (env: ReturnType<typeof server>) => void): Promise<string> {
    const env = server({ served: () => ['fixture'] });
    env.files.set(KEY, 'one\n');
    await env.source.loadSourceDraft('one', 'fixture', 'a.md');
    await env.settled();
    said(env);
    await env.settled();
    return env.source.sourceDraft('one').disk;
}

it('is unserved when the channel says its root is no longer served, whatever the page lists', async () => {
    expect(await after((env) => env.unserve(KEY))).toBe('unserved');
});

it('is gone when the channel says null over a root still served', async () => {
    expect(await after((env) => env.outside(KEY, null))).toBe('gone');
});

it('writes nothing on a Save of an unserved tab and keeps no line of its own', async () => {
    const env = server({ served: () => ['other'] });
    env.files.set(KEY, 'one\n');
    await env.source.loadSourceDraft('one', 'fixture', 'a.md');
    await env.settled();
    env.unserve(KEY);
    env.source.editSourceDraft('one', 'typed\n');
    const saved = await env.source.saveSourceDraft('one', 'fixture', 'a.md');
    const { disk, message } = env.source.sourceDraft('one');
    expect({ saved, disk, message, sent: env.sent }).toEqual({
        saved: false,
        disk: 'unserved',
        message: '',
        sent: []
    });
});
