// The Processes view rendered to HTML over one synthetic `processes` payload and the terminals the
// `sessions` payload lists: the head line with its singular forms, one group per oculus terminal
// before the matched rows, Stop on a terminal's group row alone, the three states of a read (none
// yet, failed, empty), the sort a pane holds, a group drawn from the terminal record, and a command
// cut in its cell and whole in its title.
//
// What this does not cover: a press on a column head or on Stop and the dialog it opens, which need
// a DOM and are seen at the look; the store's question and its stop request are
// tests/state/system/machine/processes.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Processes, {
    registration
} from '../../../../src/lib/views/system/machine/processes/Processes.svelte';
import type { ProcessRow } from '../../../../src/lib/data/model/index.ts';
import type { ViewRegistration } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { clock } from '../../../../src/lib/state/shared/words/format.ts';
import { setCatalog, setGlyphs, t } from '../../../../src/lib/state/shared/words/text.ts';
import { glyphCatalog } from '../../../../src/lib/data/sources/config.ts';
import {
    clientContext,
    createClientState,
    holdTerminals,
    type ClientState
} from '../../../fixtures/client.ts';
import { terminal } from '../../../fixtures/sessions-fixture.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const SHELL = 'a1b2c3-shell';
const CODEX = 'd4e5f6-codex';
const instance = { id: 'processes-one', view: 'processes', title: 'Processes', state: {} };
const UPDATED = '2026-10-02T08:00:10.000Z';

let client: ClientState;
beforeEach(() => {
    client = createClientState();
    holdTerminals(client, [
        terminal(SHELL, { name: 'shell one', title: 'My shell', pid: 100, command: 'zsh' }),
        terminal(CODEX, { name: 'codex two', pid: 200, command: 'codex', kind: 'codex' })
    ]);
});

function row(pid: number, fields: Partial<ProcessRow> = {}): ProcessRow {
    return {
        pid,
        ppid: 1,
        user: 'axel',
        started: '2026-10-02T08:00:00.000Z',
        cpu: 0,
        memory: 3 * 1024 * 1024,
        command: `cmd ${pid}`,
        folder: '/work/one',
        ...fields
    };
}

/** The view drawn from whatever the client holds. */
function draw(): string {
    return render(Processes, { context: clientContext(client), props: { instance } }).body;
}

function receive(rows: ProcessRow[], fields: Record<string, unknown> = {}, version = 1): string {
    client.entities.receive({
        channel: 'processes',
        version,
        payload: { status: 'ok', updated: UPDATED, rows, agents: 0, projects: 0, ...fields }
    });
    return draw();
}

/** The pids of the rows in the order the markup draws them. */
function pids(body: string): number[] {
    return [...body.matchAll(/data-pid="(\d+)"/g)].map((found) => Number(found[1]));
}

/** The markup of one terminal's group. */
function group(body: string, terminalId: string): string {
    const start = body.indexOf(`data-terminal="${terminalId}"`);
    if (start < 0) return '';
    const end = body.indexOf('</tbody>', start);
    return body.slice(start, end);
}

const OWN = [
    row(100, { terminal: SHELL, command: '/bin/zsh -l', cpu: 0.5 }),
    row(101, { terminal: SHELL, cpu: 5 }),
    row(102, { terminal: SHELL, cpu: 9 }),
    row(200, { terminal: CODEX, command: 'codex' })
];
const MATCHED = [row(300, { cpu: 1 }), row(301, { cpu: 7 }), row(302, { cpu: 3 })];

describe('the registration', () => {
    it('audits that the view registers as the Processes view of the System page, after Gallery', () => {
        expect(registration).toEqual({
            id: 'processes',
            label: 'views.processes',
            glyph: 'views.processes_glyph',
            group: 'views',
            order: 9
        });
        expect(t((registration as ViewRegistration).label)).toBe('Processes');
    });
});

describe('the head line', () => {
    it('counts the projects in flight and the agents running', () => {
        expect(receive(OWN, { projects: 2, agents: 3 })).toContain(
            '2 projects in flight, 3 agents running'
        );
    });

    it('uses the singular forms of one project and one agent', () => {
        expect(receive(OWN, { projects: 1, agents: 1 }, 2)).toContain(
            '1 project in flight, 1 agent running'
        );
    });
});

