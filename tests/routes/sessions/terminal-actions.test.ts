// Layer 2, server tests. POST /api/terminal update-task, LaTeX and interactive chat cases. Chat
// checks cover argv, absolute prompt paths, numbering and private index lifecycle.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag holding
// a `run` that records the argv and answers the list itself. The only real path any case touches is
// the temporary directory: for the task cases, to hold an engine directory whose local.yml the
// route reads, made once per file from the fixture's test.beforeAll.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { chatIndexPath } from '../../../src/lib/server/machine/pty/chat.ts';
import { taskSkipPermissions } from '../../../src/lib/data/helpers/tasks.ts';
import {
    HERE_FILE,
    SERVER,
    TOKEN,
    HERE,
    makeTaskConfig,
    type TaskConfig,
    engineWith,
    BASE_CHAT_CONFIG,
    CHAT_CONFIG,
    CHAT_CATALOG,
    tmux,
    request,
    command,
    filled,
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
            expect(started[started.length - 1]).toBe(
                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
            );
        }
    });

    it('adds the skip flag and nothing else when tasks.skip_permissions is on', async () => {
        const { started, name } = await taskArgv('litwatch', { tasks: { skip_permissions: true } });
        expect(name).toBe('task litwatch');
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        expect(started[started.length - 1]).toBe(
            `'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch'`
        );
    });

    it('reads a tasks.skip_permissions of any other shape, and a missing one, as off', async () => {
        for (const tasks of [
            { skip_permissions: 'true' },
            { skip_permissions: 1 },
            { skip_permissions: null },
            {}
        ]) {
            const { started } = await taskArgv('scout', { tasks });
            expect(started[started.length - 1]).toBe(
                `'/opt/Claude CLI/claude' '/research-cockpit scout'`
            );
        }
        // The key under its retired name is not read, so a task started over it runs with prompts
        // on.
        const retired = await taskArgv('scout', { chat: { skip_permissions: true } });
        expect(retired.started[retired.started.length - 1]).toBe(
            `'/opt/Claude CLI/claude' '/research-cockpit scout'`
        );
        // A configuration with no `tasks:` block at all, which is what the engine of this suite
        // holds.
        const bare = await taskArgv('scout', {});
        expect(bare.started[bare.started.length - 1]).toBe(
            `'/opt/Claude CLI/claude' '/research-cockpit scout'`
        );
    });

    it('follows a setting the reader changed while the server runs, with no restart', async () => {
        // The route's own reader, which reads the engine's config folder on every request rather
        // than a copy the context took at start: a reader who turns the key off in behavior.yml
        // sees the tray stop asking, and the next task must be started the same way.
        const engine = engineWith(
            task.root,
            'live-engine',
            `hub: ${HERE}\nclaude_bin: /opt/Claude CLI/claude\n`
        );
        const behavior = join(engine, 'config', 'behavior.yml');
        const live = { engine, configFor: () => loadConfig(engine).config };

        writeFileSync(behavior, 'tasks:\n  skip_permissions: true\n');
        const first = tmux();
        expect(
            (
                await handleTerminal(
                    request({ action: 'task', kind: 'scout', cols: 80, rows: 24 }),
                    TOKEN,
                    {
                        ...live,
                        run: first.run
                    }
                )
            ).status
        ).toBe(200);
        const on = first.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(on[on.length - 1]).toBe(
            `'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit scout'`
        );

        writeFileSync(behavior, 'tasks:\n  skip_permissions: false\n');
        const second = tmux();
        expect(
            (
                await handleTerminal(
                    request({ action: 'task', kind: 'scout', cols: 80, rows: 24 }),
                    TOKEN,
                    {
                        ...live,
                        run: second.run
                    }
                )
            ).status
        ).toBe(200);
        const off = second.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(off[off.length - 1]).toBe(`'/opt/Claude CLI/claude' '/research-cockpit scout'`);
    });

    it('is wired to that reader by the route module, not to the context snapshot', () => {
        // The route is read rather than imported, the reason tests/routes/shape.test.ts gives: a
        // Kit route pulls its `./$types` in with it. What is asserted is the one line that decides
        // whether a saved setting takes effect before the next restart.
        const route = readFileSync(
            resolve(
                HERE_FILE,
                '..',
                '..',
                '..',
                '..',
                'src',
                'routes',
                'api',
                '(sessions)',
                'terminal',
                '+server.ts'
            ),
            'utf8'
        );
        expect(route).toContain('configFor: () => locals.config().config');
    });

    it('carries tasks.skip_permissions on the wire, off in the checked-in configuration', () => {
        const merged = loadConfig(engineDir()).config as {
            chat?: Record<string, unknown>;
            tasks?: Record<string, unknown>;
        };
        expect(merged.tasks?.skip_permissions).toBe(false);
        expect(merged.chat?.skip_permissions).toBeUndefined();
        expect(taskSkipPermissions(merged as Record<string, unknown>)).toBe(false);
    });

    it('refuses another task kind without starting a terminal', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind: 'audit', cols: 80, rows: 24 }),
            TOKEN,
            { engine: task.taskEngine, run: driver.run, configFor: configOf(task.taskEngine) }
        );
        expect(response.status).toBe(400);
        expect(driver.calls).toEqual([]);
    });

    it('uses Claude from PATH when local configuration names no binary', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind: 'scout', cols: 80, rows: 24 }),
            TOKEN,
            {
                engine: task.defaultEngine,
                run: driver.run,
                configFor: configOf(task.defaultEngine)
            }
        );
        expect(response.status).toBe(200);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.length - 1]).toBe(`'claude' '/research-cockpit scout'`);
    });
});

