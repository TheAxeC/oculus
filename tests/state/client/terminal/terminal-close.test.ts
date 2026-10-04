// Layer 2, client-state tests. Closing ends what a Terminal tab owns: closing the tab, the pane
// holding it, the page holding it and a page reset each stop the running terminals the tab lists; a
// move to another pane or page, a split, a reload, a view leaving the registry and a terminal that
// ended on its own stop none. The fresh busy read a close asks first, and a start answered after
// its tab was closed.
//
// The client is built through the client's own wiring (state/client/context.ts) over a stubbed
// `fetch` that records each stop and answers the busy read from a table the case sets.
//
// What this does NOT cover: the dialog a close raises and its Cancel and Close presses, which are
// seen on screen; the choice between acting and each question is tests/state/workbench/navigation/
// pages.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../../../src/lib/state/client/context.ts';
import { tabsOf } from '../../../../src/lib/state/workbench/layout/instance.ts';
import { readTab } from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { openOwning, terminalTabsOf } from './terminal-tabs-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';
const D = 'd4d4d4-shell';

let client: ClientState;
let version = 0;
let stops: string[] = [];
let reads: string[][] = [];
/** What the busy read answers per terminal; a terminal missing from it fails the read. */
let busy: Record<string, { busy: boolean; command: string }> = {};
let failRead = false;

function terminal(id: string, over: Partial<Terminal> = {}): Terminal {
    return {
        id,
        name: `name-${id}`,
        title: '',
        icon: '',
        color: '',
        kind: id.endsWith('claude') ? 'claude' : 'shell',
        cwd: '/x',
        command: 'zsh',
        pid: 321,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null,
        task: false,
        exit: null,
        job: null,
        ...over
    };
}

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    version = 0;
    stops = [];
    reads = [];
    busy = {};
    failRead = false;
    vi.stubGlobal('fetch', (url: string, init?: { method?: string; body?: string }) => {
        if (init?.method === 'POST') {
            const post = JSON.parse(String(init.body)) as Record<string, unknown>;
            if (post.action === 'stop') stops.push(String(post.id));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ok: true, id: post.id })
            });
        }
        const ids = (new URL(url, 'http://h').searchParams.get('busy') ?? '').split(',');
        reads.push(ids);
        if (failRead) return Promise.reject(new Error('tmux is down'));
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    busy: ids.map((id) => ({
                        id,
                        ...(busy[id] ?? { busy: false, command: 'zsh' })
                    }))
                })
        });
    });
});

afterEach(() => vi.unstubAllGlobals());

function listed(ids: string[], over: Record<string, Partial<Terminal>> = {}): void {
    version += 1;
    client.entities.receive({
        channel: 'sessions',
        version,
        payload: {
            records: [],
            workspaces: [],
            terminals: ids.map((id) => terminal(id, over[id]))
        }
    });
}

const terminalTabs = () => terminalTabsOf(client);

function holds(tab: string): boolean {
    return terminalTabs().some((one) => one.id === tab);
}

function owning(terminals: string[], page = client.layout.currentPage().id): string {
    return openOwning(client, page, terminals);
}

