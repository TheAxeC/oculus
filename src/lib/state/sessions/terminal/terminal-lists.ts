// Layer 2, client state. The rules that read the terminal list against the Terminal tabs: which
// terminals have ended as one `sessions` message says, which running terminals no tab owns, what a
// terminal is called wherever it is listed, what the ended ones take out of the tabs and where a
// moved terminal goes. The store in state/sessions/terminals.svelte.ts calls them with what it
// holds and the tests call them with what a case builds. The file holds two functions that write
// to the workbench they are handed, closeEnded and moveInto; the others are pure.

import type { Terminal } from '../../../data/model/index.ts';
import {
    isTerminalId,
    ownerOf,
    readTab,
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
