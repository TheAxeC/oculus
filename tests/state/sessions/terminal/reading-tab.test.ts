// Layer 2, client state tests. G147: a Terminal tab keeps its Live or Transcript choice, its lock
// and the session it reads through every rewrite, and a tab on Transcript outlives its last
// terminal; and the link between a session and its terminal those tabs read by. Everything here is
// pure over what a case hands it, the workbench a recording double.
//
// What this does NOT cover: the switch, the box and the grid, which are seen at the look.

import { describe, expect } from 'vitest';
import type { SessionRecord, Terminal } from '../../../../src/lib/data/model/index.ts';
import {
    emptyTab,
    joined,
    pageTarget,
    readTab,
    reordered,
    showingOne,
    showingRow,
    splitRight,
    unsplit,
    withLabel,
    withShares,
    withStarted,
    withTerminal,
    withoutTerminal,
    composingIn,
    type TerminalTabState
} from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import { closeEnded } from '../../../../src/lib/state/sessions/terminal/terminal-lists.ts';
import {
    sessionTerminal,
    terminalSession
} from '../../../../src/lib/state/sessions/terminal/session/session-link.ts';
import {
    createSessionOpening,
    type SessionOpening
} from '../../../../src/lib/state/sessions/terminal/session/open-session.ts';
import type {
    TerminalTab,
    TerminalTabs
} from '../../../../src/lib/state/sessions/terminal/session/workbench-shape.ts';
import { record, terminal } from '../../../fixtures/sessions-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

const A = 'a1a1a1-claude';
const B = 'b2b2b2-shell';
const SESSION = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER = '3f2504e0-4f89-11d3-9a0c-0305e82c3302';

/** A tab with both terminals in its row, on Transcript, locked and reading a session. */
function held(): TerminalTabState {
    return {
        ...readTab({ terminals: [A, B], row: [A, B], shares: [0.5, 0.5], shown: A }),
        showing: 'transcript',
        locked: true,
        transcript: { session: SESSION, agent: '' }
    };
}

/** The three fields a rewrite keeps. */
function kept(tab: TerminalTabState): unknown[] {
    return [tab.showing, tab.locked, tab.transcript];
}

/** A workbench over one list of tabs, which records what closes. */
function bench(tabs: TerminalTab[], page = 'p') {
    const closed: string[] = [];
    const beside: string[] = [];
    let opened = 0;
    const workbench = {
        tabs: () => tabs,
        restate: (id: string, _page: string, state: TerminalTabState) => {
            const tab = tabs.find((one) => one.id === id);
            if (tab !== undefined) tab.state = state;
        },
        activate: () => undefined,
        switchPage: () => undefined,
        currentPage: () => page,
        activeTab: () => null,
        open: (on: string, state: TerminalTabState) => {
            opened += 1;
            tabs.push({ id: `made-${String(opened)}`, page: on, view: 'terminal', state });
            return `made-${String(opened)}`;
        },
        openBeside: (tab: string, on: string, state: TerminalTabState) => {
            opened += 1;
            beside.push(tab);
            tabs.push({ id: `made-${String(opened)}`, page: on, view: 'terminal', state });
            return `made-${String(opened)}`;
        },
        close: (id: string) => closed.push(id),
        selected: () => null,
        select: () => undefined
    } as unknown as TerminalTabs;
    return { workbench, closed, beside, count: () => tabs.length };
}

function tab(id: string, state: TerminalTabState): TerminalTab {
    return { id, page: 'p', view: 'terminal', state };
}

/** The store's opening over one list of tabs, whose session runs in `running` when it is named. */
function opening(
    tabs: TerminalTab[],
    workbench: TerminalTabs,
    running: string | null,
    show: (id: string) => void = () => undefined
): SessionOpening {
    const made = running === null ? null : terminal(running, { pid: 7 });
    return createSessionOpening({
        workbench,
        terminalTabs: () => tabs,
        terminals: () => (made === null ? [] : [made]),
        records: () => [record(SESSION, { pid: 7 })],
        show
    });
}

/** Open a session with no terminal. */
function open(
    tabs: TerminalTab[],
    workbench: TerminalTabs,
    ask: Parameters<SessionOpening['openSession']>[0]
): void {
    opening(tabs, workbench, null).openSession(ask);
}

