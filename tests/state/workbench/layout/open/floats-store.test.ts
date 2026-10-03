// Layer 2, client state tests. Floats in the layout store: the shipped floats a fresh browser
// starts with and Reset all pages puts back, a layout saved before there were floats taking them
// in, a float addressed by its id wherever a page id is taken, the attention that never rests on
// one, a view opened while its tab is in a float, and every loop over the pages that walks the
// floats too. Client states stand for browser tabs over one fake Storage, as in
// saved/layout-shared.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    panes,
    serialiseLayout,
    tabsOf,
    type Float,
    type Pages
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { setLocked } from '../../../../../src/lib/state/workbench/layout/tree.ts';
import { LAYOUT_KEY } from '../../../../../src/lib/state/workbench/layout.svelte.ts';
import { parseFloats } from '../../../../../src/lib/state/workbench/navigation/arrangement.ts';
import { railPages } from '../../../../../src/lib/state/workbench/navigation/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';
import {
    FREE_PLACE,
    fakeStorage,
    floating,
    heldPages,
    instance,
    pageAround,
    pane,
    paneOf,
    split,
    viewsOf
} from '../layout-fixture.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));

/** The views these cases treat as opened for something. */
const OPENED = new Set(['source', 'doc', 'note']);

/** What the shipped config's `floats:` reads as, and the rail it starts the first page from. */
/** The floats the shipped config starts a fresh browser with, read anew so no case shares ids. */
function shippedFloats(): ReturnType<typeof parseFloats> {
    return parseFloats(config.floats);
}
const rail = railPages(config);

/** The envelope a store saved, as far as these cases read it. */
function envelope(storage: ReturnType<typeof fakeStorage>): { version: number; floats: unknown[] } {
    return JSON.parse(storage.held[LAYOUT_KEY]) as { version: number; floats: unknown[] };
}

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

/** A browser tab loaded from pages saved the way this build saves them. */
function booted(held: Pages, follow?: EventTarget): ReturnType<typeof fakeStorage> {
    const storage = fakeStorage(serialiseLayout(held));
    client.layout.loadLayout(storage, follow);
    client.layout.registerOpened((view) => OPENED.has(view));
    return storage;
}

/** Every tab of every page and every float, by id. */
function everyTab(): string[] {
    return [
        ...client.layout.pages().flatMap((page) => tabsOf(page.workbench.root)),
        ...client.layout.floats().flatMap((float) => float.pane.tabs)
    ].map((tab) => tab.id);
}

