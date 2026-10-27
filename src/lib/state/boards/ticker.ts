// Layer 2, client state. Deadline, follow-up, subtask and venue-load arithmetic lives here because
// ticker timing changes independently of the Focus board lanes. A record's stage and status are
// read under the words of its own hub when the caller gives them (`wordsOf`). The deadline
// categories are the words of `ticker_categories`, and the collections a dated line comes from
// are those whose `collections:` entry gives a `ticker:`.

import {
    optionKeys,
    type Collection,
    type CollectionEntry,
    type HubVocabs,
    type Id,
    type LinePeople,
    type Project,
    type Rooted,
    type Snapshot,
    type Venue
} from '../../data/model/index.ts';
import { z } from 'zod';
import { byKey, text as str } from '../../data/helpers/guards.ts';
import {
    REGISTRY_VIEWS,
    bareId,
    hubId,
    keyOf,
    registryEntryOf,
    rootOf,
    type RegistryWord
} from '../../data/helpers/hub-names.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import { hasGlyph, hasText, lookup, t } from '../shared/words/text.ts';
import { entryFollowups, entrySubtasks } from './collection/index.ts';
import { lineNames } from './person.ts';
import { hasWord, oneWordWith, type WordsOf } from '../../data/shapes/vocab-keys.ts';
import { isLeadClosed } from '../../data/accounts/leads.ts';
import { DEADLINE_SOON, VENUE_WARN, daysUntil } from './board/index.ts';
import {
    dueFollowups,
    item,
    peopleMark,
    rootMark,
    subtaskLines,
    type TickerItem,
    type TickerTarget
} from './board/ticker-lines.ts';
import {
    entryDate,
    manifestsBehind,
    unplacedRow,
    type ManifestBehind,
    type Unplaced
} from './focus/focus-lanes.ts';
import {
    closesDeadline,
    deadlineMet,
    focusLabel,
    setting,
    settled,
    snoozed,
    statusFlag,
    unplaced,
    venueLabel,
    type Tally
} from './focus.ts';

export { dueFollowups, type TickerItem, type TickerTarget };

/**
 * One deadline category of `ticker_categories` (config/catalogs/vocab.yml): its word, the dotted
 * keys of the text-catalog words its group is headed by (`label`) and a line of an entry or a lead
 * is named by (`noun`, and `overdueNoun` once overdue, the noun when the word names none), and the
 * glyph name its lines are drawn with. A field naming no word of the catalog is absent, and so is a
 * glyph whose word holds no glyph name.
 */
export type TickerCategory = {
    key: string;
    label?: string;
    glyph?: string;
    noun?: string;
    overdueNoun?: string;
};

/** A field of a category word: the dotted key of a text-catalog word, or nothing. */
const wordKey = z.string().optional().catch(undefined);

/** One word of `ticker_categories` as written. */
const categoryShape = z.object({
    label: wordKey,
    glyph: wordKey,
    noun: wordKey,
    overdue_noun: wordKey
});

/**
 * The deadline categories, in the order the ticker groups them: the words of `ticker_categories`
 * of `words`, the union of every hub's words on the Focus board. They are different jobs: your own
 * paper's submission date is not a conference's open call, and neither is a grant deadline.
 */
export function tickerCategories(words: Record<string, unknown>): TickerCategory[] {
    const held = (key: string | undefined): string | undefined =>
        key !== undefined && hasText(key) ? key : undefined;
    return Object.entries(readAs(mapShape, words.ticker_categories) ?? {}).flatMap(([key, row]) => {
        const read = readAs(categoryShape, row);
        if (read === null) return [];
        const glyphWord = held(read.glyph);
        const name = glyphWord === undefined ? '' : lookup(glyphWord);
        const noun = held(read.noun);
        return [
            {
                key,
                label: held(read.label),
                glyph: hasGlyph(name) ? name : undefined,
                noun,
                overdueNoun: held(read.overdue_noun) ?? noun
            }
        ];
    });
}

/** The glyph a line of the category is drawn with, the empty name for a category with none. */
function glyphOf(categories: readonly TickerCategory[], category: string): string {
    return categories.find((one) => one.key === category)?.glyph ?? '';
}

/**
 * How many in-flight papers aimed at one venue make it a venue-load line: `venue_conc_warn` under
 * `focus:`, and `VENUE_WARN` when the config holds no finite number there.
 */
export function venueWarn(config: Record<string, unknown>): number {
    return setting(config, 'venue_conc_warn', VENUE_WARN);
}

