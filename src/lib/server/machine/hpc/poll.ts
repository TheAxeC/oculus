// Layer 2, server. The Live HPC watcher of one cluster hands one complete state message of that
// cluster to its output (clusters/watch.ts gathers every cluster's into the `hpc` channel), with
// quota refreshed on its slower independent cadence. Its one ssh command per poll, on the
// cluster's connection, also carries Recover's section of that cluster (the sessions on the socket
// `oculus-recover`, their folders' bytes and the logs Recover follows), which it hands back to
// Recover's watcher; Recover asks for that section alone, with the queue, once a minute while a run
// on the cluster is followed (`recover`). A failed poll is published as one of three: ssh did not
// connect (`unreachable`), ssh connected and one of `squeue`, `sacct` and `sinfo` did not answer
// (`slurm_down`), or anything else (`error`), each over the rows earlier polls left, and with the
// failure its hint is told apart as by the hub's `connections.failures` when a row matches it. A
// poll in which `squeue` answered and only `sacct` or `sinfo` did not is `slurm_down` with this
// poll's queue and every table whose command answered, so the queue and Recover's reading stay
// live; the table whose command failed keeps the rows of the last poll in which that command
// answered, and the payload names it in `stale` with the time they came from.
import { queueIsCurrent, type HpcJob, type HpcPayload } from '../../../data/model/index.ts';
import { toldFailure, type FailureRow } from '../../../data/sources/config.ts';
import { fillPlaceholders } from '../../../data/helpers/finding-text.ts';
import type { LogPaths } from './actions.ts';
import {
    dateFrom,
    parseQuota,
    parseSacct,
    parseSinfo,
    parseSqueue,
    SEC_CONNECTED,
    SEC_RC,
    SEC_RECOVER,
    SEC_SACCT,
    SEC_SACCT_ERR,
    SEC_SACCT_RC,
    SEC_SINFO,
    SEC_SINFO_ERR,
    SEC_SINFO_RC,
    SEC_SQUEUE_ERR,
    splitSections
} from './parse.ts';
import { isFinished, PREWARM_MAX, prewarmLogs } from './prewarm.ts';
import { run, RunTimeout, type Connection, type Runner, type RunResult } from './ssh.ts';

/**
 * The sentences of the text catalog a failed poll's hint is made of: `sshExited` takes the exit
 * code as `{0}`, `slurmLate` is Slurm not answering within its limit, and `overrun` is the poll
 * running past its limit after Slurm answered.
 */
export type PollWords = { sshExited: string; slurmLate: string; overrun: string };

/**
 * What the poller of one cluster is told: the cluster's key and name, its connection, or the empty
 * host and the sentence for why there is none (the resolver in clusters/connections.ts), the
 * cadences and the window, the sentences a failed poll's hint is made of, and the rows that tell a
 * failure apart.
 */
export type HpcSettings = Connection & {
    resource: string;
    name: string;
    missing?: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
    words: PollWords;
    failures: readonly FailureRow[];
};

/**
 * Where one cluster's watcher hands its payload, and the payload it handed last. The output of a
 * watcher that was stopped takes nothing more (clusters/watch.ts).
 */
export type ClusterOut = {
    publish: (payload: HpcPayload) => void;
    latest: () => HpcPayload | undefined;
};

/**
 * Recover's part of the batch (runs/recover/live/batch.ts): the commands of its section, read when
 * each poll starts, and the section and the queue of a poll the cluster answered.
 */
export type HpcSection = {
    command: () => string;
    take: (section: string, jobs: HpcJob[]) => void;
};

export type HpcOptions = HpcSettings & {
    /** The log path per job id the log action reads, which the prewarm fills in behind the page. */
    logPaths?: LogPaths;
    recover?: HpcSection;
    runner?: Runner;
    timeoutMs?: number;
};
export type HpcWatcher = {
    refresh(): Promise<void>;
    /**
     * Run Recover's section alone, with the queue, on the host the polls ask, and hand the answer
     * to Recover as a poll does. It runs only while the last poll had the cluster's answer for the
     * queue (`queueIsCurrent`), so a cluster that does not answer gets no command but the polls'
     * own.
     */
    recover(): Promise<void>;
    /**
     * Take new settings. A period moves the next run to the sooner of the one waiting and the new
     * period from now; a changed connection (host, user name or key file) or a changed sentence
     * for having none drops what the old one answered, the rows and the time each came from
     * included, and polls now; a changed window drops the answers in flight and polls now, keeping
     * the rows and their times. A changed name is published at once, and changed failure rows are
     * used from the next failed poll on.
     */
    set(settings: HpcSettings): void;
    close(): void;
};

