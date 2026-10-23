// Layer 2, client state. Focus lanes, priorities, flames and waiting arithmetic live here because
// changes to the board do not change deadline ticker calculations.
//
// No words live here. An item carries what it is (`kind`), the glyph it is drawn with and the
// number of days, and the view turns that into a sentence through the text catalogs; a colour is a
// tone through tones.ts, never a hex. That is what keeps the vocabulary in config and this file
// free of both.

import { z } from 'zod';
import type { Collection, Entry, Id, Project, Snapshot, Venue } from '../../data/model/index.ts';
// `str` here is the shared `text`: a config or entry value of the wrong type reads as the empty
// string. The alias also keeps the name off the several `const text` locals in this file.
import { byKey, focusBlock, strings, text as str } from '../../data/helpers/guards.ts';
import { joinedEntries } from '../../data/helpers/hub-names.ts';
import { anyWord, hasWord, vocabKeys, wordFlag } from '../../data/shapes/vocab-keys.ts';
import {
    fieldItemsShape,
    mapShape,
    readAs,
    rowsShape,
    stringItemsShape,
    wordShape
} from '../../data/shapes/shapes.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the three model types
// the Focus view names reach it from here, beside the functions that take and return them.
export type { Id, Project, Venue } from '../../data/model/index.ts';
import { daysUntil } from './board/index.ts';
export { setting } from './board/index.ts';
import { toneOf } from '../shared/words/tones.ts';
import { waitingLabel } from './waiting.ts';

/**
 * The clusters of `focus_lanes` the board draws as clusters, top to bottom: your move, then on
 * others, then idea to project.
 */
export const CLUSTERS = ['now', 'parked', 'incubate'];

/**
 * The cluster of the backlog: a lane of it is drawn full width under the three clusters and takes
 * only a project of a tier carrying `backlog`.
 */
export const BACKLOG = 'backlog';

/**
 * One lane of the board: its key, its words, its hue and its cluster, and what puts a project on
 * it, the stages of `stages` or the chips of `chips` its row names, each empty when the row names
 * none.
 */
export type Lane = {
    key: string;
    label: string;
    sub: string;
    tone: string;
    cluster: string;
    stages: string[];
    chips: string[];
};

/** One priority level of `priority_levels`: its manifest value, its words and its flame count. */
export type Priority = {
    key: string;
    label: string;
    flames: number;
};

/** A label with a count, and the registry id when the tally names one venue. */
export type Tally = { id?: string; label: string; count: number };

/**
 * The awaiting-a-response box: who you chase, what you wait on, and how much is simply blocked.
 */
export type Waiting = {
    people: Tally[];
    venues: Tally[];
    blocked: number;
    /** Grants whose status says the application is in and the answer is not. */
    grants: string[];
    /** Job applications out for a decision. */
    applications: string[];
    /** Career hosts emailed and not yet answered. */
    hosts: string[];
};

/** One flag of a word of `statuses`, over the status as the data writes it. */
export function statusFlag(config: Record<string, unknown>, status: string, flag: string): boolean {
    return wordFlag(config, 'statuses', status, flag);
}

/** Whether a status carries `closes_deadline`, which takes its entry off the deadline radar. */
export function closesDeadline(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'closes_deadline');
}

/**
 * Whether a project's stage is a word of `stages` carrying `pauses_countdown` (submitted): its card
 * and its lane stop counting the days to its deadline, compared as the stage is written.
 */
export function pausesCountdown(
    project: Pick<Project, 'stage'>,
    config: Record<string, unknown>
): boolean {
    return hasWord(config, 'stages', 'pauses_countdown', project.stage);
}

/**
 * Whether a project carries a chip whose word of `chips` carries `blocked`, compared as the chip is
 * written: the Focus board counts it as blocked, and its lane card's wait line says so.
 */
export function isBlocked(
    project: Pick<Project, 'chips'>,
    config: Record<string, unknown>
): boolean {
    return anyWord(config, 'chips', 'blocked', project.chips);
}

/** Whether a status is still live but its own deadline is met, so nagging it is noise. */
export function deadlineMet(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'deadline_met');
}

/**
 * Whether a project's own deadline has stopped being yours to act on: its stage is a word of
 * `stages` carrying `deadline_met` (submitted), compared as the stage is written. Reading the flag
 * is what keeps the rule in config/catalogs/vocab.yml rather than in a list of stage names here.
 */
