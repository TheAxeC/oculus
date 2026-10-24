// Layer 2, route tests. POST /api/terminal update-task, LaTeX and interactive chat cases. Chat
// checks cover argv, the private index's lifecycle and the section it holds for each hub.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag
// holding a `run` that records the argv and answers the list itself. The only real path any case
// touches is the temporary directory: for the task cases, to hold an engine directory whose
// local.yml the route reads, made once per file from the fixture's test.beforeAll.
//
// Every case runs in npm test.
// @module-tag slow: the chat cases write a workspace's index for each hub, which runs past the
// default timeout when the quick suite runs many files at once.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { taskTmux } from '../../server/machine/runs/commands/commands-fixture.ts';
import { chatIndexPath } from '../../../src/lib/server/machine/pty/start/chat.ts';
import { Turns } from '../../../src/lib/server/machine/pty/latex/turns.ts';
import {
    SERVER,
    TOKEN,
    HERE,
    makeTaskConfig,
    type TaskConfig,
    LATEX_PROJECT,
    latexHome,
    latexRouteOptions,
    CHAT_CONFIG,
    CHAT_CATALOG,
    tmux,
    joinedCommands,
    lineOf,
    request,
    command,
    answer,
    configOf,
    worldOf,
    chatWorld,
    type ChatFolder
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
    /** The four task files of the task hub, which a task's session is asked to follow. */
    test.beforeAll(() => {
        mkdirSync(join(task.taskHub, '.oculus', 'tasks'), { recursive: true });
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            writeFileSync(join(task.taskHub, '.oculus', 'tasks', `${kind}.md`), `# ${kind}\n`);
        }
    });

    /** The sentence a task's session starts with, read through the catalog rather than typed. */
    function taskSentence(kind: string): string {
        return CHAT_CATALOG['server.task.update_task'].replace('{0}', `.oculus/tasks/${kind}.md`);
    }

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
                ? {
                      ...worldOf(task.taskHub),
                      engine: task.taskEngine,
                      run: driver.run,
                      configFor: () => CHAT_CONFIG
                  }
                : {
                      ...worldOf(task.taskHub),
                      engine: task.taskEngine,
                      run: driver.run,
                      configFor: () => config
                  }
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
            expect(started[started.indexOf('-c') + 1]).toBe(task.taskHub);
            expect(started[started.indexOf('-x') + 1]).toBe('92');
            expect(started[started.indexOf('-y') + 1]).toBe('27');
            expect(lineOf(started)).toEqual([`'/opt/Claude CLI/claude' '${taskSentence(kind)}'`]);
        }
    });

    it('refuses a task while the workspace has no primary hub, and starts nothing', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind: 'litwatch', cols: 92, rows: 27 }),
            TOKEN,
            { ...worldOf(), engine: task.taskEngine, run: driver.run, configFor: () => CHAT_CONFIG }
        );
        expect(response.status).toBe(400);
        expect(await answer(response)).toEqual({ error: 'no-primary' });
        expect(driver.calls).toEqual([]);
    });
});

