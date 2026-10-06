// Layer 2, route tests. POST /api/terminal update-task, LaTeX and interactive chat cases. Chat
// checks cover argv and private index lifecycle.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag
// holding a `run` that records the argv and answers the list itself. The only real path any case
// touches is the temporary directory: for the task cases, to hold an engine directory whose
// local.yml the route reads, made once per file from the fixture's test.beforeAll.
//
// Every case runs in npm test.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { taskTmux } from '../../server/machine/commands/commands-fixture.ts';
import { chatIndexPath } from '../../../src/lib/server/machine/pty/start/chat.ts';
import {
    SERVER,
    TOKEN,
    HERE,
    makeTaskConfig,
    type TaskConfig,
    BASE_CHAT_CONFIG,
    CHAT_CONFIG,
    CHAT_CATALOG,
    tmux,
    joinedCommands,
    lineOf,
    request,
    command,
    answer,
    configOf
} from './terminal-fixture.ts';

/** This file's scratch folder and what the fixture planted in it, made before its first case. */
let task: TaskConfig;

test.beforeAll(() => {
    task = makeTaskConfig();
});

test.afterAll(() => {
    SERVER.close();
});

describe('POST /api/terminal, the task action', () => {
    /** The command the task action built, from the tmux session it was asked to create. */
    async function taskArgv(
        kind: string,
        config?: Record<string, unknown>
    ): Promise<{ started: string[]; name: string }> {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind, cols: 92, rows: 27 }),
            TOKEN,
            config === undefined
                ? { engine: task.taskEngine, run: driver.run, configFor: configOf(task.taskEngine) }
                : { engine: task.taskEngine, run: driver.run, configFor: () => config }
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { name: string };
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        return { started, name: terminal.name };
    }

    it('starts every accepted task as an interactive session, with no skip and no print-mode flags', async () => {
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            const { started, name } = await taskArgv(kind);
            expect(name).toBe(`task ${kind}`);
            expect(started[started.indexOf('-c') + 1]).toBe(HERE);
            expect(started[started.indexOf('-x') + 1]).toBe('92');
            expect(started[started.indexOf('-y') + 1]).toBe('27');
            expect(lineOf(started)).toEqual([
                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
            ]);
        }
    });
});

