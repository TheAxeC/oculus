// Layer 4, view test. The Terminal view as a terminal panel: the steer box drawn only under an
// agent, the list of terminals on the right from two terminals on, each row titled after what runs
// in it, the one terminal's title on the bar, the rows in the page's stored order, and the pure
// rules the grid's paste question and file drop go by.
//
// What this does NOT cover: anything that needs a DOM. The grid is xterm.js, which the server
// render does not mount, so a paste, a drop, a bell, a hover, an arrow key and a drag are not
// performed here; the rules they call (the line count, the quoting, the order) are asserted as
// pure functions, named audits by the tree's rule for a case that draws nothing, and the look on
// landing sees the rest. Keeping the stored order across a reload is the layout store's, and is
// tested in tests/state/workbench/layout/pages.test.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Terminal from '../../../src/lib/views/sessions/terminal/Terminal.svelte';
import type { ITerminalOptions } from '@xterm/xterm';
import {
    applyLook,
    gridLook,
    gridOptions
} from '../../../src/lib/views/sessions/terminal/grid-look.ts';
import {
    listDrawn,
    movedOrder,
    orderedRows,
    pasteLines,
    armKept,
    rowKey,
    shellQuote,
    storedOrder
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { area, payload, record, terminal, workspace } from '../../fixtures/sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { ALPHA, HUB, catalog, installFixture, tree } from './views-fixture.ts';

let client: ClientState;
let version = 500;

beforeEach(() => {
    client = createClientState();
    installFixture(client);
});

const fix = record('fix-one', {
    title: 'Fix the parser',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA
});

const claude = terminal('a1b2c3-claude', {
    kind: 'claude',
    name: 'claude',
    command: 'node',
    cwd: ALPHA,
    created: '2026-09-11T08:00:00.000Z',
    resumes: { tool: 'claude', id: 'fix-one' }
});

const vim = terminal('d4e5f6-shell', {
    kind: 'shell',
    name: 'd4e5f6-shell',
    command: 'vim',
    cwd: '/Users/x/work/oculus',
    created: '2026-09-11T09:00:00.000Z'
});

const bare = terminal('0a0b0c-shell', {
    kind: 'shell',
    name: '0a0b0c-shell',
    command: '',
    cwd: '/Users/x/work/plain',
    created: '2026-09-11T10:00:00.000Z'
});

const outside = terminal('outside', {
    kind: 'shell',
    name: 'work',
    command: 'bash',
    cwd: '/Users/x/elsewhere',
    foreign: true
});

/** The fixture's sessions with "Fix the parser" in them and these terminals beside them. */
function withTerminals(...panes: (typeof claude)[]): void {
    const sessions = [...tree, workspace('/fix', [area(ALPHA, [fix])])];
    const whole = { ...payload(sessions), terminals: panes };
    client.entities.receive({ channel: 'sessions', version: (version += 1), payload: whole });
}

/** One Terminal tab on the current page, with its page's stored state set before it renders. */
function html(state: unknown = {}, page?: unknown): string {
    const id = `terminal-${(version += 1)}`;
    client.ui.setInstanceState(id, state);
    const instance: Instance = { id, view: 'terminal', state };
    client.layout.apply({ root: { kind: 'pane', tabs: [instance], active: id } });
    if (page !== undefined) client.layout.setPageViewState(id, page);
    return render(Terminal, { context: clientContext(client), props: { instance } }).body;
}

/** The terminal ids of the list's rows, in the order they are drawn. */
function rowOrder(body: string): string[] {
    return [...body.matchAll(/data-terminal-row="([^"]+)"/g)].map((match) => match[1]);
}

/** Each row's markup, from its opening to the next row's, the last one to the end of the list. */
function rowSlices(body: string): string[] {
    const starts = [...body.matchAll(/data-terminal-row="/g)].map((match) => match.index);
    return starts.map((at, index) => body.slice(at, starts[index + 1] ?? body.length));
}

/** The markup of the list alone, from its opening to the end of the body. */
function listOf(body: string): string {
    const at = body.indexOf('data-terminal-list');
    return at < 0 ? '' : body.slice(at);
}

/** The words inside the first element carrying this attribute. */
function textOf(body: string, attribute: string, from = 0): string {
    const at = body.indexOf(attribute, from);
    if (at < 0) return '';
    const open = body.indexOf('>', at);
    const close = body.indexOf('</', open);
    return body
        .slice(open + 1, close)
        .replace(/<!--[^>]*-->/g, '')
        .trim();
}

describe('the steer box under the grid', () => {
    it('is drawn under an agent terminal', () => {
        withTerminals(claude);
        client.selection.select(claude.id);
        const body = html();
        expect(body).toContain(`data-terminal="${claude.id}"`);
        expect(body).toContain('data-steer');
    });

    it('is not drawn under a shell, whose grid takes the whole height', () => {
        withTerminals(vim);
        client.selection.select(vim.id);
        const body = html();
        expect(body).toContain(`data-terminal="${vim.id}"`);
        // a shell is typed into at the grid, so nothing steers it from below
        expect(body).not.toContain('data-steer');
    });

    it('stays disabled with its sentence for an agent session running outside oculus', () => {
        withTerminals(claude);
        client.selection.select('ended-one');
        const body = html();
        expect(body).toContain('data-runs-elsewhere');
        expect(body).toContain('data-steer-elsewhere');
        expect(body).toMatch(/<textarea[^>]*readonly/);
    });
});

describe('one terminal', () => {
    it('draws no list and puts its title and description on the bar', () => {
        withTerminals(vim);
        client.selection.select(vim.id);
        const body = html();
        // one terminal leaves nothing to choose between, so no list is drawn
        expect(body).not.toContain('data-terminal-list');
        expect(textOf(body, 'data-terminal-title')).toBe('vim');
        expect(textOf(body, 'data-terminal-description')).toBe('oculus');
        // the bar names the one terminal there is, and no menu of terminals is offered
        expect(body).not.toContain('data-session-picker');
    });
});

describe('the list of terminals', () => {
    it('draws one row per terminal, titled after what runs, the shown one marked current', () => {
        withTerminals(claude, vim);
        client.selection.select(claude.id);
        const body = html();
        expect(body).toContain('data-terminal-list');
        expect(rowOrder(body)).toEqual([claude.id, vim.id]);
        const first = body.indexOf(`data-terminal-row="${claude.id}"`);
        const second = body.indexOf(`data-terminal-row="${vim.id}"`);
        expect(textOf(body, 'data-row-title', first)).toBe('Claude');
        expect(textOf(body, 'data-row-description', first)).toBe('Fix the parser');
        expect(textOf(body, 'data-row-title', second)).toBe('vim');
        expect(textOf(body, 'data-row-description', second)).toBe('oculus');
        expect(body.slice(first, second)).toContain('data-current');
        // the shell is not what this tab shows, so its row carries no mark
        expect(body.slice(second)).not.toContain('data-current');
        // the list names every terminal, so the bar names none of its own
        expect(body).not.toContain('data-terminal-title');
    });

    it('titles a shell tmux reports no command for "shell"', () => {
        withTerminals(vim, bare);
        client.selection.select(vim.id);
        const body = html();
        const at = body.indexOf(`data-terminal-row="${bare.id}"`);
        expect(textOf(body, 'data-row-title', at)).toBe(catalog['sessions.terminal_title_shell']);
        expect(catalog['sessions.terminal_title_shell']).toBe('shell');
        expect(textOf(body, 'data-row-description', at)).toBe('plain');
    });

    it('holds no row for a terminal oculus did not start', () => {
        withTerminals(claude, vim, outside);
        client.selection.select(claude.id);
        const body = html();
        expect(rowOrder(body)).toEqual([claude.id, vim.id]);
    });

    it('offers Split and Kill on every row, and a tooltip naming the terminal', () => {
        withTerminals(claude, vim);
        client.selection.select(claude.id);
        const body = html();
        const rows = rowSlices(body);
        expect(rows).toHaveLength(2);
        for (const row of rows) {
            expect(row.split(`aria-label="${catalog['sessions.terminal_split']}"`)).toHaveLength(2);
            expect(row.split(`aria-label="${catalog['sessions.terminal_kill']}"`)).toHaveLength(2);
        }
        expect(body).toContain('vim');
        expect(body).toContain('/Users/x/work/oculus');
    });

    it('is one stop of the focus order: the row at the stop, and none of its controls', () => {
        withTerminals(claude, vim, bare);
        client.selection.select(vim.id);
        const list = listOf(html());
        expect(list.split('tabindex="0"')).toHaveLength(2);
        const stop = list.indexOf('tabindex="0"');
        const tag = list.slice(list.lastIndexOf('<', stop), list.indexOf('>', stop));
        expect(tag).toContain(`data-stop="${vim.id}"`);
    });

    it('draws the one terminal there is as a row while the tab shows the composer', () => {
        withTerminals(vim);
        const body = html({ id: 'a-tab-of-its-own' });
        expect(body).toContain('data-composer-prompt');
        expect(rowOrder(body)).toEqual([vim.id]);
        const at = body.indexOf(`data-terminal-row="${vim.id}"`);
        expect(textOf(body, 'data-row-title', at)).toBe('vim');
    });

    it('draws no list under the composer when no terminal runs', () => {
        withTerminals();
        const body = html({ id: 'a-tab-of-its-own' });
        expect(body).toContain('data-composer-prompt');
        // with no terminal running there is no row to draw
        expect(body).not.toContain('data-terminal-list');
    });

    it("draws the rows in the page's stored order, a terminal missing from it last", () => {
        withTerminals(claude, vim, bare);
        client.selection.select(claude.id);
        const body = html({}, { order: [vim.id, claude.id] });
        expect(rowOrder(body)).toEqual([vim.id, claude.id, bare.id]);
    });
});

describe('a composer opened by Split', () => {
    it("starts in the split terminal's own folder, though no place of the composer holds it", () => {
        withTerminals(vim);
        const split = '/hub/projects/foo/code';
        const body = html({
            id: 'split-tab',
            composer: { workspace: split, agent: 'shell', split }
        });
        expect(body).toContain('data-composer-prompt');
        const picker = body.indexOf('data-picker="workspace"');
        expect(picker).toBeGreaterThan(-1);
        expect(body.slice(picker, picker + 600)).toContain('>code<');
    });
});

describe('the rules the list and the grid go by', () => {
    it('audits the quoting of a dropped path: a single quote is close, escaped quote, open', () => {
        expect(shellQuote("/tmp/it's here.txt")).toBe("'/tmp/it'\\''s here.txt'");
        expect(shellQuote('/tmp/plain')).toBe("'/tmp/plain'");
    });

    it('audits the line count a paste is held and asked about by, and one line passing', () => {
        expect(pasteLines('a\nb\nc')).toBe(3);
        expect(pasteLines('a\r\nb')).toBe(2);
        expect(pasteLines('abc')).toBe(null);
        expect(catalog['sessions.paste_confirm'].replace('{0}', '3')).toContain('3');
    });

    it('audits the row order: the stored order first, the rest by start time', () => {
        const rows = [
            { terminal: 'b', created: '2026-09-11T09:00:00.000Z' },
            { terminal: 'a', created: '2026-09-11T08:00:00.000Z' },
            { terminal: 'c', created: '2026-09-11T10:00:00.000Z' }
        ];
        expect(orderedRows(rows, []).map((one) => one.terminal)).toEqual(['a', 'b', 'c']);
        expect(orderedRows(rows, ['c', 'a']).map((one) => one.terminal)).toEqual(['c', 'a', 'b']);
        // a stored id no terminal carries any more is passed over
        expect(orderedRows(rows, ['gone', 'b']).map((one) => one.terminal)).toEqual([
            'b',
            'a',
            'c'
        ]);
    });

    it('audits the order a dragged row leaves: the row where it was dropped', () => {
        expect(movedOrder(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
        expect(movedOrder(['a', 'b', 'c'], 'a', 3)).toEqual(['b', 'c', 'a']);
        expect(movedOrder(['a', 'b', 'c'], 'x', 0)).toEqual(['a', 'b', 'c']);
    });

    it('audits when the list is drawn: two terminals, or one under the composer', () => {
        expect(listDrawn(2, false)).toBe(true);
        expect(listDrawn(1, true)).toBe(true);
        expect(listDrawn(1, false)).toBe(false);
        expect(listDrawn(0, true)).toBe(false);
    });

    it('audits the keys a row answers: Delete and Backspace kill, Shift+Enter splits', () => {
        expect(rowKey('Delete', false, false)).toBe('kill');
        expect(rowKey('Backspace', false, false)).toBe('kill');
        expect(rowKey('Enter', true, false)).toBe('split');
        expect(rowKey('Enter', false, false)).toBe('show');
        expect(rowKey('a', false, false)).toBe(null);
        expect(rowKey('ArrowDown', false, false)).toBe(null);
    });

    it('audits a held key: an auto-repeated Delete or Backspace kills nothing', () => {
        expect(rowKey('Backspace', false, true)).toBe(null);
        expect(rowKey('Delete', false, true)).toBe(null);
        expect(rowKey('Backspace', false, false)).toBe('kill');
        expect(rowKey('Delete', false, false)).toBe('kill');
    });

    it('audits the arm of Kill: kept only while its row is the stop', () => {
        expect(armKept('a', 'a')).toBe(true);
        expect(armKept('a', 'b')).toBe(false);
        expect(armKept('', 'a')).toBe(false);
    });

    it('audits the stored order read back, and nothing from a value that is not one', () => {
        expect(storedOrder({ order: ['a', 'b'] })).toEqual(['a', 'b']);
        expect(storedOrder({ order: ['a', 3, ''] })).toEqual(['a']);
        expect(storedOrder(undefined)).toEqual([]);
        expect(storedOrder(['a'])).toEqual([]);
        expect(storedOrder({ order: ['a', 'a'] })).toEqual(['a']);
    });
});

describe("the grid's font and selection", () => {
    /** The tokens the stubbed body carries, and the other element, which carries none of them. */
    const BODY = { tokens: true };
    const TOKENS: Record<string, string> = {
        '--font-mono': ' "JetBrains Mono", monospace ',
        '--accent-bg': ' #d0e4ff ',
        '--on-accent-bg': ' #0a1a2f ',
        '--panel': '#ffffff',
        '--ink': '#111111',
        '--accent': '#3366ff'
    };

    /** Stub the body's computed style with these tokens, and nothing on any other element. */
    function stubBody(tokens: Record<string, string>): void {
        vi.stubGlobal('document', { body: BODY });
        vi.stubGlobal('getComputedStyle', (element: unknown) => ({
            getPropertyValue: (name: string) => (element === BODY ? (tokens[name] ?? '') : '')
        }));
    }

    afterEach(() => vi.unstubAllGlobals());

    it('audits that the grid is built with the mono font and the selected row surface, read off the body', () => {
        stubBody(TOKENS);
        const options = gridOptions(gridLook(), 14);
        expect(options.fontFamily).toBe('"JetBrains Mono", monospace');
        expect(options.theme?.selectionBackground).toBe('#d0e4ff');
        expect(options.theme?.selectionForeground).toBe('#0a1a2f');
        expect(options.theme?.background).toBe('#ffffff');
        expect(options.theme?.foreground).toBe('#111111');
        expect(options.convertEol).toBe(false);
        expect(options.fontSize).toBe(14);
        expect(gridOptions(gridLook(), undefined)).not.toHaveProperty('fontSize');
    });

    it('audits that a new look puts its font and its selection on a grid drawn in another', () => {
        stubBody(TOKENS);
        const options: ITerminalOptions = {
            fontFamily: 'courier-new, courier, monospace',
            theme: { selectionBackground: '#888888' },
            fontSize: 12
        };
        applyLook(options, gridLook());
        expect(options.fontFamily).toBe('"JetBrains Mono", monospace');
        expect(options.theme?.selectionBackground).toBe('#d0e4ff');
        expect(options.fontSize).toBe(12);
    });

    it('audits that the selection is drawn in the ink before a theme sets its own colour', () => {
        stubBody({ ...TOKENS, '--on-accent-bg': '' });
        expect(gridLook().theme.selectionForeground).toBe('#111111');
    });
});
