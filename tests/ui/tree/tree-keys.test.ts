// The keyboard of an explorer tree, ui/tree/tree-keys.ts: where a key moves the focus, which row it
// opens or closes, and which row holds the tree's one stop. Each case names the change that turns
// it red.
//
// What this does NOT cover: the focus actually moving and Enter pressing a row, which need a DOM
// and are tests/browser/sources/files.spec.ts and tests/browser/sources/repositories.spec.ts.

import { describe, expect, it } from 'vitest';
import { rowMove, stopOf, type KeyRow } from '../../../src/lib/ui/tree/tree-keys.ts';

/**
 * A root open over a folder open over a file, a closed folder, a file, and a second closed root.
 */
const ROWS: KeyRow[] = [
    { id: 'hub', parent: null, open: true },
    { id: 'code', parent: 'hub', open: true },
    { id: 'run.py', parent: 'code' },
    { id: 'docs', parent: 'hub', open: false },
    { id: 'README.md', parent: 'hub' },
    { id: 'notes', parent: null, open: false }
];

describe('where a key moves in the tree', () => {
    // Revert: swap the ArrowDown and ArrowUp lines of rowMove.
    it('steps one row down and up, and stops at either end', () => {
        expect(rowMove(ROWS, 'code', 'ArrowDown')).toEqual({ kind: 'focus', id: 'run.py' });
        expect(rowMove(ROWS, 'code', 'ArrowUp')).toEqual({ kind: 'focus', id: 'hub' });
        expect(rowMove(ROWS, 'hub', 'ArrowUp')).toBeNull();
        expect(rowMove(ROWS, 'notes', 'ArrowDown')).toBeNull();
    });

    // Revert: make Home focus the last row.
    it('goes to the first row on Home and the last on End', () => {
        expect(rowMove(ROWS, 'code', 'Home')).toEqual({ kind: 'focus', id: 'hub' });
        expect(rowMove(ROWS, 'code', 'End')).toEqual({ kind: 'focus', id: 'notes' });
    });

    // Revert: focus the next row for a closed row on ArrowRight instead of opening it.
    it('opens a closed row on Right, steps into an open one, and does nothing on a leaf', () => {
        expect(rowMove(ROWS, 'docs', 'ArrowRight')).toEqual({ kind: 'toggle', id: 'docs' });
        expect(rowMove(ROWS, 'code', 'ArrowRight')).toEqual({ kind: 'focus', id: 'run.py' });
        expect(rowMove(ROWS, 'README.md', 'ArrowRight')).toBeNull();
    });

    // Revert: focus the parent on ArrowLeft even while the row is open.
    it('closes an open row on Left, and otherwise steps out to the row above it', () => {
        expect(rowMove(ROWS, 'code', 'ArrowLeft')).toEqual({ kind: 'toggle', id: 'code' });
        expect(rowMove(ROWS, 'run.py', 'ArrowLeft')).toEqual({ kind: 'focus', id: 'code' });
        expect(rowMove(ROWS, 'docs', 'ArrowLeft')).toEqual({ kind: 'focus', id: 'hub' });
        expect(rowMove(ROWS, 'notes', 'ArrowLeft')).toBeNull();
    });

    // Revert: drop the `fixed` tests from the Right and Left branches of rowMove.
    it('steps through a row held open or closed for it, and never opens or closes it', () => {
        const fixed = ROWS.map((row) => ({ ...row, fixed: true }));
        expect(rowMove(fixed, 'code', 'ArrowLeft')).toEqual({ kind: 'focus', id: 'hub' });
        expect(rowMove(fixed, 'code', 'ArrowRight')).toEqual({ kind: 'focus', id: 'run.py' });
        expect(rowMove(fixed, 'docs', 'ArrowRight')).toBeNull();
    });

    // Revert: return null from rowMove for a row that is not drawn.
    it('goes to the first row from a row not drawn, or the last on End, and answers no other key', () => {
        expect(rowMove(ROWS, 'gone', 'ArrowDown')).toEqual({ kind: 'focus', id: 'hub' });
        expect(rowMove(ROWS, 'gone', 'End')).toEqual({ kind: 'focus', id: 'notes' });
        expect(rowMove(ROWS, 'gone', 'Enter')).toBeNull();
        expect(rowMove(ROWS, 'code', 'Enter')).toBeNull();
        expect(rowMove(ROWS, 'code', 'a')).toBeNull();
        expect(rowMove([], 'code', 'ArrowDown')).toBeNull();
    });
});

describe('the stop of the tree', () => {
    // Revert: return `wanted` from stopOf whether or not it is drawn.
    it('is the row asked for while it is drawn, and the first row otherwise', () => {
        expect(stopOf(ROWS, 'docs')).toBe('docs');
        expect(stopOf(ROWS, 'gone')).toBe('hub');
        expect(stopOf(ROWS, '')).toBe('hub');
        expect(stopOf([], 'docs')).toBe('');
    });
});
