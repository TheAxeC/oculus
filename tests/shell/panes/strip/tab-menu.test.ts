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

describe('the closes of the tab menu, through its state', () => {
    afterEach(() => vi.unstubAllGlobals());

    /**
     * A pane of the tabs a, b, c and d on the real stores: `b` holds unsaved text and `d` is a
     * terminal running python. The menu is the tab menu's state over the pane's close question, and
     * a right-click on the tab named is read before the pick, as the strip does. With `autosave`
     * the ui store has a saver that records the ids a close hands it and, when it `takes` them,
     * leaves them with no unsaved text, as the autosave store does for a tab its mode covers.
     */
    function menuOver(withTerminal = true, autosave?: { takes: boolean }) {
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
        const dirty = new Set(['b']);
        const handed: string[][] = [];
        client.ui.registerUnsaved((id) => dirty.has(id));
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
        return { question, pick, open, handed };
    }

    it('asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing', async () => {
        const { question, pick, open } = menuOver(false);
        await pick('close-others', 'a');
        expect(question.message()).toBe(
            `${catalog('ui.tab_close_many', 2)} ${catalog('ui.terminal_close_unsaved', 'tab b')}`
        );
        question.cancel();
        expect(open()).toEqual(['a', 'b', 'c']);
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
