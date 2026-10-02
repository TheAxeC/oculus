// The diff pane's model: the hunks cut from Monaco's line changes, the rows a selection chooses in
// a hunk, the step from hunk to hunk and file to file, the hunk a pane opens at, which actions a
// file allows, and the patch a hunk or its chosen rows are staged, unstaged or reverted with. The
// rules are pure, so each is checked on line changes and texts written out here; what git does
// with the patch is tests/server/git/git-ops.test.ts, and the hunks against git's own are
// hunks-git.test.ts.

import { describe, expect, it } from 'vitest';
import {
    chosenRows,
    countsOf,
    diffActions,
    endingsOnly,
    hunkHead,
    hunkNear,
    hunkRows,
    hunksOf,
    stepChange,
    stepFiles,
    type ChosenRows,
    type Hunk,
    type LineChange,
    type LineSelection
} from '../../../../../src/lib/state/sources/repositories/diff/diff-hunks.ts';
import {
    sidesPatch,
    type PatchMode
} from '../../../../../src/lib/state/sources/repositories/diff/diff-patch.ts';
import type { DiffAttributes, DiffSides } from '../../../../../src/lib/data/model/index.ts';
import { monacoLineChanges } from '../../../../ui/controls/editor/monaco-diff.ts';

/** A change of modified lines `from` to `to` against original lines `oldFrom` to `oldTo`. */
function change(oldFrom: number, oldTo: number, from: number, to: number): LineChange {
    return {
        originalStartLineNumber: oldFrom,
        originalEndLineNumber: oldTo,
        modifiedStartLineNumber: from,
        modifiedEndLineNumber: to
    };
}

/** A selection from one line and column to another, as Monaco holds one. */
function selection(
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
): LineSelection {
    return { startLineNumber, startColumn, endLineNumber, endColumn };
}

/** A whole line selected, from its first column to past its last. */
function line(number: number): LineSelection {
    return selection(number, 1, number, 9);
}

/** The one hunk of the changes given. */
function only(...changes: LineChange[]): Hunk {
    const hunks = hunksOf(changes);
    expect(hunks).toHaveLength(1);
    return hunks[0];
}

const HEAD = [
    'diff --git a/a.txt b/a.txt',
    'index 1111111..2222222 100644',
    '--- a/a.txt',
    '+++ b/a.txt'
];

/** Numbered lines, each with its newline. */
function numbered(count: number, rename: Record<number, string> = {}): string {
    return Array.from({ length: count }, (_, at) => `${rename[at + 1] ?? `line ${at + 1}`}\n`).join(
        ''
    );
}

/** One file's two versions with the head above. */
function sides(original: string, modified: string, head: string[] = HEAD): DiffSides {
    return {
        oldPath: 'a.txt',
        newPath: 'a.txt',
        head,
        binary: false,
        encoded: true,
        original,
        modified
    };
}

/** The patch of the chosen rows, over the line changes Monaco draws for the file's two texts. */
function patchOf(file: DiffSides, rows: ChosenRows, mode: PatchMode): string {
    return sidesPatch(file, monacoLineChanges(file.original, file.modified), rows, mode);
}

/** The attributes of a file git converts nothing in. */
const PLAIN: DiffAttributes = {
    filter: 'unspecified',
    text: 'unspecified',
    eol: 'unspecified',
    workingTreeEncoding: 'unspecified',
    ident: 'unspecified',
    autocrlf: ''
};

describe('the hunks of a diff', () => {
    it("joins changes at most six unchanged lines apart into one hunk, as git's grouping does", () => {
        expect(hunksOf([change(10, 10, 10, 10), change(17, 17, 17, 17)])).toHaveLength(1);
        expect(hunksOf([change(10, 10, 10, 10), change(18, 18, 18, 18)])).toHaveLength(2);
        expect(hunksOf([change(10, 10, 10, 10)])).toHaveLength(1);
        expect(hunksOf([])).toEqual([]);
    });

    it("writes a hunk's head as git does, three lines of context each side", () => {
        const hunk = only(change(10, 10, 10, 10));
        expect(hunkHead(hunk, 20, 20)).toEqual({
            oldStart: 7,
            oldCount: 7,
            newStart: 7,
            newCount: 7
        });
        // A deletion of the first two lines: the new side's empty start is the line before it.
        expect(hunkHead(only(change(1, 2, 0, 0)), 20, 18)).toEqual({
            oldStart: 1,
            oldCount: 5,
            newStart: 1,
            newCount: 3
        });
    });
});

