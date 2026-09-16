// The one rule both layers tell a text file by: no NUL byte in the window, and the window decodes
// as UTF-8. The browser runs it over the head of a file it fetched, the source route over the file
// on disk, so the two never disagree about what may be opened for editing.

import { describe, expect, it } from 'vitest';
import { TEXT_SNIFF, TEXT_SNIFF_READ, isTextBytes } from '../../src/lib/data/text-kind.ts';

/** The bytes of one string, which is what a text file holds. */
function bytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

describe('whether bytes are text', () => {
    it('reads plain text, an empty file and accented letters as text', () => {
        expect(isTextBytes(new Uint8Array(0))).toBe(true);
        expect(isTextBytes(bytes('import sys\n\n\ndef main():\n    return "one"\n'))).toBe(true);
        expect(isTextBytes(bytes('Link\u00f6ping, M\u00fcnchen, Besan\u00e7on\n'))).toBe(true);
        expect(isTextBytes(bytes('a tab\tand a return\r\n'))).toBe(true);
    });

    it('reads a file opening with a byte order mark as text', () => {
        const held = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('title: one\n')]);
        expect(isTextBytes(held)).toBe(true);
    });

    it('reads a file with a zero byte anywhere in the window as not text', () => {
        const held = bytes('a'.repeat(100) + '\u0000' + 'b'.repeat(100));
        expect(held[100]).toBe(0);
        expect(isTextBytes(held)).toBe(false);
        expect(isTextBytes(new Uint8Array([0]))).toBe(false);
    });

    it('reads the heads of the archives a research tree holds as not text', () => {
        // PNG, ZIP (a .npz is one), and gzip.
        expect(isTextBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
            false
        );
        expect(isTextBytes(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]))).toBe(
            false
        );
        expect(isTextBytes(new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff, 0xfe, 0xfd, 0xfc]))).toBe(
            false
        );
    });

    it('refuses bytes that are not UTF-8, however few of them there are', () => {
        // A lone continuation byte, a lead byte with nothing after it, an overlong encoding of a
        // character that has a shorter form, a surrogate half, and a value past the last code point.
        expect(isTextBytes(new Uint8Array([0x80]))).toBe(false);
        expect(isTextBytes(new Uint8Array([0xc3]))).toBe(false);
        expect(isTextBytes(new Uint8Array([0xc0, 0xaf]))).toBe(false);
        expect(isTextBytes(new Uint8Array([0xe0, 0x80, 0xaf]))).toBe(false);
        expect(isTextBytes(new Uint8Array([0xed, 0xa0, 0x80]))).toBe(false);
        expect(isTextBytes(new Uint8Array([0xf5, 0x80, 0x80, 0x80]))).toBe(false);
    });

    it('reads the window and the one byte after it a caller hands over', () => {
        // What a caller reads is TEXT_SNIFF_READ, the window and one byte: the extra byte is what
        // says the file goes on, so a character lying across the window's end is the window's doing.
        expect(TEXT_SNIFF_READ).toBe(TEXT_SNIFF + 1);
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
