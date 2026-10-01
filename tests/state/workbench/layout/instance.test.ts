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
} from '../../../../src/lib/state/workbench/layout/instance.ts';
import { instance, pane, split, three } from './layout-fixture.ts';
import type { Layout } from '../../../../src/lib/state/workbench/layout/index.ts';

describe('instance identity and lookups', () => {
    it('lists every pane with its path, depth first', () => {
        expect(panes(three()).map((found) => found.path)).toEqual([[0], [1, 0], [1, 1]]);
        expect(panes(pane([])).map((found) => found.path)).toEqual([[]]);
    });

    it('lists every tab of a tree at any depth of splits, and none of a page a leaf shows', () => {
        // Revert: make tabsOf return the first pane's tabs only. That a closed page keeps the tabs
        // of a page its leaf shows is tests/state/workbench/layout/layout-close.test.ts.
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

describe('the instance readers over a state of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['cardCursor of an array', () => cardCursor([]), null],
        ['cardCursor of null', () => cardCursor(null), null],
        ['cardCursor of a string', () => cardCursor('c'), null],
        ['cardCursor of a number', () => cardCursor(3), null],
        ['cardCursor of a map with no cursor', () => cardCursor({ id: 'c' }), null],
        ['cardCursor of a cursor that is a number', () => cardCursor({ cursor: 3 }), null],
        ['cardCursor of an empty cursor', () => cardCursor({ cursor: '' }), null],
        ['cardCursor of a cursor that is a list', () => cardCursor({ cursor: ['c'] }), null],
        ['cardCursor of a cursor that is null', () => cardCursor({ cursor: null }), null],
        ['cardCursor of a string cursor', () => cardCursor({ cursor: 'c' }), 'c'],
        [
            'cardCursor of a map with an own __proto__ key',
            () =>
                cardCursor(JSON.parse('{"__proto__":{"cursor":"p","id":"p","session":"p"},"b":1}')),
            null
        ],
        [
            'withCardCursor sets a cursor on an array',
            () => withCardCursor([], 'c'),
            { cursor: 'c' }
        ],
        ['withCardCursor sets a cursor on null', () => withCardCursor(null, 'c'), { cursor: 'c' }],
        [
            'withCardCursor sets a cursor on a string',
            () => withCardCursor('s', 'c'),
            { cursor: 'c' }
        ],
        [
            'withCardCursor sets a cursor on undefined',
            () => withCardCursor(undefined, 'c'),
            { cursor: 'c' }
        ],
        [
            'withCardCursor sets a cursor beside a number',
            () => withCardCursor({ n: 1, cursor: 'old' }, 'c'),
            { n: 1, cursor: 'c' }
        ],
        [
            'withCardCursor keeps the order of the other keys',
            () => Object.keys(withCardCursor({ z: 1, cursor: 'old', a: 2 }, 'c') as object),
            ['z', 'cursor', 'a']
        ],
        [
            'withCardCursor keeps an own __proto__ key',
            () =>
                Object.keys(
                    withCardCursor(
                        JSON.parse('{"__proto__":{"cursor":"p","id":"p","session":"p"},"b":1}'),
                        'c'
                    ) as object
                ),
            ['__proto__', 'b', 'cursor']
        ],
        [
            'withCardCursor clears the cursor of a map',
            () => withCardCursor({ z: 1, cursor: 'old', a: 2 }, null),
            { z: 1, a: 2 }
        ],
        [
            'withCardCursor clears the order of the keys',
            () => Object.keys(withCardCursor({ z: 1, cursor: 'old', a: 2 }, null) as object),
            ['z', 'a']
        ],
        [
            'withCardCursor clears a cursor that is not a string',
            () => withCardCursor({ cursor: 3, a: 1 }, null),
            { a: 1 }
        ],
        [
            'withCardCursor clears an undefined cursor key',
            () => Object.keys(withCardCursor({ cursor: undefined, a: 1 }, null) as object),
            ['a']
        ],
        [
            'withCardCursor clears the cursor and keeps an own __proto__ key',
            () =>
                Object.keys(
                    withCardCursor(JSON.parse('{"__proto__":1,"cursor":"c","b":2}'), null) as object
                ),
            ['__proto__', 'b']
        ],
        ['withCardCursor of an array with no cursor wanted', () => withCardCursor([1], null), [1]],
        ['withCardCursor of null with no cursor wanted', () => withCardCursor(null, null), null],
        [
            'reconcileCardCursor drops a cursor no card holds',
            () => reconcileCardCursor({ cursor: 'x', a: 1 }, ['a', 'b']),
            { a: 1 }
        ],
        [
            'reconcileCardCursor keeps a cursor a card holds',
            () => reconcileCardCursor({ cursor: 'a', a: 1 }, ['a', 'b']),
            { cursor: 'a', a: 1 }
        ],
        [
            'reconcileCardCursor of a cursor that is a number',
            () => reconcileCardCursor({ cursor: 3, a: 1 }, ['a']),
            { cursor: 3, a: 1 }
        ],
        ['reconcileCardCursor of an array', () => reconcileCardCursor([], ['a']), []],
        ['stateId of an array', () => stateId([]), null],
        ['stateId of null', () => stateId(null), null],
        ['stateId of a string', () => stateId('x'), null],
        ['stateId of an id that is a number', () => stateId({ id: 3 }), null],
        ['stateId of an empty id beside a session', () => stateId({ id: '', session: 's' }), 's'],
        [
            'stateId of an id that is a number beside a session',
            () => stateId({ id: 3, session: 's' }),
            's'
        ],
        [
            'stateId of a session that is a number',
            () => stateId({ session: 3, root: 'r', path: 'p' }),
            '["r","p"]'
        ],
        [
            'stateId of an empty session',
            () => stateId({ session: '', root: 'r', path: 'p' }),
            '["r","p"]'
        ],
        ['stateId of a root and a path', () => stateId({ root: 'r', path: 'p' }), '["r","p"]'],
        ['stateId of a root and an empty path', () => stateId({ root: 'r', path: '' }), null],
        ['stateId of an empty root', () => stateId({ root: '', path: 'p' }), null],
        ['stateId of a path that is a number', () => stateId({ root: 'r', path: 3 }), null],
        ['stateId of a root alone', () => stateId({ root: 'r' }), null],
        [
            'stateId of a map with an own __proto__ key',
            () => stateId(JSON.parse('{"__proto__":{"cursor":"p","id":"p","session":"p"},"b":1}')),
            null
        ],
        [
            'stateId of an id beside a root and a path',
            () => stateId({ id: 'i', root: 'r', path: 'p' }),
            'i'
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});

describe('the state a card cursor is set on or taken from', () => {
    it('is the state itself when no cursor is held and none is wanted', () => {
        const map = { filter: 'open', n: 1 };
        const list: unknown[] = [1];
        expect(withCardCursor(map, null)).toBe(map);
        expect(withCardCursor(list, null)).toBe(list);
        expect(withCardCursor('s', null)).toBe('s');
        expect(withCardCursor(undefined, null)).toBe(undefined);
        expect(reconcileCardCursor(list, ['a'])).toBe(list);
    });

    it('is a new map whenever a cursor is set, and whenever one is taken out', () => {
        const map = { filter: 'open', cursor: 'old' };
        expect(withCardCursor(map, 'new')).not.toBe(map);
        expect(map).toStrictEqual({ filter: 'open', cursor: 'old' });
        expect(withCardCursor(map, null)).not.toBe(map);
        expect(map).toStrictEqual({ filter: 'open', cursor: 'old' });
    });
});
