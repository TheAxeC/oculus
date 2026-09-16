// Layer 2, server tests. POST /api/terminal resume, recovery, update-task and interactive chat
// cases. Chat checks cover argv, absolute prompt paths, numbering and private index lifecycle.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag holding
// a `run` that records the argv and answers the list itself, and a `recordFor` the test owns instead
// of the bridge to the last published payload, so only the synthetic hub and state folder are read.
// The only real path any case touches is the temporary directory: to have statSync say it is there,
// and, for the task cases, to hold an engine directory whose local.yml the route reads and that
// afterAll removes.

import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    handleTerminal,
    handleTerminalList,
    type TerminalOptions
} from '../../src/lib/server/pty/routes.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { chatIndexPath } from '../../src/lib/server/pty/chat.ts';
import { record } from '../sessions-fixture.ts';
import type { SessionRecord } from '../../src/lib/data/model.ts';
import { contextFixture } from '../server/context-fixture.ts';

const HOST = '127.0.0.1:8791';
const SERVER = contextFixture({ token: 'the-write-token-of-this-test' });
const TOKEN = SERVER.token;

/** A session id of the shape both tools write. */
const SESSION = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/** A directory that is there, which is what the cwd check asks of the record's own path. */
const HERE = resolve(tmpdir());
expect(existsSync(HERE)).toBe(true);
expect(HERE.length).toBeGreaterThan(1);

/** A directory that is not, for the session whose folder has been moved away since it ran. */
const GONE = join(HERE, 'oculus-no-such-directory-for-o19');
expect(GONE.startsWith(HERE + sep)).toBe(true);
expect(existsSync(GONE)).toBe(false);

const TASK_CONFIG = mkdtempSync(join(HERE, 'oculus-task-route-'));
expect(resolve(TASK_CONFIG).startsWith(HERE + sep)).toBe(true);

/**
 * An engine directory of this suite's own: a config folder holding the machine-local file the case
 * under test reads. The route is handed the directory, so nothing here reads the checkout's own.
 */
function engineWith(name: string, local = ''): string {
    const dir = join(TASK_CONFIG, name);
    expect(resolve(dir).startsWith(TASK_CONFIG + sep)).toBe(true);
    mkdirSync(join(dir, 'config'), { recursive: true });
    if (local !== '') writeFileSync(join(dir, 'config', 'local.yml'), local);
    return dir;
}

/** The engine a case that reads no machine-local value is given: a config folder and nothing in it. */
const ENGINE = engineWith('engine');
const TASK_ENGINE = engineWith('task-engine', `hub: ${HERE}\nclaude_bin: /opt/Claude CLI/claude\n`);
const TASK_DEFAULT_ENGINE = engineWith('default-engine', `hub: ${HERE}\n`);

const CHAT_HUB = join(TASK_CONFIG, 'hub');
const CHAT_STATE = join(TASK_CONFIG, 'state');
const CHAT_PROJECT = join(CHAT_HUB, 'projects', 'active', 'alpha');
mkdirSync(join(CHAT_STATE, 'chat'), { recursive: true });
mkdirSync(CHAT_PROJECT, { recursive: true });
mkdirSync(join(CHAT_HUB, 'registries'), { recursive: true });
writeFileSync(join(CHAT_PROJECT, 'project.yml'), 'id: alpha\ntitle: Alpha Study\n');
writeFileSync(join(CHAT_HUB, 'registries', 'venues.yml'), 'entries: []\n');
const CHAT_ENGINE = engineWith(
    'chat-engine',
    `hub: ${CHAT_HUB}\nclaude_bin: /opt/Claude CLI/claude\nsessions_overrides: ${join(CHAT_STATE, 'sessions.json')}\n`
);
const BASE_CHAT_CONFIG = loadConfig(engineDir()).config;
const CHAT_CONFIG = { ...BASE_CHAT_CONFIG, chat: { model: 'claude-opus-4-1' } };
const CHAT_CATALOG = textCatalog(CHAT_CONFIG);

afterAll(() => {
    SERVER.close();
    rmSync(TASK_CONFIG, { recursive: true, force: true });
});

/**
 * A tmux that runs nothing: it keeps every argv, remembers what set-option was told, and answers
 * list-sessions with the one line the session it was asked to create would have produced.
 */
