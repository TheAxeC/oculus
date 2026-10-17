// Layer 2, client state. Where a floated pane stood in its page, read as it leaves the page, and
// the page's tree with the pane put back there, which is what Return to Page does with a float made
// from a page's pane (HELP.md, Pages and the pane tree). The place is the node the pane stood
// beside, by its path once the pane had left and by an instance it held, so a page rearranged while
// the pane floated, which moved or closed that node, gives no place and Return to Page splits the
// pane off the page's largest pane instead (pages.ts, returnFloat).

import { tabsOf } from '../../instance.ts';
import type { FloatFrom, Layout, Pane } from '../../model.ts';
import { nodeAt, resize, splitNode } from '../../tree.ts';

/**
 * Where the pane at `path` of `before` stands in the page `page`, given the tree `after` the pane
 * left. A pane that is the whole tree is `whole`. A pane in a split of two stood beside its
 * sibling, which takes the split's path once the split collapses into it; a pane in a split of more
 * stood after the child in front of it, or, as the first child, in front of the child after it.
 */
export function standing(
    before: Layout,
    after: Layout,
    page: string,
    path: number[],
    pane: Pane
): FloatFrom {
    const added = pane.added === true ? { added: true as const } : {};
    const parentPath = path.slice(0, -1);
    const parent = path.length === 0 ? null : nodeAt(before, parentPath);
    const at = path.at(-1) ?? 0;
    if (parent?.kind !== 'split') return { kind: 'whole', page, ...added };
    const first = at === 0;
    const near = parent.children.length === 2 ? parentPath : [...parentPath, first ? 0 : at - 1];
    const node = nodeAt(after, near);
    return {
        kind: 'beside',
        page,
        path: near,
        holds: node === null ? null : (tabsOf(node).at(0)?.id ?? null),
        dir: parent.dir,
        before: first,
        share: parent.sizes[at] ?? 1 / parent.children.length,
        ...added
    };
}

/**
 * The tree `root` with `pane` put back where `from` says it stood, holding the share it held, or
 * null when that place is gone: a `whole` pane goes back into a page still holding one empty pane,
 * and a `beside` one goes beside the node at its path while that node still holds the instance it
 * held.
 */
export function putBack(root: Layout, from: FloatFrom, pane: Pane): Layout | null {
    if (from.kind === 'whole') {
        return root.kind === 'pane' && root.tabs.length === 0 ? pane : null;
    }
    const node = nodeAt(root, from.path);
    if (node === null) return null;
    if (from.holds !== null && !tabsOf(node).some((one) => one.id === from.holds)) return null;
    const next = splitNode(root, from.path, from.dir, pane, from.before);
    const at = pathOf(next, pane);
    return at === null ? next : withShare(root, next, at, from);
}

/** The path of `node` in the tree, found by identity, or null. */
function pathOf(root: Layout, node: Layout): number[] | null {
    if (root === node) return [];
    if (root.kind !== 'split') return null;
    for (const [index, child] of root.children.entries()) {
        const found = pathOf(child, node);
        if (found !== null) return [index, ...found];
    }
    return null;
}

/**
 * The tree `next`, which is `root` with the pane put in at `path`, with the pane holding the share
 * it held and the other children of its split holding the rest in the shares they held of `root`:
 * a split the pane joined keeps its children's sizes to one another, and a split made of the node
 * and the pane gives the node the rest.
 */
function withShare(
    root: Layout,
    next: Layout,
    path: number[],
    from: { share: number; path: number[] }
): Layout {
    const parentPath = path.slice(0, -1);
    const joined = parentPath.length < from.path.length ? nodeAt(root, parentPath) : null;
    const prior = joined?.kind === 'split' ? joined.sizes : [1];
    const sizes = prior.map((size) => size * (1 - from.share));
    sizes.splice(path.at(-1) ?? 0, 0, from.share);
    return resize(next, parentPath, sizes);
}
