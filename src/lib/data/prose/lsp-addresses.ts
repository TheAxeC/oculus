// Layer 1, data. The address a document has on a language server channel, which the editor kit
// (ui/controls/editor/kit/lsp/uris.ts) and the page's edits (state/system/machine/lsp/edits.ts)
// both read. The page names a file as `oculus-file:///<root key>/<path>`, each part
// percent-encoded, which is the form the relay reads (server/machine/lsp/uris.ts). The root key is
// percent-encoded twice, since the editor's URI type decodes an address's path once before a peek
// model's address is read back, and a key may hold a `/`.
//
// A file outside every served root that a language server named reaches the page as a library
// address, `oculus-lib:///<token>/<file name>` (server/machine/lsp/library/address.ts), with the
// name percent-encoded twice for the same reason.

/** The scheme the page names a document by. */
export const PAGE_SCHEME = 'oculus-file:';

/** The scheme the page names a library file by. */
export const LIBRARY_SCHEME = 'oculus-lib:';

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
