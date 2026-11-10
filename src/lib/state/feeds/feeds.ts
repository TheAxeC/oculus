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

import type { HubTask, LastRun, Snapshot } from '../../data/model/index.ts';
import { focusBlock, numericSetting } from '../../data/helpers/guards.ts';
import { focusNumber } from '../../data/sources/config/sections/focus.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import { hasWord, recordWords, type WordsOf } from '../../data/shapes/vocab-keys.ts';
import { daysUntil } from '../boards/board/index.ts';
import { venueLoad, venueWarn } from '../boards/ticker.ts';

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

/**
 * One "refresh live data" nudge: which of FEEDS, the offered task that refreshes it and its hub
 * (null for the inbox, whose date is the machine's), and how many days since it ran, or null for
 * never.
 */
export type RefreshItem = {
    feed: string;
    task: HubTask;
    hub: string | null;
    days: number | null;
};

/** Whole days since an ISO date, and null when there is no date to count from. */
export function daysSince(date: string | null, now: number): number | null {
    if (date === null) return null;
    const ahead = daysUntil(date, now);
    return ahead === null ? null : -ahead;
}

/**
 * How many days old a feed may be before it is nudged: its number under `refresh_stale_days` of
 * `focus:`. A feed that key does not name, or names with a value that is not a finite number, is
 * never nudged, so the answer is `Infinity`; the config file is the only place a threshold comes
 * from.
 */
export function staleAfter(config: Record<string, unknown>, feed: string): number {
    const held = readAs(mapShape, focusBlock(config).refresh_stale_days);
    return (held === null ? null : numericSetting(held, feed)) ?? Infinity;
}

/**
 * The lines of the "Needs attention" group: the inbox count, the LinkedIn cadence once it is past,
 * and the venues carrying too many in-flight papers. The fourth line, the manifests behind their
 * docs, needs the filesystem mtimes the snapshot does not carry and is not drawn here.
 *
 * The inbox count is not the snapshot's: the plate is read live from the mailboxes on the `inbox`
 * channel, so the caller passes what that channel says and this stays pure over its arguments. A
 * project is in flight by the `stages` of its own hub, given as `wordsOf`. The cadence and the
 * venue count are read by their options entries (`focusNumber`); before the page holds the
 * settings neither is known, and neither line is raised.
 */
export function attention(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    inbox: number,
    wordsOf?: WordsOf
): AttentionItem[] {
    const out: AttentionItem[] = [];
    const feeds = snapshot.entities.feeds;

    if (inbox > 0) out.push({ kind: 'inbox', count: inbox });

    const cadence = focusNumber(config, 'linkedin_cadence_days');
    const since = daysSince(feeds.linkedin?.lastPost ?? null, now);
    if (since !== null && cadence !== null && since > cadence) {
        out.push({ kind: 'linkedin', count: since });
    }

    const warn = venueWarn(config);
    const projects = Object.values(snapshot.entities.projects).filter((project) =>
        hasWord(recordWords(config, wordsOf, project), 'stages', 'live', project.stage)
    );
    for (const one of venueLoad(projects, snapshot.entities.venues, warn)) {
        out.push({ kind: 'venue', id: one.id, count: one.count, label: one.label });
    }
    return out;
}

/**
 * The lines of the "Refresh live data" group, one per offered task whose feed is older than its
 * threshold, in the order of FEEDS and within one feed in the order of `offered`. A feed whose file
 * is not on this machine is not nudged about: there is nothing to refresh. A feed that
 * `refresh_stale_days` does not name is not nudged whether or not it has run. The radar is the one
 * feed a present file with no run date still nudges for, since a radar that has never run is
 * exactly what the nudge is for.
 *
 * A line names the update task that refreshes its feed, so it is made for each row of `offered`
 * (the rows of a hub's `update_tasks` whose file the hub holds, with that hub) whose `last_run`
 * reads that feed (`radar` the radar, `scout` the leads file's scout), from the feed of that hub's
 * row of `byHub`: a feed no offered task reads gets no line, since there is no task to run, and
 * each hub's task gets its own.
 *
 * The inbox nudge is about the triage notes rather than a feed file: the plate itself is read live,
 * and what ages is the classification an update task whose `last_run` is `inbox` writes, whose own
 * run date the `inbox` channel carries and the caller passes. That date is the machine's, so the
 * inbox has one line, for the first offered task that reads it, whichever hubs offer one.
 */
export function refresh(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    notesRun: string | null,
    offered: readonly HubTask[]
): RefreshItem[] {
    const out: RefreshItem[] = [];
    const own = (hub: string) => snapshot.entities.feeds.byHub.find((one) => one.hub === hub);
    const reading = (place: LastRun) => offered.filter((one) => one.lastRun === place);

    const radarAfter = staleAfter(config, 'litwatch');
    for (const task of radarAfter === Infinity ? [] : reading('radar')) {
        const radar = own(task.hub)?.radar ?? null;
        if (radar === null) continue;
        const days = daysSince(radar.lastRun, now);
        if (days === null || days >= radarAfter) {
            out.push({ feed: 'litwatch', task, hub: task.hub, days });
        }
    }
    const inbox = reading('inbox').at(0);
    if (notesRun !== null && inbox !== undefined) {
        const days = daysSince(notesRun, now);
        if (days !== null && days >= staleAfter(config, 'inbox')) {
            out.push({ feed: 'inbox', task: inbox, hub: null, days });
        }
    }
    for (const task of reading('scout')) {
        const scout = own(task.hub)?.scout ?? null;
        if (scout === null) continue;
        const days = daysSince(scout.lastRun, now);
        if (days !== null && days >= staleAfter(config, 'scout')) {
            out.push({ feed: 'scout', task, hub: task.hub, days });
        }
    }
    return out;
}
