// Layer 4, server test. The run of a project command through POST /api/terminal: the approval
// asked before anything starts, the one terminal a chain runs in, and the Rerun and Restart of the
// task terminal it left. handleTerminal is called with a tmux double that keeps every argument
// vector and runs nothing, a scratch repository, and a scratch home.
//
// What this does NOT cover: a real tmux running the line (tests/server/machine/pty/task.test.ts),
// and the page asking the reader (tests/state/sessions/terminal/commands.test.ts).

import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it, test } from '../../../fixtures/scratch.ts';
import { handleTerminal } from '../../../../src/lib/server/machine/pty/routes.ts';
import {
    approveTexts,
    chainLines,
    chainText,
    defaultApprovalsPath
} from '../../../../src/lib/server/machine/approvals/approvals.ts';
import { resolveChain } from '../../../../src/lib/server/machine/commands/resolve.ts';
import type { CommandSource } from '../../../../src/lib/data/model/index.ts';
import { listCommands } from '../../../../src/lib/server/machine/commands/list.ts';
import {
    BASE_CHAT_CONFIG,
    HERE,
    SERVER,
    TOKEN,
    answer,
    makeTaskConfig,
    options,
    request,
    type TaskConfig
} from '../../../routes/sessions/terminal-fixture.ts';
import {
    commandsYml,
    enterHome,
    leaveHome,
    plant,
    plantRepo,
    taskTmux
} from './commands-fixture.ts';

let task: TaskConfig;

test.beforeAll(() => {
    task = makeTaskConfig();
});

test.afterAll(() => {
    SERVER.close();
});

let home = '';
let repo = '';
let other = '';
let tmux = taskTmux(HERE);

beforeEach(() => {
    home = enterHome();
    repo = plantRepo({}, ['sub']);
    other = plantRepo({}, ['sub']);
    plant(
        repo,
        '.oculus/commands.yml',
        commandsYml(
            '  - { name: build, run: make }\n' +
                '  - { name: test, run: make test, cwd: sub, depends_on: [build], default: test }\n'
        )
    );
    tmux = taskTmux(HERE);
});

afterEach(() => {
    leaveHome();
});

/** The options a command run is handed: the double, the scratch repository as the one root. */
function mine() {
    return options(task.engine, {
        run: tmux.run,
        rootsFor: () => [repo, other],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => BASE_CHAT_CONFIG
    });
}

function post(body: Record<string, unknown>) {
    return handleTerminal(request(body), TOKEN, mine());
}

const RUN = { action: 'command', source: 'file', cols: 80, rows: 24 };

/** The line a recorded new-session runs. */
function lineOf(start: string[]): string {
    return start[start.indexOf('--') + 1];
}

/** The `-e NAME=value` pairs of a recorded new-session, as an environment. */
function envOf(start: string[]): Record<string, string> {
    const env: Record<string, string> = {};
    for (let at = 0; at < start.indexOf('--'); at += 1) {
        if (start[at] !== '-e') continue;
        const pair = start[(at += 1)];
        env[pair.slice(0, pair.indexOf('='))] = pair.slice(pair.indexOf('=') + 1);
    }
    return env;
}

/** The token the mark of the first pane the double started carries. */
function tokenOf(): string {
    const pane = [...tmux.panes.values()][0];
    return (JSON.parse(pane.options['@oculus_task']) as { token: string }).token;
}

/** The form a placeholder's variable takes in a line. */
const ref = (n: number) => `\${OCULUS_ARG_${n}+"$OCULUS_ARG_${n}"}`;

/** Approve the chain the press of a command would run, as the dialog's Approve does. */
function approveChainOf(name: string, source: CommandSource = 'file', where = repo): void {
    const resolved = resolveChain(listCommands(where).commands, name, source);
    if (!('chain' in resolved)) throw new Error(resolved.error);
    const text = chainText(where, chainLines(where, resolved.chain));
    expect(approveTexts(defaultApprovalsPath(), [text])).toEqual({ ok: true });
}

function approveAll(...names: string[]): void {
    for (const name of names) approveChainOf(name);
}

const BUILD_THEN_TEST = [
    { folder: '.', run: 'make' },
    { folder: 'sub', run: 'make test' }
];

