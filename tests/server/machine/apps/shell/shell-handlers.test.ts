// Layer 4, server test. What oculus answers to the shell requests of one host
// (lib/server/machine/apps/shell/host-calls.ts): the settings a host reads, the ids it may register
// and the views it may fill, the rate of its messages, and the host of an app that is not approved
// or is disabled. These are the settings-read rows of G77 and the registry's refusals.
//
// The registry is the real one over synthetic apps and the host a double; the handlers are called
// as the connection calls them. What this does NOT cover: the framing of the connection
// (host-manager.test.ts) and the process that runs a real host (host-commands.test.ts).

import { CancellationToken } from 'vscode-jsonrpc/node';
import { describe, expect, vi } from 'vitest';
import { settingValues } from '../../../../../src/lib/data/helpers/files/apps/settings.ts';
import { createLimiter } from '../../../../../src/lib/data/helpers/run/limiter.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { Refused } from '../../../../../src/lib/server/machine/apps/host/connection.ts';
import type { HeldApp } from '../../../../../src/lib/server/machine/apps/read/held.ts';
import { shellHandlers } from '../../../../../src/lib/server/machine/apps/shell/host-calls.ts';
import { AppShell } from '../../../../../src/lib/server/machine/apps/shell/registry.ts';
import { panelDisposed } from '../../../../../src/lib/state/system/apps/shell/show/panels.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { approveAll, routeSetup } from '../../../../routes/apps/apps-fixture.ts';

const PAGE = '<!doctype html><title>a</title>\n';
const CONTRIBUTES = `contributes:
  configuration:
    title: Notes
    properties:
      notes.width:
        type: number
        default: 80
        minimum: 40
  views:
    explorer:
      - id: notes.list
        name: List
        type: tree
      - id: notes.page
        name: Page
        type: webview
        entry: page.html
`;

/** The app `notes`, approved, with a setting, a tree view and a page; `state` changes its row. */
function world(state: Partial<HeldApp['row']> = {}) {
    const setup = routeSetup({
        machine: {
            'notes/app.yml': `name: notes\ntitle: Notes\nbridge: 1\nhost: host.mjs\n${CONTRIBUTES}`,
            'notes/index.html': PAGE,
            'notes/page.html': PAGE,
            'notes/host.mjs': 'export function activate() {}\n'
        }
    });
    approveAll(setup);
    const read = setup.held();
    const held = {
        ...read,
        apps: read.apps.map((one) => ({ ...one, row: { ...one.row, ...state } }))
    };
    const notify = vi.fn();
    const shell = new AppShell({
        hub: new Hub(),
        apps: { held: () => held },
        hosts: { request: vi.fn(), notify, ensure: vi.fn() }
    });
    const app = held.apps[0];
    const stored: Record<string, unknown> = {};
    let now = 0;
    const raw = shellHandlers({
        shell,
        app: () => app,
        messages: createLimiter(
            () => 600,
            60_000,
            () => now
        ),
        opens: createLimiter(
            () => 30,
            60_000,
            () => now
        ),
        values: (one) => settingValues(one.row.contributes.configuration?.properties ?? [], stored)
    });
    const handlers = Object.fromEntries(
        Object.entries(raw).map(([name, handler]) => [
            name,
            (params: unknown) => handler(params, CancellationToken.None)
        ])
    );
    return { handlers, shell, stored, notify, advance: (ms: number) => (now += ms) };
}

/** The word a handler is refused with, or `resolved`. */
async function wordOf(call: () => unknown): Promise<unknown> {
    try {
        await call();
        return 'resolved';
    } catch (error) {
        return error instanceof Refused ? error.word : error;
    }
}

describe('the settings a host reads', () => {
    it('answers the default, then the stored value once the file holds one, at once', async () => {
        const { handlers, stored } = world();
        expect(await handlers['oculus/settings/get']({ key: 'notes.width' })).toBe(80);
        stored['notes.width'] = 100;
        expect(await handlers['oculus/settings/get']({ key: 'notes.width' })).toBe(100);
    });

    it('answers the default for a stored value that breaks the declaration', async () => {
        const { handlers, stored } = world();
        stored['notes.width'] = 10;
        expect(await handlers['oculus/settings/get']({ key: 'notes.width' })).toBe(80);
    });

    it('answers null for a key of its own that no setting declares', async () => {
        const { handlers } = world();
        expect(await handlers['oculus/settings/get']({ key: 'notes.other' })).toBeNull();
    });

    it('refuses `not_declared` for a key of another app', async () => {
        const { handlers } = world();
        expect(await wordOf(() => handlers['oculus/settings/get']({ key: 'other.x' }))).toBe(
            'not_declared'
        );
    });
});

