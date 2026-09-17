// Instance identity and lookups on hand-built layout trees, separate from tree mutation tests.

import { describe, expect, it } from 'vitest';
import {
    activePath,
    cardCursor,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    reconcileCardCursor,
    stateId,
    tabsOf,
    withCardCursor
} from '../../src/lib/state/instance.ts';
import { instance, pane, split, three } from './layout-fixture.ts';
import type { Layout } from '../../src/lib/state/layout/index.ts';

describe('instance identity and lookups', () => {
    it('lists every pane with its path, depth first', () => {
        expect(panes(three()).map((found) => found.path)).toEqual([[0], [1, 0], [1, 1]]);
        expect(panes(pane([])).map((found) => found.path)).toEqual([[]]);
    });

    it('lists every tab of a tree at any depth of splits, and none of a page a leaf shows', () => {
        // Revert: make tabsOf return the first pane's tabs only. That a closed page keeps the tabs of a
        // page its leaf shows is tests/state/layout-close.test.ts.
        const tree = split(
            'row',
            [0.5, 0.5],
            [
                pane(['a']),
                split('col', [0.5, 0.5], [pane(['b', 'c']), { kind: 'page', page: 'other' }])
            ]
        );
        expect(tabsOf(tree).map((tab) => tab.id)).toEqual(['a', 'b', 'c']);
        expect(tabsOf(pane([]))).toEqual([]);
        expect(tabsOf({ kind: 'page', page: 'other' })).toEqual([]);
    });

    it('finds an instance, its pane and its index', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])]);
        expect(findInstance(tree, 'b')).toEqual({ instance: instance('b'), path: [0], index: 1 });
        expect(findInstance(tree, 'c')).toEqual({ instance: instance('c'), path: [1], index: 0 });
        expect(findInstance(tree, 'z')).toBe(null);
    });

    it('uses a session pin as the instance identity after an explicit id', () => {
        expect(stateId({ session: 'one', label: 'One' })).toBe('one');
        expect(stateId({ id: 'project', session: 'one' })).toBe('project');
        for (const value of [null, [], 'one', { label: 'One' }, { root: 'hub', path: '' }]) {
            expect(stateId(value)).toBe(null);
        }
    });

    it('matches both view and identity, with omitted and explicit unpinned identities', () => {
        const first = { id: 'one', view: 'source', state: { root: 'hub', path: 'notes.md' } };
        const second = { id: 'two', view: 'source', state: {} };
        const tree: Layout = { kind: 'pane', tabs: [first, second], active: first.id };
        const identity = stateId(first.state);
        expect(isInstanceOf(first, 'source', identity)).toBe(true);
        expect(isInstanceOf(first, 'document', identity)).toBe(false);
        expect(isInstanceOf(first, 'source', null)).toBe(false);
        expect(findView(tree, 'source')).toBe(first);
        expect(findView(tree, 'source', identity)).toBe(first);
        expect(findView(tree, 'source', null)).toBe(second);
        expect(findView(tree, 'source', 'absent')).toBe(null);
    });

    it('chooses the active instance pane or the first pane as a fallback', () => {
        expect(activePath(three(), 'c')).toEqual([1, 1]);
        expect(activePath(three(), 'missing')).toEqual([0]);
        expect(activePath(three(), null)).toEqual([0]);
        expect(activePath(pane([]), '')).toEqual([]);
    });

    it('gives each new instance its own id while retaining view state', () => {
        const state = { root: 'hub', path: 'notes.md' };
        const first = newInstance('source', state);
        const second = newInstance('source', state);
        expect(first.id).not.toBe(second.id);
        expect(first).toMatchObject({ view: 'source', state });
        expect(first.state).toBe(state);
        expect(newInstance('status').state).toEqual({});
    });

    it('stores the cursor only while a card is held', () => {
        const state = { filter: 'open' };
        expect(withCardCursor(state, null)).toBe(state);
        expect(withCardCursor(state, 'card-two')).toEqual({ filter: 'open', cursor: 'card-two' });
        expect(withCardCursor({ filter: 'open', cursor: 'card-two' }, null)).toEqual({
            filter: 'open'
        });
    });

    it('keeps a card cursor across a render and clears it when that card is gone', () => {
        const state = { filter: 'open', cursor: 'card-two' };
        const rerendered = reconcileCardCursor(state, ['card-two', 'card-one']);
        expect(rerendered).toBe(state);
        expect(cardCursor(rerendered)).toBe('card-two');

        const filtered = reconcileCardCursor(rerendered, ['card-one']);
        expect(filtered).toEqual({ filter: 'open' });
        expect(filtered).not.toHaveProperty('cursor');
        expect(cardCursor(filtered)).toBe(null);
    });
});
