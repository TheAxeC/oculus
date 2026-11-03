// Layer 2, client state. Opening a session, the one way every caller reaches a session's turns: a
// session with a terminal shows that terminal, and a session with none is read in a Terminal tab
// that holds it in its own state. The tab-writing rule is `openSessionIn`, over what it is handed;
// `createSessionOpening` hands it the store's terminals and session records and keeps, per
// `sessions` message, the session of each terminal, which an ended terminal no longer says.

import type { SessionRecord, Terminal } from '../../../../data/model/index.ts';
import { emptyTab, ownerOf, readTab, type TabTranscript } from '../terminal-tabs.ts';
import { sessionTerminal, terminalSession } from './session-link.ts';
import type { TerminalTab, TerminalTabs } from './workbench-shape.ts';

/** What a caller opens. */
type SessionAsk = {
    session: string;
    /** The subagent to read, in a tab of its own; the session's own turns when absent. */
    agent?: string;
    /** What the tab is called until a terminal names it. */
    label: string;
    /** A press in the session list, which keeps the tab's own choice and retargets its tab. */
    press?: boolean;
    /** Open a tab a page with no Terminal tab needs in its documents pane, off the list. */
    documents?: boolean;
};

/** Whether a tab reads one transcript. */
function reads(tab: TerminalTab, target: TabTranscript): boolean {
    const held = readTab(tab.state).transcript;
    return held?.session === target.session && held.agent === target.agent;
}

/** The tab of a page that a press retargets: the one reading a session, else one that is empty. */
function pressTarget(onPage: readonly TerminalTab[]): TerminalTab | undefined {
    const states = onPage.map((tab) => ({ tab, held: readTab(tab.state) }));
    const reading = states.find(({ held }) => held.transcript?.agent === '');
    const empty = states.find(
        ({ held }) => held.transcript === null && held.terminals.length === 0
    );
    return (reading ?? empty)?.tab;
}

/** A tab activated, on its own page. */
function activate(workbench: TerminalTabs, tab: TerminalTab): void {
    if (tab.page !== workbench.currentPage()) workbench.switchPage(tab.page);
    workbench.activate(tab.id, tab.page);
}

/**
 * Open a session by its rules. `terminal` is the terminal it runs in, or null; `show` shows that
 * terminal. A session's terminal is shown, on Transcript unless the ask is a press, which leaves
 * the tab's own choice. A subagent, and a session with no terminal, is read in a tab of its own:
 * the one that reads it now, else for a press the page's tab that reads a session or that holds
 * nothing, then retargeted so presses do not pile up tabs, else a new one in the pane of the page's
 * Terminal tab, so a press in the sessions list does not cover the list. Only a page with no
 * Terminal tab takes the `documents` path.
 */
function openSessionIn(
    workbench: TerminalTabs,
    tabs: () => readonly TerminalTab[],
    ask: SessionAsk,
    terminal: string | null,
    show: (id: string) => void
): void {
    const target = { session: ask.session, agent: ask.agent ?? '' };
    if (terminal !== null && target.agent === '') {
        show(terminal);
        const owner = ownerOf(tabs(), terminal);
        if (owner === null || ask.press === true) return;
        workbench.restate(owner.id, owner.page, { ...readTab(owner.state), showing: 'transcript' });
        return;
    }
    const open = tabs().find((tab) => reads(tab, target));
    if (open !== undefined) {
        activate(workbench, open);
        return;
    }
    const page = workbench.currentPage();
    const onPage = tabs().filter((tab) => tab.page === page);
    const pressed = ask.press === true ? pressTarget(onPage) : undefined;
    const fields = { transcript: target, label: ask.label, showing: 'transcript' as const };
    if (pressed !== undefined) {
        workbench.restate(pressed.id, pressed.page, { ...readTab(pressed.state), ...fields });
        activate(workbench, pressed);
        return;
    }
    const state = { ...emptyTab(crypto.randomUUID()), ...fields };
    const sibling = onPage.at(0);
    if (sibling !== undefined) {
        workbench.openBeside(sibling.id, page, state);
        return;
    }
    workbench.open(page, state, ask.documents === true);
}

/** What the store hands the opening. */
type SessionHost = {
    workbench: TerminalTabs | undefined;
    terminalTabs: () => TerminalTab[];
    terminals: () => Terminal[];
    records: () => readonly SessionRecord[];
    show: (id: string) => void;
};

/** The calls a view has on the link between sessions and terminals. */
export type SessionOpening = {
    /** The terminal a session runs in, by `sessionTerminal`'s rules over the terminals. */
    terminalOfSession: (record: SessionRecord | null) => Terminal | null;
    /** The session a terminal runs, or null. */
    sessionOfTerminal: (id: string | null) => SessionRecord | null;
    /** Open a session by `openSessionIn`'s rules. */
    openSession: (ask: SessionAsk) => void;
    /** Note the terminals of a `sessions` message with its records; each message replaces it. */
    linkTerminals: (terminals: readonly Terminal[], records: readonly SessionRecord[]) => void;
    /** The session a terminal ran at the last message that was noted, or null. */
    linkedSession: (terminal: string) => string | null;
};

/** The link calls over the store's terminals and records. */
export function createSessionOpening(host: SessionHost): SessionOpening {
    let links = new Map<string, string>();

    function terminalOfSession(record: SessionRecord | null): Terminal | null {
        return sessionTerminal(host.terminals(), record, host.records());
    }

    function openSession(ask: SessionAsk): void {
        if (host.workbench === undefined) return;
        const record = host.records().find((one) => one.id === ask.session) ?? null;
        const terminal = terminalOfSession(record)?.id ?? null;
        openSessionIn(host.workbench, host.terminalTabs, ask, terminal, host.show);
    }

    return {
        terminalOfSession,
        sessionOfTerminal: (id) => {
            const terminal = host.terminals().find((one) => one.id === id);
            if (terminal === undefined) return null;
            return terminalSession(terminal, host.terminals(), host.records());
        },
        openSession,
        linkTerminals: (terminals, records) => {
            links = new Map(
                terminals.flatMap((one) => {
                    const session = terminalSession(one, terminals, records);
                    return session === null ? [] : [[one.id, session.id]];
                })
            );
        },
        linkedSession: (terminal) => links.get(terminal) ?? null
    };
}
