// Layer 2, client state. The file browser's request addresses and bounded response reads, kept
// apart from the store because they depend only on the wire and the response stream.

/** The endpoint the tree reads and the workspace actions write. */
export const FS_PATH = '/api/fs';

/**
 * The address one file's bytes are read at, each segment escaped without escaping the separators.
 * A version above zero rides on the query, which makes a rewritten file a new browser address.
 */
export function fileBytesUrl(root: string, path: string, version = 0): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '')
        .map((part) => encodeURIComponent(part));
    const at = `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
    return version > 0 ? `${at}?v=${version}` : at;
}

/** The address one directory's entries are read at. */
export function listingUrl(root: string, path: string): string {
    return `${FS_PATH}?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
}

/** The address one note's own text is read at. */
export function noteUrl(id: string): string {
    return `${FS_PATH}?note=${encodeURIComponent(id)}`;
}

/**
 * At most `limit` bytes of a response, with the transfer stopped once the limit is in. The limit is
 * bytes; a multi-byte character split by the cut decodes as the replacement character.
 */
export async function readCapped(
    response: Response,
    limit: number
): Promise<{ text: string; truncated: boolean }> {
    const held = await readCappedBytes(response, limit);
    return { text: new TextDecoder().decode(held.bytes), truncated: held.truncated };
}

/** The same cut, before it is decoded: what a rule over the file's own bytes is handed. */
export async function readCappedBytes(
    response: Response,
    limit: number
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
    const body = response.body;
    if (body === null) {
        return { bytes: new Uint8Array(await response.arrayBuffer()), truncated: false };
    }
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let taken = 0;
    try {
        while (taken <= limit) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            taken += value.byteLength;
        }
    } finally {
        if (taken > limit) await reader.cancel();
    }
    const kept = new Uint8Array(Math.min(taken, limit));
    let at = 0;
    for (const chunk of chunks) {
        if (at >= kept.length) break;
        const part = chunk.subarray(0, kept.length - at);
        kept.set(part, at);
        at += part.byteLength;
    }
    return { bytes: kept, truncated: taken > limit };
}
