// Layer 4, view test. What a terminal shows once it is renamed, given an icon or a colour: its
// title in place of the command on its row, on the bar and in the Sessions list, its row mark in
// the colour's token, and a stored icon the vocabulary no longer holds drawn as the default; and
// what a task terminal shows: its result mark once its line ended, and Rerun and Restart on the
// bar. The terminal's Clear and Copy as HTML are tests/views/sessions/grid-actions.test.ts.
//
// What this does NOT cover: the menus' presses, the icon and colour pickers and the inline field
// a Rename opens, which need a DOM and are seen on screen; the server's actions are
// tests/routes/sessions/terminal-edit.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import Terminal from '../../../src/lib/views/sessions/terminal/Terminal.svelte';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import { terminalChoices } from '../../../src/lib/state/sessions/folds.ts';
import { colorToken } from '../../../src/lib/state/sessions/terminal/terminal-marks.ts';
import { payload, terminal } from '../../fixtures/sessions-fixture.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { installFixture, renderView, textOf, tree } from './views-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

let client: ClientState;
let version = 900;

beforeEach(() => {
    client = createClientState();
    installFixture(client);
});

const plain = terminal('a1a1a1-shell', { command: 'vim', cwd: '/Users/x/oculus' });
const other = terminal('b2b2b2-shell', { command: 'zsh', cwd: '/Users/x/plain' });

function receive(...panes: ReturnType<typeof terminal>[]): void {
    client.entities.receive({
        channel: 'sessions',
        version: (version += 1),
        payload: { ...payload(tree), terminals: panes }
    });
}

/** One Terminal tab owning these terminals, rendered. */
function html(terminals: string[]): string {
    return renderView(client, Terminal, {
        id: 'own-tab',
        terminals,
        shown: terminals[0] ?? null
    });
}

describe('a renamed terminal', () => {
    // Revert: title a shell row by its command in terminalChoices whatever its title says.
    it('shows the title on its row in place of the command', () => {
        const named = { ...plain, title: 'build' };
        receive(named, other);
        const body = html([named.id, other.id]);
        const at = body.indexOf(`data-terminal-row="${named.id}"`);
        expect(textOf(body, 'data-row-title', at)).toBe('build');
        expect(body).toContain('vim');
    });

    // Revert: title the bar by the command when the tab shows one terminal.
    it('shows the title on the bar when the tab shows one terminal', () => {
        receive({ ...plain, title: 'build' });
        const body = html([plain.id]);
        expect(textOf(body, 'data-terminal-title')).toBe('build');
    });

    // Revert: draw the Sessions list row by the name alone in TerminalRows.svelte.
    it('shows the title in the Sessions list in place of the name', () => {
        receive({ ...plain, title: 'build' });
        const body = renderView(client, SessionList, {});
        const group = body.slice(body.indexOf('data-terminal-group'));
        expect(group).toContain('build');
    });

    // Revert: keep the title when it is empty.
    it('shows the command again once the title is cleared', () => {
        receive({ ...plain, title: '' });
        expect(textOf(html([plain.id]), 'data-terminal-title')).toBe('vim');
    });

    it('audits that lists a title on a choice of an agent terminal as its description', () => {
        const agent = terminal('c3c3c3-claude', {
            kind: 'claude',
            command: 'node',
            title: 'review'
        });
        const choices = terminalChoices([agent], []);
        expect(choices[0].title).toBe('review');
    });
});

