// Layer 2, client state. The board's logic over one snapshot: which projects a board shows, what
// each is joined with, what can be filtered on, and what a filter and a search leave. Pure and
// deterministic, no runes: every function takes values and returns values, reads no clock and no
// storage, and two calls over one snapshot give the same answer. The reactive face is
// state/selectors.svelte.ts, and it is the only module that reaches this through the entities store.
//
// Three boards over one component. The cockpit's Projects, Archive and Coauthor tabs are one board
// over three tier sets, and a BoardPreset is the whole difference between them. A preset is read out
// of the merged config rather than written here, so which tiers a board shows, the words of its
// columns, the order its types sort in and the buckets it rolls up stay in config/layout.yml,
// config/vocab.yml and config/behavior.yml.

import { chipKeys, chipLabel, domainLabel, domainTone, typeTone } from './tones.ts';
import type { Id, Project, Snapshot, Tier, Venue } from '../data/model.ts';
// `str` here is the shared `text`: a config value of the wrong type reads as the empty string.
import { isMap, strings, text as str } from '../data/guards.ts';

/** The value a facet gives what has none: no year, no funding, no compute, no code deposit. */
export const NONE = '__none__';

/** Cards or a table. */
export type BoardMode = 'cards' | 'list';

/** A short handle where a manifest has one, or always the full title. */
export type LabelMode = 'short' | 'full';

/** One column of the list mode: the key its cell is read from a row by, and its heading. */
export type BoardColumn = { key: string; label: string };

/**
 * One lifecycle bucket of `tab_rollup`: its id, its words, the types and chips it catches, and the
 * hue the config gives it, which the category facet draws its dot in.
 */
export type RollupBucket = { id: string; label: string; keys: string[]; color: string };

/** What one board is, as the config describes it. */
export type BoardPreset = {
    /** The view id this preset belongs to: `projects`, `archive` or `coauthor`. */
    id: string;
    /** The tiers whose projects the board shows. */
    tiers: Tier[];
    /** The list mode's columns in order, with the words config/layout.yml gives them. */
    columns: BoardColumn[];
    /** The lifecycle buckets of this board, in the config's order. */
    rollup: RollupBucket[];
    /** The order types sort in; a type the list does not name sorts after every type it does. */
    typeOrder: string[];
    /** The label mode the board starts in, from config/behavior.yml. */
    labels: LabelMode;
    /** The search box's placeholder from config/layout.yml, or the empty string when it has none. */
    search: string;
};

/**
 * What the sessions facet reads: one project to one of the three values. The sessions payload is
 * live data and this module is pure over the snapshot, so the reading is handed in by
 * state/selectors.svelte.ts rather than done here.
 */
export type SessionsOf = (project: Project) => string;

/** A tag on a card: the id a filter names it by, and the words the chip carries. */
export type BoardTag = { id: Id; label: string };

/** One project as a board shows it: the entity, and every join a card or a row reads. */
export type BoardItem = {
    id: Id;
    project: Project;
    /** The hue of the project's type, which the card's type chip is filled with. */
    tone: string;
    /** The `themes:` entry of the project's domain: its words and its hue. */
    domain: { id: Id; label: string; tone: string } | null;
    /** The venue joined through `venue_id`: the card's line and the list row's short name. */
    venue: { id: Id; text: string; short: string } | null;
    programs: BoardTag[];
    funding: BoardTag[];
    datasets: BoardTag[];
    collaborators: BoardTag[];
    /** The authors as one line: the list joined, else the lead, else empty. */
    authors: string;
    /** The lifecycle bucket of the preset's rollup, or the empty string when none catches it. */
    bucket: string;
    /** The code deposit's status, or the empty string when the manifest names none. */
    code: string;
    /** `hpc`, `local`, or the empty string. */
    compute: string;
    reproduced: boolean;
    /** The year as text, or the empty string when the manifest has none. */
    year: string;
    /** `live`, `recent` or `none`: what the sessions payload says about the project's folder. */
    sessions: string;
    chips: string[];
    /** Everything the search reads, lower case, one string. */
    haystack: string;
};

