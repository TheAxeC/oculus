// Layer 1, data. Whether a file is text, told from its first bytes rather than from its name.
//
// One rule, imported by both layers: the browser runs it over the head of the file it fetched to
// decide which tab a file opens in, and the source route runs it over the file on disk to refuse a
// save that would replace bytes no editor could have read. A list of extensions would have to agree
// with itself in two places and would still be wrong about a name nobody put on it.
//
// Text is: no NUL byte in the window, and the window decodes as UTF-8 by the platform's own
// decoder. A multi-byte sequence the window cut in half is the window's doing, so it is accepted
// when there are more bytes after it and refused when the file itself ends there. That is what
// TEXT_SNIFF_READ is for: a caller hands over one byte more than the window, so the rule can tell a
// file that goes on from one that ends on half a character, and a file whose accented letter
// happens to straddle byte 8192 is still text.

/** How many bytes from the head of a file the rule reads. */
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
