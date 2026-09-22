// Layer 2, client state. Pages shown inside other pages: whether one page draws another, putting a
// page leaf in a host's tree, taking one out again, and clearing the leaves a page may not draw. It
// lives beside the tree operations because the rules it enforces are about the page list and not
// about one tree: a page never draws itself, directly or through another, and never draws one page
// in two places at once.

import {
    emptyPane,
    pageLeaf,
    samePath,
    type Edge,
    type Layout,
    type Page,
    type Pages
} from './model.ts';
import { leafAt, pageLeaves, removeNode, splitLeaf } from './tree.ts';
import { settleFocus } from './workbench.ts';

/**
 * Whether the tree of `id`, and the trees of the pages its leaves name, reach `wanted`: whether
 * drawing `id` draws `wanted` somewhere inside it. A page already walked is not walked twice, so a
 * list that already holds a loop is still answered.
 */
export function showsPage(held: readonly Page[], id: string, wanted: string): boolean {
    const seen = new Set<string>();
    const reaches = (at: string): boolean => {
        if (seen.has(at)) return false;
        seen.add(at);
        const page = held.find((one) => one.id === at);
        if (page === undefined) return false;
        return pageLeaves(page.workbench.root).some(
            (leaf) => leaf.page === wanted || reaches(leaf.page)
        );
    };
    return reaches(id);
}

/**
 * Whether drawing `nestedId` draws `hostId`. It is what says a page may not be shown inside
 * another: a page reached from itself would draw for ever.
 */
export function containsPage(held: readonly Page[], hostId: string, nestedId: string): boolean {
    return showsPage(held, nestedId, hostId);
}

/**
 * Whether `nestedId` may be shown inside `hostId`: both pages exist, the two are not one page, the
 * nested page does not draw the host, and the host does not draw the nested page already. The last
 * of these is what keeps one page to one place in a host: a page drawn twice would be one page
 * whose two drawings each mount its views.
 */
export function embeddable(held: readonly Page[], hostId: string, nestedId: string): boolean {
    if (nestedId === hostId) return false;
    if (!held.some((one) => one.id === nestedId)) return false;
    if (!held.some((one) => one.id === hostId)) return false;
    return !showsPage(held, nestedId, hostId) && !showsPage(held, hostId, nestedId);
}

/**
 * Whether `nestedId` may be shown at a pane of `hostId` while `screenId` is the page the strip is
 * on. The screen is what the reader sees: a page already drawn anywhere on it is not drawn a second
 * time, wherever in it the pane sits.
 */
export function showable(
    held: readonly Page[],
    screenId: string,
    hostId: string,
    nestedId: string
): boolean {
    if (!embeddable(held, hostId, nestedId)) return false;
    const onScreen = drawnBy(held, screenId);
    if (onScreen.has(nestedId)) return false;
    return [...drawnBy(held, nestedId)].every((id) => !onScreen.has(id));
}

/** The page with this id and every page drawing it draws, directly or through another. */
export function drawnBy(held: readonly Page[], id: string): Set<string> {
    const drawn = new Set<string>();
    const walk = (at: string): void => {
        if (drawn.has(at)) return;
        drawn.add(at);
        const page = held.find((one) => one.id === at);
        if (page === undefined) return;
        for (const leaf of pageLeaves(page.workbench.root)) walk(leaf.page);
    };
    walk(id);
    return drawn;
}

/** Why a leaf of a page's tree is one that page may not draw. */
export type Refusal = 'unknown' | 'loop' | 'twice';

/**
 * The leaves of a tree its page may not draw, in the order they are drawn: a leaf naming no page of
 * the list, a leaf that closes a loop, and the second leaf drawing a page that page already draws.
 * The first drawing of a page is the one kept, so a tree is judged by what it draws twice and not
 * by the leaf that drew it first.
 */
export function refusedLeaves(
    held: readonly Page[],
    hostId: string,
    root: Layout
): { path: number[]; page: string; why: Refusal }[] {
    const drawn = new Set<string>();
    const refused: { path: number[]; page: string; why: Refusal }[] = [];
    for (const leaf of pageLeaves(root)) {
        const why = refusalOf(held, hostId, leaf.page, drawn);
        if (why !== null) {
            refused.push({ path: leaf.path, page: leaf.page, why });
            continue;
        }
        for (const id of drawnBy(held, leaf.page)) drawn.add(id);
    }
    return refused;
}