describe('a coloured and an iconed terminal', () => {
    // Revert: draw the row mark without the colour's token.
    it('draws the row mark in the colour token', () => {
        receive({ ...plain, color: 'red' }, other);
        const body = html([plain.id, other.id]);
        const one = body.indexOf(`data-terminal-row="${plain.id}"`);
        const two = body.indexOf(`data-terminal-row="${other.id}"`);
        expect(body.slice(one, two)).toContain('var(--c-red)');
        // The other terminal has no colour set, so its mark carries no colour token at all.
        expect(body.slice(two)).not.toContain('var(--c-');
    });

    // Revert: leave a colour name the token map lacks in as a style.
    it('draws a colour outside the eight as the default', () => {
        receive({ ...plain, color: 'chartreuse' }, other);
        const body = html([plain.id, other.id]);
        // A name outside the eight is not a colour, so the row is drawn in the default.
        expect(body).not.toContain('chartreuse');
        expect(colorToken('chartreuse')).toBe(null);
        expect(colorToken('red')).toBe('--c-red');
        expect(colorToken('yellow')).toBe('--c-gold');
    });

    // Revert: draw the stored icon without asking the vocabulary whether it still holds it.
    it('draws the stored icon, and the default kind glyph for one the vocabulary no longer holds', () => {
        receive({ ...plain, icon: 'refresh' }, other);
        const kept = html([plain.id, other.id]);
        const one = kept.indexOf(`data-terminal-row="${plain.id}"`);
        const two = kept.indexOf(`data-terminal-row="${other.id}"`);
        expect(kept.slice(one, two)).toContain('data-glyph="refresh"');
        receive({ ...plain, icon: 'no_such_glyph' }, other);
        const stale = html([plain.id, other.id]);
        // The vocabulary no longer holds that icon, so the row falls back to its kind's own mark.
        expect(stale).not.toContain('no_such_glyph');
        const start = stale.indexOf(`data-terminal-row="${plain.id}"`);
        expect(stale.slice(start, stale.indexOf(`data-terminal-row="${other.id}"`))).toContain(
            'data-glyph="terminal_shell"'
        );
    });
});

describe('a task terminal', () => {
    const job = { repo: '/Users/x/oculus', name: 'build' };
    const running = { ...plain, task: true, exit: null, job };
    const passed = { ...other, task: true, exit: 0, job };
    const failed = { ...terminal('c3c3c3-shell', { command: 'make' }), task: true, exit: 2, job };

    /** The part of the page from one terminal's row to the next row, or to the end. */
    function rowOf(body: string, id: string): string {
        const at = body.indexOf(`data-terminal-row="${id}"`);
        const next = body.indexOf('data-terminal-row="', at + 1);
        return body.slice(at, next < 0 ? undefined : next);
    }

    it('draws a green check on its row once its line ended with 0 and a red cross for any other exit', () => {
        receive(running, passed, failed);
        const body = html([running.id, passed.id, failed.id]);
        expect(rowOf(body, passed.id)).toContain('data-glyph="check"');
        expect(rowOf(body, passed.id)).toContain('var(--c-green)');
        expect(rowOf(body, failed.id)).toContain('data-glyph="fail"');
        expect(rowOf(body, failed.id)).toContain('var(--c-red)');
    });

    it('keeps the kind glyph on the row of a task whose line runs', () => {
        receive(running, passed);
        const row = rowOf(html([running.id, passed.id]), running.id);
        expect(row).toContain('data-glyph="terminal_shell"');
        // The result is drawn only once the line has ended, and this line still runs.
        expect(row).not.toContain('data-glyph="check"');
        // A line that has not ended has no exit status to draw as a failure.
        expect(row).not.toContain('data-glyph="fail"');
    });

    it('draws the result on the bar of a tab showing the one task terminal', () => {
        receive(failed);
        const body = html([failed.id]);
        expect(body).toContain('data-glyph="fail"');
    });

    it('offers Rerun and Restart on the bar once the line ended, and Restart alone while it runs', () => {
        const rerun = catalog['commands.rerun_tip'];
        const restart = catalog['commands.restart_tip'];
        receive(passed);
        const ended = html([passed.id]);
        expect(ended).toContain(rerun);
        expect(ended).toContain(restart);
        receive(running);
        const runs = html([running.id]);
        // Rerun starts the line again, which would stop one that is still running.
        expect(runs).not.toContain(rerun);
        expect(runs).toContain(restart);
    });

    it('offers neither on the bar of a terminal that is no task terminal', () => {
        receive(plain);
        const body = html([plain.id]);
        // Rerun and Restart belong to terminals a project command started.
        expect(body).not.toContain(catalog['commands.rerun_tip']);
        // A plain shell has no command line to start again.
        expect(body).not.toContain(catalog['commands.restart_tip']);
    });
});
