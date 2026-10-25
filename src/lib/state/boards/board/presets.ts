// Layer 2, client state. Board presets, shared types and display helpers live here because board
// configuration changes independently of items, filters and statistics. What each board is (the
// keys that say which projects it takes, its list columns, its search words, its label mode and
// how its cards are laid out) is its row of `boards` in config/defaults/layout.yml; the categories
// its cards are filed under and the roles are config/catalogs/vocab.yml's, read through
// data/shapes/boards/. A board over the records of several hubs reads each project under the words
// of its own hub, and draws its sections, slices, facets and stage order from the union of every
// hub's words. This module holds no table of boards.

import { z } from 'zod';
import type { Id, Project, Resource, Venue } from '../../../data/model/index.ts';
// `str` here is the shared `text`: a config value of the wrong type reads as the empty string.
import { focusSetting, text as str } from '../../../data/helpers/guards.ts';
import { readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';
import { vocabKeys } from '../../../data/shapes/vocab-keys.ts';
import { categoriesOf, type Category } from '../../../data/shapes/boards/categories.ts';
import { rolesOf, type Role } from '../../../data/shapes/boards/roles.ts';
import {
    boardRows,
    boardRuleOf,
    type BoardRule,
    type TakeWords
} from '../../../data/shapes/boards/takes.ts';

/** The value a facet gives what has none: no year, no funding, no compute, no code deposit. */
export const NONE = '__none__';

/** Cards or a table. */
export type BoardMode = 'cards' | 'list';

/** A short handle where a manifest has one, or always the full title. */
export type LabelMode = 'short' | 'full';

/** How the card mode lays the cards out: one section per category, or one grid. */
type CardsMode = 'sections' | 'grid';

/** One column of the list mode: the key its cell is read from a row by, and its heading. */
export type BoardColumn = { key: string; label: string };

/**
 * The words a board reads the projects of one hub by: the hub's words of config/catalogs/vocab.yml
 * as `config`, its categories and its roles.
 */
type BoardWords = TakeWords & { categories: Category[] };

/** What one board is, as the config describes it. */
export type BoardPreset = {
    /** The view id this preset belongs to, a key of `boards`. */
    id: string;
    /** Which projects the board takes: its row's `tier`, `role`, blocks, `hub` and `match`. */
    rule: BoardRule;
    /** The list mode's columns in order, with the words config/defaults/layout.yml gives them. */
    columns: BoardColumn[];
    /**
     * The rows of `categories` of every hub's words, in their order, which the board's sections
     * and its slices are drawn by.
     */
    categories: Category[];
    /** The rows of `roles` of every hub's words, highest first. */
    roles: readonly Role[];
    /**
     * The order stages sort in, the keys of `stages` of every hub's words; a stage the list does
     * not name sorts after every stage it does.
     */
    stageOrder: string[];
    /** The label mode the board starts in, from its row's `label_mode`. */
    labels: LabelMode;
    /** How the card mode lays the cards out, from its row's `cards`, `sections` by default. */
    cards: CardsMode;
    /** The merged config, whose `boards` row and settings the board reads. */
    config: Record<string, unknown>;
    /**
     * The words the projects of the hub `hub` are read by, a project's category and role among
     * them, and with no hub the union of every hub's words.
     */
    words: (hub?: string) => BoardWords;
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

/**
 * A tag on a card: the id a filter names it by, the words the chip carries, and, for a pillar whose
 * entry writes one as `#rrggbb`, its `color`, which a picked pillar is filled in.
 */
export type BoardTag = { id: Id; label: string; color?: string };

/** A tag for a related project, either way: `held` is false when no project has the id. */
export type RelatedTag = BoardTag & { held: boolean };

/**
 * What a card's cross-link lines read: a project's board item, with its venue, and its related
 * projects.
 */
export type LinkedItem = Pick<
    BoardItem,
    'id' | 'pillars' | 'funding' | 'datasets' | 'team' | 'venue'
> & {
    /** The projects a project's `related:` names, and those whose `related:` names it. */
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
    /** The venue joined through `venue`: the card's line and the list row's short name. */
    venue: { id: Id; text: string; short: string } | null;
    pillars: BoardTag[];
    funding: BoardTag[];
    datasets: BoardTag[];
    /**
     * The project's team as the views show it, each person by their name: the people of its
     * `lead:`, then those of its `collaborators:`, then those of its `supervisors:`, each once,
     * without the person the workspace setting `self` names (team.ts beside this file,
     * `shownTeam`).
     */
    team: BoardTag[];
    /** The team as one line (`teamLine`), which the list's With column draws. */
    teamLine: string;
    /**
     * The key of the project's category, the first row of `categories` that holds it, or the empty
     * string when none does.
     */
    category: string;
    /**
     * The project's slice of the board's second bar line, `<category key>/<stage or form>`
     * (facets.ts, `sliceValue`), or the empty string for a project with no stage.
     */
    slice: string;
    /**
     * The key of the user's role on the project (`roles` of vocab.yml), or the empty string when
     * it has none or the workspace names no `self`.
     */
    role: string;
    /**
     * Whether the field of the highest role with a field, the project's `lead:`, names the person
     * `self` names, which draws the Lead badge.
     */
    lead: boolean;
    /**
     * Whether Mine only keeps the project: its role fields name the user, or it names no one; true
     * for every project when the workspace names no `self`.
     */
    mine: boolean;
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
     * The Form and Situation facets read the form and the chips apart, from `project`.
     */
    chips: string[];
    /** Everything the search reads, lower case, one string. */
    haystack: string;
    /** The projects a project's `related:` names, and those whose `related:` names it. */
    related?: RelatedTag[];
};

/**
 * One value of one facet: what a filter stores, the words its list says, how many carry it, and the
 * hue of a value that has a colour of its own (a slice, a domain, a pillar).
 */
export type FacetValue = { value: string; label: string; count: number; tone?: string };

/** One facet: the key a filter is stored under, and its values in the order the menu lists them. */
export type Facet = { key: string; values: FacetValue[] };

/** What one open board remembers, per view instance. */
export type BoardState = {
    mode: BoardMode;
    search: string;
    /** Selected values by facet key. Empty, or absent, is no filter on that facet. */
    filters: Record<string, string[]>;
    /** The ids of the cards whose long description is drawn whole rather than cut to its clamp. */
    more: Id[];
    labels: LabelMode;
    /** The quick filter: only the projects whose manifest is behind their documents. */
    stale: boolean;
    /** The quick filter: only the projects that carry a deadline. */
    dated: boolean;
    /**
     * Mine only: only the projects whose role fields name the user and those naming no one. On
     * until the reader switches it off; drawn while the workspace names a `self`, and applied only
     * where one of the board's projects is one it does not keep (state.ts, `offersMine`).
     */
    mine: boolean;
    /** The keys of the folded sections, the empty key for the "other" section. */
    folded: string[];
    /**
     * The cells of the list's columns the reader shows, in the board's order, and absent for the
     * board's own `columns`.
     */
    columns?: string[];
};

/** The counts the board's controls carry, over the board's projects before any filter. */
export type BoardStats = {
    /** How many projects the board holds. */
    projects: number;
    /** How many carry a chip whose word of `chips` carries the flag `blocked`. */
    blocked: number;
    /** How many carry a deadline. */
    dated: number;
    /** `venue_conc_warn` under `focus:` of config/defaults/behavior.yml. */
    warnAt: number;
    /** The venues that many projects at a stage flagged `live` aim at, most aimed at first. */
    venues: VenueCount[];
};

/** One venue the board warns on: how many of its live projects aim at it. */
export type VenueCount = {
    id: Id;
    /** The registry's short name, its full name where it has none. */
    short: string;
    count: number;
};

/** The quick filters applyFilters is given beside the facets: stale, deadline and Mine only. */
export type QuickFilters = {
    stale?: boolean;
    dated?: boolean;
    /** Mine only: only the items whose `mine` is true. */
    mine?: boolean;
    /**
     * `stale_lag_days` under `focus:` of config/defaults/behavior.yml: how far behind counts as
     * behind.
     */
    staleLag?: number;
};

/**
 * The facets, in the order the bar offers them: the slices of its second line, then the group
 * buttons of its first line, then the groups its More list holds.
 */
export const FACETS = [
    'slice',
    'form',
    'status',
    'role',
    'year',
    'domain',
    'venue',
    'hub',
    'pillar',
    'funding',
    'dataset',
    'compute',
    'reproduced',
    'code',
    'sessions'
];

/**
 * The cells a board's list can draw, in the order its Columns menu lists those its `columns` do
 * not name; config/options/layout.yml offers the same cells to `columns`.
 */
export const LIST_CELLS = [
    'title',
    'stage',
    'venue',
    'lane',
    'next',
    'with',
    'domain',
    'pillar',
    'funding'
];

/**
 * Where a stage sorts in `order`, the keys of `stages`: its place there, and after every stage the
 * order names for a stage it does not name or no stage at all.
 */
export function stageRank(stage: string | undefined, order: readonly string[]): number {
    const at = stage === undefined ? -1 : order.indexOf(stage);
    return at < 0 ? order.length : at;
}

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

/** One column of a board's `columns`: the cell it draws, headed by its words or the cell's name. */
const columnShape = z
    .object({ cell: z.string().min(1), label: wordShape })
    .transform((row) => ({ key: row.cell, label: row.label === '' ? row.cell : row.label }));

const columnsShape = rowsShape(columnShape) satisfies z.ZodType<BoardColumn[]>;

/** The board view ids `boards` of the merged config names, in its order. */
export function boardIds(config: Record<string, unknown>): string[] {
    return boardRows(config).map(([id]) => id);
}

/** A board row's `cards`: `grid` when it says so, else `sections`. */
function cardsOf(row: Record<string, unknown>): CardsMode {
    return str(row.cards) === 'grid' ? 'grid' : 'sections';
}

/**
 * The preset of one view id, read out of its row of `boards` in the merged config; a view id the
 * map does not hold is its first board. A config that holds no board gives a board that names no
 * key and so takes every project, with no columns to name. A label mode other than `full` is the
 * short handle. `vocab` gives the words of the records of a hub, and the union of every hub's
 * words for none (state/shared/words/tones.ts, `vocabOf`); without it every project is read by the
 * merged config. Each hub's words are read once per preset.
 */
export function presetFor(
    view: string,
    config: Record<string, unknown> = {},
    vocab: (hub?: string) => Record<string, unknown> = () => config
): BoardPreset {
    const rows = boardRows(config);
    const [id, row] = rows.find(([one]) => one === view) ?? rows.at(0) ?? [view, {}];
    const read = new Map<string | undefined, BoardWords>();
    const words = (hub?: string): BoardWords => {
        const held = read.get(hub);
        if (held !== undefined) return held;
        const own = vocab(hub);
        const made = { config: own, categories: categoriesOf(own), roles: rolesOf(own) };
        read.set(hub, made);
        return made;
    };
    const union = words();
    return {
        id,
        rule: boardRuleOf(row),
        columns: readAs(columnsShape, row.columns) ?? [],
        categories: union.categories,
        roles: union.roles,
        stageOrder: vocabKeys(union.config.stages),
        labels: str(row.label_mode) === 'full' ? 'full' : 'short',
        cards: cardsOf(row),
        config,
        words,
        search: str(row.search)
    };
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

/**
 * The team line: the names of a project's team as the views show it (`BoardItem.team`), the lead
 * first, joined by commas, and the empty text for a team that is only the user or nobody.
 */
export function teamLine(team: readonly BoardTag[]): string {
    return team.map((tag) => tag.label).join(', ');
}

/**
 * The words of a label up to its first " (", so "de-risking (feasibility experiment)" reads
 * "de-risking": what a slice and the list's stage chip draw, the whole label being their tip.
 */
export function shortWords(label: string): string {
    const at = label.indexOf(' (');
    return at < 0 ? label : label.slice(0, at);
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
