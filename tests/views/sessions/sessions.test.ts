// The session views rendered to HTML on the server: what each one draws over the synthetic payload
// of views-fixture.ts, and what each one draws when nothing is selected. The sessions list has its
// own file, session-list.test.ts.
//
// The catalog, glyphs and vocabulary are the real config. The sessions and git state are the test's
// own: nothing reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no row
// is clicked, no dismissal is sent and the timeline's scrolling never runs; the selection a click
// would write is written here through select() instead.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import Agents from '../../../src/lib/views/sessions/agents/Agents.svelte';
import SessionDetail from '../../../src/lib/views/sessions/session-detail/SessionDetail.svelte';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import Terminal from '../../../src/lib/views/sessions/terminal/Terminal.svelte';
import Timeline from '../../../src/lib/views/sessions/timeline/Timeline.svelte';
import Transcript from '../../../src/lib/views/sessions/transcript/Transcript.svelte';
import { scheduleReflow } from '../../../src/lib/views/sessions/terminal/reflow.ts';
import { clock } from '../../../src/lib/state/shared/words/format.ts';
import type { Turn } from '../../../src/lib/state/sessions/transcript.svelte.ts';
import { area, payload, record, terminal, workspace } from '../../fixtures/sessions-fixture.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import type { Project, Snapshot } from '../../../src/lib/data/model/index.ts';
import type { Component } from 'svelte';
import type { ViewProps } from '../../../src/lib/state/workbench/navigation/registry.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { ALPHA, HUB, UNKNOWN, catalog, installFixture, renderView, tree } from './views-fixture.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let select: ClientState['selection']['select'];
let forget: ClientState['transcripts']['forget'];
let hold: ClientState['transcripts']['hold'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ select } = client.selection);
    ({ forget, hold } = client.transcripts);
    installFixture(client);
});

/** One view rendered as a fresh instance of this case's client. */
function html(view: Component<ViewProps>, state: unknown = {}, id?: string): string {
    return renderView(client, view, state, id);
}

describe('the session detail', () => {
    it('draws the fields of the selected session', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.f_cwd']);
        expect(body).toContain(ALPHA);
        expect(body).toContain('acceptEdits');
        expect(body).toContain('4242');
        expect(body).toContain('2.1.0');
    });

    it('measures the last turn against the window in config/behavior.yml', () => {
        select('live-one');
        const body = html(SessionDetail);
        // 800k of the 1M window: the meter's own value, and the two numbers beside it.
        expect(body).toContain('aria-valuenow="0.8"');
        expect(body).toContain(
            catalog['sessions.context_num'].replace('{0}', '800k').replace('{1}', '1M')
        );
    });

    it('shows the lifetime tokens and the cache line, which are not the occupancy', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.tok_in'].replace('{0}', '1k'));
        // The share is the last turn's read over the last turn's occupancy. Taken from the lifetime
        // sum beside it, 9M over 800k, it would read 1125% cached.
        expect(body).not.toContain(catalog['sessions.cache_share'].replace('{0}', '1125'));
        expect(body).toContain(catalog['sessions.cache_ttl'].replace('{0}', '1h'));
        expect(body).toContain(catalog['sessions.cache_share'].replace('{0}', '50'));
        expect(body).toContain(catalog['sessions.cache_busts'].replace('{0}', '2'));
    });

    it('says a session is ended rather than what the registry last said', () => {
        select('ended-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.state_ended']);
        expect(body).toContain(catalog['sessions.kind_observed'].replace('{0}', 'observed'));
    });

    it('draws the pin row with the known areas of the session own workspace', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.pin_label']);
        expect(body).toContain(catalog['sessions.pin_scored']);
        // ALPHA is a known project folder of the hub workspace; the scratch area is not one, and
        // the other workspace's area belongs to another workspace.
        expect(body).toContain(`<option value="${ALPHA}"`);
        // the scratch area is no project folder of this workspace, so it is not offered
        expect(body).not.toContain(`<option value="${UNKNOWN}"`);
        // and this area belongs to another workspace
        expect(body).not.toContain('<option value="/other"');
    });

    it('shows the title override box and the control that clears it', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.rename_label']);
        expect(body).toContain(catalog['sessions.rename_placeholder']);
        expect(body).toContain(catalog['sessions.clear_title']);
        expect(body).toContain('value="The live one"');
    });

    it('shows the pinned area as the pin control value', () => {
        select('pinned-one');
        const body = html(SessionDetail);
        expect(body).toContain(`<option value="${ALPHA}" selected`);
    });

    it('shows its empty state with nothing selected', () => {
        select(null);
        expect(html(SessionDetail)).toContain(catalog['sessions.detail_empty']);
    });

    it('follows its own pin rather than the selection', () => {
        select('live-one');
        expect(html(SessionDetail, { session: 'ended-one' })).toContain('The ended one');
    });

    it('offers pin and unpin in place and four pinned session views', () => {
        select('live-one');
        expect(html(SessionDetail)).toContain(catalog['sessions.pin_pane']);
        const body = html(SessionDetail, { session: 'ended-one', label: 'The ended one' });
        expect(body).toContain(catalog['sessions.unpin_pane']);
        expect(body).toContain(catalog['sessions.view_transcript']);
        expect(body).toContain(catalog['sessions.view_timeline']);
        expect(body).toContain(catalog['sessions.view_changes']);
        expect(body).toContain(catalog['sessions.view_agents']);
    });
});

