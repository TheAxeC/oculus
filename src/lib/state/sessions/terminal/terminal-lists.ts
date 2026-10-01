// Layer 2, client state. The rules that read the terminal list against the Terminal tabs: which
// terminals have ended as one `sessions` message says, which running terminals no tab owns, and
// what a terminal is called wherever it is listed. They are pure, so the store in
// state/sessions/terminals.svelte.ts calls them with what it holds and the tests call them with
// what a case builds.

import type { Terminal } from '../../../data/model/index.ts';
import { tabTerminals } from './terminal-tabs.ts';

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
