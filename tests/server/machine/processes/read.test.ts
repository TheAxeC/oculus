// One read of the Processes view: the process table, oculus's own processes (the trees under the
// pane of every terminal session), the processes the pattern list matches, the agents of the whole
// table, each listed process's folder from one lsof call, and the count of projects in flight. The
// table, the tmux panes and lsof are injected as fixed tables, so nothing reads the machine's
// process table, runs lsof on a real pid or signals a process.

import { mkdirSync, realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { listPanes, type Pane } from '../../../../src/lib/server/machine/pty/sessions.ts';
import { ReadFailure } from '../../../../src/lib/server/machine/processes/failure.ts';
import { readProcesses, type ReadDeps } from '../../../../src/lib/server/machine/processes/read.ts';
import { entryOf, type Entry } from '../../../../src/lib/server/machine/processes/table.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** One table entry; the figures a case does not name are fixed. */
function proc(pid: number, ppid: number, command: string, cpu = 0): Entry {
    return {
        pid,
        ppid,
        user: 'axel',
        started: '2026-09-30T08:15:42.000Z',
        cpu,
        memory: 4096,
        command
    };
}

/** A terminal session's pane, as listPanes reads it. */
function pane(terminal: string, pid: number): Pane {
    return { session: `oculus-${terminal}`, terminal, usage: false, pid };
}

type Fixture = {
    table: Entry[];
    panes?: Pane[];
    folders?: Record<number, string>;
    projects?: string[];
};

/** The dependencies of a read over a fixed table, and the pid lists lsof was asked about. */
function deps(fixture: Fixture): ReadDeps & { asked: number[][] } {
    const asked: number[][] = [];
    return {
        asked,
        table: () => Promise.resolve(fixture.table),
        panes: () => Promise.resolve(fixture.panes ?? []),
        folders: (pids) => {
            asked.push([...pids]);
            const found = new Map<number, string>();
            for (const pid of pids) {
                const folder = fixture.folders?.[pid];
                if (folder !== undefined) found.set(pid, folder);
            }
            return Promise.resolve(found);
        },
        projects: () => fixture.projects ?? []
    };
}

const SHELL = 'a1b2c3-shell';

describe('oculus own processes', () => {
    it('lists the pane process of a terminal and every descendant of it, each with the terminal id', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(100, 1, '/bin/zsh'),
                    proc(101, 100, 'python3 train.py'),
                    proc(102, 101, 'python3 worker.py'),
                    proc(900, 1, 'unrelated')
                ],
                panes: [pane(SHELL, 100)]
            }),
            []
        );
        expect(read.rows.map((row) => [row.pid, row.terminal])).toEqual([
            [100, SHELL],
            [101, SHELL],
            [102, SHELL]
        ]);
        expect(read.rows[0].ppid).toBe(1);
    });

    it('lists the trees of every pane of one session under the same terminal id', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(100, 1, '/bin/zsh'),
                    proc(101, 100, 'python3 a.py'),
                    proc(110, 1, '/bin/zsh'),
                    proc(111, 110, 'python3 b.py')
                ],
                panes: [pane(SHELL, 100), pane(SHELL, 110)]
            }),
            []
        );
        expect(read.rows.map((row) => [row.pid, row.terminal])).toEqual([
            [100, SHELL],
            [101, SHELL],
            [110, SHELL],
            [111, SHELL]
        ]);
    });

    it('keeps each terminal together, in the order tmux listed the panes, by pid within one', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(300, 1, 'zsh'),
                    proc(310, 300, 'a'),
                    proc(200, 1, 'zsh'),
                    proc(201, 200, 'c'),
                    proc(205, 200, 'b')
                ],
                panes: [pane('d4e5f6-codex', 300), pane(SHELL, 200)]
            }),
            []
        );
        expect(read.rows.map((row) => [row.terminal, row.pid])).toEqual([
            ['d4e5f6-codex', 300],
            ['d4e5f6-codex', 310],
            [SHELL, 200],
            [SHELL, 201],
            [SHELL, 205]
        ]);
    });

    it('lists a process that is oculus own and also matches once, as oculus own', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(100, 1, '/bin/zsh'), proc(101, 100, 'python3 train.py')],
                panes: [pane(SHELL, 100)]
            }),
            ['python3']
        );
        expect(read.rows.filter((row) => row.pid === 101)).toEqual([
            expect.objectContaining({ pid: 101, terminal: SHELL })
        ]);
        expect(read.rows).toHaveLength(2);
    });

    it('lists the processes of a pane whose own process is not in the table', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(101, 100, 'python3 train.py')],
                panes: [pane(SHELL, 100)]
            }),
            []
        );
        expect(read.rows.map((row) => [row.pid, row.terminal])).toEqual([[101, SHELL]]);
    });

    it('ends the walk at a process listed as its own parent and lists no process that only has a parent outside the table', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(100, 1, '/bin/zsh'),
                    proc(600, 600, 'selfish'),
                    proc(700, 0, 'orphan'),
                    proc(701, 1, 'orphan')
                ],
                panes: [pane(SHELL, 100)]
            }),
            []
        );
        expect(read.rows.map((row) => row.pid)).toEqual([100]);
    });

    it('ends the walk at a pane process that is its own parent', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(600, 600, 'selfish'), proc(601, 600, 'child'), proc(602, 601, 'g')],
                panes: [pane(SHELL, 600)]
            }),
            []
        );
        expect(read.rows.map((row) => row.pid)).toEqual([600, 601, 602]);
    });

    it('gives a process under two panes to the first pane that reaches it', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(10, 11, 'a'), proc(11, 10, 'b')],
                panes: [pane('aaaaaa-shell', 10), pane('bbbbbb-shell', 11)]
            }),
            []
        );
        expect(read.rows.map((row) => [row.pid, row.terminal])).toEqual([
            [10, 'aaaaaa-shell'],
            [11, 'aaaaaa-shell']
        ]);
    });
});