describe('the shipped floats', () => {
    it('are one float docked right at 0.3 holding hpc and usage, read from layout.yml', () => {
        const floats = shippedFloats();
        expect(floats).toHaveLength(1);
        expect(floats[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
        expect(floats[0].pane.tabs.map((tab) => tab.view)).toEqual(['hpc', 'usage']);
    });

    it('start a browser with no saved layout, and the Focus page is the Focus pane alone', () => {
        client.layout.loadLayout(fakeStorage());
        const first = rail[0];
        client.layout.startOnRailPage(first.page, first.label, first.node, shippedFloats());
        expect(client.layout.floats()).toHaveLength(1);
        expect(client.layout.floats()[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.view)).toEqual([
            'hpc',
            'usage'
        ]);
        expect(viewsOf(client.layout.layout())).toEqual(['focus']);
        expect(client.layout.layout().kind).toBe('pane');
    });

    it('start a browser whose rail names no page, beside the default page', () => {
        client.layout.loadLayout(fakeStorage());
        client.layout.keepDefaultPage(shippedFloats());
        expect(client.layout.floats()).toHaveLength(1);
        expect(client.layout.pages()).toHaveLength(1);
    });

    it('are saved with the pages, and a reload holds them with the same ids', () => {
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        const first = rail[0];
        client.layout.startOnRailPage(first.page, first.label, first.node, shippedFloats());
        const held = client.layout.floats();
        expect(envelope(storage).version).toBe(LAYOUT_VERSION);
        const again = createClientState();
        again.layout.loadLayout(storage);
        expect(again.layout.floats()).toEqual(held);
    });

    it('are put back by Reset all pages, in place of the floats the reader made', () => {
        client.layout.loadLayout(fakeStorage());
        const first = rail[0];
        client.layout.startOnRailPage(first.page, first.label, first.node, shippedFloats());
        const explorer = rail.find((entry) => entry.page === 'explorer');
        if (explorer === undefined) throw new Error('the rail has no Explorer page');
        client.layout.openRailPage(explorer.page, explorer.label, explorer.node);
        client.layout.freeFloat(client.layout.floats()[0].id);
        client.layout.floatPane([0]);
        expect(client.layout.floats()).toHaveLength(2);

        expect(client.layout.resetPages(rail, shippedFloats())).toBe(true);

        const floats = client.layout.floats();
        expect(floats).toHaveLength(1);
        expect(floats[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
        expect(floats[0].pane.tabs.map((tab) => tab.view)).toEqual(['hpc', 'usage']);
    });
});

describe('a layout saved before floats', () => {
    /** A saved version 4 layout whose Focus page holds the Live HPC and Usage pane. */
    function legacy(withHpc = true): string {
        const right = withHpc
            ? {
                  kind: 'pane',
                  tabs: [
                      { id: 'h', view: 'hpc', state: {} },
                      { id: 'u', view: 'usage', state: {} }
                  ],
                  active: 'h'
              }
            : paneOf(['k']);
        const focus = pageAround(
            'focus',
            split('row', [0.7, 0.3], [paneOf(['f']), right as never])
        );
        return JSON.stringify({ version: 4, pages: [focus], current: 'focus' });
    }

    it('takes the shipped floats, each tab of a view of them moved out of its page with its id', () => {
        client.layout.loadLayout(fakeStorage(legacy()));
        expect(client.layout.floats()).toEqual([]);
        client.layout.adoptFloats(shippedFloats());
        expect(client.layout.layout().kind).toBe('pane');
        expect(viewsOf(client.layout.layout())).toEqual(['projects']);
        expect(client.layout.floats()).toHaveLength(1);
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['h', 'u']);
        expect(client.layout.floats()[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
    });

    it('makes the float with new hpc and usage instances when the page held no tab of them', () => {
        client.layout.loadLayout(fakeStorage(legacy(false)));
        client.layout.adoptFloats(shippedFloats());
        expect(viewsOf(client.layout.layout())).toEqual(['projects', 'projects']);
        const tabs = client.layout.floats()[0].pane.tabs;
        expect(tabs.map((tab) => tab.view)).toEqual(['hpc', 'usage']);
        expect(tabs.map((tab) => tab.id)).not.toContain('h');
    });

    it('is saved as version 5 once the floats are taken in, and not before', () => {
        const storage = fakeStorage(legacy());
        client.layout.loadLayout(storage);
        client.layout.openPage('Other');
        expect(envelope(storage).version).toBe(4);
        client.layout.adoptFloats(shippedFloats());
        expect(envelope(storage).version).toBe(LAYOUT_VERSION);
        expect(envelope(storage).floats).toHaveLength(1);
    });

    it("takes none a second time: a layout saved with floats is the reader's own", () => {
        client.layout.loadLayout(fakeStorage(legacy()));
        client.layout.adoptFloats(shippedFloats());
        const once = client.layout.floats().map((float) => float.id);
        client.layout.adoptFloats(shippedFloats());
        expect(client.layout.floats().map((float) => float.id)).toEqual(once);
    });

    it('is left as it is by a browser whose layout was saved with floats', () => {
        booted(heldPages([pageAround('main', paneOf(['a']))], []));
        client.layout.adoptFloats(shippedFloats());
        expect(client.layout.floats()).toEqual([]);
    });
});

describe('a float addressed by its id', () => {
    const FLOAT = floating('fl', ['x', 'y']);

    function withFloat(): void {
        booted(heldPages([pageAround('main', pane(['a', 'b']))], [FLOAT]));
    }

    it('opens a tab in the float, and its last tab closing removes the float', () => {
        withFloat();
        const opened = client.layout.openInPane('status', {}, 'fl', []);
        // the float's active tab is its first, so the new tab opens to the right of it
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual([
            'x',
            opened,
            'y'
        ]);
        client.layout.closeInstance('x');
        client.layout.closeInstance('y');
        expect(client.layout.floats()).toHaveLength(1);
        client.layout.closeInstance(opened);
        expect(client.layout.floats()).toEqual([]);
    });

    it('refuses a split inside a float: a split item, an edge drop and a change that splits it', () => {
        withFloat();
        const before = client.layout.floats();
        client.layout.splitInstance('x', [], 'right', 'fl');
        client.layout.change((tree) => split('row', [0.5, 0.5], [tree, pane(['z'])]), 'fl');
        client.layout.apply({ root: split('row', [0.5, 0.5], [pane(['x']), pane(['y'])]) }, 'fl');
        expect(client.layout.floats()).toEqual(before);
        expect(client.layout.pages()[0].workbench.root).toEqual(pane(['a', 'b']));
    });

    it('removes the float a change leaves with no tab', () => {
        withFloat();
        client.layout.apply({ root: paneOf([]) }, 'fl');
        expect(client.layout.floats()).toEqual([]);
    });

    it('activates a tab, and the pane close closes the float and forgets its tabs', () => {
        withFloat();
        client.layout.activateInstance('y', 'fl');
        expect(client.layout.floats()[0].pane.active).toBe('y');
        client.ui.setInstanceState('x', { typed: 'held' });
        client.layout.closePane([], 'fl');
        expect(client.layout.floats()).toEqual([]);
        expect(client.ui.instanceState('x')).toBeUndefined();
    });

    it('answers a Host without a label for pageOf, at and holding, and a page as a page', () => {
        withFloat();
        const host = client.layout.hostOf('fl');
        expect(host?.id).toBe('fl');
        expect(host).not.toHaveProperty('label');
        expect(host?.workbench.root).toEqual(FLOAT.pane);
        expect(client.layout.hostOf('main')).toHaveProperty('label');
        expect(client.layout.hostOf('nothing')).toBeNull();
        expect(client.layout.workbench('fl').root).toEqual(FLOAT.pane);
        expect(client.layout.layout('fl')).toEqual(FLOAT.pane);
    });

    it('is no page: the page list, the current page and the opening page never name it', () => {
        withFloat();
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        expect(client.layout.pageOf('fl')).toBeNull();
        expect(client.layout.hosts().map((host) => host.id)).toEqual(['main', 'fl']);
        expect(client.layout.currentPage().id).toBe('main');
    });

    it('finds a tab in a float: holding it, its view and its state', () => {
        withFloat();
        expect(client.layout.instanceView('x')).toBe('projects');
        client.layout.restateInstance('x', { restated: true });
        expect(client.layout.instanceLayoutState('x')).toEqual({ restated: true });
        expect(client.layout.floats()[0].pane.tabs[0].state).toEqual({ restated: true });
    });

    it("keeps a tab's state across a page switch, since the float is not drawn by the page", () => {
        booted(
            heldPages(
                [pageAround('one', pane(['a'])), pageAround('two', pane(['b']))],
                [FLOAT],
                'one'
            )
        );
        client.ui.setInstanceState('x', { typed: 'held' });
        client.layout.switchPage('two');
        expect(client.ui.instanceState('x')).toEqual({ typed: 'held' });
        expect(client.layout.floats()[0].id).toBe('fl');
    });
});

describe('the attention', () => {
    it('never rests on a float: a view opened with no page named lands on a page', () => {
        booted(heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])]));
        client.layout.touchPane('fl');
        expect(client.layout.openingInstance()?.id).toBe('a');
        const id = client.layout.openView('note', { id: 'n1' });
        expect(tabsOf(client.layout.pages()[0].workbench.root).map((tab) => tab.id)).toContain(id);
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['x']);
    });

    it('stays on the page it was on after a press in a float', () => {
        booted(
            heldPages(
                [pageAround('one', pane(['a'])), pageAround('two', pane(['b']))],
                [floating('fl', ['x'])],
                'one'
            )
        );
        client.layout.touchPane('one');
        client.layout.touchPane('fl');
        expect(client.layout.openingInstance()?.id).toBe('a');
    });
});

