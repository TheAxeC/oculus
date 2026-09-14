// The Live HPC view rendered to HTML: its four heads and every drawable acceptance item use one synthetic socket payload.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Hpc from '../../src/lib/views/Hpc.svelte';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import type { HpcPayload } from '../../src/lib/data/model.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
});
setCatalog(textCatalog(loadConfig(engineDir()).config));
const instance = { id: 'hpc-one', view: 'hpc', title: 'Live HPC', state: {} };
const payload: HpcPayload = {
    status: 'ok',
    jobs: [
        {
            id: '42',
            name: 'train',
            partition: 'gpu',
            state: 'RUNNING',
            time: '01:00',
            limit: '02:00',
            nodes: '1',
            cpus: '8',
            gpus: '2',
            mem: '64G',
            priority: '9',
            start: '2026-09-11T12:30:00',
            reason: 'node1'
        }
    ],
    running: 1,
    pending: 0,
    total: 1,
    recent: [
        {
            id: '41',
            name: 'done',
            state: 'COMPLETED',
            exit: '0:0',
            elapsed: '10:00',
            end: '2026-09-11T10:00:00',
            memPct: 50,
            memUsed: '1G',
            memReq: '2G',
            cpuPct: 90
        }
    ],
    sinfo: [
        { partition: 'gpu', avail: 'up', nodes: 2, state: 'idle', gres: 'gpu:a100:4' },
        { partition: 'gpu', avail: 'up', nodes: 1, state: 'mix', gres: 'gpu:a100:4' },
        { partition: 'gpu', avail: 'up', nodes: 3, state: 'alloc', gres: 'gpu:a100:4' }
    ],
    quota: [{ name: 'home', used: '10G', limit: '100G', pct: 10 }],
    updated: '2026-09-11T12:00:00.000Z',
    pollMin: 20,
    host: 'fixture'
};
function draw(data: HpcPayload, version: number): string {
    receive({ channel: 'hpc', version, payload: data });
    return render(Hpc, { context: clientContext(client), props: { instance } }).body;
}
describe('Live HPC view', () => {
    it('draws heading, meta, partition segments, disk, every queue column, recent jobs, log controls, and footer', () => {
        const body = draw(payload, 1);
        for (const text of [
            'Live HPC',
            '1 running',
            'Cluster capacity (sinfo) - 3 rows',
            'disk',
            'Job',
            'Name',
            'Partition',
            'State',
            'Time',
            'Limit',
            'Used',
            'Nodes',
            'CPU',
            'GPU',
            'Mem',
            'Prio',
            'Est. start',
            'Node / Reason',
            'Cancel job',
            'log',
            'Recent (finished) - 1',
            'Polls squeue'
        ])
            expect(body).toContain(text);
        expect(body).toMatch(/class="idle\s/);
        expect(body).toMatch(/class="mixed\s/);
        expect(body).toMatch(/class="allocated\s/);
    });
    it('draws the live status in its own positive span', () => {
        const body = draw(payload, 2);
        expect(body).toMatch(/class="[^"]*ok[^"]*"[^>]*>[^<]*live/);
        expect(body).toContain('1 running');
    });
    it('assigns the live and failure status spans their semantic colour tokens and bold weight', () => {
        const source = readFileSync('src/lib/views/hpc/Head.svelte', 'utf8');
        expect(source).toMatch(/\.ok\s*{[^}]*--c-green-d-txt[^}]*font-weight:\s*600/s);
        expect(source).toMatch(/\.bad\s*{[^}]*--c-red-d-txt[^}]*font-weight:\s*600/s);
    });
    it('lays the disk meters out in responsive columns', () => {
        const source = readFileSync('src/lib/views/hpc/Quota.svelte', 'utf8');
        expect(source).toMatch(
            /\.meters\s*{[^}]*grid-template-columns:\s*repeat\(auto-fill, minmax\(230px, 1fr\)\)/s
        );
    });
    it('draws the empty queue words in the header and queue body', () => {
        const body = draw({ ...payload, jobs: [], running: 0, total: 0 }, 3);
        expect(body).toContain('queue empty');
        expect(body).toContain('No jobs in the queue for you right now.');
    });
    it.each(['starting', 'unreachable', 'error'] as const)('draws the %s head state', (status) => {
        const body = draw(
            { ...payload, status, hint: 'fixture' },
            4 + ['starting', 'unreachable', 'error'].indexOf(status)
        );
        expect(body).toContain(status === 'starting' ? 'polling cluster...' : status);
        if (status === 'starting') expect(body).not.toMatch(/class="[^"]*bad[^"]*"/);
        else expect(body).toMatch(/class="[^"]*bad[^"]*"/);
    });
});
