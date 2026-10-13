// Layer 2, server. The Live HPC watcher publishes one complete state message, with quota refreshed
// on its slower independent cadence.
import type { HpcPayload } from '../../../data/model/index.ts';
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

/**
 * What the poller is told: the ssh alias to query, or the empty host and the sentence for why there
 * is none (the resolver in host.ts), and the cadences and the window.
 */
export type HpcSettings = {
    host: string;
    missing?: string;
    /** The hub names no cluster: nothing is polled and `missing` is the answer. */
    unconfigured?: true;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

export type HpcOptions = HpcSettings & {
    /** The log path per job id the log action reads, which the prewarm fills in behind the page. */
    logPaths?: LogPaths;
    runner?: Runner;
    timeoutMs?: number;
};
export type HpcWatcher = {
    refresh(): Promise<void>;
    /**
     * Take new settings. A period moves the next run to the sooner of the one waiting and the new
     * period from now; a changed host, a changed sentence for having none, or a changed window
     * drops what the old one answered and polls now. Settings that name no cluster publish
     * `unconfigured` and stop the polling; settings that name a cluster again poll at once.
     */
    set(settings: HpcSettings): void;
    close(): void;
};

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
    let current: HpcSettings = {
        host: options.host,
        ...(options.missing === undefined ? {} : { missing: options.missing }),
        ...(options.unconfigured === undefined ? {} : { unconfigured: true as const }),
        days: options.days,
        pollMin: options.pollMin,
        quotaMin: options.quotaMin,
        prewarm: options.prewarm
    };
    /**
     * Counts the changes of host, sentence or window. A poll, quota read or prewarm that began
     * under an older count answers for a cluster or a window nobody asks for any more, and drops
     * its result.
     */
    let asking = 0;
    /** Counts the changes of host alone: a quota read does not depend on the window. */
    let hosts = 0;
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
        pollMin: current.pollMin,
        retryMin: RETRY_MIN,
        host: current.host
    });
    /** The answer of a hub that names no cluster: the sentence, no rows and no retry. */
    const unconfigured = (): HpcPayload => ({
        status: 'unconfigured',
        ...(current.missing ? { hint: current.missing } : {}),
        ...NO_ROWS,
        quota: [],
        updated: new Date().toISOString(),
        pollMin: current.pollMin,
        host: ''
    });
    hub.publish('hpc', current.unconfigured === true ? unconfigured() : degraded('starting'));

    const publishQuota = async (): Promise<void> => {
        if (stopped() || current.host === '') return;
        const began = hosts;
        try {
            const result = await runner(current.host, quotaCommand, 25000);
            if (stopped() || began !== hosts) return;
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
    /** When the waiting poll runs, or null while a poll is running or none is waiting. */
    let queueAt: number | null = null;
    const arm = (at: number): void => {
        if (queueTimer !== null) clearTimeout(queueTimer);
        queueAt = at;
        queueTimer = setTimeout(
            () => {
                queueAt = null;
                void refresh();
            },
            Math.max(0, at - Date.now())
        );
    };
    const schedule = (minutes: number): void => {
        if (stopped() || current.unconfigured === true) return;
        arm(Date.now() + minutes * 60000);
    };
    const poll = async (): Promise<void> => {
        let good = false;
        const began = asking;
        try {
            if (current.host === '') {
                // No host to ask: the sentence for why is the answer; the retry cadence applies.
                hub.publish('hpc', degraded('unreachable', current.missing));
                console.log('hpc publish: unreachable');
                return;
            }
            const result = await runner(current.host, batchCommand(current.days), timeout);
            if (stopped() || began !== asking) return;
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
            prewarmDue = current.prewarm;
            hub.publish('hpc', {
                status: 'ok',
                ...rows,
                quota,
                updated: lastOk,
                lastOk,
                pollMin: current.pollMin,
                retryMin: RETRY_MIN,
                host: current.host
            });
            console.log('hpc publish: ok');
        } catch (error) {
            prewarmDue = false;
            if (stopped() || began !== asking) return;
            const hint = error instanceof Error ? error.message : String(error);
            const payload = degraded(
                hint.toLowerCase().includes('timeout') ? 'unreachable' : 'error',
                hint
            );
            hub.publish('hpc', payload);
            console.log(`hpc publish: ${payload.status}`);
        } finally {
            schedule(good ? current.pollMin : RETRY_MIN);
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
        const began = asking;
        try {
            const todo = rows.recent
                .filter((job) => isFinished(job.state) && !paths.has(job.id) && !asked.has(job.id))
                .map((job) => job.id);
            if (todo.length > 0) {
                for (const id of todo) asked.add(id);
                const found = await prewarmLogs(current.host, todo, current.days, runner);
                if (stopped() || began !== asking) {
                    // Dropped under an older host or window: the next prewarm asks about them.
                    for (const id of todo) asked.delete(id);
                    return;
                }
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
        if (current.unconfigured === true) {
            hub.publish('hpc', unconfigured());
            return Promise.resolve();
        }
        if (running === null) {
            running = poll().finally(() => (running = null));
            return running;
        }
        queued ??= running.then(() => refresh()).finally(() => (queued = null));
        return queued;
    };
    /** The quota read waiting, one at a time, at the period in force. */
    let quotaTimer: ReturnType<typeof setTimeout> | null = null;
    let quotaAt = 0;
    const armQuota = (at: number): void => {
        if (quotaTimer !== null) clearTimeout(quotaTimer);
        quotaAt = at;
        quotaTimer = setTimeout(
            () => {
                armQuota(Date.now() + current.quotaMin * 60000);
                void publishQuota();
            },
            Math.max(0, at - Date.now())
        );
    };
    void publishQuota();
    void refresh();
    armQuota(Date.now() + current.quotaMin * 60000);
    return {
        refresh,
        set(next): void {
            if (stopped()) return;
            const before = current;
            current = { ...next };
            if (next.pollMin !== before.pollMin) {
                if (queueAt !== null) arm(Math.min(queueAt, Date.now() + next.pollMin * 60000));
                const held = hub.latest('hpc')?.payload as HpcPayload | undefined;
                if (held !== undefined) hub.publish('hpc', { ...held, pollMin: next.pollMin });
            }
            if (next.quotaMin !== before.quotaMin) {
                armQuota(Math.min(quotaAt, Date.now() + next.quotaMin * 60000));
            }
            if (
                next.host !== before.host ||
                next.missing !== before.missing ||
                next.unconfigured !== before.unconfigured
            ) {
                asking += 1;
                hosts += 1;
                rows = NO_ROWS;
                lastOk = '';
                quota = [];
                prewarmDue = false;
                asked.clear();
                options.logPaths?.clear();
                if (next.unconfigured === true) {
                    if (queueTimer !== null) clearTimeout(queueTimer);
                    queueTimer = null;
                    queueAt = null;
                    hub.publish('hpc', unconfigured());
                    return;
                }
                hub.publish('hpc', degraded('starting'));
                void publishQuota();
                void refresh();
            } else if (next.days !== before.days) {
                asking += 1;
                prewarmDue = false;
                void refresh();
            }
        },
        close(): void {
            closed = true;
            if (queueTimer !== null) clearTimeout(queueTimer);
            queueTimer = null;
            queueAt = null;
            if (quotaTimer !== null) clearTimeout(quotaTimer);
            quotaTimer = null;
        }
    };
}
