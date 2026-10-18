// Layer 3, shell test. A page's answer to a command of the desktop app's menu
// (shell/window/menu-answer.ts): each name of the list runs its page command once, an unknown name
// or a command with an argument it does not take runs nothing, and under an overlay nothing runs.
// The page is a stub that records each call, so a row names the one call its command makes. A
// second table builds the page over a stub client as a popped-out window's page builds it, and
// holds that Save and Revert File act on that window's float and not on the main area. A third
// builds the page over stub stores and runs each colon command a menu command names through the
// palette's own command list: one that takes an argument or lists choices opens the palette typed
// with its name, one that runs at once runs its effect once, and one that is unavailable says why
// as a notice.
//
// What this does NOT cover: the bridge that carries the message, the workbench's own carrying out
// of a key's action (which pane Close Tab closes in is read from the focus, which the look checks),
// and what the stores do with an effect, which their own tests read.

import { describe, expect, it } from 'vitest';
import {
    REVERT_ACTION,
    SAVE_ACTION
} from '../../../src/lib/state/workbench/navigation/editor-status.svelte.ts';
import { answerMenu, menuPage, type MenuPage } from '../../../src/lib/shell/window/menu-answer.ts';
import { MENU_COMMANDS } from '../../../src/lib/data/helpers/keys/oculus/menu-commands.ts';
import { pageActiveTab } from '../../../src/lib/shell/panes/workbench-title.ts';
import { installRealText } from '../../views/shared/real-text.ts';

installRealText();

/** A page that records every call it is asked for, with whether an overlay covers it. */
function recorder(covered = false) {
    const calls: unknown[][] = [];
    const record =
        (name: string) =>
        (...args: unknown[]): void =>
            void calls.push([name, ...args]);
    const page: MenuPage = {
        covered: () => covered,
        act: record('act'),
        openPalette: record('openPalette'),
        openView: record('openView'),
        colon: record('colon'),
        save: record('save'),
        saveAll: record('saveAll'),
        revert: record('revert'),
        terminal: record('terminal'),
        split: record('split'),
        openRecent: record('openRecent')
    };
    return { page, calls };
}

/** Each command of the list, the argument it is sent with and the one call it makes. */
const ROWS: [string, unknown, unknown[]][] = [
    ['settings', undefined, ['openView', 'settings']],
    ['new-text-file', undefined, ['act', { kind: 'new-text-file' }]],
    ['open-folder', undefined, ['colon', 'folder']],
    [
        'open-recent',
        '/hub/.oculus/workspaces/one.yml',
        ['openRecent', '/hub/.oculus/workspaces/one.yml']
    ],
    ['add-folder', undefined, ['colon', 'folder-add']],
    ['switch-workspace', undefined, ['colon', 'workspace']],
    ['new-workspace', undefined, ['colon', 'workspace-new']],
    ['save-workspace-as', undefined, ['colon', 'workspace-save']],
    ['close-workspace', undefined, ['colon', 'workspace-close']],
    ['save', undefined, ['save']],
    ['save-all', undefined, ['saveAll']],
    ['revert-file', undefined, ['revert']],
    ['reopen-closed-tab', undefined, ['act', { kind: 'reopen-closed-tab' }]],
    ['close-tab', undefined, ['act', { kind: 'close-tab' }]],
    ['clone-repository', undefined, ['colon', 'clone']],
    ['find', undefined, ['act', { kind: 'find' }]],
    ['find-in-files', undefined, ['act', { kind: 'find-in-files' }]],
    ['command-palette', undefined, ['openPalette', ':', false, false]],
    ['quick-open', undefined, ['openPalette', '', false, false]],
    ['open-view', undefined, ['colon', 'tab']],
    ['toggle-left-dock', undefined, ['colon', 'toggle-left-dock']],
    ['toggle-right-dock', undefined, ['colon', 'toggle-right-dock']],
    ['toggle-bottom-dock', undefined, ['colon', 'toggle-bottom-dock']],
    ['theme', undefined, ['colon', 'theme']],
    ['file-icon-theme', undefined, ['colon', 'file-icons']],
    ['crt', undefined, ['colon', 'crt']],
    ['go-back', undefined, ['act', { kind: 'go-back' }]],
    ['go-forward', undefined, ['act', { kind: 'go-forward' }]],
    ['go-to-file', undefined, ['openPalette', '', true, false]],
    ['go-to-symbol', undefined, ['act', { kind: 'workspace-symbol' }]],
    ['go-to-line', undefined, ['openPalette', ':', false, true]],
    ['go-to-project', undefined, ['colon', 'goto']],
    ['debug-start', undefined, ['act', { kind: 'debug', which: 'start' }]],
    ['debug-stop', undefined, ['act', { kind: 'debug', which: 'stop' }]],
    ['debug-restart', undefined, ['act', { kind: 'debug', which: 'restart' }]],
    ['debug-over', undefined, ['act', { kind: 'debug', which: 'over' }]],
    ['debug-into', undefined, ['act', { kind: 'debug', which: 'into' }]],
    ['debug-out', undefined, ['act', { kind: 'debug', which: 'out' }]],
    ['debug-toggle', undefined, ['act', { kind: 'debug', which: 'toggle' }]],
    ['new-terminal', undefined, ['terminal', 'shell']],
    ['terminal-shell', undefined, ['terminal', 'shell']],
    ['terminal-claude', undefined, ['terminal', 'claude']],
    ['terminal-codex', undefined, ['terminal', 'codex']],
    ['split-terminal', undefined, ['split']],
    ['next-tab', undefined, ['act', { kind: 'cycle-tab', by: 1 }]],
    ['previous-tab', undefined, ['act', { kind: 'cycle-tab', by: -1 }]],
    ['help', undefined, ['openView', 'help']],
    ['keyboard-shortcuts', undefined, ['act', { kind: 'sheet' }]],
    ['update-tasks', undefined, ['colon', 'update']]
];

