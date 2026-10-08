// Layer 2, client state. Which change of the served roots a store has to hear. The roots are the
// current workspace's (state/sources/fs.svelte.ts), which are an empty list while the workspaces
// are being read and when the read failed, so an empty list alone says nothing about what is
// served. The stores that hold what belongs to a root (the command diagnostics, the LaTeX states)
// are told only when one read list of roots differs from the read list before it.

import { untrack } from 'svelte';

/**
 * A served root as a store reads it: its key, its folder and that folder with symlinks resolved.
 */
type ServedRoot = { key: string; dir: string; real?: string };

/**
 * Call `changed` with the new roots each time a read list of roots differs from the one read
 * before it, in a root's key, folder or real folder. `read` returns null while the roots are not
 * read, and a null changes nothing: the list read before it stays the one the next is compared
 * with. The first read list is only remembered. The call returned ends the watch.
 */
export function watchServedRoots(
    read: () => ServedRoot[] | null,
    changed: (roots: ServedRoot[]) => void
): () => void {
    let before: string | null = null;
    return $effect.root(() => {
        $effect(() => {
            const roots = read();
            if (roots === null) return;
            const now = JSON.stringify(roots.map((one) => [one.key, one.dir, one.real ?? null]));
            const was = before;
            before = now;
            if (was !== null && was !== now) untrack(() => changed(roots));
        });
    });
}
