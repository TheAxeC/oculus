// Layer 2, server test. The tasks of an app's host (lib/server/machine/apps/tools/run/tasks.ts)
// over the real runner and a private tmux server: the tasks a provider gives are listed among the
// repository's commands as `<source>: <name>`, the first of a group marked default becomes the
// default build, a press runs each kind of execution in a terminal named after the command, the
// host hears each run start and end with its exit code, a typed entry of `commands.yml` is
// resolved by the app that defines its type, and a run of the host's own asking can be ended. These
// are the task rows of G35 (a terminal operation acts only on the terminal it names) and G77.
//
// Every tmux call carries the socket of a private server in a scratch directory
// (pty/tmux-server.ts). What this does NOT cover: the page that draws the commands, and the
// problem matchers that read the output (tests/state/sessions/terminal/pty).
// @module-tag slow: each case starts node processes and a tmux server.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { CommandsAnswer, ProjectCommand } from '../../../../../src/lib/data/model/index.ts';
import { readCommandsFile } from '../../../../../src/lib/server/machine/runs/commands/files.ts';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { world } from '../world/hosts-world.ts';
import { tmuxTerminals } from '../world/tmux-terminals.ts';

const NOTES = 'app:notes';

const HOST = `
export function activate(oculus) {
  const T = (name, execution, extra) => Object.assign(
    new oculus.Task({ type: 'notes.task', target: name }, oculus.TaskScope.Workspace, name, 'notes', execution, []),
    extra
  );
  const buildGroup = new oculus.TaskGroup('build', 'Build');
  buildGroup.isDefault = true;
  const writer = new oculus.EventEmitter();
  const closer = new oculus.EventEmitter();
  const events = [];
  const waiters = [];
  const record = (event) => {
    events.push(event);
    for (const check of [...waiters]) check();
  };
  const reached = (wanted) => typeof wanted === 'number' ? events.length >= wanted : events.some((one) => one[0] === wanted);
  const waitFor = (wanted) => new Promise((resolve) => {
    const check = () => {
      if (!reached(wanted)) return;
      waiters.splice(waiters.indexOf(check), 1);
      resolve();
    };
    waiters.push(check);
    check();
  });
  const shell = T('build', new oculus.ShellExecution('echo hi'), { group: buildGroup });
  const proc = T('proc', new oculus.ProcessExecution('/bin/echo', ['proc']), {});
  const custom = T('custom', new oculus.CustomExecution(async () => ({
    onDidWrite: writer.event,
    onDidClose: closer.event,
    open: () => { writer.fire('custom out\\r\\n'); setImmediate(() => closer.fire(3)); },
    close: () => undefined
  })), {});
  const slow = T('slow', new oculus.ShellExecution('sleep 30'), {});
  oculus.tasks.registerTaskProvider('notes.task', {
    provideTasks: () => [shell, proc, custom, slow, T('npm: build', new oculus.ShellExecution('echo found'), {})],
    resolveTask: (task) => {
      const group = new oculus.TaskGroup('test', 'Test');
      return T('typed ' + task.definition.target, new oculus.ShellExecution('echo resolved-' + task.definition.target), { group });
    }
  });
  oculus.tasks.onDidStartTask((e) => record(['start', e.execution.task.name]));
  oculus.tasks.onDidEndTaskProcess((e) => record(['processEnd', e.execution.task.name, e.exitCode]));
  oculus.tasks.onDidEndTask((e) => record(['end', e.execution.task.name]));
  let executed;
  oculus.commands.registerCommand('notes.do', async (op, name) => {
    if (op === 'events') {
      if (name !== undefined) await waitFor(name);
      return { value: events };
    }
    if (op === 'fetch') return { value: (await oculus.tasks.fetchTasks()).map((t) => t.name) };
    if (op === 'execute') {
      const tasks = await oculus.tasks.fetchTasks();
      executed = await oculus.tasks.executeTask(tasks.find((t) => t.name === name));
      return { value: true };
    }
    if (op === 'terminate') { executed.terminate(); return { value: true }; }
    return { value: null };
  });
}
`;

