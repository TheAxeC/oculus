// Layer 3, primitive. The address a document has on the page's language server channel. The page
// names a file as `oculus-file:///<root key>/<path>`, each part percent-encoded, which is the form
// the relay reads (server/machine/lsp/uris.ts); a model of the editor lives under its own
// `inmemory:` address, and the transport (transport.ts) turns one into the other in both
// directions. A path part never holds a `/`, so the address splits unambiguously; the root key is
// percent-encoded twice, since the editor's URI type decodes an address's path once before a peek
// model's address is read back (`placeOfResource`), and a key may hold a `/`.

/** The scheme the page names a document by. */
const PAGE_SCHEME = 'oculus-file:';

/** A file as the page names it: a served root's key and the path under it. */
export type Place = { root: string; path: string };

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