export function settled(project: Project, config: Record<string, unknown>): boolean {
    return hasWord(config, 'stages', 'deadline_met', project.stage);
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

/**
 * One row of `focus_lanes`: a map with a key; its label is the key when it names none, and its
 * `stages` and `chips` are lists of words, empty when the row leaves them out.
 */
const laneShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: wordShape,
        sub: wordShape,
        color: wordShape,
        cluster: wordShape,
        stages: stringItemsShape.catch([]),
        chips: stringItemsShape.catch([])
    })
    .transform((row): Lane => ({
        key: row.key,
        label: row.label === '' ? row.key : row.label,
        sub: row.sub,
        tone: toneOf(row.color),
        cluster: row.cluster,
        stages: row.stages,
        chips: row.chips
    }));

const lanesShape = rowsShape(laneShape);

/** The lanes of `focus_lanes`, in the config's order, each hue already a tone. */
export function lanes(config: Record<string, unknown>): Lane[] {
    return readAs(lanesShape, config.focus_lanes) ?? [];
}

/** One row of `priority_levels`: a map with a key; its label is the key when it names none. */
const priorityShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: wordShape,
        flames: z.number().catch(0)
    })
    .transform((row): Priority => ({
        key: row.key,
        label: row.label === '' ? row.key : row.label,
        flames: row.flames
    }));

const prioritiesShape = rowsShape(priorityShape);

/** The priority levels of `priority_levels`, in the config's order. */
export function priorities(config: Record<string, unknown>): Priority[] {
    return readAs(prioritiesShape, config.priority_levels) ?? [];
}

/** How many flames a project's `priority:` draws, and none for a project carrying no priority. */
export function flamesOf(
    project: Pick<Project, 'priority'>,
    config: Record<string, unknown>
): number {
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
    return titleOrder(a, b);
}

