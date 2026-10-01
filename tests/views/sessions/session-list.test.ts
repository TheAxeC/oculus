// The sessions list rendered to HTML on the server over the synthetic payload of views-fixture.ts:
// its header, the rows grouped by workspace, each row's two lines and state, the filter and the
// search kept in the instance state, and the row menu's actions.
//
// What this does NOT cover: anything that needs a DOM. No row is clicked and no menu is opened.

import { beforeEach, describe, expect, it } from 'vitest';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import {
    sessionRowItems,
    terminalRowItems
} from '../../../src/lib/views/sessions/session-list/session-list.ts';
import { area, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import {
    ALPHA,
    HUB,
    barOf,
    catalog,
    gone,
    headerOf,
    installFixture,
    live,
    renderView,
    toolsOf,
    tree
} from './views-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    installFixture(client);
});

function html(state: unknown = {}): string {
    return renderView(client, SessionList, state);
}

function select(id: string | null): void {
    client.selection.select(id);
}

function receive(version: number, held: unknown[]): void {
    client.entities.receive({ channel: 'sessions', version, payload: payload(held as never) });
}

describe('the session list', () => {
    it('audits that offers a labelled pinned pane action for sessions and terminals', () => {
        const marks = { top: false, archived: false };
        const session = sessionRowItems(live, '', marks).find((item) => item.id === 'pinned');
        const terminal = terminalRowItems().find((item) => item.id === 'pinned');
        expect(session).toEqual({
            id: 'pinned',
            label: catalog['sessions.open_pinned'],
            title: catalog['sessions.open_pinned_tip']
        });
        expect(terminal).toEqual(session);
    });

    it('audits that offers pin, rename, fork and export on every row, archive and resume on an ended one, and no delete', () => {
        const ids = (row: typeof live, marks = { top: false, archived: false }) =>
            sessionRowItems(row, '', marks).map((item) => item.id);
        expect(ids(live)).toEqual(['top', 'rename', 'fork', 'export', 'pinned', 'transcript']);
        expect(ids(gone)).toEqual([...ids(live), 'archive', 'resume']);
        // the transcript is the agent's own file, which oculus reads and never removes
        expect(ids(gone)).not.toContain('delete');
    });

    it('audits that names the pin and the archive after the marks the row carries', () => {
        const labels = (marks: { top: boolean; archived: boolean }) =>
            sessionRowItems(gone, '', marks).map((item) => item.label);
        expect(labels({ top: true, archived: false })).toContain(catalog['sessions.unpin_top']);
        expect(labels({ top: false, archived: false })).toContain(catalog['sessions.pin_top']);
        expect(labels({ top: false, archived: true })).toContain(catalog['sessions.unarchive']);
        expect(labels({ top: false, archived: false })).toContain(catalog['sessions.archive']);
    });

    it('groups the rows by workspace under a header with the name and the count', () => {
        const body = html();
        expect(body).toContain(`data-session-group="${HUB}"`);
        expect(body).toContain(`data-session-group="/other"`);
        // An area is no header of its own: the hub's four unarchived rows are one group.
        expect(body.match(/data-session-row=/g)).toHaveLength(5);
    });

    it('draws each row as two lines: the state and the title, then the agent, the model, the age, the files and the prompts', () => {
        select('live-one');
        const body = html();
        expect(body.match(/class="line one/g)).toHaveLength(5);
        expect(body.match(/class="line two/g)).toHaveLength(5);
        expect(body).toContain('opus-5');
        expect(body).toContain(catalog['sessions.files_n'].replace('{0}', '2'));
        expect(body).toContain(catalog['sessions.prompts_n'].replace('{0}', '4'));
    });

    /** The words of one row's second line, the tags dropped and the spaces collapsed. */
    function details(body: string, id: string): string {
        const from = body.indexOf(`data-session-row="${id}"`);
        const line = body.indexOf('class="line two', from);
        const end = body.indexOf('</button>', line);
        return body
            .slice(line, end)
            .replace(/^[^>]*>/, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // The fixture's bare row has neither a start nor a last activity, so it has no age to tell.
    it('draws no empty slot and no doubled separator for a session with no age', () => {
        const sep = catalog['sessions.meta_sep'];
        const words = details(html(), 'bare-one');
        expect(words).toBe(
            [
                catalog['sessions.kind_claude'],
                'opus-5',
                catalog['sessions.files_n'].replace('{0}', '0'),
                catalog['sessions.prompts_n'].replace('{0}', '0')
            ].join(` ${sep} `)
        );
    });

    it('draws no model and no extra separator for a session with no model', () => {
        const sep = catalog['sessions.meta_sep'];
        const quiet = record('quiet-one', {
            title: 'The quiet one',
            workspace: HUB,
            area: ALPHA,
            cwd: ALPHA,
            model: null,
            lastActivity: new Date(Date.now() - 5 * 60_000).toISOString()
        });
        receive(60, [workspace(HUB, [area(ALPHA, [quiet])])]);
        const body = html();
        receive(61, tree);
        expect(details(body, 'quiet-one')).toBe(
            [
                catalog['sessions.kind_claude'],
                catalog['sessions.ago_m'].replace('{0}', '5'),
                catalog['sessions.files_n'].replace('{0}', '0'),
                catalog['sessions.prompts_n'].replace('{0}', '0')
            ].join(` ${sep} `)
        );
    });

    it('marks each row with its state', () => {
        const body = html();
        const state = (id: string) =>
            new RegExp(`data-session-row="${id}"[^>]*data-state="([a-z]+)"`).exec(body)?.[1];
        expect(state('live-one')).toBe('working');
        expect(state('live-two')).toBe('idle');
        expect(state('ended-one')).toBe('ended');
        expect(state('bare-one')).toBe('ended');
    });

    it('keeps the archived rows out until the filter asks for them, and then shows only them', () => {
        // no state is picked, which keeps every state but archived
        expect(html()).not.toContain('The dismissed one');
        const archived = html({ states: ['archived'] });
        expect(archived).toContain('The dismissed one');
        expect(archived.match(/data-session-row=/g)).toHaveLength(1);
    });

    it('keeps only the agents the filter names', () => {
        const codex = html({ agents: ['codex'] });
        expect(codex).toContain('The other live one');
        expect(codex.match(/data-session-row=/g)).toHaveLength(1);
    });

    it('keeps only the rows the search text is in, and says so when none is', () => {
        const found = html({ query: 'PINNED' });
        expect(found).toContain('The pinned one');
        expect(found.match(/data-session-row=/g)).toHaveLength(1);
        expect(html({ query: 'no row holds this' })).toContain(catalog['sessions.filter_empty']);
    });

    it('reads a filter kept in the instance state, and drops what is not a filter', () => {
        const body = html({ states: ['bogus', 'ended'], agents: [7], query: 3 });
        expect(body.match(/data-session-row=/g)).toHaveLength(2);
        expect(body).toContain('The ended one');
        expect(body).toContain('The bare one');
    });

    it('puts a row pinned to the top first in its group, with the mark', () => {
        const high = record('high-one', {
            title: 'The high one',
            workspace: HUB,
            area: ALPHA,
            cwd: ALPHA,
            lastActivity: '2020-01-01T00:00:00.000Z',
            ...{ top: true }
        });
        const topTree = [workspace(HUB, [area(ALPHA, [live, high])])];
        receive(50, topTree);
        const body = html();
        receive(51, tree);
        expect(body.indexOf('The high one')).toBeLessThan(body.indexOf('The live one'));
        expect(body.split(catalog['sessions.top_mark']).length - 1).toBe(1);
    });

    it('marks the selected row', () => {
        select('live-one');
        const body = html();
        // Svelte writes its own scoped class between the two, so the mark is matched rather than
        // compared: what is checked is that exactly one row carries it.
        expect(body.match(/class="row[^"]*\bon\b/g)).toHaveLength(1);
    });

    it('carries New with its shortcut, the filter menu and the search box in its header', () => {
        const body = html();
        expect(body).toContain(catalog['sessions.new_session_title']);
        expect(body).toContain('data-list-filter');
        expect(body).toContain(`placeholder="${catalog['sessions.search']}"`);
    });

    // Revert: draw the search box in the body again.
    it('puts the search box in the bar and New and the filter in the header as bare icons', () => {
        const body = html();
        expect(barOf(body)).toContain(`placeholder="${catalog['sessions.search']}"`);
        // the search box is a bar control, so the header holds icon actions only
        expect(headerOf(body)).not.toContain(`placeholder="${catalog['sessions.search']}"`);
        const found = toolsOf(headerOf(body));
        expect(found.length).toBeGreaterThan(0);
        for (const one of found) expect(one).toMatch(/\bbare\b/);
        expect(headerOf(body)).toContain('data-list-filter');
    });

    it('shows its empty state when the payload holds nothing', () => {
        receive(2, []);
        expect(html()).toContain(catalog['sessions.state_empty']);
        receive(3, tree);
    });
});
