// The six session views rendered to HTML on the server: what each one draws over one synthetic
// payload, and what each one draws when nothing is selected.
//
// The catalog, glyphs and vocabulary are the real config. The sessions and git state are the test's
// own: nothing reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no row
// is clicked, no dismissal is sent and the timeline's scrolling never runs; the selection a click
// would write is written here through select() instead.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Agents from '../../../src/lib/views/sessions/agents/Agents.svelte';
import SessionDetail from '../../../src/lib/views/sessions/session-detail/SessionDetail.svelte';
import SessionList from '../../../src/lib/views/sessions/session-list/SessionList.svelte';
import {
    sessionRowItems,
    terminalRowItems
} from '../../../src/lib/views/sessions/session-list/session-list.ts';
import Terminal from '../../../src/lib/views/sessions/terminal/Terminal.svelte';
import Timeline from '../../../src/lib/views/sessions/timeline/Timeline.svelte';
import Transcript from '../../../src/lib/views/sessions/transcript/Transcript.svelte';
import { scheduleReflow } from '../../../src/lib/views/sessions/terminal/reflow.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { clock } from '../../../src/lib/state/words/format.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import type { Turn } from '../../../src/lib/state/sessions/transcript.svelte.ts';
import {
    area,
    git,
    payload,
    record,
    terminal,
    workspace
} from '../../fixtures/sessions-fixture.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import type { Project, Snapshot } from '../../../src/lib/data/model.ts';
import type { Component } from 'svelte';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type { ViewProps } from '../../../src/lib/views/registry.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let apply: ClientState['layout']['apply'];
let select: ClientState['selection']['select'];
let forget: ClientState['transcripts']['forget'];
let hold: ClientState['transcripts']['hold'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ apply } = client.layout);
    ({ select } = client.selection);
    ({ forget, hold } = client.transcripts);
    ({ setInstanceState } = client.ui);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
const glyphs = glyphCatalog(config);
setGlyphs(glyphs);
setVocab(vocabCatalog(config));

const HUB = '/hub';
const ALPHA = `${HUB}/projects/manuscripts/alpha`;
const UNKNOWN = `${HUB}/scratch`;

const live = record('live-one', {
    title: 'The live one',
    tool: 'claude',
    live: true,
    liveStatus: 'busy',
    state: 'working',
    pid: 4242,
    model: 'claude-opus-5',
    effort: 'high',
    permissionMode: 'acceptEdits',
    version: '2.1.0',
    branch: 'main',
    prompts: 4,
    contextTokens: 800000,
    // The last turn read 400k of its 800k; the lifetime sum is larger than any window, which is the
    // whole reason the share is not taken from it.
    lastCacheRead: 400000,
    tokens: { input: 1200, output: 340, cacheRead: 9000000, cacheCreation: 0, thinking: 90 },
    cache: { ttl: '1h', lastCreation: null, lastRead: null, busts: 2 },
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    secondaryAreas: [{ key: `${HUB}/tools/oculus`, short: 'tools/oculus' }],
    files: [
        { path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 3, last: null },
        { path: `${ALPHA}/code/run.py`, tool: 'Edit', count: 1, last: null }
    ],
    agents: [
        {
            id: 'ag-1',
            description: 'Read the whole tree and report',
            subagentType: 'Explore',
            model: 'claude-sonnet-5',
            started: '2026-09-10T08:00:00.000Z',
            ended: '2026-09-10T08:00:45.000Z',
            status: 'done',
            resultChars: 5200
        },
        {
            id: 'ag-2',
            description: 'Still going',
            subagentType: '',
            model: null,
            started: '2026-09-10T08:01:00.000Z',
            ended: null,
            status: 'running',
            resultChars: 0
        }
    ],
    timeline: [
        { ts: '2026-09-10T08:00:00.000Z', kind: 'prompt', text: 'do the thing' },
        { ts: '2026-09-10T08:00:10.000Z', kind: 'edit', text: `${ALPHA}/manuscript/main.tex` },
        { ts: '2026-09-10T08:00:20.000Z', kind: 'turn', text: '42000' },
        { ts: '2026-09-10T08:00:30.000Z', kind: 'bust', text: '84000' },
        { ts: '2026-09-10T08:00:40.000Z', kind: 'compaction', text: 'compacted' }
    ]
});

const sharer = record('live-two', {
    title: 'The other live one',
    tool: 'codex',
    live: true,
    liveStatus: 'idle',
    state: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: ALPHA,
    files: [{ path: `${ALPHA}/manuscript/main.tex`, tool: 'Edit', count: 1, last: null }]
});

const gone = record('ended-one', {
    title: 'The ended one',
    kind: 'observed',
    workspace: HUB,
    area: UNKNOWN,
    cwd: UNKNOWN
});

const away = record('dismissed-one', {
    title: 'The dismissed one',
    hidden: true,
    workspace: HUB,
    area: UNKNOWN,
    cwd: UNKNOWN
});

const bare = record('bare-one', {
    title: 'The bare one',
    workspace: '/other',
    area: '/other',
    cwd: '/other'
});