/** A project of the backlog sorts by its title alone. */
function titleOrder(a: Project, b: Project): number {
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

/**
 * Whether a project is of a tier whose projects may sit in the backlog: a tier of `tiers`
 * (config/catalogs/vocab.yml) carrying `backlog`, which are Projects and Personal.
 */
function backlogTier(project: Pick<Project, 'tier'>, config: Record<string, unknown>): boolean {
    return hasWord(config, 'tiers', 'backlog', project.tier);
}

/**
 * Whether a lane may hold a project at all: a lane of the cluster `backlog` holds only a project of
 * a backlog tier, so an idea of another tier is never drawn there; every other lane holds any.
 */
function holds(
    lane: Lane,
    project: Pick<Project, 'tier'>,
    config: Record<string, unknown>
): boolean {
    return lane.cluster !== BACKLOG || backlogTier(project, config);
}

/**
 * The lane a project sits on: the first lane, in the order of `focus_lanes`, whose `chips` holds
 * one of the project's chips; else the first whose `stages` holds its stage; else none. Chips and
 * stage are compared as written. A lane that may not hold the project (`holds`) is passed over, so
 * a project of a tier without `backlog` is on no backlog lane and on whatever lane its chips or its
 * stage give otherwise.
 */
export function laneOf(
    project: Pick<Project, 'tier' | 'stage' | 'chips'>,
    all: Lane[],
    config: Record<string, unknown>
): Lane | undefined {
    const open = all.filter((lane) => holds(lane, project, config));
    const stage = project.stage ?? '';
    return (
        open.find((lane) => lane.chips.some((chip) => project.chips.includes(chip))) ??
        open.find((lane) => stage !== '' && lane.stages.includes(stage))
    );
}

/**
 * What sits on each lane, by lane key: each project on the lane `laneOf` gives it, and on none
 * when it gives none. A lane of the cluster `backlog` is sorted by title, every other lane by
 * deadline first and then title.
 */
export function laneItems(
    projects: Project[],
    all: Lane[],
    config: Record<string, unknown>
): Record<string, Project[]> {
    const out: Record<string, Project[]> = {};
    for (const lane of all) out[lane.key] = [];
    for (const project of projects) {
        const lane = laneOf(project, all, config);
        if (lane !== undefined) byKey(out, lane.key)?.push(project);
    }
    for (const lane of all)
        byKey(out, lane.key)?.sort(lane.cluster === BACKLOG ? titleOrder : laneOrder);
    return out;
}

/**
 * Whether the board may move a project onto a lane: the lane may hold it (`holds`), and the word a
 * move writes is a word of the vocabulary, the lane's first chip a word of `chips` for a lane with
 * `chips`, its first stage a word of `stages` otherwise. A lane that names neither takes no move.
 * So a move's write is never refused in part, and a project of a tier without `backlog` is never
 * sent to a backlog lane, which would leave it off the board.
 */
export function movable(project: Project, lane: Lane, config: Record<string, unknown>): boolean {
    if (!holds(lane, project, config)) return false;
    const chip = lane.chips.at(0);
    if (chip !== undefined) return vocabKeys(config.chips).includes(chip);
    const stage = lane.stages.at(0);
    return stage !== undefined && vocabKeys(config.stages).includes(stage);
}

/**
 * The manifest fields a move of a project onto a lane writes in one write, or null when it writes
 * nothing: a lane `movable` refuses, or the lane the project sits on. Onto a lane with `chips`, the
 * lane's first chip is added when the project carries none of the lane's chips and the chips of
 * every other lane with `chips` are taken off, so the card sits where it was dropped, and `stage`
 * is not written. Onto any other lane, `stage` is the project's own when the lane's `stages` holds
 * it and the lane's first stage otherwise, written only when it differs, and the chips of every
 * lane with `chips` are taken off. The other chips stay in their order, and `status.chips` is
 * written only when it changes.
 */
export function moveOnto(
    project: Project,
    lane: Lane,
    all: Lane[],
    config: Record<string, unknown>
): Record<string, unknown> | null {
    if (!movable(project, lane, config)) return null;
    if (laneOf(project, all, config)?.key === lane.key) return null;
    const fields: Record<string, unknown> = {};
    let chips: string[];
    if (lane.chips.length > 0) {
        const others = all.filter((one) => one.key !== lane.key).flatMap((one) => one.chips);
        chips = project.chips.filter((chip) => lane.chips.includes(chip) || !others.includes(chip));
        if (!chips.some((chip) => lane.chips.includes(chip))) chips.push(lane.chips[0]);
    } else {
        const laned = all.flatMap((one) => one.chips);
        chips = project.chips.filter((chip) => !laned.includes(chip));
        const stage = project.stage ?? '';
        const next = lane.stages.includes(stage) ? stage : lane.stages[0];
        if (next !== stage) fields.stage = next;
    }
    const same =
        chips.length === project.chips.length &&
        chips.every((chip, at) => chip === project.chips[at]);
    if (!same) fields['status.chips'] = chips;
    return Object.keys(fields).length === 0 ? null : fields;
}

/**
 * The projects of a backlog tier whose stage carries `live` (work in flight) or `idea` in `stages`
 * and that no lane of `focus_lanes` takes, so the board is not showing them: with the shipped lanes
 * none, and a hub whose lanes leave out a stage or the backlog row lists them.
 */
export function unplaced(projects: Project[], config: Record<string, unknown>): Project[] {
    const all = lanes(config);
    return projects.filter(
        (project) =>
            backlogTier(project, config) &&
            (hasWord(config, 'stages', 'live', project.stage) ||
                hasWord(config, 'stages', 'idea', project.stage)) &&
            laneOf(project, all, config) === undefined
    );
}

/** A tally sorted the way the awaiting box reads it: the biggest first, then alphabetically. */
function tallies(counts: Record<string, number>): Tally[] {
    return Object.entries(counts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));
}

/** A venue's short name, and its full name when the registry gives it no short one. */
export function venueLabel(venue: Venue | undefined): string {
    if (venue === undefined) return '';
    const short = venue.short ?? '';
    return short === '' ? venue.name : short;
}

/**
 * The awaiting-a-response box. Every tally counts only a project laneItems draws on a lane of the
 * three clusters of `CLUSTERS`, so a project on no lane or on a backlog lane is in none. For each,
 * the people named in `waiting-on:` first, then the venue holding it when its stage carries
 * `pauses_countdown` in `stages` (submitted). The blocked tally counts the projects on a lane that
 * carry a chip with `blocked` in `chips`, whatever else the project is waiting for. A
 * `waiting-on:` value is a people key or another project's id, drawn by waiting.ts. The
 * applications are the entries whose status is in `applications_sent` under `focus:` of
 * config/defaults/behavior.yml, and the hosts those whose status carries `waiting` in the hub's
 * `career_host_status`.
 */