describe("a page's answer to a menu command", () => {
    it('holds a row for every command of the list', () => {
        expect(ROWS.map(([name]) => name)).toEqual([...MENU_COMMANDS]);
    });

    it.each(ROWS)('runs %s once', (name, argument, call) => {
        const { page, calls } = recorder();
        expect(answerMenu(page, name, argument)).toBe(true);
        expect(calls).toEqual([call]);
    });

    it.each([
        ['a name not in the list', 'check-for-updates', undefined],
        ['a name that is no text', 7, undefined],
        ['Open Recent with no path', 'open-recent', undefined],
        ['Open Recent with an empty path', 'open-recent', ''],
        ['Open Recent with a path that is no text', 'open-recent', { path: '/a' }]
    ])('runs nothing for %s', (_case, name, argument) => {
        const { page, calls } = recorder();
        expect(answerMenu(page, name, argument)).toBe(false);
        expect(calls).toEqual([]);
    });

    it.each(ROWS)('runs nothing for %s under an overlay', (name, argument) => {
        const { page, calls } = recorder(true);
        expect(answerMenu(page, name, argument)).toBe(false);
        expect(calls).toEqual([]);
    });
});

describe("a popped-out window's answer", () => {
    /** A main area showing source tab `s1` and a float `f1` showing source tab `s2`. */
    function floatPage() {
        const asked: [string, unknown][] = [];
        const acted: unknown[] = [];
        const main = { id: 's1', view: 'source' };
        const floats = [
            {
                id: 'f1',
                pane: { tabs: [{ id: 's2', view: 'source' }], active: 's2' },
                place: { kind: 'window', x: 0, y: 0, w: 600, h: 400 }
            }
        ];
        const status = { file: { root: 'repo', path: 'a.md' } };
        const client = {
            float: 'f1',
            editorStatus: {
                statusOf: (id: string) => (id === 's1' || id === 's2' ? status : null),
                ask: (id: string, ask: unknown) => void asked.push([id, ask])
            },
            ui: { saveTab: () => false },
            apps: { save: () => Promise.resolve() },
            debug: { takes: () => false }
        };
        const page = menuPage(client as never, {
            covered: () => false,
            act: (action) => void acted.push(action),
            openPalette: () => undefined,
            openUpdate: () => undefined,
            saveAll: () => undefined,
            tab: () => pageActiveTab('f1', floats as never, main as never)
        });
        return { page, asked, acted };
    }

    it("saves and reverts the float's tab, not the main area's", () => {
        const { page, asked } = floatPage();
        answerMenu(page, 'save');
        answerMenu(page, 'revert-file');
        expect(asked).toEqual([
            ['s2', { kind: 'action', id: SAVE_ACTION }],
            ['s2', { kind: 'action', id: REVERT_ACTION }]
        ]);
    });

    it("hands Close Tab to the window's own keys, once", () => {
        const { page, acted } = floatPage();
        answerMenu(page, 'close-tab');
        expect(acted).toEqual([{ kind: 'close-tab' }]);
    });
});

