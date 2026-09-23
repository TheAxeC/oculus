// Layer 2, client state. Pure rail-badge counts over collection and feed records. The reactive
// adapter beside it supplies the snapshot, socket feeds, config and current time.

import { scalar } from '../../data/helpers/guards.ts';
import { daysUntil } from '../boards/board/index.ts';
import { deadlineOf, isClosed } from '../feeds/leads.ts';
import { daysSince } from '../feeds/feeds.ts';

export type LiveRule = { match: string[]; label?: string; tone?: string };

/** The project fields a split or rollup reads. */
export type BadgeProject = { type?: string; chips: string[] };

/** One configured rollup bucket, before its colour is resolved to a theme tone. */
export type BadgeBucket = { label: string; keys: string[]; color: string };

/** One count in a split, named by the project type it counts. */
export type SplitCount = { count: number; label: string };

/** One count in a configured rollup, carrying the bucket's configured colour. */
export type RollupCount = SplitCount & { color: string };

function record(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

/** One collection's rule from `nav_live`: the statuses counted and an optional urgency tone. */
export function liveRule(config: Record<string, unknown>, key: string): LiveRule | null {
    const row = record(record(config.nav_live)?.[key]);
    if (row === null || !Array.isArray(row.match)) return null;
    const match = row.match
        .filter((status): status is string => typeof status === 'string')
        .map((status) => status.trim().toLowerCase());
    if (match.length === 0) return null;
    const rule: LiveRule = { match };
    if (typeof row.label === 'string') rule.label = row.label;
    if (typeof row.tone === 'string' && row.tone !== '') rule.tone = row.tone;
    return rule;
}

/** Count collection entries whose `fields.status` belongs to one configured live set. */
export function liveEntries(
    entries: { fields: Record<string, unknown> }[],
    rule: LiveRule | null
): number {
    if (rule === null) return 0;
    const matched = new Set(rule.match);
    return entries.filter((entry) => matched.has(scalar(entry.fields.status).trim().toLowerCase()))
        .length;
}

/** Count open Position Leads whose deadline is from today through the configured window. */
export function leadsDue(
    entries: Record<string, unknown>[],
    windowDays: number | null,
    now: number
): number {
    if (windowDays === null) return 0;
    return entries.filter((entry) => {
        if (isClosed(entry.status)) return false;
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

/** A finite number from merged config, or null when that key is absent or invalid. */
export function numericSetting(config: Record<string, unknown>, key: string): number | null {
    const value = config[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Count project types in the supplied order, including a zero cell for an absent type. */
export function typeSplit(projects: BadgeProject[], order: string[]): SplitCount[] {
    return order.map((label) => ({
        label,
        count: projects.filter((project) => project.type === label).length
    }));
}

/** Count each project in the first bucket matching its type or one of its status chips. */
export function rollup(projects: BadgeProject[], buckets: BadgeBucket[]): RollupCount[] {
    const counts = buckets.map(() => 0);
    for (const project of projects) {
        const values = new Set([project.type, ...project.chips]);
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
