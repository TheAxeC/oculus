// Layer 1, data. The career file out of the map sources/documents/career.ts parsed: the strategy
// (the title, the goal, the next milestone and its day, the order of work and its note) typed, and
// every section as the file holds it in `sections`, which the Career view's editor edits and the
// website's CV is written from (server/content/audit/website/cv.ts). Pure, like normalise: every
// section is optional, the order of work tolerates the plain-string form the file may write, and a
// row without its words is left out.

import { z } from 'zod';
import { ISO_DATE } from '../../helpers/dates.ts';
import { str } from '../../helpers/guards.ts';
import type { Career } from '../../model/index.ts';
import { itemsShape, optionalTextShape, readAs, readOr } from '../../shapes/shapes.ts';
import { compact } from '../compact.ts';
import { fieldsOf } from '../schema/field.ts';

/** A text, which a row of a list may be in place of a map. */
const plainShape = z.string();

/** One numbered row of the order of work as a map: the task and its date and note, if any. */
const orderMapShape = z.object({
    task: optionalTextShape,
    when: optionalTextShape,
    note: optionalTextShape
});

/** One numbered row of the order of work, tolerating the plain-string form the file may write. */
function orderRow(value: unknown): { task: string; when?: string; note?: string } | null {
    const plain = plainShape.safeParse(value);
    if (plain.success) return plain.data.trim() === '' ? null : { task: plain.data };
    const row = readAs(orderMapShape, value);
    if (row?.task === undefined || row.task.trim() === '') return null;
    return compact({ task: row.task, when: row.when, note: row.note });
}

/** The rows of one list of the career file, and no rows for a section that is not a list. */
function rowsOf(value: unknown): unknown[] {
    return readOr(itemsShape, value, []);
}

/** A text of the file that holds words, and nothing for an empty text or anything not a text. */
function filled(value: unknown): string | undefined {
    const text = str(value);
    return text === undefined || text.trim() === '' ? undefined : text;
}

/**
 * The day of the next milestone: `milestone_date:` when it is a day written YYYY-MM-DD and
 * `milestone:` holds a text, and none otherwise, since a day with no milestone names nothing.
 */
function milestoneDate(raw: Record<string, unknown>): string | undefined {
    if (filled(raw.milestone) === undefined) return undefined;
    const date = str(raw.milestone_date);
    return date !== undefined && ISO_DATE.test(date) ? date : undefined;
}

/**
 * The career strategy of the career file. Every section is optional and the order of work
 * tolerates the plain-string form the file is allowed to write, so a half-filled career file draws
 * the half it has.
 */
export function career(raw: Record<string, unknown> | null): Career | null {
    if (raw === null) return null;
    const order: { task: string; when?: string; note?: string }[] = [];
    for (const row of rowsOf(raw.order)) {
        const one = orderRow(row);
        if (one !== null) order.push(one);
    }
    return compact({
        title: str(raw.title) ?? '',
        goal: filled(raw.goal),
        milestone: filled(raw.milestone),
        milestoneDate: milestoneDate(raw),
        order,
        orderNote: str(raw.order_note),
        sections: Object.fromEntries(Object.entries(raw).filter(([name]) => name !== 'schema')),
        schema: fieldsOf(raw.schema)
    });
}
