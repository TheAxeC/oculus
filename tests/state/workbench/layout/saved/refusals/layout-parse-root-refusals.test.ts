// Layer 2, client-state tests. What parseLayout makes of a page whose root tree is of the wrong
// type: a split with sizes, folded children or children that are not what they should be, a pane, a
// tab. A row hands the reader one value and states the pages it answers. Nothing here touches
// localStorage or the DOM.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    PAGES_VERSION,
    WORKBENCH_VERSION
} from '../../../../../../src/lib/state/workbench/layout/index.ts';
import { docked, pane } from '../../layout-fixture.ts';
import {
    splitOf,
    paneOf,
    tabOf,
    envelopeOf,
    holding,
    parsed,
    firstPage,
    dockedOf
} from './refusal-fixture.ts';

describe('parseLayout over a root tree of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        [
            'a root split with a wrong size',
            () => parsed(holding({ root: splitOf({ sizes: [0.5, 0.6] }) })),
            'null'
        ],
        [
            'a root split with a folded child',
            () => parsed(holding({ root: splitOf({ folded: [1] }) })),
            'p=P: row 0.5,0.5 folded 1 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a root split whose folded is empty',
            () => parsed(holding({ root: splitOf({ folded: [] }) })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a root split whose folded repeats an index',
            () => parsed(holding({ root: splitOf({ folded: [1, 1] }) })),
            'p=P: row 0.5,0.5 folded 1 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a root split whose folded holds a string',
            () => parsed(holding({ root: splitOf({ folded: ['1'] }) })),
            'null'
        ],
        [
            'a root split with sizes that hold NaN',
            () => parsed(holding({ root: splitOf({ sizes: [Number.NaN, 0.5] }) })),
            'null'
        ],
        [
            'a root split with children that are a map',
            () => parsed(holding({ root: splitOf({ children: {} }) })),
            'null'
        ],
        [
            'a root pane with a tab preview',
            () =>
                parsed(
                    holding({
                        root: {
                            kind: 'pane',
                            tabs: [{ id: 'a', view: 'v', state: { x: 1 }, preview: true }],
                            active: 'a'
                        }
                    })
                ),
            'p=P: [a/v~:{"x":1}]@a current p'
        ],
        [
            'a root pane with a tab preview that is a string',
            () =>
                parsed(
                    holding({
                        root: {
                            kind: 'pane',
                            tabs: [{ id: 'a', view: 'v', preview: 'true' }],
                            active: 'a'
                        }
                    })
                ),
            'p=P: [a/v:undefined]@a current p'
        ],
        [
            'a root pane with a tab that has no state',
            () =>
                parsed(
                    holding({ root: { kind: 'pane', tabs: [{ id: 'a', view: 'v' }], active: 'a' } })
                ),
            'p=P: [a/v:undefined]@a current p'
        ],
        [
            'a root pane with a tab whose state is a list',
            () =>
                parsed(
                    holding({
                        root: {
                            kind: 'pane',
                            tabs: [{ id: 'a', view: 'v', state: [1] }],
                            active: 'a'
                        }
                    })
                ),
            'p=P: [a/v:[1]]@a current p'
        ],
        [
            'a root pane whose tab has an empty id',
            () => parsed(holding({ root: tabOf({ id: '' }) })),
            'null'
        ],
        [
            'a root pane whose tab has a view that is a number',
            () => parsed(holding({ root: tabOf({ view: 3 }) })),
            'null'
        ],
        [
            'a root pane whose active is a number',
            () => parsed(holding({ root: paneOf({ active: 3 }) })),
            'null'
        ],
        [
            'a root pane whose active is no tab',
            () => parsed(holding({ root: paneOf({ active: 'z' }) })),
            'null'
        ],
        [
            'an empty root pane',
            () => parsed(holding({ root: { kind: 'pane', tabs: [], active: '' } })),
            'p=P: []@ current p'
        ],
        [
            'two root panes repeating an instance id',
            () => parsed(holding({ root: splitOf({ children: [pane(['a']), pane(['a'])] }) })),
            'null'
        ],
        [
            'a focus on a pane',
            () => parsed(holding({ root: pane(['a']), focus: { path: [] } })),
            'p=P: [a/projects]@a focus [] current p'
        ],
        [
            'a focus on a pane of a split',
            () => parsed(holding({ root: splitOf(), focus: { path: [1] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) focus [1] current p'
        ],
        [
            'a focus on a split',
            () => parsed(holding({ root: splitOf(), focus: { path: [] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus past the tree',
            () => parsed(holding({ root: splitOf(), focus: { path: [5] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus whose path holds a negative',
            () => parsed(holding({ root: splitOf(), focus: { path: [0, -1] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus whose path holds a string',
            () => parsed(holding({ root: splitOf(), focus: { path: ['0'] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus whose path holds a fraction',
            () => parsed(holding({ root: splitOf(), focus: { path: [0.5] } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus whose path is a string',
            () => parsed(holding({ root: splitOf(), focus: { path: '0' } })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus with no path',
            () => parsed(holding({ root: splitOf(), focus: {} })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'a focus that is a list',
            () => parsed(holding({ root: splitOf(), focus: [1] })),
            'p=P: row 0.5,0.5 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'the keys of a page read',
            () =>
                Object.keys(
                    firstPage(
                        envelopeOf({
                            pages: [
                                {
                                    extra: 1,
                                    rail: 'k',
                                    workbench: { root: pane(['a']) },
                                    label: 'P',
                                    id: 'p'
                                }
                            ]
                        })
                    ) ?? {}
                ),
            ['id', 'label', 'workbench', 'rail']
        ],
        [
            'the keys of a workbench read',
            () =>
                Object.keys(
                    firstPage(holding({ extra: 1, focus: { path: [] }, root: pane(['a']) }))
                        ?.workbench ?? {}
                ),
            ['root', 'focus']
        ],
        [
            'the keys of a split read',
            () =>
                Object.keys(
                    firstPage(holding({ root: splitOf({ extra: 1, folded: [1] }) }))?.workbench
                        .root ?? {}
                ),
            ['kind', 'dir', 'sizes', 'children', 'folded']
        ],
        [
            'the keys of a pane read',
            () =>
                Object.keys(
                    firstPage(holding({ root: paneOf({ extra: 1 }) }))?.workbench.root ?? {}
                ),
            ['kind', 'tabs', 'active']
        ],
        [
            'the keys of a tab read',
            () =>
                Object.keys(
                    firstPage(holding({ root: tabOf({ extra: 1, preview: true }) }))?.workbench.root
                        .kind === 'pane'
                        ? (
                              firstPage(holding({ root: tabOf({ extra: 1, preview: true }) }))
                                  ?.workbench.root as { tabs: object[] }
                          ).tabs[0]
                        : {}
                ),
            ['id', 'view', 'state', 'preview']
        ],
        [
            'the keys of a focus read',
            () =>
                Object.keys(
                    firstPage(holding({ root: pane(['a']), focus: { extra: 1, path: [] } }))
                        ?.workbench.focus ?? {}
                ),
            ['path']
        ],
        [
            'the version three envelope of one page',
            () =>
                parsed({
                    version: PAGES_VERSION,
                    pages: [{ id: 'p', label: 'P', workbench: docked(pane(['a']), pane(['b'])) }],
                    current: 'p'
                }),
            'p=P: row 0.7,0.3 ([a/projects]@a | [b/projects]@b) current p'
        ],
        [
            'the version three envelope with a workbench that is a list',
            () =>
                parsed({
                    version: PAGES_VERSION,
                    pages: [{ id: 'p', label: 'P', workbench: [] }],
                    current: 'p'
                }),
            'null'
        ],
        [
            'the version three envelope with a dock that is not one',
            () =>
                parsed({
                    version: PAGES_VERSION,
                    pages: [
                        {
                            id: 'p',
                            label: 'P',
                            workbench: docked(pane(['a']), pane(['b']), 'left' as never)
                        }
                    ],
                    current: 'p'
                }),
            'null'
        ],
        [
            'the version three envelope read with the version four reader',
            () =>
                parsed({
                    version: PAGES_VERSION,
                    pages: [{ id: 'p', label: 'P', workbench: { root: pane(['a']) } }],
                    current: 'p'
                }),
            'null'
        ],
        [
            'the version four envelope read with the version three reader',
            () =>
                parsed({
                    version: LAYOUT_VERSION,
                    pages: [{ id: 'p', label: 'P', workbench: docked(pane(['a']), pane(['b'])) }],
                    current: 'p'
                }),
            'null'
        ],
        [
            'the version two envelope',
            () => parsed(dockedOf()),
            '<uuid>=Label: row 0.7,0.3 ([a/projects]@a | [b/projects]@b) current <uuid>'
        ],
        [
            'the version two envelope with no workbench',
            () => parsed({ version: WORKBENCH_VERSION }),
            'null'
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
