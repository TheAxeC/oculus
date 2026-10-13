// Layer 2, client state test. The page's store of what the apps add to the shell
// (lib/state/system/apps/shell/shell.svelte.ts): the commands Cmd-K lists with their hint, the key
// bound to a command, the status items drawn, what a press of a command or of a key does, and the
// custom editors a file opens in or is offered. These are the registry, key and editor rows of G77
// as the page reads them.
//
// The channels are plain payloads and the calls to the server a double that answers as the
// `/api/app-host` route does (tests/routes/apps). What this does NOT cover: the widgets that draw
// the rows (tests/views) and the host that runs the command (tests/server/machine/apps).

import { describe, expect, vi } from 'vitest';
import { noContributes } from '../../../../src/lib/data/helpers/files/apps/contributes.ts';
import type { AppRow, AppShellHost, AppStatusItem } from '../../../../src/lib/data/model/index.ts';
import type { Posted } from '../../../../src/lib/state/shared/stores/shapes.ts';
import type { CommandResult } from '../../../../src/lib/state/system/apps/shell/requests.svelte.ts';
import { createFrameShell } from '../../../../src/lib/state/system/apps/shell/frames.svelte.ts';
import { createAppShell } from '../../../../src/lib/state/system/apps/shell/shell.svelte.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

const row = (change: Partial<AppRow> = {}): AppRow =>
    fixtureApp({
        contributes: {
            ...noContributes(),
            commands: [
                {
                    command: 'notes.hello',
                    title: 'Hello',
                    category: 'Notes',
                    icon: '',
                    enablement: ''
                }
            ],
            keybindings: [
                {
                    command: 'notes.hello',
                    key: 'ctrl+alt+u',
                    mac: 'cmd+alt+u',
                    linux: '',
                    win: '',
                    when: '',
                    args: null
                }
            ],
            menus: {},
            viewsContainers: { activitybar: [], panel: [] },
            views: {},
            customEditors: [],
            configuration: null,
            themes: [],
            iconThemes: []
        },
        ...change
    });

const ITEM: AppStatusItem = {
    id: 'count',
    alignment: 'left',
    priority: 1,
    visible: true,
    text: '3 notes',
    tooltip: '',
    command: '',
    name: '',
    background: '',
    accessibility: ''
};

const HOST: AppShellHost = {
    app: 'app:notes',
    commands: ['notes.hello'],
    statusItems: [ITEM],
    trees: [],
    panels: [],
    context: { 'notes.ready': true }
};

const answer = (body: Record<string, unknown>): Posted => ({
    ok: body.ok === true,
    status: 200,
    body,
    failed: ''
});

/** A store over these rows and hosts, and what it posted and said. */
function store(
    rows: AppRow[],
    reply: Record<string, unknown> = { ok: true },
    over: {
        requests?: unknown;
        holds?: (root: string, path: string) => boolean;
        runInTab?: (app: string, command: string, args: unknown[]) => Promise<CommandResult | null>;
        config?: Record<string, unknown>;
    } = {}
) {
    const posted: Record<string, unknown>[] = [];
    const notices: string[] = [];
    const actions: { label: string; run: () => void }[][] = [];
    const shell = createAppShell({
        entities: {
            apps: () => ({ rows, findings: [], folders: [] }),
            appShell: () => ({ hosts: [HOST], requests: [] }),
            config: () => ({ config: over.config ?? {} }) as never
        },
        post: vi.fn((_path: string, body: unknown) => {
            posted.push(body as Record<string, unknown>);
            return Promise.resolve(answer(reply));
        }),
        notices: {
            post: (message, options) => {
                notices.push(message);
                actions.push(options?.actions ?? []);
                return notices.length;
            }
        },
        pageId: 'page',
        requests: (over.requests ?? {}) as never,
        frameItems: () => [],
        scmItems: () => [],
        picture: () => '',
        runInTab: over.runInTab ?? (() => Promise.resolve(null)),
        holds: over.holds ?? (() => false),
        fileOfTab: () => null,
        platform: 'mac'
    });
    return { shell, posted, notices, actions };
}

describe('Cmd-K and the shell while the state of an app changes', () => {
    it('lists the command with its category, its app and its key while the app acts', () => {
        const { shell } = store([row()]);
        expect(
            shell.commandRows().map((one) => [one.label, one.offer.appTitle, one.key, one.enabled])
        ).toEqual([['Notes: Hello', 'Notes', 'Cmd+Alt+U', true]]);
    });

    it.each([
        ['disabled', row({ disabled: true })],
        ['not approved', row({ approved: false, hashApproved: false })],
        ['changed since its approval', row({ hashApproved: false })]
    ])('draws nothing of an app that is %s', (_state, changed) => {
        const { shell } = store([changed]);
        expect([
            shell.commandRows(),
            shell.bound(),
            shell.keyRows(),
            shell.statusItems('left'),
            shell.hostOf('app:notes')
        ]).toEqual([[], [], [], [], undefined]);
    });

    it('draws the status item of the host of an app that acts', () => {
        const { shell } = store([row()]);
        expect(shell.statusItems('left').map((one) => [one.key, one.item.text])).toEqual([
            ['app:notes/count', '3 notes']
        ]);
        expect(shell.statusItems('right')).toEqual([]);
    });
});

