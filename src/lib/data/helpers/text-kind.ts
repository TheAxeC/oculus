// Layer 1, data. Whether a file is text, told from its first bytes rather than from its name.
//
// One rule, imported by both layers: the browser runs it over the head of the file it fetched to
// decide which tab a file opens in, and the source route runs it over the file on disk to refuse a
// save that would replace bytes no editor could have read. A list of extensions would have to agree
// with itself in two places and would still be wrong about a name nobody put on it.
//
// Text is: no NUL byte in the window, and the window decodes as UTF-8. A multi-byte sequence the
// window cut in half is the window's doing, so it is accepted when there are more bytes after it
// and refused when the file itself ends there. That is what TEXT_SNIFF_READ is for: a caller hands
// over one byte more than the window, so the rule can tell a file that goes on from one that ends
// on half a character, and a file whose accented letter happens to straddle byte 8192 is still
// text.

/** How many bytes from the head of a file the rule reads. */
export const TEXT_SNIFF = 8192;

/**
 * How many bytes a caller reads for it: the window and one byte more, which is what says whether
 * the window cut the file or the file ended inside it.
 */
export const TEXT_SNIFF_READ = TEXT_SNIFF + 1;

/** The continuation bytes a lead byte of each length must be followed by, as a low and a high. */
const AFTER: Record<number, [number, number]> = {
    0xe0: [0xa0, 0xbf],
    0xed: [0x80, 0x9f],
    0xf0: [0x90, 0xbf],
    0xf4: [0x80, 0x8f]
};

/** How many bytes the sequence a lead byte opens holds, and zero for a byte that opens none. */
function sequenceLength(lead: number): number {
    if (lead >= 0xf0 && lead <= 0xf4) return 4;
    if (lead >= 0xe0 && lead <= 0xef) return 3;
    if (lead >= 0xc2 && lead <= 0xdf) return 2;
    return 0;
}

/** Whether every byte after the lead is a continuation byte the lead allows. */
function follows(bytes: Uint8Array, at: number, length: number): boolean {
    const [low, high] = AFTER[bytes[at]] ?? [0x80, 0xbf];
    if (bytes[at + 1] < low || bytes[at + 1] > high) return false;
    for (let step = 2; step < length; step += 1) {
        if (bytes[at + step] < 0x80 || bytes[at + step] > 0xbf) return false;
    }
    return true;
}

/**
 * Whether these bytes are the head of a text file. An empty file is text: there is nothing in it
 * that is not. A caller that read TEXT_SNIFF_READ bytes and got them all is handing over a file
 * that goes on past the window, which is what makes a sequence cut at its end the window's doing.
 */
export function isTextBytes(bytes: Uint8Array): boolean {
    const end = Math.min(bytes.length, TEXT_SNIFF);
    const cut = bytes.length > end;
    for (let at = 0; at < end; at += 1) {
        if (bytes[at] === 0) return false;
    }
    let at = 0;
    while (at < end) {
        if (bytes[at] < 0x80) {
            at += 1;
            continue;
        }
        const length = sequenceLength(bytes[at]);
        if (length === 0) return false;
        if (at + length > end) return cut;
        if (!follows(bytes, at, length)) return false;
        at += length;
    }
    return true;
}
