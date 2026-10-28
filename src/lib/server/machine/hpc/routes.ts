// Layer 2, server. The one POST handler for refresh, cancel, log, clusters, plan and submit applies
// the token gate before dispatching an injected action target. A cancel and a log name the cluster
// the job's row came from (`resource`) and act on that cluster's connection alone; a key that is
// not one of `slurm.resource` is refused before any runner. `clusters` answers the clusters the
// Submit box offers for a job script and the one picked at the start, `plan` what Submit would do
// with the script on the cluster the reader picked, and `submit` runs the plan the reader confirmed
// (submit.ts); a refusal is a 200 with its word, and a body that is no such request a 400.
import { json } from '@sveltejs/kit';
import { isMap } from '../../../data/helpers/guards.ts';
import { gatedBody } from '../../core/auth.ts';
import { cancel, validId } from './actions.ts';
import type { ClusterConnection } from './clusters/connections.ts';
import { planSubmit, runSubmit, submitChoices, type SubmitDeps } from './submit.ts';

export type HpcTarget = SubmitDeps & {
    /** Poll every cluster now. */
    refreshAll: () => Promise<void>;
    token: string;
    cancel?: typeof cancel;
    /** The log read on one cluster, over that cluster's remembered log paths. */
    log: (
        connection: ClusterConnection,
        id: string
    ) => Promise<{ status: string; log: string; path: string }>;
};

const badAction = (): Response => json({ error: 'bad action or id' }, { status: 400 });

export async function handleHpc(request: Request, target: HpcTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const action = body.action;
    if (action === 'refresh') {
        const resource = body.resource;
        if (resource === undefined) await target.refreshAll();
        else if (typeof resource === 'string') await target.refresh(resource);
        else return badAction();
        return json({ status: 'ok' });
    }
    if (action === 'clusters') {
        const { root, path } = body;
        if (typeof root !== 'string' || typeof path !== 'string') return badAction();
        return json(submitChoices({ root, path }, target));
    }
    if (action === 'plan') {
        const { root, path, resource } = body;
        if (typeof root !== 'string' || typeof path !== 'string' || typeof resource !== 'string') {
            return badAction();
        }
        return json(await planSubmit({ root, path, resource }, target));
    }
    if (action === 'submit') {
        const { plan } = body;
        if (
            !isMap(plan) ||
            typeof plan.root !== 'string' ||
            typeof plan.path !== 'string' ||
            typeof plan.resource !== 'string'
        ) {
            return badAction();
        }
        const asked = {
            plan: { ...plan, root: plan.root, path: plan.path, resource: plan.resource },
            confirm: body.confirm
        };
        return json(await runSubmit(asked, target));
    }
    const { id, resource } = body;
    if (
        (action !== 'cancel' && action !== 'log') ||
        typeof id !== 'string' ||
        !validId(id) ||
        typeof resource !== 'string'
    ) {
        return badAction();
    }
    const found = target.connection(resource);
    if ('missing' in found) {
        const hint = found.missing;
        return json(
            action === 'log'
                ? { status: 'error', hint, log: '', path: '' }
                : { status: 'error', hint }
        );
    }
    if (action === 'log') return json(await target.log(found.connection, id));
    const answer = await (target.cancel ?? cancel)(found.connection, id);
    if (answer.status === 'ok') await target.refresh(resource);
    return json(answer);
}