/**
 * The hubs' `collections:` lists and oculus's own, by which the ticker finds the entry a hub reads
 * a registry by (`registryEntryOf`): its key, and the `ticker:` its lines carry.
 */
export type TickerLists = Pick<HubVocabs, 'lists' | 'ownCollections'> | null;

/**
 * What the ticker answers. Each list is already in the order it is shown in. The lists split the
 * lines by who sets the date, which is the split the board draws: the command center holds the
 * dates of the records (`overdue`, `deadlines`, `snoozed`), and the tasks section holds the work
 * the reader set down (`tasks`), with its date when it has one.
 */
export type Ticker = {
    /** The records' dates that have passed, the most overdue first. */
    overdue: TickerItem[];
    /** The records' dates to come, by category and then by date. */
    deadlines: TickerItem[];
    /**
     * The tasks section's lines: the due follow-ups, then the open subtasks, then the open entries
     * of the file flagged `tasks` and the records' undated lines. In each of the three the dated
     * lines come first by date, the most overdue first, then the undated ones.
     */
    tasks: TickerItem[];
    venueLoad: Tally[];
    snoozed: TickerItem[];
    behind: ManifestBehind | null;
    /**
     * The projects of the Projects or Personal board whose stage is in flight or an idea and that
     * no lane takes.
     */
    unplaced: Unplaced | null;
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
    return optionKeys(collection?.schema?.find((field) => field.field === 'status'));
}

/**
 * The whole ticker, in the order the board shows its groups. `config` gives the settings, and a
 * record's stage and status are read under the words of its own hub when `wordsOf` gives them; the
 * categories are those of every hub's words (`wordsOf()`). The funding schemes, the leads and the
 * venues' calls are found through `lists`, each record by the entry its own hub reads the registry
 * by, whose `ticker:` gives the category its lines carry. A date a record holds is a line of the
 * command center inside `deadline_horizon_days`; a follow-up, a subtask and an entry of the file
 * flagged `tasks` are lines of the tasks section, with their date and whatever it is.
 */
