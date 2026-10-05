// Layer 2, server. The one POST handler for refresh, cancel, log, plan and submit applies the token
// gate before dispatching an injected action target. `plan` answers what Submit would do with a
// job script and `submit` runs the plan the reader confirmed (submit.ts); both answer a refusal as
// a 200 with its word, and a body that is no such request as a 400.
import { json } from '@sveltejs/kit';
import { isMap } from '../../../data/helpers/guards.ts';
import { gatedBody } from '../../core/auth.ts';
import { cancel, validId } from './actions.ts';
import { planSubmit, runSubmit, type SubmitDeps } from './submit.ts';

export type HpcTarget = SubmitDeps & {
    /**
     * The ssh alias to act on, or the empty string with the sentence for why there is none (see
     * host.ts). Read only for a cancel, a log or a plan, so a refresh runs whatever the host's
     * sources say.
     */
    where: () => { host: string; missing?: string };
    token: string;
    cancel?: typeof cancel;
    /** The log read, over the context's remembered log paths. */
    log: (host: string, id: string) => Promise<{ status: string; log: string; path: string }>;
};

const badAction = (): Response => json({ error: 'bad action or id' }, { status: 400 });

export async function handleHpc(request: Request, target: HpcTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const action = body.action;
    if (action === 'refresh') {
        await target.refresh();
        return json({ status: 'ok' });
    }
    if (action === 'plan') {
        const { root, path } = body;
        if (typeof root !== 'string' || typeof path !== 'string') return badAction();
        return json(await planSubmit({ root, path }, target));
    }
    if (action === 'submit') {
        const { plan } = body;
        if (!isMap(plan) || typeof plan.root !== 'string' || typeof plan.path !== 'string') {
            return badAction();
        }
        const asked = {
            plan: { ...plan, root: plan.root, path: plan.path },
            confirm: body.confirm
        };
        return json(await runSubmit(asked, target));
    }
    const id = body.id;
    if ((action !== 'cancel' && action !== 'log') || typeof id !== 'string' || !validId(id))
        return badAction();
    const { host, missing } = target.where();
    if (host === '') {
        const hint = missing ?? '';
        return json(
            action === 'log'
                ? { status: 'error', hint, log: '', path: '' }
                : { status: 'error', hint }
        );
    }
    if (action === 'log') return json(await target.log(host, id));
    const answer = await (target.cancel ?? cancel)(host, id);
    if (answer.status === 'ok') await target.refresh();
    return json(answer);
}