/** One value of one facet: what a filter stores, what the menu says, and how many carry it. */
export type FacetValue = { value: string; label: string; count: number };

/** One facet: the key a filter is stored under, and its values in the order the menu lists them. */
export type Facet = { key: string; values: FacetValue[] };

/** What one open board remembers, per view instance. */
export type BoardState = {
    mode: BoardMode;
    search: string;
    /** Selected values by facet key. Empty, or absent, is no filter on that facet. */
    filters: Record<string, string[]>;
    /** The ids of the cards that are open. */
    expanded: Id[];
    labels: LabelMode;
    /** The quick filter: only the projects whose manifest is behind their documents. */
    stale: boolean;
    /** The quick filter: only the projects that carry a deadline. */
    dated: boolean;
    /**
     * The types switched OFF, which is what the type toggles hold. Every type is on until one is
     * clicked, so a type the hub grows later is on the day it appears rather than hidden by a state
     * saved before it existed.
     */
    hiddenTypes: string[];
};

/** The counts of the strip above the board, and the venues the board's projects aim at. */
export type BoardStats = {
    /** How many projects the board holds, before any filter. */
    active: number;
    submitReady: number;
    /** The `focus: blocked` lane, which is a lane and not a status chip. */
    blocked: number;
    /** How many carry a deadline. */
    dated: number;
    venues: VenueCount[];
};

/** One venue of the stats strip: how many of the board's projects aim at it, and whether that warns. */
export type VenueCount = {
    id: Id;
    /** The registry's short name, which is what the chip carries. */
    short: string;
    /** The registry's full name, which is what the chip's tooltip carries. */
    name: string;
    count: number;
    /** True from `venue_conc_warn` of config/behavior.yml up: too much of the board on one venue. */
    warn: boolean;
};

/** One type of the board with how many carry it, in the order the board's own sort put them in. */
export type TypeCount = { type: string; count: number };

/** The quick filters and type toggles applyFilters is given beside the facets. */
export type QuickFilters = {
    stale?: boolean;
    dated?: boolean;
    hiddenTypes?: string[];
    /** `stale_lag_days` of config/behavior.yml: how far behind counts as behind. */
    staleLag?: number;
};

/** The three boards and the tiers each one shows. A view id outside this map is the first board. */
const TIERS: Record<string, Tier[]> = {
    projects: ['ideas', 'active', 'manuscripts'],
    archive: ['archive'],
    coauthor: ['coauthor']
};

/** The board view ids, in the order presetFor knows them. A project sits on exactly one of them. */
export const BOARDS = Object.keys(TIERS);

/** Which `board:` column list a board takes its headings from. */
const COLUMN_KEY: Record<string, string> = {
    projects: 'cols_project',
    archive: 'cols_archive',
    coauthor: 'cols_archive'
};

/** The cells each column list holds, in the order the words of `board:` are written in. */
const COLUMNS: Record<string, string[]> = {
    cols_project: ['title', 'authors', 'venue', 'status', 'focus', 'next'],
    cols_archive: ['title', 'authors', 'venue', 'domain', 'program', 'funding']
};

/** Which `*_label_mode` of config/behavior.yml a board starts in. */
const LABEL_KEY: Record<string, string> = {
    projects: 'project_label_mode',
    archive: 'archive_label_mode',
    coauthor: 'archive_label_mode'
};

/** The board every unknown view id falls back to. */
const DEFAULT_BOARD = 'projects';

/** The facets, in the order the toolbar offers them. */
export const FACETS = [
    'category',
    'year',
    'domain',
    'program',
    'funding',
    'dataset',
    'status',
    'compute',
    'reproduced',
    'code',
    'sessions'
];

/**
 * The values of the sessions facet: a session running in the project's folder now, one in the
 * payload's own two-day window with none running, or none at all. It is the one facet whose value
 * is not in the snapshot, so boardItems is handed a function that reads it from the sessions
 * payload; a board built without one has `none` everywhere, which is one value and is not offered.
 */
