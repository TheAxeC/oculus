// Layer 2, client state. Pure rail-badge counts over collection and feed records. The reactive
// adapter beside it supplies the snapshot, socket feeds, config and current time.

import { fields, isMap, scalar } from '../../../data/helpers/guards.ts';
import { daysUntil } from '../../boards/board/index.ts';
import { deadlineOf, isClosed } from '../../feeds/leads.ts';
import { daysSince } from '../../feeds/feeds.ts';

/**
 * One view's row of the `counts` map of config/defaults/layout.yml as the page reads it; a field
 * the row does not hold reads as nothing. What is wrong with a row is a finding of the config check
 * (data/sources/config/sections/counts.ts), which takes a field the way this reads it.
 */
export type CountRow = {
    /** Whether the view's tabs and its catalogue entry draw its count. */
    tab: boolean;
    /** Whether the badge of the rail button of the page the view is on sums its count. */
    rail: boolean;
    /** The entry statuses a collection counts, trimmed and in lower case. */
    match: string[];
    /** The word a collection's count says on hover, or the empty text. */
    label: string;
    /** The urgency tone a collection's count is drawn in, or the empty text. */
    tone: string;
    /** How many days ahead Position Leads counts an open lead's deadline, or null. */
    days: number | null;
};

/** The row of one view, or null for a view with no row or a row that is not a map. */
export function countRow(config: Record<string, unknown>, view: string): CountRow | null {
    const row = fields(config.counts)[view];
    if (!isMap(row)) return null;
    // A status written alone is one status, as the options catalog's rule for a multi takes it.
    const match: unknown[] = Array.isArray(row.match) ? row.match : [row.match];
    const days = row.days;
    return {
        tab: row.tab === true,
        rail: row.rail === true,
        match: match.flatMap((one) => (typeof one === 'string' ? [one.trim().toLowerCase()] : [])),
        label: typeof row.label === 'string' ? row.label : '',
        tone: typeof row.tone === 'string' ? row.tone.trim() : '',
        days: typeof days === 'number' && Number.isFinite(days) && days >= 0 ? days : null
    };
}

/** The project fields a board's groups read. */
export type BadgeProject = { stage?: string; form?: string; chips: string[] };

/** One group of a board's `groups`, before its colour is resolved to a theme tone. */
export type BadgeBucket = { label: string; keys: string[]; color: string };

/** One count of a board's groups, carrying the group's words and its configured colour. */
export type RollupCount = { count: number; label: string; color: string };

/**
 * Count the collection entries whose `fields.status`, trimmed and in lower case, is one of the
 * statuses of `match` (its `counts` row's, already in that form).
 */
export function matchedEntries(
    entries: { fields: Record<string, unknown> }[],
    match: readonly string[]
): number {
    const matched = new Set(match);
    return entries.filter((entry) => matched.has(scalar(entry.fields.status).trim().toLowerCase()))
        .length;
}

/** Count open Position Leads whose deadline is from today through the configured window. */
export function leadsDue(
    config: Record<string, unknown>,
    entries: Record<string, unknown>[],
    windowDays: number | null,
    now: number
): number {
    if (windowDays === null) return 0;
    return entries.filter((entry) => {
        if (isClosed(config, entry.status)) return false;
        const days = daysUntil(deadlineOf(entry.deadline) ?? '', now);
        return days !== null && days >= 0 && days <= windowDays;
    }).length;
}

/** Whether the newest LinkedIn post is older than the configured cadence. */
export function linkedinOverdue(
    lastPost: string | null,
    cadenceDays: number | null,
    now: number
): boolean {
    if (cadenceDays === null) return false;
    const days = daysSince(lastPost, now);
    return days !== null && days > cadenceDays;
}

/**
 * Count each project in the first group whose keys hold its stage, its form or one of its chips.
 */
export function rollup(projects: BadgeProject[], buckets: BadgeBucket[]): RollupCount[] {
    const counts = buckets.map(() => 0);
    for (const project of projects) {
        const values = new Set([project.stage, project.form, ...project.chips]);
        const at = buckets.findIndex((bucket) => bucket.keys.some((key) => values.has(key)));
        if (at >= 0) counts[at] += 1;
    }
    return buckets.map((bucket, at) => ({
        label: bucket.label,
        count: counts[at],
        color: bucket.color
    }));
}

/** Badge text, with zero represented by the empty string no badge draws. */
export function countText(count: number): string {
    return count > 0 ? String(count) : '';
}
