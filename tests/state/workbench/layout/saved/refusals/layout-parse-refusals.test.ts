// Layer 2, client-state tests. What parseLayout makes of an envelope of the wrong type, or refuses
// as null. A row hands the reader one value and states the pages it answers, so a change to what a
// part of the envelope may be shows as a row that fails. Nothing here touches localStorage or the
// DOM.

import { describe, expect, it } from 'vitest';
import { LAYOUT_VERSION } from '../../../../../../src/lib/state/workbench/layout/index.ts';
import { pane } from '../../layout-fixture.ts';
import { envelopeOf, holding, parsed, pageWith } from './refusal-fixture.ts';

describe('parseLayout over an envelope of the wrong type', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['a value that is null', () => parsed(null), 'null'],
        ['a value that is an array', () => parsed([]), 'null'],
        ['text that is not JSON', () => parsed('not json'), 'null'],
        ['text that is a JSON array', () => parsed('[]'), 'null'],
        [
            'an envelope as text',
            () => parsed(JSON.stringify(envelopeOf())),
            'p=P: [a/projects]@a current p'
        ],
        [
            'an envelope as text that is double encoded',
            () => parsed(JSON.stringify(JSON.stringify(envelopeOf()))),
            'null'
        ],
        ['an envelope as a map', () => parsed(envelopeOf()), 'p=P: [a/projects]@a current p'],
        ['an envelope with no version', () => parsed({ pages: [], current: 'p' }), 'null'],
        [
            'an envelope whose version is a string',
            () => parsed(envelopeOf({ version: String(LAYOUT_VERSION) })),
            'null'
        ],
        ['an envelope of version one', () => parsed(envelopeOf({ version: 1 })), 'null'],
        [
            'an envelope of a version past the newest',
            () => parsed(envelopeOf({ version: LAYOUT_VERSION + 1 })),
            'null'
        ],
        ['an envelope whose pages are a map', () => parsed(envelopeOf({ pages: {} })), 'null'],
        ['an envelope whose pages are empty', () => parsed(envelopeOf({ pages: [] })), 'null'],
        ['an envelope whose current is a number', () => parsed(envelopeOf({ current: 3 })), 'null'],
        [
            'an envelope whose current is no page',
            () => parsed(envelopeOf({ current: 'zz' })),
            'null'
        ],
        ['an envelope whose page is a number', () => parsed(envelopeOf({ pages: [3] })), 'null'],
        ['an envelope whose page is a list', () => parsed(envelopeOf({ pages: [[]] })), 'null'],
        [
            'a page whose id is a number',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ id: 3 })]
                    })
                ),
            'null'
        ],
        [
            'a page whose id is empty',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ id: '' })]
                    })
                ),
            'null'
        ],
        [
            'a page whose label is a number',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ label: 3 })]
                    })
                ),
            'null'
        ],
        [
            'a page whose label is empty',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ label: '' })]
                    })
                ),
            'p=: [a/projects]@a current p'
        ],
        [
            'a page whose workbench is a list',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ workbench: [] })]
                    })
                ),
            'null'
        ],
        [
            'a page whose workbench has no root',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ workbench: {} })]
                    })
                ),
            'null'
        ],
        [
            'a page whose root is a pane that is wrong',
            () =>
                parsed(
                    envelopeOf({
                        pages: [pageWith({ workbench: { root: { kind: 'pane' } } })]
                    })
                ),
            'null'
        ],
        [
            'a page with a rail key',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            { id: 'p', label: 'P', workbench: { root: pane(['a']) }, rail: 'k' }
                        ]
                    })
                ),
            'p=P rail k: [a/projects]@a current p'
        ],
        [
            'a page whose rail key is a number',
            () =>
                parsed(
                    envelopeOf({
                        pages: [{ id: 'p', label: 'P', workbench: { root: pane(['a']) }, rail: 3 }]
                    })
                ),
            'p=P: [a/projects]@a current p'
        ],
        [
            'a page whose rail key is empty',
            () =>
                parsed(
                    envelopeOf({
                        pages: [{ id: 'p', label: 'P', workbench: { root: pane(['a']) }, rail: '' }]
                    })
                ),
            'p=P: [a/projects]@a current p'
        ],
        [
            'a page whose rail key repeats an earlier page',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            { id: 'p', label: 'P', rail: 'k', workbench: { root: pane(['a']) } },
                            { id: 'q', label: 'Q', rail: 'k', workbench: { root: pane(['b']) } }
                        ]
                    })
                ),
            'p=P rail k: [a/projects]@a ; q=Q: [b/projects]@b current p'
        ],
        [
            'two pages with one id',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            { id: 'p', label: 'P', workbench: { root: pane(['a']) } },
                            { id: 'p', label: 'Q', workbench: { root: pane(['b']) } }
                        ]
                    })
                ),
            'null'
        ],
        [
            'two pages holding one instance',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            { id: 'p', label: 'P', workbench: { root: pane(['a']) } },
                            { id: 'q', label: 'Q', workbench: { root: pane(['a']) } }
                        ]
                    })
                ),
            'null'
        ],
        [
            'a page leaf naming a page the list lacks',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            {
                                id: 'p',
                                label: 'P',
                                workbench: { root: { kind: 'page', page: 'zz' } }
                            }
                        ]
                    })
                ),
            'p=P: []@ current p'
        ],
        [
            'a page leaf naming its own page',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            {
                                id: 'p',
                                label: 'P',
                                workbench: { root: { kind: 'page', page: 'p' } }
                            }
                        ]
                    })
                ),
            'p=P: []@ current p'
        ],
        [
            'a page leaf naming another page',
            () =>
                parsed(
                    envelopeOf({
                        pages: [
                            {
                                id: 'p',
                                label: 'P',
                                workbench: { root: { kind: 'page', page: 'q' } }
                            },
                            { id: 'q', label: 'Q', workbench: { root: pane(['b']) } }
                        ]
                    })
                ),
            'p=P: page q ; q=Q: [b/projects]@b current p'
        ],
        ['a page leaf naming nothing', () => parsed(holding({ root: { kind: 'page' } })), 'null']
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
