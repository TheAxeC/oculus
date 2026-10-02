// Layer 2, client state. The pure operations over floats: a pane or a tab put over the page, a
// float docked to an edge, freed, put back into a page, moved and resized, and the shipped floats
// taken in by a layout saved before there were floats. Each takes the pages
// and answers new pages, or the pages it was given when it names nothing to change.

import { findInstance, tabsOf } from '../instance.ts';
import {
    clamp,
    type DockEdge,
    type Float,
    type FloatPlace,
    type Instance,
    type Layout,
    type Pages,
    type Pane,
    type Workbench
} from '../model.ts';
import { closePane, leafAt, removeTab, splitLeaf, type KeepRule } from '../tree.ts';
import { restore, settleFocus } from '../workbench.ts';

/** The smallest width or height of a free float and of a dock, in fractions of the window. */
export const FLOAT_MIN = 0.1;

/** The largest size a dock takes of the window. */
export const DOCK_MAX = 0.6;

/** The width and height of a float that was just made, and the size of a dock that was. */
export const START_W = 0.3;
export const START_H = 0.4;
export const START_DOCK = 0.3;

const EPS = 1e-9;

/** A float before it has an id: the pane it holds and where it is drawn. */
export type FloatSpec = { pane: Pane; place: FloatPlace };

/** Whether a number can be a fraction: finite, which is what every comparison below assumes. */
function finite(...values: number[]): boolean {
    return values.every((value) => Number.isFinite(value));
}

/**
 * Whether a place adds up: a free float inside the window with at least the least width and
 * height, a dock between the least and the most size.
 */
export function placeFits(place: FloatPlace): boolean {
    if (place.kind === 'dock') {
        return finite(place.size) && place.size >= FLOAT_MIN - EPS && place.size <= DOCK_MAX + EPS;
    }
    const { x, y, w, h } = place;
    if (!finite(x, y, w, h)) return false;
    return (
        x >= -EPS &&
        y >= -EPS &&
        w >= FLOAT_MIN - EPS &&
        h >= FLOAT_MIN - EPS &&
        x + w <= 1 + EPS &&
        y + h <= 1 + EPS
    );
}

/** The place a float starts at: the middle of the window. */
function centred(): FloatPlace {
    return { kind: 'free', x: (1 - START_W) / 2, y: (1 - START_H) / 2, w: START_W, h: START_H };
}

/** A tab as a float holds it: a tab put in a float is one the reader means to keep. */
function kept(tab: Instance): Instance {
    return { id: tab.id, view: tab.view, state: tab.state };
}

/** The float docked on an edge, other than `except`. */
function dockedOn(floats: Float[], edge: DockEdge, except?: string): Float | undefined {
    return floats.find(
        (one) => one.id !== except && one.place.kind === 'dock' && one.place.edge === edge
    );
}

function withFloats(held: Pages, floats: Float[]): Pages {
    return { ...held, floats };
}

/** The pages with one float replaced by another. */
function replacing(held: Pages, id: string, next: Float): Pages {
    return withFloats(
        held,
        held.floats.map((one) => (one.id === id ? next : one))
    );
}

/**
 * The floats a list of specs makes: each with an id of its own and a fresh id for each tab, so two
 * makings share none. Of two floats docked on one edge only the first is made.
 */
export function floatsFrom(specs: FloatSpec[]): Float[] {
    const made: Float[] = [];
    for (const spec of specs) {
        if (spec.place.kind === 'dock' && dockedOn(made, spec.place.edge) !== undefined) continue;
        if (spec.pane.tabs.length === 0) continue;
        const tabs = spec.pane.tabs.map((tab) => ({ ...kept(tab), id: crypto.randomUUID() }));
        const at = spec.pane.tabs.findIndex((tab) => tab.id === spec.pane.active);
        const active = tabs[Math.max(at, 0)];
        made.push({
            id: crypto.randomUUID(),
            pane: { kind: 'pane', tabs, active: active.id },
            place: spec.place
        });
    }
    return made;
}

/**
 * The pages with the shipped floats taken in, for a layout saved before there were floats. The
 * first tab of a view a shipped float holds is moved out of the page that holds it into that
 * float, its id kept, so what it held stays, and every other tab of that view leaves its page, so
 * no page draws the view beside the float; a view no page holds is made new. A float whose edge
 * another float already holds is not made.
 */
