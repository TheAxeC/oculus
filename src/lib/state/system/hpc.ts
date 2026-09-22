// Layer 2, client state. Pure formatting and tone choices for the Live HPC view keep display policy
// out of its components.
import type { HpcJob, HpcPartition } from '../../data/model.ts';
export type {
    HpcJob,
    HpcPartition,
    HpcPayload,
    HpcQuotaItem,
    HpcRecent
} from '../../data/model.ts';

export function walltimeFraction(job: HpcJob): number | null {
    if (job.state !== 'RUNNING') return null;
    const seconds = (value: string): number | null => {
        let text = value;
        let days = 0;
        if (text.includes('-')) {
            const split = text.split('-', 2);
            days = Number(split[0]) || 0;
            text = split[1];
        }
        const parts = text.split(':').map(Number);
        if (parts.some(Number.isNaN)) return null;
        while (parts.length < 3) parts.unshift(0);
        return ((days * 24 + parts[0]) * 60 + parts[1]) * 60 + parts[2];
    };
    const used = seconds(job.time);
    const limit = seconds(job.limit);
    return used === null || !limit ? null : Math.min(1, used / limit);
}
export function stateTone(state: string): string {
    return state === 'RUNNING' ? 'green' : state === 'PENDING' ? 'amber' : 'slate';
}
export function efficiencyTone(pct: number | null): string | undefined {
    return pct === null ? undefined : pct >= 90 ? 'green' : pct < 25 ? 'red' : 'amber';
}
export function startLabel(value: string): string {
    const found = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    return found ? `${found[1]}-${found[2]} ${found[3]}:${found[4]}` : value;
}
export type PartitionMeter = {
    name: string;
    idle: number;
    mixed: number;
    allocated: number;
    total: number;
    gpu: boolean;
};
export function partitionMeters(rows: HpcPartition[]): PartitionMeter[] {
    const found = new Map<string, PartitionMeter>();
    for (const row of rows) {
        const meter = found.get(row.partition) ?? {
            name: row.partition,
            idle: 0,
            mixed: 0,
            allocated: 0,
            total: 0,
            gpu: false
        };
        const state = row.state.toLowerCase();
        if (state.startsWith('idle')) meter.idle += row.nodes;
        else if (state.startsWith('mix')) meter.mixed += row.nodes;
        else meter.allocated += row.nodes;
        meter.total += row.nodes;
        meter.gpu ||= /gpu/i.test(row.partition) || /gpu/i.test(row.gres);
        found.set(row.partition, meter);
    }
    return [...found.values()];
}
