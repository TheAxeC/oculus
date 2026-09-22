// Layer 2, server. The log path of many finished jobs at once, resolved from listings so the first press on a log is as fast as the second.
import { safePath, validId } from './actions.ts';
import { dateFrom } from './parse.ts';
import { run, type RunResult, type Runner } from './ssh.ts';

/**
 * The five rungs of the on-demand search in actions.ts, in the same order but without a job id in
 * them: one listing per working directory and rung, which every job of that directory is then
 * matched against here. Keep them in step with the ladder there, or a prewarmed path and the path
 * a press resolves can disagree.
 *
 * The listing is `printf`, not `ls -t`. A sort by modification time has to stat every entry, and a
 * log directory with a running job writing into it is where that costs seconds; `printf` over the
 * glob is a directory read and nothing more. An unmatched glob prints itself, which is why the
 * parse drops any line that still carries a `*`.
 */
export const PREWARM_RUNGS = ['hpc/logs/*', 'logs/*', 'slurm-*.out', '*.out', '*/logs/*'];

/** Seconds one rung's listing is given on the cluster, inside the shell that expands its glob. */
const RUNG_SECS = 15;

const SEC_WD = '@@oculus:wd=';
const SEC_RUNG = '@@oculus:rung@@';

/** Milliseconds the working-directory query is given: one sacct over the same window the poll reads. */
const SACCT_TIMEOUT_MS = 30000;

/**
 * Milliseconds the batched listing is given beyond the sum of its rungs' own budgets. Every rung is
 * bounded on the cluster, so the call only has to outlast all of them plus the round trip; a fixed
 * budget would either cut a listing that is still inside its rungs' bounds or sit on a login node
 * that has stopped answering for longer than it needs to.
 */
const LISTING_SLACK_MS = 15000;

/**
 * How many working directories one cycle lists. The ones holding the most jobs go first, so the
 * cycle resolves as many jobs as it can for the time it spends, and the rest are asked for next
 * cycle rather than making one call that lists every directory a queue has touched.
 */
export const PREWARM_DIRS = 4;

/** How many resolved paths are kept before the map starts again, so a long run cannot grow it without end. */
export const PREWARM_MAX = 500;

/** The states sacct gives a job that will write to its log no more, which is all the prewarm may resolve. */
const FINISHED_STATES = [
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'TIMEOUT',
    'OUT_OF_MEMORY',
    'NODE_FAIL',
    'PREEMPTED',
    'BOOT_FAIL',
    'DEADLINE',
    'REVOKED'
];

/**
 * Whether a job has reached an end state. A job still finishing (`COMPLETING`) has not: `scontrol`
 * still holds its record and answers its StdOut exactly, and a ladder guess would replace an exact
 * answer with a guess. A cancelled job carries who cancelled it (`CANCELLED by 12345`).
 */
export function isFinished(state: string): boolean {
    return FINISHED_STATES.includes(state.split(' ')[0]);
}

/** Milliseconds the listing of this many directories is given, all of their rungs' budgets and the round trip. */
export function listingTimeout(dirs: number): number {
    return dirs * PREWARM_RUNGS.length * RUNG_SECS * 1000 + LISTING_SLACK_MS;
}

/** The working directories to list, as one remote script with a marked section per directory and rung. */
export function listingCommand(dirs: string[]): string {
    const parts: string[] = [];
    for (const dir of dirs) {
        // The marker is quoted like the rung below it: the directory is the cluster's text, and a
        // double-quoted word would let the remote shell expand what is in it.
        parts.push(`echo '${SEC_WD}${dir}@@'`);
        for (const rung of PREWARM_RUNGS) {
            parts.push(`echo "${SEC_RUNG}"`);
            // The glob lives inside the timed child: the outer shell would expand it before it
            // execs `timeout`, leaving the directory walk that costs the seconds unbounded.
            parts.push(`timeout ${RUNG_SECS} sh -c 'printf "%s\\n" "$1"/${rung}' _ '${dir}'`);
        }
    }
    return parts.join('\n');
}