describe('the colon commands a menu command runs', () => {
    /**
     * A page over stub stores that record each effect: the palette's configuration has the themes
     * `themes` names, the folder panel is open when `panelOpen` says, and a float is docked at each
     * edge `docked` names.
     */
    function colonPage(
        panelOpen = false,
        docked: string[] = ['left', 'bottom', 'right'],
        themes: string[] = ['light', 'dark']
    ) {
        const calls: unknown[][] = [];
        const record =
            (name: string, answer?: unknown) =>
            (...args: unknown[]): unknown => {
                calls.push([name, ...args]);
                return answer;
            };
        const done = Promise.resolve({ ok: true });
        const client = {
            float: null,
            paletteSource: {
                paletteSource: () => ({ config: { themes: themes.map((name) => ({ name })) } })
            },
            appShell: { offers: () => ({ themes: [], icons: [] }) },
            explorer: {
                panelOpen: () => panelOpen,
                openFolder: record('openFolder', done),
                addFolders: record(
                    'addFolders',
                    Promise.resolve({ ok: true, added: 1, skipped: [], refused: '' })
                )
            },
            fs: {
                closeWorkspace: record('closeWorkspace', done),
                selectWorkspace: record('selectWorkspace', done)
            },
            ui: { crt: () => false, setCrt: record('setCrt') },
            layout: {
                floats: () =>
                    docked.map((edge, at) => ({ id: `d${at}`, place: { kind: 'dock', edge } })),
                toggleDock: record('toggleDock')
            },
            notices: { post: record('notice', 1) }
        };
        const page = menuPage(client as never, {
            covered: () => false,
            act: record('act'),
            openPalette: record('openPalette'),
            openUpdate: record('openUpdate'),
            saveAll: record('saveAll'),
            tab: () => null
        });
        return { page, calls };
    }

    /** Each menu command that runs a colon command, and the one call the colon command makes. */
    const COLON_ROWS: [string, unknown[]][] = [
        ['open-folder', ['openFolder']],
        ['add-folder', ['addFolders']],
        ['switch-workspace', ['openPalette', ':workspace ', false, false]],
        ['new-workspace', ['openPalette', ':workspace-new ', false, false]],
        ['save-workspace-as', ['openPalette', ':workspace-save ', false, false]],
        ['close-workspace', ['closeWorkspace', { said: true }]],
        ['clone-repository', ['openPalette', ':clone ', false, false]],
        ['open-view', ['openPalette', ':tab ', false, false]],
        ['toggle-left-dock', ['toggleDock', 'left']],
        ['toggle-right-dock', ['toggleDock', 'right']],
        ['toggle-bottom-dock', ['toggleDock', 'bottom']],
        ['theme', ['openPalette', ':theme ', false, false]],
        ['file-icon-theme', ['openPalette', ':file-icons ', false, false]],
        ['crt', ['setCrt', true]],
        ['go-to-project', ['openPalette', ':goto ', false, false]],
        ['update-tasks', ['openUpdate']]
    ];

    it('holds a row for every menu command that runs a colon command', () => {
        const through = ROWS.filter(([, , call]) => call[0] === 'colon').map(([name]) => name);
        expect(COLON_ROWS.map(([name]) => name)).toEqual(through);
    });

    it.each(COLON_ROWS)('runs the colon command of %s once', async (name, call) => {
        const { page, calls } = colonPage();
        expect(answerMenu(page, name)).toBe(true);
        await Promise.resolve();
        await Promise.resolve();
        expect(calls).toEqual([call]);
    });

    it('switches to the file Open Recent sends, as a pick of `:workspace` does', async () => {
        const { page, calls } = colonPage();
        answerMenu(page, 'open-recent', '/hub/.oculus/workspaces/one.yml');
        await Promise.resolve();
        await Promise.resolve();
        expect(calls).toEqual([
            ['selectWorkspace', '/hub/.oculus/workspaces/one.yml', { said: true }]
        ]);
    });

    it.each([
        ['open-folder', 'The folder panel is already open.'],
        ['add-folder', 'The folder panel is already open.']
    ])('says why %s does not run while the folder panel is open', (name, words) => {
        const { page, calls } = colonPage(true);
        answerMenu(page, name);
        expect(calls).toEqual([['notice', words, { tone: 'warning' }]]);
    });

    it('says why a dock toggle does not run with no float docked at its edge', () => {
        const { page, calls } = colonPage(false, ['bottom']);
        answerMenu(page, 'toggle-left-dock');
        expect(calls).toEqual([['notice', 'No float is docked at this edge', { tone: 'warning' }]]);
    });

    it('names an unavailable command with no reason of its own in its notice', () => {
        const { page, calls } = colonPage(false, ['left', 'bottom', 'right'], []);
        answerMenu(page, 'theme');
        expect(calls).toEqual([['notice', 'Switch the theme: unavailable', { tone: 'warning' }]]);
    });
});
