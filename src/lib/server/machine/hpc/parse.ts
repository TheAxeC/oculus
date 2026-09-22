// Layer 2, server. Pure SLURM text parsers, the section markers they read and the accounting window date the queries are built with, so every one of them is exercised without ssh.
import type { HpcJob, HpcPartition, HpcQuotaItem, HpcRecent } from '../../../data/model.ts';

export const SEC_SACCT = '@@oculus:sacct@@';
export const SEC_SINFO = '@@oculus:sinfo@@';
export const SEC_RC = '@@oculus:squeue_rc=';

/** The day an accounting query starts from, as many days back as asked, which sacct reads as a date. */
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

export function splitSections(raw: string): {
    squeue: string;
    sacct: string;
    sinfo: string;
    squeueCode: number;
} {
    const parts: string[][] = [[], [], []];
    let at = 0;
    let squeueCode = 0;
    for (const line of raw.split('\n')) {
        if (line.startsWith(SEC_RC))
            squeueCode = Number(line.slice(SEC_RC.length).replace(/@+$/, '').trim()) || 0;
        else if (line.startsWith(SEC_SACCT)) at = 1;
        else if (line.startsWith(SEC_SINFO)) at = 2;
        else parts[at].push(line);
    }
    return {
        squeue: parts[0].join('\n'),
        sacct: parts[1].join('\n'),
        sinfo: parts[2].join('\n'),
        squeueCode
    };
}
