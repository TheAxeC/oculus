// Layer 2, client state. Focus lanes and waiting arithmetic live here because changes to the board
// do not change deadline ticker calculations.
//
// No words live here. An item carries what it is (`kind`), the glyph it is drawn with and the
// number of days, and the view turns that into a sentence through the text catalogs; a colour is a
// tone through tones.ts, never a hex. That is what keeps the vocabulary in config and this file
// free of both.
//
// A project is read under the words of its own hub: its lane is the lane of that hub's
// `focus_lanes` that takes it, drawn in the board's lane of the same key, and its stage and chips
// are held to that hub's `stages` and `chips`. A function over the projects of several hubs takes
// `wordsOf` (data/shapes/vocab-keys.ts), the words of each hub, and reads the merged config alone
// without it; the board's lanes are those of the union of every hub's words.

import { z } from 'zod';
import type { Id, Project, Snapshot, Venue } from '../../data/model/index.ts';
// `str` here is the shared `text`: a config or entry value of the wrong type reads as the empty
// string. The alias also keeps the name off the several `const text` locals in this file.
import { byKey, focusBlock, strings, text as str } from '../../data/helpers/guards.ts';
import { flaggedEntries, rootOf } from '../../data/helpers/hub-names.ts';
import {
    anyWord,
    hasWord,
    vocabKeys,
    wordFlag,
    type WordsOf
} from '../../data/shapes/vocab-keys.ts';
import {
    fieldItemsShape,
    mapShape,
    readAs,
    rowsShape,
    stringItemsShape,
    wordShape
} from '../../data/shapes/shapes.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the four model types
// the Focus view names reach it from here, beside the functions that take and return them.
export type { Id, Project, Snapshot, Venue } from '../../data/model/index.ts';
import { daysUntil } from './board/index.ts';
export { setting } from './board/index.ts';
import { rolesOf } from '../../data/shapes/boards/roles.ts';
import { projectRole } from '../../data/shapes/boards/takes.ts';
import { projectStatusWords, toneOf } from '../shared/words/tones.ts';
import { waitingLabel } from './waiting.ts';

/**
 * The clusters of `focus_lanes` the board draws as clusters, top to bottom: your move, then on
 * others, then idea to project.
 */
export const CLUSTERS = ['now', 'parked', 'incubate'];

/**
 * The cluster of the Idea lane: a lane of it is drawn full width under the three clusters and takes
 * a project of any tier at a stage it lists.
 */
export const IDEA = 'idea';

/**
 * One lane of the board: its key, its words, its glyph name, its hue and its cluster, and what puts
 * a project on it, the stages of `stages` or the chips of `chips` its row names, each empty when
 * the row names none. The glyph name is the row's `icon` as written, the empty string when the row
 * names none; a view draws it through views/shared/card/card.ts `laneGlyph`, which draws the glyph
 * `focus` for a name the glyph vocabulary lacks.
 */