export const SESSIONS_LIVE = 'live';
export const SESSIONS_RECENT = 'recent';
export const SESSIONS_NONE = 'none';
const SESSIONS_VALUES = [SESSIONS_LIVE, SESSIONS_RECENT, SESSIONS_NONE];

/** The fixed values of the facets that have them, in the order their menu lists them. */
const COMPUTE_VALUES = ['hpc', 'local', NONE];
const CODE_VALUES = ['deposited', 'review-anon', 'none', NONE];
const REPRODUCED_VALUES = ['1', '0'];

/** A JIF the registry wrote as nothing at all; the venue line leaves it out. */
const NO_JIF = ['', '-', 'none'];

/**
 * How near a deadline has to be for the badge to count days rather than show the date. It is the
 * fortnight the cockpit's card counted in, and it is here rather than in config/behavior.yml
 * because no key of that file says it; a key can take it over without this changing shape.
 */
export const DEADLINE_SOON = 14;

/** One day, in milliseconds. */
const DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of the day a `YYYY-MM-DD` names, or NaN when it names no day. */
function midnight(date: string): number {
    return /^\d{4}-\d{2}-\d{2}/.test(date) ? Date.parse(`${date.slice(0, 10)}T00:00:00Z`) : NaN;
}

/** The reader's own calendar day, as the same midnight the deadline is measured at. */
function today(now: number): number {
    const at = new Date(now);
    return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
}

/**
 * Whole days from `now` to a `YYYY-MM-DD` date, negative when it has passed, and null when the
 * string is not a date. Both ends are taken at midnight of their own day, so a deadline today is
 * nought days off whatever the hour, and `now` is the caller's: nothing here reads the clock.
 */
export function daysUntil(date: string, now: number): number | null {
    const at = midnight(date);
    if (Number.isNaN(at)) return null;
    return Math.round((at - today(now)) / DAY);
}