describe('a tab that reads a session', () => {
    it("opens a session with no terminal in the pane of the page's Terminal tab", () => {
        const tabs = [tab('t', readTab({ terminals: [A], shown: A }))];
        const { workbench, beside } = bench(tabs);
        open(tabs, workbench, { session: SESSION, label: 'x', press: true });
        expect(beside).toEqual(['t']);
    });

    it('reads a state without the keys as Live, unlocked and reading nothing', () => {
        expect(kept(readTab({}))).toEqual(['live', false, null]);
        expect(kept(readTab({ terminals: [A], shown: A }))).toEqual(['live', false, null]);
        expect(kept(emptyTab('x'))).toEqual(['live', false, null]);
    });

    it('reads a state with the keys back equal', () => {
        const state = held();
        expect(readTab(state)).toEqual(state);
    });

    it.each<[string, (state: TerminalTabState) => TerminalTabState]>([
        ['readTab', (state) => readTab(state)],
        ['withTerminal', (state) => withTerminal(state, 'c3c3c3-shell', 0)],
        ['withoutTerminal', (state) => withoutTerminal(state, A)],
        ['reordered', (state) => reordered(state, [B, A])],
        ['splitRight', (state) => splitRight(state, A, 'c3c3c3-shell')],
        ['joined', (state) => joined(showingOne(state, A), B)],
        ['unsplit', (state) => unsplit(state, A)],
        ['showingOne', (state) => showingOne(state, B)],
        ['showingRow', (state) => showingRow(state, B)],
        ['composingIn', (state) => composingIn(state)],
        ['withStarted', (state) => withStarted(state, 'c3c3c3-shell', 'x')],
        ['withLabel', (state) => withLabel(state, 'x')],
        ['withShares', (state) => withShares(state, [0.2, 0.8])]
    ])('keeps its choice, its lock and its session through %s', (_name, rewrite) => {
        expect(kept(rewrite(held()))).toEqual(kept(held()));
    });

    it.each<[string, TerminalTabState['showing'], boolean, string[]]>([
        ['on Transcript stays and reads the session', 'transcript', false, []],
        ['on Live closes', 'live', true, ['t']]
    ])('whose last terminal ended, %s', (_case, showing, gone, closed) => {
        const tabs = [tab('t', { ...readTab({ terminals: [A], shown: A }), showing })];
        const { workbench, closed: went } = bench(tabs);
        closeEnded(workbench, tabs, [A], () => SESSION);
        expect(went).toEqual(closed);
        if (gone) return;
        const left = readTab(tabs[0].state);
        expect([left.terminals, left.showing, left.transcript]).toEqual([
            [],
            'transcript',
            { session: SESSION, agent: '' }
        ]);
    });

    it('closes a tab on Transcript whose last terminal had no session', () => {
        const state = { ...readTab({ terminals: [A], shown: A }), showing: 'transcript' as const };
        const tabs = [tab('t', state)];
        const { workbench, closed } = bench(tabs);
        closeEnded(workbench, tabs, [A], () => null);
        expect(closed).toEqual(['t']);
    });

    it('finds its session and its terminal by the agent pid and by the resume', () => {
        const byPid = terminal(B, { pid: 100, agent: { tool: 'claude', pid: 101 } });
        const bySave = terminal(A, { resumes: { tool: 'claude', id: OTHER } });
        const rows = [record(SESSION, { pid: 101 }), record(OTHER, { pid: null })];
        expect(sessionTerminal([byPid, bySave], rows[0], rows)?.id).toBe(B);
        expect(sessionTerminal([byPid, bySave], rows[1], rows)?.id).toBe(A);
        expect(terminalSession(byPid, [byPid, bySave], rows)?.id).toBe(SESSION);
        expect(terminalSession(bySave, [byPid, bySave], rows)?.id).toBe(OTHER);
    });

    const CODEX = 'c3c3c3-codex';
    const codexTerminal = (id: string, over: Partial<Terminal> = {}): Terminal =>
        terminal(id, { kind: 'codex', cwd: '/w', agent: { tool: 'codex', pid: 7 }, ...over });
    const codexRecord = (id: string): SessionRecord =>
        record(id, { tool: 'codex', cwd: '/w', live: true, pid: null });

    it.each<[string, Terminal[], SessionRecord[], string | null]>([
        ['the one terminal in its folder', [codexTerminal(CODEX)], [codexRecord(SESSION)], CODEX],
        [
            'no one of two terminals',
            [codexTerminal(CODEX), codexTerminal('d4d4d4-shell', { kind: 'codex' })],
            [codexRecord(SESSION)],
            null
        ],
        [
            'no terminal for two live records',
            [codexTerminal(CODEX)],
            [codexRecord(SESSION), codexRecord(OTHER)],
            null
        ],
        [
            'no terminal that resumes another session',
            [codexTerminal(CODEX, { resumes: { tool: 'codex', id: OTHER } })],
            [codexRecord(SESSION)],
            null
        ]
    ])('links a Codex record to %s', (_case, terminals, records, found) => {
        const [first] = terminals;
        expect(sessionTerminal(terminals, records[0], records)?.id ?? null).toBe(found);
        expect(terminalSession(first, terminals, records)?.id ?? null).toBe(
            found === null ? null : SESSION
        );
    });

    it('opens an ended session twice in one tab', () => {
        const tabs: TerminalTab[] = [];
        const { workbench, count } = bench(tabs);
        const ask = { session: SESSION, label: 'x' };
        open(tabs, workbench, ask);
        open(tabs, workbench, ask);
        expect(count()).toBe(1);
        expect(readTab(tabs[0].state).showing).toBe('transcript');
    });

    it('opens an agent row twice in one tab, apart from the session', () => {
        const tabs: TerminalTab[] = [];
        const { workbench, count } = bench(tabs);
        open(tabs, workbench, { session: SESSION, label: 'x' });
        open(tabs, workbench, { session: SESSION, agent: 'one', label: 'y' });
        open(tabs, workbench, { session: SESSION, agent: 'one', label: 'y' });
        expect(count()).toBe(2);
        expect(readTab(tabs[1].state).transcript).toEqual({ session: SESSION, agent: 'one' });
    });

    it('retargets one tab for two presses in the list', () => {
        const tabs: TerminalTab[] = [];
        const { workbench, count } = bench(tabs);
        open(tabs, workbench, { session: SESSION, label: 'x', press: true });
        open(tabs, workbench, { session: OTHER, label: 'y', press: true });
        expect(count()).toBe(1);
        expect(readTab(tabs[0].state).transcript?.session).toBe(OTHER);
        expect(readTab(tabs[0].state).label).toBe('y');
    });

    it('opens one tab per session for presses in a list limited to a folder', () => {
        const tabs: TerminalTab[] = [];
        const { workbench, count } = bench(tabs);
        open(tabs, workbench, { session: SESSION, label: 'x', press: true, documents: true });
        open(tabs, workbench, { session: OTHER, label: 'y', press: true, documents: true });
        expect(count()).toBe(2);
    });

    it('shows a session with a terminal there, on Transcript from a command', () => {
        const tabs = [tab('t', readTab({ terminals: [A], shown: A }))];
        const { workbench } = bench(tabs);
        const shown: string[] = [];
        opening(tabs, workbench, A, (id) => shown.push(id)).openSession({
            session: SESSION,
            label: 'x'
        });
        expect(shown).toEqual([A]);
        expect(readTab(tabs[0].state).showing).toBe('transcript');
    });

    it('shows a session with a terminal there, on the choice the tab has from a press', () => {
        const tabs = [tab('t', readTab({ terminals: [A], shown: A }))];
        const { workbench } = bench(tabs);
        opening(tabs, workbench, A).openSession({ session: SESSION, label: 'x', press: true });
        expect(readTab(tabs[0].state).showing).toBe('live');
    });

    it('leaves a tab that reads a session out of where a start lands', () => {
        const reading = tab('r', { ...emptyTab('r'), transcript: { session: SESSION, agent: '' } });
        const plain = tab('t', emptyTab('t'));
        expect(pageTarget([reading, plain], 'r')).toBe('t');
        expect(pageTarget([reading], 'r')).toBeNull();
    });
});
