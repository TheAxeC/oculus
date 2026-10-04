// Layer 2, client-state tests. The Processes view's state: the `processes` channel's frame as the
// socket keeps or drops it, the rows the state layer reads out of a kept payload, the arrangement
// of those rows into one group per oculus terminal and the matched rows, the head line, the sort a
// column head sets, and the question that stops a terminal.
//
// Nothing opens a socket or a connection: `WebSocket` is a stub that hands the page what a case
// delivers, and `fetch` is a stub that records the stop request.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessRow } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import type { ProcessesSort } from '../../../../src/lib/state/system/machine/processes.ts';
import {
    arrange,
    headLine,
    parseProcessesState,
    pressed,
    readRows
} from '../../../../src/lib/state/system/machine/processes.ts';
import { terminalLabel } from '../../../../src/lib/state/sessions/terminals.svelte.ts';
import { createClientState, holdTerminals, type ClientState } from '../../../fixtures/client.ts';
import { terminal } from '../../../fixtures/sessions-fixture.ts';
import { stubSocket } from '../../client/socket-stub.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => vi.unstubAllGlobals());

const DEFAULT_SORT: ProcessesSort = { key: 'cpu', direction: 'desc' };
const SHELL = 'a1b2c3-shell';
const CODEX = 'd4e5f6-codex';

/** One payload row; the figures a case does not name are fixed. */
function row(pid: number, fields: Partial<ProcessRow> = {}): ProcessRow {
    return {
        pid,
        ppid: 1,
        user: 'axel',
        started: '2026-10-02T08:00:00.000Z',
        cpu: 0,
        memory: 1024,
        command: `cmd ${pid}`,
        folder: '/work',
        ...fields
    };
}

function payload(rows: unknown, fields: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        status: 'ok',
        updated: '2026-10-02T08:00:10.000Z',
        rows,
        agents: 0,
        projects: 0,
        ...fields
    };
}

describe('the processes channel', () => {
    let client: ClientState;
    beforeEach(() => {
        client = createClientState();
    });

    it('keeps a frame whose fields have their types and answers it from the entity', () => {
        const { deliver, open } = stubSocket();
        client.socket.connect(['processes']);
        open();
        deliver('processes', 1, payload([row(1)], { agents: 2, projects: 1 }));
        expect(client.entities.processes()).toMatchObject({
            status: 'ok',
            agents: 2,
            projects: 1,
            rows: [{ pid: 1 }]
        });
        client.socket.disconnect();
    });

    it.each([
        ['rows that is not a list', payload('x')],
        ['a status that is neither ok nor failed', payload([], { status: 'busy' })],
        ['an agents count that is not a number', payload([], { agents: 'many' })],
        ['no updated time', { status: 'ok', rows: [], agents: 0, projects: 0 }],
        ['an error that is not text', payload([], { status: 'failed', error: 5 })]
    ])('drops a frame with %s, as every channel drops a bad frame', (_name, body) => {
        const { deliver, open } = stubSocket();
        client.socket.connect(['processes']);
        open();
        deliver('processes', 1, body);
        expect(client.entities.processes()).toBeNull();
        client.socket.disconnect();
    });

    it('answers null before the first frame', () => {
        expect(client.entities.processes()).toBeNull();
        expect(client.processes.read()).toBeNull();
    });
});

describe('readRows', () => {
    it('drops a row without a numeric pid or with a non-string command and keeps the others', () => {
        const kept = readRows([
            row(1),
            { ...row(2), pid: '2' },
            { ...row(3), pid: Number.NaN },
            { ...row(4), pid: undefined },
            { ...row(5), command: 5 },
            { ...row(6), command: undefined },
            row(7),
            null,
            'x',
            []
        ]);
        expect(kept.map((one) => one.pid)).toEqual([1, 7]);
    });

    it('reads the other fields leniently: a missing text is empty, a missing number is 0', () => {
        expect(readRows([{ pid: 9, command: 'x' }])).toEqual([
            { pid: 9, ppid: 0, user: '', started: '', cpu: 0, memory: 0, command: 'x', folder: '' }
        ]);
    });

    it('keeps the terminal id of an oculus row and leaves it off a matched row', () => {
        const [own, matched] = readRows([row(1, { terminal: SHELL }), row(2)]);
        expect(own.terminal).toBe(SHELL);
        expect(matched).not.toHaveProperty('terminal');
    });

    it('answers no rows for anything that is not a list', () => {
        expect(readRows('x')).toEqual([]);
        expect(readRows(undefined)).toEqual([]);
    });
});

