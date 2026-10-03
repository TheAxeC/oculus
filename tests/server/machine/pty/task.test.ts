// Layer 4, server test. The task terminal: a terminal a project command started, which stays in
// tmux's list after its line ended, carrying the exit status of that line.
//
// The argument vector and the list format are read from a recording runner. The real-tmux cases
// start their sessions on a private server: every call carries `-S <socket>` into a directory made
// for this file, so the machine's own tmux server is never listed, started or killed; the server
// this file starts is killed in afterAll.
//
// The real-tmux cases wait for tmux to say that a pane ended (a hook on the private server, see
// watchEnds) and read the list after each end. What this does NOT cover: the page drawing the
// check or the cross (tests/views/sessions), and tmux versions other than the one on this
// machine's PATH.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    LIST_FORMAT,
    listTerminals,
    paneOutput,
    parseTerminal,
    respawnTerminal,
    startTerminal,
    stopTerminal,
    taskEnvArgs
} from '../../../../src/lib/server/machine/pty/sessions.ts';
import { it, test } from '../../../fixtures/scratch.ts';
import { TMUX, privateTmux, watchEnds } from './tmux-fixture.ts';

vi.setConfig({ testTimeout: 30000 });

if (!TMUX) console.error('tests/server/machine/pty/task.test.ts: skipped, tmux is not on the PATH');

const server = privateTmux('oculus-task-');
const options = {
    get socket(): string {
        return server.socket;
    }
};

const JOB = { repo: '/r', name: 'build' };

