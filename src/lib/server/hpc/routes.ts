// Layer 2, server. The one POST handler for refresh, cancel, and log applies origin and token gates before dispatching an injected action target.
import { hasToken, processToken, sameOrigin } from '../auth.ts';
import { cancel, log, validId } from './actions.ts';
import { refreshHpc } from './poll.ts';
import { engineDir, loadConfig, loadLocal } from '../../data/sources/config.ts';

export type HpcTarget = {
    host: string;
    token: string;
    refresh?: () => Promise<void>;
    cancel?: typeof cancel;
    log?: typeof log;
};
const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function handleHpc(request: Request, target: HpcTarget): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '') || !hasToken(request, target.token))
        return json(403, { error: 'forbidden' });
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'bad body' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body))
        return json(400, { error: 'bad body' });
    const action = (body as Record<string, unknown>).action;
    if (action === 'refresh') {
        await (target.refresh ?? refreshHpc)();
        return json(200, { status: 'ok' });
    }
    const id = (body as Record<string, unknown>).id;
    if ((action !== 'cancel' && action !== 'log') || typeof id !== 'string' || !validId(id))
        return json(400, { error: 'bad action or id' });
    if (action === 'log') return json(200, await (target.log ?? log)(target.host, id));
    const answer = await (target.cancel ?? cancel)(target.host, id);
    if (answer.status === 'ok') await (target.refresh ?? refreshHpc)();
    return json(200, answer);
}

export function hpcTarget(): HpcTarget {
    const engine = engineDir();
    const local = loadLocal(engine);
    const settings = loadConfig(engine).config as { slurm?: { host?: string } };
    return { host: local.hpcHost ?? settings.slurm?.host ?? '', token: processToken() };
}
