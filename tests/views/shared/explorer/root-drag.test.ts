// Layer 3, view-partial tests. The root drag of the file browser's tree
// (views/shared/explorer/tree/control/dragging.svelte.ts): a tree takes a drop only of roots its
// own drag carries, so a drag from another Files tab never writes this tree's order, even when
// this tree's last root drag ended without `dragend` and left its roots held. The write is the
// order of the roots in sources.yml, so a wrong drop changes the reader's configuration.
//
// It does not cover the row drawing the drop line or the browser's own drag events, which the
// look does.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDragging } from '../../../../src/lib/views/shared/explorer/tree/control/dragging.svelte.ts';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';

class Box {
    getBoundingClientRect(): { top: number; height: number } {
        return { top: 0, height: 20 };
    }
}

type Transfer = {
    types: string[];
    dropEffect: string;
    effectAllowed: string;
    setData: (type: string) => void;
};

/** A drag's data: the types it carries, as the browser lists them. */
function transfer(): Transfer {
    return {
        types: [],
        dropEffect: 'unset',
        effectAllowed: 'unset',
        setData(type: string) {
            if (!this.types.includes(type)) this.types.push(type);
        }
    };
}

function dragEvent(data: Transfer, clientY = 15): DragEvent {
    return {
        dataTransfer: data,
        clientY,
        currentTarget: new Box(),
        target: null,
        altKey: false,
        preventDefault: vi.fn()
    } as unknown as DragEvent;
}

function root(key: string): TreeRow {
    return { root: key, path: '', name: key, kind: 'dir', size: 0, depth: 0, open: false };
}

/** One Files tab's tree over the roots `ordo` and `cath`, recording each order it writes. */
function tree() {
    const written: string[][] = [];
    const rows = [root('ordo'), root('cath')];
    const dragging = createDragging({
        roots: () =>
            [
                { key: 'ordo', dir: '/hub/ordo' },
                { key: 'cath', dir: '/hub/cath' }
            ] as never,
        picked: () => ({ selected: null, selection: [], anchor: null }),
        drawn: () => rows,
        dropper: {} as never,
        order: () => ['ordo', 'cath'],
        onreorder: (keys) => written.push(keys)
    });
    return { dragging, rows, written };
}

describe('the root drag of the tree', () => {
    // The drag reads `Element` from the global scope, which the client project has no DOM for.
    beforeEach(() => {
        vi.stubGlobal('Element', Box);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('writes no order for a drag from another tab over a tree whose own drag never ended', () => {
        const stale = tree();
        // The stale tree's drag of `cath` ends without `dragend`, so it still holds `cath`.
        stale.dragging.started(dragEvent(transfer()), stale.rows[1]);
        const other = tree();
        const data = transfer();
        other.dragging.started(dragEvent(data), other.rows[0]);
        const over = dragEvent(data, 5);
        stale.dragging.over(over, stale.rows[0]);
        stale.dragging.dropped(dragEvent(data, 5), stale.rows[0]);
        expect(data.dropEffect).toBe('none');
        expect(stale.dragging.dropEdge(stale.rows[0])).toBeUndefined();
        expect(stale.written).toEqual([]);
    });

    it("still takes the drop of the tree's own drag", () => {
        const own = tree();
        const data = transfer();
        own.dragging.started(dragEvent(data), own.rows[0]);
        own.dragging.over(dragEvent(data, 15), own.rows[1]);
        own.dragging.dropped(dragEvent(data, 15), own.rows[1]);
        expect(own.written).toEqual([['cath', 'ordo']]);
    });
});
