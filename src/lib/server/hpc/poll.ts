// Layer 2, server. The Live HPC watcher publishes one complete state message, with quota refreshed on its slower independent cadence.
import type { HpcPayload } from '../../data/model.ts';
import type { Hub } from '../channels.ts';
import {
    parseQuota,
    parseSacct,
    parseSinfo,
    parseSqueue,
    SEC_RC,
    SEC_SACCT,
    SEC_SINFO,
    splitSections
} from './parse.ts';
import { run, type Runner } from './ssh.ts';

export type HpcOptions = {
    host: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
    runner?: Runner;
    timeoutMs?: number;
};
export type HpcWatcher = { refresh(): Promise<void>; close(): void };

function dateFrom(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - Math.max(1, days));
    return date.toISOString().slice(0, 10);
}

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
 * for a cluster that answers; after a failure it is the time a reader sits in front of a stale page,
 * and a connect that fails costs one refused socket.
 */
export const RETRY_MIN = 2;

/** The rows of one good answer, kept so a failed poll shows the last known queue rather than nothing. */
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
     * Whether close() has been called, read through a call so a check before an await never stands
     * in for the check after it.
     */
    const stopped = (): boolean => closed;
    /**
     * A publish the cluster did not answer: the state word and its hint over the last good rows and
     * the time they came from, so an off-VPN page shows what the queue was rather than an empty one.
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
        }
    };
    /**
     * The poll in flight, if there is one, and the one follow-up poll every refresh asked for
     * meanwhile shares. A refresh never opens a second connection beside the poll running, so the
     * rows, the last good time and the cadence are always the newest poll's; it does get a poll that
     * starts after the one in flight, since what asked for it (a cancel, the Refresh control) wants
     * the cluster's state after its own action and not the answer of a poll begun before it.
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
