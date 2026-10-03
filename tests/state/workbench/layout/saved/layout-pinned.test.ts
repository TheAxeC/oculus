// Layer 2, client state tests. The pinned tab and the order a pane showed its tabs in, in a saved
// layout: a version 5 envelope read with no tab pinned and nothing else changed, the version 6
// envelope written and read back, a pin read only from `true`, the pinned tabs put first on read,
// and the used-order list read back as the tabs the pane holds.

import { describe, expect, it } from 'vitest';
import {
    needsFloats,
    panes,
    parseLayout,
    serialiseLayout,
    type Instance,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import {
    FREE_PLACE,
    floating,
    heldPages,
    instance,
    pageAround,
    paneOf,
    split
} from '../layout-fixture.ts';

/** The panes of the first page of a layout text, or a failure when it was refused. */
function read(text: string): Pane[] {
    const held = parseLayout(JSON.parse(text), '');
    if (held === null) throw new Error('the layout was refused');
    return panes(held.pages[0].workbench.root).map(({ pane }) => pane);
}

/** A version 6 envelope text whose one pane holds these saved tabs. */
function withTabs(tabs: Record<string, unknown>[], active: string, over = {}): string {
    return JSON.stringify({
        version: 6,
        pages: [
            {
                id: 'main',
                label: 'main',
                workbench: { root: { kind: 'pane', tabs, active, ...over } }
            }
        ],
        current: 'main',
        floats: []
    });
}

const saved = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    id,
    view: 'projects',
    state: null,
    ...extra
});

describe('a version 5 envelope', () => {
    // Revert: LAYOUT_VERSION back to 5.
    it('reads into the version 6 layout with no tab pinned, its float and locked pane kept', () => {
        const locked: Pane = { ...paneOf(['c']), locked: true };
        const written = heldPages(
            [pageAround('main', split('row', [0.5, 0.5], [paneOf(['a', 'b']), locked]))],
            [floating('free', ['f1'], FREE_PLACE)]
        );
        const five = JSON.stringify({
            version: 5,
            pages: written.pages,
            current: written.current,
            floats: written.floats
        });

        expect(parseLayout(JSON.parse(five), '')).toEqual(written);
        expect((JSON.parse(serialiseLayout(written)) as { version: number }).version).toBe(6);
    });

    it('is not given the shipped floats again, and a version 4 envelope is', () => {
        const held = heldPages([pageAround('main', paneOf(['a']))]);
        const five = { version: 5, pages: held.pages, current: held.current, floats: [] };
        const four = { version: 4, pages: held.pages, current: held.current };
        const six = { version: 6, pages: held.pages, current: held.current, floats: [] };

        expect(needsFloats(five)).toBe(false);
        expect(needsFloats(four)).toBe(true);
        expect(needsFloats(six)).toBe(false);
    });

    it('reads a pane with its active tab as the only one used', () => {
        const held = heldPages([pageAround('main', paneOf(['a', 'b'], 'b'))]);
        const five = JSON.stringify({ version: 5, pages: held.pages, current: 'main', floats: [] });

        expect(read(five)[0].recent).toBeUndefined();
        expect(read(five)[0].active).toBe('b');
    });
});

describe('a pinned tab in a saved layout', () => {
    // Revert: leave `pinned` out of tabIdShape.
    it('is written and read back pinned, and the unpinned tabs are written without the field', () => {
        const pinned: Instance = { ...instance('a'), pinned: true };
        const tabs: Instance[] = [pinned, instance('b')];
        const written = heldPages([
            pageAround('main', { kind: 'pane', tabs, active: 'b' } satisfies Pane)
        ]);
        const text = serialiseLayout(written);
        const out = JSON.parse(text) as { pages: { workbench: { root: Pane } }[] };

        expect(out.pages[0].workbench.root.tabs[0].pinned).toBe(true);
        expect(out.pages[0].workbench.root.tabs[1]).not.toHaveProperty('pinned');
        expect(parseLayout(JSON.parse(text), '')).toEqual(written);
    });

    // Revert: read `pinned` whatever its value.
    it('reads only true as a pin', () => {
        const text = withTabs(
            [
                saved('a', { pinned: false }),
                saved('b', { pinned: 'yes' }),
                saved('c', { pinned: 1 })
            ],
            'a'
        );

        expect(read(text)[0].tabs.map((tab) => tab.pinned)).toEqual([
            undefined,
            undefined,
            undefined
        ]);
    });

    it('reads a tab saved with both flags as pinned and not a preview', () => {
        const text = withTabs([saved('a', { pinned: true, preview: true }), saved('b')], 'a');
        const [first] = read(text)[0].tabs;

        expect(first.pinned).toBe(true);
        expect(first.preview).toBeUndefined();
    });

    it('puts the pinned tabs first on read, each run in its saved order', () => {
        const text = withTabs(
            [saved('a'), saved('b'), saved('c', { pinned: true }), saved('d', { pinned: true })],
            'b'
        );
        const pane = read(text)[0];

        expect(pane.tabs.map((tab) => tab.id)).toEqual(['c', 'd', 'a', 'b']);
        expect(pane.active).toBe('b');
    });
});

describe('the order a pane showed its tabs in, saved with the layout', () => {
    // Revert: leave `recent` out of readPane.
    it('reads back as it was written', () => {
        const tabs: Instance[] = [instance('a'), instance('b'), instance('c')];
        const written = heldPages([
            pageAround('main', {
                kind: 'pane',
                tabs,
                active: 'b',
                recent: ['c', 'a']
            } satisfies Pane)
        ]);
        const text = serialiseLayout(written);

        const saved = JSON.parse(text) as {
            pages: { workbench: { root: { recent: string[] } } }[];
        };
        expect(saved.pages[0].workbench.root.recent).toEqual(['c', 'a']);
        expect(parseLayout(JSON.parse(text), '')).toEqual(written);
    });

    it('keeps only ids of other tabs the pane holds, each once', () => {
        const text = withTabs([saved('a'), saved('b'), saved('c')], 'b', {
            recent: ['c', 'gone', 'b', 7, 'c', 'a']
        });

        expect(read(text)[0].recent).toEqual(['c', 'a']);
    });

    it('is absent from a pane with none, and a value that is no list reads as none', () => {
        const none = withTabs([saved('a'), saved('b')], 'a');
        const odd = withTabs([saved('a'), saved('b')], 'a', { recent: 'b' });

        expect(read(none)[0].recent).toBeUndefined();
        expect(read(odd)[0].recent).toBeUndefined();
    });
});
