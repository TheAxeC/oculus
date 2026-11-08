// Layer 2, client state. The clusters of the `hpc` channel, the queue counts summed over every
// cluster whose queue is current (the Command Center pill, the rail badge and the status bar read
// those), and the commands that reach the Live HPC endpoint, each naming the cluster it acts on.
//
// The store also holds the clusters whose Refresh now the reader pressed, from the press until that
// press's own answer (the route answers once the cluster's poll has run, and at once when it
// refuses the request or watches no such cluster), so the cluster's refresh control turns while it
// waits, in the head and in the error box alike, and a Live HPC tab opened while a press waits
// turns until the answer. A press while that cluster's refresh waits sends nothing. A poll the
// server runs on its own cadence is no press of the reader's and is held by nothing.

import { fields, text as textOf } from '../../../../data/helpers/guards.ts';
import type { ClusterSetup, HpcPayload, SubmitPlan } from '../../../../data/model/index.ts';
import { setupOf, stepOf, type StepAnswer } from './setup.ts';
import { plural, t } from '../../../shared/words/text.ts';
import type { EntitiesStore, WritesStore } from '../../../shared/stores/shapes.ts';
import { createWaiting } from '../../../shared/stores/waiting.svelte.ts';
import { clustersOf, summedCounts } from './hpc.ts';
import {
    choicesOf,
    jobOf,
    planOf,
    type ChoicesResult,
    type JobResult,
    type PlanResult
} from './submit.ts';

/** One client's reader of the Live HPC clusters, its one command and the requests of Submit. */
export type HpcStore = {
    /** Every cluster of `slurm.resource` as its watcher last read it, in order. */
    clusters: () => HpcPayload[];
    /** The sentence of a hub that names no cluster, or the empty string. */
    hint: () => string;
    /** Whether the channel has said anything yet. */
    heard: () => boolean;
    counts: () => { running: number; pending: number };
    pillText: () => string;
    badgeText: () => string;
    command: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
    /** Ask the cluster `resource` for a poll now, unless a press of it waits for its answer. */
    refresh: (resource: string) => Promise<void>;
    /** Whether a press of the cluster `resource`'s refresh waits for its answer. */
    refreshing: (resource: string) => boolean;
    /** The clusters the Submit box offers for the job script at `path` under `root`. */
    submitChoices: (root: string, path: string) => Promise<ChoicesResult>;
    /** What Submit would do with the job script on the cluster `resource`, or why it will not. */
    planSubmit: (root: string, path: string, resource: string) => Promise<PlanResult>;
    /** Run the plan the reader confirmed. */
    submitJob: (plan: SubmitPlan) => Promise<JobResult>;
    /** One job's log on the cluster `resource`. */
    jobLog: (resource: string, id: string) => Promise<{ status: string; output: string }>;
    /** The clusters of `slurm.resource` and this machine's rows, or null when not read. */
    readSetup: () => Promise<ClusterSetup | null>;
    /** One step of the cluster setup, or a row's save or remove (POST /api/clusters). */
    setupStep: (body: Record<string, unknown>) => Promise<StepAnswer>;
};

export function createHpc(entities: EntitiesStore, writes: WritesStore): HpcStore {
    /**
     * The presses of each cluster's refresh that wait for their answer, by resource. A press while
     * one waits sends nothing, so a cluster's count is at most one.
     */
    const pressed = createWaiting();

    function clusters(): HpcPayload[] {
        return clustersOf(entities.hpc());
    }

    function counts(): { running: number; pending: number } {
        const { running, pending } = summedCounts(clusters());
        return { running, pending };
    }

    function pillText(): string {
        const sum = summedCounts(clusters());
        return sum.total > 0
            ? plural('hpc.pill_running', sum.running, sum.running) +
                  (sum.pending ? t('hpc.pill_pending', sum.pending) : '')
            : '';
    }

    function badgeText(): string {
        const sum = summedCounts(clusters());
        return sum.total > 0 ? `${sum.running} ${sum.pending}` : '';
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

    function refreshing(resource: string): boolean {
        return pressed.count(resource) > 0;
    }

    /**
     * Ask one cluster for a poll now, held as waiting from the press to its answer. A request that
     * fails or is refused only ends the wait and says nothing of its own: the cluster's state is
     * what the `hpc` channel carries, and the poll's own cadence asks the cluster again.
     */
    async function refresh(resource: string): Promise<void> {
        if (refreshing(resource)) return;
        pressed.hold(resource, 1);
        try {
            await command({ action: 'refresh', resource });
        } catch {
            // A request that never answered ends the wait like one that did, in the finally below.
        } finally {
            pressed.hold(resource, -1);
        }
    }

    /** One job's log: the status word the endpoint answered with, and the text it returned. */
    async function jobLog(
        resource: string,
        id: string
    ): Promise<{ status: string; output: string }> {
        const answer = await command({ action: 'log', resource, id });
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

    async function submitChoices(root: string, path: string): Promise<ChoicesResult> {
        return choicesOf(await submitRequest({ action: 'clusters', root, path }));
    }

    async function planSubmit(root: string, path: string, resource: string): Promise<PlanResult> {
        return planOf(await submitRequest({ action: 'plan', root, path, resource }));
    }

    async function submitJob(plan: SubmitPlan): Promise<JobResult> {
        return jobOf(await submitRequest({ action: 'submit', plan, confirm: true }));
    }

    /** One request of the cluster setup endpoint, or null when no JSON answer came. */
    async function setupRequest(body: Record<string, unknown>): Promise<unknown> {
        try {
            const answer = await writes.postCommand('/api/clusters', body);
            return answer.body;
        } catch {
            return null;
        }
    }

    return {
        clusters,
        hint: () => entities.hpc()?.hint ?? '',
        heard: () => entities.hpc() !== null,
        counts,
        pillText,
        badgeText,
        command,
        refresh,
        refreshing,
        submitChoices,
        planSubmit,
        submitJob,
        jobLog,
        readSetup: async () => setupOf(await setupRequest({ action: 'read' })),
        setupStep: async (body) => stepOf(await setupRequest(body))
    };
}
