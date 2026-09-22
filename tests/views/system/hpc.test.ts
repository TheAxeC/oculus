// The Live HPC view rendered to HTML: its four heads and every drawable acceptance item use one synthetic socket payload.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Hpc from '../../../src/lib/views/system/hpc/Hpc.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/words/text.ts';
import type { HpcPayload } from '../../../src/lib/data/model.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

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
    retryMin: 2,
    host: 'fixture'
};
/** The view drawn from whatever the client already holds, with no new message. */
function again(): string {
    return render(Hpc, { context: clientContext(client), props: { instance } }).body;
}
function draw(data: HpcPayload, version: number): string {
    receive({ channel: 'hpc', version, payload: data });
    return again();
}
/**
 * The same draw with the page's minute clock standing at a chosen moment: the head reads that clock
 * to decide whether the answer on screen is older than the poll that should have replaced it, and
 * the clock takes its first reading when the client's stores are built.
 */
function drawAt(moment: string, data: HpcPayload, version: number): string {
    vi.useFakeTimers();
    try {
        vi.setSystemTime(Date.parse(moment));
        client = createClientState();
        ({ receive } = client.entities);
        return draw(data, version);
    } finally {
        vi.useRealTimers();
    }
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
        const source = readFileSync('src/lib/views/system/hpc/Head.svelte', 'utf8');
        expect(source).toMatch(/\.ok\s*{[^}]*--c-green-d-txt[^}]*font-weight:\s*600/s);
        expect(source).toMatch(/\.bad\s*{[^}]*--c-red-d-txt[^}]*font-weight:\s*600/s);
    });
    it('lays the disk meters out in responsive columns', () => {
        const source = readFileSync('src/lib/views/system/hpc/Quota.svelte', 'utf8');
        expect(source).toMatch(
            /\.meters\s*{[^}]*grid-template-columns:\s*repeat\(auto-fill, minmax\(230px, 1fr\)\)/s
        );
    });
    it('draws the empty queue words in the header and queue body', () => {
        const body = draw({ ...payload, jobs: [], running: 0, total: 0 }, 3);
        expect(body).toContain('queue empty');
        expect(body).toContain('No jobs in the queue for you right now.');
    });
    it('leaves a fresh answer unmarked', () => {
        const body = drawAt('2026-09-11T12:10:00.000Z', payload, 10);
        expect(body).toContain('as of');
        // the answer is fresh, so nothing is late
        expect(body).not.toContain('the next poll is late');
        // and nothing carries the late mark either
        expect(body).not.toMatch(/class="[^"]*\blate\b[^"]*"/);
    });
    it('marks the as of part late once the next poll is overdue', () => {
        const body = drawAt('2026-09-11T12:23:00.000Z', payload, 11);
        expect(body).toContain('the next poll is late');
        expect(body).toMatch(/class="[^"]*\blate\b[^"]*"/);
    });
    it('names when the cluster was last reached and keeps the last good rows under the failure', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'ssh: connect to host fixture port 22: Operation timed out',
                lastOk: '2026-09-11T12:00:00.000Z'
            },
            12
        );
        expect(body).toContain('last reached');
        expect(body).toContain('Cluster unreachable');
        expect(body).toContain('train');
        expect(body).toContain('Recent (finished) - 1');
    });
    it('says nothing about a last reach before the cluster has ever answered', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'fixture',
                jobs: [],
                running: 0,
                pending: 0,
                total: 0,
                recent: [],
                sinfo: []
            },
            13
        );
        // the cluster has never been reached, so there is no time to name
        expect(body).not.toContain('last reached');
        expect(body).toContain('Cluster unreachable');
        // and it carries no finished job to list
        expect(body).not.toContain('Recent (finished)');
    });
    it('goes late on the minute tick, with no new publish', () => {
        vi.useFakeTimers();
        let stop = noop;
        try {
            vi.setSystemTime(Date.parse('2026-09-11T12:00:00.000Z'));
            client = createClientState();
            ({ receive } = client.entities);
            stop = client.clock.startMinuteClock();
            const fresh = draw(payload, 14);
            // The wall clock moves without a tick: the head reads the minute clock, not Date.now(),
            // so nothing is late until the clock ticks.
            vi.setSystemTime(Date.parse('2026-09-11T12:23:00.000Z'));
            const untold = again();
            vi.advanceTimersByTime(60000);
            const aged = again();
            // the head reads the minute clock, which has not ticked yet
            expect(fresh).not.toContain('the next poll is late');
            // and the wall clock moving on its own does not make it tick
            expect(untold).not.toContain('the next poll is late');
            expect(aged).toContain('the next poll is late');
        } finally {
            stop();
            vi.useRealTimers();
        }
    });
    it('says the poller is on the short cadence while the cluster is not answering', () => {
        const body = draw({ ...payload, status: 'unreachable', hint: 'fixture' }, 15);
        expect(body).toContain('retrying every 2m');
    });
    it('draws the row controls unpressable while the cluster is not answering', () => {
        const down = draw({ ...payload, status: 'unreachable', hint: 'fixture' }, 16);
        expect(down).toContain('the cluster is not answering');
        expect(down).toMatch(/<button[^>]*\sdisabled[^>]*>/);
        const live = draw(payload, 17);
        // the cluster is answering, so nothing says otherwise
        expect(live).not.toContain('the cluster is not answering');
        // and nothing holds the controls back
        expect(live).not.toMatch(/<button[^>]*\sdisabled[^>]*>/);
    });
    it('keeps the partition and disk rows on a failed poll whose queue is empty', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'fixture',
                jobs: [],
                running: 0,
                pending: 0,
                total: 0,
                recent: [],
                lastOk: '2026-09-11T12:00:00.000Z'
            },
            15
        );
        expect(body).toContain('partition capacity');
        // the payload carries no finished job, so the section is not drawn
        expect(body).not.toContain('Recent (finished)');
    });
    it('says nothing about retrying when the payload carries no retry cadence', () => {
        const held = { ...payload, status: 'unreachable' as const, hint: 'fixture' };
        delete held.retryMin;
        const body = drawAt('2026-09-11T12:23:00.000Z', held, 16);
        expect(body).toContain('Cluster unreachable');
        // the payload carries no retry cadence, so there is none to name
        expect(body).not.toContain('retrying every');
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
