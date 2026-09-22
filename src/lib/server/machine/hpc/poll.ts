// Layer 2, server. The Live HPC watcher publishes one complete state message, with quota refreshed
// on its slower independent cadence.
import type { HpcPayload } from '../../../data/model.ts';
import type { Hub } from '../../core/channels.ts';
import type { LogPaths } from './actions.ts';
import {
    dateFrom,
    parseQuota,
    parseSacct,
    parseSinfo,
    parseSqueue,
    SEC_RC,
    SEC_SACCT,
    SEC_SINFO,
    splitSections
} from './parse.ts';
import { isFinished, PREWARM_MAX, prewarmLogs } from './prewarm.ts';
import { run, type Runner } from './ssh.ts';

export type HpcOptions = {
    host: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
    /** The log path per job id the log action reads, which the prewarm fills in behind the page. */
    logPaths?: LogPaths;
    runner?: Runner;
    timeoutMs?: number;
};
export type HpcWatcher = { refresh(): Promise<void>; close(): void };

export function batchCommand(days: number): string {
    return [
        `squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R'`,
        `echo "${SEC_RC}$?"`,
        `echo "${SEC_SACCT}"`,
        `sacct -u "$USER" -S ${dateFrom(days)} -o JobID,JobName%60,State,ExitCode,Elapsed,End,ReqMem,MaxRSS,TotalCPU,AllocCPUS,NNodes,ElapsedRaw -Pn`,
        `echo "${SEC_SINFO}"`,
        `sinfo -h -o '%P|%a|%D|%t|%G'`
    ].join('\n');
}

const quotaCommand = `quota -s 2>/dev/null; echo "---df---"; df -h "$HOME" 2>/dev/null`;

/**
 * Minutes before the next attempt while the cluster is not answering. The regular cadence is tuned
 * for a cluster that answers; after a failure it is the time a reader sits in front of a stale
 * page, and a connect that fails costs one refused socket.
 */
export const RETRY_MIN = 2;

/**
 * The rows of one good answer, kept so a failed poll shows the last known queue rather than
 * nothing.
 */
type Rows = Pick<HpcPayload, 'jobs' | 'running' | 'pending' | 'total' | 'recent' | 'sinfo'>;
const NO_ROWS: Rows = { jobs: [], running: 0, pending: 0, total: 0, recent: [], sinfo: [] };

