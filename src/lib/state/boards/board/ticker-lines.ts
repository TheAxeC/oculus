// Layer 2, client state. The lines the ticker is made of, and the builders that make them: the
// shape of a line, the glyph of each category, the follow-ups that are due and the pending lines of
// one checklist. The projects' and entries' lines are built in ticker.ts out of these builders.

import type { Followup, Id, Rooted } from '../../../data/model/index.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import { z } from 'zod';
import { keyedRowsShape, readAs, wordShape } from '../../../data/shapes/shapes.ts';
import { snoozed } from '../focus.ts';
import { daysUntil } from './index.ts';

/** The glyph each category is drawn with, by the names of config/catalogs/glyphs.yml. */
export const GLYPHS: Record<string, string> = {
    paper: 'paper',
    funding: 'coin',
    event: 'events',
    teaching: 'teaching',
    collab: 'collab',
    task: 'tasks',
    position: 'scout',
    conference: 'conference',
    overdue: 'overdue',
    followup: 'followup',
    subtask: 'pin'
};

/**
 * What a ticker line's buttons act on, and nothing about what they say. A view derives the buttons
 * from the shape: a `manifest` or an `entry` is snoozed, an `entry` carrying `statuses` also gets
 * its lifecycle buttons, a line carrying a `subtask` key is ticked, reopened, snoozed or deleted, a
 * `followup` note is marked done, which takes it out of its list, a snoozed line is woken, and a
 * `lead` carries none: its line opens the Leads view, where its actions are.
 *
 * Keeping the words out is what lets one view draw every group: the buttons are the write path's
 * vocabulary and the sentences are the text catalogs', and neither of them is here.
 */
export type TickerTarget = {
    kind: 'manifest' | 'entry' | 'funding' | 'venue' | 'lead' | 'followup';
    /** The project id, the entry id, the scheme id, the venue id, or the lead's own title. */
    id: string;
    /** The collection an `entry` target sits in. */
    collection?: string;
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

/** The follow-ups of one holder that are due: no `after:`, or an `after:` that has passed. */
export function dueFollowups(
    notes: Followup[],
    now: number
): { note: Followup; days: number | null }[] {
    const out: { note: Followup; days: number | null }[] = [];
    for (const note of notes) {
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

export type SubtaskRow = {
    key: string;
    do: string;
    deadline?: string;
    done: boolean;
    snooze?: string;
};

/** One line of an entry's checklist: a string, or a map with `do`, `deadline`, `done`, `snooze`. */
const subtaskShape = z
    .union([
        z.string().transform((line) => ({ do: line, deadline: '', done: false, snooze: '' })),
        z.object({
            do: wordShape,
            deadline: wordShape,
            done: z.boolean().catch(false),
            snooze: wordShape
        })
    ])
    .refine((line) => line.do.trim() !== '');

/** The `subtasks:` of a collection entry, as a map of lines or a list of them. */
export function subtasksOf(value: unknown): SubtaskRow[] {
    return (readAs(keyedRowsShape, value) ?? []).flatMap(([key, held]) => {
        const line = readAs(subtaskShape, held);
        return line === null ? [] : [{ key, ...line }];
    });
}

/** The pending lines of one checklist, each carrying its parent's `kind` as its grouping word. */
export function subtaskLines(
    rows: SubtaskRow[],
    parent: string,
    kind: string,
    now: number,
    over: Partial<TickerItem>,
    target: TickerTarget
): TickerItem[] {
    const out: TickerItem[] = [];
    for (const row of rows) {
        if (row.done) continue;
        const days = daysUntil(row.deadline ?? '', now);
        const line = item(kind, GLYPHS.subtask, `${parent}: ${row.do}`, days, {
            ...over,
            subtaskDo: row.do,
            target: { ...target, subtask: row.key }
        });
        out.push(snoozed(row.snooze, now) ? { ...line, snoozed: true } : line);
    }
    return out;
}
