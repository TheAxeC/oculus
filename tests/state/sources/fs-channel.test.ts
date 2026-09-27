// Layer 4, test. Files-channel backpressure keeps a bookmark change beside a later root change and
// the combined message makes the page read its bookmarks again; and a bookmark change the page was
// sent whole, then replaced by a root change before anything asked for the bookmarks, still makes
// the next ask read them again.

import { afterEach, expect, it, vi } from 'vitest';
import type { FilesPayload, Message } from '../../../src/lib/data/model/index.ts';
import { Hub, type Sink } from '../../../src/lib/server/core/channels.ts';
import { registerFilesChannel } from '../../../src/lib/server/files/files-channel.ts';
import { createClientState } from '../../fixtures/client.ts';
import { noop } from '../../fixtures/doubles.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Answer every bookmarks read with an empty file, and count the reads. */
function countedReads(): () => number {
    vi.stubGlobal('window', {});
    let reads = 0;
    vi.stubGlobal('fetch', () => {
        reads += 1;
        return Promise.resolve(
            new Response(JSON.stringify({ entries: [], schema: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
    return () => reads;
}

// revert: src/lib/server/files/files-channel.ts "hub.merge('files', mergeFiles);" => delete
it('keeps a pending bookmark marker on the later root message and makes the page read again', async () => {
    const reads = countedReads();
    const client = createClientState();
    client.fs.bookmarks();
    await settle();
    expect(reads()).toBe(1);

    const hub = new Hub();
    registerFilesChannel(hub);
    const sent: Message[] = [];
    let finishFirst: () => void = noop;
    let first = true;
    const sink: Sink = {
        send(text) {
            const message = JSON.parse(text) as Message;
            sent.push(message);
            client.entities.receive(message);
            if (!first) return Promise.resolve();
            first = false;
            return new Promise((resolve) => {
                finishFirst = resolve;
            });
        },
        close: noop
    };
    hub.subscribe(sink, ['files']);

    hub.publish('files', { root: '/already-sending' } satisfies FilesPayload);
    await settle();
    expect(sent).toHaveLength(1);

    hub.publish('files', { root: '', bookmarks: true } satisfies FilesPayload);
    hub.publish('files', { root: '/hub' } satisfies FilesPayload);
    await settle();
    expect(sent).toHaveLength(1);

    finishFirst();
    await settle();
    const delivered = sent.at(-1);
    expect(delivered).toMatchObject({
        channel: 'files',
        version: 3,
        payload: { root: '/hub', bookmarks: true }
    });
    expect((delivered?.payload as FilesPayload).root).toBe('/hub');

    client.fs.bookmarks();
    await settle();
    expect(reads()).toBe(2);
});

it('reads the bookmarks again after a root message replaced the one that named them', async () => {
    // revert: src/lib/state/sources/fs.svelte.ts "const named = message.channel === 'files' && (message.payload as FilesPayload).bookmarks;" => const named = message.channel === 'files';
    // revert: src/lib/state/sources/fs.svelte.ts "if (named === true && message.version > onDisk) onDisk = message.version;" => delete
    const reads = countedReads();
    const client = createClientState();
    client.fs.bookmarks();
    await settle();
    expect(reads()).toBe(1);

    // Two whole messages, as a subscriber that keeps up is sent them: nothing asks in between.
    const files = (version: number, payload: FilesPayload): Message => ({
        channel: 'files',
        version,
        payload
    });
    client.entities.receive(files(1, { root: '', bookmarks: true }));
    client.entities.receive(files(2, { root: '/hub' }));
    client.fs.bookmarks();
    await settle();
    expect(reads()).toBe(2);

    // A root message alone moves nothing.
    client.entities.receive(files(3, { root: '/hub' }));
    client.fs.bookmarks();
    await settle();
    expect(reads()).toBe(2);
});
