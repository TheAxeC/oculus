// Layer 3, shell test. The right-click menu of a pane's strip and of an empty pane's body, built by
// shell/panes/pane-view.ts's stripMenu, and the edge each of its four splits hands splitInstance.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menu opened by a right-click on the strip or the body, the palette
// it opens and the terminal it starts, which need a DOM and are seen at the look.

import { beforeAll, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import {
    floatItems,
    floatMenu,
    isFloatItem,
    isPaneItem,
    paneMenu,
    stripEdge,
    stripMenu,
    stripPicked,
    type StripDeps
} from '../../../src/lib/shell/panes/pane-view.ts';
import {
    newTextFileOpener,
    untitledLabel
} from '../../../src/lib/state/workbench/layout/open/new-text-file.ts';
import type { FloatPlace } from '../../../src/lib/state/workbench/layout/index.ts';
import type { MenuItem } from '../../../src/lib/ui/menu/menu-items.ts';

/** The float operations of a StripDeps, for a case that picks no float item. */
const NO_FLOAT = {
    floatPane: () => undefined,
    dockFloat: () => undefined,
    freeFloat: () => undefined,
    returnFloat: () => undefined
};

/** The operations of a StripDeps this file's cases do not pick. */
const NO_SETTINGS = {
    newTextFileIn: () => undefined,
    setLocked: () => undefined,
    setAppearance: () => undefined
};

beforeAll(() => setCatalog(textCatalog(loadConfig(engineDir()).config)));

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

describe('the pane strip menu', () => {
    // Revert: drop the Close group from stripMenu.
    it('offers a pane holding a tab on a page of two panes every item', () => {
        expect(stripMenu({ holdsTab: true, panes: 2 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_new_text_file',
            '@ui.strip_split_up',
            '@ui.strip_split_down',
            '@ui.strip_split_left',
            '@ui.strip_split_right',
            '@ui.float',
            '@ui.strip_lock',
            '@ui.strip_tab_bar',
            '@ui.strip_editor_actions',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
    });

    // Revert: offer the splits in stripMenu whatever `holdsTab` says.
    it('offers an empty pane alone on its page Open File and New Terminal', () => {
        expect(stripMenu({ holdsTab: false, panes: 1 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_new_text_file',
            '@ui.strip_lock',
            '@ui.strip_tab_bar',
            '@ui.strip_editor_actions',
            '@ui.strip_new_terminal'
        ]);
    });

    // Revert: ignore `locked` in stripMenu.
    it('offers Unlock Group on a locked pane, the empty one included', () => {
        for (const holdsTab of [true, false]) {
            const labels = stripMenu({ holdsTab, panes: 2, locked: true }, words).map(
                (item) => item.label
            );
            expect(labels).toContain('@ui.strip_unlock');
            expect(labels).not.toContain('@ui.strip_lock');
        }
    });

    // Revert: take Lock Group and Unlock Group away from a float's strip.
    it("offers Lock Group on a float's strip, and Unlock Group once the pane is locked", () => {
        const free: FloatPlace = { kind: 'free', x: 0.1, y: 0.1, w: 0.3, h: 0.4 };
        const open = stripMenu({ holdsTab: true, panes: 1, float: free }, words).map(
            (item) => item.label
        );
        expect(open).toContain('@ui.strip_lock');
        expect(open).not.toContain('@ui.strip_unlock');
        const shut = stripMenu({ holdsTab: true, panes: 1, float: free, locked: true }, words).map(
            (item) => item.label
        );
        expect(shut).toContain('@ui.strip_unlock');
        expect(shut).not.toContain('@ui.strip_lock');
    });

    // Revert: drop the `active` mark from the Tab Bar and Editor Actions Position submenus.
    it('offers Tab Bar and Editor Actions Position as submenus marking the setting in force', () => {
        const menu = stripMenu(
            { holdsTab: true, panes: 1, tabBar: 'single', actions: 'hidden' },
            words
        );
        const bar = menu.find((item) => item.label === '@ui.strip_tab_bar');
        const actions = menu.find((item) => item.label === '@ui.strip_editor_actions');
        expect(bar?.items?.map((item) => [item.label, item.active === true])).toEqual([
            ['@ui.tab_bar_multiple', false],
            ['@ui.tab_bar_single', true],
            ['@ui.tab_bar_none', false]
        ]);
        expect(actions?.items?.map((item) => [item.label, item.checked])).toEqual([
            ['@ui.editor_actions_tab_bar', false],
            ['@ui.editor_actions_hidden', true]
        ]);
        const fresh = stripMenu({ holdsTab: true, panes: 1 }, words);
        const marks = (label: string) =>
            fresh.find((item) => item.label === label)?.items?.map((item) => item.active === true);
        expect(marks('@ui.strip_tab_bar')).toEqual([true, false, false]);
        expect(marks('@ui.strip_editor_actions')).toEqual([true, false]);
    });
});

describe('the edge a split takes', () => {
    // Revert: map 'split-up' to 'bottom' in STRIP_SPLITS.
    it('splits left on the left edge and up on the top edge', () => {
        const items = stripMenu({ holdsTab: true, panes: 1 }, words);
        const edges = items.map((item) => stripEdge(item.id));
        expect(edges).toEqual([
            null,
            null,
            'top',
            'bottom',
            'left',
            'right',
            null,
            null,
            null,
            null,
            null
        ]);
    });

    // Revert: pass `pane.path` as [] to splitInstance in stripPicked.
    it('hands splitInstance the active tab, the pane, the edge and the page', () => {
        const calls: unknown[][] = [];
        const deps = {
            ...NO_FLOAT,
            ...NO_SETTINGS,
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
            ...NO_SETTINGS,
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

    // Revert: drop the path from newTextFileIn, or lock the pane the menu was not opened on.
    it('opens a text file in the pane, locks and unlocks it, and writes the two settings', () => {
        const calls: string[] = [];
        const deps = {
            ...NO_FLOAT,
            splitInstance: () => undefined,
            openPalette: () => undefined,
            close: () => undefined,
            newTerminalIn: () => undefined,
            newTextFileIn: (page: string, path: number[]) =>
                calls.push(`text:${page}:${path.join('.')}`),
            setLocked: (page: string, path: number[], locked: boolean) =>
                calls.push(`lock:${page}:${path.join('.')}:${locked}`),
            setAppearance: (key: string, value: string) => calls.push(`set:${key}=${value}`)
        };
        const pane = { active: 'tab-1', path: [1], page: 'p' };
        const open = stripMenu({ holdsTab: true, panes: 2 }, words);
        const locked = stripMenu({ holdsTab: true, panes: 2, locked: true }, words);
        const id = (items: typeof open, label: string): string =>
            items.find((item) => item.label === label)?.id ?? '';
        const sub = (items: typeof open, label: string, inner: string): string =>
            items.find((item) => item.label === label)?.items?.find((one) => one.label === inner)
                ?.id ?? '';
        stripPicked(id(open, '@ui.strip_new_text_file'), pane, deps);
        stripPicked(id(open, '@ui.strip_lock'), pane, deps);
        stripPicked(id(locked, '@ui.strip_unlock'), pane, deps);
        stripPicked(sub(open, '@ui.strip_tab_bar', '@ui.tab_bar_single'), pane, deps);
        stripPicked(sub(open, '@ui.strip_tab_bar', '@ui.tab_bar_none'), pane, deps);
        stripPicked(sub(open, '@ui.strip_tab_bar', '@ui.tab_bar_multiple'), pane, deps);
        stripPicked(sub(open, '@ui.strip_editor_actions', '@ui.editor_actions_hidden'), pane, deps);
        stripPicked(
            sub(open, '@ui.strip_editor_actions', '@ui.editor_actions_tab_bar'),
            pane,
            deps
        );
        expect(calls).toEqual([
            'text:p:1',
            'lock:p:1:true',
            'lock:p:1:false',
            'set:show_tabs=single',
            'set:show_tabs=none',
            'set:show_tabs=multiple',
            'set:editor_actions=hidden',
            'set:editor_actions=strip'
        ]);
    });
});

describe('New Text File', () => {
    // Revert: open the tab without `untitled: true`, so the source tab asks the server for a file.
    it('opens an untitled text in a source tab of the pane the menu was opened on', () => {
        const calls: unknown[][] = [];
        const open = newTextFileOpener(
            (...args: unknown[]) => {
                calls.push(args);
                return 'tab-9';
            },
            () => ['Untitled-1', 'notes.md']
        );
        open('p', [1, 0]);
        expect(calls).toEqual([['source', { untitled: true, label: 'Untitled-2' }, 'p', [1, 0]]]);
    });

    it('names the lowest number no open tab holds', () => {
        expect(untitledLabel([])).toBe('Untitled-1');
        expect(untitledLabel(['Untitled-2', 'Untitled-1', 'Untitled-4'])).toBe('Untitled-3');
        expect(untitledLabel(['Untitled-0', 'Untitled-x'])).toBe('Untitled-1');
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
            '@ui.strip_new_text_file',
            '@ui.float_dock_left',
            '@ui.float_dock_right',
            '@ui.float_dock_bottom',
            '@ui.float_return',
            '@ui.strip_lock',
            '@ui.strip_tab_bar',
            '@ui.strip_editor_actions',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
        expect(free_.some((label) => label.includes('split'))).toBe(false);
    });

    it('offers a float docked right the other docks, Float and Return to Page', () => {
        expect(labels(right)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_new_text_file',
            '@ui.float_dock_left',
            '@ui.float_dock_bottom',
            '@ui.float',
            '@ui.float_return',
            '@ui.strip_lock',
            '@ui.strip_tab_bar',
            '@ui.strip_editor_actions',
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
            ...NO_SETTINGS,
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

describe('the strip menu with the editor actions hidden', () => {
    const page = (id: string) => ({
        id,
        label: id.toUpperCase(),
        workbench: { root: { kind: 'pane' as const, tabs: [], active: '' } }
    });
    const pages = [page('a'), page('b'), page('c')];

    /** Every item id of a menu, the ones inside a choice included. */
    function every(items: readonly MenuItem[]): string[] {
        return items.flatMap((item) => [item.id, ...every(item.items ?? [])]);
    }

    /** The strip menu's item that does what a pane menu item does, where the ids differ. */
    const SAME = { split_right: 'split-right', split_down: 'split-down' } as Record<string, string>;

    // Revert: leave the pane menu's items out of stripMenu when the actions are hidden.
    it.each([
        [false, false],
        [false, true],
        [true, false],
        [true, true]
    ])(
        'holds every item of the pane menu of a page pane holding a tab (maximised %s, foldable %s)',
        (maximised, foldable) => {
            const pane = paneMenu(
                { pages, screen: 'a', host: 'a', maximised, foldable, holdsTab: true },
                words
            );
            const strip = stripMenu(
                { holdsTab: true, panes: 1, actions: 'hidden', paneItems: pane },
                words
            );
            const reachable = new Set(every(strip));
            for (const id of every(pane)) expect(reachable.has(SAME[id] ?? id), id).toBe(true);
            expect(every(pane)).toContain(maximised ? 'restore' : 'maximise');
            expect(every(pane).includes('fold')).toBe(foldable);
        }
    );

    // Revert: leave the pane menu's items out of stripMenu when the actions are hidden.
    it('holds every item of the pane menu of a float', () => {
        const place: FloatPlace = { kind: 'dock', edge: 'right', size: 0.3 };
        const pane = paneMenu(
            {
                float: place,
                pages,
                screen: 'a',
                host: 'f',
                maximised: false,
                foldable: false,
                holdsTab: true
            },
            words
        );
        const strip = stripMenu(
            { holdsTab: true, panes: 1, float: place, actions: 'hidden', paneItems: pane },
            words
        );
        const reachable = new Set(every(strip));
        for (const id of every(pane)) expect(reachable.has(id), id).toBe(true);
    });

    // Revert: offer Close only while the page holds more than one pane, whatever the actions.
    it('offers Close on a page of one pane, which the pane menu offers', () => {
        const hidden = stripMenu({ holdsTab: true, panes: 1, actions: 'hidden' }, words);
        expect(hidden.map((item) => item.label)).toContain('@ui.strip_close');
        const strip = stripMenu({ holdsTab: true, panes: 1, actions: 'strip' }, words);
        expect(strip.map((item) => item.label)).not.toContain('@ui.strip_close');
    });

    // Revert: add the pane items to the strip menu whatever the setting.
    it('adds none of them while the actions are drawn', () => {
        const pane = paneMenu(
            { pages, screen: 'a', host: 'a', maximised: false, foldable: true, holdsTab: true },
            words
        );
        const strip = stripMenu(
            { holdsTab: true, panes: 2, actions: 'strip', paneItems: pane },
            words
        );
        const reachable = new Set(every(strip));
        for (const id of ['maximise', 'fold', 'move-to-page', 'show-a-page']) {
            expect(reachable.has(id), id).toBe(false);
        }
    });

    it('tells the pane menu items the strip repeats from the strip menu ones', () => {
        for (const id of ['maximise', 'restore', 'fold', 'page:b', 'embed:b']) {
            expect(isPaneItem(id), id).toBe(true);
        }
        for (const id of ['close', 'split-up', 'float', 'lock', 'tab-bar:single', 'new-terminal']) {
            expect(isPaneItem(id), id).toBe(false);
        }
    });
});
