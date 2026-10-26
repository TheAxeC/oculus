// Layer 2, client state. Pure venue filtering, project joins, tones and conference timing, and the
// sections of the Venues view, one per row of `venue_categories` of config/catalogs/vocab.yml and
// one for the venues no row names. The view receives ready-to-draw sections and month columns, so
// its markup contains no data rules and names no category.

import { z } from 'zod';
import type { Project, Venue } from '../../../data/model/index.ts';
import { categoriesBy, isArchival } from '../../../data/shapes/boards/categories.ts';
import {
    fieldItemsShape,
    readAs,
    rowsShape,
    searchRevealShape
} from '../../../data/shapes/shapes.ts';
import { hasWord, recordWords, type WordsOf } from '../../../data/shapes/vocab-keys.ts';

export type VenueUse = { projects: Project[]; concentrated: boolean };
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
 * The real projects, which the venue use and concentration counts, the Orphans card and the pillar
 * and domain members read: every project whose category, the first row of `categories:` holding
 * it, does not carry `archival: true`. A project in no category is real. A project is filed under
 * its own hub's words when `wordsOf` gives them (`categoriesBy`).
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
 * Projects targeting one venue, with the concentration marker: two or more of them at a stage
 * carrying `live` in `stages` of their own hub's words.
 */
export function venueUsers(
    venue: Venue,
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): VenueUse {
    const users = projects.filter((project) => project.venueId === venue.id);
    const live = users.filter((project) =>
        hasWord(recordWords(config, wordsOf, project), 'stages', 'live', project.stage)
    );
    return { projects: users, concentrated: live.length >= 2 };
}

/** Tone of a venue's rank, kept for the card's hue although the rank is drawn as a plain tag. */
export function quartileTone(value: string | undefined): string {
    const word = (value ?? '').toLowerCase();
    if (word.includes('q1') || word.includes('a*') || word.includes('prestige')) return 'violet';
    if (word.includes('q2') || word.includes('core a')) return 'blue';
    return 'grey';
}

/** Tone of a venue's cost, kept for the card's hue although the cost is drawn as a plain tag. */
export function freeTone(value: string | undefined): string {
    const word = (value ?? '').toLowerCase();
    if (word.includes('free')) return 'green';
    if (word.includes('hybrid')) return 'amber';
    if (word.includes('apc')) return 'red';
    return 'grey';
}

/** One-based month number from a month word, or zero when it is not a month. */
export function monthIndex(word: string | undefined): number {
    if (word === undefined) return 0;
    const short = word.trim().slice(0, 3).toLowerCase();
    const at = MONTHS.findIndex((month) => month.toLowerCase() === short);
    return at < 0 ? 0 : at + 1;
}

/** Whether the catalogue says the venue runs every other year. */
export function isBiennial(venue: Venue): boolean {
    return `${venue.quartile ?? ''} ${venue.timing ?? ''}`.toLowerCase().includes('biennial');
}

/** Twelve conference month columns and the seven nearest deadlines from the current month. */
export function timeline(venues: Venue[], todayMonth: number | string): VenueTimeline {
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
        const chip = { venue, biennial: isBiennial(venue) };
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