describe('the table', () => {
    it('draws the eight columns Activity Monitor has, by name', () => {
        const body = receive([...OWN, ...MATCHED]);
        for (const head of [
            'PID',
            'Parent',
            'User',
            'Started',
            'CPU',
            'Memory',
            'Command',
            'Folder'
        ]) {
            expect(body).toMatch(new RegExp(`<th[^>]*>[\\s\\S]*?${head}[\\s\\S]*?</th>`));
        }
    });

    it('draws oculus rows under their terminal before the matched rows, the matched rows by cpu, highest first', () => {
        const body = receive([...MATCHED, ...OWN]);
        expect(pids(body)).toEqual([100, 102, 101, 200, 301, 302, 300]);
        expect(body.indexOf('My shell')).toBeLessThan(body.indexOf('codex two'));
        expect(body.indexOf('codex two')).toBeLessThan(body.indexOf('data-pid="301"'));
    });

    it('names each group by the terminal as the terminals store draws it, its title else its name', () => {
        const body = receive(OWN);
        expect(group(body, SHELL)).toContain('My shell');
        expect(group(body, CODEX)).toContain('codex two');
    });

    it('puts Stop on the group row of each terminal and on no other row', () => {
        const body = receive([...OWN, ...MATCHED]);
        expect([...body.matchAll(/>Stop</g)]).toHaveLength(2);
        expect(group(body, SHELL).match(/>Stop</g)).toHaveLength(1);
        expect(group(body, CODEX).match(/>Stop</g)).toHaveLength(1);
        const stopAt = group(body, SHELL).indexOf('>Stop<');
        expect(stopAt).toBeGreaterThan(group(body, SHELL).indexOf('data-pid="100"'));
        expect(stopAt).toBeLessThan(group(body, SHELL).indexOf('data-pid="102"'));
    });

    it('draws a group whose pane process is not in the table from the terminal record, with Stop', () => {
        const body = receive([row(101, { terminal: SHELL })]);
        const held = group(body, SHELL);
        expect(held).toContain('data-pid="100"');
        expect(held).toContain('zsh');
        expect(held).toContain('>Stop<');
        expect(pids(body)).toEqual([100, 101]);
    });

    it('draws no Stop for a terminal the page does not hold', () => {
        const body = receive([row(900, { terminal: 'ffffff-shell' })]);
        expect(group(body, 'ffffff-shell')).toContain('ffffff-shell');
        // A terminal this page does not hold has nothing for the button to end.
        expect(body).not.toContain('>Stop<');
    });

    it('cuts a long command in its cell and carries it whole in its title', () => {
        const long = `python3 ${'x'.repeat(400)}`;
        const body = receive([row(300, { command: long })]);
        expect(body).toContain(`title="${long}"`);
        expect(body).toMatch(/class="[^"]*command[^"]*"/);
    });

    it('writes the memory in units and the cpu as a percentage', () => {
        const body = receive([row(300, { cpu: 12.34, memory: 3 * 1024 * 1024 })]);
        expect(body).toContain('12.3%');
        expect(body).toContain('3.0 MB');
    });
});

describe('the sort a pane holds', () => {
    it('sorts within each terminal and within the matched rows, the group row first', () => {
        client.ui.setInstanceState(instance.id, { sort: { key: 'cpu', direction: 'asc' } });
        const body = receive([...OWN, ...MATCHED]);
        expect(pids(body)).toEqual([100, 101, 102, 200, 300, 302, 301]);
    });

    it('sorts by another column when the state names it', () => {
        client.ui.setInstanceState(instance.id, { sort: { key: 'pid', direction: 'desc' } });
        const body = receive([...OWN, ...MATCHED]);
        expect(pids(body)).toEqual([100, 102, 101, 200, 302, 301, 300]);
    });

    it('marks the column in force for assistive technology', () => {
        client.ui.setInstanceState(instance.id, { sort: { key: 'pid', direction: 'asc' } });
        expect(receive(MATCHED)).toMatch(/aria-sort="ascending"/);
    });
});

describe('what the view says while there is nothing to draw', () => {
    it('says it is reading before the first payload, with no table', () => {
        const body = draw();
        expect(body).toContain(t('processes.reading'));
        // Before the first payload there are no rows to put in a grid.
        expect(body).not.toContain('<table');
    });

    it('says no process matches for an empty payload', () => {
        const body = receive([], { projects: 0, agents: 0 });
        expect(body).toContain('No process matches the patterns.');
        // An empty payload draws the sentence instead of an empty grid.
        expect(body).not.toContain('<table');
    });

    it('draws the failure sentence over the rows it kept', () => {
        const body = receive(MATCHED, { status: 'failed', error: 'ps died' });
        expect(body).toContain('ps died');
        expect(pids(body)).toEqual([301, 302, 300]);
    });

    it('draws the failure sentence with nothing under it for a first read that failed', () => {
        const body = receive([], { status: 'failed', error: 'the process table is empty' });
        expect(body).toContain('the process table is empty');
        // A failed first read is a failure, not an empty machine.
        expect(body).not.toContain('No process matches the patterns.');
    });

    it('says when the last read was made', () => {
        expect(receive(MATCHED)).toContain(t('processes.read_at', clock(UPDATED)));
    });
});
