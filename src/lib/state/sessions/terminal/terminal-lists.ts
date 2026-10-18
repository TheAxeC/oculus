// Layer 2, client state. The rules that read the terminal list against the Terminal tabs: which
// terminals have ended as one `sessions` message says, which running terminals no tab owns, what a
// terminal is called wherever it is listed and what a Terminal tab calls it, which terminal a
// session runs in, what the ended ones take out of the tabs and where a moved terminal goes. The
// store in state/sessions/terminals.svelte.ts calls them with what it holds and the tests call them
// with what a case builds. The file holds three functions that write to the workbench they are
// handed, closeEnded, moveInto and showIn; the others are pure.
//
// `endingOf` names what an app runs, for the question a disable asks.
//
// A Terminal tab is titled by `terminalTabTitle`, which only the tab uses; the Sessions view's rows
// and the Processes view keep `terminalLabel` (title, else name).

import {
    isTerminalId,
    type DebugPayload,
    type SessionRecord,
    type Terminal
} from '../../../data/model/index.ts';
import type { AppEnding } from '../../system/apps/flows.ts';
import { t } from '../../shared/words/text.ts';
import {
    emptyTab,
    ownerOf,
    pageTarget,
    readTab,
    showingRow,
    tabTerminals,
    withTerminal,
    withoutTerminal
} from './terminal-tabs.ts';
import type { TerminalTab, TerminalTabs } from './workbench-shape.ts';

/**
 * The terminals that have ended, as one `sessions` message says: those not in its list that an
 * earlier message listed, and, on the first message the page hears, those a tab or the selection
 * holds, which ended while the page was away. A terminal started from this page after the first
 * message and not listed yet has not ended, since no message listed it. A message with no list
 * says nothing about any terminal.
 */
export function endedTerminals(
    before: ReadonlySet<string>,
    now: readonly string[] | null,
    first: boolean,
    held: readonly string[]
): string[] {
    if (now === null) return [];
    const listed = new Set(now);
    const known = first ? [...before, ...held] : [...before];
    return [...new Set(known)].filter((id) => !listed.has(id));
}

/**
 * The running terminals no Terminal tab owns: those the latest list names that no tab of any page
 * lists among its terminals, in list order. A foreign terminal (a session made by hand under the
 * prefix) is left out, as Join Terminals leaves it out, since its controls are refused. No list
 * heard yet names none.
 */
export function unownedTerminals(
    list: readonly Terminal[] | null,
    tabs: readonly { state: unknown }[]
): Terminal[] {
    if (list === null) return [];
    const owned = new Set(tabs.flatMap((tab) => tabTerminals(tab.state)));
    return list.filter((one) => one.foreign !== true && !owned.has(one.id));
}

/** What a terminal is called wherever it is listed: its title when it has one, else its name. */
export function terminalLabel(held: Pick<Terminal, 'name' | 'title'>): string {
    return held.title === '' ? held.name : held.title;
}

/**
 * What a Terminal tab calls a terminal it shows: the title the reader gave it; else the agent's
 * word for an agent terminal, since what tmux reports running in its pane says nothing of it; else
 * the name of the project command a task terminal ran, followed by the app's title in parentheses
 * for a task of an app; else the name an app gave a terminal it made; else the process tmux
 * reports; else the word for a shell.
 */
export function terminalTabTitle(
    held: Pick<Terminal, 'title' | 'kind' | 'command' | 'job' | 'name'>
): string {
    if (held.title !== '') return held.title;
    if (held.kind === 'claude') return t('sessions.kind_claude');
    if (held.kind === 'codex') return t('sessions.kind_codex');
    if (held.job?.app !== undefined)
        return t('sessions.app_task_title', held.job.name, held.job.app.title);
    if (held.job !== null) return held.job.name;
    if (held.kind === 'app') return held.name === '' ? t('sessions.kind_app') : held.name;
    return held.command === '' ? t('sessions.terminal_title_shell') : held.command;
}

/**
 * Take the ended terminals out of every tab that owned them, on any page; a tab left owning none
 * closes unless the reader is composing in it, where it keeps its composer, shown alone, and what
 * was typed. A selection that was one of them is cleared. A tab that owned none of them is left as
 * it is, so a tab showing a composer it never started from stays.
 */
export function closeEnded(
    workbench: TerminalTabs,
    tabs: readonly TerminalTab[],
    ended: readonly string[]
): void {
    if (ended.length === 0) return;
    for (const tab of tabs) {
        const held = readTab(tab.state);
        if (!ended.some((id) => held.terminals.includes(id))) continue;
        const next = ended.reduce(withoutTerminal, held);
        workbench.restate(tab.id, tab.page, next);
        if (next.terminals.length === 0 && !held.composing) workbench.close(tab.id, tab.page);
    }
    const selected = workbench.selected();
    if (selected !== null && ended.includes(selected)) workbench.select(null);
}

