// Layer 1, data tests. The rules of a file operation both sides hold (data/file-ops.ts): which
// names are refused and which are made, and the name a copy takes. The server's cases over the same
// names are tests/server/files/ops.test.ts; this file holds the rule alone, so the page and the
// server cannot drift apart on what a name is.
//
// What this does NOT cover: the message the name input says under the field, which is
// tests/state/sources/explorer/names.test.ts, and the input drawn, which is seen at the look.

import { describe, expect, it } from 'vitest';
import { checkName, compareUrl, freeName, stemLength } from '../../src/lib/data/file-ops.ts';

/** The segments a name makes, or the reason it is refused. */
function verdict(name: string): string[] | string {
    const checked = checkName(name);
    return checked.ok ? checked.segments : checked.why;
}

describe('the names that are made', () => {
    it.each([
        ['folders between', 'x/y/z.md', ['x', 'y', 'z.md']],
        ['a backslash as a slash', 'x\\w.md', ['x', 'w.md']],
        ['an empty segment dropped', 'p//q.md', ['p', 'q.md']],
        ['a trailing slash', 'r/', ['r']],
        ['a trailing backslash', 'r\\', ['r']],
        ['255 characters', 'a'.repeat(255), ['a'.repeat(255)]],
        ['128 two-byte characters', '\u00e9'.repeat(128), ['\u00e9'.repeat(128)]],
        ['100 wide characters', '\u65e5'.repeat(100), ['\u65e5'.repeat(100)]],
        ['255 wide characters', '\u65e5'.repeat(255), ['\u65e5'.repeat(255)]],
        ['tabs trimmed at the ends', '\ta.md\t', ['a.md']]
    ])('makes %s as the segments it names', (_row, name, segments) => {
        expect(verdict(name)).toEqual(segments);
    });

    it('takes a leading or trailing space and a trailing dot, with a warning for the space', () => {
        expect(checkName(' a.md')).toEqual({ ok: true, segments: [' a.md'], whitespace: true });
        expect(checkName('a.')).toEqual({ ok: true, segments: ['a.'], whitespace: false });
        expect(checkName('plain.md')).toEqual({
            ok: true,
            segments: ['plain.md'],
            whitespace: false
        });
    });
});

describe('the names that are refused', () => {
    it.each([
        ['an empty name', '', 'empty'],
        ['whitespace', '  ', 'empty'],
        ['a name of tabs', '\t', 'empty'],
        ['a slash alone', '/', 'empty'],
        ['a leading slash', '/a', 'leading_slash'],
        ['a leading backslash', '\\a', 'leading_slash'],
        ['a dot', '.', 'invalid'],
        ['a double dot', '..', 'invalid'],
        ['a double dot first', '../x', 'invalid'],
        ['double dots between', 'a/../../b', 'invalid'],
        ['a dot between', 'a/./b', 'invalid'],
        ['a double dot between backslashes', 'a\\..\\b', 'invalid'],
        ['a NUL', 'a\0b', 'invalid'],
        ['a segment of only whitespace', 'a/ /b', 'invalid'],
        ['256 characters', 'a'.repeat(256), 'invalid'],
        ['256 two-byte characters', '\u00e9'.repeat(256), 'invalid'],
        ['256 wide characters', '\u65e5'.repeat(256), 'invalid']
    ])('refuses %s as %s', (_row, name, why) => {
        expect(verdict(name)).toBe(why);
    });
});

describe('the name a copy takes', () => {
    /** The names a folder already holds. */
    const holding =
        (...names: string[]) =>
        (name: string) =>
            names.includes(name);

    it.each([
        ['a free name kept', 'a.md', [], false, 'a.md'],
        ['copy', 'report.md', ['report.md'], false, 'report copy.md'],
        ['copy 2', 'report.md', ['report.md', 'report copy.md'], false, 'report copy 2.md'],
        [
            'the next free number',
            'report.md',
            ['report.md', 'report copy.md', 'report copy 2.md', 'report copy 3.md'],
            false,
            'report copy 4.md'
        ],
        ['a folder', 'notes', ['notes'], true, 'notes copy'],
        ['a file with no extension', 'notes', ['notes'], false, 'notes copy'],
        ['a dotfile', '.env', ['.env'], false, '.env copy'],
        ['a folder with a dot', 'v1.2', ['v1.2'], true, 'v1.2 copy'],
        ['a copy copied', 'report copy.md', ['report copy.md'], false, 'report copy 2.md'],
        [
            'a numbered copy copied',
            'report copy 7.md',
            ['report copy 7.md'],
            false,
            'report copy 8.md'
        ]
    ])('takes %s as %s', (_row, name, held, folder, expected) => {
        expect(freeName(name, holding(...held), folder)).toBe(expected);
    });
});

describe('the part of a name a rename selects', () => {
    it.each([
        ['stops before the extension', 'report.md', 'report'],
        ['stops before the last extension', 'a.tar.gz', 'a.tar'],
        ['takes the whole of a dotfile', '.env', '.env'],
        ['takes the whole of a name without an extension', 'notes', 'notes']
    ])('%s of %s', (_row, name, selected) => {
        expect(stemLength(name)).toBe(selected.length);
    });
});

describe('what both sides hold', () => {
    it('addresses a comparison with the file first and the file selected for compare second', () => {
        const url = compareUrl({ root: 'r', path: 'a.md' }, { root: 's', path: 'dir/b.md' });
        expect(url).toBe('/api/ops?root=r&path=a.md&withRoot=s&withPath=dir%2Fb.md');
    });
});
