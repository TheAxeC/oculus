// Layer 2, client state. The lines the ticker is made of, and the builders that make them: the
// shape of a line, the follow-ups that are due, the pending lines of one checklist and what a line
// carries of the people it names. The lines of a checklist are read by the one reader of
// data/shapes/shapes.ts (`subtasks`), so the board and a card read a line alike, and a line's
// people by its `peopleOfLine`. The projects' and entries' lines are built in ticker.ts out of
// these builders. A subtask's line is drawn with the glyph the word `focus.command.glyph_subtask`
// names, as ticker.ts draws an overdue line and a follow-up with the glyphs of
// `focus.command.glyph_overdue` and `focus.command.glyph_followup`, and a dated line of a category
// with its word's glyph (`ticker_categories`).

import type { Followup, Id, LinePeople, Rooted, Subtask } from '../../../data/model/index.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import { peopleOfLine } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { snoozed } from '../focus.ts';
import { daysUntil } from './index.ts';

/**
 * What a ticker line's buttons act on, and nothing about what they say. A view derives the buttons
 * from the shape: a `manifest` or an `entry` is snoozed, an `entry` carrying `statuses` also gets
 * its lifecycle buttons, a line carrying a `subtask` key is ticked, reopened, snoozed or deleted, a
 * `followup` note is marked done or taken out of its list, a snoozed line is woken, and a `lead`
 * and a `venue` carry none: a lead's line opens the Leads view, where its actions are, and a
 * venue's call opens the Venues view.
 *
 * Keeping the words out is what lets one view draw every group: the buttons are the write path's
 * vocabulary and the sentences are the text catalogs', and neither of them is here.
 */
export type TickerTarget = {
    kind: 'manifest' | 'entry' | 'funding' | 'venue' | 'lead' | 'followup';
    /** The project id, the entry id, the scheme id, the venue id, or the lead's own title. */
    id: string;
    /**
     * The key, in the record's own hub, of the collection an `entry` target sits in, of the funding
     * collection a `funding` target's scheme sits in, and of the collection a `followup` note's
     * holder sits in when the holder is no project.
     */
    collection?: string;
    /** Set on an entry of the collection flagged `tasks`, whose line is a task an agent takes. */
    task?: true;
    /** The key of the subtask line, for a line that is one. */
    subtask?: string;
    /** The key of the follow-up note, for a `followup` line. */
    note?: string;
    /**
     * The lifecycle values of the entry's own collection, minus none; the view drops the current.
     */
    statuses?: string[];
};

/**
 * One line of the ticker. `kind` says what it is, which the view turns into words; `days` is whole
 * days to the date, negative when it has passed and null when the line carries no date. At most one
 * of `id` (a project) and `entry` (the collection key of an entry) is set, and a line with neither
 * is not something the board can open.
 */
export type TickerItem = {
    kind: string;
    glyph: string;
    label: string;
    days: number | null;
    id?: Id;
    entry?: string;
    /** What this line's buttons write, and nothing when the line carries none. */
    target?: TickerTarget;
    /** The status the entry of an `entry` target carries now, so the view can drop that button. */
    status?: string;
    /**
     * The `do` text of a subtask line, which its label joins to the parent's name. A reference to
     * the line carries it, so a list whose items shifted names no task.
     */
    subtaskDo?: string;
    /**
     * The conference a paper's deadline is aimed at, folded into the paper's own line so the call
     * is not listed twice. It is a name, and the view joins it to the label with the arrow glyph;
     * building that sentence here would put words in a module that holds none.
     */
    venue?: string;
    /**
     * Whole months to a conference call whose exact date is not out yet, which is the one line that
     * counts in months rather than days. It is set only on such a line, and `days` is then null.
     */
    months?: number;
    /** The name of the hub the line's record is of, absent for a record of no hub. */
    root?: string;
    /**
     * The people a subtask or follow-up line names, by key in each field, which Mine only and the
     * Role list read in place of the record's people; absent when the line names nobody.
     */
    people?: LinePeople;
    /** The names of those people as one text, which the row draws after its label. */
    names?: string;
    snoozed: boolean;
};

/**
 * The mark of a line of a record: the name of its hub, which the line's chip draws when the hub is
 * not the one in view (views/shared/card/RootChip.svelte), and nothing for a record of no hub.
 */
export function rootMark(record: Rooted): Partial<TickerItem> {
    const root = rootOf(record);
    return root === '' ? {} : { root };
}

/** One ticker line. */
export function item(
    kind: string,
    glyph: string,
    label: string,
    days: number | null,
    over: Partial<TickerItem> = {}
): TickerItem {
    return { kind, glyph, label, days, snoozed: false, ...over };
}

/**
 * The follow-ups of one holder that are due: not done, with no `after:` or an `after:` that has
 * passed. A done note leaves the board, as a done subtask line does.
 */
export function dueFollowups(
    notes: Followup[],
    now: number
): { note: Followup; days: number | null }[] {
    const out: { note: Followup; days: number | null }[] = [];
    for (const note of notes) {
        if (note.done) continue;
        const after = note.after ?? '';
        if (after === '') {
            out.push({ note, days: null });
            continue;
        }
        const days = daysUntil(after, now);
        if (days !== null && days > 0) continue;
        out.push({ note, days });
    }
    return out;
}

/**
 * What a ticker line of a dated line carries of the people it names: their keys by field, and the
 * words of their names (state/boards/person.ts `lineNames`) joined by the catalog's separator. A
 * line that names nobody carries neither.
 */
export function peopleMark(line: LinePeople, names: readonly string[]): Partial<TickerItem> {
    const people = peopleOfLine(line);
    if (Object.keys(people).length === 0) return {};
    return { people, names: names.join(t('project.card.line_people_join')) };
}

/**
 * The pending lines of one checklist, each carrying its parent's `kind` as its grouping word and
 * what `marked` gives it of the people the line names.
 */
export function subtaskLines(
    rows: Subtask[],
    parent: string,
    kind: string,
    now: number,
    over: Partial<TickerItem>,
    target: TickerTarget,
    marked: (row: Subtask) => Partial<TickerItem>
): TickerItem[] {
    const out: TickerItem[] = [];
    for (const row of rows) {
        if (row.done) continue;
        const days = daysUntil(row.deadline ?? '', now);
        const line = item(kind, t('focus.command.glyph_subtask'), `${parent}: ${row.do}`, days, {
            ...over,
            ...marked(row),
            subtaskDo: row.do,
            target: { ...target, subtask: row.key }
        });
        out.push(snoozed(row.snooze, now) ? { ...line, snoozed: true } : line);
    }
    return out;
}
