// Layer 2, client state. Derived Live HPC queue counts and pill words read the single socket entity
// shared by the Focus view and rail, and one command reaches the cluster endpoint.

import { fields, text as textOf } from '../../../../data/helpers/guards.ts';
import type { SubmitPlan } from '../../../../data/model/index.ts';
import { t } from '../../../shared/words/text.ts';
import type { EntitiesStore, WritesStore } from '../../../shared/stores/shapes.ts';
import { queueIsCurrent } from './hpc.ts';
import { jobOf, planOf, type JobResult, type PlanResult } from './submit.ts';

/** One client's reader of the Live HPC queue, its one command and the two requests of Submit. */
export type HpcStore = {
    queue: () => ReturnType<EntitiesStore['hpc']>;
    counts: () => { running: number; pending: number };
    pillText: () => string;
    badgeText: () => string;
    command: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
    /** What Submit would do with the job script at `path` under `root`, or why it will not. */
    planSubmit: (root: string, path: string) => Promise<PlanResult>;
    /** Run the plan the reader confirmed. */
    submitJob: (plan: SubmitPlan) => Promise<JobResult>;
    jobLog: (id: string) => Promise<{ status: string; output: string }>;
};

export function createHpc(entities: EntitiesStore, writes: WritesStore): HpcStore {
    function queue() {
        return entities.hpc();
    }

    function counts(): { running: number; pending: number } {
        const value = entities.hpc();
        return value !== null && queueIsCurrent(value)
            ? { running: value.running, pending: value.pending }
            : { running: 0, pending: 0 };
    }

    function pillText(): string {
        const value = entities.hpc();
        return value !== null && queueIsCurrent(value) && value.total > 0
            ? (value.running === 1
                  ? t('hpc.pill_running_one')
                  : t('hpc.pill_running', value.running)) +
                  (value.pending ? t('hpc.pill_pending', value.pending) : '')
            : '';
    }

    function badgeText(): string {
        const value = entities.hpc();
        return value !== null && queueIsCurrent(value) && value.total > 0
            ? `${value.running} ${value.pending}`
            : '';
    }

    /**
     * Post one command to the HPC endpoint and read its answer, whose fields the caller narrows.
     */
    async function command(body: Record<string, unknown>): Promise<Record<string, unknown>> {
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

    /**
     * One Submit request. An answer that does not arrive or is no JSON is read as no answer, which
     * the page words as a failure.
     */
    async function submitRequest(body: Record<string, unknown>): Promise<unknown> {
        try {
            return await command(body);
        } catch {
            return null;
        }
    }

    async function planSubmit(root: string, path: string): Promise<PlanResult> {
        return planOf(await submitRequest({ action: 'plan', root, path }));
    }

    async function submitJob(plan: SubmitPlan): Promise<JobResult> {
        return jobOf(await submitRequest({ action: 'submit', plan, confirm: true }));
    }

    return { queue, counts, pillText, badgeText, command, planSubmit, submitJob, jobLog };
}