describe('the rows a selection chooses', () => {
    it('chooses the added line selected and, for a change of as many lines each side, its pair', () => {
        const hunk = only(change(10, 14, 10, 14));
        expect(chosenRows(hunk, [line(12)], [])).toEqual({ removed: [12], added: [12] });
    });

    it('takes every removed line of a change whose two sides differ in length', () => {
        const hunk = only(change(10, 11, 10, 14));
        expect(chosenRows(hunk, [line(12)], [])).toEqual({ removed: [10, 11], added: [12] });
    });

    it('chooses a pure deletion by the line it sits after, or the line after that', () => {
        const hunk = only(change(21, 23, 20, 0));
        expect(chosenRows(hunk, [line(20)], [])).toEqual({ removed: [21, 22, 23], added: [] });
        expect(chosenRows(hunk, [line(21)], [])).toEqual({ removed: [21, 22, 23], added: [] });
        expect(chosenRows(hunk, [line(22)], [])).toEqual({ removed: [], added: [] });
        // A deletion at the top sits after line 0, which the first line stands for.
        const top = only(change(1, 2, 0, 0));
        expect(chosenRows(top, [line(1)], [])).toEqual({ removed: [1, 2], added: [] });
    });

    it('chooses a removed line alone from a selection on the original side', () => {
        const hunk = only(change(10, 14, 10, 14));
        expect(chosenRows(hunk, [], [line(11)])).toEqual({ removed: [11], added: [] });
    });

    it('chooses nothing for a selection that touches no change, or an empty one', () => {
        const hunk = only(change(10, 14, 10, 14));
        expect(chosenRows(hunk, [line(3)], [line(30)])).toEqual({ removed: [], added: [] });
        expect(chosenRows(hunk, [selection(12, 4, 12, 4)], [])).toEqual({
            removed: [],
            added: []
        });
    });

    it('reads a selection that ends at column 1 as ending on the line before', () => {
        // Pressing line 12's number selects from line 12 to the first column of line 13.
        const hunk = only(change(10, 14, 10, 14));
        expect(chosenRows(hunk, [selection(12, 1, 13, 1)], [])).toEqual({
            removed: [12],
            added: [12]
        });
    });

    it('chooses every row of a hunk for its block actions', () => {
        const hunk = only(change(3, 4, 3, 3), change(8, 7, 8, 9));
        expect(hunkRows(hunk)).toEqual({ removed: [3, 4], added: [3, 8, 9] });
    });
});

describe('Previous Change and Next Change', () => {
    it('goes to the first change by Next and the last by Previous while no change is current', () => {
        expect(stepChange(-1, 3, 1)).toBe(0);
        expect(stepChange(-1, 3, -1)).toBe(2);
    });

    it('moves one change either way, round from the last to the first and back', () => {
        expect(stepChange(2, 3, 1)).toBe(0);
        expect(stepChange(0, 3, -1)).toBe(2);
        expect(stepChange(-1, 0, 1)).toBe(-1);
    });

    it('crosses from the last change of one file to the first of the next, and back', () => {
        expect(stepFiles([2, 3], { file: 0, hunk: 1 }, 1)).toEqual({ file: 1, hunk: 0 });
        expect(stepFiles([2, 3], { file: 1, hunk: 0 }, -1)).toEqual({ file: 0, hunk: 1 });
        expect(stepFiles([2, 3], { file: 1, hunk: 2 }, 1)).toEqual({ file: 0, hunk: 0 });
        expect(stepFiles([2, 3], null, -1)).toEqual({ file: 1, hunk: 2 });
        // A file with no change is stepped over; a file not drawn yet is one stop, its hunks
        // unknown.
        expect(stepFiles([1, 0, 2], { file: 0, hunk: 0 }, 1)).toEqual({ file: 2, hunk: 0 });
        expect(stepFiles([1, null], { file: 0, hunk: 0 }, 1)).toEqual({ file: 1, hunk: -1 });
        expect(stepFiles([0, 0], null, 1)).toBeNull();
    });

    it('steps over a binary file and a rename alone, which draw no diff editor', () => {
        const binary = { ...sides('', ''), binary: true };
        const renamed = sides('same\n', 'same\n');
        const counts = countsOf([binary, renamed, sides('a\n', 'b\n')]);
        expect(counts).toEqual([0, 0, null]);
        expect(stepFiles(counts, null, 1)).toEqual({ file: 2, hunk: -1 });
        expect(stepFiles(countsOf([binary, renamed]), null, 1)).toBeNull();
    });

    it('finds a file whose line endings alone changed, where Monaco draws no change', () => {
        const endings = sides('a\r\nb\r\n', 'a\nb\n');
        expect(hunksOf(monacoLineChanges(endings.original, endings.modified))).toEqual([]);
        expect(endingsOnly(endings)).toBe(true);
        expect(endingsOnly(sides('a\n', 'b\n'))).toBe(false);
        expect(endingsOnly(sides('a\n', 'a\n'))).toBe(false);
        expect(endingsOnly(sides('a\n', 'a'))).toBe(false);
        expect(endingsOnly({ ...endings, binary: true })).toBe(false);
    });
});

