// Hand-built layout trees and a fake Storage, shared by the two suites over state/layout: the tree
// operations and the saved form in layout.test.ts, and the named arrangements in arrangement.test.ts.
// Nothing here touches localStorage or the DOM.

import { LAYOUT_VERSION, PANEL_DEFAULT, panes } from '../../src/lib/state/layout.ts';
import { LAYOUT_KEY } from '../../src/lib/state/layout.svelte.ts';
import type { Dock, Instance, Layout, Workbench } from '../../src/lib/state/layout.ts';

export function instance(id: string, view = 'projects'): Instance {
    return { id, view, state: null };
}

export function pane(ids: string[], active?: string): Layout {
    const tabs = ids.map((id) => instance(id));
    return { kind: 'pane', tabs, active: active ?? tabs[0]?.id ?? '' };
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

/** A whole arrangement around two trees, which is the unit that is saved. */
export function bench(
    main: Layout,
    panel: Layout,
    dockedAt: Dock = 'right',
    share = PANEL_DEFAULT
): Workbench {
    return { main, panel, dock: dockedAt, panelSize: share };
}

/** A current envelope over a workbench that is valid except for the fields handed in. */
export function envelope(over: Record<string, unknown>): unknown {
    return {
        version: LAYOUT_VERSION,
        workbench: { ...bench(pane(['a']), pane(['b'])), ...over }
    };
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