/** A config label turned into an id: lower case, and every other run of characters a hyphen. */
export function slug(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** The `tab_rollup` buckets of one board, in the config's order. */
function rollupOf(config: Record<string, unknown>, id: string): RollupBucket[] {
    const all = config.tab_rollup;
    if (!isMap(all)) return [];
    const rows = all[id];
    if (!Array.isArray(rows)) return [];
    const buckets: RollupBucket[] = [];
    for (const row of rows) {
        if (!isMap(row)) continue;
        const label = str(row.label);
        if (label === '') continue;
        buckets.push({ id: slug(label), label, keys: strings(row.keys), color: str(row.color) });
    }
    return buckets;
}

/** The columns of one board: the cells of its list, with the words `board:` gives each of them. */
function columnsOf(config: Record<string, unknown>, id: string): BoardColumn[] {
    const key = COLUMN_KEY[id] ?? COLUMN_KEY[DEFAULT_BOARD];
    const board = isMap(config.board) ? config.board : {};
    const words = strings(board[key]);
    return COLUMNS[key].map((cell, at) => ({ key: cell, label: words[at] ?? cell }));
}

/** The `board.search` placeholder of one board. */
function searchOf(config: Record<string, unknown>, id: string): string {
    const board = isMap(config.board) ? config.board : {};
    const search = isMap(board.search) ? board.search : {};
    return str(search[id]);
}

/** The `*_label_mode` of one board; anything but `full` is the short handle. */
function labelsOf(config: Record<string, unknown>, id: string): LabelMode {
    const key = LABEL_KEY[id] ?? LABEL_KEY[DEFAULT_BOARD];
    return str(config[key]) === 'full' ? 'full' : 'short';
}

/**
 * The preset of one view id, read out of the merged config. A config that holds none of the keys
 * gives a board with no columns to name, no buckets and no type order, which still renders: the
 * cards are there, sorted by title, and the category facet is not offered.
 */
export function presetFor(view: string, config: Record<string, unknown> = {}): BoardPreset {
    const id = view in TIERS ? view : DEFAULT_BOARD;
    return {
        id,
        tiers: TIERS[id],
        columns: columnsOf(config, id),
        rollup: rollupOf(config, id),
        typeOrder: strings(config.type_order),
        labels: labelsOf(config, id),
        search: searchOf(config, id)
    };
}

/**
 * The lifecycle bucket of one project: the first bucket of the rollup whose keys name the project's
 * type or one of its status chips. A project no bucket catches has none, which is the empty string.
 */
export function bucketOf(project: Project, rollup: RollupBucket[]): string {
    for (const bucket of rollup) {
        if (project.type !== undefined && bucket.keys.includes(project.type)) return bucket.id;
        if (project.chips.some((chip) => bucket.keys.includes(chip))) return bucket.id;
    }
    return '';
}

/** The venue as the card writes it: name, quartile, JIF and cost, in that order, joined by a bar. */
export function venueText(venue: Venue): string {
    const parts = [venue.name];
    if (venue.quartile !== undefined && venue.quartile !== '') parts.push(venue.quartile);
    const jif = (venue.jif ?? '').trim();
    if (!NO_JIF.includes(jif.toLowerCase())) parts.push(`JIF ${jif}`);
    if (venue.free !== undefined && venue.free !== '') parts.push(venue.free);
    return parts.filter((part) => part !== '').join(' | ');
}

/** The authors as one line: the list joined, the line as written, or the lead on its own. */
export function authorLine(project: Project): string {
    const authors = project.authors;
    if (typeof authors === 'string') return authors;
    if (Array.isArray(authors) && authors.length > 0) return authors.join(', ');
    return project.lead ?? '';
}

/**
 * The first sentence of a paragraph, cut to `limit`. Whitespace is collapsed first, so a line
 * broken across a manifest reads as one; a cut falls on a word boundary and is marked, so a card
 * never ends mid-word without saying that there is more.
 */
export function firstSentence(text: string, limit: number): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    if (flat === '') return '';
    const end = /[.!?](\s|$)/.exec(flat);
    const sentence = end === null ? flat : flat.slice(0, end.index + 1);
    if (sentence.length <= limit) return sentence;
    const cut = sentence.slice(0, limit);
    const space = cut.lastIndexOf(' ');
    return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}...`;
}

/** The names of the collaborations collection, by the key a manifest names them with. */
function collaboratorNames(snapshot: Snapshot): Record<Id, string> {
    const names: Record<Id, string> = {};
    const collection = snapshot.entities.collections.collaborations;
    if (collection === undefined) return names;
    for (const entry of collection.entries) names[entry.id] = entry.title;
    return names;
}

/** Everything the search reads, from the project and from what it was joined with. */
function haystack(project: Project, item: Omit<BoardItem, 'haystack'>): string {
    const tags = [...item.programs, ...item.funding, ...item.datasets, ...item.collaborators];
    const parts = [
        project.title,
        project.short ?? '',
        project.eli5 ?? '',
        project.latest ?? '',
        project.next ?? '',
        project.outcome ?? '',
        item.venue?.text ?? project.venue ?? '',
        ...project.results,
        ...project.ideas,
        ...tags.map((tag) => tag.id),
        ...tags.map((tag) => tag.label)
    ];
    return parts.join(' ').toLowerCase();
}

/** One project with its joins, ready for a card, a row, a facet and a filter. */
function itemOf(
    project: Project,
    snapshot: Snapshot,
    preset: BoardPreset,
    names: Record<Id, string>,
    sessionsOf: SessionsOf
): BoardItem {
    const entities = snapshot.entities;
    const domainId = project.domainIds[0];
    const venue = project.venueId === undefined ? undefined : entities.venues[project.venueId];
    const tag = (id: Id, label: string): BoardTag => ({ id, label });

    const item: Omit<BoardItem, 'haystack'> = {
        id: project.id,
        project,
        tone: typeTone(project.type ?? ''),
        domain:
            domainId === undefined
                ? null
                : { id: domainId, label: domainLabel(domainId), tone: domainTone(domainId) },
        venue:
            venue === undefined
                ? null
                : {
                      id: venue.id,
                      text: venueText(venue),
                      short:
                          venue.short !== undefined && venue.short !== '' ? venue.short : venue.name
                  },
        programs: project.programIds.map((id) => tag(id, entities.programs[id]?.title ?? id)),
        funding: project.fundingIds.map((id) => tag(id, id)),
        datasets: project.datasetIds.map((id) => tag(id, id)),
        collaborators: project.collaborators.map((id) => tag(id, names[id] ?? id)),
        authors: authorLine(project),
        bucket: bucketOf(project, preset.rollup),
        code: project.codeAvailability?.status ?? '',
        compute: project.compute ?? '',
        reproduced: project.reproduced !== undefined,
        year: project.year === undefined ? '' : String(project.year),
        sessions: sessionsOf(project),
        chips: project.chips
    };
    return { ...item, haystack: haystack(project, item) };
}

/** Pinned first, then the config's type order, then the title. */
function compare(left: BoardItem, right: BoardItem, order: string[]): number {
    const pinned = Number(right.project.pin === true) - Number(left.project.pin === true);
    if (pinned !== 0) return pinned;
    const rank = (item: BoardItem): number => {
        const at = item.project.type === undefined ? -1 : order.indexOf(item.project.type);
        return at < 0 ? order.length : at;
    };
    const byType = rank(left) - rank(right);
    if (byType !== 0) return byType;
    return left.project.title.localeCompare(right.project.title);
}

/**
 * The projects of a board, joined and sorted. A project of another tier is not here, and nothing
 * is filtered: a facet counts what this returns, and a filter is applied to it afterwards.
 */
export function boardItems(
    snapshot: Snapshot,
    preset: BoardPreset,
    sessionsOf: SessionsOf = () => SESSIONS_NONE
): BoardItem[] {
    const names = collaboratorNames(snapshot);
    const items = Object.values(snapshot.entities.projects)
        .filter((project) => preset.tiers.includes(project.tier))
        .map((project) => itemOf(project, snapshot, preset, names, sessionsOf));
    return items.sort((left, right) => compare(left, right, preset.typeOrder));
}

/**
 * The values one item carries for one facet. It is what the counting reads and what the filter
 * matches against, so a facet's menu and its filter cannot disagree about what an item is.
 */
export function facetValues(item: BoardItem, facet: string): string[] {
    switch (facet) {
        case 'category':
            return item.bucket === '' ? [] : [item.bucket];
        case 'year':
            return [item.year === '' ? NONE : item.year];
        case 'domain':
            return item.domain === null ? [] : [item.domain.id];
        case 'program':
            return item.programs.map((tag) => tag.id);
        case 'funding':
            return item.funding.length === 0 ? [NONE] : item.funding.map((tag) => tag.id);
        case 'dataset':
            return item.datasets.map((tag) => tag.id);
        case 'status':
            return item.chips;
        case 'compute':
            return [item.compute === '' ? NONE : item.compute];
        case 'reproduced':
            return [item.reproduced ? '1' : '0'];
        case 'code':
            return [item.code === '' ? NONE : item.code];
        case 'sessions':
            return [item.sessions];
        default:
            return [];
    }
}

/** The words a facet value carries, for the values that are data rather than vocabulary. */
function facetLabel(facet: string, value: string, preset: BoardPreset): string {
    if (value === NONE) return value;
    if (facet === 'category') {
        return preset.rollup.find((bucket) => bucket.id === value)?.label ?? value;
    }
    if (facet === 'domain') return domainLabel(value);
    if (facet === 'status') return chipLabel(value);
    return value;
}

/** How many items carry each value of one facet, by value. */
function countValues(items: BoardItem[], facet: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
        for (const value of facetValues(item, facet)) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return counts;
}

/** The values of one facet, in the order its menu lists them. */
function orderValues(facet: string, counts: Map<string, number>, preset: BoardPreset): string[] {
    const has = (value: string): boolean => (counts.get(value) ?? 0) > 0;
    if (facet === 'category') return preset.rollup.map((bucket) => bucket.id).filter(has);
    if (facet === 'status') return chipKeys().filter(has);
    if (facet === 'compute') return COMPUTE_VALUES.filter(has);
    if (facet === 'code') return CODE_VALUES.filter(has);
    if (facet === 'reproduced') return REPRODUCED_VALUES.filter(has);
    if (facet === 'sessions') return SESSIONS_VALUES.filter(has);
    const values = [...counts.keys()].filter(has);
    // A year axis reads newest first; every other free facet reads by weight, and by its own value
    // where two weigh the same, so the order does not depend on the order the projects were read in.
    if (facet === 'year') {
        const years = values.filter((value) => value !== NONE).sort((a, b) => b.localeCompare(a));
        return values.includes(NONE) ? [...years, NONE] : years;
    }
    const named = values.filter((value) => value !== NONE);
    named.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b));
    return values.includes(NONE) ? [...named, NONE] : named;
}

/**
 * Every facet the board can be split on, with its counts. A facet with fewer than two values is
 * not offered: one value splits nothing, and a menu that cannot change what is shown is noise.
 */
export function facets(items: BoardItem[], preset: BoardPreset): Facet[] {
    const found: Facet[] = [];
    for (const facet of FACETS) {
        const counts = countValues(items, facet);
        const values = orderValues(facet, counts, preset).map((value) => ({
            value,
            label: facetLabel(facet, value, preset),
            count: counts.get(value) ?? 0
        }));
        if (values.length >= 2) found.push({ key: facet, values });
    }
    return found;
}

/** The status chip the stats strip counts as ready to go out. */
const SUBMIT_READY = 'submit-ready';

/** The focus lane the stats strip counts as waiting on somebody else. */
const BLOCKED = 'blocked';

/** How many venues the strip's distribution shows, most aimed at first. */
const STATS_VENUES = 8;

/** The `venue_conc_warn` the config names when it names none. */
const VENUE_WARN = 4;

/** The `stale_lag_days` the config names when it names none. */
export const STALE_LAG = 1;

/** A number out of the merged config, and the fallback behavior.yml's own comment names. */
function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    const value = config[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * The strip above the board: how many projects it holds, how many are ready to go out, how many
 * are waiting on somebody, how many are dated, and where they are aimed. The counts are over the
 * board's own projects, before any filter, so the strip says what the board is rather than what is
 * on screen. The venues come from the registry rather than from the manifests, so a chip carries
 * the catalogued short name and the full one it stands for.
 */
export function stats(
    items: BoardItem[],
    venues: Record<Id, Venue>,
    config: Record<string, unknown> = {}
): BoardStats {
    const warnAt = setting(config, 'venue_conc_warn', VENUE_WARN);
    const counts = new Map<Id, number>();
    let submitReady = 0;
    let blocked = 0;
    let dated = 0;
    for (const item of items) {
        if (item.chips.includes(SUBMIT_READY)) submitReady += 1;
        if (item.project.focus === BLOCKED) blocked += 1;
        if (item.project.deadline !== undefined && item.project.deadline !== '') dated += 1;
        const id = item.venue?.id;
        if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const rows: VenueCount[] = [...counts.entries()].map(([id, count]) => {
        const venue = venues[id];
        const name = venue?.name ?? id;
        return {
            id,
            short: venue?.short !== undefined && venue.short !== '' ? venue.short : name,
            name,
            count,
            warn: count >= warnAt
        };
    });
    rows.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
    return {
        active: items.length,
        submitReady,
        blocked,
        dated,
        venues: rows.slice(0, STATS_VENUES)
    };
}

/**
 * How many projects carry each type, in the `type_order` of the config, with a type that list does
 * not name after the ones it does and in its own order. A project with no type is not counted:
 * there is no toggle to draw for a type that has no name.
 */
export function typeCounts(items: BoardItem[], order: string[] = []): TypeCount[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        const type = item.project.type;
        if (type === undefined || type === '') continue;
        counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    const rank = (type: string): number => {
        const at = order.indexOf(type);
        return at < 0 ? order.length : at;
    };
    return [...counts.entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((left, right) => rank(left.type) - rank(right.type));
}

/**
 * Whether a project's manifest is behind its own documents by at least `lag` days. `staleDays` is
 * the raw lag normalise measured, and the threshold is applied here, so raising the config key
 * changes the badge and the quick filter together.
 */
export function isStale(item: BoardItem, lag: number = STALE_LAG): boolean {
    const days = item.project.staleDays;
    return days !== undefined && days >= lag;
}

/** A size as the file finder writes it: megabytes to one decimal, else whole kilobytes. */
export function humanSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 KB';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.floor(bytes / 1024))} KB`;
}

