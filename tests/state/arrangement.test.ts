// Named arrangements: a whole workbench written by hand in config/layout.yml, read into the shape
// state/layout.ts holds, and the control that opens one as a page of its own.
//
// The tool's own `arrangements.sessions` is read from the config here rather than repeated, so an
// edit of that file that stops it parsing fails in this suite instead of silently doing nothing in
// the strip. Nothing here touches localStorage or the DOM: the store takes the storage it is given.

import { describe, expect, it } from 'vitest';
import {
    PANEL_DEFAULT,
    PANEL_MAX,
    checkWorkbench,
    panes,
    parseLayout,
    type Workbench
} from '../../src/lib/state/layout/index.ts';
import {
    LAYOUT_KEY,
    currentPage,
    layout,
    loadLayout,
    openArrangement,
    pages,
    workbench
} from '../../src/lib/state/layout.svelte.ts';
import { parseArrangement } from '../../src/lib/state/arrangement.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { bench, fakeStorage, pane, saveBench, three, viewsOf } from './layout-fixture.ts';

// loadLayout names the page it makes, and a page is named from config/text.yml like everything
// else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The `arrangements.sessions` node of the tool's own config/layout.yml. */
function real(): unknown {
    const held = loadConfig(engineDir()).config.arrangements;
    return (held as Record<string, unknown>).sessions;
}

describe('parseArrangement', () => {
    it('turns the shipped sessions arrangement into a workbench that checks out', () => {
        const made = parseArrangement(real());
        expect(made).not.toBe(null);
        expect(checkWorkbench(made as Workbench)).toEqual([]);
        expect(made?.dock).toBe('right');
        expect(viewsOf((made as Workbench).main)).toEqual([
            'session-list',
            'terminal',
            'transcript',
            'timeline'
        ]);
        expect(viewsOf((made as Workbench).panel)).toEqual(['session-detail', 'changes', 'agents']);
    });

    it('mints a fresh instance id for every tab, so two applications never collide', () => {
        const first = parseArrangement(real()) as Workbench;
        const second = parseArrangement(real()) as Workbench;
        const ids = (made: Workbench): string[] =>
            [...panes(made.main), ...panes(made.panel)].flatMap(({ pane: node }) =>
                node.tabs.map((tab) => tab.id)
            );
        expect(new Set(ids(first)).size).toBe(7);
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

describe('the store: a named arrangement as a page', () => {
    /** A workbench of the viewer's own, which opening an arrangement must leave where it is. */
    function own(): Workbench {
        return bench(three(), pane(['p']), 'bottom', 0.4);
    }

    const ARRANGEMENT = {
        main: { kind: 'pane', view: 'session-list' },
        panel: { kind: 'pane', view: ['session-detail', 'changes'] }
    };

    const SESSIONS = 'Sessions';

    it('opens the arrangement as a page of its own, made current', () => {
        const storage = fakeStorage(saveBench(own()));
        loadLayout(storage);
        expect(openArrangement(ARRANGEMENT, SESSIONS)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', SESSIONS]);
        expect(currentPage().label).toBe(SESSIONS);
        expect(viewsOf(layout('main'))).toEqual(['session-list']);
        expect(viewsOf(layout('panel'))).toEqual(['session-detail', 'changes']);
    });

    it('leaves the workbench that was on screen on the page it was on', () => {
        const storage = fakeStorage(saveBench(own()));
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(pages()[0].workbench).toEqual(own());
    });

    it('switches to the page it already made rather than opening a second one', () => {
        const storage = fakeStorage(saveBench(own()));
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        const made = currentPage().id;
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(pages()).toHaveLength(2);
        expect(currentPage().id).toBe(made);
    });

    it('saves every page under the one key', () => {
        const storage = fakeStorage(saveBench(own()));
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        const saved = parseLayout(storage.held[LAYOUT_KEY], '');
        expect(saved?.pages.map((page) => page.label)).toEqual(['Page 1', SESSIONS]);
        expect(saved?.current).toBe(currentPage().id);
    });

    it('changes nothing on an arrangement that does not parse', () => {
        const storage = fakeStorage(saveBench(own()));
        loadLayout(storage);
        expect(openArrangement({ main: { kind: 'box' } }, 'Broken')).toBe(false);
        expect(pages()).toHaveLength(1);
        expect(workbench()).toEqual(own());
    });

    it('opens the shipped sessions arrangement as a page', () => {
        loadLayout(fakeStorage());
        expect(openArrangement(real(), SESSIONS)).toBe(true);
        expect(viewsOf(layout('main'))).toEqual([
            'session-list',
            'terminal',
            'transcript',
            'timeline'
        ]);
    });
});
