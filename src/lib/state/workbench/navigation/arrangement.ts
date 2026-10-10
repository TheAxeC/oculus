// Layer 2, client state. An arrangement, which is a saved layout written by hand: the
// `arrangements:` of config/layout.yml read into the workbench state/workbench/layout holds. It is
// its own module because it is its own concern and a hand-written shape read once.
//
// The shape of a node is read by the zod schemas below; what the workbench checks of a tree, the
// sizes adding up among them, is checkWorkbench's. The `floats:` list beside the arrangements is
// read here too: the panes drawn over every page that a browser with no saved layout starts with.

import { z } from 'zod';
import {
    checkWorkbench,
    emptyPane,
    newInstance,
    placeFits,
    type FloatPlace,
    type FloatSpec,
    type Instance,
    type Layout,
    type Workbench
} from '../layout/index.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { fields, isMap } from '../../../data/helpers/guards.ts';
import { docState, type DocEntry } from './catalogue.ts';

/** A view id: a name that is not empty, made into an instance with a fresh id. */
const viewIdShape = z
    .string()
    .min(1)
    .transform((view) => newInstance(view));

/** A tab written out: its view id and, when it has one, the map its instance opens with. */
const stateTabShape = z
    .object({ view: z.string().min(1), state: mapShape.optional() })
    .transform(({ view, state }) =>
        state === undefined ? newInstance(view) : newInstance(view, { ...state })
    );

/** One tab of a pane: a view id, or a view id with the state its instance opens in. */
const arrangementTabShape = z.union([viewIdShape, stateTabShape]) satisfies z.ZodType<Instance>;

/** The tabs a pane or a float holds: one view id or a list of tabs. */
const tabsShape = z.union([viewIdShape.transform((tab) => [tab]), z.array(arrangementTabShape)]);

/** A pane's `view`: one view id or a list of tabs. An empty list is an empty pane. */
const arrangementPaneShape = z
    .object({
        kind: z.literal('pane'),
        view: tabsShape
    })
    .transform(({ view: tabs }): Layout =>
        tabs.length === 0 ? emptyPane() : { kind: 'pane', tabs, active: tabs[0].id }
    );

/** A split of nodes over sizes that are numbers; checkWorkbench checks how they add up. */
const arrangementSplitShape = z
    .object({
        kind: z.literal('split'),
        dir: z.enum(['row', 'col']),
        children: z.array(z.lazy(() => arrangementNodeShape)),
        sizes: z.array(z.number())
    })
    .transform(({ dir, sizes, children }): Layout => ({ kind: 'split', dir, sizes, children }));

/** One node of an arrangement: a split with its children, or a pane with the views it holds. */
const arrangementNodeShape: z.ZodType<Layout> = z.discriminatedUnion('kind', [
    arrangementPaneShape,
    arrangementSplitShape
]);

/** An arrangement: the tree under `root`. */
const arrangementShape = z.object({ root: arrangementNodeShape });

/**
 * One arrangement of `arrangements:` in config/layout.yml as a workbench, with a fresh instance id
 * for every tab. It is the same tree as a saved envelope with the instances left out: the
 * arrangement carries `root`, and a node is `{ kind: split, dir, sizes, children }` or
 * `{ kind: pane, view }`, where `view` is one view id or a list of them, and a tab of the list may
 * be `{ view, state }`. Anything the shape or checkWorkbench refuses is null, so a hand edit that
 * does not add up leaves the workbench the user had rather than replacing it with a broken one.
 */
export function parseArrangement(value: unknown): Workbench | null {
    const read = readAs(arrangementShape, value);
    if (read === null) return null;
    const workbench: Workbench = { root: read.root };
    return checkWorkbench(workbench).length === 0 ? workbench : null;
}

/** One entry of `floats:` docked on an edge. */
const dockedEntryShape = z
    .object({ view: tabsShape, dock: z.enum(['left', 'right', 'bottom']), size: z.number() })
    .transform(({ view, dock, size }) => ({
        tabs: view,
        place: { kind: 'dock', edge: dock, size } satisfies FloatPlace
    }));