/** The queue of this user, one job per line, which a poll and Recover's reading both ask for. */
const SQUEUE = `squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R'`;

/**
 * Seconds the cluster's `timeout` gives each Slurm command, 25 together. A controller that does not
 * answer then ends the poll with Slurm's own answer inside the runner's 40 s, which keeps 15 s for
 * ssh's connect (`ConnectTimeout=8`, ssh.ts) and Recover's section. `squeue` gets the most, since
 * the queue's counts lead the view's head bar and the status bar.
 */
const SQUEUE_SECS = 12;
const SACCT_SECS = 8;
const SINFO_SECS = 5;

/**
 * The one command of a poll. It prints the connected marker first, so an answer cut short says
 * whether ssh connected. Each Slurm command (`squeue`, `sacct`, `sinfo`) runs under the cluster's
 * `timeout`, and a return code line follows each timed command directly, so it holds that
 * command's code or `timeout`'s 124. Each command's stderr goes through one file, written anew by
 * each and removed after the last, into a section of its own, so Slurm's messages are read apart
 * from ssh's warnings and a login banner; where no such file can be made they are dropped.
 * `recover` is the commands of Recover's section, last.
 */
export function batchCommand(days: number, recover = ''): string {
    return [
        `echo "${SEC_CONNECTED}"`,
        `oculus_err=$(mktemp 2>/dev/null) || oculus_err=/dev/null`,
        `timeout ${SQUEUE_SECS} ${SQUEUE} 2>"$oculus_err"`,
        `echo "${SEC_RC}$?"`,
        `echo "${SEC_SQUEUE_ERR}"`,
        `cat "$oculus_err"`,
        `echo "${SEC_SACCT}"`,
        `timeout ${SACCT_SECS} sacct -u "$USER" -S ${dateFrom(days)} -o JobID,JobName%60,State,ExitCode,Elapsed,End,ReqMem,MaxRSS,TotalCPU,AllocCPUS,NNodes,ElapsedRaw -Pn 2>"$oculus_err"`,
        `echo "${SEC_SACCT_RC}$?"`,
        `echo "${SEC_SACCT_ERR}"`,
        `cat "$oculus_err"`,
        `echo "${SEC_SINFO}"`,
        `timeout ${SINFO_SECS} sinfo -h -o '%P|%a|%D|%t|%G' 2>"$oculus_err"`,
        `echo "${SEC_SINFO_RC}$?"`,
        `echo "${SEC_SINFO_ERR}"`,
        `cat "$oculus_err"`,
        `[ "$oculus_err" = /dev/null ] || rm -f "$oculus_err"`,
        ...(recover === '' ? [] : [`echo "${SEC_RECOVER}"`, recover])
    ].join('\n');
}

/**
 * Recover's section alone, after the queue it reads a job's state from, with the poll's connected
 * marker and `squeue`'s limit.
 */
export function recoverCommand(recover: string): string {
    return [
        `echo "${SEC_CONNECTED}"`,
        `timeout ${SQUEUE_SECS} ${SQUEUE}`,
        `echo "${SEC_RC}$?"`,
        `echo "${SEC_RECOVER}"`,
        recover
    ].join('\n');
}

/** The code ssh exits with when it could not connect, or the connection broke. */
const SSH_FAILED = 255;

/** The code the cluster's `timeout` exits with when it stopped the command it ran. */
const TIMED_OUT = 124;

/** A failed poll: its status word and the hint the page shows under that status's sentence. */
type Failure = { status: 'unreachable' | 'slurm_down' | 'error'; hint?: string };

/** Whether two settings name one connection, so the answers of the one hold for the other. */
function sameConnection(one: HpcSettings, two: HpcSettings): boolean {
    return (
        one.host === two.host &&
        one.user === two.user &&
        one.keyFile === two.keyFile &&
        one.missing === two.missing
    );
}

/**
 * The hint of a poll Slurm did not answer, from its Slurm commands whose code is not 0, in the
 * order `squeue`, `sacct`, `sinfo`: the sentence for Slurm's limit when `timeout` stopped the
 * first of them, and otherwise the first line one of them wrote to its stderr that is not empty,
 * and that sentence again when none wrote one and `timeout` stopped any of them.
 */
