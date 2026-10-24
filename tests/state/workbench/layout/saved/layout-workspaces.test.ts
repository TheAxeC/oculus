// Layer 2, client-state tests. The arrangement belongs to the open workspace: it is read once the
// workspace answer has named the workspace, or at once for the workspace the browser tab last
// loaded, saved per workspace in the server's `layouts.json`, shown again when the workspace is
// opened again, carried to the file a Save As makes, and followed through the `state` channel for
// the open workspace only. Two pages that change it within a second
// keep both changes, the server being the one save turn.
//
// Every page is a client over the page state stand-in (tests/fixtures/state-server.ts), which
// writes the files of a state folder of the case's own with the server's own write.

import { describe, expect, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import type { ClientState } from '../../../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import type { Pages, TabMemory } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { serialiseLayout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { stateServer, type StateServer } from '../../../../fixtures/state-server.ts';
import { heldPages, openLayout, pageAround, pane, split, UNSAVED } from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = '/hub/.oculus/workspaces/a.yml';
const B = '/hub/.oculus/workspaces/b.yml';

/** The labels of the pages the store shows. */
function labels(client: ClientState): string[] {
    return client.layout.pages().map((page) => page.label);
}

/** The envelope a set of pages is saved as. */
function envelopeOf(pages: Pages): unknown {
    return JSON.parse(serialiseLayout(pages));
}

/** The envelope `layouts.json` holds for a workspace, as JSON text, or null when none. */
function heldText(server: StateServer, identity: string): string | null {
    const held = server.file('layouts')[identity] as { envelope?: unknown } | undefined;
    return held?.envelope === undefined ? null : JSON.stringify(held.envelope);
}

/** A browser tab's session storage of the case's own, which outlives the tab's reloads. */
function tabMemory(): TabMemory {
    const held = new Map<string, string>();
    return {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
            held.set(key, value);
        }
    };
}

/** Let the answers and messages of the writes sent land. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Two pages over one server, each with the workspace A open, A seeded with `seed` when given. */
function twoPages(seed?: Pages) {
    const server = stateServer();
    if (seed !== undefined) server.seed(A, { envelope: envelopeOf(seed) });
    const pages = [server.page(), server.page()];
    for (const client of pages) openLayout(client.layout, A);
    return { server, pages };
}

describe('the arrangement of each workspace', () => {
    it('is saved and shown again for the workspace it was made in', async () => {
        const server = stateServer();
        const client = server.page();
        openLayout(client.layout, A);
        client.layout.openPage('In A');
        expect(client.layout.workspaceOpened(B)).toBe(false);
        expect(labels(client)).toEqual(['Page 1']);
        client.layout.openPage('In B');
        expect(client.layout.workspaceOpened(A)).toBe(true);
        expect(labels(client)).toEqual(['Page 1', 'In A']);
        expect(client.layout.workspaceOpened(B)).toBe(true);
        expect(labels(client)).toEqual(['Page 1', 'In B']);
        await settle();
        expect(Object.keys(server.file('layouts')).sort()).toEqual([A, B]);
        expect(heldText(server, A)).toContain('In A');
        expect(heldText(server, B)).toContain('In B');
    });

    it('is the default for a workspace that was never opened and is written at its first change', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const client = server.page();
        client.layout.loadLayout();
        expect(client.layout.workspaceOpened(B)).toBe(false);
        await settle();
        expect(heldText(server, B)).toBeNull();
        client.layout.openPage('Extra');
        await settle();
        expect(heldText(server, B)).toContain('Extra');
        expect(heldText(server, A)).not.toContain('Extra');
    });

    it('is saved for the workspace left when a workspace is opened', async () => {
        const server = stateServer();
        const client = server.page();
        server.hold();
        openLayout(client.layout, A);
        client.layout.openPage('In A');
        client.layout.workspaceOpened(B);
        await server.deliver([0]);
        const record = server.file('writes')[A] as { call: string }[];
        expect(record.map((entry) => entry.call)).toEqual(['openPage', 'workspaceOpened']);
        expect(heldText(server, A)).toContain('In A');
        expect(heldText(server, B)).toBeNull();
    });

    it('keeps an unreadable value of one workspace as that workspace unread copy', async () => {
        const server = stateServer();
        server.seed(B, { envelope: 'garbage' });
        const client = server.page();
        openLayout(client.layout, A);
        await settle();
        expect(server.file('layouts')[B]).toEqual({ envelope: 'garbage' });
        client.layout.workspaceOpened(B);
        await settle();
        expect(server.file('layouts')[B]).toEqual({ envelope: 'garbage', unread: 'garbage' });
        expect(server.file('layouts')[A]).toBeUndefined();
    });
});

