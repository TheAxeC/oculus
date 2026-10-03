// Layer 3, shell test. The right-click menu of a tab (shell/panes/strip/tab-menu.ts): its items and
// their groups for a file tab, a tab that names no file, a preview tab and a pane of one tab, which
// tabs each close item closes when a pinned tab is among them, what a pick of an item calls, the
// closes through the menu's state (strip/tab-menu-state.svelte.ts) over the pane's close question
// (strip/close-question.svelte.ts) on the real stores, and the two copies of a file's path.
//
// The words are a stand-in `t` that answers each key as `@key`, except in the closes through the
// state, which read the catalog.
//
// What this does NOT cover: the menu opened by a right-click on a tab, the dialog that draws the
// close question and the clipboard itself, which need a DOM and are seen at the look.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    copyTabPath,
    tabMenu,
    tabPicked,
    tabsToClose,
    type TabFacts,
    type TabPickDeps
} from '../../../../src/lib/shell/panes/strip/tab-menu.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { createCloseQuestion } from '../../../../src/lib/shell/panes/strip/close-question.svelte.ts';
import { createTabMenu } from '../../../../src/lib/shell/panes/strip/tab-menu-state.svelte.ts';
import { serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import { createClientState } from '../../../fixtures/client.ts';
import {
    fakeStorage,
    heldPages,
    pageAround
} from '../../../state/workbench/layout/layout-fixture.ts';

const catalogWords = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalogWords);

/** The catalog's sentence for a key, its `{n}` filled from the arguments. */
function catalog(key: string, ...args: (string | number)[]): string {
    return catalogWords[key].replace(/\{(\d+)\}/g, (_all, at: string) => String(args[Number(at)]));
}

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

/** A tab among three, none pinned or a preview, naming no file. */
const PLAIN: TabFacts = {
    pinned: false,
    preview: false,
    file: false,
    tabs: 3,
    right: 1,
    compareWith: false
};

const labels = (facts: TabFacts) => tabMenu(facts, words).map((item) => item.label);

describe('the items of a tab menu', () => {
    // Revert: leave the file group out of tabMenu.
    it('offers a file tab every group, in VS Code order', () => {
        expect(labels({ ...PLAIN, file: true })).toEqual([
            '@ui.tab_close',
            '@ui.tab_close_others',
            '@ui.tab_close_right',
            '@ui.tab_close_saved',
            '@ui.tab_close_all',
            '@files.menu_copy_path',
            '@files.menu_copy_relative',
            '@files.menu_reveal',
            '@ui.tab_show_in_files',
            '@files.menu_select_compare',
            '@ui.tab_keep_open',
            '@ui.tab_pin',
            '@ui.tab_split_right',
            '@ui.tab_split_move'
        ]);
    });

    it('offers Compare with Selected before Select for Compare once another file is selected', () => {
        const found = labels({ ...PLAIN, file: true, compareWith: true });
        expect(found).toContain('@files.menu_compare_with');
        expect(found.indexOf('@files.menu_compare_with')).toBe(
            found.indexOf('@files.menu_select_compare') - 1
        );
    });

    it('offers a tab that names no file the close, keep, pin and split groups alone', () => {
        expect(labels(PLAIN)).toEqual([
            '@ui.tab_close',
            '@ui.tab_close_others',
            '@ui.tab_close_right',
            '@ui.tab_close_saved',
            '@ui.tab_close_all',
            '@ui.tab_keep_open',
            '@ui.tab_pin',
            '@ui.tab_split_right',
            '@ui.tab_split_move'
        ]);
    });

    it('draws a rule above the first item of each group but the first', () => {
        const items = tabMenu({ ...PLAIN, file: true }, words);
        expect(items.filter((item) => item.rule === true).map((item) => item.label)).toEqual([
            '@files.menu_copy_path',
            '@files.menu_reveal',
            '@files.menu_select_compare',
            '@ui.tab_keep_open',
            '@ui.tab_split_right'
        ]);
    });

    it('offers Unpin on a pinned tab and Pin on any other', () => {
        expect(labels({ ...PLAIN, pinned: true })).toContain('@ui.tab_unpin');
        expect(labels({ ...PLAIN, pinned: true })).not.toContain('@ui.tab_pin');
        expect(labels(PLAIN)).toContain('@ui.tab_pin');
    });

    it('enables Keep Open on a preview tab alone', () => {
        const keep = (facts: TabFacts) =>
            tabMenu(facts, words).find((item) => item.label === '@ui.tab_keep_open')?.disabled;
        expect(keep({ ...PLAIN, preview: true })).toBeFalsy();
        expect(keep(PLAIN)).toBe(true);
    });

    it('disables Close Others for the only tab of a pane, and Close to the Right for the last', () => {
        const state = (facts: TabFacts, label: string) =>
            tabMenu(facts, words).find((item) => item.label === label)?.disabled;
        expect(state({ ...PLAIN, tabs: 1, right: 0 }, '@ui.tab_close_others')).toBe(true);
        expect(state({ ...PLAIN, tabs: 1, right: 0 }, '@ui.tab_close_right')).toBe(true);
        expect(state(PLAIN, '@ui.tab_close_others')).toBeFalsy();
        expect(state(PLAIN, '@ui.tab_close_right')).toBeFalsy();
    });

    it('holds the four splits of Split & Move under their own submenu', () => {
        const move = tabMenu(PLAIN, words).find((item) => item.label === '@ui.tab_split_move');
        expect(move?.items?.map((item) => item.label)).toEqual([
            '@ui.tab_split_up',
            '@ui.tab_split_down',
            '@ui.tab_split_left',
            '@ui.tab_split_right'
        ]);
    });
});

