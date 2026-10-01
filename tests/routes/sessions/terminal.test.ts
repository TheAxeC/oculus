// Layer 2, server tests. GET /api/terminal after a write, and POST /api/terminal on a session
// oculus did not start, resume and recovery. The update-task, LaTeX and chat actions are
// terminal-actions.test.ts beside this.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag holding
// a `run` that records the argv and answers the list itself, and a `recordFor` the test owns
// instead of the bridge to the last published payload, so only the synthetic hub and state folder
// are read.

import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import { handleTerminal, handleTerminalList } from '../../../src/lib/server/machine/pty/routes.ts';
import { record } from '../../fixtures/sessions-fixture.ts';
import {
    HOST,
    SERVER,
    TOKEN,
    SESSION,
    HERE,
    GONE,
    makeTaskConfig,
    type TaskConfig,
    tmux,
    options,
    source,
    request,
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

describe('GET /api/terminal after a write', () => {
    it('lists a terminal immediately after POST starts it', async () => {
        const driver = tmux();
        const started = await handleTerminal(
            request({ action: 'start', kind: 'claude', cwd: HERE, cols: 80, rows: 24 }),
            TOKEN,
            { engine: task.engine, configFor: configOf(task.engine), run: driver.run }
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
                { engine: task.engine, configFor: configOf(task.engine), run: driver.run }
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
            options(task.engine)
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('id is not a session id');
    });

    it('refuses a tool that is neither agent', async () => {
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'shell', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            options(task.engine)
        );
        expect(response.status).toBe(400);
        expect(String((await answer(response)).error)).toContain('tool must be one of');
    });

    it('refuses a session the payload no longer holds', async () => {
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION, cols: 80, rows: 24 }),
            TOKEN,
            options(task.engine, { recordFor: source() })
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
            {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run,
                recordFor: source(running)
            }
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
            options(task.engine, { recordFor: source(ended) })
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
            {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run,
                recordFor: source(ended)
            }
        );
        expect(response.status).toBe(200);
        const body = await answer(response);
        const terminal = body.terminal as { id: string; name: string; resumes: unknown };
        expect(terminal.name).toBe('A run');
        expect(terminal.resumes).toEqual({ tool: 'claude', id: SESSION });

        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started).toContain('-c');
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        // The argv follows `--`, one word each, under the default account's `env -u`.
        expect(started.slice(started.indexOf('--') + 1)).toEqual([
            'env',
            '-u',
            'CLAUDE_CONFIG_DIR',
            'claude',
            '--resume',
            SESSION
        ]);
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
            {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run,
                recordFor: source(ended)
            }
        );
        expect(response.status).toBe(200);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started.slice(started.indexOf('--') + 1)).toEqual([
            'env',
            '-u',
            'CODEX_HOME',
            'codex',
            'resume',
            SESSION
        ]);
    });

    it('refuses a request without the write token, before reading any record', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'resume', tool: 'claude', id: SESSION }, 'stale'),
            TOKEN,
            {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run,
                recordFor: source(record(SESSION, { cwd: HERE }))
            }
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
                engine: task.engine,
                configFor: configOf(task.engine),
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
                engine: task.engine,
                configFor: configOf(task.engine),
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
                engine: task.engine,
                configFor: configOf(task.engine),
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
            {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run,
                datasetIdsFor: () => ['--all'],
                hubFor: () => HERE
            }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('key is not a valid dataset key');
        expect(driver.calls).toEqual([]);
    });
});

describe('POST /api/terminal, a start body of the wrong shape', () => {
    const start = (extra: Record<string, unknown>): Request =>
        request({ action: 'start', kind: 'shell', cwd: HERE, cols: 80, rows: 24, ...extra });

    it('refuses a kind that is not one of the three, whatever its type', async () => {
        for (const kind of ['nope', 3, null]) {
            const driver = tmux();
            const response = await handleTerminal(start({ kind }), TOKEN, {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run
            });
            expect(response.status).toBe(400);
            expect((await answer(response)).error).toBe('kind must be one of claude, codex, shell');
            expect(driver.calls).toEqual([]);
        }
    });

    it('refuses a geometry that is text or infinite with the sentence of the start', async () => {
        const infinite = new Request(`http://${HOST}/api/terminal`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'sec-fetch-site': 'same-origin',
                'x-oculus-token': TOKEN
            },
            body: `{"action":"start","kind":"shell","cwd":${JSON.stringify(HERE)},"cols":1e999,"rows":24}`
        });
        for (const body of [start({ cols: '80' }), infinite]) {
            const driver = tmux();
            const response = await handleTerminal(body, TOKEN, {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run
            });
            expect(response.status).toBe(400);
            expect((await answer(response)).error).toBe(
                'cols must be a whole number between 1 and 2000'
            );
            expect(driver.calls).toEqual([]);
        }
    });

    it('starts a terminal with no name when the name is null or is not text', async () => {
        for (const name of [null, 3]) {
            const driver = tmux();
            const response = await handleTerminal(start({ name }), TOKEN, {
                engine: task.engine,
                configFor: configOf(task.engine),
                run: driver.run
            });
            expect(response.status).toBe(200);
            expect(driver.calls.some((call) => call[0] === 'set-option')).toBe(false);
        }
    });
});