describe('the timeline', () => {
    it('offers pin and unpin in place', () => {
        select('live-one');
        expect(html(Timeline)).toContain(catalog['sessions.pin_pane']);
        expect(html(Timeline, { session: 'ended-one', label: 'The ended one' })).toContain(
            catalog['sessions.unpin_pane']
        );
    });

    it('draws every event with its kind, and prints a kind it does not know', () => {
        select('live-one');
        const body = html(Timeline);
        expect(body).toContain(catalog['sessions.ev_k_prompt']);
        expect(body).toContain(catalog['sessions.ev_k_edit']);
        expect(body).toContain('compaction');
        expect(body).toContain('do the thing');
    });

    it('writes a turn as its length and a bust as its size', () => {
        select('live-one');
        const body = html(Timeline);
        expect(body).toContain(catalog['sessions.ev_turn'].replace('{0}', '42'));
        expect(body).toContain(catalog['sessions.ev_bust'].replace('{0}', '84k'));
    });

    it('shows a path as its basename with the whole of it in the tooltip', () => {
        select('live-one');
        const body = html(Timeline);
        expect(body).toContain(`title="${ALPHA}/manuscript/main.tex"`);
        expect(body).toContain('>main.tex<');
    });

    it('says when a session has no timeline, and when none is selected', () => {
        select('ended-one');
        expect(html(Timeline)).toContain(catalog['sessions.tl_empty']);
        select(null);
        expect(html(Timeline)).toContain(catalog['sessions.detail_empty']);
    });
});

