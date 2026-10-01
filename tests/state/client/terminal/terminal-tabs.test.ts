// Layer 4, client-state test. The terminals store keeping which Terminal tab owns which terminal,
// through the client's own wiring (state/client/context.ts hands it every page's Terminal tabs and
// the layout's restate, activate, switch, open and close): a terminal shown in the tab that owns
// it, on whichever page that is, or taken into the Terminal tab of the page on screen; a terminal
// moved from one tab to another; New putting the composer in the page's Terminal tab; and a
// terminal that ends leaving every tab that owned it, a tab left with none closing unless the
// reader is composing in it.
//
// What this does NOT cover: the tab's grid and its drag, which need a DOM the suite does not have,
// and the presses of the components that start a terminal, which a server render cannot make; the
// store call each of them makes is the one asserted here.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../../../src/lib/state/client/context.ts';
import { readTab } from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import {
    composerOf,
    composerWorkspace,
    offeredPlaces,
    splitState,
    withComposer,
    type ComposerRecord
} from '../../../../src/lib/state/sessions/terminal/composer.ts';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { openOwning, tabOf, terminalTabsOf } from './terminal-tabs-fixture.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';

// A page opened here is named from the catalog, so the real one is installed, and the glyph
// vocabulary the strip mark asks whether an icon is in.
setCatalog(textCatalog(loadConfig(engineDir()).config));
setGlyphs(glyphCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';
const D = 'd4d4d4-shell';
const E = 'e5e5e5-shell';

let client: ClientState;
let version = 0;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    version = 0;
});

afterEach(() => vi.unstubAllGlobals());

function terminal(id: string): Terminal {
    return {
        id,
        name: id,
        title: '',
        icon: '',
        color: '',
        kind: 'shell',
        cwd: '/hub',
        command: 'zsh',
        pid: 321,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null
    };
}

/** One `sessions` message listing these terminals, or carrying no list at all. */
function listed(ids: string[] | null): void {
    version += 1;
    const payload: Record<string, unknown> = { records: [], workspaces: [] };
    if (ids !== null) payload.terminals = ids.map(terminal);
    client.entities.receive({ channel: 'sessions', version, payload });
}

/** Every Terminal tab of every page, with the page and the state it holds. */
const terminalTabs = () => terminalTabsOf(client);

function holds(tab: string): boolean {
    return terminalTabs().some((one) => one.id === tab);
}

/** What one tab owns and shows, read through the tab's own reader. */
const tab = (id: string) => tabOf(client, id);

/** A Terminal tab on a page owning these terminals, the first shown. */
function owning(page: string, terminals: string[]): string {
    return openOwning(client, page, terminals);
}

/** A composer record a reader has chosen in a tab: a folder, Codex, an account and a pick. */
const CHOSEN: ComposerRecord = {
    workspace: '/work/elsewhere',
    agent: 'codex',
    accounts: { codex: 'work' },
    picks: { claude: {}, codex: { model: 'large' } }
};

/** A Terminal tab on a page owning these terminals and showing the composer alone, as New does. */
function composingOwning(page: string, terminals: string[]): string {
    const id = client.layout.openView(
        'terminal',
        { id: `composing-${terminals.join('-')}`, terminals, shown: null, composing: true },
        page
    );
    client.ui.setInstanceState(id, withComposer({ typed: 'held' }, CHOSEN));
    return id;
}

