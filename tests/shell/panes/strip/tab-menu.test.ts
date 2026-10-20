// Layer 3, shell test. The right-click menu of a tab (shell/panes/strip/tab-menu.ts): the closes
// through the menu's state (strip/tab-menu-state.svelte.ts) over the pane's close question
// (strip/close-question.svelte.ts) on the real stores.
//
// What this does NOT cover: the menu opened by a right-click on a tab, the dialog that draws the
// close question, which need a DOM and are seen at the look.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { createCloseQuestion } from '../../../../src/lib/shell/panes/strip/close-question.svelte.ts';
import { createTabMenu } from '../../../../src/lib/shell/panes/strip/tab-menu-state.svelte.ts';
import {
    admittedPage,
    heldPages,
    openSaved,
    pageAround
} from '../../../state/workbench/layout/layout-fixture.ts';

const catalogWords = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalogWords);

/** The catalog's sentence for a key, its `{n}` filled from the arguments. */
function catalog(key: string, ...args: (string | number)[]): string {
    return catalogWords[key].replace(/\{(\d+)\}/g, (_all, at: string) => String(args[Number(at)]));
}

describe('the closes of the tab menu, through its state', () => {
    afterEach(() => vi.unstubAllGlobals());

    /**
     * A pane of the tabs a, b, c and d on the real stores: `b` holds unsaved text (or the tabs
     * `held.dirty` names) and `d` is a terminal running python. The menu is the tab menu's state
     * over the pane's close question, and a right-click on the tab named is read before the pick,
     * as the strip does. With `autosave` the ui store has a saver that records the ids a close
     * hands it and, when it `takes` them, leaves them with no unsaved text, as the autosave store
     * does for a tab its mode covers. `held.saves` gives a tab the save a close question's Save
     * runs: true writes it and takes its unsaved text, false is a save that failed, and a tab it
     * does not name has no save, as an untitled tab has none.
     */
    function menuOver(
        withTerminal = true,
        autosave?: { takes: boolean },
        held: { dirty?: string[]; saves?: Record<string, boolean> } = {}
    ) {
        const client = admittedPage();
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
        openSaved(client, heldPages([pageAround('main', pane)], []));
        const dirty = new Set(held.dirty ?? ['b']);
        const handed: string[][] = [];
        const saved: string[] = [];
        client.ui.registerUnsaved((id) => dirty.has(id));
        client.ui.registerCloseSave((id) => {
            const takes = held.saves?.[id];
            if (takes === undefined) return null;
            saved.push(id);
            if (takes) dirty.delete(id);
            return Promise.resolve(takes);
        });
        if (autosave !== undefined) {
            client.ui.registerSaveBeforeClose((ids) => {
                handed.push(ids);
                if (autosave.takes) for (const id of ids) dirty.delete(id);
                return Promise.resolve();
            });
        }
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
        /** The closes a pick started, each settled once its tabs closed or its question is put. */
        const closes: Promise<void>[] = [];
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
            closeTab: (id) => void closes.push(question.closeTab(id)),
            askAndClose: (...args) => {
                const closing = question.askAndClose(...args);
                closes.push(closing);
                return closing;
            }
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
            await Promise.all(closes);
        };
        const open = (): string[] => instances().map((one) => one.id);
        return { question, pick, open, handed, saved, dirty };
    }

    type Unsaved = {
        row: string;
        held: { dirty?: string[]; saves?: Record<string, boolean> };
        item: string;
        on: string;
        asks: string;
        answer: 'cancel' | 'save' | 'dont-save';
        saved: string[];
        open: string[];
        left: string[];
    };

    const UNSAVED: Unsaved[] = [
        {
            row: 'Close Others over a tab holding unsaved text names it, and Cancel closes nothing',
            held: {},
            item: 'close-others',
            on: 'a',
            asks: `${catalog('ui.tab_close_dirty')} ${catalog('ui.terminal_close_unsaved', 'tab b')}`,
            answer: 'cancel',
            saved: [],
            open: ['a', 'b', 'c'],
            left: ['b']
        },
        {
            row: 'Close of a tab holding unsaved text, and Save writes it and closes the tab',
            held: { saves: { b: true } },
            item: 'close',
            on: 'b',
            asks: catalog('ui.tab_close_dirty'),
            answer: 'save',
            saved: ['b'],
            open: ['a', 'c'],
            left: []
        },
        {
            row: "Close of a tab holding unsaved text, and Don't Save closes it without writing it",
            held: { saves: { b: true } },
            item: 'close',
            on: 'b',
            asks: catalog('ui.tab_close_dirty'),
            answer: 'dont-save',
            saved: [],
            open: ['a', 'c'],
            left: ['b']
        },
        {
            row: 'Close All, and Save keeps open with its text a tab whose save failed or that has no save',
            held: { dirty: ['a', 'b', 'c'], saves: { a: true, b: false } },
            item: 'close-all',
            on: 'a',
            asks: `${catalog('ui.tabs_close_dirty', 3)} ${catalog('ui.terminal_close_unsaved', 'tab a, tab b, tab c')}`,
            answer: 'save',
            saved: ['a', 'b'],
            open: ['b', 'c'],
            left: ['b', 'c']
        }
    ];

    it.each(UNSAVED)('asks to save the unsaved text a close takes: $row', async (row) => {
        const { question, pick, open, saved, dirty } = menuOver(false, undefined, row.held);
        await pick(row.item, row.on);
        expect([question.message(), question.saves()]).toEqual([row.asks, true]);
        if (row.answer === 'cancel') question.cancel();
        if (row.answer === 'dont-save') question.confirmed();
        if (row.answer === 'save') await question.save();
        expect([saved.sort(), open(), [...dirty].sort(), question.message()]).toEqual([
            row.saved,
            row.open,
            row.left,
            null
        ]);
    });

    it('asks about the terminal running a program among the tabs an item closes', async () => {
        const { question, pick, open } = menuOver();
        await pick('close-right', 'c');
        expect(question.message()).toContain(
            catalog('ui.terminal_busy_running', 'shell', 'python')
        );
        question.cancel();
        expect(open()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('closes a tab holding unsaved text with no question once the autosave mode saved it', async () => {
        const { question, pick, open, handed } = menuOver(false, { takes: true });
        await pick('close', 'b');
        expect(handed).toEqual([['b']]);
        expect(question.message()).toBeNull();
        expect(open()).toEqual(['a', 'c']);
    });

    it('asks the question for a tab whose save the autosave mode refused, and closes nothing', async () => {
        const { question, pick, open, handed } = menuOver(false, { takes: false });
        await pick('close', 'b');
        expect(handed).toEqual([['b']]);
        expect(question.message()).toBe(catalog('ui.tab_close_dirty'));
        question.cancel();
        expect(open()).toEqual(['a', 'b', 'c']);
    });
});
