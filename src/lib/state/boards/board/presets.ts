// Layer 2, client state. Board presets, shared types and display helpers live here because board
// configuration changes independently of items, filters and statistics. What each board is (its
// tier, its list columns, its search words, its label mode and its groups of cards) is its row of
// `boards` in config/defaults/layout.yml; this module holds no table of boards.

import { z } from 'zod';
import type { Id, Project, Resource, Venue } from '../../../data/model/index.ts';
// `str` here is the shared `text`: a config value of the wrong type reads as the empty string.
import { fields, focusSetting, isMap, slugOf, text as str } from '../../../data/helpers/guards.ts';
import { fieldItemsShape, readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';
import { vocabKeys, wordsWith } from '../../../data/shapes/vocab-keys.ts';

/** The value a facet gives what has none: no year, no funding, no compute, no code deposit. */
export const NONE = '__none__';

/** Cards or a table. */
export type BoardMode = 'cards' | 'list';

/** A short handle where a manifest has one, or always the full title. */
export type LabelMode = 'short' | 'full';

/** One column of the list mode: the key its cell is read from a row by, and its heading. */
export type BoardColumn = { key: string; label: string };

/**
 * One group of cards of a board's `groups`: its id, its words, the stages, forms and chips it
 * catches, and the hue the config gives it, which the category facet draws its dot in.
 */
export type RollupBucket = { id: string; label: string; keys: string[]; color: string };

/** What one board is, as the config describes it. */
export type BoardPreset = {
    /** The view id this preset belongs to, a key of `boards`. */
    id: string;
    /** The tiers whose projects the board shows: the one its row names, or none. */
    tiers: string[];
    /** The list mode's columns in order, with the words config/defaults/layout.yml gives them. */
    columns: BoardColumn[];
    /** The groups of cards of this board, in the config's order. */
    rollup: RollupBucket[];
    /**
     * The order stages sort in, the keys of `stages`; a stage the list does not name sorts after
     * every stage it does.
     */
    stageOrder: string[];
    /** The tiers of `tiers` carrying `software`, whose projects are software. */
    softwareTiers: string[];
    /** The label mode the board starts in, from its row's `label_mode`. */
    labels: LabelMode;
    /**
     * The search box's placeholder from config/defaults/layout.yml, or the empty string when it has
     * none.
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

/** A tag for a project a personal project names: `held` is false when no project has the id. */
export type RelatedTag = BoardTag & { held: boolean };

/**
 * What a card's cross-link lines read: a project's board item, and the related projects a
 * personal project names.
 */
export type LinkedItem = Pick<
    BoardItem,
    'id' | 'pillars' | 'funding' | 'datasets' | 'collaborators' | 'software'
> & {
    project?: Pick<BoardItem['project'], 'tier'>;
    /** The projects a project's `related:` names. */
    related?: RelatedTag[];
};

/** One project as a board shows it: the entity, and every join a card or a row reads. */
export type BoardItem = {
    id: Id;
    project: Project;
    /** The hue of the project's stage, which the card's stage chip is filled with. */
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
    /**
     * The resources the project's `compute:` names, in the manifest's order: the key, the entry's
     * name, its kind, and the entry's position in the registry, which orders two resources of one
     * name in the facet menu.
     */
    compute: { id: string; label: string; kind: Resource['kind']; order: number }[];
    reproduced: boolean;
    /** The year as text, or the empty string when the manifest has none. */
    year: string;
    /** `live`, `recent` or `none`: what the sessions payload says about the project's folder. */
    sessions: string;
    /**
     * The project's form, when it has one, then its chips: the words the card's status row draws.
     */
    chips: string[];
    /** Everything the search reads, lower case, one string. */
    haystack: string;
    /** The projects a project's `related:` names. */
    related?: RelatedTag[];
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
     * The stages switched OFF, which is what the stage toggles hold. Every stage is on until one is
     * clicked, so a stage the hub grows later is on the day it appears rather than hidden by a
     * state saved before it existed.
     */
    hiddenStages: string[];
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
     * True from `venue_conc_warn` under `focus:` of config/defaults/behavior.yml up: too much of
     * the board on one venue.
     */
    warn: boolean;
};

/**
 * One stage of the board with how many are at it, in the order the board's own sort put them in.
 */
export type StageCount = { stage: string; count: number };

/** The quick filters and stage toggles applyFilters is given beside the facets. */
export type QuickFilters = {
    stale?: boolean;
    dated?: boolean;
    hiddenStages?: string[];
    /**
     * `stale_lag_days` under `focus:` of config/defaults/behavior.yml: how far behind counts as
     * behind.
     */
    staleLag?: number;
};

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
export const CODE_VALUES = ['deposited', 'review-anon', 'none', NONE];
export const REPRODUCED_VALUES = ['1', '0'];

/**
 * A number under `focus:` of the merged config (config/defaults/behavior.yml), and the fallback
 * behavior.yml's own comment names for one that is absent or no finite number.
 */
export function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    return focusSetting(config, key) ?? fallback;
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

/**
 * One group of a board's `groups`: a row with words, its id the slug of them, its keys the strings
 * of the list, or the one key written alone, as the options catalog's rule for a multi takes it.
 */
const bucketShape = z
    .object({
        label: z.string().min(1),
        keys: z.union([z.string().transform((key) => [key]), fieldItemsShape]),
        color: wordShape
    })
    .transform((row) => ({
        id: slugOf(row.label),
        label: row.label,
        keys: row.keys,
        color: row.color
    })) satisfies z.ZodType<RollupBucket>;

const bucketsShape = rowsShape(bucketShape);

/** One column of a board's `columns`: the cell it draws, headed by its words or the cell's name. */
const columnShape = z
    .object({ cell: z.string().min(1), label: wordShape })
    .transform((row) => ({ key: row.cell, label: row.label === '' ? row.cell : row.label }));

const columnsShape = rowsShape(columnShape) satisfies z.ZodType<BoardColumn[]>;

/**
 * The boards of `boards` of config/defaults/layout.yml, each id with its row, in the file's order.
 * A row that is not a map is no board.
 */
function boardRows(config: Record<string, unknown>): [string, Record<string, unknown>][] {
    return Object.entries(fields(config.boards)).flatMap(([id, row]) =>
        isMap(row) ? [[id, row] as [string, Record<string, unknown>]] : []
    );
}

/** The board view ids `boards` of the merged config names, in its order. */
export function boardIds(config: Record<string, unknown>): string[] {
    return boardRows(config).map(([id]) => id);
}

/** The tier a board shows, as a list of the one word, or none for a row naming none. */
function boardTiers(row: Record<string, unknown>): string[] {
    const tier = str(row.tier).trim();
    return tier === '' ? [] : [tier];
}

/** The tiers of `tiers` in the merged config that carry `software`. */
export function softwareTiers(config: Record<string, unknown>): string[] {
    return wordsWith(config, 'tiers', 'software');
}

/**
 * The preset of one view id, read out of its row of `boards` in the merged config; a view id the
 * map does not hold is its first board. A config that holds no board gives a board with no tier,
 * no columns to name, no groups and no stage order, which still renders: it holds no card, and the
 * category facet is not offered. A label mode other than `full` is the short handle.
 */
export function presetFor(view: string, config: Record<string, unknown> = {}): BoardPreset {
    const rows = boardRows(config);
    const [id, row] = rows.find(([one]) => one === view) ?? rows.at(0) ?? [view, {}];
    return {
        id,
        tiers: boardTiers(row),
        columns: readAs(columnsShape, row.columns) ?? [],
        rollup: readAs(bucketsShape, row.groups) ?? [],
        stageOrder: vocabKeys(config.stages),
        softwareTiers: softwareTiers(config),
        labels: str(row.label_mode) === 'full' ? 'full' : 'short',
        search: str(row.search)
    };
}

/**
 * The lifecycle bucket of one project: the first bucket of the rollup whose keys name the project's
 * stage, its form or one of its chips. A project no bucket catches has none, which is the empty
 * string.
 */
export function bucketOf(project: Project, rollup: RollupBucket[]): string {
    const words = [project.stage, project.form, ...project.chips];
    for (const bucket of rollup) {
        if (words.some((word) => word !== undefined && bucket.keys.includes(word)))
            return bucket.id;
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
 * never ends mid-word without saying that there is more. A first word longer than `limit` is cut
 * inside itself, except a web address, which is kept whole, since the card draws it as a link and
 * a cut one names no page.
 */
export function firstSentence(text: string, limit: number): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    if (flat === '') return '';
    const end = /[.!?](\s|$)/.exec(flat);
    const sentence = end === null ? flat : flat.slice(0, end.index + 1);
    if (sentence.length <= limit) return sentence;
    const cut = sentence.slice(0, limit);
    const space = cut.lastIndexOf(' ');
    if (space > 0) return `${cut.slice(0, space).trimEnd()}...`;
    const word = sentence.split(' ')[0];
    return `${/^https?:\/\//.test(word) ? word : cut}...`;
}
