// Layer 1, data. Whether a file is text, told from its bytes rather than from its name.
//
// Two rules over one definition of text, both imported by the two layers. The head rule
// (`isTextBytes`) runs over the first bytes of a file and decides which tab a file opens in: the
// page runs it over the head it fetched (state/sources/explorer/file-type.ts), and the server runs
// it over the head of a file it reads without a tab (`isBinaryFile` in
// server/files/source/source.ts, for Replace, the file compare and the language server library).
// The whole-file rule (`isWholeText`) runs over every byte of a file: the page runs it over a file
// it read whole to decide whether the tab may edit it, and the server runs it over the bytes it
// read before it replaces a file (server/files/source/source.ts, server/files/fs/lsp-edit.ts), so a
// save never replaces bytes an editor could not have read. A list of extensions would have to agree
// with itself in several places and would be wrong about a name nobody put on it.
//
// Text is: no NUL byte, and the bytes decode as UTF-8 by the platform's own decoder. For the head
// rule the bytes are the window, and a multi-byte sequence the window cut in half is the window's
// doing, so it is accepted when there are more bytes after it and refused when the file itself ends
// there. That is what TEXT_SNIFF_READ is for: a caller hands over one byte more than the window, so
// the rule can tell a file that goes on from one that ends on half a character, and a file whose
// accented letter happens to straddle byte 8192 is text. For the whole-file rule a leading
// UTF-8 byte order mark is not part of the text, and nothing is cut: every byte after it decodes.

/** How many bytes from the head of a file the head rule reads. */
export const TEXT_SNIFF = 8192;

/**
 * How many bytes a caller reads for it: the window and one byte more, which is what says whether
 * the window cut the file or the file ended inside it.
 */
export const TEXT_SNIFF_READ = TEXT_SNIFF + 1;

/**
 * Whether these bytes are the head of a text file. An empty file is text: there is nothing in it
 * that is not. A caller that read TEXT_SNIFF_READ bytes and got them all is handing over a file
 * that goes on past the window, which is what makes a sequence cut at its end the window's doing:
 * the decoder is told the stream goes on, so it holds a sequence cut at the end rather than
 * refusing it, and still refuses one whose bytes so far are already wrong.
 */
export function isTextBytes(bytes: Uint8Array): boolean {
    const window = bytes.subarray(0, TEXT_SNIFF);
    const cut = bytes.length > window.length;
    if (window.includes(0)) return false;
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(window, { stream: cut });
        return true;
    } catch {
        return false;
    }
}

/** The three bytes of the UTF-8 byte order mark. */
export const BOM_BYTES: readonly number[] = [0xef, 0xbb, 0xbf];

/** Whether the bytes start with the UTF-8 byte order mark. */
export function startsWithBom(bytes: Uint8Array): boolean {
    return BOM_BYTES.every((byte, at) => bytes[at] === byte);
}

/**
 * Whether these bytes, every one of a file, are UTF-8 text: no NUL byte anywhere and a fatal
 * decode of everything after a leading byte order mark. An empty file is text.
 */
export function isWholeText(bytes: Uint8Array): boolean {
    const body = startsWithBom(bytes) ? bytes.subarray(BOM_BYTES.length) : bytes;
    if (body.includes(0)) return false;
    try {
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body);
        return true;
    } catch {
        return false;
    }
}
