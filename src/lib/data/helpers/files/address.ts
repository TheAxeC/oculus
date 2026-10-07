// Layer 1, data. The address /api/file answers a file at: `/api/file/<root>/<path>`, each segment
// escaped on its own so a space or a hash in a name survives and the separators stay separators.
// Every reader of a served file's bytes builds the address here, the page's reads and downloads,
// the editor's picture addresses and the figure a Present slide draws, so the escaping is one rule.
// It imports nothing from node, so the page and the server both reach it.

/**
 * The address one file's bytes are read at. A version above zero rides on the query, which makes a
 * rewritten file a new browser address.
 */
export function fileBytesUrl(root: string, path: string, version = 0): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '' && part !== '.')
        .map((part) => encodeURIComponent(part));
    const at = `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
    return version > 0 ? `${at}?v=${version}` : at;
}
