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
import { focusNumber } from '../../data/sources/config/sections/focus.ts';
import { hasWord, recordWords, type WordsOf } from '../../data/shapes/vocab-keys.ts';
import { daysUntil } from '../boards/board/index.ts';
import { venueLoad, venueWarn } from '../boards/ticker.ts';

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
 * One "refresh live data" nudge: the reader its feed's run date is read by (`radar`, `scout` or
 * `inbox`), the offered task that refreshes it and its hub (null for the inbox, whose date is the
 * machine's), and how many days since it ran, or null for never.
 */
export type RefreshItem = {
    feed: LastRun;
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
 * The lines of the "Refresh live data" group, one per offered task whose feed is older than the
 * task's own `stale_days` (`nudgeAfterDays`), the radar's first, then the inbox's, then the
 * scout's, and within one reader in the order of `offered`. A task whose row sets no `stale_days`
 * is never nudged, whether or not its feed has run. A feed whose file is not on this machine is not
 * nudged about: there is nothing to refresh. The radar is the one feed a present file with no run
 * date still nudges for, since a radar that has never run is exactly what the nudge is for.
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
 * inbox has one line, for the first offered task that reads it and sets `stale_days`, by that
 * task's value, whichever hubs offer one.
 */
export function refresh(
    snapshot: Snapshot,
    now: number,
    notesRun: string | null,
    offered: readonly HubTask[]
): RefreshItem[] {
    const out: RefreshItem[] = [];
    const own = (hub: string) => snapshot.entities.feeds.byHub.find((one) => one.hub === hub);
    // The offered tasks that read a place and set a threshold, each with its threshold.
    const reading = (place: LastRun) =>
        offered.flatMap((task) =>
            task.lastRun === place && task.nudgeAfterDays !== null
                ? [{ task, after: task.nudgeAfterDays }]
                : []
        );

    for (const { task, after } of reading('radar')) {
        const radar = own(task.hub)?.radar ?? null;
        if (radar === null) continue;
        const days = daysSince(radar.lastRun, now);
        if (days === null || days >= after) {
            out.push({ feed: 'radar', task, hub: task.hub, days });
        }
    }
    const inbox = reading('inbox').at(0);
    if (notesRun !== null && inbox !== undefined) {
        const days = daysSince(notesRun, now);
        if (days !== null && days >= inbox.after) {
            out.push({ feed: 'inbox', task: inbox.task, hub: null, days });
        }
    }
    for (const { task, after } of reading('scout')) {
        const scout = own(task.hub)?.scout ?? null;
        if (scout === null) continue;
        const days = daysSince(scout.lastRun, now);
        if (days !== null && days >= after) {
            out.push({ feed: 'scout', task, hub: task.hub, days });
        }
    }
    return out;
}
