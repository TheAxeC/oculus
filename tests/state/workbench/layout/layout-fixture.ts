// Hand-built layout trees and a fake Storage, shared by the two suites over state/workbench/layout:
// the tree operations in layout.test.ts, the saved form and its migrations in layout-saved.test.ts,
// and the named arrangements in arrangement.test.ts. Nothing here touches localStorage or the DOM.

import {
    WORKBENCH_VERSION,
    panes,
    parseLayout
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import type { ClientState } from '../../../fixtures/client.ts';
import type {
    Focus,
    Instance,
    Layout,
    Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';

export function instance(id: string, view = 'projects'): Instance {
    return { id, view, state: null };
}

export function pane(ids: string[], active?: string): Layout {
    const tabs = ids.map((id) => instance(id));
    return { kind: 'pane', tabs, active: active ?? tabs.at(0)?.id ?? '' };
}

export function split(dir: 'row' | 'col', sizes: number[], children: Layout[]): Layout {
    return { kind: 'split', dir, sizes, children };
}

/** A row of a pane and a column of two panes: three panes at [0], [1, 0] and [1, 1]. */
export function three(): Layout {
    return split(
        'row',
        [0.5, 0.5],
        [pane(['a']), split('col', [0.5, 0.5], [pane(['b']), pane(['c'])])]
    );
}

/** A whole arrangement around one tree, which is the unit that is saved. */
export function bench(root: Layout, focus?: Focus): Workbench {
    return focus === undefined ? { root } : { root, focus };
}

/** A split whose child `at` is collapsed to the split's edge. */
export function folded(tree: Layout, at: number[]): Layout {
    return tree.kind === 'split' ? { ...tree, folded: at } : tree;
}

/** The two-tree workbench of a version 2 or 3 envelope, as a browser holding one wrote it. */
export function docked(
    main: Layout,
    panel: Layout,
    dock: 'right' | 'bottom' | 'hidden' = 'right',
    panelSize = 0.3
): Record<string, unknown> {
    return { main, panel, dock, panelSize };
}

/** A version 2 envelope over a two-tree workbench that is valid except for the fields handed in. */
export function envelope(over: Record<string, unknown>): unknown {
    return {
        version: WORKBENCH_VERSION,
        workbench: { ...docked(pane(['a']), pane(['b'])), ...over }
    };
}

/** One two-tree workbench in the envelope a browser held before a page was one tree. */
export function saveBench(workbench: Record<string, unknown>): string {
    return JSON.stringify({ version: WORKBENCH_VERSION, workbench });
}

/** The workbench of the page a storage holds as its current one, or null when it holds none. */
export function savedBench(storage: { held: Record<string, string> }): Workbench | null {
    const read = parseLayout(storage.held[LAYOUT_KEY] ?? '', '');
    if (read === null) return null;
    return (read.pages.find((page) => page.id === read.current) ?? read.pages[0]).workbench;
}

/** The view of every tab in a tree, depth first, which is what a store test is about. */
export function viewsOf(tree: Layout): string[] {
    return panes(tree).flatMap(({ pane: node }) => node.tabs.map((tab) => tab.view));
}

/** A fake Storage: what the store needs of one, and a window on what it wrote. */
export function fakeStorage(seed?: string) {
    const held: Record<string, string> = seed === undefined ? {} : { [LAYOUT_KEY]: seed };
    return {
        held,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            held[key] = value;
        }
    };
}

/** The folded children of a split, and nothing for a pane, which cannot hold any. */
export function foldedOf(tree: Layout): number[] | undefined {
    return tree.kind === 'split' ? tree.folded : undefined;
}

/** The arrangement a Focus rail button carries in the reset cases: the Focus view alone. */
export const FOCUS_NODE = { root: { kind: 'pane', view: 'focus' } };

/**
 * The pages the reset cases of pages.test.ts start from, loaded from a new storage: Page 1 of the
 * reader's own, the page of the Focus button renamed and given a Status tab holding typed text,
 * and the page of a button named Old, which is on screen. The storage comes back with their ids,
 * so a case reads what the store saved.
 */
export function resetPagesFixture(client: ClientState): {
    storage: ReturnType<typeof fakeStorage>;
    own: string;
    focus: string;
    old: string;
    added: string;
} {
    const storage = fakeStorage();
    client.layout.loadLayout(storage);
    const own = client.layout.currentPage().id;
    client.layout.openRailPage('focus', 'Focus', FOCUS_NODE);
    const focus = client.layout.currentPage().id;
    const added = client.layout.openView('status', undefined, focus);
    client.ui.setInstanceState(added, { typed: 'held' });
    client.layout.renamePage(focus, 'Mine now');
    client.layout.openRailPage('old', 'Old', { root: { kind: 'pane', view: 'status' } });
    return { storage, own, focus, old: client.layout.currentPage().id, added };
}
