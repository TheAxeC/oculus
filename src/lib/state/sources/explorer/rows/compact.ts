// Layer 2, client state, pure. Compact folders: a chain of folders that each hold exactly one
// folder and nothing else is drawn as one row `a / b / c`, as VS Code's `explorer.compactFolders`
// draws it.
//
// The chain is read only from what is listed. A folder joins the chain when the folder above it has
// been read, holds that folder alone, and the folder itself has been read too, so a folder nobody
// has opened is never folded into its parent. The row stands at the last folder of the chain, which
// is the one a press opens; every earlier folder is a segment of the row and stays addressable
// through `chain`.

import {
    childPath,
    type ChainStep,
    type FsEntry,
    type RowRef,
    type TreeRow
} from '../view/place.ts';

/** The listings a chain is read from: the entries of a folder, and null for one never read. */
export type HeldListing = (root: string, path: string) => FsEntry[] | null;

/** The folder the chain stands on, `from` the folder above it. */
type Step = { from: string; to: string };

/**
 * The folders of the chain that starts at one folder, outermost first, the folder itself first. The
 * chain grows while the last folder is read and holds one entry that is a read folder and not a
 * symbolic link; `blocked` says for a step from one folder to the next that the chain must not
 * grow across it, which is what keeps a folder being named on a row of its own.
 */
export function compactChain(
    root: string,
    start: ChainStep,
    held: HeldListing,
    blocked: (step: Step) => boolean = () => false
): ChainStep[] {
    const chain: ChainStep[] = [start];
    for (;;) {
        const last = chain[chain.length - 1];
        const inside = held(root, last.path);
        const only = inside?.length === 1 ? inside.at(0) : undefined;
        if (only?.kind !== 'dir' || only.link === true) break;
        const next = childPath(last.path, only.name);
        if (held(root, next) === null || blocked({ from: last.path, to: next })) break;
        chain.push({ name: only.name, path: next });
    }
    return chain;
}

/** The text a compacted row shows for its folders: their names, outermost first. */
export function chainLabel(chain: ChainStep[]): string {
    return chain.map((step) => step.name).join(' / ');
}

/**
 * The row of the tree that stands for a path: the row at that path, or the compacted row holding it
 * as one of its segments. Null when no row draws it.
 */
export function rowStanding(rows: TreeRow[], ref: RowRef): TreeRow | null {
    const exact = rows.find((row) => row.root === ref.root && row.path === ref.path);
    if (exact !== undefined) return exact;
    return (
        rows.find(
            (row) =>
                row.root === ref.root && (row.chain ?? []).some((step) => step.path === ref.path)
        ) ?? null
    );
}
