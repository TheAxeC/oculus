// Pages shown inside other pages: the third kind of node, the rule that a page never shows itself,
// and the store operations that name the page they address. The trees themselves are
// layout.test.ts and the page list is pages.test.ts; what is here is what nesting adds to both.
//
// Nothing here touches localStorage or the DOM: the pure half takes hand-built pages and the store
// takes the storage it is given. The catalog is installed because the store names the page it
// makes.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    checkLayout,
    checkPages,
    containsPage,
    defaultWorkbench,
    embedPage,
    embeddable,
    fold,
    newPage,
    pageLeaf,
    pageLeaves,
    panes as panesOf,
    parseLayout,
    refusedLeaves,
    serialiseLayout,
    settlePageLeaves,
    showable,
    splitPane,
    unembedPage,
    type Layout,
    type Page,
    type Pages
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import {
    bench,
    fakeStorage,
    folded,
    instance,
    pane,
    split,
    three,
    viewsOf
} from './layout-fixture.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A page with a known id, so a leaf can name it without minting one. */
function page(id: string, root: Layout): Page {
    return { id, label: id, workbench: bench(root) };
}

/** Three pages: one holding a leaf of the second, the other two bare. */
function flat(): Pages {
    return {
        pages: [
            page('one', split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])),
            page('two', pane(['b'])),
            page('three', pane(['c']))
        ],
        current: 'one'
    };
}

/**
 * Three pages: one holding a leaf of the second, the second a leaf of the third, the third bare.
 */
function chain(): Pages {
    return {
        pages: [
            page('one', split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])),
            page('two', split('row', [0.5, 0.5], [pane(['b']), pageLeaf('three')])),
            page('three', pane(['c']))
        ],
        current: 'one'
    };
}

describe('the page leaf in a tree', () => {
    it('is a leaf a path names, and holds no pane of its own', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]);
        expect(pageLeaves(tree)).toEqual([{ path: [1], page: 'two' }]);
        expect(panesOf(tree).map(({ path }) => path)).toEqual([[0]]);
        expect(checkLayout(tree)).toEqual([]);
    });

    it('folds to the split edge as any other child does', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]);
        expect(fold(tree, [1])).toEqual(folded(tree, [1]));
    });

    it('takes a neighbour when a tab is dropped on its edge', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]);
        const next = splitPane(tree, [1], 'row', instance('d'));
        expect(pageLeaves(next)).toEqual([{ path: [1], page: 'two' }]);
        expect(panesOf(next).map(({ path }) => path)).toEqual([[0], [2]]);
    });

    it('is written and read back as it is', () => {
        const held = chain();
        const read = parseLayout(serialiseLayout(held), 'Page 1');
        expect(read).toEqual(held);
    });

    it('reads as an empty pane when it names a page the envelope does not hold', () => {
        const held: Pages = {
            pages: [page('one', split('row', [0.5, 0.5], [pane(['a']), pageLeaf('gone')]))],
            current: 'one'
        };
        const read = parseLayout(serialiseLayout(held), 'Page 1');
        expect(read?.pages[0].workbench.root).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pane([])])
        );
    });

    it('is refused by checkLayout when the same page is drawn twice on it', () => {
        const held = flat();
        const twice = split(
            'row',
            [0.34, 0.33, 0.33],
            [pane(['a']), pageLeaf('two'), pageLeaf('two')]
        );
        expect(checkLayout(twice, held, 'one')).toEqual([
            'node at [2]: shows "two", which this page already shows'
        ]);
    });

    it('reads the second drawing of a page as an empty pane, and keeps the first', () => {
        const twice: Pages = {
            pages: [
                page(
                    'one',
                    split(
                        'row',
                        [0.34, 0.33, 0.33],
                        [pane(['a']), pageLeaf('two'), pageLeaf('two')]
                    )
                ),
                page('two', pane(['b']))
            ],
            current: 'one'
        };
        const read = parseLayout(serialiseLayout(twice), 'Page 1');
        expect(pageLeaves(read?.pages[0].workbench.root ?? pane([]))).toEqual([
            { path: [1], page: 'two' }
        ]);
        expect(checkPages(read ?? twice)).toEqual([]);
    });

    it('reads an envelope whose pages show each other with both leaves cleared', () => {
        const loop: Pages = {
            pages: [
                page('one', split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])),
                page('two', split('row', [0.5, 0.5], [pane(['b']), pageLeaf('one')]))
            ],
            current: 'one'
        };
        const read = parseLayout(serialiseLayout(loop), 'Page 1');
        expect(read).not.toBe(null);
        expect(checkPages(read ?? loop)).toEqual([]);
        const leaves = (read?.pages ?? []).flatMap((one) => pageLeaves(one.workbench.root));
        expect(leaves).toEqual([]);
    });

    it('reads a version 4 envelope holding no leaf back as it was written', () => {
        const held: Pages = {
            pages: [page('one', three()), page('two', pane(['z']))],
            current: 'two'
        };
        expect(parseLayout(serialiseLayout(held), 'Page 1')).toEqual(held);
    });

    it('is refused by checkLayout when it names no page of the list, and when it makes a cycle', () => {
        const held = chain();
        const stray = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('gone')]);
        expect(checkLayout(stray, held, 'one')).toEqual([
            'node at [1]: shows "gone", which is not a page'
        ]);
        const back = split('row', [0.5, 0.5], [pane(['c']), pageLeaf('one')]);
        expect(checkLayout(back, held, 'three')).toEqual([
            'node at [1]: shows "one", which shows this page'
        ]);
        expect(checkPages(held)).toEqual([]);
    });
});