/** One entry of a collection that names a project: which collection it is in, and its words. */
export type Dissemination = { collection: string; id: Id; title: string };

/** The collections whose entries say a project was presented or taught. */
const ACTIVITY = ['events', 'education'];

/**
 * The events and education entries whose `related:` names one project, which is where the work was
 * disseminated. An events entry the reader only attended is not one: its `role` says `attend`, and
 * attending somebody else's conference is not this project appearing anywhere.
 */
export function disseminated(snapshot: Snapshot, id: Id): Dissemination[] {
    const found: Dissemination[] = [];
    for (const collection of ACTIVITY) {
        const entries = snapshot.entities.collections[collection]?.entries ?? [];
        for (const entry of entries) {
            const role = str(entry.fields.role);
            if (collection === 'events' && role === 'attend') continue;
            if (!strings(entry.fields.related).includes(id)) continue;
            found.push({ collection, id: entry.id, title: entry.title });
        }
    }
    return found;
}

/**
 * The items a board shows: every selected value of a facet is an alternative within that facet, and
 * every facet with a selection must match. The search is a substring of everything haystack holds,
 * case insensitive, and an empty search matches everything. The quick filters and the type toggles
 * are the same gate: a type switched off is gone, and a quick filter keeps only what carries it.
 */
export function applyFilters(
    items: BoardItem[],
    filters: Record<string, string[]>,
    search: string,
    quick: QuickFilters = {}
): BoardItem[] {
    const needle = search.trim().toLowerCase();
    const hidden = quick.hiddenTypes ?? [];
    const lag = quick.staleLag ?? STALE_LAG;
    return items.filter((item) => {
        const type = item.project.type;
        if (type !== undefined && hidden.includes(type)) return false;
        if (quick.stale === true && !isStale(item, lag)) return false;
        if (quick.dated === true && (item.project.deadline ?? '') === '') return false;
        for (const facet of FACETS) {
            const selected = filters[facet];
            if (selected === undefined || selected.length === 0) continue;
            const values = facetValues(item, facet);
            if (!selected.some((value) => values.includes(value))) return false;
        }
        return needle === '' || item.haystack.includes(needle);
    });
}

