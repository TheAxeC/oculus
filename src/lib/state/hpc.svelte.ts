// Layer 2, client state. Derived Live HPC queue counts and pill words read the single socket entity
// shared by the Focus view and rail, and one command reaches the cluster endpoint.
import { fields, text as textOf } from '../data/guards.ts';
import { hpc } from './entities.svelte.ts';
import { t } from './text.ts';
import { writeToken } from './writes.svelte.ts';
export function queue() {
    return hpc();
}
export function counts(): { running: number; pending: number } {
    const value = hpc();
    return value?.status === 'ok'
        ? { running: value.running, pending: value.pending }
        : { running: 0, pending: 0 };
}
export function pillText(): string {
    const value = hpc();
    return value?.status === 'ok' && value.total > 0
        ? t('hpc.pill_running', value.running, value.running === 1 ? '' : 's') +
              (value.pending ? t('hpc.pill_pending', value.pending) : '')
        : '';
}
export function badgeText(): string {
    const value = hpc();
    return value?.status === 'ok' && value.total > 0 ? `${value.running} ${value.pending}` : '';
}

/** Post one command to the HPC endpoint and read its answer, whose fields the caller narrows. */
export async function command(body: Record<string, string>): Promise<Record<string, unknown>> {
    const response = await fetch('/api/hpc', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-oculus-token': writeToken() },
        body: JSON.stringify(body)
    });
    return fields(await response.json());
}

/** One job's log: the status word the endpoint answered with, and the text it returned. */
export async function jobLog(id: string): Promise<{ status: string; output: string }> {
    const answer = await command({ action: 'log', id });
    return { status: textOf(answer.status, 'error'), output: textOf(answer.log) };
}
