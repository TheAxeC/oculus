// Layer 3, shared view partial. The address api/file answers for a file under a root, apart from a
// view so the address can be read without a rendering. The Document view opens a whole file at it
// and the Present view draws a slide's figure from it.

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
