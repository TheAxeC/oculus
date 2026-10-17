// Layer 2, server. The tasks of the apps' hosts: the task providers they register
// (`oculus.tasks.registerTaskProvider`), the commands those tasks are listed as, and the runs of
// them. A task an app gives is a project command of the source `app` named `<source>: <name>`; a
// `commands.yml` entry with a `type` is a command of the source `file` that the app which defines
// the type resolves (`oculus/tasks/resolve`). Neither takes an approval of its text: the app is
// approved, and what it runs is its own.
//
// A run asks the host to prepare the task (`oculus/tasks/prepare`). A shell or process execution
// comes back as a program and its arguments, which oculus runs in a tmux terminal of the kind
// `app` that prints the marker the page reads the output by; a custom execution comes back as the
// `terminal` stream its pseudoterminal opened, which is a stream terminal (stream-terminals.ts).
// Rerun and Restart prepare the task again, so a host that was restarted since, and a task whose
// definition changed, run as they are now. The host is told when each run starts, when its
// process starts and when each ends (`oculus/tasks/event`), and `TaskExecution.terminate()` ends
// the run (`oculus/tasks/terminate`).
//
// A task runs only in a repository inside the folders of its app's scope. A task whose scope is a
// folder runs in that folder; a workspace or global task runs in the repository that lists it.

import { randomBytes } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { relative, isAbsolute } from 'node:path';
import { z } from 'zod';
import { MARKER_FORMAT, chainMarker } from '../../../../../data/helpers/run/marker.ts';
import type {
    AppTaskDescription,
    CommandFinding,
    CommandsAnswer,
    ProjectCommand,
    Terminal,
    TerminalJob,
    TerminalRefusal
} from '../../../../../data/model/index.ts';
import { Refused, parsed, type HostHandler } from '../../host/connection.ts';
import { TASKS_COMMAND, type ActivationEvent } from '../../read/activation.ts';
import type { HeldApp } from '../../read/held.ts';
import { shellWord } from '../../../pty/shell-word.ts';
import type { HostTools } from '../registry.ts';
import { ToolsScope } from '../scope.ts';
import type { TerminalsEnv } from './terminals.ts';
import { words } from '../../../../core/words.ts';

/** The event a listing and a run of tasks raises for the hosts of apps that name it. */
const RUN_TASK_EVENT: ActivationEvent = {
    kind: 'onCommand',
    id: TASKS_COMMAND
};

/** How long a provider may take to give its tasks before the listing goes on without them. */
const PROVIDE_MS = 5000;

/** How long a custom execution may take to open its pseudoterminal's stream. */
const OPEN_MS = 5000;

/** The most tasks one provider is listed with. */
const TASKS_MAX = 500;

const typeShape = z.object({ type: z.string().min(1).max(200) });

const describedShape: z.ZodType<AppTaskDescription> = z.object({
    key: z.string().min(1).max(100),
    name: z.string().max(500),
    source: z.string().max(500),
    type: z.string().max(200),
    definition: z.record(z.string(), z.unknown()),
    scope: z.string().max(4096),
    kind: z.enum(['shell', 'process', 'custom', 'none']),
    group: z.object({ kind: z.enum(['build', 'test']), isDefault: z.boolean() }).nullable(),
    isBackground: z.boolean(),
    detail: z.string().max(2000),
    problemMatchers: z.array(z.string().max(200)).max(32)
});

const preparedShape = z.union([
    z.object({
        kind: z.literal('argv'),
        argv: z.array(z.string().max(100_000)).min(1).max(1000),
        cwd: z.string().max(4096),
        env: z.record(z.string(), z.string())
    }),
    z.object({ kind: z.literal('terminal') })
]);

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The line that prints the marker the page reads a task's output by, then runs the program. */
const MARKED = `printf '${MARKER_FORMAT}' "$1"; shift; exec "$@"`;

/** The refusal of a run, and the names its sentence is about. */
export type TaskRefusal = { refused: TerminalRefusal; names: string[] };

/** What a run answers. */
export type TaskStart = { terminal: Terminal } | TaskRefusal;

/** The tasks part of one host. */
export type TaskHost = {
    handlers: Record<string, HostHandler>;
    /** The task types the host registered a provider for. */
    types(): string[];
    stop(): void;
};

