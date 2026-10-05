// Layer 2, route tests. GET /api/terminal after a write, and POST /api/terminal, resume and
// recovery. The update-task, LaTeX and chat actions are terminal-actions.test.ts beside this.
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
    makeTaskConfig,
    type TaskConfig,
    tmux,
    joinedCommands,
    lineOf,
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

describe('POST /api/terminal, the resume action', () => {
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
        expect(lineOf(started)).toEqual([
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

        // The options ride in the invocation that creates the session, so a session that ends at
        // once is not set up by a later call.
        const set = joinedCommands(started).filter((words) => words[0] === 'set-option');
        expect(set.map((words) => words[3])).toEqual(['@oculus_name', '@oculus_resumes']);
        expect(set[1][4]).toBe(`claude:${SESSION}`);
        expect(driver.calls.filter((args) => args[0] === 'set-option')).toEqual([]);
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
        expect(lineOf(started)).toEqual(["python3 tools/data/redownload.py 'mimic-iv'"]);
    });
});
