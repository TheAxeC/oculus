// Layer 3, shell test. The right-click menu of a pane's strip and of an empty pane's body, built by
// shell/panes/pane-view.ts's stripMenu, and the edge each of its four splits hands splitInstance.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menu opened by a right-click on the strip or the body, the palette
// it opens and the terminal it starts, which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import {
    floatItems,
    floatMenu,
    isFloatItem,
    stripEdge,
    stripMenu,
    stripPicked,
    type StripDeps
} from '../../../src/lib/shell/panes/pane-view.ts';
import type { FloatPlace } from '../../../src/lib/state/workbench/layout/index.ts';

/** The float operations of a StripDeps, for a case that picks no float item. */
const NO_FLOAT = {
    floatPane: () => undefined,
    dockFloat: () => undefined,
    freeFloat: () => undefined,
    returnFloat: () => undefined
};

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

describe('the pane strip menu', () => {
    // Revert: drop the Close group from stripMenu.
    it('offers a pane holding a tab on a page of two panes every item', () => {
        expect(stripMenu({ holdsTab: true, panes: 2 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_split_up',
            '@ui.strip_split_down',
            '@ui.strip_split_left',
            '@ui.strip_split_right',
            '@ui.float',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
    });

    // Revert: offer the splits in stripMenu whatever `holdsTab` says.
    it('offers an empty pane alone on its page Open File and New Terminal', () => {
        expect(stripMenu({ holdsTab: false, panes: 1 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_new_terminal'
        ]);
    });
});

describe('the edge a split takes', () => {
    // Revert: map 'split-up' to 'bottom' in STRIP_SPLITS.
    it('splits left on the left edge and up on the top edge', () => {
        const items = stripMenu({ holdsTab: true, panes: 1 }, words);
        const edges = items.map((item) => stripEdge(item.id));
        expect(edges).toEqual([null, 'top', 'bottom', 'left', 'right', null, null]);
    });

    // Revert: pass `pane.path` as [] to splitInstance in stripPicked.
    it('hands splitInstance the active tab, the pane, the edge and the page', () => {
        const calls: unknown[][] = [];
        const deps = {
            ...NO_FLOAT,
            splitInstance: (...args: unknown[]) => calls.push(args),
            openPalette: () => undefined,
            close: () => undefined,
            newTerminalIn: () => undefined
        };
        const items = stripMenu({ holdsTab: true, panes: 1 }, words);
        const left = items.find((item) => item.label === '@ui.strip_split_left');
        const up = items.find((item) => item.label === '@ui.strip_split_up');
        stripPicked(left?.id ?? '', { active: 'tab-1', path: [0], page: 'p' }, deps);
        stripPicked(up?.id ?? '', { active: 'tab-1', path: [0], page: 'p' }, deps);
        expect(calls).toEqual([
            ['tab-1', [0], 'left', 'p'],
            ['tab-1', [0], 'top', 'p']
        ]);
    });
});

describe('what the strip menu runs', () => {
    // Revert: call deps.newTerminalIn(pane.page, []) in stripPicked, so the pane's path is lost.
    it('opens the palette empty, closes through the pane close and starts a terminal in the pane it was picked on', () => {
        const calls: string[] = [];
        const deps = {
            ...NO_FLOAT,
            splitInstance: () => calls.push('split'),
            openPalette: (prefill: string) => calls.push(`palette:${prefill}`),
            close: () => calls.push('close'),
            newTerminalIn: (page: string, path: number[]) =>
                calls.push(`new:${page}:${path.join('.')}`)
        };
        const items = stripMenu({ holdsTab: true, panes: 2 }, words);
        const id = (label: string): string => items.find((item) => item.label === label)?.id ?? '';
        const pane = { active: 'tab-1', path: [1], page: 'p' };
        stripPicked(id('@ui.strip_open_file'), pane, deps);
        stripPicked(id('@ui.strip_close'), pane, deps);
        stripPicked(id('@ui.strip_new_terminal'), pane, deps);
        expect(calls).toEqual(['palette:', 'close', 'new:p:1']);
    });
});

describe('the strip menu of a float', () => {
    const free: FloatPlace = { kind: 'free', x: 0.1, y: 0.1, w: 0.3, h: 0.4 };
    const right: FloatPlace = { kind: 'dock', edge: 'right', size: 0.3 };
    const labels = (float: FloatPlace): string[] =>
        stripMenu({ holdsTab: true, panes: 1, float }, words).map((item) => item.label);

    it('offers a free float the three docks and Return to Page, and no split', () => {
        const free_ = labels(free);
        expect(free_).toEqual([
            '@ui.strip_open_file',
            '@ui.float_dock_left',
            '@ui.float_dock_right',
            '@ui.float_dock_bottom',
            '@ui.float_return',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
        expect(free_.some((label) => label.includes('split'))).toBe(false);
    });

    it('offers a float docked right the other docks, Float and Return to Page', () => {
        expect(labels(right)).toEqual([
            '@ui.strip_open_file',
            '@ui.float_dock_left',
            '@ui.float_dock_bottom',
            '@ui.float',
            '@ui.float_return',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
    });

    it('offers a float docked left or bottom the docks it is not on', () => {
        expect(
            floatItems({ kind: 'dock', edge: 'left', size: 0.3 }, words).map((i) => i.label)
        ).toEqual([
            '@ui.float_dock_right',
            '@ui.float_dock_bottom',
            '@ui.float',
            '@ui.float_return'
        ]);
        expect(
            floatItems({ kind: 'dock', edge: 'bottom', size: 0.3 }, words).map((i) => i.label)
        ).toEqual(['@ui.float_dock_left', '@ui.float_dock_right', '@ui.float', '@ui.float_return']);
    });

    it('offers no maximise, fold or page to show beside it', () => {
        const every = floatItems(free, words).map((item) => item.id);
        expect(every.join(' ')).not.toMatch(/maximise|restore|fold|embed|split/);
    });

    it('offers the pane menu of a float Close, the float items and the pages to move to', () => {
        const pages = [
            {
                id: 'a',
                label: 'A',
                workbench: { root: { kind: 'pane' as const, tabs: [], active: '' } }
            },
            {
                id: 'b',
                label: 'B',
                workbench: { root: { kind: 'pane' as const, tabs: [], active: '' } }
            }
        ];
        const menu = floatMenu(right, pages, words);
        expect(menu.map((item) => item.label)).toEqual([
            '@ui.pane_close',
            '@ui.float_dock_left',
            '@ui.float_dock_bottom',
            '@ui.float',
            '@ui.float_return',
            '@ui.move_to_page_list'
        ]);
        expect(menu.at(-1)?.items?.map((item) => item.label)).toEqual([
            '@ui.move_to_page(A)',
            '@ui.move_to_page(B)'
        ]);
        expect(menu.map((item) => item.id).join(' ')).not.toMatch(
            /maximise|restore|fold|split|embed/
        );
    });

    it('tells a float item from the pane menu fixed items', () => {
        for (const item of floatItems(free, words)) expect(isFloatItem(item.id)).toBe(true);
        expect(isFloatItem('float')).toBe(true);
        for (const id of ['close', 'maximise', 'restore', 'fold', 'split_right', 'split_down']) {
            expect(isFloatItem(id)).toBe(false);
        }
    });

    it('offers a page pane Float only while it holds a tab', () => {
        const withTab = stripMenu({ holdsTab: true, panes: 1 }, words).map((item) => item.label);
        const without = stripMenu({ holdsTab: false, panes: 1 }, words).map((item) => item.label);
        expect(withTab).toContain('@ui.float');
        expect(without).not.toContain('@ui.float');
    });

    it('runs each pick through the layout: float the pane, dock, free, return', () => {
        const calls: string[] = [];
        const deps: StripDeps = {
            splitInstance: () => calls.push('split'),
            openPalette: () => undefined,
            close: () => calls.push('close'),
            newTerminalIn: () => undefined,
            floatPane: (path, page) => calls.push(`float ${page} [${path.join(',')}]`),
            dockFloat: (id, edge) => calls.push(`dock ${id} ${edge}`),
            freeFloat: (id) => calls.push(`free ${id}`),
            returnFloat: (id) => calls.push(`return ${id}`)
        };
        const page = stripMenu({ holdsTab: true, panes: 2 }, words);
        const id = (items: typeof page, label: string): string =>
            items.find((item) => item.label === label)?.id ?? '';
        stripPicked(id(page, '@ui.float'), { active: 't', path: [1], page: 'p' }, deps);
        const docked = stripMenu({ holdsTab: true, panes: 1, float: right }, words);
        const onFloat = { active: 't', path: [], page: 'fl' };
        stripPicked(id(docked, '@ui.float_dock_left'), onFloat, deps);
        stripPicked(id(docked, '@ui.float'), onFloat, deps);
        stripPicked(id(docked, '@ui.float_return'), onFloat, deps);
        expect(calls).toEqual(['float p [1]', 'dock fl left', 'free fl', 'return fl']);
    });
});
