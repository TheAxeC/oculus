// Layer 2, client-state tests. A saved layout that parseLayout cannot read: opening the workspace
// shows the default and keeps the unread value under the workspace's unread key, so the next change
// that writes the default under its layout key does not destroy it.
//
// Nothing here touches localStorage or the DOM: every case reads a fake storage.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { serialiseLayout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { createClientState } from '../../../../fixtures/client.ts';
import {
    docked,
    fakeStorage,
    heldPages,
    openLayout,
    pageAround,
    pane,
    layoutKey,
    unreadKey,
    UNSAVED
} from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const LAYOUT_KEY = layoutKey(UNSAVED);
const UNREAD_KEY = unreadKey(UNSAVED);
const PREVIOUS_KEY = 'oculus.layout.previous';

describe('a saved layout that cannot be read', () => {
    it('is kept under the unread key when the next change writes the default', () => {
        const client = createClientState();
        const storage = fakeStorage('{"version": 99, garbage');
        expect(openLayout(client.layout, storage)).toBe(false);
        client.layout.openPage('Extra');
        expect(storage.held[UNREAD_KEY]).toBe('{"version": 99, garbage');
        expect(storage.held[LAYOUT_KEY]).not.toBe('{"version": 99, garbage');
        expect(storage.held[LAYOUT_KEY]).toContain('Extra');
    });

    it('replaces the kept value with a later unreadable one', () => {
        const storage = fakeStorage('first garbage');
        openLayout(createClientState().layout, storage);
        expect(storage.held[UNREAD_KEY]).toBe('first garbage');
        storage.held[LAYOUT_KEY] = 'second garbage';
        openLayout(createClientState().layout, storage);
        expect(storage.held[UNREAD_KEY]).toBe('second garbage');
    });

    it('leaves the unread key empty for a layout that reads and for none saved', () => {
        const readable = fakeStorage(serialiseLayout(heldPages([pageAround('main', pane(['a']))])));
        openLayout(createClientState().layout, readable);
        expect(UNREAD_KEY in readable.held).toBe(false);

        const none = fakeStorage();
        openLayout(createClientState().layout, none);
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
        expect(openLayout(client.layout, storage)).toBe(false);
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
        expect(openLayout(client.layout, storage)).toBe(false);
        expect(client.layout.pages().map((page) => page.label)).toEqual(['Page 1']);
        expect(UNREAD_KEY in storage.held).toBe(false);
    });
});