describe('the workspace answer', () => {
    it('reads no arrangement of another workspace and saves none before it has come', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        server.seed(B, { envelope: envelopeOf(heldPages([pageAround('other', pane(['b']))])) });
        const memory = tabMemory();
        const before = server.page(memory);
        openLayout(before.layout, A);
        const client = server.page(memory);
        const envelope = vi.spyOn(client.pageState, 'envelope');
        client.layout.loadLayout();
        client.layout.workspaceAnswered({ loading: true, error: '', open: null });
        client.layout.openPage('Early');
        await settle();
        expect(envelope.mock.calls.every(([identity]) => identity === A)).toBe(true);
        expect(server.sent()).toEqual([]);
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: B } });
        expect(client.layout.pages().map((page) => page.id)).toEqual(['other']);
        await settle();
        expect(heldText(server, A)).not.toContain('Early');
    });

    it('draws the arrangement of the workspace the browser tab last loaded in its first draw', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const memory = tabMemory();
        const before = server.page(memory);
        openLayout(before.layout, A);
        const client = server.page(memory);
        client.layout.loadLayout();
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        expect(client.layout.loaded()).toBe(true);
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        client.layout.openPage('After the answer');
        await settle();
        expect(heldText(server, A)).toContain('After the answer');
    });

    it('saves a change made before it came once it names the workspace the reload drew', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const memory = tabMemory();
        const before = server.page(memory);
        openLayout(before.layout, A);
        const client = server.page(memory);
        client.layout.loadLayout();
        client.layout.openPage('Before the answer');
        await settle();
        expect(server.sent()).toEqual([]);
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        await settle();
        expect(heldText(server, A)).toContain('Before the answer');
        const record = server.file('writes')[A] as { call: string }[];
        expect(record.map((entry) => entry.call)).toEqual(['openPage']);
    });

    it('saves nothing of the workspace the reload drew when it names another', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const memory = tabMemory();
        const before = server.page(memory);
        openLayout(before.layout, A);
        const client = server.page(memory);
        client.layout.loadLayout();
        client.layout.openPage('Before the answer');
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: B } });
        await settle();
        expect(server.sent()).toEqual([]);
        expect(heldText(server, A)).not.toContain('Before the answer');
        expect(heldText(server, B)).toBeNull();
    });

    it('keeps the change of another page saved to the workspace the reload drew, and its own', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const memory = tabMemory();
        const other = server.page(memory);
        openLayout(other.layout, A);
        const client = server.page(memory);
        client.layout.loadLayout();
        client.layout.openPage('From the reloaded tab');
        other.layout.openPage('From the other page');
        await settle();
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        await settle();
        expect(heldText(server, A)).toContain('From the other page');
        expect(heldText(server, A)).toContain('From the reloaded tab');
        expect([...labels(client)].sort()).toEqual(
            ['From the other page', 'From the reloaded tab', 'main'].sort()
        );
    });

    it('reads no arrangement and sends nothing before it came in a tab that loaded none', async () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const client = server.page(tabMemory());
        const envelope = vi.spyOn(client.pageState, 'envelope');
        client.layout.loadLayout();
        client.layout.workspaceAnswered({ loading: true, error: '', open: null });
        client.layout.openPage('Early');
        await settle();
        expect(envelope).not.toHaveBeenCalled();
        expect(server.sent()).toEqual([]);
        expect(client.layout.loaded()).toBe(false);
    });

    it('names the workspace by the real path of the open file', () => {
        const server = stateServer();
        server.seed(A, { envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))])) });
        const client = server.page();
        client.layout.loadLayout();
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        expect(client.layout.loaded()).toBe(true);
    });

    it('names the unsaved workspace when the first answer failed or no file is open', () => {
        for (const answer of [
            { loading: false, error: 'down', open: null },
            { loading: false, error: '', open: null }
        ]) {
            const server = stateServer();
            server.seed(UNSAVED, {
                envelope: envelopeOf(heldPages([pageAround('main', pane(['a']))]))
            });
            const client = server.page();
            client.layout.loadLayout();
            client.layout.workspaceAnswered(answer);
            expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        }
    });

    it('keeps the workspace the page is in when a later answer failed', async () => {
        const server = stateServer();
        const client = server.page();
        client.layout.loadLayout();
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        client.layout.openPage('In A');
        client.layout.workspaceAnswered({ loading: false, error: 'down', open: null });
        client.layout.openPage('Still A');
        await settle();
        expect(heldText(server, A)).toContain('Still A');
        expect(heldText(server, UNSAVED)).toBeNull();
    });
});

describe('Save As', () => {
    it('shows the pages it leaves in the new file and saves them under both workspaces', async () => {
        const server = stateServer();
        const client = server.page();
        openLayout(client.layout, UNSAVED);
        client.layout.openPage('Made before');
        client.layout.workspaceCarried(A);
        expect(labels(client)).toEqual(['Page 1', 'Made before']);
        expect(client.layout.workspaceOpened(A)).toBe(true);
        await settle();
        expect(heldText(server, A)).toContain('Made before');
        expect(heldText(server, UNSAVED)).toContain('Made before');
        client.layout.openPage('After');
        await settle();
        expect(heldText(server, A)).toContain('After');
        expect(heldText(server, UNSAVED)).not.toContain('After');
    });
});