describe('a pick of the tab menu', () => {
    /** The calls a pick made, one entry per call, named by the dependency it reached. */
    function pickedAs(id: string): string[] {
        const calls: string[] = [];
        const noted =
            (name: string) =>
            (...args: unknown[]): void => {
                calls.push([name, ...args.map(String)].join(' '));
            };
        const deps: TabPickDeps = {
            close: noted('close'),
            copy: noted('copy'),
            reveal: noted('reveal'),
            showInFiles: noted('showInFiles'),
            selectForCompare: noted('selectForCompare'),
            compareWith: noted('compareWith'),
            keepOpen: noted('keepOpen'),
            pin: noted('pin'),
            unpin: noted('unpin'),
            split: noted('split')
        };
        tabPicked(id, deps);
        return calls;
    }

    // Revert: leave one close kind out of the pick's dispatch.
    it('asks for the close each close item names', () => {
        expect(pickedAs('close')).toEqual(['close close']);
        expect(pickedAs('close-others')).toEqual(['close others']);
        expect(pickedAs('close-right')).toEqual(['close right']);
        expect(pickedAs('close-saved')).toEqual(['close saved']);
        expect(pickedAs('close-all')).toEqual(['close all']);
    });

    // Revert: send Split Right to the left edge.
    it('splits to the edge each split item names', () => {
        expect(pickedAs('split-right')).toEqual(['split right']);
        expect(pickedAs('split-move-up')).toEqual(['split top']);
        expect(pickedAs('split-move-down')).toEqual(['split bottom']);
        expect(pickedAs('split-move-left')).toEqual(['split left']);
        expect(pickedAs('split-move-right')).toEqual(['split right']);
    });
});

describe('the tabs each close item closes', () => {
    const tabs = [{ id: 'p', pinned: true as const }, { id: 'a' }, { id: 'b' }, { id: 'c' }];
    const saved = (id: string): boolean => id !== 'b';

    // Revert: close the pinned tab too in tabsToClose.
    it('keeps the pinned tab and the chosen one on Close Others, and keeps the chosen one', () => {
        expect(tabsToClose('others', tabs, 'b', saved)).toEqual({ ids: ['a', 'c'], keep: 'b' });
    });

    it('closes the unpinned tabs to the right of a pinned tab on Close to the Right', () => {
        expect(tabsToClose('right', tabs, 'p', saved)).toEqual({
            ids: ['a', 'b', 'c'],
            keep: 'p'
        });
        expect(tabsToClose('right', tabs, 'a', saved)).toEqual({ ids: ['b', 'c'], keep: 'a' });
    });

    it('closes the saved unpinned tabs on Close Saved', () => {
        expect(tabsToClose('saved', tabs, 'a', saved)).toEqual({ ids: ['a', 'c'], keep: null });
    });

    it('closes every unpinned tab on Close All', () => {
        expect(tabsToClose('all', tabs, 'a', saved)).toEqual({
            ids: ['a', 'b', 'c'],
            keep: null
        });
    });

    // Revert: skip the pinned test in the close item.
    it('closes a pinned tab on Close, which is the only close that does', () => {
        expect(tabsToClose('close', tabs, 'p', saved)).toEqual({ ids: ['p'], keep: null });
    });
});

