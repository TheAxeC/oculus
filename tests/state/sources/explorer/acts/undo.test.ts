// Which record of the change log Cmd+Z and Shift+Cmd+Z take back in the Files view
// (acts/undo.ts), and the moves a taken-back rename restates for the tabs and bookmarks over it.
//
// What this does NOT cover: the request that takes a record back (tests/routes/files/
// file-undo.test.ts) or the keys.

import { describe, expect, it } from 'vitest';
import {
    stampPaths,
    undoPlan,
    undoneMoves,
    type FileRecord,
    type LoggedChange
} from '../../../../../src/lib/state/sources/explorer/acts/undo.ts';
import type { FsRoot } from '../../../../../src/lib/state/sources/fs.ts';

/** A log newest first, from the records oldest first. */
function log(...oldestFirst: LoggedChange[]): LoggedChange[] {
    return [...oldestFirst].reverse();
}

const op = (at: string, over: Partial<LoggedChange> = {}): LoggedChange => ({
    at,
    kind: 'files',
    undo: 'file',
    ...over
});

describe('which record Cmd+Z and Shift+Cmd+Z take back', () => {
    // Revert: take the oldest record instead of the newest in undoPlan.
    it('undoes the newest file operation and has nothing to redo', () => {
        const plan = undoPlan(log(op('1'), op('2')));

        expect(plan.undo?.at).toBe('2');
        expect(plan.redo).toBeNull();
    });

    // Revert: count a record that undoes as an operation to undo.
    it('undoes the next older operation once the newest was taken back, and offers the redo', () => {
        const plan = undoPlan(log(op('1'), op('2'), op('3', { undoes: '2' })));

        expect(plan.undo?.at).toBe('1');
        expect(plan.redo?.at).toBe('3');
    });

    // Revert: leave the `!undone` test out of the redo search.
    it('offers the operation again once its undo was taken back', () => {
        const plan = undoPlan(log(op('1'), op('2', { undoes: '1' }), op('3', { undoes: '2' })));

        expect(plan.undo?.at).toBe('1');
        expect(plan.redo).toBeNull();
    });

    // Revert: let a record with `undo: none` be undone.
    it('skips a record that has no way back', () => {
        expect(undoPlan(log(op('1'), op('2', { undo: 'none' }))).undo?.at).toBe('1');
    });

    // Revert: let the plan read the records of other kinds.
    it('reads only the records of kind files', () => {
        const plan = undoPlan(log(op('1'), { at: '2', kind: 'config-key', undo: 'config-key' }));

        expect(plan.undo?.at).toBe('1');
    });

    // Revert: loop on records that undo each other in undone().
    it('ends on a log whose records undo each other', () => {
        const plan = undoPlan(log(op('1', { undoes: '2' }), op('2', { undoes: '1' })));

        expect(plan.undo).toBeNull();
    });
});

describe('the paths a record stamps', () => {
    // Revert: return the stamps whole from stampPaths.
    it('lists the absolute paths of a list of stamps and none for anything else', () => {
        expect(stampPaths([{ path: '/a', size: 1 }, { path: '/b' }])).toEqual(['/a', '/b']);
        expect(stampPaths([{ path: '' }])).toEqual([]);
        expect(stampPaths('nope')).toEqual([]);
        expect(stampPaths(null)).toEqual([]);
    });
});

describe('the moves a taken-back rename restates', () => {
    const ROOTS: FsRoot[] = [
        { key: 'hub', dir: '/r/hub', fixed: true },
        { key: 'notes', dir: '/r/notes', fixed: false }
    ];
    const record = (field: string, before: string[], after: string[]): FileRecord => ({
        ...op('1'),
        field,
        before: before.map((path) => ({ path })),
        after: after.map((path) => ({ path }))
    });

    // Revert: restate the move in the direction it was made.
    it('moves each path the operation put in place back to where it came from', () => {
        const moves = undoneMoves(record('rename', ['/r/hub/a.md'], ['/r/hub/b.md']), ROOTS);

        expect(moves).toEqual([
            { from: { root: 'hub', path: 'b.md' }, to: { root: 'hub', path: 'a.md' } }
        ]);
    });

    // Revert: leave the field test out of undoneMoves.
    it('restates nothing for an operation that is not a rename or a move', () => {
        expect(undoneMoves(record('trash', ['/r/hub/a.md'], ['/r/hub/b.md']), ROOTS)).toEqual([]);
        expect(undoneMoves(record('create', [], ['/r/hub/b.md']), ROOTS)).toEqual([]);
    });

    // Revert: keep a path outside the served roots.
    it('restates nothing for a path outside every root', () => {
        expect(undoneMoves(record('move', ['/elsewhere/a.md'], ['/r/hub/b.md']), ROOTS)).toEqual(
            []
        );
        expect(
            undoneMoves(
                record('move', ['/r/notes/a.md', '/r/hub/c.md'], ['/r/hub/b.md', '/r/notes/d.md']),
                ROOTS
            ).length
        ).toBe(2);
    });
});