function tmux(existingNames: string[] = []): {
    run: NonNullable<TerminalOptions['run']>;
    calls: string[][];
} {
    const calls: string[][] = [];
    let name = '';
    const options: Record<string, string> = {};
    return {
        calls,
        run: (args: string[]): Promise<string> => {
            calls.push([...args]);
            if (args[0] === 'new-session') {
                name = args[3] ?? '';
                return Promise.resolve('');
            }
            if (args[0] === 'set-option') {
                options[args[3] ?? ''] = args[4] ?? '';
                return Promise.resolve('');
            }
            if (args[0] === 'list-sessions') {
                const fields = [
                    name,
                    '1757500000',
                    '0',
                    'claude',
                    '4242',
                    HERE,
                    options['@oculus_name'] ?? '',
                    options['@oculus_resumes'] ?? ''
                ];
                const existing = existingNames.map((label) =>
                    [
                        'oculus-aabbcc-claude',
                        '1757500000',
                        '0',
                        'claude',
                        '4241',
                        HERE,
                        label,
                        ''
                    ].join('\t')
                );
                return Promise.resolve([...existing, fields.join('\t')].join('\n') + '\n');
            }
            return Promise.resolve('');
        }
    };
}

function options(over: Partial<TerminalOptions> = {}): TerminalOptions {
    return { engine: ENGINE, run: tmux().run, recordFor: () => null, ...over };
}

/** A record source holding exactly the sessions the case is about. */
function source(...records: SessionRecord[]): (id: string) => SessionRecord | null {
    return (id) => records.find((one) => one.id === id) ?? null;
}

function request(body: unknown, token: string = TOKEN): Request {
    return new Request(`http://${HOST}/api/terminal`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

/** Quote an expected CLI argument independently of the server's command builder. */
function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function command(argv: string[]): string {
    return argv.map(shellWord).join(' ');
}

async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('GET /api/terminal after a write', () => {
    it('lists a terminal immediately after POST starts it', async () => {
        const driver = tmux();
        const started = await handleTerminal(
            request({ action: 'start', kind: 'claude', cwd: HERE, cols: 80, rows: 24 }),
            TOKEN,
            { engine: ENGINE, run: driver.run }
        );
        expect(started.status).toBe(200);
        const terminal = (await answer(started)).terminal as { id: string };

        const listed = await handleTerminalList(
            new Request(`http://${HOST}/api/terminal`, {
                headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
            }),
            { run: driver.run }
        );

        expect(listed.status).toBe(200);
        expect((await answer(listed)).terminals).toEqual([
            expect.objectContaining({ id: terminal.id })
        ]);
    });
});

describe('POST /api/terminal, a session oculus did not start', () => {
    it('refuses the stop and the resize with a reason, and runs no tmux command', async () => {
        for (const action of ['stop', 'resize']) {
            const driver = tmux();
            const response = await handleTerminal(
                request({ action, id: 'scratch', cols: 80, rows: 24 }),
                TOKEN,
                { engine: ENGINE, run: driver.run }
            );
            expect(response.status).toBe(400);
            expect(String((await answer(response)).error)).toContain('not started by oculus');
            expect(driver.calls).toEqual([]);
        }
    });
});

describe('POST /api/terminal, the resume action', () => {
    it('refuses an id that is not the shape both tools write', async () => {
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: 'not-a-uuid', cols: 80, rows: 24 }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('id is not a session id');
    });

    it('refuses a tool that is neither agent', async () => {
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'shell', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(400);
        expect(String((await answer(response)).error)).toContain('tool must be one of');
    });

    it('refuses a session the payload no longer holds', async () => {
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            options({ recordFor: source() })
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('sessions.resume_unknown');
    });

    it('refuses a session whose process is still running, and signals nothing', async () => {
        const driver = tmux();
        const running = record(SESSION, { live: true, state: 'working', cwd: HERE });
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            { engine: ENGINE, run: driver.run, recordFor: source(running) }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('sessions.resume_live');
        expect(driver.calls).toEqual([]);
    });

    it('refuses a session whose directory is gone, saying which one', async () => {
        const ended = record(SESSION, { live: false, state: 'ended', cwd: GONE });
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            options({ recordFor: source(ended) })
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe(`cwd does not exist: ${GONE}`);
    });

    it('starts the terminal in the record cwd, with the tool resume command and the title', async () => {
        const driver = tmux();
        const ended = record(SESSION, { live: false, state: 'ended', cwd: HERE, title: 'A run' });
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION, cols: 100, rows: 30 }),
            TOKEN,
            { engine: ENGINE, run: driver.run, recordFor: source(ended) }
        );
        expect(response.status).toBe(200);
        const body = await answer(response);
        const terminal = body.terminal as { id: string; name: string; resumes: unknown };
        expect(terminal.name).toBe('A run');
        expect(terminal.resumes).toEqual({ tool: 'claude', id: SESSION });

        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started).toContain('-c');
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        expect(started[started.length - 1]).toBe(`claude --resume ${SESSION}`);
        expect(started).toContain(`oculus-${terminal.id}`);
        expect(started[started.indexOf('-x') + 1]).toBe('100');
        expect(started[started.indexOf('-y') + 1]).toBe('30');

        const set = driver.calls.filter((args) => args[0] === 'set-option');
        expect(set.map((args) => args[3])).toEqual(['@oculus_name', '@oculus_resumes']);
        expect(set[1][4]).toBe(`claude:${SESSION}`);
    });

    it('runs codex resume for a codex session', async () => {
        const driver = tmux();
        const ended = record(SESSION, { tool: 'codex', live: false, state: 'ended', cwd: HERE });
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'codex', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            { engine: ENGINE, run: driver.run, recordFor: source(ended) }
        );
        expect(response.status).toBe(200);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.length - 1]).toBe(`codex resume ${SESSION}`);
    });

    it('refuses a request without the write token, before reading any record', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION }, 'stale'),
            TOKEN,
            { engine: ENGINE, run: driver.run, recordFor: source(record(SESSION, { cwd: HERE })) }
        );
        expect(response.status).toBe(403);
        expect(driver.calls).toEqual([]);
    });
});

