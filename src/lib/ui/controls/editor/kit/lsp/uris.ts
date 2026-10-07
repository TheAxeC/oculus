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
// side's (state/system/machine/lsp/lsp.svelte.ts), told by `LspServices.library`.

/** The scheme the page names a document by. */
const PAGE_SCHEME = 'oculus-file:';

/** The scheme the page names a library file by. */
const LIBRARY_SCHEME = 'oculus-lib:';

/** A file as the page names it: a served root's key and the path under it. */
export type Place = { root: string; path: string };

/** A library file as the page names it: its address, and the file's own name. */
export type Library = { library: string; name: string };

/** A file a document, a peek or a tab can be of: a file of a served root or a library file. */
export type Target = Place | Library;

/** Whether a target is a library file. */
export function isLibrary(target: Target): target is Library {
    return 'library' in target;
}

/** The address of a file on the channel. */
export function pageUri({ root, path }: Place): string {
    const parts = path === '' ? [] : path.split('/');
    return `${PAGE_SCHEME}///${[encodeURIComponent(encodeURIComponent(root)), ...parts.map(encodeURIComponent)].join('/')}`;
}

/** The file an address names, or null for an address that is not of the form above. */
export function placeOf(uri: string): Place | null {
    if (!uri.startsWith(`${PAGE_SCHEME}///`)) return null;
    const parts = uri.slice(`${PAGE_SCHEME}///`.length).split('/');
    if (parts.length < 2) return null;
    try {
        const root = decodeURIComponent(decodeURIComponent(parts[0]));
        return { root, path: parts.slice(1).map(decodeURIComponent).join('/') };
    } catch {
        return null;
    }
}

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

/** The library file an address names, or null for an address that is not of the form above. */
export function libraryOf(uri: string): Library | null {
    if (!uri.startsWith(`${LIBRARY_SCHEME}///`)) return null;
    const parts = uri.slice(`${LIBRARY_SCHEME}///`.length).split('/');
    if (parts.length !== 2 || parts[0] === '' || parts[1] === '') return null;
    try {
        return { library: uri, name: decodeURIComponent(decodeURIComponent(parts[1])) };
    } catch {
        return null;
    }
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
