// Palette activation over the real layout and UI stores. The stores use in-memory Storage objects,
// so the test proves reveal state reaches the activated instance without a DOM or localStorage.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../src/lib/state/appearance.ts';
import { findView } from '../../src/lib/state/layout/index.ts';
import type { PaletteItem } from '../../src/lib/state/palette.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { openPaletteItem } from '../../src/lib/shell/palette-open.ts';
import { fakeStorage, viewsOf } from '../state/layout-fixture.ts';
import { createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let openView: ClientState['layout']['openView'];
let instanceState: ClientState['ui']['instanceState'];
let loadUi: ClientState['ui']['loadUi'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ layout, loadLayout, openView } = client.layout);
    ({ instanceState, loadUi, setInstanceState } = client.ui);
});

const { config } = loadConfig(engineDir());
setAppearance(config);
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

function entry(reveal: string): PaletteItem {
    return {
        id: `collection:events:${reveal}`,
        kind: 'collection',
        label: reveal,
        title: reveal,
        text: reveal,
        view: 'events',
        state: { reveal }
    };
}

beforeEach(() => {
    loadLayout(fakeStorage());
    loadUi(fakeStorage());
});

describe('palette result activation', () => {
    it('returns the id of the view openView activated or created', () => {
        const id = openView('venues', 'main');
        expect(findView(layout('main'), 'venues')?.id).toBe(id);
    });

    it('reuses a collection tab and puts reveal in that instance UI state', () => {
        const id = openPaletteItem(client.layout, client.ui, entry('first'));
        setInstanceState(id, { search: 'saved', reveal: 'first' });

        const reused = openPaletteItem(client.layout, client.ui, entry('second'));

        expect(reused).toBe(id);
        expect(viewsOf(layout('main'))).toEqual(['status', 'events']);
        expect(instanceState(id)).toEqual({ search: '', reveal: 'second' });
        expect(findView(layout('main'), 'events')?.state).toEqual({});
    });
});