describe('the closes of the tab menu, through its state', () => {
    afterEach(() => vi.unstubAllGlobals());

    /**
     * A pane of the tabs a, b, c and d on the real stores: `b` holds unsaved text and `d` is a
     * terminal running python. The menu is the tab menu's state over the pane's close question, and
     * a right-click on the tab named is read before the pick, as the strip does.
     */
    function menuOver(withTerminal = true) {
        const client = createClientState();
        const tab = (id: string, view: string) => ({ id, view, state: {} });
        const pane = {
            kind: 'pane' as const,
            tabs: [
                tab('a', 'source'),
                tab('b', 'source'),
                tab('c', 'source'),
                ...(withTerminal ? [tab('d', 'terminal')] : [])
            ],
            active: 'a'
        };
        client.layout.loadLayout(
            fakeStorage(serialiseLayout(heldPages([pageAround('main', pane)], [])))
        );
        client.ui.registerUnsaved((id) => id === 'b');
        client.ui.registerTerminalOwner({
            running: (held) => held.filter((one) => one.view === 'terminal').map((one) => one.id),
            busy: (ids) =>
                Promise.resolve(ids.map((id) => ({ id, name: 'shell', command: 'python' }))),
            end: () => undefined
        });
        const page = client.layout.currentPage().id;
        const instances = () =>
            client.layout.layout(page).kind === 'pane'
                ? (client.layout.layout(page) as typeof pane).tabs
                : [];
        const question = createCloseQuestion({
            client,
            instances,
            labelOf: (id) => `tab ${id}`,
            page: () => page
        });
        const menu = createTabMenu({
            client,
            instances,
            page: () => page,
            path: () => [],
            roots: () => [],
            stripItems: () => [],
            stripPick: () => undefined,
            closeTab: question.closeTab,
            askAndClose: question.askAndClose
        });
        class Target {
            constructor(private readonly id: string) {}
            closest() {
                return { dataset: { tab: this.id } };
            }
        }
        vi.stubGlobal('Element', Target);
        const pick = async (id: string, on: string): Promise<void> => {
            menu.read({ target: new Target(on) } as unknown as MouseEvent);
            menu.pick(id);
            for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
        };
        const open = (): string[] => instances().map((one) => one.id);
        return { question, pick, open };
    }

    // Revert: have close() call layout.closeInstance for each tab without the question.
    it('asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing', async () => {
        const { question, pick, open } = menuOver(false);
        await pick('close-others', 'a');
        expect(question.message()).toBe(
            `${catalog('ui.tab_close_many', 2)} ${catalog('ui.terminal_close_unsaved', 'tab b')}`
        );
        question.cancel();
        expect(open()).toEqual(['a', 'b', 'c']);
    });

    it('closes the tabs once the question is answered yes', async () => {
        const { question, pick, open } = menuOver(false);
        await pick('close-others', 'a');
        question.confirmed();
        expect(open()).toEqual(['a']);
    });

    // Revert: have close() call layout.closeInstance for each tab without the question.
    it('asks about the terminal running a program among the tabs an item closes', async () => {
        const { question, pick, open } = menuOver();
        await pick('close-right', 'c');
        expect(question.message()).toContain(
            catalog('ui.terminal_busy_running', 'shell', 'python')
        );
        question.cancel();
        expect(open()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('names the tabs holding unsaved text when a terminal running a program is closed with them', async () => {
        const { question, pick } = menuOver();
        await pick('close-all', 'a');
        expect(question.message()).toContain(catalog('ui.terminal_close_unsaved', 'tab b'));
        question.cancel();
    });

    it('closes a saved tab at once on Close, asking nothing', async () => {
        const { question, pick, open } = menuOver();
        await pick('close', 'c');
        expect(question.message()).toBeNull();
        expect(open()).toEqual(['a', 'b', 'd']);
    });
});

describe('copying the path of a file tab', () => {
    /** A clipboard write that waits for the case to settle it. */
    function pending() {
        const writes: string[] = [];
        const settle: ((refused: boolean) => void)[] = [];
        const write = (text: string): Promise<void> => {
            writes.push(text);
            return new Promise((resolve, reject) => {
                settle.push((refused) => (refused ? reject(new Error('denied')) : resolve()));
            });
        };
        return { writes, settle, write };
    }

    // Revert: copy the absolute path whichever item is picked.
    it('writes the path under the root for Copy Relative Path and the absolute one for Copy Path', async () => {
        const copied: string[] = [];
        const copy = copyTabPath(
            (text) => {
                copied.push(text);
                return Promise.resolve();
            },
            () => undefined,
            words
        );
        const file = { root: 'hub', path: 'projects/x/README.md' };
        await copy('relative', file, '/Users/a/research-hub');
        await copy('absolute', file, '/Users/a/research-hub');

        expect(copied).toEqual([
            'projects/x/README.md',
            '/Users/a/research-hub/projects/x/README.md'
        ]);
    });

    it('says the refusal sentence when the clipboard refuses the write', async () => {
        const said: string[] = [];
        const copy = copyTabPath(
            () => Promise.reject(new Error('denied')),
            (sentence) => said.push(sentence),
            words
        );
        await copy('absolute', { root: 'hub', path: 'a.md' }, '/w');
        expect(said).toEqual(['@ui.tab_copy_refused']);
    });

    it('writes the second text when a second copy comes while the first is in flight', async () => {
        const held = pending();
        const said: string[] = [];
        const copy = copyTabPath(held.write, (sentence) => said.push(sentence), words);
        const first = copy('absolute', { root: 'hub', path: 'a.md' }, '/w');
        const second = copy('relative', { root: 'hub', path: 'b.md' }, '/w');

        expect(held.writes).toEqual(['/w/a.md', 'b.md']);
        held.settle[0](true);
        held.settle[1](false);
        await Promise.all([first, second]);
        // The first copy was replaced by the second, so its refusal is not said.
        expect(said).toEqual([]);
    });
});