// The transcript view, which draws what state/sessions/transcript.svelte.ts holds for the selected
// session. The turns are put in through hold(), the module's test-only door: this suite renders on
// the server, where the module fetches nothing, so there is no request to stub.
describe('the transcript view', () => {
    it('offers pin and unpin in place', () => {
        select('live-one');
        expect(html(Transcript)).toContain(catalog['sessions.pin_pane']);
        expect(html(Transcript, { session: 'ended-one', label: 'The ended one' })).toContain(
            catalog['sessions.unpin_pane']
        );
    });

    const turn = (over: Partial<Turn> = {}): Turn => ({
        at: '2026-09-10T08:00:00.000Z',
        role: 'user',
        text: '',
        html: '',
        cut: false,
        tool: null,
        ...over
    });

    it('draws the three roles of the turns it holds', () => {
        hold('live-one', [
            turn({ role: 'user', text: 'do the thing' }),
            turn({ role: 'assistant', html: '<p>Doing it.</p>' }),
            turn({
                role: 'tool',
                tool: { id: 't1', name: 'Edit', summary: 'main.tex', ok: true }
            })
        ]);
        select('live-one');
        const body = html(Transcript);
        expect(body).toContain(catalog['sessions.turn_user']);
        expect(body).toContain('do the thing');
        expect(body).toContain(catalog['sessions.turn_assistant']);
        expect(body).toContain('<p>Doing it.</p>');
        expect(body).toContain(catalog['sessions.turn_tool']);
        expect(body).toContain('main.tex');
        expect(body).toContain(catalog['sessions.turn_ok']);
        forget('live-one');
    });

    it('says a cut turn was cut', () => {
        hold('live-one', [turn({ role: 'user', text: 'x'.repeat(40), cut: true })]);
        select('live-one');
        expect(html(Transcript)).toContain(catalog['sessions.turn_cut']);
        forget('live-one');
    });

    it('says when a session has no turns, and when none is selected', () => {
        hold('ended-one', []);
        select('ended-one');
        expect(html(Transcript)).toContain(catalog['sessions.turns_empty']);
        forget('ended-one');
        select(null);
        expect(html(Transcript)).toContain(catalog['sessions.detail_empty']);
    });

    // The row menu's own entry is not covered here: a Menu renders its opener on the server and its
    // items only once it is opened, which needs a DOM this suite does not have.
    it('offers the open control in the detail pane', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.transcript_open']);
        expect(body).toContain(catalog['sessions.transcript_open_tip']);
    });
});

describe('the agents view', () => {
    it('offers pin and unpin in place', () => {
        select('live-one');
        expect(html(Agents)).toContain(catalog['sessions.pin_pane']);
        expect(html(Agents, { session: 'ended-one', label: 'The ended one' })).toContain(
            catalog['sessions.unpin_pane']
        );
    });

    it('draws one row per agent, newest first, with its status and its span', () => {
        select('live-one');
        const body = html(Agents);
        expect(body.indexOf('Still going')).toBeLessThan(
            body.indexOf('Read the whole tree and report')
        );
        expect(body).toContain(catalog['sessions.ag_done']);
        expect(body).toContain(catalog['sessions.ag_running']);
        expect(body).toContain(catalog['sessions.ag_secs'].replace('{0}', '45'));
        expect(body).toContain(catalog['sessions.ag_chars'].replace('{0}', '5k'));
    });

    it('names an agent with no subagent type after the word for one', () => {
        select('live-one');
        expect(html(Agents)).toContain(catalog['sessions.ag_type']);
    });

    it('says when a session dispatched none, and when none is selected', () => {
        select('ended-one');
        expect(html(Agents)).toContain(catalog['sessions.ag_empty']);
        select(null);
        expect(html(Agents)).toContain(catalog['sessions.detail_empty']);
    });
});