describe('a view opened while its tab is in a float', () => {
    it("activates the float's tab, and makes no second instance anywhere", () => {
        booted(
            heldPages(
                [pageAround('main', pane(['a']))],
                [
                    {
                        ...floating('fl', ['u']),
                        pane: {
                            ...paneOf(['u', 'h']),
                            tabs: [instance('u', 'usage'), instance('h', 'hpc')],
                            active: 'u'
                        }
                    }
                ]
            )
        );
        const id = client.layout.openView('hpc');
        expect(id).toBe('h');
        expect(client.layout.floats()[0].pane.active).toBe('h');
        expect(everyTab().filter((one) => one === 'h')).toHaveLength(1);
        expect(everyTab()).toHaveLength(3);
    });

    it('does the same for a view opened for something, by its record', () => {
        const doc = { id: 'd', view: 'doc', state: { id: 'docs/a.md', path: 'docs/a.md' } };
        booted(
            heldPages(
                [pageAround('main', pane(['a']))],
                [
                    {
                        ...floating('fl', ['x']),
                        pane: { kind: 'pane', tabs: [instance('x'), doc], active: 'x' }
                    }
                ]
            )
        );
        const id = client.layout.openView('doc', { id: 'docs/a.md', path: 'docs/a.md' });
        expect(id).toBe('d');
        expect(client.layout.floats()[0].pane.active).toBe('d');
        expect(everyTab()).toHaveLength(3);
    });
});

