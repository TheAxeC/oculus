// Layer 1, data tests. What a save does to the text before it is sent (data/helpers/files/
// save-text.ts): `trimText` takes only spaces and tabs at the end of a line and never a line
// ending, and `endText` adds or takes only line endings at the end of the text, in the text's own
// form. A place handed in as kept is where an automatic save leaves the caret's line alone.

import { describe, expect, it } from 'vitest';
import { endText, trimText } from '../../../../src/lib/data/helpers/files/save-text.ts';

describe('trimText', () => {
    it.each([
        ['spaces and a tab at the end of lines', 'a  \nb\t\n', 'a\nb\n'],
        ['the end of a CRLF line, keeping every carriage return', 'a  \r\nb \r\n', 'a\r\nb\r\n'],
        ['a line of only whitespace', 'a\n \t \nb', 'a\n\nb'],
        ['the end of the last line, which has no line ending', 'a\nb  ', 'a\nb'],
        ['nothing from whitespace inside a line', 'a  b\n\tc\n', 'a  b\n\tc\n'],
        ['nothing from an empty text', '', ''],
        ['nothing from a text that is clean', 'a\nb\n', 'a\nb\n']
    ])('takes %s', (_title, text, expected) => {
        expect(trimText(text)).toBe(expected);
    });

    it('keeps the whitespace before a kept place on its line and trims every other line', () => {
        expect(trimText('x   ', [{ line: 1, column: 5 }])).toBe('x   ');
        expect(trimText('x   ', [{ line: 1, column: 3 }])).toBe('x ');
        expect(trimText('x   \ny   ', [{ line: 2, column: 4 }])).toBe('x\ny  ');
        expect(trimText('x   \r\ny   \r\n', [{ line: 1, column: 4 }])).toBe('x  \r\ny\r\n');
    });

    it('takes the whitespace at the end of the line when the kept place is before it', () => {
        expect(trimText('x   ', [{ line: 1, column: 1 }])).toBe('x');
    });
});

describe('endText', () => {
    it.each([
        ['adds one line ending to a last line that holds a character', 'abc', 'abc\n'],
        ['adds the text own CRLF where the text has CRLF elsewhere', 'a\r\nabc', 'a\r\nabc\r\n'],
        ['leaves one line ending alone', 'abc\n', 'abc\n'],
        ['takes the empty lines after the last line that holds a character', 'abc\n\n\n', 'abc\n'],
        ['takes the empty CRLF lines after the last line', 'abc\r\n\r\n\r\n', 'abc\r\n'],
        ['leaves an empty text empty', '', ''],
        ['makes a text of line endings only empty', '\n\n', ''],
        ['keeps a last line that holds only whitespace as it is', 'abc\n  ', 'abc\n  '],
        ['adds a line ending after a last line that ends in a space', 'abc ', 'abc \n']
    ])('%s', (_title, text, expected) => {
        expect(endText(text)).toBe(expected);
    });

    it('keeps the line a kept place is on, and the lines before it', () => {
        expect(endText('abc\n\n\n', [{ line: 3, column: 1 }])).toBe('abc\n\n');
        expect(endText('abc\n\n\n', [{ line: 1, column: 4 }])).toBe('abc\n');
        expect(endText('abc\r\n\r\n\r\n', [{ line: 3, column: 1 }])).toBe('abc\r\n\r\n');
    });

    it('never changes a line ending that is there', () => {
        const text = 'a\r\nb\nc\r\n';
        expect(endText(text)).toBe(text);
        expect(trimText(text)).toBe(text);
    });
});