describe('the terminal view with nothing selected', () => {
    it('draws the composer: the prompt box, its foot with the attach control, the pickers and Start', () => {
        select(null);
        const body = html(Terminal);
        expect(body).toContain('data-composer-prompt');
        // the empty box says what it takes, as the label it is named by
        expect(body).toContain(`placeholder="${catalog['composer.prompt']}"`);
        expect(body).toContain('data-composer-foot');
        expect(body).toContain(catalog['composer.attach']);
        expect(body).toContain('data-picker="workspace"');
        expect(body).toContain('data-picker="agent"');
        expect(body).toContain(catalog['sessions.kind_claude']);
        expect(body).toContain(catalog['composer.start']);
        expect(body).toContain(catalog['sessions.terminal_smaller']);
        expect(body).toContain(catalog['sessions.terminal_larger']);
        expect(body).toContain(catalog['sessions.terminal_reset']);
    });

    it('draws a Shell composer without the agent lists, its box asking for a command', () => {
        select(null);
        const body = html(Terminal, { composer: { agent: 'shell' } });
        expect(body).toContain(`aria-label="${catalog['composer.command']}"`);
        expect(body).toContain(`placeholder="${catalog['composer.command']}"`);
        expect(body).toContain('data-picker="agent"');
        // a shell runs under the reader's own login and takes none of an agent's lists
        expect(body).not.toContain('data-picker="account"');
        // nor the model list, which belongs to the agent a shell is not
        expect(body).not.toContain('data-picker="model"');
    });

    it('draws the composer of a tab owning no terminal whatever session is selected, one running outside oculus included', () => {
        select('ended-one');
        const body = html(Terminal);
        expect(body).toContain('data-composer-prompt');
        // a tab draws its own terminals and says nothing about what the selection names
        expect(body).not.toContain('data-runs-elsewhere');
        // it owns no agent terminal, so there is nothing to steer
        expect(body).not.toContain('data-steer');
        select(null);
    });

    it('draws the composer in a tab whose saved state names no terminal, whatever is selected', () => {
        select('ended-one');
        const body = html(Terminal, { id: 'new-from-the-list', follow: true });
        expect(body).toContain('data-composer-prompt');
        select(null);
    });

    it('shows the branch of the workspace a new session starts in, read only', () => {
        select(null);
        const body = html(Terminal, { composer: { workspace: HUB } });
        expect(body).toMatch(/data-composer-branch[^>]*>[\s\S]*?main/);
        expect(body).toContain(catalog['composer.branch_title']);
    });
});

describe('the terminal toolbar', () => {
    it('carries no pin control, since a tab owns what it shows', () => {
        select(null);
        const body = html(Terminal, { session: 'abc123-shell' });
        // a tab owns what it shows, so there is nothing to pin or unpin
        expect(body).not.toContain(catalog['sessions.unpin_pane']);
        // and no control offers to follow the selection instead
        expect(body).not.toContain(catalog['sessions.pin_pane']);
        expect(body).toContain(catalog['sessions.new_terminal']);
    });

    // The label follows the shown terminal's name through an $effect, which no server render runs;
    // the write it makes is read off the source, and the rename itself is not seen here.
    it("audits that the tab's label is set to the shown terminal's own name", () => {
        const source = readFileSync('src/lib/views/sessions/terminal/Terminal.svelte', 'utf8');
        expect(source).toContain('restate(withLabel(tab, live.name))');
        expect(source).toContain('tab.label === live.name');
    });

    it("audits that the bar's New is the terminals store's New for this tab", () => {
        const source = readFileSync('src/lib/views/sessions/terminal/Terminal.svelte', 'utf8');
        expect(source).toContain('onclick={() => composeInTab(instance.id)}');
    });
});

describe('a terminal option change', () => {
    it('updates the grid one frame before it fits and reports the measured size', () => {
        const queued = new Map<number, () => void>();
        const order: string[] = [];
        let next = 0;
        const frame = (run: () => void): number => {
            const id = (next += 1);
            queued.set(id, run);
            return id;
        };
        const cancel = (id: number): void => {
            queued.delete(id);
        };

        scheduleReflow(
            frame,
            cancel,
            () => {
                order.push('options');
                return true;
            },
            () => {
                order.push('fit');
                order.push('resize');
            }
        );

        expect(order).toEqual([]);
        queued.get(1)?.();
        expect(order).toEqual(['options']);
        queued.get(2)?.();
        expect(order).toEqual(['options', 'fit', 'resize']);
    });
});

