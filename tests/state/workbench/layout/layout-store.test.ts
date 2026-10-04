// Layer 2, client-state tests. The layout store: its load and save through a fake storage, opening
// a view beside the active pane, the panes of one tree, and folding a child of a split. Nothing
// here touches localStorage or the DOM: the store takes the storage it is given. The pure tree is
// layout.test.ts beside this.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    checkWorkbench,
    openInstance,
    paneAt,
    panes as panesOf,
    type Layout
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import { fields } from '../../../../src/lib/data/helpers/guards.ts';
import {
    bench,
    docked,
    fakeStorage,
    folded,
    instance,
    pane,
    saveBench,
    savedBench,
    split,
    three,
    viewsOf
} from './layout-fixture.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { foldedOf } from './layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

// The trees, the workbenches and the fake Storage are
// tests/state/workbench/layout/layout-fixture.ts, shared with the pages suite beside this one. The
// catalog is installed because loadLayout names the page it makes, and a page is named from
// the text catalogs like everything else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

let activateInstance: ClientState['layout']['activateInstance'];

let activeInstance: ClientState['layout']['activeInstance'];

let apply: ClientState['layout']['apply'];

let change: ClientState['layout']['change'];

let closeInstanceOnPage: ClientState['layout']['closeInstance'];

let closePaneOnPage: ClientState['layout']['closePane'];

let expandChild: ClientState['layout']['expandChild'];

let focused: ClientState['layout']['focused'];

let foldPane: ClientState['layout']['foldPane'];

let layout: ClientState['layout']['layout'];

let loadLayout: ClientState['layout']['loadLayout'];

let maximisePane: ClientState['layout']['maximisePane'];

let openBeside: ClientState['layout']['openBeside'];

let openView: ClientState['layout']['openView'];

let restorePanes: ClientState['layout']['restorePanes'];

let splitInstance: ClientState['layout']['splitInstance'];

let transferInstance: ClientState['layout']['transferInstance'];

let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({
        activateInstance,
        activeInstance,
        apply,
        change,
        closeInstance: closeInstanceOnPage,
        closePane: closePaneOnPage,
        expandChild,
        focused,
        foldPane,
        layout,
        loadLayout,
        maximisePane,
        openBeside,
        openView,
        restorePanes,
        splitInstance,
        transferInstance,
        workbench
    } = client.layout);
});

describe('the store', () => {
    it('uses the first pane active tab by default', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b'], 'b'), pane(['c'])])));
        expect(activeInstance()).toEqual(instance('b'));
    });

    it('follows the pane whose tab was activated last', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c', 'd'])])));
        activateInstance('d');
        expect(activeInstance()).toEqual(instance('d'));
        activateInstance('b');
        expect(activeInstance()).toEqual(instance('b'));
    });

    it('starts from the default when storage holds nothing, and says so', () => {
        const storage = fakeStorage();
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout())).toEqual(['status']);
        expect(layout().kind).toBe('pane');
    });

    it('restores a saved arrangement, migrating the two trees it was written as', () => {
        const storage = fakeStorage(saveBench(docked(three(), pane(['p']), 'bottom', 0.4)));
        expect(loadLayout(storage)).toBe(true);
        expect(workbench()).toEqual(bench(split('col', [0.6, 0.4], [three(), pane(['p'])])));
    });

    it('falls back to the default on a saved value that fails parseLayout, and overwrites it on the next change', () => {
        const storage = fakeStorage(JSON.stringify({ version: 1, layout: { kind: 'box' } }));
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout())).toEqual(['status']);

        const saved = bench(three());
        apply(saved);
        expect(workbench()).toEqual(saved);
        expect(fields(JSON.parse(storage.held[LAYOUT_KEY])).version).toBe(LAYOUT_VERSION);
        expect(savedBench(storage)).toEqual(saved);
    });

    it('applies an operation to the page tree and saves the whole workbench under the one key', () => {
        const storage = fakeStorage(saveBench(docked(pane(['a']), pane([]), 'hidden')));
        loadLayout(storage);
        change((tree) => openInstance(tree, [], instance('q')));
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        expect(layout()).toEqual({ ...pane(['a', 'q'], 'q'), recent: ['a'] });
        expect(savedBench(storage)).toEqual(workbench());
    });

    // One view, one instance per project: the project view is registered once, so the state's `id`
    // is what tells two of its tabs apart.
    it.each([
        ['a view with no state', 'status', undefined, ['status']],
        ['the same state', 'project', { id: 'alpha' }, ['status', 'project']]
    ] as const)(
        'activates the instance a view already has for %s rather than opening a second',
        (_name, view, state, views) => {
            loadLayout(fakeStorage());
            openView(view, state);
            const opened = layout();
            const held = opened.kind === 'pane' ? opened.active : '';
            openView(view, state);
            const after = layout();
            expect(viewsOf(after)).toEqual(views);
            expect(after.kind === 'pane' ? after.active : '').toBe(held);
        }
    );

    it('opens a second instance of one view for a second state', () => {
        loadLayout(fakeStorage());
        openView('project', { id: 'alpha' });
        openView('project', { id: 'bravo' });
        const after = layout();
        expect(viewsOf(after)).toEqual(['status', 'project', 'project']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { id: 'alpha' }, { id: 'bravo' }]);
    });

    it('still retargets the one instance when the state names no id', () => {
        loadLayout(fakeStorage());
        openView('editor', { field: 'title' });
        openView('editor', { field: 'venue' });
        const after = layout();
        expect(viewsOf(after)).toEqual(['status', 'editor']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { field: 'venue' }]);
    });

    it('opens a view the tree does not hold in the pane last activated', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        activateInstance('b');
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
    });

    it('opens into the first pane when nothing has been activated since the load', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
    });

    it('closes an instance and leaves the rest of the tree where it is', () => {
        loadLayout(fakeStorage(saveBench(docked(pane(['a', 'b']), pane([]), 'hidden'))));
        closeInstanceOnPage('a');
        expect(layout()).toEqual(pane(['b'], 'b'));
    });
});

