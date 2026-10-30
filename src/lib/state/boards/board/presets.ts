// Layer 2, client state. Board presets, shared types and display helpers live here because board
// configuration changes independently of items, filters and statistics. What each board is (the
// keys that say which projects it takes, its list columns, its search words, its label mode and how
// its cards are laid out) is its row of `boards` in config/defaults/layout.yml; the categories its
// cards are filed under and the roles are config/catalogs/vocab.yml's, read through
// data/shapes/boards/. A board over the records of several hubs reads each project under the words
// of its own hub, and draws its sections, slices, facets and stage order from the union of every
// hub's words. This module holds no table of boards: the board views the page registers are read
// from the same rows (`boardViews`), each named and drawn by the words its row names. Two presets
// no row names: the Awaiting box's board (`awaitingPreset`), which a name of the Focus board's
// Awaiting box opens for the projects it counts, and the Map's (`mapPreset`), which takes every
// project of every hub for the Map's bar.

import { z } from 'zod';
import type { Finding, Id, Project, Resource, Venue } from '../../../data/model/index.ts';
import { findingText, type TextCatalog } from '../../../data/helpers/finding-text.ts';
import { boardsGroup } from '../../../data/sources/config/rail.ts';
// `str` here is the shared `text`: a config value of the wrong type reads as the empty string.
import { focusSetting, text as str } from '../../../data/helpers/guards.ts';
import { readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';
import { vocabKeys, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { categoriesOf, type Category } from '../../../data/shapes/boards/categories.ts';
import { rolesOf, type Role } from '../../../data/shapes/boards/roles.ts';
import {
    boardRows,
    boardRuleOf,
    type BoardRule,
    type TakeWords
} from '../../../data/shapes/boards/takes.ts';
import type { WaitedOn } from '../waiting.ts';

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
     * without the user, the person marked `self: true` (team.ts beside this file, `shownTeam`).
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
     * it has none or no person is marked as the user.
     */
    role: string;
    /**
     * Whether the field of the highest role with a field, the project's `lead:`, names the person
     * `self` names, which draws the Lead badge.
     */
    lead: boolean;
    /**
     * Whether Mine only keeps the project: its role fields name the user, or it names no one; true
     * for every project when no person is marked as the user.
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
    /**
     * The values of the project's `waiting-on:` as state/boards/waiting.ts `waitedOn` gives them:
     * trimmed, the empty ones left out, each once, each named and with what it names. The card's
     * WAITING ON line draws them, and the bar's waiting toggle and Waiting on group filter by them.
     */
    waiting: WaitedOn[];
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
    /** The quick filter: only the projects waiting on someone or something. */
    waiting: boolean;
    /**
     * Mine only: only the projects whose role fields name the user and those naming no one. On
     * until the reader switches it off; drawn while a person is marked as the user, and applied
     * only where one of the board's projects is one it does not keep (state.ts, `offersMine`).
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
    /** How many wait on someone or something: their `waiting` is not empty. */
    waiting: number;
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

/**
 * The quick filters applyFilters is given beside the facets: stale, deadline, waiting and Mine
 * only.
 */
export type QuickFilters = {
    stale?: boolean;
    dated?: boolean;
    /** Waiting: only the items whose `waiting` is not empty. */
    waiting?: boolean;
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
    'waiting',
    'hub',
    'tier',
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

/** The glyph word of a board whose `glyph:` names no word of the text catalog. */
const BOARD_GLYPH = 'views.board_glyph';

/**
 * One project board's view as the page registers it: its view id, the catalog key of its name or,
 * when it names none, its key as `words` beside the empty label, the catalog key of its glyph, the
 * group of the view catalogue it sits in and its place there.
 */
export type BoardView = {
    id: string;
    label: string;
    words?: string;
    glyph: string;
    group: string;
    order: number;
};

/** The views of the project boards the page registers, and the findings of those it leaves out. */
export type BoardViews = { views: BoardView[]; findings: Finding[] };

/** The dotted key a board's field names when the text catalog holds it, else the empty text. */
function boardWord(row: Record<string, unknown>, field: string, catalog: TextCatalog): string {
    const key = str(row[field]);
    return key !== '' && Object.hasOwn(catalog, key) ? key : '';
}

/**
 * What the board views are read from, which the page is handed with its data and reads out of each
 * config push: the merged config's `boards:`, the group of the rail entry carrying `project_boards`
 * (`boardsGroup`, null when no entry carries it), and the file `boards:` was read from.
 */
export type BoardsSource = { boards: unknown; group: string | null; file: string };

/** The source of the board views of a merged config, `fileOf` giving the file of a key. */
export function boardsSource(
    config: Record<string, unknown>,
    fileOf: (key: string) => string
): BoardsSource {
    return { boards: config.boards, group: boardsGroup(config), file: fileOf('boards') };
}

/**
 * The views of the project boards of a merged config's `boards:`, one per board in the map's order,
 * numbered 1, 2, ... there, in the group of the rail entry carrying `project_boards` (in no group
 * when no entry carries it). A board is named by the word its `label:` names, else by its key, and
 * draws the glyph of the word its `glyph:` names, else of BOARD_GLYPH; the config check reports a
 * board naming no such word (data/sources/config/sections/boards.ts). A board whose key is in
 * `taken`, the ids of the views the modules register and the keys of the collection views, is left
 * out and gives a finding naming it, filed in the file `boards:` was read from, so no board
 * replaces another view.
 */
export function boardViews(
    source: BoardsSource,
    catalog: TextCatalog,
    taken: ReadonlySet<string>
): BoardViews {
    const group = source.group ?? '';
    const rows = boardRows({ boards: source.boards });
    const findings = rows
        .filter(([id]) => taken.has(id))
        .map(([id]) => ({
            file: source.file,
            key: `boards.${id}`,
            message: findingText(catalog, 'findings.config.boards_view', id)
        }));
    const views = rows
        .filter(([id]) => !taken.has(id))
        .map(([id, row], at): BoardView => {
            const label = boardWord(row, 'label', catalog);
            const glyph = boardWord(row, 'glyph', catalog);
            return {
                id,
                ...(label === '' ? { label: '', words: id } : { label }),
                glyph: glyph === '' ? BOARD_GLYPH : glyph,
                group,
                order: at + 1
            };
        });
    return { views, findings };
}

/** A board row's `cards`: `grid` when it says so, else `sections`. */
function cardsOf(row: Record<string, unknown>): CardsMode {
    return str(row.cards) === 'grid' ? 'grid' : 'sections';
}

/** The words of each hub a preset reads projects by, each hub's read once per preset. */
function wordsReader(vocab: WordsOf): (hub?: string) => BoardWords {
    const read = new Map<string | undefined, BoardWords>();
    return (hub) => {
        const held = read.get(hub);
        if (held !== undefined) return held;
        const own = vocab(hub);
        const made = { config: own, categories: categoriesOf(own), roles: rolesOf(own) };
        read.set(hub, made);
        return made;
    };
}

/**
 * What a board's row says of how its projects are drawn: its list columns, its label mode, other
 * than `full` being the short handle, and its search placeholder.
 */
function drawnBy(row: Record<string, unknown>): Pick<BoardPreset, 'columns' | 'labels' | 'search'> {
    return {
        columns: readAs(columnsShape, row.columns) ?? [],
        labels: str(row.label_mode) === 'full' ? 'full' : 'short',
        search: str(row.search)
    };
}

/**
 * The preset of one view id, read out of its row of `boards` in the merged config; a view id the
 * map does not hold is its first board. A config that holds no board gives a board that names no
 * key and so takes every project, with no columns to name. `vocab` gives the words of the records
 * of a hub, and the union of every hub's words for none (state/shared/words/tones.ts, `vocabOf`);
 * without it every project is read by the merged config.
 */
export function presetFor(
    view: string,
    config: Record<string, unknown> = {},
    vocab: WordsOf = () => config
): BoardPreset {
    const rows = boardRows(config);
    const [id, row] = rows.find(([one]) => one === view) ?? rows.at(0) ?? [view, {}];
    const words = wordsReader(vocab);
    const union = words();
    return {
        id,
        rule: boardRuleOf(row),
        ...drawnBy(row),
        categories: union.categories,
        roles: union.roles,
        stageOrder: vocabKeys(union.config.stages),
        cards: cardsOf(row),
        config,
        words
    };
}

/**
 * The view id of the Awaiting box's board, the one tab a name of the Focus board's Awaiting box
 * opens for that name (views/boards/focus/Focus.svelte).
 */
export const AWAITING_VIEW = 'awaiting_board';

/**
 * The preset of the Awaiting box's board of one name: exactly the projects of `ids`, the projects
 * the name counts (state/boards/focus/filter.ts `awaitingTake`), whatever boards exist; no project
 * the board's New project would write is among them, so it offers none. Its sections are the rows
 * of `categories:` of every hub's words, as a board of `boards:` draws them, and it draws its
 * projects as the first board of `boards:` other than one keyed with its own id does, by that row's
 * columns, label mode and search placeholder. An empty `ids`, a tab opened for no name, takes no
 * project.
 */
export function awaitingPreset(
    ids: readonly Id[],
    config: Record<string, unknown> = {},
    vocab: WordsOf = () => config
): BoardPreset {
    const words = wordsReader(vocab);
    const union = words();
    const [, row] = boardRows(config).find(([id]) => id !== AWAITING_VIEW) ?? [AWAITING_VIEW, {}];
    return {
        id: AWAITING_VIEW,
        rule: {
            tiers: null,
            roles: null,
            stages: null,
            chips: null,
            forms: null,
            hub: null,
            match: null,
            ids: [...ids]
        },
        ...drawnBy(row),
        categories: union.categories,
        roles: union.roles,
        stageOrder: vocabKeys(union.config.stages),
        cards: 'sections',
        config,
        words
    };
}

/** The id of the Map's preset, which no row of `boards:` names. */
const MAP_VIEW = 'map';

/**
 * The preset the Map filters its projects by: a rule of nulls, so it takes every project, the
 * done work at a terminal stage included (the Map's Stage group decides which stages are drawn),
 * with the categories, the roles and the stage order of every hub's words, and no columns, no
 * label mode and no search words of its own (`drawnBy` of an empty row).
 */
export function mapPreset(
    config: Record<string, unknown> = {},
    vocab: WordsOf = () => config
): BoardPreset {
    const words = wordsReader(vocab);
    const union = words();
    return {
        id: MAP_VIEW,
        rule: {
            tiers: null,
            roles: null,
            stages: null,
            chips: null,
            forms: null,
            hub: null,
            match: null,
            ids: null
        },
        ...drawnBy({}),
        categories: union.categories,
        roles: union.roles,
        stageOrder: vocabKeys(union.config.stages),
        cards: 'sections',
        config,
        words
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
