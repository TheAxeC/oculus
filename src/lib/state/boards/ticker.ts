// Layer 2, client state. Deadline, follow-up, subtask and venue-load arithmetic lives here because
// ticker timing changes independently of the Focus board lanes.

import type { Collection, Followup, Id, Project, Snapshot, Venue } from '../../data/model/index.ts';
import { isMap, text as str } from '../../data/helpers/guards.ts';
import { isLeadClosed } from '../../data/accounts/leads.ts';
import { DEADLINE_SOON, daysUntil } from './board/index.ts';
import { entryDate, manifestsBehind, type ManifestBehind } from './focus-lanes.ts';
import {
    deadlineMet,
    entriesOf,
    focusLabel,
    live,
    setting,
    settled,
    snoozed,
    statusFlag,
    terminal,
    venueLabel,
    type Tally
} from './focus.ts';

/**
 * The deadline categories, in the order the ticker groups them. They are different jobs: your own
 * paper's submission date is not a conference's open call, and neither is a grant deadline.
 */
export const CATEGORIES = [
    'paper',
    'funding',
    'event',
    'teaching',
    'position',
    'collab',
    'task',
    'conference'
];

/** The glyph each category is drawn with, by the names of config/catalogs/glyphs.yml. */
const GLYPHS: Record<string, string> = {
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

/** Which collection each category of entry comes from, for the tab a click on it opens. */
const COLLECTIONS: Record<string, string> = {
    funding: 'funding',
    event: 'events',
    teaching: 'education',
    collab: 'joint-work',
    task: 'tasks',
    position: 'applications'
};

/** The categories read out of a collection, and the collection each is read from. */
const ENTRY_CATEGORIES = ['event', 'teaching', 'task', 'position', 'collab'];

/**
 * One line of the ticker. `kind` says what it is, which the view turns into words; `days` is whole
 * days to the date, negative when it has passed and null when the line carries no date. Exactly one
 * of `id` (a project) and `entry` (the collection key of an entry) is set, and a line with neither
 * is not something the board can open.
 */
/**
 * What a ticker line's buttons act on, and nothing about what they say. A view derives the buttons
 * from the shape: a `manifest` or an `entry` is snoozed, an `entry` carrying `statuses` also gets
 * its lifecycle buttons, a line carrying a `subtask` key is ticked, reopened, snoozed or deleted, a
 * `followup` is cleared, a snoozed line is woken, and a `lead` carries none: its line opens the
 * Leads view, where its actions are.
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
    /**
     * The lifecycle values of the entry's own collection, minus none; the view drops the current.
     */
    statuses?: string[];
};

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
    snoozed: boolean;
};

/**
 * What the ticker answers. Each list is already in the order it is shown in. A line that carries a
 * date is on one of the dated lists and a line that carries none is on `tasks`, which is the split
 * the board draws: the command center is what is dated, the tasks section is what is open work.
 */
export type Ticker = {
    overdue: TickerItem[];
    deadlines: TickerItem[];
    /** The due follow-up notes that carry a date, oldest due first. */
    followups: TickerItem[];
    /** The open subtasks that carry a deadline, grouped by the kind of what holds them. */
    subtasks: TickerItem[];
    /** The undated work: the follow-ups, then the open subtasks, then the open task entries. */
    tasks: TickerItem[];
    venueLoad: Tally[];
    snoozed: TickerItem[];
    behind: ManifestBehind | null;
};

