// Layer 2, server test. The shell part of the host's object (lib/server/machine/apps/host/
// runner-shell.mjs) over a connection that records what the host sends: the options a message takes
// before its items, what a tree view's fields read back, and what `affectsConfiguration` matches.
//
// The connection is a double in this process, so nothing here starts a node process; the real
// runner is exercised by host-commands.test.ts. What this does NOT cover: the framing of the
// connection or the registry's answers.

import type { MessageConnection } from 'vscode-jsonrpc/node';
import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';

/** The part of the host's object these cases drive. */
type Tree = {
    selection: unknown[];
    visible: boolean;
    title?: string;
    description?: string;
    message?: string;
    badge?: unknown;
};
type Shell = {
    api: {
        commands: {
            registerCommand: (id: string, handler: (...args: unknown[]) => unknown) => unknown;
        };
        window: {
            showInformationMessage: (text: string, ...rest: unknown[]) => Promise<unknown>;
            showWarningMessage: (text: string, ...rest: unknown[]) => Promise<unknown>;
            createTreeView: (view: string, options: { treeDataProvider: unknown }) => Tree;
        };
        workspace: {
            onDidChangeConfiguration: (
                listener: (event: { affectsConfiguration: (section: string) => boolean }) => void
            ) => unknown;
        };
    };
    provide: (params: Record<string, unknown>) => Promise<unknown>;
    event: (params: Record<string, unknown>) => void;
    start: (name: string, values: Record<string, unknown>) => void;
};

/**
 * The shell module is loaded by a computed address, so that the type check of the test does not
 * follow into the plain JavaScript the host runs.
 */
const MODULE = new URL(
    '../../../../../src/lib/server/machine/apps/host/runner/runner-shell.mjs',
    import.meta.url
).href;
const { createShell } = (await import(MODULE)) as {
    createShell: (link: {
        connection: MessageConnection;
        report: (error: unknown) => void;
    }) => Shell;
};

type Sent = { method: string; params: Record<string, unknown> };

/** A shell over a connection that records its requests and notifications and answers `answer`. */
function shellOver(answer: unknown = null) {
    const sent: Sent[] = [];
    const connection = {
        sendRequest: (method: string, params: Record<string, unknown>) => {
            sent.push({ method, params });
            return Promise.resolve(method === 'oculus/ui' ? answer : null);
        },
        sendNotification: (method: string, params: Record<string, unknown>) => {
            sent.push({ method, params });
            return Promise.resolve();
        }
    } as unknown as MessageConnection;
    const shell = createShell({ connection, report: () => undefined });
    shell.start('notes', {});
    return { shell, sent, messages: () => sent.filter((one) => one.method === 'oculus/ui') };
}

describe('the options of a message', () => {
    it.each([
        ["an empty options object before the item: ('Saved', {}, 'Open')", [{}, 'Open'], false],
        ["an options object with a detail: ({ detail }, 'Open')", [{ detail: 'x' }, 'Open'], false],
        ["an options object with modal: ({ modal: true }, 'Open')", [{ modal: true }, 'Open'], true]
    ])('posts one notice with the one action Open: %s', async (_row, rest, modal) => {
        const { shell, messages } = shellOver('Open');
        const pressed = await shell.api.window.showInformationMessage('Saved', ...rest);
        expect([messages().map((one) => one.params), pressed]).toEqual([
            [{ kind: 'message', tone: 'info', message: 'Saved', items: ['Open'], modal }],
            'Open'
        ]);
    });

    it('keeps an item with a title as an item', async () => {
        const { shell, messages } = shellOver('Open');
        const open = { title: 'Open' };
        const pressed = await shell.api.window.showWarningMessage('Saved', open);
        expect([messages().map((one) => one.params.items), pressed]).toEqual([[['Open']], open]);
    });
});