describe('the approval before a run', () => {
    it('asks for the whole chain, one line for each command in run order, and starts nothing', async () => {
        const response = await post({ ...RUN, repo, name: 'test' });
        expect(response.status).toBe(200);
        expect(await answer(response)).toEqual({ approve: BUILD_THEN_TEST });
        expect(tmux.calls).toEqual([]);
    });

    it('runs once the chain is approved, and does not ask again for the unchanged chain', async () => {
        approveAll('test');
        for (let press = 0; press < 2; press += 1) {
            const body = await answer(await post({ ...RUN, repo, name: 'test' }));
            expect(body.ok).toBe(true);
        }
        expect(tmux.starts()).toHaveLength(2);
    });

    it('asks again when the command that was approved alone gains a dependency', async () => {
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: build, run: make }\n  - { name: test, run: make test, cwd: sub }\n'
            )
        );
        approveAll('build', 'test');
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: build, run: make }\n' +
                    '  - { name: test, run: make test, cwd: sub, depends_on: [build] }\n'
            )
        );
        expect(await answer(await post({ ...RUN, repo, name: 'test' }))).toEqual({
            approve: BUILD_THEN_TEST
        });
        expect(tmux.starts()).toEqual([]);
    });

    it('runs a command saved through the form with no approval', async () => {
        const saved = JSON.stringify({ [repo]: [{ name: 'lint', run: 'npm run lint' }] });
        plant(home, '.oculus/commands.json', saved);
        const response = await post({ ...RUN, source: 'saved', repo, name: 'lint' });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.starts()).toHaveLength(1);
    });

    it('asks for a found command', async () => {
        plant(repo, 'package.json', JSON.stringify({ scripts: { dev: 'vite' } }));
        expect(
            await answer(await post({ ...RUN, source: 'found', repo, name: 'npm: dev' }))
        ).toEqual({ approve: [{ folder: '.', run: `npm run 'dev'` }] });
    });
});

describe('the source a press names', () => {
    beforeEach(() => {
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml('  - { name: build, run: make from-file }\n')
        );
        plant(
            home,
            '.oculus/commands.json',
            JSON.stringify({ [repo]: [{ name: 'build', run: 'make from-form' }] })
        );
    });

    it('is required: a press without one is refused with the sentence for it and starts nothing', async () => {
        const response = await post({ action: 'command', cols: 80, rows: 24, repo, name: 'build' });
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe(
            'A press names the source of the command it runs, which is file, saved or found'
        );
        const odd = await post({ ...RUN, source: 'elsewhere', repo, name: 'build' });
        expect(odd.status).toBe(400);
        expect(tmux.calls).toEqual([]);
    });

    it('runs the saved command of a name the file also holds, and asks for the file one', async () => {
        const saved = await answer(await post({ ...RUN, source: 'saved', repo, name: 'build' }));
        expect(saved.ok).toBe(true);
        expect(lineOf(tmux.starts()[0])).toBe(
            `cd '${repo}' && printf '%s\\n' '${tokenOf()} build' && make from-form`
        );
        expect(await answer(await post({ ...RUN, source: 'file', repo, name: 'build' }))).toEqual({
            approve: [{ folder: '.', run: 'make from-file' }]
        });
        expect(tmux.starts()).toHaveLength(1);
    });

    it('refuses a source that holds no command of that name', async () => {
        const response = await post({ ...RUN, source: 'found', repo, name: 'build' });
        expect(response.status).toBe(400);
        expect(((await answer(response)).error as string).includes('not a command')).toBe(true);
        expect(tmux.calls).toEqual([]);
    });

    it('records the source, the token and the chain, each command with its folder, in the mark of the task terminal', async () => {
        await post({ ...RUN, source: 'saved', repo, name: 'build' });
        const pane = [...tmux.panes.values()][0];
        expect(tokenOf()).toMatch(/^[0-9a-f]{12}$/);
        expect(JSON.parse(pane.options['@oculus_task'])).toEqual({
            repo,
            name: 'build',
            source: 'saved',
            token: tokenOf(),
            chain: [{ name: 'build', cwd: repo }]
        });
    });

    it('mints a new token at each start', async () => {
        await post({ ...RUN, source: 'saved', repo, name: 'build' });
        await post({ ...RUN, source: 'saved', repo, name: 'build' });
        const tokens = [...tmux.panes.values()].map(
            (pane) => (JSON.parse(pane.options['@oculus_task']) as { token: string }).token
        );
        expect(tokens).toHaveLength(2);
        expect(tokens[0]).not.toBe(tokens[1]);
    });
});

