// Layer 2, client state. The bytes of a custom editor's file as text on the wire: the document
// route carries them as base64.

/**
 * The base64 text of some bytes, built in slices so a large file does not exceed the call stack.
 */
export function toBase64(bytes: Uint8Array): string {
    let text = '';
    for (let at = 0; at < bytes.length; at += 0x8000) {
        text += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
    }
    return btoa(text);
}

/** The bytes a base64 text stands for. */
export function fromBase64(text: string): Uint8Array {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);
    for (let at = 0; at < raw.length; at += 1) bytes[at] = raw.charCodeAt(at);
    return bytes;
}
