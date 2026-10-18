// Layer 2, client-state tests, in Svelte's client runtime. What the fs store asks under a root
// that leaves the workspace (state/sources/fs.svelte.ts, `switched` and `readWorkspaces`): a
// listing, a file's text or a file's local-history copies that a view still reads under the root
// answer empty with no request, as the page's source tab and Timeline section still read them
// until they are drawn again; what is held under the roots that stay is asked for again; a root
// added back is read again; a `files` message heard while a switch of the workspace is out marks
// nothing under the root it leaves, which a view still reads until the switch has landed. The fetch
// is a stub that answers the workspace with the roots it holds and every other read with nothing,
// and records each address asked.
//
// It does not cover the source tab's own read of its file, which
// tests/state/sessions/source/source-unserved.client.test.ts covers.

import { afterEach, expect, it, vi } from 'vitest';
import { createQueries } from '../../../src/lib/state/client/queries/queries.svelte.ts';
import { createFs } from '../../../src/lib/state/sources/fs.svelte.ts';
import type { EntitiesStore, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';

afterEach(() => vi.unstubAllGlobals());

/** A JSON answer as `fetch` gives it. */
const answer = (body: unknown): Response =>
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

/** A `files` message as the channel delivers it, with no payload. */
type FilesMessage = { channel: 'files'; version: number };

/**
 * The fs store over a stub server whose workspace holds `roots`, with every address asked.
 * `during` runs while a workspace write is out, after the server has changed its roots and before
 * it answers.
 */
function make(roots: string[], during: () => Promise<void> = () => Promise.resolve()) {
    let held = roots;
    const asked: string[] = [];
    const listeners: ((message: FilesMessage) => void)[] = [];
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', (url: string) => {
        if (url === '/api/fs') {
            return Promise.resolve(
                answer({ folders: held.map((name) => ({ name, dir: `/w/${name}` })) })
            );
        }
        asked.push(url);
        if (url.startsWith('/api/history')) return Promise.resolve(answer({ saves: [] }));
        if (url.startsWith('/api/file/')) return Promise.resolve(new Response('text\n'));
        return Promise.resolve(answer({ entries: [] }));
    });
    const writes = {
        send: async () => {
            await during();
            return { ok: true, changed: [], refused: [] };
        }
    } as unknown as WritesStore;
    const entities = {
        afterReceive: (listener: (message: FilesMessage) => void) => {
            listeners.push(listener);
            return () => undefined;
        },
        payloadOf: () => null
    } as unknown as EntitiesStore;
    const fs = createFs(writes, entities, createQueries());
    return {
        fs,
        asked,
        serve: (next: string[]) => {
            held = next;
        },
        hear: (message: FilesMessage) => {
            for (const listener of listeners) listener(message);
        }
    };
}

/** Let the reads scheduled on microtasks and their answers land. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 5; turn += 1) await new Promise((done) => setTimeout(done, 0));
}

/** Read each root's top folder, the text of one of its files and that file's copies. */
async function readAll(env: ReturnType<typeof make>, roots: string[]): Promise<void> {
    for (const root of roots) {
        env.fs.listing(root, '');
        env.fs.fileText(root, 'a.txt');
        env.fs.copies(root, 'a.txt');
    }
    await settle();
}

/** The addresses asked under one root, in order. */
const under = (asked: string[], root: string): string[] =>
    asked.filter(
        (url) =>
            url.includes(`root=${root}&`) ||
            url.startsWith(`/api/file/${root}/`) ||
            url.startsWith(`/api/history?root=${root}&`)
    );

it('asks nothing under a root that left the workspace, and asks again under the roots that stay', async () => {
    const env = make(['merge', 'repo']);
    await env.fs.workspacesNow();
    await readAll(env, ['merge', 'repo']);
    env.asked.length = 0;
    env.serve(['repo']);
    await env.fs.removeRoot('merge');
    await readAll(env, ['merge', 'repo']);
    console.info(
        `asked after the removal of root merge:\n  ${env.asked.join('\n  ') || '(nothing)'}`
    );
    expect(under(env.asked, 'merge')).toEqual([]);
    expect(under(env.asked, 'repo').length).toBe(3);
});

it('reads a root added back again', async () => {
    const env = make(['merge', 'repo']);
    await env.fs.workspacesNow();
    await readAll(env, ['merge', 'repo']);
    env.serve(['repo']);
    await env.fs.removeRoot('merge');
    await readAll(env, ['merge']);
    env.asked.length = 0;
    env.serve(['repo', 'merge']);
    await env.fs.addRoot('/w/merge');
    await readAll(env, ['merge']);
    expect(under(env.asked, 'merge').length).toBe(3);
});

it('asks nothing under the root a switch leaves for a message heard while the switch is out', async () => {
    let meanwhile: string[] = [];
    const env = make(['merge', 'repo'], async () => {
        env.serve(['repo']);
        // A gap in the versions concerns every root the page holds.
        env.hear({ channel: 'files', version: 9 });
        await readAll(env, ['merge', 'repo']);
        meanwhile = under(env.asked, 'merge');
    });
    await env.fs.workspacesNow();
    env.hear({ channel: 'files', version: 1 });
    await readAll(env, ['merge', 'repo']);
    env.asked.length = 0;
    await env.fs.selectWorkspace('/w/look-a.yml');
    await readAll(env, ['merge', 'repo']);
    console.info(
        `asked under merge while the switch was out:\n  ${meanwhile.join('\n  ') || '(nothing)'}`
    );
    expect([meanwhile, under(env.asked, 'merge')]).toEqual([[], []]);
    expect(under(env.asked, 'repo').length).toBe(3);
});
