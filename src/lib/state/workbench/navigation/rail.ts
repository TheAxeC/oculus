// Layer 2, client state. The rail's pages as the page reads them out of the merged config: each
// entry of `rail:` with the arrangement its page is first made from. The rule over the list is
// data/sources/config/rail.ts's, shared with the server and the Settings view; this pairs what it
// keeps with the node its `page` names, which is what the layout store makes a page from, and holds
// the rules over the list a Settings tab is editing before it is saved.

import {
    arrangementKeys,
    glyphNames,
    railRows,
    readRail,
    type RailEntry,
    type RailProblem,
    type RailRead
} from '../../../data/sources/config/rail.ts';
import { t } from '../../shared/words/text.ts';

export { arrangementKeys, glyphNames, readRail };
export type { RailEntry, RailProblem, RailRead };

/** One rail button and the arrangement its page is made from the first time it is pressed. */
export type RailPage = RailEntry & { node: unknown };

/**
 * The rail's pages, in the order `rail:` lists them. An entry the rule refuses is left out, since a
 * button over a page that cannot be made, or drawn with a glyph the vocabulary does not hold, would
 * be a press that does nothing or a blank; the server reports it as a finding. The node is handed
 * on untouched: state/workbench/navigation/arrangement.ts reads its shape when the page is made.
 */
export function railPages(config: Record<string, unknown> | undefined): RailPage[] {
    if (config === undefined) return [];
    const raw = config.arrangements;
    const arrangements =
        typeof raw === 'object' && raw !== null && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
    const read = readRail(config.rail, arrangementKeys(arrangements), glyphNames(config));
    return read.entries.map((entry) => ({
        ...entry,
        node: arrangements[entry.page]
    }));
}

/** The view the rail list is edited in, whose instance state holds the list being typed. */
export const SETTINGS_VIEW = 'settings';

/**
 * The rail list a Settings tab is editing, or null when it edits nothing and shows the list the
 * config holds. It is kept in the tab's own state, so it is there again after the tab is switched
 * away from and after a reload, as every form's typing is.
 */
export function railDraft(state: unknown): RailEntry[] | null {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
    return railRows((state as Record<string, unknown>).rail);
}

/** A Settings tab's state with the list being typed set, or taken away when it is null. */
export function withRailDraft(state: unknown, rail: RailEntry[] | null): Record<string, unknown> {
    const held =
        typeof state === 'object' && state !== null && !Array.isArray(state)
            ? { ...(state as Record<string, unknown>) }
            : {};
    if (rail === null) delete held.rail;
    else held.rail = rail;
    return held;
}

/** Whether two rail lists are the same buttons in the same order. */
export function sameRail(left: readonly RailEntry[], right: readonly RailEntry[]): boolean {
    return (
        left.length === right.length &&
        left.every(
            (entry, at) =>
                entry.label === right[at].label &&
                entry.glyph === right[at].glyph &&
                entry.page === right[at].page
        )
    );
}

/**
 * Whether a tab holds a rail list no save has taken: a Settings tab whose list differs from the one
 * the config holds. A tab of another view, and a Settings tab editing nothing, holds none.
 */
export function railTyped(
    view: string | undefined,
    state: unknown,
    saved: readonly RailEntry[]
): boolean {
    if (view !== SETTINGS_VIEW) return false;
    const draft = railDraft(state);
    return draft !== null && !sameRail(draft, saved);
}

/** One rail entry moved one place up or down, the list unchanged at either end. */
export function moveRailEntry(rail: readonly RailEntry[], at: number, by: -1 | 1): RailEntry[] {
    const to = at + by;
    if (at < 0 || at >= rail.length || to < 0 || to >= rail.length) return [...rail];
    const next = [...rail];
    [next[at], next[to]] = [next[to], next[at]];
    return next;
}

/**
 * The `rail:` list as the config writes it, every entry as three strings whether or not the rule
 * keeps it, so the Settings view lists an entry a hand edit broke for the reader to mend.
 */
export function configRail(config: Record<string, unknown> | undefined): RailEntry[] {
    return railRows(config?.rail) ?? [];
}

/**
 * The sentence for a rail write the server refused, from the error it answered: the file could not
 * be written, or the list was not one the rule keeps. The Settings view and the rail say the same.
 */
export function railRefusal(error: string | undefined): string {
    const reason =
        error === 'unwritable' ? t('workbench.rail_unwritable') : t('workbench.rail_invalid');
    return t('workbench.rail_refused', reason);
}
