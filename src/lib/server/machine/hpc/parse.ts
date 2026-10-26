// Layer 2, server. Pure SLURM text parsers, the section markers they read and the accounting window
// date the queries are built with, so every one of them is exercised without ssh.
import type { HpcJob, HpcPartition, HpcQuotaItem, HpcRecent } from '../../../data/model/index.ts';

export const SEC_SACCT = '@@oculus:sacct@@';
export const SEC_SINFO = '@@oculus:sinfo@@';
export const SEC_RC = '@@oculus:squeue_rc=';
export const SEC_RECOVER = '@@oculus:recover@@';
/** The first line a poll's remote command prints, so its answer says that ssh connected. */
export const SEC_CONNECTED = '@@oculus:connected@@';
/**
 * The return code line of `sacct` and of `sinfo`, each printed directly after its command as
 * `SEC_RC` is after `squeue`.
 */
export const SEC_SACCT_RC = '@@oculus:sacct_rc=';
export const SEC_SINFO_RC = '@@oculus:sinfo_rc=';
/**
 * The sections holding what `squeue`, `sacct` and `sinfo` wrote to their stderr, apart from ssh's
 * own stderr.
 */
export const SEC_SQUEUE_ERR = '@@oculus:squeue_err@@';
export const SEC_SACCT_ERR = '@@oculus:sacct_err@@';
export const SEC_SINFO_ERR = '@@oculus:sinfo_err@@';

/**
 * The day an accounting query starts from, as many days back as asked, which sacct reads as a date.
 */
export function dateFrom(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - Math.max(1, days));
    return date.toISOString().slice(0, 10);
}

export function durationSeconds(value: string): number | null {
    let text = value.trim();
    if (!text || /^(UNLIMITED|INVALID|N\/A|PARTITION_LIMIT)$/i.test(text)) return null;
    let days = 0;
    if (text.includes('-')) {
        const parts = text.split('-', 2);
        days = Number(parts[0]) || 0;
        text = parts[1];
    }
    const parts = text.split(':').map(Number);
    if (parts.some(Number.isNaN)) return null;
    while (parts.length < 3) parts.unshift(0);
    return ((days * 24 + parts[0]) * 60 + parts[1]) * 60 + parts[2];
}

export function memoryBytes(value: string): { bytes: number; per: string } | null {
    const found = /^([\d.]+)\s*([KMGTP]?)([nc]?)$/i.exec(value.trim().replace(/\*$/, ''));
    if (!found) return null;
    const amount = Number(found[1]);
    if (!(amount > 0)) return null;
    const power = ['', 'K', 'M', 'G', 'T', 'P'].indexOf(found[2].toUpperCase());
    return { bytes: amount * 1024 ** power, per: found[3].toLowerCase() };
}

export function humanMemory(bytes?: number): string {
    if (!bytes) return '';
    const gib = bytes / 1024 ** 3;
    return gib >= 1
        ? `${gib < 10 ? gib.toFixed(1) : Math.round(gib)}G`
        : `${Math.round(bytes / 1024 ** 2)}M`;
}

export function gpuCount(value: string): string {
    const found = /gpu[:=][^,\s]*/i.exec(value);
    if (!found) return '';
    const last = found[0].split(/[:=]/).at(-1) ?? '';
    return /^\d+$/.test(last) ? last : '';
}

export function parseSqueue(raw: string): HpcJob[] {
    return raw.split('\n').flatMap((line) => {
        const f = line.trim().split('|');
        if (f.length < 13 || !f[0]) return [];
        return [
            {
                id: f[0],
                name: f[1],
                partition: f[2],
                state: f[3],
                time: f[4],
                limit: f[5],
                nodes: f[6],
                cpus: f[7],
                gpus: gpuCount(f[8]),
                mem: f[9],
                priority: f[10],
                start: /^(N\/A|\(null\)|Unknown)$/.test(f[11]) ? '' : f[11],
                reason: f[12]
            }
        ];
    });
}

export function parseSinfo(raw: string): HpcPartition[] {
    return raw.split('\n').flatMap((line) => {
        const f = line.trim().split('|');
        return f.length < 5 || !f[0]
            ? []
            : [
                  {
                      partition: f[0].replace(/\*$/, ''),
                      avail: f[1],
                      nodes: Number(f[2]) || 0,
                      state: f[3].replace(/\*$/, ''),
                      gres: f[4]
                  }
              ];
    });
}

export function parseSacct(raw: string): HpcRecent[] {
    const base = new Map<string, string[]>();
    const rss = new Map<string, number>();
    const stepCpu = new Map<string, number>();
    for (const line of raw.split('\n')) {
        const f = line.trim().split('|');
        if (f.length < 12 || !f[0]) continue;
        if (f[0].includes('.')) {
            const root = f[0].split('.')[0];
            const mem = memoryBytes(f[7]);
            const cpu = durationSeconds(f[8]);
            if (mem) rss.set(root, Math.max(rss.get(root) ?? 0, mem.bytes));
            if (cpu) stepCpu.set(root, Math.max(stepCpu.get(root) ?? 0, cpu));
        } else if (!/^(RUNNING|PENDING|REQUEUED|RESIZING|SUSPENDED)/.test(f[2])) base.set(f[0], f);
    }
    return [...base.values()]
        .map((f) => {
            const ncpus = Number(f[9]) || 0;
            const nnodes = Number(f[10]) || 1;
            const req = memoryBytes(f[6]);
            const reqTotal = req ? req.bytes * (req.per === 'c' ? ncpus : Math.max(1, nnodes)) : 0;
            const used = rss.get(f[0]) ?? 0;
            const cpu = durationSeconds(f[8]) ?? stepCpu.get(f[0]) ?? 0;
            const elapsed = Number(f[11]) || 0;
            return {
                id: f[0],
                name: f[1],
                state: f[2].split(' ')[0],
                exit: f[3],
                elapsed: f[4],
                end: f[5],
                memUsed: humanMemory(used),
                memReq: humanMemory(reqTotal),
                memPct: used && reqTotal ? Math.round((100 * used) / reqTotal) : null,
                cpuPct: cpu && elapsed && ncpus ? Math.round((100 * cpu) / (elapsed * ncpus)) : null
            };
        })
        .sort((a, b) => b.end.localeCompare(a.end))
        .slice(0, 40);
}