describe('containsPage', () => {
    it('answers for a page shown one level down and two levels down', () => {
        const held = chain();
        // The page one shows two, which shows three, so three reaches neither and one reaches both.
        expect(containsPage(held.pages, 'three', 'two')).toBe(true);
        expect(containsPage(held.pages, 'three', 'one')).toBe(true);
        expect(containsPage(held.pages, 'two', 'one')).toBe(true);
        expect(containsPage(held.pages, 'one', 'two')).toBe(false);
        expect(containsPage(held.pages, 'one', 'three')).toBe(false);
        expect(containsPage(held.pages, 'two', 'three')).toBe(false);
    });

    it('says a page may not show itself, nor a page that reaches it', () => {
        const held = chain();
        expect(embeddable(held.pages, 'one', 'one')).toBe(false);
        expect(embeddable(held.pages, 'three', 'one')).toBe(false);
        expect(embeddable(held.pages, 'one', 'gone')).toBe(false);
        // The page one draws three through the page two, so it does not draw it a second time.
        expect(embeddable(held.pages, 'one', 'three')).toBe(false);
        expect(embeddable(flat().pages, 'one', 'three')).toBe(true);
    });
});

describe('embedPage', () => {
    it('splits the pane at the path and puts the page on the edge', () => {
        const held: Pages = {
            pages: [page('one', pane(['a'])), page('two', pane(['b']))],
            current: 'one'
        };
        const next = embedPage(held, 'one', [], 'right', 'two');
        expect(next.pages[0].workbench.root).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])
        );
        expect(checkPages(next)).toEqual([]);
    });

    it('puts the page before the pane for the left and the top edge', () => {
        const held: Pages = {
            pages: [page('one', pane(['a'])), page('two', pane(['b']))],
            current: 'one'
        };
        expect(embedPage(held, 'one', [], 'top', 'two').pages[0].workbench.root).toEqual(
            split('col', [0.5, 0.5], [pageLeaf('two'), pane(['a'])])
        );
    });

    it('changes nothing when the page is the host or already shows it', () => {
        const held = chain();
        expect(embedPage(held, 'one', [0], 'right', 'one')).toBe(held);
        expect(embedPage(held, 'three', [], 'right', 'one')).toBe(held);
        expect(embedPage(held, 'one', [0], 'right', 'gone')).toBe(held);
    });

    it('leaves the page beside the leaf it was dropped on', () => {
        const next = embedPage(flat(), 'one', [1], 'right', 'three');
        expect(pageLeaves(next.pages[0].workbench.root)).toEqual([
            { path: [1], page: 'two' },
            { path: [2], page: 'three' }
        ]);
    });

    it('refuses a page the host already draws, here and through another page', () => {
        const held = flat();
        expect(embedPage(held, 'one', [0], 'right', 'two')).toBe(held);
        const deep = chain();
        expect(embedPage(deep, 'one', [0], 'right', 'three')).toBe(deep);
    });
});

describe('unembedPage', () => {
    it('takes the leaf out and gives its space back to the neighbour', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]);
        expect(unembedPage(tree, [1])).toEqual(pane(['a']));
    });

    it('leaves a path naming a pane or nothing alone', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')]);
        expect(unembedPage(tree, [0])).toBe(tree);
        expect(unembedPage(tree, [9])).toBe(tree);
    });
});

/** The store loaded from a saved set of pages, which is how a case starts from a known one. */
function load(held: Pages): ClientState['layout'] {
    client.layout.loadLayout(fakeStorage(serialiseLayout(held)));
    return client.layout;
}