export function adoptFloats(held: Pages, specs: FloatSpec[]): Pages {
    let next = held;
    for (const spec of specs) {
        if (spec.place.kind === 'dock' && dockedOn(next.floats, spec.place.edge) !== undefined) {
            continue;
        }
        const tabs: Instance[] = [];
        for (const tab of spec.pane.tabs) {
            const found = tabNamedBy(next, tab.view);
            if (found === null) {
                tabs.push({ ...kept(tab), id: crypto.randomUUID() });
                continue;
            }
            tabs.push(found);
            for (
                let left: Instance | null = found;
                left !== null;
                left = tabNamedBy(next, tab.view)
            ) {
                next = withoutTab(next, left.id);
            }
        }
        if (tabs.length === 0) continue;
        const at = spec.pane.tabs.findIndex((tab) => tab.id === spec.pane.active);
        const active = tabs[Math.max(at, 0)];
        const float: Float = {
            id: crypto.randomUUID(),
            pane: { kind: 'pane', tabs, active: active.id },
            place: spec.place
        };
        next = withFloats(next, [...next.floats, float]);
    }
    return next.floats.length === held.floats.length ? held : next;
}

/** The first tab of a view a page holds, which a shipped float takes in. */
function tabNamedBy(held: Pages, view: string): Instance | null {
    for (const page of held.pages) {
        const found = tabsOf(page.workbench.root).find((tab) => tab.view === view);
        if (found !== undefined) return found;
    }
    return null;
}

/** The pages with one tab gone from the page that holds it, the pane it left cleaned. */
function withoutTab(held: Pages, id: string, keep?: KeepRule): Pages {
    return {
        ...held,
        pages: held.pages.map((page) => {
            const found = findInstance(page.workbench.root, id);
            if (found === null) return page;
            const root = removeTab(page.workbench.root, found.path, found.index, keep);
            return { ...page, workbench: settleFocus({ ...page.workbench, root }) };
        })
    };
}

/**
 * The pages with an arrangement written to a page or a float. A float takes only one pane: a split
 * is refused, leaving the pages as they were, and a pane left with no tab removes the float. An id
 * naming neither changes nothing.
 */
export function writeHost(held: Pages, id: string, workbench: Workbench): Pages {
    if (held.pages.some((page) => page.id === id)) {
        return {
            ...held,
            pages: held.pages.map((page) => (page.id === id ? { ...page, workbench } : page))
        };
    }
    const float = held.floats.find((one) => one.id === id);
    const root = workbench.root;
    if (float === undefined || root.kind !== 'pane') return held;
    if (root.tabs.length === 0) {
        return withFloats(
            held,
            held.floats.filter((one) => one !== float)
        );
    }
    return replacing(held, id, { ...float, pane: root });
}

/**
 * The pages with one instance gone from wherever it is held: a page's pane cleaned as the rule
 * leaves it, or a float, which goes with its last tab.
 */
export function dropInstance(held: Pages, id: string, keep?: KeepRule): Pages {
    return leaveFloat(held, id) ?? withoutTab(held, id, keep);
}

/**
 * The pane at `path` of a page taken out of its tree and put over every page as a free float, in
 * the middle of the window. A page's only pane is left empty. A float's pane is never floated
 * again, and a page or path naming no pane holding a tab changes nothing.
 */
export function floatPane(held: Pages, page: string, path: number[]): Pages {
    const host = held.pages.find((one) => one.id === page);
    if (host === undefined) return held;
    const found = leafAt(host.workbench.root, path);
    if (found?.kind !== 'pane' || found.tabs.length === 0) return held;
    const root = closePane(host.workbench.root, path);
    const float: Float = {
        id: crypto.randomUUID(),
        pane: { kind: 'pane', tabs: found.tabs.map(kept), active: found.active },
        place: centred()
    };
    return {
        ...held,
        pages: held.pages.map((one) =>
            one.id === page ? { ...one, workbench: settleFocus({ ...one.workbench, root }) } : one
        ),
        floats: [...held.floats, float]
    };
}

/**
 * One tab taken out of the pane that holds it, on a page or in a float, and put over every page as
 * a free float whose top left corner is the point, in fractions of the window. The pane it left is
 * cleaned as a move cleans it, a float left with nothing is removed, and a tab nothing holds
 * changes nothing.
 */
export function floatTab(
    held: Pages,
    id: string,
    at: { x: number; y: number },
    keep?: KeepRule
): Pages {
    const instance = instanceIn(held, id);
    if (instance === null) return held;
    const source = dropInstance(held, id, keep);
    const place: FloatPlace = {
        kind: 'free',
        x: clamp(at.x, 0, 1 - START_W),
        y: clamp(at.y, 0, 1 - START_H),
        w: START_W,
        h: START_H
    };
    const float: Float = {
        id: crypto.randomUUID(),
        pane: { kind: 'pane', tabs: [kept(instance)], active: instance.id },
        place
    };
    return withFloats(source, [...source.floats, float]);
}