describe('the hunk a pane opens at', () => {
    /** Hunks over the modified lines given, each one change of the same lines on both sides. */
    const hunks = [only(change(10, 11, 10, 11)), only(change(17, 17, 17, 17))];

    it('takes the hunk holding the line, else the first after it, else the last', () => {
        // Line 12 is nearer the hunk at 10, which is not taken: the first after it is.
        expect(hunkNear(hunks, 12)).toBe(1);
        expect(hunkNear(hunks, 10)).toBe(0);
        expect(hunkNear(hunks, 30)).toBe(1);
        expect(hunkNear([], 3)).toBe(-1);
    });
});

describe('the actions a file allows', () => {
    it('offers line actions on a plain text file', () => {
        expect(diffActions(sides('a\n', 'b\n'), PLAIN)).toBe('lines');
    });

    it('offers nothing on a path in conflict', () => {
        expect(diffActions(sides('a\n', 'b\n'), PLAIN, true)).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), PLAIN, false)).toBe('lines');
    });

    it('offers only the whole file on a new or a deleted file', () => {
        const created = [...HEAD.slice(0, 1), 'new file mode 100644', ...HEAD.slice(1)];
        const deleted = [...HEAD.slice(0, 1), 'deleted file mode 100644', ...HEAD.slice(1)];
        expect(diffActions(sides('', 'a\n', created), PLAIN)).toBe('whole');
        expect(diffActions(sides('a\n', '', deleted), PLAIN)).toBe('whole');
    });

    it('offers nothing on a file with a carriage return on either side', () => {
        expect(diffActions(sides('a\r\n', 'b\n'), PLAIN)).toBe('none');
        expect(diffActions(sides('a\n', 'b\r\n'), PLAIN)).toBe('none');
    });

    it('offers nothing on a file git converts: a filter driver, or text written with CRLF', () => {
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, filter: 'lfs' })).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, text: 'set', eol: 'crlf' })).toBe(
            'none'
        );
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, eol: 'crlf' })).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, autocrlf: 'true' })).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, autocrlf: 'input' })).toBe('none');
    });

    it('offers nothing on a file whose text is not UTF-8 on either side', () => {
        expect(diffActions({ ...sides('a\n', 'b\n'), encoded: false }, PLAIN)).toBe('none');
    });

    it('offers nothing on a file with a working-tree-encoding or an ident attribute', () => {
        const encoding = { ...PLAIN, workingTreeEncoding: 'UTF-16' };
        expect(diffActions(sides('a\n', 'b\n'), encoding)).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, ident: 'set' })).toBe('none');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, ident: 'unset' })).toBe('lines');
    });

    it('keeps the actions where git converts nothing: -text, autocrlf false, eol lf', () => {
        const unset = { ...PLAIN, text: 'unset', eol: 'crlf', autocrlf: 'true' };
        expect(diffActions(sides('a\n', 'b\n'), unset)).toBe('lines');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, autocrlf: 'false' })).toBe('lines');
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, text: 'set', eol: 'lf' })).toBe(
            'lines'
        );
        expect(diffActions(sides('a\n', 'b\n'), { ...PLAIN, filter: 'unset' })).toBe('lines');
    });
});

