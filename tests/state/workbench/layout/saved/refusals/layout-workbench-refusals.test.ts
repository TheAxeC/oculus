// Layer 2, client-state tests. What parseWorkbench makes of a value of the wrong type, and the
// sentences checkWorkbench and checkPages say about a workbench or a page list. A row hands the
// reader one value and states what it answers, so a change to what a part may be shows as a row
// that fails. Nothing here touches localStorage or the DOM.

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
        ['a value that is null', () => parsedBench(null), 'null'],
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
            'an envelope whose workbench is a list',
            () => parsedBench({ version: WORKBENCH_VERSION, workbench: [] }),
            'null'
        ],
        [
            'a workbench with a dock that is not one',
            () => parsedBench(dockedOf({ dock: 'left' })),
            'null'
        ],
        [
            'a workbench with a panel share that is a string',
            () => parsedBench(dockedOf({ panelSize: '0.25' })),
            'row 0.7,0.3 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share past one',
            () => parsedBench(dockedOf({ panelSize: 1.5 })),
            'row 0.1,0.9 ([a/projects]@a | [b/projects]@b)'
        ],
        [
            'a workbench with a panel share of zero',
            () => parsedBench(dockedOf({ panelSize: 0 })),
            'row 0.9,0.1 ([a/projects]@a | [b/projects]@b)'
        ],
        ['a workbench with no main tree', () => parsedBench(dockedOf({ main: undefined })), 'null'],
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
            'a workbench whose main tree has a folded child',
            () => parsedBench(dockedOf({ main: splitOf({ folded: [0] }) })),
            'null'
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
            'the sentences of a workbench with a page leaf the list lacks',
            () => checkWorkbench({ root: { kind: 'page', page: 'zz' } }, pagesOf({}, {}), 'p0'),
            ['root node at []: shows "zz", which is not a page']
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
            'the sentences of a page leaf naming a page the list lacks',
            () => checkPages(pagesOf({ workbench: { root: { kind: 'page', page: 'zz' } } })),
            ['page "Page 0" root node at []: shows "zz", which is not a page']
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