describe('a press of a command', () => {
    it('posts the run of the command to the host of its app', async () => {
        const { shell, posted } = store([row()]);
        expect(await shell.run('app:notes', 'notes.hello', ['x'])).toBe(true);
        expect(posted).toEqual([
            { action: 'run', command: 'notes.hello', args: ['x'], app: 'app:notes' }
        ]);
    });

    it('says which command of which app nothing handled', async () => {
        const { shell, notices } = store([row()], { ok: false, word: 'missing' });
        expect(await shell.run('app:notes', 'notes.hello')).toBe(false);
        expect(notices).toEqual(['Nothing handled the command notes.hello of the app Notes.']);
    });

    it('says the program of the app stopped, with Restart, when the host answers `host_down`', async () => {
        const { shell, notices, actions, posted } = store([row()], {
            ok: false,
            word: 'host_down'
        });
        expect(await shell.run('app:notes', 'notes.hello')).toBe(false);
        const said = [notices, actions.map((one) => one.map((action) => action.label))];
        actions[0][0].run();
        expect([...said, posted.at(-1)]).toEqual([
            [
                'The command notes.hello of the app Notes did not run, because the program of the app stopped.'
            ],
            [['Restart']],
            { action: 'restart', view: 'app:notes' }
        ]);
    });

    it('runs a command only an open tab registered through that tab when the host answers `missing`', async () => {
        const tabbed: unknown[][] = [];
        const { shell, notices } = store(
            [row()],
            { ok: false, word: 'missing' },
            {
                runInTab: (app, command, args) => {
                    tabbed.push([app, command, args]);
                    return Promise.resolve({ ok: true, value: null });
                }
            }
        );
        expect(await shell.run('app:notes', 'notes.hello', ['x'])).toBe(true);
        expect([tabbed, notices]).toEqual([[['app:notes', 'notes.hello', ['x']]], []]);
    });

    it('says the command failed when the tab that held it answers a refusal', async () => {
        const { shell, notices } = store(
            [row()],
            { ok: false, word: 'missing' },
            {
                runInTab: () => Promise.resolve({ ok: false, word: 'refused:params' })
            }
        );
        expect(await shell.run('app:notes', 'notes.hello')).toBe(false);
        expect(notices).toEqual(['The command notes.hello of the app Notes failed.']);
    });

    it('runs the command of a key that the keybindings bind', () => {
        const { shell, posted } = store([row()]);
        const taken = shell.press(
            { key: 'u', code: 'KeyU', metaKey: true, altKey: true } as KeyboardEvent,
            { tab: null, status: null, textual: false, editor: false }
        );
        expect([taken, posted]).toEqual([
            true,
            [{ action: 'run', command: 'notes.hello', args: [], app: 'app:notes' }]
        ]);
    });

    it('leaves the press of a text field to oculus', () => {
        const { shell, posted } = store([row()]);
        const taken = shell.press(
            { key: 'u', code: 'KeyU', metaKey: true, altKey: true } as KeyboardEvent,
            { tab: null, status: null, textual: true, editor: false }
        );
        expect([taken, posted]).toEqual([false, []]);
    });
});

describe('the context keys of the hosts', () => {
    it('hold a key an app that acts set', () => {
        const { shell } = store([row()]);
        expect([shell.keys()['notes.ready'], shell.holds('notes.ready')]).toEqual([true, true]);
    });
});

/** A custom editor of `notes` for the files that match the patterns. */
const editorRow = (priority: 'default' | 'option', ...selector: string[]): AppRow => {
    const base = row();
    return {
        ...base,
        contributes: {
            ...base.contributes,
            customEditors: [
                {
                    viewType: 'notes.edit',
                    displayName: 'Table',
                    selector,
                    priority,
                    entry: 'edit.html'
                }
            ]
        }
    };
};

