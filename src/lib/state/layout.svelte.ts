// Layer 2, client state. The store half of the layout: the arrangement the shell is rendering now,
// and its persistence. The trees themselves, their types and every operation on them are
// state/layout.ts, which has no runes in it; this module is the one place an arrangement is reactive
// and the one place it is saved.
//
// The saved unit is the whole workbench: two trees, the dock and the panel's share. An operation
// names the tree it applies to, so change() takes a target and rebuilds the workbench around the
// tree the operation returned. Every change reaches the store through apply(), which is also what
// saves, so an arrangement is never changed without being written down.

import {
    activePath,
    activate,
    clampPanel,
    closeInstance,
    closePane,
    defaultWorkbench,
    findView,
    focusedPane,
    isInstanceOf,
    maximise,
    newInstance,
    openInstance,
    paneAt,
    parseArrangement,
    parseLayout,
    restate,
    restore,
    serialiseLayout,
    settleFocus,
    splitWith,
    stateId,
    transfer,
    type Dock,
    type Edge,
    type Focus,
    type Instance,
    type Layout,
    type Pane,
    type Target,
    type ViewId,
    type Workbench
} from './layout.ts';

/** The key the arrangement is saved under. The envelope inside it carries the version. */
export const LAYOUT_KEY = 'oculus.layout.v1';

/**
 * The key the workbench a named arrangement replaced is kept under, so the control that applied the
 * arrangement puts the user's own back. It holds a whole serialised workbench, or the empty string
 * for none: the store never removes a key, so a Storage it is handed needs only get and set.
 */
export const PREVIOUS_KEY = 'oculus.layout.previous';

/** What the store needs of a Storage, so a test can hand it a plain object. */
type Storable = Pick<Storage, 'getItem' | 'setItem'>;

const store: { current: Workbench } = $state({ current: defaultWorkbench() });

/** The workbench a named arrangement replaced, serialised, or the empty string when none did. */
const kept: { previous: string } = $state({ previous: '' });

/** Where apply() saves, once loadLayout has named it. Nothing is saved before that. */
let backing: Storable | null = null;

/**
 * The instance activated last in each tree, which is what makes one of its panes the active one. It
 * is not saved: a reload opens a view in the first pane, which is where an arrangement with one pane
 * puts it anyway, and nothing about the arrangement itself is lost.
 */
const lastActive: Record<Target, string | null> = { main: null, panel: null };

/** The whole arrangement. */
export function workbench(): Workbench {
    return store.current;
}

/** One of the two trees. */
export function layout(target: Target = 'main'): Layout {
    return target === 'main' ? store.current.main : store.current.panel;
}

/** Where the panel sits. */
export function dockedAt(): Dock {
    return store.current.dock;
}

/** The panel's share of the window. */
export function panelSize(): number {
    return store.current.panelSize;
}

/**
 * Read the saved arrangement and make it current, falling back to the default when there is none or
 * the saved value fails parseLayout. Returns whether a saved arrangement was restored, which is how
 * a page knows whether it is looking at the default. The default argument is evaluated at the call
 * and not at the import, so a test that never calls this touches no localStorage.
 */
export function loadLayout(storage: Storable = localStorage): boolean {
    backing = storage;
    let raw: string | null = null;
    try {
        raw = storage.getItem(LAYOUT_KEY);
    } catch {
        // A browser with storage refused still runs; it just forgets the arrangement.
        raw = null;
    }
    const parsed = raw === null ? null : parseLayout(raw);
    store.current = parsed ?? defaultWorkbench();
    let previous: string | null = null;
    try {
        previous = storage.getItem(PREVIOUS_KEY);
    } catch {
        previous = null;
    }
    kept.previous = previous ?? '';
    lastActive.main = null;
    lastActive.panel = null;
    return parsed !== null;
}

/** Write one string under a key, or do nothing when there is nowhere to write yet. */
function remember(key: string, value: string): void {
    if (backing === null) return;
    try {
        backing.setItem(key, value);
    } catch {
        // A full or refused storage forgets the arrangement at the next load and nothing else.
    }
}

/** Whether a named arrangement is in force, which is to say a workbench is held to go back to. */
export function arranged(): boolean {
    return kept.previous !== '';
}

/**
 * Show a named arrangement, keeping the workbench that was on screen so the same control puts it
 * back. An arrangement that does not parse changes nothing and says so, and applying one while
 * another is already in force keeps the workbench held first: what is remembered is the user's own
 * arrangement, never a generated one.
 */
export function applyArrangement(raw: unknown): boolean {
    const next = parseArrangement(raw);
    if (next === null) return false;
    if (kept.previous === '') {
        const previous = serialiseLayout(store.current);
        kept.previous = previous;
        remember(PREVIOUS_KEY, previous);
    }
    apply(next);
    return true;
}

/**
 * Put the workbench a named arrangement replaced back. The held workbench is let go either way, so a
 * saved value that no longer parses leaves the control saying what it now does rather than offering
 * a restore that cannot happen.
 */
export function restoreArrangement(): boolean {
    const previous = kept.previous;
    kept.previous = '';
    remember(PREVIOUS_KEY, '');
    if (previous === '') return false;
    const back = parseLayout(previous);
    if (back === null) return false;
    apply(back);
    return true;
}

/** Make an arrangement current and save it. */
export function apply(next: Workbench): void {
    store.current = next;
    if (backing === null) return;
    try {
        backing.setItem(LAYOUT_KEY, serialiseLayout(next));
    } catch {
        // A full or refused storage loses the arrangement at the next load and nothing else: the
        // arrangement in memory is what the shell renders and it is already current.
    }
}