/** Why one leaf is refused, or null when the page may be drawn there. */
function refusalOf(
    held: readonly Page[],
    hostId: string,
    nestedId: string,
    drawn: Set<string>
): Refusal | null {
    if (!held.some((one) => one.id === nestedId)) return 'unknown';
    if (nestedId === hostId || showsPage(held, nestedId, hostId)) return 'loop';
    // A page the host already draws, or one that draws such a page, would be drawn a second time.
    return [...drawnBy(held, nestedId)].some((id) => drawn.has(id)) ? 'twice' : null;
}

/**
 * Show `nestedId` beside the leaf at `path` of the host's tree, on `edge`. The pages are returned
 * unchanged when the drop would make a page show itself, which is how a refusal reads to a caller.
 */
export function embedPage(
    held: Pages,
    hostId: string,
    path: number[],
    edge: Edge,
    nestedId: string
): Pages {
    if (!embeddable(held.pages, hostId, nestedId)) return held;
    const host = held.pages.find((one) => one.id === hostId);
    if (host === undefined) return held;
    const dir: 'row' | 'col' = edge === 'left' || edge === 'right' ? 'row' : 'col';
    const before = edge === 'left' || edge === 'top';
    const root = splitLeaf(host.workbench.root, path, dir, pageLeaf(nestedId), before);
    if (root === host.workbench.root) return held;
    return withWorkbench(held, hostId, settleFocus({ ...host.workbench, root }));
}

/**
 * The tree without the page leaf at `path`, its space going back to the neighbour it was split
 * from, exactly as a closed pane's does. A path naming anything else leaves the tree alone.
 */
export function unembedPage(layout: Layout, path: number[]): Layout {
    return leafAt(layout, path)?.kind === 'page' ? removeNode(layout, path) : layout;
}

/** Every page with one page's workbench replaced. */
function withWorkbench(held: Pages, id: string, workbench: Page['workbench']): Pages {
    return {
        ...held,
        pages: held.pages.map((one) => (one.id === id ? { ...one, workbench } : one))
    };
}

/**
 * One tree with the leaves at these paths turned into empty panes, and the rest of it as it was.
 */
function withoutLeaves(node: Layout, path: number[], paths: number[][]): Layout {
    if (node.kind === 'page') {
        return paths.some((one) => samePath(one, path)) ? emptyPane() : node;
    }
    if (node.kind !== 'split') return node;
    const children = node.children.map((child, index) =>
        withoutLeaves(child, [...path, index], paths)
    );
    return children.every((child, index) => child === node.children[index])
        ? node
        : { ...node, children };
}

/**
 * Every page with the leaves naming `id` taken out, for a page that is going: the space goes back
 * to the neighbour, as taking a shown page out by its own control gives it back.
 */
export function clearPage(held: Pages, id: string): Pages {
    const pages = held.pages.map((page) => {
        const root = withoutPage(page.workbench.root, id);
        if (root === page.workbench.root) return page;
        return { ...page, workbench: settleFocus({ ...page.workbench, root }) };
    });
    return pages.every((page, index) => page === held.pages[index]) ? held : { ...held, pages };
}

/** One tree with every leaf naming a page removed, one at a time: each removal moves the rest. */
function withoutPage(root: Layout, id: string): Layout {
    let tree = root;
    for (;;) {
        const leaf = pageLeaves(tree).find((one) => one.page === id);
        if (leaf === undefined) return tree;
        const next = removeNode(tree, leaf.path);
        if (next === tree) return tree;
        tree = next;
    }
}

/**
 * Every page with the leaves it may not draw turned into an empty pane: a leaf naming a page the
 * list does not hold, a leaf that would make a page draw itself, and a leaf drawing a page its own
 * page already draws. It is what a saved layout is read through, so an envelope written by another
 * version renders rather than being refused whole.
 *
 * The leaves are judged by the rule checkPages judges them by, and the clearing is repeated until
 * no leaf is refused, since taking one leaf out can change what another page draws; a settled
 * envelope is therefore one checkPages accepts. Two pages that draw each other lose both leaves,
 * since each is a loop while the other stands.
 */
export function settlePageLeaves(held: Pages): Pages {
    let pages = held;
    for (;;) {
        const refused = pages.pages.map((page) =>
            refusedLeaves(pages.pages, page.id, page.workbench.root).map((leaf) => leaf.path)
        );
        if (refused.every((paths) => paths.length === 0)) return pages;
        pages = {
            ...pages,
            pages: pages.pages.map((page, index) => {
                const paths = refused[index];
                if (paths.length === 0) return page;
                const root = withoutLeaves(page.workbench.root, [], paths);
                return { ...page, workbench: settleFocus({ ...page.workbench, root }) };
            })
        };
    }
}