describe('a terminal moved to another tab', () => {
    it('joins the tab at the index and is shown there; the tab it left, holding nothing now, closes', () => {
        const page = client.layout.currentPage().id;
        const t1 = owning(page, [A, B]);
        const t2 = owning(page, [C]);
        listed([A, B, C]);
        client.terminals.moveTerminal(C, t1, page, 1);
        expect(tab(t1).terminals).toEqual([A, C, B]);
        expect(tab(t1).shown).toBe(C);
        expect(holds(t2)).toBe(false);
    });

    it('leaves a tab that still owns another terminal open', () => {
        const page = client.layout.currentPage().id;
        const t1 = owning(page, [A]);
        const t2 = owning(page, [B, C]);
        client.terminals.moveTerminal(C, t1, page, 1);
        expect(tab(t1).terminals).toEqual([A, C]);
        expect(tab(t2).terminals).toEqual([B]);
    });

    it('leaves a tab the reader is composing in open, its composer alone and its record kept', () => {
        const page = client.layout.currentPage().id;
        const t1 = owning(page, [A]);
        const composing = composingOwning(page, [B]);
        const before = JSON.stringify(client.ui.instanceState(composing));
        client.terminals.moveTerminal(B, t1, page, 1);
        expect(holds(composing)).toBe(true);
        expect(tab(composing)).toMatchObject({
            terminals: [],
            shown: null,
            row: [],
            composing: true
        });
        expect(JSON.stringify(client.ui.instanceState(composing))).toBe(before);
    });
});

describe('a terminal that ended', () => {
    it('leaves the tab that owned it, and a tab owning only it closes, on a page not on screen too', () => {
        const first = client.layout.currentPage().id;
        const t1 = owning(first, [A, B]);
        client.layout.openPage('Other');
        const other = client.layout.currentPage().id;
        expect(other).not.toBe(first);
        const onlyA = owning(first, [A]);
        const t3 = owning(other, [C]);
        listed([A, B, C]);
        client.selection.select(A);

        listed([B, C]);
        expect(tab(t1).terminals).toEqual([B]);
        expect(holds(onlyA)).toBe(false);
        expect(holds(t3)).toBe(true);
        expect(client.selection.selected()).toBe(null);
    });

    it('keeps a selection that was not the ended terminal', () => {
        const page = client.layout.currentPage().id;
        owning(page, [A]);
        listed([A, B]);
        client.selection.select(B);
        listed([B]);
        expect(client.selection.selected()).toBe(B);
    });

    it('does not reach a tab owning a terminal started here and not listed yet', () => {
        const page = client.layout.currentPage().id;
        const t1 = owning(page, [A]);
        listed([A]);
        const onD = owning(page, [D]);
        listed([A]);
        expect(holds(onD)).toBe(true);
        expect(holds(t1)).toBe(true);
    });

    it('leaves a tab the reader is composing in open, its composer alone and its record kept', () => {
        const page = client.layout.currentPage().id;
        const composing = composingOwning(page, [A]);
        const before = JSON.stringify(client.ui.instanceState(composing));
        listed([A]);
        listed([]);
        expect(holds(composing)).toBe(true);
        expect(tab(composing)).toMatchObject({
            terminals: [],
            shown: null,
            row: [],
            composing: true
        });
        expect(JSON.stringify(client.ui.instanceState(composing))).toBe(before);
    });

    it('clears at the first message a selected terminal no tab owns that the message does not list', () => {
        client.selection.select(E);
        listed([A]);
        expect(client.selection.selected()).toBe(null);
    });

    it('keeps at the first message a selected terminal no tab owns that the message lists', () => {
        client.selection.select(A);
        listed([A]);
        expect(client.selection.selected()).toBe(A);
    });

    it('closes at the first message when that message does not list it', () => {
        const page = client.layout.currentPage().id;
        const onC = owning(page, [C]);
        listed([]);
        expect(holds(onC)).toBe(false);
    });

    it('closes nothing on a message that carries no terminal list', () => {
        const page = client.layout.currentPage().id;
        const onA = owning(page, [A]);
        listed([A]);
        listed(null);
        expect(holds(onA)).toBe(true);
    });

    it('leaves a tab that never held a terminal showing its composer', () => {
        const page = client.layout.currentPage().id;
        const fresh = client.layout.openView('terminal', { id: 'fresh-one' }, page);
        listed([A]);
        listed([]);
        expect(holds(fresh)).toBe(true);
        expect(tab(fresh).composing).toBe(true);
    });
});

