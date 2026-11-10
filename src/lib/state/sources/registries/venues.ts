// Layer 2, client state. Pure venue filtering, project joins, tones and conference timing, and the
// sections of the Venues view, one per row of `venue_categories` of config/catalogs/vocab.yml and
// one for the venues no row names. The view receives ready-to-draw sections and month columns, so
// its markup contains no data rules and names no category. The tones of a venue's rank and cost,
// its biennial mark and whether its JIF names none are read from `venue_ranks`, `venue_costs`,
// `venue_biennial` and `venue_no_jif` of the words the caller passes; a tone is taken through
// state/shared/words/tones.ts `wordsTone`, whose module reads the configuration's generation, a
// Svelte rune.

import { z } from 'zod';
import type { Project, Venue } from '../../../data/model/index.ts';
import { categoriesBy, isArchival } from '../../../data/shapes/boards/categories.ts';
import { focusNumber } from '../../../data/sources/config/sections/focus.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import {
    fieldItemsShape,
    mapShape,
    readAs,
    readOr,
    rowsShape,
    searchRevealShape
} from '../../../data/shapes/shapes.ts';
import { hasWord, recordWords, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { UNKNOWN_TONE, wordsTone } from '../../shared/words/tones.ts';

/**
 * The projects targeting a venue, and `concentrated`, the warning count their real live ones reach
 * (`venue_conc_warn`), null while they reach none.
 */
export type VenueUse = { projects: Project[]; concentrated: number | null };
export type TimelineChip = { venue: Venue; biennial: boolean };
export type TimelineMonth = {
    index: number;
    name: string;
    current: boolean;
    deadlines: TimelineChip[];
    held: TimelineChip[];
};
export type NextDeadline = { venue: Venue; month: number; distance: number };
export type VenueTimeline = { months: TimelineMonth[]; next: NextDeadline[]; counts: number[] };

export type VenuesState = {
    search: string;
    off: string[];
    /** The keys of the folded sections, the empty key for the "other" section. */
    folded: string[];
    reveal?: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/**
 * The real projects, which what says how active a record is reads (a venue's concentration, a
 * pillar's or a domain's dormant look, a pillar's in-flight and tier metrics) and the Orphans card
 * counts: every project whose category, the first row of `categories:` holding it, does not carry
 * `archival: true`. A project in no category is real. A project is filed under its own hub's words
 * when `wordsOf` gives them (`categoriesBy`).
 */
export function realProjects(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    const filed = categoriesBy(config, wordsOf);
    return projects.filter((project) => {
        const { words, categories } = filed(project);
        return !isArchival(project, categories, words);
    });
}

/**
 * The projects targeting one venue, dead ends included, the one list the venue's card, its page's
 * row and its board read, with the concentration marker: `venue_card_warn` of `focus:`
 * (`focusNumber`) or more real ones among them at a stage carrying `live` in `stages` of their own
 * hub's words; no marker before the page holds the settings.
 */
export function venueUsers(
    venue: Venue,
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): VenueUse {
    const users = projects.filter((project) => project.venueId === venue.id);
    const live = realProjects(users, config, wordsOf).filter((project) =>
        hasWord(recordWords(config, wordsOf, project), 'stages', 'live', project.stage)
    );
    const warnAt = focusNumber(config, 'venue_card_warn');
    const reached = warnAt !== null && live.length >= warnAt;
    return { projects: users, concentrated: reached ? warnAt : null };
}

/**
 * The tone of a venue's free-text field by a map of `words` from a fragment to a colour,
 * `venue_ranks` for its `quartile` and `venue_costs` for its `free`: the hue the palette of
 * `words` maps the colour of the first fragment of the map, in the map's order, that the text
 * holds with case ignored to, and the unknown tone when it holds none.
 */
export function venueTone(
    value: string | undefined,
    key: 'venue_ranks' | 'venue_costs',
    words: Record<string, unknown>
): string {
    const text = (value ?? '').toLowerCase();
    const colours = readAs(mapShape, words[key]) ?? {};
    const fragment = Object.keys(colours).find(
        (one) => one !== '' && text.includes(one.toLowerCase())
    );
    const hex = fragment === undefined ? undefined : byKey(colours, fragment);
    return wordsTone(hex, words) ?? UNKNOWN_TONE;
}

/** One-based month number from a month word, or zero when it is not a month. */
export function monthIndex(word: string | undefined): number {
    if (word === undefined) return 0;
    const short = word.trim().slice(0, 3).toLowerCase();
    const at = MONTHS.findIndex((month) => month.toLowerCase() === short);
    return at < 0 ? 0 : at + 1;
}

/**
 * Whether the catalogue says the venue runs every other year: its `quartile` or its `timing` holds
 * a text of `venue_biennial` of `words`, case ignored.
 */
export function isBiennial(venue: Venue, words: Record<string, unknown>): boolean {
    const text = `${venue.quartile ?? ''} ${venue.timing ?? ''}`.toLowerCase();
    const marks = readOr(z.array(z.string()), words.venue_biennial, []);
    return marks.some((mark) => mark !== '' && text.includes(mark.toLowerCase()));
}

/**
 * Whether a venue's `jif` names no impact factor: it is empty once trimmed, or, trimmed and with
 * case ignored, a text of `venue_no_jif` of `words`.
 */
export function noJif(jif: string | undefined, words: Record<string, unknown>): boolean {
    const text = (jif ?? '').trim().toLowerCase();
    const none = readOr(z.array(z.string()), words.venue_no_jif, []);
    return text === '' || none.some((one) => one.trim().toLowerCase() === text);
}

/**
 * Twelve conference month columns and the seven nearest deadlines from the current month, each
 * venue's biennial mark read under the words of its own hub (`wordsOf`).
 */
export function timeline(
    venues: Venue[],
    todayMonth: number | string,
    wordsOf: WordsOf
): VenueTimeline {
    const current =
        typeof todayMonth === 'number'
            ? Math.min(12, Math.max(1, todayMonth))
            : monthIndex(todayMonth);
    const months: TimelineMonth[] = MONTHS.map((name, at) => ({
        index: at + 1,
        name,
        current: at + 1 === current,
        deadlines: [],
        held: []
    }));
    for (const venue of venues) {
        const deadline = monthIndex(venue.deadlineMonth);
        const held = monthIndex(venue.heldMonth);
        const chip = { venue, biennial: isBiennial(venue, wordsOf(rootOf(venue))) };
        if (deadline > 0) months[deadline - 1].deadlines.push(chip);
        if (held > 0) months[held - 1].held.push(chip);
    }
    const next = venues
        .map((venue) => ({ venue, month: monthIndex(venue.deadlineMonth) }))
        .filter((item) => item.month > 0)
        .map((item) => ({ ...item, distance: (item.month - current + 12) % 12 }))
        .sort((a, b) => a.distance - b.distance || a.venue.name.localeCompare(b.venue.name))
        .slice(0, 7);
    const counts = months.map((month) => month.deadlines.length);
    return { months, next, counts };
}

/**
 * The heights of the deadline density bars, in eighths of the line: seven steps from none to seven
 * eighths, the heights of the block ramp the line is drawn after (no bar, then the one-, two-,
 * three-, five-, six- and seven-eighths blocks). A month's step is its count over the busiest
 * month's, so the busiest is the tallest bar and a month with none has no bar.
 */
export const SPARK_STEPS = [0, 1, 2, 3, 5, 6, 7];

/** The height of the whole line, in the eighths SPARK_STEPS counts in. */
export const SPARK_HEIGHT = 8;

/** One bar height per count, in eighths of the line, as SPARK_STEPS gives them. */
export function sparkBars(counts: number[]): number[] {
    const peak = Math.max(...counts, 1);
    const top = SPARK_STEPS.length - 1;
    return counts.map((count) => SPARK_STEPS[Math.min(top, Math.round((count / peak) * top))]);
}

/** Search venue name, short name, scope and themes using every supplied word. */
export function venueSearch(venues: Venue[], words: string | string[]): Venue[] {
    const needles = (Array.isArray(words) ? words : words.split(/\s+/))
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word !== '');
    if (needles.length === 0) return venues;
    return venues.filter((venue) => {
        const haystack = [venue.name, venue.short ?? '', venue.wants ?? '', ...venue.themes]
            .join(' ')
            .toLowerCase();
        return needles.every((word) => haystack.includes(word));
    });
}

/** The fields a Venues instance keeps, each read as absent when wrong. */
const venuesStateShape = searchRevealShape.extend({
    off: fieldItemsShape,
    folded: fieldItemsShape
});

/** Saved state of one Venues instance, with defaults for malformed or absent fields. */
export function parseVenuesState(raw: unknown): VenuesState {
    const held = readAs(venuesStateShape, raw);
    const state: VenuesState = {
        search: held?.search ?? '',
        off: held?.off ?? [],
        folded: held?.folded ?? []
    };
    if (held?.reveal !== undefined) state.reveal = held.reveal;
    return state;
}

export type { Project, Venue } from '../../../data/model/index.ts';

/**
 * One section of the Venues view: a row of `venue_categories` with the venues filed under it, or
 * the "other" section, whose key is the empty text, of the venues no row names.
 */
export type VenueSection = { key: string; label: string; ribbon: boolean; venues: Venue[] };

/**
 * A row of `venue_categories` as the sections read it: a text key of at least one character, so
 * none is the "other" section's, its label, the key when it names none, and its ribbon flag. The
 * config check words a row of another form (data/shapes/catalog-files/vocab.ts).
 */
const sectionRowShape = z
    .looseObject({
        key: z.string().min(1),
        label: z.unknown().optional(),
        ribbon: z.unknown().optional()
    })
    .transform((row) => ({
        key: row.key,
        label: typeof row.label === 'string' && row.label !== '' ? row.label : row.key,
        ribbon: row.ribbon === true
    }));

/**
 * The sections of the Venues view over the venues given: one per row of `venue_categories` of the
 * words given (the union of every hub's, state/shared/words/tones.ts `vocabOf`), in the list's
 * order, each key once with the first row naming it, holding the venues whose `category` is its
 * key; then the "other" section of the venues whose category no row names, none included. A value
 * of the list that is no row reads as no section. Each section holds its venues in the order
 * given, and a section that holds none is left out.
 */
export function venueSections(
    venues: readonly Venue[],
    words: Record<string, unknown>
): VenueSection[] {
    const rows = readAs(rowsShape(sectionRowShape), words.venue_categories) ?? [];
    const named = new Set<string>();
    const sections: VenueSection[] = [];
    for (const row of rows) {
        if (named.has(row.key)) continue;
        named.add(row.key);
        sections.push({ ...row, venues: venues.filter((venue) => venue.category === row.key) });
    }
    const other = venues.filter((venue) => !named.has(venue.category ?? ''));
    sections.push({ key: '', label: '', ribbon: false, venues: other });
    return sections.filter((section) => section.venues.length > 0);
}
