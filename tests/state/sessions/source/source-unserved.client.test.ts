// Layer 2, client-state tests, in Svelte's client runtime so the source store's effect over the
// served roots runs (state/sessions/source/source.svelte.ts). A tab whose channel said its root
// left the workspace reads nothing of its file while the page's list of served roots still names
// the root, as it does until the page has read the workspace again, however often that list is
// drawn again meanwhile; once the root is served again, after it left the list, the tab reads its
// file.
//
// It does not cover the tree's listings or the Timeline's copies of the root, which
// tests/state/sources/fs-root-left.client.test.ts covers.

import { flushSync } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { cell } from '../../../ui/frame/rooted.svelte.ts';
import { server } from './source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

const KEY = 'fixture/a.md';

/** A tab over fixture/a.md read while the page serves the root, its channel then saying it left. */
async function left() {
    const served = cell<readonly string[]>(['fixture']);
    const env = server({ served: served.get });
    env.files.set(KEY, 'one\n');
    await env.source.loadSourceDraft('one', 'fixture', 'a.md');
    await env.settled();
    const read = env.fileReads.length;
    env.unserve(KEY);
    await env.settled();
    return { env, served, read };
}

/** Set the page's served roots and let the store's effects and the reads they start finish. */
async function list(
    env: Awaited<ReturnType<typeof left>>['env'],
    served: Awaited<ReturnType<typeof left>>['served'],
    keys: string[]
): Promise<void> {
    served.set(keys);
    flushSync();
    await env.settled();
}

it('reads nothing while the page still lists the root its channel said left', async () => {
    const { env, served, read } = await left();
    await list(env, served, ['fixture']);
    expect([env.fileReads.slice(read), env.source.sourceDraft('one').disk]).toEqual([
        [],
        'unserved'
    ]);
});

it('reads the file again once the root is served again after it left the list', async () => {
    const { env, served, read } = await left();
    await list(env, served, ['other']);
    await list(env, served, ['fixture', 'other']);
    // The store takes the answer in after the request ends, which a loaded run can delay past
    // `settled`, so the test waits for the outcome rather than for one turn of the timers.
    await vi.waitFor(() =>
        expect([env.fileReads.slice(read), env.source.sourceDraft('one').disk]).toEqual([
            [KEY],
            'same'
        ])
    );
});