/** The instance with this id, wherever it is held. */
function instanceIn(held: Pages, id: string): Instance | null {
    for (const page of held.pages) {
        const found = findInstance(page.workbench.root, id);
        if (found !== null) return found.instance;
    }
    for (const float of held.floats) {
        const tab = float.pane.tabs.find((one) => one.id === id);
        if (tab !== undefined) return tab;
    }
    return null;
}

/**
 * The pages with a tab taken out of the float that holds it, the float removed when it was the
 * last; null when no float holds the tab.
 */
function leaveFloat(held: Pages, id: string): Pages | null {
    const float = held.floats.find((one) => one.pane.tabs.some((tab) => tab.id === id));
    if (float === undefined) return null;
    if (float.pane.tabs.length === 1) {
        return withFloats(
            held,
            held.floats.filter((one) => one !== float)
        );
    }
    const index = float.pane.tabs.findIndex((tab) => tab.id === id);
    const next = removeTab(float.pane, [], index);
    if (next.kind !== 'pane') return null;
    return replacing(held, float.id, { ...float, pane: next });
}

/**
 * A float docked on an edge. Another float already docked there takes this float's tabs after its
 * own, with this float's active tab active, and this float goes. A float moved from one edge to
 * another keeps its size, and a free float starts at the starting size.
 */
export function dockFloat(held: Pages, id: string, edge: DockEdge): Pages {
    const float = held.floats.find((one) => one.id === id);
    if (float === undefined) return held;
    if (float.place.kind === 'dock' && float.place.edge === edge) return held;
    const holder = dockedOn(held.floats, edge, id);
    if (holder !== undefined) {
        const merged: Float = {
            ...holder,
            pane: {
                kind: 'pane',
                tabs: [...holder.pane.tabs, ...float.pane.tabs],
                active: float.pane.active
            }
        };
        return withFloats(
            held,
            held.floats.filter((one) => one !== float).map((one) => (one === holder ? merged : one))
        );
    }
    const size = float.place.kind === 'dock' ? float.place.size : START_DOCK;
    return replacing(held, id, { ...float, place: { kind: 'dock', edge, size } });
}

/** A docked float floated again, in the middle of the window. A free float changes nothing. */
export function freeFloat(held: Pages, id: string): Pages {
    const float = held.floats.find((one) => one.id === id);
    if (float === undefined || float.place.kind === 'free') return held;
    return replacing(held, id, { ...float, place: centred() });
}

/**
 * Every pane of a tree with the share of the whole tree it holds, in the order the tree draws them.
 */
function shares(root: Layout): { path: number[]; share: number }[] {
    const found: { path: number[]; share: number }[] = [];
    const walk = (node: Layout, path: number[], share: number): void => {
        if (node.kind === 'pane') found.push({ path, share });
        if (node.kind !== 'split') return;
        node.children.forEach((child, index) =>
            walk(child, [...path, index], share * (node.sizes[index] ?? 1 / node.children.length))
        );
    };
    walk(root, [], 1);
    return found;
}

/** The path of the pane holding the largest share of the tree, the first of equals. */
function largestPane(root: Layout): number[] | null {
    let best: { path: number[]; share: number } | undefined;
    for (const one of shares(root)) {
        if (best === undefined || one.share > best.share + EPS) best = one;
    }
    return best?.path ?? null;
}

/**
 * A float's tabs put back into a page as a new pane split off the right of the page's largest pane,
 * by the share of the page each holds. The float goes, and the page is shown whole.
 */
export function returnFloat(held: Pages, id: string, page: string): Pages {
    const float = held.floats.find((one) => one.id === id);
    const host = held.pages.find((one) => one.id === page);
    if (float === undefined || host === undefined) return held;
    const target = largestPane(host.workbench.root);
    if (target === null) return held;
    const shown = restore(host.workbench);
    const root = splitLeaf(shown.root, target, 'row', float.pane, false);
    return {
        ...held,
        pages: held.pages.map((one) =>
            one.id === page ? { ...one, workbench: { ...shown, root } } : one
        ),
        floats: held.floats.filter((one) => one !== float)
    };
}

/**
 * A float moved or resized. A place that does not fit the window, or a dock on an edge another
 * float holds, changes nothing.
 */
export function placeFloat(held: Pages, id: string, place: FloatPlace): Pages {
    const float = held.floats.find((one) => one.id === id);
    if (float === undefined || !placeFits(place)) return held;
    if (place.kind === 'dock' && dockedOn(held.floats, place.edge, id) !== undefined) return held;
    if (JSON.stringify(float.place) === JSON.stringify(place)) return held;
    return replacing(held, id, { ...float, place });
}