/** The listing's output as one file list per rung, in rung order, per working directory. */
export function parseListing(out: string): Map<string, string[][]> {
    const perDir = new Map<string, string[][]>();
    let current: string[][] | null = null;
    for (const line of out.split('\n')) {
        if (line.startsWith(SEC_WD)) {
            // One section per directory: the command lists each of them once.
            current = [];
            // The marker closes with two @ signs; a directory may end in one of its own.
            const rest = line.slice(SEC_WD.length);
            perDir.set(rest.endsWith('@@') ? rest.slice(0, -2) : rest, current);
        } else if (line.trim() === SEC_RUNG) {
            if (current !== null) current.push([]);
        } else if (
            current !== null &&
            current.length > 0 &&
            line.trim() !== '' &&
            !line.includes('*')
        ) {
            current[current.length - 1].push(line.trim());
        }
    }
    return perDir;
}

/** Whether a file name satisfies one rung for one job id, as the on-demand ladder's glob would. */
function rungMatch(rung: number, id: string, name: string): boolean {
    if (rung === 2) return name === `slurm-${id}.out`;
    if (rung === 3) return name.includes(id) && name.endsWith('.out');
    return name.includes(id);
}

/**
 * The path of one job, rung by rung as the ladder goes. Within a rung the match must be the only
 * one: a listing carries no modification time, so it cannot reproduce the ladder's newest-wins
 * tiebreak, and an id that matches several files (an array parent, whose tasks all carry it) is
 * left to the press, which does have the times. A guess would be tailed silently.
 */
export function pickFromListing(id: string, rungs: string[][]): string {
    for (let rung = 0; rung < rungs.length; rung += 1) {
        const hits = rungs[rung].filter((path) =>
            rungMatch(rung, id, path.split('/').at(-1) ?? '')
        );
        if (hits.length > 0) return hits.length === 1 ? hits[0] : '';
    }
    return '';
}

/**
 * The stdout log path of the finished jobs named, as two connections rather than one search each:
 * one sacct for their working directories, then one listing of every distinct directory, matched
 * here. Recent jobs overwhelmingly share a directory, so a queue's worth of ladders collapses into
 * a handful of directory reads.
 *
 * Only finished jobs belong here. A running or pending job still has a `scontrol` record whose
 * StdOut is exact and costs a moment, so prewarming one would put a guess where an exact answer is.
 *
 * A job it cannot resolve is left out: this runs behind the page, and a miss only means the next
 * press pays the search it would have paid anyway.
 */
export async function prewarmLogs(
    host: string,
    ids: string[],
    days: number,
    runner: Runner = run
): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    const want = ids.filter(validId);
    if (want.length === 0) return found;
    let listed: RunResult;
    try {
        listed = await runner(
            host,
            `sacct -X -u "$USER" -S ${dateFrom(days)} -o JobID,WorkDir%600 -Pn`,
            SACCT_TIMEOUT_MS
        );
    } catch {
        return found;
    }
    if (listed.code !== 0) return found;
    const wanted = new Set(want);
    const dirOf = new Map<string, string>();
    for (const line of listed.stdout.split('\n')) {
        const fields = line.trim().split('|');
        if (fields.length >= 2 && wanted.has(fields[0])) {
            // The same gate a remembered path passes: absolute, and nothing a quoted shell word breaks out of.
            const dir = safePath(fields[1]);
            if (dir) dirOf.set(fields[0], dir);
        }
    }
    // The directories holding the most of the jobs asked about, so a bounded listing resolves as
    // many of them as it can; a directory left out keeps its jobs unresolved, and the caller asks
    // about a job once, so what was listed this time does not hold the slots next time.
    const perDirCount = new Map<string, number>();
    for (const dir of dirOf.values()) perDirCount.set(dir, (perDirCount.get(dir) ?? 0) + 1);
    const dirs = [...perDirCount.keys()]
        .sort(
            (one, two) =>
                (perDirCount.get(two) ?? 0) - (perDirCount.get(one) ?? 0) || (one < two ? -1 : 1)
        )
        .slice(0, PREWARM_DIRS);
    if (dirs.length === 0) return found;
    let listing: RunResult;
    try {
        listing = await runner(host, listingCommand(dirs), listingTimeout(dirs.length));
    } catch {
        return found;
    }
    // A rung that ran out of its budget leaves the sections before it intact, so what did answer is read.
    const perDir = parseListing(listing.stdout);
    for (const id of want) {
        const dir = dirOf.get(id);
        const rungs = dir === undefined ? undefined : perDir.get(dir);
        if (rungs === undefined) continue;
        const path = pickFromListing(id, rungs);
        if (path) found.set(id, path);
    }
    return found;
}
