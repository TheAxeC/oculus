// Layer 2, server. `oculus.tasks` of the host's object: task providers, `fetchTasks`,
// `executeTask` and the events of the task executions, as VS Code's `tasks` names them.
//
// A provider is registered with oculus by its task type (`oculus/tasks/register`). oculus asks for
// its tasks (`oculus/tasks/provide`) and resolves a `commands.yml` entry of the type
// (`oculus/tasks/resolve`); each answer lists the tasks as plain data, each under a `key` the
// runner holds the `Task` object by. A run is oculus's: it asks the runner to prepare a task
// (`oculus/tasks/prepare`), which answers the program and arguments of a shell or process
// execution for oculus to run in a terminal, or, for a custom execution, calls the callback and
// opens the pseudoterminal's `terminal` stream. `executeTask` asks oculus to run a task
// (`oculus/tasks/execute`); `TaskExecution.terminate()` asks it to end the run
// (`oculus/tasks/terminate`). oculus tells the runner when a run starts, when its process starts
// and when each ends (`oculus/tasks/event`).

import { EventEmitter, NO_CANCEL } from '../values/events.mjs';
import { Task, TaskScope } from '../values/run.mjs';

const SHELL = '/bin/sh';

/** An argument quoted for the shell that runs a command and its arguments. */
function quoted(arg) {
    if (typeof arg === 'object' && arg !== null) {
        const value = String(arg.value);
        if (arg.quoting === 1) return value.replace(/([^A-Za-z0-9_@%+=:,./-])/g, '\\$1');
        if (arg.quoting === 3) return `"${value.replace(/(["\\$`])/g, '\\$1')}"`;
        return `'${value.replace(/'/g, "'\\''")}'`;
    }
    const text = String(arg);
    return /^[A-Za-z0-9_@%+=:,./-]+$/.test(text) ? text : `'${text.replace(/'/g, "'\\''")}'`;
}

/** The kind of execution a task holds. */
function kindOf(execution) {
    if (execution === undefined || execution === null) return 'none';
    if (typeof execution.callback === 'function') return 'custom';
    if (typeof execution.process === 'string') return 'process';
    return 'shell';
}

/** The folder a scope names as a file URI, or the word of the scope. */
function scopeOf(scope) {
    if (scope === TaskScope.Global) return 'global';
    if (scope === undefined || scope === TaskScope.Workspace) return 'workspace';
    const uri = scope.uri;
    return uri === undefined ? 'workspace' : uri.toString();
}

/** The group of a task as oculus reads it: its kind and whether it is the default. */
function groupOf(group) {
    if (group === undefined || group === null) return null;
    const id = typeof group === 'string' ? group : group.id;
    if (id !== 'build' && id !== 'test') return null;
    return { kind: id, isDefault: group.isDefault === true };
}

/** A definition as plain data: its own properties only. */
function plainDefinition(definition) {
    return JSON.parse(JSON.stringify(definition ?? {}));
}

/**
 * The tasks part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 *   terminals: { api: any },
 * }} link
 */