function slurmHint(
    failed: { code: number; error: string }[],
    words: PollWords
): string | undefined {
    if (failed[0]?.code === TIMED_OUT) return words.slurmLate;
    for (const one of failed) {
        const line = one.error
            .split('\n')
            .map((text) => text.trim())
            .find((text) => text !== '');
        if (line !== undefined) return line;
    }
    return failed.some((one) => one.code === TIMED_OUT) ? words.slurmLate : undefined;
}

/**
 * How a poll's answer fails, or null when it holds the cluster's whole answer. An answer with the
 * Slurm sections and the code 0 of `squeue`, `sacct` and `sinfo` is the cluster's answer, the
 * connected marker or not, unless ssh broke after it connected. Without the marker, ssh's 255 is
 * ssh not connecting, with its stderr as the hint. With the marker, a code other than 0 of any of
 * the three is Slurm not answering, with the hint `slurmHint` gives; `partialAnswer` says whether
 * such an answer holds this poll's queue. Anything else is an error, with ssh's stderr or its exit
 * code as the hint.
 */
function answerFailure(
    result: RunResult,
    parts: ReturnType<typeof splitSections>,
    words: PollWords
): Failure | null {
    const broke = result.code === SSH_FAILED;
    const failed = [
        { code: parts.squeueCode, error: parts.squeueError },
        { code: parts.sacctCode, error: parts.sacctError },
        { code: parts.sinfoCode, error: parts.sinfoError }
    ].filter((one) => one.code !== 0);
    if (result.stdout.includes(SEC_SACCT) && failed.length === 0 && !broke) return null;
    const said = result.stderr.trim() || fillPlaceholders(words.sshExited, [result.code]);
    if (!parts.connected && broke) return { status: 'unreachable', hint: said };
    if (parts.connected && failed.length > 0) {
        return { status: 'slurm_down', hint: slurmHint(failed, words) };
    }
    return { status: 'error', hint: said };
}

/**
 * Whether a failed poll's answer holds this poll's queue: ssh connected and did not break,
 * `squeue` answered (code 0), and `sacct` or `sinfo` did not. The tables whose command answered are
 * this poll's too. A runner's rejection is never such an answer: the runner's limit is past the
 * three commands' own, so a rejection after `squeue` answered is ssh or the remote shell hanging.
 */
function partialAnswer(result: RunResult, parts: ReturnType<typeof splitSections>): boolean {
    return (
        parts.connected &&
        result.code !== SSH_FAILED &&
        parts.squeueCode === 0 &&
        (parts.sacctCode !== 0 || parts.sinfoCode !== 0)
    );
}

/**
 * How a poll whose runner rejected fails. A rejection that is not the runner's timeout is an error
 * with its message. A timeout before the connected marker is ssh not connecting, with the word
 * `timeout`; one after the marker and before the last Slurm section began is Slurm not answering;
 * one after it is the rest of the command, Recover's section, running past the limit.
 */
function rejectionFailure(error: unknown, words: PollWords): Failure {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('timeout')) return { status: 'error', hint: message };
    const parts = splitSections(error instanceof RunTimeout ? error.stdout : '');
    if (!parts.connected) return { status: 'unreachable', hint: message };
    if (!parts.sinfoBegun) return { status: 'slurm_down', hint: words.slurmLate };
    return { status: 'error', hint: words.overrun };
}

const quotaCommand = `quota -s 2>/dev/null; echo "---df---"; df -h "$HOME" 2>/dev/null`;

/**
 * Minutes before the next attempt while the cluster is not answering. The regular cadence is tuned
 * for a cluster that answers; after a failure it is the time a reader sits in front of a stale
 * page, and a connect that fails costs one refused socket.
 */
export const RETRY_MIN = 2;

/**
 * The queue of the last good or partial poll (`partialAnswer`), and each table of the last such
 * poll in which its own command answered, kept so a failed poll shows them rather than nothing. A
 * poll in which `squeue` answered but whose ssh exit says the cluster was not reached keeps the
 * old queue.
 */
type Rows = Pick<HpcPayload, 'jobs' | 'running' | 'pending' | 'total' | 'recent' | 'sinfo'>;
const NO_ROWS: Rows = { jobs: [], running: 0, pending: 0, total: 0, recent: [], sinfo: [] };

/**
 * The time (ISO) of the poll each table's rows came from, or null while no poll has answered for
 * that table. A table whose time is not the queue's (`lastOk`) is older than the queue.
 */