describe('POST /api/terminal, the latex action', () => {
    /** A project of the synthetic chat hub whose manuscript holds one main file and one include. */
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

    it('builds one main file with latexmk in the manuscript folder', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({
                action: 'latex',
                id: 'alpha',
                main: 'main.tex',
                step: 'build',
                cols: 88,
                rows: 25
            }),
            TOKEN,
            latexOptions(driver)
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { name: string };
        expect(terminal.name).toBe(latexName('build', 'alpha', 'main.tex'));
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.indexOf('-c') + 1]).toBe(
            join(task.chatHub, LATEX_PROJECT, 'manuscript')
        );
        expect(started[started.indexOf('-x') + 1]).toBe('88');
        expect(started[started.indexOf('-y') + 1]).toBe('25');
        expect(started[started.length - 1]).toBe(
            "latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'"
        );
    });

    it('cleans one main file with the clean command', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({
                action: 'latex',
                id: 'alpha',
                main: 'main.tex',
                step: 'clean',
                cols: 80,
                rows: 24
            }),
            TOKEN,
            latexOptions(driver)
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { name: string };
        expect(terminal.name).toBe(latexName('clean', 'alpha', 'main.tex'));
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.length - 1]).toBe("latexmk -c 'main.tex'");
    });

    it('refuses a file that is not a main file of the project, before anything runs', async () => {
        for (const main of ['intro.tex', '../../../etc/passwd', 'main.tex; touch nope']) {
            const driver = tmux();
            const response = await handleTerminal(
                request({ action: 'latex', id: 'alpha', main, step: 'build', cols: 80, rows: 24 }),
                TOKEN,
                latexOptions(driver)
            );
            expect(response.status).toBe(400);
            expect((await answer(response)).error).toBe('main is not a main file of this project');
            expect(driver.calls).toEqual([]);
        }
    });

    it('refuses a project folder that would leave the hub, before anything runs', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({
                action: 'latex',
                id: 'away',
                main: 'main.tex',
                step: 'build',
                cols: 80,
                rows: 24
            }),
            TOKEN,
            {
                engine: task.engine,
                run: driver.run,
                hubFor: () => task.chatHub,
                configFor: () => BASE_CHAT_CONFIG,
                projectFor: () => ({ title: 'Away', folder: '../elsewhere' })
            }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe(
            'the project folder is outside the configured hub'
        );
        expect(driver.calls).toEqual([]);
    });

    it('refuses an id the snapshot does not hold, and a step that is neither', async () => {
        const driver = tmux();
        const unknown = await handleTerminal(
            request({
                action: 'latex',
                id: 'nobody',
                main: 'main.tex',
                step: 'build',
                cols: 80,
                rows: 24
            }),
            TOKEN,
            latexOptions(driver)
        );
        expect(unknown.status).toBe(400);
        expect((await answer(unknown)).error).toBe('id is not a project in the current portfolio');

        const step = await handleTerminal(
            request({
                action: 'latex',
                id: 'alpha',
                main: 'main.tex',
                step: 'publish',
                cols: 80,
                rows: 24
            }),
            TOKEN,
            latexOptions(driver)
        );
        expect(step.status).toBe(400);
        expect(String((await answer(step)).error)).toContain('step must be one of');
        expect(driver.calls).toEqual([]);
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
        expect(started[started.length - 1]).toBe(expected);
        expect(started[started.length - 1]).not.toContain("'-p'");
        expect(indexAtStart).toBe(true);
    });

    // Reverts: build the focus note and the focus name in startChat with `replaceAll` chains on the
    // catalog instead of `words`; or fill each argument in turn so a later one refills the title's
    // `{2}`.
    it('fills a title holding a placeholder and a replacement pattern into the command as written', async () => {
        const title = 'Alpha {1} {2} $& Study';
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'chat', id: 'alpha', cols: 80, rows: 24 }),
            TOKEN,
            {
                ...chatOptions(driver),
                projectFor: (id) =>
                    id === 'alpha' ? { title, folder: 'projects/active/alpha' } : null
            }
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { id: string; name: string };
        const index = chatIndexPath(join(task.chatState, 'sessions.json'), terminal.id);
        expect(terminal.name).toBe(filled('server.chat.chat_name_focus', [title]));
        expect(terminal.name).toContain(title);
        const focus = filled('server.chat.chat_focus_note', ['alpha', title, task.chatProject]);
        expect(focus).toContain(title);
        const system = [
            filled('server.chat.chat_instruction', [task.chatHub, task.chatProject]),
            focus,
            filled('server.chat.chat_index_note', [index])
        ].join('\n\n');
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.length - 1]).toBe(
            command([
                '/opt/Claude CLI/claude',
                '--append-system-prompt',
                system,
                '--disallowedTools',
                'Bash,Edit,Write,WebFetch,WebSearch',
                '--model',
                'claude-opus-4-1',
                filled('server.chat.seed_focus', [title])
            ])
        );
    });

    it('starts a numbered portfolio chat in the hub with no model argument when none is set', async () => {
        const driver = tmux();
        const config = { ...BASE_CHAT_CONFIG, chat: { model: '' } };
        const response = await handleTerminal(
            request({ action: 'chat', id: null, cols: 90, rows: 26 }),
            TOKEN,
            { ...chatOptions(driver), configFor: () => config }
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { id: string; name: string };
        const catalog = textCatalog(config);
        expect(terminal.name).toBe(catalog['server.chat.chat_name'].replace('{0}', '1'));
        const index = chatIndexPath(join(task.chatState, 'sessions.json'), terminal.id);
        const system = [
            catalog['server.chat.chat_instruction']
                .replace('{0}', task.chatHub)
                .replace('{1}', task.chatHub),
            catalog['server.chat.chat_index_note'].replace('{0}', index)
        ].join('\n\n');
        const expected = command([
            '/opt/Claude CLI/claude',
            '--append-system-prompt',
            system,
            '--disallowedTools',
            'Bash,Edit,Write,WebFetch,WebSearch',
            catalog['server.chat.seed_portfolio']
        ]);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.indexOf('-c') + 1]).toBe(task.chatHub);
        expect(started[started.length - 1]).toBe(expected);
        expect(started[started.length - 1]).not.toContain("'--model'");
    });

    it('numbers a portfolio chat past an existing Chat 1', async () => {
        const driver = tmux([CHAT_CATALOG['server.chat.chat_name'].replace('{0}', '1')]);
        const response = await handleTerminal(
            request({ action: 'chat', cols: 80, rows: 24 }),
            TOKEN,
            chatOptions(driver)
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { name: string };
        expect(terminal.name).toBe(CHAT_CATALOG['server.chat.chat_name'].replace('{0}', '2'));
    });

    it('leaves no index when zero columns are refused', async () => {
        const driver = tmux();
        const before = readdirSync(join(task.chatState, 'chat')).sort();
        const response = await handleTerminal(
            request({ action: 'chat', id: 'alpha', cols: 0, rows: 24 }),
            TOKEN,
            chatOptions(driver)
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toContain('cols must be a whole number');
        expect(readdirSync(join(task.chatState, 'chat')).sort()).toEqual(before);
        expect(driver.calls).toEqual([]);
    });

    it('removes the index when the terminal runner fails to start', async () => {
        const driver = tmux();
        const routed = chatOptions(driver);
        let index = '';
        routed.run = async (args) => {
            if (args[0] === 'new-session') {
                index = chatIndexPath(
                    join(task.chatState, 'sessions.json'),
                    args[3].replace(/^oculus-/, '')
                );
                expect(existsSync(index)).toBe(true);
                throw new Error('stub runner refused startup');
            }
            return driver.run(args);
        };
        const response = await handleTerminal(
            request({ action: 'chat', id: 'alpha', cols: 80, rows: 24 }),
            TOKEN,
            routed
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('stub runner refused startup');
        expect(index.startsWith(task.chatState + sep)).toBe(true);
        expect(existsSync(index)).toBe(false);
    });

    it('refuses an unknown project before writing an index or starting a terminal', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'chat', id: 'unknown', cols: 80, rows: 24 }),
            TOKEN,
            chatOptions(driver)
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('id is not a project in the current portfolio');
        expect(driver.calls).toEqual([]);
    });
});
