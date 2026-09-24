// The rules the status bar's source items read a file's text by and rewrite it with: the caret's
// line and column, the indentation a file's own lines give, its line ending, and the two
// conversions, over hand-written texts.
//
// What this does NOT cover: the source tab applying them to its draft and the bar drawing them,
// which tests/browser/status/source-items.spec.ts presses in Chrome.

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_INDENT,
    caretOf,
    convertIndent,
    detectIndent,
    indentUnit,
    lineCount,
    lineEnding,
    withEnding
} from '../../../../src/lib/state/workbench/navigation/editor-text.ts';

describe('the indentation a file gives', () => {
    it('reads a file indented by tabs as tabs', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:54 => if (tabbed > spaced + 99) return { tabs: true, size: DEFAULT_INDENT.size };
        expect(detectIndent('a:\n\tb\n\t\tc\n\td\n')).toEqual({ tabs: true, size: 4 });
    });

    it('reads the step of a file indented by spaces from how its lines step in', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:50 => const step = spaces;
        expect(detectIndent('a:\n  b:\n    c\n  d\n')).toEqual({ tabs: false, size: 2 });
        expect(detectIndent('def f():\n    if x:\n        y\n    z\n')).toEqual({
            tabs: false,
            size: 4
        });
        expect(detectIndent('x\n        deep\n')).toEqual({ tabs: false, size: 8 });
        // Four columns a step, however deep the lines already are.
        expect(detectIndent('a\n    b\n        c\n            d\n        e\n')).toEqual({
            tabs: false,
            size: 4
        });
    });

    it('reads a file that never indents, and an empty one, as the default', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:55 => let size = 2;
        expect(detectIndent('one\ntwo\n')).toEqual(DEFAULT_INDENT);
        expect(detectIndent('')).toEqual(DEFAULT_INDENT);
    });
});

describe('the line ending a file gives', () => {
    it('is CRLF when a line ends so, and LF otherwise', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:68 => return 'LF';
        expect(lineEnding('a\r\nb\r\n')).toBe('CRLF');
        expect(lineEnding('a\nb\n')).toBe('LF');
        expect(lineEnding('')).toBe('LF');
    });

    it('rewrites every line ending to the one asked for, and back', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:74 => return ending === 'LF' ? lf : lf;
        expect(withEnding('a\r\nb\nc', 'LF')).toBe('a\nb\nc');
        expect(withEnding('a\nb\r\nc\n', 'CRLF')).toBe('a\r\nb\r\nc\r\n');
        expect(withEnding(withEnding('a\nb\n', 'CRLF'), 'LF')).toBe('a\nb\n');
    });
});

describe('the conversions of the indentation', () => {
    it('turns leading tabs into the step of spaces and leaves the rest of the line alone', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:92 => if (!tabs) return lead;
        expect(convertIndent('a\n\tb\t c\n\t\td\n', false, 4)).toBe('a\n    b\t c\n        d\n');
        expect(convertIndent('\tx\n', false, 2)).toBe('  x\n');
    });

    it('turns leading spaces into tabs, keeping a part step as spaces after them', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:93 => return lead;
        expect(convertIndent('a\n    b\n      c\n', true, 4)).toBe('a\n\tb\n\t  c\n');
        expect(convertIndent('  \tx\n', true, 4)).toBe('\tx\n');
    });

    it('inserts a tab for a tab file and its width of spaces for a space file', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:79 => return ' '.repeat(indent.size);
        expect(indentUnit({ tabs: true, size: 4 })).toBe('\t');
        expect(indentUnit({ tabs: false, size: 2 })).toBe('  ');
    });
});

describe('the caret', () => {
    it('counts the line and the column of its active end from one, and the selection', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:102 => const at = Math.max(0, Math.min(end, value.length));
        const text = 'one\ntwo\nthree';
        expect(caretOf(text, 0, 0, false)).toEqual({ line: 1, column: 1, selected: 0 });
        expect(caretOf(text, 5, 5, false)).toEqual({ line: 2, column: 2, selected: 0 });
        expect(caretOf(text, 2, 9, false)).toEqual({ line: 3, column: 2, selected: 7 });
        expect(caretOf(text, 2, 9, true)).toEqual({ line: 1, column: 3, selected: 7 });
        expect(caretOf(text, 99, 99, false)).toEqual({ line: 3, column: 6, selected: 0 });
    });

    it('counts the lines of a text, one for an empty one', () => {
        // revert: src/lib/state/workbench/navigation/editor-text.ts:111 => return text.split('\n').length - 1;
        expect(lineCount('')).toBe(1);
        expect(lineCount('a\nb\n')).toBe(3);
    });
});