/** One entry of `floats:` floating free, in fractions of the window. */
const freeEntryShape = z
    .object({ view: tabsShape, x: z.number(), y: z.number(), w: z.number(), h: z.number() })
    .transform(({ view, x, y, w, h }) => ({
        tabs: view,
        place: { kind: 'free', x, y, w, h } satisfies FloatPlace
    }));

const floatEntryShape = z.union([dockedEntryShape, freeEntryShape]);

/**
 * The `floats:` list of config/layout.yml as floats before they have ids: each is `{ view, dock,
 * size }` or `{ view, x, y, w, h }`, `view` being one view id or a list of tabs as in an
 * arrangement's pane. An entry that does not read, holds no tab or does not fit the window is
 * dropped and the rest kept, and of two entries docked on one edge the first stays. Every tab
 * gets a fresh instance id each time the list is read.
 */
export function parseFloats(value: unknown): FloatSpec[] {
    const listed = readAs(z.array(z.unknown()), value) ?? [];
    const specs: FloatSpec[] = [];
    for (const raw of listed) {
        const read = readAs(floatEntryShape, raw);
        if (read === null || read.tabs.length === 0 || !placeFits(read.place)) continue;
        const { place, tabs } = read;
        const taken = specs.some(
            (one) =>
                one.place.kind === 'dock' && place.kind === 'dock' && one.place.edge === place.edge
        );
        if (taken) continue;
        specs.push({ pane: { kind: 'pane', tabs, active: tabs[0].id }, place });
    }
    return specs;
}

/** The tabs of a raw pane's `view`: a list, one tab, or none. */
function rawTabs(view: unknown): unknown[] {
    if (Array.isArray(view)) return view;
    return view === undefined ? [] : [view];
}

/** The ids of the `doc` tabs a raw node holds in any of its panes. */
function rawDocIds(node: unknown): string[] {
    const held = fields(node);
    if (held.root !== undefined) return rawDocIds(held.root);
    if (Array.isArray(held.children)) return held.children.flatMap(rawDocIds);
    return rawTabs(held.view).flatMap((tab) => {
        const { view, state } = fields(tab);
        const id = fields(state).id;
        return view === 'doc' && typeof id === 'string' ? [id] : [];
    });
}

/** The raw node with `tabs` added after the first tab of its first leaf pane, or null with none. */
function rawWithTabs(node: unknown, tabs: unknown[]): unknown {
    if (!isMap(node)) return null;
    if (node.kind === 'pane') {
        const own = rawTabs(node.view);
        return { ...node, view: [...own.slice(0, 1), ...tabs, ...own.slice(1)] };
    }
    if (node.kind !== 'split' || !Array.isArray(node.children)) return null;
    const children: unknown[] = node.children;
    const first = rawWithTabs(children[0], tabs);
    return first === null ? null : { ...node, children: [first, ...children.slice(1)] };
}

/**
 * An arrangement as it is read from `layout.yml` with the hub's documents added: one `doc` tab per
 * entry of `docs`, in the list's order, after the first tab of the arrangement's first leaf pane (a
 * pane with no tab takes them as its tabs). An entry whose path is already a `doc` tab of the
 * arrangement, or comes earlier in the list, adds no second tab. A node that is no arrangement, or
 * has no pane, is returned as it is, and parseArrangement refuses it.
 */
export function withDocs(node: unknown, docs: readonly DocEntry[]): unknown {
    if (docs.length === 0) return node;
    const held = new Set(rawDocIds(node));
    const tabs: unknown[] = [];
    for (const entry of docs) {
        if (held.has(entry.path)) continue;
        held.add(entry.path);
        tabs.push({ view: 'doc', state: docState(entry) });
    }
    if (tabs.length === 0 || !isMap(node)) return node;
    const root = rawWithTabs(node.root, tabs);
    return root === null ? node : { ...node, root };
}
