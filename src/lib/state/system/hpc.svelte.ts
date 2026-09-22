// Layer 2, client state. Derived Live HPC queue counts and pill words read the single socket entity
// shared by the Focus view and rail, and one command reaches the cluster endpoint.

import { fields, text as textOf } from '../../data/helpers/guards.ts';
import { t } from '../words/text.ts';
import type { EntitiesStore } from '../client/entities.svelte.ts';
import type { WritesStore } from '../client/writes.svelte.ts';

/** One client's reader of the Live HPC queue, and its one command. */
export type HpcStore = {
    queue: () => ReturnType<EntitiesStore['hpc']>;
    counts: () => { running: number; pending: number };
    pillText: () => string;
    badgeText: () => string;
    command: (body: Record<string, string>) => Promise<Record<string, unknown>>;
    jobLog: (id: string) => Promise<{ status: string; output: string }>;
};

export function createHpc(entities: EntitiesStore, writes: WritesStore): HpcStore {
    function queue() {
        return entities.hpc();
    }

    function counts(): { running: number; pending: number } {
        const value = entities.hpc();
        return value?.status === 'ok'
            ? { running: value.running, pending: value.pending }
            : { running: 0, pending: 0 };
    }

    function pillText(): string {
        const value = entities.hpc();
        return value?.status === 'ok' && value.total > 0
            ? t('hpc.pill_running', value.running, value.running === 1 ? '' : 's') +
                  (value.pending ? t('hpc.pill_pending', value.pending) : '')
            : '';
    }

    function badgeText(): string {
        const value = entities.hpc();
        return value?.status === 'ok' && value.total > 0 ? `${value.running} ${value.pending}` : '';
    }

    /** Post one command to the HPC endpoint and read its answer, whose fields the caller narrows. */
    async function command(body: Record<string, string>): Promise<Record<string, unknown>> {
        const response = await fetch('/api/hpc', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writes.writeToken() },
            body: JSON.stringify(body)
        });
        return fields(await response.json());
    }

    /** One job's log: the status word the endpoint answered with, and the text it returned. */
    async function jobLog(id: string): Promise<{ status: string; output: string }> {
        const answer = await command({ action: 'log', id });
        return { status: textOf(answer.status, 'error'), output: textOf(answer.log) };
    }

    return { queue, counts, pillText, badgeText, command, jobLog };
}
