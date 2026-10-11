// Layer 2, client-state tests. A saved layout that parseLayout cannot read: loadLayout opens the
// default and keeps the unread value under oculus.layout.unread, so the next change that writes the
// default under oculus.layout.v1 does not destroy it.
//
// Nothing here touches localStorage or the DOM: every case reads a fake storage.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { LAYOUT_KEY } from '../../../../../src/lib/state/workbench/layout.svelte.ts';
import { serialiseLayout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { createClientState } from '../../../../fixtures/client.ts';
import { docked, fakeStorage, heldPages, pageAround, pane } from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const UNREAD_KEY = 'oculus.layout.unread';
const PREVIOUS_KEY = 'oculus.layout.previous';

describe('a saved layout that cannot be read', () => {
    it('is kept under the unread key when the next change writes the default', () => {
        const client = createClientState();
        const storage = fakeStorage('{"version": 99, garbage');
        expect(client.layout.loadLayout(storage)).toBe(false);
        client.layout.openPage('Extra');
        expect(storage.held[UNREAD_KEY]).toBe('{"version": 99, garbage');
        expect(storage.held[LAYOUT_KEY]).not.toBe('{"version": 99, garbage');
        expect(storage.held[LAYOUT_KEY]).toContain('Extra');
    });

    it('replaces the kept value with a later unreadable one', () => {
        const storage = fakeStorage('first garbage');
        createClientState().layout.loadLayout(storage);
        expect(storage.held[UNREAD_KEY]).toBe('first garbage');
        storage.held[LAYOUT_KEY] = 'second garbage';
        createClientState().layout.loadLayout(storage);
        expect(storage.held[UNREAD_KEY]).toBe('second garbage');
    });

    it('leaves the unread key empty for a layout that reads and for none saved', () => {
        const readable = fakeStorage(serialiseLayout(heldPages([pageAround('main', pane(['a']))])));
        createClientState().layout.loadLayout(readable);
        expect(UNREAD_KEY in readable.held).toBe(false);

        const none = fakeStorage();
        createClientState().layout.loadLayout(none);
        expect(UNREAD_KEY in none.held).toBe(false);
    });

    const OLDER = [
        {
            name: 'an envelope of version 6',
            raw: JSON.stringify({
                version: 6,
                pages: [{ id: 'page-0', label: 'Old', workbench: { root: pane(['a']) } }],
                current: 'page-0',
                floats: []
            })
        },
        {
            name: 'an envelope of version 2',
            raw: JSON.stringify({
                version: 2,
                workbench: docked(pane(['a']), pane(['p']))
            })
        },
        {
            name: 'the two-tree workbench of a browser, without its envelope',
            raw: JSON.stringify(docked(pane(['a']), pane(['p'])))
        }
    ];

    it.each(OLDER)('keeps $name under the unread key and shows the default pages', ({ raw }) => {
        const client = createClientState();
        const storage = fakeStorage(raw);
        expect(client.layout.loadLayout(storage)).toBe(false);
        expect(storage.held[UNREAD_KEY]).toBe(raw);
        expect(client.layout.pages().map((page) => page.label)).toEqual(['Page 1']);
    });

    it('shows the default pages for a workbench under the previous key and nothing under the layout key', () => {
        const client = createClientState();
        const storage = fakeStorage();
        storage.held[PREVIOUS_KEY] = JSON.stringify({
            version: 2,
            workbench: docked(pane(['a']), pane(['p']))
        });
        expect(client.layout.loadLayout(storage)).toBe(false);
        expect(client.layout.pages().map((page) => page.label)).toEqual(['Page 1']);
        expect(UNREAD_KEY in storage.held).toBe(false);
    });
});