describe('the patch a hunk or its rows are applied with', () => {
    const original = numbered(20);
    const modified = numbered(20, { 10: 'line ten' });

    it('stages a whole hunk as git writes it, three lines of context each side', () => {
        const changes = monacoLineChanges(original, modified);
        const [hunk] = hunksOf(changes);
        expect(patchOf(sides(original, modified), hunkRows(hunk), 'stage')).toBe(
            [
                ...HEAD,
                '@@ -7,7 +7,7 @@',
                ' line 7',
                ' line 8',
                ' line 9',
                '-line 10',
                '+line ten',
                ' line 11',
                ' line 12',
                ' line 13',
                ''
            ].join('\n')
        );
    });

    it('stages the added line alone, the removed line kept as context', () => {
        const patch = patchOf(sides(original, modified), { removed: [], added: [10] }, 'stage');
        expect(patch).toContain(['@@ -8,6 +8,7 @@', ' line 8'].join('\n'));
        expect(patch).toContain([' line 10', '+line ten', ' line 11'].join('\n'));
    });

    it('unstages the removed line alone in reverse, the added line kept as context', () => {
        const patch = patchOf(sides(original, modified), { removed: [10], added: [] }, 'unstage');
        expect(patch).toContain(['@@ -7,7 +7,6 @@', ' line 7'].join('\n'));
        expect(patch).toContain(['-line 10', ' line ten', ' line 11'].join('\n'));
    });

    it('answers the empty string for a choice that changes nothing', () => {
        expect(patchOf(sides(original, modified), { removed: [], added: [] }, 'revert')).toBe('');
    });

    it('cuts a hunk at the first line with the context the file has above it', () => {
        const top = numbered(8, { 1: 'first' });
        expect(patchOf(sides(numbered(8), top), { removed: [1], added: [1] }, 'stage')).toContain(
            ['@@ -1,4 +1,4 @@', '-line 1', '+first', ' line 2'].join('\n')
        );
    });

    it('marks a last line with no newline, on one side or both', () => {
        const both = patchOf(sides('a\nb\nc', 'a\nb\nC'), { removed: [3], added: [3] }, 'stage');
        expect(both).toContain(
            [
                '@@ -1,3 +1,3 @@',
                ' a',
                ' b',
                '-c',
                '\\ No newline at end of file',
                '+C',
                '\\ No newline at end of file',
                ''
            ].join('\n')
        );
        // The newline taken off the last line only: Monaco sees an empty last line removed.
        const changes = monacoLineChanges('a\nb\n', 'a\nb');
        const [hunk] = hunksOf(changes);
        expect(patchOf(sides('a\nb\n', 'a\nb'), hunkRows(hunk), 'stage')).toContain(
            ['@@ -1,2 +1,2 @@', ' a', '-b', '+b', '\\ No newline at end of file', ''].join('\n')
        );
    });

    it('writes a new file and a deleted file whole', () => {
        const created = [
            'diff --git a/a.txt b/a.txt',
            'new file mode 100644',
            '--- /dev/null',
            '+++ b/a.txt'
        ];
        const [made] = hunksOf(monacoLineChanges('', 'x\ny\n'));
        expect(patchOf(sides('', 'x\ny\n', created), hunkRows(made), 'stage')).toBe(
            [...created, '@@ -0,0 +1,2 @@', '+x', '+y', ''].join('\n')
        );
        const deleted = [
            'diff --git a/a.txt b/a.txt',
            'deleted file mode 100644',
            '--- a/a.txt',
            '+++ /dev/null'
        ];
        const [gone] = hunksOf(monacoLineChanges('x\ny\n', ''));
        expect(patchOf(sides('x\ny\n', '', deleted), hunkRows(gone), 'revert')).toBe(
            [...deleted, '@@ -1,2 +0,0 @@', '-x', '-y', ''].join('\n')
        );
    });

    it('joins two chosen changes four lines apart into one hunk of the patch', () => {
        const apart = numbered(20, { 5: 'five', 10: 'ten' });
        const patch = patchOf(
            sides(original, apart),
            { removed: [5, 10], added: [5, 10] },
            'stage'
        );
        expect(patch.match(/^@@ /gm)).toHaveLength(1);
        expect(patch).toContain('@@ -2,12 +2,12 @@');
    });

    it('keeps each line ending byte for byte', () => {
        const patch = patchOf(
            sides('a\r\nb\r\n', 'a\r\nB\r\n'),
            { removed: [2], added: [2] },
            'stage'
        );
        expect(patch).toContain(' a\r\n-b\r\n+B\r\n');
    });
});