describe('arrange', () => {
    const records: Record<string, ReturnType<typeof terminal>> = {
        [SHELL]: terminal(SHELL, {
            name: 'shell one',
            title: 'My shell',
            pid: 100,
            command: 'zsh'
        }),
        [CODEX]: terminal(CODEX, { name: 'codex two', pid: 200, command: 'codex', kind: 'codex' })
    };
    const lookup = (id: string) => records[id] ?? null;

    it('puts each terminal under its name with the pane process as the group row, the others after', () => {
        const arranged = arrange(
            [
                row(102, { terminal: SHELL }),
                row(100, { terminal: SHELL, command: '/bin/zsh' }),
                row(101, { terminal: SHELL }),
                row(200, { terminal: CODEX }),
                row(300),
                row(301)
            ],
            lookup,
            terminalLabel
        );
        expect(arranged.groups.map((group) => [group.terminal, group.name])).toEqual([
            [SHELL, 'My shell'],
            [CODEX, 'codex two']
        ]);
        expect(arranged.groups[0].head.pid).toBe(100);
        expect(arranged.groups[0].rows.map((one) => one.pid)).toEqual([101, 102]);
        expect(arranged.groups[0].stoppable).toBe(true);
        expect(arranged.groups[1].rows).toEqual([]);
        expect(arranged.matched.map((one) => one.pid)).toEqual([300, 301]);
    });

    it('keeps the groups in the order the first row of each stands', () => {
        const arranged = arrange(
            [row(200, { terminal: CODEX }), row(100, { terminal: SHELL })],
            lookup,
            terminalLabel
        );
        expect(arranged.groups.map((group) => group.terminal)).toEqual([CODEX, SHELL]);
    });

    it('draws a group whose pane process is not in the table from the terminal record, with empty figures', () => {
        const arranged = arrange([row(101, { terminal: SHELL })], lookup, terminalLabel);
        const [group] = arranged.groups;
        expect(group.head).toEqual({
            pid: 100,
            ppid: 0,
            user: '',
            started: '',
            cpu: 0,
            memory: 0,
            command: 'zsh',
            folder: '',
            terminal: SHELL
        });
        expect(group.rows.map((one) => one.pid)).toEqual([101]);
        expect(group.stoppable).toBe(true);
    });

    it('names a terminal the store does not know by its id and gives it no Stop', () => {
        const arranged = arrange([row(101, { terminal: 'ffffff-shell' })], lookup, terminalLabel);
        expect(arranged.groups[0]).toMatchObject({ name: 'ffffff-shell', stoppable: false });
        expect(arranged.groups[0].rows.map((one) => one.pid)).toEqual([101]);
    });

    it('gives a foreign session no Stop', () => {
        const foreign = (id: string) => terminal(id, { foreign: true, pid: 1 });
        expect(
            arrange([row(1, { terminal: 'x' })], foreign, terminalLabel).groups[0].stoppable
        ).toBe(false);
    });

    it('names a group by the label function it is handed, and an unknown terminal by its id', () => {
        const arranged = arrange(
            [row(100, { terminal: SHELL }), row(300, { terminal: 'ffffff-shell' })],
            lookup,
            () => 'tab label'
        );
        expect(arranged.groups.map((group) => group.name)).toEqual(['tab label', 'ffffff-shell']);
    });

    it('answers nothing for no rows', () => {
        expect(arrange([], lookup, terminalLabel)).toEqual({ groups: [], matched: [] });
    });
});

describe('headLine', () => {
    it.each([
        [1, 1, t('processes.head_project_one'), t('processes.head_agent_one')],
        [3, 2, t('processes.head_projects', 3), t('processes.head_agents', 2)]
    ])(
        'writes %j projects and %j agents in their singular or plural form',
        (projects, agents, ofProjects, ofAgents) => {
            expect(headLine(projects, agents)).toBe(t('processes.head', ofProjects, ofAgents));
        }
    );
});