/** What the tasks need of the registry. */
export type TasksPorts = {
    /** The approved, enabled apps in the Views list's order. */
    actives(): HeldApp[];
    /** The tools of the running host of an app, or undefined. */
    host(app: string): { tools: HostTools; tasks: TaskHost } | undefined;
    /** Start the host of an app for an activation event; whether it runs. */
    activate(app: string, event: ActivationEvent): Promise<boolean>;
    terminals(): TerminalsEnv;
    scope: ToolsScope;
    catalog(): Record<string, string>;
};

/** One run of a task. */
type Run = {
    id: string;
    app: string;
    key: string;
    terminal: string;
    stream: boolean;
    ended: boolean;
    /** Whether a list of the terminals has held the run's terminal. */
    seen: boolean;
    /** When the run began, in milliseconds. */
    since: number;
};

/** How long a terminal may stay out of the list after its run began before the run is over. */
const UNLISTED_MS = 10_000;

/** The real path of a path, or null. */
function real(path: string): string | null {
    try {
        return realpathSync.native(path);
    } catch {
        return null;
    }
}

/** Whether a path lies in a folder or is it. */
function within(path: string, folder: string): boolean {
    const way = relative(folder, path);
    return way === '' || (!way.startsWith('..') && !isAbsolute(way));
}

/** The tasks part of one host: its provider registrations and what it asks of oculus. */
export function taskHost(host: HostTools, service: () => AppTasks): TaskHost {
    const types = new Set<string>();
    const handlers: Record<string, HostHandler> = {
        'oculus/tasks/register': (params) => {
            const app = host.app();
            const { type } = parsed(typeShape, params);
            if (!app.row.contributes.taskDefinitions.some((one) => one.type === type)) {
                throw new Refused('not_declared');
            }
            if (types.has(type)) throw new Refused('refused:registered');
            types.add(type);
            host.changed();
            return null;
        },
        'oculus/tasks/unregister': (params) => {
            host.app();
            types.delete(parsed(typeShape, params).type);
            host.changed();
            return null;
        },
        'oculus/tasks/execute': async (params) => {
            const task = parsed(z.object({ task: describedShape }), params).task;
            const started = await service().executeFor(host.id, task);
            if ('refused' in started) throw new Refused(`refused:${started.refused}`);
            return { execution: started.execution };
        },
        'oculus/tasks/terminate': async (params) => {
            host.app();
            const { execution } = parsed(z.object({ execution: z.string().max(100) }), params);
            await service().terminate(host.id, execution);
            return null;
        }
    };
    return {
        handlers,
        types: () => [...types],
        stop() {
            types.clear();
            service().hostStopped(host.id);
        }
    };
}

/** The tasks of every host. */
export class AppTasks {
    readonly #ports: TasksPorts;
    readonly #runs = new Map<string, Run>();
    #counter = 0;

