// Layer 4, test. Files-channel backpressure keeps a bookmark change beside a later root change and
// the combined message makes the page read its bookmarks again.

import { afterEach, expect, it, vi } from 'vitest';
import type { FilesPayload, Message } from '../../src/lib/data/model.ts';
import { Hub, type Sink } from '../../src/lib/server/channels.ts';
import { registerFilesChannel } from '../../src/lib/server/files-channel.ts';
import { createClientState } from '../client.ts';
import { noop } from '../doubles.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

// revert: src/lib/server/files-channel.ts:18 => delete
it('keeps a pending bookmark marker on the later root message and makes the page read again', async () => {
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
    const client = createClientState();
    client.fs.bookmarks();
    await settle();
    expect(reads).toBe(1);

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
    expect(reads).toBe(2);
});
