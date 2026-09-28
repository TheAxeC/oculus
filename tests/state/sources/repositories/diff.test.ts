// The diff pane's model: a unified diff read into rows, the hunks and folds cut from them, the
// side-by-side pairing, the words a changed line marks, and the patch a hunk or a line is staged,
// unstaged or reverted with. The rules are pure, so each is checked on a diff written out here;
// what git does with the patch is tests/server/git/git-ops.test.ts.

import { describe, expect, it } from 'vitest';
import {
    foldsOf,
    hunkAt,
    hunkNear,
    hunksOf,
    parseDiff,
    partnersOf,
    piecesOf,
    sideRows,
    stepChange,
    type DiffLine
} from '../../../../src/lib/state/sources/repositories/diff-rows.ts';
import { chosenIn, hunkPatch } from '../../../../src/lib/state/sources/repositories/diff-patch.ts';
import {
    common,
    pairedWords,
    wordDiff,
    wordsOf
} from '../../../../src/lib/state/sources/repositories/diff-words.ts';

const HEAD = [
    'diff --git a/a.txt b/a.txt',
    'index 1111111..2222222 100644',
    '--- a/a.txt',
    '+++ b/a.txt'
];

/** A file of twenty numbered lines with line 10 changed, read with the whole file as context. */
function twenty(): string {
    const body: string[] = [];
    for (let n = 1; n <= 20; n += 1) {
        if (n === 10) body.push('-line 10', '+line ten');
        else body.push(` line ${n}`);
    }
    return [...HEAD, '@@ -1,20 +1,20 @@', ...body, ''].join('\n');
}

/** Rows of one kind each, for the rules that read only the kinds. */
function kinds(spec: string): DiffLine[] {
    return spec.split('').map((mark, at) => ({
        kind: mark === '-' ? 'removed' : mark === '+' ? 'added' : 'context',
        old: mark === '+' ? null : at + 1,
        new: mark === '-' ? null : at + 1,
        text: `row ${at}`,
        eof: false
    }));
}

describe('a unified diff read into rows', () => {
    it('numbers each row on both sides, and leaves the side that does not hold it empty', () => {
        const [file] = parseDiff(twenty());
        expect(file.oldPath).toBe('a.txt');
        expect(file.newPath).toBe('a.txt');
        expect(file.head).toEqual(HEAD);
        expect(file.lines).toHaveLength(21);
        expect(file.lines[9]).toEqual({
            kind: 'removed',
            old: 10,
            new: null,
            text: 'line 10',
            eof: false
        });
        expect(file.lines[10]).toEqual({
            kind: 'added',
            old: null,
            new: 10,
            text: 'line ten',
            eof: false
        });
        expect(file.lines[20]).toEqual({
            kind: 'context',
            old: 20,
            new: 20,
            text: 'line 20',
            eof: false
        });
    });

    it('marks a line with no newline at its end, a new file, and a binary file', () => {
        const created = [
            'diff --git a/n.txt b/n.txt',
            'new file mode 100644',
            '--- /dev/null',
            '+++ b/n.txt',
            '@@ -0,0 +1 @@',
            '+only',
            '\\ No newline at end of file',
            'diff --git a/p.png b/p.png',
            'Binary files a/p.png and b/p.png differ',
            ''
        ].join('\n');
        const [text, image] = parseDiff(created);
        expect(text.oldPath).toBe('');
        expect(text.lines).toEqual([{ kind: 'added', old: null, new: 1, text: 'only', eof: true }]);
        expect(image.binary).toBe(true);
        expect(image.newPath).toBe('p.png');
    });
});

describe('the hunks and folds of a file', () => {
    it('joins changes closer than twice the context into one hunk, three rows of context each side', () => {
        expect(hunksOf(kinds('          -+          '))).toEqual([
            { start: 7, end: 15, first: 10, last: 11 }
        ]);
        // Six unchanged rows between two changes are one hunk, seven are two.
        expect(hunksOf(kinds('   -      +   '))).toHaveLength(1);
        expect(hunksOf(kinds('   -       +   '))).toHaveLength(2);
    });

    it('folds an unchanged run over six rows, keeping three rows beside each change', () => {
        const [file] = parseDiff(twenty());
        // Rows 0-8 lead to the change at 9, rows 11-20 follow it.
        expect(foldsOf(file.lines)).toEqual([
            { from: 0, to: 6 },
            { from: 14, to: 21 }
        ]);
        // A run of six is shown whole.
        expect(foldsOf(kinds('-      +'))).toEqual([]);
        expect(foldsOf(kinds('-       +'))).toEqual([{ from: 4, to: 5 }]);
        // At the file's top and end only the side beside the change keeps three rows, and a run of
        // six or fewer is still shown whole.
        expect(foldsOf(kinds('     -'))).toEqual([]);
        expect(foldsOf(kinds('       -'))).toEqual([{ from: 0, to: 4 }]);
    });

    it('draws the rows between folds, and a fold the reader opened as rows', () => {
        const folds = [
            { from: 0, to: 6 },
            { from: 14, to: 21 }
        ];
        expect(piecesOf(21, folds, [])).toEqual([
            { kind: 'fold', from: 0, to: 6 },
            { kind: 'rows', from: 6, to: 14 },
            { kind: 'fold', from: 14, to: 21 }
        ]);
        expect(piecesOf(21, folds, [14])).toEqual([
            { kind: 'fold', from: 0, to: 6 },
            { kind: 'rows', from: 6, to: 21 }
        ]);
    });

    it('pairs a removed row with the added row that replaced it, side by side', () => {
        const lines = kinds(' --+ ');
        expect(sideRows(lines, 0, lines.length)).toEqual([
            { left: 0, right: 0 },
            { left: 1, right: 3 },
            { left: 2, right: null },
            { left: 4, right: 4 }
        ]);
        expect([...partnersOf(lines)]).toEqual([
            [1, 3],
            [3, 1]
        ]);
    });

    it('finds the hunk a row is in, and the hunk nearest a line the gutter opened', () => {
        const lines = kinds('   -          +   ');
        const hunks = hunksOf(lines);
        expect(hunks).toHaveLength(2);
        expect(hunkAt(hunks, 3)).toBe(0);
        expect(hunkAt(hunks, 9)).toBe(-1);
        expect(hunkNear(lines, hunks, 2)).toBe(0);
        expect(hunkNear(lines, hunks, 12)).toBe(1);
        expect(hunkNear(lines, hunks, 99)).toBe(1);
        expect(hunkNear(lines, [], 1)).toBe(-1);
    });
});

