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

export function watchHpc(hub: Hub, options: HpcOptions): HpcWatcher {
    const runner = options.runner ?? run;
    const timeout = options.timeoutMs ?? 40000;
    let quota: HpcPayload['quota'] = [];
    let closed = false;
    const empty = (status: HpcPayload['status'], hint?: string): HpcPayload => ({
        status,
        ...(hint ? { hint } : {}),
        jobs: [],
        running: 0,
        pending: 0,
        total: 0,
        recent: [],
        sinfo: [],
        quota,
        updated: new Date().toISOString(),
        pollMin: options.pollMin,
        host: options.host
    });
    hub.publish('hpc', empty('starting'));

    const publishQuota = async (): Promise<void> => {
        if (closed) return;
        try {
            const result = await runner(options.host, quotaCommand, 25000);
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
    const refresh = async (): Promise<void> => {
        if (closed) return;
        try {
            const result = await runner(options.host, batchCommand(options.days), timeout);
            const parts = splitSections(result.stdout);
            if (!result.stdout.includes(SEC_SACCT) || parts.squeueCode !== 0) {
                const payload = empty(
                    'unreachable',
                    result.stderr.trim() || `ssh exited ${result.code}`
                );
                hub.publish('hpc', payload);
                console.log(`hpc publish: ${payload.status}`);
                return;
            }
            const jobs = parseSqueue(parts.squeue);
            hub.publish('hpc', {
                status: 'ok',
                jobs,
                running: jobs.filter((job) => job.state === 'RUNNING').length,
                pending: jobs.filter((job) => job.state === 'PENDING').length,
                total: jobs.length,
                recent: parseSacct(parts.sacct),
                sinfo: parseSinfo(parts.sinfo),
                quota,
                updated: new Date().toISOString(),
                pollMin: options.pollMin,
                host: options.host
            });
            console.log('hpc publish: ok');
        } catch (error) {
            const hint = error instanceof Error ? error.message : String(error);
            const payload = empty(
                hint.toLowerCase().includes('timeout') ? 'unreachable' : 'error',
                hint
            );
            hub.publish('hpc', payload);
            console.log(`hpc publish: ${payload.status}`);
        }
    };
    void publishQuota();
    void refresh();
    const queueTimer = setInterval(() => void refresh(), options.pollMin * 60000);
    const quotaTimer = setInterval(() => void publishQuota(), options.quotaMin * 60000);
    return {
        refresh,
        close(): void {
            closed = true;
            clearInterval(queueTimer);
            clearInterval(quotaTimer);
        }
    };
}
