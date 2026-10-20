// Layer 2, client-state tests. A saved layout that parseLayout cannot read: opening the workspace
// shows the default and keeps the unread value as the workspace's `unread` copy in the server's
// `layouts.json`, so the next change that writes the default as its envelope does not destroy it.
//
// Every page is a client over the page state stand-in (tests/fixtures/state-server.ts), which
// writes the files of a state folder of the case's own with the server's own write.

import { describe, expect } from 'vitest';
import { isMap } from '../../../../../src/lib/data/helpers/guards.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { serialiseLayout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { stateServer, type StateServer } from '../../../../fixtures/state-server.ts';
import { docked, heldPages, openLayout, pageAround, pane, UNSAVED } from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** What `layouts.json` holds for the unsaved workspace. */
function held(server: StateServer): { envelope?: unknown; unread?: unknown } {
    const entry = server.file('layouts')[UNSAVED];
    return isMap(entry) ? entry : {};
}

/** Let the answers of the writes sent land. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** A server whose unsaved workspace holds `envelope`, and a page of it with that workspace open. */
function opened(envelope: unknown) {
    const server = stateServer();
    server.seed(UNSAVED, { envelope });
    const client = server.page();
    const restored = openLayout(client.layout);
    return { server, client, restored };
}

const UNREADABLE = { version: 99, garbage: true };

describe('a saved layout that cannot be read', () => {
    it('is kept under the unread key when the next change writes the default', async () => {
        const { server, client, restored } = opened(UNREADABLE);
        expect(restored).toBe(false);
        client.layout.openPage('Extra');
        await settle();
        expect(held(server).unread).toEqual(UNREADABLE);
        expect(held(server).envelope).not.toEqual(UNREADABLE);
        expect(JSON.stringify(held(server).envelope)).toContain('Extra');
    });

    it('replaces the kept value with a later unreadable one', async () => {
        const server = stateServer();
        server.seed(UNSAVED, { envelope: 'first garbage' });
        openLayout(server.page().layout);
        await settle();
        expect(held(server).unread).toBe('first garbage');
        server.seed(UNSAVED, { ...held(server), envelope: 'second garbage' });
        openLayout(server.page().layout);
        await settle();
        expect(held(server).unread).toBe('second garbage');
    });

    it('leaves the unread copy empty for a layout that reads and for none saved', async () => {
        const readable = opened(
            JSON.parse(serialiseLayout(heldPages([pageAround('main', pane(['a']))])))
        );
        await settle();
        expect(held(readable.server).unread).toBeUndefined();

        const server = stateServer();
        openLayout(server.page().layout);
        await settle();
        expect(held(server).unread).toBeUndefined();
    });

    const OLDER = [
        {
            name: 'an envelope of version 6',
            envelope: {
                version: 6,
                pages: [{ id: 'page-0', label: 'Old', workbench: { root: pane(['a']) } }],
                current: 'page-0',
                floats: []
            }
        },
        {
            name: 'an envelope of version 2',
            envelope: { version: 2, workbench: docked(pane(['a']), pane(['p'])) }
        },
        {
            name: 'the two-tree workbench of a browser, without its envelope',
            envelope: docked(pane(['a']), pane(['p']))
        }
    ];

    it.each(OLDER)(
        'keeps $name under the unread key and shows the default pages',
        async ({ envelope }) => {
            const { server, client, restored } = opened(envelope);
            expect(restored).toBe(false);
            await settle();
            expect(held(server).unread).toEqual(envelope);
            expect(client.layout.pages().map((page) => page.label)).toEqual(['Page 1']);
        }
    );
});