export function ticker(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    wordsOf?: WordsOf,
    lists: TickerLists = null
): Ticker {
    const at = (record: Rooted): Record<string, unknown> => wordsOf?.(rootOf(record)) ?? config;
    const horizon = setting(config, 'deadline_horizon_days', 90);
    const months = setting(config, 'conf_horizon_months', 1);
    const warn = venueWarn(config);
    const labelMode = config.focus_label_mode;
    const projects = Object.values(snapshot.entities.projects);
    const liveProjects = projects.filter((one) => hasWord(at(one), 'stages', 'live', one.stage));
    const collections = snapshot.entities.collections;
    const union = wordsOf?.() ?? config;
    const categories = tickerCategories(union);
    /** The glyphs an overdue line and a follow-up are drawn with, by the words naming them. */
    const overdueGlyph = t('focus.command.glyph_overdue');
    const followupGlyph = t('focus.command.glyph_followup');
    const words = categories.map((one) => one.key);
    /** The entry the hub of `record` reads the registry by. */
    const entryOf = (record: Rooted, registry: RegistryWord): CollectionEntry | undefined =>
        registryEntryOf(lists, rootOf(record), registry);
    /** The category the registry's entry gives the lines of `record`, when it is a word. */
    const registryCategory = (record: Rooted, registry: RegistryWord): string | undefined => {
        const category = entryOf(record, registry)?.ticker?.category;
        return category !== undefined && words.includes(category) ? category : undefined;
    };
    /** The key of the hub's funding collection, whose view a scheme's line opens. */
    const fundingKey = (record: Rooted): string | undefined => entryOf(record, 'funding')?.key;

    const overdue: TickerItem[] = [];
    const dated: { category: string; line: TickerItem }[] = [];
    const subtasks: TickerItem[] = [];
    const datedTasks: TickerItem[] = [];
    const openEntries: TickerItem[] = [];
    const asleep: TickerItem[] = [];

    /**
     * A project's own deadline, for a project of any tier: overdue behind it, on the paper group
     * before it. It stops only at a stage whose word of `stages` carries `deadline_met`. A deadline
     * that is no date is open work and is a task line. A line that shows folds its conference into
     * itself, so the call is not listed a second time below. The category is the one word of
     * `ticker_categories` carrying `manifests`; with none, or with two or more carrying it, no
     * project deadline is read.
     */
    const folded = new Set<string>();
    const paper = oneWordWith(union, 'ticker_categories', 'manifests');
    for (const project of projects) {
        const deadline = (project.deadline ?? '').trim();
        if (paper === undefined || deadline === '' || settled(project, at(project))) continue;
        const days = daysUntil(deadline, now);
        if (days !== null && days > horizon) continue;
        const line = item(paper, glyphOf(categories, paper), focusLabel(project, labelMode), days, {
            id: project.id,
            ...rootMark(project),
            target: { kind: 'manifest', id: project.id }
        });
        if (snoozed(project.snooze, now)) {
            asleep.push({ ...line, snoozed: true });
            continue;
        }
        if (days === null) {
            openEntries.push(line);
            continue;
        }
        if (days < 0) {
            overdue.push({ ...line, glyph: overdueGlyph });
            continue;
        }
        const venue =
            project.venueId === undefined ? undefined : snapshot.entities.venues[project.venueId];
        if (
            venue !== undefined &&
            (venue.deadline !== undefined || venue.deadlineMonth !== undefined)
        ) {
            folded.add(venue.id);
            dated.push({ category: paper, line: { ...line, venue: venueLabel(venue) } });
            continue;
        }
        dated.push({ category: paper, line });
    }

    /**
     * A grant still waiting to be written. A submitted one has met its date and stops nagging. The
     * schemes are a registry entity rather than a collection (normalise leaves the collection out,
     * since the registry already carries the file), and a line of one opens the view of the
     * collection its hub keeps the schemes in. The category is the one the `ticker:` of the entry
     * the scheme's hub reads the funding registry by gives.
     */
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        const grant = registryCategory(scheme, 'funding');
        const said = at(scheme);
        if (grant === undefined || closesDeadline(said, status) || deadlineMet(said, status)) {
            continue;
        }
        const days = daysUntil(isoOf(scheme.deadline), now);
        if (days === null || days > horizon) continue;
        const key = fundingKey(scheme);
        const line = item(grant, glyphOf(categories, grant), scheme.title, days, {
            entry: key,
            ...rootMark(scheme),
            target: { kind: 'funding', id: scheme.id, collection: key }
        });
        if (snoozed(scheme.snooze, now)) {
            asleep.push({ ...line, snoozed: true });
            continue;
        }
        if (days < 0) overdue.push({ ...line, glyph: overdueGlyph });
        else dated.push({ category: grant, line });
    }

    /**
     * The entries of every other collection whose entry gives a `ticker:` (talks, teaching, tasks
     * and positions on the shipped list): one rule over every file, the category being the one that
     * `ticker:` gives. The funding and venues registries' lines are their own loops'.
     * An entry of the file flagged `tasks` is work the reader set down, so it is a line of the
     * tasks section whatever its date, with no horizon; another file's dated entry is a line of the
     * command center inside the horizon.
     */
    for (const collection of Object.values(collections)) {
        const source = collection.ticker;
        const looped = collection.registry === 'funding' || collection.registry === 'venues';
        if (source === undefined || looped || !words.includes(source.category)) continue;
        const key = bareId(collection);
        const category = source.category;
        const statuses = collectionStatuses(collection);
        const isTasks = collection.tasks === true;
        const task = isTasks ? { task: true as const } : {};
        for (const entry of collection.entries) {
            const status = str(entry.fields.status);
            if (closesDeadline(at(entry), status) || deadlineMet(at(entry), status)) continue;
            const days = daysUntil(entryDate(entry), now);
            // An undated entry of a collection whose `ticker:` says `undated` (the tasks file) is
            // open work rather than a date, so it is a task line; an undated entry of any other
            // file names no moment and is on no list at all.
            if (days === null && source.undated !== true) continue;
            if (days !== null && days > horizon && !isTasks) continue;
            const line = item(category, glyphOf(categories, category), entry.title, days, {
                entry: key,
                status,
                ...rootMark(entry),
                target: { kind: 'entry', id: entry.id, collection: key, statuses, ...task }
            });
            if (snoozed(entry.fields.snooze, now)) {
                asleep.push({ ...line, snoozed: true });
                continue;
            }
            if (days === null) openEntries.push(line);
            else if (isTasks) datedTasks.push(line);
            else if (days < 0) overdue.push({ ...line, glyph: overdueGlyph });
            else dated.push({ category, line });
        }
    }

    /**
     * The position scout's live leads. They move fast, so they have a window of their own rather
     * than the ninety-day planning horizon, and they sit in the same group as the applications the
     * entry loop above found: both are positions. A closed status is left out here as well as where
     * the snapshot is built, so the line the reader sees never outlives the lead's own status. The
     * category is the one the `ticker:` of the entry the lead's hub reads the leads registry by
     * gives.
     */
    const leadsWindow = setting(config, 'leads_horizon_days', 21);
    for (const lead of snapshot.entities.feeds.leads ?? []) {
        const position = registryCategory(lead, 'leads');
        if (position === undefined || isLeadClosed(at(lead), lead.status)) continue;
        const days = daysUntil(lead.deadline ?? '', now);
        if (days === null || days < 0 || days > leadsWindow) continue;
        dated.push({
            category: position,
            line: item(position, glyphOf(categories, position), lead.title, days, {
                ...rootMark(lead),
                target: { kind: 'lead', id: hubId(rootOf(lead), lead.title) }
            })
        });
    }

    /**
     * A conference's open call, by its exact date or, with none, by its usual month, which opens
     * the Venues view. The category is the one the `ticker:` of the entry the venue's hub reads the
     * venues registry by gives.
     */
    const venuesView = REGISTRY_VIEWS.venues;
    for (const venue of Object.values(snapshot.entities.venues)) {
        const call = registryCategory(venue, 'venues');
        if (call === undefined || folded.has(venue.id)) continue;
        const days = daysUntil(venue.deadline ?? '', now);
        const target: TickerTarget = { kind: 'venue', id: venue.id };
        const over = { entry: venuesView, ...rootMark(venue), target };
        if (days !== null) {
            if (days < 0 || days > horizon) continue;
            dated.push({
                category: call,
                line: item(call, glyphOf(categories, call), venueLabel(venue), days, over)
            });
            continue;
        }
        const ahead = monthsAhead(venue.deadlineMonth ?? '', now);
        if (ahead === null || ahead > months) continue;
        dated.push({
            category: call,
            line: item(call, glyphOf(categories, call), venueLabel(venue), null, {
                months: ahead,
                ...over
            })
        });
    }

    /** The names of the people a line names, read in its record's hub (state/boards/person.ts). */
    const namesOf = lineNames(snapshot);
    const marked =
        (record: Rooted) =>
        (line: LinePeople): Partial<TickerItem> =>
            peopleMark(line, namesOf(rootOf(record), line));

    /**
     * Follow-ups: a project's, then every collection entry's, oldest due first. A note shows while
     * its parent is open, or closed by a status that keeps its lines live (`live_subtasks`), as a
     * subtask does, and leaves once it is done. Each line names its note by its key, which is what
     * Done and Remove write to.
     */
    const notes: { days: number | null; line: TickerItem }[] = [];
    for (const project of Object.values(snapshot.entities.projects)) {
        for (const { note, days } of dueFollowups(project.followups, now)) {
            notes.push({
                days,
                line: item(
                    'followup',
                    followupGlyph,
                    `${focusLabel(project, labelMode)} - ${note.do}`,
                    days,
                    {
                        id: project.id,
                        ...rootMark(project),
                        ...marked(project)(note),
                        target: { kind: 'followup', id: project.id, note: note.key }
                    }
                )
            });
        }
    }
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        if (closesDeadline(at(scheme), status) && !statusFlag(at(scheme), status, 'live_subtasks'))
            continue;
        const key = fundingKey(scheme);
        for (const { note, days } of dueFollowups(scheme.followups, now)) {
            notes.push({
                days,
                line: item('followup', followupGlyph, `${scheme.title} - ${note.do}`, days, {
                    entry: key,
                    ...rootMark(scheme),
                    ...marked(scheme)(note),
                    target: { kind: 'followup', id: scheme.id, collection: key, note: note.key }
                })
            });
        }
    }
    for (const collection of Object.values(collections)) {
        // The funding registry's entries are the schemes read above.
        if (collection.registry === 'funding') continue;
        const key = bareId(collection);
        for (const entry of collection.entries) {
            const status = str(entry.fields.status);
            if (
                closesDeadline(at(entry), status) &&
                !statusFlag(at(entry), status, 'live_subtasks')
            )
                continue;
            const held = entryFollowups(entry);
            for (const { note, days } of dueFollowups(held, now)) {
                notes.push({
                    days,
                    line: item('followup', followupGlyph, `${entry.title} - ${note.do}`, days, {
                        entry: key,
                        ...rootMark(entry),
                        ...marked(entry)(note),
                        target: { kind: 'followup', id: entry.id, collection: key, note: note.key }
                    })
                });
            }
        }
    }

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
            { id: project.id, ...rootMark(project) },
            { kind: 'manifest', id: project.id },
            marked(project)
        )) {
            if (line.snoozed) asleep.push(line);
            else subtasks.push(line);
        }
    }
    for (const scheme of Object.values(snapshot.entities.funding)) {
        const status = scheme.status ?? '';
        if (closesDeadline(at(scheme), status) && !statusFlag(at(scheme), status, 'live_subtasks'))
            continue;
        for (const line of subtaskLines(
            scheme.subtasks,
            scheme.title,
            'funding',
            now,
            rootMark(scheme),
            { kind: 'funding', id: scheme.id, collection: fundingKey(scheme) },
            marked(scheme)
        )) {
            if (line.snoozed) asleep.push(line);
            else subtasks.push(line);
        }
    }
    for (const collection of Object.values(collections)) {
        if (collection.registry === 'funding') continue;
        const key = bareId(collection);
        for (const entry of collection.entries) {
            const status = str(entry.fields.status);
            if (
                closesDeadline(at(entry), status) &&
                !statusFlag(at(entry), status, 'live_subtasks')
            )
                continue;
            for (const line of subtaskLines(
                entrySubtasks(entry),
                entry.title,
                str(entry.fields.kind),
                now,
                { entry: key, ...rootMark(entry) },
                { kind: 'entry', id: entry.id, collection: key },
                marked(entry)
            )) {
                if (line.snoozed) asleep.push(line);
                else subtasks.push(line);
            }
        }
    }
    // The undated subtasks keep the order of the kind of what holds them.
    subtasks.sort((a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));

    overdue.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    dated.sort(
        (one, two) =>
            words.indexOf(one.category) - words.indexOf(two.category) ||
            (one.line.days ?? Number.MAX_SAFE_INTEGER) - (two.line.days ?? Number.MAX_SAFE_INTEGER)
    );

    return {
        overdue,
        deadlines: dated.map((one) => one.line),
        tasks: [
            ...datedFirst(notes.map((one) => one.line)),
            ...datedFirst(subtasks),
            ...datedFirst([...datedTasks, ...openEntries])
        ],
        venueLoad: venueLoad(liveProjects, snapshot.entities.venues, warn),
        snoozed: asleep,
        behind: manifestsBehind(liveProjects, config, wordsOf),
        unplaced: unplacedRow(unplaced(projects, config, wordsOf))
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

/**
 * The venues carrying too many in-flight papers, most-loaded first. A venue is counted by its
 * name, so the one journal catalogued in two hubs of the workspace carries the papers of both.
 */
export function venueLoad(projects: Project[], venues: Record<Id, Venue>, warn: number): Tally[] {
    const counts = new Map<string, { id: Id; count: number }>();
    for (const project of projects) {
        const id = project.venueId;
        if (id === undefined || id === '') continue;
        const name = byKey(venues, id)?.name ?? keyOf(id);
        const held = counts.get(name);
        counts.set(name, { id: held?.id ?? id, count: (held?.count ?? 0) + 1 });
    }
    return [...counts.values()]
        .map(({ id, count }) => ({
            id,
            label: venueLabel(venues[id]) === '' ? keyOf(id) : venueLabel(venues[id]),
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

/**
 * The lines with a date first, by date and the most overdue first, then the lines with none in the
 * order given; two lines of one date keep their order.
 */
function datedFirst(lines: readonly TickerItem[]): TickerItem[] {
    const withDate = lines.filter((line) => line.days !== null);
    withDate.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    return [...withDate, ...lines.filter((line) => line.days === null)];
}

/** The deadlines under each category, in the categories' order, a category with none left out. */
export function deadlinesByCategory(
    deadlines: TickerItem[],
    categories: readonly TickerCategory[]
): { category: TickerCategory; lines: TickerItem[] }[] {
    return categories
        .map((category) => ({
            category,
            lines: deadlines.filter((line) => line.kind === category.key)
        }))
        .filter((one) => one.lines.length > 0);
}

/** The three groups of the tasks section, each holding its lines in the order given. */
export type TaskGroups = {
    followups: TickerItem[];
    subtasks: TickerItem[];
    tasks: TickerItem[];
};

/**
 * The tasks section's lines by group, each group in the order `tasks` gives, its dated lines first:
 * a subtask carries the key of its own line, and a follow-up says so in its kind, which is what a
 * scheme's note has instead of a target; every other line is a task.
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
    'overdue' | 'categories' | 'snoozed' | 'attention' | 'refresh',
    readonly unknown[]
>;

/**
 * Whether the command center has a row to show, the lines naming the projects behind their docs
 * and the projects on no lane included.
 */
export function hasCommandRows(
    groups: CommandGroups,
    week: Pick<Ticker, 'behind' | 'unplaced'> | null
): boolean {
    const rows = Object.values(groups).reduce((sum, rows) => sum + rows.length, 0);
    return rows > 0 || (week?.behind ?? null) !== null || (week?.unplaced ?? null) !== null;
}
