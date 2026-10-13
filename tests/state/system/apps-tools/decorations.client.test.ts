// Layer 2, client state test. The file decorations of the apps as the Files view's rows read them
// (lib/state/system/apps/tools/decorations.svelte.ts): a row that is drawn while a host that serves
// decorations starts is asked of the server in the frame after, with the follow-up of the channel
// scheduled in the same frame. These are the decoration rows of G77 on the page's side.
//
// What this does NOT cover: the Files view that draws the rows, and the server's join of the
// providers' answers (tests/server/machine/apps/tools/decorations.test.ts).

import { flushSync } from 'svelte';
import { describe, expect, vi } from 'vitest';
import type { AppToolsHost, AppToolsPayload } from '../../../../src/lib/data/model/index.ts';
import { createDecorations } from '../../../../src/lib/state/system/apps/tools/decorations.svelte.ts';
import { it } from '../../../fixtures/scratch.ts';
import { cell, rooted } from '../../../ui/frame/rooted.svelte.ts';

/** A host of the app `app:notes` that serves decorations or not. */
function host(decorations: boolean): AppToolsHost {
    return {
        app: 'app:notes',
        servers: [],
        providers: null,
        collections: [],
        debuggers: [],
        taskTypes: [],
        sources: [],
        decorations,
        contentSchemes: []
    };
}

/** The `app-tools` payload with the given hosts and no changed file. */
const payload = (hosts: AppToolsHost[]): AppToolsPayload => ({
    hosts,
    decorations: { epoch: 0, allAt: 0, files: [] }
});

describe('the decorations of a row drawn when a host starts serving them', () => {
    it('are asked of the server in the next frame, though the channel follow-up runs in that frame too', async () => {
        const tools = cell<AppToolsPayload | null>(payload([]));
        const frames: (() => void)[] = [];
        const runFrames = (): void => {
            for (const run of frames.splice(0)) run();
        };
        const post = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                body: { ok: true, value: { decorations: { 'a.txt': { badge: 'N' } } } },
                failed: '' as const
            })
        );
        const made = rooted(() =>
            createDecorations({
                payload: () => tools.get(),
                post,
                frame: (run) => {
                    frames.push(run);
                }
            })
        );
        flushSync();
        runFrames();
        const before = made.value.of('r', 'a.txt', 'file');
        tools.set(payload([host(true)]));
        flushSync();
        // The row is drawn again while the channel's follow-up waits for its frame.
        made.value.of('r', 'a.txt', 'file');
        runFrames();
        made.value.of('r', 'a.txt', 'file');
        runFrames();
        for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
        const after = made.value.of('r', 'a.txt', 'file');
        made.stop();
        expect([
            before,
            post.mock.calls.map((call) => (call as unknown[])[1]),
            after?.badge
        ]).toEqual([null, [{ action: 'decorate', root: 'r', paths: ['a.txt'] }], 'N']);
    });
});
