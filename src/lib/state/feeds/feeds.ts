// Layer 2, client state. What the generated feeds say about what needs doing: the "Needs attention"
// lines of the command center, and the "Refresh live data" nudges under them. Pure over the
// snapshot, the merged config and a `now` the caller passes, like state/boards/focus.ts beside it.
//
// It lives apart from state/boards/focus.ts for length alone: the board's arithmetic is one file
// already near the thousand-line rule, and the feed lines are a separable concern with their own
// source.
//
// No words live here. A line carries what it is and a number; the view turns that into a sentence
// through the catalogs under config/text/.

import type { Snapshot } from '../../data/model/index.ts';
import { numericSetting } from '../../data/helpers/guards.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import { daysUntil } from '../boards/board/index.ts';
import { venueLoad } from '../boards/ticker.ts';

/** The three feeds a nudge can be about, in the order the group lists them. */
export const FEEDS = ['litwatch', 'inbox', 'scout'];

/**
 * One "needs attention" line. `kind` says what it is and the view words it: `inbox` counts threads
 * of the live plate waiting on an answer, `linkedin` counts days since the last post, `venue`
 * counts the in-flight papers aimed at the one venue it names.
 */
export type AttentionItem = {
    kind: string;
    count: number;
    /** The venue a `venue` line is about. The other two kinds name nothing. */
    label?: string;
    /** The venue registry id a `venue` line opens. The other two kinds name no entry. */
    id?: string;
};

/** One "refresh live data" nudge: which feed, and how many days since it ran, or null for never. */
export type RefreshItem = {
    feed: string;
    days: number | null;
};

/** A number out of the merged config, and the fallback when it holds none. */
function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    return numericSetting(config, key) ?? fallback;
}

/** Whole days since an ISO date, and null when there is no date to count from. */
export function daysSince(date: string | null, now: number): number | null {
    if (date === null) return null;
    const ahead = daysUntil(date, now);
    return ahead === null ? null : -ahead;
}

/**
 * How many days old a feed may be before it is nudged: its number under `refresh_stale_days`. A
 * feed that key does not name, or names with a value that is not a finite number, is never nudged,
 * so the answer is `Infinity`; the config file is the only place a threshold comes from.
 */
export function staleAfter(config: Record<string, unknown>, feed: string): number {
    const held = readAs(mapShape, config.refresh_stale_days);
    return (held === null ? null : numericSetting(held, feed)) ?? Infinity;
}

/**
 * The lines of the "Needs attention" group: the inbox count, the LinkedIn cadence once it is past,
 * and the venues carrying too many in-flight papers. The fourth line, the manifests behind their
 * docs, needs the filesystem mtimes the snapshot does not carry and is not drawn here.
 *
 * The inbox count is not the snapshot's: the plate is read live from the mailboxes on the `inbox`
 * channel, so the caller passes what that channel says and this stays pure over its arguments.
 */
export function attention(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    inbox: number
): AttentionItem[] {
    const out: AttentionItem[] = [];
    const feeds = snapshot.entities.feeds;

    if (inbox > 0) out.push({ kind: 'inbox', count: inbox });

    const cadence = setting(config, 'linkedin_cadence_days', 30);
    const since = daysSince(feeds.linkedin?.lastPost ?? null, now);
    if (since !== null && since > cadence) out.push({ kind: 'linkedin', count: since });

    const warn = setting(config, 'venue_conc_warn', 4);
    const projects = Object.values(snapshot.entities.projects).filter((project) =>
        ['ideas', 'active', 'manuscripts'].includes(project.tier)
    );
    for (const one of venueLoad(projects, snapshot.entities.venues, warn)) {
        out.push({ kind: 'venue', id: one.id, count: one.count, label: one.label });
    }
    return out;
}

/**
 * The lines of the "Refresh live data" group, one per feed that is older than its threshold. A feed
 * whose file is not on this machine is not nudged about: there is nothing to refresh. A feed that
 * `refresh_stale_days` does not name is not nudged whether or not it has run. The radar is the one
 * feed a present file with no run date still nudges for, since a radar that has never run is
 * exactly what the nudge is for.
 *
 * The inbox nudge is about the triage notes rather than a feed file: the plate itself is read live,
 * and what ages is the classification the triage skill writes, whose own run date the `inbox`
 * channel carries and the caller passes.
 */
export function refresh(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    notesRun: string | null
): RefreshItem[] {
    const out: RefreshItem[] = [];
    const feeds = snapshot.entities.feeds;

    const radarAfter = staleAfter(config, 'litwatch');
    if (feeds.radar !== null && radarAfter !== Infinity) {
        const days = daysSince(feeds.radar.lastRun, now);
        if (days === null || days >= radarAfter) out.push({ feed: 'litwatch', days });
    }
    if (notesRun !== null) {
        const days = daysSince(notesRun, now);
        if (days !== null && days >= staleAfter(config, 'inbox')) out.push({ feed: 'inbox', days });
    }
    if (feeds.scout !== null) {
        const days = daysSince(feeds.scout.lastRun, now);
        if (days !== null && days >= staleAfter(config, 'scout')) out.push({ feed: 'scout', days });
    }
    return out;
}