describe('the matched processes', () => {
    it('lists a process outside every pane whose program the patterns name, with no terminal', async () => {
        const read = await readProcesses(deps({ table: [proc(200, 1, 'claude --resume x')] }), [
            'claude'
        ]);
        expect(read.rows).toEqual([
            {
                pid: 200,
                ppid: 1,
                user: 'axel',
                started: '2026-09-30T08:15:42.000Z',
                cpu: 0,
                memory: 4096,
                command: 'claude --resume x',
                folder: ''
            }
        ]);
        expect(read.rows[0]).not.toHaveProperty('terminal');
        expect(read.agents).toBe(1);
    });

    it('lists no row for a program the patterns do not name, and counts the agent', async () => {
        const read = await readProcesses(deps({ table: [proc(200, 1, 'claude --resume x')] }), [
            'node'
        ]);
        expect(read.rows).toEqual([]);
        expect(read.agents).toBe(1);
    });

    it('lists the matched rows by cpu, highest first, then by pid', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(5, 1, 'python3 a', 1),
                    proc(4, 1, 'python3 b', 9),
                    proc(3, 1, 'python3 c', 1),
                    proc(2, 1, 'python3 d', 0.5)
                ]
            }),
            ['python3']
        );
        expect(read.rows.map((row) => row.pid)).toEqual([4, 3, 5, 2]);
    });

    it('lists the own rows before the matched rows', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(200, 1, 'python3 x.py', 50), proc(100, 1, 'zsh')],
                panes: [pane(SHELL, 100)]
            }),
            ['python3']
        );
        expect(read.rows.map((row) => row.pid)).toEqual([100, 200]);
    });
});

