// Layer 2, client-state tests. Lock Group: a locked pane is skipped by the landing of a view opened
// for something, still takes a tab dragged or opened onto it, keeps its lock through every
// operation that rebuilds the pane, stays when its last tab goes, and is gone when it is closed as
// a pane. The rules are checked on trees built by hand and then through the store.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    activate,
    closeInstance,
    closePane,
    insertInstance,
    keepInstance,
    moveInstance,
    openInstance,
    panes,
    restate,
    retarget,
    splitPane,
    type Instance,
    type KeepRule,
    type Layout,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { renameInstance, setLocked } from '../../../../../src/lib/state/workbench/layout/tree.ts';
import { landingFor } from '../../../../../src/lib/state/workbench/layout/open/landing.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';
import { fakeStorage, split } from '../layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';

// loadLayout names the page it makes from the text catalog.
setCatalog(textCatalog(loadConfig(engineDir()).config));

const OPENED = new Set(['source', 'doc']);
const opened = (view: string): boolean => OPENED.has(view);

const keep: KeepRule = (view) => {
    if (view === 'terminal') return 'terminals';
    return OPENED.has(view) ? 'documents' : null;
};

function tab(id: string, view = 'doc'): Instance {
    return { id, view, state: { id } };
}

function pane(...tabs: Instance[]): Pane {
    return { kind: 'pane', tabs, active: tabs.at(0)?.id ?? '' };
}

function locked(...tabs: Instance[]): Pane {
    return { ...pane(...tabs), locked: true };
}

function row(...children: Layout[]): Layout {
    return split(
        'row',
        children.map(() => 1 / children.length),
        children
    );
}

/** The paths of the locked panes of a tree. */
function lockedPaths(tree: Layout): string[] {
    return panes(tree)
        .filter(({ pane: one }) => one.locked === true)
        .map(({ path }) => path.join('.'));
}

/** The tab ids of each pane of a tree. */
function tabsOfPanes(tree: Layout): string[][] {
    return panes(tree).map(({ pane: one }) => one.tabs.map((each) => each.id));
}

describe('marking a pane locked', () => {
    it('marks the pane and lifts the mark by removing the field', () => {
        const tree = row(pane(tab('a')), pane(tab('b')));
        const marked = setLocked(tree, [1], true);
        expect(lockedPaths(marked)).toEqual(['1']);
        const lifted = setLocked(marked, [1], false);
        expect(lockedPaths(lifted)).toEqual([]);
        expect('locked' in panes(lifted)[1].pane).toBe(false);
    });

    it('changes nothing for a path that names no pane', () => {
        const tree = row(pane(tab('a')), pane(tab('b')));
        expect(setLocked(tree, [5], true)).toBe(tree);
    });

    it('locks an empty pane', () => {
        const tree = row(pane(tab('a')), pane());
        expect(lockedPaths(setLocked(tree, [1], true))).toEqual(['1']);
    });
});

describe('where a view opened for something lands, with a locked pane', () => {
    it('skips a locked empty pane for the next empty one', () => {
        const tree = row(pane(tab('f', 'files')), locked(), pane());
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [2] });
    });

    it('skips the locked pane that received the last tab of the kind', () => {
        const tree = row(pane(tab('f', 'files')), locked(tab('p1')), pane());
        expect(landingFor(tree, opened, ['p1'], [0])).toEqual({ kind: 'pane', path: [2] });
    });

    it("skips the reader's locked pane that holds opened tabs", () => {
        const tree = row(locked(tab('d')), pane());
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [1] });
    });

    it('skips a locked pane of documents alone', () => {
        const tree = row(pane(tab('f', 'files')), locked(tab('d')), pane(tab('e')));
        expect(landingFor(tree, opened, [], [0])).toEqual({ kind: 'pane', path: [2] });
    });

    it('splits a new pane to the right of the reader when every pane is locked', () => {
        const tree = row(locked(tab('f', 'files')), locked(), locked(tab('d')));
        expect(landingFor(tree, opened, [], [1])).toEqual({ kind: 'split', path: [1] });
    });
});

