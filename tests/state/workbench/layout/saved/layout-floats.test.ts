// Layer 2, client-state tests. The floats in a saved layout: the envelope written with them, the
// older envelopes read with none, a float that does not add up dropped with the rest kept, the ids
// a float may not take, and the kind a kept empty pane carries.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    checkPages,
    parseLayout,
    serialiseLayout,
    type Float,
    type Pages,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import {
    FREE_PLACE,
    floating,
    heldPages,
    pageAround,
    pane,
    paneOf,
    split
} from '../layout-fixture.ts';

const FREE: Float = floating('free', ['f1'], { kind: 'free', x: 0.6, y: 0.5, w: 0.3, h: 0.4 });
const DOCKED: Float = floating('docked', ['d1'], { kind: 'dock', edge: 'right', size: 0.3 });

/** The pages every case starts from: one page of two tabs. */
function pages(floats: Float[] = []): Pages {
    return heldPages([pageAround('main', pane(['a', 'b']))], floats);
}

/** An envelope of these pages at LAYOUT_VERSION with the floats the caller wrote by hand. */
function envelope(floats: unknown, over: Record<string, unknown> = {}): string {
    const held = pages();
    return JSON.stringify({
        version: LAYOUT_VERSION,
        pages: held.pages,
        current: held.current,
        floats,
        ...over
    });
}

describe('a layout with floats', () => {
    it('is written as version 6 and read back as the same pages, a free float and a docked one', () => {
        const written = pages([FREE, DOCKED]);
        const text = serialiseLayout(written);
        expect((JSON.parse(text) as { version: number }).version).toBe(6);
        expect(parseLayout(text, '')).toEqual(written);
    });

    it('is written with an empty list when there are none', () => {
        expect((JSON.parse(serialiseLayout(pages())) as { floats: unknown[] }).floats).toEqual([]);
        expect(parseLayout(serialiseLayout(pages()), '')?.floats).toEqual([]);
    });

    it('reads a version 4 envelope with no floats, and a version 3 one', () => {
        const held = pages();
        const four = JSON.stringify({ version: 4, pages: held.pages, current: held.current });
        expect(parseLayout(four, '')).toEqual({ ...held, floats: [] });
        const three = JSON.stringify({
            version: 3,
            pages: [
                {
                    id: 'main',
                    label: 'main',
                    workbench: {
                        main: pane(['a']),
                        panel: pane(['b']),
                        dock: 'right',
                        panelSize: 0.3
                    }
                }
            ],
            current: 'main'
        });
        expect(parseLayout(three, '')?.floats).toEqual([]);
    });

    it('ignores the floats a version 4 envelope carries by accident', () => {
        const held = pages();
        const four = JSON.stringify({
            version: 4,
            pages: held.pages,
            current: held.current,
            floats: [FREE]
        });
        expect(parseLayout(four, '')?.floats).toEqual([]);
    });

    it('reads no floats from a floats value that is not a list, and keeps the pages', () => {
        expect(parseLayout(envelope({ not: 'a list' }), '')).toEqual(pages());
        expect(parseLayout(envelope(null), '')).toEqual(pages());
        expect(parseLayout(envelope('text'), '')).toEqual(pages());
    });
});

