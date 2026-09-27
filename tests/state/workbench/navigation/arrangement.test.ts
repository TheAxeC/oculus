// Arrangements: a whole workbench written by hand in config/layout.yml, read into the shape
// state/workbench/layout/ holds, and the rail button that makes one its page the first time it is
// pressed and shows that page after.
//
// The tool's own arrangements are read from the config here rather than repeated, so an edit of
// that file that stops one parsing fails in this suite instead of leaving a rail button that does
// nothing. Nothing here touches localStorage or the DOM: the store takes the storage it is given.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    checkWorkbench,
    panes,
    type Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { LAYOUT_KEY } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import { parseArrangement } from '../../../../src/lib/state/workbench/navigation/arrangement.ts';
import { railPages } from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import {
    bench,
    docked,
    fakeStorage,
    instance,
    pane,
    saveBench,
    three,
    viewsOf
} from '../layout/layout-fixture.ts';
import { present } from '../../../fixtures/present.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;
let currentPage: ClientState['layout']['currentPage'];
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let openRailPage: ClientState['layout']['openRailPage'];
let change: ClientState['layout']['change'];
let renamePage: ClientState['layout']['renamePage'];
let openPage: ClientState['layout']['openPage'];
let switchPage: ClientState['layout']['switchPage'];
let pages: ClientState['layout']['pages'];
let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({
        change,
        currentPage,
        layout,
        loadLayout,
        openPage,
        openRailPage,
        pages,
        renamePage,
        switchPage,
        workbench
    } = client.layout);
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
        // revert: src/lib/state/workbench/navigation/arrangement.ts "return { kind: 'split', dir, sizes, children };" => return { kind: 'split', dir, sizes, children: children.reverse() };
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
            'agents',
            'changes',
            'files'
        ]);
    });

    it('reads the sessions arrangement as three columns, its Files tab following the selection', () => {
        // revert: config/layout.yml "sizes: [0.22, 0.5, 0.28]" => sizes: [0.3, 0.4, 0.3]
        const made = present(parseArrangement(real()), 'arrangement');
        const root = made.root;
        expect(root.kind === 'split' ? root.sizes : []).toEqual([0.22, 0.5, 0.28]);
        const files = panes(root)
            .flatMap(({ pane: node }) => node.tabs)
            .find((tab) => tab.view === 'files');
        // revert: src/lib/state/workbench/navigation/arrangement.ts "return isRecord(state) ? newInstance(view, { ...state }) : null;" => return isRecord(state) ? newInstance(view) : null;
        expect(files?.state).toEqual({ follow: true });
    });

    it('takes a tab written as a view with a state, and refuses one that does not add up', () => {
        const tab = (view: unknown) => parseArrangement({ root: { kind: 'pane', view: [view] } });
        const made = present(tab({ view: 'files', state: { follow: true } }), 'arrangement');
        const opened = panes(made.root)[0].pane.tabs[0];
        expect([opened.view, opened.state]).toEqual(['files', { follow: true }]);
        const bare = present(tab({ view: 'files' }), 'arrangement');
        expect(panes(bare.root)[0].pane.tabs[0].state).toEqual({});
        // revert: src/lib/state/workbench/navigation/arrangement.ts "return isRecord(state) ? newInstance(view, { ...state }) : null;" => return newInstance(view, isRecord(state) ? { ...state } : {});
        expect(tab({ view: 'files', state: 'follow' })).toBe(null);
        expect(tab({ view: 'files', state: [true] })).toBe(null);
        // revert: src/lib/state/workbench/navigation/arrangement.ts "if (typeof view !== 'string' || view === '') return null;" => if (typeof view !== 'string') return null;
        expect(tab({ view: '', state: {} })).toBe(null);
        expect(tab({ state: {} })).toBe(null);
        // revert: src/lib/state/workbench/navigation/arrangement.ts "if (typeof value === 'string') return value === '' ? null : newInstance(value);" => if (typeof value === 'string') return newInstance(value);
        expect(tab('')).toBe(null);
        expect(tab(7)).toBe(null);
    });

    it('mints a fresh instance id for every tab, so two applications never collide', () => {
        // revert: src/lib/state/workbench/navigation/arrangement.ts "if (typeof value === 'string') return value === '' ? null : newInstance(value);" => if (typeof value === 'string') return value === '' ? null : { id: value, view: value, state: {} };
        const first = present(parseArrangement(real()), 'arrangement');
        const second = present(parseArrangement(real()), 'arrangement');
        const ids = (made: Workbench): string[] =>
            panes(made.root).flatMap(({ pane: node }) => node.tabs.map((tab) => tab.id));
        expect(new Set(ids(first)).size).toBe(8);
        expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    });

    it('takes a pane naming one view as well as a pane naming several', () => {
        // revert: src/lib/state/workbench/navigation/arrangement.ts "const names = typeof view === 'string' ? [view] : Array.isArray(view) ? view : null;" => const names = Array.isArray(view) ? view : null;
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
        // revert: src/lib/state/workbench/navigation/arrangement.ts "if (names === null || names.length === 0) return null;" => if (names === null) return null;
        expect(parseArrangement(null)).toBe(null);
        expect(parseArrangement({ main: { kind: 'pane', view: 'timeline' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'box' } })).toBe(null);
        expect(parseArrangement({ root: { kind: 'pane', view: [] } })).toBe(null);
    });

    it('refuses a split whose sizes do not add up, or take a child under the minimum', () => {
        // revert: src/lib/state/workbench/navigation/arrangement.ts "return checkWorkbench(workbench).length === 0 ? workbench : null;" => return workbench;
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
        // revert: src/lib/state/workbench/navigation/arrangement.ts "export function parseArrangement(value: unknown): Workbench | null {" +1 .. "return checkWorkbench(workbench).length === 0 ? workbench : null;" => return isRecord(value) ? ({ root: readArrangement(value.root) } as Workbench) : null;
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

describe('the store: a rail page', () => {
    /** A workbench of the viewer's own, which showing a rail page must leave where it is. */
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

    const KEY = 'sessions';
    const LABEL = 'Sessions';

    it('makes the page from its arrangement the first time, tied to the key, and shows it', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "addPage(newPage(label, next, key));" => addPage(newPage(label, next));
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(pages().map((page) => page.label)).toEqual(['Page 1', LABEL]);
        expect(currentPage().rail).toBe(KEY);
        expect(viewsOf(layout())).toEqual(['session-list', 'session-detail', 'changes']);
    });

    it('leaves the workbench that was on screen on the page it was on', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "addPage(newPage(label, next, key));" => savePages({ pages: [newPage(label, next, key)], current: '' });
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        expect(pages()[0].workbench).toEqual(own());
    });

    it('shows the page the reader rearranged on the next press, rather than the arrangement', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "const found = held.find((page) => page.rail === key);" => const found = undefined;
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        change(() => ({ kind: 'pane', tabs: [instance('mine', 'help')], active: 'mine' }));
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(pages()).toHaveLength(2);
        expect(currentPage().id).toBe(made);
        expect(viewsOf(layout())).toEqual(['help']);
    });

    it('keeps the page when the button is renamed, since the key ties them', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "const found = held.find((page) => page.rail === key);" => const found = held.find((page) => page.label === label);
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, 'Agents at work', ARRANGEMENT)).toBe(true);
        expect(currentPage().id).toBe(made);
        expect(pages()).toHaveLength(2);
    });

    it('takes a page no button holds whose name is the label, and not one a button holds', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "const named = held.find((page) => page.rail === undefined && page.label === label);" => const named = undefined;
        loadLayout(fakeStorage(saveOwn()));
        openPage(LABEL);
        const mine = currentPage().id;
        switchPage(pages()[0].id);
        expect(openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(currentPage().id).toBe(mine);
        expect(currentPage().rail).toBe(KEY);
        // A second key under the same label finds the first one's page taken and makes its own.
        expect(openRailPage('other', LABEL, ARRANGEMENT)).toBe(true);
        expect(currentPage().id).not.toBe(mine);
        expect(pages()).toHaveLength(3);
    });

    it('changes nothing for an empty key', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "if (key === '') return false;" => delete
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage('', LABEL, ARRANGEMENT)).toBe(false);
        expect(pages()).toHaveLength(1);
    });

    it('changes nothing on an arrangement that does not parse', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "if (next === null) return false;" => delete
        loadLayout(fakeStorage(saveOwn()));
        expect(openRailPage('broken', 'Broken', { root: { kind: 'box' } })).toBe(false);
        expect(pages()).toHaveLength(1);
        expect(workbench()).toEqual(own());
    });

    it('saves the key with the page, so a reload finds the same page behind the button', () => {
        // revert: src/lib/state/workbench/layout/saved/saved.ts "if (rail !== null) page.rail = rail;" => delete
        const storage = fakeStorage(saveOwn());
        loadLayout(storage);
        openRailPage(KEY, LABEL, ARRANGEMENT);
        change(() => ({ kind: 'pane', tabs: [instance('mine', 'help')], active: 'mine' }));
        // Renamed, so the page is found by its key alone and not by the button's label.
        renamePage(currentPage().id, 'Mine');
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        const again = createClientState();
        again.layout.loadLayout(storage);
        again.layout.switchPage(again.layout.pages()[0].id);
        expect(again.layout.openRailPage(KEY, LABEL, ARRANGEMENT)).toBe(true);
        expect(again.layout.pages()).toHaveLength(2);
        expect(viewsOf(again.layout.layout())).toEqual(['help']);
    });

    it('renames the page without untying it from its button', () => {
        // revert: src/lib/state/workbench/layout.svelte.ts "const found = held.find((page) => page.rail === key);" => const found = held.find((page) => page.label === label && page.rail === key);
        loadLayout(fakeStorage(saveOwn()));
        openRailPage(KEY, LABEL, ARRANGEMENT);
        const made = currentPage().id;
        renamePage(made, 'Renamed');
        switchPage(pages()[0].id);
        openRailPage(KEY, LABEL, ARRANGEMENT);
        expect(currentPage().id).toBe(made);
        expect(currentPage().label).toBe('Renamed');
    });

    it('makes every rail page of the shipped config from its arrangement', () => {
        // revert: config/layout.yml "root: { kind: pane, view: focus }" => root: { kind: pane, view: [] }
        const rail = railPages(loadConfig(engineDir()).config);
        expect(rail.length).toBeGreaterThan(0);
        loadLayout(fakeStorage());
        for (const entry of rail) {
            expect(openRailPage(entry.page, entry.label, entry.node)).toBe(true);
            expect(currentPage().rail).toBe(entry.page);
        }
        expect(pages()).toHaveLength(rail.length + 1);
    });
});
