// Layer 2, client state. Pure rail-badge counts over collection and feed records. The reactive
// adapter beside it supplies the snapshot, fetched feeds, config and current time.

import { daysUntil } from './board.ts';
import { deadlineOf, isClosed } from './leads.ts';
import { daysSince } from './feeds.ts';

export type LiveRule = { match: string[]; tone?: string };

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
    return entries.filter((entry) =>
        matched.has(
            String(entry.fields.status ?? '')
                .trim()
                .toLowerCase()
        )
    ).length;
}

/** Count fetched Inbox records awaiting a reply or action and not yet triaged. */
export function actionableEntries(entries: Record<string, unknown>[]): number {
    return entries.filter(
        (entry) =>
            entry.triaged !== true &&
            ['reply', 'action'].includes(
                String(entry.kind ?? '')
                    .trim()
                    .toLowerCase()
            )
    ).length;
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

/** Badge text, with zero represented by the empty string the rail does not draw. */
export function countText(count: number): string {
    return count > 0 ? String(count) : '';
}
