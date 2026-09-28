// Layer 4, client-state test. A Terminal tab whose terminal has ended is closed by the client's
// own wiring (state/client/context.ts hands the terminals store the tabs of every page, the
// layout's close and the selection), on whichever page the tab is, when a `sessions` message no
// longer lists the terminal.
//
// What this does NOT cover: the tab's grid, which needs a DOM the suite does not have.

import { beforeEach, describe, expect, it } from 'vitest';
import { createClientState, type ClientState } from '../../../src/lib/state/client/context.ts';
import { tabsOf } from '../../../src/lib/state/workbench/layout/instance.ts';
import { composerState } from '../../../src/lib/state/sessions/terminals.svelte.ts';
import type { Terminal } from '../../../src/lib/data/model/index.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

// A page opened here is named from the catalog, so the real one is installed.
setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';
const D = 'd4d4d4-shell';

let client: ClientState;
let version = 0;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    version = 0;
});

function terminal(id: string): Terminal {
    return {
        id,
        name: id,
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

/** The Terminal tabs of every page, by page id. */
function terminalTabs(): Record<string, string[]> {
    const held: Record<string, string[]> = {};
    for (const page of client.layout.pages()) {
        held[page.id] = tabsOf(page.workbench.root)
            .filter((tab) => tab.view === 'terminal')
            .map((tab) => tab.id);
    }
    return held;
}

function holds(tab: string): boolean {
    return Object.values(terminalTabs()).some((tabs) => tabs.includes(tab));
}

describe('a Terminal tab whose terminal ended', () => {
    it('closes when pinned to it, on a page not on screen, and a tab pinned elsewhere stays', () => {
        const first = client.layout.currentPage().id;
        const onA = client.layout.openView('terminal', { session: A }, first);
        client.layout.openPage('Other');
        const other = client.layout.currentPage().id;
        expect(other).not.toBe(first);
        const onB = client.layout.openView('terminal', { session: B }, other);
        listed([A, B]);
        expect(holds(onA) && holds(onB)).toBe(true);

        listed([B]);
        expect(holds(onA)).toBe(false);
        expect(holds(onB)).toBe(true);
    });

    it('closes when following the selection, and the selection is cleared', () => {
        const page = client.layout.currentPage().id;
        const following = client.layout.openView('terminal', undefined, page);
        client.selection.select(A);
        listed([A, B]);
        listed([B]);
        expect(client.selection.selected()).toBe(null);
        expect(holds(following)).toBe(false);
    });

    it('stays when following a selected terminal that is still listed', () => {
        const page = client.layout.currentPage().id;
        const following = client.layout.openView('terminal', undefined, page);
        client.selection.select(A);
        listed([A, B]);
        listed([A]);
        expect(client.selection.selected()).toBe(A);
        expect(holds(following)).toBe(true);
    });

    it('keeps a composer the reader is filling in when the selected terminal ends', () => {
        const page = client.layout.currentPage().id;
        const composing = client.layout.openView('terminal', composerState('fresh-one'), page);
        client.selection.select(A);
        listed([A]);
        listed([]);
        expect(client.selection.selected()).toBe(null);
        expect(holds(composing)).toBe(true);
    });

    it('closes at the first message when that message does not list it', () => {
        const page = client.layout.currentPage().id;
        const onC = client.layout.openView('terminal', { session: C }, page);
        listed([]);
        expect(holds(onC)).toBe(false);
    });

    it('stays when started here after the first message and not listed yet', () => {
        listed([A]);
        const page = client.layout.currentPage().id;
        const onD = client.layout.openView('terminal', { session: D }, page);
        listed([A]);
        expect(holds(onD)).toBe(true);
    });

    it('stays when a message carries no terminal list', () => {
        const page = client.layout.currentPage().id;
        const onA = client.layout.openView('terminal', { session: A }, page);
        listed([A]);
        listed(null);
        expect(holds(onA)).toBe(true);
    });
});