describe('a hook event on a session', () => {
    const waiting = record('waiting-one', {
        title: 'Waiting on a permission',
        live: true,
        liveStatus: 'busy',
        state: 'working',
        workspace: HUB,
        area: ALPHA,
        cwd: ALPHA,
        hook: {
            session: 'waiting-one',
            event: 'notification',
            kind: 'permission_prompt',
            message: 'may I edit main.py?',
            at: '2026-09-11T14:32:00.000Z'
        }
    });
    const stopped = record('stopped-one', {
        title: 'A finished run',
        live: false,
        state: 'ended',
        workspace: HUB,
        area: ALPHA,
        cwd: ALPHA,
        hook: {
            session: 'stopped-one',
            event: 'stop',
            at: '2026-09-11T09:15:00.000Z'
        }
    });
    const hookTree = [workspace(HUB, [area(ALPHA, [waiting, stopped])])];

    /** A fresh, ever-growing version each call: receive() drops a message older than what it holds,
        and each of the three tests below both sets and restores the channel. */
    let hookVersion = 100;

    function withHooks<T>(run: () => T): T {
        receive({ channel: 'sessions', version: (hookVersion += 1), payload: payload(hookTree) });
        const result = run();
        receive({ channel: 'sessions', version: (hookVersion += 1), payload: payload(tree) });
        return result;
    }

    it('draws a live session a notification waits on as needing input, the message its tooltip', () => {
        const body = withHooks(() => html(SessionList));
        expect(body).toMatch(/data-session-row="waiting-one"[^>]*data-state="input"/);
        expect(body).toContain(catalog['sessions.state_input']);
        expect(body).toContain('title="may I edit main.py?"');
    });

    it('draws a stopped session as ended, and not as waiting on the reader', () => {
        const body = withHooks(() => html(SessionList));
        expect(body).toMatch(/data-session-row="stopped-one"[^>]*data-state="ended"/);
        // a row needing input is drawn first in its group
        expect(body.indexOf('Waiting on a permission')).toBeLessThan(
            body.indexOf('A finished run')
        );
    });

    it('shows the latest hook event as a key-value row in the detail pane', () => {
        const body = withHooks(() => {
            select('stopped-one');
            return html(SessionDetail);
        });
        expect(body).toContain(catalog['sessions.f_hook']);
        expect(body).toContain(
            catalog['sessions.stopped_at'].replace('{0}', clock(stopped.hook?.at))
        );
    });
});

// Terminals reach the page in the same payload as sessions. What this does NOT
// cover: xterm.js itself, which needs a DOM that `svelte/server` does not give it, so the grid here
// is the mount point the browser fills and the assertions stop at it.
describe('a terminal in the payload', () => {
    const pane = terminal('a1b2c3-shell', { cwd: `${ALPHA}/code`, pid: 991, attached: true });

    /** A fresh version each call, and the tree put back after, as the hook cases do above. */
    let version = 200;

    function withTerminals<T>(run: () => T): T {
        const whole = { ...payload(tree), terminals: [pane] };
        receive({ channel: 'sessions', version: (version += 1), payload: whole });
        const result = run();
        receive({ channel: 'sessions', version: (version += 1), payload: payload(tree) });
        return result;
    }

    it('draws the terminal grid without a composer in the tab that owns it', () => {
        const body = withTerminals(() => html(Terminal, { terminals: [pane.id] }));
        expect(body).toContain(`data-terminal="${pane.id}"`);
        // the tab shows its terminal, so no composer is drawn
        expect(body).not.toContain('data-composer');
        // the terminal is a shell, which is typed into at the grid, so nothing steers it from below
        expect(body).not.toContain(catalog['composer.steer']);
        select(null);
    });

    it('shows the composer in a tab opened for a terminal of its own, whatever the rail selected', () => {
        const body = withTerminals(() => {
            select(pane.id);
            return html(Terminal, { id: 'a-tab-of-its-own' });
        });
        expect(body).toContain('data-composer-prompt');
        // the tab owns no terminal yet, so the terminal the rail selected is not drawn in it
        expect(body).not.toContain(`data-terminal="${pane.id}"`);
        select(null);
    });

    it('draws a tab whose saved state names one terminal as `session` as the tab owning it', () => {
        const pinned = withTerminals(() => html(Terminal, { session: pane.id, label: pane.name }));
        expect(pinned).toContain(`data-terminal="${pane.id}"`);
        // a tab owning its terminal draws no control to let go of it
        expect(pinned).not.toContain(catalog['sessions.unpin_pane']);
    });

    it('lists it under the terminals heading, with its directory and a stop control', () => {
        const body = withTerminals(() => html(SessionList));
        expect(body).toContain(catalog['sessions.terminals']);
        expect(body).toContain(pane.name);
        expect(body).toContain('code');
        expect(body).toContain(catalog['sessions.stop_terminal']);
    });
});

