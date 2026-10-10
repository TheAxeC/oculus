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
import { byKey, text as str } from '../../data/helpers/guards.ts';
import { joinedEntries } from '../../data/helpers/hub-names.ts';
import {
    fieldItemsShape,
    mapShape,
    readAs,
    rowsShape,
    wordShape
} from '../../data/shapes/shapes.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the three model types
// the Focus view names reach it from here, beside the functions that take and return them.
export type { Id, Project, Venue } from '../../data/model/index.ts';
import { daysUntil } from './board/index.ts';
import { sideLive } from './board/personal.ts';
export { setting } from './board/index.ts';
import { UNKNOWN_TONE, toneOf } from '../shared/words/tones.ts';
import { waitingLabel } from './waiting.ts';

/**
 * The clusters of `focus_lanes`, top to bottom: your move, then on others, then idea to project.
 */
export const CLUSTERS = ['now', 'parked', 'incubate'];

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

/** A label with a count, and the registry id when the tally names one venue. */
export type Tally = { id?: string; label: string; count: number };

/**
 * The awaiting-a-response strip: who you chase, what you wait on, and how much is simply blocked.
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

/** One flag of a `status_palette` row, over the status as the data writes it. */
export function statusFlag(config: Record<string, unknown>, status: string, flag: string): boolean {
    const palette = readAs(mapShape, config.status_palette);
    if (palette === null) return false;
    return readAs(mapShape, palette[status.trim().toLowerCase()])?.[flag] === true;
}

/** Whether a status takes its entry off the deadline radar. */
export function terminal(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'terminal');
}

/** Whether a status is still live but its own deadline is met, so nagging it is noise. */
export function deadlineMet(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'deadline_met');
}

/**
 * Whether a project's own deadline has stopped being yours to act on: any chip the palette marks
 * terminal, or marks `deadline_met` (which is what `submitted` carries). Reading the palette is
 * what keeps the rule in config/catalogs/vocab.yml rather than in a list of chip names here.
 */
export function settled(project: Project, config: Record<string, unknown>): boolean {
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

/** One row of `focus_lanes`: a map with a key; its label is the key when it names none. */
const laneShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: wordShape,
        sub: wordShape,
        color: wordShape,
        cluster: wordShape
    })
    .transform((row): Lane => ({
        key: row.key,
        label: row.label === '' ? row.key : row.label,
        sub: row.sub,
        tone: toneOf(row.color),
        cluster: row.cluster
    }));

const lanesShape = rowsShape(laneShape);

/** The lanes of `focus_lanes`, in the config's order, each hue already a tone. */
export function lanes(config: Record<string, unknown>): Lane[] {
    return readAs(lanesShape, config.focus_lanes) ?? [];
}