describe('the store: opening a view beside the active pane', () => {
    it('puts a view the tree does not hold in a new pane to the right', () => {
        loadLayout(fakeStorage());
        openBeside('venues');
        expect(layout().kind).toBe('split');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['status']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('activates a view already open rather than opening a second pane', () => {
        loadLayout(fakeStorage());
        const first = openBeside('venues');
        const again = openBeside('venues');
        expect(again).toBe(first);
        expect(viewsOf(layout())).toEqual(['status', 'venues']);
    });

    it('opens beside the pane the last activated tab is in', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        activateInstance('b');
        openBeside('venues');
        expect(paneAt(layout(), [2])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
    });

    it('opens into the maximised pane, which is the only one anybody can see', () => {
        loadLayout(fakeStorage());
        maximisePane([]);
        openBeside('venues');
        expect(layout().kind).toBe('pane');
        expect(viewsOf(layout())).toEqual(['status', 'venues']);
    });

    it('puts the next one in the pane the last one made, as a second tab', () => {
        loadLayout(fakeStorage());
        openBeside('venues');
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(2);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['status']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['venues', 'funding']);
    });

    it('splits again once the pane the last one made is gone', () => {
        loadLayout(fakeStorage());
        const first = openBeside('venues');
        closeInstanceOnPage(first);
        expect(layout().kind).toBe('pane');
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(2);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['funding']);
    });

    it('forgets the pane it made on a load, so the next one opens in a pane of its own', () => {
        const storage = fakeStorage();
        loadLayout(storage);
        openBeside('venues');
        loadLayout(storage);
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(3);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['funding']);
        expect(paneAt(layout(), [2])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
    });
});

