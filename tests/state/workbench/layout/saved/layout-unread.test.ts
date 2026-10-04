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
import { fakeStorage, heldPages, pageAround, pane } from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const UNREAD_KEY = 'oculus.layout.unread';

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
});
