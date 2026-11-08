// Layer 2, server. The newest due time of a croner job at or before a moment, which the schedules
// watcher (schedules/watch.ts) decides a run from. Apart from the watcher since it is a question
// about a pattern alone: it holds no state beyond the patterns whose due time could not be found,
// which the caller keeps so each is worded once.

import type { Cron } from 'croner';

/**
 * How many due times before a moment `dueAt` looks through: the due times of a minute pattern that
 * croner moves out of an hour the clocks skip, one per minute of that hour, can all lie after it.
 */
const LOOKBACK = 61;

/** The span `walkedDueAt` first walks over, in milliseconds, and the factor it widens by. */
const WALK_FIRST_MS = 90_000;
const WALK_GROWTH = 4;
/** The longest span `walkedDueAt` walks over: a 29 February pattern that also names a weekday. */
const WALK_LAST_MS = 30 * 366 * 86_400_000;

/**
 * The newest due time of a job at or before `now` found by walking croner's forward runs from a
 * moment before `now`, the span widening until a run falls inside it, or undefined when it has
 * none.
 */
function walkedDueAt(job: Cron, now: Date): Date | undefined {
    const end = now.getTime();
    for (let span = WALK_FIRST_MS; ; span *= WALK_GROWTH) {
        const first = job.nextRun(new Date(end - span));
        if (first !== null && first.getTime() <= end) return lastRunUpTo(job, first, end);
        if (span > WALK_LAST_MS) return undefined;
    }
}

/**
 * The last run of a job at or before `end`, from `run`, a run at or before it. No run lies after
 * `upper` and at or before `end`; each turn either moves to a run past the middle of what is left
 * or halves it, so a pattern that runs every minute of a month takes a few dozen of croner's
 * forward walks, never one per run.
 */
function lastRunUpTo(job: Cron, run: Date, end: number): Date {
    let latest = run;
    let upper = end;
    for (;;) {
        const after = job.nextRun(latest);
        if (after === null || after.getTime() > end) return latest;
        latest = after;
        const middle = Math.floor((latest.getTime() + upper) / 2);
        if (middle <= latest.getTime()) continue;
        const probe = job.nextRun(new Date(middle));
        if (probe !== null && probe.getTime() <= end) latest = probe;
        else upper = middle;
    }
}

/**
 * The newest due time of a job at or before `now`, or undefined when it has none. Croner answers
 * "before" in whole seconds, so a `now` inside the second of a due time still sees the one before
 * it; asking from the start of the next second gives the due time that second holds. On the day
 * the clocks skip an hour croner answers the due times inside that hour, moved after it (a 02:30
 * as 03:30), from the start of the hour, so a due time later than `now` is passed over. Croner's
 * backward walk throws for some patterns the pattern rule accepts (`0 0 29 2 *`, `0 7 29 2 *`,
 * `0 0 30 1-2 *`); the due time of such a job is found by `walkedDueAt`. A pattern croner cannot
 * walk either way has no due time and is worded once, so a failure of croner never stops the
 * server.
 */
export function dueAt(job: Cron, now: Date, unreadable: Set<string>): Date | undefined {
    try {
        try {
            const ask = new Date(Math.floor(now.getTime() / 1000) * 1000 + 1000);
            return job.previousRuns(LOOKBACK, ask).find((due) => due.getTime() <= now.getTime());
        } catch {
            return walkedDueAt(job, now);
        }
    } catch (error) {
        const pattern = job.getPattern() ?? '';
        if (!unreadable.has(pattern)) {
            unreadable.add(pattern);
            const reason = error instanceof Error ? error.message : String(error);
            console.error(
                `schedule: the due time of the pattern ${pattern} was not found: ${reason}`
            );
        }
        return undefined;
    }
}
