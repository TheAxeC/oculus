// Layer 3, primitive. The address a document has on the page's language server channel. The page
// names a file as `oculus-file:///<root key>/<path>`, each part percent-encoded, which is the form
// the relay reads (server/machine/lsp/uris.ts); a model of the editor lives under its own
// `inmemory:` address, and the transport (transport.ts) turns one into the other in both
// directions. A path part never holds a `/`, so the address splits unambiguously; the root key is
// percent-encoded twice, since the editor's URI type decodes an address's path once before a peek
// model's address is read back (`placeOfResource`), and a key may hold a `/`.
//
// A file outside every served root that a language server named reaches the page as a library
// address, `oculus-lib:///<token>/<file name>` (server/machine/lsp/library/address.ts), with the
// name percent-encoded twice for the same reason. The page holds no path of the machine for it: a
// `Library` is the address and the name, and the root and language the read needs are the state
// side's (state/system/machine/lsp/lsp.svelte.ts), told by `LspServices.library`. The reading of an
// address is data/prose/lsp-addresses.ts's, which the state side reads too; this module adds the
// editor's resources.

import {
    LIBRARY_SCHEME,
    PAGE_SCHEME,
    isLibrary,
    libraryOf,
    pageUri,
    placeOf,
    type Library,
    type Place,
    type Target
} from '$lib/data/prose/lsp-addresses';

export { isLibrary, libraryOf, pageUri, placeOf };
export type { Library, Place, Target };

/** The file a Monaco resource names when it is in the page's address form, or null for another. */
export function placeOfResource(resource: { scheme: string; path: string }): Place | null {
    if (`${resource.scheme}:` !== PAGE_SCHEME) return null;
    const parts = resource.path.split('/').filter((part) => part !== '');
    if (parts.length < 2) return null;
    try {
        return { root: decodeURIComponent(parts[0]), path: parts.slice(1).join('/') };
    } catch {
        return null;
    }
}

/**
 * The line a link's fragment names, `L<line>` or `L<line>,<column>` (the form a Markdown link to a
 * heading is resolved to); 1 for any other fragment or none.
 */
export function lineOfFragment(fragment: string): number {
    const line = /^L(\d+)(?:,\d+)?$/.exec(fragment)?.[1];
    return line === undefined || Number(line) < 1 ? 1 : Number(line);
}

/** The library file a Monaco resource names when it is in the page's address form, or null. */
export function libraryOfResource(resource: { scheme: string; path: string }): Library | null {
    if (`${resource.scheme}:` !== LIBRARY_SCHEME) return null;
    const parts = resource.path.split('/').filter((part) => part !== '');
    if (parts.length !== 2) return null;
    try {
        return {
            library: `${LIBRARY_SCHEME}///${parts[0]}/${encodeURIComponent(parts[1])}`,
            name: decodeURIComponent(parts[1])
        };
    } catch {
        return null;
    }
}