/**
 * Move a terminal into a Terminal tab before the row at `index` of that tab's order (`index` equal
 * to its length puts it last), shown there. Within one tab it is a reorder. The tab it left closes
 * when it owns nothing more, unless the reader is composing in it, where it keeps its composer
 * shown alone. A tab id no page holds moves nothing.
 */
export function moveInto(
    workbench: TerminalTabs,
    tabs: readonly TerminalTab[],
    id: string,
    toTab: string,
    toPage: string,
    index: number
): void {
    if (!isTerminalId(id)) return;
    const target =
        tabs.find((tab) => tab.id === toTab && tab.page === toPage) ??
        tabs.find((tab) => tab.id === toTab);
    if (target === undefined) return;
    const from = ownerOf(tabs, id);
    if (from !== null && from.id !== target.id) {
        const was = readTab(from.state);
        const left = withoutTerminal(was, id);
        workbench.restate(from.id, from.page, left);
        if (left.terminals.length === 0 && !was.composing) workbench.close(from.id, from.page);
    }
    const held = readTab(target.state);
    const before = held.terminals.indexOf(id);
    const at = before >= 0 && before < index ? index - 1 : index;
    workbench.restate(target.id, target.page, withTerminal(held, id, at));
    workbench.activate(target.id, target.page);
}

/**
 * The Terminal tab of a page or float that a terminal no tab owns, New and the app menu's starts
 * go to: pageTarget's rule over that page's tabs.
 */
export function pageTabOf(
    workbench: TerminalTabs,
    tabs: readonly TerminalTab[],
    page: string
): TerminalTab | null {
    const onPage = tabs.filter((tab) => tab.page === page);
    const chosen = pageTarget(onPage, workbench.activeTab(page));
    return onPage.find((tab) => tab.id === chosen) ?? null;
}

/**
 * Show a terminal. The tab that owns it is activated, its page switched to when it is another,
 * and shows it in the tab's row. A terminal no tab owns joins the end of the Terminal tab of the
 * page on screen, or of a new Terminal tab there, and is shown; `label` names a tab that takes it.
 * An id that is not a terminal's shows nothing.
 */
export function showIn(
    workbench: TerminalTabs,
    tabs: readonly TerminalTab[],
    id: string,
    label: string
): void {
    if (!isTerminalId(id)) return;
    const owner = ownerOf(tabs, id);
    if (owner !== null) {
        if (owner.page !== workbench.currentPage()) workbench.switchPage(owner.page);
        const held = readTab(owner.state);
        const next = showingRow(held, id);
        if (next !== held) workbench.restate(owner.id, owner.page, next);
        workbench.activate(owner.id, owner.page);
        return;
    }
    const page = workbench.currentPage();
    const target = pageTabOf(workbench, tabs, page);
    if (target === null) {
        const joined = withTerminal(emptyTab(crypto.randomUUID()), id, 0);
        workbench.open(page, { ...joined, label });
        return;
    }
    const held = readTab(target.state);
    const joined = withTerminal(held, id, held.terminals.length);
    workbench.restate(target.id, page, label === '' ? joined : { ...joined, label });
    workbench.activate(target.id, page);
}

/**
 * The oculus terminal a session runs in: the one that resumed it, or the one whose pane process is
 * the session's own. The pane's process is the agent itself, since tmux runs the argv directly, so
 * a Claude session the registry reports by pid is found by it. Null for a session that runs in a
 * terminal of its own.
 */
export function sessionTerminal(
    terminals: readonly Terminal[],
    record: Pick<SessionRecord, 'id' | 'pid'> | null
): Terminal | null {
    if (record === null) return null;
    const all = terminals.filter((one) => one.foreign !== true);
    return (
        all.find((one) => one.resumes?.id === record.id) ??
        all.find((one) => record.pid !== null && one.pid !== 0 && one.pid === record.pid) ??
        null
    );
}

/**
 * What the app of this view id runs now. A debug session is the app's while its adapter is the
 * app's and the session is not over. A task is a terminal that runs a task of the app and has not
 * ended; a terminal is one the app made that is no task and has not ended.
 */
export function endingOf(
    id: string,
    terminals: readonly Terminal[],
    debug: DebugPayload | null
): AppEnding {
    const live = debug?.status === 'running' || debug?.status === 'paused';
    const session = debug?.adapter;
    const own = terminals.filter((one) => one.exit === null);
    return {
        debug: live && session?.app === id ? session.label : null,
        tasks: own
            .filter((one) => one.job?.app?.app === id || (one.app === id && one.task))
            .map((one) => terminalTabTitle(one)),
        terminals: own
            .filter((one) => one.app === id && !one.task)
            .map((one) => terminalTabTitle(one))
    };
}