const KEYS =
    'activation: [onTab]\ncontributes:\n  commands:\n    - command: notes.do\n      title: Do\n  taskDefinitions:\n    - type: notes.task\n      required: [target]\n      properties:\n        target:\n          type: string\n';

/** A command of a repository that a file or a search found, for the case of two with one name. */
const FOUND: ProjectCommand = {
    name: 'notes: npm: build',
    run: 'npm run build',
    cwd: '.',
    depends_on: [],
    source: 'found'
};

describe('the tasks of an app over a private tmux server', { tags: ['slow'] }, () => {
    const { build } = tmuxTerminals('oculus-apptask-');

    function setup() {
        // The list changes when a terminal starts or ends; the end of a task's line is read by the
        // terminals' own poll, which `build` runs every 20 ms while a task runs.
        const { terminals, env, until } = build({ poll: 20 });
        const w = world(
            { notes: { host: HOST, keys: KEYS } },
            {},
            { real: true, terminals: env, roots: { r: { 'a.txt': 'x\n' } } }
        );
        const repo = realpathSync(w.fixture.roots[0].dir);
        mkdirSync(join(repo, '.oculus'), { recursive: true });
        const tasks = w.hosts.tools.tasks;
        const listed = async (): Promise<CommandsAnswer> =>
            tasks.commands(repo, { commands: [], findings: [] });
        const call = async (op: string, ...args: unknown[]): Promise<unknown> => {
            const done = await runDeclared(w.hosts.shell, NOTES, 'notes.do', [op, ...args]);
            return done.ok ? (done.value as { value: unknown }).value : done.word;
        };
        const find = async (name: string): Promise<ProjectCommand> => {
            const one = (await listed()).commands.find((command) => command.name === name);
            if (one === undefined) throw new Error(`no command ${name}`);
            return one;
        };
        const run = async (name: string) => {
            const started = await tasks.run(await find(name), repo, { cols: 120, rows: 30 });
            if ('refused' in started) throw new Error(`refused ${started.refused}`);
            return started.terminal;
        };
        const exitOf = (id: string): number | null =>
            env.list().find((one) => one.id === id)?.exit ?? null;
        const outputOf = async (id: string): Promise<string> =>
            env.streams.has(id) ? env.streams.replay(id).toString('utf8') : await env.output(id);
        return {
            w,
            env,
            terminals,
            repo,
            tasks,
            listed,
            call,
            until,
            find,
            run,
            exitOf,
            outputOf,
            close: async () => {
                await w.hosts.close();
                terminals.close();
            }
        };
    }

    it('lists the tasks of a provider as source and name, the first default of a group as the default build, and a task named like a found command with the app title in parentheses', async () => {
        const s = setup();
        const given = await s.tasks.commands(s.repo, { commands: [FOUND], findings: [] });
        const summary = given.commands.map((one) => [one.name, one.default ?? null, one.source]);
        await s.close();
        expect(summary).toEqual([
            ['notes: npm: build', null, 'found'],
            ['notes: build', 'build', 'app'],
            ['notes: proc', null, 'app'],
            ['notes: custom', null, 'app'],
            ['notes: slow', null, 'app'],
            ['notes: npm: build (notes)', null, 'app']
        ]);
    }, 60000);

    it('runs a shell execution and a process execution in a terminal named after the command, and a custom execution in a stream terminal, and tells the host each exit code', async () => {
        const s = setup();
        const shell = await s.run('notes: build');
        const proc = await s.run('notes: proc');
        const custom = await s.run('notes: custom');
        await s.until(() => s.exitOf(shell.id) !== null && s.exitOf(proc.id) !== null);
        await s.until(() => s.exitOf(custom.id) !== null);
        const outputs = [
            await s.outputOf(shell.id),
            await s.outputOf(proc.id),
            await s.outputOf(custom.id)
        ];
        await s.call('events', 9);
        const events = (await s.call('events')) as unknown[][];
        await s.close();
        expect([
            [shell.name, proc.name, custom.name],
            [shell.app, proc.app, custom.app],
            [s.exitOf(shell.id), s.exitOf(proc.id), s.exitOf(custom.id)],
            outputs.map((one) => (/hi|proc|custom out/.exec(one) ?? [''])[0]),
            events
                .filter((one) => one[0] === 'processEnd')
                .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
        ]).toEqual([
            ['notes: build', 'notes: proc', 'notes: custom'],
            [NOTES, NOTES, NOTES],
            [0, 0, 3],
            ['hi', 'proc', 'custom out'],
            [
                ['processEnd', 'build', 0],
                ['processEnd', 'custom', 3],
                ['processEnd', 'proc', 0]
            ]
        ]);
    }, 90000);

    it('runs a task again in the terminal that ended, after the host stopped and was started by the listing', async () => {
        const s = setup();
        const first = await s.run('notes: build');
        await s.until(() => s.exitOf(first.id) !== null);
        await s.w.hosts.stop(NOTES);
        const again = await s.tasks.run(
            await s.find('notes: build'),
            s.repo,
            { cols: 120, rows: 30 },
            first
        );
        await s.call('events', 'processEnd');
        const events = (await s.call('events')) as unknown[][];
        const ids = 'refused' in again ? [] : [again.terminal.id];
        await s.close();
        expect([ids, events]).toEqual([
            [first.id],
            [
                ['start', 'build'],
                ['processEnd', 'build', 0],
                ['end', 'build']
            ]
        ]);
    }, 90000);

    it('resolves a typed commands.yml entry by the app that defines its type, and drops one whose type no app defines or whose required property is missing, each with a finding', async () => {
        const s = setup();
        writeFileSync(
            join(s.repo, '.oculus', 'commands.yml'),
            'commands:\n  - { name: typed, type: notes.task, target: alpha }\n  - { name: nobody, type: other.task }\n  - { name: bare, type: notes.task }\n'
        );
        const base = readCommandsFile(s.repo, new Set());
        const answer = await s.tasks.commands(s.repo, base);
        const typed = answer.commands.find((one) => one.name === 'typed');
        const started =
            typed === undefined
                ? undefined
                : await s.tasks.run(typed, s.repo, { cols: 120, rows: 30 });
        if (started !== undefined && 'terminal' in started) {
            await s.until(() => s.exitOf(started.terminal.id) !== null);
        }
        const out =
            started !== undefined && 'terminal' in started
                ? await s.outputOf(started.terminal.id)
                : '';
        await s.close();
        expect([
            answer.commands
                .filter((one) => one.source !== 'app')
                .map((one) => [one.name, one.task?.group]),
            answer.findings.map((one) => one.field),
            out.includes('resolved-alpha')
        ]).toEqual([[['typed', 'test']], ['commands[nobody].type', 'commands[bare].target'], true]);
    }, 90000);

    it('runs a task of the host with executeTask, which the host ends with terminate', async () => {
        const s = setup();
        await s.call('execute', 'slow');
        await s.call('events', 1);
        const mine = () =>
            s.env.list().filter((one) => one.app === NOTES && one.name === 'notes: slow');
        await s.until(() => mine().length === 1);
        await s.call('terminate');
        await s.call('events', 'end');
        const events = (await s.call('events')) as unknown[][];
        await s.close();
        expect(events.map((one) => one[0])).toEqual(
            ['start', 'processEnd', 'end'].filter((one) => events.some((e) => e[0] === one))
        );
    }, 90000);

    it('fetches the tasks of its providers for the host', async () => {
        const s = setup();
        const names = await s.call('fetch');
        await s.close();
        expect(names).toEqual(['build', 'proc', 'custom', 'slow', 'npm: build']);
    }, 60000);
});