describe('POST /api/terminal, the latex action', () => {
    /** A project of the synthetic chat hub whose manuscript holds main files and one include. */
    const LATEX_PROJECT = 'projects/active/alpha';
    test.beforeAll(() => {
        mkdirSync(join(task.chatHub, LATEX_PROJECT, 'manuscript'), { recursive: true });
        writeFileSync(
            join(task.chatHub, LATEX_PROJECT, 'manuscript', 'main.tex'),
            '\\documentclass{article}\n'
        );
        writeFileSync(
            join(task.chatHub, LATEX_PROJECT, 'manuscript', 'intro.tex'),
            '\\section{Intro}\n'
        );
        writeFileSync(
            join(task.chatHub, LATEX_PROJECT, 'manuscript', '-v.tex'),
            '\\documentclass{article}\n'
        );
    });

    /** The name the terminals list shows, read through the catalog rather than typed here. */
    function latexName(step: string, id: string, main: string): string {
        return CHAT_CATALOG['server.latex.name']
            .replace('{0}', step)
            .replace('{1}', id)
            .replace('{2}', main);
    }

    function latexOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
        return {
            engine: engineDir(),
            run: driver.run,
            hubFor: () => task.chatHub,
            configFor: () => BASE_CHAT_CONFIG,
            projectFor: (id) =>
                id === 'alpha' ? { title: 'Alpha Study', folder: LATEX_PROJECT } : null
        };
    }

    /** The body of a latex action over the synthetic project's main file. */
    function latexBody(step: string): Record<string, unknown> {
        return { action: 'latex', id: 'alpha', main: 'main.tex', step, cols: 88, rows: 25 };
    }

    it('builds one main file with latexmk in the manuscript folder', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request(latexBody('build')),
            TOKEN,
            latexOptions(driver)
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { id: string; name: string };
        const name = latexName('build', 'alpha', 'main.tex');
        expect(terminal.name).toBe(name);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        const folder = join(task.chatHub, LATEX_PROJECT, 'manuscript');
        expect(started[started.indexOf('-c') + 1]).toBe(folder);
        expect(started[started.indexOf('-x') + 1]).toBe('88');
        expect(started[started.indexOf('-y') + 1]).toBe('25');
        expect(lineOf(started)).toEqual([
            "latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'"
        ]);
        // The build is a task terminal whose pane stays after latexmk ends, and its task mark and
        // name are set by the invocation that creates the session.
        const session = `oculus-${terminal.id}`;
        const [keep, mark, label] = joinedCommands(started).slice(1);
        expect(keep).toEqual(['set-option', '-t', session, 'remain-on-exit', 'on']);
        expect(mark.slice(0, 4)).toEqual(['set-option', '-t', session, '@oculus_task']);
        expect(JSON.parse(mark[4])).toEqual({ repo: folder, name, source: 'latex' });
        expect(label).toEqual(['set-option', '-t', session, '@oculus_name', name]);
        expect(driver.calls.filter((args) => args[0] === 'set-option')).toEqual([]);
    });

    it('builds again in the terminal it kept, and cleans in another', async () => {
        const driver = taskTmux(HERE);
        const post = async (step: string): Promise<{ id: string }> => {
            const response = await handleTerminal(
                request(latexBody(step)),
                TOKEN,
                latexOptions(driver)
            );
            expect(response.status).toBe(200);
            return (await answer(response)).terminal as { id: string };
        };
        const first = await post('build');
        const session = `oculus-${first.id}`;
        // A build whose latexmk still runs answers that terminal and starts nothing.
        expect((await post('build')).id).toBe(first.id);
        expect(driver.starts()).toHaveLength(1);
        expect(driver.respawns()).toEqual([]);
        driver.end(session, 0);
        expect((await post('build')).id).toBe(first.id);
        expect(driver.starts()).toHaveLength(1);
        expect(driver.respawns()).toEqual([
            [
                'respawn-pane',
                '-k',
                '-t',
                session,
                "latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'"
            ]
        ]);
        driver.end(session, 0);
        expect((await post('clean')).id).not.toBe(first.id);
        expect(driver.starts()).toHaveLength(2);
        // The kept build is a task terminal, so Run Again on it respawns its line.
        driver.end(session, 1);
        const again = await handleTerminal(
            request({ action: 'rerun', id: first.id }),
            TOKEN,
            latexOptions(driver)
        );
        expect((await answer(again)).ok).toBe(true);
        expect(driver.respawns()).toHaveLength(2);
    });
});

describe('POST /api/terminal, a refusal', () => {
    const ID = 'a1b2c3-claude';

    /** A tmux that holds no session and fails a resize the way tmux words a missing session. */
    const gone: NonNullable<TerminalOptions['run']> = (args) =>
        args[0] === 'resize-window'
            ? Promise.reject(new Error(`can't find session: oculus-${ID}`))
            : Promise.resolve('');

    const REFUSALS: { title: string; body: unknown; word: string }[] = [
        { title: 'a body that is no map', body: [], word: 'not-an-action' },
        { title: 'an action that is none', body: { action: 'nonsense' }, word: 'not-an-action' },
        {
            title: 'an input to a session oculus did not start',
            body: { action: 'steer', id: 'scratch', text: 'x' },
            word: 'not-ours'
        },
        {
            title: 'a fork of an id that is no session',
            body: { action: 'fork', tool: 'claude', id: 'nope' },
            word: 'not-a-session'
        },
        {
            title: 'a start with a size that is no number',
            body: { action: 'start', kind: 'claude', cwd: HERE, cols: 'wide', rows: 24 },
            word: 'bad-terminal'
        },
        {
            title: 'a rename of a terminal the list does not hold',
            body: { action: 'rename', id: ID, title: 'x' },
            word: 'terminal-ended'
        },
        {
            title: 'a resize of a terminal tmux no longer has',
            body: { action: 'resize', id: ID, cols: 80, rows: 24 },
            word: 'terminal-ended'
        },
        {
            title: 'a start whose session was not listed afterwards',
            body: { action: 'start', kind: 'claude', cwd: HERE, cols: 80, rows: 24 },
            word: 'terminal-not-started'
        },
        {
            title: 'a build in a folder of a root nothing serves',
            body: {
                action: 'latex',
                root: 'nowhere',
                path: '',
                main: 'main.tex',
                step: 'build',
                cols: 88,
                rows: 25
            },
            word: 'outside'
        }
    ];

    it.each(REFUSALS)('answers $title as the word $word', async ({ body, word }) => {
        const response = await handleTerminal(request(body), TOKEN, {
            engine: task.engine,
            run: gone,
            configFor: configOf(task.engine)
        });
        expect(response.status).toBe(400);
        expect(await answer(response)).toEqual({ error: word });
    });
});

