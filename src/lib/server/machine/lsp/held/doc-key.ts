// Layer 2, server. The key a document is held under by a server, for the files that look one up.

import { fileURLToPath } from 'node:url';

/**
 * What a document is looked up by when a server names it: the path its `file://` address spells. A
 * server may write the same address with other percent-escapes than the ones it was given (pyright
 * writes `(` and `)` as `%28` and `%29`), so the address itself is not the key.
 */
export function docKey(fileUri: string): string {
    try {
        return fileURLToPath(fileUri);
    } catch {
        return fileUri;
    }
}
