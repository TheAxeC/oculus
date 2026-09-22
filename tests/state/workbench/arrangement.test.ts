// Named arrangements: a whole workbench written by hand in config/layout.yml, read into the shape
// state/workbench/layout/ holds, and the control that opens one as a page of its own.
//
// The tool's own `arrangements.sessions` is read from the config here rather than repeated, so an
// edit of that file that stops it parsing fails in this suite instead of silently doing nothing in
// the strip. Nothing here touches localStorage or the DOM: the store takes the storage it is given.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    checkWorkbench,
    panes,
    parseLayout,
    type Workbench
} from '../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY } from '../../../src/lib/state/workbench/layout.svelte.ts';
import { parseArrangement } from '../../../src/lib/state/workbench/arrangement.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/words/text.ts';
import {
    bench,
    docked,
    fakeStorage,
    pane,
    saveBench,
    three,
    viewsOf
} from './layout/layout-fixture.ts';
import { present } from '../../fixtures/present.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let currentPage: ClientState['layout']['currentPage'];
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let openArrangement: ClientState['layout']['openArrangement'];
let pages: ClientState['layout']['pages'];
let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({ currentPage, layout, loadLayout, openArrangement, pages, workbench } = client.layout);
});

// loadLayout names the page it makes, and a page is named from the text catalogs like everything
// else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The `arrangements.sessions` node of the tool's own config/layout.yml. */
function real(): unknown {
    const held = loadConfig(engineDir()).config.arrangements;
    return (held as Record<string, unknown>).sessions;
}

describe('parseArrangement', () => {
    it('turns the shipped sessions arrangement into one tree that checks out', () => {
        const parsed = parseArrangement(real());
        expect(parsed).not.toBe(null);
        const made = present(parsed, 'arrangement');
        expect(checkWorkbench(made)).toEqual([]);
        expect(made.root.kind).toBe('split');
        expect(viewsOf(made.root)).toEqual([
            'session-list',
            'terminal',
            'transcript',
            'timeline',
            'session-detail',
            'changes',
            'agents'
        ]);
    });

    it('mints a fresh instance id for every tab, so two applications never collide', () => {
        const first = present(parseArrangement(real()), 'arrangement');
        const second = present(parseArrangement(real()), 'arrangement');
        const ids = (made: Workbench): string[] =>
            panes(made.root).flatMap(({ pane: node }) => node.tabs.map((tab) => tab.id));
        expect(new Set(ids(first)).size).toBe(7);
        expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    });

    it('takes a pane naming one view as well as a pane naming several', () => {
        const one = present(
            parseArrangement({ root: { kind: 'pane', view: 'timeline' } }),
            'arrangement'
        );
        expect(viewsOf(one.root)).toEqual(['timeline']);
        const several = present(
            parseArrangement({ root: { kind: 'pane', view: ['changes', 'agents'] } }),
            'arrangement'
        );
        expect(viewsOf(several.root)).toEqual(['changes', 'agents']);
    });

    it('refuses a tree that is not a tree, and one naming no root', () => {
        expect(parseArrangement(null)).toBe(null);
        expect(parseArrangement({ main: { kind: 'pane', view: 'timeline' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'box' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'pane', view: [] } })).toBe(null);
    });

    it('refuses a split whose sizes do not add up, or take a child under the minimum', () => {
        const made = (sizes: number[]): unknown => ({
            root: {
                kind: 'split',
                dir: 'row',
                sizes,
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ]
            }
        });
        expect(parseArrangement(made([0.5, 0.5]))).not.toBe(null);
        expect(parseArrangement(made([0.5, 0.6]))).toBe(null);
        expect(parseArrangement(made([0.5]))).toBe(null);
        expect(parseArrangement(made([0.99, 0.01]))).toBe(null);
    });

    it('refuses a split with a direction or a size that is not one', () => {
        const bad = (over: Record<string, unknown>): unknown => ({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [
                    { kind: 'pane', view: 'timeline' },
                    { kind: 'pane', view: 'agents' }
                ],
                ...over
            }
        });
        expect(parseArrangement(bad({ dir: 'sideways' }))).toBe(null);
        expect(parseArrangement(bad({ sizes: ['half', 'half'] }))).toBe(null);
        expect(parseArrangement(bad({ children: 'two' }))).toBe(null);
    });
});

describe('the store: a named arrangement as a page', () => {
    /** A workbench of the viewer's own, which opening an arrangement must leave where it is. */
    function own(): Workbench {
        return bench(three());
    }

    /**
     * The two-tree envelope a browser held before a page was one tree, which own() is read from.
     */
    function saveOwn(): string {
        return saveBench(docked(three(), pane([]), 'hidden'));
    }

    const ARRANGEMENT = {
        root: {
            kind: 'split',
            dir: 'row',
            sizes: [0.7, 0.3],
            children: [
                { kind: 'pane', view: 'session-list' },
                { kind: 'pane', view: ['session-detail', 'changes'] }
            ]
        }
    };

    const SESSIONS = 'Sessions';

    it('opens the arrangement as a page of its own, made current', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        expect(openArrangement(ARRANGEMENT, SESSIONS)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', SESSIONS]);
        expect(currentPage().label).toBe(SESSIONS);
        expect(viewsOf(layout())).toEqual(['session-list', 'session-detail', 'changes']);
    });

    it('leaves the workbench that was on screen on the page it was on', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(pages()[0].workbench).toEqual(own());
    });

    it('switches to the page it already made rather than opening a second one', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        const made = currentPage().id;
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(pages()).toHaveLength(2);
        expect(currentPage().id).toBe(made);
    });

    it('saves every page under the one key', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openArrangement(ARRANGEMENT, SESSIONS);
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        const saved = parseLayout(storage.held[LAYOUT_KEY], '');
        expect(saved?.pages.map((page) => page.label)).toEqual(['Page 1', SESSIONS]);
        expect(saved?.current).toBe(currentPage().id);
    });

    it('changes nothing on an arrangement that does not parse', () => {
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        expect(openArrangement({ root: { kind: 'box' } }, 'Broken')).toBe(false);
        expect(pages()).toHaveLength(1);
        expect(workbench()).toEqual(own());
    });

    it('opens the shipped sessions arrangement as a page', () => {
        loadLayout(fakeStorage());
        expect(openArrangement(real(), SESSIONS)).toBe(true);
        expect(viewsOf(layout())).toEqual([
            'session-list',
            'terminal',
            'transcript',
            'timeline',
            'session-detail',
            'changes',
            'agents'
        ]);
    });
});