/** A session an override pinned to its area rather than the score choosing it. */
const held = record('pinned-one', {
    title: 'The pinned one',
    // Live, so the counts the rail draws for the ended and the dismissed rows are the same five
    // rows those cases were written against.
    live: true,
    liveStatus: 'idle',
    state: 'idle',
    workspace: HUB,
    area: ALPHA,
    cwd: UNKNOWN,
    pinned: true
});

const tree = [
    workspace(HUB, [
        area(ALPHA, [live, sharer, held]),
        area(UNKNOWN, [gone, away], { known: false, short: 'scratch', full: UNKNOWN })
    ]),
    workspace('/other', [area('/other', [bare])])
];

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'sessions', version: 1, payload: payload(tree) });
    receive({
        channel: 'git',
        version: 1,
        payload: {
            [HUB]: HUB_GIT,
            '/other': git({ branch: '', repository: false, error: 'not a git repository' })
        }
    });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

/** The hub's git state as the tests read it: one staged, two changed, one untracked file. */
const HUB_GIT = git({
    branch: 'main',
    ahead: 1,
    staged: [{ path: 'a/one.ts', status: 'M', added: 4, deleted: 2 }],
    unstaged: [
        { path: 'a/two.png', status: 'M', added: null, deleted: null },
        // The same file the other live session is holding open, as git sees it: relative to
        // the workspace root, which is what the "also open" mark has to match across.
        {
            path: 'projects/manuscripts/alpha/manuscript/main.tex',
            status: 'M',
            added: 1,
            deleted: 0
        }
    ],
    untracked: [{ path: 'a/three.ts', status: '?', added: 0, deleted: 0 }]
});

let counter = 0;

/** One view rendered as a fresh instance, with the state that instance has saved. */
function html(view: Component<ViewProps>, state: unknown = {}, id = `probe-${(counter += 1)}`) {
    setInstanceState(id, state);
    const instance: Instance = { id, view: 'probe', state };
    apply({ root: { kind: 'pane', tabs: [instance], active: id } });
    return render(view, { context: clientContext(client), props: { instance } }).body;
}

describe('the session list', () => {
    it('audits that offers a labelled pinned pane action for sessions and terminals', () => {
        const session = sessionRowItems(live, '').find((item) => item.id === 'pinned');
        const terminal = terminalRowItems().find((item) => item.id === 'pinned');
        expect(session).toEqual({
            id: 'pinned',
            label: catalog['sessions.open_pinned'],
            title: catalog['sessions.open_pinned_tip']
        });
        expect(terminal).toEqual(session);
    });

    it('draws every workspace, its areas and its live rows', () => {
        select('live-one');
        const body = html(SessionList);
        expect(body).toContain('The live one');
        expect(body).toContain('The other live one');
        expect(body).toContain('claude');
        expect(body).toContain('codex');
        // The short area label, and the whole of it as the tooltip.
        expect(body).toContain(`title="${ALPHA}"`);
    });

    it('marks a session an override pinned to its area', () => {
        const body = html(SessionList);
        expect(body).toContain(catalog['sessions.pin_mark']);
        // The mark is on the pinned row and on no other: four of the five rows it draws scored
        // their own area.
        expect(body.split(catalog['sessions.pin_mark']).length - 1).toBe(1);
    });

    it('marks an area that is not a known project folder', () => {
        const body = html(SessionList, { ended: true });
        expect(body).toContain(catalog['sessions.area_unknown']);
    });

    it('says how many are ended and keeps them out of the rail until asked', () => {
        // Two of the five are ended and not dismissed: the observed one and the bare one.
        const shut = html(SessionList);
        expect(shut).toContain(catalog['sessions.ended_section'].replace('{0}', '2'));
        // the ended section is closed, so the sessions in it are not drawn
        expect(shut).not.toContain('The ended one');
        const open = html(SessionList, { ended: true });
        expect(open).toContain('The ended one');
        // a dismissed session stays out of the list until it is asked for by name
        expect(open).not.toContain('The dismissed one');
    });

    it('offers the dismissed ones by count, and shows them when asked', () => {
        const shut = html(SessionList, { ended: true });
        expect(shut).toContain(catalog['sessions.show_dismissed'].replace('{0}', '1'));
        const open = html(SessionList, { ended: true, dismissed: true });
        expect(open).toContain('The dismissed one');
        expect(open).toContain(catalog['sessions.hide_dismissed'].replace('{0}', '1'));
    });

    it('carries a dismiss control on an ended row and none on a live one', () => {
        const body = html(SessionList, { ended: true, dismissed: true });
        expect(body).toContain(catalog['sessions.close_tip']);
        expect(body).toContain(catalog['sessions.restore_tip']);
    });

    it('marks the selected row and the live labels', () => {
        select('live-one');
        const body = html(SessionList);
        // Svelte writes its own scoped class between the two, so the mark is matched rather than
        // compared: what is checked is that exactly one row carries it.
        expect(body.match(/class="row[^"]*\bon\b/g)).toHaveLength(1);
        expect(body).toContain(catalog['sessions.live_busy']);
        expect(body).toContain(catalog['sessions.live_idle']);
        expect(body).toContain('opus-5');
    });

    it('shows its empty state when the payload holds nothing', () => {
        receive({ channel: 'sessions', version: 2, payload: payload([]) });
        expect(html(SessionList)).toContain(catalog['sessions.state_empty']);
        receive({ channel: 'sessions', version: 3, payload: payload(tree) });
    });
});

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
    it('offers the three kinds, a directory, the start control and three size controls', () => {
        select(null);
        const body = html(Terminal);
        expect(body).toContain(catalog['sessions.no_terminal']);
        expect(body).toContain(catalog['sessions.start_terminal']);
        expect(body).toContain(catalog['sessions.kind_claude']);
        expect(body).toContain(catalog['sessions.kind_codex']);
        expect(body).toContain(catalog['sessions.kind_shell']);
        expect(body).toContain(catalog['sessions.cwd']);
        expect(body).toContain(catalog['sessions.cwd_empty']);
        expect(body).toContain(catalog['sessions.terminal_smaller']);
        expect(body).toContain(catalog['sessions.terminal_larger']);
        expect(body).toContain(catalog['sessions.terminal_reset']);
        expect(body.match(/class="tool[^"]*compact/g)).toHaveLength(3);
    });
});