export function watchHpc(hub: Hub, options: HpcOptions): HpcWatcher {
    const runner = options.runner ?? run;
    const timeout = options.timeoutMs ?? 40000;
    let quota: HpcPayload['quota'] = [];
    let rows: Rows = NO_ROWS;
    let lastOk = '';
    let closed = false;
    /**
     * Whether the rows of a good poll are waiting for the prewarm. A poll that failed clears it, so
     * the prewarm only ever runs against the rows of the poll that set it and never against rows
     * kept from an earlier one.
     */
    let prewarmDue = false;
    /** The prewarm in flight, if there is one: one at a time, and nothing waits on it. */
    let prewarming: Promise<void> | null = null;
    /**
     * Whether close() has been called, read through a call so a check before an await never stands
     * in for the check after it.
     */
    const stopped = (): boolean => closed;
    /**
     * A publish the cluster did not answer: the state word and its hint over the last good rows and
     * the time they came from, so an off-VPN page shows what the queue was rather than an empty
     * one.
     */
    const degraded = (status: HpcPayload['status'], hint?: string): HpcPayload => ({
        status,
        ...(hint ? { hint } : {}),
        ...rows,
        quota,
        updated: new Date().toISOString(),
        ...(lastOk ? { lastOk } : {}),
        pollMin: options.pollMin,
        retryMin: RETRY_MIN,
        host: options.host
    });
    hub.publish('hpc', degraded('starting'));

    const publishQuota = async (): Promise<void> => {
        if (stopped()) return;
        try {
            const result = await runner(options.host, quotaCommand, 25000);
            if (stopped()) return;
            const next = parseQuota(result.stdout);
            if (result.code === 0 && next.length) {
                quota = next;
                const held = hub.latest('hpc')?.payload as HpcPayload | undefined;
                if (held !== undefined) hub.publish('hpc', { ...held, quota });
            }
        } catch {
            // A failed quota read preserves the last good meters.
        }
    };
    /**
     * One pending attempt at a time, at the cadence the last outcome earned: the regular one while
     * the cluster answers, the short one while it does not, so a reader does not wait a full period
     * after the poll that failed. One handle, which close() clears.
     */
    let queueTimer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (minutes: number): void => {
        if (queueTimer !== null) clearTimeout(queueTimer);
        queueTimer = stopped() ? null : setTimeout(() => void refresh(), minutes * 60000);
    };
    const poll = async (): Promise<void> => {
        let good = false;
        try {
            const result = await runner(options.host, batchCommand(options.days), timeout);
            if (stopped()) return;
            const parts = splitSections(result.stdout);
            if (!result.stdout.includes(SEC_SACCT) || parts.squeueCode !== 0) {
                prewarmDue = false;
                const payload = degraded(
                    'unreachable',
                    result.stderr.trim() || `ssh exited ${result.code}`
                );
                hub.publish('hpc', payload);
                console.log(`hpc publish: ${payload.status}`);
                return;
            }
            const jobs = parseSqueue(parts.squeue);
            rows = {
                jobs,
                running: jobs.filter((job) => job.state === 'RUNNING').length,
                pending: jobs.filter((job) => job.state === 'PENDING').length,
                total: jobs.length,
                recent: parseSacct(parts.sacct),
                sinfo: parseSinfo(parts.sinfo)
            };
            lastOk = new Date().toISOString();
            good = true;
            prewarmDue = options.prewarm;
            hub.publish('hpc', {
                status: 'ok',
                ...rows,
                quota,
                updated: lastOk,
                lastOk,
                pollMin: options.pollMin,
                retryMin: RETRY_MIN,
                host: options.host
            });
            console.log('hpc publish: ok');
        } catch (error) {
            prewarmDue = false;
            if (stopped()) return;
            const hint = error instanceof Error ? error.message : String(error);
            const payload = degraded(
                hint.toLowerCase().includes('timeout') ? 'unreachable' : 'error',
                hint
            );
            hub.publish('hpc', payload);
            console.log(`hpc publish: ${payload.status}`);
        } finally {
            schedule(good ? options.pollMin : RETRY_MIN);
            startPrewarm();
        }
    };
    /**
     * The finished jobs of the poll that just landed whose log path is not known yet, resolved so
     * the first press on a log is as fast as the second. A path a press already found is never
     * replaced: that one came from `scontrol` and is exact, where this one is the ladder's guess.
     * A job still finishing is left out: `scontrol` answers for it exactly, and a ladder guess
     * would replace an exact answer. A failure is left alone and the next cycle asks again.
     */
    /**
     * The jobs the prewarm has asked about once. One that stayed unresolved (an ambiguous name, a
     * directory the listing could not read) is not asked again: a press resolves it with the times
     * a listing lacks, and asking every cycle would let a few such jobs hold every listing slot.
     */
    const asked = new Set<string>();
    const prewarmStep = async (): Promise<void> => {
        const paths = options.logPaths;
        if (paths === undefined) return;
        try {
            const todo = rows.recent
                .filter((job) => isFinished(job.state) && !paths.has(job.id) && !asked.has(job.id))
                .map((job) => job.id);
            if (todo.length > 0) {
                for (const id of todo) asked.add(id);
                const found = await prewarmLogs(options.host, todo, options.days, runner);
                if (stopped()) return;
                for (const [id, path] of found) if (!paths.has(id)) paths.set(id, path);
            }
            if (paths.size > PREWARM_MAX) {
                paths.clear();
                asked.clear();
            }
        } catch {
            // A failed prewarm keeps the paths already found and changes no cadence.
        }
    };
    /**
     * The prewarm the last good poll asked for, started behind the page and joined by nothing: not
     * the poll gate below, not the promise a Refresh press waits on. A press that asked for a
     * refresh would otherwise wait on a directory walk whose cost is the cluster's to set, so a
     * poll may run beside a prewarm and the watcher holds three connections at most: one poll, one
     * quota read and one prewarm, each with its own budget. A prewarm still running when the next
     * good poll lands is left to finish, and that poll's rows get their turn when it does.
     */
    const startPrewarm = (): void => {
        if (prewarming !== null || !prewarmDue || stopped()) return;
        prewarmDue = false;
        prewarming = prewarmStep().finally(() => {
            prewarming = null;
            startPrewarm();
        });
    };
    /**
     * The poll in flight, if there is one, and the one follow-up poll every refresh asked for
     * meanwhile shares. A refresh never opens a second connection beside the poll running, so the
     * rows, the last good time and the cadence are always the newest poll's; it does get a poll
     * that starts after the one in flight, since what asked for it (a cancel, the Refresh control)
     * wants the cluster's state after its own action and not the answer of a poll begun before it.
     * The prewarm is not on this gate, and a press never waits on one.
     */
    let running: Promise<void> | null = null;
    let queued: Promise<void> | null = null;
    const refresh = (): Promise<void> => {
        if (stopped()) return Promise.resolve();
        if (running === null) {
            running = poll().finally(() => (running = null));
            return running;
        }
        queued ??= running.then(() => refresh()).finally(() => (queued = null));
        return queued;
    };
    void publishQuota();
    void refresh();
    const quotaTimer = setInterval(() => void publishQuota(), options.quotaMin * 60000);
    return {
        refresh,
        close(): void {
            closed = true;
            if (queueTimer !== null) clearTimeout(queueTimer);
            queueTimer = null;
            clearInterval(quotaTimer);
        }
    };
}
