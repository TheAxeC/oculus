// Layer 2, client state. The Focus board's arithmetic: the lanes, what sits on each of them, the
// "This week" ticker, the awaiting-a-response strip and the band of non-project work. Every
// function is pure over the snapshot, the merged config and a `now` the caller passes, so the whole
// board can be checked without a DOM and two calls with the same three arguments agree.
//
// No words live here. An item carries what it is (`kind`), the glyph it is drawn with and the
// number of days, and the view turns that into a sentence through config/text.yml; a colour is a
// tone through tones.ts, never a hex. That is what keeps the vocabulary in config and this file
// free of both.

import type { Collection, Entry, Followup, Id, Project, Snapshot, Venue } from '../data/model.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the three model types
// the Focus view names reach it from here, beside the functions that take and return them.
export type { Id, Project, Venue } from '../data/model.ts';
import { DEADLINE_SOON, daysUntil } from './board.ts';
import { UNKNOWN_TONE, toneOf } from './tones.ts';

/** The clusters of `focus_lanes`, top to bottom: your move, then on others, then idea to project. */
export const CLUSTERS = ['now', 'parked', 'incubate'];

/**
 * The deadline categories, in the order the ticker groups them. They are different jobs: your own
 * paper's submission date is not a conference's open call, and neither is a grant deadline.
 */
export const CATEGORIES = ['paper', 'funding', 'event', 'teaching', 'collab', 'task', 'conference'];

/** The glyph each category is drawn with, by the names of config/glyphs.yml. */
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
    collab: 'collaborations',
    task: 'tasks',
    position: 'applications'
};

/** The categories read out of a collection, and the collection each is read from. */
const ENTRY_CATEGORIES = ['event', 'teaching', 'task', 'position', 'collab'];

/** One lane of the board: what `focus:` value it holds, its words, its hue and its cluster. */
export type Lane = {
    key: string;
    label: string;
    sub: string;
    tone: string;
    cluster: string;
};

/** One priority level of `priority_levels`: its manifest value, its words and its flame count. */
export type Priority = {
    key: string;
    label: string;
    flames: number;
};

/**
 * One line of the ticker. `kind` says what it is, which the view turns into words; `days` is whole
 * days to the date, negative when it has passed and null when the line carries no date. Exactly one
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

/** A label with a count: a person waited on, a venue holding papers, a venue carrying too many. */
export type Tally = { label: string; count: number };

/** What the ticker answers. Each list is already in the order it is shown in. */
export type Ticker = {
    overdue: TickerItem[];
    deadlines: TickerItem[];
    followups: TickerItem[];
    subtasks: TickerItem[];
    venueLoad: Tally[];
    snoozed: TickerItem[];
};

/** The awaiting-a-response strip: who you chase, what you wait on, and how much is simply blocked. */
export type Waiting = {
    people: Tally[];
    venues: Tally[];
    blocked: number;
};

/** One card of the band under the lanes. */
export type BandItem = {
    title: string;
    /**
     * The collection key, so a click opens the file's own tab. A funding scheme has none: the
     * registry already carries the file, so no collection view is registered over it.
     */
    entry?: string;
    days: number | null;
};

/** One stage stacked inside the funding column of the band. */
export type BandStage = {
    label: string;
    tone: string;
    items: BandItem[];
};

/** The band: grant applications by stage, positions out for an answer, teaching this year. */
export type Band = {
    funding: BandStage[];
    applications: BandItem[];
    education: BandItem[];
};

function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function num(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** One flag of a `status_palette` row, over the status as the data writes it. */
function statusFlag(config: Record<string, unknown>, status: string, flag: string): boolean {
    const palette = config.status_palette;
    if (!isMap(palette)) return false;
    const row = palette[status.trim().toLowerCase()];
    return isMap(row) && row[flag] === true;
}

/** Whether a status takes its entry off the deadline radar. */
export function terminal(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'terminal');
}

/** Whether a status is still live but its own deadline is met, so nagging it is noise. */
function deadlineMet(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'deadline_met');
}

/**
 * Whether a project's own deadline has stopped being yours to act on: any chip the palette marks
 * terminal, or marks `deadline_met` (which is what `submitted` carries). Reading the palette is
 * what keeps the rule in config/vocab.yml rather than in a list of chip names here.
 */
