// Layer 2, server. The one POST handler for refresh, cancel, and log applies the token gate before
// dispatching an injected action target.
import { json } from '@sveltejs/kit';
import { gatedBody } from '../../core/auth.ts';
import { cancel, validId } from './actions.ts';

export type HpcTarget = {
    host: string;
    token: string;
    refresh: () => Promise<void>;
    cancel?: typeof cancel;
    /** The log read, over the context's remembered log paths. */
    log: (host: string, id: string) => Promise<{ status: string; log: string; path: string }>;
};

export async function handleHpc(request: Request, target: HpcTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const action = body.action;
    if (action === 'refresh') {
        await target.refresh();
        return json({ status: 'ok' });
    }
    const id = body.id;
    if ((action !== 'cancel' && action !== 'log') || typeof id !== 'string' || !validId(id))
        return json({ error: 'bad action or id' }, { status: 400 });
    if (action === 'log') return json(await target.log(target.host, id));
    const answer = await (target.cancel ?? cancel)(target.host, id);
    if (answer.status === 'ok') await target.refresh();
    return json(answer);
}