describe('showing a terminal', () => {
    it('switches to the page of the tab that owns it, activates that tab and shows it', () => {
        const p1 = client.layout.currentPage().id;
        client.layout.openPage('Other');
        const p2 = client.layout.currentPage().id;
        const t2 = owning(p2, [B, C]);
        client.layout.switchPage(p1);
        owning(p1, [A]);
        expect(client.layout.currentPage().id).toBe(p1);

        client.terminals.showTerminal(C);
        expect(client.layout.currentPage().id).toBe(p2);
        expect(client.layout.activeInstance(p2)?.id).toBe(t2);
        expect(tab(t2).shown).toBe(C);
    });

    // Revert: make showingRow show the terminal alone whenever it is pressed.
    it("keeps the row and focuses the terminal when it is one of the owning tab's row", () => {
        const page = client.layout.currentPage().id;
        const split = client.layout.openView(
            'terminal',
            { id: 'split', terminals: [A, B], row: [A, B], shown: A },
            page
        );
        client.terminals.showTerminal(B);
        expect(tab(split)).toMatchObject({ shown: B, row: [A, B] });
    });

    it("hands a terminal no tab owns to the active Terminal tab of the page's focused pane", () => {
        const page = client.layout.currentPage().id;
        const first = owning(page, [A]);
        const second = owning(page, [B]);
        expect(client.layout.activeInstance(page)?.id).toBe(second);
        client.terminals.showTerminal(E);
        expect(tab(second).terminals).toEqual([B, E]);
        expect(tab(second).shown).toBe(E);
        expect(tab(first).terminals).toEqual([A]);
    });

    it('else to the first Terminal tab of the page, which is activated', () => {
        const page = client.layout.currentPage().id;
        const first = owning(page, [A]);
        owning(page, [B]);
        client.layout.openView('projects', undefined, page);
        expect(client.layout.activeInstance(page)?.view).toBe('projects');
        client.terminals.showTerminal(E);
        expect(tab(first).terminals).toEqual([A, E]);
        expect(tab(first).shown).toBe(E);
        expect(client.layout.activeInstance(page)?.id).toBe(first);
    });

    it('else to a new Terminal tab on the page on screen', () => {
        const page = client.layout.currentPage().id;
        expect(terminalTabs()).toEqual([]);
        client.terminals.showTerminal(E);
        const made = terminalTabs();
        expect(made).toHaveLength(1);
        expect(made[0].page).toBe(page);
        expect(readTab(made[0].state)).toMatchObject({ terminals: [E], shown: E });
    });

    it('opens no second Terminal tab when the page has one, however many terminals start', () => {
        const page = client.layout.currentPage().id;
        const only = owning(page, [A]);
        client.selection.select(D);
        client.terminals.showTerminal(D);
        client.terminals.showTerminal(E);
        expect(terminalTabs().map((one) => one.id)).toEqual([only]);
        expect(tab(only).terminals).toEqual([A, D, E]);
        expect(client.selection.selected()).toBe(D);
    });

    it('is refused for an id that is not a terminal', () => {
        client.terminals.showTerminal('fix-one');
        client.terminals.showTerminal('');
        expect(terminalTabs()).toEqual([]);
    });
});