describe('the loops over every tab', () => {
    function floated(view: string, state: unknown = {}): void {
        const tab = { id: 'f1', view, state };
        const float: Float = {
            id: 'fl',
            pane: { kind: 'pane', tabs: [tab], active: 'f1' },
            place: FREE_PLACE
        };
        booted(heldPages([pageAround('main', pane(['a']))], [float]));
    }

    it('closes the tabs of a view leaving the registry that sit in a float, and the float', () => {
        floated('hpc');
        client.layout.closeInstancesOfView('hpc');
        expect(client.layout.floats()).toEqual([]);
        expect(everyTab()).toEqual(['a']);
    });

    it('closes the tab of a record deleted that sits in a float, and the float if it was the last', () => {
        floated('note', { id: 'rec' });
        client.layout.closeRecord('note', 'rec');
        expect(client.layout.floats()).toEqual([]);
    });

    it('leaves a float whose other tabs stay', () => {
        const float: Float = {
            id: 'fl',
            pane: {
                kind: 'pane',
                tabs: [
                    { id: 'f1', view: 'hpc', state: {} },
                    { id: 'f2', view: 'usage', state: {} }
                ],
                active: 'f1'
            },
            place: FREE_PLACE
        };
        booted(heldPages([pageAround('main', pane(['a']))], [float]));
        client.layout.closeInstancesOfView('hpc');
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['f2']);
        expect(client.layout.floats()[0].pane.active).toBe('f2');
    });

    it("carries a float's tab to a page, and it is gone from the float", () => {
        booted(
            heldPages(
                [pageAround('main', pane(['a'])), pageAround('two', pane(['b']))],
                [floating('fl', ['x', 'y'])]
            )
        );
        client.layout.moveInstanceToPage('x', 'two');
        expect(viewsOf(client.layout.layout('two'))).toHaveLength(2);
        expect(tabsOf(client.layout.layout('two')).map((tab) => tab.id)).toEqual(['b', 'x']);
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['y']);
        client.layout.moveInstanceToPage('y', 'main');
        expect(client.layout.floats()).toEqual([]);
    });

    it("takes a float's tab dragged into a page pane, the float gone with its last tab", () => {
        booted(heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])]));
        client.layout.transferInstance('x', [], 1, 'main');
        expect(tabsOf(client.layout.layout()).map((tab) => tab.id)).toEqual(['a', 'x']);
        expect(client.layout.floats()).toEqual([]);
        client.layout.floatTab('x', { x: 0.4, y: 0.3 });
        expect(client.layout.floats()).toHaveLength(1);
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['x']);
        expect(client.layout.floats()[0].place).toEqual({
            kind: 'free',
            x: 0.4,
            y: 0.3,
            w: 0.3,
            h: 0.4
        });
    });

    it("makes a float of the only tab of a page's only pane and leaves an empty documents pane", () => {
        booted(heldPages([pageAround('main', paneOf(['s']))], []));
        client.layout.floatTab('s', { x: 0.2, y: 0.2 });
        expect(client.layout.layout()).toEqual(paneOf([]));
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['s']);
    });
});

