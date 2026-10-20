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
import { fields, isMap } from '../../../data/helpers/guards.ts';
import { arrangedDocs, withDocs } from './arrangement.ts';
import { readDocs, type DocEntry } from './catalogue.ts';
import { t } from '../../shared/words/text.ts';
import { settingsTyped } from '../../system/config/typed.ts';

export { arrangementKeys, glyphNames, readRail };
export type { RailEntry, RailProblem, RailRead };

/**
 * One rail button and the arrangement its page is made from the first time it is pressed: the
 * arrangement of config/defaults/layout.yml with the hub's documents of the page's group added as
 * tabs, and those documents.
 */
export type RailPage = RailEntry & { node: unknown; docs: DocEntry[] };

/**
 * The rail's pages, in the order `rail:` lists them. An entry the rule refuses is left out, since a
 * button over a page that cannot be made, or drawn with a glyph the vocabulary does not hold, would
 * be a press that does nothing or a blank; the server reports it as a finding. The node is the
 * arrangement of the page's key with the `docs:` entries whose `group` is that key added as `doc`
 * tabs (state/workbench/navigation/arrangement.ts `withDocs`); its shape is read when the page is
 * made.
 */
export function railPages(config: Record<string, unknown> | undefined): RailPage[] {
    if (config === undefined) return [];
    const arrangements = fields(config.arrangements);
    const read = readRail(config.rail, arrangementKeys(arrangements), glyphNames(config));
    const listed = readDocs(config.docs);
    return read.entries.map((entry) => {
        const docs = listed.filter((one) => one.group === entry.page);
        return { ...entry, node: withDocs(arrangements[entry.page], docs), docs };
    });
}

/**
 * The documents the catalogue lists and a chord counts after the views: those of oculus's own
 * folder the rail pages' arrangements show as tabs, then the `docs:` entries.
 */
export function chordDocs(config: Record<string, unknown> | undefined): DocEntry[] {
    return [
        ...railPages(config).flatMap((one) => arrangedDocs(one.page, one.node)),
        ...readDocs(config?.docs)
    ];
}

/** The view the rail list is edited in, whose instance state holds the list being typed. */
export const SETTINGS_VIEW = 'settings';

/** The view that manages the workbenches, which the rail's Workbenches menu shows. */
export const WORKBENCHES_VIEW = 'workbenches';

/**
 * The rail list a Settings tab is editing, or null when it edits nothing and shows the list the
 * config holds. It is kept in the tab's own state, so it is there again after the tab is switched
 * away from and after a reload, as every form's typing is.
 */
export function railDraft(state: unknown): RailEntry[] | null {
    return isMap(state) ? railRows(state.rail) : null;
}

/** A Settings tab's state with the list being typed set, or taken away when it is null. */
export function withRailDraft(state: unknown, rail: RailEntry[] | null): Record<string, unknown> {
    const held = isMap(state) ? { ...state } : {};
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
                entry.page === right[at].page &&
                entry.chord === right[at].chord &&
                entry.group_glyph === right[at].group_glyph
        )
    );
}

/**
 * Whether a tab holds work no write has taken: a Settings tab whose rail list differs from the one
 * the config holds, or that holds text typed into a field or an editor draft of a list or a family
 * (system/config/typed.ts). A tab of another view holds none.
 */
export function settingsUnsaved(
    view: string | undefined,
    state: unknown,
    config: Record<string, unknown> | undefined
): boolean {
    if (view !== SETTINGS_VIEW) return false;
    const draft = railDraft(state);
    return (draft !== null && !sameRail(draft, configRail(config))) || settingsTyped(state);
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
 * The `rail:` list as the config writes it, every entry as five strings whether or not the rule
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