describe('a float that does not add up', () => {
    it('is dropped with the rest kept: no tab, past the window, a duplicate id and a good one', () => {
        const none = { ...floating('none', ['x']), pane: paneOf([]) };
        const past = floating('past', ['p'], { kind: 'free', x: 0.9, y: 0, w: 0.3, h: 0.4 });
        const first = floating('twice', ['t1']);
        const again = floating('twice', ['t2']);
        const good = floating('good', ['g1']);
        const read = parseLayout(envelope([none, past, first, again, good]), '');
        expect(read?.pages).toEqual(pages().pages);
        expect(read?.floats.map((one) => one.id)).toEqual(['twice', 'good']);
        expect(read?.floats[0].pane.tabs.map((tab) => tab.id)).toEqual(['t1']);
    });

    it.each([
        ['an empty id', { ...floating('', ['x']) }],
        ['an id that is not text', { ...floating('x', ['x']), id: 4 }],
        ['no pane', { id: 'f', place: FREE_PLACE }],
        [
            'a split in place of the pane',
            {
                id: 'f',
                pane: split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]),
                place: FREE_PLACE
            }
        ],
        ['no place', { id: 'f', pane: paneOf(['x']) }],
        ['a place of an unknown kind', { id: 'f', pane: paneOf(['x']), place: { kind: 'orbit' } }],
        [
            'a dock on an unknown edge',
            { id: 'f', pane: paneOf(['x']), place: { kind: 'dock', edge: 'top', size: 0.3 } }
        ],
        [
            'a dock past 0.6',
            { id: 'f', pane: paneOf(['x']), place: { kind: 'dock', edge: 'left', size: 0.7 } }
        ],
        [
            'a dock under the least',
            { id: 'f', pane: paneOf(['x']), place: { kind: 'dock', edge: 'left', size: 0.01 } }
        ],
        [
            'a float narrower than the least',
            { id: 'f', pane: paneOf(['x']), place: { kind: 'free', x: 0, y: 0, w: 0.05, h: 0.4 } }
        ],
        [
            'a float with a place that is not a number',
            { id: 'f', pane: paneOf(['x']), place: { kind: 'free', x: 'a', y: 0, w: 0.3, h: 0.4 } }
        ],
        [
            'a pane naming an active tab it does not hold',
            { id: 'f', pane: { ...paneOf(['x']), active: 'zz' }, place: FREE_PLACE }
        ],
        ['a value that is not a map', 'a float']
    ])('is dropped when it holds %s', (_name, bad) => {
        const read = parseLayout(envelope([bad, FREE]), '');
        expect(read?.floats.map((one) => one.id)).toEqual(['free']);
    });

    it('keeps the first of two floats docked on one edge', () => {
        const first = floating('first', ['a1'], { kind: 'dock', edge: 'right', size: 0.3 });
        const second = floating('second', ['b1'], { kind: 'dock', edge: 'right', size: 0.2 });
        const other = floating('other', ['c1'], { kind: 'dock', edge: 'left', size: 0.2 });
        const read = parseLayout(envelope([first, second, other]), '');
        expect(read?.floats.map((one) => one.id)).toEqual(['first', 'other']);
    });
});

describe('the ids a float may not take', () => {
    it('drops a float whose id is a page id, and keeps the page', () => {
        const read = parseLayout(envelope([floating('main', ['x']), FREE]), '');
        expect(read?.pages.map((one) => one.id)).toEqual(['main']);
        expect(read?.floats.map((one) => one.id)).toEqual(['free']);
    });

    it('drops a float holding a tab id a page already holds, so no instance is in two places', () => {
        const read = parseLayout(envelope([floating('f', ['a']), FREE]), '');
        expect(read?.floats.map((one) => one.id)).toEqual(['free']);
    });

    it('drops a float holding a tab id an earlier float holds', () => {
        const read = parseLayout(envelope([floating('f', ['x']), floating('g', ['x'])]), '');
        expect(read?.floats.map((one) => one.id)).toEqual(['f']);
    });

    it('is checked by checkPages: a float id used twice, or a page id, or a tab on two hosts', () => {
        const twice = pages([floating('f', ['x']), floating('f', ['y'])]);
        expect(checkPages(twice).join('\n')).toContain('"f"');
        expect(checkPages(pages([floating('main', ['x'])])).join('\n')).toContain('"main"');
        expect(checkPages(pages([floating('f', ['a'])])).join('\n')).toContain('"a"');
        expect(checkPages(pages([FREE, DOCKED]))).toEqual([]);
    });

    it('is checked by checkPages: two floats docked on one edge, and a place that does not add up', () => {
        const same = pages([
            floating('a1', ['a1']),
            floating('p', ['p1'], { kind: 'dock', edge: 'left', size: 0.3 }),
            floating('q', ['q1'], { kind: 'dock', edge: 'left', size: 0.3 })
        ]);
        expect(checkPages(same).join('\n')).toContain('left');
        const past = pages([floating('f', ['x'], { kind: 'free', x: 0.9, y: 0, w: 0.3, h: 0.4 })]);
        expect(checkPages(past).join('\n')).toContain('"f"');
    });
});

describe('the kind a kept empty pane carries', () => {
    const kept: Pane = { kind: 'pane', tabs: [], active: '', keeps: 'terminals' };

    it('is written and read back on an empty pane', () => {
        const held = heldPages([pageAround('main', split('row', [0.5, 0.5], [pane(['a']), kept]))]);
        const read = parseLayout(serialiseLayout(held), '');
        expect(read?.pages[0].workbench.root).toEqual(held.pages[0].workbench.root);
    });

    it('is dropped from a pane that holds a tab, and from a value that names no kind', () => {
        const odd = heldPages([
            pageAround(
                'main',
                split(
                    'row',
                    [0.5, 0.5],
                    [
                        { ...pane(['a']), keeps: 'terminals' } as never,
                        { ...kept, keeps: 'files' } as never
                    ]
                )
            )
        ]);
        const root = parseLayout(serialiseLayout(odd), '')?.pages[0].workbench.root;
        expect(root).toEqual(split('row', [0.5, 0.5], [pane(['a']), paneOf([])]));
    });
});