describe('POST /api/terminal, the recover action', () => {
    it('starts a named shell in the hub with the server-built recovery command', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'recover', key: 'mimic-iv', cols: 96, rows: 28 }),
            TOKEN,
            {
                engine: ENGINE,
                run: driver.run,
                datasetIdsFor: () => ['mimic-iv'],
                hubFor: () => HERE
            }
        );
        expect(response.status).toBe(200);
        const body = await answer(response);
        const terminal = body.terminal as { id: string; name: string };
        expect(terminal.name).toBe('recover mimic-iv');
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        expect(started[started.indexOf('-x') + 1]).toBe('96');
        expect(started[started.indexOf('-y') + 1]).toBe('28');
        expect(started[started.length - 1]).toBe("python3 tools/data/redownload.py 'mimic-iv'");
    });

    it('refuses an unknown dataset without starting a terminal', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'recover', key: 'unknown', cols: 80, rows: 24 }),
            TOKEN,
            {
                engine: ENGINE,
                run: driver.run,
                datasetIdsFor: () => ['mimic-iv'],
                hubFor: () => HERE
            }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe(
            'key is not a dataset in the current portfolio'
        );
        expect(driver.calls).toEqual([]);
    });

    it('refuses a shell-bearing key absent from the snapshot', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'recover', key: 'mimic; touch nope', cols: 80, rows: 24 }),
            TOKEN,
            {
                engine: ENGINE,
                run: driver.run,
                datasetIdsFor: () => ['mimic-iv'],
                hubFor: () => HERE
            }
        );
        expect(response.status).toBe(400);
        expect(driver.calls).toEqual([]);
    });

    it('refuses a dash-prefixed key even when the snapshot holds it', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'recover', key: '--all', cols: 80, rows: 24 }),
            TOKEN,
            { engine: ENGINE, run: driver.run, datasetIdsFor: () => ['--all'], hubFor: () => HERE }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('key is not a valid dataset key');
        expect(driver.calls).toEqual([]);
    });
});