/** An ISO date a `YYYY-MM-DD` string holds, and the empty string for anything else. */
function isoOf(value: unknown): string {
    const text = str(value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/**
 * The lifecycle values of a collection's own `status` field, out of the file's own `schema:`. It is
 * the file that says what an entry's statuses are, so a collection with no such field offers none
 * and its lines carry no status buttons.
 */
export function collectionStatuses(collection: Collection | undefined): string[] {
    return collection?.schema?.find((field) => field.field === 'status')?.options ?? [];
}

/** One ticker line. */
function item(
    kind: string,
    glyph: string,
    label: string,
    days: number | null,
    over: Partial<TickerItem> = {}
): TickerItem {
    return { kind, glyph, label, days, snoozed: false, ...over };
}

/** The follow-ups of one holder that are due: no `after:`, or an `after:` that has passed. */
function dueFollowups(notes: Followup[], now: number): { note: Followup; days: number | null }[] {
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

/** The whole ticker, in the order the board shows its groups. */
export function ticker(snapshot: Snapshot, config: Record<string, unknown>, now: number): Ticker {
    const horizon = setting(config, 'deadline_horizon_days', 90);
    const months = setting(config, 'conf_horizon_months', 1);
    const warn = setting(config, 'venue_conc_warn', 4);
    const labelMode = config.focus_label_mode;
    const projects = Object.values(snapshot.entities.projects).filter(live);
    const collections = snapshot.entities.collections;

    const overdue: TickerItem[] = [];
    const dated: { category: string; line: TickerItem }[] = [];
    const followups: TickerItem[] = [];
    const subtasks: TickerItem[] = [];
    const openEntries: TickerItem[] = [];
    const asleep: TickerItem[] = [];

    /**
     * A project's own submission deadline: overdue behind it, on the paper group before it. A line
     * that shows folds its conference into itself, so the call is not listed a second time below.
     */
    const folded = new Set<string>();
    for (const project of projects) {
        const days = daysUntil(project.deadline ?? '', now);
        if (days === null || settled(project, config)) continue;
        if (days > horizon) continue;
        const line = item('paper', GLYPHS.paper, focusLabel(project, labelMode), days, {
            id: project.id,
            target: { kind: 'manifest', id: project.id }
        });
        if (snoozed(project.snooze, now)) {
            asleep.push({ ...line, snoozed: true });
            continue;
        }
        if (days < 0) {
            overdue.push({ ...line, glyph: GLYPHS.overdue });
            continue;
        }
        const venue =
            project.venueId === undefined ? undefined : snapshot.entities.venues[project.venueId];
        if (
            venue !== undefined &&
            (venue.deadline !== undefined || venue.deadlineMonth !== undefined)
        ) {
            folded.add(venue.id);
            dated.push({ category: 'paper', line: { ...line, venue: venueLabel(venue) } });
            continue;
        }
        dated.push({ category: 'paper', line });
    }

    /**
     * A grant still waiting to be written. A submitted one has met its date and stops nagging. The
     * schemes are a registry entity rather than a collection (normalise leaves the collection out,
     * since the registry already carries the file), so there is no collection tab to open and a
     * funding line is read rather than clicked until the Funding view exists.
     */
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        if (terminal(config, status) || deadlineMet(config, status)) continue;
        const days = daysUntil(isoOf(scheme.deadline), now);
        if (days === null || days > horizon) continue;
        const line = item('funding', GLYPHS.funding, scheme.title, days, {
            target: { kind: 'funding', id: scheme.id }
        });
        if (snoozed(scheme.snooze, now)) {
            asleep.push({ ...line, snoozed: true });
            continue;
        }
        if (days < 0) overdue.push({ ...line, glyph: GLYPHS.overdue });
        else dated.push({ category: 'funding', line });
    }

    /** Talks, teaching, tasks, positions and joint work: one rule over five files. */
    for (const category of ENTRY_CATEGORIES) {
        const key = COLLECTIONS[category];
        const statuses = collectionStatuses(collections[key]);
        for (const entry of entriesOf(collections, key)) {
            const status = str(entry.fields.status);
            if (terminal(config, status) || deadlineMet(config, status)) continue;
            const days = daysUntil(entryDate(entry), now);
            // An undated entry of the tasks file is open work rather than a date, so it is a task
            // line; an undated entry of any other file names no moment and is on no list at all.
            if (days === null && category !== 'task') continue;
            if (days !== null && days > horizon) continue;
            const line = item(category, GLYPHS[category], entry.title, days, {
                entry: key,
                status,
                target: { kind: 'entry', id: entry.id, collection: key, statuses }
            });
            if (snoozed(entry.fields.snooze, now)) {
                asleep.push({ ...line, snoozed: true });
                continue;
            }
            if (days === null) openEntries.push(line);
            else if (days < 0) overdue.push({ ...line, glyph: GLYPHS.overdue });
            else if (CATEGORIES.includes(category)) dated.push({ category, line });
        }
    }

    /**
     * The position scout's live leads. They move fast, so they have a window of their own rather
     * than the ninety-day planning horizon, and they sit in the same group as the applications the
     * entry loop above found: both are positions. A closed status is left out here as well as where
     * the snapshot is built, so the line the reader sees never outlives the lead's own status.
     */
    const leadsWindow = setting(config, 'leads_horizon_days', 21);
    for (const lead of snapshot.entities.feeds.leads ?? []) {
        if (isLeadClosed(lead.status)) continue;
        const days = daysUntil(lead.deadline ?? '', now);
        if (days === null || days < 0 || days > leadsWindow) continue;
        dated.push({
            category: 'position',
            line: item('position', GLYPHS.position, lead.title, days, {
                target: { kind: 'lead', id: lead.title }
            })
        });
    }

    /** A conference's open call, by its exact date or, with none, by its usual month. */
    for (const venue of Object.values(snapshot.entities.venues)) {
        if (folded.has(venue.id)) continue;
        const days = daysUntil(venue.deadline ?? '', now);
        if (days !== null) {
            if (days < 0 || days > horizon) continue;
            dated.push({
                category: 'conference',
                line: item('conference', GLYPHS.conference, venueLabel(venue), days)
            });
            continue;
        }
        const ahead = monthsAhead(venue.deadlineMonth ?? '', now);
        if (ahead === null || ahead > months) continue;
        dated.push({
            category: 'conference',
            line: item('conference', GLYPHS.conference, venueLabel(venue), null, { months: ahead })
        });
    }

    /** Follow-ups: a project's, then every collection entry's, oldest due first. */
    const notes: { days: number | null; line: TickerItem }[] = [];
    for (const project of Object.values(snapshot.entities.projects)) {
        for (const { note, days } of dueFollowups(project.followups, now)) {
            notes.push({
                days,
                line: item(
                    'followup',
                    GLYPHS.followup,
                    `${focusLabel(project, labelMode)} - ${note.do}`,
                    days,
                    {
                        id: project.id,
                        target: { kind: 'followup', id: project.id }
                    }
                )
            });
        }
    }
    for (const scheme of Object.values(snapshot.entities.funding)) {
        if (terminal(config, scheme.status ?? '')) continue;
        for (const { note, days } of dueFollowups(scheme.followups, now)) {
            notes.push({
                days,
                line: item('followup', GLYPHS.followup, `${scheme.title} - ${note.do}`, days)
            });
        }
    }
    for (const [key, collection] of Object.entries(collections)) {
        for (const entry of collection.entries) {
            if (terminal(config, str(entry.fields.status))) continue;
            const held = followupsOf(entry.fields.followup);
            for (const { note, days } of dueFollowups(held, now)) {
                notes.push({
                    days,
                    line: item('followup', GLYPHS.followup, `${entry.title} - ${note.do}`, days, {
                        entry: key,
                        target: { kind: 'followup', id: entry.id, collection: key }
                    })
                });
            }
        }
    }
    notes.sort((a, b) => (a.days ?? 1) - (b.days ?? 1));
    followups.push(...notes.filter((one) => one.days !== null).map((one) => one.line));
    const openNotes = notes.filter((one) => one.days === null).map((one) => one.line);

    /**
     * Subtasks: a project's, and an entry's unless its parent is genuinely closed. A manifest names
     * no `kind:`, so a project's lines group under the empty kind and an entry's under its own.
     */
    for (const project of Object.values(snapshot.entities.projects)) {
        for (const line of subtaskLines(
            project.subtasks,
            focusLabel(project, labelMode),
            '',
            now,
            { id: project.id },
            { kind: 'manifest', id: project.id }
        )) {
            if (line.snoozed) asleep.push(line);
            else subtasks.push(line);
        }
    }
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        if (terminal(config, status) && !statusFlag(config, status, 'live_subtasks')) continue;
        for (const line of subtaskLines(
            scheme.subtasks,
            scheme.title,
            'funding',
            now,
            {},
            {
                kind: 'funding',
                id: scheme.id
            }
        )) {
            if (line.snoozed) asleep.push(line);
            else subtasks.push(line);
        }
    }
    for (const [key, collection] of Object.entries(collections)) {
        for (const entry of collection.entries) {
            const status = str(entry.fields.status);
            if (terminal(config, status) && !statusFlag(config, status, 'live_subtasks')) continue;
            for (const line of subtaskLines(
                subtasksOf(entry.fields.subtasks),
                entry.title,
                str(entry.fields.kind),
                now,
                { entry: key },
                { kind: 'entry', id: entry.id, collection: key }
            )) {
                if (line.snoozed) asleep.push(line);
                else subtasks.push(line);
            }
        }
    }
    subtasks.sort(
        (a, b) =>
            (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0) ||
            (a.days ?? Number.MAX_SAFE_INTEGER) - (b.days ?? Number.MAX_SAFE_INTEGER)
    );

    overdue.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    dated.sort(
        (one, two) =>
            CATEGORIES.indexOf(one.category) - CATEGORIES.indexOf(two.category) ||
            (one.line.days ?? Number.MAX_SAFE_INTEGER) - (two.line.days ?? Number.MAX_SAFE_INTEGER)
    );

    return {
        overdue,
        deadlines: dated.map((one) => one.line),
        followups,
        subtasks: subtasks.filter((one) => one.days !== null),
        tasks: [...openNotes, ...subtasks.filter((one) => one.days === null), ...openEntries],
        venueLoad: venueLoad(projects, snapshot.entities.venues, warn),
        snoozed: asleep,
        behind: manifestsBehind(projects, config)
    };
}

/**
 * Whole months from now to the next occurrence of a month name ("Sep"), and null when the string
 * names no month. Nought is this month, one is the next, and a month already behind rolls round.
 */
export function monthsAhead(month: string, now: number): number | null {
    const names = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec'
    ];
    const at = names.indexOf(month.trim().slice(0, 3).toLowerCase());
    if (at < 0) return null;
    return (at - new Date(now).getMonth() + 12) % 12;
}