export function createTasks(link) {
    const { connection, report } = link;
    const providers = new Map();
    const known = new Map();
    const executions = new Map();
    const events = {
        start: new EventEmitter(report),
        end: new EventEmitter(report),
        processStart: new EventEmitter(report),
        processEnd: new EventEmitter(report)
    };
    let counter = 0;

    /** Hold a task under a key and answer it as plain data. */
    function hold(task) {
        for (const [key, one] of known) if (one === task) return describe(key, task);
        counter += 1;
        const key = `t${counter}`;
        known.set(key, task);
        return describe(key, task);
    }

    function describe(key, task) {
        const matchers = Array.isArray(task.problemMatchers) ? task.problemMatchers : [];
        return {
            key,
            name: String(task.name ?? ''),
            source: String(task.source ?? ''),
            type: String(task.definition?.type ?? ''),
            definition: plainDefinition(task.definition),
            scope: scopeOf(task.scope),
            kind: kindOf(task.execution),
            group: groupOf(task.group),
            isBackground: task.isBackground === true,
            detail: typeof task.detail === 'string' ? task.detail : '',
            problemMatchers: matchers.map(String)
        };
    }

    /** The tasks a provider gives, as Task objects. */
    async function provided(provider) {
        const given = (await provider.provideTasks?.(NO_CANCEL)) ?? [];
        return Array.isArray(given) ? given.filter((one) => one instanceof Task) : [];
    }

    connection.onRequest('oculus/tasks/provide', async (params) => {
        const provider = providers.get(params.type);
        if (provider === undefined) return [];
        return (await provided(provider)).map(hold);
    });

    connection.onRequest('oculus/tasks/resolve', async (params) => {
        const provider = providers.get(params.type);
        if (provider === undefined || typeof provider.resolveTask !== 'function') return null;
        const definition = params.definition ?? {};
        const asked = new Task(
            { ...definition, type: params.type },
            TaskScope.Workspace,
            String(definition.label ?? definition.name ?? params.type),
            params.type
        );
        const resolved = await provider.resolveTask(asked, NO_CANCEL);
        return resolved instanceof Task ? hold(resolved) : null;
    });

    connection.onRequest('oculus/tasks/prepare', async (params) => {
        const task = known.get(params.key);
        if (task === undefined) throw new Error('missing');
        const execution = task.execution;
        const kind = kindOf(execution);
        const cwd = params.cwd;
        if (kind === 'custom') {
            const pty = await execution.callback(plainDefinition(task.definition));
            const made = link.terminals.api.createTerminal({
                name: String(task.name),
                pty,
                purpose: { token: params.token, task: params.key }
            });
            await new Promise((resolve) => {
                const listening = link.terminals.api.onDidOpenTerminal((opened) => {
                    if (opened !== made) return;
                    listening.dispose();
                    resolve(undefined);
                });
            });
            return { kind: 'terminal' };
        }
        if (kind === 'none') throw new Error('refused:no_execution');
        const options = execution.options ?? {};
        const folder = options.cwd === undefined ? cwd : String(options.cwd.fsPath ?? options.cwd);
        const env = Object.fromEntries(
            Object.entries(options.env ?? {}).map(([name, value]) => [name, String(value)])
        );
        if (kind === 'process') {
            return {
                kind: 'argv',
                argv: [
                    execution.process,
                    ...(execution.args ?? []).map((one) => String(one?.value ?? one))
                ],
                cwd: folder,
                env
            };
        }
        const line =
            execution.commandLine ??
            [execution.command, ...(execution.args ?? [])].map(quoted).join(' ');
        const shell = options.executable ?? SHELL;
        const shellArgs = options.shellArgs ?? ['-c'];
        return { kind: 'argv', argv: [shell, ...shellArgs, String(line)], cwd: folder, env };
    });

    /** The TaskExecution of an execution id, made when oculus ran the task on its own. */
    function executionOf(id, key) {
        let held = executions.get(id);
        if (held === undefined) {
            const task = known.get(key);
            if (task === undefined) return undefined;
            held = {
                task,
                terminate: () => connection.sendRequest('oculus/tasks/terminate', { execution: id })
            };
            executions.set(id, held);
        }
        return held;
    }

    connection.onNotification('oculus/tasks/event', (params) => {
        const held = executionOf(params.execution, params.key);
        if (held === undefined) return;
        if (params.kind === 'start') events.start.fire({ execution: held });
        else if (params.kind === 'processStart') {
            events.processStart.fire({ execution: held, processId: params.pid });
        } else if (params.kind === 'processEnd') {
            events.processEnd.fire({ execution: held, exitCode: params.exitCode });
        } else if (params.kind === 'end') {
            executions.delete(params.execution);
            events.end.fire({ execution: held });
        }
    });

    const api = {
        registerTaskProvider(type, provider) {
            if (providers.has(type)) throw new Error('refused:registered');
            if (typeof provider?.provideTasks !== 'function') {
                throw new TypeError('a task provider has provideTasks');
            }
            providers.set(type, provider);
            void connection.sendRequest('oculus/tasks/register', { type }).catch((error) => {
                if (providers.get(type) === provider) providers.delete(type);
                report(error);
            });
            return {
                dispose() {
                    if (providers.get(type) !== provider) return;
                    providers.delete(type);
                    void connection.sendRequest('oculus/tasks/unregister', { type }).catch(report);
                }
            };
        },
        async fetchTasks(filter) {
            const out = [];
            for (const [type, provider] of providers) {
                if (filter?.type !== undefined && filter.type !== type) continue;
                out.push(...(await provided(provider)));
            }
            return out;
        },
        async executeTask(task) {
            const described = hold(task);
            const answer = await connection.sendRequest('oculus/tasks/execute', {
                task: described
            });
            const held = executionOf(answer.execution, described.key);
            return held;
        },
        get taskExecutions() {
            return [...executions.values()];
        },
        onDidStartTask: events.start.event,
        onDidEndTask: events.end.event,
        onDidStartTaskProcess: events.processStart.event,
        onDidEndTaskProcess: events.processEnd.event
    };

    return {
        api,
        stop() {
            providers.clear();
            known.clear();
            executions.clear();
        }
    };
}
