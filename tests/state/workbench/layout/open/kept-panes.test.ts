// Layer 2, client state tests. The pane a page keeps when its last tab goes: a view opened for
// something leaves an empty documents pane, a Terminal tab an empty terminals pane, and a page
// holds at most one empty pane of each kind. The rule is checked on trees built by hand, with the
// rule the store hands the tree functions, and then through the store on the Explorer arrangement,
// where the registry says which views are opened for something. A float is never kept empty.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    closeInstance,
    closePane,
    moveInstance,
    panes,
    removeTab,
    serialiseLayout,
    type Float,
    type KeepRule,
    type Layout,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { parseArrangement } from '../../../../../src/lib/state/workbench/navigation/arrangement.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';
import {
    FREE_PLACE,
    fakeStorage,
    heldPages,
    instance,
    pageAround,
    split,
    viewsOf
} from '../layout-fixture.ts';
import { present } from '../../../../fixtures/present.ts';
import Alpha from '../../../../shell/fixtures/Alpha.svelte';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const OPENED = new Set(['source', 'doc', 'file']);

/**
 * The rule the store hands the tree: a Terminal tab keeps a terminals pane, an opened view a
 * documents one.
 */
const keep: KeepRule = (view) => {
    if (view === 'terminal') return 'terminals';
    return OPENED.has(view) ? 'documents' : null;
};

/** One pane of tabs by `id:view`, the first the active one. */
function of(...tabs: string[]): Pane {
    const held = tabs.map((tab) => {
        const [id, view] = tab.split(':');
        return { ...instance(id), view };
    });
    return { kind: 'pane', tabs: held, active: held.at(0)?.id ?? '' };
}

/** The tabs of each pane of a tree, and `keeps` where a pane carries it. */
function shape(tree: Layout): (string[] | string)[] {
    return panes(tree).map(({ pane: one }) => {
        const ids = one.tabs.map((tab) => tab.id);
        return one.keeps === undefined ? ids : `${ids.join(',')}|${one.keeps}`;
    });
}

describe('the pane a close keeps, over a tree', () => {
    const row = (...children: Layout[]): Layout =>
        split(
            'row',
            children.map(() => 1 / children.length),
            children
        );

    it('keeps an empty documents pane when the last tab of a view opened for something closes', () => {
        const tree = row(of('f:files'), of('s:source'));
        const after = closeInstance(tree, 's', keep);
        expect(shape(after)).toEqual([['f'], []]);
    });

    it('removes a pane whose last tab is a tool view, as a close always did', () => {
        const tree = row(of('f:files'), of('s:source'));
        expect(shape(closeInstance(tree, 'f', keep))).toEqual([['s']]);
    });

    it('removes the pane when no rule is handed over', () => {
        const tree = row(of('f:files'), of('s:source'));
        expect(shape(closeInstance(tree, 's'))).toEqual([['f']]);
    });

    it('keeps a pane left with other tabs as it was: only the last tab keeps anything', () => {
        const tree = row(of('f:files'), of('s:source', 'd:doc'));
        expect(shape(closeInstance(tree, 's', keep))).toEqual([['f'], ['d']]);
    });

    it('keeps an empty terminals pane carrying its kind when the last Terminal tab closes', () => {
        const tree = row(of('f:files'), of('t:terminal'));
        expect(shape(closeInstance(tree, 't', keep))).toEqual([['f'], '|terminals']);
    });

    it('closes a second Terminal pane emptied on a page that already holds an empty terminals pane', () => {
        const tree = row(of('f:files'), of('t:terminal'), of('u:terminal'));
        const once = closeInstance(tree, 't', keep);
        expect(shape(once)).toEqual([['f'], '|terminals', ['u']]);
        expect(shape(closeInstance(once, 'u', keep))).toEqual([['f'], '|terminals']);
    });

    it('closes a second pane emptied of a document on a page that already holds an empty documents pane', () => {
        const tree = row(of('f:files'), of(), of('s:source'));
        expect(shape(closeInstance(tree, 's', keep))).toEqual([['f'], []]);
    });

    it('keeps one of each kind: a documents pane and a terminals pane side by side', () => {
        const tree = row(of('f:files'), of('s:source'), of('t:terminal'));
        const after = closeInstance(closeInstance(tree, 's', keep), 't', keep);
        expect(shape(after)).toEqual([['f'], [], '|terminals']);
    });

    it('keeps the only pane of a page empty, carrying the kind of what it held', () => {
        expect(shape(closeInstance(of('t:terminal'), 't', keep))).toEqual(['|terminals']);
        expect(shape(closeInstance(of('s:source'), 's', keep))).toEqual([[]]);
    });

    it('keeps the pane a tab is dragged out of, as a close keeps it', () => {
        const tree = row(of('s:source'), of('f:files'));
        const after = moveInstance(tree, 's', [1], 1, keep);
        expect(shape(after)).toEqual([[], ['f', 's']]);
    });

    it('goes through removeTab with the same rule', () => {
        const tree = row(of('f:files'), of('s:source'));
        expect(shape(removeTab(tree, [1], 0, keep))).toEqual([['f'], []]);
    });

    it('removes a kept pane when it is closed as a pane', () => {
        const tree = row(of('f:files'), of('s:source'));
        const kept = closeInstance(tree, 's', keep);
        expect(shape(closePane(kept, [1]))).toEqual([['f']]);
    });
});