function settled(project: Project, config: Record<string, unknown>): boolean {
    return project.chips.some((chip) => terminal(config, chip) || deadlineMet(config, chip));
}

/**
 * Whether a `snooze:` value hides its item now. `true` hides it until it is cleared; an ISO date
 * hides it until that date passes, so it comes back on its own.
 */
export function snoozed(value: unknown, now: number): boolean {
    if (value === true) return true;
    const text = str(value).trim();
    if (text === '') return false;
    if (['true', 'yes', '1'].includes(text.toLowerCase())) return true;
    const days = daysUntil(text, now);
    return days !== null && days > 0;
}

/** A number out of `behavior.yml`, and the fallback that file's comment names when it holds none. */
function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    const held = config[key];
    return typeof held === 'number' && Number.isFinite(held) ? held : fallback;
}

/** The lanes of `focus_lanes`, in the config's order, each hue already a tone. */
export function lanes(config: Record<string, unknown>): Lane[] {
    const rows = config.focus_lanes;
    if (!Array.isArray(rows)) return [];
    const out: Lane[] = [];
    for (const row of rows) {
        if (!isMap(row)) continue;
        const key = str(row.key);
        if (key === '') continue;
        out.push({
            key,
            label: str(row.label) === '' ? key : str(row.label),
            sub: str(row.sub),
            tone: toneOf(str(row.color)),
            cluster: str(row.cluster)
        });
    }
    return out;
}

/** The tone of the ideas backlog, the `holding_color` of vocab.yml. */
export function holdingTone(config: Record<string, unknown>): string {
    const hex = str(config.holding_color);
    return hex === '' ? UNKNOWN_TONE : toneOf(hex);
}

/** The priority levels of `priority_levels`, in the config's order. */
export function priorities(config: Record<string, unknown>): Priority[] {
    const rows = config.priority_levels;
    if (!Array.isArray(rows)) return [];
    const out: Priority[] = [];
    for (const row of rows) {
        if (!isMap(row)) continue;
        const key = str(row.key);
        if (key === '') continue;
        out.push({
            key,
            label: str(row.label) === '' ? key : str(row.label),
            flames: num(row.flames)
        });
    }
    return out;
}

/** How many flames a project's `priority:` draws, and none for a project carrying no priority. */
export function flamesOf(project: Project, config: Record<string, unknown>): number {
    const held = project.priority;
    if (held === undefined) return 0;
    return priorities(config).find((level) => level.key === held)?.flames ?? 0;
}

/** A project sorts inside its lane by its deadline, and by its title when it has none. */
function laneOrder(a: Project, b: Project): number {
    const one = a.deadline ?? '';
    const two = b.deadline ?? '';
    if (one !== '' && two !== '') return one < two ? -1 : one > two ? 1 : 0;
    if (one !== '') return -1;
    if (two !== '') return 1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

/** Everything the board speaks for: the three live tiers, which is the archive's complement. */
function live(project: Project): boolean {
    return ['ideas', 'active', 'manuscripts'].includes(project.tier);
}

/** The tiers that belong on a lane rather than in the ideas backlog. */
function onBoard(project: Project): boolean {
    return project.tier === 'active' || project.tier === 'manuscripts';
}

/**
 * What sits on each lane, by lane key, sorted deadline first then title. `holding` is not a lane
 * and neither is a `focus:` no lane names; both are the backlog.
 */
export function laneItems(projects: Project[], all: Lane[]): Record<string, Project[]> {
    const out: Record<string, Project[]> = {};
    for (const lane of all) out[lane.key] = [];
    for (const project of projects) {
        if (!live(project)) continue;
        const key = project.focus ?? '';
        if (out[key] === undefined) continue;
        out[key].push(project);
    }
    for (const key of Object.keys(out)) out[key].sort(laneOrder);
    return out;
}

/**
 * The ideas backlog: anything parked in `holding`, and any idea whose `focus:` names no lane, which
 * covers an idea that has none at all.
 */
export function backlog(projects: Project[], all: Lane[]): Project[] {
    const keys = all.map((lane) => lane.key);
    const out = projects.filter((project) => {
        if (!live(project)) return false;
        const focus = project.focus ?? '';
        if (focus === 'holding') return true;
        return project.type === 'idea' && !keys.includes(focus);
    });
    return out.sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
}

/** Projects that belong on a lane and name none, so the board is not showing them. */
export function unplaced(projects: Project[]): Project[] {
    return projects.filter((project) => onBoard(project) && (project.focus ?? '') === '');
}

/** A tally sorted the way the strip reads it: the biggest first, then alphabetically. */
function tallies(counts: Record<string, number>): Tally[] {
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));
}

