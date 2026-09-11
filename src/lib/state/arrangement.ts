// Layer 2, client state. An arrangement, which is a saved layout written by hand: the
// `arrangements:` of config/layout.yml read into the workbench state/layout.ts holds. It is its own
// module because it is its own concern, a hand-written shape read once, and because state/layout.ts
// is at the size where a file is split rather than grown.

import {
    DOCKS,
    PANEL_DEFAULT,
    checkWorkbench,
    clampPanel,
    isRecord,
    newInstance,
    type Dock,
    type Instance,
    type Layout,
    type Workbench
} from './layout.ts';

/**
 * One arrangement of `arrangements:` in config/layout.yml as a workbench, with a fresh instance id
 * for every tab. It is the same tree as a saved envelope with the instances left out: a node is
 * `{ kind: split, dir, sizes, children }` or `{ kind: pane, view }`, where `view` is one view id or
 * a list of them, and the arrangement itself carries `main`, `panel` and optionally `dock` and
 * `panel_size`. Anything the shape or checkWorkbench refuses is null, so a hand edit that does not
 * add up leaves the workbench the user had rather than replacing it with a broken one.
 */
export function parseArrangement(value: unknown): Workbench | null {
    if (!isRecord(value)) return null;
    const main = readArrangement(value.main);
    const panel = readArrangement(value.panel);
    if (main === null || panel === null) return null;
    const where = value.dock;
    const dock: Dock =
        typeof where === 'string' && DOCKS.includes(where as Dock) ? (where as Dock) : 'right';
    const share = value.panel_size;
    const panelSize =
        typeof share === 'number' && Number.isFinite(share) ? clampPanel(share) : PANEL_DEFAULT;
    const workbench: Workbench = { main, panel, dock, panelSize };
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

/** A pane's tabs from its `view`, which is one view id or a list of them. */
function readArrangementPane(view: unknown): Layout | null {
    const names = typeof view === 'string' ? [view] : Array.isArray(view) ? view : null;
    if (names === null || names.length === 0) return null;
    const tabs: Instance[] = [];
    for (const name of names) {
        if (typeof name !== 'string' || name === '') return null;
        tabs.push(newInstance(name));
    }
    return { kind: 'pane', tabs, active: tabs[0].id };
}