export function parseQuota(raw: string): HpcQuotaItem[] {
    const quota: HpcQuotaItem[] = [];
    const disk: HpcQuotaItem[] = [];
    for (const line of raw.split('\n')) {
        const p = line.trim().split(/\s+/);
        const at = p.findIndex((one) => /^\d+%$/.test(one));
        if (at < 0 && p[0]?.startsWith('/') && p.length >= 4) {
            const used = memoryBytes(p[1]);
            const limit = memoryBytes(p[3]);
            if (used && limit)
                quota.push({
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
                    name: p[0].split('/').at(-1) || 'home',
                    used: humanMemory(used.bytes),
                    limit: humanMemory(limit.bytes),
                    pct: Math.round((100 * used.bytes) / limit.bytes)
                });
        }
        if (at >= 3 && p[at + 1])
            disk.push({
                name: /scratch/i.test(p[at + 1])
                    ? 'scratch'
                    : /home/i.test(p[at + 1])
                      ? 'home'
                      : // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
                        p[at + 1].split('/').at(-1) || 'disk',
                used: p[at - 2],
                limit: p[at - 3],
                pct: Number(p[at].slice(0, -1))
            });
    }
    return quota.length ? quota : disk;
}

/** Every marker a poll's answer holds, which `splitSections` reads wherever it starts on a line. */
const MARKERS = [
    SEC_CONNECTED,
    SEC_RC,
    SEC_SACCT_RC,
    SEC_SINFO_RC,
    SEC_SQUEUE_ERR,
    SEC_SACCT_ERR,
    SEC_SINFO_ERR,
    SEC_SACCT,
    SEC_SINFO,
    SEC_RECOVER
];

/** The code a return code line carries after its marker, or 0 when it carries no number. */
function codeOf(line: string, marker: string): number {
    return Number(line.slice(marker.length).replace(/@+$/, '').trim()) || 0;
}

/**
 * The sections of one batch answer; `recover` is Recover's part (runs/recover/live/batch.ts).
 * `squeueCode`, `sacctCode` and `sinfoCode` are each 0 when the answer holds no return code line
 * of that command. `squeueError`, `sacctError` and `sinfoError` are what each command wrote to its
 * stderr, `connected` whether the connected marker was printed and `sinfoBegun` whether the last
 * Slurm section had begun, so an answer cut short says how far it got.
 */
export function splitSections(raw: string): {
    squeue: string;
    sacct: string;
    sinfo: string;
    recover: string;
    squeueCode: number;
    sacctCode: number;
    sinfoCode: number;
    squeueError: string;
    sacctError: string;
    sinfoError: string;
    connected: boolean;
    sinfoBegun: boolean;
} {
    const parts: string[][] = [[], [], [], [], [], [], []];
    let at = 0;
    let squeueCode = 0;
    let sacctCode = 0;
    let sinfoCode = 0;
    let connected = false;
    let sinfoBegun = false;
    for (const whole of raw.split('\n')) {
        // A marker is printed after a command whose output may end with no newline, as when
        // `timeout` stops it mid-row, so it can sit at the end of that output's last line: the
        // text before it stays in the section it was printed in, and the marker is read from there.
        const glued = MARKERS.map((marker) => whole.indexOf(marker)).filter((one) => one > 0);
        const cut = glued.length === 0 ? 0 : Math.min(...glued);
        if (cut > 0) parts[at].push(whole.slice(0, cut));
        const line = whole.slice(cut);
        if (line.startsWith(SEC_CONNECTED)) connected = true;
        else if (line.startsWith(SEC_RC)) squeueCode = codeOf(line, SEC_RC);
        else if (line.startsWith(SEC_SACCT_RC)) sacctCode = codeOf(line, SEC_SACCT_RC);
        else if (line.startsWith(SEC_SINFO_RC)) sinfoCode = codeOf(line, SEC_SINFO_RC);
        else if (line.startsWith(SEC_SQUEUE_ERR)) at = 4;
        else if (line.startsWith(SEC_SACCT_ERR)) at = 5;
        else if (line.startsWith(SEC_SINFO_ERR)) at = 6;
        else if (line.startsWith(SEC_SACCT)) at = 1;
        else if (line.startsWith(SEC_SINFO)) {
            at = 2;
            sinfoBegun = true;
        } else if (line.startsWith(SEC_RECOVER)) at = 3;
        else parts[at].push(line);
    }
    return {
        squeue: parts[0].join('\n'),
        sacct: parts[1].join('\n'),
        sinfo: parts[2].join('\n'),
        recover: parts[3].join('\n'),
        squeueCode,
        sacctCode,
        sinfoCode,
        squeueError: parts[4].join('\n'),
        sacctError: parts[5].join('\n'),
        sinfoError: parts[6].join('\n'),
        connected,
        sinfoBegun
    };
}