/** The instances a tab lists, as the layout holds them. */
function instances(ids: string[]) {
    return client.layout
        .pages()
        .flatMap((page) => tabsOf(page.workbench.root))
        .filter((one) => ids.includes(one.id));
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('closing a Terminal tab', () => {
    // Revert: call no ending from closeInstance in state/workbench/layout/instances.ts.
    it('stops the running terminals the tab lists', async () => {
        const id = owning([A, B]);
        listed([A, B]);
        client.layout.closeInstance(id);
        await settle();
        expect(stops.sort()).toEqual([A, B]);
        expect(holds(id)).toBe(false);
    });

    // Revert: count every terminal a tab lists as running in the store's runningOf.
    it('stops nothing for a terminal the payload does not list', async () => {
        listed([A]);
        const stale = { id: 'stale', view: 'terminal', state: { terminals: [A, D] } };
        client.ui.endTerminals([stale]);
        await settle();
        expect(stops).toEqual([A]);
    });

    // Revert: drop `!heard` from running in the terminals store.
    it('stops the terminals a tab lists when it closes before any sessions message was heard', async () => {
        const id = owning([A]);
        client.layout.closeInstance(id);
        await settle();
        expect(stops).toEqual([A]);
    });

    // Revert: end the terminals of every tab in closeInstance, not the closed one's.
    it('stops nothing that another tab owns', async () => {
        const first = owning([A]);
        owning([B]);
        listed([A, B]);
        client.layout.closeInstance(first);
        await settle();
        expect(stops).toEqual([A]);
    });
});

describe('closing a pane and a page', () => {
    // Revert: call no ending from forgetTabs for a closed pane.
    it('stops every terminal of the Terminal tabs a closed pane held', async () => {
        const page = client.layout.currentPage().id;
        const first = owning([A, B]);
        const second = owning([C]);
        const side = client.layout.openView('projects', undefined, page);
        client.layout.splitInstance(side, [], 'right', page);
        listed([A, B, C]);
        expect(holds(first) && holds(second)).toBe(true);
        client.layout.closePane([0], page);
        await settle();
        expect(stops.sort()).toEqual([A, B, C]);
    });

    // Revert: call no ending from closePage.
    it('stops every terminal of the Terminal tabs a closed page held', async () => {
        client.layout.openPage('Other');
        const other = client.layout.currentPage().id;
        owning([A], other);
        owning([D], other);
        listed([A, D]);
        client.layout.closePage(other);
        await settle();
        expect(stops.sort()).toEqual([A, D]);
    });

    // Revert: call no ending from resetPage.
    it('stops the terminals of a page a reset rebuilds', async () => {
        const node = { root: { kind: 'pane', view: 'focus' } };
        client.layout.openRailPage('focus', 'Focus', node);
        const page = client.layout.currentPage().id;
        owning([A], page);
        listed([A]);
        expect(client.layout.resetPage(page, { page: 'focus', label: 'Focus', node })).toBe(true);
        await settle();
        expect(stops).toEqual([A]);
    });

    // Revert: call no ending from resetPages.
    it('stops the terminals of a page a reset of every page removes', async () => {
        const node = { root: { kind: 'pane', view: 'focus' } };
        client.layout.openRailPage('old', 'Old', node);
        const page = client.layout.currentPage().id;
        owning([D], page);
        listed([D]);
        expect(client.layout.resetPages([], [])).toBe(true);
        await settle();
        expect(stops).toEqual([D]);
    });
});

describe('a tab that is moved, split or reloaded', () => {
    // Revert: call the ending from carryToPage or transferInstance.
    it('ends no terminal when it moves to another pane, to another page, or is split', async () => {
        const page = client.layout.currentPage().id;
        const id = owning([A]);
        const side = client.layout.openView('projects', undefined, page);
        client.layout.splitInstance(side, [], 'right', page);
        listed([A]);
        client.layout.transferInstance(id, [1], 0, page);
        client.layout.splitInstance(id, [], 'bottom', page);
        client.layout.openPage('Other');
        const other = client.layout.currentPage().id;
        client.layout.moveInstanceToPage(id, other);
        await settle();
        expect(stops).toEqual([]);
        expect(holds(id)).toBe(true);
    });

    // Revert: end the terminals of every saved tab when the layout is loaded.
    it('ends no terminal when the layout is loaded again', async () => {
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        owning([A]);
        listed([A]);
        client.layout.loadLayout(storage);
        await settle();
        expect(stops).toEqual([]);
    });

    // Revert: close the tab before writing its state without the moved terminal in moveTerminal.
    it('closes the tab a last terminal moves out of without ending that terminal', async () => {
        const page = client.layout.currentPage().id;
        const from = owning([A]);
        const to = owning([B]);
        listed([A, B]);
        client.terminals.moveTerminal(A, to, page, 1);
        await settle();
        expect(holds(from)).toBe(false);
        expect(readTab(terminalTabs().find((one) => one.id === to)?.state).terminals).toEqual([
            B,
            A
        ]);
        expect(stops).toEqual([]);
    });

    // Revert: call closeInstanceAnywhere's ending from closeInstancesOfView.
    it('ends no terminal when a view leaves the registry and its tabs close', async () => {
        owning([A]);
        listed([A]);
        client.layout.closeInstancesOfView('terminal');
        await settle();
        expect(terminalTabs()).toEqual([]);
        expect(stops).toEqual([]);
    });
});

describe('a terminal that ended on its own', () => {
    // Revert: close no tab left owning none in closeEnded of terminal-lists.ts. The empty stops
    // list holds because the ended terminal is not listed, so closing its tab sends no stop.
    it('closes the tab of its last terminal and sends no stop for it', async () => {
        const id = owning([A]);
        listed([A]);
        listed([]);
        await settle();
        expect(holds(id)).toBe(false);
        expect(stops).toEqual([]);
    });
});

describe('the busy read a close asks first', () => {
    // Revert: name no program for a busy terminal in the store's busy read.
    it('names a terminal running a program, and not an idle shell', async () => {
        const id = owning([A, B]);
        listed([A, B]);
        busy = { [A]: { busy: false, command: 'zsh' }, [B]: { busy: true, command: 'npm' } };
        const found = await client.ui.busyTerminals(instances([id]));
        expect(found).toEqual([{ id: B, name: `name-${B}`, command: 'npm' }]);
        expect(reads).toEqual([[A, B]]);
    });

    // Revert: count every terminal a tab lists as running in the store's runningOf.
    it('reads nothing for a tab that lists no running terminal', async () => {
        listed([A]);
        const stale = { id: 'stale', view: 'terminal', state: { terminals: [D] } };
        expect(await client.ui.busyTerminals([stale])).toEqual([]);
        expect(reads).toEqual([]);
    });

    // Revert: answer no terminal as busy when the read fails.
    it('asks for every terminal when the read fails', async () => {
        const id = owning([A, B]);
        listed([A, B]);
        failRead = true;
        const found = await client.ui.busyTerminals(instances([id]));
        expect(found.map((one) => one.id).sort()).toEqual([A, B]);
        for (const one of found) expect(one.command).toBe('');
    });

    // Revert: count every terminal a tab lists as running in the store's runningOf.
    it('stops a terminal that ended during the read no more than once, and never twice', async () => {
        const id = owning([A, B]);
        listed([A, B]);
        busy = { [A]: { busy: true, command: 'npm' }, [B]: { busy: true, command: 'vim' } };
        const held = instances([id]);
        const reading = client.ui.busyTerminals(held);
        listed([A]);
        await reading;
        client.ui.endTerminals(held);
        await settle();
        expect(stops).toEqual([A]);
    });

    // Revert: leave the tab open when Cancel is chosen, by ending terminals before the question.
    it('ends nothing while the question waits: a read alone stops no terminal', async () => {
        const id = owning([A]);
        listed([A]);
        busy = { [A]: { busy: true, command: 'npm' } };
        await client.ui.busyTerminals(instances([id]));
        await settle();
        expect(stops).toEqual([]);
        expect(holds(id)).toBe(true);
    });
});

describe('a task terminal', () => {
    const JOB = { repo: '/x', name: 'build' };

    it('asks nothing about a line that ended, and is stopped when its tab closes', async () => {
        const id = owning([A]);
        listed([A], { [A]: { task: true, exit: 1, job: JOB } });
        busy = { [A]: { busy: true, command: 'make' } };
        expect(await client.ui.busyTerminals(instances([id]))).toEqual([]);
        expect(reads).toEqual([]);
        client.layout.closeInstance(id);
        await settle();
        expect(stops).toEqual([A]);
    });

    it('asks about a line that runs, whatever program the pane names', async () => {
        const id = owning([A, B]);
        listed([A, B], { [A]: { task: true, exit: null, job: JOB } });
        busy = {
            [A]: { busy: false, command: 'zsh' },
            [B]: { busy: false, command: 'zsh' }
        };
        const found = await client.ui.busyTerminals(instances([id]));
        expect(found).toEqual([{ id: A, name: `name-${A}`, command: 'zsh' }]);
    });

    it('asks about the running terminals of a tab that also holds an ended task terminal', async () => {
        const id = owning([A, B]);
        listed([A, B], { [A]: { task: true, exit: 0, job: JOB } });
        busy = { [B]: { busy: true, command: 'npm' } };
        const found = await client.ui.busyTerminals(instances([id]));
        expect(found).toEqual([{ id: B, name: `name-${B}`, command: 'npm' }]);
        expect(reads).toEqual([[B]]);
    });
});
