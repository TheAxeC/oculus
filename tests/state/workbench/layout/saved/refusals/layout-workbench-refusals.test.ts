// Layer 4, test. What parseWorkbench makes of a value of the wrong type, and the sentences
// checkWorkbench and checkPages say about a workbench or a page list. A row hands the reader one
// value and states what it answers, so a change to what a part may be shows as a row that fails.
// Nothing here touches localStorage or the DOM.

import { describe, expect, it } from 'vitest';
import {
    PAGES_VERSION,
    WORKBENCH_VERSION,
    checkPages,
    checkWorkbench,
    parseWorkbench,
    serialiseLayout,
    type Layout,
    type Pages
} from '../../../../../../src/lib/state/workbench/layout/index.ts';
import { docked, pane } from '../../layout-fixture.ts';
import { splitOf, pagesOf, envelopeOf, parsedBench, dockedOf } from './refusal-fixture.ts';

describe('parseWorkbench and the sentences of checkWorkbench and checkPages over values of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['a value that is undefined', () => parsedBench(undefined), 'null'],
        ['a value that is null', () => parsedBench(null), 'null'],
        ['a value that is an array', () => parsedBench([]), 'null'],
        ['a value that is text that is not JSON', () => parsedBench('x'), 'null'],
        [
            'an envelope of the version two as text',
            () => parsedBench(JSON.stringify(dockedOf())),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'an envelope of the version two',
            () => parsedBench(dockedOf()),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        ['an envelope of the version four', () => parsedBench(envelopeOf()), 'null'],
        [
            'an envelope of the version three',
            () =>
                parsedBench({
                    version: PAGES_VERSION,
                    workbench: docked(pane(['a']), pane(['b']))
                }),
            'null'
        ],
        [
            'an envelope with no workbench',
            () => parsedBench({ version: WORKBENCH_VERSION }),
            'null'
        ],
        [
            'an envelope whose workbench is null',
            () => parsedBench({ version: WORKBENCH_VERSION, workbench: null }),
            'null'
        ],
        [
            'an envelope whose workbench is a list',
            () => parsedBench({ version: WORKBENCH_VERSION, workbench: [] }),
            'null'
        ],
        [
            'an envelope whose workbench is a string',
            () => parsedBench({ version: WORKBENCH_VERSION, workbench: 'w' }),
            'null'
        ],
        [
            'a workbench with a dock on the right',
            () => parsedBench(dockedOf({ dock: 'right' })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a dock along the bottom',
            () => parsedBench(dockedOf({ dock: 'bottom' })),
            'col 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a hidden dock',
            () => parsedBench(dockedOf({ dock: 'hidden' })),
            'row 0.7,0.3 folded 1 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a dock that is not one',
            () => parsedBench(dockedOf({ dock: 'left' })),
            'null'
        ],
        [
            'a workbench with a dock that is a number',
            () => parsedBench(dockedOf({ dock: 1 })),
            'null'
        ],
        ['a workbench with no dock', () => parsedBench(dockedOf({ dock: undefined })), 'null'],
        [
            'a workbench with a dock in capitals',
            () => parsedBench(dockedOf({ dock: 'Right' })),
            'null'
        ],
        [
            'a workbench with a panel share',
            () => parsedBench(dockedOf({ panelSize: 0.25 })),
            'row 0.75,0.25 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share that is a string',
            () => parsedBench(dockedOf({ panelSize: '0.25' })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share that is null',
            () => parsedBench(dockedOf({ panelSize: null })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with no panel share',
            () => parsedBench(dockedOf({ panelSize: undefined })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of NaN',
            () => parsedBench(dockedOf({ panelSize: Number.NaN })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of Infinity',
            () => parsedBench(dockedOf({ panelSize: Infinity })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of negative infinity',
            () => parsedBench(dockedOf({ panelSize: -Infinity })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share past one',
            () => parsedBench(dockedOf({ panelSize: 1.5 })),
            'row 0.1,0.9 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share that is negative',
            () => parsedBench(dockedOf({ panelSize: -0.5 })),
            'row 0.9,0.1 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of zero',
            () => parsedBench(dockedOf({ panelSize: 0 })),
            'row 0.9,0.1 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of one',
            () => parsedBench(dockedOf({ panelSize: 1 })),
            'row 0.1,0.9 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share that is a list',
            () => parsedBench(dockedOf({ panelSize: [0.25] })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        ['a workbench with no main tree', () => parsedBench(dockedOf({ main: undefined })), 'null'],
        [
            'a workbench whose main tree is null',
            () => parsedBench(dockedOf({ main: null })),
            'null'
        ],
        [
            'a workbench whose main tree is a pane that is wrong',
            () => parsedBench(dockedOf({ main: { kind: 'pane' } })),
            'null'
        ],
        [
            'a workbench with no panel tree',
            () => parsedBench(dockedOf({ panel: undefined })),
            'null'
        ],
        [
            'a workbench whose panel tree is null',
            () => parsedBench(dockedOf({ panel: null })),
            'null'
        ],
        [
            'a workbench whose panel tree is a string',
            () => parsedBench(dockedOf({ panel: 'p' })),
            'null'
        ],
        [
            'a workbench whose panel tree is empty',
            () => parsedBench(dockedOf({ panel: pane([]) })),
            '[a/projects]@a'
        ],
        [
            'a workbench whose panel tree repeats an instance id of the main tree',
            () => parsedBench(dockedOf({ panel: pane(['a']) })),
            'null'
        ],
        [
            'a workbench whose main tree has a split with a wrong size',
            () => parsedBench(dockedOf({ main: splitOf({ sizes: [0.5, 0.6] }) })),
            'null'
        ],
        [
            'a workbench whose main tree has a folded child',
            () => parsedBench(dockedOf({ main: splitOf({ folded: [0] }) })),
            'null'
        ],
        [
            'a workbench with a focus in the main tree',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: [] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b) focus [0]'
        ],
        [
            'a workbench with a focus in the panel',
            () => parsedBench(dockedOf({ focus: { target: 'panel', path: [] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b) focus [1]'
        ],
        [
            'a workbench with a focus in the panel of a hidden dock',
            () => parsedBench(dockedOf({ dock: 'hidden', focus: { target: 'panel', path: [] } })),
            'row 0.7,0.3 folded 1 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus in the main tree of an empty panel',
            () => parsedBench(dockedOf({ panel: pane([]), focus: { target: 'main', path: [] } })),
            '[a/projects]@a focus []'
        ],
        [
            'a workbench with a focus in the panel of an empty panel',
            () => parsedBench(dockedOf({ panel: pane([]), focus: { target: 'panel', path: [] } })),
            '[a/projects]@a'
        ],
        [
            'a workbench with a focus whose target is not one',
            () => parsedBench(dockedOf({ focus: { target: 'side', path: [] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose target is a number',
            () => parsedBench(dockedOf({ focus: { target: 1, path: [] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose path holds a negative',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: [-1] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose path holds a string',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: ['0'] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose path holds Infinity',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: [Infinity] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose path is a string',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: '0' } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus whose path is missing',
            () => parsedBench(dockedOf({ focus: { target: 'main' } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus that is a list',
            () => parsedBench(dockedOf({ focus: [] })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus that is null',
            () => parsedBench(dockedOf({ focus: null })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus that is a string',
            () => parsedBench(dockedOf({ focus: 'main' })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a focus past the tree',
            () => parsedBench(dockedOf({ focus: { target: 'main', path: [4] } })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'the keys of a workbench read',
            () =>
                Object.keys(
                    parseWorkbench(
                        dockedOf({ focus: { target: 'main', path: [], extra: 1 }, extra: 2 })
                    ) ?? {}
                ),
            ['root', 'focus']
        ],
        [
            'the sentences of a workbench with a root that is wrong',
            () => checkWorkbench({ root: { kind: 'pane', tabs: [], active: 'x' } }),
            ['root node at []: an empty pane calls x active']
        ],
        [
            'the sentences of a workbench with a focus past the tree',
            () => checkWorkbench({ root: pane(['a']), focus: { path: [3] } }),
            ['focus names [3], which is not a pane']
        ],
        [
            'the sentences of a workbench with a focus on a split',
            () => checkWorkbench({ root: splitOf() as Layout, focus: { path: [] } }),
            ['focus names [], which is not a pane']
        ],
        [
            'the sentences of a workbench with a focus on a pane',
            () => checkWorkbench({ root: pane(['a']), focus: { path: [] } }),
            []
        ],
        [
            'the sentences of a workbench with no focus',
            () => checkWorkbench({ root: pane(['a']) }),
            []
        ],
        [
            'the sentences of a workbench with a root that is not an object',
            () => checkWorkbench({ root: 3 as unknown as Layout }),
            ['root node at []: not an object']
        ],
        [
            'the sentences of a workbench with a page leaf the list lacks',
            () => checkWorkbench({ root: { kind: 'page', page: 'zz' } }, pagesOf({}, {}), 'p0'),
            ['root node at []: shows "zz", which is not a page']
        ],
        [
            'the sentences of a workbench with a page leaf on its own page',
            () => checkWorkbench({ root: { kind: 'page', page: 'p0' } }, pagesOf({}, {}), 'p0'),
            ['root node at []: shows "p0", which shows this page']
        ],
        [
            'the sentences of no pages',
            () => checkPages({ pages: [], current: 'p0', floats: [] }),
            ['no page', 'current is "p0", which is not a page']
        ],
        ['the sentences of one page', () => checkPages(pagesOf({})), []],
        [
            'the sentences of two pages with one id',
            () => checkPages(pagesOf({}, { id: 'p0' })),
            ['page id "p0" is used twice']
        ],
        [
            'the sentences of a page with an empty rail key',
            () => checkPages(pagesOf({ rail: '' })),
            ['page "Page 0" has an empty rail key']
        ],
        [
            'the sentences of two pages with one rail key',
            () => checkPages(pagesOf({ rail: 'k' }, { rail: 'k' })),
            ['rail key "k" is on two pages']
        ],
        [
            'the sentences of two pages with two rail keys',
            () => checkPages(pagesOf({ rail: 'k' }, { rail: 'j' })),
            []
        ],
        [
            'the sentences of two pages with an empty rail key each',
            () => checkPages(pagesOf({ rail: '' }, { rail: '' })),
            ['page "Page 0" has an empty rail key', 'page "Page 1" has an empty rail key']
        ],
        [
            'the sentences of a page whose tree is wrong',
            () =>
                checkPages(
                    pagesOf({
                        workbench: {
                            root: { kind: 'pane', tabs: 'x', active: 'a' } as unknown as Layout
                        }
                    })
                ),
            ['page "Page 0" root node at []: tabs is not an array']
        ],
        [
            'the sentences of a page holding an instance another page holds',
            () => checkPages(pagesOf({}, { workbench: { root: pane(['t0']) } })),
            ['instance "t0" is on two pages']
        ],
        [
            'the sentences of a current that is no page',
            () => checkPages({ ...pagesOf({}), current: 'zz' }),
            ['current is "zz", which is not a page']
        ],
        [
            'the sentences of a current that is empty',
            () => checkPages({ ...pagesOf({}), current: '' }),
            ['current is "", which is not a page']
        ],
        [
            'the sentences of a page leaf naming a page the list lacks',
            () => checkPages(pagesOf({ workbench: { root: { kind: 'page', page: 'zz' } } })),
            ['page "Page 0" root node at []: shows "zz", which is not a page']
        ],
        [
            'the sentences of a page leaf naming its own page',
            () => checkPages(pagesOf({ workbench: { root: { kind: 'page', page: 'p0' } } })),
            ['page "Page 0" root node at []: shows "p0", which shows this page']
        ],
        [
            'the sentences of a page leaf naming another page twice',
            () =>
                checkPages(
                    pagesOf(
                        {
                            workbench: {
                                root: splitOf({
                                    children: [
                                        { kind: 'page', page: 'p1' },
                                        { kind: 'page', page: 'p1' }
                                    ]
                                }) as Layout
                            }
                        },
                        {}
                    )
                ),
            ['page "Page 0" root node at [1]: shows "p1", which this page already shows']
        ],
        [
            'the sentences of a page with a label of its own in the message',
            () =>
                checkPages(
                    pagesOf({
                        label: 'Mine',
                        workbench: { root: { kind: 'pane', tabs: [], active: 'x' } }
                    })
                ),
            ['page "Mine" root node at []: an empty pane calls x active']
        ],
        [
            'the text a list of pages is saved as',
            () => serialiseLayout(pagesOf({ rail: 'k' }, {})),
            '{"version":6,"pages":[{"id":"p0","label":"Page 0","workbench":{"root":{"kind":"pane","tabs":[{"id":"t0","view":"projects","state":null}],"active":"t0"}},"rail":"k"},{"id":"p1","label":"Page 1","workbench":{"root":{"kind":"pane","tabs":[{"id":"t1","view":"projects","state":null}],"active":"t1"}}}],"current":"p0","floats":[]}'
        ],
        [
            'the text a list of pages with extra fields is saved as',
            () => serialiseLayout({ ...pagesOf({}), extra: 1 } as Pages),
            '{"version":6,"pages":[{"id":"p0","label":"Page 0","workbench":{"root":{"kind":"pane","tabs":[{"id":"t0","view":"projects","state":null}],"active":"t0"}}}],"current":"p0","floats":[]}'
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
