// Layer 2, client state. An arrangement, which is a saved layout written by hand: the
// `arrangements:` of config/layout.yml read into the workbench state/workbench/layout holds. It is
// its own module because it is its own concern and a hand-written shape read once.

import {
    checkWorkbench,
    isRecord,
    newInstance,
    type Instance,
    type Layout,
    type Workbench
} from '../layout/index.ts';

/**
 * One arrangement of `arrangements:` in config/layout.yml as a workbench, with a fresh instance id
 * for every tab. It is the same tree as a saved envelope with the instances left out: the
 * arrangement carries `root`, and a node is `{ kind: split, dir, sizes, children }` or
 * `{ kind: pane, view }`, where `view` is one view id or a list of them, and a tab of the list may
 * be `{ view, state }`. Anything the shape or checkWorkbench refuses is null, so a hand edit that
 * does not add up leaves the workbench the user had rather than replacing it with a broken one.
 */
export function parseArrangement(value: unknown): Workbench | null {
    if (!isRecord(value)) return null;
    const root = readArrangement(value.root);
    if (root === null) return null;
    const workbench: Workbench = { root };
    return checkWorkbench(workbench).length === 0 ? workbench : null;
}

/** One node of an arrangement: a split with its children, or a pane with the views it holds. */
function readArrangement(value: unknown): Layout | null {
    if (!isRecord(value)) return null;
    if (value.kind === 'pane') return readArrangementPane(value.view);
    if (value.kind !== 'split') return null;
    const dir = value.dir;
    if (dir !== 'row' && dir !== 'col') return null;
    const rawChildren = value.children;
    const rawSizes = value.sizes;
    if (!Array.isArray(rawChildren) || !Array.isArray(rawSizes)) return null;
    const children: Layout[] = [];
    for (const raw of rawChildren) {
        const child = readArrangement(raw);
        if (child === null) return null;
        children.push(child);
    }
    const sizes: number[] = [];
    for (const raw of rawSizes) {
        if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
        sizes.push(raw);
    }
    return { kind: 'split', dir, sizes, children };
}

/**
 * A pane's tabs from its `view`, which is one view id or a list of them. A tab of the list may be
 * `{ view, state }` instead of an id, for a tab the arrangement opens in a state of its own (the
 * sessions page's Files tab, which follows the selected session); the state is a map, and anything
 * else refuses the arrangement.
 */
function readArrangementPane(view: unknown): Layout | null {
    const names = typeof view === 'string' ? [view] : Array.isArray(view) ? view : null;
    if (names === null || names.length === 0) return null;
    const tabs: Instance[] = [];
    for (const name of names) {
        const tab = readArrangementTab(name);
        if (tab === null) return null;
        tabs.push(tab);
    }
    return { kind: 'pane', tabs, active: tabs[0].id };
}

/** One tab of a pane: a view id, or a view id with the state its instance opens in. */
function readArrangementTab(value: unknown): Instance | null {
    if (typeof value === 'string') return value === '' ? null : newInstance(value);
    if (!isRecord(value)) return null;
    const { view, state } = value;
    if (typeof view !== 'string' || view === '') return null;
    if (state === undefined) return newInstance(view);
    return isRecord(state) ? newInstance(view, { ...state }) : null;
}