describe('POST /api/terminal, the chat action', () => {
    function chatOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
        return {
            engine: task.chatEngine,
            run: driver.run,
            projectFor: (id) =>
                id === 'alpha' ? { title: 'Alpha Study', folder: 'projects/active/alpha' } : null,
            configFor: () => CHAT_CONFIG
        };
    }

    it('starts a focused interactive Claude terminal and writes its private index first', async () => {
        const driver = tmux();
        const routed = chatOptions(driver);
        const run = routed.run;
        let indexAtStart = false;
        routed.run = async (args, options) => {
            if (args[0] === 'new-session') {
                const id = (args[3] ?? '').replace(/^oculus-/, '');
                indexAtStart = existsSync(chatIndexPath(join(task.chatState, 'sessions.json'), id));
            }
            return run === undefined ? '' : run(args, options);
        };
        const response = await handleTerminal(
            request({ action: 'chat', id: 'alpha', cols: 101, rows: 31 }),
            TOKEN,
            routed
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { id: string; name: string };
        expect(terminal.name).toBe(
            CHAT_CATALOG['server.chat.chat_name_focus'].replace('{0}', 'Alpha Study')
        );

        const index = chatIndexPath(join(task.chatState, 'sessions.json'), terminal.id);
        expect(index.startsWith(task.chatState + sep)).toBe(true);
        expect(readFileSync(index, 'utf8')).toContain('## projects/active/alpha');
        expect(statSync(index).mode & 0o777).toBe(0o600);
        const system = [
            CHAT_CATALOG['server.chat.chat_instruction']
                .replace('{0}', task.chatHub)
                .replace('{1}', task.chatProject),
            CHAT_CATALOG['server.chat.chat_focus_note']
                .replace('{0}', 'alpha')
                .replace('{1}', 'Alpha Study')
                .replace('{2}', task.chatProject),
            CHAT_CATALOG['server.chat.chat_index_note'].replace('{0}', index)
        ].join('\n\n');
        expect(system).toContain(`The hub root is \`${task.chatHub}\``);
        expect(system).toContain(`Your working directory is \`${task.chatProject}\``);
        expect(system).not.toMatch(/\{[012]\}|CONTEXT\.md|NEXT\.md|METHOD_NOTES|RELATED_WORK/);
        const expected = command([
            '/opt/Claude CLI/claude',
            '--append-system-prompt',
            system,
            '--disallowedTools',
            'Bash,Edit,Write,WebFetch,WebSearch',
            '--model',
            'claude-opus-4-1',
            CHAT_CATALOG['server.chat.seed_focus'].replace('{0}', 'Alpha Study')
        ]);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.indexOf('-c') + 1]).toBe(task.chatProject);
        expect(started[started.indexOf('-x') + 1]).toBe('101');
        expect(started[started.indexOf('-y') + 1]).toBe('31');
        expect(lineOf(started)).toEqual([expected]);
        expect(lineOf(started)[0]).not.toContain("'-p'");
        expect(indexAtStart).toBe(true);
    });
});
