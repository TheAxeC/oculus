// Layer 2, server. The /api/ routes through which the page manages apps: POST /api/app-manage
// (disable, enable, what a removal will do, remove) and POST /api/app-add (add an app from a
// folder). Each carries the write token and runs behind the process's write chain, as the other
// writes of `~/.oculus` do; the watcher reads the apps again after each, so the rows the page holds
// next carry the new state.
//
// A refusal is `{ error: <word> }` with a status of 409 for a state the request cannot be applied
// to and 404 for an app that is not held. `dependents` carries the titles of the enabled apps that
// depend on the app, which the page names to the reader before it sends the request again with
// `cascade`.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { tokenedBody } from '../../../core/auth.ts';
import { chained } from '../../../core/json.ts';
import { words } from '../../../core/words.ts';
import { defaultApprovalsPath } from '../../approvals/approvals.ts';
import { changeEnabled, dependentsClosure } from '../manage/enable.ts';
import { addApp } from '../manage/add.ts';
import { describeRemoval, removeApp } from '../manage/remove.ts';
import { appById } from '../read/held.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

const manageShape = z.discriminatedUnion('action', [
    z.object({
        action: z.enum(['disable', 'enable']),
        view: z.string(),
        workspace: z.boolean().optional(),
        cascade: z.boolean().optional()
    }),
    z.object({ action: z.literal('inspect'), view: z.string() }),
    z.object({ action: z.literal('remove'), view: z.string(), cascade: z.boolean().optional() })
]);

const addShape = z.object({ path: z.string().min(1) });

/** POST /api/app-manage. */
export async function handleManagePost(
    request: Request,
    token: string,
    options: AppsRouteOptions,
    approvalsFile: () => string = defaultApprovalsPath
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = manageShape.safeParse(read.body);
    if (!body.success) return refuse('action must be disable, enable, inspect or remove', 400);
    const action = body.data;
    return chained(options.writes, async () => {
        options.apps.reread();
        const { apps, secrets, hosts } = options;
        const app = appById(apps.held(), action.view);
        if (app === undefined) return refuse('missing', 404);
        if (action.action === 'inspect') {
            if (app.row.root !== '') return refuse('root_app', 409);
            return json(
                { ok: true, ...(await describeRemoval(apps.held(), app, secrets)) },
                { headers: NO_STORE }
            );
        }
        if (action.action === 'remove') {
            const done = await removeApp(app, action.cascade === true, {
                held: () => apps.held(),
                hosts,
                secrets,
                trash: options.trash,
                approvalsFile: approvalsFile(),
                stateFile: apps.stateFile(),
                workspace: apps.workspace(),
                unkeep: (id) => apps.unkeep(id)
            });
            apps.reread();
            await hosts.settled();
            if (done.ok)
                return json({ ok: true, secretsKept: done.secretsKept }, { headers: NO_STORE });
            const dependents = dependentsClosure(apps.held(), app).map((one) => one.row.title);
            return json(
                { error: done.error, reason: done.reason ?? '', dependents },
                { status: done.error === 'root_app' ? 400 : 409, headers: NO_STORE }
            );
        }
        const done = changeEnabled(apps.held(), apps.stateFile(), apps.workspace(), {
            id: app.id,
            scope: action.workspace === true ? 'workspace' : 'machine',
            enabled: action.action === 'enable',
            cascade: action.cascade === true
        });
        apps.reread();
        await hosts.settled();
        if (done.ok) return json({ ok: true }, { headers: NO_STORE });
        if (done.error === 'dependents') {
            return json(
                { error: 'dependents', dependents: done.apps },
                { status: 409, headers: NO_STORE }
            );
        }
        return json(
            { error: done.error, reason: done.error === 'file' ? done.reason : '' },
            { status: done.error === 'missing' ? 404 : 409, headers: NO_STORE }
        );
    });
}

/** POST /api/app-add. */
export async function handleAddPost(
    request: Request,
    token: string,
    options: AppsRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = addShape.safeParse(read.body);
    if (!body.success) return refuse('path must be given', 400);
    const folder = options.apps.folder();
    if (folder === null) return refuse(words(options.text(), 'server.workspace.no_primary'), 409);
    return chained(options.writes, () => {
        const done = addApp(body.data.path, folder, options.limits());
        options.apps.reread();
        if (done.ok) return json({ ok: true, name: done.name }, { headers: NO_STORE });
        return json({ error: done.error }, { status: 409, headers: NO_STORE });
    });
}
