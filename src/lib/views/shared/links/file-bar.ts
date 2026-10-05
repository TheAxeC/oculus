// Layer 3, shared view support. Whether a file tab's breadcrumb bar has its star and Open in
// Program to draw (FileBarActions.svelte), which each file view also reads to hand up its bar
// only while an action of it applies.

/**
 * Whether a tab shows a file under a served root, which the star and Open in Program act on: a
 * tab over a file at HEAD or in the index names a repository's folder, and an untitled text or a
 * tab that lost its address names no file.
 */
export function servedFile(
    roots: readonly { key: string }[],
    root: string,
    path: string,
    onDisk = true
): boolean {
    return onDisk && root !== '' && path !== '' && roots.some((one) => one.key === root);
}
