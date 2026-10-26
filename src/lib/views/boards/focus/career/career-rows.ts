// Layer 3, view helper of views/boards/focus/career/CareerPanel.svelte. The career banner's groups
// as command-center rows (ui/display/ticker/ticker-rows.ts `TickerRow`): the words of each row, its
// tail, its tone, the buttons it carries under the pointer, and what a press on it opens.
//
// It holds no markup and writes nothing, so the rows are worked out apart from the component that
// draws them. A row of the career file (Next, Goal, a Situation fact, an Order of work task) names
// the section of the file it opens at (state/sessions/source/draft-entry.ts `CareerAt`) and the
// field of the file's schema its Edit opens the editor on. A Track record row names the view it
// opens: a role's row the track record's board, opened for the role with the role's key as its
// `id` and "<role>: track record" as its tab's words, and Funding obtained the Funding view; it
// carries no button, since nothing of it is written in the career file. A row's glyph is its
// group's glyph.
//
// A row id starts `career:` and names what the row is, never its place among the drawn rows, so a
// row whose neighbour goes keeps its id: `career:next`, `career:goal`, `career:situation:<label>`,
// `career:order:<n>` (the n-th task of the model's order, from 0), `career:role:<key>` and
// `career:funding`. A label or a key in an id is written URI-encoded.

import type { TickerAction, TickerRow } from '$lib/ui/display/ticker/ticker-rows';
import { linkRuns } from '$lib/ui/html';
import { RECORD_VIEW, daysUntil } from '$lib/state/boards/board';
import { daysLeft, type Career, type TrackRecord } from '$lib/state/boards/career';
import { daysTone } from '$lib/state/boards/ticker';
import type { CareerAt } from '$lib/state/sessions/source/draft-entry';
import { t } from '$lib/state/shared/words/text';

/** The fields of the career file a row of the file stands for, each its key in the file. */
const GOAL = 'goal';
const MILESTONE = 'milestone';
const SITUATION = 'situation';
const ORDER = 'order';

/** The id the Funding obtained row is held under. */
const FUNDING = 'funding';

/** The id of the Edit button of a row of the file. */
export const EDIT = 'edit';

/** How the id of an Open link button starts, the address following it. */
const LINK = 'link:';

/** What a press on a row opens: a section of the career file, or a view. */
type CareerTarget =
    | {
          kind: 'file';
          /** The section the file is opened at. */
          at: CareerAt;
          /** The words a sentence names the section by when the file does not hold it. */
          label: string;
          /** The field of the file's schema the row's Edit opens the editor on. */
          field: string;
      }
    | {
          kind: 'view';
          view: string;
          /** The state the view is opened with, which names the one tab it is opened for. */
          state?: Record<string, unknown>;
      };

/** One group of the banner: its heading, its rows, and the note line under them, if any. */
type CareerGroup = {
    key: string;
    label: string;
    glyph: string;
    rows: TickerRow[];
    note?: string;
};

/** The groups the banner draws, in order, and what each row opens, by the row's id. */
export type CareerRows = {
    groups: CareerGroup[];
    targets: Record<string, CareerTarget | undefined>;
};

/** What the rows are worked out from. */
export type CareerInput = {
    career: Career;
    /** The moment the milestone's days left are counted from. */
    now: number;
    /** The track record, null when it has nothing to draw. */
    record: TrackRecord | null;
    /** Whether the banner has an editor, which the rows' Edit opens. */
    editable: boolean;
    /**
     * The view the Funding obtained row opens: the funding registry's, under the key the primary
     * hub gives it; the empty text leaves the row plain.
     */
    funding: string;
};

/** The host an address names, as the URL parser gives it, and the address itself for none. */
function hostOf(address: string): string {
    const host = URL.canParse(address) ? new URL(address).host : '';
    return host === '' ? address : host;
}

/**
 * One Open link button per distinct web address the texts hold (`linkRuns` of ui/html.ts), in the
 * order they are written: named by the address's host and titled with the whole address.
 */
function linkActions(...texts: string[]): TickerAction[] {
    const found = texts.flatMap((text) =>
        linkRuns(text).flatMap((run) => (run.href === undefined ? [] : [run.href]))
    );
    return [...new Set(found)].map((address) => ({
        id: `${LINK}${address}`,
        label: hostOf(address),
        title: t('focus.career_open_link', address)
    }));
}

/** The address an Open link button opens, and null for any other button. */
export function linkOf(action: string): string | null {
    return action.startsWith(LINK) ? action.slice(LINK.length) : null;
}

/**
 * The Next row's tail and tone: the milestone's day and the days left to it, `<day>, in 23 days`,
 * toned as the command center tones a deadline (`daysTone`); neither when the file gives no day.
 */
function nextTail(date: string | undefined, now: number): { tail?: string; tone?: string } {
    if (date === undefined) return {};
    const left = daysLeft(date, now);
    if (left === '') return {};
    return { tail: t('focus.career_next_tail', date, left), tone: daysTone(daysUntil(date, now)) };
}

/** What builds the rows and fills the index of what each opens. */
type Builder = {
    targets: Record<string, CareerTarget | undefined>;
    file: (row: TickerRow, target: CareerTarget) => TickerRow;
    view: (row: TickerRow, view: string | undefined, state?: Record<string, unknown>) => TickerRow;
};