export type Lane = {
    key: string;
    label: string;
    icon: string;
    sub: string;
    tone: string;
    cluster: string;
    stages: string[];
    chips: string[];
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
 * One row of `focus_lanes`: a map with a key; its label is the key when it names none, its `icon`
 * the empty string when it names none, and its `stages` and `chips` are lists of words, empty when
 * the row leaves them out.
 */
const laneShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: wordShape,
        icon: wordShape,
        sub: wordShape,
        color: wordShape,
        cluster: wordShape,
        stages: stringItemsShape.catch([]),
        chips: stringItemsShape.catch([])
    })
    .transform((row): Lane => ({
        key: row.key,
        label: row.label === '' ? row.key : row.label,
        icon: row.icon,
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

/** A project sorts inside its lane by its deadline, and by its title when it has none. */
function laneOrder(a: Project, b: Project): number {
    const one = a.deadline ?? '';
    const two = b.deadline ?? '';
    if (one !== '' && two !== '') return one < two ? -1 : one > two ? 1 : 0;
    if (one !== '') return -1;
    if (two !== '') return 1;
    return titleOrder(a, b);
}

/** A project of the Idea lane sorts by its title alone. */
function titleOrder(a: Project, b: Project): number {
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

/**
 * Whether a lane may hold a project at all: a lane with `chips` (Blocked, Backburner) holds only a
 * project whose stage does not carry `terminal` in `stages`, since done work waits on nothing;
 * every other lane holds any.
 */
function holds(
    lane: Lane,
    project: Pick<Project, 'stage'>,
    config: Record<string, unknown>
): boolean {
    return lane.chips.length === 0 || !hasWord(config, 'stages', 'terminal', project.stage);
}

/**
 * The lane a project sits on: the first lane, in the order of `focus_lanes`, whose `chips` holds
 * one of the project's chips; else the first whose `stages` holds its stage; else none. Chips and
 * stage are compared as written. A lane that may not hold the project (`holds`) is passed over, so
 * a project at a `terminal` stage is on no chip lane, and on whatever lane its stage gives.
 */
function laneOf(
    project: Pick<Project, 'stage' | 'chips'>,
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
 * The status marks a project's card draws on a lane: the words of `projectStatusWords` under the
 * project's hub, each word once in its first place, without the stage when the lane's `stages` is
 * that one stage alone, and without each chip the lane's `chips` holds, since the lane's head
 * already says those. A lane that lists two stages (Push) keeps the stage, which tells its cards
 * apart.
 */
export function laneMarks(
    project: Pick<Project, 'stage' | 'form' | 'chips' | 'root'>,
    lane: Pick<Lane, 'stages' | 'chips'>
): string[] {
    const said = new Set(lane.chips);
    const stage = project.stage ?? '';
    if (stage !== '' && lane.stages.length === 1 && lane.stages[0] === stage) said.add(stage);
    const marks = projectStatusWords(project.stage, project.form, project.chips, rootOf(project));
    return [...new Set(marks)].filter((word) => !said.has(word));
}

/**
 * The lanes and the words a project of each hub is read under, each hub's lanes read once:
 * `wordsOf` gives a hub's words, and the merged config alone stands for every hub without it.
 */
function hubLanes(
    config: Record<string, unknown>,
    wordsOf: WordsOf | undefined
): (hub: string) => { lanes: Lane[]; words: Record<string, unknown> } {
    const read = new Map<string, { lanes: Lane[]; words: Record<string, unknown> }>();
    return (hub) => {
        const held = read.get(hub);
        if (held !== undefined) return held;
        const words = wordsOf?.(hub) ?? config;
        const made = { lanes: lanes(words), words };
        read.set(hub, made);
        return made;
    };
}

/**
 * The lane of the project's own hub that takes it (`laneOf` over that hub's `focus_lanes` and
 * words), read through `wordsOf`.
 */
export function projectLane(
    project: Pick<Project, 'stage' | 'chips' | 'root'>,
    wordsOf: WordsOf
): Lane | undefined {
    const words = wordsOf(rootOf(project));
    return laneOf(project, lanes(words), words);
}

/**
 * What sits on each lane of `all`, by lane key: each project on the lane of its own hub's lanes
 * `laneOf` gives it, put in the lane of `all` of the same key, and on none when it gives none. A
 * lane of the cluster `idea` is sorted by title, every other lane by deadline first and then
 * title.
 */
export function laneItems(
    projects: Project[],
    all: Lane[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Record<string, Project[]> {
    const out: Record<string, Project[]> = {};
    const own = hubLanes(config, wordsOf);
    for (const lane of all) out[lane.key] = [];
    for (const project of projects) {
        const held = own(rootOf(project));
        const lane = laneOf(project, held.lanes, held.words);
        if (lane !== undefined) byKey(out, lane.key)?.push(project);
    }
    for (const lane of all)
        byKey(out, lane.key)?.sort(lane.cluster === IDEA ? titleOrder : laneOrder);
    return out;
}

/**
 * Whether the board may move a project onto a lane: the lane may hold it (`holds`), and the word a
 * move writes is a word of the vocabulary, the lane's first chip a word of `chips` for a lane with
 * `chips`, its first stage a word of `stages` otherwise. A lane that names neither takes no move.
 * So a move's write is never refused in part, and a project at a `terminal` stage is never sent to
 * a chip lane, which would leave it off the board.
 */
function movable(project: Project, lane: Lane, config: Record<string, unknown>): boolean {
    if (!holds(lane, project, config)) return false;
    const chip = lane.chips.at(0);
    if (chip !== undefined) return vocabKeys(config.chips).includes(chip);
    const stage = lane.stages.at(0);
    return stage !== undefined && vocabKeys(config.stages).includes(stage);
}

/**
 * Whether a project may be moved onto the lane of its own hub's lanes with the key of `lane`, a
 * lane of the board: `movable` under that hub's words, and never when the hub has no such lane.
 */
export function hubMovable(project: Project, lane: Pick<Lane, 'key'>, wordsOf: WordsOf): boolean {
    const words = wordsOf(rootOf(project));
    const own = lanes(words).find((one) => one.key === lane.key);
    return own !== undefined && movable(project, own, words);
}

/**
 * The manifest fields a move of a project onto the board's lane `lane` writes: `moveOnto` over
 * the lane of the project's own hub with the same key, that hub's lanes and its words, and null
 * when the hub has no such lane.
 */
export function hubMoveOnto(
    project: Project,
    lane: Pick<Lane, 'key'>,
    wordsOf: WordsOf
): Record<string, unknown> | null {
    const words = wordsOf(rootOf(project));
    const all = lanes(words);
    const own = all.find((one) => one.key === lane.key);
    return own === undefined ? null : moveOnto(project, own, all, words);
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
function moveOnto(
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
 * The projects of any tier whose stage carries `live` (work in flight) or `idea` in `stages` and
 * that no lane of `focus_lanes` takes, each read under its own hub's words, so the board is not
 * showing them: with the shipped lanes, which give every such stage a lane, none, and a hub whose
 * lanes leave out a stage or the Idea row lists them.
 */
export function unplaced(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    const own = hubLanes(config, wordsOf);
    return projects.filter((project) => {
        const { lanes: held, words } = own(rootOf(project));
        return (
            (hasWord(words, 'stages', 'live', project.stage) ||
                hasWord(words, 'stages', 'idea', project.stage)) &&
            laneOf(project, held, words) === undefined
        );
    });
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
 * One word of `tiers:`: its key, its words (the key itself for a row that names no label), and
 * whether a Focus lane card leaves it off its tags (`unmarked: true`).
 */
export type TierWord = { key: string; label: string; unmarked?: true };

/** The words of `tiers:` of a hub's words, in the order the map lists them. */
export function tierWords(words: Record<string, unknown>): TierWord[] {
    const rows = readAs(mapShape, words.tiers) ?? {};
    return vocabKeys(words.tiers).map((key) => {
        const row = readAs(mapShape, rows[key]);
        const label = typeof row?.label === 'string' && row.label !== '' ? row.label : key;
        return row?.unmarked === true ? { key, label, unmarked: true } : { key, label };
    });
}

/**
 * One fact a lane card draws in its row of tags: which kind it is, the words the tag shows, and
 * the whole words its tip names, which differ only for a venue drawn by its short name.
 */
export type LaneFact = { kind: 'role' | 'tier' | 'venue'; label: string; whole: string };

/**
 * The facts a lane card draws after its status marks, in this order: the user's role on the
 * project unless its row of `roles:` carries `unmarked: true`, read only while the workspace names
 * a `self` (`self` not empty); the project's tier unless its word of `tiers:` carries
 * `unmarked: true`; and the venue where the stage carries `placed` in `stages`, shown by its short name
 * (`venueLabel`) with its name as its whole words. `words` are the words of the project's own hub.
 */
export function laneFacts(
    project: Project,
    words: Record<string, unknown>,
    self: ReadonlySet<Id>,
    venues: Record<Id, Venue>
): LaneFact[] {
    const facts: LaneFact[] = [];
    if (self.size > 0) {
        const roles = rolesOf(words);
        const role = projectRole(project, roles, self);
        if (role !== undefined && role.unmarked !== true) {
            facts.push({ kind: 'role', label: role.label, whole: role.label });
        }
    }
    const tier = project.tier ?? '';
    const word = tierWords(words).find((one) => one.key === tier);
    if (tier !== '' && word?.unmarked !== true) {
        const label = word?.label ?? tier;
        facts.push({ kind: 'tier', label, whole: label });
    }
    if (hasWord(words, 'stages', 'placed', project.stage) && project.venueId !== undefined) {
        const venue = byKey(venues, project.venueId);
        const label = venueLabel(venue);
        if (venue !== undefined && label !== '') {
            facts.push({ kind: 'venue', label, whole: venue.name === '' ? label : venue.name });
        }
    }
    return facts;
}

/**
 * The awaiting-a-response box. Every tally counts only a project laneItems draws on a lane of the
 * three clusters of `CLUSTERS`, so a project on no lane or on the Idea lane is in none. For each,
 * the people named in `waiting-on:` first, then the venue holding it when its stage carries
 * `pauses_countdown` in `stages` (submitted). The blocked tally counts the projects on a lane that
 * carry a chip with `blocked` in `chips`, whatever else the project is waiting for. A
 * `waiting-on:` value is a people key or another project's id, drawn by waiting.ts. The
 * applications are the entries of the collections flagged `awaiting` whose status is in
 * `applications_sent` under `focus:` of config/defaults/behavior.yml. A waited-on project is named
 * from `known`, every project of the portfolio, when the snapshot holds only the projects a filter
 * keeps, and from the snapshot's own projects without it.
 */
export function waiting(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    names: Record<Id, string>,
    wordsOf?: WordsOf,
    known?: Record<Id, Project>
): Waiting {
    const venues = snapshot.entities.venues;
    const projects = snapshot.entities.projects;
    const wordsAt = (record: { root?: string }): Record<string, unknown> =>
        wordsOf?.(rootOf(record)) ?? config;
    const board = lanes(wordsOf?.() ?? config);
    const items = laneItems(Object.values(projects), board, config, wordsOf);
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
        const words = wordsAt(project);
        if (isBlocked(project, words)) blocked += 1;
        if (project.waitingOn.length > 0) {
            for (const key of project.waitingOn) {
                const name = waitingLabel(key, names, known ?? projects);
                people[name] = (people[name] ?? 0) + 1;
            }
            continue;
        }
        if (pausesCountdown(project, words)) {
            const venue = project.venueId === undefined ? undefined : venues[project.venueId];
            const name = venueLabel(venue);
            held[name] = (held[name] ?? 0) + 1;
        }
    }
    const grants = Object.values(snapshot.entities.funding)
        .filter((scheme) => deadlineMet(wordsAt(scheme), scheme.status ?? ''))
        .map((scheme) => scheme.title)
        .sort();
    const sent = focusWords(config, 'applications_sent');
    const applications = flaggedEntries(snapshot.entities.collections, 'awaiting')
        .filter((entry) => sent.includes(str(entry.fields.status).trim().toLowerCase()))
        .map((entry) => entry.title)
        .sort();
    return { people: tallies(people), venues: tallies(held), blocked, grants, applications };
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
 * The projects quick add may write to: every project of any tier whose stage does not carry
 * `terminal` in `stages` of its own hub's words, in the order given.
 */
export function liveProjects(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return projects.filter(
        (one) => !hasWord(wordsOf?.(rootOf(one)) ?? config, 'stages', 'terminal', one.stage)
    );
}

/**
 * The list of status words under `focus:` of config/defaults/behavior.yml at a key, trimmed and in
 * lower case, which is how an entry's status is compared with them; none if absent.
 */
export function focusWords(config: Record<string, unknown>, key: string): string[] {
    return strings(focusBlock(config)[key]).map((word) => word.trim().toLowerCase());
}

/** The lanes of one cluster, in the board's order. */
export function lanesIn(board: Lane[], cluster: string): Lane[] {
    return board.filter((one) => one.cluster === cluster);
}

/** Every project of the portfolio, in the order the snapshot holds them; none before it arrives. */
export function portfolioProjects(snapshot: Snapshot | null): Project[] {
    return Object.values(snapshot?.entities.projects ?? {});
}

/**
 * The three sections of the Focus board that fold, the career banner, the command center and the
 * tasks, by the key their closed state is kept under.
 */
export type FoldKey = 'career' | 'command' | 'tasks';

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