export function waiting(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    names: Record<Id, string>
): Waiting {
    const venues = snapshot.entities.venues;
    const projects = snapshot.entities.projects;
    const board = lanes(config);
    const items = laneItems(Object.values(projects), board, config);
    const onLanes = new Set(
        board
            .filter((lane) => CLUSTERS.includes(lane.cluster))
            .flatMap((lane) => items[lane.key] ?? [])
            .map((project) => project.id)
    );
    const people: Record<string, number> = {};
    const held: Record<string, number> = {};
    let blocked = 0;
    for (const project of Object.values(projects)) {
        // A blocked project that is also waiting on somebody is blocked as well as waited on.
        if (!onLanes.has(project.id)) continue;
        if (isBlocked(project, config)) blocked += 1;
        if (project.waitingOn.length > 0) {
            for (const key of project.waitingOn) {
                const name = waitingLabel(key, names, projects);
                people[name] = (people[name] ?? 0) + 1;
            }
            continue;
        }
        if (pausesCountdown(project, config)) {
            const venue = project.venueId === undefined ? undefined : venues[project.venueId];
            const name = venueLabel(venue);
            held[name] = (held[name] ?? 0) + 1;
        }
    }
    const grants = Object.values(snapshot.entities.funding)
        .filter((scheme) => deadlineMet(config, scheme.status ?? ''))
        .map((scheme) => scheme.title)
        .sort();
    const sent = focusWords(config, 'applications_sent');
    const applications = entriesOf(snapshot.entities.collections, 'applications')
        .filter((entry) => sent.includes(str(entry.fields.status).trim().toLowerCase()))
        .map((entry) => entry.title)
        .sort();
    const hosts = (snapshot.entities.career?.hosts ?? [])
        .filter((host) => wordFlag(config, 'career_host_status', host.status, 'waiting'))
        .map((host) => host.name);
    return { people: tallies(people), venues: tallies(held), blocked, grants, applications, hosts };
}

/** The entries of one collection of the snapshot, and none when it holds no such file. */
export function entriesOf(collections: Record<Id, Collection>, key: string): Entry[] {
    return joinedEntries(collections, key);
}

/** The label a card and a ticker line carry: the short handle whenever the manifest has one. */
export function labelOf(project: Pick<Project, 'title' | 'short'>): string {
    const short = project.short ?? '';
    return short === '' ? project.title : short;
}

/**
 * The name a Focus card and a ticker line carry for a project under `focus_label_mode`: the whole
 * title under `full`, the short handle (`labelOf`) under anything else.
 */
export function focusLabel(project: Pick<Project, 'title' | 'short'>, mode: unknown): string {
    return mode === 'full' ? project.title : labelOf(project);
}

/**
 * The projects quick add may write to: those of the research board's tier (the tier of `tiers`
 * carrying `main`, Projects), in the order given.
 */
export function liveProjects(projects: Project[], config: Record<string, unknown>): Project[] {
    return projects.filter((one) => hasWord(config, 'tiers', 'main', one.tier));
}

/**
 * The list of status words under `focus:` of config/defaults/behavior.yml at a key, trimmed and in
 * lower case, which is how an entry's status is compared with them; none if absent.
 */
export function focusWords(config: Record<string, unknown>, key: string): string[] {
    return strings(focusBlock(config)[key]).map((word) => word.trim().toLowerCase());
}

/**
 * The next priority in the cycle: unset, then every level of `priority_levels` from the fewest
 * flames to the most, then unset again, so one click on an unset card asks for the least. A value
 * the levels do not hold starts the cycle over.
 */
export function nextPriority(levels: Priority[], current: string | undefined): string {
    const climbing = [...levels].sort((a, b) => a.flames - b.flames);
    const cycle = ['', ...climbing.map((level) => level.key)];
    const at = cycle.indexOf(current ?? '');
    return cycle[(at < 0 ? 0 : at + 1) % cycle.length];
}

/** The lanes of one cluster, in the board's order. */
export function lanesIn(board: Lane[], cluster: string): Lane[] {
    return board.filter((one) => one.cluster === cluster);
}

/** Every project of the portfolio, in the order the snapshot holds them; none before it arrives. */
export function portfolioProjects(snapshot: Snapshot | null): Project[] {
    return Object.values(snapshot?.entities.projects ?? {});
}

/** The two sections of the Focus board that fold, by the key their closed state is kept under. */
export type FoldKey = 'command' | 'tasks';

/** The folded sections a Focus tab's saved state names as closed; a wrong value names none. */
const closedShape = z.object({ closed: fieldItemsShape });

/** Whether a section is open in a Focus tab's state: every section is, until it is closed. */
export function foldOpen(state: unknown, key: FoldKey): boolean {
    return !(readAs(closedShape, state)?.closed ?? []).includes(key);
}

/** The tab's state with one section's fold turned over, and every other key of it kept. */
export function foldToggled(state: unknown, key: FoldKey): Record<string, unknown> {
    const closed = readAs(closedShape, state)?.closed ?? [];
    return {
        ...(readAs(mapShape, state) ?? {}),
        closed: closed.includes(key) ? closed.filter((one) => one !== key) : [...closed, key]
    };
}