describe('the agents', () => {
    it('counts an interpreter run agent and the program it starts once', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(300, 1, 'node /usr/local/bin/codex'), proc(301, 300, 'codex')]
            }),
            []
        );
        expect(read.agents).toBe(1);
    });

    it('counts the command lines of the lines `ps` printed, arguments and all, as agents', async () => {
        const lines = [
            '  300     1 axel 0.0 1024 Wed Sep 30 08:15:42 2026 node /usr/local/bin/codex --model gpt:5',
            '  301     1 axel 0.0 1024 Wed Sep 30 08:15:42 2026 codex exec "fix: the bug"',
            '  302     1 axel 0.0 1024 Wed Sep 30 08:15:42 2026 claude --resume x --add-dir http://a',
            '  303     1 axel 0.0 1024 Wed Sep 30 08:15:42 2026 python3 -m http.server --bind 127.0.0.1:8000'
        ];
        const table = lines.flatMap((text) => entryOf(text) ?? []);
        const read = await readProcesses(deps({ table }), ['python3']);
        expect(read.agents).toBe(3);
        expect(read.rows.map((row) => row.command)).toEqual([
            'python3 -m http.server --bind 127.0.0.1:8000'
        ]);
    });

    it('counts a chain of one program once and a different program under it as another agent', async () => {
        const read = await readProcesses(
            deps({
                table: [
                    proc(300, 1, 'claude'),
                    proc(301, 300, 'claude --child'),
                    proc(302, 301, 'claude --grandchild'),
                    proc(303, 300, 'codex')
                ]
            }),
            []
        );
        expect(read.agents).toBe(2);
    });

    it('counts two trees of the same program as two agents', async () => {
        const read = await readProcesses(
            deps({ table: [proc(300, 1, 'claude'), proc(400, 1, 'claude')] }),
            []
        );
        expect(read.agents).toBe(2);
    });

    it('counts an agent under an oculus pane, which is also a row with its terminal', async () => {
        const read = await readProcesses(
            deps({
                table: [proc(100, 1, 'zsh'), proc(101, 100, 'claude')],
                panes: [pane(SHELL, 100)]
            }),
            []
        );
        expect(read.agents).toBe(1);
        expect(read.rows.find((row) => row.pid === 101)?.terminal).toBe(SHELL);
    });

    it('leaves a hidden usage session out of the agents but lists it when a pattern matches, and lists a foreign oculus session only by pattern', async () => {
        const panes = await listPanes({
            run: () => Promise.resolve('oculus-usage-x 400\noculus-hand 500\n')
        });
        const fixture = {
            table: [proc(400, 1, 'claude'), proc(500, 1, 'python3 x.py'), proc(401, 400, 'claude')],
            panes
        };
        const withClaude = await readProcesses(deps(fixture), ['claude']);
        expect(withClaude.agents).toBe(0);
        expect(withClaude.rows.map((row) => [row.pid, 'terminal' in row])).toEqual([
            [400, false],
            [401, false]
        ]);
        const withPython = await readProcesses(deps(fixture), ['python3']);
        expect(withPython.rows.map((row) => [row.pid, 'terminal' in row])).toEqual([[500, false]]);
    });
});

describe('the folders', () => {
    it('asks lsof once, about the own rows, the matched rows and the agents', async () => {
        const dependencies = deps({
            table: [
                proc(100, 1, 'zsh'),
                proc(101, 100, 'python3 a'),
                proc(200, 1, 'node x.js'),
                proc(300, 1, 'claude'),
                proc(400, 1, 'unlisted')
            ],
            panes: [pane(SHELL, 100)],
            folders: { 100: '/work/one', 200: '/work/two', 300: '/work/three' }
        });
        const read = await readProcesses(dependencies, ['node']);
        expect(dependencies.asked).toEqual([[100, 101, 200, 300]]);
        expect(read.rows.map((row) => [row.pid, row.folder])).toEqual([
            [100, '/work/one'],
            [101, ''],
            [200, '/work/two']
        ]);
    });

    it('asks lsof nothing when nothing is listed and no agent runs', async () => {
        const dependencies = deps({ table: [proc(400, 1, 'unlisted')] });
        await readProcesses(dependencies, ['node']);
        expect(dependencies.asked).toEqual([]);
    });

    it('lists the rows with empty folders when lsof answers none', async () => {
        const read = await readProcesses(
            {
                ...deps({ table: [proc(200, 1, 'node x.js')] }),
                folders: () => Promise.resolve(new Map())
            },
            ['node']
        );
        expect(read.rows.map((row) => row.folder)).toEqual(['']);
    });
});