/** The `followup:` of a collection entry, in the three shapes a file may write it in. */
function followupsOf(value: unknown): Followup[] {
    const items = Array.isArray(value) ? value : [value];
    const out: Followup[] = [];
    for (const held of items) {
        const text = typeof held === 'string' ? held : isMap(held) ? str(held.do) : '';
        if (text.trim() === '') continue;
        const after = isMap(held) ? str(held.after) : '';
        out.push(after === '' ? { do: text } : { do: text, after });
    }
    return out;
}

/** The `subtasks:` of a collection entry, as a map of lines or a list of them. */
function subtasksOf(value: unknown): {
    key: string;
    do: string;
    deadline?: string;
    done: boolean;
    snooze?: string;
}[] {
    const rows: [string, unknown][] = Array.isArray(value)
        ? value.map((held, at) => [String(at), held])
        : isMap(value)
          ? Object.entries(value)
          : [];
    const out = [];
    for (const [key, held] of rows) {
        const text = typeof held === 'string' ? held : isMap(held) ? str(held.do) : '';
        if (text.trim() === '') continue;
        out.push({
            key,
            do: text,
            deadline: isMap(held) ? str(held.deadline) : '',
            done: isMap(held) && held.done === true,
            snooze: isMap(held) ? str(held.snooze) : ''
        });
    }
    return out;
}

