// The merge editor's model: the three versions of a conflicted file cut into settled regions and
// conflicts, a conflict settled each way, the result typed into by hand, and the count of what is
// still open. The rules are pure; what the server writes and stages is tests/server/git.

import { describe, expect, it } from 'vitest';
import {
    chooseIn,
    chosenLines,
    editIn,
    historyOf,
    initialPieces,
    linesOf,
    openCount,
    regionsOf,
    settlePiece,
    takesDeletion,
    typedPieces,
    type Choice,
    type Region
} from '../../../../src/lib/state/sources/repositories/merge-regions.ts';

const BASE = 'a\nb\nc\nd\ne\nf\ng\n';
// Both sides changed b, each its own way; both changed e the same way; only Incoming changed g.
const OURS = 'a\nB-ours\nc\nd\nE\nf\ng\n';
const THEIRS = 'a\nB-theirs\nc\nd\nE\nf\nG\n';

/** The one conflict of the three versions above. */
function conflictOf(regions: Region[]): Extract<Region, { kind: 'conflict' }> {
    const found = regions.find((one) => one.kind === 'conflict');
    if (found?.kind !== 'conflict') throw new Error('no conflict');
    return found;
}

describe('the regions of a three-way merge', () => {
    it('settles what one side changed or both changed alike, and leaves a conflict where they differ', () => {
        const regions = regionsOf(BASE, OURS, THEIRS);
        expect(regions.map((one) => one.kind)).toEqual(['settled', 'conflict', 'settled']);
        expect(regions[0]).toMatchObject({ kind: 'settled', lines: ['a'] });
        expect(regions[2]).toMatchObject({ kind: 'settled', lines: ['c', 'd', 'E', 'f', 'G'] });
        const conflict = conflictOf(regions);
        expect(conflict.base).toEqual(['b']);
        expect(conflict.ours).toEqual(['B-ours']);
        expect(conflict.theirs).toEqual(['B-theirs']);
        expect(conflict.at.ours).toEqual({ start: 1, count: 1 });
        expect(conflict.at.theirs).toEqual({ start: 1, count: 1 });
    });

    it('answers one settled region for three empty versions', () => {
        expect(regionsOf('', '', '')).toEqual([
            {
                kind: 'settled',
                lines: [],
                ours: { start: 0, count: 0 },
                theirs: { start: 0, count: 0 }
            }
        ]);
    });

    it('settles a deletion one side made where the other left the lines as they were', () => {
        // Current took line b out; the settled regions either side of it join into one.
        expect(regionsOf('a\nb\nc\n', 'a\nc\n', 'a\nb\nc\n')).toEqual([
            {
                kind: 'settled',
                lines: ['a', 'c'],
                ours: { start: 0, count: 2 },
                theirs: { start: 0, count: 3 }
            }
        ]);
    });

    it('settles a change one side made, each side counting its own lines', () => {
        // Incoming wrote two lines where b was; Current kept b, so Current's span holds one line.
        expect(regionsOf('a\nb\nc\n', 'a\nb\nc\n', 'a\nx\ny\nc\n')).toEqual([
            {
                kind: 'settled',
                lines: ['a', 'x', 'y', 'c'],
                ours: { start: 0, count: 3 },
                theirs: { start: 0, count: 4 }
            }
        ]);
    });

    it('cuts a text into lines without an empty line for the final newline', () => {
        expect(linesOf('a\nb\n')).toEqual(['a', 'b']);
        expect(linesOf('a\nb')).toEqual(['a', 'b']);
        expect(linesOf('')).toEqual([]);
    });
});

describe('a conflict settled', () => {
    it('takes Incoming, Current, both in either order, or the ancestor for Ignore', () => {
        const conflict = conflictOf(regionsOf(BASE, OURS, THEIRS));
        const take = (choice: Choice): string[] => chosenLines(conflict, choice);
        expect(take('incoming')).toEqual(['B-theirs']);
        expect(take('current')).toEqual(['B-ours']);
        expect(take('both-current')).toEqual(['B-ours', 'B-theirs']);
        expect(take('both-incoming')).toEqual(['B-theirs', 'B-ours']);
        expect(take('base')).toEqual(['b']);
        expect(take('open')).toEqual(['b']);
    });

    it('rewrites only the settled conflict piece of the result, and counts what stays open', () => {
        const regions = regionsOf(BASE, OURS, THEIRS);
        const pieces = initialPieces(regions);
        expect(pieces.join('')).toBe('a\nb\nc\nd\nE\nf\nG\n');
        const settled = settlePiece(pieces, regions, 1, 'incoming');
        expect(settled.join('')).toBe('a\nB-theirs\nc\nd\nE\nf\nG\n');
        expect(settled[0]).toBe(pieces[0]);
        expect(openCount(regions, ['open', 'open', 'open'])).toBe(1);
        expect(openCount(regions, ['open', 'incoming', 'open'])).toBe(0);
    });
});