describe('the store: the panes of one tree', () => {
    /** A two-pane tree, loaded and saved through a fake storage. */
    function load(root: Layout = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])])) {
        const storage = fakeStorage(saveBench(docked(root, pane([]), 'hidden')));
        loadLayout(storage);
        return storage;
    }

    it('closes a whole pane and saves what is left', () => {
        const storage = load();
        closePaneOnPage([1]);
        expect(layout()).toEqual(pane(['a']));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('moves a tab to another pane and saves it there', () => {
        const storage = load();
        transferInstance('c', [0], 0);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.id)).toEqual(['c', 'a']);
        expect(paneAt(layout(), [1])).toEqual(pane(['b'], 'b'));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('splits a pane with a tab and saves the new arrangement', () => {
        const storage = load();
        splitInstance('c', [0], 'bottom');
        expect(layout()).toEqual(
            split(
                'row',
                [0.5, 0.5],
                [split('col', [0.5, 0.5], [pane(['a']), pane(['c'])]), pane(['b'], 'b')]
            )
        );
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('leaves the tree alone when the move performs nothing', () => {
        load();
        const before = workbench();
        transferInstance('nobody', [0], 0);
        expect(workbench()).toBe(before);
    });

    it('maximises a pane, saves it, and restores', () => {
        const storage = load();
        maximisePane([1]);
        expect(focused()).toEqual({ path: [1] });
        expect(savedBench(storage)?.focus).toEqual({ path: [1] });
        restorePanes();
        expect(focused()).toBe(null);
        expect(savedBench(storage)?.focus).toBe(undefined);
    });

    it('drops the focus when the maximised pane is closed', () => {
        load();
        maximisePane([1]);
        closePaneOnPage([1]);
        expect(focused()).toBe(null);
        expect(layout()).toEqual(pane(['a']));
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('opens a view into the maximised pane rather than the pane last activated', () => {
        load();
        activateInstance('a');
        maximisePane([1]);
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        // the pane's active tab is its first, so the new tab opens to the right of it
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues',
            'projects'
        ]);
        expect(focused()).toEqual({ path: [1] });
    });

    it('opens a second instance of a view that is open in a pane nobody can see', () => {
        load(
            split(
                'row',
                [0.5, 0.5],
                [{ kind: 'pane', tabs: [instance('a', 'venues')], active: 'a' }, pane(['b'])]
            )
        );
        maximisePane([1]);
        openView('venues');
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
    });

    it('brings the arrangement back when a tab is moved into a pane nobody can see', () => {
        load();
        maximisePane([1]);
        transferInstance('c', [0], 0);
        expect(focused()).toBe(null);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.id)).toEqual(['c', 'a']);
    });
});

describe('the store: folding a child of a split', () => {
    /** A two-pane tree, loaded and saved through a fake storage. */
    function load() {
        const root = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const storage = fakeStorage(saveBench(docked(root, pane([]), 'hidden')));
        loadLayout(storage);
        return storage;
    }

    it('folds a pane in its parent split and saves the folded state', () => {
        const storage = load();
        foldPane([1]);
        expect(foldedOf(layout())).toEqual([1]);
        expect(savedBench(storage)).toEqual(workbench());
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('expands it again, at the share it kept', () => {
        load();
        foldPane([1]);
        expandChild([], 1);
        expect(layout()).toEqual(split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]));
    });

    it('leaves a maximised pane maximised when the root path is folded', () => {
        load();
        maximisePane([1]);
        const before = workbench();
        foldPane([]);
        expect(focused()).toEqual({ path: [1] });
        expect(workbench()).toBe(before);
    });

    it('keeps the maximised pane when another child is folded', () => {
        const root = split('row', [0.4, 0.3, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        loadLayout(fakeStorage(saveBench(docked(root, pane([]), 'hidden'))));
        maximisePane([2]);
        foldPane([0]);
        expect(focused()).toEqual({ path: [2] });
        expect(foldedOf(layout())).toEqual([0]);
    });

    it('gives the maximised pane back before folding the child that holds it', () => {
        load();
        maximisePane([1]);
        foldPane([1]);
        expect(focused()).toBe(null);
        expect(foldedOf(layout())).toEqual([1]);
    });

    it('expands the pane a tab is dropped into', () => {
        load();
        foldPane([1]);
        transferInstance('a', [1], 0);
        expect(layout()).toEqual({
            kind: 'pane',
            tabs: [instance('a'), instance('b'), instance('c')],
            active: 'a',
            recent: ['b']
        });
    });

    it('expands every folded ancestor of the pane a view is opened into', () => {
        const inner = folded(split('row', [0.5, 0.5], [pane(['b']), pane(['c'])]), [1]);
        const tree = folded(split('row', [0.5, 0.5], [pane(['a']), inner]), [1]);
        loadLayout(fakeStorage(saveBench(docked(tree, pane([]), 'hidden'))));
        activateInstance('c');
        openView('venues');
        expect(foldedOf(layout())).toBe(undefined);
        const root = layout();
        const child = root.kind === 'split' ? root.children[1] : null;
        expect(child !== null && child.kind === 'split' ? child.folded : 'missing').toBe(undefined);
        expect(paneAt(layout(), [1, 1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
    });
});