/** A venue's short name, and its full name when the registry gives it no short one. */
function venueLabel(venue: Venue | undefined): string {
    if (venue === undefined) return '';
    const short = venue.short ?? '';
    return short === '' ? venue.name : short;
}

/**
 * The awaiting-a-response strip. The precedence is one per project: the people named in
 * `waiting-on:` first, then the venue holding it when it is `submitted`, then a bare `blocked`.
 * A person is a collaborations key resolved to that entry's name, or a free name as written.
 */
export function waiting(
    projects: Project[],
    venues: Record<Id, Venue>,
    collaborators: Record<Id, string>
): Waiting {
    const people: Record<string, number> = {};
    const held: Record<string, number> = {};
    let blocked = 0;
    for (const project of projects) {
        if (!live(project)) continue;
        if (project.waitingOn.length > 0) {
            for (const key of project.waitingOn) {
                const name = collaborators[key] ?? key;
                people[name] = (people[name] ?? 0) + 1;
            }
            continue;
        }
        if (project.chips.includes('submitted')) {
            const venue = project.venueId === undefined ? undefined : venues[project.venueId];
            const name = venueLabel(venue);
            held[name] = (held[name] ?? 0) + 1;
            continue;
        }
        if (project.chips.includes('blocked')) blocked += 1;
    }
    return { people: tallies(people), venues: tallies(held), blocked };
}

/** An ISO date a `YYYY-MM-DD` string holds, and the empty string for anything else. */
function isoOf(value: unknown): string {
    const text = str(value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/**
 * The date a collection entry counts down to: its own `deadline:`, and its `date:` when that is a
 * whole day. A year-only `date:` is not a date and never triggers.
 */
function entryDate(entry: Entry): string {
    const deadline = isoOf(entry.fields.deadline);
    return deadline === '' ? isoOf(entry.fields.date) : deadline;
}

/** The entries of one collection of the snapshot, and none when it holds no such file. */
function entriesOf(collections: Record<Id, Collection>, key: string): Entry[] {
    return collections[key]?.entries ?? [];
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

/** The label a card and a ticker line carry: the short handle whenever the manifest has one. */
export function labelOf(project: Project): string {
    const short = project.short ?? '';
    return short === '' ? project.title : short;
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
    const projects = Object.values(snapshot.entities.projects).filter(live);
    const collections = snapshot.entities.collections;

    const overdue: TickerItem[] = [];
    const dated: { category: string; line: TickerItem }[] = [];
    const followups: TickerItem[] = [];
    const subtasks: TickerItem[] = [];
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
        const line = item('paper', GLYPHS.paper, labelOf(project), days, { id: project.id });
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
        const line = item('funding', GLYPHS.funding, scheme.title, days);
        if (snoozed(scheme.snooze, now)) {
            asleep.push({ ...line, snoozed: true });
            continue;
        }
        if (days < 0) overdue.push({ ...line, glyph: GLYPHS.overdue });
        else dated.push({ category: 'funding', line });
    }

    /** Talks, teaching, tasks, positions and collaborations: one rule over five files. */
    for (const category of ENTRY_CATEGORIES) {
        const key = COLLECTIONS[category];
        for (const entry of entriesOf(collections, key)) {
            const status = str(entry.fields.status);
            if (terminal(config, status) || deadlineMet(config, status)) continue;
            const days = daysUntil(entryDate(entry), now);
            if (days === null || days > horizon) continue;
            const line = item(category, GLYPHS[category], entry.title, days, { entry: key });
            if (snoozed(entry.fields.snooze, now)) {
                asleep.push({ ...line, snoozed: true });
                continue;
            }
            if (days < 0) overdue.push({ ...line, glyph: GLYPHS.overdue });
            else if (CATEGORIES.includes(category)) dated.push({ category, line });
        }
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
                line: item('followup', GLYPHS.followup, `${labelOf(project)} - ${note.do}`, days, {
                    id: project.id
                })
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
                        entry: key
                    })
                });
            }
        }
    }
    notes.sort((a, b) => (a.days ?? 1) - (b.days ?? 1));
    followups.push(...notes.map((one) => one.line));

    /**
     * Subtasks: a project's, and an entry's unless its parent is genuinely closed. A manifest names
     * no `kind:`, so a project's lines group under the empty kind and an entry's under its own.
     */
    for (const project of Object.values(snapshot.entities.projects)) {
        for (const line of subtaskLines(project.subtasks, labelOf(project), '', now, {
            id: project.id
        })) {
            if (line.snoozed) asleep.push(line);
            else subtasks.push(line);
        }
    }
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        if (terminal(config, status) && !statusFlag(config, status, 'live_subtasks')) continue;
        for (const line of subtaskLines(scheme.subtasks, scheme.title, 'funding', now, {})) {
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
                { entry: key }
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
        subtasks,
        venueLoad: venueLoad(projects, snapshot.entities.venues, warn),
        snoozed: asleep
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
    over: Partial<TickerItem>
): TickerItem[] {
    const out: TickerItem[] = [];
    for (const row of rows) {
        if (row.done) continue;
        const days = daysUntil(row.deadline ?? '', now);
        const line = item(kind, GLYPHS.subtask, `${parent}: ${row.do}`, days, over);
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
        const name = venueLabel(venues[id]) === '' ? id : venueLabel(venues[id]);
        counts[name] = (counts[name] ?? 0) + 1;
    }
    return tallies(counts).filter((one) => one.count >= warn);
}