describe('the custom editors an app offers', () => {
    it('opens a file that matches a default editor in it, in any case of its name', () => {
        const { shell } = store([editorRow('default', '*.csv')]);
        expect(shell.opens.editorFor('hub', 'data/Data.CSV')).toEqual({
            app: 'app:notes',
            viewType: 'notes.edit'
        });
        expect(shell.opens.editorFor('hub', 'data/data.json')).toBeNull();
    });

    it('opens a file of an apps folder as source text', () => {
        const { shell } = store(
            [editorRow('default', '*.csv')],
            { ok: true },
            { holds: () => true }
        );
        expect([
            shell.opens.editorFor('apps', 'notes/data.csv'),
            shell.editorsOf('apps', 'notes/data.csv')
        ]).toEqual([null, []]);
    });

    it('leaves a file to the text editor while the editor is an option, and lists it for Open With', () => {
        const { shell } = store([editorRow('option', '*.csv')]);
        expect(shell.opens.editorFor('hub', 'data.csv')).toBeNull();
        expect(shell.editorsOf('hub', 'data.csv').map((one) => one.editor.viewType)).toEqual([
            'notes.edit'
        ]);
    });

    it('offers no editor of an app that is disabled or changed', () => {
        const disabled = { ...editorRow('default', '*.csv'), disabled: true };
        const changed = { ...editorRow('default', '*.csv'), hashApproved: false };
        expect(
            [disabled, changed].map((one) => store([one]).shell.opens.editorFor('hub', 'a.csv'))
        ).toEqual([null, null]);
    });

    it('asks Open With over Text Editor and each matching editor, naming the default', async () => {
        const asked: {
            items: { label: string; description: string; detail: string }[];
            title: string;
        }[] = [];
        const requests = {
            ask: (_app: string, body: (typeof asked)[number]) => {
                asked.push(body);
                return { id: 'r1', answer: Promise.resolve([1]) };
            }
        };
        const { shell } = store([editorRow('default', '*.csv')], { ok: true }, { requests });
        const chosen = await shell.chooseEditor('hub', 'data/data.csv');
        expect(chosen).toEqual({ kind: 'editor', app: 'app:notes', viewType: 'notes.edit' });
        expect(asked[0].items.map((one) => [one.label, one.description, one.detail])).toEqual([
            ['Text Editor', '', ''],
            ['Table', 'Notes', 'Default']
        ]);
    });

    it('answers the text editor for the first row and null for a dismissed pick', async () => {
        const answers: unknown[] = [[0], undefined];
        const requests = {
            ask: () => ({ id: 'r', answer: Promise.resolve(answers.shift()) })
        };
        const { shell } = store([editorRow('option', '*.csv')], { ok: true }, { requests });
        expect(await shell.chooseEditor('hub', 'a.csv')).toEqual({ kind: 'text' });
        expect(await shell.chooseEditor('hub', 'a.csv')).toBeNull();
    });
});

describe('the registrations of the frames of one app', () => {
    const NOTES = { id: 'app:notes', name: 'notes' };

    it('keeps a status item until the last tab of the app closes', () => {
        const frames = createFrameShell();
        frames.attach('first', NOTES.id);
        frames.attach('second', NOTES.id);
        expect(frames.register('first', NOTES, 'statusItem', 'count', {})).toBeNull();
        const names = () => frames.items().map((one) => one.item.id);
        expect(names()).toEqual(['count']);
        frames.drop('first');
        expect(names()).toEqual(['count']);
        frames.drop('second');
        expect(names()).toEqual([]);
    });

    it('lets the tab left open change and unregister the item the closed tab registered', () => {
        const frames = createFrameShell();
        frames.attach('first', NOTES.id);
        frames.attach('second', NOTES.id);
        frames.register('first', NOTES, 'statusItem', 'count', {});
        frames.drop('first');
        frames.changed('second', 'count', { text: '4 notes' });
        expect(frames.items().map((one) => one.item.text)).toEqual(['4 notes']);
        frames.unregister('second', 'statusItem', 'count');
        expect(frames.items()).toEqual([]);
    });

    it('ends the commands a tab registered with the tab', () => {
        const frames = createFrameShell();
        frames.attach('first', NOTES.id);
        frames.attach('second', NOTES.id);
        frames.register('first', NOTES, 'command', 'notes.hello', {});
        expect(frames.tabFor(NOTES.id, 'notes.hello')).toBe('first');
        frames.drop('first');
        expect(frames.tabFor(NOTES.id, 'notes.hello')).toBeUndefined();
    });

    it('does not hold an item of an app whose tabs are all closed', () => {
        const frames = createFrameShell();
        frames.attach('only', NOTES.id);
        frames.register('only', NOTES, 'statusItem', 'count', {});
        frames.drop('only');
        expect(frames.items()).toEqual([]);
    });
});

describe('the themes the acting apps offer', () => {
    const THEMED = (change: Partial<AppRow> = {}): AppRow => {
        const base = row();
        return {
            ...base,
            contributes: {
                ...base.contributes,
                themes: [{ label: 'Paper', uiTheme: 'vs', path: 'paper.json' }],
                iconThemes: [{ id: 'dots', label: 'Dots', path: 'dots.json' }]
            },
            ...change
        };
    };

    it('lists the colour themes and icon themes of an approved app under their saved names', () => {
        const { shell } = store([THEMED()]);
        const offers = shell.offers();
        expect([
            offers.themes?.map((one) => [one.choice, one.label, one.appTitle]),
            offers.icons?.map((one) => [one.choice, one.label, one.appTitle])
        ]).toEqual([
            [['app:notes/Paper', 'Paper', row().title]],
            [['app:notes/dots', 'Dots', row().title]]
        ]);
    });

    it('offers none from an app that is not approved', () => {
        const { shell } = store([THEMED({ hashApproved: false })]);
        expect(shell.offers()).toEqual({ themes: [], icons: [] });
    });
});
