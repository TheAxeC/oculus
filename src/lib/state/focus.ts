// Layer 2, client state. Focus lanes, priorities, flames and waiting arithmetic live here because
// changes to the board do not change deadline ticker calculations.
//
// No words live here. An item carries what it is (`kind`), the glyph it is drawn with and the
// number of days, and the view turns that into a sentence through config/text.yml; a colour is a
// tone through tones.ts, never a hex. That is what keeps the vocabulary in config and this file
// free of both.

import type { Collection, Entry, Id, Project, Snapshot, Venue } from '../data/model.ts';
// `str` here is the shared `text`: a config or entry value of the wrong type reads as the empty
// string. The alias also keeps the name off the several `const text` locals in this file.
import { isMap, byKey, text as str } from '../data/guards.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the three model types
// the Focus view names reach it from here, beside the functions that take and return them.
export type { Id, Project, Venue } from '../data/model.ts';
import { daysUntil } from './board/index.ts';
import { UNKNOWN_TONE, toneOf } from './tones.ts';
import { waitingLabel } from './waiting.ts';

/** The clusters of `focus_lanes`, top to bottom: your move, then on others, then idea to project. */
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

/** The awaiting-a-response strip: who you chase, what you wait on, and how much is simply blocked. */
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

function num(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** One flag of a `status_palette` row, over the status as the data writes it. */
export function statusFlag(config: Record<string, unknown>, status: string, flag: string): boolean {
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
export function deadlineMet(config: Record<string, unknown>, status: string): boolean {
    return statusFlag(config, status, 'deadline_met');
}

/**
 * Whether a project's own deadline has stopped being yours to act on: any chip the palette marks
 * terminal, or marks `deadline_met` (which is what `submitted` carries). Reading the palette is
 * what keeps the rule in config/vocab.yml rather than in a list of chip names here.
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

/** A number out of `behavior.yml`, and the fallback that file's comment names when it holds none. */
export function setting(config: Record<string, unknown>, key: string, fallback: number): number {
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
export function live(project: Project): boolean {
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
        const lane = byKey(out, key);
        if (lane === undefined) continue;
        lane.push(project);
    }
    for (const lane of Object.values(out)) lane.sort(laneOrder);
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
export function venueLabel(venue: Venue | undefined): string {
    if (venue === undefined) return '';
    const short = venue.short ?? '';
    return short === '' ? venue.name : short;
}

/**
 * The awaiting-a-response strip. The people and venue tallies are one per live project, the people
 * named in `waiting-on:` first, then the venue holding it when it is `submitted`; the blocked tally
 * is over every project of every tier on its own, whatever else the project is waiting for.
 * A `waiting-on:` value is a collaborations key or another project's id, drawn by waiting.ts.
 */
export function waiting(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    collaborators: Record<Id, string>
): Waiting {
    const venues = snapshot.entities.venues;
    const projects = snapshot.entities.projects;
    const people: Record<string, number> = {};
    const held: Record<string, number> = {};
    let blocked = 0;
    for (const project of Object.values(snapshot.entities.projects)) {
        // The blocked tally is over every tier and over every project, where the people and venue
        // tallies are over the live ones: a blocked archive or coauthor paper is still blocked, and
        // a blocked project also waiting on somebody is blocked as well as waited on.
        if (project.chips.includes('blocked')) blocked += 1;
        if (!live(project)) continue;
        if (project.waitingOn.length > 0) {
            for (const key of project.waitingOn) {
                const name = waitingLabel(key, collaborators, projects);
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
    return byKey(collections, key)?.entries ?? [];
}

/** The label a card and a ticker line carry: the short handle whenever the manifest has one. */
export function labelOf(project: Project): string {
    const short = project.short ?? '';
    return short === '' ? project.title : short;
}
