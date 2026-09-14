// Layer 3, Document partial. The address api/file answers for a file under a root, apart from
// the view so the address can be read without a rendering.

/**
 * Each segment is escaped on its own, so a space or a hash in a name survives and the separators
 * stay separators.
 */
export function fileUrl(root: string, path: string): string {
    const parts = path
        .split('/')
        .filter((one) => one !== '')
        .map((one) => encodeURIComponent(one));
    return `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
}