// The resume control. What this does NOT cover: the click itself, and the menu's own list, which
// Menu.svelte renders only while it is open; there is no DOM here to open it, so a row's menu is
// checked by its opener and the confirm the second press shows is checked in the route test.
describe('resuming a session into a terminal', () => {
    it('offers the control on an ended session', () => {
        select('ended-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.resume_label']);
        expect(body).toContain(catalog['sessions.resume']);
        // the session has ended, so the control is offered rather than the sentence saying why it
        // cannot be
        expect(body).not.toContain(catalog['sessions.resume_live']);
        select(null);
    });

    it('says why a live session cannot be resumed, instead of the control', () => {
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(catalog['sessions.resume_live']);
        // the session is live, so the sentence is drawn in place of the control
        expect(body).not.toContain(catalog['sessions.resume']);
        select(null);
    });

    it('puts a row menu on every session row', () => {
        const body = html(SessionList);
        const menus = body.split(`aria-label="${catalog['ui.row_menu']}"`).length - 1;
        expect(menus).toBe(body.match(/data-session-row=/g)?.length);
    });
});

describe('the pin control over the portfolio', () => {
    /** A hub whose two projects are the folders a session may be pinned to. */
    function portfolio(): Snapshot {
        const project = (id: string, folder: string): Project => ({
            id,
            tier: 'manuscripts',
            ghost: false,
            title: id,
            chips: [],
            results: [],
            ideas: [],
            waitingOn: [],
            followups: [],
            subtasks: [],
            relatedIds: [],
            fundingIds: [],
            datasetIds: [],
            pillarIds: [],
            domainIds: [],
            collaborators: [],
            docs: [],
            folder,
            file: `${HUB}/${folder}/project.yml`
        });
        return {
            version: 9,
            entities: {
                projects: {
                    alpha: project('alpha', 'projects/manuscripts/alpha'),
                    quiet: project('quiet', 'projects/active/quiet')
                },
                venues: {},
                datasets: {},
                pillars: {},
                domains: {},
                funding: {},
                people: {},
                organisations: {},
                collections: {},
                feeds: NO_FEEDS,
                career: null
            },
            relations: {
                projectVenue: [],
                projectFunding: [],
                projectDataset: [],
                projectPillar: [],
                projectDomain: [],
                projectRelated: [],
                fundingPillar: [],
                projectPerson: [],
                jointWorkPerson: [],
                personOrganisation: [],
                fundingOrganisation: []
            },
            findings: []
        };
    }

    it('offers a project folder no session has ever touched, beside the ones sessions filed', () => {
        receive({ channel: 'portfolio', version: 9, payload: portfolio() });
        select('live-one');
        const body = html(SessionDetail);
        expect(body).toContain(`<option value="${ALPHA}"`);
        expect(body).toContain(`<option value="${HUB}/projects/active/quiet"`);
        // the scratch area is no project folder of this workspace, so it is not offered
        expect(body).not.toContain(`<option value="${UNKNOWN}"`);
        // and this area belongs to another workspace
        expect(body).not.toContain('<option value="/other"');
    });
});