type Times = { recent: string | null; sinfo: string | null };
const NO_TIMES: Times = { recent: null, sinfo: null };

/** The connection of the settings, its host, user name and key file alone. */
export function connectionOf(settings: HpcSettings): Connection {
    return {
        host: settings.host,
        ...(settings.user === undefined ? {} : { user: settings.user }),
        ...(settings.keyFile === undefined ? {} : { keyFile: settings.keyFile })
    };
}

/** The settings out of the options, the connection, the cluster and the cadences alone. */
function settingsOf(options: HpcSettings): HpcSettings {
    return {
        ...connectionOf(options),
        resource: options.resource,
        name: options.name,
        ...(options.missing === undefined ? {} : { missing: options.missing }),
        days: options.days,
        pollMin: options.pollMin,
        quotaMin: options.quotaMin,
        prewarm: options.prewarm,
        words: options.words,
        failures: options.failures
    };
}

export function watchHpc(out: ClusterOut, options: HpcOptions): HpcWatcher {
    let current: HpcSettings = settingsOf(options);
    /**
     * Counts the changes of connection, sentence or window. A poll, quota read or prewarm that
     * began under an older count answers for a cluster or a window nobody asks for any more, and
     * drops its result.
     */
    let asking = 0;
    /** Counts the changes of connection alone: a quota read does not depend on the window. */
    let hosts = 0;
    const runner = options.runner ?? run;
    const timeout = options.timeoutMs ?? 40000;
    let quota: HpcPayload['quota'] = [];
    let rows: Rows = NO_ROWS;
    let times: Times = NO_TIMES;
    /**
     * The time of the last good or partial poll (`partialAnswer`), the last answer for the queue,
     * or empty while there has been none.
     */
    let lastOk = '';
    let closed = false;
    /**
     * Whether the Recent rows of the last poll are waiting for the prewarm. A good or partial poll
     * (`partialAnswer`) whose `sacct` answered sets it while `prewarm` is on, and every other poll
     * clears it, so the prewarm only ever runs against the Recent rows of the poll that set it and
     * never against rows kept from an earlier one.
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
     * Each table whose rows are older than the queue, with the time they came from, or undefined
     * when every table is as old as the queue.
     */
    const staleTables = (): HpcPayload['stale'] => {
        const queue = lastOk === '' ? null : lastOk;
        const stale: NonNullable<HpcPayload['stale']> = {};
        if (times.recent !== queue) stale.recent = times.recent;
        if (times.sinfo !== queue) stale.sinfo = times.sinfo;
        return stale.recent === undefined && stale.sinfo === undefined ? undefined : stale;
    };
    /**
     * A publish of a poll that failed: the state word and its hint over the rows as they stand and
     * the time the queue came from, so a page shows what the queue was rather than an empty one,
     * with each table older than the queue named in `stale`. `updated` is the time of a partial
     * poll (`partialAnswer`), which is its `lastOk` too, and the time of the publish otherwise, a
     * poll in which `squeue` answered but whose ssh exit says the cluster was not reached included.
     */
    const degraded = (
        status: HpcPayload['status'],
        hint?: string,
        updated = new Date().toISOString()
    ): HpcPayload => {
        const stale = staleTables();
        const failure = hint === undefined ? null : toldFailure(current.failures, hint);
        return {
            resource: current.resource,
            name: current.name,
            status,
            ...(hint ? { hint } : {}),
            ...(failure === null ? {} : { failure }),
            ...rows,
            quota,
            updated,
            ...(lastOk ? { lastOk } : {}),
            ...(stale === undefined ? {} : { stale }),
            pollMin: current.pollMin,
            retryMin: RETRY_MIN,
            host: current.host
        };
    };
    out.publish(degraded('starting'));

    const publishQuota = async (): Promise<void> => {
        if (stopped() || current.host === '') return;
        const began = hosts;
        try {
            const result = await runner(connectionOf(current), quotaCommand, 25000);
            if (stopped() || began !== hosts) return;
            const next = parseQuota(result.stdout);
            if (result.code === 0 && next.length) {
                quota = next;
                const held = out.latest();
                if (held !== undefined) out.publish({ ...held, quota });
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
        if (stopped()) return;
        arm(Date.now() + minutes * 60000);
    };
    /** Hand a payload to the output, with one console line naming the cluster and its status. */
    const publish = (payload: HpcPayload): void => {
        out.publish(payload);
        console.log(`hpc publish: ${current.resource} ${payload.status}`);
    };
    const poll = async (): Promise<void> => {
        let good = false;
        const began = asking;
        try {
            if (current.host === '') {
                // No host to ask: the sentence for why is the answer; the retry cadence applies.
                publish(degraded('unreachable', current.missing));
                return;
            }
            const command = batchCommand(current.days, options.recover?.command() ?? '');
            const result = await runner(connectionOf(current), command, timeout);
            if (stopped() || began !== asking) return;
            const parts = splitSections(result.stdout);
            const failure = answerFailure(result, parts, current.words);
            if (failure !== null && !partialAnswer(result, parts)) {
                prewarmDue = false;
                publish(degraded(failure.status, failure.hint));
                return;
            }
            // The queue is this poll's, and so is each table whose command answered.
            const now = new Date().toISOString();
            const jobs = parseSqueue(parts.squeue);
            const recentRead = parts.sacctCode === 0;
            const sinfoRead = parts.sinfoCode === 0;
            rows = {
                jobs,
                running: jobs.filter((job) => job.state === 'RUNNING').length,
                pending: jobs.filter((job) => job.state === 'PENDING').length,
                total: jobs.length,
                recent: recentRead ? parseSacct(parts.sacct) : rows.recent,
                sinfo: sinfoRead ? parseSinfo(parts.sinfo) : rows.sinfo
            };
            times = {
                recent: recentRead ? now : times.recent,
                sinfo: sinfoRead ? now : times.sinfo
            };
            options.recover?.take(parts.recover, jobs);
            lastOk = now;
            good = failure === null;
            prewarmDue = current.prewarm && recentRead;
            publish(
                failure === null
                    ? {
                          resource: current.resource,
                          name: current.name,
                          status: 'ok',
                          ...rows,
                          quota,
                          updated: now,
                          lastOk,
                          pollMin: current.pollMin,
                          retryMin: RETRY_MIN,
                          host: current.host
                      }
                    : degraded(failure.status, failure.hint, now)
            );
        } catch (error) {
            prewarmDue = false;
            if (stopped() || began !== asking) return;
            const failure = rejectionFailure(error, current.words);
            publish(degraded(failure.status, failure.hint));
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
                const found = await prewarmLogs(connectionOf(current), todo, current.days, runner);
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
     * The prewarm the last poll whose `sacct` answered asked for, started behind the page and
     * joined by nothing: not the poll gate below, not the promise a Refresh press waits on. A press
     * that asked for a refresh would otherwise wait on a directory walk whose cost is the cluster's
     * to set, so a poll may run beside a prewarm and the watcher holds three connections at most:
     * one poll, one quota read and one prewarm, each with its own budget. A prewarm still running
     * when the next such poll lands is left to finish, and that poll's rows get their turn when it
     * does.
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
    const recover = async (): Promise<void> => {
        const section = options.recover;
        if (stopped() || section === undefined || current.host === '') return;
        const held = out.latest();
        if (held === undefined || !queueIsCurrent(held)) return;
        const began = asking;
        try {
            const result = await runner(
                connectionOf(current),
                recoverCommand(section.command()),
                timeout
            );
            if (stopped() || began !== asking) return;
            const parts = splitSections(result.stdout);
            if (result.code !== 0 || parts.squeueCode !== 0) return;
            section.take(parts.recover, parseSqueue(parts.squeue));
        } catch {
            // A failed reading leaves the last one; the next poll reads the section again.
        }
    };
    return {
        refresh,
        recover,
        set(next): void {
            if (stopped()) return;
            const before = current;
            current = settingsOf(next);
            if (next.pollMin !== before.pollMin) {
                if (queueAt !== null) arm(Math.min(queueAt, Date.now() + next.pollMin * 60000));
                const held = out.latest();
                if (held !== undefined) out.publish({ ...held, pollMin: next.pollMin });
            }
            if (next.quotaMin !== before.quotaMin) {
                armQuota(Math.min(quotaAt, Date.now() + next.quotaMin * 60000));
            }
            if (next.name !== before.name) {
                const held = out.latest();
                if (held !== undefined) out.publish({ ...held, name: next.name });
            }
            if (!sameConnection(next, before)) {
                asking += 1;
                hosts += 1;
                rows = NO_ROWS;
                times = NO_TIMES;
                lastOk = '';
                quota = [];
                prewarmDue = false;
                asked.clear();
                options.logPaths?.clear();
                out.publish(degraded('starting'));
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
