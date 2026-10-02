// Layer 2, client state tests. A locked pane in a saved layout: the field is written, read back
// as the same pane, absent from a pane that is not locked, and a version 5 layout saved before the
// field reads as unlocked. The version stays 5, so an older reader is not turned away.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    panes,
    parseLayout,
    serialiseLayout,
    type Layout,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { heldPages, pageAround, paneOf, split } from '../layout-fixture.ts';

function around(...children: Pane[]): Layout {
    return split(
        'row',
        children.map(() => 1 / children.length),
        children
    );
}

function read(text: string): Pane[] {
    const held = parseLayout(text, '');
    if (held === null) throw new Error('the layout was refused');
    return panes(held.pages[0].workbench.root).map(({ pane }) => pane);
}

describe('a locked pane in a saved layout', () => {
    it('is written with locked: true and read back as the same pane', () => {
        const locked: Pane = { ...paneOf(['a', 'b']), locked: true };
        const written = heldPages([pageAround('main', around(paneOf(['c']), locked))]);
        const text = serialiseLayout(written);
        const saved = JSON.parse(text) as {
            pages: { workbench: { root: { children: Pane[] } } }[];
        };
        const children = saved.pages[0].workbench.root.children;
        expect(children[0]).not.toHaveProperty('locked');
        expect(children[1].locked).toBe(true);
        expect(parseLayout(text, '')).toEqual(written);
    });

    it('keeps the lock of an empty pane', () => {
        const locked: Pane = { kind: 'pane', tabs: [], active: '', locked: true };
        const written = heldPages([pageAround('main', around(paneOf(['c']), locked))]);
        expect(read(serialiseLayout(written))[1]).toEqual(locked);
    });

    it('keeps the lock together with the kind an empty pane carries', () => {
        const both: Pane = { kind: 'pane', tabs: [], active: '', keeps: 'terminals', locked: true };
        const written = heldPages([pageAround('main', around(paneOf(['c']), both))]);
        expect(read(serialiseLayout(written))[1]).toEqual(both);
    });

    it('reads a version 5 layout written without the field as unlocked', () => {
        const written = heldPages([pageAround('main', around(paneOf(['a']), paneOf(['b'])))]);
        const text = serialiseLayout(written);
        expect((JSON.parse(text) as { version: number }).version).toBe(LAYOUT_VERSION);
        expect(LAYOUT_VERSION).toBe(5);
        expect(text).not.toContain('locked');
        expect(read(text).map((one) => one.locked)).toEqual([undefined, undefined]);
    });

    it('reads only true as a lock', () => {
        const written = heldPages([pageAround('main', around(paneOf(['a']), paneOf(['b'])))]);
        const saved = JSON.parse(serialiseLayout(written)) as {
            pages: { workbench: { root: { children: Record<string, unknown>[] } } }[];
        };
        const children = saved.pages[0].workbench.root.children;
        children[0].locked = 'yes';
        children[1].locked = false;
        expect(read(JSON.stringify(saved)).map((one) => one.locked)).toEqual([
            undefined,
            undefined
        ]);
    });
});