describe('the terminal a run starts', () => {
    it('is one terminal named after the command, running the whole chain', async () => {
        approveAll('build', 'test');
        const body = await answer(await post({ ...RUN, repo, name: 'test' }));
        const terminal = body.terminal as { name: string; task: boolean; exit: number | null };
        expect(terminal.name).toBe('test');
        expect(terminal.task).toBe(true);
        expect(terminal.exit).toBe(null);
        const starts = tmux.starts();
        expect(starts).toHaveLength(1);
        const start = starts[0];
        const token = tokenOf();
        expect(lineOf(start)).toBe(
            `cd '${repo}' && printf '%s\\n' '${token} build' && make && cd '${repo}/sub' && printf '%s\\n' '${token} test' && make test`
        );
        expect(start[start.indexOf('-c') + 1]).toBe(repo);
    });

    it('records a chain in run order with the folder of each command', async () => {
        approveAll('build', 'test');
        await post({ ...RUN, repo, name: 'test' });
        const pane = [...tmux.panes.values()][0];
        expect(JSON.parse(pane.options['@oculus_task'])).toEqual({
            repo,
            name: 'test',
            source: 'file',
            token: tokenOf(),
            chain: [
                { name: 'build', cwd: repo },
                { name: 'test', cwd: `${repo}/sub` }
            ]
        });
    });

    it('sets the values of the placeholders in the environment and refuses a missing value', async () => {
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml('  - { name: show, run: "cat ${file}" }\n')
        );
        approveAll('show');
        const context = { file: `${repo}/a b.tex`, line: 7 };
        const missing = await post({ ...RUN, repo, name: 'show', context: {} });
        expect(missing.status).toBe(400);
        expect(((await answer(missing)).error as string).includes('${file}')).toBe(true);
        expect(tmux.calls).toEqual([]);
        await post({ ...RUN, repo, name: 'show', context });
        const start = tmux.starts()[0];
        expect(lineOf(start)).toBe(
            `cd '${repo}' && printf '%s\\n' '${tokenOf()} show' && cat ${ref(1)}`
        );
        expect(envOf(start)).toEqual({ OCULUS_ARG_1: `${repo}/a b.tex` });
    });

    it('refuses a repository that is relative, missing or under no root, and starts nothing', async () => {
        const outside = plantRepo();
        for (const bad of ['relative/dir', `${repo}/nowhere`, outside, 5, undefined]) {
            const response = await post({ ...RUN, repo: bad, name: 'build' });
            expect(response.status).toBe(400);
        }
        expect(tmux.calls).toEqual([]);
    });
});

/** The pane the recording tmux holds for a terminal id. */
function paneOf(id: string) {
    const pane = tmux.panes.get(`oculus-${id}`);
    if (pane === undefined) throw new Error(`the recording tmux holds no pane for ${id}`);
    return pane;
}

/** Run `build` once and answer its terminal's id and session. */
async function started(): Promise<{ id: string; session: string }> {
    approveAll('build');
    const body = await answer(await post({ ...RUN, repo, name: 'build' }));
    const terminal = body.terminal as { id: string };
    return { id: terminal.id, session: `oculus-${terminal.id}` };
}

describe('Capture', () => {
    it('answers all the text of a listed terminal pane', async () => {
        const { id, session } = await started();
        paneOf(id).output = 'src/a.c:3: error: x\n';
        const body = await answer(await post({ action: 'capture', id }));
        expect(body).toEqual({ ok: true, id, output: 'src/a.c:3: error: x\n' });
        expect(tmux.calls.filter((args) => args[0] === 'capture-pane')).toEqual([
            ['capture-pane', '-p', '-J', '-S', '-', '-t', session]
        ]);
    });

    it('refuses a name oculus does not list, with the sentence for it, and reads no pane', async () => {
        await started();
        for (const id of ['../x', 'abcdef-shell', 5, undefined]) {
            const response = await post({ action: 'capture', id });
            expect(response.status).toBe(400);
            expect(
                ((await answer(response)).error as string).endsWith(
                    'is not a terminal oculus lists, so its output is not read'
                )
            ).toBe(true);
        }
        expect(tmux.calls.filter((args) => args[0] === 'capture-pane')).toEqual([]);
    });

    it('makes no tmux call at all for a name that is no terminal id', async () => {
        const response = await post({ action: 'capture', id: '../x' });
        expect(response.status).toBe(400);
        expect(tmux.calls).toEqual([]);
    });
});

describe('Rerun', () => {
    it('is refused while the line runs', async () => {
        const { id } = await started();
        const response = await post({ action: 'rerun', id });
        expect(response.status).toBe(400);
        expect(tmux.respawns()).toEqual([]);
    });

    it('respawns the same line in the same terminal after it ended', async () => {
        const { id, session } = await started();
        tmux.end(session, 1);
        const response = await post({ action: 'rerun', id });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.respawns()).toEqual([['respawn-pane', '-k', '-t', session]]);
        expect(tmux.panes.get(session)?.exit).toBe(null);
    });

    it('is refused for a terminal that is not a task terminal and for one not listed', async () => {
        const { id } = await started();
        paneOf(id).options['@oculus_task'] = '';
        expect((await post({ action: 'rerun', id })).status).toBe(400);
        expect((await post({ action: 'rerun', id: 'abcdef-shell' })).status).toBe(400);
        expect((await post({ action: 'rerun', id: '../x' })).status).toBe(400);
        expect(tmux.respawns()).toEqual([]);
    });
});

describe('Restart', () => {
    it('answers that a confirmation naming the process is needed while the line runs', async () => {
        const { id } = await started();
        paneOf(id).command = 'make';
        const response = await post({ action: 'restart', id });
        expect(await answer(response)).toEqual({ confirm: 'make' });
        expect(tmux.respawns()).toEqual([]);
    });

    it('respawns the line once the confirmation was given', async () => {
        const { id, session } = await started();
        const response = await post({ action: 'restart', id, confirmed: true });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.respawns()).toEqual([['respawn-pane', '-k', '-t', session]]);
    });

    it('behaves as Rerun after the line ended, with no confirmation', async () => {
        const { id, session } = await started();
        tmux.end(session, 0);
        const response = await post({ action: 'restart', id });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.respawns()).toHaveLength(1);
    });
});
