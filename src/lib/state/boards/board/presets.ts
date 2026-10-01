// Layer 2, client state. Board presets, shared types and display helpers live here because board
// configuration changes independently of items, filters and statistics.

import { z } from 'zod';
import type { Id, Project, Tier, Venue } from '../../../data/model/index.ts';
// `str` here is the shared `text`: a config value of the wrong type reads as the empty string.
import { fields, strings, text as str } from '../../../data/helpers/guards.ts';
import { fieldItemsShape, readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';

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
    /**
     * The search box's placeholder from config/layout.yml, or the empty string when it has none.
     */
    search: string;
};

/**
 * What the sessions facet reads: one project to one of the three values. The sessions payload is
 * live data and this module is pure over the snapshot, so the reading is handed in by
 * state/client/selectors.svelte.ts rather than done here.
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
    pillars: BoardTag[];
    funding: BoardTag[];
    datasets: BoardTag[];
    collaborators: BoardTag[];
    /**
     * The other end of this project's link with the software tier: on a project of any other tier,
     * the software projects whose `related:` names it; on a software project, the projects its own
     * `related:` names. One field, since the relation is one edge read from either side.
     */
    software: BoardTag[];
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
    /** The ids of the cards whose long description is drawn whole rather than cut to its clamp. */
    more: Id[];
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

/**
 * One venue of the stats strip: how many of the board's projects aim at it, and whether that warns.
 */
export type VenueCount = {
    id: Id;
    /** The registry's short name, which is what the chip carries. */
    short: string;
    /** The registry's full name, which is what the chip's tooltip carries. */
    name: string;
    count: number;
    /**
     * True from `venue_conc_warn` of config/behavior.yml up: too much of the board on one venue.
     */
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

/**
 * The three boards and the tiers each one shows. A view id outside this map is the first board, and
 * a tier no board names has no board: a software project is reached from the Code view and its own
 * tab rather than from a card list.
 */
const TIERS: Record<string, Tier[]> = {
    projects: ['ideas', 'active', 'manuscripts'],
    archive: ['archive'],
    coauthor: ['coauthor']
};

/** The board view ids, in the order presetFor knows them. A project of a board tier sits on one. */
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
    cols_archive: ['title', 'authors', 'venue', 'domain', 'pillar', 'funding']
};

/** Which `*_label_mode` of config/layout.yml a board starts in. */
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
    'pillar',
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
export const SESSIONS_VALUES = [SESSIONS_LIVE, SESSIONS_RECENT, SESSIONS_NONE];

/** The fixed values of the facets that have them, in the order their menu lists them. */
export const COMPUTE_VALUES = ['hpc', 'local', NONE];
export const CODE_VALUES = ['deposited', 'review-anon', 'none', NONE];
export const REPRODUCED_VALUES = ['1', '0'];

/** A finite number of the merged config, and no number for any other value. */
const finiteShape = z.number().optional().catch(undefined);

/** A number out of the merged config, and the fallback behavior.yml's own comment names. */
export function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    return readAs(finiteShape, config[key]) ?? fallback;
}

/** A JIF the registry wrote as nothing at all; the venue line leaves it out. */
const NO_JIF = ['', '-', 'none'];

/**
 * How near a deadline has to be for the badge to count days rather than show the date. It remains
 * here because no behavior config key names it.
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

/** One bucket of `tab_rollup`: a row with words, its id the slug of them, its keys the strings. */
const bucketShape = z
    .object({ label: z.string().min(1), keys: fieldItemsShape, color: wordShape })
    .transform((row) => ({
        id: slug(row.label),
        label: row.label,
        keys: row.keys,
        color: row.color
    })) satisfies z.ZodType<RollupBucket>;

const bucketsShape = rowsShape(bucketShape);

/** The `tab_rollup` buckets of one board, in the config's order. */
function rollupOf(config: Record<string, unknown>, id: string): RollupBucket[] {
    return readAs(bucketsShape, fields(config.tab_rollup)[id]) ?? [];
}

/** The columns of one board: the cells of its list, with the words `board:` gives each of them. */
function columnsOf(config: Record<string, unknown>, id: string): BoardColumn[] {
    const key = COLUMN_KEY[id] ?? COLUMN_KEY[DEFAULT_BOARD];
    const words = strings(fields(config.board)[key]);
    return COLUMNS[key].map((cell, at) => ({ key: cell, label: words[at] ?? cell }));
}

/** The `board.search` placeholder of one board. */
function searchOf(config: Record<string, unknown>, id: string): string {
    return str(fields(fields(config.board).search)[id]);
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

/**
 * The venue as the card writes it: name, quartile, JIF and cost, in that order, joined by a bar.
 */
export function venueText(venue: Venue): string {
    const parts = [venue.name];
    if (venue.quartile !== undefined && venue.quartile !== '') parts.push(venue.quartile);
    const jif = (venue.jif ?? '').trim();
    if (!NO_JIF.includes(jif.toLowerCase())) parts.push(`JIF ${jif}`);
    if (venue.free !== undefined && venue.free !== '') parts.push(venue.free);
    return parts.filter((part) => part !== '').join(' | ');
}

/** The authors field: a line as written, or a list of one name or more joined by commas. */
const authorsShape = z.union([
    z.string(),
    z
        .array(z.unknown())
        .min(1)
        .transform((names) => names.join(', '))
]);

/** The authors as one line: the list joined, the line as written, or the lead on its own. */
export function authorLine(project: Project): string {
    return readAs(authorsShape, project.authors) ?? project.lead ?? '';
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
