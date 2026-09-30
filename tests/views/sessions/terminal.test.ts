// Layer 4, view test. The Terminal view as a terminal panel of its own: the tab draws the terminals
// it owns and nothing the selection names, the steer box only under an agent, the list of the tab's
// terminals on the right from two terminals on in the tab's own order, the one terminal's title on
// the bar, a split tab's two halves and the composer in the right half, the Sessions view listing
// every terminal, and the pure rules the grid's paste question and file drop go by.
//
// What this does NOT cover: anything that needs a DOM. The grid is xterm.js, which the server
// render does not mount, so a paste, a drop, a bell, a hover, an arrow key, a drag and the handle's
// move are not performed here; the rules they call (the line count, the quoting, the order) are
// asserted as pure functions, named audits by the tree's rule for a case that draws nothing, and
// the look on landing sees the rest. What a drag, a press, New and Split do to a tab's state is
// tests/state/sessions/terminal/terminal-tabs.test.ts and
// tests/state/client/terminal/terminal-tabs.test.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Terminal from '../../../src/lib/views/sessions/terminal/Terminal.svelte';
import type { ITerminalOptions } from '@xterm/xterm';
import {
    applyLook,
    findLook,
    gridLook,
    gridOptions
} from '../../../src/lib/views/sessions/terminal/grid/grid-look.ts';
import {
    findCount,
    findKey,
    findOptions,
    findUnparsable,
    linkHandler,
    listDrawn,
    movedOrder,
    pasteLines,
    armKept,
    rowKey,
    shellQuote,
    tabRows
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { area, payload, record, terminal, workspace } from '../../fixtures/sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { t } from '../../../src/lib/state/shared/words/text.ts';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import { ALPHA, HUB, catalog, installFixture, renderView, textOf, tree } from './views-fixture.ts';

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

/** One Terminal tab on the current page, holding this state, rendered. */
function html(state: unknown = {}): string {
    const id = `terminal-${(version += 1)}`;
    client.ui.setInstanceState(id, state);
    const instance: Instance = { id, view: 'terminal', state };
    client.layout.apply({ root: { kind: 'pane', tabs: [instance], active: id } });
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

/** A tab owning these terminals, the first shown unless the case says otherwise. */
function owning(terminals: string[], over: Record<string, unknown> = {}): Record<string, unknown> {
    return { id: 'own-tab', terminals, shown: terminals[0] ?? null, ...over };
}

describe('the steer box under the grid', () => {
    it('is drawn under an agent terminal', () => {
        withTerminals(claude);
        const body = html(owning([claude.id]));
        expect(body).toContain(`data-terminal="${claude.id}"`);
        expect(body).toContain('data-steer');
    });

    it('is not drawn under a shell, whose grid takes the whole height', () => {
        withTerminals(vim);
        const body = html(owning([vim.id]));
        expect(body).toContain(`data-terminal="${vim.id}"`);
        // a shell is typed into at the grid, so nothing steers it from below
        expect(body).not.toContain('data-steer');
    });

    it('is not drawn for a selected session that runs elsewhere: a tab draws its own terminals', () => {
        withTerminals(claude);
        client.selection.select('ended-one');
        const body = html(owning([]));
        // a tab draws its own terminals, so no sentence about the selection is drawn
        expect(body).not.toContain('data-runs-elsewhere');
        // the tab owns no agent terminal, so there is nothing to steer
        expect(body).not.toContain('data-steer');
        expect(body).toContain('data-composer-prompt');
    });

    it('does not follow the selection: a selected terminal the tab does not own is not drawn', () => {
        withTerminals(claude, vim);
        client.selection.select(claude.id);
        const body = html(owning([vim.id]));
        expect(body).toContain(`data-terminal="${vim.id}"`);
        // the selection does not reach a tab, which draws only what it owns
        expect(body).not.toContain(`data-terminal="${claude.id}"`);
    });
});

describe('one terminal', () => {
    it('draws no list and puts its title and description on the bar', () => {
        withTerminals(vim);
        const body = html(owning([vim.id]));
        // one terminal leaves nothing to choose between, so no list is drawn
        expect(body).not.toContain('data-terminal-list');
        expect(textOf(body, 'data-terminal-title')).toBe('vim');
        expect(textOf(body, 'data-terminal-description')).toBe('oculus');
        // the bar names the one terminal there is, and no menu of terminals is offered
        expect(body).not.toContain('data-session-picker');
    });
});

describe('the list of terminals', () => {
    it("holds the tab's own terminals alone, with no pin control on the bar", () => {
        withTerminals(claude, vim, bare);
        const body = html(owning([claude.id, vim.id]));
        expect(rowOrder(body)).toEqual([claude.id, vim.id]);
        // that terminal runs, but this tab does not own it
        expect(body).not.toContain(`data-terminal-row="${bare.id}"`);
        // a tab owns what it shows, so there is nothing to pin
        expect(body).not.toContain(`aria-label="${catalog['sessions.pin_pane']}"`);
        // and no pin to take away, since nothing follows the selection
        expect(body).not.toContain(`aria-label="${catalog['sessions.unpin_pane']}"`);
    });

    it('draws one row per terminal, titled after what runs, the shown one marked current', () => {
        withTerminals(claude, vim);
        const body = html(owning([claude.id, vim.id]));
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
        const body = html(owning([vim.id, bare.id]));
        const at = body.indexOf(`data-terminal-row="${bare.id}"`);
        expect(textOf(body, 'data-row-title', at)).toBe(catalog['sessions.terminal_title_shell']);
        expect(catalog['sessions.terminal_title_shell']).toBe('shell');
        expect(textOf(body, 'data-row-description', at)).toBe('plain');
    });

    it('holds no row for a terminal oculus did not start', () => {
        withTerminals(claude, vim, outside);
        const body = html(owning([claude.id, vim.id, outside.id]));
        expect(rowOrder(body)).toEqual([claude.id, vim.id]);
    });

    it('offers Split and Kill on every row, and a tooltip naming the terminal', () => {
        withTerminals(claude, vim);
        const body = html(owning([claude.id, vim.id]));
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
        const list = listOf(html(owning([claude.id, vim.id, bare.id], { shown: vim.id })));
        expect(list.split('tabindex="0"')).toHaveLength(2);
        const stop = list.indexOf('tabindex="0"');
        const tag = list.slice(list.lastIndexOf('<', stop), list.indexOf('>', stop));
        expect(tag).toContain(`data-stop="${vim.id}"`);
    });

    it('draws the one terminal the tab owns as a row while the tab shows the composer', () => {
        withTerminals(vim);
        const body = html(owning([vim.id], { shown: null, composing: true }));
        expect(body).toContain('data-composer-prompt');
        expect(rowOrder(body)).toEqual([vim.id]);
        const at = body.indexOf(`data-terminal-row="${vim.id}"`);
        expect(textOf(body, 'data-row-title', at)).toBe('vim');
    });

    it('draws no list under the composer of a tab that owns no terminal, whatever else runs', () => {
        withTerminals(vim);
        const body = html({ id: 'a-tab-of-its-own' });
        expect(body).toContain('data-composer-prompt');
        // this tab owns no terminal, so its list would have no row
        expect(body).not.toContain('data-terminal-list');
    });

    it("draws the rows in the tab's own order", () => {
        withTerminals(claude, vim, bare);
        const body = html(owning([vim.id, bare.id, claude.id]));
        expect(rowOrder(body)).toEqual([vim.id, bare.id, claude.id]);
    });
});

describe('a split tab', () => {
    it('draws both halves with a handle between them, and marks both rows current', () => {
        withTerminals(claude, vim, bare);
        const body = html(owning([claude.id, vim.id, bare.id], { beside: vim.id, share: 0.3 }));
        expect(body).toContain(`data-terminal="${claude.id}"`);
        expect(body).toContain(`data-terminal="${vim.id}"`);
        // the third terminal is in the list but in neither half
        expect(body).not.toContain(`data-terminal="${bare.id}"`);
        expect(body).toContain('role="separator"');
        expect(body).toContain('aria-valuenow="30"');
        const rows = rowSlices(body);
        expect(rows[0]).toContain('data-current');
        expect(rows[1]).toContain('data-current');
        // the third row is in neither half, so it is not marked
        expect(rows[2]).not.toContain('data-current');
    });

    // Revert: draw the composer only when the tab owns no row.
    it('draws the composer right of the row while a New With a Prompt waits for its start', () => {
        withTerminals(claude, vim);
        const body = html(owning([claude.id, vim.id], { composing: true }));
        expect(body).toContain(`data-terminal="${claude.id}"`);
        expect(body).toContain('data-composer-prompt');
        // the composer holds the right side until its start, so the other terminal is not drawn
        expect(body).not.toContain(`data-terminal="${vim.id}"`);
    });

    // Revert: draw no Sash between the terminals of a row.
    it('draws a separator between the two terminals of a row', () => {
        withTerminals(claude, vim);
        const body = html(owning([claude.id, vim.id], { row: [claude.id, vim.id] }));
        expect(body).toContain(`data-terminal="${claude.id}"`);
        expect(body).toContain(`data-terminal="${vim.id}"`);
        expect(body).toContain('role="separator"');
    });

    it('draws the composer alone after New in a tab that is not split', () => {
        withTerminals(claude, vim);
        const body = html(owning([claude.id, vim.id], { shown: null, composing: true }));
        expect(body).toContain('data-composer-prompt');
        // New in a tab that is not split shows the composer alone, with no handle
        expect(body).not.toContain('role="separator"');
        // and no grid beside it
        expect(body).not.toContain('data-terminal="');
        expect(rowOrder(body)).toEqual([claude.id, vim.id]);
    });
});

describe('the Sessions view', () => {
    it('lists every terminal, those no tab owns among them', () => {
        withTerminals(claude, vim, bare);
        html(owning([claude.id]));
        const body = renderView(client, SessionList, {});
        const group = body.slice(body.indexOf('data-terminal-group'));
        expect(group).toContain(claude.name);
        expect(group).toContain(vim.name);
        expect(group).toContain(bare.name);
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

    it("audits the rows of a tab: the tab's own terminals, in its order, a missing one passed over", () => {
        const rows = [
            { terminal: 'b', created: '2026-09-11T09:00:00.000Z' },
            { terminal: 'a', created: '2026-09-11T08:00:00.000Z' },
            { terminal: 'c', created: '2026-09-11T10:00:00.000Z' }
        ];
        expect(tabRows(rows, ['c', 'a']).map((one) => one.terminal)).toEqual(['c', 'a']);
        expect(tabRows(rows, ['gone', 'b']).map((one) => one.terminal)).toEqual(['b']);
        expect(tabRows(rows, [])).toEqual([]);
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
        expect(options.allowProposedApi).toBe(true);
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

describe("the terminal's find", () => {
    /** A key press with no modifier held but those named. */
    function press(
        key: string,
        held: { shift?: boolean; meta?: boolean; ctrl?: boolean; alt?: boolean } = {}
    ): { key: string; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean } {
        return {
            key,
            shiftKey: held.shift === true,
            metaKey: held.meta === true,
            ctrlKey: held.ctrl === true,
            altKey: held.alt === true
        };
    }

    afterEach(() => vi.unstubAllGlobals());

    it('audits the count as VS Code words it: none, the one, and the active one of twelve', () => {
        expect(findCount({ resultIndex: -1, resultCount: 0 }, t)).toBe('No results');
        expect(findCount({ resultIndex: 0, resultCount: 1 }, t)).toBe('1 of 1');
        expect(findCount({ resultIndex: 2, resultCount: 12 }, t)).toBe('3 of 12');
        expect(findCount(null, t)).toBe('No results');
    });

    it('audits a place past the marked matches as ?, and a count at the limit with a plus', () => {
        expect(findCount({ resultIndex: -1, resultCount: 1000 }, t)).toBe('? of 1000+');
        expect(findCount({ resultIndex: 4, resultCount: 999 }, t)).toBe('5 of 999');
    });

    it("audits that the unknown place and the count at the limit are the catalog's words", () => {
        const words = (key: string, ...args: (string | number)[]): string =>
            `${key}(${args.join(',')})`;
        expect(findCount({ resultIndex: -1, resultCount: 1000 }, words)).toBe(
            'sessions.find_count(sessions.find_place_unknown(),sessions.find_over_limit(1000))'
        );
        expect(findCount({ resultIndex: 4, resultCount: 999 }, words)).toBe(
            'sessions.find_count(5,999)'
        );
    });

    it('audits which patterns the search could not compile: a regex that does not parse', () => {
        const regex = { matchCase: false, wholeWord: false, regex: true };
        expect(findUnparsable('(', regex)).toBe(true);
        expect(findUnparsable('[a', regex)).toBe(true);
        expect(findUnparsable('(a)|[b]', regex)).toBe(false);
        expect(findUnparsable('', regex)).toBe(false);
        expect(findUnparsable('(', { ...regex, regex: false })).toBe(false);
        expect(findUnparsable('[a', { ...regex, regex: false, matchCase: true })).toBe(false);
    });

    it('audits that the three toggles reach the search as its options, with the colours', () => {
        const colours = {
            matchBackground: '#d0e4ff',
            matchOverviewRuler: '#d0e4ff',
            activeMatchBackground: '#3366ff',
            activeMatchColorOverviewRuler: '#3366ff'
        };
        expect(findOptions({ matchCase: true, wholeWord: false, regex: true }, colours)).toEqual({
            caseSensitive: true,
            wholeWord: false,
            regex: true,
            decorations: colours
        });
        expect(findOptions({ matchCase: false, wholeWord: true, regex: false }, colours)).toEqual({
            caseSensitive: false,
            wholeWord: true,
            regex: false,
            decorations: colours
        });
    });

    it('audits that takes VS Code keys in the bar: Enter goes up, Shift+Enter down, Escape closes', () => {
        const bar = { mac: true, where: 'bar' as const, open: true };
        expect(findKey(press('Enter'), bar)).toBe('previous');
        expect(findKey(press('F3', { shift: true }), bar)).toBe('previous');
        expect(findKey(press('g', { meta: true, shift: true }), bar)).toBe('previous');
        expect(findKey(press('G', { meta: true, shift: true }), bar)).toBe('previous');
        expect(findKey(press('Enter', { shift: true }), bar)).toBe('next');
        expect(findKey(press('F3'), bar)).toBe('next');
        expect(findKey(press('g', { meta: true }), bar)).toBe('next');
        expect(findKey(press('Escape'), bar)).toBe('close');
        expect(findKey(press('a'), bar)).toBe(null);
    });

    it('audits that opens from the grid on Cmd+F on macOS and Ctrl+F elsewhere, and nothing else', () => {
        const mac = { mac: true, where: 'grid' as const, open: false };
        const other = { mac: false, where: 'grid' as const, open: false };
        expect(findKey(press('f', { meta: true }), mac)).toBe('open');
        expect(findKey(press('f', { ctrl: true }), mac)).toBe(null);
        expect(findKey(press('f', { ctrl: true }), other)).toBe('open');
        expect(findKey(press('f', { meta: true }), other)).toBe(null);
        expect(findKey(press('Enter'), mac)).toBe(null);
        expect(findKey(press('Escape'), mac)).toBe(null);
        expect(findKey(press('F3'), mac)).toBe(null);
    });

    it('audits that moves and closes from the grid while the bar is open, and leaves Enter to the shell', () => {
        const grid = { mac: false, where: 'grid' as const, open: true };
        expect(findKey(press('F3'), grid)).toBe('next');
        expect(findKey(press('F3', { shift: true }), grid)).toBe('previous');
        expect(findKey(press('Escape'), grid)).toBe('close');
        expect(findKey(press('Enter'), grid)).toBe(null);
        expect(findKey(press('Enter', { shift: true }), grid)).toBe(null);
        expect(findKey(press('f', { ctrl: true }), grid)).toBe('open');
    });

    it('draws a match on the accent surface and the active one in the accent, as six-digit hex', () => {
        vi.stubGlobal('document', { body: {} });
        vi.stubGlobal('getComputedStyle', () => ({
            getPropertyValue: (name: string) =>
                ({ '--accent-bg': ' #d0e4ff ', '--accent': '#36f' })[name] ?? ''
        }));
        expect(findLook()).toEqual({
            matchBackground: '#d0e4ff',
            matchOverviewRuler: '#d0e4ff',
            activeMatchBackground: '#3366ff',
            activeMatchColorOverviewRuler: '#3366ff'
        });
    });
});

describe("the terminal's links", () => {
    it('audits that a web address opens on Cmd+click on macOS and Ctrl+click elsewhere', () => {
        const opened: string[] = [];
        const onMac = linkHandler(true, (url) => opened.push(url));
        const elsewhere = linkHandler(false, (url) => opened.push(url));
        const url = 'https://example.org/a?b=1';
        onMac({ metaKey: false, ctrlKey: false }, url);
        onMac({ metaKey: false, ctrlKey: true }, url);
        expect(opened).toEqual([]);
        onMac({ metaKey: true, ctrlKey: false }, url);
        expect(opened).toEqual([url]);
        elsewhere({ metaKey: true, ctrlKey: false }, url);
        elsewhere({ metaKey: false, ctrlKey: true }, 'http://example.org/');
        expect(opened).toEqual([url, 'http://example.org/']);
    });

    it('audits that never opens a file, a script or an address that does not parse', () => {
        const opened: string[] = [];
        const open = linkHandler(true, (url) => opened.push(url));
        for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'not a url', '']) {
            open({ metaKey: true, ctrlKey: true }, url);
        }
        expect(opened).toEqual([]);
    });
});