describe('the operations that rebuild a locked pane', () => {
    const tree = (): Layout => row(locked(tab('a'), tab('b')), pane(tab('c')));

    it('keeps the lock through activate, restate, rename, retarget and open', () => {
        const base = tree();
        const results = [
            activate(base, 'b'),
            restate(base, 'a', { moved: true }),
            renameInstance(base, 'a', 'z'),
            retarget(base, 'a', 'source', {}),
            openInstance(base, [0], tab('n')),
            insertInstance(base, [0], 1, tab('n'))
        ];
        for (const result of results) expect(lockedPaths(result)).toEqual(['0']);
    });

    it('keeps the lock when a preview tab is kept', () => {
        const base = row(locked({ ...tab('a'), preview: true }), pane(tab('c')));
        const kept = keepInstance(base, 'a');
        expect(panes(kept)[0].pane.tabs[0].preview).toBeUndefined();
        expect(lockedPaths(kept)).toEqual(['0']);
    });

    it('keeps the lock when a tab moves within the pane', () => {
        const moved = moveInstance(tree(), 'a', [0], 2);
        expect(tabsOfPanes(moved)[0]).toEqual(['b', 'a']);
        expect(lockedPaths(moved)).toEqual(['0']);
    });

    it('takes a tab dragged onto it from another pane and keeps the lock', () => {
        const base = row(locked(tab('a'), tab('b')), pane(tab('c'), tab('d')));
        const moved = moveInstance(base, 'c', [0], 1);
        expect(tabsOfPanes(moved)).toEqual([['a', 'c', 'b'], ['d']]);
        expect(lockedPaths(moved)).toEqual(['0']);
    });

    it('keeps the lock on the pane a tab was dragged out of', () => {
        const moved = moveInstance(tree(), 'a', [1], 0);
        expect(tabsOfPanes(moved)[0]).toEqual(['b']);
        expect(lockedPaths(moved)).toEqual(['0']);
    });

    it('keeps the lock on the pane that is split and gives the new pane none', () => {
        const result = splitPane(tree(), [0], 'row', tab('s'));
        expect(tabsOfPanes(result).slice(0, 2)).toEqual([['a', 'b'], ['s']]);
        expect(lockedPaths(result)).toEqual(['0']);
    });

    it('stays, empty and locked, when its last tab is closed', () => {
        const once = closeInstance(tree(), 'a');
        const twice = closeInstance(once, 'b');
        expect(tabsOfPanes(twice)).toEqual([[], ['c']]);
        expect(lockedPaths(twice)).toEqual(['0']);
    });

    it('stays when its last tab is closed under the rule that keeps a documents pane', () => {
        const base = row(pane(tab('f', 'files')), pane(), locked(tab('s', 'source')));
        const after = closeInstance(base, 's', keep);
        expect(tabsOfPanes(after)).toEqual([['f'], [], []]);
        expect(lockedPaths(after)).toEqual(['2']);
    });

    it('stays with the kind of what it held when the last Terminal tab closes', () => {
        const base = row(
            pane(tab('f', 'files')),
            pane({ ...tab('u', 'terminal') }),
            locked(tab('t', 'terminal'))
        );
        const once = closeInstance(base, 'u', keep);
        const after = closeInstance(once, 't', keep);
        expect(panes(after).map(({ pane: one }) => one.keeps)).toEqual([
            undefined,
            'terminals',
            'terminals'
        ]);
        expect(lockedPaths(after)).toEqual(['2']);
    });

    it('stays when its last tab is moved out', () => {
        const base = row(locked(tab('a')), pane(tab('c')));
        const moved = moveInstance(base, 'a', [1], 0);
        expect(tabsOfPanes(moved)).toEqual([[], ['a', 'c']]);
        expect(lockedPaths(moved)).toEqual(['0']);
    });

    it('is gone when it is closed as a pane', () => {
        const closed = closePane(tree(), [0]);
        expect(panes(closed)).toHaveLength(1);
        expect(lockedPaths(closed)).toEqual([]);
    });
});

describe('the store with a locked pane', () => {
    let client: ClientState;

    beforeEach(() => {
        client = createClientState();
        client.layout.loadLayout(fakeStorage());
        client.layout.registerOpened(opened);
    });

    it('opens a view in a locked pane named by its path', () => {
        const page = client.layout.currentPage().id;
        client.layout.apply({ root: row(pane(tab('f', 'files')), locked()) });
        const id = client.layout.openInPane('note', { id: 'n', fresh: true }, page, [1]);
        expect(id).not.toBe('');
        const held = panes(client.layout.layout());
        expect(held[1].pane.tabs.map((each) => each.view)).toEqual(['note']);
        expect(held[1].pane.locked).toBe(true);
    });

    it('opens a document in the next empty pane when the first is locked', () => {
        client.layout.apply({ root: row(pane(tab('f', 'files')), locked(), pane()) });
        client.layout.openView('source', { root: 'hub', path: 'a.ts', label: 'a.ts' });
        const held = panes(client.layout.layout());
        expect(held[1].pane.tabs).toHaveLength(0);
        expect(held[2].pane.tabs.map((each) => each.view)).toEqual(['source']);
    });
});