/** The tone of the ideas backlog, the `holding_color` of vocab.yml. */
export function holdingTone(config: Record<string, unknown>): string {
    const hex = str(config.holding_color);
    return hex === '' ? UNKNOWN_TONE : toneOf(hex);
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
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

/**
 * The three open tiers the Projects board shows. The backlog reads them alone; the waiting tallies
 * read them beside the projects drawn on a lane.
 */
export function live(project: Project): boolean {
    return ['ideas', 'active', 'manuscripts'].includes(project.tier);
}

/** The tiers expected on a lane, so a project of one that names none is reported as unplaced. */
function onBoard(project: Project): boolean {
    return project.tier === 'active' || project.tier === 'manuscripts';
}

/**
 * What sits on each lane, by lane key, sorted deadline first then title. `holding` is not a lane
 * and neither is a `focus:` no lane names, so a project carrying either is on no lane: `backlog`
 * takes a live project in `holding` and an idea on no lane, `unplaced` names an active or
 * manuscript project with no focus, and a project of another tier is drawn by neither. A project of
 * any tier is drawn on the lane its `focus:` names: the tier says where the folder lives, and a
 * coauthor, archive or software project whose manifest names a lane is still work the reader placed
 * there.
 */
export function laneItems(projects: Project[], all: Lane[]): Record<string, Project[]> {
    const out: Record<string, Project[]> = {};
    for (const lane of all) out[lane.key] = [];
    for (const project of projects) {
        const key = project.focus ?? '';
        const lane = byKey(out, key);
        if (lane === undefined) continue;
        lane.push(project);
    }
    for (const lane of Object.values(out)) lane.sort(laneOrder);
    return out;
}

/**
 * Whether the board may move a project to a `focus:` value. Any project may go to a lane, and only
 * a project of a live tier may go to `holding`: the backlog draws the live tiers alone, so a
 * project of another tier sent there would leave the board.
 */
export function movable(project: Project, focus: string): boolean {
    return focus !== 'holding' || live(project);
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
export function venueLabel(venue: Venue | undefined): string {
    if (venue === undefined) return '';
    const short = venue.short ?? '';
    return short === '' ? venue.name : short;
}

/**
 * The awaiting-a-response strip. The people and venue tallies count every live project, whether
 * or not a card draws it, and every project of another tier that laneItems draws on a lane, so
 * every card that says "Waiting on" is counted. For each, the people named in `waiting-on:` first,
 * then the venue holding it when it is `submitted`. The blocked tally is over every project of
 * every tier on its own, whatever else the project is waiting for. A `waiting-on:` value is a
 * people key or another project's id, drawn by waiting.ts. The people tally also counts the
 * `waiting-on:` of every live side project, since a side project is read by the Focus board.
 */
export function waiting(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    names: Record<Id, string>
): Waiting {
    const venues = snapshot.entities.venues;
    const projects = snapshot.entities.projects;
    const onLanes = new Set(
        Object.values(laneItems(Object.values(projects), lanes(config)))
            .flat()
            .map((project) => project.id)
    );
    const people: Record<string, number> = {};
    const held: Record<string, number> = {};
    let blocked = 0;
    for (const project of Object.values(projects)) {
        // The blocked tally is over every tier and over every project, where the people and venue
        // tallies are over every live project and every project a lane draws: a blocked archive or
        // coauthor paper is still blocked, and a blocked project also waiting on somebody is
        // blocked as well as waited on.
        if (project.chips.includes('blocked')) blocked += 1;
        if (!live(project) && !onLanes.has(project.id)) continue;
        if (project.waitingOn.length > 0) {
            for (const key of project.waitingOn) {
                const name = waitingLabel(key, names, projects);
                people[name] = (people[name] ?? 0) + 1;
            }
            continue;
        }
        if (project.chips.includes('submitted')) {
            const venue = project.venueId === undefined ? undefined : venues[project.venueId];
            const name = venueLabel(venue);
            held[name] = (held[name] ?? 0) + 1;
        }
    }
    for (const side of Object.values(snapshot.entities.personal)) {
        if (!sideLive(side, config)) continue;
        for (const key of side.waitingOn ?? []) {
            const name = waitingLabel(key, names, projects);
            people[name] = (people[name] ?? 0) + 1;
        }
    }
    const grants = Object.values(snapshot.entities.funding)
        .filter((scheme) => deadlineMet(config, scheme.status ?? ''))
        .map((scheme) => scheme.title)
        .sort();
    const applications = entriesOf(snapshot.entities.collections, 'applications')
        .filter((entry) => str(entry.fields.status).trim().toLowerCase() === 'applied')
        .map((entry) => entry.title)
        .sort();
    const hosts = (snapshot.entities.career?.hosts ?? [])
        .filter((host) => host.status.trim().toLowerCase() === 'awaiting')
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

/** The projects quick add may write to: those of the three live tiers, in the order given. */
export function liveProjects(projects: Project[]): Project[] {
    return projects.filter((one) => ['ideas', 'active', 'manuscripts'].includes(one.tier));
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

/** How many things the awaiting strip waits on: people, venues, blocked cards and the rest. */
export function waitingTotal(strip: Waiting | null): number {
    if (strip === null) return 0;
    return (
        strip.people.length +
        strip.venues.length +
        strip.blocked +
        strip.grants.length +
        strip.applications.length +
        strip.hosts.length
    );
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
