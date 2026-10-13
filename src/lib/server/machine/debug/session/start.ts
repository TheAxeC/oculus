// Layer 2, server. What a launch does before the client starts a session: the configuration is
// found (a `launch.yml` entry by name, the default configuration, or one a host's
// `startDebugging` gives), its program and folder are resolved, and the adapter it names is
// chosen. A configuration of oculus's own adapter runs a `.rite` file that is approved by its text.
// A configuration of an app's debugger asks no approval: the app is approved, and the adapter it
// starts is its own. The app's providers resolve the configuration before and after its
// placeholders are filled, and a provider that answers nothing aborts the launch. The same
// function serves the `launch` action of POST /api/debug (routes.ts) and the `startDebugging` of
// an app's host (`debugControl`), so both refuse the same things in the same order.

import { statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
    DebugBreakpointSpec,
    DebugConfiguration,
    TerminalRefusal
} from '../../../../data/model/index.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { words } from '../../../core/words.ts';
import { debugText, isApproved } from '../../approvals/approvals.ts';
import { folderOf } from '../../runs/commands/files.ts';
import { fillText } from '../../runs/commands/placeholders.ts';
import { repositoryOf } from '../../runs/commands/repo.ts';
import { fillConfiguration, isRefusal } from '../app/resolve.ts';
import type { AppDebugPort, DebugControl } from '../app/port.ts';
import { DEFAULT_CWD, DEFAULT_PROGRAM, RITE_TYPE, readLaunch } from '../launch/read.ts';
import type { DebugClient, FunctionSpec } from '../session.ts';

/** What a launch needs of the process. */
export type StartDeps = {
    /** The directories the file browser serves, from which a repository and a program are taken. */
    rootsFor: () => string[];
    /** The approvals file. */
    approvalsFor: () => string;
    /** The text catalog. */
    catalog: () => Record<string, string>;
    client: DebugClient;
    port: () => AppDebugPort | undefined;
};

/** What a launch is asked for. */
export type StartInput = {
    repo: string;
    /** The name of a `launch.yml` entry; null for the default configuration. */
    name: string | null;
    /** A configuration given whole, as `startDebugging` does; it takes the place of the name. */
    configuration?: DebugConfiguration;
    context: { file?: string };
    breakpoints: { path: string; lines: DebugBreakpointSpec[] }[];
    functions: FunctionSpec[];
    watch: string[];
};

/** How a launch ended up. */
export type Started =
    | { ok: true }
    | { approve: { name: string; cwd: string; program: string } }
    | { error: string }
    | { refusal: TerminalRefusal; names: string[] };

/** The most line numbers one file's breakpoints may hold. */
const LINES_MAX = 10_000;

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
export function fileRefusal(
    file: { path: string; lines: { line: number }[] },
    roots: string[],
    catalog: Record<string, string>
): string | null {
    if (!isAbsolute(file.path) || !roots.some((root) => inside(file.path, root))) {
        return words(catalog, 'server.debug.bad_path');
    }
    if (!file.lines.every((one) => Number.isInteger(one.line) && one.line >= 1)) {
        return words(catalog, 'server.debug.bad_lines');
    }
    if (file.lines.length > LINES_MAX) return words(catalog, 'server.debug.too_many_lines');
    return null;
}

/**
 * The absolute path of the program a launch of the oculus adapter runs and the folder it runs in,
 * or the refusal.
 */
function riteRun(
    repo: string,
    context: { file?: string },
    program: string,
    cwd: string,
    deps: StartDeps
): { program: string; cwd: string } | Exclude<Started, { ok: true } | { approve: object }> {
    const catalog = deps.catalog();
    const folder = folderOf(repo, cwd === DEFAULT_CWD ? undefined : cwd);
    if (typeof folder !== 'string') {
        return { error: words(catalog, 'server.debug.field_problem', 'cwd', folder.message) };
    }
    const filled = fillText(program, { file: context.file }, repo);
    if (typeof filled !== 'string') return { refusal: filled.error, names: filled.names };
    const path = isAbsolute(filled) ? filled : resolve(repo, filled);
    if (!served(path, deps.rootsFor())) {
        return { error: words(catalog, 'server.debug.unserved', path) };
    }
    const real = realPath(path);
    if (real === null || !statSync(real).isFile() || !path.endsWith('.rite')) {
        return { error: words(catalog, 'server.debug.not_rite', path) };
    }
    return { program: path, cwd: folder };
}

/**
 * The configuration an app's providers resolve and the placeholders fill, ready for the adapter.
 */
async function appConfiguration(
    input: StartInput,
    configuration: DebugConfiguration,
    folderUri: string,
    deps: StartDeps
): Promise<
    | { configuration: Record<string, unknown> }
    | Exclude<Started, { ok: true } | { approve: object }>
> {
    const port = deps.port();
    const catalog = deps.catalog();
    if (port === undefined) {
        return { error: words(catalog, 'server.debug.no_debugger', configuration.type) };
    }
    if (!(await port.activate(configuration.type))) {
        return { error: words(catalog, 'server.debug.host_down', configuration.type) };
    }
    const base: Record<string, unknown> = {
        ...configuration.args,
        type: configuration.type,
        request: configuration.request,
        name: configuration.name,
        ...(configuration.program === '' ? {} : { program: configuration.program }),
        ...(configuration.cwd === DEFAULT_CWD ? {} : { cwd: configuration.cwd })
    };
    let initial: Awaited<ReturnType<AppDebugPort['resolve']>>;
    try {
        initial = await port.resolve(configuration.type, folderUri, base, 'initial');
    } catch (error) {
        return { error: words(catalog, 'server.debug.resolve_failed', String(error)) };
    }
    if ('abort' in initial) return { error: words(catalog, 'server.debug.aborted') };
    const filled = fillConfiguration(initial.configuration, input.context, input.repo);
    if (isRefusal(filled)) return { refusal: filled.error, names: filled.names };
    let substituted: Awaited<ReturnType<AppDebugPort['resolve']>>;
    try {
        substituted = await port.resolve(
            configuration.type,
            folderUri,
            filled as Record<string, unknown>,
            'substituted'
        );
    } catch (error) {
        return { error: words(catalog, 'server.debug.resolve_failed', String(error)) };
    }
    if ('abort' in substituted) return { error: words(catalog, 'server.debug.aborted') };
    return { configuration: substituted.configuration };
}

