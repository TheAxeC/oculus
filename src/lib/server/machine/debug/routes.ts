// Layer 2, server. GET and POST /api/debug. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/(machine)/debug/+server.ts is the lines that join
// them.
//
// A GET answers a repository's debug configurations and the findings of the launch file, or, with
// `console=1`, the whole console of the current session. A POST carries the write token and one
// action: `launch` starts a session, `approve` approves a launch's text, the stepping actions, the
// frame, the evaluation, the breakpoints, the function breakpoints and the watch expressions go to
// the session, `addConfiguration` and `editConfiguration` write the launch file (launch/write.ts),
// and `stop` signals the adapter once the page has confirmed it.
//
// A launch runs only once its exact text is approved (`debugText`, kept under the same key kind as
// a command's chain): an unapproved launch answers `{ approve: { name, cwd, program } }` and
// nothing starts. The program, `${file}` and the other placeholders filled by the page's context,
// must be an existing `.rite` file under a root the file browser serves, and goes to the adapter as
// one argument, never into a shell. Every refusal of the request is a 400 `{ error }` with a
// sentence of `server.debug`, apart from a placeholder with no value, which is the word the
// terminal route refuses a command with and the names it is about. A failed write of the approvals
// file is no refusal of the request and answers 409, as the approve answer of /api/commands does.

import { pathToFileURL } from 'node:url';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { debugConfigurationShape } from '../../../data/shapes/shapes.ts';
import { textCatalog } from '../../../data/sources/config.ts';
import { tokenedBody } from '../../core/auth.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import { approveTexts, debugText } from '../approvals/approvals.ts';
import { refusal } from '../pty/refusal.ts';
import { repositoryOf } from '../runs/commands/repo.ts';
import type { OpsTarget } from '../../files/fs/ops.ts';
import { readLaunch } from './launch/read.ts';
import { editLaunch } from './launch/write.ts';
import type { DebugClient, Resume } from './session.ts';
import { fileRefusal, startSession } from './session/start.ts';

/** What the routes need of the process: roots, approvals file, write chain and client. */
export type DebugRouteOptions = {
    /** The directories the file browser serves, from which a repository and a program are taken. */
    rootsFor: () => string[];
    /** The approvals file. */
    approvalsFor: () => string;
    /** The merged config, whose text catalog words a refusal. */
    configFor: () => Record<string, unknown>;
    /** The write chain the approvals are written behind. */
    writes: FsWrites;
    /** What the writer of the Files view runs over, which Add Configuration writes through. */
    files: () => OpsTarget;
    /** The server's one debug client. */
    client: DebugClient;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** One breakpoint as sent: its line and what it is set with. */
const specShape = z.object({
    line: z.number(),
    condition: z.string().optional(),
    hitCondition: z.string().optional(),
    logMessage: z.string().optional()
});

/** One file's breakpoints as sent, before the fields are checked one by one. */
const fileShape = z.object({ path: z.string(), lines: z.array(specShape) });

/** One function breakpoint as sent. */
const functionShape = z.object({
    name: z.string(),
    condition: z.string().optional(),
    hitCondition: z.string().optional()
});

const NONE = z.object({});

const bodyShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('launch'),
        repo: z.unknown(),
        name: z.string().nullable(),
        // A configuration given whole, as the page's Start gives one that `launch.yml` does not
        // hold.
        configuration: debugConfigurationShape.optional(),
        context: z.object({ file: z.string().optional() }),
        breakpoints: z.array(fileShape),
        functions: z.array(functionShape),
        watch: z.array(z.string())
    }),
    z.object({
        action: z.literal('approve'),
        repo: z.unknown(),
        cwd: z.string(),
        program: z.string()
    }),
    NONE.extend({ action: z.literal('continue') }),
    NONE.extend({ action: z.literal('next') }),
    NONE.extend({ action: z.literal('stepIn') }),
    NONE.extend({ action: z.literal('stepOut') }),
    NONE.extend({ action: z.literal('finishFrame') }),
    z.object({ action: z.literal('frame'), id: z.number().int() }),
    z.object({
        action: z.literal('evaluate'),
        expression: z.string(),
        context: z.enum(['repl', 'hover']),
        frame: z.number().int().nullable().optional()
    }),
    fileShape.extend({ action: z.literal('breakpoints') }),
    z.object({ action: z.literal('functions'), names: z.array(functionShape) }),
    z.object({
        action: z.literal('exceptions'),
        filters: z.array(z.object({ filter: z.string(), condition: z.string().optional() }))
    }),
    NONE.extend({ action: z.literal('pause') }),
    NONE.extend({ action: z.literal('restart') }),
    NONE.extend({ action: z.literal('loadedSources') }),
    z.object({
        action: z.literal('setVariable'),
        reference: z.number().int(),
        name: z.string(),
        value: z.string()
    }),
    z.object({
        action: z.literal('completions'),
        text: z.string(),
        column: z.number().int().min(1)
    }),
    z.object({ action: z.literal('configurations'), repo: z.unknown(), type: z.string() }),
    z.object({
        action: z.literal('addConfiguration'),
        repo: z.unknown(),
        configuration: z.record(z.string(), z.unknown())
    }),
    z.object({
        action: z.literal('editConfiguration'),
        repo: z.unknown(),
        name: z.string(),
        changes: z.record(z.string(), z.unknown()).nullable()
    }),
    z.object({ action: z.literal('watch'), expressions: z.array(z.string()) }),
    z.object({ action: z.literal('stop'), confirmed: z.boolean().optional() })
]);