describe('attaching a terminal no tab owns', () => {
    /** The ids of the terminals the store offers to attach. */
    const offered = () => client.terminals.attachable().map((one) => one.id);

    it('offers the listed terminals no Terminal tab on any page owns, in list order', () => {
        const p1 = client.layout.currentPage().id;
        owning(p1, [A]);
        client.layout.openPage('Other');
        const p2 = client.layout.currentPage().id;
        owning(p2, [C]);
        expect(offered()).toEqual([]);
        listed([A, B, C, D]);
        expect(offered()).toEqual([B, D]);
    });

    it('does not offer a terminal started here and not listed yet, nor once it is listed and its tab owns it', () => {
        const page = client.layout.currentPage().id;
        owning(page, [A]);
        listed([A]);
        owning(page, [D]);
        listed([A]);
        expect(offered()).toEqual([]);
        listed([A, D]);
        expect(offered()).toEqual([]);
    });

    it('puts the chosen terminal at the end of the tab it is chosen from, the second Terminal tab of the page, shows it in the row and activates the tab; no other tab changes', () => {
        const page = client.layout.currentPage().id;
        const first = owning(page, [C]);
        const here = owning(page, [A, B]);
        listed([A, B, C, D]);
        client.layout.activateInstance(first, page);
        const before = JSON.stringify(tab(first));

        client.terminals.attachTerminal(here, D);
        expect(tab(here)).toMatchObject({
            terminals: [A, B, D],
            row: [D],
            shown: D,
            composing: false
        });
        expect(client.layout.activeInstance(page)?.id).toBe(here);
        expect(JSON.stringify(tab(first))).toBe(before);
        expect(offered()).toEqual([]);
    });

    it('takes a tab composing alone out of its composer: the tab owns the terminal and shows it', () => {
        const page = client.layout.currentPage().id;
        const composing = client.layout.openView(
            'terminal',
            { id: 'composing-none', terminals: [], shown: null, composing: true },
            page
        );
        listed([D]);
        client.terminals.attachTerminal(composing, D);
        expect(tab(composing)).toMatchObject({
            terminals: [D],
            row: [D],
            shown: D,
            composing: false
        });
    });

    it('changes nothing for a terminal the latest list no longer names', () => {
        const page = client.layout.currentPage().id;
        const here = owning(page, [A]);
        listed([A, D]);
        listed([A]);
        const before = JSON.stringify(terminalTabs());
        client.terminals.attachTerminal(here, D);
        expect(JSON.stringify(terminalTabs())).toBe(before);
    });

    it('changes nothing for a terminal another Terminal tab took after the menu was opened', () => {
        const page = client.layout.currentPage().id;
        const here = owning(page, [A]);
        const took = owning(page, [B]);
        listed([A, B, D]);
        expect(offered()).toEqual([D]);
        client.terminals.moveTerminal(D, took, page, 1);
        const before = JSON.stringify(terminalTabs());
        client.terminals.attachTerminal(here, D);
        expect(JSON.stringify(terminalTabs())).toBe(before);
        expect(tab(took).terminals).toEqual([B, D]);
        expect(tab(here).terminals).toEqual([A]);
    });

    it('changes nothing for a tab no page holds, an id that is not a terminal, or a foreign terminal', () => {
        const page = client.layout.currentPage().id;
        const here = owning(page, [A]);
        listed([A, D]);
        client.entities.receive({
            channel: 'sessions',
            version: 99,
            payload: {
                records: [],
                workspaces: [],
                terminals: [terminal(A), { ...terminal(D), foreign: true }]
            }
        });
        const before = JSON.stringify(terminalTabs());
        client.terminals.attachTerminal('no-such-tab', D);
        client.terminals.attachTerminal(here, 'fix-one');
        client.terminals.attachTerminal(here, D);
        expect(JSON.stringify(terminalTabs())).toBe(before);
    });

    it('joins the tab it is chosen from, the only Terminal tab of the second page, and not the first Terminal tab of the first page', () => {
        const p1 = client.layout.currentPage().id;
        const first = owning(p1, [A]);
        client.layout.openPage('Other');
        const p2 = client.layout.currentPage().id;
        const here = owning(p2, [C]);
        listed([A, C, D]);

        client.terminals.attachTerminal(here, D);
        expect(tab(here).terminals).toEqual([C, D]);
        expect(tab(first).terminals).toEqual([A]);
    });
});

describe('a Terminal tab closed', () => {
    // Revert: make closeInstance skip access.ui.endTerminals.
    it('ends its terminals, and a terminal no tab owns is taken by a tab only when shown', () => {
        const stopped: string[] = [];
        vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
            stopped.push((JSON.parse(String(init?.body)) as { id: string }).id);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true })
            });
        });
        const page = client.layout.currentPage().id;
        const t1 = owning(page, [A, B]);
        listed([A, B]);
        client.layout.closeInstance(t1, page);
        expect(holds(t1)).toBe(false);
        expect(stopped).toEqual([A, B]);
        const other = owning(page, [C]);
        listed([A, B, C]);
        expect(tab(other).terminals).toEqual([C]);
        client.terminals.showTerminal(A);
        expect(tab(other).terminals).toEqual([C, A]);
    });
});