    constructor(ports: TasksPorts) {
        this.#ports = ports;
        ports.terminals().onChange(() => this.#watch());
    }

    /**
     * The commands of a repository with the tasks of the apps added: the typed entries of
     * `commands.yml` resolved by the app that defines the type (or left out with a finding), and
     * the tasks every provider gives, after the commands of the other sources.
     */
    async commands(repo: string, base: CommandsAnswer): Promise<CommandsAnswer> {
        const findings: CommandFinding[] = [...base.findings];
        const commands: ProjectCommand[] = [];
        for (const command of base.commands) {
            if (command.task?.key !== '') {
                commands.push(command);
                continue;
            }
            const resolved = await this.#resolve(command, repo, findings);
            if (resolved !== null) commands.push(resolved);
        }
        const taken = new Set(
            commands.flatMap((one) => (one.default === undefined ? [] : [one.default]))
        );
        const given = await this.#provided(repo, findings);
        const names = new Set(commands.map((one) => one.name));
        const counts = new Map<string, number>();
        for (const one of given) counts.set(one.name, (counts.get(one.name) ?? 0) + 1);
        for (const one of given) {
            const clash = names.has(one.name) || (counts.get(one.name) ?? 0) > 1;
            const name = clash ? `${one.name} (${one.task?.appTitle ?? ''})` : one.name;
            let role = one.default;
            if (role !== undefined && taken.has(role)) role = undefined;
            if (role !== undefined) taken.add(role);
            names.add(name);
            const rest = Object.fromEntries(
                Object.entries(one).filter(([key]) => key !== 'default')
            ) as ProjectCommand;
            commands.push({ ...rest, name, ...(role === undefined ? {} : { default: role }) });
        }
        return { commands, findings };
    }

    /** A typed `commands.yml` entry as the app that defines its type resolves it, or null. */
    async #resolve(
        command: ProjectCommand,
        repo: string,
        findings: CommandFinding[]
    ): Promise<ProjectCommand | null> {
        const task = command.task;
        const file = command.entry?.file ?? '';
        const field = `commands[${command.name}].type`;
        if (task === undefined) return command;
        const app = this.#ports
            .actives()
            .find((one) => one.row.contributes.taskDefinitions.some((d) => d.type === task.type));
        if (app === undefined) {
            findings.push({
                file,
                field,
                message: words(
                    this.#ports.catalog(),
                    'server.commands.task_type_unknown',
                    task.type
                )
            });
            return null;
        }
        const definition = app.row.contributes.taskDefinitions.find((d) => d.type === task.type);
        const missing = (definition?.required ?? []).find(
            (one) => !Object.hasOwn(task.definition, one)
        );
        if (missing !== undefined) {
            findings.push({
                file,
                field: `commands[${command.name}].${missing}`,
                message: words(
                    this.#ports.catalog(),
                    'server.commands.task_required',
                    task.type,
                    missing
                )
            });
            return null;
        }
        if (!(await this.#ports.activate(app.id, RUN_TASK_EVENT)))
            return this.#dropped(file, field, task.type, findings);
        const held = this.#ports.host(app.id);
        if (held === undefined) return this.#dropped(file, field, task.type, findings);
        try {
            const answer = await held.tools.request('oculus/tasks/resolve', {
                type: task.type,
                definition: task.definition
            });
            const resolved = answer === null ? null : describedShape.safeParse(answer);
            if (!resolved?.success) {
                return this.#dropped(file, field, task.type, findings);
            }
            const description = resolved.data;
            return {
                ...command,
                run: description.detail,
                matchers: command.matchers ?? description.problemMatchers,
                task: {
                    ...task,
                    app: app.id,
                    appTitle: app.row.title,
                    key: description.key,
                    label: '',
                    background: description.isBackground,
                    group: description.group?.kind ?? null,
                    isDefault: description.group?.isDefault === true,
                    folder: this.#folderOf(description.scope)
                }
            };
        } catch {
            return this.#dropped(file, field, task.type, findings);
        }
    }

    #dropped(file: string, field: string, type: string, findings: CommandFinding[]): null {
        findings.push({
            file,
            field,
            message: words(this.#ports.catalog(), 'server.commands.task_not_resolved', type)
        });
        return null;
    }

    /** The tasks every provider of an acting app gives for the repository. */
    async #provided(repo: string, findings: CommandFinding[]): Promise<ProjectCommand[]> {
        const out: ProjectCommand[] = [];
        const repoReal = real(repo);
        if (repoReal === null) return out;
        for (const app of this.#ports.actives()) {
            const folders = this.#ports.scope.folders(app).map((one) => one.real);
            if (!folders.some((folder) => within(repoReal, folder))) continue;
            const declared = app.row.contributes.taskDefinitions.length > 0;
            if (!declared) continue;
            if (!(await this.#ports.activate(app.id, RUN_TASK_EVENT))) continue;
            const held = this.#ports.host(app.id);
            if (held === undefined) continue;
            for (const type of held.tasks.types()) {
                const given = await this.#give(held.tools, type);
                if (given === null) {
                    findings.push({
                        file: app.row.name,
                        field: `tasks.${type}`,
                        message: words(
                            this.#ports.catalog(),
                            'server.commands.task_provider_failed',
                            type
                        )
                    });
                    continue;
                }
                for (const one of given.slice(0, TASKS_MAX)) {
                    const folder = this.#folderOf(one.scope);
                    if (folder !== '' && !within(repoReal, ToolsScope.pathOf(folder) ?? ''))
                        continue;
                    out.push(this.#commandOf(app, one, repoReal, folder));
                }
            }
        }
        return out;
    }

    /** A provider's tasks, or null when it failed or took too long. */
    async #give(tools: HostTools, type: string): Promise<AppTaskDescription[] | null> {
        try {
            const timeout = new Promise<null>((resolve) => {
                const timer = setTimeout(() => resolve(null), PROVIDE_MS);
                timer.unref();
            });
            const answer = await Promise.race([
                tools.request('oculus/tasks/provide', { type }),
                timeout
            ]);
            if (!Array.isArray(answer)) return null;
            return answer.flatMap((one) => {
                const read = describedShape.safeParse(one);
                return read.success ? [read.data] : [];
            });
        } catch {
            return null;
        }
    }

    /** The folder a task's scope names as a file URI, or the empty text for the whole workspace. */
    #folderOf(scope: string): string {
        return scope === 'global' || scope === 'workspace' ? '' : scope;
    }

    #commandOf(
        app: HeldApp,
        one: AppTaskDescription,
        repo: string,
        folder: string
    ): ProjectCommand {
        const role = one.group?.isDefault === true ? one.group.kind : undefined;
        return {
            name: `${one.source}: ${one.name}`,
            run: one.detail,
            cwd: repo,
            depends_on: [],
            ...(role === undefined ? {} : { default: role }),
            source: 'app',
            matchers: one.problemMatchers,
            task: {
                app: app.id,
                appTitle: app.row.title,
                type: one.type,
                key: one.key,
                label: one.source,
                definition: one.definition,
                background: one.isBackground,
                group: one.group?.kind ?? null,
                isDefault: one.group?.isDefault === true,
                folder
            }
        };
    }

    /**
     * Run a command that an app's host runs in a terminal of the given grid. With `again` the row
     * of that ended terminal runs it once more.
     */
    async run(
        command: ProjectCommand,
        repo: string,
        size: { cols: unknown; rows: unknown },
        again?: Terminal
    ): Promise<TaskStart> {
        const ref = command.task;
        if (ref === undefined) return { refused: 'task-gone', names: [command.name] };
        const app = this.#ports.actives().find((one) => one.id === ref.app);
        const gone: TaskRefusal = { refused: 'task-gone', names: [command.name] };
        if (app === undefined) return gone;
        if (!(await this.#ports.activate(app.id, RUN_TASK_EVENT))) return gone;
        const held = this.#ports.host(app.id);
        if (held === undefined) return gone;
        return this.#launch(app, held.tools, command, repo, size, again);
    }

    async #launch(
        app: HeldApp,
        tools: HostTools,
        command: ProjectCommand,
        repo: string,
        size: { cols: unknown; rows: unknown },
        again?: Terminal
    ): Promise<TaskStart> {
        const ref = command.task;
        if (ref === undefined) return { refused: 'task-gone', names: [command.name] };
        const env = this.#ports.terminals();
        const token = randomBytes(6).toString('hex');
        const job: TerminalJob = {
            repo,
            name: command.name,
            source: 'app',
            token,
            chain: [{ name: command.name, cwd: repo }],
            app: {
                app: app.id,
                title: app.row.title,
                type: ref.type,
                background: ref.background
            },
            matchers: command.matchers ?? []
        };
        const opened = new Promise<string>((resolve) => {
            env.streams.expect(token, {
                app: app.id,
                job,
                ...(again === undefined ? {} : { rebind: again.id }),
                taken: resolve
            });
        });
        if (again !== undefined && env.streams.has(again.id)) env.streams.end(again.id, 0);
        let prepared: z.infer<typeof preparedShape>;
        try {
            const answer = await tools.request('oculus/tasks/prepare', {
                key: ref.key,
                token,
                cwd: repo
            });
            const read = preparedShape.safeParse(answer);
            if (!read.success) throw new Error('shape');
            prepared = read.data;
        } catch {
            env.streams.forget(token);
            return { refused: 'task-gone', names: [command.name] };
        }
        let terminal: Terminal | undefined;
        if (prepared.kind === 'terminal') {
            const timeout = new Promise<string>((resolve) => {
                const timer = setTimeout(() => resolve(''), OPEN_MS);
                timer.unref();
            });
            const id = await Promise.race([opened, timeout]);
            env.streams.forget(token);
            terminal = env.list().find((one) => one.id === id);
        } else {
            env.streams.forget(token);
            const folder = this.#folderFor(app, prepared.cwd, repo);
            if (folder === null) return { refused: 'bad-repo', names: [command.name] };
            const variables = Object.entries(prepared.env).flatMap(([name, value]) => {
                if (!NAME.test(name)) return [];
                return [`${name}=${value}`];
            });
            const argv = [
                'env',
                ...variables,
                'sh',
                '-c',
                MARKED,
                'sh',
                chainMarker(token, command.name),
                ...prepared.argv
            ];
            if (again === undefined) {
                terminal = await env.start({
                    app: app.id,
                    name: command.name,
                    cwd: folder,
                    argv,
                    job,
                    size
                });
            } else {
                await env.respawn(again.id, argv.map(shellWord).join(' '), job);
                terminal = env.list().find((one) => one.id === again.id);
            }
        }
        if (terminal === undefined) return { refused: 'terminal-not-started', names: [] };
        this.#begin(app.id, tools, ref.key, terminal);
        return { terminal };
    }

    /**
     * The folder a task's program runs in: its own when it lies in the app's scope, else the
     * repository.
     */
    #folderFor(app: HeldApp, cwd: string, repo: string): string | null {
        if (cwd === '') return repo;
        const found = this.#ports.scope.resolve(app, ToolsScope.uriOf(cwd), true);
        if (found.ok) return found.file.real;
        const asPath = real(cwd);
        if (asPath === null) return repo;
        const inScope = this.#ports.scope.folders(app).some((one) => within(asPath, one.real));
        return inScope ? asPath : null;
    }

    /** Record the run and tell the host it started. */
    #begin(app: string, tools: HostTools, key: string, terminal: Terminal): void {
        this.#counter += 1;
        const id = `x${this.#counter}`;
        const run: Run = {
            id,
            app,
            key,
            terminal: terminal.id,
            stream: this.#ports.terminals().streams.has(terminal.id),
            ended: false,
            seen: false,
            since: Date.now()
        };
        for (const [other, one] of this.#runs) {
            if (one.terminal === terminal.id) this.#finish(other, one, null);
        }
        this.#runs.set(id, run);
        tools.notify('oculus/tasks/event', { kind: 'start', execution: id, key });
        if (terminal.pid > 0) {
            tools.notify('oculus/tasks/event', {
                kind: 'processStart',
                execution: id,
                key,
                pid: terminal.pid
            });
        }
    }