function refuse(error: string, status = 400): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/** GET /api/debug?repo=<absolute path> or ?console=1. */
export function handleDebugGet(request: Request, options: DebugRouteOptions): Response {
    const query = new URL(request.url).searchParams;
    if (query.has('console')) return json(options.client.console(), { headers: NO_STORE });
    const asked = query.getAll('repo');
    if (asked.length !== 1) return refuse('repo must be given once');
    const found = repositoryOf(asked[0], options.rootsFor());
    if ('error' in found) return refuse(found.error);
    const debuggers = options.client.debuggers().map((one) => one.debugger);
    return json(readLaunch(found.repo, debuggers), { headers: NO_STORE });
}

/** The answer of an action that returns when the session has taken it, or the refusal. */
function answered(result: { error: string } | object): Response {
    return 'error' in result ? refuse(result.error) : json(result, { headers: NO_STORE });
}

/** POST /api/debug: one action. */
export async function handleDebugPost(
    request: Request,
    token: string,
    options: DebugRouteOptions
): Promise<Response> {
    const catalog = textCatalog(options.configFor());
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: () => catalog });
    if (read instanceof Response) return read;
    const parsed = bodyShape.safeParse(read.body);
    if (!parsed.success) return refuse(words(catalog, 'server.debug.bad_action'));
    const body = parsed.data;
    const client = options.client;
    if (body.action === 'launch' || body.action === 'approve') {
        const found = repositoryOf(body.repo, options.rootsFor());
        if ('error' in found) return refuse(found.error);
        if (body.action === 'launch') {
            const started = await startSession(
                {
                    repo: found.repo,
                    name: body.name,
                    ...(body.configuration === undefined
                        ? {}
                        : { configuration: body.configuration }),
                    context: body.context,
                    breakpoints: body.breakpoints,
                    functions: body.functions,
                    watch: body.watch
                },
                {
                    rootsFor: options.rootsFor,
                    approvalsFor: options.approvalsFor,
                    catalog: () => catalog,
                    client,
                    port: () => client.port()
                }
            );
            if ('ok' in started) return json({ ok: true }, { headers: NO_STORE });
            if ('approve' in started)
                return json({ approve: started.approve }, { headers: NO_STORE });
            if ('refusal' in started) return refusal(started.refusal, started.names);
            return refuse(started.error);
        }
        const text = debugText(found.repo, body.cwd, body.program);
        const done = await chained(options.writes, () =>
            approveTexts(options.approvalsFor(), [text])
        );
        return done.ok ? json({ ok: true }, { headers: NO_STORE }) : refuse(done.error, 409);
    }
    if (body.action === 'breakpoints') {
        const refused = fileRefusal(body, options.rootsFor(), catalog);
        if (refused !== null) return refuse(refused);
        client.setBreakpoints(body.path, body.lines);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.action === 'functions') {
        client.setFunctions(body.names);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.action === 'exceptions') {
        client.setExceptions(body.filters);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.action === 'pause') return answered(await client.controls.pause());
    if (body.action === 'restart') return answered(await client.controls.restart());
    if (body.action === 'loadedSources') return answered(await client.controls.loadedSources());
    if (body.action === 'setVariable') {
        return answered(await client.controls.setVariable(body.reference, body.name, body.value));
    }
    if (body.action === 'completions') {
        return answered(await client.controls.completions(body.text, body.column));
    }
    if (body.action === 'configurations') {
        const found = repositoryOf(body.repo, options.rootsFor());
        if ('error' in found) return refuse(found.error);
        const port = client.port();
        const entry = client.debuggers().find((one) => one.debugger.type === body.type);
        if (port === undefined || entry === undefined) {
            return refuse(words(catalog, 'server.debug.no_debugger', body.type));
        }
        if (!(await port.activate(body.type))) {
            return refuse(words(catalog, 'server.debug.host_down', body.type));
        }
        const folder = pathToFileURL(found.repo).toString();
        try {
            const given = await port.configurations(body.type, folder);
            return json({ configurations: given }, { headers: NO_STORE });
        } catch (error) {
            return refuse(words(catalog, 'server.debug.resolve_failed', String(error)));
        }
    }
    if (body.action === 'addConfiguration' || body.action === 'editConfiguration') {
        const found = repositoryOf(body.repo, options.rootsFor());
        if ('error' in found) return refuse(found.error);
        const appended = await editLaunch(
            options.files(),
            found.repo,
            body.action === 'addConfiguration'
                ? { kind: 'add', configuration: body.configuration }
                : { kind: 'set', name: body.name, changes: body.changes }
        );
        if (appended.ok) return json({ line: appended.line }, { headers: NO_STORE });
        if (appended.word === 'name') return refuse(words(catalog, 'server.debug.config_name'));
        if (appended.word === 'exists') {
            return refuse(words(catalog, 'server.debug.config_exists', appended.detail));
        }
        if (appended.word === 'missing') {
            return refuse(words(catalog, 'server.debug.config_missing', appended.detail));
        }
        if (appended.word === 'unwritable') {
            return refuse(words(catalog, 'server.debug.config_unwritable', appended.detail));
        }
        return refuse(words(catalog, 'server.debug.config_unreadable', appended.detail));
    }
    if (body.action === 'watch') {
        await client.setWatch(body.expressions);
        return json({ ok: true }, { headers: NO_STORE });
    }
    if (body.action === 'stop') return answered(client.stop(body.confirmed === true));
    if (body.action === 'frame') return answered(await client.selectFrame(body.id));
    if (body.action === 'evaluate') {
        if (body.expression.trim() === '')
            return refuse(words(catalog, 'server.debug.no_expression'));
        return answered(await client.evaluate(body.expression, body.context, body.frame ?? null));
    }
    const resume: Resume = body.action;
    return answered(await client.resume(resume));
}