describe('POST /api/terminal, the task action', () => {
    it('starts every accepted task in the hub with the configured Claude binary and fixed argv', async () => {
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            const driver = tmux();
            const response = await handleTerminal(
                request({ action: 'task', kind, cols: 92, rows: 27 }),
                TOKEN,
                { engine: TASK_ENGINE, run: driver.run }
            );
            expect(response.status).toBe(200);
            const terminal = (await answer(response)).terminal as { name: string };
            expect(terminal.name).toBe(`task ${kind}`);
            const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
            expect(started[started.indexOf('-c') + 1]).toBe(HERE);
            expect(started[started.indexOf('-x') + 1]).toBe('92');
            expect(started[started.indexOf('-y') + 1]).toBe('27');
            expect(started[started.length - 1]).toBe(
                `'/opt/Claude CLI/claude' '-p' '--output-format' 'stream-json' '--verbose' '--include-partial-messages' '--dangerously-skip-permissions' '/research-cockpit ${kind}'`
            );
        }
    });

    it('refuses another task kind without starting a terminal', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind: 'audit', cols: 80, rows: 24 }),
            TOKEN,
            { engine: TASK_ENGINE, run: driver.run }
        );
        expect(response.status).toBe(400);
        expect(driver.calls).toEqual([]);
    });

    it('uses Claude from PATH when local configuration names no binary', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'task', kind: 'scout', cols: 80, rows: 24 }),
            TOKEN,
            { engine: TASK_DEFAULT_ENGINE, run: driver.run }
        );
        expect(response.status).toBe(200);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.length - 1]).toMatch(/^'claude' '-p'/);
    });
});

describe('POST /api/terminal, the chat action', () => {
    function chatOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
        return {
            engine: CHAT_ENGINE,
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
                indexAtStart = existsSync(chatIndexPath(join(CHAT_STATE, 'sessions.json'), id));
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

        const index = chatIndexPath(join(CHAT_STATE, 'sessions.json'), terminal.id);
        expect(index.startsWith(CHAT_STATE + sep)).toBe(true);
        expect(readFileSync(index, 'utf8')).toContain('## projects/active/alpha');
        expect(statSync(index).mode & 0o777).toBe(0o600);
        const system = [
            CHAT_CATALOG['server.chat.chat_instruction']
                .replace('{0}', CHAT_HUB)
                .replace('{1}', CHAT_PROJECT),
            CHAT_CATALOG['server.chat.chat_focus_note']
                .replace('{0}', 'alpha')
                .replace('{1}', 'Alpha Study')
                .replace('{2}', CHAT_PROJECT),
            CHAT_CATALOG['server.chat.chat_index_note'].replace('{0}', index)
        ].join('\n\n');
        expect(system).toContain(`The hub root is \`${CHAT_HUB}\``);
        expect(system).toContain(`Your working directory is \`${CHAT_PROJECT}\``);
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
        expect(started[started.indexOf('-c') + 1]).toBe(CHAT_PROJECT);
        expect(started[started.indexOf('-x') + 1]).toBe('101');
        expect(started[started.indexOf('-y') + 1]).toBe('31');
        expect(started[started.length - 1]).toBe(expected);
        expect(started[started.length - 1]).not.toContain("'-p'");
        expect(indexAtStart).toBe(true);
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
        const index = chatIndexPath(join(CHAT_STATE, 'sessions.json'), terminal.id);
        const system = [
            catalog['server.chat.chat_instruction']
                .replace('{0}', CHAT_HUB)
                .replace('{1}', CHAT_HUB),
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
        expect(started[started.indexOf('-c') + 1]).toBe(CHAT_HUB);
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
        const before = readdirSync(join(CHAT_STATE, 'chat')).sort();
        const response = await handleTerminal(
            request({ action: 'chat', id: 'alpha', cols: 0, rows: 24 }),
            TOKEN,
            chatOptions(driver)
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toContain('cols must be a whole number');
        expect(readdirSync(join(CHAT_STATE, 'chat')).sort()).toEqual(before);
        expect(driver.calls).toEqual([]);
    });

    it('removes the index when the terminal runner fails to start', async () => {
        const driver = tmux();
        const routed = chatOptions(driver);
        let index = '';
        routed.run = async (args) => {
            if (args[0] === 'new-session') {
                index = chatIndexPath(
                    join(CHAT_STATE, 'sessions.json'),
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
        expect(index.startsWith(CHAT_STATE + sep)).toBe(true);
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