describe('the projects in flight', () => {
    /** A hub with four project folders under a real directory, reached through a link. */
    function hub() {
        const root = scratchDir('oculus-processes-');
        const real = realpathSync(root);
        const folders = ['alpha', 'alpha/code', 'alpha/sub', 'alpha/sub/deep', 'beta', 'al'].map(
            (name) => join(real, 'real', 'projects', 'active', name)
        );
        for (const folder of folders) mkdirSync(folder, { recursive: true });
        symlinkSync(join(real, 'real'), join(real, 'link'));
        const at = (name: string): string => join(real, 'real', 'projects', 'active', name);
        const through = (name: string): string => join(real, 'link', 'projects', 'active', name);
        return { at, through };
    }

    it('counts a project once for an agent and an oculus terminal in it, and not for a matched process that is no agent', async () => {
        const { at, through } = hub();
        const read = await readProcesses(
            deps({
                table: [
                    proc(100, 1, 'zsh'),
                    proc(101, 100, 'python3 a'),
                    proc(200, 1, 'claude'),
                    proc(300, 1, 'node x.js')
                ],
                panes: [pane(SHELL, 100)],
                folders: {
                    100: at('alpha'),
                    101: at('alpha/code'),
                    200: at('alpha'),
                    300: at('beta')
                },
                projects: [through('alpha'), through('beta')]
            }),
            ['node']
        );
        expect(read.projects).toBe(1);
    });

    it('counts a row in a project inside another for the deeper project', async () => {
        const { at, through } = hub();
        const projects = [through('alpha'), through('alpha/sub')];
        const one = await readProcesses(
            deps({
                table: [proc(200, 1, 'claude')],
                folders: { 200: at('alpha/sub') },
                projects
            }),
            []
        );
        expect(one.projects).toBe(1);
        const deeper = await readProcesses(
            deps({
                table: [proc(200, 1, 'claude'), proc(201, 1, 'codex')],
                folders: { 200: at('alpha/sub/deep'), 201: at('alpha') },
                projects
            }),
            []
        );
        expect(deeper.projects).toBe(2);
    });

    it('matches a folder to a project by whole path segments', async () => {
        const { at, through } = hub();
        const read = await readProcesses(
            deps({
                table: [proc(200, 1, 'claude')],
                folders: { 200: at('alpha') },
                projects: [through('al')]
            }),
            []
        );
        expect(read.projects).toBe(0);
    });

    it('counts none for a folder lsof did not answer, a folder that is gone and a project that is gone', async () => {
        const { at, through } = hub();
        const read = await readProcesses(
            deps({
                table: [proc(200, 1, 'claude'), proc(201, 1, 'codex')],
                folders: { 201: join(at('alpha'), 'removed') },
                projects: [through('alpha'), join(at('alpha'), 'never-made')]
            }),
            []
        );
        expect(read.projects).toBe(0);
    });
});

describe('a read that fails', () => {
    it('fails on an empty table with the empty reason', async () => {
        const failure = await readProcesses(deps({ table: [] }), ['node']).catch(
            (error: unknown) => error
        );
        expect(failure).toBeInstanceOf(ReadFailure);
        expect((failure as ReadFailure).reason).toBe('empty');
    });

    it('fails with the failure the table read raised, unchanged', async () => {
        const raised = new ReadFailure('timeout', 10);
        const failing = { ...deps({ table: [] }), table: () => Promise.reject(raised) };
        await expect(readProcesses(failing, ['node'])).rejects.toBe(raised);
    });

    it('passes the signal to the table call and to the folder call', async () => {
        const controller = new AbortController();
        const seen: { table?: AbortSignal; folders?: AbortSignal }[] = [{}];
        const dependencies: ReadDeps = {
            ...deps({ table: [proc(1, 1, 'node x')] }),
            table: (signal) => {
                seen[0].table = signal;
                return Promise.resolve([proc(1, 1, 'node x')]);
            },
            folders: (_pids, signal) => {
                seen[0].folders = signal;
                return Promise.resolve(new Map());
            }
        };
        await readProcesses(dependencies, ['node'], controller.signal);
        expect(seen).toEqual([{ table: controller.signal, folders: controller.signal }]);
    });

    it('starts no timer of its own', async () => {
        vi.useFakeTimers();
        try {
            await readProcesses(deps({ table: [proc(1, 1, 'node x')] }), ['node']);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});
