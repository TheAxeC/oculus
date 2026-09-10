// Named arrangements: a whole workbench written by hand in config/layout.yml, read into the shape
// state/layout.ts holds, and the control that swaps the viewer's own workbench for it and back.
//
// The tool's own `arrangements.sessions` is read from the config here rather than repeated, so an
// edit of that file that stops it parsing fails in this suite instead of silently doing nothing in
// the rail. Nothing here touches localStorage or the DOM: the store takes the storage it is given.

import { describe, expect, it } from 'vitest';
import {
    PANEL_DEFAULT,
    PANEL_MAX,
    checkWorkbench,
    panes,
    parseArrangement,
    parseLayout,
    serialiseLayout,
    type Workbench
} from '../../src/lib/state/layout.ts';
import {
    LAYOUT_KEY,
    PREVIOUS_KEY,
    applyArrangement,
    arranged,
    dock,
    layout,
    loadLayout,
    restoreArrangement,
    workbench
} from '../../src/lib/state/layout.svelte.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { bench, fakeStorage, pane, three, viewsOf } from './layout-fixture.ts';

describe('parseArrangement', () => {
    /** The `arrangements.sessions` node of the tool's own config/layout.yml. */
    function real(): unknown {
        const held = loadConfig(engineDir()).config.arrangements;
        return (held as Record<string, unknown>).sessions;
    }

    it('turns the shipped sessions arrangement into a workbench that checks out', () => {
        const made = parseArrangement(real());
        expect(made).not.toBe(null);
        expect(checkWorkbench(made as Workbench)).toEqual([]);
        expect(made?.dock).toBe('right');
        expect(viewsOf((made as Workbench).main)).toEqual(['session-list', 'terminal', 'timeline']);
        expect(viewsOf((made as Workbench).panel)).toEqual(['session-detail', 'changes', 'agents']);
    });

    it('mints a fresh instance id for every tab, so two applications never collide', () => {
        const first = parseArrangement(real()) as Workbench;
        const second = parseArrangement(real()) as Workbench;
        const ids = (made: Workbench): string[] =>
            [...panes(made.main), ...panes(made.panel)].flatMap(({ pane: node }) =>
                node.tabs.map((tab) => tab.id)
            );
        expect(new Set(ids(first)).size).toBe(6);
        expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    });

    it('takes a pane naming one view as well as a pane naming several', () => {
        const made = parseArrangement({
            main: { kind: 'pane', view: 'timeline' },
            panel: { kind: 'pane', view: ['changes', 'agents'] }
        }) as Workbench;
        expect(viewsOf(made.main)).toEqual(['timeline']);
        expect(viewsOf(made.panel)).toEqual(['changes', 'agents']);
        expect(made.dock).toBe('right');
        expect(made.panelSize).toBe(PANEL_DEFAULT);
    });

    it('takes the dock and the panel share it is given, and holds the share in range', () => {
        const made = parseArrangement({
            main: { kind: 'pane', view: 'timeline' },
            panel: { kind: 'pane', view: 'changes' },
            dock: 'bottom',
            panel_size: 0.9
        }) as Workbench;
        expect(made.dock).toBe('bottom');
        expect(made.panelSize).toBe(PANEL_MAX);
    });

    it('refuses a tree that is not a tree, and one with no pane in it', () => {
        expect(parseArrangement(null)).toBe(null);
        expect(parseArrangement({ main: { kind: 'pane', view: 'timeline' } })).toBe(null);
        expect(
            parseArrangement({ main: { kind: 'box' }, panel: { kind: 'pane', view: 'changes' } })
        ).toBe(null);
        expect(
            parseArrangement({
                main: { kind: 'pane', view: [] },
                panel: { kind: 'pane', view: 'changes' }
            })
        ).toBe(null);
    });

    it('refuses a split whose sizes do not add up, or take a child under the minimum', () => {
        const made = (sizes: number[]): unknown => ({
            main: {
                kind: 'split',
                dir: 'row',
                sizes,
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ]
            },
            panel: { kind: 'pane', view: 'changes' }
        });
        expect(parseArrangement(made([0.5, 0.5]))).not.toBe(null);
        expect(parseArrangement(made([0.5, 0.6]))).toBe(null);
        expect(parseArrangement(made([0.5]))).toBe(null);
        expect(parseArrangement(made([0.99, 0.01]))).toBe(null);
    });

    it('refuses a split with a direction or a size that is not one', () => {
        const bad = (over: Record<string, unknown>): unknown => ({
            main: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ],
                ...over
            },
            panel: { kind: 'pane', view: 'changes' }
        });
        expect(parseArrangement(bad({ dir: 'sideways' }))).toBe(null);
        expect(parseArrangement(bad({ sizes: ['half', 'half'] }))).toBe(null);
        expect(parseArrangement(bad({ children: 'two' }))).toBe(null);
    });
});

describe('the store: a named arrangement', () => {
    /** A workbench of the viewer's own, to be replaced and then put back. */
    function own(): Workbench {
        return bench(three(), pane(['p']), 'bottom', 0.4);
    }

    const ARRANGEMENT = {
        main: { kind: 'pane', view: 'session-list' },
        panel: { kind: 'pane', view: ['session-detail', 'changes'] }
    };

    it('is not in force before one is applied', () => {
        loadLayout(fakeStorage());
        expect(arranged()).toBe(false);
    });

    it('shows the arrangement and keeps the workbench it replaced', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        expect(applyArrangement(ARRANGEMENT)).toBe(true);
        expect(arranged()).toBe(true);
        expect(viewsOf(layout('main'))).toEqual(['session-list']);
        expect(parseLayout(storage.held[PREVIOUS_KEY])).toEqual(own());
        expect(parseLayout(storage.held[LAYOUT_KEY])).toEqual(workbench());
    });

    it('puts the viewer own workbench back, and is not in force after', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        applyArrangement(ARRANGEMENT);
        expect(restoreArrangement()).toBe(true);
        expect(workbench()).toEqual(own());
        expect(arranged()).toBe(false);
        expect(storage.held[PREVIOUS_KEY]).toBe('');
    });

    it('keeps the viewer own workbench when the arrangement is applied twice', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        applyArrangement(ARRANGEMENT);
        dock('right');
        applyArrangement(ARRANGEMENT);
        expect(parseLayout(storage.held[PREVIOUS_KEY])).toEqual(own());
    });

    it('changes nothing on an arrangement that does not parse', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        expect(applyArrangement({ main: { kind: 'box' } })).toBe(false);
        expect(workbench()).toEqual(own());
        expect(arranged()).toBe(false);
    });

    it('reads a kept workbench back at the next load, so the control still offers the restore', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        applyArrangement(ARRANGEMENT);
        loadLayout(storage);
        expect(arranged()).toBe(true);
        expect(restoreArrangement()).toBe(true);
        expect(workbench()).toEqual(own());
    });

    it('lets a kept workbench go when it can no longer be read', () => {
        const storage = fakeStorage(serialiseLayout(own()));
        loadLayout(storage);
        applyArrangement(ARRANGEMENT);
        storage.held[PREVIOUS_KEY] = 'not an envelope';
        loadLayout(storage);
        expect(arranged()).toBe(true);
        expect(restoreArrangement()).toBe(false);
        expect(arranged()).toBe(false);
    });
});
