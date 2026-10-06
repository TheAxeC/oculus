// Layer 1, data. What a cron pattern says: the next runs it has from a moment, or why it has none.
// The schedule dialog reads it for the runs it previews, the entry rule (schedules.ts) reads it to
// refuse a pattern, and the server's watcher reads it before it arms a timer, so the three answer
// the same for one pattern. A pattern is croner's five-field form or one of its nicknames, in the
// local time of the machine that reads it; nothing here keeps a job, so a pattern read for a
// preview leaves no timer behind.

import { Cron } from 'croner';

/** The next runs of a pattern, or why it has none: croner refuses it, or no date matches it. */
export type CronRuns = { ok: true; runs: Date[] } | { ok: false; why: 'unreadable' | 'never' };

/**
 * The next `count` runs of `pattern` after `from`. A pattern croner refuses to construct is
 * `unreadable`. A pattern that matches no date, whether croner answers no run (`0 0 31 2 *`) or
 * throws while it walks (`0 0 31 4,6,9,11 *`), is `never`.
 */
export function cronRuns(pattern: string, count: number, from: Date): CronRuns {
    let job: Cron;
    try {
        job = new Cron(pattern, { paused: true, mode: '5-part' });
    } catch {
        return { ok: false, why: 'unreadable' };
    }
    try {
        const runs = job.nextRuns(count, from);
        return runs.length === 0 ? { ok: false, why: 'never' } : { ok: true, runs };
    } catch {
        return { ok: false, why: 'never' };
    }
}