describe('the patch a hunk or a line is applied with', () => {
    it('stages a whole hunk as git would, and one line of it with the rest kept as it was', () => {
        const [file] = parseDiff(twenty());
        const [hunk] = hunksOf(file.lines);
        expect(hunkPatch(file, hunk, 'stage')).toBe(
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
        // Only the removed line chosen: forwards, the added line is left out.
        expect(hunkPatch(file, hunk, 'stage', new Set([9]))).toBe(
            [
                ...HEAD,
                '@@ -7,7 +7,6 @@',
                ' line 7',
                ' line 8',
                ' line 9',
                '-line 10',
                ' line 11',
                ' line 12',
                ' line 13',
                ''
            ].join('\n')
        );
        // Only the added line chosen: forwards, the removed line stays as context.
        expect(hunkPatch(file, hunk, 'stage', new Set([10]))).toBe(
            [
                ...HEAD,
                '@@ -7,7 +7,8 @@',
                ' line 7',
                ' line 8',
                ' line 9',
                ' line 10',
                '+line ten',
                ' line 11',
                ' line 12',
                ' line 13',
                ''
            ].join('\n')
        );
    });

    it('unstages one line in reverse, an added line not chosen kept as context', () => {
        const [file] = parseDiff(twenty());
        const [hunk] = hunksOf(file.lines);
        expect(hunkPatch(file, hunk, 'unstage', new Set([9]))).toBe(
            [
                ...HEAD,
                '@@ -7,8 +7,7 @@',
                ' line 7',
                ' line 8',
                ' line 9',
                '-line 10',
                ' line ten',
                ' line 11',
                ' line 12',
                ' line 13',
                ''
            ].join('\n')
        );
        expect(hunkPatch(file, hunk, 'revert', new Set())).toBe('');
        expect(chosenIn(hunk, new Set([10, 2, 9]))).toEqual([9, 10]);
    });

    it('carries the missing newline mark of a last line into the patch', () => {
        const [file] = parseDiff(
            [
                ...HEAD,
                '@@ -1 +1 @@',
                '-old',
                '\\ No newline at end of file',
                '+new',
                '\\ No newline at end of file',
                ''
            ].join('\n')
        );
        const [hunk] = hunksOf(file.lines);
        expect(hunkPatch(file, hunk, 'stage')).toBe(
            [
                ...HEAD,
                '@@ -1,1 +1,1 @@',
                '-old',
                '\\ No newline at end of file',
                '+new',
                '\\ No newline at end of file',
                ''
            ].join('\n')
        );
    });
});

describe('the words a changed line marks', () => {
    it('marks only the words that changed, on each side', () => {
        expect(wordsOf('a  b.c')).toEqual(['a', '  ', 'b', '.', 'c']);
        expect(wordDiff('let total = 1;', 'let count = 1;')).toEqual([
            [
                { text: 'let ', changed: false },
                { text: 'total', changed: true },
                { text: ' = 1;', changed: false }
            ],
            [
                { text: 'let ', changed: false },
                { text: 'count', changed: true },
                { text: ' = 1;', changed: false }
            ]
        ]);
    });

    it('finds the shared items of two lists in order, and gives up past the edit limit', () => {
        expect(common(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'd', 'e'])).toEqual([
            [0, 0],
            [2, 2],
            [3, 3]
        ]);
        expect(common([], ['a'])).toEqual([]);
        const many = Array.from({ length: 1500 }, (_, at) => `a${at}`);
        const other = Array.from({ length: 1500 }, (_, at) => `b${at}`);
        expect(common(many, other)).toBeNull();
    });

    it('gives each row of a replaced pair its own side of the word marks', () => {
        const [file] = parseDiff(twenty());
        const words = pairedWords(file.lines, partnersOf(file.lines));
        expect([...words.keys()]).toEqual([9, 10]);
        expect(words.get(9)).toEqual([
            { text: 'line ', changed: false },
            { text: '10', changed: true }
        ]);
        expect(words.get(10)).toEqual([
            { text: 'line ', changed: false },
            { text: 'ten', changed: true }
        ]);
    });
});

describe('Previous Change and Next Change', () => {
    it('goes to the first change by Next and the last by Previous while no change is current', () => {
        expect(stepChange(-1, 3, 1)).toBe(0);
        expect(stepChange(-1, 3, -1)).toBe(2);
        expect(stepChange(-1, 1, -1)).toBe(0);
    });

    it('moves one change either way, round from the last to the first and back', () => {
        expect(stepChange(0, 3, 1)).toBe(1);
        expect(stepChange(2, 3, 1)).toBe(0);
        expect(stepChange(0, 3, -1)).toBe(2);
        expect(stepChange(1, 3, -1)).toBe(0);
    });

    it('goes nowhere in a diff with no change', () => {
        expect(stepChange(-1, 0, 1)).toBe(-1);
        expect(stepChange(-1, 0, -1)).toBe(-1);
    });
});