let client: ClientState;
let loadLayout: ClientState['layout']['loadLayout'];
let apply: ClientState['layout']['apply'];
let layout: ClientState['layout']['layout'];
let openView: ClientState['layout']['openView'];
let closeInstanceInStore: ClientState['layout']['closeInstance'];

beforeEach(() => {
    client = createClientState();
    ({ loadLayout, apply, layout, openView } = client.layout);
    closeInstanceInStore = client.layout.closeInstance;
    loadLayout(fakeStorage());
    client.layout.registerOpened((view) => OPENED.has(view));
});

/** The shipped Explorer arrangement, as the rail makes its page. */
function explorer(): ReturnType<typeof parseArrangement> {
    return parseArrangement(
        (loadConfig(engineDir()).config.arrangements as Record<string, unknown>).explorer
    );
}

function onExplorer(): void {
    apply(present(explorer(), 'the Explorer arrangement'));
}

describe('the Explorer arrangement', () => {
    it('leaves the right pane empty, a documents pane, when its only tab, a source tab, closes', () => {
        onExplorer();
        const id = openView('source', { root: 'hub', path: 'a.py', label: 'a.py' });
        expect(viewsOf(layout())).toEqual(['files', 'repositories', 'search', 'source']);
        closeInstanceInStore(id);
        expect(shape(layout())).toHaveLength(2);
        expect(shape(layout())[1]).toEqual([]);
    });

    it('removes the left pane when its last tab, a tool view, closes, as before', () => {
        onExplorer();
        const ids = panes(layout())[0].pane.tabs.map((tab) => tab.id);
        for (const id of ids) closeInstanceInStore(id);
        expect(shape(layout())).toEqual([[]]);
    });
});

describe('every route that takes the last tab out of a pane', () => {
    /** A page of a tool pane and one pane holding one opened tab, which is on screen. */
    function twoPanes(): void {
        apply({
            root: split('row', [0.5, 0.5], [of('f:files'), of('s:source')])
        });
    }

    it('keeps the pane on an edge drop of its last tab, beside the new pane', () => {
        twoPanes();
        client.layout.splitInstance('s', [0], 'right');
        expect(shape(layout())).toEqual([['f'], ['s'], []]);
    });

    it('keeps the pane on a drag of its last tab to a strip of another pane', () => {
        twoPanes();
        client.layout.transferInstance('s', [0], 1);
        expect(shape(layout())).toEqual([['f', 's'], []]);
    });

    it('keeps the pane when its last tab is carried to another page', () => {
        twoPanes();
        const from = client.layout.currentPage().id;
        client.layout.openPage('Other');
        const to = client.layout.currentPage().id;
        client.layout.switchPage(from);
        client.layout.moveInstanceToPage('s', to);
        expect(shape(layout(from))).toEqual([['f'], []]);
    });

    it('keeps the pane when a record deleted closes the tab', () => {
        const record: Pane = {
            kind: 'pane',
            tabs: [{ id: 'n', view: 'source', state: { id: 'rec' } }],
            active: 'n'
        };
        apply({ root: split('row', [0.5, 0.5], [of('f:files'), record]) });
        client.layout.closeRecord('source', 'rec');
        expect(shape(layout())).toEqual([['f'], []]);
    });

    it('keeps the pane when the view leaves the registry, which the registry still holds as opened', () => {
        const fresh = createClientState();
        fresh.layout.loadLayout(fakeStorage());
        fresh.registry.registerView({
            id: 'source',
            label: 'views.status',
            glyph: 'views.status_glyph',
            component: Alpha,
            group: '',
            order: 0
        });
        fresh.layout.apply({ root: split('row', [0.5, 0.5], [of('f:files'), of('s:source')]) });
        fresh.registry.unregisterView('source');
        expect(shape(fresh.layout.layout())).toEqual([['f'], []]);
    });

    it('keeps the pane when a file tab closes itself through the store, as File.svelte does', () => {
        apply({ root: split('row', [0.5, 0.5], [of('f:files'), of('x:file')]) });
        closeInstanceInStore('x');
        expect(shape(layout())).toEqual([['f'], []]);
    });

    it('keeps a terminals pane when the last Terminal tab closes through the store', () => {
        apply({ root: split('row', [0.5, 0.5], [of('f:files'), of('t:terminal')]) });
        closeInstanceInStore('t');
        expect(shape(layout())).toEqual([['f'], '|terminals']);
    });
});

describe('a float', () => {
    it('is removed when its last tab goes, never kept empty, whatever the tab is', () => {
        const float: Float = { id: 'fl', pane: of('s:source'), place: FREE_PLACE };
        const held = heldPages([pageAround('main', of('f:files'))], [float]);
        const fresh = createClientState();
        fresh.layout.loadLayout(fakeStorage(serialiseLayout(held)));
        fresh.layout.registerOpened((view) => OPENED.has(view));
        fresh.layout.closeInstance('s');
        expect(fresh.layout.floats()).toEqual([]);
    });
});
