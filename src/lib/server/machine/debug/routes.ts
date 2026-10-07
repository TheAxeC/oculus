// Layer 2, server. GET and POST /api/debug. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/(machine)/debug/+server.ts is the lines that join
// them.
//
// A GET answers a repository's debug configurations and the findings of the launch file, or, with
// `console=1`, the whole console of the current session. A POST carries the write token and one
// action: `launch` starts a session, `approve` approves a launch's text, the stepping actions, the
// frame, the evaluation, the breakpoints, the function breakpoints and the watch expressions go to
// the session, and `stop` signals the adapter once the page has confirmed it.
//
// A launch runs only once its exact text is approved (`debugText`, kept under the same key kind as
// a command's chain): an unapproved launch answers `{ approve: { name, cwd, program } }` and
// nothing starts. The program, `${file}` and the other placeholders filled by the page's context,
// must be an existing `.rite` file under a root the file browser serves, and goes to the adapter as
// one argument, never into a shell. Every refusal of the request is a 400 `{ error }` with a
// sentence of `server.debug`, apart from a placeholder with no value, which is the word the
// terminal route refuses a command with and the names it is about. A failed write of the approvals
// file is no refusal of the request and answers 409, as the approve answer of /api/commands does.

import { statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { textCatalog } from '../../../data/sources/config.ts';
import { tokenedBody } from '../../core/auth.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { inside, realPath } from '../../core/paths.ts';
import { words } from '../../core/words.ts';
import { approveTexts, debugText, isApproved } from '../approvals/approvals.ts';
import { refusal } from '../pty/refusal.ts';
import { folderOf } from '../runs/commands/files.ts';
import { fillText } from '../runs/commands/placeholders.ts';
import { repositoryOf } from '../runs/commands/repo.ts';
import { DEFAULT_CWD, DEFAULT_PROGRAM, readLaunch } from './launch.ts';
import type { DebugClient, Resume } from './session.ts';

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
    /** The server's one debug client. */
    client: DebugClient;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The most line numbers one file's breakpoints may hold. */
const LINES_MAX = 10_000;

/** One file's breakpoints as sent, before the fields are checked one by one. */
const fileShape = z.object({ path: z.string(), lines: z.array(z.number()) });

const NONE = z.object({});

const bodyShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('launch'),
        repo: z.unknown(),
        name: z.string().nullable(),
        context: z.object({ file: z.string().optional() }),
        breakpoints: z.array(fileShape),
        functions: z.array(z.string()),
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
    z.object({ action: z.literal('functions'), names: z.array(z.string()) }),
    z.object({ action: z.literal('watch'), expressions: z.array(z.string()) }),
    z.object({ action: z.literal('stop'), confirmed: z.boolean().optional() })
]);

type Body = z.infer<typeof bodyShape>;

function refuse(error: string, status = 400): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/** Whether a path lies under a root the file browser serves, as written and as it resolves. */
function served(path: string, roots: string[]): boolean {
    const real = realPath(path);
    return roots.some((root) => {
        const rootReal = realPath(root);
        return (
            inside(path, root) && (real === null || (rootReal !== null && inside(real, rootReal)))
        );
    });
}

/** The sentence refusing a file's breakpoints, or null when its path and lines are as asked. */
function fileRefusal(
    file: { path: string; lines: number[] },
    roots: string[],
    catalog: Record<string, string>
): string | null {
    if (!isAbsolute(file.path) || !roots.some((root) => inside(file.path, root))) {
        return words(catalog, 'server.debug.bad_path');
    }
    if (!file.lines.every((line) => Number.isInteger(line) && line >= 1))
        return words(catalog, 'server.debug.bad_lines');
    if (file.lines.length > LINES_MAX) return words(catalog, 'server.debug.too_many_lines');
    return null;
}

/** GET /api/debug?repo=<absolute path> or ?console=1. */
export function handleDebugGet(request: Request, options: DebugRouteOptions): Response {
    const query = new URL(request.url).searchParams;
    if (query.has('console')) return json(options.client.console(), { headers: NO_STORE });
    const asked = query.getAll('repo');
    if (asked.length !== 1) return refuse('repo must be given once');
    const found = repositoryOf(asked[0], options.rootsFor());
    if ('error' in found) return refuse(found.error);
    return json(readLaunch(found.repo), { headers: NO_STORE });
}

/**
 * The absolute path of the program a launch runs and the folder it runs in, or the response that
 * refuses the launch.
 */
function resolved(
    repo: string,
    body: Extract<Body, { action: 'launch' }>,
    program: string,
    cwd: string,
    options: DebugRouteOptions
): { program: string; cwd: string } | Response {
    const catalog = textCatalog(options.configFor());
    const folder = folderOf(repo, cwd === DEFAULT_CWD ? undefined : cwd);
    if (typeof folder !== 'string')
        return refuse(words(catalog, 'server.debug.field_problem', 'cwd', folder.message));
    const filled = fillText(program, { file: body.context.file }, repo);
    if (typeof filled !== 'string') return refusal(filled.error, filled.names);
    const path = isAbsolute(filled) ? filled : resolve(repo, filled);
    if (!served(path, options.rootsFor()))
        return refuse(words(catalog, 'server.debug.unserved', path));
    const real = realPath(path);
    if (real === null || !statSync(real).isFile() || !path.endsWith('.rite')) {
        return refuse(words(catalog, 'server.debug.not_rite', path));
    }
    return { program: path, cwd: folder };
}

/** The launch action: the configuration, its program, its approval, then the session. */
function launch(
    repo: string,
    body: Extract<Body, { action: 'launch' }>,
    options: DebugRouteOptions
): Response {
    const catalog = textCatalog(options.configFor());
    const roots = options.rootsFor();
    for (const file of body.breakpoints) {
        const refused = fileRefusal(file, roots, catalog);
        if (refused !== null) return refuse(refused);
    }
    const configuration =
        body.name === null
            ? {
                  name: words(catalog, 'server.debug.default_name'),
                  program: DEFAULT_PROGRAM,
                  cwd: DEFAULT_CWD
              }
            : readLaunch(repo).configurations.find((one) => one.name === body.name);
    if (configuration === undefined)
        return refuse(words(catalog, 'server.debug.no_configuration', body.name ?? ''));
    const run = resolved(repo, body, configuration.program, configuration.cwd, options);
    if (run instanceof Response) return run;
    const text = debugText(repo, configuration.cwd, configuration.program);
    if (!isApproved(options.approvalsFor(), text)) {
        const { name, cwd, program } = configuration;
        return json({ approve: { name, cwd, program } }, { headers: NO_STORE });
    }
    const started = options.client.launch({
        repo,
        name: configuration.name,
        program: run.program,
        cwd: run.cwd,
        breakpoints: body.breakpoints,
        functions: body.functions,
        watch: body.watch
    });
    return 'error' in started ? refuse(started.error) : json({ ok: true }, { headers: NO_STORE });
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
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const catalog = textCatalog(options.configFor());
    const parsed = bodyShape.safeParse(read.body);
    if (!parsed.success) return refuse(words(catalog, 'server.debug.bad_action'));
    const body = parsed.data;
    const client = options.client;
    if (body.action === 'launch' || body.action === 'approve') {
        const found = repositoryOf(body.repo, options.rootsFor());
        if ('error' in found) return refuse(found.error);
        if (body.action === 'launch') return launch(found.repo, body, options);
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