/** The stages of `fund_stages`, and the statuses each one gathers. */
function fundStages(
    config: Record<string, unknown>
): { label: string; tone: string; statuses: string[] }[] {
    const rows = config.fund_stages;
    if (!Array.isArray(rows)) return [];
    const out: { label: string; tone: string; statuses: string[] }[] = [];
    for (const row of rows) {
        if (!isMap(row)) continue;
        const statuses = Array.isArray(row.statuses)
            ? row.statuses.filter((one): one is string => typeof one === 'string')
            : [];
        out.push({
            label: str(row.label),
            tone: toneOf(str(row.color)),
            statuses: statuses.map((one) => one.toLowerCase())
        });
    }
    return out;
}

/** A band card sorts by its date, and by its title when it has none. */
function bandOrder(a: BandItem, b: BandItem): number {
    if (a.days !== null && b.days !== null) return a.days - b.days;
    if (a.days !== null) return -1;
    if (b.days !== null) return 1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

function bandItem(entry: Entry, key: string, now: number): BandItem {
    return { title: entry.title, entry: key, days: daysUntil(entryDate(entry), now) };
}

/**
 * The band under the lanes: the durable work that is not a project. Grants stack by the stage their
 * status names, positions are the applications still out for an answer, and teaching is what the
 * education file marks as running this academic year.
 */
export function band(snapshot: Snapshot, config: Record<string, unknown>, now: number): Band {
    const collections = snapshot.entities.collections;
    const grants = Object.values(snapshot.entities.funding);
    const funding: BandStage[] = [];
    for (const stage of fundStages(config)) {
        const items = grants
            .filter((scheme) => stage.statuses.includes((scheme.status ?? '').toLowerCase()))
            .map((scheme) => ({
                title: scheme.title,
                days: daysUntil(isoOf(scheme.deadline), now)
            }))
            .sort(bandOrder);
        if (items.length > 0) funding.push({ label: stage.label, tone: stage.tone, items });
    }
    const applications = entriesOf(collections, 'applications')
        .filter((entry) => {
            const status = str(entry.fields.status);
            return status !== '' && !terminal(config, status);
        })
        .map((entry) => bandItem(entry, 'applications', now))
        .sort(bandOrder);
    const education = entriesOf(collections, 'education')
        .filter((entry) => statusFlag(config, str(entry.fields.status), 'live_subtasks'))
        .map((entry) => bandItem(entry, 'education', now))
        .sort(bandOrder);
    return { funding, applications, education };
}

/** The tone a number of days is drawn in: past is red, inside the fortnight amber, else none. */
export function daysTone(days: number | null): string | undefined {
    if (days === null) return undefined;
    if (days < 0) return 'red';
    return days <= DEADLINE_SOON ? 'amber' : undefined;
}