/** Start a session for a configuration: the oculus adapter's or an app debugger's. */
export async function startSession(input: StartInput, deps: StartDeps): Promise<Started> {
    const catalog = deps.catalog();
    const roots = deps.rootsFor();
    for (const file of input.breakpoints) {
        const refused = fileRefusal(file, roots, catalog);
        if (refused !== null) return { error: refused };
    }
    const debuggers = deps.client.debuggers();
    const configuration: DebugConfiguration | undefined =
        input.configuration ??
        (input.name === null
            ? {
                  name: words(catalog, 'server.debug.default_name'),
                  type: RITE_TYPE,
                  request: 'launch',
                  args: {},
                  program: DEFAULT_PROGRAM,
                  cwd: DEFAULT_CWD
              }
            : readLaunch(
                  input.repo,
                  debuggers.map((one) => one.debugger)
              ).configurations.find((one) => one.name === input.name));
    if (configuration === undefined) {
        return { error: words(catalog, 'server.debug.no_configuration', input.name ?? '') };
    }
    if (configuration.type === RITE_TYPE) {
        const run = riteRun(
            input.repo,
            input.context,
            configuration.program,
            configuration.cwd,
            deps
        );
        if ('error' in run || 'refusal' in run) return run;
        const text = debugText(input.repo, configuration.cwd, configuration.program);
        if (!isApproved(deps.approvalsFor(), text)) {
            const { name, cwd, program } = configuration;
            return { approve: { name, cwd, program } };
        }
        const started = deps.client.launch({
            repo: input.repo,
            name: configuration.name,
            program: run.program,
            cwd: run.cwd,
            breakpoints: input.breakpoints,
            functions: input.functions,
            watch: input.watch
        });
        return 'error' in started ? started : { ok: true };
    }
    const entry = debuggers.find((one) => one.debugger.type === configuration.type);
    if (entry === undefined) {
        return { error: words(catalog, 'server.debug.no_debugger', configuration.type) };
    }
    const folder = folderOf(
        input.repo,
        configuration.cwd === DEFAULT_CWD ? undefined : configuration.cwd
    );
    if (typeof folder !== 'string') {
        return { error: words(catalog, 'server.debug.field_problem', 'cwd', folder.message) };
    }
    const folderUri = pathToFileURL(input.repo).toString();
    const resolved = await appConfiguration(input, configuration, folderUri, deps);
    if ('error' in resolved || 'refusal' in resolved) return resolved;
    const program =
        typeof resolved.configuration.program === 'string' ? resolved.configuration.program : '';
    const started = deps.client.launch({
        repo: input.repo,
        name: configuration.name,
        program,
        cwd: folder,
        breakpoints: input.breakpoints,
        functions: input.functions,
        watch: input.watch,
        app: {
            app: entry.app,
            type: entry.debugger.type,
            label: entry.debugger.label,
            request: configuration.request,
            configuration: resolved.configuration,
            folder: folderUri
        }
    });
    return 'error' in started ? started : { ok: true };
}

/** The control an app's host reaches its sessions through. */
export function debugControl(deps: StartDeps): DebugControl {
    return {
        async start(request) {
            const folder = new URL(request.folder === '' ? 'file:///' : request.folder).pathname;
            const found = repositoryOf(decodeURIComponent(folder), deps.rootsFor());
            if ('error' in found || deps.client.active) return false;
            const held = deps.client.held();
            const given = request.configuration;
            const configuration: DebugConfiguration | undefined =
                given === null
                    ? undefined
                    : {
                          name: typeof given.name === 'string' ? given.name : request.name,
                          type: typeof given.type === 'string' ? given.type : '',
                          request: given.request === 'attach' ? 'attach' : 'launch',
                          args: Object.fromEntries(
                              Object.entries(given).filter(
                                  ([key]) =>
                                      ![
                                          'name',
                                          'type',
                                          'request',
                                          'program',
                                          'cwd',
                                          'before'
                                      ].includes(key)
                              )
                          ),
                          program: typeof given.program === 'string' ? given.program : '',
                          cwd: typeof given.cwd === 'string' ? given.cwd : DEFAULT_CWD
                      };
            const started = await startSession(
                {
                    repo: found.repo,
                    name: configuration === undefined ? request.name : null,
                    ...(configuration === undefined ? {} : { configuration }),
                    context: {},
                    breakpoints: held.breakpoints,
                    functions: held.functions,
                    watch: held.watch
                },
                deps
            );
            return 'ok' in started;
        },
        stop: (session) => {
            const current = deps.client.controls.current();
            if (current?.id !== session) return Promise.resolve(false);
            return Promise.resolve('ok' in deps.client.stop(true));
        },
        custom: (session, command, args) => {
            const current = deps.client.controls.current();
            if (current?.id !== session) {
                return Promise.reject(new Error('refused:no_session'));
            }
            return deps.client.controls.custom(command, args);
        },
        current: () => deps.client.controls.current()
    };
}