/** Apply an operation to one of the two trees. This is how every O7 operation reaches the store. */
export function change(target: Target, edit: (tree: Layout) => Layout): void {
    const current = store.current;
    const next = edit(target === 'main' ? current.main : current.panel);
    apply(target === 'main' ? { ...current, main: next } : { ...current, panel: next });
}

/** Where the panel sits, or that it is not shown. */
export function dock(where: Dock): void {
    apply({ ...store.current, dock: where });
}

/** How much of the window the panel takes, held inside the allowed range. */
export function resizePanel(fraction: number): void {
    apply({ ...store.current, panelSize: clampPanel(fraction) });
}

/** Make an instance the active tab of its pane, and its pane the tree's active one. */
export function activateInstance(target: Target, id: string): void {
    lastActive[target] = id;
    change(target, (tree) => activate(tree, id));
}

/** Close an instance, and forget it if it was the tree's active one. */
export function closeInstanceIn(target: Target, id: string): void {
    if (lastActive[target] === id) lastActive[target] = null;
    apply(settleFocus(withTree(target, closeInstance(layout(target), id))));
}

/** The arrangement with one of its trees replaced, which is what an operation on a tree returns. */
function withTree(target: Target, tree: Layout): Workbench {
    const current = store.current;
    return target === 'main' ? { ...current, main: tree } : { ...current, panel: tree };
}

/** Close a whole pane, with every tab it holds. */
export function closePaneIn(target: Target, path: number[]): void {
    const pane = paneAt(layout(target), path);
    if (pane === null) return;
    const held = lastActive[target];
    if (held !== null && pane.tabs.some((tab) => tab.id === held)) lastActive[target] = null;
    apply(settleFocus(withTree(target, closePane(layout(target), path))));
}

/**
 * What a tab landing in a tree needs of the rest of the arrangement: a maximised pane in the other
 * tree hides the one it is landing in, and a hidden panel hides it altogether. Either way the tab
 * would be moved out of sight, which is the one thing a move must not look like.
 */
function reveal(target: Target): Workbench {
    const current = store.current;
    const focus = focusedPane(current);
    const shown = focus !== null && focus.target !== target ? restore(current) : current;
    return target === 'panel' && shown.dock === 'hidden' ? { ...shown, dock: 'right' } : shown;
}

/** Move an instance to a pane's tab strip, from whichever of the two trees holds it now. */
export function transferInstance(id: string, target: Target, path: number[], index: number): void {
    const from = reveal(target);
    const next = transfer(from, id, target, path, index);
    if (next === from) return;
    lastActive[target] = id;
    apply(next);
}

/** Move an instance into a new pane on one edge of a pane, from whichever tree holds it now. */
export function splitInstance(id: string, target: Target, path: number[], edge: Edge): void {
    const from = reveal(target);
    const next = splitWith(from, id, target, path, edge);
    if (next === from) return;
    lastActive[target] = id;
    apply(next);
}

/** Show one pane alone, with the rest of the workbench put away. */
export function maximisePane(target: Target, path: number[]): void {
    apply(maximise(store.current, target, path));
}

/** Show every pane again. */
export function restorePanes(): void {
    apply(restore(store.current));
}

/** The maximised pane, or null when every pane is shown. */
export function focused(): Focus | null {
    return focusedPane(store.current);
}

/**
 * Show a view in one of the two trees: the instance already there is activated, so the rail never
 * opens a second copy of the same view, and otherwise a new instance opens in that tree's active
 * pane. The panel is shown when a view is opened into it and it was hidden, since opening a view
 * into something invisible would look like nothing happening.
 *
 * `state` is what the opener has to say to the view: the project a card wants opened or edited. A
 * state carrying an `id` names which instance is wanted, so opening one project twice activates the
 * tab it is already in and opening a second project opens a second tab; a state carrying no `id`
 * retargets whatever instance of the view is open, as it did before.
 */
export function openView(view: ViewId, where: Target, state?: unknown): void {
    // A maximised pane hides everything else, so a view opened into the other tree would land out
    // of sight; opening it is what the rail was clicked for, so the arrangement comes back instead.
    const focus = focusedPane(store.current);
    if (focus !== null && focus.target !== where) restorePanes();

    const tree = layout(where);
    const into = focus !== null && focus.target === where ? focus.path : null;
    const inside = into === null ? null : paneAt(tree, into);
    const wanted = stateId(state);
    const existing = inside === null ? findView(tree, view, wanted) : findIn(inside, view, wanted);
    if (existing !== null) {
        if (state !== undefined) change(where, (current) => restate(current, existing.id, state));
        activateInstance(where, existing.id);
        if (where === 'panel' && store.current.dock === 'hidden') dock('right');
        return;
    }
    const instance = newInstance(view, state ?? {});
    const path = into !== null && inside !== null ? into : activePath(tree, lastActive[where]);
    lastActive[where] = instance.id;
    change(where, (current) => openInstance(current, path, instance));
    if (where === 'panel' && store.current.dock === 'hidden') dock('right');
}

/**
 * The instance of a view in one pane, or null when it holds none. While a pane is maximised it is
 * the only pane a view can be opened into, so it is the only one an already-open instance may be
 * found in: activating a tab of a pane nobody can see would look like nothing happening. A state id
 * narrows it the same way findView does.
 */
function findIn(pane: Pane, view: ViewId, id: string | null = null): Instance | null {
    return pane.tabs.find((tab) => isInstanceOf(tab, view, id)) ?? null;
}
