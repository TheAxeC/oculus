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
//
// The shell's actions are the page's way back to the registry (shell/registry.ts) and answer 200
// `{ ok, value }` or `{ ok: false, word }` as a frame's call does: `run` runs a command, of the
// frame named in the header or of the app named in the body (Cmd-K); `provide` asks a host for a
// tree's children or item or for the check of an input box's value; `answer` settles an open
// request; `event` reports a view shown or hidden, a selection, an expanded or collapsed element or
// a panel closed; `release` ends the panels of a page that left; `settings` reads one setting of
// the frame's app. `tab` may name the view the tab draws. The page's reads and actions on the tools
// (`decorate`, `scm`, `terminal`) are answered by tools/routes.ts.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { APP_HEADER, appViewIdFromHeader } from '../../../../data/helpers/files/apps/apps.ts';
import { tokenedBody } from '../../../core/auth.ts';
import { appById, type HeldApp } from '../read/held.ts';
import { handleToolsPost, isToolsBody } from '../tools/routes.ts';
import { executeCommand, runDeclared } from '../shell/commands.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

const frameShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('request'),
        method: z.unknown(),
        params: z.unknown(),
        tab: z.string()
    }),
    z.object({ action: z.literal('tab'), view: z.string().default('') }),
    z.object({
        action: z.literal('run'),
        command: z.string().min(1),
        args: z.array(z.unknown()).default([]),
        app: z.string().default('')
    }),
    z.object({ action: z.literal('settings'), key: z.string().min(1) })
]);

const shellShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('provide'),
        app: z.string().min(1),
        kind: z.enum(['children', 'item', 'validateInput']),
        view: z.string().default(''),
        handle: z.string().default(''),
        value: z.string().default('')
    }),
    z.object({
        action: z.literal('answer'),
        id: z.string().min(1),
        result: z.unknown(),
        page: z.string().min(1)
    }),
    z.object({
        action: z.literal('event'),
        app: z.string().min(1),
        kind: z.enum(['visibility', 'selection', 'expand', 'collapse', 'dispose']),
        params: z.record(z.string(), z.unknown()).default({}),
        page: z.string().min(1)
    }),
    z.object({ action: z.literal('release'), page: z.string().min(1) })
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
    if (isToolsBody(read.body)) return handleToolsPost(read.body, options.hosts.tools);
    const shellBody = shellShape.safeParse(read.body);
    if (shellBody.success) return handleShell(shellBody.data, options);
    const body = frameShape.safeParse(read.body);
    if (!body.success) {
        return refuse(
            'action must be request, tab, run, settings, provide, answer, event, release, decorate, scm, terminal, stop, restart or output',
            400
        );
    }
    if (body.data.action === 'run' && body.data.app !== '') {
        return answered(
            await runDeclared(options.hosts.shell, body.data.app, body.data.command, body.data.args)
        );
    }
    const app = appOfHeader(request, options);
    if (app instanceof Response) return app;
    if (app.row.disabled) return answered({ ok: false, word: 'closed' });
    if (body.data.action === 'tab') {
        await options.hosts.tab(app.id, body.data.view);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.data.action === 'run') {
        return answered(
            await executeCommand(options.hosts.shell, app, body.data.command, body.data.args)
        );
    }
    if (body.data.action === 'settings') {
        const { key } = body.data;
        if (!key.startsWith(`${app.row.name}.`))
            return answered({ ok: false, word: 'not_declared' });
        const values = options.hosts.valuesOf(app);
        return answered({ ok: true, value: Object.hasOwn(values, key) ? values[key] : null });
    }
    const { method, params, tab } = body.data;
    return answered(await options.hosts.request(app.id, method, params, tab));
}

/** The shell actions that name no frame: provide, answer, event and release. */
async function handleShell(
    body: z.infer<typeof shellShape>,
    options: AppsRouteOptions
): Promise<Response> {
    const { shell } = options.hosts;
    if (body.action === 'release') {
        shell.release(body.page);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.action === 'answer') {
        const word = shell.answer(body.id, body.result, body.page);
        return answered(word === 'ok' ? { ok: true, value: null } : { ok: false, word });
    }
    if (shell.active(body.app) === undefined) return answered({ ok: false, word: 'closed' });
    if (body.action === 'event') {
        shell.event(body.app, body.kind, body.params, body.page);
        return json({ ok: true }, { headers: NO_STORE });
    }
    const { kind, view, handle, value } = body;
    return answered(await options.hosts.provide(body.app, { kind, view, handle, value }));
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