describe('the pages the store holds beside the floats', () => {
    it('keeps the floats when the last page is closed, and opens the default page', () => {
        booted(heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])]));
        client.layout.closePage('main');
        expect(client.layout.pages()).toHaveLength(1);
        expect(client.layout.pages()[0].id).not.toBe('main');
        expect(client.layout.floats().map((float) => float.id)).toEqual(['fl']);
    });

    it('keeps the floats when a page is closed, opened, renamed and switched', () => {
        booted(heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])]));
        client.layout.openPage('Other');
        client.layout.renamePage('main', 'Home');
        client.layout.switchPage('main');
        client.layout.closePage(client.layout.pages()[1].id);
        expect(client.layout.floats().map((float) => float.id)).toEqual(['fl']);
    });

    it('takes the floats another browser tab saved, as it takes the pages', () => {
        const storage = fakeStorage();
        const window = new EventTarget();
        client.layout.loadLayout(storage, window);
        const other = createClientState();
        other.layout.loadLayout(storage);
        const pagesHeld = other.layout.pages();
        storage.held[LAYOUT_KEY] = serialiseLayout({
            pages: pagesHeld,
            current: pagesHeld[0].id,
            floats: [
                floating('one', ['p']),
                floating('two', ['q'], { kind: 'dock', edge: 'left', size: 0.3 })
            ]
        });
        window.dispatchEvent(Object.assign(new Event('storage'), { key: LAYOUT_KEY }));
        expect(client.layout.floats().map((float) => float.id)).toEqual(['one', 'two']);
        client.layout.renamePage(client.layout.currentPage().id, 'Mine');
        expect(envelope(storage).floats).toHaveLength(2);
    });

    it('docks, frees and returns a float through the store', () => {
        booted(heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])]));
        client.layout.dockFloat('fl', 'bottom');
        expect(client.layout.floats()[0].place).toEqual({
            kind: 'dock',
            edge: 'bottom',
            size: 0.3
        });
        client.layout.freeFloat('fl');
        expect(client.layout.floats()[0].place.kind).toBe('free');
        client.layout.returnFloat('fl');
        expect(client.layout.floats()).toEqual([]);
        expect(
            panes(client.layout.layout()).map(({ pane: one }) => one.tabs.map((tab) => tab.id))
        ).toEqual([['a'], ['x']]);
    });
});

describe('a float locked through the store', () => {
    it('keeps the lock across a dock, a move and a save and read back', () => {
        const storage = booted(
            heldPages([pageAround('main', pane(['a']))], [floating('fl', ['x'])])
        );
        client.layout.change((tree) => setLocked(tree, [], true), 'fl');
        expect(client.layout.floats()[0].pane.locked).toBe(true);
        client.layout.dockFloat('fl', 'bottom');
        client.layout.placeFloat('fl', { kind: 'dock', edge: 'bottom', size: 0.4 });
        client.layout.freeFloat('fl');
        expect(client.layout.floats()[0].pane.locked).toBe(true);
        const again = createClientState();
        again.layout.loadLayout(storage);
        expect(again.layout.floats()[0].pane.locked).toBe(true);
        client.layout.change((tree) => setLocked(tree, [], false), 'fl');
        expect(client.layout.floats()[0].pane.locked).toBeUndefined();
    });

    it('is made from a locked pane of a page, saved and read back locked', () => {
        const storage = booted(
            heldPages([
                pageAround(
                    'main',
                    split('row', [0.5, 0.5], [pane(['a']), { ...paneOf(['b']), locked: true }])
                )
            ])
        );
        client.layout.floatPane([1], 'main');
        expect(client.layout.floats()[0].pane.locked).toBe(true);
        const again = createClientState();
        again.layout.loadLayout(storage);
        expect(again.layout.floats()[0].pane.locked).toBe(true);
    });
});
