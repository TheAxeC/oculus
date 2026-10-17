// Layer 4, server test. The run of a project command through POST /api/terminal: the one terminal a
// chain runs in, and the Rerun and Restart of the task terminal it left. handleTerminal is called
// with a tmux double that keeps every argument vector and runs nothing, a scratch repository, and a
// scratch home.

import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it, test } from '../../../../fixtures/scratch.ts';
import { handleTerminal } from '../../../../../src/lib/server/machine/pty/routes.ts';
import {
    approveTexts,
    chainLines,
    chainText,
    defaultApprovalsPath
} from '../../../../../src/lib/server/machine/approvals/approvals.ts';
import { resolveChain } from '../../../../../src/lib/server/machine/runs/commands/resolve.ts';
import type { CommandSource } from '../../../../../src/lib/data/model/index.ts';
import { listCommands } from '../../../../../src/lib/server/machine/runs/commands/list.ts';
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
} from '../../../../routes/sessions/terminal-fixture.ts';
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

let repo = '';
let other = '';
let tmux = taskTmux(HERE);

beforeEach(() => {
    enterHome();
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

/** The token the mark of the first pane the double started carries. */
function tokenOf(): string {
    const pane = [...tmux.panes.values()][0];
    return (JSON.parse(pane.options['@oculus_task']) as { token: string }).token;
}

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
            `cd '${repo}' && printf '\\033[8m%s\\033[28m\\n' '${token} build' && make && cd '${repo}/sub' && printf '\\033[8m%s\\033[28m\\n' '${token} test' && make test`
        );
        expect(start[start.indexOf('-c') + 1]).toBe(repo);
    });
});

/** Run `build` once and answer its terminal's id and session. */
async function started(): Promise<{ id: string; session: string }> {
    approveAll('build');
    const body = await answer(await post({ ...RUN, repo, name: 'build' }));
    const terminal = body.terminal as { id: string };
    return { id: terminal.id, session: `oculus-${terminal.id}` };
}

describe('Rerun', () => {
    it('respawns the same line in the same terminal after it ended', async () => {
        const { id, session } = await started();
        tmux.end(session, 1);
        const response = await post({ action: 'rerun', id });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.respawns()).toEqual([['respawn-pane', '-k', '-t', session]]);
        expect(tmux.panes.get(session)?.exit).toBe(null);
    });
});

describe('Restart', () => {
    it('respawns the line once the confirmation was given', async () => {
        const { id, session } = await started();
        const response = await post({ action: 'restart', id, confirmed: true });
        expect((await answer(response)).ok).toBe(true);
        expect(tmux.respawns()).toEqual([['respawn-pane', '-k', '-t', session]]);
    });
});

describe('a command action that names no command', () => {
    it.each([
        { title: 'an empty name', name: '' },
        { title: 'a name that is no text', name: 3 },
        { title: 'no name', name: undefined }
    ])('answers $title as bad-terminal, with no name to say', async ({ name }) => {
        const response = await post({ ...RUN, repo, name });
        expect(response.status).toBe(400);
        expect(await answer(response)).toEqual({ error: 'bad-terminal' });
    });
});
