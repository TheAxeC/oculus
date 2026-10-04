// Layer 2, client-state tests. The sentences checkLayout says about a tree of the wrong type. A row
// hands the reader one value and states the sentences it answers, so a change to what a part of a
// tree may be shows as a row that fails. Nothing here touches localStorage or the DOM.

import { describe, expect, it } from 'vitest';
import { pane } from '../../layout-fixture.ts';
import { problems, splitOf, paneOf, tabOf, pagesOf } from './refusal-fixture.ts';

describe('the sentences checkLayout says about a tree of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['a tree that is a number', () => problems(3), ['node at []: not an object']],
        ['a tree that is null', () => problems(null), ['node at []: not an object']],
        ['a tree that is an array', () => problems([]), ['node at []: not an object']],
        [
            'a node with no kind',
            () => problems({}),
            ['node at []: kind is undefined, not split, pane or page']
        ],
        [
            'a node whose kind is not one',
            () => problems({ kind: 'box' }),
            ['node at []: kind is "box", not split, pane or page']
        ],
        [
            'a page leaf naming nothing',
            () => problems({ kind: 'page' }),
            ['node at []: page is undefined, which names no page']
        ],
        [
            'a page leaf naming an empty page',
            () => problems({ kind: 'page', page: '' }),
            ['node at []: page is "", which names no page']
        ],
        ['a page leaf naming a page', () => problems({ kind: 'page', page: 'p' }), []],
        [
            'a split with no direction',
            () => problems(splitOf({ dir: undefined })),
            ['node at []: dir is undefined, not row or col']
        ],
        [
            'a split with a direction that is not one',
            () => problems(splitOf({ dir: 'diag' })),
            ['node at []: dir is "diag", not row or col']
        ],
        ['a split with a column direction', () => problems(splitOf({ dir: 'col' })), []],
        [
            'a split with no children',
            () => problems(splitOf({ children: undefined })),
            ['node at []: children is not an array']
        ],
        [
            'a split whose children are empty',
            () => problems(splitOf({ children: [], sizes: [] })),
            [
                'node at []: a split holds 0 children, two is the least',
                'node at []: sizes sum to 0, not 1'
            ]
        ],
        [
            'a split with one child',
            () => problems(splitOf({ children: [pane(['a'])], sizes: [1] })),
            ['node at []: a split holds 1 children, two is the least']
        ],
        [
            'a split whose first child is not a tree',
            () => problems(splitOf({ children: [3, pane(['b'])] })),
            ['node at [0]: not an object']
        ],
        [
            'a split whose child is a split with a bad direction',
            () => problems(splitOf({ children: [pane(['a']), splitOf({ dir: 'x' })] })),
            ['node at [1]: dir is "x", not row or col']
        ],
        [
            'a split with no sizes',
            () => problems(splitOf({ sizes: undefined })),
            ['node at []: sizes is not an array of numbers']
        ],
        [
            'a split whose sizes hold a string',
            () => problems(splitOf({ sizes: [1, 'a'] })),
            ['node at []: sizes is not an array of numbers']
        ],
        [
            'a split whose sizes hold NaN',
            () => problems(splitOf({ sizes: [Number.NaN, 0.5] })),
            ['node at []: sizes is not an array of numbers']
        ],
        [
            'a split with one size for two children',
            () => problems(splitOf({ sizes: [1] })),
            ['node at []: 1 sizes for 2 children']
        ],
        [
            'a split whose sizes do not sum to one',
            () => problems(splitOf({ sizes: [0.5, 0.6] })),
            ['node at []: sizes sum to 1.1, not 1']
        ],
        [
            'a split whose sizes sum to one within the tolerance',
            () => problems(splitOf({ sizes: [0.5, 0.5000000001] })),
            []
        ],
        [
            'a split whose sizes sum to one beyond the tolerance',
            () => problems(splitOf({ sizes: [0.5, 0.50001] })),
            ['node at []: sizes sum to 1.00001, not 1']
        ],
        [
            'a split with a child under the minimum',
            () => problems(splitOf({ sizes: [0.95, 0.05] })),
            ['node at []: child 1 holds 0.05, under the minimum 0.1']
        ],
        ['a split at the minimum', () => problems(splitOf({ sizes: [0.9, 0.1] })), []],
        [
            'a split whose folded is a number',
            () => problems(splitOf({ folded: 1 })),
            ['node at []: folded is not an array']
        ],
        ['a split whose folded is empty', () => problems(splitOf({ folded: [] })), []],
        [
            'a split whose folded holds a string',
            () => problems(splitOf({ folded: ['1'] })),
            ['node at []: folded names "1", which is not a child']
        ],
        [
            'a split whose folded holds a fraction',
            () => problems(splitOf({ folded: [0.5] })),
            ['node at []: folded names 0.5, which is not a child']
        ],
        [
            'a split whose folded holds a negative',
            () => problems(splitOf({ folded: [-1] })),
            ['node at []: folded names -1, which is not a child']
        ],
        [
            'a split whose folded holds an index out of range',
            () => problems(splitOf({ folded: [2] })),
            ['node at []: folded names 2, which is not a child']
        ],
        [
            'a split whose folded holds null',
            () => problems(splitOf({ folded: [null] })),
            ['node at []: folded names null, which is not a child']
        ],
        [
            'a split whose folded holds every child',
            () => problems(splitOf({ folded: [0, 1] })),
            ['node at []: every child is folded, which leaves the split nothing to show']
        ],
        [
            'a split whose folded holds one child twice',
            () => problems(splitOf({ folded: [1, 1] })),
            []
        ],
        ['a split whose folded holds one child', () => problems(splitOf({ folded: [1] })), []],
        [
            'a split whose direction and children are both wrong',
            () => problems(splitOf({ dir: 'x', children: 'y' })),
            ['node at []: dir is "x", not row or col']
        ],
        [
            'a split whose children and sizes are both wrong',
            () => problems(splitOf({ children: 'y', sizes: 'z' })),
            ['node at []: children is not an array']
        ],
        [
            'a split whose child is wrong and whose sizes are wrong',
            () => problems(splitOf({ children: [3, pane(['b'])], sizes: 'z' })),
            ['node at [0]: not an object']
        ],
        [
            'a split whose sizes and folded are both wrong',
            () => problems(splitOf({ sizes: 'z', folded: 'y' })),
            ['node at []: sizes is not an array of numbers']
        ],
        [
            'a split whose count, sum and minimum are all wrong',
            () => problems(splitOf({ sizes: [0.95] })),
            ['node at []: 1 sizes for 2 children']
        ],
        [
            'a pane with no tabs field',
            () => problems(paneOf({ tabs: undefined })),
            ['node at []: tabs is not an array']
        ],
        [
            'a pane with a tab that is a number',
            () => problems(paneOf({ tabs: [3] })),
            ['node at []: tab 0 has no id']
        ],
        [
            'a pane with a tab that is null',
            () => problems(paneOf({ tabs: [null] })),
            ['node at []: tab 0 has no id']
        ],
        [
            'a pane with a tab with no id',
            () => problems(tabOf({ id: undefined })),
            ['node at []: tab 0 has no id']
        ],
        [
            'a pane with a tab whose id is empty',
            () => problems(tabOf({ id: '' })),
            ['node at []: tab 0 has no id']
        ],
        [
            'a pane with a tab with no view',
            () => problems(tabOf({ view: undefined })),
            ['node at []: tab 0 has no view']
        ],
        ['a pane with a tab whose view is empty', () => problems(tabOf({ view: '' })), []],
        [
            'a pane with a tab whose preview is a string',
            () => problems(tabOf({ preview: 'true' })),
            []
        ],
        ['a pane with a tab whose state is a number', () => problems(tabOf({ state: 3 })), []],
        [
            'a pane with a second tab that has no id',
            () => problems(paneOf({ tabs: [{ id: 'a', view: 'v' }, { view: 'v' }] })),
            ['node at []: tab 1 has no id']
        ],
        [
            'a pane with a tab that repeats an id',
            () =>
                problems(
                    paneOf({
                        tabs: [
                            { id: 'a', view: 'v' },
                            { id: 'a', view: 'v' }
                        ]
                    })
                ),
            ['node at []: tab 1 repeats the instance id a']
        ],
        [
            'a split whose panes repeat an id',
            () => problems(splitOf({ children: [pane(['a']), pane(['a'])] })),
            ['node at [1]: tab 0 repeats the instance id a']
        ],
        [
            'a pane with no active field',
            () => problems(paneOf({ active: undefined })),
            ['node at []: active is not a string']
        ],
        [
            'a pane whose active is not one of its tabs',
            () => problems(paneOf({ active: 'z' })),
            ['node at []: active is "z", which is not one of its tabs']
        ],
        [
            'an empty pane whose active is a tab',
            () => problems(paneOf({ tabs: [], active: 'z' })),
            ['node at []: an empty pane calls z active']
        ],
        [
            'an empty pane whose active is empty',
            () => problems(paneOf({ tabs: [], active: '' })),
            []
        ],
        [
            'a pane two splits down',
            () =>
                problems(
                    splitOf({
                        children: [
                            pane(['a']),
                            splitOf({ children: [pane(['b']), paneOf({ active: 3 })] })
                        ]
                    })
                ),
            [
                'node at [1, 1]: tab 0 repeats the instance id a',
                'node at [1, 1]: active is not a string'
            ]
        ],
        ['a pane with extra fields', () => problems(paneOf({ extra: 1 })), []],
        [
            'a page leaf naming a page of the list',
            () => problems({ kind: 'page', page: 'p1' }, pagesOf({}, {}), 'p0'),
            []
        ],
        [
            'a page leaf naming a page the list lacks',
            () => problems({ kind: 'page', page: 'zz' }, pagesOf({}, {}), 'p0'),
            ['node at []: shows "zz", which is not a page']
        ],
        [
            'a page leaf naming the page it is on',
            () => problems({ kind: 'page', page: 'p0' }, pagesOf({}, {}), 'p0'),
            ['node at []: shows "p0", which shows this page']
        ],
        [
            'two page leaves naming one page',
            () =>
                problems(
                    splitOf({
                        children: [
                            { kind: 'page', page: 'p1' },
                            { kind: 'page', page: 'p1' }
                        ]
                    }),
                    pagesOf({}, {}),
                    'p0'
                ),
            ['node at [1]: shows "p1", which this page already shows']
        ],
        [
            'a page leaf checked with no list',
            () => problems({ kind: 'page', page: 'zz' }, undefined, 'p0'),
            []
        ],
        [
            'a page leaf checked with no host',
            () => problems({ kind: 'page', page: 'zz' }, pagesOf({}, {})),
            []
        ],
        [
            'a page leaf naming a page that shows this page',
            () =>
                problems(
                    { kind: 'page', page: 'p1' },
                    pagesOf({}, { workbench: { root: { kind: 'page', page: 'p0' } } }),
                    'p0'
                ),
            ['node at []: shows "p1", which shows this page']
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
