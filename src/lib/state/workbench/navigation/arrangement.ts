// Layer 2, client state. An arrangement, which is a saved layout written by hand: the
// `arrangements:` of config/layout.yml read into the workbench state/workbench/layout holds. It is
// its own module because it is its own concern and a hand-written shape read once.
//
// The shape of a node is read by the zod schemas below; what the workbench checks of a tree, the
// sizes adding up among them, is checkWorkbench's.

import { z } from 'zod';
import {
    checkWorkbench,
    emptyPane,
    newInstance,
    type Instance,
    type Layout,
    type Workbench
} from '../layout/index.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';

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

/** A pane's `view`: one view id or a list of tabs. An empty list is an empty pane. */
const arrangementPaneShape = z
    .object({
        kind: z.literal('pane'),
        view: z.union([viewIdShape.transform((tab) => [tab]), z.array(arrangementTabShape)])
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