describe('the store over nested pages', () => {
    it('shows a page at a pane and takes it out again', () => {
        const store = load({
            pages: [page('one', pane(['a'])), page('two', pane(['b']))],
            current: 'one'
        });
        store.embedPage('two', [], 'right');
        expect(store.layout('one')).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])
        );
        store.unembedPage([1]);
        expect(store.layout('one')).toEqual(pane(['a']));
    });

    it('refuses to show a page inside itself or inside a page it shows', () => {
        const store = load(chain());
        store.embedPage('one', [0], 'right');
        store.embedPage('one', [0], 'right', 'three');
        expect(store.layout('one')).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])
        );
        expect(store.layout('three')).toEqual(pane(['c']));
    });

    it('changes the tree of the page an operation names, and not the one on screen', () => {
        const store = load(chain());
        store.openView('venues', undefined, 'three');
        expect(store.layout('one')).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])
        );
        const opened = panesOf(store.layout('three'))[0].pane.tabs;
        expect(opened.map((tab) => tab.view)).toEqual(['projects', 'venues']);
        // The strip shows the same tree when it is switched to the page that was changed.
        store.switchPage('three');
        expect(store.layout()).toEqual(store.layout('three'));
    });

    it('moves a tab onto a page shown nested, and finds its state on that page', () => {
        const store = load(chain());
        store.restateInstance('a', { cursor: 'card-1' });
        store.moveInstanceToPage('a', 'three');
        expect(panesOf(store.layout('one')).flatMap(({ pane: one }) => one.tabs)).toEqual([]);
        expect(panesOf(store.layout('three')).flatMap(({ pane: one }) => one.tabs)).toHaveLength(2);
        expect(store.instanceLayoutState('a')).toEqual({ cursor: 'card-1' });
    });

    it('names the view of a tab on whichever page holds it, and none for a tab no page holds', () => {
        // revert: src/lib/state/workbench/layout/instances.ts:88 => return undefined;
        const store = load(chain());
        store.moveInstanceToPage('a', 'three');
        expect(store.instanceView('a')).toBe('projects');
        expect(store.instanceView('no-such-tab')).toBeUndefined();
    });

    it('takes a tab out of whichever page holds it when one is dragged into a nested pane', () => {
        const store = load(chain());
        store.transferInstance('a', [], 0, 'three');
        expect(store.layout('one')).toEqual(pageLeaf('two'));
        expect(panesOf(store.layout('three'))[0].pane.tabs.map((tab) => tab.id)).toEqual([
            'a',
            'c'
        ]);
    });

    it('splits a pane of a nested page with a tab dragged from the page around it', () => {
        const store = load(chain());
        store.splitInstance('a', [], 'right', 'three');
        expect(panesOf(store.layout('three')).map(({ path }) => path)).toEqual([[0], [1]]);
        expect(store.layout('one')).toEqual(pageLeaf('two'));
    });

    it('clears every leaf naming a page that is closed', () => {
        const store = load(chain());
        store.closePage('two');
        expect(store.layout('one')).toEqual(pane(['a']));
        expect(checkPages({ pages: store.pages(), current: store.currentPage().id })).toEqual([]);
    });

    it('keeps the page a leaf names when another page is closed', () => {
        const store = load(chain());
        store.closePage('three');
        expect(store.layout('one')).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pageLeaf('two')])
        );
        expect(store.layout('two')).toEqual(pane(['b']));
    });

    it('addresses the page on screen when an operation names none', () => {
        const store = load({ pages: [page('one', three()), newPage('Two')], current: 'one' });
        store.closePane([0]);
        expect(store.layout()).toEqual(store.layout('one'));
        expect(panesOf(store.layout('one')).map(({ path }) => path)).toEqual([[0], [1]]);
    });

    it('folds and expands a child of the page an operation names', () => {
        const store = load({
            pages: [page('one', pane(['z'])), page('two', three())],
            current: 'one'
        });
        store.foldPane([1], 'two');
        expect(store.layout('two')).toEqual(folded(three(), [1]));
        store.expandChild([], 1, 'two');
        expect(store.layout('two')).toEqual(three());
    });

    it('maximises and restores a pane of the page an operation names', () => {
        const store = load({
            pages: [page('one', pane(['z'])), page('two', three())],
            current: 'one'
        });
        store.maximisePane([1, 0], 'two');
        expect(store.focused('two')).toEqual({ path: [1, 0] });
        expect(store.focused()).toBe(null);
        store.restorePanes('two');
        expect(store.focused('two')).toBe(null);
    });

    it('starts from a workbench the default pages hold, which holds no leaf', () => {
        expect(pageLeaves(defaultWorkbench().root)).toEqual([]);
    });

    it('opens a view in the page of the pane the reader last acted in', () => {
        const store = load(chain());
        store.touchPane('three');
        store.openView('venues');
        expect(panesOf(store.layout('three'))[0].pane.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
        expect(panesOf(store.layout('one'))[0].pane.tabs.map((tab) => tab.view)).toEqual([
            'projects'
        ]);
    });

    it('opens it beside in that page too, and forgets the pane when the strip is switched', () => {
        const store = load(chain());
        store.touchPane('three');
        store.openBeside('venues');
        expect(panesOf(store.layout('three')).map(({ path }) => path)).toEqual([[0], [1]]);
        store.switchPage('two');
        store.openView('radar');
        expect(panesOf(store.layout('two')).flatMap(({ pane: one }) => one.tabs)).toHaveLength(2);
        expect(panesOf(store.layout('three')).flatMap(({ pane: one }) => one.tabs)).toHaveLength(2);
    });

    it('ignores a touch on a page the list does not hold', () => {
        const store = load(chain());
        store.touchPane('gone');
        store.openView('venues');
        expect(panesOf(store.layout('one'))[0].pane.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
    });

    it('does nothing at all when an operation names a page that is gone', () => {
        const store = load(chain());
        const before = store.pages();
        store.unembedPage([1], 'gone');
        store.closePane([0], 'gone');
        store.embedPage('three', [0], 'right', 'gone');
        store.foldPane([1], 'gone');
        store.transferInstance('a', [0], 0, 'gone');
        store.splitInstance('a', [0], 'right', 'gone');
        store.maximisePane([0], 'gone');
        store.restorePanes('gone');
        store.closeInstance('zz', 'gone');
        expect(store.pages()).toBe(before);
        expect(store.layout('gone')).toEqual(pane([]));
    });
});