describe('what a tree view reads back', () => {
    const provider = {
        getChildren: () => ['a', 'b'],
        getTreeItem: (element: string) => ({ label: element, id: element })
    };

    async function tree() {
        const made = shellOver();
        const view = made.shell.api.window.createTreeView('notes.list', {
            treeDataProvider: provider
        });
        await made.shell.provide({ kind: 'children', view: 'notes.list', handle: '' });
        return { ...made, view };
    }

    it('holds the selection and the visibility the page last sent, from before any to the last', async () => {
        const { shell, view } = await tree();
        const before = [view.selection, view.visible];
        shell.event({ kind: 'selection', view: 'notes.list', handles: ['b'] });
        shell.event({ kind: 'visibility', view: 'notes.list', visible: true });
        const during = [view.selection, view.visible];
        shell.event({ kind: 'selection', view: 'notes.list', handles: [] });
        shell.event({ kind: 'visibility', view: 'notes.list', visible: false });
        expect([before, during, [view.selection, view.visible]]).toEqual([
            [[], false],
            [['b'], true],
            [[], false]
        ]);
    });

    it('reads back the title, description, message and badge that were set', async () => {
        const { view } = await tree();
        const badge = { value: 3, tooltip: 'three' };
        Object.assign(view, { title: 'Notes', description: 'all', message: 'empty', badge });
        expect([view.title, view.description, view.message, view.badge]).toEqual([
            'Notes',
            'all',
            'empty',
            badge
        ]);
    });
});

describe('a tree element as a command argument', () => {
    const element = { name: 'a' };
    const provider = {
        getChildren: () => [element],
        getTreeItem: (one: typeof element) => ({
            label: one.name,
            id: one.name,
            command: { command: 'notes.open', arguments: [one, 2] }
        })
    };
    const marker = { $treeViewId: 'notes.list', $treeItemHandle: 'a' };

    async function called(args: (rows: { command: { arguments: unknown[] } }[]) => unknown[]) {
        const { shell } = shellOver();
        const got: unknown[][] = [];
        shell.api.commands.registerCommand('notes.open', (...given) => got.push(given));
        shell.api.window.createTreeView('notes.list', { treeDataProvider: provider });
        const rows = (await shell.provide({
            kind: 'children',
            view: 'notes.list',
            handle: ''
        })) as { command: { arguments: unknown[] } }[];
        await shell.provide({ kind: 'command', id: 'notes.open', args: args(rows) });
        return { rows, got, shell };
    }

    it("crosses as its marker in a row's command arguments and reaches the command as the element", async () => {
        const { rows, got } = await called((read) => read[0].command.arguments);
        expect([rows[0].command.arguments, got.length, got[0][0] === element, got[0][1]]).toEqual([
            [marker, 2],
            1,
            true,
            2
        ]);
    });

    it("reaches a command of the row's menu as the element", async () => {
        const { got } = await called(() => [marker]);
        expect([got.length, got[0][0] === element]).toEqual([1, true]);
    });

    it('rejects missing for a handle the host no longer holds', async () => {
        const { shell } = await called(() => [marker]);
        const gone = { $treeViewId: 'notes.list', $treeItemHandle: 'nope' };
        await expect(
            shell.provide({ kind: 'command', id: 'notes.open', args: [gone] })
        ).rejects.toThrow('missing');
    });
});

describe('affectsConfiguration', () => {
    it('matches whole dotted segments of the keys that changed', () => {
        const { shell } = shellOver();
        const heard: boolean[][] = [];
        shell.api.workspace.onDidChangeConfiguration(
            (event: { affectsConfiguration: (section: string) => boolean }) => {
                heard.push(
                    ['notes', 'notes.width', 'notes.w', 'note', 'other'].map((section) =>
                        event.affectsConfiguration(section)
                    )
                );
            }
        );
        shell.event({ kind: 'settings', keys: ['notes.width'], values: {} });
        expect(heard).toEqual([[true, true, false, false, false]]);
    });
});
