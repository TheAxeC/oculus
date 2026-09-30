// Layer 2, client state. The bytes of a pane as the page handles them: the base64 the wire carries
// input and output in, and the filter that drops the window-title sequences a shell writes, which
// xterm.js does not know and would print as text. Pure over the bytes it is handed.

/** The base64 of a string's UTF-8 bytes, which is how the wire carries a pane's input. */
export function encodeBytes(text: string): string {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return btoa(binary);
}

/** The bytes of a base64 payload. Anything that is not base64 reads as no bytes at all. */
export function decodeBytes(encoded: string): Uint8Array {
    let binary: string;
    try {
        binary = atob(encoded);
    } catch {
        return new Uint8Array(0);
    }
    const bytes = new Uint8Array(binary.length);
    for (let at = 0; at < binary.length; at += 1) bytes[at] = binary.charCodeAt(at);
    return bytes;
}

/** ESC, the byte a title sequence opens and closes with. */
const ESC = 0x1b;

/**
 * A filter that drops the window-title sequences of a pane, `ESC k <name> ESC \`: a shell writes
 * one to name its tmux window after the running command, tmux passes it through as pane output, and
 * xterm.js does not know it and would print the name as text. The filter keeps what a chunk ends
 * with when a sequence is cut across two chunks, so each call is handed the bytes to write and the
 * next call finishes the sequence. Anything else in the stream passes through unchanged.
 */
export function titleStripper(): (bytes: Uint8Array) => Uint8Array {
    let carry = new Uint8Array(0);
    let inside = false;
    return (bytes) => {
        const all = new Uint8Array(carry.length + bytes.length);
        all.set(carry, 0);
        all.set(bytes, carry.length);
        const out: number[] = [];
        let at = 0;
        while (at < all.length) {
            if (inside) {
                // Read to the ESC \ that closes the title; an open title at the end is carried.
                const close = indexOfPair(all, ESC, 0x5c, at);
                if (close === -1) {
                    carry = all.slice(at);
                    return Uint8Array.from(out);
                }
                at = close + 2;
                inside = false;
                continue;
            }
            const open = indexOfPair(all, ESC, 0x6b, at);
            if (open === -1) {
                // A lone ESC at the very end may be the first byte of a title: carried, not
                // written.
                const last = all.length - 1;
                if (all[last] === ESC && last >= at) {
                    for (let i = at; i < last; i += 1) out.push(all[i]);
                    carry = all.slice(last);
                } else {
                    for (let i = at; i < all.length; i += 1) out.push(all[i]);
                    carry = new Uint8Array(0);
                }
                return Uint8Array.from(out);
            }
            for (let i = at; i < open; i += 1) out.push(all[i]);
            at = open + 2;
            inside = true;
        }
        carry = new Uint8Array(0);
        return Uint8Array.from(out);
    };
}

/** The index of the first `first, second` pair at or after `from`, or -1. */
function indexOfPair(bytes: Uint8Array, first: number, second: number, from: number): number {
    for (let i = from; i + 1 < bytes.length; i += 1) {
        if (bytes[i] === first && bytes[i + 1] === second) return i;
    }
    return -1;
}
