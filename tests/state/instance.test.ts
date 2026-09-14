// Instance identity and lookups on hand-built layout trees, separate from tree mutation tests.

import { describe, expect, it } from 'vitest';
import {
    activePath,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    stateId
} from '../../src/lib/state/instance.ts';
import { instance, pane, split, three } from './layout-fixture.ts';
import type { Layout } from '../../src/lib/state/layout/index.ts';

describe('instance identity and lookups', () => {
    it('lists every pane with its path, depth first', () => {
        expect(panes(three()).map((found) => found.path)).toEqual([[0], [1, 0], [1, 1]]);
        expect(panes(pane([])).map((found) => found.path)).toEqual([[]]);
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
        expect(newInstance('status').state).toEqual({});
    });
});