describe('the start of a task terminal', () => {
    it('sets remain-on-exit and marks the session in the same invocation as new-session', async () => {
        const calls: string[][] = [];
        const run = (args: string[]): Promise<string> => {
            calls.push([...args]);
            return Promise.resolve(args[0] === 'list-sessions' ? `${rowFor(calls)}\n` : '');
        };
        await startTerminal(
            {
                id: 'a1b2c3-shell',
                kind: 'shell',
                cwd: server.dir,
                cols: 80,
                rows: 24,
                name: 'build'
            },
            { run, command: 'false', task: JOB }
        );
        const holding = calls.filter((args) => args.includes('remain-on-exit'));
        expect(holding).toHaveLength(1);
        expect(holding[0][0]).toBe('new-session');
        const session = 'oculus-a1b2c3-shell';
        expect(holding[0].slice(holding[0].indexOf('--'))).toEqual([
            '--',
            'false',
            ';',
            'set-option',
            '-t',
            session,
            'remain-on-exit',
            'on',
            ';',
            'set-option',
            '-t',
            session,
            '@oculus_task',
            JSON.stringify(JOB)
        ]);
    });

    it('passes the values of a task as -e pairs and refuses another name or a NUL', () => {
        expect(taskEnvArgs({ OCULUS_ARG_1: 'a b', OCULUS_ARG_2: 'x;' })).toEqual([
            '-e',
            'OCULUS_ARG_1=a b',
            '-e',
            'OCULUS_ARG_2=x\\;'
        ]);
        expect(() => taskEnvArgs({ PATH: '/tmp' })).toThrow('OCULUS_ARG_');
        expect(() => taskEnvArgs({ OCULUS_ARG_0: 'x' })).toThrow('OCULUS_ARG_');
        expect(() => taskEnvArgs({ OCULUS_ARG_1: 'a\u0000b' })).toThrow('NUL');
    });

    it('starts a terminal that is not a task with neither', async () => {
        const calls: string[][] = [];
        const run = (args: string[]): Promise<string> => {
            calls.push([...args]);
            return Promise.resolve(args[0] === 'list-sessions' ? `${rowFor(calls)}\n` : '');
        };
        await startTerminal(
            { id: 'a1b2c3-shell', kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
            { run, command: 'cat' }
        );
        expect(calls.some((args) => args.includes('remain-on-exit'))).toBe(false);
        expect(calls.some((args) => args.includes('@oculus_task'))).toBe(false);
    });
});

/** The list row the session the last new-session made would have. */
function rowFor(calls: string[][]): string {
    const start = calls.find((args) => args[0] === 'new-session');
    const name = start?.[3] ?? '';
    const task = start?.includes('@oculus_task') === true ? JSON.stringify(JOB) : '';
    return [
        name,
        '1757500000',
        '0',
        'sh',
        '1',
        server.dir,
        '',
        '',
        '',
        '',
        '',
        task,
        '0',
        '',
        '9'
    ].join('\t');
}

describe('the list of terminals', () => {
    it('ends with the pid of the server, after the fields of a task', () => {
        expect(LIST_FORMAT.split('\t').at(-1)).toBe('#{pid}');
        const fields = LIST_FORMAT.split('\t');
        expect(fields.slice(-4)).toEqual([
            '#{@oculus_task}',
            '#{pane_dead}',
            '#{pane_dead_status}',
            '#{pid}'
        ]);
    });

    it('reads a running task, an ended one and a terminal that is none', () => {
        const row = (task: string, dead: string, status: string) =>
            [
                'oculus-a1b2c3-shell',
                '1757500000',
                '0',
                'sh',
                '1',
                '/r',
                '',
                '',
                '',
                '',
                '',
                task,
                dead,
                status,
                '9'
            ].join('\t');
        expect(parseTerminal(row(JSON.stringify(JOB), '0', ''))).toMatchObject({
            task: true,
            exit: null,
            job: JOB
        });
        expect(parseTerminal(row(JSON.stringify(JOB), '1', '2'))).toMatchObject({
            task: true,
            exit: 2,
            job: JOB
        });
        expect(parseTerminal(row('', '0', ''))).toMatchObject({
            task: false,
            exit: null,
            job: null
        });
        // A mark that carries a source gives it back, and a source that names none is dropped.
        expect(
            parseTerminal(row(JSON.stringify({ ...JOB, source: 'saved' }), '0', ''))?.job
        ).toEqual({
            ...JOB,
            source: 'saved'
        });
        expect(parseTerminal(row(JSON.stringify({ ...JOB, source: 'x' }), '0', ''))?.job).toEqual(
            JOB
        );
        // A mark that carries a chain gives it back; a chain of another shape is dropped.
        const chain = [
            { name: 'build', cwd: '/r' },
            { name: 'test', cwd: '/r/sub' }
        ];
        expect(parseTerminal(row(JSON.stringify({ ...JOB, chain }), '0', ''))?.job).toEqual({
            ...JOB,
            chain
        });
        expect(
            parseTerminal(row(JSON.stringify({ ...JOB, chain: ['build', 'test'] }), '0', ''))?.job
        ).toEqual(JOB);
        // A mark that is not the job's JSON is a task with no job to recover.
        expect(parseTerminal(row('1', '1', '0'))).toMatchObject({ task: true, exit: 0, job: null });
    });
});

let ended: () => Promise<void> = () => Promise.resolve();

test.beforeAll(async () => {
    if (TMUX) ended = await watchEnds(server);
});

/** Wait, an end at a time, until the check holds. */
async function until(done: () => Promise<boolean>): Promise<void> {
    while (!(await done())) await ended();
}

describe('a real tmux server', () => {
    it.skipIf(!TMUX)(
        'keeps the session of a line that failed, with its status, in every one of 20 runs',
        async () => {
            const ids: string[] = [];
            for (let at = 0; at < 20; at += 1) {
                const id = `${at.toString(16).padStart(6, '0')}-shell`;
                ids.push(id);
                await startTerminal(
                    { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24, name: `fail ${at}` },
                    { ...options, command: 'false', task: { repo: server.dir, name: `fail ${at}` } }
                );
            }
            await until(async () => {
                const listed = await listTerminals(options);
                return ids.every((id) => listed.find((one) => one.id === id)?.exit === 1);
            });
            const listed = await listTerminals(options);
            for (const id of ids) {
                const one = listed.find((entry) => entry.id === id);
                expect(one).toMatchObject({ task: true, exit: 1 });
                expect(one?.job).toEqual({ repo: server.dir, name: one?.name });
            }
            for (const id of ids) await stopTerminal(id, options);
            expect(await listTerminals(options)).toEqual([]);
        }
    );

    it.skipIf(!TMUX)(
        'lists a running line with no exit and a passing one with exit 0',
        async () => {
            await startTerminal(
                { id: 'aaaaaa-shell', kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                { ...options, command: 'sleep 30', task: JOB }
            );
            await startTerminal(
                { id: 'bbbbbb-shell', kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                { ...options, command: 'true', task: JOB }
            );
            await until(async () => {
                const listed = await listTerminals(options);
                return listed.find((one) => one.id === 'bbbbbb-shell')?.exit === 0;
            });
            const listed = await listTerminals(options);
            expect(listed.find((one) => one.id === 'aaaaaa-shell')).toMatchObject({
                task: true,
                exit: null
            });
            expect(listed.find((one) => one.id === 'bbbbbb-shell')).toMatchObject({
                task: true,
                exit: 0
            });
            await stopTerminal('aaaaaa-shell', options);
            await stopTerminal('bbbbbb-shell', options);
            expect(await listTerminals(options)).toEqual([]);
        }
    );

    it.skipIf(!TMUX)(
        'runs a chain line whose later commands wait for the earlier ones',
        async () => {
            const marker = join(server.dir, 'marker');
            await startTerminal(
                { id: 'cccccc-shell', kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                {
                    ...options,
                    command: `false && touch '${marker}'`,
                    task: JOB
                }
            );
            await until(async () => {
                const listed = await listTerminals(options);
                return listed.find((one) => one.id === 'cccccc-shell')?.exit === 1;
            });
            expect(spawnSync('test', ['-e', marker]).status).not.toBe(0);
            await stopTerminal('cccccc-shell', options);
        }
    );

    it.skipIf(!TMUX)(
        'captures all the text of an ended pane, a wrapped line joined, and its pid changes on a respawn',
        async () => {
            const wide = 'w'.repeat(200);
            const id = 'dddddd-shell';
            await startTerminal(
                { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                {
                    ...options,
                    command: `printf 'src/a.c:3: error: x\\n%s\\n' ${wide}; false`,
                    task: JOB
                }
            );
            const first = async () => (await listTerminals(options)).find((one) => one.id === id);
            await until(async () => (await first())?.exit === 1);
            const output = await paneOutput(id, options);
            expect(output).toContain('src/a.c:3: error: x\n');
            expect(output).toContain(`${wide}\n`);
            const pid = (await first())?.pid;
            await respawnTerminal(id, options);
            await until(async () => {
                const again = await first();
                return again?.exit === 1 && again.pid !== pid;
            });
            await stopTerminal(id, options);
        }
    );

    it.skipIf(!TMUX)(
        'records the source of the command in the mark and lists it back',
        async () => {
            const id = 'eeeeee-shell';
            await startTerminal(
                { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                { ...options, command: 'true', task: { ...JOB, source: 'saved' } }
            );
            const listed = (await listTerminals(options)).find((one) => one.id === id);
            expect(listed?.job).toEqual({ ...JOB, source: 'saved' });
            await stopTerminal(id, options);
        }
    );

    it.skipIf(!TMUX)(
        'records the token and the chain, each command with its folder, and lists them back',
        async () => {
            const id = 'ffffff-shell';
            const chain = [
                { name: 'build', cwd: server.dir },
                { name: "a $(x) 'q'", cwd: `${server.dir}/sub` }
            ];
            const job = { ...JOB, source: 'file' as const, token: '0a1b2c3d4e5f', chain };
            await startTerminal(
                { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                { ...options, command: 'true', task: job }
            );
            const listed = (await listTerminals(options)).find((one) => one.id === id);
            expect(listed?.job).toEqual(job);
            await stopTerminal(id, options);
        }
    );

    it.skipIf(!TMUX)(
        'sets the values of a task in its environment, whole, again on a respawn',
        async () => {
            const id = 'abcabc-shell';
            const values = { OCULUS_ARG_1: 'a  b;', OCULUS_ARG_2: `$(touch ${server.dir}/x)\n'q"` };
            const out = join(server.dir, 'values');
            await startTerminal(
                { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24 },
                {
                    ...options,
                    command: `printf '[%s]\\n' "$OCULUS_ARG_1" "$OCULUS_ARG_2" >> '${out}'; false`,
                    task: JOB,
                    taskEnv: values
                }
            );
            const first = async () => (await listTerminals(options)).find((one) => one.id === id);
            await until(async () => (await first())?.exit === 1);
            const said = `[${values.OCULUS_ARG_1}]\n[${values.OCULUS_ARG_2}]\n`;
            expect(readFileSync(out, 'utf8')).toBe(said);
            const pid = (await first())?.pid;
            await respawnTerminal(id, options);
            await until(async () => {
                const again = await first();
                return again?.exit === 1 && again.pid !== pid;
            });
            expect(readFileSync(out, 'utf8')).toBe(`${said}${said}`);
            expect(spawnSync('test', ['-e', join(server.dir, 'x')]).status).not.toBe(0);
            await stopTerminal(id, options);
        }
    );
});