describe('New', () => {
    it("puts the composer in the page's Terminal tab, keeping what the tab owns", () => {
        const page = client.layout.currentPage().id;
        const only = owning(page, [A]);
        client.terminals.composeIn(page);
        expect(terminalTabs().map((one) => one.id)).toEqual([only]);
        expect(tab(only)).toMatchObject({ terminals: [A], composing: true });
    });

    it.each([
        ['the page', (_split: string, page: string) => client.terminals.composeIn(page)],
        ["the tab's bar", (split: string) => client.terminals.composeInTab(split)]
    ])("clears a Split's folder and kind from the tab's composer, New from %s", (_from, press) => {
        const page = client.layout.currentPage().id;
        const split = owning(page, [A, B]);
        client.ui.setInstanceState(split, withComposer({}, CHOSEN));
        client.ui.setInstanceState(
            split,
            splitState('/work/split-row', 'shell', client.ui.instanceState(split))
        );
        press(split, page);
        expect(tab(split)).toMatchObject({ terminals: [A, B], composing: true });
        const record = composerOf(client.ui.instanceState(split));
        expect(record).toEqual({
            workspace: '',
            agent: 'claude',
            accounts: CHOSEN.accounts,
            picks: CHOSEN.picks
        });
        const places = ['/hub', '/work/elsewhere'];
        expect(composerWorkspace(record, offeredPlaces(places, record), '/hub')).toBe('/hub');
    });

    it('shows the composer in the tab whose bar was pressed, and in no other tab of the page', () => {
        const page = client.layout.currentPage().id;
        const first = owning(page, [A]);
        const second = owning(page, [B]);
        client.terminals.composeInTab(second);
        expect(tab(second)).toMatchObject({ terminals: [B], composing: true });
        expect(tab(first)).toMatchObject({ terminals: [A], composing: false });
    });

    it('opens a Terminal tab showing the composer when the page has none', () => {
        client.terminals.composeIn();
        const made = terminalTabs();
        expect(made).toHaveLength(1);
        expect(readTab(made[0].state)).toMatchObject({ terminals: [], composing: true });
    });
});

/** A payload listing A with an icon and a colour, and B with neither. */
function listMarked(): void {
    version += 1;
    client.entities.receive({
        channel: 'sessions',
        version,
        payload: {
            records: [],
            workspaces: [],
            terminals: [
                { ...terminal(A), icon: 'refresh', color: 'red' },
                { ...terminal(B), icon: '', color: '' }
            ]
        }
    });
}

const markState = (shown: string | null, terminals = [A, B, E]) => ({ id: 't', terminals, shown });

describe('the strip mark the store gives a tab', () => {
    beforeEach(listMarked);

    // Revert: read the mark from the first terminal of the tab in tabMark, not the shown one.
    it('is the mark of the terminal the tab shows, and follows the shown one', () => {
        expect(client.terminals.tabMark({ view: 'terminal', state: markState(A) })).toEqual({
            glyph: 'refresh',
            token: '--c-red'
        });
        expect(client.terminals.tabMark({ view: 'terminal', state: markState(B) })).toEqual({});
    });

    // Revert: fall back to a default terminal's mark in tabMarkOf for an unlisted terminal.
    it('is empty for a tab that shows a terminal the payload does not list, or none', () => {
        expect(client.terminals.tabMark({ view: 'terminal', state: markState(E) })).toEqual({});
        expect(client.terminals.tabMark({ view: 'terminal', state: markState(null, []) })).toEqual(
            {}
        );
    });

    // Revert: give the mark to a tab of every view.
    it('is empty for a tab of another view', () => {
        expect(client.terminals.tabMark({ view: 'files', state: markState(A) })).toEqual({});
    });
});
