// Layer 2, server. The /api/ routes through which a frame reaches its app's host and its secrets,
// and through which the page stops and restarts a host: POST /api/app-host and POST
// /api/app-secrets. Each carries the write token. A frame's call names its app in the
// `x-oculus-app` header, which the page sets from the tab, and every answer to a frame's call is
// 200 with `{ ok: true, value }` or `{ ok: false, word }`, the word being the refusal the frame is
// rejected with (`not_declared`, `closed`, `host_down`, `refused:<reason>`, `too_large`).
//
// The page's own commands, Stop, Restart and Output of a host, name the app in the body and answer
// 200 `{ ok: true }`, Output with the kept lines of the host's output as `output`. A frame of a
// disabled app reaches neither its host nor its secrets: it is refused `closed`.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { APP_HEADER, appViewIdFromHeader } from '../../../../data/helpers/files/apps.ts';
import { tokenedBody } from '../../../core/auth.ts';
import { appById, type HeldApp } from '../read/held.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

const frameShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('request'),
        method: z.unknown(),
        params: z.unknown(),
        tab: z.string()
    }),
    z.object({ action: z.literal('tab') })
]);

const commandShape = z.object({
    action: z.enum(['stop', 'restart', 'output']),
    view: z.string()
});

const secretsShape = z.discriminatedUnion('action', [
    z.object({ action: z.literal('get'), key: z.unknown() }),
    z.object({ action: z.literal('store'), key: z.unknown(), value: z.unknown() }),
    z.object({ action: z.literal('delete'), key: z.unknown() })
]);

/** An answer to a frame's call. */
const answered = (result: { ok: true; value: unknown } | { ok: false; word: string }): Response =>
    json(result.ok ? { ok: true, value: result.value ?? null } : { ok: false, word: result.word }, {
        headers: NO_STORE
    });

/** The app a frame's call names in its header, or the answer that refuses it. */
function appOfHeader(request: Request, options: AppsRouteOptions): HeldApp | Response {
    const id = appViewIdFromHeader(request.headers.get(APP_HEADER) ?? '');
    if (id === null) return refuse('missing', 404);
    const app = appById(options.apps.held(), id);
    return app ?? refuse('missing', 404);
}

/** POST /api/app-host: a frame's request to its host, the tab drawn, or Stop, Restart, Output. */
export async function handleHostPost(
    request: Request,
    token: string,
    options: AppsRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const command = commandShape.safeParse(read.body);
    if (command.success) {
        const app = appById(options.apps.held(), command.data.view);
        if (app === undefined) return refuse('missing', 404);
        if (command.data.action === 'output') {
            return json({ ok: true, output: options.hosts.output(app.id) }, { headers: NO_STORE });
        }
        if (command.data.action === 'stop') await options.hosts.stop(app.id);
        else await options.hosts.restart(app.id);
        return json({ ok: true }, { headers: NO_STORE });
    }
    const body = frameShape.safeParse(read.body);
    if (!body.success) return refuse('action must be request, tab, stop, restart or output', 400);
    const app = appOfHeader(request, options);
    if (app instanceof Response) return app;
    if (app.row.disabled) return answered({ ok: false, word: 'closed' });
    if (body.data.action === 'tab') {
        await options.hosts.tab(app.id);
        return json({ ok: true }, { headers: NO_STORE });
    }
    const { method, params, tab } = body.data;
    return answered(await options.hosts.request(app.id, method, params, tab));
}

/** POST /api/app-secrets: a frame's `get`, `store` or `delete` of one secret of its app. */
export async function handleSecretsPost(
    request: Request,
    token: string,
    options: AppsRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = secretsShape.safeParse(read.body);
    if (!body.success) return refuse('action must be get, store or delete', 400);
    const app = appOfHeader(request, options);
    if (app instanceof Response) return app;
    if (app.row.disabled) return answered({ ok: false, word: 'closed' });
    const { secrets } = options;
    if (body.data.action === 'get') return answered(await secrets.get(app, body.data.key));
    if (body.data.action === 'store') {
        return answered(await secrets.store(app, body.data.key, body.data.value));
    }
    return answered(await secrets.delete(app, body.data.key));
}