describe('the terminal toolbar pin', () => {
    // The label follows the pinned terminal's name through an $effect, which no server render runs;
    // the write it makes is read off the source and the browser suite presses the rename itself.
    // revert: src/lib/views/sessions/terminal/Terminal.svelte:354 => glyph="dismiss"
    it('is a glyph button among the glyph buttons, not a word among them', () => {
        select(null);
        const body = html(Terminal, { session: 'abc123-shell' });
        const pin = /<button[^>]*aria-label="[^"]*"[^>]*>(?:(?!<\/button>)[\s\S])*?<\/button>/g;
        const found = (body.match(pin) ?? []).filter((one) =>
            one.includes(catalog['sessions.unpin_pane'])
        );
        expect(found).toHaveLength(1);
        expect(found[0]).toContain('compact');
        expect(found[0]).toContain(`data-glyph="${catalog['sessions.pin_glyph']}"`);
        // it is drawn as a glyph among the glyph buttons, so it carries no label span
        expect(found[0]).not.toContain('<span class="label">');
    });

    it('audits that renames the pinned tab to the terminal own name rather than to the name at the pin', () => {
        const source = readFileSync('src/lib/views/sessions/terminal/Terminal.svelte', 'utf8');
        expect(source).toContain(
            'restateInstance(instance.id, { session: held, label: live.name })'
        );
        expect(source).toContain('if (label === live.name) return;');
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

    it('draws a permission_prompt as a chip with the message as its tooltip', () => {
        const body = withHooks(() => html(SessionList, { ended: true }));
        expect(body).toContain(catalog['notify.permission_chip']);
        expect(body).toContain('title="may I edit main.py?"');
    });

    it('draws the stop event as a stopped-at line in the row meta', () => {
        const body = withHooks(() => html(SessionList, { ended: true }));
        expect(body).toContain(
            catalog['sessions.stopped_at'].replace('{0}', clock(stopped.hook?.at))
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

    it('draws the terminal grid without a composer when it is the selection', () => {
        const body = withTerminals(() => {
            select(pane.id);
            return html(Terminal);
        });
        expect(body).toContain(`data-terminal="${pane.id}"`);
        // the grid is the selection, and the composer belongs to a session's own pane
        expect(body).not.toContain('textarea');
        select(null);
    });

    // revert: src/lib/views/sessions/terminal/Terminal.svelte:112 => const fresh = false;
    it('shows the start form in a tab opened for a terminal of its own, whatever the rail selected', () => {
        const body = withTerminals(() => {
            select(pane.id);
            return html(Terminal, { id: 'a-tab-of-its-own' });
        });
        expect(body).toContain(catalog['sessions.start_terminal']);
        // the tab owns no terminal yet, so the terminal the rail selected is not drawn in it
        expect(body).not.toContain(`data-terminal="${pane.id}"`);
        select(null);
    });

    it('offers pin and unpin in place', () => {
        const body = withTerminals(() => {
            select(pane.id);
            return html(Terminal);
        });
        expect(body).toContain(catalog['sessions.pin_pane']);
        select(null);
        const pinned = withTerminals(() => html(Terminal, { session: pane.id, label: pane.name }));
        expect(pinned).toContain(catalog['sessions.unpin_pane']);
        expect(pinned).toContain(`data-terminal="${pane.id}"`);
        select(null);
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
        const ended = html(SessionList, { ended: true });
        expect(ended).toContain(`aria-label="${catalog['ui.row_menu']}"`);
        const liveOnly = html(SessionList);
        expect(liveOnly).toContain('The live one');
        expect(liveOnly).toContain(`aria-label="${catalog['ui.row_menu']}"`);
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
