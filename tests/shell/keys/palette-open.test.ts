// Palette activation over the real layout and UI stores. The stores use in-memory Storage objects,
// so the test proves reveal state reaches the activated instance without a DOM or localStorage.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../src/lib/state/shared/words/appearance.ts';
import { findView } from '../../../src/lib/state/workbench/layout/index.ts';
import type { PaletteItem } from '../../../src/lib/state/workbench/palette.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { openPaletteItem } from '../../../src/lib/shell/keys/palette-open.ts';
import { fakeStorage, viewsOf } from '../../state/workbench/layout/layout-fixture.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

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
        const id = openView('venues');
        expect(findView(layout(), 'venues')?.id).toBe(id);
    });

    it('reuses a collection tab and puts reveal in that instance UI state', () => {
        const id = openPaletteItem(client.layout, client.ui, entry('first'), client.editorStatus);
        setInstanceState(id, { search: 'saved', reveal: 'first' });

        const reused = openPaletteItem(
            client.layout,
            client.ui,
            entry('second'),
            client.editorStatus
        );

        expect(reused).toBe(id);
        expect(viewsOf(layout())).toEqual(['status', 'events']);
        expect(instanceState(id)).toEqual({ search: '', reveal: 'second' });
        expect(findView(layout(), 'events')?.state).toEqual({});
    });
});

describe('an editor action chosen in the palette', () => {
    // Red when openPaletteItem opens the item as a view instead of asking the tab to run it.
    it('asks the source tab it names to run the action, and opens no view', () => {
        const instance = openView('source', { root: 'hub', path: 'run.py' });
        client.editorStatus.publish(instance, {
            caret: { line: 1, column: 1, selected: 0 },
            lines: 1,
            indent: { tabs: false, size: 4 },
            ending: 'LF',
            language: 'python',
            writable: true,
            blame: '',
            actions: []
        });
        const before = viewsOf(layout());
        const item: PaletteItem = {
            id: 'editor:editor.action.addCommentLine',
            kind: 'editor',
            label: 'Add Line Comment',
            title: 'Add Line Comment',
            text: 'Add Line Comment',
            view: 'source',
            hint: 'Cmd+K Cmd+C',
            state: { instance, action: 'editor.action.addCommentLine' }
        };
        expect(openPaletteItem(client.layout, client.ui, item, client.editorStatus)).toBe(instance);
        expect(client.editorStatus.asked(instance)).toEqual({
            kind: 'action',
            id: 'editor.action.addCommentLine',
            instance,
            seq: 1
        });
        expect(viewsOf(layout())).toEqual(before);
    });
});
