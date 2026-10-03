// Layer 3, shell test. Pin Editor and Unpin Editor in the palette: the item listed for the active
// tab, its hint (the Cmd+K chord of VS Code, which the palette stands in for), none while the pane
// holds no tab, and the pick that toggles the pin of that tab.

import { describe, expect, it } from 'vitest';
import { openPaletteItem } from '../../../src/lib/shell/keys/palette-open.ts';
import { pinItems } from '../../../src/lib/state/workbench/palette.ts';
import { panes } from '../../../src/lib/state/workbench/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState } from '../../fixtures/client.ts';
import { noop } from '../../fixtures/doubles.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const words = (key: string): string => `@${key}`;

describe('Pin Editor and Unpin Editor', () => {
    // Revert: return no items from pinItems.
    it('lists Pin Editor for an unpinned active tab, with the Cmd+K chord as its hint', () => {
        const items = pinItems({ id: 'x', pinned: false }, words);

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            kind: 'editor',
            label: '@app.palette.pin_editor',
            hint: 'Cmd+K Shift+Enter'
        });
    });

    it('lists Unpin Editor for a pinned one', () => {
        const items = pinItems({ id: 'x', pinned: true }, words);

        expect(items.map((item) => item.label)).toEqual(['@app.palette.unpin_editor']);
        expect(items[0].hint).toBe('Cmd+K Shift+Enter');
    });

    it('lists neither while the pane holds no tab', () => {
        expect(pinItems(null, words)).toEqual([]);
    });

    it('toggles the pin of the tab when it is picked', () => {
        const client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.ui.loadUi({ getItem: () => null, setItem: noop });
        const id = client.layout.openView('source', { root: 'hub', path: 'a.md' });
        const tabs = () => panes(client.layout.layout())[0].pane.tabs;
        const editor = { ask: () => false };

        const [pin] = pinItems({ id, pinned: false }, words);
        expect(openPaletteItem(client.layout, client.ui, pin, editor)).toBe(id);
        expect(tabs().find((one) => one.id === id)?.pinned).toBe(true);

        const [unpin] = pinItems({ id, pinned: true }, words);
        openPaletteItem(client.layout, client.ui, unpin, editor);
        expect(tabs().find((one) => one.id === id)?.pinned).toBeUndefined();
    });
});