describe('the sort a column head sets', () => {
    it('gives each pane a default sort of its own, so no pane changes another', () => {
        const first = parseProcessesState(undefined);
        const second = parseProcessesState(undefined);
        expect(first.sort).not.toBe(second.sort);
        first.sort.direction = 'asc';
        expect(parseProcessesState(undefined).sort.direction).toBe('desc');
    });

    it('sorts a new column up and turns the column in force round', () => {
        expect(pressed(DEFAULT_SORT, 'memory')).toEqual({ key: 'memory', direction: 'asc' });
        expect(pressed({ key: 'memory', direction: 'asc' }, 'memory')).toEqual({
            key: 'memory',
            direction: 'desc'
        });
        expect(pressed(DEFAULT_SORT, 'cpu')).toEqual({ key: 'cpu', direction: 'asc' });
    });

    it.each([
        [{ sort: { key: 'pid', direction: 'asc' } }, { sort: { key: 'pid', direction: 'asc' } }],
        [{ sort: { key: 'nope', direction: 'asc' } }, { sort: DEFAULT_SORT }],
        [{ sort: { key: 'pid', direction: 'sideways' } }, { sort: DEFAULT_SORT }],
        [{ sort: 3 }, { sort: DEFAULT_SORT }],
        [null, { sort: DEFAULT_SORT }]
    ])('reads a saved state of %j as %j', (saved, read) => {
        expect(parseProcessesState(saved)).toEqual(read);
    });
});

describe('the store', () => {
    let client: ClientState;
    beforeEach(() => {
        client = createClientState();
        holdTerminals(client, [
            terminal(SHELL, { name: 'shell one', title: 'My shell', pid: 100, command: 'zsh' })
        ]);
    });

    function receive(body: Record<string, unknown>): void {
        client.entities.receive({ channel: 'processes', version: 1, payload: body });
    }

    it('reads the kept payload with only the rows that read', () => {
        receive(payload([row(1), { ...row(2), pid: 'x' }], { agents: 1, projects: 1 }));
        expect(client.processes.read()).toMatchObject({
            status: 'ok',
            agents: 1,
            projects: 1,
            rows: [{ pid: 1 }]
        });
        expect(client.processes.read()?.rows).toHaveLength(1);
    });

    it('arranges the kept rows over the terminals the page holds', () => {
        receive(payload([row(100, { terminal: SHELL, command: '/bin/zsh' }), row(5)]));
        const arranged = client.processes.arranged();
        expect(arranged.groups[0].name).toBe('My shell');
        expect(arranged.matched.map((one) => one.pid)).toEqual([5]);
    });

    it('writes the head line from the counts of the payload, and nothing before the first one', () => {
        expect(client.processes.head()).toBe('');
        receive(payload([], { agents: 1, projects: 1 }));
        expect(client.processes.head()).toBe(headLine(1, 1));
    });

    describe('the stop question', () => {
        let asked: { url: string; body: unknown }[];
        beforeEach(() => {
            asked = [];
            vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
                asked.push({ url, body: JSON.parse(init.body as string) });
                return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
            });
            client.writes.setToken('t');
            receive(
                payload([
                    row(100, { terminal: SHELL, command: '/bin/zsh -l' }),
                    row(101, { terminal: SHELL })
                ])
            );
        });

        it('names the terminal as the terminals store draws it, its pane command and its pid', () => {
            const [group] = client.processes.arranged().groups;
            const ask = client.processes.stopAsk(group);
            expect(ask.message).toBe(t('processes.stop_question', 'My shell', '/bin/zsh -l', 100));
            expect(ask.detail).toBe('');
        });

        it('stops nothing when the question is only asked', () => {
            const [group] = client.processes.arranged().groups;
            client.processes.stopAsk(group);
            expect(asked).toEqual([]);
        });

        it('sends the one stop of a terminal that left the list while the question was open', () => {
            const [group] = client.processes.arranged().groups;
            const ask = client.processes.stopAsk(group);
            client.entities.receive({
                channel: 'sessions',
                version: 3,
                payload: { records: [], workspaces: [], terminals: [] }
            });
            receive(payload([]));
            expect(client.processes.arranged().groups).toEqual([]);
            ask.act();
            expect(asked).toEqual([{ url: '/api/terminal', body: { action: 'stop', id: SHELL } }]);
        });

        it('ends the terminal and nothing else when the answer is yes', () => {
            const [group] = client.processes.arranged().groups;
            client.processes.stopAsk(group).act();
            expect(asked).toEqual([{ url: '/api/terminal', body: { action: 'stop', id: SHELL } }]);
        });
    });
});
