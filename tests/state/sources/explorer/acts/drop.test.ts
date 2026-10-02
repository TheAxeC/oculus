// What a drop on the Files tree comes to (acts/drop.ts): which rows are dragged, where they land,
// whether they move or copy, and what a drop from outside the page does.
//
// What this does NOT cover: the drag events, which no server render fires, and the requests the
// store makes for a verdict (tests/state/sources/explorer/ops.test.ts).

import { describe, expect, it } from 'vitest';
import {
    draggedRows,
    dropInto,
    dropVerdict,
    outsideVerdict,
    type DropRow
} from '../../../../../src/lib/state/sources/explorer/acts/drop.ts';
import type { Picked } from '../../../../../src/lib/state/sources/explorer/acts/selection.ts';

const file = (path: string, root = 'hub'): DropRow => ({ root, path, kind: 'file' });
const dir = (path: string, root = 'hub'): DropRow => ({ root, path, kind: 'dir' });
const items = (verdict: ReturnType<typeof dropVerdict>): string[] =>
    verdict.kind === 'nothing' ? [] : verdict.items.map((one) => `${one.root}:${one.path}`);

describe('a drop of rows on a row', () => {
    // Revert: return `nothing` from dropVerdict for a folder target.
    it('moves a.txt onto the folder d, and copies with Option held', () => {
        const move = dropVerdict([file('a.txt')], dir('d'), false, false);
        const copy = dropVerdict([file('a.txt')], dir('d'), true, false);

        expect(move).toEqual({
            kind: 'move',
            into: { root: 'hub', path: 'd' },
            items: [{ root: 'hub', path: 'a.txt' }]
        });
        expect(copy.kind).toBe('copy');
    });

    // Revert: drop the parent test in dropVerdict.
    it('does nothing for a row dropped on the folder it already sits in', () => {
        expect(dropVerdict([file('d/a.txt')], dir('d'), false, false)).toEqual({ kind: 'nothing' });
        expect(dropVerdict([file('d/a.txt')], file('d/b.txt'), false, false)).toEqual({
            kind: 'nothing'
        });
    });

    // Revert: drop the `within(into.path, row.path)` test.
    it('does nothing for a folder dropped onto itself or onto its own child', () => {
        expect(dropVerdict([dir('d')], dir('d'), false, false)).toEqual({ kind: 'nothing' });
        expect(dropVerdict([dir('d')], dir('d/e'), false, false)).toEqual({ kind: 'nothing' });
    });

    // Revert: take the folder from the row's drawn depth rather than its path in dropInto.
    it('lands in the folder the target row stands for, however deep a filter draws it', () => {
        const verdict = dropVerdict([file('x/y/a.txt')], dir('p/q/d'), false, false);

        expect(verdict).toEqual({
            kind: 'move',
            into: { root: 'hub', path: 'p/q/d' },
            items: [{ root: 'hub', path: 'x/y/a.txt' }]
        });
    });

    // Revert: let a name being typed take the drop.
    it('does nothing onto a row whose name is being typed', () => {
        expect(dropVerdict([file('a.txt')], dir('d'), false, true)).toEqual({ kind: 'nothing' });
    });

    // Revert: drop the `row.path !== ''` filter.
    it('never carries a root row', () => {
        expect(dropVerdict([dir('', 'other')], dir('d'), false, false)).toEqual({
            kind: 'nothing'
        });
    });

    // Revert: drop the `carried.some` test.
    it('leaves out a row that lies below another dragged folder, which goes along with it', () => {
        const verdict = dropVerdict(
            [dir('x'), file('x/y.txt'), file('z.txt')],
            dir('d'),
            false,
            false
        );

        expect(items(verdict)).toEqual(['hub:x', 'hub:z.txt']);
    });

    // Revert: have a drop on a root row land in the folder above it.
    it('lands a drop on a root row in the root, and a drop on a file in the folder holding it', () => {
        expect(dropInto(dir('', 'notes'))).toEqual({ root: 'notes', path: '' });
        expect(dropInto(file('d/b.txt'))).toEqual({ root: 'hub', path: 'd' });
        expect(dropInto(file('top.txt'))).toEqual({ root: 'hub', path: '' });
        expect(items(dropVerdict([file('a.txt')], dir('', 'notes'), false, false))).toEqual([
            'hub:a.txt'
        ]);
    });
});

describe('the rows a drag carries', () => {
    const picked: Picked = {
        selected: { root: 'hub', path: 'a' },
        selection: [
            { root: 'hub', path: 'a' },
            { root: 'hub', path: 'b' },
            { root: 'hub', path: 'c' }
        ],
        anchor: { root: 'hub', path: 'a' }
    };
    const kindOf = (): 'file' => 'file';

    // Revert: return the dragged row alone from draggedRows.
    it('carries the whole selection when the dragged row is part of it', () => {
        expect(draggedRows(picked, file('b'), kindOf).map((one) => one.path)).toEqual([
            'a',
            'b',
            'c'
        ]);
    });

    // Revert: carry the selection whatever row is dragged.
    it('carries the dragged row alone when it is not selected', () => {
        expect(draggedRows(picked, file('z'), kindOf).map((one) => one.path)).toEqual(['z']);
    });
});

describe('a drop from outside the page', () => {
    // Revert: upload the folders as well.
    it('uploads the files dropped in order and refuses a folder by its name', () => {
        expect(
            outsideVerdict([
                { name: 'a.txt', directory: false },
                { name: 'pics', directory: true },
                { name: 'b.txt', directory: false }
            ])
        ).toEqual({ upload: [0, 2], refused: ['pics'] });
    });
});