/** The pending lines of one checklist, each carrying its parent's `kind` as its grouping word. */
function subtaskLines(
    rows: { key: string; do: string; deadline?: string; done: boolean; snooze?: string }[],
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
            target: { ...target, subtask: row.key }
        });
        out.push(snoozed(row.snooze, now) ? { ...line, snoozed: true } : line);
    }
    return out;
}

/** The venues carrying too many in-flight papers, most-loaded first. */
export function venueLoad(projects: Project[], venues: Record<Id, Venue>, warn: number): Tally[] {
    const counts: Record<string, number> = {};
    for (const project of projects) {
        const id = project.venueId;
        if (id === undefined || id === '') continue;
        counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
        .map(([id, count]) => ({
            id,
            label: venueLabel(venues[id]) === '' ? id : venueLabel(venues[id]),
            count
        }))
        .filter((one) => one.count >= warn)
        .sort(
            (a, b) =>
                b.count - a.count ||
                (a.label < b.label ? -1 : a.label > b.label ? 1 : a.id < b.id ? -1 : 1)
        );
}

/** The tone a number of days is drawn in: past is red, inside the fortnight amber, else none. */
export function daysTone(days: number | null): string | undefined {
    if (days === null) return undefined;
    if (days < 0) return 'red';
    return days <= DEADLINE_SOON ? 'amber' : undefined;
}

/** The lines in runs of one kind each, in the order given: a kind met again opens a new run. */
export function runsByKind(lines: TickerItem[]): { kind: string; lines: TickerItem[] }[] {
    const runs: { kind: string; lines: TickerItem[] }[] = [];
    for (const line of lines) {
        const held = runs.at(-1);
        if (held?.kind !== line.kind) runs.push({ kind: line.kind, lines: [line] });
        else held.lines.push(line);
    }
    return runs;
}

/** The deadlines under each category, in the categories' order, a category with none left out. */
export function deadlinesByCategory<C extends string>(
    deadlines: TickerItem[],
    categories: readonly C[]
): { category: C; lines: TickerItem[] }[] {
    return categories
        .map((category) => ({
            category,
            lines: deadlines.filter((line) => line.kind === category)
        }))
        .filter((one) => one.lines.length > 0);
}

/** The three groups of the tasks section, each holding its lines in the order given. */
export type TaskGroups = { followups: TickerItem[]; subtasks: TickerItem[]; tasks: TickerItem[] };

/**
 * The tasks section's lines by group: a subtask carries the key of its own line, and a follow-up
 * says so in its kind, which is what a scheme's note has instead of a target; every other line is
 * a task.
 */
export function taskGroups(lines: readonly TickerItem[]): TaskGroups {
    const groups: TaskGroups = { followups: [], subtasks: [], tasks: [] };
    for (const line of lines) {
        if (line.target?.subtask !== undefined) groups.subtasks.push(line);
        else if (line.kind === 'followup') groups.followups.push(line);
        else groups.tasks.push(line);
    }
    return groups;
}

/** Whether any group of the tasks section holds a line. */
export function hasTasks(groups: TaskGroups): boolean {
    return groups.followups.length + groups.subtasks.length + groups.tasks.length > 0;
}

/**
 * The row lists of the command center, each read for how many rows it holds and nothing else, so
 * whatever a view draws a row as is a list here.
 */
export type CommandGroups = Record<
    'overdue' | 'categories' | 'subtaskDated' | 'followups' | 'snoozed' | 'attention' | 'refresh',
    readonly unknown[]
>;

/** Whether the command center has a row, or the line naming the projects behind, to show. */
export function hasCommandRows(
    groups: CommandGroups,
    week: Pick<Ticker, 'behind'> | null
): boolean {
    const rows = Object.values(groups).reduce((sum, rows) => sum + rows.length, 0);
    return rows + (week?.behind === null || week?.behind === undefined ? 0 : 1) > 0;
}
