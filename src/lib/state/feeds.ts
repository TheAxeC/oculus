// Layer 2, client state. What the generated feeds say about what needs doing: the "Needs attention"
// lines of the command center, and the "Refresh live data" nudges under them. Pure over the
// snapshot, the merged config and a `now` the caller passes, like state/focus.ts beside it.
//
// It lives apart from state/focus.ts for length alone: the board's arithmetic is one file already
// near the thousand-line rule, and the feed lines are a separable concern with their own source.
//
// No words live here. A line carries what it is and a number; the view turns that into a sentence
// through config/text.yml.

import type { Snapshot } from '../data/model.ts';
import { daysUntil } from './board.ts';
import { venueLoad } from './focus.ts';

/** The three feeds a nudge can be about, in the order the group lists them. */
export const FEEDS = ['litwatch', 'inbox', 'scout'];

/** The thresholds of `stale_days` for a config that holds none. */
const STALE_DAYS: Record<string, number> = { litwatch: 14, inbox: 10, scout: 7 };

/**
 * One "needs attention" line. `kind` says what it is and the view words it: `inbox` counts threads
 * waiting on an answer, `linkedin` counts days since the last post, `venue` counts the in-flight
 * papers aimed at the one venue it names.
 */
export type AttentionItem = {
    kind: string;
    count: number;
    /** The venue a `venue` line is about. The other two kinds name nothing. */
    label?: string;
};

/** One "refresh live data" nudge: which feed, and how many days since it ran, or null for never. */
export type RefreshItem = {
    feed: string;
    days: number | null;
};

function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A number out of the merged config, and the fallback when it holds none. */
function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    const held = config[key];
    return typeof held === 'number' && Number.isFinite(held) ? held : fallback;
}

/** Whole days since an ISO date, and null when there is no date to count from. */
export function daysSince(date: string | null, now: number): number | null {
    if (date === null) return null;
    const ahead = daysUntil(date, now);
    return ahead === null ? null : -ahead;
}

/** How many days old a feed may be before it is nudged: `stale_days`, then `refresh_stale_days`. */
export function staleAfter(config: Record<string, unknown>, feed: string): number {
    let days = STALE_DAYS[feed] ?? 0;
    for (const key of ['stale_days', 'refresh_stale_days']) {
        const held = config[key];
        if (!isMap(held)) continue;
        const value = held[feed];
        if (typeof value === 'number' && Number.isFinite(value)) days = value;
    }
    return days;
}

/**
 * The lines of the "Needs attention" group: the inbox count, the LinkedIn cadence once it is past,
 * and the venues carrying too many in-flight papers. The fourth cockpit line, the manifests behind
 * their docs, needs the filesystem mtimes the snapshot does not carry and is O28's.
 */
export function attention(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number
): AttentionItem[] {
    const out: AttentionItem[] = [];
    const feeds = snapshot.entities.feeds;

    const inbox = feeds.inbox;
    if (inbox !== null && inbox.actionable > 0)
        out.push({ kind: 'inbox', count: inbox.actionable });

    const cadence = setting(config, 'linkedin_cadence_days', 30);
    const since = daysSince(feeds.linkedin?.lastPost ?? null, now);
    if (since !== null && since > cadence) out.push({ kind: 'linkedin', count: since });

    const warn = setting(config, 'venue_conc_warn', 4);
    const projects = Object.values(snapshot.entities.projects).filter((project) =>
        ['ideas', 'active', 'manuscripts'].includes(project.tier)
    );
    for (const one of venueLoad(projects, snapshot.entities.venues, warn)) {
        out.push({ kind: 'venue', count: one.count, label: one.label });
    }
    return out;
}

/**
 * The lines of the "Refresh live data" group, one per feed that is older than its threshold. A feed
 * whose file is not on this machine is not nudged about: there is nothing to refresh. The radar is
 * the one feed a present file with no run date still nudges for, since a radar that has never run
 * is exactly what the nudge is for.
 */
export function refresh(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number
): RefreshItem[] {
    const out: RefreshItem[] = [];
    const feeds = snapshot.entities.feeds;

    if (feeds.radar !== null) {
        const days = daysSince(feeds.radar.lastRun, now);
        if (days === null || days >= staleAfter(config, 'litwatch')) {
            out.push({ feed: 'litwatch', days });
        }
    }
    if (feeds.inbox !== null) {
        const days = daysSince(feeds.inbox.run, now);
        if (days !== null && days >= staleAfter(config, 'inbox')) out.push({ feed: 'inbox', days });
    }
    if (feeds.scout !== null) {
        const days = daysSince(feeds.scout.lastRun, now);
        if (days !== null && days >= staleAfter(config, 'scout')) out.push({ feed: 'scout', days });
    }
    return out;
}
