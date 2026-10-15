// Layer 2, client-state tests. A move to another pane or page, a split and a reload stop none of
// the running terminals the tab lists. The fresh busy read a close asks first.
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
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { fakeStorage, openLayout } from '../../workbench/layout/layout-fixture.ts';
import { openOwning, terminalTabsOf } from './terminal-tabs-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';
const B = 'b2b2b2-shell';

let client: ClientState;
let version = 0;
let stops: string[] = [];
let reads: string[][] = [];
/** What the busy read answers per terminal; a terminal missing from it fails the read. */
let busy: Record<string, { busy: boolean; command: string }> = {};
let failRead = false;
/** Called with each stop the stubbed server records, while a case waits on one. */
let onStop: ((id: string) => void) | null = null;

function terminal(id: string, over: Partial<Terminal> = {}): Terminal {
    return {
        id,
        name: `name-${id}`,
        title: '',
        icon: '',
        color: '',
        kind: id.endsWith('claude') ? 'claude' : 'shell',
        app: '',
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
    openLayout(client.layout, fakeStorage());
    version = 0;
    stops = [];
    reads = [];
    busy = {};
    failRead = false;
    onStop = null;
    vi.stubGlobal('fetch', (url: string, init?: { method?: string; body?: string }) => {
        if (init?.method === 'POST') {
            const post = JSON.parse(String(init.body)) as Record<string, unknown>;
            if (post.action === 'stop') {
                stops.push(String(post.id));
                onStop?.(String(post.id));
            }
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

/**
 * Close the tab and wait for the stop of `id` its close posts. A tab's close ends its terminals
 * through the same path a move, a split or an opened layout would take if it ended them, so every
 * such stop is recorded before this one, and the check after it sees each of them.
 */
function closedAndStopped(tab: string, id: string, page?: string): Promise<void> {
    const stopped = new Promise<void>((resolve) => {
        onStop = (one) => {
            if (one === id) resolve();
        };
    });
    client.layout.closeInstance(tab, page);
    return stopped;
}

describe('a tab that is moved, split or reloaded', () => {
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
        expect(holds(id)).toBe(true);
        await closedAndStopped(id, A, other);
        expect(stops).toEqual([A]);
    });

    it('ends no terminal when the layout of another workspace is opened', async () => {
        const storage = fakeStorage();
        openLayout(client.layout, storage);
        owning([A]);
        listed([A, B]);
        openLayout(client.layout, storage, '/w/other.yml');
        await closedAndStopped(owning([B]), B);
        expect(stops).toEqual([B]);
    });
});

describe('the busy read a close asks first', () => {
    it('names a terminal running a program, and not an idle shell', async () => {
        const id = owning([A, B]);
        listed([A, B]);
        busy = { [A]: { busy: false, command: 'zsh' }, [B]: { busy: true, command: 'npm' } };
        const found = await client.ui.busyTerminals(instances([id]));
        expect(found).toEqual([{ id: B, name: `name-${B}`, command: 'npm' }]);
        expect(reads).toEqual([[A, B]]);
    });
});