describe('POST /api/terminal, the latex action', () => {
    /** The synthetic chat hub's project (LATEX_PROJECT) holds main files and one include. */
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
            join(task.chatHub, LATEX_PROJECT, 'manuscript', 'second.tex'),
            '\\documentclass{article}\n'
        );
        writeFileSync(
            join(task.chatHub, LATEX_PROJECT, 'manuscript', '-v.tex'),
            '\\documentclass{article}\n'
        );
        mkdirSync(latexHome(task), { recursive: true });
    });

    /** The name the terminals list shows, read through the catalog rather than typed here. */
    function latexName(step: string, id: string, main: string): string {
        return CHAT_CATALOG['server.latex.name']
            .replace('{0}', step)
            .replace('{1}', id)
            .replace('{2}', main);
    }

    /** The turns every request of this describe shares, as the server's terminals share theirs. */
    const turns = new Turns();

    function latexOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
        return latexRouteOptions(task, turns, driver.run);
    }

    /** The manuscript folder of the synthetic project, which a build runs in and writes to. */
    function manuscript(): string {
        return join(task.chatHub, LATEX_PROJECT, 'manuscript');
    }

    /**
     * The line of LaTeX Workshop's default latexmk tool for `main.tex`, as the build must run it.
     */
    function latexmkLine(extra: string[] = []): string {
        const dir = manuscript();
        return command([
            'latexmk',
            ...extra,
            '-synctex=1',
            '-interaction=nonstopmode',
            '-file-line-error',
            '-pdf',
            `-outdir=${dir}`,
            `-auxdir=${dir}`,
            join(dir, 'main')
        ]);
    }

    /** The body of a latex action over the synthetic project's main file. */
    function latexBody(step: string): Record<string, unknown> {
        return { action: 'latex', id: 'hub:alpha', main: 'main.tex', step, cols: 88, rows: 25 };
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
        expect(lineOf(started)).toEqual([latexmkLine()]);
        // The build is a task terminal whose pane stays after latexmk ends, and its task mark and
        // name are set by the invocation that creates the session.
        const session = `oculus-${terminal.id}`;
        const [keep, mark, label] = joinedCommands(started).slice(1);
        expect(keep).toEqual(['set-option', '-t', session, 'remain-on-exit', 'on']);
        expect(mark.slice(0, 4)).toEqual(['set-option', '-t', session, '@oculus_task']);
        expect(JSON.parse(mark[4])).toEqual({
            repo: folder,
            name,
            source: 'latex',
            latex: {
                step: 'build',
                main: 'main.tex',
                recipe: 'latexmk',
                target: { hub: 'hub', key: 'alpha' }
            }
        });
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
        expect(driver.respawns()).toEqual([['respawn-pane', '-k', '-t', session, latexmkLine()]]);
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

    /** Post one latex step with extra fields, answering the response. */
    async function postStep(
        driver: ReturnType<typeof taskTmux>,
        step: string,
        extra: Record<string, unknown> = {}
    ): Promise<Response> {
        return handleTerminal(
            request({ ...latexBody(step), ...extra }),
            TOKEN,
            latexOptions(driver)
        );
    }

    /** The terminal of a successful answer. */
    async function terminalOf(response: Response): Promise<{ id: string }> {
        return (await answer(response)).terminal as { id: string };
    }

    /** The one terminal line a start of the driver was given. */
    function lineStarted(driver: ReturnType<typeof taskTmux>, index: number): string {
        const started = driver.starts()[index];
        return started.slice(started.indexOf('--') + 1)[0];
    }

    /**
     * The outcomes of the latex action other than the first build, each row one input: what the
     * action starts, refuses or sends, and to which terminal.
     */
    const LATEX_ROWS: {
        title: string;
        run: (driver: ReturnType<typeof taskTmux>) => Promise<void>;
    }[] = [
        {
            title: 'runs the recipe asked for as one line of its tools joined by &&',
            run: async (driver) => {
                const response = await postStep(driver, 'build', {
                    recipe: 'pdflatex -> bibtex -> pdflatex * 2'
                });
                expect(response.status).toBe(200);
                const pdflatex = [
                    'pdflatex',
                    '-synctex=1',
                    '-interaction=nonstopmode',
                    '-file-line-error',
                    join(manuscript(), 'main')
                ];
                expect(lineStarted(driver, 0)).toBe(
                    [
                        command(pdflatex),
                        command(['bibtex', 'main']),
                        command(pdflatex),
                        command(pdflatex)
                    ].join(' && ')
                );
            }
        },
        {
            title: 'makes latexmk build again with -g when the page says so',
            run: async (driver) => {
                const response = await postStep(driver, 'build', { force: true });
                expect(response.status).toBe(200);
                expect(lineStarted(driver, 0)).toBe(latexmkLine(['-g']));
            }
        },
        {
            title: 'stops the build terminal of the main and no other terminal',
            run: async (driver) => {
                const idle = await postStep(driver, 'stop');
                expect(idle.status).toBe(404);
                expect(await answer(idle)).toEqual({ error: 'latex-idle', names: ['main.tex'] });
                const build = await terminalOf(await postStep(driver, 'build'));
                // Another main of the folder has its build running, and a checkcites terminal of
                // the first main is listed beside it: neither is interrupted.
                const other = await terminalOf(
                    await postStep(driver, 'build', { main: 'second.tex' })
                );
                const cites = await terminalOf(await postStep(driver, 'checkcites'));
                expect(driver.starts()).toHaveLength(3);
                expect(new Set([build.id, other.id, cites.id]).size).toBe(3);
                const clean = await postStep(driver, 'clean');
                expect(clean.status).toBe(400);
                expect(driver.starts()).toHaveLength(3);
                const stopped = await postStep(driver, 'stop');
                expect(stopped.status).toBe(200);
                const keys = driver.calls.filter((args) => args[0] === 'send-keys');
                expect(keys).toEqual([['send-keys', '-t', `oculus-${build.id}`, '--', 'C-c']]);
                // Once the build's line has ended there is nothing to stop.
                driver.end(`oculus-${build.id}`, 130);
                expect((await postStep(driver, 'stop')).status).toBe(404);
                expect(driver.calls.filter((args) => args[0] === 'send-keys')).toHaveLength(1);
            }
        },
        {
            title: 'refuses a clean while the main builds, and runs it once the build ended',
            run: async (driver) => {
                const build = await terminalOf(await postStep(driver, 'build'));
                const refused = await postStep(driver, 'clean');
                expect(refused.status).toBe(400);
                expect(await answer(refused)).toEqual({
                    error: 'latex-building',
                    names: ['main.tex']
                });
                expect(driver.starts()).toHaveLength(1);
                driver.end(`oculus-${build.id}`, 0);
                expect((await postStep(driver, 'clean')).status).toBe(200);
                expect(driver.starts()).toHaveLength(2);
                const dir = manuscript();
                expect(lineStarted(driver, 1)).toBe(
                    command([
                        'latexmk',
                        '-c',
                        `-outdir=${dir}`,
                        `-auxdir=${dir}`,
                        join(dir, 'main')
                    ])
                );
            }
        },
        {
            title: 'answers concurrent requests for one build with the one terminal it started',
            run: async (driver) => {
                const answers = await Promise.all([1, 2, 3].map(() => postStep(driver, 'build')));
                const terminals = await Promise.all(answers.map((one) => terminalOf(one)));
                expect(answers.map((one) => one.status)).toEqual([200, 200, 200]);
                expect(new Set(terminals.map((one) => one.id)).size).toBe(1);
                expect(driver.starts()).toHaveLength(1);
                // A build of another main file of the folder has a turn of its own.
                const other = await terminalOf(
                    await postStep(driver, 'build', { main: 'second.tex' })
                );
                expect(other.id).not.toBe(terminals[0].id);
                expect(driver.starts()).toHaveLength(2);
            }
        },
        {
            title: 'keeps one build of a main file whether the folder is named by project or by root',
            run: async (driver) => {
                const byRoot = { id: undefined, root: 'hub', path: `${LATEX_PROJECT}/manuscript` };
                const build = await terminalOf(await postStep(driver, 'build', byRoot));
                const again = await postStep(driver, 'build');
                expect((await terminalOf(again)).id).toBe(build.id);
                expect(driver.starts()).toHaveLength(1);
                const refused = await postStep(driver, 'clean');
                expect(refused.status).toBe(400);
                expect(await answer(refused)).toEqual({
                    error: 'latex-building',
                    names: ['main.tex']
                });
                expect(driver.starts()).toHaveLength(1);
            }
        },
        {
            title: 'checks the citations of a main file with checkcites in a terminal of its own',
            run: async (driver) => {
                const build = await terminalOf(await postStep(driver, 'build'));
                const checked = await terminalOf(await postStep(driver, 'checkcites'));
                expect(checked.id).not.toBe(build.id);
                expect(driver.starts()).toHaveLength(2);
                expect(lineStarted(driver, 1)).toBe(
                    command(['checkcites', join(manuscript(), 'main.aux')])
                );
            }
        }
    ];

    it.each(LATEX_ROWS.map((row) => [row.title, row.run] as const))('%s', async (_title, run) => {
        await run(taskTmux(HERE));
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
            ...worldOf(),
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
            ...worldOf(task.chatHub),
            engine: task.chatEngine,
            run: driver.run,
            projectFor: (id) =>
                id === 'hub:alpha'
                    ? { title: 'Alpha Study', folder: 'projects/active/alpha', root: 'hub' }
                    : null,
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
            request({ action: 'chat', id: 'hub:alpha', cols: 101, rows: 31 }),
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
        const written = readFileSync(index, 'utf8');
        expect(written).toContain(`# HUB hub: ${task.chatHub}\n`);
        expect(written).toContain('\n### projects/active/alpha\n');
        expect(statSync(index).mode & 0o777).toBe(0o600);
        const system = [
            CHAT_CATALOG['server.chat.chat_instruction']
                .replace('{0}', task.chatHub)
                .replace('{1}', task.chatProject)
                .replace('{2}', CHAT_CATALOG['server.chat.chat_user_fallback']),
            CHAT_CATALOG['server.chat.chat_focus_note']
                .replace('{0}', 'alpha')
                .replace('{1}', 'Alpha Study')
                .replace('{2}', task.chatProject),
            CHAT_CATALOG['server.chat.chat_index_note'].replace('{0}', index)
        ].join('\n\n');
        expect(system).toContain(`This chat runs in the hub whose folder is \`${task.chatHub}\`.`);
        expect(system).toContain(
            "every folder in a section is relative to that hub's folder unless it is absolute"
        );
        expect(system).toContain('against the folder of the hub whose section lists it');
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
        expect(system).toContain('research hub of its user (oculus)');
        expect(system).not.toMatch(/null|negative result| - /);

        const owned = tmux();
        const named = await handleTerminal(
            request({ action: 'chat', id: 'hub:alpha', cols: 101, rows: 31 }),
            TOKEN,
            { ...chatOptions(owned), userFor: () => 'John Smith' }
        );
        expect(named.status).toBe(200);
        const ownedStart = owned.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(lineOf(ownedStart)[0]).toContain('research hub of John Smith (oculus)');
        expect(lineOf(ownedStart)[0]).not.toContain('its user');
    });

    const VENUES = '.oculus/data/research/venues.yml';
    const PILLARS = '.oculus/data/pillars/pillars.yml';
    const FUNDING = '.oculus/data/academic/funding.yml';
    const EVENTS = '.oculus/data/academic/events.yml';
    const PEOPLE = '.oculus/data/people/people.yml';
    const LEADS = '.oculus/data/academic/leads.yml';
    const MANIFESTS = '## PROJECT MANIFESTS (status/venue source of truth)';
    const manifest = (name: string): string => `projects/active/${name}/project.yml`;
    /** The lines of a file of a hub's section: its heading and its planted line. */
    const fileLines = (hub: string, path: string): string[] => [
        `## ${path}`,
        `planted: ${hub}/${path}`
    ];
    /** The lines of a project of a hub's section: its folder's heading and its planted line. */
    const projectLines = (hub: string, name: string): string[] => [
        `### projects/active/${name}`,
        `planted: ${hub}/${manifest(name)}`
    ];
    /**
     * The lines of the head's venue catalogue of the primary `hub`, headed by its absolute
     * path.
     */
    const venueLines = (at: (name: string) => string): string[] => [
        `# ${join(at('hub'), VENUES)} (venue catalogue)`,
        `planted: hub/${VENUES}`
    ];

    /**
     * Three hubs, `hub` the primary holding a pillars registry, none setting chat_context, `other`
     * holding a venue file too.
     */
    const THREE_HUBS: ChatFolder[] = [
        {
            name: 'hub',
            settings: '{}\n',
            files: [manifest('alpha'), VENUES, PILLARS, FUNDING, EVENTS, PEOPLE]
        },
        { name: 'other', settings: '{}\n', files: [manifest('beta'), VENUES, EVENTS] },
        { name: 'third', settings: '{}\n', files: [manifest('gamma')] }
    ];
    const threeHubLines = (at: (name: string) => string): string[] => [
        ...venueLines(at),
        `# ${join(at('hub'), PILLARS)}`,
        `planted: hub/${PILLARS}`,
        `# HUB hub: ${at('hub')}`,
        MANIFESTS,
        ...projectLines('hub', 'alpha'),
        ...fileLines('hub', FUNDING),
        ...fileLines('hub', EVENTS),
        `# HUB other: ${at('other')}`,
        MANIFESTS,
        ...projectLines('other', 'beta'),
        ...fileLines('other', EVENTS),
        `# HUB third: ${at('third')}`,
        MANIFESTS,
        ...projectLines('third', 'gamma')
    ];

    /**
     * One workspace per row: its folders in order, its primary, the chat (the portfolio, or a
     * project chat of beta, a project of `other`), and the index's lines that are not empty.
     */
    const INDEX_ROWS: {
        folders: ChatFolder[];
        primary?: string;
        chat: 'beta' | null;
        lines: (at: (name: string) => string) => string[];
    }[] = [
        { folders: THREE_HUBS, primary: 'hub', chat: null, lines: threeHubLines },
        { folders: THREE_HUBS, primary: 'hub', chat: 'beta', lines: threeHubLines },
        {
            folders: [
                { name: 'hub', settings: 'chat_context: [events]\n', files: [FUNDING, EVENTS] },
                { name: 'other', settings: 'chat_context: [funding]\n', files: [EVENTS, FUNDING] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                ...fileLines('hub', EVENTS),
                `# HUB other: ${at('other')}`,
                ...fileLines('other', FUNDING)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [] },
                { name: 'other', settings: 'chat_context: [leads]\n', files: [LEADS, EVENTS] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                `# HUB other: ${at('other')}`,
                ...fileLines('other', LEADS)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] },
                { name: 'tool', files: ['project.yml'] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `### ${at('tool')}`,
                'planted: tool/project.yml'
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] },
                { name: 'third', settings: '{}\n', files: [] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB third: ${at('third')}`
            ]
        },
        {
            folders: [
                { name: 'other', settings: '{}\n', files: [manifest('beta')] },
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB other: ${at('other')}`,
                MANIFESTS,
                ...projectLines('other', 'beta')
            ]
        },
        {
            folders: [
                { name: 'hub', settings: 'chat_context: [funding, funding]\n', files: [FUNDING] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [`# HUB hub: ${at('hub')}`, ...fileLines('hub', FUNDING)]
        },
        {
            folders: [{ name: 'hub', settings: 'chat_context: []\n', files: [FUNDING, EVENTS] }],
            primary: 'hub',
            chat: null,
            lines: (at) => [`# HUB hub: ${at('hub')}`]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [] },
                { name: 'other', settings: 'chat_context: [funding\n', files: [FUNDING, EVENTS] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                `# HUB other: ${at('other')}`,
                ...fileLines('other', FUNDING),
                ...fileLines('other', EVENTS)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha'), VENUES] },
                { name: 'other', settings: '{}\n', files: [manifest('beta'), VENUES] },
                { name: 'tool', files: ['project.yml'] }
            ],
            chat: 'beta',
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB other: ${at('other')}`,
                MANIFESTS,
                ...projectLines('other', 'beta'),
                '# WORKSPACE FOLDERS (no hub)',
                MANIFESTS,
                `### ${at('tool')}`,
                'planted: tool/project.yml'
            ]
        },
        {
            folders: [{ name: 'hub', settings: 'chat_context: [venues]\n', files: [VENUES] }],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                ...venueLines(at),
                `# HUB hub: ${at('hub')}`,
                `## ${VENUES}`,
                `planted: hub/${VENUES}`
            ]
        }
    ];

    it.each(INDEX_ROWS)(
        'writes one section per hub of the workspace into the index',
        async (row) => {
            const world = chatWorld(row.folders, row.primary);
            const response = await handleTerminal(
                request({ action: 'chat', id: row.chat, cols: 80, rows: 24 }),
                TOKEN,
                {
                    ...world.options,
                    engine: task.chatEngine,
                    run: tmux().run,
                    projectFor: (id) =>
                        id === 'beta'
                            ? { title: 'Beta', folder: 'projects/active/beta', root: 'other' }
                            : null
                }
            );
            expect(response.status).toBe(200);
            const terminal = (await answer(response)).terminal as { id: string };
            const index = readFileSync(chatIndexPath(world.sessions, terminal.id), 'utf8');
            expect(index.split('\n').filter((line) => line !== '')).toEqual(row.lines(world.at));
        }
    );
});
