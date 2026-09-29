// The rules the status bar's source items read a file's text by: the indentation a file's own
// lines give, its line ending, how many lines it holds, and the language the editor opens it under,
// over hand-written texts.
//
// What this does NOT cover: the editor moving the caret and rewriting the indentation and the line
// endings on its model, which the look does, and the bar drawing them.

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_INDENT,
    detectIndent,
    lineCount,
    lineEnding,
    shownLanguage
} from '../../../../src/lib/state/workbench/navigation/editor-text.ts';

describe('the indentation a file gives', () => {
    it('reads a file indented by tabs as tabs', () => {
        expect(detectIndent('a:\n\tb\n\t\tc\n\td\n')).toEqual({ tabs: true, size: 4 });
    });

    it('reads the step of a file indented by spaces from how its lines step in', () => {
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
        expect(detectIndent('one\ntwo\n')).toEqual(DEFAULT_INDENT);
        expect(detectIndent('')).toEqual(DEFAULT_INDENT);
    });
});

describe('the line ending a file gives', () => {
    it('is CRLF when a line ends so, and LF otherwise', () => {
        expect(lineEnding('a\r\nb\r\n')).toBe('CRLF');
        expect(lineEnding('a\nb\n')).toBe('LF');
        expect(lineEnding('')).toBe('LF');
    });
});

describe('the language the editor opens a text under', () => {
    // Red when a text past the paint limit is opened in its language, or the limit is not read.
    it('is the one asked for under the limit, and plaintext past it or with no limit yet', () => {
        expect(shownLanguage('python', 'import os\n', 100)).toBe('python');
        expect(shownLanguage('python', 'x'.repeat(100), 100)).toBe('python');
        expect(shownLanguage('python', 'x'.repeat(101), 100)).toBe('plaintext');
        expect(shownLanguage('python', 'import os\n', null)).toBe('plaintext');
    });
});

describe('the lines', () => {
    it('counts the lines of a text, one for an empty one', () => {
        expect(lineCount('')).toBe(1);
        expect(lineCount('a\nb\n')).toBe(3);
    });
});
