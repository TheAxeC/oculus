// The Live HPC view rendered to HTML: its four heads and every drawable acceptance item use one synthetic socket payload.
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Hpc from '../../src/lib/views/Hpc.svelte';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import type { HpcPayload } from '../../src/lib/data/model.ts';
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
    return render(Hpc, { props: { instance } }).body;
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
    it('draws the empty queue line', () =>
        expect(draw({ ...payload, jobs: [], running: 0, total: 0 }, 2)).toContain(
            'No jobs in the queue for you right now.'
        ));
    it.each(['starting', 'unreachable', 'error'] as const)('draws the %s head state', (status) =>
        expect(
            draw(
                { ...payload, status, hint: 'fixture' },
                3 + ['starting', 'unreachable', 'error'].indexOf(status)
            )
        ).toContain(status === 'starting' ? 'polling cluster...' : status)
    );
});
