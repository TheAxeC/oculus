// Layer 2, client state. Pure formatting, tone and word choices for the Live HPC view and the
// status bar's HPC item keep display policy out of their components.
import {
    queueIsCurrent,
    type HpcJob,
    type HpcPartition,
    type HpcPayload
} from '../../../../data/model/index.ts';
import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { clock } from '../../../shared/words/format.ts';
import { t } from '../../../shared/words/text.ts';
export { queueIsCurrent } from '../../../../data/model/index.ts';
export type {
    HpcJob,
    HpcPartition,
    HpcPayload,
    HpcQuotaItem,
    HpcRecent
} from '../../../../data/model/index.ts';

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
/**
 * The words of a failed poll: the short word of the head's pill and the status bar, and the
 * sentence of the error box, the Login node section and the status bar's tooltip. A failed poll
 * whose queue is this poll's (`queueIsCurrent`) is Slurm not answering for some of its tables, with
 * the sentence that says the queue answered; every other failure has the pair of its status. Null
 * for a status that is not a failure.
 */
export function failureWords(
    payload: Pick<HpcPayload, 'status' | 'lastOk' | 'updated'>
): { word: string; sentence: string } | null {
    const { status } = payload;
    if (status === 'starting' || status === 'ok' || status === 'unconfigured') return null;
    if (queueIsCurrent(payload)) {
        return { word: t('hpc.slurm_down'), sentence: t('hpc.slurm_partial_msg') };
    }
    if (status === 'unreachable') {
        return { word: t('hpc.unreachable'), sentence: t('hpc.unreachable_msg') };
    }
    if (status === 'slurm_down') {
        return { word: t('hpc.slurm_down'), sentence: t('hpc.slurm_down_msg') };
    }
    return { word: t('hpc.error'), sentence: t('hpc.error_msg') };
}

/**
 * The mark of a table older than its queue: the time its rows came from, or that no poll has read
 * it since the server started (`null`).
 */
export function staleWords(time: string | null): string {
    return time === null ? t('hpc.stale_never') : t('hpc.stale_from', clock(time));
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

/**
 * What a Live HPC pane keeps of its own: whether its capacity section is open, and whether the
 * sinfo table under the meters is open. Both are the reader's, per pane, and go when the tab
 * closes.
 */
export type HpcViewState = { capacity: boolean; sinfo: boolean };

/** The folds a new pane shows: the capacity open, since it is the glance, and the table closed. */
const HPC_DEFAULTS: HpcViewState = { capacity: true, sinfo: false };

/** The held state of a Live HPC pane: each missing or non-boolean key is read as its default. */
const hpcStateShape = z.object({
    capacity: z.boolean().catch(HPC_DEFAULTS.capacity),
    sinfo: z.boolean().catch(HPC_DEFAULTS.sinfo)
}) satisfies z.ZodType<HpcViewState>;

/** The held state of a Live HPC pane, each missing or non-boolean key read as its default. */
export function parseHpcState(raw: unknown): HpcViewState {
    return readAs(hpcStateShape, raw) ?? { ...HPC_DEFAULTS };
}

/**
 * The state after one fold's toggle, or null when the fold already stands as held. The browser
 * fires `toggle` when the `open` attribute drawn from the held state takes effect, and that event
 * must write nothing.
 */
export function toggledHpcState(
    held: HpcViewState,
    key: keyof HpcViewState,
    open: boolean
): HpcViewState | null {
    return held[key] === open ? null : { ...held, [key]: open };
}