describe('what a host registers', () => {
    it('accepts a command of its own name and holds it once', async () => {
        const { handlers, shell } = world();
        await handlers['oculus/register']({ kind: 'command', id: 'notes.hello' });
        expect(shell.registered('app:notes', 'notes.hello')).toBe(true);
        expect(
            await wordOf(() => handlers['oculus/register']({ kind: 'command', id: 'notes.hello' }))
        ).toBe('refused:registered');
    });

    it.each([
        ['a command of another app', { kind: 'command', id: 'other.hello' }, 'refused:id'],
        ['a command of oculus', { kind: 'command', id: 'oculus.hello' }, 'refused:id'],
        [
            'a tree for a view the app does not declare',
            { kind: 'tree', id: 'notes.ghost' },
            'refused:view'
        ],
        ['a tree for a view of type webview', { kind: 'tree', id: 'notes.page' }, 'refused:view'],
        [
            'a panel for a page that is not a recorded file',
            { kind: 'panel', id: 'p1', options: { entry: 'nope.html' } },
            'missing'
        ],
        ['a kind that is none', { kind: 'bogus', id: 'x' }, 'refused:params']
    ])('refuses %s', async (_row, params, word) => {
        const { handlers } = world();
        expect(await wordOf(() => handlers['oculus/register'](params))).toBe(word);
    });

    it('accepts a tree for a view of type tree and a panel for a recorded page', async () => {
        const { handlers, shell } = world();
        await handlers['oculus/register']({ kind: 'tree', id: 'notes.list' });
        await handlers['oculus/register']({
            kind: 'panel',
            id: 'p1',
            options: { entry: 'page.html' }
        });
        const [host] = shell.payload().hosts;
        expect([host.trees.map((one) => one.view), host.panels.map((one) => one.entry)]).toEqual([
            ['notes.list'],
            ['page.html']
        ]);
    });
});

describe('a panel whose tab the reader closed', () => {
    it('fires onDidDispose in the host and leaves the panel out of the payload', async () => {
        const { handlers, shell, notify } = world();
        await handlers['oculus/register']({
            kind: 'panel',
            id: 'p1',
            options: { entry: 'page.html' }
        });
        const body = panelDisposed('app:notes', 'p1', 'page-1');
        shell.event(body.app, body.kind, body.params, body.page);
        expect([notify.mock.calls, shell.payload().hosts[0].panels]).toEqual([
            [['app:notes', 'oculus/event', { kind: 'dispose', id: 'p1' }]],
            []
        ]);
    });
});

describe('the messages of a host', () => {
    it('are refused `rate` from the 601st in a minute, and allowed again after the window', async () => {
        const { handlers, advance, shell } = world();
        const message = { kind: 'message', tone: 'info', message: 'm' };
        const calls = Array.from({ length: 601 }, () => handlers['oculus/ui'](message));
        expect(await wordOf(() => calls[600])).toBe('rate');
        expect(shell.payload().requests).toHaveLength(600);
        advance(60_001);
        void handlers['oculus/ui'](message);
        await vi.waitFor(() => expect(shell.payload().requests).toHaveLength(601));
    });
});

describe('the host of an app that does not act', () => {
    it.each([
        ['disabled', { disabled: true }],
        ['not approved', { approved: false, hashApproved: false }],
        ['changed since its approval', { hashApproved: false }]
    ])('is refused `closed` for every request when the app is %s', async (_row, state) => {
        const { handlers, shell } = world(state);
        const words = [
            await wordOf(() => handlers['oculus/register']({ kind: 'command', id: 'notes.hello' })),
            await wordOf(() => handlers['oculus/settings/get']({ key: 'notes.width' })),
            await wordOf(() =>
                handlers['oculus/commands/execute']({ id: 'setContext', args: ['notes.a', 1] })
            )
        ];
        expect([words, shell.payload().hosts]).toEqual([['closed', 'closed', 'closed'], []]);
    });
});