describe('the state channel', () => {
    it('is heard for the arrangement of the open workspace and for no other', async () => {
        const server = stateServer();
        const [reader, writer] = [server.page(), server.page()];
        openLayout(reader.layout, A);
        openLayout(writer.layout, B);
        writer.layout.openPage('Saved for B');
        await settle();
        expect(labels(reader)).toEqual(['Page 1']);
        writer.layout.workspaceOpened(A);
        writer.layout.openPage('Saved for A');
        await settle();
        expect(labels(reader)).toEqual(['Page 1', 'Saved for A']);
        reader.layout.workspaceOpened(B);
        writer.layout.openPage('Saved for A again');
        await settle();
        expect(labels(reader)).toEqual(['Page 1', 'Saved for B']);
    });
});

describe('a browser tab whose arrangement another tab has moved on from', () => {
    it('takes the saved arrangement and runs its change on it, so no tab of either is lost', async () => {
        const { server, pages } = twoPages();
        const [first, second] = pages;
        first.layout.openPage('From the first');
        await settle();
        second.layout.openPage('From the second');
        await settle();
        const saved = heldText(server, A);
        expect(saved).toContain('From the first');
        expect(saved).toContain('From the second');
        expect(labels(second)).toEqual(['Page 1', 'From the first', 'From the second']);
    });

    it.each([
        ['the first', [0, 1]],
        ['the second', [1, 0]]
    ])('keeps both changes of two saves that crossed, %s applied first', async (_, order) => {
        const { server, pages } = twoPages();
        server.hold();
        pages[0].layout.openPage('From the first');
        pages[1].layout.openPage('From the second');
        await server.deliver(order);
        const both = ['Page 1', 'From the first', 'From the second'];
        expect(heldText(server, A)).toContain('From the first');
        expect(heldText(server, A)).toContain('From the second');
        expect(pages.map((client) => [...labels(client)].sort())).toEqual([
            [...both].sort(),
            [...both].sort()
        ]);
    });
});

/**
 * The panes of the one page the arrangement holds, each as its tabs, whether it is folded and
 * whether its tab row is hidden.
 */
function panesOf(client: ClientState): string[] {
    const root = client.layout.pages()[0].workbench.root;
    const children = root.kind === 'split' ? root.children : [root];
    const folded = root.kind === 'split' ? (root.folded ?? []) : [];
    return children.map((node, at) => {
        const name = node.kind === 'pane' ? node.tabs.map((tab) => tab.id).join('+') : node.kind;
        const shown = folded.includes(at) ? `${name} folded` : name;
        return node.kind === 'pane' && node.rowHidden === true ? `${shown} hidden` : shown;
    });
}

describe('two browser tabs that change the panes of one page within a second', () => {
    const ROWS = [
        {
            row: 'a fold of a pane the other tab moved lands on that pane',
            first: (client: ClientState) => client.layout.closePane([0]),
            second: (client: ClientState) => client.layout.foldPane([2]),
            panes: ['b', 'c folded']
        },
        {
            row: 'a fold of a pane the other tab closed is dropped and folds no other pane',
            first: (client: ClientState) => client.layout.closePane([1]),
            second: (client: ClientState) => client.layout.foldPane([1]),
            panes: ['a', 'c']
        },
        {
            row: 'a hide of the tab row of a pane the other tab moved lands on that pane',
            first: (client: ClientState) => client.layout.closePane([0]),
            second: (client: ClientState) => client.layout.hideTabRow([2], true),
            panes: ['b', 'c hidden']
        }
    ];
    it.each(
        ROWS.flatMap((row) => [
            { ...row, applied: 'the first', order: [0, 1] },
            { ...row, applied: 'the second', order: [1, 0] }
        ])
    )('$row, $applied applied first', async ({ first, second, order, panes }) => {
        const three = split('row', [1 / 3, 1 / 3, 1 / 3], [pane(['a']), pane(['b']), pane(['c'])]);
        const { server, pages } = twoPages(heldPages([pageAround('main', three)]));
        server.hold();
        first(pages[0]);
        second(pages[1]);
        await server.deliver(order);
        expect(pages.map((client) => panesOf(client))).toEqual([panes, panes]);
    });
});

describe('the save turn of the server', () => {
    it('admits a save made from the envelope it holds and answers another with the envelope held', async () => {
        const { server, pages } = twoPages(heldPages([pageAround('main', pane(['a']))]));
        server.hold();
        pages[0].layout.openPage('First');
        pages[1].layout.openPage('Second');
        await server.deliver([0, 1]);
        const saves = server.sent().filter((write) => write.kind === 'layout');
        expect(saves.map((write) => write.by)).toEqual([
            pages[0].pageState.by,
            pages[1].pageState.by,
            pages[1].pageState.by
        ]);
        expect(saves[0].from).toBeNull();
        expect(saves[1].from).toBeNull();
        expect(saves[2].from).toBe((saves[0].envelope as { stamp: string }).stamp);
        const record = server.file('writes')[A] as { by?: string; call: string }[];
        expect(record.map((entry) => entry.call)).toEqual(['openPage', 'openPage']);
    });
});