describe('the result typed into by hand', () => {
    it('puts the typing into the piece it lands in and names that region as touched', () => {
        const regions = regionsOf(BASE, OURS, THEIRS);
        const pieces = initialPieces(regions);
        const typed = typedPieces(pieces, 'a\nmine\nc\nd\nE\nf\nG\n');
        expect(typed.pieces).toEqual(['a\n', 'mine\n', 'c\nd\nE\nf\nG\n']);
        expect(typed.touched).toEqual([1]);
    });

    it('gives a deletion across pieces to the first it reaches, empties the rest, and touches those', () => {
        const pieces = ['a\n', 'b\n', 'c\n'];
        const typed = typedPieces(pieces, 'a\n');
        expect(typed.pieces).toEqual(['a\n', '', '']);
        expect(typed.touched).toEqual([1, 2]);
    });

    it('takes typing into a result whose versions left no lines, as when both sides emptied it', () => {
        const regions = regionsOf('gone\n', '', '');
        expect(regions).toHaveLength(1);
        const typed = typedPieces(initialPieces(regions), 'kept\n');
        expect(typed.pieces.join('')).toBe('kept\n');
        expect(
            openCount(
                regions,
                typed.touched.map(() => 'edited')
            )
        ).toBe(0);
    });
});

describe('undo and redo of a choice', () => {
    // Two conflicts, at b and at d, each side changing both its own way.
    const regions = regionsOf('a\nb\nc\nd\ne\n', 'a\nB1\nc\nD1\ne\n', 'a\nB2\nc\nD2\ne\n');
    const [first, second] = regions.flatMap((region, at) =>
        region.kind === 'conflict' ? [at] : []
    );
    const start = historyOf({ pieces: initialPieces(regions), choices: regions.map(() => 'open') });
    const text = (history: typeof start): string => history.held.pieces.join('');

    it('takes a choice back by undo and puts it again by redo', () => {
        const chosen = chooseIn(start, regions, first, 'incoming');
        const undone = editIn(chosen, regions, text(start), 'undo');
        expect(undone.held.choices[first]).toBe('open');
        const redone = editIn(undone, regions, text(chosen), 'redo');
        expect(redone.held.choices[first]).toBe('incoming');
    });

    it('keeps a choice to redo across the undo and redo of typing made before it', () => {
        const typedText = text(start).replace('a\n', 'A\n');
        const typed = editIn(start, regions, typedText, 'type');
        const chosen = chooseIn(typed, regions, first, 'incoming');
        // Undo the choice, then the typing; redo the typing, then the choice.
        let history = editIn(chosen, regions, text(typed), 'undo');
        history = editIn(history, regions, text(start), 'undo');
        history = editIn(history, regions, typedText, 'redo');
        history = editIn(history, regions, text(chosen), 'redo');
        expect(history.held.choices[first]).toBe('incoming');
    });

    it('ends what redo could put back once the reader types after an undo', () => {
        // Revert: in editIn of merge-regions.ts, keep `history.redoable` on typing, and the redo
        // below puts the undone choice back.
        const chosen = chooseIn(start, regions, first, 'incoming');
        let history = editIn(chosen, regions, text(start), 'undo');
        // Typing after the undo, then typed back to the same text.
        const typedText = text(start).replace('a\n', 'A\n');
        history = editIn(history, regions, typedText, 'type');
        history = editIn(history, regions, text(start), 'type');
        expect(history.redoable).toEqual([]);
        // A redo from the editor now lands on text the undone choice made, and is read as typing.
        history = editIn(history, regions, text(chosen), 'redo');
        expect(history.held.choices[first]).toBe('edited');
    });

    it('reads typing that lands on the text before a choice as typing, never as its undo', () => {
        let history = chooseIn(start, regions, first, 'incoming');
        const after = text(history);
        // Another conflict typed into and back: settled by hand, the text the choice's again.
        history = editIn(history, regions, after.replace('d\n', 'X\n'), 'type');
        history = editIn(history, regions, after, 'type');
        expect(history.held.choices[second]).toBe('edited');
        // The chosen conflict typed back to what it was before the choice.
        history = editIn(history, regions, text(start), 'type');
        expect(history.held.choices[second]).toBe('edited');
        expect(history.held.choices[first]).toBe('edited');
    });
});

describe('Complete Merge on a path a side deleted', () => {
    it('takes the deletion when a side deleted the path and the Result is empty', () => {
        for (const deleted of ['both', 'ours', 'theirs']) {
            expect(takesDeletion(deleted, ''), deleted).toBe(true);
            expect(takesDeletion(deleted, 'kept\n'), deleted).toBe(false);
        }
        expect(takesDeletion('', '')).toBe(false);
    });

    it('writes an empty Result over a path neither side deleted, as the file it now is', () => {
        expect(takesDeletion('', '')).toBe(false);
    });

    it('starts a path both sides deleted with an empty Result, which Complete Merge takes as the deletion', () => {
        const pieces = initialPieces(regionsOf('gone\n', '', ''));
        expect(takesDeletion('both', pieces.join(''))).toBe(true);
    });
});