/** The rows of the banner, built group by group with the index of what each row opens. */
function builder(input: CareerInput): Builder {
    const targets: Record<string, CareerTarget | undefined> = {};
    const edit: TickerAction[] = input.editable ? [{ id: EDIT, label: t('entry_form.edit') }] : [];
    return {
        targets,
        /** One row of the file: Edit when the banner has an editor, then its Open link buttons. */
        file(row: TickerRow, target: CareerTarget): TickerRow {
            targets[row.id] = target;
            const actions = [...edit, ...linkActions(row.label, row.tail ?? '')];
            return actions.length === 0 ? row : { ...row, actions };
        },
        /** One row that opens a view, with the state given, and plain when it opens none. */
        view(row: TickerRow, view: string | undefined, state?: Record<string, unknown>): TickerRow {
            if (view === undefined) return { ...row, plain: true };
            targets[row.id] =
                state === undefined ? { kind: 'view', view } : { kind: 'view', view, state };
            return row;
        }
    };
}

/** An id of a row: `career:` and its parts, each part URI-encoded. */
function idOf(...parts: string[]): string {
    return ['career', ...parts.map((part) => encodeURIComponent(part))].join(':');
}

/** A section of the file a row opens at, under the words a sentence names it by. */
function inFile(at: CareerAt, label: string, field: string): CareerTarget {
    return { kind: 'file', at, label, field };
}

/** The Next row, the milestone, when the file names one. */
function nextRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const { milestone, milestoneDate } = input.career;
    if (milestone === undefined) return [];
    const row = {
        id: idOf('next'),
        glyph,
        label: milestone,
        ...nextTail(milestoneDate, input.now)
    };
    return [make.file(row, inFile({ key: MILESTONE }, milestone, MILESTONE))];
}

/** The Goal row, when the file names a goal. */
function goalRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const goal = input.career.goal;
    if (goal === undefined) return [];
    return [make.file({ id: idOf(GOAL), glyph, label: goal }, inFile({ key: GOAL }, goal, GOAL))];
}

/**
 * One row per fact of the situation, its label as its words and its value as its tail. A fact with
 * an empty label is drawn plain, since a press on it would name no key of the file.
 */
function factRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    return input.career.situation.map((fact) => {
        const row = make.file(
            { id: idOf(SITUATION, fact.label), glyph, label: fact.label, tail: fact.value },
            inFile({ key: SITUATION, fact: fact.label }, fact.label, SITUATION)
        );
        return fact.label === '' ? { ...row, plain: true } : row;
    });
}

/**
 * One row per task of the order of work, its words the task followed by its note when it has one,
 * its tail its `when`. A row opens at the task's rank among the rows with that task, so two rows
 * with one task each open at their own line.
 */
function orderRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const order = input.career.order;
    return order.map((one, at) => {
        const rank = order.slice(0, at).filter((other) => other.task === one.task).length;
        const note = one.note ?? '';
        const label = note === '' ? one.task : t('focus.career_task_note', one.task, note);
        return make.file(
            { id: idOf(ORDER, String(at)), glyph, label, tail: one.when },
            inFile({ key: ORDER, task: one.task, nth: rank }, one.task, ORDER)
        );
    });
}

/**
 * One row per role of the track record, its tail the count of each record row the role has
 * projects in, `<count> <row label>`, joined by commas; then, when funding is obtained, the row
 * Funding obtained with its count. A role opens the track record's board for the role, one tab
 * per role, which holds the projects its tail counts.
 */
function recordRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const record = input.record;
    if (record === null) return [];
    const roles = record.roles.map((role) => {
        const tail = role.lines
            .filter((line) => line.count > 0)
            .map((line) => t('focus.career_record_count', line.count, line.label))
            .join(', ');
        const row = { id: idOf('role', role.key), glyph, label: role.label, tail };
        const label = t('board.record_title', role.label);
        return make.view(row, RECORD_VIEW, { id: role.key, label });
    });
    if (record.funding === 0) return roles;
    const funding = {
        id: idOf(FUNDING),
        glyph,
        label: t('focus.career_funding_row'),
        tail: String(record.funding)
    };
    return [...roles, make.view(funding, input.funding === '' ? undefined : input.funding)];
}

/**
 * The groups of the banner in order, NEXT, GOAL, SITUATION, ORDER OF WORK and TRACK RECORD, each
 * only when it has a row; the order's own note is the ORDER OF WORK group's note line, when it
 * holds words.
 */
export function careerRows(input: CareerInput): CareerRows {
    const make = builder(input);
    const groups: CareerGroup[] = [];
    const parts: [string, string, string, typeof nextRows][] = [
        ['next', t('focus.next'), t('focus.career_next_glyph'), nextRows],
        [GOAL, t('focus.career_goal'), t('focus.career_goal_glyph'), goalRows],
        [SITUATION, t('focus.career_situation'), t('focus.career_situation_glyph'), factRows],
        [ORDER, t('focus.order_of_work'), t('focus.career_order_glyph'), orderRows],
        ['record', t('focus.career_record'), t('focus.career_record_glyph'), recordRows]
    ];
    for (const [key, label, glyph, rowsOf] of parts) {
        const rows = rowsOf(input, make, glyph);
        if (rows.length > 0) groups.push({ key, label, glyph, rows });
    }
    const note = input.career.orderNote ?? '';
    const order = groups.find((one) => one.key === ORDER);
    if (order !== undefined && note.trim() !== '') order.note = note;
    return { groups, targets: make.targets };
}