describe('one drawing of a page on a screen', () => {
    /**
     * Two pages that both draw the third: the first is the screen, the second a page it may show.
     */
    function shared(): Pages {
        return {
            pages: [
                page('one', split('row', [0.5, 0.5], [pane(['a']), pageLeaf('three')])),
                page('two', split('row', [0.5, 0.5], [pane(['b']), pageLeaf('three')])),
                page('three', pane(['c']))
            ],
            current: 'one'
        };
    }

    it('refuses a page whose own leaves draw a page the screen already draws', () => {
        const held = shared();
        expect(embeddable(held.pages, 'one', 'two')).toBe(true);
        expect(showable(held.pages, 'one', 'one', 'two')).toBe(false);
        const store = load(held);
        const before = store.pages();
        store.embedPage('two', [0], 'right');
        expect(store.pages()).toBe(before);
    });

    it('is what checkPages and the parser agree on: a settled envelope reads back', () => {
        const held = shared();
        const twice = {
            ...held,
            pages: held.pages.map((one) =>
                one.id === 'one'
                    ? page(
                          'one',
                          split(
                              'row',
                              [0.4, 0.3, 0.3],
                              [pane(['a']), pageLeaf('two'), pageLeaf('three')]
                          )
                      )
                    : one
            )
        };
        expect(refusedLeaves(twice.pages, 'one', twice.pages[0].workbench.root)).toEqual([
            { path: [2], page: 'three', why: 'twice' }
        ]);
        const settled = settlePageLeaves(twice);
        expect(checkPages(settled)).toEqual([]);
        expect(settled.pages[0].workbench.root).toEqual(
            split('row', [0.4, 0.3, 0.3], [pane(['a']), pageLeaf('two'), pane([])])
        );
        const read = parseLayout(JSON.parse(serialiseLayout(twice)), 'P');
        expect(read).not.toBeNull();
        expect(read?.pages[0].workbench.root).toEqual(settled.pages[0].workbench.root);
    });
});

describe('the page the reader is in', () => {
    it('forgets a touched page once the screen no longer draws it', () => {
        const store = load(chain());
        store.touchPane('two');
        store.unembedPage([1], 'one');
        store.openView('venues');
        expect(viewsOf(store.layout('one'))).toContain('venues');
        expect(viewsOf(store.layout('two'))).not.toContain('venues');
    });

    it('forgets a touched page when a pane of another page is maximised', () => {
        const store = load(chain());
        store.touchPane('two');
        store.maximisePane([0], 'one');
        store.openView('venues');
        expect(viewsOf(store.layout('two'))).not.toContain('venues');
    });

    it('is set by activating a tab, which is where the next view opens', () => {
        const store = load(chain());
        store.activateInstance('b');
        store.openView('venues');
        expect(viewsOf(store.layout('two'))).toContain('venues');
    });
});