/** The state a board starts in, before it has remembered anything. */
export function emptyBoardState(labels: LabelMode = 'short'): BoardState {
    return {
        mode: 'cards',
        search: '',
        filters: {},
        expanded: [],
        labels,
        stale: false,
        dated: false,
        hiddenTypes: []
    };
}

/**
 * A valid board state out of whatever was saved, which is anything at all: an older release's
 * shape, a hand-edited localStorage, or nothing. Every field falls back on its own, so one bad
 * key costs that key and not the whole board.
 */
export function parseBoardState(value: unknown, labels: LabelMode = 'short'): BoardState {
    const state = emptyBoardState(labels);
    if (!isMap(value)) return state;
    if (value.mode === 'list' || value.mode === 'cards') state.mode = value.mode;
    if (value.labels === 'full' || value.labels === 'short') state.labels = value.labels;
    if (typeof value.search === 'string') state.search = value.search;
    state.stale = value.stale === true;
    state.dated = value.dated === true;
    state.hiddenTypes = strings(value.hiddenTypes);
    state.expanded = strings(value.expanded);
    if (isMap(value.filters)) {
        for (const [facet, selected] of Object.entries(value.filters)) {
            if (!FACETS.includes(facet)) continue;
            const values = strings(selected);
            if (values.length > 0) state.filters[facet] = values;
        }
    }
    return state;
}
