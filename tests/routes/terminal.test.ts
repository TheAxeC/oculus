// What POST /api/terminal answers for the resume action: DESIGN.md's one explicit migration of an
// observed session into a terminal oculus holds.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag holding
// a `run` that records the argv and answers the list itself, and a `recordFor` the test owns instead
// of the bridge to the last published payload, so no session store, no registry and no hub is read.
// The only real path any case touches is the temporary directory, and only to have statSync say it
// is there.

import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleTerminal, type TerminalOptions } from '../../src/lib/server/pty/routes.ts';
import { record } from '../sessions-fixture.ts';
import type { SessionRecord } from '../../src/lib/data/model.ts';

const HOST = '127.0.0.1:8791';
const TOKEN = 'the-write-token-of-this-test';

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

/**
 * A tmux that runs nothing: it keeps every argv, remembers what set-option was told, and answers
 * list-sessions with the one line the session it was asked to create would have produced.
 */
function tmux(): { run: NonNullable<TerminalOptions['run']>; calls: string[][] } {
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
                return Promise.resolve(`${fields.join('\t')}\n`);
            }
            return Promise.resolve('');
        }
    };
}

function options(over: Partial<TerminalOptions> = {}): TerminalOptions {
    return { run: tmux().run, recordFor: () => null, ...over };
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

async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

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
            { run: driver.run, recordFor: source(running) }
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
            { run: driver.run, recordFor: source(ended) }
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
            { run: driver.run, recordFor: source(ended) }
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
            { run: driver.run, recordFor: source(record(SESSION, { cwd: HERE })) }
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
            { run: driver.run, datasetIdsFor: () => ['mimic-iv'], hubFor: () => HERE }
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
            { run: driver.run, datasetIdsFor: () => ['mimic-iv'], hubFor: () => HERE }
        );
        expect(response.status).toBe(400);
        expect(driver.calls).toEqual([]);
    });

    it('refuses a dash-prefixed key even when the snapshot holds it', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ action: 'recover', key: '--all', cols: 80, rows: 24 }),
            TOKEN,
            { run: driver.run, datasetIdsFor: () => ['--all'], hubFor: () => HERE }
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('key is not a valid dataset key');
        expect(driver.calls).toEqual([]);
    });
});
