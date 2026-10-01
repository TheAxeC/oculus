// Layer 1, data test. The rules of a file operation both sides hold (data/file-ops.ts): which names
// are refused and which are made, and the name a copy takes. The server's cases over the same
// names are tests/server/files/ops.test.ts; this file holds the rule alone, so the page and the
// server cannot drift apart on what a name is.
//
// What this does NOT cover: the message the name input says under the field, which is
// tests/state/sources/explorer/names.test.ts, and the input drawn, which is seen at the look.

import { describe, expect, it } from 'vitest';
import {
    MAX_UPLOAD_BYTES,
    TEXT_LIMIT,
    checkName,
    compareUrl,
    freeName,
    stemLength
} from '../../src/lib/data/file-ops.ts';

/** The segments a name makes, or the reason it is refused. */
function verdict(name: string): string[] | string {
    const checked = checkName(name);
    return checked.ok ? checked.segments : checked.why;
}

describe('the names that are made', () => {
    it('makes the folders between and drops an empty segment, as case 2 creates them', () => {
        expect(verdict('x/y/z.md')).toEqual(['x', 'y', 'z.md']);
        expect(verdict('x\\w.md')).toEqual(['x', 'w.md']);
        expect(verdict('p//q.md')).toEqual(['p', 'q.md']);
        expect(verdict('r/')).toEqual(['r']);
        expect(verdict('r\\')).toEqual(['r']);
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

    it('takes a segment of 255 characters of any width and trims the tabs at the ends of the name', () => {
        expect(verdict('a'.repeat(255))).toEqual(['a'.repeat(255)]);
        expect(verdict('\u00e9'.repeat(128))).toEqual(['\u00e9'.repeat(128)]);
        expect(verdict('\u65e5'.repeat(100))).toEqual(['\u65e5'.repeat(100)]);
        expect(verdict('\u65e5'.repeat(255))).toEqual(['\u65e5'.repeat(255)]);
        expect(verdict('\ta.md\t')).toEqual(['a.md']);
    });
});

describe('the names that are refused', () => {
    it('refuses an empty name, whitespace and a name of tabs', () => {
        expect(verdict('')).toBe('empty');
        expect(verdict('  ')).toBe('empty');
        expect(verdict('\t')).toBe('empty');
        expect(verdict('/')).toBe('empty');
    });

    it('refuses a leading slash of either kind', () => {
        expect(verdict('/a')).toBe('leading_slash');
        expect(verdict('\\a')).toBe('leading_slash');
    });

    it('refuses a `.` or `..` segment wherever it sits, so no segment walks out', () => {
        for (const name of ['.', '..', '../x', 'a/../../b', 'a/./b', 'a\\..\\b']) {
            expect(verdict(name)).toBe('invalid');
        }
    });

    it('refuses a NUL, a segment of only whitespace and a segment of 256 characters', () => {
        expect(verdict('a\0b')).toBe('invalid');
        expect(verdict('a/ /b')).toBe('invalid');
        expect(verdict('a'.repeat(256))).toBe('invalid');
        expect(verdict('\u00e9'.repeat(256))).toBe('invalid');
        expect(verdict('\u65e5'.repeat(256))).toBe('invalid');
    });
});

describe('the name a copy takes', () => {
    /** The names a folder already holds. */
    const holding =
        (...names: string[]) =>
        (name: string) =>
            names.includes(name);

    it('adds `copy`, then `copy 2`, then `copy 3`, keeping the extension', () => {
        expect(freeName('report.md', holding('report.md'))).toBe('report copy.md');
        expect(freeName('report.md', holding('report.md', 'report copy.md'))).toBe(
            'report copy 2.md'
        );
        expect(
            freeName(
                'report.md',
                holding('report.md', 'report copy.md', 'report copy 2.md', 'report copy 3.md')
            )
        ).toBe('report copy 4.md');
    });

    it('names a folder, a file with no extension and a dotfile', () => {
        expect(freeName('notes', holding('notes'), true)).toBe('notes copy');
        expect(freeName('notes', holding('notes'))).toBe('notes copy');
        expect(freeName('.env', holding('.env'))).toBe('.env copy');
        expect(freeName('v1.2', holding('v1.2'), true)).toBe('v1.2 copy');
    });

    it('keeps a name that is free', () => {
        expect(freeName('a.md', holding())).toBe('a.md');
    });

    it('counts on from a copy that is copied', () => {
        expect(freeName('report copy.md', holding('report copy.md'))).toBe('report copy 2.md');
        expect(freeName('report copy 7.md', holding('report copy 7.md'))).toBe('report copy 8.md');
    });
});

describe('the part of a name a rename selects', () => {
    it('stops before the extension, and takes the whole of a dotfile and of a name without one', () => {
        expect(stemLength('report.md')).toBe('report'.length);
        expect(stemLength('a.tar.gz')).toBe('a.tar'.length);
        expect(stemLength('.env')).toBe('.env'.length);
        expect(stemLength('notes')).toBe('notes'.length);
    });
});

describe('what both sides hold', () => {
    it('holds the sizes the page and the server check against', () => {
        expect(TEXT_LIMIT).toBe(2 * 1024 * 1024);
        expect(MAX_UPLOAD_BYTES).toBe(32 * 1024 * 1024);
    });

    it('addresses a comparison with the file first and the file selected for compare second', () => {
        const url = compareUrl({ root: 'r', path: 'a.md' }, { root: 's', path: 'dir/b.md' });
        expect(url).toBe('/api/ops?root=r&path=a.md&withRoot=s&withPath=dir%2Fb.md');
    });
});