    /** A run of the host's own asking: the repository is the folder of the task's scope. */
    async executeFor(
        app: string,
        task: AppTaskDescription
    ): Promise<{ execution: string } | TaskRefusal> {
        const held = this.#ports.host(app);
        const acting = this.#ports.actives().find((one) => one.id === app);
        if (held === undefined || acting === undefined) {
            return { refused: 'task-gone', names: [task.name] };
        }
        const folders = this.#ports.scope.folders(acting);
        const scoped = task.scope === 'global' || task.scope === 'workspace' ? '' : task.scope;
        const path = scoped === '' ? (folders.at(0)?.real ?? null) : ToolsScope.pathOf(scoped);
        const found =
            path === null
                ? undefined
                : this.#ports.scope.resolve(acting, ToolsScope.uriOf(path), true);
        if (!found?.ok) return { refused: 'bad-repo', names: [task.name] };
        const command = this.#commandOf(acting, task, found.file.real, scoped);
        const before = new Set(this.#runs.keys());
        const started = await this.#launch(
            acting,
            held.tools,
            command,
            found.file.real,
            { cols: 120, rows: 30 },
            undefined
        );
        if ('refused' in started) return started;
        const made = [...this.#runs.keys()].find((id) => !before.has(id));
        return { execution: made ?? '' };
    }

    /** End the run an execution names, as `TaskExecution.terminate` asks. */
    async terminate(app: string, execution: string): Promise<void> {
        const run = this.#runs.get(execution);
        if (run?.app !== app || run.ended) return;
        const env = this.#ports.terminals();
        if (run.stream) env.streams.end(run.terminal, 1);
        else await env.interrupt(run.terminal).catch(() => undefined);
    }

    /** The host of an app stopped: its runs are forgotten, and the terminals stay. */
    hostStopped(app: string): void {
        for (const [id, run] of this.#runs) if (run.app === app) this.#runs.delete(id);
    }

    /** The terminals moved: each run whose terminal ended or went is told to its host. */
    #watch(): void {
        const listed = new Map(
            this.#ports
                .terminals()
                .list()
                .map((one) => [one.id, one])
        );
        for (const [id, run] of this.#runs) {
            if (run.ended) continue;
            const terminal = listed.get(run.terminal);
            if (terminal === undefined) {
                // A list taken before the terminal started does not hold it yet.
                if (!run.seen && Date.now() - run.since < UNLISTED_MS) {
                    const timer = setTimeout(() => this.#watch(), UNLISTED_MS);
                    timer.unref();
                    continue;
                }
                this.#finish(id, run, null);
            } else {
                run.seen = true;
                if (terminal.exit !== null) this.#finish(id, run, terminal.exit);
            }
        }
    }

    #finish(id: string, run: Run, exit: number | null): void {
        run.ended = true;
        this.#runs.delete(id);
        const held = this.#ports.host(run.app);
        if (held === undefined) return;
        if (exit !== null) {
            held.tools.notify('oculus/tasks/event', {
                kind: 'processEnd',
                execution: id,
                key: run.key,
                exitCode: exit
            });
        }
        held.tools.notify('oculus/tasks/event', { kind: 'end', execution: id, key: run.key });
    }
}
