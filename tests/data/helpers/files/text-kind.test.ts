// Layer 1, data tests. The one rule both layers tell a text file by: no NUL byte in the window, and
// the window decodes as UTF-8. The browser runs it over the head of a file it fetched, the source
// route over the file on disk, so the two never disagree about what may be opened for editing.

import { describe, expect, it } from 'vitest';
import {
    TEXT_SNIFF,
    TEXT_SNIFF_READ,
    isTextBytes
} from '../../../../src/lib/data/helpers/files/text-kind.ts';

/** The bytes of one string, which is what a text file holds. */
function bytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

describe('whether bytes are text', () => {
    it.each([
        ['an empty file', new Uint8Array(0)],
        ['plain text', bytes('import sys\n\n\ndef main():\n    return "one"\n')],
        ['accented letters', bytes('Link\u00f6ping, M\u00fcnchen, Besan\u00e7on\n')],
        ['a tab and a return', bytes('a tab\tand a return\r\n')],
        [
            'a file opening with a byte order mark',
            new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('title: one\n')])
        ]
    ])('reads %s as text', (_row, held) => {
        expect(isTextBytes(held)).toBe(true);
    });

    it.each([
        [
            'a zero byte in the middle of the window',
            bytes('a'.repeat(100) + '\u0000' + 'b'.repeat(100))
        ],
        ['a single zero byte', new Uint8Array([0])],
        ['the head of a PNG', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
        [
            'the head of a ZIP, which a .npz is',
            new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])
        ],
        [
            'the head of a gzip file',
            new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff, 0xfe, 0xfd, 0xfc])
        ],
        ['a lone continuation byte', new Uint8Array([0x80])],
        ['a lead byte with nothing after it', new Uint8Array([0xc3])],
        ['an overlong encoding of a character with a shorter form', new Uint8Array([0xc0, 0xaf])],
        ['an overlong three-byte encoding', new Uint8Array([0xe0, 0x80, 0xaf])],
        ['a surrogate half', new Uint8Array([0xed, 0xa0, 0x80])],
        ['a value past the last code point', new Uint8Array([0xf5, 0x80, 0x80, 0x80])],
        ['a byte no UTF-8 holds', new Uint8Array([0xff])]
    ])('reads %s as not text', (_row, held) => {
        expect(isTextBytes(held)).toBe(false);
    });

    it('reads the window and the one byte after it a caller hands over', () => {
        // What a caller reads is TEXT_SNIFF_READ, the window and one byte: the extra byte is what
        // says the file goes on, so a character lying across the window's end is the window's
        // doing.
        const straddling = bytes('a'.repeat(TEXT_SNIFF - 1) + '\u00e9' + 'more');
        expect(isTextBytes(straddling.subarray(0, TEXT_SNIFF_READ))).toBe(true);
        // The window alone, which is what a caller reading TEXT_SNIFF bytes would hand over, ends
        // on half a character and cannot tell that from a file that ends there.
        expect(isTextBytes(straddling.subarray(0, TEXT_SNIFF))).toBe(false);
    });

    it('reads a sequence the window cut in half as text and one the file cut as not', () => {
        // One byte and then four-byte characters: the window's last byte falls inside one of them,
        // which is the window's doing and not the file's, so the file is still text.
        const long = bytes('a' + '\u{1f600}'.repeat(2200));
        expect(long.length).toBeGreaterThan(TEXT_SNIFF);
        expect(long[TEXT_SNIFF - 1]).toBeGreaterThan(0x7f);
        expect(long[TEXT_SNIFF]).toBeGreaterThan(0x7f);
        expect(isTextBytes(long)).toBe(true);
        // The same half sequence at the end of the file itself is a file that is not UTF-8.
        const cut = bytes('one\u{1f600}').subarray(0, 5);
        expect(isTextBytes(cut)).toBe(false);
    });

    it('reads only the window, so a zero byte after it says nothing', () => {
        const held = new Uint8Array(TEXT_SNIFF + 10);
        held.fill(0x61);
        held[TEXT_SNIFF + 4] = 0;
        expect(isTextBytes(held)).toBe(true);
    });
});
