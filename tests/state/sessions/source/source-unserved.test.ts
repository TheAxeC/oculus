// Layer 2, client-state tests. A source tab whose folder is removed from the workspace
// (state/sessions/source/disk.svelte.ts) over the fake server of source-server.ts: the file's
// channel says null with its root no longer served, which the server's poll can say before the page
// has read the workspace again, so the tab is unserved and never says its file was deleted; a null
// over a root still served is a file deleted on disk. A tab whose root the page has read as no
// longer served reads nothing of its file when its channel says the file changed. A Save of an
// unserved tab writes nothing and adds no line of its own, since the disk line under the editor
// says already that the folder is not served, so the note is drawn once and nothing of it is kept
// in the draft.
//
// It does not cover the tree dropping the root, which the workspace read after the removal does
// (state/sources/fs.svelte.ts, rootsWrite), or the note drawn, which the look does.

import { afterEach, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { server } from './source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

const KEY = 'fixture/a.md';

/**
 * A tab over fixture/a.md read while the page lists the root as served; the page then lists
 * `listed` and the channel says what `said` sends. Answers the files read after the message and the
 * tab's disk state.
 */
async function after(
    said: (env: ReturnType<typeof server>) => void,
    listed = ['fixture']
): Promise<[string[], string]> {
    let served = ['fixture'];
    const env = server({ served: () => served });
    env.files.set(KEY, 'one\n');
    await env.source.loadSourceDraft('one', 'fixture', 'a.md');
    await env.settled();
    served = listed;
    const read = env.fileReads.length;
    said(env);
    await env.settled();
    return [env.fileReads.slice(read), env.source.sourceDraft('one').disk];
}

const ROWS: {
    row: string;
    said: (env: ReturnType<typeof server>) => void;
    listed?: string[];
    reads: string[];
    disk: string;
}[] = [
    {
        row: 'is unserved when the channel says its root is no longer served, whatever the page lists',
        said: (env) => env.unserve(KEY),
        reads: [],
        disk: 'unserved'
    },
    {
        row: 'is gone when the channel says null over a root still served',
        said: (env) => env.outside(KEY, null),
        reads: [],
        disk: 'gone'
    },
    {
        row: 'reads nothing of a file whose root left the workspace when its channel says it changed',
        said: (env) => env.outside(KEY, 'two\n'),
        listed: ['other'],
        reads: [],
        disk: 'unserved'
    },
    {
        row: 'reads the file again when its channel says it changed over a root still served',
        said: (env) => env.outside(KEY, 'two\n'),
        reads: [KEY],
        disk: 'same'
    }
];

it.each(ROWS)('$row', async ({ said, listed, reads, disk }) => {
    expect(await after(said, listed)).toEqual([reads, disk]);
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
